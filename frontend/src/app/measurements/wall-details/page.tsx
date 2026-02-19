'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Compass } from 'lucide-react';
import { Button, Card } from '@/components/measurements';
import { DIRECTION_OPTIONS, type WallDirection } from '@/lib/measurements/designTypes';
import { useMeasurementFlow } from '@/context/MeasurementFlowContext';

export default function WallDetailsPage() {
  const router = useRouter();
  const { setWallContext } = useMeasurementFlow();
  const [roomName, setRoomName] = useState('');
  const [direction, setDirection] = useState<WallDirection>('East');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    setWallContext({ roomName: roomName.trim(), direction });
    router.push('/measurements/capture');
  };

  return (
    <div className="min-h-screen bg-nestup-warm">
      <div className="max-w-md mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/measurements/results"
          className="flex items-center gap-2 text-nestup-charcoal-light hover:text-nestup-charcoal mb-6 transition-colors w-fit"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-nestup-charcoal mb-3">
            Enter wall details
          </h1>
          <p className="text-lg text-nestup-charcoal-light">
            Add details for the next wall you want to measure.
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="roomName" className="block text-sm font-medium text-nestup-charcoal mb-2">
                Room name
              </label>
              <input
                id="roomName"
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="e.g. Master Bedroom"
                className="w-full px-4 py-3 rounded-nestup border-2 border-nestup-sand bg-white text-nestup-charcoal placeholder:text-nestup-charcoal-light focus:border-nestup-accent focus:outline-none"
                required
              />
            </div>
            <div>
              <label htmlFor="direction" className="block text-sm font-medium text-nestup-charcoal mb-2">
                <span className="flex items-center gap-2">
                  <Compass size={16} className="text-nestup-accent" />
                  Direction
                </span>
              </label>
              <select
                id="direction"
                value={direction}
                onChange={(e) => setDirection(e.target.value as WallDirection)}
                className="w-full px-4 py-3 rounded-nestup border-2 border-nestup-sand bg-white text-nestup-charcoal focus:border-nestup-accent focus:outline-none"
              >
                {DIRECTION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" className="w-full">
              Start measuring this wall
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
