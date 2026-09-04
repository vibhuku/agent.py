# Landslide Sentinel — NER India

Landslide Sentinel is a public-facing, dark command-center prototype for North Eastern India. It combines an interactive OpenStreetMap/Leaflet map, live Open-Meteo weather readings, a transparent prototype risk score, and locally persisted citizen reports.

> **Important:** risk scores are a prototype screening engine, not a scientifically validated forecast. The UI clearly labels demo/offline values and prototype advisories. It does not replace IMD, NDMA, SDMA, district administration, or emergency-service instructions.

## Run locally

### Frontend

The frontend is dependency-free and loads Leaflet from its CDN:

```bash
cd frontend
python3 -m http.server 5500
```

Open <http://localhost:5500>. The browser needs network access for OpenStreetMap tiles and Open-Meteo. If weather is unavailable, the assessment remains usable and is labelled `DEMO / OFFLINE`.

### Backend risk API

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

The API is available at <http://localhost:8000>, with interactive docs at `/docs`.

```bash
curl http://localhost:8000/api/health
curl -X POST http://localhost:8000/api/risk \
  -H 'content-type: application/json' \
  -d '{"rainfall":86,"slope":42,"moisture":72}'
```

The current static frontend calculates a resilient local screening result so it can be deployed without a backend. A production deployment should proxy weather/elevation requests through FastAPI and call `/api/risk`.

## API and model seam

* `GET /api/health` — service health.
* `POST /api/risk` — accepts bounded `rainfall`, `slope`, and `moisture` values and returns score, level, explanation, and recommendation.
* `POST /api/reports` — recommended production endpoint for validated citizen reports (not yet persisted by the prototype).

The `assess_risk` function in `backend/main.py` is deliberately isolated. Replace it with an adapter that loads a versioned scikit-learn/XGBoost model and maps the same feature contract to model input. Keep the response contract stable so the UI does not need to change. Store model version, feature values, confidence, and inference timestamp with each assessment.

## Environment variables

The prototype has no secrets in frontend code. A production backend can use:

```env
OPEN_METEO_BASE_URL=https://api.open-meteo.com/v1
ELEVATION_API_URL=https://api.open-meteo.com/v1/elevation
DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/landslide_sentinel
ALLOWED_ORIGINS=http://localhost:5500
```

Do not commit real credentials. Use a server-side proxy for providers that require API keys.

## Data modes

* **LIVE** — current weather returned by Open-Meteo. Timestamp and provider are shown in the interface.
* **DEMO / OFFLINE** — seeded NER locations and sample risk values used when a provider cannot be reached. They are not presented as observations.
* **PROTOTYPE ADVISORY** — non-official guidance generated from the prototype score. Official government warnings always take precedence.

Citizen reports are stored in `localStorage` for this prototype and rendered as map markers. A production version should validate MIME type and size server-side, virus-scan uploads, rate-limit submissions, sanitize descriptions, and store media in object storage.

## Production database shape

PostgreSQL + PostGIS tables should include:

* `locations(id, name, state, district, geom geometry(Point,4326), elevation_m, slope_deg)`
* `observations(id, location_id, observed_at, rainfall_1h_mm, rainfall_24h_mm, rainfall_72h_mm, temperature_c, humidity_pct, source)`
* `risk_assessments(id, location_id, assessed_at, score, level, confidence, model_version, factors jsonb)`
* `citizen_reports(id, geom geometry(Point,4326), incident_type, description, photo_url, status, created_at)`

Add GiST indexes on all geometry columns and time indexes on observations/risk assessments. Authentication and role-based permissions should separate public submission/read access from authority triage and verification.
