// src/utils/leafletTemplate.js
export function generarHtmlLeaflet({
  latInicial,
  lngInicial,
  incidentes,
  esAdmin,
}) {
  const jsonIncidentes = JSON.stringify(
    incidentes
      .filter((i) => i.lat && i.lng)
      .map((i) => ({
        id: i.id,
        lat: i.lat,
        lng: i.lng,
        titulo: i.titulo || "Incidente",
        calle: i.calle_nombre || "Vía",
        estado: i.estado || "en_revision",
      })),
  );

  return `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>Mapa Territorial</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          * { -webkit-tap-highlight-color: transparent; }
          html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #f8fafc; }
          .leaflet-popup-content-wrapper { border-radius: 8px; font-family: system-ui, -apple-system, sans-serif; }
          
          .pin-alfiler-wrapper { position: relative; width: 24px; height: 36px; }
          .pin-bolita-roja {
            width: 16px; height: 16px;
            background: radial-gradient(circle at 35% 35%, #EF4444, #991B1B);
            border: 1.5px solid #FFFFFF;
            border-radius: 50%;
            box-shadow: 0 3px 6px rgba(0,0,0,0.35);
            position: absolute; top: 0; left: 4px; z-index: 2;
          }
          .pin-admin-azul {
            width: 20px; height: 20px;
            background: radial-gradient(circle at 35% 35%, #38BDF8, #0284C7);
            border: 2px solid #FFFFFF;
            border-radius: 50%;
            box-shadow: 0 4px 8px rgba(2, 132, 199, 0.45);
            position: absolute; top: 0; left: 2px; z-index: 3;
          }
          .pin-aguja-metalica {
            width: 2.5px; height: 20px;
            background: linear-gradient(to right, #94A3B8, #475569);
            position: absolute; top: 15px; left: 11px; border-radius: 1px; z-index: 1;
          }
          .pin-sombra-base {
            width: 8px; height: 4px;
            background: rgba(0,0,0,0.3);
            border-radius: 50%; position: absolute; bottom: 0; left: 8px;
          }
          .pop-calle { font-size: 10px; font-weight: 800; color: #DC2626; text-transform: uppercase; margin-bottom: 2px; }
          .pop-tit { font-size: 12px; font-weight: 700; color: #0F172A; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var esAdmin = ${esAdmin ? "true" : "false"};
          var incidentes = ${jsonIncidentes};

          function despacharMensaje(payload) {
            var str = JSON.stringify(payload);
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(str);
            }
            if (window.parent && window.parent.postMessage) {
              window.parent.postMessage(str, '*');
            }
          }

          var map = L.map('map', { 
            zoomControl: false,
            tap: true,
            touchZoom: true
          }).setView([${latInicial}, ${lngInicial}], 16);

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
          L.control.zoom({ position: 'topright' }).addTo(map);

          var iconoAlfilerRojo = L.divIcon({
            className: 'alfiler-custom',
            html: '<div class="pin-alfiler-wrapper"><div class="pin-bolita-roja"></div><div class="pin-aguja-metalica"></div><div class="pin-sombra-base"></div></div>',
            iconSize: [24, 36],
            iconAnchor: [12, 35],
            popupAnchor: [0, -32]
          });

          var iconoAdminAzul = L.divIcon({
            className: 'admin-marker-custom',
            html: '<div class="pin-alfiler-wrapper"><div class="pin-admin-azul"></div><div class="pin-aguja-metalica"></div><div class="pin-sombra-base"></div></div>',
            iconSize: [24, 36],
            iconAnchor: [12, 35],
            popupAnchor: [0, -32]
          });

          var marcadoresIncidentes = {};

          incidentes.forEach(function(inc) {
            var m = L.marker([inc.lat, inc.lng], { icon: iconoAlfilerRojo }).addTo(map);
            var popHtml = '<div class="pop-calle">🔴 ' + (inc.calle || '') + '</div><div class="pop-tit">' + (inc.titulo || '') + '</div>';
            m.bindPopup(popHtml);

            m.on('click', function() {
              despacharMensaje({ tipo: 'INCIDENTE_CLICKEADO', id: inc.id });
            });

            marcadoresIncidentes[inc.id] = m;
          });

          var markerAdmin = null;

          if (esAdmin) {
            markerAdmin = L.marker([${latInicial}, ${lngInicial}], { 
              icon: iconoAdminAzul,
              draggable: true 
            }).addTo(map);

            markerAdmin.bindPopup("<b>Ubicación Marcada</b><br>Arrastra o toca el mapa").openPopup();

            function notificarPunto(lat, lng) {
              despacharMensaje({ tipo: 'PUNTO_SELECCIONADO', lat: lat, lng: lng });
            }

            map.on('click', function(e) {
              markerAdmin.setLatLng(e.latlng);
              notificarPunto(e.latlng.lat, e.latlng.lng);
            });

            markerAdmin.on('dragend', function(e) {
              var pos = markerAdmin.getLatLng();
              notificarPunto(pos.lat, pos.lng);
            });
          }

          window.volarAIncidente = function(id, lat, lng) {
            map.flyTo([lat, lng], 17, { duration: 1.2 });
            if (marcadoresIncidentes[id]) {
              setTimeout(function() {
                marcadoresIncidentes[id].openPopup();
              }, 1200);
            }
          };

          window.addEventListener('message', function(event) {
            try {
              var d = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
              if (d.tipo === 'VOLAR_A_INCIDENTE') {
                window.volarAIncidente(d.id, d.lat, d.lng);
              }
            } catch(e) {}
          });
        </script>
      </body>
    </html>
  `;
}
