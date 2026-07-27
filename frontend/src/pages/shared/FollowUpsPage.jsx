import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, EmptyState, Field } from '../../components/common/ui';
import { StatusPill } from '../../components/common/StatusBadges';
import * as prescriptionService from '../../services/prescription.service';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['pending', 'scheduled', 'completed', 'missed'];

export default function FollowUpsPage() {
  const [followUps, setFollowUps] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const navigate = useNavigate();

  async function refresh() {
    try {
      const data = await prescriptionService.getFollowUps(filterStatus || undefined);
      setFollowUps(data);
    } catch {
      setFollowUps([]);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  async function handleStatusChange(id, followUpStatus) {
    setUpdatingId(id);
    try {
      await prescriptionService.updateFollowUpStatus(id, followUpStatus);
      toast.success('Follow-up status updated.');
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update status.');
    } finally {
      setUpdatingId(null);
    }
  }

  function handleBookVisit(item) {
    const patientId = item.patient?._id;
    const doctorId = item.doctor?._id;
    navigate(
      `/receptionist/book?patientId=${patientId}&doctorId=${doctorId}&prescriptionId=${item._id}&fromFollowUp=true`
    );
  }

  if (followUps === null) return <p style={{ color: 'var(--ink-soft)' }}>Loading…</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1>Follow-ups</h1>
        <Field label="Filter by status" style={{ marginBottom: 0, minWidth: 180 }}>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {followUps.length === 0 ? (
        <EmptyState title="No follow-ups" description="Nothing needs attention right now." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {followUps.map((item) => (
            <Card key={item._id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{item.patient?.user?.fullName || 'Patient'}</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
                    Dr. {item.doctor?.user?.fullName} · Follow-up due{' '}
                    {item.followUpDate ? new Date(item.followUpDate).toLocaleDateString() : '—'}
                  </div>
                  {item.diagnosis?.primary && (
                    <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>
                      Diagnosis: {item.diagnosis.primary}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <StatusPill status={item.followUpStatus} />
                  {(item.followUpStatus === 'pending' || item.followUpStatus === 'missed') && (
                    <Button size="sm" onClick={() => handleBookVisit(item)}>
                      Book visit
                    </Button>
                  )}
                  {item.followUpStatus === 'pending' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={updatingId === item._id}
                      onClick={() => handleStatusChange(item._id, 'scheduled')}
                    >
                      Mark scheduled
                    </Button>
                  )}
                  {item.followUpStatus === 'scheduled' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={updatingId === item._id}
                      onClick={() => handleStatusChange(item._id, 'completed')}
                    >
                      Mark completed
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}