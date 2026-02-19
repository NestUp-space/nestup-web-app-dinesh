'use client';

import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { AlertCircle, Camera, Grid3x3, Scale, Wifi, type LucideIcon } from 'lucide-react';
import { Card, Button } from '@/components/measurements';

const errorTypes: Record<
  string,
  { icon: LucideIcon; title: string; description: string; suggestions: string[] }
> = {
  no_markers: {
    icon: Grid3x3,
    title: 'No Markers Detected',
    description: "We couldn't find any Nestup markers in your image.",
    suggestions: [
      'Ensure all markers are clearly visible and not obscured',
      'Check that lighting is adequate for clear marker detection',
      'Make sure markers are flat without bending or creases',
      'Verify you\'re using official Nestup markers',
    ],
  },
  insufficient_charuco: {
    icon: Grid3x3,
    title: 'Insufficient CharuCo Markers',
    description: 'We detected fewer than 12 CharuCo markers needed for accurate measurement.',
    suggestions: [
      'Ensure the entire CharuCo board is visible in the photo',
      'Move closer or adjust angle to capture the full board',
      'Check that the board is well-lit and not in shadow',
      'Make sure the board is flat against the wall',
    ],
  },
  scale_inconsistency: {
    icon: Scale,
    title: 'Scale Inconsistency Detected',
    description: 'The markers show inconsistent scaling, which may affect accuracy.',
    suggestions: [
      'Ensure all markers are placed at the same distance from the camera',
      'Check that markers are flat and not bent or warped',
      'Verify the wall surface is relatively flat',
      'Retake the photo from a centered position',
    ],
  },
  low_confidence: {
    icon: AlertCircle,
    title: 'Low Confidence Measurement',
    description: 'The measurement was completed but with lower than ideal confidence.',
    suggestions: [
      'Retake the photo with better lighting conditions',
      'Ensure all markers are clearly visible',
      'Check that the entire wall is captured in the frame',
      'Try adjusting the camera angle for a more direct view',
    ],
  },
  api_error: {
    icon: Wifi,
    title: 'Connection Error',
    description:
      "We couldn't process your measurement due to a connection issue. Make sure the measurement backend is running (e.g. cd vision-service && python -m uvicorn main:app --host 0.0.0.0 --port 8000).",
    suggestions: [
      'Ensure the vision-service backend is running on port 8000',
      'Check your network connection',
      'Try again in a few moments',
      'If the problem persists, contact Nestup support',
    ],
  },
  camera_error: {
    icon: Camera,
    title: 'Camera Access Error',
    description: "We couldn't access your camera to capture the image.",
    suggestions: [
      'Grant camera permission in your browser settings',
      'Check that no other app is using the camera',
      'Try refreshing the page and allowing camera access',
      'Alternatively, you can upload a photo instead',
    ],
  },
};

export default function ErrorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorType = (searchParams.get('type') || 'api_error') as string;
  const messageParam = searchParams.get('message');
  const error = errorTypes[errorType] || errorTypes.api_error;
  const Icon = error.icon;

  return (
    <div className="min-h-screen bg-nestup-warm flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card>
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-nestup-error/10 flex items-center justify-center">
              <Icon size={32} className="text-nestup-error" />
            </div>
            <h1 className="text-2xl font-bold text-nestup-charcoal mb-2">
              {error.title}
            </h1>
            <p className="text-nestup-charcoal-light">{error.description}</p>
            {errorType === 'api_error' && messageParam && (
              <p className="mt-3 text-sm text-nestup-charcoal-light font-mono bg-nestup-beige/50 px-3 py-2 rounded-nestup break-all">
                {decodeURIComponent(messageParam)}
              </p>
            )}
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-nestup-charcoal mb-3">
              Here&apos;s how to fix it:
            </h3>
            <ul className="space-y-2">
              {error.suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-nestup-charcoal-light text-sm"
                >
                  <span className="text-nestup-accent mt-0.5">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => router.push('/measurements/capture')}>
              Try Again
            </Button>
            <Button variant="secondary" onClick={() => router.push('/measurements/instructions')}>
              Review Instructions
            </Button>
            <Button variant="tertiary" onClick={() => router.push('/measurements')}>
              Back to Home
            </Button>
          </div>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-nestup-charcoal-light">
            Need help? Contact{' '}
            <a href="mailto:support@nestup.com" className="text-nestup-accent hover:underline">
              support@nestup.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
