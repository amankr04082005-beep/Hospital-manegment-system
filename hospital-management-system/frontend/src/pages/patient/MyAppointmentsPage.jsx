import { useEffect, useState } from 'react';
import { Card, EmptyState, Button } from '../../components/common/ui';
import { StatusPill } from '../../components/common/StatusBadges';
import * as appointmentService from '../../services/appointment.service';
import * as prescriptionService from '../../services/prescription.service';
import { format } from 'date-fns';


// SRS Module 2.1 — Patient permission: Track Follow-up Appointments.
// Pulls every prescription's followUpDate, keeps only future dates,
// and sorts soonest-first so the patient has one clear place to see
// what's coming up — rather than having to open each prescription.
function useUpcomingFollowUps() {
  const [followUps, setFollowUps] = useState(null);

  useEffect(() => {
    prescriptionService
      .getMyPrescriptions()
      .then((prescriptions) => {
        // Compare by calendar day (midnight), not exact time, so a
        // follow-up scheduled for *today* still counts as upcoming
        // even after the appointment time itself has passed.
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const upcoming = (prescriptions || [])
          .filter((p) => p.followUpDate && new Date(p.followUpDate) >= todayStart)
          .sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate));
        setFollowUps(upcoming);
      })
      .catch(() => setFollowUps([]));
  }, []);

  return followUps;
}

function UpcomingFollowUps() {
  const followUps = useUpcomingFollowUps();

  if (followUps === null) return null; // still loading — don't flash an empty state

  return (
    <div style={{ marginBottom: 28 }}>
      <h3 style={{ fontSize: 14, marginBottom: 8 }}>Upcoming follow-ups</h3>
      {followUps.length === 0 ? (
        <Card>
          <p style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>
            No follow-ups scheduled. Your doctor will set a follow-up date if one is needed after a consultation.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {followUps.map((p) => (
            <Card key={p._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{p.diagnosis?.primary || 'Follow-up consultation'}</div>
                {p.doctor?.user?.fullName && (
                  <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Dr. {p.doctor.user.fullName}</div>
                )}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--teal-dark)' }}>
                {format(new Date(p.followUpDate), 'PPP')}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MyAppointmentsPage() {
  const [appointments, setAppointments] = useState(null);

  async function loadAppointments() {
    try {
      const data = await appointmentService.getMyAppointments();
      console.log('[MyAppointmentsPage] /appointments/mine response:', data);
      setAppointments(data || []);
    } catch (err) {
      console.error('[MyAppointmentsPage] /appointments/mine failed:', err);
      setAppointments([]);
    }
  }

  useEffect(() => {
    loadAppointments();
  }, []);



  return (
    <div>
      <h1 style={{ marginBottom: 20 }}>My appointments</h1>

      <div style={{ marginBottom: 14 }}>
        <Button variant="secondary" size="sm" onClick={loadAppointments}>
          Refresh
        </Button>
      </div>


      <UpcomingFollowUps />

      <h3 style={{ fontSize: 14, marginBottom: 8 }}>All appointments</h3>
      {appointments === null && <p style={{ color: 'var(--ink-soft)' }}>Loading…</p>}

      {appointments && appointments.length === 0 && (
        <EmptyState title="No appointments yet" description="Book your first appointment to see it here." />
      )}

      {appointments && appointments.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {appointments.map((apt) => (
            <Card key={apt._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="mono" style={{ fontSize: 13, color: 'var(--teal-dark)', marginBottom: 4 }}>
                  {apt.appointmentNumber}
                </div>
                <div style={{ fontWeight: 600 }}>Dr. {apt.doctor?.user?.fullName}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
                  {apt.department?.name} · {format(new Date(apt.appointmentDate), 'PPP')} · {apt.timeSlot}
                </div>
              </div>
              <StatusPill status={apt.status} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}