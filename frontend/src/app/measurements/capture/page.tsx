'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Camera, Upload, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/measurements';
import { useMeasurementFlow } from '@/context/MeasurementFlowContext';

export default function CapturePage() {
  const router = useRouter();
  const { setImageFile } = useMeasurementFlow();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFileState] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFileState(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCapture = () => {
    if (imagePreview && imageFile) {
      setImageFile(imageFile, imagePreview);
      router.push('/measurements/processing');
    } else if (!imagePreview) {
      fileInputRef.current?.click();
    }
  };

  const handleRetake = () => {
    setImagePreview(null);
    setImageFileState(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-nestup-charcoal flex flex-col">
      <div className="p-4 flex items-center justify-between">
        <Link
          href="/measurements/instructions"
          className="flex items-center gap-2 text-white hover:text-nestup-sand transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </Link>
        <div className="text-white text-sm font-medium">
          Nestup Wall Measurement
        </div>
        <div className="w-16" />
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative w-full max-w-2xl aspect-[3/4] bg-nestup-charcoal-light rounded-nestup-lg overflow-hidden">
          {imagePreview ? (
            <img
              src={imagePreview}
              alt="Wall capture"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-white">
              <Camera size={64} className="mb-4 opacity-50" />
              <p className="text-lg mb-2">Click below to capture or upload</p>
              <p className="text-sm opacity-75">Ensure entire wall is visible</p>
            </div>
          )}

          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line x1="50" y1="0" x2="50" y2="100" stroke="white" strokeWidth="0.2" opacity="0.3" strokeDasharray="2,2" />
            <line x1="5" y1="0" x2="5" y2="100" stroke="white" strokeWidth="0.2" opacity="0.3" />
            <line x1="95" y1="0" x2="95" y2="100" stroke="white" strokeWidth="0.2" opacity="0.3" />
            <line x1="0" y1="95" x2="100" y2="95" stroke="#D4A574" strokeWidth="0.3" opacity="0.6" />
            <circle cx="15" cy="10" r="1.5" fill="none" stroke="#D4A574" strokeWidth="0.3" />
            <circle cx="85" cy="10" r="1.5" fill="none" stroke="#D4A574" strokeWidth="0.3" />
            <rect x="45" y="45" width="10" height="10" fill="none" stroke="#D4A574" strokeWidth="0.3" />
          </svg>

          {!imagePreview && (
            <div className="absolute top-4 left-0 right-0 text-center">
              <div className="inline-block bg-black/50 text-white px-4 py-2 rounded-nestup text-sm backdrop-blur-sm">
                Ensure entire wall is visible
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 flex gap-4 justify-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        {imagePreview ? (
          <>
            <Button variant="secondary" onClick={handleRetake}>
              Retake
            </Button>
            <Button onClick={handleCapture}>
              Process Image
            </Button>
          </>
        ) : (
          <Button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2">
            <Upload size={20} />
            Capture or Upload Photo
          </Button>
        )}
      </div>
    </div>
  );
}
