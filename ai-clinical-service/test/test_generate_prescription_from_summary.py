import unittest

from generate_prescription_from_summary import parse_summary_for_fields


class TestGeneratePrescriptionFromSummary(unittest.TestCase):
    def test_parse_summary_with_medicine_and_instructions(self):
        summary = (
            "Patient: Rajesh Kumar, 45-year-old male\n"
            "Diagnosis: Acute bronchitis\n"
            "Medicines: Amoxicillin 500mg capsule thrice daily for 7 days, Cetirizine 10mg tablet at night\n"
            "Instructions: Take medicines after food and rest well. Follow up in one week."
        )
        fields = parse_summary_for_fields(summary)

        self.assertEqual(fields["patient_name"], "Rajesh Kumar")
        self.assertIn("Amoxicillin 500mg", fields["medicines"])
        self.assertIn("Cetirizine 10mg", fields["medicines"])
        self.assertIn("Take medicines after food", fields["instructions"])
        self.assertEqual(fields["doctor_name"], "Dr. [Not specified]")

    def test_parse_summary_paragraph_extracts_medicine_and_instructions(self):
        summary = (
            "Patient Rajesh Kumar, 45-year-old male; Diagnosis acute bronchitis; "
            "Prescribed Amoxicillin 500mg capsule thrice daily and Cetirizine 10mg at night; "
            "Instructions take medicines after food and rest well."
        )
        fields = parse_summary_for_fields(summary)

        self.assertEqual(fields["patient_name"], "Rajesh Kumar")
        self.assertIn("Amoxicillin 500mg", fields["medicines"])
        self.assertIn("Cetirizine 10mg", fields["medicines"])
        self.assertIn("take medicines after food", fields["instructions"].lower())


if __name__ == "__main__":
    unittest.main()
