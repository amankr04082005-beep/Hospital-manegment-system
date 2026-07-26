"""
Symptom Knowledge Base for AI Clinical Decision Support.
Ported from the JS version in backend/src/data/symptomKnowledgeBase.js
"""

SYMPTOM_KNOWLEDGE_BASE = [
    {
        "keywords": ["fever", "temperature", "chills"],
        "probableDiagnoses": [
            {"diagnosis": "Viral fever", "confidence": 0.7},
            {"diagnosis": "Common cold / Upper respiratory infection", "confidence": 0.5},
        ],
        "medicineSuggestions": [
            {
                "brandName": "Dolo 650",
                "genericName": "Paracetamol",
                "composition": "Paracetamol 650mg",
                "dosage": "1 tablet",
                "frequency": "Every 6-8 hours as needed",
                "durationDays": 3,
                "instructions": "Allopathic. Take after food. Do not exceed 4 tablets in 24 hours.",
            },
            {
                "brandName": "Belladonna 30C (Homeopathic)",
                "composition": "Homeopathic remedy",
                "dosage": "4 pills",
                "frequency": "As directed by practitioner",
                "durationDays": 3,
                "instructions": "Traditionally used for sudden high fever. Individualize with a qualified homeopath.",
            },
        ],
        "clinicalAdvice": {
            "dietRecommendations": ["Drink plenty of fluids", "Light, easily digestible meals"],
            "lifestyleRecommendations": ["Adequate rest", "Avoid strenuous activity"],
            "followUpSuggestions": ["Follow up if fever persists beyond 3 days"],
            "suggestedLabTests": ["CBC if fever persists beyond 3 days"],
        },
    },
    {
        "keywords": ["cough", "cold", "sore throat", "throat pain"],
        "probableDiagnoses": [{"diagnosis": "Acute upper respiratory tract infection", "confidence": 0.65}],
        "medicineSuggestions": [
            {
                "brandName": "Benadryl",
                "genericName": "Diphenhydramine",
                "composition": "Diphenhydramine 12.5mg",
                "dosage": "10ml",
                "frequency": "Twice daily",
                "durationDays": 5,
                "instructions": "Allopathic. Take after food. May cause drowsiness.",
            },
            {
                "brandName": "Bryonia Alba 30C (Homeopathic)",
                "composition": "Homeopathic remedy",
                "dosage": "4 pills",
                "frequency": "As directed",
                "durationDays": 5,
                "instructions": "Traditionally used for dry cough. Individualize with a practitioner.",
            },
        ],
        "clinicalAdvice": {
            "dietRecommendations": ["Warm fluids", "Avoid cold drinks/ice cream"],
            "lifestyleRecommendations": ["Steam inhalation", "Gargle with warm salt water"],
            "followUpSuggestions": ["Follow up if symptoms persist beyond 5-7 days"],
            "suggestedLabTests": [],
        },
    },
    {
        "keywords": ["headache", "migraine"],
        "probableDiagnoses": [{"diagnosis": "Tension headache", "confidence": 0.6}],
        "medicineSuggestions": [
            {
                "brandName": "Crocin",
                "genericName": "Paracetamol",
                "composition": "Paracetamol 500mg",
                "dosage": "1 tablet",
                "frequency": "Every 8 hours as needed",
                "durationDays": 2,
                "instructions": "Allopathic. Take after food.",
            },
            {
                "brandName": "Nux Vomica 30C (Homeopathic)",
                "composition": "Homeopathic remedy",
                "dosage": "4 pills",
                "frequency": "As directed",
                "durationDays": 2,
                "instructions": "Traditionally used for stress-related headache.",
            },
        ],
        "clinicalAdvice": {
            "dietRecommendations": ["Stay hydrated"],
            "lifestyleRecommendations": ["Reduce screen time", "Adequate sleep"],
            "followUpSuggestions": ["Follow up if headaches are recurrent or severe"],
            "suggestedLabTests": [],
        },
    },
    {
        "keywords": ["stomach", "abdominal", "nausea", "vomit", "diarrhea", "loose motion"],
        "probableDiagnoses": [{"diagnosis": "Acute gastroenteritis", "confidence": 0.55}],
        "medicineSuggestions": [
            {
                "brandName": "ORS",
                "genericName": "Oral Rehydration Salts",
                "composition": "Electrolyte mixture",
                "dosage": "1 sachet in 1L water",
                "frequency": "Sip throughout the day",
                "durationDays": 3,
                "instructions": "Allopathic/supportive. Continue normal feeding. Avoid oily/spicy food.",
            },
            {
                "brandName": "Arsenicum Album 30C (Homeopathic)",
                "composition": "Homeopathic remedy",
                "dosage": "4 pills",
                "frequency": "As directed",
                "durationDays": 3,
                "instructions": "Traditionally used for gastroenteritis with weakness.",
            },
        ],
        "clinicalAdvice": {
            "dietRecommendations": [
                "Bland diet (BRAT: banana, rice, applesauce, toast)",
                "Avoid dairy and oily food",
            ],
            "lifestyleRecommendations": ["Rest", "Maintain hand hygiene"],
            "followUpSuggestions": ["Seek care urgently if signs of dehydration appear"],
            "suggestedLabTests": ["Stool routine examination if symptoms persist"],
        },
    },
    {
        "keywords": ["malaria", "suspected malaria"],
        "probableDiagnoses": [{"diagnosis": "Malaria — suspected, needs testing", "confidence": 0.4}],
        "medicineSuggestions": [
            {
                "brandName": "Dolo 650",
                "genericName": "Paracetamol",
                "composition": "Paracetamol 650mg",
                "dosage": "1 tablet",
                "frequency": "Every 6-8 hours as needed for fever",
                "durationDays": 2,
                "instructions": "For symptomatic fever relief only, while awaiting confirmatory testing. Do not substitute for antimalarial treatment once diagnosis is confirmed.",
            }
        ],
        "clinicalAdvice": {
            "dietRecommendations": ["Plenty of fluids"],
            "lifestyleRecommendations": ["Rest", "Avoid exertion until diagnosis is confirmed"],
            "followUpSuggestions": [
                "Refer urgently for peripheral smear/rapid test — treatment depends on species identification"
            ],
            "suggestedLabTests": ["Peripheral blood smear", "Rapid malaria antigen test"],
        },
    },
    {
        "keywords": ["skin allergy", "rash", "itching", "hives", "allergic reaction"],
        "probableDiagnoses": [{"diagnosis": "Allergic contact dermatitis / Urticaria", "confidence": 0.6}],
        "medicineSuggestions": [
            {
                "brandName": "Cetrizine",
                "genericName": "Cetirizine",
                "composition": "Cetirizine 10mg",
                "dosage": "1 tablet",
                "frequency": "Once daily at night",
                "durationDays": 5,
                "instructions": "Allopathic. May cause mild drowsiness. Avoid known allergen triggers.",
            },
            {
                "brandName": "Rhus Tox 30C (Homeopathic)",
                "composition": "Homeopathic remedy",
                "dosage": "4 pills",
                "frequency": "As directed",
                "durationDays": 5,
                "instructions": "Traditionally used for itchy, blistering skin reactions.",
            },
        ],
        "clinicalAdvice": {
            "dietRecommendations": ["Avoid known food allergens"],
            "lifestyleRecommendations": ["Avoid scratching", "Use mild, fragrance-free soap"],
            "followUpSuggestions": ["Follow up if rash spreads or breathing difficulty occurs"],
            "suggestedLabTests": [],
        },
    },
    {
        "keywords": ["acidity", "heartburn", "gerd", "gastritis"],
        "probableDiagnoses": [{"diagnosis": "Acid reflux / Gastritis", "confidence": 0.55}],
        "medicineSuggestions": [
            {
                "brandName": "Pantoprazole 40mg",
                "genericName": "Pantoprazole",
                "composition": "Pantoprazole",
                "dosage": "1 tablet",
                "frequency": "Once daily before breakfast",
                "durationDays": 7,
                "instructions": "Allopathic proton pump inhibitor.",
            },
            {
                "brandName": "Nux Vomica 30C (Homeopathic)",
                "composition": "Homeopathic remedy",
                "dosage": "4 pills",
                "frequency": "As directed",
                "durationDays": 7,
                "instructions": "Traditionally used for acidity from spicy food/stress.",
            },
        ],
        "clinicalAdvice": {
            "dietRecommendations": ["Avoid spicy/oily food, caffeine, late-night meals"],
            "lifestyleRecommendations": ["Avoid lying down right after eating"],
            "followUpSuggestions": [
                "Refer if alarm symptoms: weight loss, black stools, difficulty swallowing"
            ],
            "suggestedLabTests": [],
        },
    },
    {
        "keywords": ["joint pain", "arthritis", "knee pain"],
        "probableDiagnoses": [{"diagnosis": "Osteoarthritis / Non-specific joint pain", "confidence": 0.5}],
        "medicineSuggestions": [
            {
                "brandName": "Diclofenac gel",
                "composition": "Diclofenac 1%",
                "dosage": "Thin layer",
                "frequency": "Twice daily",
                "durationDays": 7,
                "instructions": "Allopathic topical NSAID.",
            },
            {
                "brandName": "Rhus Tox 30C (Homeopathic)",
                "composition": "Homeopathic remedy",
                "dosage": "4 pills",
                "frequency": "As directed",
                "durationDays": 7,
                "instructions": "Traditionally used for stiffness that improves with movement.",
            },
        ],
        "clinicalAdvice": {
            "dietRecommendations": ["Maintain healthy weight"],
            "lifestyleRecommendations": ["Gentle stretching/physiotherapy"],
            "followUpSuggestions": ["Refer to orthopedist if swelling/deformity or non-improving"],
            "suggestedLabTests": ["X-ray if persistent"],
        },
    },
    {
        "keywords": ["dengue"],
        "probableDiagnoses": [{"diagnosis": "Dengue fever — suspected, needs urgent testing", "confidence": 0.4}],
        "medicineSuggestions": [
            {
                "brandName": "Paracetamol 650mg",
                "genericName": "Paracetamol",
                "composition": "Paracetamol",
                "dosage": "1 tablet",
                "frequency": "Every 6-8 hours if needed",
                "durationDays": 3,
                "instructions": "Allopathic — ONLY paracetamol for fever. Avoid NSAIDs/Aspirin (bleeding risk) until dengue is ruled out.",
            }
        ],
        "clinicalAdvice": {
            "dietRecommendations": ["Plenty of oral fluids"],
            "lifestyleRecommendations": ["Rest, mosquito bite prevention for household"],
            "followUpSuggestions": [
                "Refer urgently for platelet count monitoring; watch for warning signs (bleeding, severe abdominal pain, persistent vomiting)"
            ],
            "suggestedLabTests": ["CBC with platelet count, NS1/Dengue serology"],
        },
    },
    {
        "keywords": ["diabetes", "excessive thirst", "frequent urination sugar", "high sugar"],
        "probableDiagnoses": [{"diagnosis": "Suspected hyperglycemia — needs testing", "confidence": 0.4}],
        "medicineSuggestions": [],
        "clinicalAdvice": {
            "dietRecommendations": ["Reduce refined sugar/carbohydrate intake pending diagnosis"],
            "lifestyleRecommendations": ["Regular physical activity"],
            "followUpSuggestions": [
                "Refer for blood sugar testing — medication/insulin dosing must be individualized by a physician, not AI-suggested"
            ],
            "suggestedLabTests": ["Fasting/PP blood glucose, HbA1c"],
        },
    },
    {
        "keywords": ["hypertension", "high blood pressure", "bp high"],
        "probableDiagnoses": [{"diagnosis": "Suspected hypertension — needs confirmation", "confidence": 0.4}],
        "medicineSuggestions": [],
        "clinicalAdvice": {
            "dietRecommendations": ["Reduce salt intake"],
            "lifestyleRecommendations": ["Regular exercise, stress reduction, avoid smoking/alcohol"],
            "followUpSuggestions": [
                "Refer for BP monitoring over multiple readings — antihypertensive dosing must be individualized by a physician"
            ],
            "suggestedLabTests": ["Serial BP readings, Renal function, Lipid profile"],
        },
    },
    {
        "keywords": ["asthma", "breathlessness", "wheezing", "shortness of breath"],
        "probableDiagnoses": [{"diagnosis": "Suspected reactive airway disease/Asthma", "confidence": 0.4}],
        "medicineSuggestions": [],
        "clinicalAdvice": {
            "dietRecommendations": [],
            "lifestyleRecommendations": ["Avoid known triggers (dust, smoke, cold air)"],
            "followUpSuggestions": [
                "Refer urgently to physician/pulmonologist — inhaler/steroid dosing needs individualized prescription, not AI suggestion"
            ],
            "suggestedLabTests": ["Pulmonary function test / Peak flow as advised by physician"],
        },
    },
    {
        "keywords": ["chest pain"],
        "probableDiagnoses": [
            {
                "diagnosis": "Chest pain — needs urgent evaluation to rule out cardiac cause",
                "confidence": 0.3,
            }
        ],
        "medicineSuggestions": [],
        "clinicalAdvice": {
            "dietRecommendations": [],
            "lifestyleRecommendations": [],
            "followUpSuggestions": [
                "URGENT: Refer immediately for clinical evaluation/ECG — chest pain requires prompt cardiac workup, no self-medication"
            ],
            "suggestedLabTests": ["ECG, Troponin as clinically indicated"],
        },
    },
]

