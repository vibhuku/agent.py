from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="Landslide Risk Platform API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class SiteConditions(BaseModel):
    rainfall: float = Field(ge=0, le=400)
    slope: float = Field(ge=0, le=60)
    moisture: float = Field(ge=0, le=100)

def assess_risk(site: SiteConditions) -> dict:
    score = min(100, round(site.rainfall / 4 + site.slope * 0.7 + site.moisture * 0.25))
    if score >= 65:
        level, message = "High", "Multiple conditions indicate elevated slope instability."
        recommendation = "Restrict access and request an expert field inspection."
    elif score >= 35:
        level, message = "Moderate", "Conditions warrant closer observation and drainage checks."
        recommendation = "Continue monitoring rainfall and inspect drainage paths."
    else:
        level, message = "Low", "Current inputs indicate limited instability potential."
        recommendation = "Maintain routine inspection and monitor changing conditions."
    return {"score": score, "level": level, "message": message, "recommendation": recommendation}

@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}

@app.post("/api/risk")
def risk(site: SiteConditions) -> dict:
    return assess_risk(site)
