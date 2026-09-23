// src/services/commands/CrearIncidenteCommand.js
import { incidentesService } from "../incidentesService";

export class CrearIncidenteCommand {
  constructor(payload) {
    this.id =
      payload.id ||
      `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.type = "CREAR_INCIDENTE";
    this.payload = payload; // { usuarioId, calleId, categoriaId, titulo, descripcion, mapsUrl, fotoLocalUri }
    this.timestamp = payload.timestamp || Date.now();
  }

  // Método estándar de ejecución del patrón Command
  async execute() {
    return await incidentesService.crear(this.payload);
  }

  // Permite serializar el comando para guardarlo en AsyncStorage
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      payload: this.payload,
      timestamp: this.timestamp,
    };
  }
}
