import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Button, Card, EmptyState } from '../../components/common/ui';
import * as prescriptionService from '../../services/prescription.service';
import '../doctor/ClinicalWorkspaces.css';

const FILTERS = ['all', 'pending', 'scheduled', 'missed', 'completed'];

function formatDate(value) {
  if (!value) return 'Date not set';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));
}

function FollowUpStatus({ status }) {
  const normalizedStatus = status || 'pending';
  return <span className={`followup-status followup-status--${normalizedStatus}`}>{normalizedStatus.replace('_', ' ')}</span>;
}

export default function FollowUpsPage() {
  const [filter, setFilter] = useState('all');
  const [followUps, setFollowUps] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const loadFollowUps = useCallback(async () => {
    setFollowUps(null);
    try {
      const data = await prescriptionService.getFollowUpWorklist(filter === 'all' ? { status: 'all' } : { status: filter });
      setFollowUps(data || []);
    } catch (error) {
      setFollowUps([]);
      toast.error(error.response?.data?.message || 'Could not load follow-ups.');
    }
  }, [filter]);

  useEffect(() => {
    loadFollowUps();
  }, [loadFollowUps]);

  async function changeStatus(id, followUpStatus) {
    setUpdatingId(id);
    try {
      await prescriptionService.updateFollowUpStatus(id, { followUpStatus });
      toast.success(`Follow-up marked ${followUpStatus}.`);
      await loadFollowUps();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update the follow-up.');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="clinical-workspace">
      <header className="clinical-workspace__header">
        <div>
          <p className="clinical-workspace__eyebrow">Continuity of care</p>
          <h1>Follow-up worklist</h1>
          <p className="clinical-workspace__intro">Track due dates, contact details, and the next action for every patient follow-up.</p>
        </div>
      </header>

      <div className="followup-filters" aria-label="Filter follow-ups">
        {FILTERS.map((status) => (
          <button
            className={`followup-filter${filter === status ? ' followup-filter--active' : ''}`}
            key={status}
            onClick={() => setFilter(status)}
            type="button"
          >
            {status}
          </button>
        ))}
      </div>

      {followUps === null ? (
        <p className="clinical-workspace__muted">Loading follow-ups…</p>
      ) : followUps.length === 0 ? (
        <EmptyState title="No follow-ups found" description="There are no patient follow-ups matching this filter." />
      ) : (
        <div className="followup-list">
          {followUps.map((followUp) => {
            const patient = followUp.patient?.user;
            const doctor = followUp.doctor?.user;
            const isUpdating = updatingId === followUp._id;

            return (
              <Card className="followup-card" key={followUp._id}>
                <div className="followup-card__patient">
                  <div>
                    <span className="clinical-workspace__eyebrow">Due {formatDate(followUp.followUpDate)}</span>
                    <h2>{patient?.fullName || 'Patient'}</h2>
                    <p>{followUp.diagnosis?.primary || 'Diagnosis not recorded'}</p>
                  </div>
                  <FollowUpStatus status={followUp.followUpStatus} />
                </div>

                <dl className="followup-details">
                  <div>
                    <dt>Contact</dt>
                    <dd>{patient?.mobileNumber || patient?.email || 'Not available'}</dd>
                  </div>
                  <div>
                    <dt>Doctor</dt>
                    <dd>{doctor?.fullName ? `Dr. ${doctor.fullName}` : 'Not assigned'}</dd>
                  </div>
                  <div>
                    <dt>Instructions</dt>
                    <dd>{followUp.finalAdvice?.followUpInstructions || 'No instructions recorded'}</dd>
                  </div>
                </dl>

                <div className="followup-actions" aria-label={`Update follow-up for ${patient?.fullName || 'patient'}`}>
                  {['pending', 'scheduled', 'completed', 'missed'].map((status) => (
                    <Button
                      disabled={isUpdating || followUp.followUpStatus === status}
                      key={status}
                      onClick={() => changeStatus(followUp._id, status)}
                      size="sm"
                      type="button"
                      variant={status === 'completed' ? 'primary' : 'secondary'}
                    >
                      {isUpdating ? 'Updating…' : `Mark ${status}`}
                    </Button>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
