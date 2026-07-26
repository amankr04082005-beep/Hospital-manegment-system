"""
Allergy / Contraindication Checker.
Checks for allergies and contraindications based on patient profile
and suggested medicines.
"""

import re


class AllergyChecker:
    """
    Checks for allergy alerts and contraindications.
    """

    def __init__(self, allergy_triggers=None, contradictions=None):
        self.allergy_triggers = allergy_triggers or {}
        self.contradictions = contradictions or {}

    def set_allergy_triggers(self, triggers):
        """Set allergy trigger data."""
        self.allergy_triggers = triggers

    def set_contradictions(self, contradictions):
        """Set contraindication data."""
        self.contradictions = contradictions

    def check_allergies(self, allergies, suggested_medicines):
        """
        Check if any suggested medicines trigger patient allergies.

        Args:
            allergies (list): Patient's known allergies
            suggested_medicines (list): List of medicine dicts

        Returns:
            list: Allergy alert messages
        """
        alerts = []

        if not allergies or not suggested_medicines:
            return alerts

        for med in suggested_medicines:
            med_name = (med.get("brandName") or med.get("genericName") or "").lower()
            composition = (med.get("composition") or "").lower()

            for allergy in allergies:
                allergy_lower = allergy.lower()

                # Check known allergy triggers
                for trigger_key, trigger_data in self.allergy_triggers.items():
                    if trigger_key in allergy_lower:
                        # Check if medicine is in the trigger list
                        for trigger_med in trigger_data.get("medicines", []):
                            if trigger_med.lower() in med_name or trigger_med.lower() in composition:
                                alerts.append(
                                    f"Allergy alert: {med.get('brandName') or med.get('genericName')} "
                                    f"may trigger {allergy} allergy"
                                )

                # Direct name matching
                if allergy_lower in med_name or allergy_lower in composition:
                    alerts.append(
                        f"Allergy alert: Patient has {allergy} allergy — "
                        f"{med.get('brandName') or med.get('genericName')} may contain {allergy}"
                    )

        return alerts

    def check_contraindications(self, existing_diseases, suggested_medicines):
        """
        Check for contraindications based on patient's existing diseases.

        Args:
            existing_diseases (list): Patient's existing medical conditions
            suggested_medicines (list): List of medicine dicts

        Returns:
            list: Contraindication alert messages
        """
        alerts = []

        if not existing_diseases or not suggested_medicines:
            return alerts

        disease_map = {
            "kidney disease": "kidney_disease",
            "kidney": "kidney_disease",
            "liver disease": "liver_disease",
            "liver": "liver_disease",
            "pregnancy": "pregnancy",
            "pregnant": "pregnancy",
        }

        patient_flags = set()
        for disease in existing_diseases:
            disease_lower = disease.lower().strip()
            mapped = disease_map.get(disease_lower)
            if mapped:
                patient_flags.add(mapped)

        if not patient_flags:
            return alerts

        for med in suggested_medicines:
            med_name = (med.get("brandName") or med.get("genericName") or "").lower()
            composition = (med.get("composition") or "").lower()

            for flag in patient_flags:
                contraindicated_meds = self.contradictions.get(flag, [])
                for contra_med in contraindicated_meds:
                    contra_lower = contra_med.lower()
                    if contra_lower in med_name or contra_lower in composition:
                        alerts.append(
                            f"{med.get('brandName') or med.get('genericName')} "
                            f"may be contraindicated due to: {flag.replace('_', ' ')}"
                        )

        return alerts


_checker = None


def get_allergy_checker():
    """Get or create the global AllergyChecker instance."""
    global _checker
    if _checker is None:
        _checker = AllergyChecker()
    return _checker

