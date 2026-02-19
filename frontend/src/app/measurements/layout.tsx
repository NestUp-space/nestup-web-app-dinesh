'use client';

import { MeasurementFlowProvider } from '@/context/MeasurementFlowContext';

export default function MeasurementsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MeasurementFlowProvider>{children}</MeasurementFlowProvider>;
}
