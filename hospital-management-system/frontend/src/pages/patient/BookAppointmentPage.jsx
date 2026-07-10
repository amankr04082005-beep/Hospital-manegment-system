import { useState, useEffect } from 'react';
import { Card, Button, Field, EmptyState } from '../../components/common/ui';
import * as appointmentService from '../../services/appointment.service';
import toast from 'react-hot-toast';

const TIME_SLOTS = ['09:00-09:15', '09:15-09:30', '09:30-09:45', '10:00-10:15', '10:15-10:30', '11:00-11:15', '14:00-14:15', '15:00-15:15'];

export default function BookAppointmentPage() {
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({
    branchId: '',
    departmentId: '',
    doctorId: '',
    appointmentDate: '',
    timeSlot: '',
    symptoms: '',
  });
  const [confirmed, setConfirmed] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    appointmentService.getBranches().then(setBranches).catch(() => setBranches([]));
  }, []);

  useEffect(() => {
    if (!form.branchId) {
      setDepartments([]);
      return;
    }
    appointmentService.getDepartments(form.branchId).then(setDepartments).catch(() => setDepartments([]));
  }, [form.branchId]);

  useEffect(() => {
    if (!form.departmentId) {
      setDoctors([]);
      return;
    }
    appointmentService.getDoctors(form.departmentId).then(setDoctors).catch(() => setDoctors([]));
  }, [form.departmentId]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const appointment = await appointmentService.bookAppointment(form);
      setConfirmed(appointment);
      toast.success('Appointment booked.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not book appointment.');
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmed) {
    return (
      <Card style={{ maxWidth: 480 }}>
        <h2 style={{ marginBottom: 6 }}>Appointment confirmed</h2>
        <p style={{ color: 'var(--ink-soft)', marginBottom: 20 }}>
          A confirmation has been sent by SMS and email.
        </p>
        <div className="mono" style={{ fontSize: 20, marginBottom: 16, color: 'var(--teal-dark)' }}>
          {confirmed.appointmentNumber}
        </div>
        {confirmed.qrCodeDataUrl && (
          <img src={confirmed.qrCodeDataUrl} alt="Appointment QR code" width={160} height={160} style={{ marginBottom: 16 }} />
        )}
        <Button
          onClick={() => {
            // Clear confirmation and keep the user on the booking page.
            // This prevents any UI flash caused by parent route updates.
            setConfirmed(null);
            window.scrollTo({ top: 0, behavior: 'instant' });
          }}
        >
          Book another appointment
        </Button>
      </Card>
    );
  }

  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>Book an appointment</h1>
      <p style={{ color: 'var(--ink-soft)', marginBottom: 24 }}>
        Choose a branch, department, and doctor, then pick a time that works for you.
      </p>

      <Card style={{ maxWidth: 520 }}>
        <form onSubmit={handleSubmit}>
          <Field label="Hospital branch">
            <select required value={form.branchId} onChange={(e) => update('branchId', e.target.value)}>
              <option value="">Select branch</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name} — {b.city}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Department">
            <select
              required
              disabled={!form.branchId}
              value={form.departmentId}
              onChange={(e) => update('departmentId', e.target.value)}
            >
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Doctor">
            <select
              required
              disabled={!form.departmentId}
              value={form.doctorId}
              onChange={(e) => update('doctorId', e.target.value)}
            >
              <option value="">Select doctor</option>
              {doctors.map((d) => (
                <option key={d._id} value={d._id}>
                  Dr. {d.user?.fullName} — {d.specialization}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Date">
            <input
              type="date"
              required
              min={new Date().toISOString().slice(0, 10)}
              value={form.appointmentDate}
              onChange={(e) => update('appointmentDate', e.target.value)}
            />
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

          <Field label="Symptoms" hint="Briefly describe what's bothering you">
            <textarea
              rows={3}
              value={form.symptoms}
              onChange={(e) => update('symptoms', e.target.value)}
              placeholder="e.g. fever and sore throat for 2 days"
            />
          </Field>

          <Button type="submit" size="lg" disabled={submitting} style={{ width: '100%' }}>
            {submitting ? 'Booking…' : 'Confirm appointment'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
