/* ──────────────────────────────────────────────────────
   TRAIL MAP — every trip on one Leaflet map.
   Trips come from post frontmatter (map: points/route/gpx),
   serialized into #trip-data by Liquid.
   ────────────────────────────────────────────────────── */
(function () {
  'use strict';

  const el = document.getElementById('trail-map');
  const dataEl = document.getElementById('trip-data');
  if (!el || !dataEl || typeof L === 'undefined') return;

  const trips = JSON.parse(dataEl.textContent);
  const ACCENT = '#c95b38';
  const INK = '#1c1917';

  const map = L.map(el, { scrollWheelZoom: false });
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(map);

  // scroll-zoom only after the map has been clicked (no scroll traps)
  map.on('focus click', function () { map.scrollWheelZoom.enable(); });
  map.on('blur mouseout', function () { map.scrollWheelZoom.disable(); });

  // home base
  L.circleMarker([48.058, 8.464], {
    radius: 5, color: INK, weight: 2, fillColor: '#fefcf8', fillOpacity: 1,
  }).addTo(map).bindTooltip('Home base — Villingen-Schwenningen', { direction: 'top' });

  function popupHtml(trip, pointName) {
    return '<div class="map-popup">' +
      '<span class="map-popup-label">' + trip.category + ' · ' + trip.date +
      (pointName ? ' · ' + pointName : '') + '</span>' +
      '<span class="map-popup-title">' + trip.title + '</span>' +
      '<a class="map-popup-link" href="' + trip.url + '">Read the post →</a>' +
      '</div>';
  }

  function drawTrack(latlngs, group) {
    L.polyline(latlngs, {
      color: ACCENT, weight: 3, opacity: 0.85,
    }).addTo(group);
  }

  const bounds = L.latLngBounds([]);
  const tripLayers = [];

  trips.forEach(function (trip) {
    const group = L.featureGroup().addTo(map);

    if (trip.route && trip.route.length > 1) {
      L.polyline(trip.route, {
        color: ACCENT, weight: 2.5, opacity: 0.55, dashArray: '5 9',
      }).addTo(group);
    }

    (trip.points || []).forEach(function (pt) {
      L.circleMarker([pt.lat, pt.lng], {
        radius: 7, color: '#fefcf8', weight: 2.5,
        fillColor: ACCENT, fillOpacity: 1,
      }).addTo(group)
        .bindTooltip(pt.name, { direction: 'top' })
        .bindPopup(popupHtml(trip, pt.name), { closeButton: false });
    });

    // optional GPX track (assets/tracks/*.gpx) — parsed natively, no plugin
    if (trip.gpx) {
      fetch(trip.gpx)
        .then(function (r) { return r.ok ? r.text() : Promise.reject(); })
        .then(function (xml) {
          const doc = new DOMParser().parseFromString(xml, 'application/xml');
          const pts = Array.prototype.map.call(
            doc.querySelectorAll('trkpt'),
            function (p) { return [parseFloat(p.getAttribute('lat')), parseFloat(p.getAttribute('lon'))]; }
          ).filter(function (p) { return !isNaN(p[0]) && !isNaN(p[1]); });
          if (pts.length) {
            drawTrack(pts, group);
            bounds.extend(L.latLngBounds(pts));
          }
        })
        .catch(function () { /* track missing — points still shown */ });
    }

    bounds.extend(group.getBounds());
    tripLayers.push(group);
  });

  if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40] });
  else map.setView([54, 10], 4);

  // photo markers — geotagged shots, shown once you zoom in
  const PHOTO_ZOOM = 9;
  const photoLayer = L.layerGroup();
  const hint = L.control({ position: 'topright' });
  let hintEl = null;
  hint.onAdd = function () {
    hintEl = L.DomUtil.create('div', 'map-hint');
    hintEl.textContent = 'Zoom in for photos';
    return hintEl;
  };
  hint.addTo(map);

  function syncPhotoLayer() {
    const show = map.getZoom() >= PHOTO_ZOOM;
    if (show && !map.hasLayer(photoLayer)) map.addLayer(photoLayer);
    if (!show && map.hasLayer(photoLayer)) map.removeLayer(photoLayer);
    if (hintEl) hintEl.style.display = show ? 'none' : 'block';
  }
  map.on('zoomend', syncPhotoLayer);

  if (el.dataset.photos) {
    fetch(el.dataset.photos)
      .then(function (r) { return r.json(); })
      .then(function (photos) {
        photos.forEach(function (p) {
          const icon = L.divIcon({
            className: 'map-photo',
            html: '<span style="background-image:url(\'' + p.thumb + '\')"></span>',
            iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -22],
          });
          L.marker([p.lat, p.lng], { icon: icon })
            .bindPopup(
              '<div class="map-popup map-photo-popup">' +
              '<img src="' + p.thumb + '" alt="' + (p.caption || '') + '" loading="lazy">' +
              '<span class="map-popup-label">' + p.trip + (p.approx ? ' · approximate spot' : '') + '</span>' +
              (p.caption ? '<span class="map-popup-caption">' + p.caption + '</span>' : '') +
              '<a class="map-popup-link" href="' + p.full + '" target="_blank" rel="noopener">Open full size →</a>' +
              '</div>',
              { closeButton: false, minWidth: 240 }
            )
            .addTo(photoLayer);
        });
        syncPhotoLayer();
      })
      .catch(function () { /* no photos, no problem */ });
  }
  syncPhotoLayer();

  // trip chips under the map — click to fly to a trip
  const list = document.getElementById('map-trips');
  if (list) {
    trips.forEach(function (trip, i) {
      const btn = document.createElement('button');
      btn.className = 'map-trip';
      btn.innerHTML = '<span class="map-trip-dot"></span>' + trip.title +
        '<span class="map-trip-date">' + trip.date + '</span>';
      btn.addEventListener('click', function () {
        const b = tripLayers[i].getBounds();
        if (b.isValid()) map.flyToBounds(b, { padding: [60, 60], duration: 0.9 });
        const layers = tripLayers[i].getLayers();
        for (const l of layers) {
          if (l.getPopup && l.getPopup()) { l.openPopup(); break; }
        }
      });
      list.appendChild(btn);
    });
  }
})();
