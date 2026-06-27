import { useEffect, useState } from 'react';
import { Card } from '../../components/common/ui';
import * as reportService from '../../services/report.service';
import toast from 'react-hot-toast';

const FILTERS = [
  { value: '', label: 'All time' },
  { value: 'daily', label: 'Today' },
  { value: 'weekly', label: 'Last 7 days' },
  { value: 'monthly', label: 'Last 30 days' },
];

function StatCard({ label, value }) {
  return (
    <Card>
      <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{label}</div>
      <div style={{ fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 600 }}>{value}</div>
    </Card>
  );
}

export default function AdminReportsPage() {
  const [filter, setFilter] = useState('');
  const [appointmentReport, setAppointmentReport] = useState(null);
  const [doctorReport, setDoctorReport] = useState(null);
  const [prescriptionReport, setPrescriptionReport] = useState(null);
  const [revenueReport, setRevenueReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      try {
        const [appt, doc, presc, rev] = await Promise.all([
          reportService.getAppointmentReport(filter),
          reportService.getDoctorReport(),
          reportService.getPrescriptionReport(),
          reportService.getRevenueReport(),
        ]);
        setAppointmentReport(appt);
        setDoctorReport(doc);
        setPrescriptionReport(presc);
        setRevenueReport(rev);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Could not load reports.');
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, [filter]);

  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>Reporting &amp; Analytics</h1>
      <p style={{ color: 'var(--ink-soft)', marginBottom: 24 }}>
        Operational snapshot across appointments, doctors, prescriptions, and revenue.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            style={{
              padding: '6px 14px',
              borderRadius: 16,
              border: '1px solid var(--border)',
              background: filter === f.value ? 'var(--teal-dark)' : 'white',
              color: filter === f.value ? 'white' : 'var(--ink)',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && <p style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>Loading reports…</p>}

      {!loading && (
        <>
          {/* Appointment summary */}
          <h3 style={{ fontSize: 14, marginBottom: 8 }}>Appointments</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 28 }}>
            <StatCard label="Total" value={appointmentReport?.totalAppointments ?? 0} />
            <StatCard label="Booked" value={appointmentReport?.booked ?? 0} />
            <StatCard label="Confirmed" value={appointmentReport?.confirmed ?? 0} />
            <StatCard label="In progress" value={appointmentReport?.inProgress ?? 0} />
            <StatCard label="Completed" value={appointmentReport?.completed ?? 0} />
            <StatCard label="Cancelled" value={appointmentReport?.cancelled ?? 0} />
          </div>

          {/* Revenue */}
          <h3 style={{ fontSize: 14, marginBottom: 8 }}>Revenue</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 28 }}>
            <StatCard label="Completed appointments" value={revenueReport?.completedAppointments ?? 0} />
            <StatCard label="Total revenue (₹)" value={(revenueReport?.totalRevenue ?? 0).toLocaleString('en-IN')} />
          </div>

          {/* Prescriptions */}
          <h3 style={{ fontSize: 14, marginBottom: 8 }}>Prescriptions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
            <StatCard label="Total" value={prescriptionReport?.totalPrescriptions ?? 0} />
            <StatCard label="Under review" value={prescriptionReport?.underReview ?? 0} />
            <StatCard label="Doctor approved" value={prescriptionReport?.doctorApproved ?? 0} />
            <StatCard label="Generated" value={prescriptionReport?.prescriptionGenerated ?? 0} />
            <StatCard label="Shared with patient" value={prescriptionReport?.sharedWithPatient ?? 0} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
            <Card>
              <h3 style={{ fontSize: 14, marginBottom: 10 }}>Most prescribed medicines</h3>
              {!prescriptionReport?.medicines || prescriptionReport.medicines.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>No prescriptions yet.</p>
              ) : (
                <table style={{ width: '100%', fontSize: 13.5, borderCollapse: 'collapse' }}>
                  <tbody>
                    {prescriptionReport.medicines.map((m) => (
                      <tr key={m._id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '6px 4px' }}>{m._id || 'Unnamed'}</td>
                        <td style={{ padding: '6px 4px', textAlign: 'right', fontWeight: 600 }}>{m.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            <Card>
              <h3 style={{ fontSize: 14, marginBottom: 10 }}>Disease trends</h3>
              {!prescriptionReport?.diseaseTrends || prescriptionReport.diseaseTrends.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>No diagnoses recorded yet.</p>
              ) : (
                <table style={{ width: '100%', fontSize: 13.5, borderCollapse: 'collapse' }}>
                  <tbody>
                    {prescriptionReport.diseaseTrends.map((d) => (
                      <tr key={d._id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '6px 4px' }}>{d._id || 'Unspecified'}</td>
                        <td style={{ padding: '6px 4px', textAlign: 'right', fontWeight: 600 }}>{d.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </div>

          {/* Doctor performance */}
          <h3 style={{ fontSize: 14, marginBottom: 8 }}>Doctor performance</h3>
          <Card>
            {!doctorReport || doctorReport.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>No doctors found.</p>
            ) : (
              <table style={{ width: '100%', fontSize: 13.5, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '6px 8px' }}>Doctor</th>
                    <th style={{ padding: '6px 8px' }}>Specialization</th>
                    <th style={{ padding: '6px 8px' }}>Fee (₹)</th>
                    <th style={{ padding: '6px 8px' }}>Patients consulted</th>
                  </tr>
                </thead>
                <tbody>
                  {doctorReport.map((d) => (
                    <tr key={d.doctorId} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '6px 8px' }}>{d.doctorName}</td>
                      <td style={{ padding: '6px 8px' }}>{d.specialization}</td>
                      <td style={{ padding: '6px 8px' }}>{d.consultationFee}</td>
                      <td style={{ padding: '6px 8px' }}>{d.patientsConsulted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}
    </div>
  );
}