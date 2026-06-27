import { useState, useEffect } from 'react';
import { Card, Button, Field } from '../../components/common/ui';
import * as appointmentService from '../../services/appointment.service';
import toast from 'react-hot-toast';

const TIME_SLOTS = ['09:00-09:15', '09:15-09:30', '09:30-09:45', '10:00-10:15', '10:15-10:30', '11:00-11:15', '14:00-14:15', '15:00-15:15'];

const emptyNewPatient = { fullName: '', email: '', mobileNumber: '', dob: '', gender: 'male', bloodGroup: 'unknown' };

export default function RegisterWalkInPage() {
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);

  // SRS Module 2.2 — Receptionist permission: Register Walk-in Patients.
  // Toggle between "existing patient" (lookup by ID) and "new patient"
  // (register them on the spot) — previously only the existing-patient
  // path worked, which left walk-ins with no account stuck.
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [newPatient, setNewPatient] = useState(emptyNewPatient);
  const [registering, setRegistering] = useState(false);

  const [form, setForm] = useState({
    patientId: '',
    branchId: '',
    departmentId: '',
    doctorId: '',
    appointmentDate: new Date().toISOString().slice(0, 10),
    timeSlot: '',
    symptoms: '',
    isWalkIn: true,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    appointmentService.getBranches().then(setBranches).catch(() => setBranches([]));
  }, []);

  useEffect(() => {
    if (!form.branchId) return setDepartments([]);
    appointmentService.getDepartments(form.branchId).then(setDepartments).catch(() => setDepartments([]));
  }, [form.branchId]);

  useEffect(() => {
    if (!form.departmentId) return setDoctors([]);
    appointmentService.getDoctors(form.departmentId).then(setDoctors).catch(() => setDoctors([]));
  }, [form.departmentId]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function updateNewPatient(field, value) {
    setNewPatient((p) => ({ ...p, [field]: value }));
  }

  // Registers the new patient first, then uses the returned patient _id
  // to continue with the same booking flow as an existing patient.
  async function handleRegisterNewPatient() {
    if (!newPatient.fullName || !newPatient.mobileNumber) {
      toast.error('Full name and mobile number are required to register a new patient.');
      return null;
    }
    setRegistering(true);
    try {
      const result = await appointmentService.registerWalkInPatient(newPatient);
      toast.success(`Patient registered: ${result.patient.patientCode}`);
      return result.patient._id;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not register the new patient.');
      return null;
    } finally {
      setRegistering(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      let patientId = form.patientId;

      if (isNewPatient) {
        const newPatientId = await handleRegisterNewPatient();
        if (!newPatientId) {
          setSubmitting(false);
          return;
        }
        patientId = newPatientId;
      }

      const apt = await appointmentService.bookAppointment({ ...form, patientId });
      toast.success(`Walk-in registered: ${apt.appointmentNumber}`);
      setForm((f) => ({ ...f, patientId: '', symptoms: '', timeSlot: '' }));
      setNewPatient(emptyNewPatient);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not register walk-in.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>Register walk-in patient</h1>
      <p style={{ color: 'var(--ink-soft)', marginBottom: 24 }}>
        Use the existing patient ID, or register a new patient on the spot.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => setIsNewPatient(false)}
          style={{
            padding: '6px 14px', borderRadius: 16, border: '1px solid var(--border)',
            background: !isNewPatient ? 'var(--teal-dark)' : 'white',
            color: !isNewPatient ? 'white' : 'var(--ink)', cursor: 'pointer', fontSize: 13,
          }}
        >
          Existing patient
        </button>
        <button
          type="button"
          onClick={() => setIsNewPatient(true)}
          style={{
            padding: '6px 14px', borderRadius: 16, border: '1px solid var(--border)',
            background: isNewPatient ? 'var(--teal-dark)' : 'white',
            color: isNewPatient ? 'white' : 'var(--ink)', cursor: 'pointer', fontSize: 13,
          }}
        >
          New patient
        </button>
      </div>

      <Card style={{ maxWidth: 520 }}>
        <form onSubmit={handleSubmit}>
          {!isNewPatient ? (
            <Field label="Patient ID" hint="Existing patient record ID (Mongo _id or patient code lookup)">
              <input required value={form.patientId} onChange={(e) => update('patientId', e.target.value)} />
            </Field>
          ) : (
            <div style={{ marginBottom: 16, padding: 12, border: '1px solid var(--border)', borderRadius: 8 }}>
              <strong style={{ fontSize: 13, display: 'block', marginBottom: 10 }}>New patient details</strong>
              <Field label="Full name">
                <input required value={newPatient.fullName} onChange={(e) => updateNewPatient('fullName', e.target.value)} />
              </Field>
              <Field label="Mobile number">
                <input required value={newPatient.mobileNumber} onChange={(e) => updateNewPatient('mobileNumber', e.target.value)} />
              </Field>
              <Field label="Email (optional)">
                <input value={newPatient.email} onChange={(e) => updateNewPatient('email', e.target.value)} />
              </Field>
              <Field label="Date of birth">
                <input type="date" value={newPatient.dob} onChange={(e) => updateNewPatient('dob', e.target.value)} />
              </Field>
              <Field label="Gender">
                <select value={newPatient.gender} onChange={(e) => updateNewPatient('gender', e.target.value)}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </Field>
            </div>
          )}

          <Field label="Hospital branch">
            <select required value={form.branchId} onChange={(e) => update('branchId', e.target.value)}>
              <option value="">Select branch</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Department">
            <select required disabled={!form.branchId} value={form.departmentId} onChange={(e) => update('departmentId', e.target.value)}>
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Doctor">
            <select required disabled={!form.departmentId} value={form.doctorId} onChange={(e) => update('doctorId', e.target.value)}>
              <option value="">Select doctor</option>
              {doctors.map((d) => (
                <option key={d._id} value={d._id}>
                  Dr. {d.user?.fullName}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Time slot">
            <select required value={form.timeSlot} onChange={(e) => update('timeSlot', e.target.value)}>
              <option value="">Select time</option>
              {TIME_SLOTS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Symptoms / chief complaint">
            <textarea rows={2} value={form.symptoms} onChange={(e) => update('symptoms', e.target.value)} />
          </Field>

          <Button type="submit" size="lg" disabled={submitting || registering} style={{ width: '100%' }}>
            {submitting || registering ? 'Registering…' : 'Register & assign doctor'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
