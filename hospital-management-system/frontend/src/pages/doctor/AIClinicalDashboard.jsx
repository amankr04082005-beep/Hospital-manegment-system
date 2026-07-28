import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, EmptyState } from '../../components/common/ui';
import { AiSuggestedBadge } from '../../components/common/StatusBadges';
import * as appointmentService from '../../services/appointment.service';
import * as prescriptionService from '../../services/prescription.service';
import './ClinicalWorkspaces.css';

export default function AIClinicalDashboard() {
  const [appointments, setAppointments] = useState(null);
  const [followUps, setFollowUps] = useState(null);

  useEffect(() => {
    let active = true;

    Promise.allSettled([
      appointmentService.getTodaysAppointments(),
      prescriptionService.getFollowUpWorklist(),
    ]).then(([appointmentResult, followUpResult]) => {
      if (!active) return;

      setAppointments(appointmentResult.status === 'fulfilled' ? appointmentResult.value || [] : []);
      setFollowUps(followUpResult.status === 'fulfilled' ? followUpResult.value || [] : []);
    });

    return () => {
      active = false;
    };
  }, []);

  const activeAppointments = useMemo(
    () => (appointments || []).filter((appointment) => ['booked', 'confirmed', 'in_progress'].includes(appointment.status)),
    [appointments],
  );
  const missedFollowUps = useMemo(
    () => (followUps || []).filter((followUp) => followUp.followUpStatus === 'missed'),
    [followUps],
  );
  const loading = appointments === null || followUps === null;

  return (
    <div className="clinical-workspace">
      <header className="clinical-workspace__header">
        <div>
          <p className="clinical-workspace__eyebrow">Clinical decision support</p>
          <h1>AI clinical dashboard</h1>
          <p className="clinical-workspace__intro">
            Review today&apos;s care workload before opening a consultation. AI suggestions remain drafts until a doctor reviews and approves them.
          </p>
        </div>
        <AiSuggestedBadge />
      </header>

      <section className="clinical-metrics" aria-label="Clinical workload summary">
        <Card className="clinical-metric">
          <span className="clinical-metric__label">Patients requiring review</span>
          <strong>{loading ? '—' : activeAppointments.length}</strong>
          <span>Booked or currently in consultation</span>
        </Card>
        <Card className="clinical-metric">
          <span className="clinical-metric__label">Open follow-ups</span>
          <strong>{loading ? '—' : followUps.length}</strong>
          <span>Pending, scheduled, or missed</span>
        </Card>
        <Card className="clinical-metric clinical-metric--attention">
          <span className="clinical-metric__label">Missed follow-ups</span>
          <strong>{loading ? '—' : missedFollowUps.length}</strong>
          <span>Patients needing outreach</span>
        </Card>
      </section>

      <section className="clinical-workspace__grid">
        <Card className="clinical-panel">
          <div className="clinical-panel__heading">
            <div>
              <p className="clinical-workspace__eyebrow">Today&apos;s queue</p>
              <h2>Open a patient chart</h2>
            </div>
            <Link to="/doctor/queue">View full queue</Link>
          </div>

          {loading ? (
            <p className="clinical-workspace__muted">Loading clinical workload…</p>
          ) : activeAppointments.length === 0 ? (
            <EmptyState title="No patients waiting" description="Today’s active consultation queue is clear." />
          ) : (
            <div className="clinical-list">
              {activeAppointments.slice(0, 5).map((appointment) => {
                const patientId = appointment.patient?._id || (typeof appointment.patient === 'string' ? appointment.patient : '');
                const consultationUrl = `/doctor/consultations?appointmentId=${appointment._id}&patientId=${patientId}`;

                return (
                  <Link className="clinical-list__row" to={consultationUrl} key={appointment._id}>
                    <div>
                      <strong>{appointment.patient?.user?.fullName || 'Patient'}</strong>
                      <span>{appointment.symptoms || 'No symptoms recorded'}</span>
                    </div>
                    <span className="clinical-list__meta">{appointment.timeSlot || 'Time pending'}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="clinical-panel clinical-panel--guardrail">
          <p className="clinical-workspace__eyebrow">Safety guardrails</p>
          <h2>Doctor review is required</h2>
          <ul className="clinical-checklist">
            <li>Confirm symptoms, allergies, and medical history.</li>
            <li>Review every suggested diagnosis and medicine.</li>
            <li>Edit the draft whenever clinical judgment differs.</li>
            <li>Approve before generating or sharing a prescription.</li>
          </ul>
          <Link className="clinical-panel__action" to="/doctor/consultations">
            Go to consultations
          </Link>
        </Card>
      </section>
    </div>
  );
}
