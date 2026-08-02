"""
Drug Interaction Checker.
Checks for potential interactions between suggested medicines
and a patient's current medications.
"""

import re


class InteractionChecker:
    """
    Checks for drug-drug interactions using the knowledge base.
    """

    def __init__(self, interaction_map=None):
        self.interaction_map = interaction_map or {}

    def set_interaction_map(self, interaction_map):
        """Set the interaction map data."""
        self.interaction_map = interaction_map

    def check_interactions(self, suggested_medicines, current_medications=None):
        """
        Check interactions between suggested medicines and current medications.

        Args:
            suggested_medicines (list): List of medicine dicts with 'composition' key
            current_medications (list, optional): List of current medication names

        Returns:
            list: Interaction warnings with severity, description
        """
        warnings = []

        if not suggested_medicines:
            return warnings

        current_medications = current_medications or []

        # Check interactions between suggested medicines
        for i, med1 in enumerate(suggested_medicines):
            comp1 = self._extract_base_composition(med1.get("composition", ""))
            name1 = med1.get("brandName") or med1.get("genericName") or comp1

            # Check with other suggested medicines
            for j, med2 in enumerate(suggested_medicines):
                if j <= i:
                    continue
                comp2 = self._extract_base_composition(med2.get("composition", ""))
                name2 = med2.get("brandName") or med2.get("genericName") or comp2
                warnings.extend(
                    self._check_pair(comp1, name1, comp2, name2)
                )

            # Check with current medications
            for curr_med in current_medications:
                warnings.extend(
                    self._check_pair(comp1, name1, curr_med, curr_med)
                )

        return warnings

    def _extract_base_composition(self, composition_str):
        """Extract base drug name from composition string."""
        if not composition_str:
            return ""

        # Remove dosage info (e.g., "Paracetamol 650mg" -> "Paracetamol")
        match = re.match(r'^([A-Za-z\s\-]+)', composition_str)
        if match:
            return match.group(1).strip().lower()
        return composition_str.lower()

    def _check_pair(self, comp1, name1, comp2, name2):
        """Check interaction between two medicines."""
        warnings = []

        if not comp1 or not comp2:
            return warnings

        # Check in interaction map
        for med_name, interaction_data in self.interaction_map.items():
            med_name_lower = med_name.lower()

            # Check if med1 matches this entry
            if med_name_lower in comp1 or med_name_lower in name1.lower():
                for interaction in interaction_data.get("interacts_with", []):
                    target_comp = interaction.get("composition", "").lower()
                    if target_comp and (target_comp in comp2 or target_comp in name2.lower()):
                        warnings.append({
                            "severity": interaction.get("severity", "moderate"),
                            "description": f"{name1} + {name2}: {interaction.get('note', 'Potential interaction')}",
                        })

            # Check if med2 matches this entry
            if med_name_lower in comp2 or med_name_lower in name2.lower():
                for interaction in interaction_data.get("interacts_with", []):
                    target_comp = interaction.get("composition", "").lower()
                    if target_comp and (target_comp in comp1 or target_comp in name1.lower()):
                        warnings.append({
                            "severity": interaction.get("severity", "moderate"),
                            "description": f"{name2} + {name1}: {interaction.get('note', 'Potential interaction')}",
                        })

        return warnings


_checker = None


def get_interaction_checker():
    """Get or create the global InteractionChecker instance."""
    global _checker
    if _checker is None:
        _checker = InteractionChecker()
    return _checker

