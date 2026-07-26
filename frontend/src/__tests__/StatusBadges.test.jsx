import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AiSuggestedBadge, DoctorApprovedBadge, SeverityBadge } from '../components/common/StatusBadges';

describe('StatusBadges Components', () => {
  describe('AiSuggestedBadge', () => {
    it('renders AI suggestion badge', () => {
      render(<AiSuggestedBadge />);
      expect(screen.getByText(/AI Suggested/)).toBeInTheDocument();
    });
  });

  describe('DoctorApprovedBadge', () => {
    it('renders approved badge with date', () => {
      const date = new Date('2025-01-15').toISOString();
      render(<DoctorApprovedBadge approvedAt={date} />);
      expect(screen.getByText(/Approved/)).toBeInTheDocument();
    });
  });

  describe('SeverityBadge', () => {
    it('renders with correct severity class', () => {
      render(<SeverityBadge severity="severe">Test Alert</SeverityBadge>);
      const badge = screen.getByText('Test Alert');
      expect(badge).toBeInTheDocument();
    });
  });
});

