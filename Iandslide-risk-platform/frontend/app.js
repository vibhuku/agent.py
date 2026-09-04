const locations = [
  { name: 'Cherrapunji', region: 'East Khasi Hills / Meghalaya', code: 'MEG', lat: 25.286, lon: 91.733, score: 64, rain: 86, rain72: 164, slope: 68, terrain: 61 },
  { name: 'Guwahati', region: 'Kamrup / Assam', code: 'ASM', lat: 26.144, lon: 91.736, score: 27, rain: 32, rain72: 54, slope: 28, terrain: 32 },
  { name: 'Kohima', region: 'Kohima / Nagaland', code: 'NAG', lat: 25.675, lon: 94.108, score: 78, rain: 142, rain72: 241, slope: 79, terrain: 72 },
  { name: 'Tawang', region: 'Tawang / Arunachal Pradesh', code: 'ARP', lat: 27.586, lon: 91.859, score: 71, rain: 118, rain72: 198, slope: 84, terrain: 77 },
  { name: 'Gangtok', region: 'East Sikkim / Sikkim', code: 'SKM', lat: 27.338, lon: 88.606, score: 74, rain: 104, rain72: 178, slope: 81, terrain: 78 },
  { name: 'Aizawl', region: 'Aizawl / Mizoram', code: 'MIZ', lat: 23.727, lon: 92.717, score: 58, rain: 73, rain72: 136, slope: 71, terrain: 68 }
];
const demoReports = [{ lat: 27.33, lon: 88.61, text: 'Road blocked · NH-10' }, { lat: 25.68, lon: 94.1, text: 'Fresh ground movement' }];
const $ = (selector) => document.querySelector(selector);
const indiaBounds = [[6.5, 68], [35.8, 97.8]];
const map = L.map('map', {
  zoomControl: false,
  dragging: true,
  touchZoom: true,
  doubleClickZoom: true,
  scrollWheelZoom: true,
  boxZoom: true,
  keyboard: true,
  maxBounds: indiaBounds,
  maxBoundsViscosity: 1,
  minZoom: 3.2,
  maxZoom: 18
}).fitBounds(indiaBounds, { padding: [12, 12] });
L.control.zoom({ position: 'bottomright' }).addTo(map);
const mapStyles = {
  satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: '&copy; Esri, Maxar, Earthstar Geographics', maxZoom: 18 }),
  terrain: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', { attribution: '&copy; Esri, HERE, Garmin, &copy; OpenStreetMap contributors', maxZoom: 18 }),
  standard: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', { attribution: '&copy; Esri, HERE, Garmin, &copy; OpenStreetMap contributors', maxZoom: 18 })
};
let activeStyle = mapStyles.satellite.addTo(map);
const markers = L.layerGroup().addTo(map);
const reports = L.layerGroup().addTo(map);
const rainfallLayer = L.layerGroup();
const stateLabels = L.layerGroup().addTo(map);
const highRiskZones = L.layerGroup().addTo(map);
L.rectangle([[21.3, 88.8], [29.6, 97.4]], { color: '#53d8d0', weight: 1.5, dashArray: '5 6', fillColor: '#53d8d0', fillOpacity: 0.04, interactive: false }).addTo(stateLabels);
L.marker([29.35, 95.4], { icon: L.divIcon({ className: 'ner-focus-label', html: 'NER RISK MONITORING FOCUS', iconSize: [150, 20], iconAnchor: [150, 10] }), interactive: false }).addTo(stateLabels);
const riskColors = { Low: '#52d68b', Moderate: '#f3b64b', High: '#fa6671' };
let selected = locations[0];
let selectedCoords = { lat: selected.lat, lon: selected.lon };
window.addEventListener('resize', () => map.invalidateSize());
setTimeout(() => { map.invalidateSize(); map.fitBounds(indiaBounds, { padding: [12, 12], animate: false }); }, 300);
[
  ['Rajasthan', 27.0, 73.8], ['Gujarat', 22.7, 71.6], ['Maharashtra', 19.2, 76.2],
  ['Madhya Pradesh', 23.5, 78.2], ['Uttar Pradesh', 26.8, 80.6], ['West Bengal', 23.7, 87.8],
  ['Odisha', 20.5, 84.4], ['Karnataka', 15.2, 76.1], ['Tamil Nadu', 11.1, 78.4],
  ['Assam', 26.2, 92.9], ['Arunachal Pradesh', 28.2, 94.1], ['Meghalaya', 25.5, 91.3],
  ['Manipur', 24.7, 93.8], ['Mizoram', 23.5, 92.8], ['Nagaland', 26.1, 94.4],
  ['Tripura', 23.8, 91.6], ['Sikkim', 27.5, 88.5]
].forEach(([name, lat, lon]) => L.marker([lat, lon], {
  icon: L.divIcon({ className: 'english-state-label', html: `<span>${name}</span>`, iconSize: [130, 20], iconAnchor: [65, 10] }),
  interactive: false
}).addTo(stateLabels));

