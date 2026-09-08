// src/data/mockData.js
export const ZONA_ACTUAL = {
  id: 1,
  nombre: "Cala Cala",
  distrito: 12,
  lat_centro: -17.373412,
  lng_centro: -66.162534,
};

export const INCIDENTES_EJEMPLO = [
  {
    id: "inc-01",
    calle_nombre: "Av. América",
    categoria_nombre: "Bache o Asfalto Deteriorado",
    titulo: "Bache profundo carril de bajada",
    descripcion:
      "Hueco de consideración que daña llantas frente a la farmacia.",
    estado: "en_revision",
    apoyos: 8,
    created_at: "Hace 2 horas",
  },
  {
    id: "inc-02",
    calle_nombre: "Av. América",
    categoria_nombre: "Falla de Alumbrado Público",
    titulo: "Poste sin iluminación nocturna",
    descripcion: "Foco quemado, la cuadra queda completamente a oscuras.",
    estado: "realizando_trabajos",
    apoyos: 14,
    created_at: "Ayer",
  },
  {
    id: "inc-03",
    calle_nombre: "Plaza de Cala Cala",
    categoria_nombre: "Acumulación de Basura",
    titulo: "Contenedor desbordado",
    descripcion: "Residuos acumulados en la esquina del parque.",
    estado: "hecho",
    apoyos: 3,
    created_at: "Hace 3 días",
  },
];
