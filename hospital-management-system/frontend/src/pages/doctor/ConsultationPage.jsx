import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, Button, Field } from '../../components/common/ui';
import { AiSuggestedBadge, DoctorApprovedBadge, SeverityBadge } from '../../components/common/StatusBadges';
import * as prescriptionService from '../../services/prescription.service';
import * as emrService from '../../services/emr.service';
import * as prescriptionHistoryService from '../../services/prescription.service';
import * as medicineService from '../../services/medicine.service';
import * as appointmentService from '../../services/appointment.service';
import toast from 'react-hot-toast';
import './ConsultationPage.css';

const emptyMedicine = { brandName: '', composition: '', dosage: '', frequency: '', durationDays: 5, instructions: '', source: 'doctor_added' };

const RECORD_TYPE_LABELS = {
  consultation_note: 'Consultation note',
  lab_report: 'Lab report',
  xray: 'X-ray',
  mri: 'MRI',
  ct_scan: 'CT scan',
  other: 'Other',
};

const emptyRecordForm = { recordType: 'consultation_note', title: '', description: '', fileUrl: '' };

// --- SRS Module 6: Medicine Composition Recommendation Engine ---
// One row of the medicines table: brand-name search-as-you-type +
// a "View alternatives" lookup for same-composition substitute brands.
function MedicineRow({ medicine, index, isApproved, onUpdate, onRemove }) {
  const [query, setQuery] = useState(medicine.brandName || medicine.composition || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [alternatives, setAlternatives] = useState(null);
  const [altLoading, setAltLoading] = useState(false);
  const debounceRef = useRef(null);

  function handleNameChange(value) {
    setQuery(value);
    onUpdate(index, 'brandName', value);
    setAlternatives(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value || value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await medicineService.searchMedicines(value.trim());
        setSuggestions(results || []);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      }
    }, 300);
  }

  function selectSuggestion(med) {
    setQuery(med.brandName);
    onUpdate(index, 'brandName', med.brandName);
    onUpdate(index, 'composition', med.composition);
    onUpdate(index, '_catalogId', med._id);
    setShowSuggestions(false);
    setSuggestions([]);
  }

  async function handleViewAlternatives() {
    const nameToResolve = medicine.brandName || medicine.composition;
    if (!medicine._catalogId && !nameToResolve) {
      toast.error('Enter a medicine name first to see alternatives.');
      return;
    }
    setAltLoading(true);
    try {
      if (medicine._catalogId) {
        const results = await medicineService.getAlternatives(medicine._catalogId);
        setAlternatives(results || []);
      } else {
        // AI-suggested medicines don't carry a catalog id — resolve by name instead.
        const { resolvedId, alternatives: results } = await medicineService.getAlternativesByName(nameToResolve);
        if (resolvedId) onUpdate(index, '_catalogId', resolvedId);
        if (!resolvedId && (!results || results.length === 0)) {
          toast.error(`No catalog match found for "${nameToResolve}".`);
        }
        setAlternatives(results || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load alternatives.');
    } finally {
      setAltLoading(false);
    }
  }

  function switchToAlternative(alt) {
    onUpdate(index, 'brandName', alt.brandName);
    onUpdate(index, 'composition', alt.composition);
    onUpdate(index, '_catalogId', alt._id);
    setQuery(alt.brandName);
    setAlternatives(null);
    toast.success(`Switched to ${alt.brandName}.`);
  }

  return (
    <div style={{ marginBottom: 10 }}>
      <div className="med-row" style={{ position: 'relative' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            placeholder="Brand / composition"
            value={query}
            disabled={isApproved}
            onChange={(e) => handleNameChange(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          />
          {showSuggestions && suggestions.length > 0 && (
            <div
              style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
                background: 'white', border: '1px solid var(--border)', borderRadius: 6,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxHeight: 180, overflowY: 'auto',
              }}
            >
              {suggestions.map((s) => (
                <div
                  key={s._id}
                  onClick={() => selectSuggestion(s)}
                  style={{ padding: '8px 10px', fontSize: 13.5, cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                >
                  <strong>{s.brandName}</strong> — {s.composition}
                </div>
              ))}
            </div>
          )}
        </div>
        <input placeholder="Dosage" value={medicine.dosage || ''} disabled={isApproved} onChange={(e) => onUpdate(index, 'dosage', e.target.value)} />
        <input
          placeholder="Frequency"
          value={medicine.frequency || ''}
          disabled={isApproved}
          onChange={(e) => onUpdate(index, 'frequency', e.target.value)}
        />
        <input
          placeholder="Days"
          type="number"
          value={medicine.durationDays || ''}
          disabled={isApproved}
          onChange={(e) => onUpdate(index, 'durationDays', Number(e.target.value))}
        />
        <span className={`med-row__source med-row__source--${medicine.source}`}>
          {medicine.source === 'ai_suggested' ? 'AI' : 'Added'}
        </span>
        {!isApproved && (
          <button type="button" className="med-row__remove" onClick={() => onRemove(index)}>
            ✕
          </button>
        )}
      </div>

      {!isApproved && (
        <button
          type="button"
          onClick={handleViewAlternatives}
          disabled={altLoading}
          style={{ fontSize: 12, color: 'var(--teal-dark)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', textDecoration: 'underline' }}
        >
          {altLoading ? 'Loading alternatives…' : 'View alternatives (same composition)'}
        </button>
      )}

      {alternatives && (
        <div style={{ fontSize: 13, marginTop: 4, padding: 8, background: 'var(--surface-soft, #f5f5f0)', borderRadius: 6 }}>
          {alternatives.length === 0 ? (
            <span style={{ color: 'var(--ink-soft)' }}>No other brands found with this composition.</span>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {alternatives.map((alt) => (
                <button
                  type="button"
                  key={alt._id}
                  onClick={() => switchToAlternative(alt)}
                  style={{
                    padding: '4px 10px', borderRadius: 14, border: '1px solid var(--border)',
                    background: 'white', cursor: 'pointer', fontSize: 12.5,
                  }}
                >
                  {alt.brandName} ({alt.composition})
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ConsultationPage() {
  const [params] = useSearchParams();
  const appointmentId = params.get('appointmentId') || '';
  const rawPatientId = params.get('patientId');
  const initialPatientId = rawPatientId && rawPatientId !== 'undefined' && rawPatientId !== 'null' ? rawPatientId : '';

  const [patientId, setPatientId] = useState(initialPatientId);

  const [symptoms, setSymptoms] = useState('');

  // Pre-fill symptoms from the appointment's booking-time symptoms so the
  // doctor doesn't have to retype what the patient already entered, and so
  // the AI suggestion is generated from the patient's actual complaint.
  useEffect(() => {
    async function prefillSymptomsFromAppointment() {
      if (!appointmentId) return;
      try {
        const appt = await appointmentService.getAppointmentById(appointmentId);
        if (appt && appt.symptoms) {
          setSymptoms(appt.symptoms);
        }
      } catch (err) {
        // silently ignore — doctor can still type symptoms manually
      }
    }
    prefillSymptomsFromAppointment();
  }, [appointmentId]);

  const [prescription, setPrescription] = useState(null);
  const [finalMedicines, setFinalMedicines] = useState([]);
  const [diagnosis, setDiagnosis] = useState('');
  const [dietAdvice, setDietAdvice] = useState('');
  const [followUpInstructions, setFollowUpInstructions] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [loadingStep, setLoadingStep] = useState(null);

  // --- SRS Module 3: Electronic Medical Records (EMR) state ---
  const [emrHistory, setEmrHistory] = useState(null); // { patientProfile, records }
  const [emrLoading, setEmrLoading] = useState(true);
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [recordForm, setRecordForm] = useState(emptyRecordForm);
  const [savingRecord, setSavingRecord] = useState(false);

  // SRS Module 2.3 — Doctor permission: View Previous Prescriptions.
  const [previousPrescriptions, setPreviousPrescriptions] = useState([]);
  const [prescHistoryLoading, setPrescHistoryLoading] = useState(true);

  useEffect(() => {
    async function loadPrescriptionHistory() {
      if (!patientId) {
        setPrescHistoryLoading(false);
        return;
      }
      try {
        const data = await prescriptionHistoryService.getPatientPrescriptionHistory(patientId);
        setPreviousPrescriptions(data || []);
      } catch {
        setPreviousPrescriptions([]);
      } finally {
        setPrescHistoryLoading(false);
      }
    }
    loadPrescriptionHistory();
  }, [patientId]);

  useEffect(() => {
    async function loadHistory() {
      if (!patientId) {
        // If patientId is missing but appointmentId exists, fetch appointment and derive patient
        if (appointmentId) {
          try {
            const appt = await appointmentService.getAppointmentById(appointmentId);
            if (appt && appt.patient && appt.patient._id) {
              setPatientId(appt.patient._id);
              // continue to load history using the newly set patientId
            } else {
              setEmrLoading(false);
              return;
            }
          } catch (err) {
            toast.error(err.response?.data?.message || 'Could not load appointment details.');
            setEmrLoading(false);
            return;
          }
        } else {
          setEmrLoading(false);
          return;
        }
      }
      try {
        const data = await emrService.getPatientHistory(patientId);
        setEmrHistory(data);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Could not load patient medical history.');
      } finally {
        setEmrLoading(false);
      }
    }
    loadHistory();
  }, [patientId]);

  async function handleAddRecord(e) {
    e.preventDefault();
    setSavingRecord(true);
    try {
      await emrService.addRecord(patientId, recordForm);
      const refreshed = await emrService.getPatientHistory(patientId);
      setEmrHistory(refreshed);
      setRecordForm(emptyRecordForm);
      setShowAddRecord(false);
      toast.success('Record added to patient history.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not add record.');
    } finally {
      setSavingRecord(false);
    }
  }

  // --- SRS Module 7: AI Voice Assistant state ---
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [notesLoading, setNotesLoading] = useState(false);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef(''); // accumulates final results across the session

  function isSpeechRecognitionSupported() {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }

  function startRecording() {
    if (!isSpeechRecognitionSupported()) {
      toast.error('Voice capture is not supported in this browser. Try Chrome.');
      return;
    }

    const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionImpl();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPiece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          transcriptRef.current += `${transcriptPiece} `;
        } else {
          interim += transcriptPiece;
        }
      }
      setLiveTranscript(transcriptRef.current + interim);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        toast.error('Microphone access denied. Allow microphone permission to capture the conversation.');
      }
    };

    recognition.onend = () => {
      if (isRecording) {
        try {
          recognition.start();
        } catch {
          /* ignore double-start race */
        }
      }
    };

    recognitionRef.current = recognition;
    transcriptRef.current = '';
    setLiveTranscript('');
    setIsRecording(true);
    recognition.start();
    toast.success('Listening… speak naturally during the consultation.');
  }

  function stopRecording() {
    setIsRecording(false);
    recognitionRef.current?.stop();
  }

  async function handleGenerateNotes() {
    if (!transcriptRef.current.trim()) {
      toast.error('No conversation captured yet. Record the consultation first.');
      return;
    }
    setNotesLoading(true);
    try {
      const updated = await prescriptionService.addConsultationNotes(prescription._id, transcriptRef.current);
      setPrescription(updated);
      toast.success('Clinical notes generated from the conversation.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not generate clinical notes.');
    } finally {
      setNotesLoading(false);
    }
  }

  async function handleGenerateAi(e) {
    e.preventDefault();
    setLoadingStep('ai');
    try {
      const draft = await prescriptionService.createDraft({ appointmentId, patientId, symptoms, labReports: [] });
      setPrescription(draft);
      setDiagnosis(draft.aiRecommendation?.probableDiagnoses?.[0]?.diagnosis || '');
      setFinalMedicines(
        (draft.aiRecommendation?.medicineSuggestions || []).map((m) => ({ ...m, source: 'ai_suggested' }))
      );
      setDietAdvice((draft.aiRecommendation?.clinicalAdvice?.dietRecommendations || []).join(', '));
      setFollowUpInstructions((draft.aiRecommendation?.clinicalAdvice?.followUpSuggestions || []).join(', '));
      toast.success('AI clinical suggestions generated. Review before approving.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not generate AI suggestion.');
    } finally {
      setLoadingStep(null);
    }
  }

  function updateMedicine(index, field, value) {
    setFinalMedicines((meds) => meds.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  }

  function removeMedicine(index) {
    setFinalMedicines((meds) => meds.filter((_, i) => i !== index));
  }

  function addMedicine() {
    setFinalMedicines((meds) => [...meds, { ...emptyMedicine }]);
  }

  async function handleSaveReview() {
    setLoadingStep('review');
    try {
      const updated = await prescriptionService.reviewDraft(prescription._id, {
        finalMedicines,
        finalAdvice: { dietAdvice, exerciseAdvice: '', followUpInstructions },
        diagnosis: { primary: diagnosis, secondary: [] },
        followUpDate: followUpDate || null,
        changesSummary: 'Doctor reviewed AI suggestion and finalized medicines/advice.',
      });
      setPrescription(updated);
      toast.success('Saved. Ready for approval.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save review.');
    } finally {
      setLoadingStep(null);
    }
  }

  async function handleApprove() {
    setLoadingStep('approve');
    try {
      const approved = await prescriptionService.approvePrescription(prescription._id);
      setPrescription(approved);
      toast.success('Prescription approved.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed.');
    } finally {
      setLoadingStep(null);
    }
  }

  async function handleGenerateAndShare() {
    setLoadingStep('generate');
    try {
      const generated = await prescriptionService.generatePrescription(prescription._id);
      const shared = await prescriptionService.sharePrescription(generated._id, ['patient_portal', 'sms_link']);
      setPrescription(shared);
      toast.success('Prescription generated and shared with patient.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not generate/share.');
    } finally {
      setLoadingStep(null);
    }
  }

  const isApproved = ['doctor_approved', 'prescription_generated', 'shared_with_patient'].includes(prescription?.status);
  const ai = prescription?.aiRecommendation;
  const notes = prescription?.consultationNotes;

  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>Consultation</h1>
      <p style={{ color: 'var(--ink-soft)', marginBottom: 24 }}>
        Review the patient, generate an AI-assisted suggestion, then finalize and approve before anything reaches the patient.
      </p>

      {/* SRS Module 3 — Electronic Medical Records (EMR) */}
      <Card className="consult-panel" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3>Patient medical history</h3>
          <Button variant="secondary" size="sm" onClick={() => setShowAddRecord((v) => !v)}>
            {showAddRecord ? 'Cancel' : '+ Add record'}
          </Button>
        </div>

        {emrLoading && <p style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>Loading history…</p>}

        {!emrLoading && emrHistory?.patientProfile && (
          <div style={{ fontSize: 13.5, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {emrHistory.patientProfile.allergies?.length > 0 && (
              <p><strong>Allergies:</strong> {emrHistory.patientProfile.allergies.join(', ')}</p>
            )}
            {emrHistory.patientProfile.existingDiseases?.length > 0 && (
              <p><strong>Existing conditions:</strong> {emrHistory.patientProfile.existingDiseases.join(', ')}</p>
            )}
            {emrHistory.patientProfile.chronicMedications?.length > 0 && (
              <p><strong>Current medications:</strong> {emrHistory.patientProfile.chronicMedications.join(', ')}</p>
            )}
          </div>
        )}

        {showAddRecord && (
          <form onSubmit={handleAddRecord} style={{ marginBottom: 16, padding: 12, border: '1px solid var(--border)', borderRadius: 8 }}>
            <Field label="Record type">
              <select value={recordForm.recordType} onChange={(e) => setRecordForm((f) => ({ ...f, recordType: e.target.value }))}>
                {Object.entries(RECORD_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </Field>
            <Field label="Title">
              <input
                required
                value={recordForm.title}
                onChange={(e) => setRecordForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. CBC report, Chest X-ray"
              />
            </Field>
            <Field label="Description">
              <textarea
                rows={2}
                value={recordForm.description}
                onChange={(e) => setRecordForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Findings, notes, or summary"
              />
            </Field>
            <Field label="File URL (optional)">
              <input
                value={recordForm.fileUrl}
                onChange={(e) => setRecordForm((f) => ({ ...f, fileUrl: e.target.value }))}
                placeholder="Link to uploaded report/scan"
              />
            </Field>
            <Button type="submit" disabled={savingRecord}>
              {savingRecord ? 'Saving…' : 'Save record'}
            </Button>
          </form>
        )}

        {!emrLoading && (!emrHistory?.records || emrHistory.records.length === 0) && (
          <p style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>No past records on file for this patient.</p>
        )}

        {!emrLoading && emrHistory?.records?.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {emrHistory.records.map((r) => (
              <div key={r._id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
                  <strong>{r.title}</strong>
                  <span style={{ color: 'var(--ink-soft)' }}>{RECORD_TYPE_LABELS[r.recordType] || r.recordType}</span>
                </div>
                {r.description && <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 2 }}>{r.description}</p>}
                <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>
                  {new Date(r.recordDate).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}

        <strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>Previous prescriptions</strong>
        {prescHistoryLoading && <p style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>Loading prescription history…</p>}
        {!prescHistoryLoading && previousPrescriptions.length === 0 && (
          <p style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>No previous prescriptions on file for this patient.</p>
        )}
        {!prescHistoryLoading && previousPrescriptions.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {previousPrescriptions.map((p) => (
              <div key={p._id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
                  <strong>{p.diagnosis?.primary || 'Diagnosis on file'}</strong>
                  <span style={{ color: 'var(--ink-soft)' }}>
                    {p.approval?.approvedAt ? new Date(p.approval.approvedAt).toLocaleDateString() : ''}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 2 }}>
                  {(p.finalMedicines || []).map((m) => m.brandName || m.genericName).join(', ') || 'No medicines on file'}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {!prescription && (
        <Card style={{ maxWidth: 560 }}>
          <form onSubmit={handleGenerateAi}>
            <Field label="Current symptoms / chief complaint">
              <textarea rows={3} required value={symptoms} onChange={(e) => setSymptoms(e.target.value)} />
            </Field>
            <Button type="submit" disabled={loadingStep === 'ai'} size="lg" style={{ width: '100%' }}>
              {loadingStep === 'ai' ? 'Analyzing patient data…' : 'Generate AI clinical suggestion'}
            </Button>
          </form>
        </Card>
      )}

      {prescription && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {ai && (
            <Card className="consult-panel consult-panel--ai">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <h3>AI clinical decision support</h3>
                <AiSuggestedBadge />
              </div>

              {ai.probableDiagnoses?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <strong style={{ fontSize: 13 }}>Probable diagnoses</strong>
                  <ul style={{ margin: '6px 0', paddingLeft: 18, fontSize: 13.5 }}>
                    {ai.probableDiagnoses.map((d, i) => (
                      <li key={i}>
                        {d.diagnosis} {d.confidence ? `(${Math.round(d.confidence * 100)}% confidence)` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(ai.allergyAlerts?.length > 0 || ai.contraindicationAlerts?.length > 0 || ai.interactionWarnings?.length > 0) && (
                <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {ai.allergyAlerts?.map((a, i) => (
                    <SeverityBadge key={`al-${i}`} severity="severe">
                      ⚠ {a}
                    </SeverityBadge>
                  ))}
                  {ai.contraindicationAlerts?.map((a, i) => (
                    <SeverityBadge key={`co-${i}`} severity="moderate">
                      ⚠ {a}
                    </SeverityBadge>
                  ))}
                  {ai.interactionWarnings?.map((w, i) => (
                    <SeverityBadge key={`in-${i}`} severity={w.severity}>
                      {w.description}
                    </SeverityBadge>
                  ))}
                </div>
              )}

              <p style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                These are suggestions only. Nothing here reaches the patient until you review, finalize, and approve below.
              </p>
            </Card>
          )}

          {/* SRS Module 7 — AI Voice Assistant / Conversation Capture / Auto Clinical Notes */}
          <Card className="consult-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3>Consultation notes (voice assistant)</h3>
              {isRecording && (
                <span style={{ fontSize: 12, color: '#b91c1c', fontWeight: 600 }}>● Recording…</span>
              )}
            </div>

            <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 12 }}>
              Capture the doctor-patient conversation, then generate structured clinical notes from it. This is
              working material for you only — it is never shown to the patient.
            </p>

            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              {!isRecording ? (
                <Button variant="secondary" onClick={startRecording} disabled={isApproved}>
                  🎙 Record conversation
                </Button>
              ) : (
                <Button variant="secondary" onClick={stopRecording}>
                  ■ Stop recording
                </Button>
              )}
              <Button onClick={handleGenerateNotes} disabled={notesLoading || isRecording || isApproved}>
                {notesLoading ? 'Generating notes…' : 'Generate clinical notes'}
              </Button>
            </div>

            {liveTranscript && (
              <Field label="Live transcript">
                <textarea rows={4} readOnly value={liveTranscript} />
              </Field>
            )}

            {notes?.structuredNotes && (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <strong style={{ fontSize: 13 }}>Chief complaint</strong>
                  <p style={{ fontSize: 13.5, margin: '4px 0' }}>{notes.structuredNotes.chiefComplaint}</p>
                </div>
                <div>
                  <strong style={{ fontSize: 13 }}>History of present illness</strong>
                  <p style={{ fontSize: 13.5, margin: '4px 0' }}>{notes.structuredNotes.historyOfPresentIllness}</p>
                </div>
                <div>
                  <strong style={{ fontSize: 13 }}>Observations</strong>
                  <p style={{ fontSize: 13.5, margin: '4px 0' }}>{notes.structuredNotes.observations}</p>
                </div>
                <div>
                  <strong style={{ fontSize: 13 }}>Plan</strong>
                  <p style={{ fontSize: 13.5, margin: '4px 0' }}>{notes.structuredNotes.plan}</p>
                </div>
              </div>
            )}
          </Card>

          <Card className="consult-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3>Your final prescription</h3>
              {isApproved && <DoctorApprovedBadge approvedAt={prescription.approval?.approvedAt} />}
            </div>

            <Field label="Diagnosis">
              <input value={diagnosis} disabled={isApproved} onChange={(e) => setDiagnosis(e.target.value)} />
            </Field>

            <div style={{ marginBottom: 12 }}>
              <strong style={{ fontSize: 13 }}>Medicines</strong>
              {finalMedicines.map((m, i) => (
                <MedicineRow
                  key={i}
                  medicine={m}
                  index={i}
                  isApproved={isApproved}
                  onUpdate={updateMedicine}
                  onRemove={removeMedicine}
                />
              ))}
              {!isApproved && (
                <Button variant="secondary" size="sm" onClick={addMedicine} style={{ marginTop: 8 }}>
                  + Add medicine
                </Button>
              )}
            </div>

            <Field label="Diet advice">
              <input value={dietAdvice} disabled={isApproved} onChange={(e) => setDietAdvice(e.target.value)} />
            </Field>
            <Field label="Follow-up instructions">
              <input value={followUpInstructions} disabled={isApproved} onChange={(e) => setFollowUpInstructions(e.target.value)} />
            </Field>
            <Field label="Follow-up date">
              <input
                type="date"
                value={followUpDate}
                disabled={isApproved}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
            </Field>

            {!isApproved && (
              <div style={{ display: 'flex', gap: 10 }}>
                <Button variant="secondary" onClick={handleSaveReview} disabled={loadingStep === 'review'}>
                  {loadingStep === 'review' ? 'Saving…' : 'Save review'}
                </Button>
                <Button onClick={handleApprove} disabled={loadingStep === 'approve' || finalMedicines.length === 0}>
                  {loadingStep === 'approve' ? 'Approving…' : 'Approve prescription'}
                </Button>
              </div>
            )}

            {prescription.status === 'doctor_approved' && (
              <Button onClick={handleGenerateAndShare} disabled={loadingStep === 'generate'} style={{ marginTop: 12 }}>
                {loadingStep === 'generate' ? 'Generating…' : 'Generate & share with patient'}
              </Button>
            )}

            {prescription.status === 'shared_with_patient' && (
              <p style={{ marginTop: 12, fontSize: 13, color: 'var(--teal-dark)', fontWeight: 600 }}>
                ✓ Shared with patient — {prescription.prescriptionNumber}
              </p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
