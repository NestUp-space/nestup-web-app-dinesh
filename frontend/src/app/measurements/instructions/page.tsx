'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckSquare, Square, ArrowLeft } from 'lucide-react';
import { Button, Card } from '@/components/measurements';
import { useMeasurementFlow } from '@/context/MeasurementFlowContext';

export default function InstructionsPage() {
  const router = useRouter();
  const { roomPreset } = useMeasurementFlow();
  const [checklist, setChecklist] = useState({
    stickersPlaced: false,
    skirtingTouching: false,
    boardVisible: false,
    wallAccessible: false,
  });

  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const allChecked = Object.values(checklist).every((val) => val);

  const backHref = roomPreset?.presetId
    ? '/measurements/wall-select'
    : '/measurements/preset';

  return (
    <div className="min-h-screen bg-nestup-warm">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href={backHref}
          className="flex items-center gap-2 text-nestup-charcoal-light hover:text-nestup-charcoal mb-6 transition-colors w-fit"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-nestup-charcoal mb-3">
            Place Your Nestup Markers
          </h1>
          <p className="text-lg text-nestup-charcoal-light">
            Use the official Nestup sticker kit provided to you.
          </p>
        </div>

        <Card className="mb-8">
          <div className="aspect-video bg-nestup-beige rounded-nestup flex items-center justify-center mb-4">
            <div className="relative w-full h-full p-8">
              <svg viewBox="0 0 400 300" className="w-full h-full">
                <rect x="50" y="30" width="300" height="240" fill="none" stroke="#D4A574" strokeWidth="2" />
                <circle cx="70" cy="50" r="8" fill="#D4A574" />
                <text x="70" y="55" textAnchor="middle" fontSize="10" fill="white">A</text>
                <circle cx="330" cy="50" r="8" fill="#D4A574" />
                <text x="330" y="55" textAnchor="middle" fontSize="10" fill="white">A</text>
                <circle cx="70" cy="150" r="8" fill="#D4A574" />
                <text x="70" y="155" textAnchor="middle" fontSize="10" fill="white">S</text>
                <circle cx="330" cy="150" r="8" fill="#D4A574" />
                <text x="330" y="155" textAnchor="middle" fontSize="10" fill="white">S</text>
                <rect x="180" y="130" width="40" height="40" fill="#D4A574" opacity="0.6" rx="4" />
                <text x="200" y="155" textAnchor="middle" fontSize="12" fill="white" fontWeight="bold">C</text>
                <rect x="50" y="262" width="300" height="8" fill="#B8875E" />
                <text x="200" y="285" textAnchor="middle" fontSize="10" fill="#4A4A4A">Skirting Marker</text>
              </svg>
            </div>
          </div>
          <div className="text-center text-sm text-nestup-charcoal-light">
            <p className="font-medium">Marker Legend:</p>
            <p>A = ArUco Top Markers | S = Side Markers | C = CharuCo Board</p>
          </div>
        </Card>

        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          <Card>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-nestup-accent/10 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-nestup-accent font-bold">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-nestup-charcoal mb-2">Top Markers</h3>
                <p className="text-nestup-charcoal-light text-sm leading-relaxed">
                  Place two markers as high as you can reach on both sides.
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-nestup-accent/10 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-nestup-accent font-bold">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-nestup-charcoal mb-2">Side Markers</h3>
                <p className="text-nestup-charcoal-light text-sm leading-relaxed">
                  Place remaining markers midway on wall edges.
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-nestup-accent/10 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-nestup-accent font-bold">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-nestup-charcoal mb-2">Skirting Marker</h3>
                <p className="text-nestup-charcoal-light text-sm leading-relaxed">
                  Ensure the bottom edge touches the floor exactly.
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-nestup-accent/10 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-nestup-accent font-bold">4</span>
              </div>
              <div>
                <h3 className="font-semibold text-nestup-charcoal mb-2">CharuCo Board</h3>
                <p className="text-nestup-charcoal-light text-sm leading-relaxed">
                  Place the large board flat and clearly visible in the center.
                </p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="mb-8 bg-nestup-beige">
          <h3 className="font-semibold text-nestup-charcoal mb-3">Important Notes</h3>
          <ul className="space-y-2 text-nestup-charcoal-light text-sm">
            <li className="flex items-start gap-2">
              <span className="text-nestup-accent mt-0.5">✓</span>
              <span>Stickers must be flat with no bending or creases</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-nestup-accent mt-0.5">✓</span>
              <span>All markers must be clearly visible in the photo</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-nestup-accent mt-0.5">✓</span>
              <span>Avoid glossy or reflective surfaces that may cause glare</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-nestup-accent mt-0.5">✓</span>
              <span>Ensure adequate lighting for clear marker detection</span>
            </li>
          </ul>
        </Card>

        <Card className="mb-8">
          <h3 className="font-semibold text-nestup-charcoal mb-4">Confirmation Checklist</h3>
          <div className="space-y-3">
            <button
              onClick={() => toggleCheck('stickersPlaced')}
              className="flex items-center gap-3 w-full text-left hover:bg-nestup-warm p-2 rounded-nestup transition-colors"
            >
              {checklist.stickersPlaced ? (
                <CheckSquare size={24} className="text-nestup-success flex-shrink-0" />
              ) : (
                <Square size={24} className="text-nestup-charcoal-light flex-shrink-0" />
              )}
              <span className="text-nestup-charcoal">All Nestup stickers placed</span>
            </button>

            <button
              onClick={() => toggleCheck('skirtingTouching')}
              className="flex items-center gap-3 w-full text-left hover:bg-nestup-warm p-2 rounded-nestup transition-colors"
            >
              {checklist.skirtingTouching ? (
                <CheckSquare size={24} className="text-nestup-success flex-shrink-0" />
              ) : (
                <Square size={24} className="text-nestup-charcoal-light flex-shrink-0" />
              )}
              <span className="text-nestup-charcoal">Skirting marker touching floor</span>
            </button>

            <button
              onClick={() => toggleCheck('boardVisible')}
              className="flex items-center gap-3 w-full text-left hover:bg-nestup-warm p-2 rounded-nestup transition-colors"
            >
              {checklist.boardVisible ? (
                <CheckSquare size={24} className="text-nestup-success flex-shrink-0" />
              ) : (
                <Square size={24} className="text-nestup-charcoal-light flex-shrink-0" />
              )}
              <span className="text-nestup-charcoal">Center board clearly visible</span>
            </button>

            <button
              onClick={() => toggleCheck('wallAccessible')}
              className="flex items-center gap-3 w-full text-left hover:bg-nestup-warm p-2 rounded-nestup transition-colors"
            >
              {checklist.wallAccessible ? (
                <CheckSquare size={24} className="text-nestup-success flex-shrink-0" />
              ) : (
                <Square size={24} className="text-nestup-charcoal-light flex-shrink-0" />
              )}
              <span className="text-nestup-charcoal">Entire wall accessible and visible</span>
            </button>
          </div>
        </Card>

        <div className="flex justify-center">
          <Button
            onClick={() => router.push('/measurements/capture')}
            disabled={!allChecked}
            className={!allChecked ? 'opacity-50 cursor-not-allowed' : ''}
          >
            Continue to Camera
          </Button>
        </div>
      </div>
    </div>
  );
}
