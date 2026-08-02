"""
Clinical Decision Support Service.
Main orchestration layer that combines ML classification,
medicine recommendation, allergy checking, and interaction checking.
"""

from datetime import datetime

from data.symptom_knowledge_base import (
    SYMPTOM_KNOWLEDGE_BASE,
    DEFAULT_SUGGESTION,
    MEDICINE_INTERACTIONS,
    CONTRADICTIONS,
    ALLERGY_TRIGGERS,
)
from models.symptom_classifier import get_classifier
from models.medicine_recommender import get_recommender
from services.allergy_checker import get_allergy_checker
from services.interaction_checker import get_interaction_checker


AI_LABEL = "AI Suggested - Pending Doctor Approval"

# Initialize and train models on startup
_classifier = None
_recommender = None
_allergy_checker = None
_interaction_checker = None


def initialize():
    """Initialize all models and services with knowledge base data."""
    global _classifier, _recommender, _allergy_checker, _interaction_checker

    # Initialize and train ML models
    _classifier = get_classifier()
    _classifier.train(SYMPTOM_KNOWLEDGE_BASE)

    _recommender = get_recommender()
    _recommender.fit(SYMPTOM_KNOWLEDGE_BASE)

    # Initialize checkers
    _allergy_checker = get_allergy_checker()
    _allergy_checker.set_allergy_triggers(ALLERGY_TRIGGERS)
    _allergy_checker.set_contradictions(CONTRADICTIONS)

    _interaction_checker = get_interaction_checker()
    _interaction_checker.set_interaction_map(MEDICINE_INTERACTIONS)


def generate_clinical_recommendation(
    symptoms="",
    allergies=None,
    existing_diseases=None,
    current_medications=None,
    lab_reports=None,
    medical_history=None,
):
    """
    Generate a comprehensive clinical recommendation.

    Args:
        symptoms (str): Patient's symptom description
        allergies (list): Patient's known allergies
        existing_diseases (list): Patient's existing medical conditions
        current_medications (list): Patient's current medications
        lab_reports (list): Lab report data
        medical_history (dict): Additional medical history

    Returns:
        dict: Complete clinical recommendation matching the JS output format
    """
    # Ensure initialization
    if _classifier is None or not _classifier.is_trained:
        initialize()

    allergies = allergies or []
    existing_diseases = existing_diseases or []
    current_medications = current_medications or []
    lab_reports = lab_reports or []
    medical_history = medical_history or {}

    # Step 1: Classify symptoms to get probable diagnoses
    probable_diagnoses = _classifier.predict_with_fallback(
        symptoms, SYMPTOM_KNOWLEDGE_BASE
    )

    # Step 2: Get medicine recommendations
    medicine_suggestions = _recommender.recommend(
        symptoms, SYMPTOM_KNOWLEDGE_BASE
    )

    # If no suggestions from ML, try keyword match directly
    if not medicine_suggestions and symptoms:
        lower_symptoms = symptoms.lower()
        for entry in SYMPTOM_KNOWLEDGE_BASE:
            if any(kw in lower_symptoms for kw in entry["keywords"]):
                for med in entry["medicineSuggestions"]:
                    medicine_suggestions.append({**med, "source": "ai_suggested"})
                break

    # Step 3: Get clinical advice
    clinical_advice = _recommender.get_clinical_advice(
        symptoms, SYMPTOM_KNOWLEDGE_BASE
    )

    # Step 4: Check allergies
    allergy_alerts = _allergy_checker.check_allergies(
        allergies, medicine_suggestions
    )

    # Step 5: Check contraindications
    contraindication_alerts = _allergy_checker.check_contraindications(
        existing_diseases, medicine_suggestions
    )

    # Step 6: Check drug interactions
    interaction_warnings = _interaction_checker.check_interactions(
        medicine_suggestions, current_medications
    )

    # Step 7: If no diagnoses found, use default
    if not probable_diagnoses:
        probable_diagnoses = DEFAULT_SUGGESTION["probableDiagnoses"]
        if not clinical_advice["dietRecommendations"]:
            clinical_advice = DEFAULT_SUGGESTION["clinicalAdvice"]

    return {
        "label": AI_LABEL,
        "probableDiagnoses": probable_diagnoses,
        "medicineSuggestions": medicine_suggestions,
        "clinicalAdvice": clinical_advice,
        "interactionWarnings": interaction_warnings,
        "allergyAlerts": allergy_alerts,
        "contraindicationAlerts": contraindication_alerts,
        "generatedAt": datetime.utcnow().isoformat() + "Z",
        "aiModelVersion": "python-ml-clinical-engine-v1",
    }

