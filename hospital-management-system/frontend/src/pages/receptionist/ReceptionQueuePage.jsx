import { useEffect, useState } from 'react';
import { Card, Button, EmptyState, Field } from '../../components/common/ui';
import { StatusPill } from '../../components/common/StatusBadges';
import * as appointmentService from '../../services/appointment.service';
import toast from 'react-hot-toast';

const TIME_SLOTS = ['09:00-09:15', '09:15-09:30', '09:30-09:45', '10:00-10:15', '10:15-10:30', '11:00-11:15', '14:00-14:15', '15:00-15:15'];

export default function ReceptionQueuePage() {
  const [appointments, setAppointments] = useState(null);
  const [reschedulingId, setReschedulingId] = useState(null);
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [newSlot, setNewSlot] = useState(TIME_SLOTS[0]);
  const [submitting, setSubmitting] = useState(false);

  async function refresh() {
    try {
      const data = await appointmentService.getTodaysAppointments();
      setAppointments(data);
    } catch {
      setAppointments([]);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleForward(id) {
    try {
      await appointmentService.forwardToDoctor(id);
      toast.success('Forwarded to doctor with patient history & reports.');
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not forward.');
    }
  }

  function openReschedule(apt) {
    setReschedulingId(apt._id);
    setNewDate(new Date().toISOString().slice(0, 10));
    setNewSlot(apt.timeSlot);
  }

  async function handleReschedule(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await appointmentService.rescheduleAppointment(reschedulingId, newDate, newSlot);
      toast.success('Appointment rescheduled.');
      setReschedulingId(null);
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not reschedule.');
    } finally {
      setSubmitting(false);
    }
  }

  if (appointments === null) return <p style={{ color: 'var(--ink-soft)' }}>Loading…</p>;

  if (appointments.length === 0) {
    return <EmptyState title="No appointments today" description="The queue is currently empty." />;
  }

  return (
    <div>
      <h1 style={{ marginBottom: 20 }}>Today's queue</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {appointments.map((apt) => (
          <Card key={apt._id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{apt.patient?.user?.fullName || 'Patient'}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
                  Dr. {apt.doctor?.user?.fullName} · {apt.timeSlot}
                </div>
                <div className="mono" style={{ fontSize: 12, color: 'var(--teal-dark)', marginTop: 2 }}>
                  {apt.appointmentNumber}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <StatusPill status={apt.status} />
                {(apt.status === 'booked' || apt.status === 'confirmed') && (
                  <>
                    <Button size="sm" onClick={() => handleForward(apt._id)}>
                      Forward to doctor
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => openReschedule(apt)}>
                      Reschedule
                    </Button>
                  </>
                )}

                {/* Fix: doctor queue should receive forwarded appointments.
                    forwardToDoctor() sets status='in_progress', so doctor's page filters by that.
                    Ensure we show forward button for booked appointments so it gets forwarded. */}


                {/* Doctor queue me dikhane ke liye forward endpoint apt.status ko `in_progress` set karta hai.
                    Patient booking ke baad receptionist forward tabhi karega jab status booked/confirmed ho. */}

              </div>
            </div>

            {reschedulingId === apt._id && (
              <form
                onSubmit={handleReschedule}
                style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'flex-end' }}
              >
                <Field label="New date" style={{ marginBottom: 0 }}>
                  <input type="date" required value={newDate} onChange={(e) => setNewDate(e.target.value)} />
                </Field>
                <Field label="New time slot" style={{ marginBottom: 0 }}>
                  <select value={newSlot} onChange={(e) => setNewSlot(e.target.value)}>
                    {TIME_SLOTS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </Field>
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting ? 'Saving…' : 'Confirm reschedule'}
                </Button>
                <Button type="button" size="sm" variant="secondary" onClick={() => setReschedulingId(null)}>
                  Cancel
                </Button>
              </form>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}