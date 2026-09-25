<div align="center">

# 📍 Reporta YA!

### Sistema Inteligente de Incidencias Urbanas con Arquitectura Offline-First
**Subalcaldía Cala Cala · Distrito Municipal 12 · Cochabamba, Bolivia**

<p>
  <img src="https://img.shields.io/badge/Expo_SDK-51+-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/React_Native-0.74+-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React Native" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL_%26_RLS-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Leaflet-OpenStreetMap-16A34A?style=for-the-badge&logo=leaflet&logoColor=white" alt="Leaflet" />
  <img src="https://img.shields.io/badge/Licencia-MIT-0284C7?style=for-the-badge" alt="Licencia MIT" />
</p>

</div>

---

## 🌆 Sobre el proyecto

**Reporta YA!** es una plataforma cívica móvil diseñada para que los vecinos del Distrito 12 de Cochabamba reporten problemas en la infraestructura pública (baches, alcantarillado, luminarias y áreas verdes) con trazabilidad operativa hacia la Subalcaldía Cala Cala.

### 🛡️ Características de Ingeniería Destacadas:
- **Arquitectura Offline-First:** Los reportes ciudadanos y los dictámenes de las cuadrillas pueden generarse sin conexión a internet. Se persisten mediante el **Patrón Command** en una cola serializada con Mutex (`CommandQueueService`) y se sincronizan atómicamente al recuperar señal.
- **Catastro Territorial Integrado:** Persistencia local de vías, zonas y dependencias municipales en `AsyncStorage`, permitiendo interactuar con el catálogo de vías aunque no haya red móvil.
- **Visor Territorial:** Georreferenciación interactiva basada en **Leaflet y OpenStreetMap**, vinculando cada incidencia al catastro distrital sin dependencias externas propietarias.
- **Evidencia Multimedia:** Carga optimizada de evidencia fotográfica capturada desde la cámara en vivo o seleccionada desde la galería.
- **Transparencia y Respaldo Ciudadano:** Sistema de votación comunitaria atómica (`toggle_apoyo`) implementado en funciones PostgreSQL para priorizar la atención de cuadrillas.

---

## 🚀 Pila Tecnológica

- **Frontend:** React Native (Expo) con React Navigation v7 y Lucide Icons.
- **Backend & Base de Datos:** Supabase (PostgreSQL 15), Row Level Security (RLS) y Realtime WebSockets.
- **Patrones de Diseño:** Command Pattern (cola idempotente transaccional) y Cache-Aside Pattern para persistencia local.
- **Mapas:** Leaflet.js inyectado con pines georreferenciados y comunicación bidireccional mediante `postMessage`.

---

## 💻 Puesta en Marcha

### 1. Clonar e Instalar
```bash
git clone [https://github.com/Ju4mpizel/Cocha-Reporta.git](https://github.com/Ju4mpizel/Cocha-Reporta.git)
cd Cocha-Reporta
npm install
