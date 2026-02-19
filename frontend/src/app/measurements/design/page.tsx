'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Layout } from 'lucide-react';
import { Button, Card } from '@/components/measurements';
import { useMeasurementFlow } from '@/context/MeasurementFlowContext';

export default function DesignPage() {
  const router = useRouter();
  const { result, roomPreset, wallContext } = useMeasurementFlow();
  const designPayload = result
    ? { measurement: result, ...(wallContext && { wallContext }), ...(roomPreset && { roomPreset }) }
    : null;

  return (
    <div className="min-h-screen bg-nestup-warm">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-nestup-charcoal-light hover:text-nestup-charcoal mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        <Card className="mb-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-nestup-lg bg-nestup-beige flex items-center justify-center">
            <Layout size={40} className="text-nestup-accent" />
          </div>
          <h1 className="text-3xl font-bold text-nestup-charcoal mb-3">
            3D design coming soon
          </h1>
          <p className="text-nestup-charcoal-light mb-6">
            Your measurement and room or wall data will be used here to create a 3D wall design. This step will be integrated soon.
          </p>
          {designPayload && (
            <div className="mt-6 pt-6 border-t border-nestup-sand text-left">
              <p className="text-sm font-medium text-nestup-charcoal mb-2">Data prepared for design:</p>
              <ul className="text-sm text-nestup-charcoal-light space-y-1">
                <li>
                  Wall: {designPayload.measurement.wall_height_mm ?? '—'} mm × {designPayload.measurement.wall_width_mm ?? '—'} mm
                </li>
                {designPayload.roomPreset && (
                  <li>
                    Room: {designPayload.roomPreset.presetLabel} – {designPayload.roomPreset.wallLabel}
                  </li>
                )}
                {designPayload.wallContext && (
                  <li>
                    Details: {designPayload.wallContext.roomName}, {designPayload.wallContext.direction}
                  </li>
                )}
              </ul>
            </div>
          )}
        </Card>

        <div className="flex justify-center">
          <Link href="/measurements">
            <Button className="flex items-center gap-2">Back to Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
