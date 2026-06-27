import { useEffect, useState } from 'react';
import { Card } from '../../components/common/ui';
import * as appointmentService from '../../services/appointment.service';

export default function AdminOverviewPage() {
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    appointmentService.getBranches().then(setBranches).catch(() => setBranches([]));
  }, []);

  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>Hospital overview</h1>
      <p style={{ color: 'var(--ink-soft)', marginBottom: 24 }}>
        Manage branches, departments, doctors, and system configuration.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        <Card>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Branches</div>
          <div style={{ fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 600 }}>{branches.length}</div>
        </Card>
        <Card>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Audit Logs</div>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 8 }}>
            Every AI suggestion, doctor modification, and approval is recorded in each prescription's audit trail.
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Compliance</div>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 8 }}>
            AI acts only as a Clinical Decision Support System. Doctors hold sole prescribing authority.
          </div>
        </Card>
      </div>

      <Card>
        <h3 style={{ marginBottom: 12 }}>Branches</h3>
        {branches.length === 0 ? (
          <p style={{ color: 'var(--ink-soft)', fontSize: 13.5 }}>No branches configured yet. Use the seed script or API to add one.</p>
        ) : (
          <ul style={{ paddingLeft: 18, fontSize: 13.5 }}>
            {branches.map((b) => (
              <li key={b._id}>
                {b.name} — {b.city}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
