import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, EmptyState } from '../../components/common/ui';
import * as prescriptionService from '../../services/prescription.service';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const STATUS_FILTERS = [
  { value: '', label: 'Needs attention' },
  { value: 'pending', label: 'Pending' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'missed', label: 'Missed' },
  { value: 'completed', label: 'Completed' },
  { value: 'all', label: 'All' },
];

const STATUS_STYLES = {
  pending: { background: '#fff4d6', color: '#8a6300' },
  scheduled: { background: '#dff0ff', color: '#0a5aa8' },
  completed: { background: '#e0f5ea', color: '#0e6e5c' },
  missed: { background: '#fbe1e1', color: '#9c3b3b' },
};

function StatusPill({ status }) {
  const style = STATUS_STYLES[status] || {};
  return (
    <span
      style={{
        ...style,
        padding: '3px 10px',
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 600,
        textTransform: 'capitalize',
      }}
    >
      {status}
    </span>
  );
}

function daysFromToday(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target - today) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return diff > 0 ? `In ${diff} days` : `${Math.abs(diff)} days ago`;
}

export default function FollowUpsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [worklist, setWorklist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (status) params.status = status;
      const data = await prescriptionService.getFollowUpWorklist(params);
      setWorklist(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load follow-ups.');
      setWorklist([]);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleStatusChange(id, followUpStatus) {
    setUpdatingId(id);
    try {
      await prescriptionService.updateFollowUpStatus(id, { followUpStatus });
      toast.success(`Marked as ${followUpStatus}.`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update follow-up.');
    } finally {
      setUpdatingId(null);
    }
  }

  function handleBookAppointment(item) {
    const params = new URLSearchParams({
      patientId: item.patient?._id || '',
      doctorId: item.doctor?._id || '',
      prescriptionId: item._id,
    });
    navigate(`/receptionist/book?${params.toString()}`);
  }

  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>Follow-up Management</h1>
      <p style={{ color: 'var(--ink-soft)', marginBottom: 24 }}>
        {user?.role === 'doctor'
          ? 'Follow-ups your patients are due for, pulled from your approved prescriptions.'
          : 'Every patient due for a follow-up visit, across all doctors.'}
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatus(f.value)}
            style={{
              padding: '6px 14px',
              borderRadius: 16,
              border: '1px solid var(--border)',
              background: status === f.value ? 'var(--teal-dark)' : 'white',
              color: status === f.value ? 'white' : 'var(--ink)',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && <p style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>Loading follow-ups…</p>}

      {!loading && worklist && worklist.length === 0 && (
        <EmptyState title="Nothing here" description="No follow-ups match this filter." />
      )}

      {!loading && worklist && worklist.length > 0 && (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', fontSize: 13.5, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', background: 'var(--surface-soft, #f7f7f5)' }}>
                <th style={{ padding: '10px 12px' }}>Patient</th>
                <th style={{ padding: '10px 12px' }}>Doctor</th>
                <th style={{ padding: '10px 12px' }}>Diagnosis</th>
                <th style={{ padding: '10px 12px' }}>Follow-up date</th>
                <th style={{ padding: '10px 12px' }}>Status</th>
                <th style={{ padding: '10px 12px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {worklist.map((item) => (
                <tr key={item._id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: 600 }}>{item.patient?.user?.fullName || 'Unknown'}</div>
                    <div style={{ color: 'var(--ink-soft)', fontSize: 12 }}>{item.patient?.user?.mobileNumber}</div>
                  </td>
                  <td style={{ padding: '10px 12px' }}>Dr. {item.doctor?.user?.fullName || '—'}</td>
                  <td style={{ padding: '10px 12px' }}>{item.diagnosis?.primary || '—'}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <div>{new Date(item.followUpDate).toLocaleDateString()}</div>
                    <div style={{ color: 'var(--ink-soft)', fontSize: 12 }}>{daysFromToday(item.followUpDate)}</div>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <StatusPill status={item.followUpStatus} />
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {item.followUpStatus !== 'completed' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={updatingId === item._id}
                          onClick={() => handleBookAppointment(item)}
                        >
                          Book visit
                        </Button>
                      )}
                      {item.followUpStatus === 'pending' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={updatingId === item._id}
                          onClick={() => handleStatusChange(item._id, 'scheduled')}
                        >
                          Mark scheduled
                        </Button>
                      )}
                      {(item.followUpStatus === 'scheduled' || item.followUpStatus === 'missed') && (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={updatingId === item._id}
                          onClick={() => handleStatusChange(item._id, 'completed')}
                        >
                          Mark completed
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}