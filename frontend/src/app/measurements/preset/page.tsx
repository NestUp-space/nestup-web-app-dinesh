'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BedDouble, ChefHat, Sofa, Briefcase } from 'lucide-react';
import { Button, Card } from '@/components/measurements';
import { ROOM_PRESETS } from '@/lib/measurements/designTypes';
import { useMeasurementFlow } from '@/context/MeasurementFlowContext';

const presetIcons: Record<string, React.ReactNode> = {
  bedroom: <BedDouble size={32} className="text-nestup-accent" />,
  kitchen: <ChefHat size={32} className="text-nestup-accent" />,
  living: <Sofa size={32} className="text-nestup-accent" />,
  office: <Briefcase size={32} className="text-nestup-accent" />,
};

export default function PresetSelectPage() {
  const router = useRouter();
  const { setRoomPreset } = useMeasurementFlow();

  const handleSelect = (presetId: string, presetLabel: string) => {
    setRoomPreset({ presetId, presetLabel, wallId: '', wallLabel: '' });
    router.push('/measurements/wall-select');
  };

  return (
    <div className="min-h-screen bg-nestup-warm">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/measurements"
          className="flex items-center gap-2 text-nestup-charcoal-light hover:text-nestup-charcoal mb-6 transition-colors w-fit"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-nestup-charcoal mb-3">
            Select room type
          </h1>
          <p className="text-lg text-nestup-charcoal-light">
            Choose the type of room you want to measure.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {ROOM_PRESETS.map((preset) => (
            <Card
              key={preset.id}
              hover
              className="cursor-pointer"
              onClick={() => handleSelect(preset.id, preset.label)}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-nestup bg-nestup-beige flex items-center justify-center flex-shrink-0">
                  {presetIcons[preset.id] ?? <BedDouble size={32} className="text-nestup-accent" />}
                </div>
                <div>
                  <h3 className="font-semibold text-nestup-charcoal text-lg">{preset.label}</h3>
                  <p className="text-sm text-nestup-charcoal-light">Measure walls in this room</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
