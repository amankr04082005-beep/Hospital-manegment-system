import './StatusBadges.css';

// SRS Rule 1: AI recommendations must be clearly marked "AI Suggested - Pending Doctor Approval".
export function AiSuggestedBadge() {
  return (
    <span className="badge badge--ai">
      <span className="badge__dot" aria-hidden="true" />
      AI Suggested — Pending Doctor Approval
    </span>
  );
}

export function DoctorApprovedBadge({ approvedAt }) {
  return (
    <span className="badge badge--approved">
      <span className="badge__stamp" aria-hidden="true">✓</span>
      Doctor Approved{approvedAt ? ` · ${new Date(approvedAt).toLocaleString()}` : ''}
    </span>
  );
}

export function SeverityBadge({ severity, children }) {
  return <span className={`badge badge--severity-${severity}`}>{children}</span>;
}

export function StatusPill({ status }) {
  const labelMap = {
    booked: 'Booked',
    confirmed: 'Confirmed',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    draft_created: 'Draft',
    under_review: 'Under Review',
    doctor_approved: 'Approved',
    prescription_generated: 'Generated',
    shared_with_patient: 'Shared',
  };
  return <span className={`pill pill--${status}`}>{labelMap[status] || status}</span>;
}
