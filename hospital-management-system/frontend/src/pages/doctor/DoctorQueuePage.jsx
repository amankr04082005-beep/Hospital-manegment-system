import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, EmptyState } from '../../components/common/ui';
import { StatusPill } from '../../components/common/StatusBadges';
import * as appointmentService from '../../services/appointment.service';

export default function DoctorQueuePage() {
  const [appointments, setAppointments] = useState(null);

  useEffect(() => {
    appointmentService
      .getTodaysAppointments()
      .then((data) => {
        // Backend forward endpoint sets status to `in_progress`.
        // Patients can book appointments, but doctor should see only forwarded ones.
        const filtered = (data || []).filter((a) => a.status === 'in_progress');
        setAppointments(filtered);
      })
      .catch(() => setAppointments([]));

  }, []);

  if (appointments === null) return <p style={{ color: 'var(--ink-soft)' }}>Loading…</p>;

  if (appointments.length === 0) {
    return <EmptyState title="No patients today" description="Your consultation queue is empty." />;
  }

  return (
    <div>
      <h1 style={{ marginBottom: 20 }}>My patients today</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {appointments.map((apt) => (
          <Card key={apt._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{apt.patient?.user?.fullName || 'Patient'}</div>
              <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
                {apt.timeSlot} · {apt.symptoms || 'No symptoms noted'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <StatusPill status={apt.status} />
              <Link
                to={`/doctor/consultations?appointmentId=${apt._id}&patientId=${apt.patient?._id || apt.patient}`}
              >
                <Button size="sm">Start consultation</Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
