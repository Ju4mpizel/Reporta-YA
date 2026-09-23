// src/services/CommandQueueService.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { CrearIncidenteCommand } from "./commands/CrearIncidenteCommand";

const QUEUE_STORAGE_KEY = "@reporta_ya_command_queue";

class CommandQueueService {
  constructor() {
    this.listeners = [];
    this.procesando = false;
  }

  // Registra escuchadores para avisar a la interfaz sobre el estado de la cola
  suscribir(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  notificar(evento, datos) {
    this.listeners.forEach((cb) => cb(evento, datos));
  }

  async obtenerComandosPendientes() {
    try {
      const serializados = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (!serializados) return [];
      const lista = JSON.parse(serializados);
      return lista.map((item) => new CrearIncidenteCommand(item.payload));
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

  // Procesa secuencialmente todos los comandos pendientes
  async procesarCola() {
    if (this.procesando) return;

    const netState = await NetInfo.fetch();
    const hayInternet = Boolean(
      netState.isConnected && netState.isInternetReachable !== false,
    );

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
        this.notificar("COMANDO_EJECUTADO", {
          titulo: comando.payload.titulo,
        });
      } catch (err) {
        console.error("Error al procesar comando offline:", err.message);
        // Si falló por red se conserva en la cola
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