function riskLevel(score) { return score >= 70 ? 'High' : score >= 40 ? 'Moderate' : 'Low'; }
function addRiskMarkers() {
  markers.clearLayers();
  highRiskZones.clearLayers();
  locations.forEach((location) => {
    const level = riskLevel(location.score);
    if (level === 'High') L.circle([location.lat, location.lon], { radius: 18000, className: 'risk-pulse-zone', color: '#fa6671', fillColor: '#fa6671', fillOpacity: .12, weight: 1 }).addTo(highRiskZones);
    const marker = L.circleMarker([location.lat, location.lon], { radius: level === 'High' ? 10 : 8, color: riskColors[level], fillColor: riskColors[level], fillOpacity: .8, weight: 2 });
    marker.bindTooltip(`${location.name} · ${level} ${location.score}/100`, { direction: 'top', offset: [0, -8] });
    marker.on('click', () => selectLocation(location));
    markers.addLayer(marker);
  });
}
function addReports() {
  reports.clearLayers();
  let savedReports = [];
  try {
    const stored = JSON.parse(localStorage.getItem('ner-reports') || '[]');
    savedReports = Array.isArray(stored) ? stored.filter((report) => Number.isFinite(report.lat) && Number.isFinite(report.lon)) : [];
  } catch {
    localStorage.removeItem('ner-reports');
  }
  [...demoReports, ...savedReports].forEach((report) => L.marker([report.lat, report.lon], { icon: L.divIcon({ className: 'report-marker', html: '⚑', iconSize: [24, 24] }) }).bindTooltip(report.text || 'Citizen report').addTo(reports));
}
function addRainfallLayer() {
  rainfallLayer.clearLayers();
  locations.forEach((location) => L.circle([location.lat, location.lon], {
    radius: Math.max(12000, location.rain * 170),
    color: '#438bd4',
    fillColor: '#438bd4',
    fillOpacity: .12,
    weight: 1
  }).bindTooltip(`${location.name} · ${location.rain} mm / 24h`).addTo(rainfallLayer));
}
function setText(id, value) { const element = $(`#${id}`); if (element) element.textContent = value; }
function renderAssessment(location, weather = null, mode = 'DEMO') {
  selected = location; selectedCoords = { lat: location.lat, lon: location.lon };
  const level = riskLevel(location.score);
  setText('selected-location', location.name); setText('selected-region', location.region); setText('state-code', location.code);
  setText('coordinates', `${location.lat.toFixed(3)}° N, ${location.lon.toFixed(3)}° E`); setText('location-score', location.score);
  setText('location-level', `${level.toUpperCase()} RISK`); setText('confidence', mode === 'LIVE' ? '84%' : '78%');
  setText('location-status', level === 'High' ? 'Elevated slope instability detected.' : level === 'Moderate' ? 'Stay alert during heavy rainfall.' : 'Conditions are stable today.');
  setText('warning-text', level === 'High' ? 'Avoid unnecessary travel near steep or unstable slopes. Follow official local instructions.' : level === 'Moderate' ? 'Monitor local conditions and avoid unnecessary travel near steep slopes.' : 'Normal monitoring. Stay aware of changing weather and local guidance.');
  setText('assessment-mode', mode); setText('data-mode', mode === 'LIVE' ? '● LIVE' : '● DEMO / OFFLINE');
  const ring = $('#risk-ring'); const readout = ring.closest('.risk-readout'); if (readout) readout.className = `risk-readout ${level.toLowerCase()}`; ring.style.setProperty('--score', `${location.score * 3.6}deg`);
  $('#warning-banner').className = `warning-banner ${level.toLowerCase()}`;
  setText('rain-24', weather?.rain ?? location.rain); setText('rain-72', weather?.rain72 ?? location.rain72); setText('rain-probability', weather?.probability ?? '--'); setText('elevation', weather?.elevation ?? '--'); setText('estimated-slope', location.slope); setText('temperature', weather?.temperature ?? '22.4'); setText('humidity', weather?.humidity ?? '86'); setText('wind', weather?.wind ?? '8'); setText('pressure', weather?.pressure ?? '1008');
  setText('rain-driver-value', `${Math.min(99, Math.round((weather?.rain ?? location.rain) / 1.5))}%`); $('#rain-driver').style.width = `${Math.min(99, Math.round((weather?.rain ?? location.rain) / 1.5))}%`;
  setText('slope-driver-value', `${location.slope}%`); $('#slope-driver').style.width = `${location.slope}%`; setText('terrain-driver-value', `${location.terrain}%`); $('#terrain-driver').style.width = `${location.terrain}%`;
}
async function fetchWeather(location) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current=temperature_2m,relative_humidity_2m,precipitation,pressure_msl,wind_speed_10m&hourly=precipitation,precipitation_probability&daily=precipitation_probability_max&past_days=3&forecast_days=1&timezone=Asia%2FKolkata`;
    const response = await fetch(url); if (!response.ok) throw new Error('Weather request failed');
    const data = await response.json(); const current = data.current; const rain = data.hourly.precipitation.slice(-24).reduce((sum, value) => sum + (value || 0), 0); const rain72 = data.hourly.precipitation.slice(-72).reduce((sum, value) => sum + (value || 0), 0);
    const elevation = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${location.lat}&longitude=${location.lon}`).then((response) => response.ok ? response.json() : null);
    renderAssessment(location, { temperature: current.temperature_2m.toFixed(1), humidity: current.relative_humidity_2m, wind: Math.round(current.wind_speed_10m), pressure: Math.round(current.pressure_msl), rain: rain.toFixed(1), rain72: rain72.toFixed(1), probability: data.daily?.precipitation_probability_max?.[0] ?? '--', elevation: elevation?.elevation?.[0] ?? '--' }, 'LIVE');
  } catch (error) { renderAssessment(location, null, 'DEMO'); }
}
function selectLocation(location) { map.flyTo([location.lat, location.lon], 9, { duration: .8 }); renderAssessment(location); fetchWeather(location); }
function searchLocation() { const query = $('#location-search').value.trim().toLowerCase(); const match = locations.find((location) => `${location.name} ${location.region}`.toLowerCase().includes(query)); if (match) selectLocation(match); else $('#location-search').setCustomValidity('No monitored location found. Try a city or state.'); $('#location-search').reportValidity(); }
addRiskMarkers(); addReports(); renderAssessment(selected); fetchWeather(selected); setText('last-sync', new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST');
$('#search-button').addEventListener('click', searchLocation); $('#location-search').addEventListener('input', () => $('#location-search').setCustomValidity('')); $('#location-search').addEventListener('keydown', (event) => { if (event.key === 'Enter') searchLocation(); });
$('#risk-layer').addEventListener('change', (event) => {
  const layerAction = event.target.checked ? 'addLayer' : 'removeLayer';
  map[layerAction](markers);
  map[layerAction](highRiskZones);
});
$('#map-style').addEventListener('change', (event) => {
  const style = event.target.value === 'hybrid' ? 'satellite' : event.target.value;
  if (activeStyle) map.removeLayer(activeStyle);
  activeStyle = mapStyles[style] || mapStyles.satellite;
  activeStyle.addTo(map);
});
addRainfallLayer();
$('#rain-layer').addEventListener('change', (event) => event.target.checked ? map.addLayer(rainfallLayer) : map.removeLayer(rainfallLayer));
$('#locate-button').addEventListener('click', () => {
  if (!navigator.geolocation) {
    alert('Location access is unavailable. Select a point on the map instead.');
    return;
  }
  navigator.geolocation.getCurrentPosition((position) => {
    const { latitude: lat, longitude: lon } = position.coords;
    if (lat < 21 || lat > 30 || lon < 87 || lon > 98) {
      alert('Your location is outside the North Eastern Region monitoring area.');
      return;
    }
    selectLocation({ ...selected, name: 'Your location', region: 'GPS position / NER India', lat, lon, code: 'GPS' });
  }, () => alert('Location access was unavailable. Select a point on the map instead.'));
});
map.on('click', (event) => { const location = { ...selected, name: 'Selected map point', region: 'Coordinates / NER India', lat: event.latlng.lat, lon: event.latlng.lng, code: 'NER', score: 45, rain: 48, rain72: 92, slope: 55, terrain: 52 }; selectLocation(location); });
document.querySelectorAll('[data-focus]').forEach((button) => button.addEventListener('click', () => selectLocation(locations.find((location) => location.name === 'Gangtok'))));
const modal = $('#report-modal');
function toggleModal(open) {
  modal.classList.toggle('open', open);
  modal.setAttribute('aria-hidden', String(!open));
  if (open) {
    $('#report-form').reset();
    $('#report-form').style.display = 'grid';
    $('#form-success').classList.remove('visible');
    setText('report-coordinates', `${selectedCoords.lat.toFixed(4)}, ${selectedCoords.lon.toFixed(4)} (selected)`);
    modal.querySelector('select').focus();
  }
}
$('#report-open').addEventListener('click', () => toggleModal(true)); $('#report-open-secondary').addEventListener('click', () => toggleModal(true)); $('#report-close').addEventListener('click', () => toggleModal(false)); modal.querySelector('[data-close-modal]').addEventListener('click', () => toggleModal(false)); document.addEventListener('keydown', (event) => { if (event.key === 'Escape') toggleModal(false); });
$('#report-use-location').addEventListener('click', () => { setText('report-coordinates', `${selectedCoords.lat.toFixed(4)}, ${selectedCoords.lon.toFixed(4)} (selected)`); });
$('#report-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  let stored = [];
  try {
    const parsed = JSON.parse(localStorage.getItem('ner-reports') || '[]');
    stored = Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem('ner-reports');
  }
  const report = { lat: selectedCoords.lat, lon: selectedCoords.lon, text: `${form.get('observation')} · ${form.get('location')}` };
  localStorage.setItem('ner-reports', JSON.stringify([...stored, report]));
  addReports();
  event.currentTarget.style.display = 'none';
  $('#form-success').classList.add('visible');
});
$('#menu-toggle').addEventListener('click', () => document.querySelector('nav').classList.toggle('mobile-open'));
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js?version=5'));
