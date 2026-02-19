'use client';

interface ConfidenceBadgeProps {
  level: 'high' | 'medium' | 'low';
}

export function ConfidenceBadge({ level }: ConfidenceBadgeProps) {
  const styles = {
    high: 'bg-nestup-success/10 text-nestup-success border-nestup-success/20',
    medium: 'bg-nestup-warning/10 text-nestup-warning border-nestup-warning/20',
    low: 'bg-nestup-error/10 text-nestup-error border-nestup-error/20',
  };

  const labels = {
    high: 'High Confidence',
    medium: 'Medium Confidence',
    low: 'Low Confidence',
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${styles[level]}`}
    >
      {labels[level]}
    </span>
  );
}
