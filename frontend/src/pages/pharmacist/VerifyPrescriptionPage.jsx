import { useState } from 'react';
import { Card, Button, Field, EmptyState } from '../../components/common/ui';
import { DoctorApprovedBadge, StatusPill } from '../../components/common/StatusBadges';
import * as prescriptionService from '../../services/prescription.service';
import * as medicineService from '../../services/medicine.service';
import toast from 'react-hot-toast';

// SRS Module 2.4 - Pharmacist permission: Suggest Alternatives.
// Lets the pharmacist look up same-composition substitute brands for a
// prescribed medicine - e.g. if the exact brand is out of stock - without
// changing what the doctor actually prescribed.
function MedicineVerifyRow({ medicine }) {
  const [alternatives, setAlternatives] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleViewAlternatives() {
    setLoading(true);
    try {
      const name = medicine.brandName || medicine.genericName || medicine.composition;
      const { alternatives: results } = await medicineService.getAlternativesByName(name);
      setAlternatives(results || []);
    } catch {
      toast.error('Could not load alternatives.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <tr style={{ borderBottom: '1px solid var(--border)' }}>
      <td style={{ padding: '6px 8px', verticalAlign: 'top' }}>
        {medicine.brandName || medicine.genericName}
        <div>
          <button
            type="button"
            onClick={handleViewAlternatives}
            disabled={loading}
            style={{ fontSize: 11.5, color: 'var(--teal-dark)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 4, textDecoration: 'underline' }}
          >
            {loading ? 'Loading…' : 'Suggest alternatives'}
          </button>
          {alternatives && (
            <div style={{ marginTop: 4 }}>
              {alternatives.length === 0 ? (
                <span style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>No alternatives found.</span>
              ) : (
                alternatives.map((a) => (
                  <span
                    key={a._id}
                    style={{ fontSize: 11.5, color: 'var(--ink-soft)', display: 'block' }}
                  >
                    {a.brandName} ({a.composition})
                  </span>
                ))
              )}
            </div>
          )}
        </div>
      </td>
      <td style={{ padding: '6px 8px', verticalAlign: 'top' }}>{medicine.dosage}</td>
      <td style={{ padding: '6px 8px', verticalAlign: 'top' }}>{medicine.frequency}</td>
      <td style={{ padding: '6px 8px', verticalAlign: 'top' }}>{medicine.durationDays} days</td>
    </tr>
  );
}

export default function VerifyPrescriptionPage() {
  const [prescriptionId, setPrescriptionId] = useState('');
  const [prescription, setPrescription] = useState(null);
  const [searched, setSearched] = useState(false);
  const [verifying, setVerifying] = useState(false);

  async function handleLookup(e) {
    e.preventDefault();
    setSearched(true);
    try {
      const data = await prescriptionService.getPrescription(prescriptionId);
      setPrescription(data);
    } catch (err) {
      setPrescription(null);
      toast.error(err.response?.data?.message || 'Prescription not found.');
    }
  }

  // SRS Module 2.4 - Pharmacist permission: Verify Medicines.
  async function handleVerify() {
    setVerifying(true);
    try {
      const updated = await prescriptionService.verifyPrescription(prescription._id);
      setPrescription(updated);
      toast.success('Prescription marked as verified.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not verify prescription.');
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>Verify prescription</h1>
      <p style={{ color: 'var(--ink-soft)', marginBottom: 24 }}>
        Look up a prescription by ID to confirm medicines and dosages before dispensing.
      </p>

      <Card style={{ maxWidth: 480, marginBottom: 24 }}>
        <form onSubmit={handleLookup} style={{ display: 'flex', gap: 10 }}>
          <Field label="Prescription ID" style={{ flex: 1, marginBottom: 0 }}>
            <input value={prescriptionId} onChange={(e) => setPrescriptionId(e.target.value)} />
          </Field>
          <Button type="submit" style={{ alignSelf: 'flex-end', height: 38 }}>
            Look up
          </Button>
        </form>
      </Card>

      {searched && !prescription && <EmptyState title="Not found" description="Check the prescription ID and try again." />}

      {prescription && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="mono" style={{ color: 'var(--teal-dark)' }}>
              {prescription.prescriptionNumber || 'Not yet generated'}
            </div>
            <StatusPill status={prescription.status} />
          </div>

          {prescription.status === 'draft_created' || prescription.status === 'under_review' ? (
            <p style={{ color: 'var(--amber)', fontSize: 13.5 }}>
              This prescription is still pending doctor approval and cannot be dispensed yet.
            </p>
          ) : (
            <>
              <DoctorApprovedBadge approvedAt={prescription.approval?.approvedAt} />
              <table style={{ width: '100%', fontSize: 13.5, marginTop: 16, borderCollapse: 'collapse' }}>
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
                    <MedicineVerifyRow key={i} medicine={m} />
                  ))}
                </tbody>
              </table>
              <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 14 }}>
                Approved by {prescription.approval?.doctorName} · Reg. No. {prescription.approval?.medicalRegistrationNumber}
              </p>

              {/* SRS Module 2.4 - Pharmacist permission: Verify Medicines */}
              {prescription.pharmacistVerification?.verifiedAt ? (
                <p style={{ fontSize: 13, color: 'var(--teal-dark)', fontWeight: 600, marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  ✓ Verified by {prescription.pharmacistVerification.verifiedByName} on{' '}
                  {new Date(prescription.pharmacistVerification.verifiedAt).toLocaleString()}
                </p>
              ) : (
                <Button onClick={handleVerify} disabled={verifying} style={{ marginTop: 16 }}>
                  {verifying ? 'Verifying…' : '✓ Mark as verified'}
                </Button>
              )}
            </>
          )}
        </Card>
      )}
    </div>
  );
}