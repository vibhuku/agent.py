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
const map = L.map('map', { zoomControl: false }).setView([25.9, 92.8], 6);
L.control.zoom({ position: 'bottomright' }).addTo(map);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors', maxZoom: 18 }).addTo(map);
const markers = L.layerGroup().addTo(map);
const reports = L.layerGroup().addTo(map);
const riskColors = { Low: '#52d68b', Moderate: '#f3b64b', High: '#fa6671' };
let selected = locations[0];
let selectedCoords = { lat: selected.lat, lon: selected.lon };

function riskLevel(score) { return score >= 70 ? 'High' : score >= 40 ? 'Moderate' : 'Low'; }
function addRiskMarkers() {
  markers.clearLayers();
  locations.forEach((location) => {
    const level = riskLevel(location.score);
    const marker = L.circleMarker([location.lat, location.lon], { radius: level === 'High' ? 10 : 8, color: riskColors[level], fillColor: riskColors[level], fillOpacity: .8, weight: 2 });
    marker.bindTooltip(`${location.name} · ${level} ${location.score}/100`, { direction: 'top', offset: [0, -8] });
    marker.on('click', () => selectLocation(location));
    markers.addLayer(marker);
  });
}
function addReports() {
  reports.clearLayers();
  [...demoReports, ...JSON.parse(localStorage.getItem('ner-reports') || '[]')].forEach((report) => L.marker([report.lat, report.lon], { icon: L.divIcon({ className: 'report-marker', html: '⚑', iconSize: [24, 24] }) }).bindTooltip(report.text || 'Citizen report').addTo(reports));
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
  const ring = $('#risk-ring'); ring.parentElement.parentElement.className = `risk-readout ${level.toLowerCase()}`; ring.style.setProperty('--score', `${location.score * 3.6}deg`);
  $('#warning-banner').className = `warning-banner ${level.toLowerCase()}`;
  setText('rain-24', weather?.rain ?? location.rain); setText('rain-72', weather?.rain72 ?? location.rain72); setText('temperature', weather?.temperature ?? '22.4'); setText('humidity', weather?.humidity ?? '86'); setText('wind', weather?.wind ?? '8'); setText('pressure', weather?.pressure ?? '1008');
  setText('rain-driver-value', `${Math.min(99, Math.round((weather?.rain ?? location.rain) / 1.5))}%`); $('#rain-driver').style.width = `${Math.min(99, Math.round((weather?.rain ?? location.rain) / 1.5))}%`;
  setText('slope-driver-value', `${location.slope}%`); $('#slope-driver').style.width = `${location.slope}%`; setText('terrain-driver-value', `${location.terrain}%`); $('#terrain-driver').style.width = `${location.terrain}%`;
}
async function fetchWeather(location) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current=temperature_2m,relative_humidity_2m,precipitation,pressure_msl,wind_speed_10m&hourly=precipitation,precipitation_probability&past_days=3&forecast_days=1&timezone=Asia%2FKolkata`;
    const response = await fetch(url); if (!response.ok) throw new Error('Weather request failed');
    const data = await response.json(); const current = data.current; const rain = data.hourly.precipitation.slice(-24).reduce((sum, value) => sum + (value || 0), 0); const rain72 = data.hourly.precipitation.slice(-72).reduce((sum, value) => sum + (value || 0), 0);
    renderAssessment(location, { temperature: current.temperature_2m.toFixed(1), humidity: current.relative_humidity_2m, wind: Math.round(current.wind_speed_10m), pressure: Math.round(current.pressure_msl), rain: rain.toFixed(1), rain72: rain72.toFixed(1) }, 'LIVE');
  } catch (error) { renderAssessment(location, null, 'DEMO'); }
}
function selectLocation(location) { map.flyTo([location.lat, location.lon], 9, { duration: .8 }); renderAssessment(location); fetchWeather(location); }
function searchLocation() { const query = $('#location-search').value.trim().toLowerCase(); const match = locations.find((location) => `${location.name} ${location.region}`.toLowerCase().includes(query)); if (match) selectLocation(match); else $('#location-search').setCustomValidity('No monitored location found. Try a city or state.'); $('#location-search').reportValidity(); }
addRiskMarkers(); addReports(); renderAssessment(selected); fetchWeather(selected); setText('last-sync', new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST');
$('#search-button').addEventListener('click', searchLocation); $('#location-search').addEventListener('input', () => $('#location-search').setCustomValidity('')); $('#location-search').addEventListener('keydown', (event) => { if (event.key === 'Enter') searchLocation(); });
$('#risk-layer').addEventListener('change', (event) => event.target.checked ? map.addLayer(markers) : map.removeLayer(markers)); $('#reports-layer').addEventListener('change', (event) => event.target.checked ? map.addLayer(reports) : map.removeLayer(reports));
$('#rain-layer').addEventListener('change', (event) => event.target.checked ? L.tileLayer('https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=demo', { opacity: .35 }).addTo(map) : null);
$('#locate-button').addEventListener('click', () => navigator.geolocation?.getCurrentPosition((position) => { const location = { ...selected, name: 'Your location', region: 'GPS position / NER India', lat: position.coords.latitude, lon: position.coords.longitude }; selectLocation(location); }, () => alert('Location access was unavailable. Select a point on the map instead.')));
map.on('click', (event) => { const location = { ...selected, name: 'Selected map point', region: 'Coordinates / NER India', lat: event.latlng.lat, lon: event.latlng.lng, code: 'NER', score: 45, rain: 48, rain72: 92, slope: 55, terrain: 52 }; selectLocation(location); });
document.querySelectorAll('[data-focus]').forEach((button) => button.addEventListener('click', () => selectLocation(locations.find((location) => location.name === 'Gangtok'))));
const modal = $('#report-modal'); function toggleModal(open) { modal.classList.toggle('open', open); modal.setAttribute('aria-hidden', String(!open)); if (open) modal.querySelector('select').focus(); }
$('#report-open').addEventListener('click', () => toggleModal(true)); $('#report-open-secondary').addEventListener('click', () => toggleModal(true)); $('#report-close').addEventListener('click', () => toggleModal(false)); modal.querySelector('[data-close-modal]').addEventListener('click', () => toggleModal(false)); document.addEventListener('keydown', (event) => { if (event.key === 'Escape') toggleModal(false); });
$('#report-use-location').addEventListener('click', () => { setText('report-coordinates', `${selectedCoords.lat.toFixed(4)}, ${selectedCoords.lon.toFixed(4)} (selected)`); });
$('#report-form').addEventListener('submit', (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const report = { lat: selectedCoords.lat, lon: selectedCoords.lon, text: `${form.get('observation')} · ${form.get('location')}` }; const stored = JSON.parse(localStorage.getItem('ner-reports') || '[]'); localStorage.setItem('ner-reports', JSON.stringify([...stored, report])); addReports(); event.currentTarget.style.display = 'none'; $('#form-success').classList.add('visible'); });
$('#menu-toggle').addEventListener('click', () => document.querySelector('nav').classList.toggle('mobile-open'));
