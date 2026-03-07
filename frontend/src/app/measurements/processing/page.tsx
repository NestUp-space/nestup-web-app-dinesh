'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Circle } from 'lucide-react';
import { Card } from '@/components/measurements';
import { useMeasurementFlow } from '@/context/MeasurementFlowContext';
import { measureWall, type MeasurementResult } from '@/lib/measurements/measurementApi';

const steps = [
  { id: 1, label: 'Detecting markers...', duration: 1500 },
  { id: 2, label: 'Calibrating scale...', duration: 2000 },
  { id: 3, label: 'Identifying boundaries...', duration: 1800 },
  { id: 4, label: 'Validating measurements...', duration: 1700 },
];

export default function ProcessingPage() {
  const router = useRouter();
  const { imageFile, setResult, setImageUrl } = useMeasurementFlow();

  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResultLocal] = useState<MeasurementResult | null>(null);
  const [imageUrl, setImageUrlLocal] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!imageFile) {
      router.replace('/measurements/capture');
      return;
    }
    const blobUrl = URL.createObjectURL(imageFile);
    blobUrlRef.current = blobUrl;
    setImageUrlLocal(blobUrl);

    let cancelled = false;
    measureWall(imageFile)
      .then((data) => {
        if (cancelled) return;
        // Always go to results: when failed we still show feature_summary (windows, doors, switchboards)
        setResultLocal(data);
      })
      .catch((err: Error) => {
        if (!cancelled) {
          const message =
            err.message ||
            'Backend not reachable. Start vision-service: cd vision-service && python -m uvicorn main:app --host 0.0.0.0 --port 8000';
          router.replace(
            `/measurements/error?type=api_error&message=${encodeURIComponent(message)}`
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [imageFile, router]);

  useEffect(() => {
    if (!imageFile) return;
    if (currentStep < steps.length) {
      const timer = setTimeout(() => {
        setCurrentStep((s) => s + 1);
      }, steps[currentStep].duration);
      return () => clearTimeout(timer);
    }
  }, [imageFile, currentStep]);

  useEffect(() => {
    if (!imageFile || !result || currentStep < steps.length) return;
    setResult(result);
    setImageUrl(blobUrlRef.current ?? imageUrl ?? undefined);
    const timer = setTimeout(() => {
      router.replace('/measurements/results');
    }, 500);
    return () => clearTimeout(timer);
  }, [imageFile, result, currentStep, router, imageUrl, setResult, setImageUrl]);

  if (!imageFile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-nestup-warm flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <div className="absolute inset-0 border-4 border-nestup-sand rounded-full" />
            <div className="absolute inset-0 border-4 border-nestup-accent rounded-full border-t-transparent animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-nestup-charcoal mb-2">
            Analyzing Your Wall
          </h2>
          <p className="text-nestup-charcoal-light text-sm">
            This usually takes 5-10 seconds.
          </p>
        </div>

        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center gap-3 transition-all duration-300 ${
                index <= currentStep ? 'opacity-100' : 'opacity-40'
              }`}
            >
              {index < currentStep ? (
                <CheckCircle size={24} className="text-nestup-success flex-shrink-0" />
              ) : index === currentStep ? (
                <div className="relative w-6 h-6 flex-shrink-0">
                  <Circle size={24} className="text-nestup-accent absolute inset-0" />
                  <div className="absolute inset-0 w-6 h-6">
                    <div className="w-full h-full border-2 border-nestup-accent rounded-full border-t-transparent animate-spin" />
                  </div>
                </div>
              ) : (
                <Circle size={24} className="text-nestup-charcoal-light flex-shrink-0" />
              )}
              <span
                className={`text-sm ${
                  index <= currentStep
                    ? 'text-nestup-charcoal font-medium'
                    : 'text-nestup-charcoal-light'
                }`}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-8 border-t border-nestup-sand">
          <div className="flex justify-between text-xs text-nestup-charcoal-light">
            <span>
              Step {Math.min(currentStep + 1, steps.length)} of {steps.length}
            </span>
            <span>
              {Math.min(Math.round(((currentStep + 1) / steps.length) * 100), 100)}%
            </span>
          </div>
          <div className="mt-2 h-2 bg-nestup-sand rounded-full overflow-hidden">
            <div
              className="h-full bg-nestup-accent transition-all duration-500 ease-out"
              style={{
                width: `${Math.min(((currentStep + 1) / steps.length) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
