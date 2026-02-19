'use client';

import { useRouter } from 'next/navigation';
import { Ruler, Smartphone, Target } from 'lucide-react';
import { Button, BenefitCard } from '@/components/measurements';

export default function MeasurementsLandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-nestup-warm">
      <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fadeIn">
          <h1 className="text-5xl sm:text-6xl font-bold text-nestup-charcoal mb-6 leading-tight">
            Measure Your Wall<br />in 60 Seconds
          </h1>
          <p className="text-xl text-nestup-charcoal-light mb-8 max-w-2xl mx-auto leading-relaxed">
            AI-powered precision wall measurement using official Nestup markers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button onClick={() => router.push('/measurements/preset')}>
              Start Measurement
            </Button>
            <Button variant="secondary" onClick={() => router.push('/measurements/history')}>
              View History
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <BenefitCard
            icon={<Target size={48} strokeWidth={1.5} />}
            title="No Site Visit Required"
            description="Measure walls remotely with just your smartphone and Nestup markers."
          />
          <BenefitCard
            icon={<Ruler size={48} strokeWidth={1.5} />}
            title="±10-15mm Accuracy"
            description="Professional-grade precision using AI-powered ArUco marker detection."
          />
          <BenefitCard
            icon={<Smartphone size={48} strokeWidth={1.5} />}
            title="Works on Any Smartphone"
            description="No special equipment needed. Works with any modern smartphone camera."
          />
        </div>

        <div className="text-center">
          <p className="text-sm text-nestup-charcoal-light">
            Powered by Nestup AI Technology
          </p>
        </div>
      </div>
    </div>
  );
}
