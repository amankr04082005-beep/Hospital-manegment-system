"""
FastAPI Application for AI Clinical Decision Support.
Provides ML-powered clinical recommendations for the Hospital Management System.

Endpoints:
    POST /api/v1/clinical/recommendation - Generate clinical recommendation
    GET  /api/v1/health - Health check
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List

from services.clinical_decision import generate_clinical_recommendation, initialize

# Initialize ML models on import
initialize()

app = FastAPI(
    title="AI Clinical Decision Support Service",
    description="Python ML-powered clinical decision support for MediFlow Hospital Management System",
    version="1.0.0",
)

# CORS - allow backend server to call this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ======================
# Pydantic Models
# ======================

class ClinicalRecommendationRequest(BaseModel):
    symptoms: str = Field(..., description="Patient's symptom description", min_length=1)
    allergies: Optional[List[str]] = Field(default_factory=list, description="List of patient allergies")
    existing_diseases: Optional[List[str]] = Field(default_factory=list, description="List of existing medical conditions")
    current_medications: Optional[List[str]] = Field(default_factory=list, description="List of current medications")
    lab_reports: Optional[List[str]] = Field(default_factory=list, description="Lab report references")
    medical_history: Optional[dict] = Field(default_factory=dict, description="Additional medical history")

    class Config:
        json_schema_extra = {
            "example": {
                "symptoms": "fever, cough, headache since 3 days",
                "allergies": ["penicillin"],
                "existing_diseases": ["diabetes"],
                "current_medications": ["metformin"],
                "lab_reports": [],
                "medical_history": {
                    "existingDiseases": ["diabetes"],
                    "familyHistory": ""
                }
            }
        }


class MedicineSuggestion(BaseModel):
    brandName: Optional[str] = None
    genericName: Optional[str] = None
    composition: Optional[str] = None
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    durationDays: Optional[int] = None
    instructions: Optional[str] = None
    source: Optional[str] = None


class ClinicalAdvice(BaseModel):
    dietRecommendations: List[str] = []
    lifestyleRecommendations: List[str] = []
    followUpSuggestions: List[str] = []
    suggestedLabTests: List[str] = []


class InteractionWarning(BaseModel):
    severity: str = "moderate"
    description: str = ""


class ClinicalRecommendationResponse(BaseModel):
    label: str = "AI Suggested - Pending Doctor Approval"
    probableDiagnoses: List[dict] = []
    medicineSuggestions: List[MedicineSuggestion] = []
    clinicalAdvice: ClinicalAdvice = ClinicalAdvice()
    interactionWarnings: List[InteractionWarning] = []
    allergyAlerts: List[str] = []
    contraindicationAlerts: List[str] = []
    generatedAt: str = ""
    aiModelVersion: str = "python-ml-clinical-engine-v1"


# ======================
# API Endpoints
# ======================

@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "ai-clinical-decision-support",
        "version": "1.0.0",
        "engine": "python-ml",
    }


@app.post("/api/v1/clinical/recommendation", response_model=ClinicalRecommendationResponse)
async def clinical_recommendation(request: ClinicalRecommendationRequest):
    """
    Generate AI/ML-powered clinical recommendation based on patient symptoms and history.

    This endpoint mirrors the same contract as the existing JS mock engine
    in `backend/src/services/aiClinicalDecisionSupport.service.js` so the
    Node.js backend can seamlessly switch between the two.

    The ML pipeline:
    1. TF-IDF Vectorization + Naive Bayes classification for symptom→diagnosis
    2. Cosine similarity matching for medicine recommendations
    3. Rule-based allergy and contraindication checks
    4. Drug interaction detection from the knowledge base
    """
    try:
        result = generate_clinical_recommendation(
            symptoms=request.symptoms,
            allergies=request.allergies,
            existing_diseases=request.existing_diseases,
            current_medications=request.current_medications,
            lab_reports=request.lab_reports,
            medical_history=request.medical_history,
        )

        # Convert to response model
        return ClinicalRecommendationResponse(
            label=result["label"],
            probableDiagnoses=result["probableDiagnoses"],
            medicineSuggestions=[MedicineSuggestion(**m) for m in result["medicineSuggestions"]],
            clinicalAdvice=ClinicalAdvice(**result["clinicalAdvice"]),
            interactionWarnings=[
                InteractionWarning(**w) for w in result["interactionWarnings"]
            ],
            allergyAlerts=result["allergyAlerts"],
            contraindicationAlerts=result["contraindicationAlerts"],
            generatedAt=result["generatedAt"],
            aiModelVersion=result["aiModelVersion"],
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate clinical recommendation: {str(e)}",
        )


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "AI Clinical Decision Support Service",
        "docs": "/docs",
        "health": "/api/v1/health",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

