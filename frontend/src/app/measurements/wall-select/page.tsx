'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Box } from 'lucide-react';
import { Card } from '@/components/measurements';
import { WALL_OPTIONS } from '@/lib/measurements/designTypes';
import { useMeasurementFlow } from '@/context/MeasurementFlowContext';

export default function WallSelectPage() {
  const router = useRouter();
  const { roomPreset, setRoomPreset } = useMeasurementFlow();
  const presetId = roomPreset?.presetId ?? '';
  const presetLabel = roomPreset?.presetLabel ?? 'Room';

  useEffect(() => {
    if (!presetId) router.replace('/measurements/preset');
  }, [presetId, router]);

  const handleSelect = (wallId: string, wallLabel: string) => {
    if (roomPreset) {
      setRoomPreset({ ...roomPreset, wallId, wallLabel });
    }
    router.push('/measurements/instructions');
  };

  if (!presetId) return null;

  return (
    <div className="min-h-screen bg-nestup-warm">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/measurements/preset"
          className="flex items-center gap-2 text-nestup-charcoal-light hover:text-nestup-charcoal mb-6 transition-colors w-fit"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-nestup-charcoal mb-3">
            Select wall to measure
          </h1>
          <p className="text-lg text-nestup-charcoal-light">
            {presetLabel} – which wall do you want to measure?
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {WALL_OPTIONS.map((wall) => (
            <Card
              key={wall.id}
              hover
              className="cursor-pointer"
              onClick={() => handleSelect(wall.id, wall.label)}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-nestup bg-nestup-beige flex items-center justify-center flex-shrink-0">
                  <Box size={32} className="text-nestup-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-nestup-charcoal text-lg">{wall.label}</h3>
                  <p className="text-sm text-nestup-charcoal-light">Measure this wall</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
