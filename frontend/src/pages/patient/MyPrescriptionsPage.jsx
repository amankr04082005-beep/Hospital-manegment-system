import { useState, useEffect } from 'react';
import { Card, Field, Button, EmptyState } from '../../components/common/ui';
import { DoctorApprovedBadge } from '../../components/common/StatusBadges';
import * as prescriptionService from '../../services/prescription.service';
import toast from 'react-hot-toast';

function PrescriptionCard({ prescription }) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      const blob = await prescriptionService.downloadPrescriptionPdf(prescription._id || prescription.prescriptionNumber);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `prescription-${prescription.prescriptionNumber || 'mediflow'}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Could not download the PDF.');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Card style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div className="mono" style={{ color: 'var(--teal-dark)', fontSize: 14 }}>
            {prescription.prescriptionNumber || 'Pending generation'}
          </div>
          <h2 style={{ marginTop: 4 }}>{prescription.diagnosis?.primary || 'Diagnosis on file'}</h2>
          {prescription.doctor?.user?.fullName && (
            <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 2 }}>Dr. {prescription.doctor.user.fullName}</p>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <DoctorApprovedBadge approvedAt={prescription.approval?.approvedAt} />
          <Button variant="secondary" size="sm" onClick={handleDownload} disabled={downloading}>
            {downloading ? 'Preparing…' : '⬇ Download PDF'}
          </Button>
        </div>
      </div>

      <h3 style={{ fontSize: 14, marginBottom: 8 }}>Medicines</h3>
      <table style={{ width: '100%', fontSize: 13.5, marginBottom: 20, borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
            <th style={{ padding: '6px 8px' }}>Medicine</th>
            <th style={{ padding: '6px 8px' }}>Dosage</th>
            <th style={{ padding: '6px 8px' }}>Frequency</th>
            <th style={{ padding: '6px 8px' }}>Duration</th>
          </tr>
        </thead>
        <tbody>
          {(prescription.finalMedicines || []).map((m, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '6px 8px' }}>{m.brandName || m.genericName}</td>
              <td style={{ padding: '6px 8px' }}>{m.dosage}</td>
              <td style={{ padding: '6px 8px' }}>{m.frequency}</td>
              <td style={{ padding: '6px 8px' }}>{m.durationDays} days</td>
            </tr>
          ))}
        </tbody>
      </table>

      {prescription.finalAdvice?.dietAdvice && (
        <p style={{ fontSize: 13.5, marginBottom: 6 }}>
          <strong>Diet advice:</strong> {prescription.finalAdvice.dietAdvice}
        </p>
      )}
      {prescription.finalAdvice?.followUpInstructions && (
        <p style={{ fontSize: 13.5, marginBottom: 6 }}>
          <strong>Follow-up:</strong> {prescription.finalAdvice.followUpInstructions}
        </p>
      )}
      {prescription.followUpDate && (
        <p style={{ fontSize: 13.5 }}>
          <strong>Follow-up date:</strong> {new Date(prescription.followUpDate).toLocaleDateString()}
        </p>
      )}

      <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        This is your doctor's final, approved prescription. Draft AI suggestions reviewed during your
        consultation are never shown directly to patients.
      </p>
    </Card>
  );
}

export default function MyPrescriptionsPage() {
  const [myPrescriptions, setMyPrescriptions] = useState([]);
  const [listLoading, setListLoading] = useState(true);

  const [prescriptionId, setPrescriptionId] = useState('');
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    async function loadMyPrescriptions() {
      try {
        const data = await prescriptionService.getMyPrescriptions();
        setMyPrescriptions(data || []);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Could not load your prescriptions.');
      } finally {
        setListLoading(false);
      }
    }
    loadMyPrescriptions();
  }, []);

  async function handleLookup(e) {
    e.preventDefault();
    setLoading(true);
    setSearched(true);
    try {
      const data = await prescriptionService.getPrescription(prescriptionId);
      setPrescription(data);
    } catch (err) {
      setPrescription(null);
      toast.error(err.response?.data?.message || 'Prescription not found or not yet available.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>My prescriptions</h1>
      <p style={{ color: 'var(--ink-soft)', marginBottom: 24 }}>
        Prescriptions your doctor has approved and shared with you appear automatically below.
      </p>

      {listLoading && <p style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>Loading your prescriptions…</p>}

      {!listLoading && myPrescriptions.length === 0 && (
        <EmptyState
          title="No prescriptions yet"
          description="Once a doctor approves and shares a prescription after your consultation, it will appear here automatically."
        />
      )}

      {!listLoading &&
        myPrescriptions.map((p) => <PrescriptionCard key={p._id || p.prescriptionNumber} prescription={p} />)}

      <h3 style={{ fontSize: 14, marginTop: 28, marginBottom: 8 }}>Have a prescription ID instead?</h3>
      <Card style={{ maxWidth: 480, marginBottom: 24 }}>
        <form onSubmit={handleLookup} style={{ display: 'flex', gap: 10 }}>
          <Field label="Prescription ID" style={{ flex: 1, marginBottom: 0 }}>
            <input value={prescriptionId} onChange={(e) => setPrescriptionId(e.target.value)} placeholder="Paste prescription ID" />
          </Field>
          <Button type="submit" disabled={loading} style={{ alignSelf: 'flex-end', height: 38 }}>
            {loading ? 'Looking up…' : 'View'}
          </Button>
        </form>
      </Card>

      {searched && !loading && !prescription && (
        <EmptyState
          title="Not available yet"
          description="This prescription is still pending doctor review, or the ID is incorrect. Approved prescriptions never show draft AI suggestions — only your doctor's final, signed decision."
        />
      )}

      {prescription && <PrescriptionCard prescription={prescription} />}
    </div>
  );
}