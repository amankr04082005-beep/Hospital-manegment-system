import { useEffect, useState } from 'react';
import { Card, EmptyState } from '../../components/common/ui';
import * as emrService from '../../services/emr.service';
import { format } from 'date-fns';

export default function LabReportsPage() {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    emrService
      .getMyHistory()
      .then((data) => setHistory(data))
      .catch(() => setHistory({ patientProfile: null, records: [] }))
      .finally(() => setLoading(false));
  }, []);

  const labReports = (history?.records || []).filter((item) => item.recordType === 'lab_report');

  return (
    <div>
      <h1 style={{ marginBottom: 6 }}>My lab reports</h1>
      <p style={{ color: 'var(--ink-soft)', marginBottom: 20 }}>
        View lab report summaries and download any attached files.
      </p>

      {loading && <p style={{ color: 'var(--ink-soft)' }}>Loading lab reports…</p>}

      {!loading && labReports.length === 0 && (
        <EmptyState title="No lab reports found" description="Lab reports will appear here once a doctor or technician uploads them." />
      )}

      {!loading && labReports.length > 0 && (
        <div style={{ display: 'grid', gap: 12 }}>
          {labReports.map((report) => (
            <Card key={report._id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{report.title}</div>
                  {report.description && <div style={{ marginTop: 6, color: 'var(--ink-soft)' }}>{report.description}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{format(new Date(report.recordDate), 'PPP')}</div>
                  {report.fileUrl && (
                    <a href={report.fileUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 8 }}>
                      Download report
                    </a>
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
