"""
Simple utility to:
  1) Read a meeting transcript (or other text file)
  2) Produce a short summary and write it to summary.txt
  3) Read summary.txt and extract common prescription fields
  4) Fill a doctor prescription template file (doctor_prescription_template.txt)
  5) Write the filled prescription to prescription_output.txt

Place the transcript file next to this script or pass its path as an argument.
This script uses a Gemini API call for summarization when the GEMINI_API_KEY
environment variable is set. When no key is configured, it falls back to a
simple local summarizer.

This script uses very simple heuristics to extract fields from the summary: it
recognizes lines containing key: value pairs (e.g. "Patient: John Doe"), or
common keywords (Patient, Age, Diagnosis, Medications, Doctor). If such keys
are not present, the script will place the summary into the "notes" field and
use sensible defaults for other placeholders.

This is intended as a lightweight helper to automate steps 2-4 requested by the user.
"""

from __future__ import annotations
import argparse
import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

SCRIPT_DIR = Path(__file__).parent
DEFAULT_TRANSCRIPT = SCRIPT_DIR / "transcript.txt"
SUMMARY_FILE = SCRIPT_DIR / "summary.txt"
TEMPLATE_FILE = SCRIPT_DIR / "doctor_prescription_template.txt"
OUTPUT_FILE = SCRIPT_DIR / "prescription_output.txt"


def call_gemini_summary(prompt: str, api_key: str, model: str = "gemini-3.1-flash-lite") -> str:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    body = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt}],
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 512,
        },
    }
    request = Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Content-Type": "application/json; charset=utf-8",
            "Accept": "application/json",
        },
        method="POST",
    )

    try:
        with urlopen(request, timeout=30) as response:
            raw_response = response.read().decode("utf-8")
            data = json.loads(raw_response)
    except (HTTPError, URLError, ValueError) as error:
        print(f"Gemini request failed: {error}")
        return ""

    candidate = None
    if isinstance(data.get("candidates"), list) and data["candidates"]:
        candidate = data["candidates"][0]
    elif isinstance(data.get("output"), dict):
        candidate = data["output"]
    elif isinstance(data.get("error"), dict):
        print(f"Gemini API returned error: {data['error']}")
        return ""

    if not candidate:
        print("Gemini response did not contain a valid candidate.")
        print(f"Raw response: {json.dumps(data)[:400]}")
        return ""

    def extract_text(item):
        if not isinstance(item, dict):
            return ""
        if "parts" in item and isinstance(item["parts"], list) and item["parts"]:
            first_part = item["parts"][0]
            if isinstance(first_part, dict) and "text" in first_part:
                return first_part["text"].strip()
        if "content" in item:
            if isinstance(item["content"], list):
                return "\n".join(extract_text(child) for child in item["content"] if isinstance(child, dict))
            return extract_text(item["content"])
        if "text" in item:
            return str(item["text"]).strip()
        return ""

    text = extract_text(candidate)
    if not text:
        print("Gemini response contained no text content.")
        print(f"Raw response: {json.dumps(data)[:400]}")
    return text.strip()


def normalize_summary_line(line: str) -> str:
    line = line.strip()
    line = re.sub(r'^[\*\-\+•\s]+', '', line)
    line = line.replace('**', '')
    line = line.replace('`', '')
    return line.strip()


def summarize_text(text: str, max_sentences: int = 3) -> str:
    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key:
        prompt = (
            "You are a clinical summarization assistant.\n"
            "Read the transcript below and produce ONLY a short bullet-point summary.\n"
            "Do not repeat the transcript verbatim, and do not include the full text.\n"
            "Return only concise bullet points.\n"
            "If the transcript includes a prescribing doctor, include it as a bullet like `Doctor: Dr. Name`.\n\n"
            f"Transcript:\n\n{text}\n"
        )
        gemini_summary = call_gemini_summary(
            prompt,
            api_key,
            os.environ.get("GEMINI_MODEL", "gemini-3.1-flash-lite"),
        )
        if gemini_summary:
            normalized_summary = " ".join(gemini_summary.split())
            normalized_text = " ".join(text.split())
            if normalized_summary == normalized_text or normalized_text in normalized_summary:
                print("Gemini returned the transcript text unchanged; falling back to the local summarizer.")
            else:
                return gemini_summary

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


