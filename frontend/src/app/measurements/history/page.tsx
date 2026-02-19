'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Ruler } from 'lucide-react';
import { Card, ConfidenceBadge, Button } from '@/components/measurements';
import { supabase } from '@/lib/measurements/supabase';
import type { Measurement } from '@/lib/measurements/supabase';

export default function HistoryPage() {
  const router = useRouter();
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMeasurements();
  }, []);

  const loadMeasurements = async () => {
    try {
      const { data, error } = await supabase
        .from('measurements')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setMeasurements(data as Measurement[]);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-nestup-warm">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/measurements"
          className="flex items-center gap-2 text-nestup-charcoal-light hover:text-nestup-charcoal mb-6 transition-colors w-fit"
        >
          <ArrowLeft size={20} />
          <span>Back to Home</span>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-nestup-charcoal mb-3">
            Measurement History
          </h1>
          <p className="text-lg text-nestup-charcoal-light">
            View all your saved wall measurements
          </p>
        </div>

        {loading ? (
          <Card>
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-4 relative">
                <div className="absolute inset-0 border-4 border-nestup-sand rounded-full" />
                <div className="absolute inset-0 border-4 border-nestup-accent rounded-full border-t-transparent animate-spin" />
              </div>
              <p className="text-nestup-charcoal-light">Loading measurements...</p>
            </div>
          </Card>
        ) : measurements.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Ruler size={48} className="mx-auto mb-4 text-nestup-charcoal-light" />
              <h3 className="text-xl font-semibold text-nestup-charcoal mb-2">
                No Measurements Yet
              </h3>
              <p className="text-nestup-charcoal-light mb-6">
                Start by measuring your first wall
              </p>
              <Button onClick={() => router.push('/measurements/instructions')}>
                Start Measurement
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {measurements.map((measurement) => (
              <Card key={measurement.id} hover className="cursor-pointer transition-all duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar size={16} className="text-nestup-charcoal-light" />
                      <span className="text-sm text-nestup-charcoal-light">
                        {formatDate(measurement.created_at)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-nestup-charcoal-light mb-1">Height</p>
                        <p className="text-xl font-bold text-nestup-charcoal">
                          {measurement.wall_height_mm.toLocaleString()}
                          <span className="text-sm ml-1">mm</span>
                        </p>
                        <p className="text-xs text-nestup-charcoal-light">
                          {(measurement.wall_height_mm / 1000).toFixed(2)}m
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-nestup-charcoal-light mb-1">Width</p>
                        <p className="text-xl font-bold text-nestup-charcoal">
                          {measurement.wall_width_mm.toLocaleString()}
                          <span className="text-sm ml-1">mm</span>
                        </p>
                        <p className="text-xs text-nestup-charcoal-light">
                          {(measurement.wall_width_mm / 1000).toFixed(2)}m
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-start sm:items-end gap-2">
                    <ConfidenceBadge level={measurement.confidence} />
                    <span className="text-xs text-nestup-charcoal-light">
                      ±{measurement.uncertainty_mm}mm uncertainty
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-nestup-sand flex gap-4 text-xs text-nestup-charcoal-light">
                  <span>CharuCo: {measurement.charuco_markers}</span>
                  <span>ArUco: {measurement.aruco_markers}</span>
                  <span>Skirting: {measurement.skirting_detected ? 'Yes' : 'No'}</span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {measurements.length > 0 && (
          <div className="mt-8 text-center">
            <Button variant="secondary" onClick={() => router.push('/measurements/instructions')}>
              Measure Another Wall
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
