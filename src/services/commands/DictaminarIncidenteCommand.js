// src/services/commands/DictaminarIncidenteCommand.js
import { incidentesService } from "../incidentesService";

export class DictaminarIncidenteCommand {
  constructor(payload) {
    this.id =
      payload.id ||
      `cmd_dictamen_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.type = "DICTAMINAR_INCIDENTE";
    this.payload = payload; // { incidenteId, departamentoId, estado, notaAlcaldia, tituloIncidente }
    this.timestamp = payload.timestamp || Date.now();
  }

  async execute() {
    return await incidentesService.dictaminar(this.payload.incidenteId, {
      departamentoId: this.payload.departamentoId,
      estado: this.payload.estado,
      notaAlcaldia: this.payload.notaAlcaldia,
    });
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
