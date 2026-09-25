// src/services/CommandQueueService.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { Platform } from "react-native";
import { CrearIncidenteCommand } from "./commands/CrearIncidenteCommand";
import { DictaminarIncidenteCommand } from "./commands/DictaminarIncidenteCommand";

const QUEUE_STORAGE_KEY = "@reporta_ya_command_queue";
const DEAD_LETTER_QUEUE_KEY = "@reporta_ya_dead_letter_queue";

class CommandQueueService {
  constructor() {
    this.listeners = [];
    this.procesando = false;
    this.lockOperacion = Promise.resolve(); // Mutex básico para serializar operaciones de E/S
  }

  suscribir(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  notificar(evento, datos) {
    this.listeners.forEach((cb) => {
      try {
        cb(evento, datos);
      } catch (err) {
        console.warn("[CommandQueueService] Error en listener:", err);
      }
    });
  }

  reconstruirComando(item) {
    if (!item || !item.payload) return null;

    // Preservamos el sobre original completo (id, timestamp)
    const payloadConIdentidad = {
      ...item.payload,
      id: item.id,
      timestamp: item.timestamp,
    };

    if (item.type === "DICTAMINAR_INCIDENTE") {
      return new DictaminarIncidenteCommand(payloadConIdentidad);
    }
    return new CrearIncidenteCommand(payloadConIdentidad);
  }

  async obtenerComandosPendientes() {
    try {
      const serializados = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (!serializados) return [];
      const lista = JSON.parse(serializados);
      if (!Array.isArray(lista)) return [];

      return lista.map((item) => this.reconstruirComando(item)).filter(Boolean);
    } catch (err) {
      console.warn(
        "[CommandQueueService] Fallo al leer cola local, conservando estado:",
        err,
      );
      return [];
    }
  }

  async encolar(comando) {
    // Encadenamos en el mutex para evitar race conditions al guardar
    this.lockOperacion = this.lockOperacion.then(async () => {
      try {
        const colaActual = await this.obtenerComandosPendientes();
        colaActual.push(comando);
        await AsyncStorage.setItem(
          QUEUE_STORAGE_KEY,
          JSON.stringify(colaActual.map((c) => c.toJSON())),
        );
        this.notificar("COMANDO_ENCOLADO", comando);
      } catch (err) {
        console.error(
          "[CommandQueueService] Error crítico al encolar comando:",
          err,
        );
      }
    });

    return this.lockOperacion;
  }

  async procesarCola() {
    if (this.procesando) return;

    let hayInternet = true;
    try {
      if (Platform.OS === "web" && typeof navigator !== "undefined") {
        hayInternet = navigator.onLine === true;
      }
      if (hayInternet) {
        const netState = await NetInfo.fetch();
        hayInternet = Boolean(
          netState.isConnected && netState.isInternetReachable !== false,
        );
      }
    } catch {
      hayInternet = false;
    }

    if (!hayInternet) return;

    this.procesando = true;

    try {
      const cola = await this.obtenerComandosPendientes();
      if (cola.length === 0) return;

      const comandosReintentables = [];
      const comandosDescartados = [];

      for (const comando of cola) {
        try {
          await comando.execute();

          this.notificar("COMANDO_EJECUTADO", {
            tipo: comando.type,
            titulo:
              comando.payload.titulo ||
              comando.payload.tituloIncidente ||
              "Incidente",
            estado: comando.payload.estado,
            nota_alcaldia: comando.payload.notaAlcaldia,
          });
        } catch (err) {
          const mensajeError = err.message ? err.message.toLowerCase() : "";
          const esFalloRed =
            mensajeError.includes("failed to fetch") ||
            mensajeError.includes("network") ||
            mensajeError.includes("timeout") ||
            (Platform.OS === "web" &&
              typeof navigator !== "undefined" &&
              !navigator.onLine);

          if (esFalloRed) {
            // Se conserva en cola para reintentar cuando la red esté estable
            comandosReintentables.push(comando);
          } else {
            // Error 4xx de PostgREST o regla permanente: no bloquear la cola
            console.error(
              `[CommandQueueService] Comando ${comando.id} rechazado por servidor:`,
              err.message,
            );
            comandosDescartados.push({
              comando: comando.toJSON(),
              error: err.message,
            });
            this.notificar("COMANDO_FALLIDO", { comando, error: err.message });
          }
        }
      }

      await AsyncStorage.setItem(
        QUEUE_STORAGE_KEY,
        JSON.stringify(comandosReintentables.map((c) => c.toJSON())),
      );

      // Si hubo descartados, moverlos a dead letter queue para auditoría
      if (comandosDescartados.length > 0) {
        try {
          const deadPrev = await AsyncStorage.getItem(DEAD_LETTER_QUEUE_KEY);
          const deadLista = deadPrev ? JSON.parse(deadPrev) : [];
          await AsyncStorage.setItem(
            DEAD_LETTER_QUEUE_KEY,
            JSON.stringify([...deadLista, ...comandosDescartados]),
          );
        } catch {}
      }
    } catch (errGlobal) {
      console.error(
        "[CommandQueueService] Excepción no controlada en procesarCola:",
        errGlobal,
      );
    } finally {
      // Liberación garantizada del flag de procesamiento
      this.procesando = false;
    }
  }
}

export const commandQueueService = new CommandQueueService();