def find_doctor_name(text: str) -> str | None:
    text = text.strip()
    m = re.search(r"\bDr\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*", text)
    if m:
        return m.group(0)
    m = re.search(r"\bDoctor\s*[:\-]\s*([A-Z][A-Za-z\.\s]+)", text)
    if m:
        return m.group(1).strip()
    return None


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
    lines = [normalize_summary_line(l) for l in summary.splitlines() if l.strip()]

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
            if "patient" in key:
                parts = [part.strip() for part in val.split(",") if part.strip()]
                fields["patient_name"] = parts[0] if parts else val
                if len(parts) > 1:
                    age_sex_match = re.search(r"(\d+)-year-old\s+(male|female|other)", val, re.IGNORECASE)
                    if age_sex_match:
                        fields["age_sex"] = f"{age_sex_match.group(1)} / {age_sex_match.group(2).capitalize()}"
            elif key in ("age", "age/sex", "age / sex"):
                fields["age_sex"] = val
            elif "diagnos" in key:
                fields["diagnosis"] = val
            elif "treatment" in key or "medic" in key or "drug" in key or "medications" in key:
                fields["medicines"] = val
            elif "guidance" in key or "instruction" in key or "direction" in key:
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

    # If doctor_name still unknown, try to find a doctor pattern in the summary
    if fields["doctor_name"] == "Dr. [Not specified]":
        doctor_name = find_doctor_name(summary)
        if doctor_name:
            fields["doctor_name"] = doctor_name

    # As final fallback, put first 120 chars of summary in notes
    if not fields["notes"]:
        fields["notes"] = (summary.strip()[:400]).strip()

    return fields


def fill_template(template_text: str, fields: dict) -> str:
    out = template_text
    for k, v in fields.items():
        out = out.replace("{{" + k + "}}", v if v else "")
    return out


def parse_args(argv: list[str] | None = None):
    parser = argparse.ArgumentParser(
        description="Generate prescription output from a meeting transcript using Gemini summarization."
    )
    parser.add_argument(
        "transcript",
        nargs="?",
        default=str(DEFAULT_TRANSCRIPT),
        help="Path to the transcript file",
    )
    parser.add_argument(
        "--gemini-key",
        dest="gemini_key",
        default=None,
        help="Gemini API key to use for summarization",
    )
    parser.add_argument(
        "--gemini-model",
        dest="gemini_model",
        default=None,
        help="Gemini model to use (default: gemini-3.1-flash-lite)",
    )
    parser.add_argument(
        "--doctor-name",
        dest="doctor_name",
        default=None,
        help="Optional prescribing doctor name to use when the transcript does not include one",
    )
    parser.add_argument(
        "--show-summary",
        action="store_true",
        help="Print the generated summary after writing it",
    )
    parser.add_argument(
        "--show-prescription",
        action="store_true",
        help="Print the filled prescription output after writing it",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None):
    args = parse_args(argv)
    transcript_path = Path(args.transcript)

    if args.gemini_key:
        os.environ["GEMINI_API_KEY"] = args.gemini_key
    if args.gemini_model:
        os.environ["GEMINI_MODEL"] = args.gemini_model

    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key:
        print("Using Gemini summarization with GEMINI_API_KEY.")
        if args.gemini_model:
            print(f"Using Gemini model: {args.gemini_model}")
        else:
            print(f"Using Gemini model: {os.environ.get('GEMINI_MODEL', 'gemini-3.1-flash-lite')}")
    else:
        print("No GEMINI_API_KEY found; using local fallback summarizer.")

    if not transcript_path.exists():
        print(f"Transcript file not found: {transcript_path}")
        print("Create a file named 'transcript.txt' next to this script or pass a path to a transcript.")
        return 1

    raw = transcript_path.read_text(encoding="utf-8")
    summary = summarize_text(raw)
    write_summary(summary, SUMMARY_FILE)

    summary_text = SUMMARY_FILE.read_text(encoding="utf-8")
    fields = parse_summary_for_fields(summary_text)

    if fields["doctor_name"] == "Dr. [Not specified]":
        possible_doctor = find_doctor_name(raw)
        if possible_doctor:
            fields["doctor_name"] = possible_doctor

    if args.doctor_name and fields["doctor_name"] == "Dr. [Not specified]":
        fields["doctor_name"] = args.doctor_name

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

    if args.show_summary:
        print("\nGenerated Summary:\n")
        print(summary_text)

    if args.show_prescription:
        print("\nGenerated Prescription Output:\n")
        print(filled)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
