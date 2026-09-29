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

  async execute() {
    // Si la foto es una URI local y no se ha subido aún a Cloudinary
    if (
      this.payload.fotoLocalUri &&
      !this.payload.fotoLocalUri.startsWith("http://") &&
      !this.payload.fotoLocalUri.startsWith("https://")
    ) {
      const urlRemota = await incidentesService.subirACloudinary(
        this.payload.fotoLocalUri,
      );
      this.payload.fotoLocalUri = urlRemota;
    }

    return await incidentesService.crear(this.payload);
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      payload: this.payload,
      timestamp: this.timestamp,
    };
  }
}
