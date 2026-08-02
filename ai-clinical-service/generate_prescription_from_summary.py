"""
Simple utility to:
  1) Read a meeting transcript (or other text file)
  2) Produce a short summary and write it to summary.txt
  3) Read summary.txt and extract common prescription fields
  4) Fill a doctor prescription template file (doctor_prescription_template.txt)
  5) Write the filled prescription to prescription_output.txt

Place the transcript file next to this script or pass its path as an argument.
This script uses very simple heuristics to extract fields from the summary: it
recognizes lines containing key: value pairs (e.g. "Patient: John Doe"), or
common keywords (Patient, Age, Diagnosis, Medications, Doctor). If such keys
are not present, the script will place the summary into the "notes" field and
use sensible defaults for other placeholders.

This is intended as a lightweight helper to automate steps 2-4 requested by the user.
"""

from __future__ import annotations
import re
import sys
from datetime import datetime
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
DEFAULT_TRANSCRIPT = SCRIPT_DIR / "transcript.txt"
SUMMARY_FILE = SCRIPT_DIR / "summary.txt"
TEMPLATE_FILE = SCRIPT_DIR / "doctor_prescription_template.txt"
OUTPUT_FILE = SCRIPT_DIR / "prescription_output.txt"


def summarize_text(text: str, max_sentences: int = 3) -> str:
    # Very small heuristic summarizer: split into sentences and take first N informative ones
    # Split on .!? keeping them
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    # Filter out very short fragments
    sentences = [s.strip() for s in sentences if len(s.strip()) > 20]
    if not sentences:
        return text.strip()[:1000]
    return ' '.join(sentences[:max_sentences])


def write_summary(summary: str, path: Path = SUMMARY_FILE) -> None:
    path.write_text(summary, encoding="utf-8")
    print(f"Wrote summary to {path}")


def parse_summary_for_fields(summary: str) -> dict:
    # Look for key: value pairs first
    fields = {
        "date": datetime.now().strftime("%Y-%m-%d"),
        "patient_name": "Unknown",
        "age_sex": "",
        "diagnosis": "",
        "medicines": "",
        "instructions": "",
        "notes": "",
        "doctor_name": "Dr. [Not specified]",
    }

    # Normalize line endings and iterate lines
    lines = [l.strip() for l in summary.splitlines() if l.strip()]

    # If the summary is just a paragraph, also try to split into pseudo-lines by semicolon
    if len(lines) == 1 and (";" in lines[0] or "," in lines[0][:200]):
        # keep it simple; don't aggressively split here
        pass

    # 1) key: value detection
    for line in lines:
        m = re.match(r"^(?P<k>[A-Za-z ]{2,30})\s*:\s*(?P<v>.+)$", line)
        if m:
            key = m.group("k").strip().lower()
            val = m.group("v").strip()
            if "patient" in key and fields["patient_name"] == "Unknown":
                fields["patient_name"] = val
            elif key in ("age", "age/sex", "age / sex"):
                fields["age_sex"] = val
            elif "diagnos" in key:
                fields["diagnosis"] = val
            elif "medic" in key or "drug" in key:
                fields["medicines"] = val
            elif "instruction" in key or "direction" in key:
                fields["instructions"] = val
            elif "doctor" in key or "prescrib" in key:
                fields["doctor_name"] = val
            else:
                # append to notes if not recognized
                fields["notes"] += (val + " ")

    # 2) Keyword heuristics if some fields are still empty
    lower = summary.lower()
    if not fields["diagnosis"]:
        # Try to extract sentence containing words like diagnosis, probable, dx
        m = re.search(r"([^.?!]*\b(diagnos|probable|dx|likely)\b[^.?!]*[.?!])", summary, re.IGNORECASE)
        if m:
            fields["diagnosis"] = m.group(0).strip()

    if not fields["medicines"]:
        # search for keywords and capturing following text
        m = re.search(r"medicat(?:ion|ions|ions:)\s*[:]?\s*(.+)", summary, re.IGNORECASE)
        if m:
            fields["medicines"] = m.group(1).strip()
        else:
            # try to find lines that look like a list of medicines (comma separated or lines starting with -)
            meds = []
            for line in lines:
                if re.match(r"^[\-•]\s*\w+", line):
                    meds.append(line.lstrip("-• "))
                elif any(k in line.lower() for k in ("tabs", "mg", "tablet", "cap", "syrup")):
                    meds.append(line)
            if meds:
                fields["medicines"] = "\n".join(meds)

    # 3) If nothing identified, put summary into notes
    if not any((fields["diagnosis"], fields["medicines"], fields["instructions"])):
        fields["notes"] = summary
    else:
        # keep any leftover lines not consumed as notes
        # Append lines that aren't key-value and aren't captured above
        pass

    # Trim spaces
    for k in fields:
        fields[k] = fields[k].strip()

    # If patient_name still unknown, try to find "patient <name>" pattern
    if fields["patient_name"] == "Unknown":
        m = re.search(r"patient\s+([A-Z][a-z]+\s+[A-Z][a-z]+)", summary)
        if m:
            fields["patient_name"] = m.group(1)

    # As final fallback, put first 120 chars of summary in notes
    if not fields["notes"]:
        fields["notes"] = (summary.strip()[:400]).strip()

    return fields


def fill_template(template_text: str, fields: dict) -> str:
    out = template_text
    for k, v in fields.items():
        out = out.replace("{{" + k + "}}", v if v else "")
    return out


def main(argv: list[str] | None = None):
    argv = argv or sys.argv[1:]
    transcript_path = Path(argv[0]) if argv else DEFAULT_TRANSCRIPT

    if not transcript_path.exists():
        print(f"Transcript file not found: {transcript_path}")
        print("Create a file named 'transcript.txt' next to this script or pass a path to a transcript.")
        return 1

    raw = transcript_path.read_text(encoding="utf-8")
    summary = summarize_text(raw)
    write_summary(summary, SUMMARY_FILE)

    summary_text = SUMMARY_FILE.read_text(encoding="utf-8")
    fields = parse_summary_for_fields(summary_text)

    if not TEMPLATE_FILE.exists():
        print(f"Template file not found at {TEMPLATE_FILE}. Please create doctor_prescription_template.txt next to this script.")
        # Still create a simple filled output using internal default template
        default_template = """
Doctor Prescription

Date: {{date}}
Patient Name: {{patient_name}}
Age / Sex: {{age_sex}}
Diagnosis: {{diagnosis}}

Medicines:
{{medicines}}

Instructions:
{{instructions}}

Additional Notes:
{{notes}}

Prescribing Doctor: {{doctor_name}}
"""
        filled = fill_template(default_template, fields)
    else:
        template_text = TEMPLATE_FILE.read_text(encoding="utf-8")
        filled = fill_template(template_text, fields)

    OUTPUT_FILE.write_text(filled, encoding="utf-8")
    print(f"Wrote filled prescription to {OUTPUT_FILE}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