DEFAULT_SUGGESTION = {
    "probableDiagnoses": [
        {
            "diagnosis": "Nonspecific presentation — clinical correlation advised",
            "confidence": 0.3,
        }
    ],
    "medicineSuggestions": [],
    "clinicalAdvice": {
        "dietRecommendations": ["Maintain adequate hydration"],
        "lifestyleRecommendations": ["Adequate rest"],
        "followUpSuggestions": ["Doctor to assess further based on examination"],
        "suggestedLabTests": [],
    },
}

# Interaction map for drug checking
MEDICINE_INTERACTIONS = {
    "Paracetamol": {
        "interacts_with": [
            {"composition": "Aspirin", "severity": "moderate", "note": "Increased risk of renal impairment with long-term use"},
            {"composition": "Ibuprofen", "severity": "moderate", "note": "Increased risk of hepatotoxicity with high doses"},
            {"composition": "Warfarin", "severity": "severe", "note": "Increased INR and bleeding risk"},
        ]
    },
    "Diphenhydramine": {
        "interacts_with": [
            {"composition": "Alcohol", "severity": "severe", "note": "Increased CNS depression"},
            {"composition": "Sedatives", "severity": "moderate", "note": "Additive sedative effect"},
        ]
    },
    "Amoxicillin": {
        "interacts_with": [
            {"composition": "Methotrexate", "severity": "severe", "note": "Decreased methotrexate clearance"},
            {"composition": "Warfarin", "severity": "moderate", "note": "Increased INR"},
        ]
    },
    "Ibuprofen": {
        "interacts_with": [
            {"composition": "Aspirin", "severity": "moderate", "note": "Increased GI bleeding risk"},
            {"composition": "Warfarin", "severity": "severe", "note": "Increased bleeding risk"},
            {"composition": "Metformin", "severity": "minor", "note": "Possible reduced metformin efficacy"},
        ]
    },
}

# Contraindications map
CONTRADICTIONS = {
    "kidney_disease": [
        "Ibuprofen",
        "Diclofenac",
        "Mefenamic Acid",
        "Nitrofurantoin",
    ],
    "liver_disease": [
        "Paracetamol",
        "Ibuprofen",
        "Diclofenac",
    ],
    "pregnancy": [
        "Ibuprofen",
        "Diclofenac",
        "Mefenamic Acid",
        "Amoxicillin",
    ],
}

# Allergy triggers
ALLERGY_TRIGGERS = {
    "penicillin": {"isPenicillinBased": True, "medicines": ["Amoxicillin", "Amoxicillin + Clavulanic Acid"]},
    "sulfa": {"isPenicillinBased": False, "medicines": ["Sulfamethoxazole", "Trimethoprim-Sulfamethoxazole"]},
}

