'use client';

import { Card } from './Card';

interface MeasurementCardProps {
  label: string;
  value: number;
  unit: string;
  subValue?: string;
}

export function MeasurementCard({ label, value, unit, subValue }: MeasurementCardProps) {
  return (
    <Card>
      <div className="text-center">
        <p className="text-sm text-nestup-charcoal-light mb-2">{label}</p>
        <div className="text-4xl font-bold text-nestup-charcoal mb-1">
          {value.toLocaleString()}<span className="text-2xl ml-1">{unit}</span>
        </div>
        {subValue && (
          <p className="text-nestup-charcoal-light text-sm">{subValue}</p>
        )}
      </div>
    </Card>
  );
}
