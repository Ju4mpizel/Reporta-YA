// src/services/CommandQueueService.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { Platform } from "react-native";
import { CrearIncidenteCommand } from "./commands/CrearIncidenteCommand";
import { DictaminarIncidenteCommand } from "./commands/DictaminarIncidenteCommand";

const QUEUE_STORAGE_KEY = "@reporta_ya_command_queue";

class CommandQueueService {
  constructor() {
    this.listeners = [];
    this.procesando = false;
  }

  suscribir(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  notificar(evento, datos) {
    this.listeners.forEach((cb) => cb(evento, datos));
  }

  // Factoría polimórfica para instanciar el comando correspondiente
  reconstruirComando(item) {
    if (item.type === "DICTAMINAR_INCIDENTE") {
      return new DictaminarIncidenteCommand(item.payload);
    }
    return new CrearIncidenteCommand(item.payload);
  }

  async obtenerComandosPendientes() {
    try {
      const serializados = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (!serializados) return [];
      const lista = JSON.parse(serializados);
      return lista.map((item) => this.reconstruirComando(item));
    } catch {
      return [];
    }
  }

  async encolar(comando) {
    try {
      const colaActual = await this.obtenerComandosPendientes();
      colaActual.push(comando);
      await AsyncStorage.setItem(
        QUEUE_STORAGE_KEY,
        JSON.stringify(colaActual.map((c) => c.toJSON())),
      );
      this.notificar("COMANDO_ENCOLADO", comando);
    } catch (err) {
      console.error("Fallo al guardar comando en cola offline:", err);
    }
  }

  async procesarCola() {
    if (this.procesando) return;

    // Comprobación de conectividad compatible con Web y Móvil
    let hayInternet = true;
    if (Platform.OS === "web" && typeof navigator !== "undefined") {
      hayInternet = navigator.onLine === true;
    }

    if (hayInternet) {
      const netState = await NetInfo.fetch();
      hayInternet = Boolean(
        netState.isConnected && netState.isInternetReachable !== false,
      );
    }

    if (!hayInternet) return;

    this.procesando = true;
    const cola = await this.obtenerComandosPendientes();

    if (cola.length === 0) {
      this.procesando = false;
      return;
    }

    const comandosRestantes = [];

    for (const comando of cola) {
      try {
        await comando.execute();

        // Notificación adaptada al tipo de comando procesado
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
        console.error("Error al procesar comando offline:", err.message);
        // Si falló por red se conserva en la cola para el siguiente intento
        comandosRestantes.push(comando);
      }
    }

    await AsyncStorage.setItem(
      QUEUE_STORAGE_KEY,
      JSON.stringify(comandosRestantes.map((c) => c.toJSON())),
    );

    this.procesando = false;
  }
}

export const commandQueueService = new CommandQueueService();
