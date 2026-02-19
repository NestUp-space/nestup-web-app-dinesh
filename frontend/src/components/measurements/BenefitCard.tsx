'use client';

import { ReactNode } from 'react';
import { Card } from './Card';

interface BenefitCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export function BenefitCard({ icon, title, description }: BenefitCardProps) {
  return (
    <Card hover className="text-center">
      <div className="flex justify-center mb-4 text-nestup-accent">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-nestup-charcoal mb-2">
        {title}
      </h3>
      <p className="text-nestup-charcoal-light leading-relaxed">
        {description}
      </p>
    </Card>
  );
}
