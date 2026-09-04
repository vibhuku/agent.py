# Landslide Risk Platform

A decision-support prototype that estimates landslide risk from rainfall, slope angle, and soil moisture.

## Run the backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

The API runs at `http://localhost:8000`. Check it with `curl http://localhost:8000/api/health`.

## Run the frontend

In a second terminal:

```bash
cd frontend
python3 -m http.server 5500
```

Open `http://localhost:5500`. The form calls the FastAPI endpoint when available and uses a local screening estimate otherwise.

This prototype is not a substitute for field inspection, geological assessment, or emergency services.
