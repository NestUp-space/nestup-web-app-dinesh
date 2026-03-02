import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronUp, Save, RotateCcw, Home, Layout, PlusSquare, Copy } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { MeasurementCard } from '../components/MeasurementCard';
import { ConfidenceBadge } from '../components/ConfidenceBadge';
import { supabase } from '../lib/supabase';
import type { MeasurementResult } from '../lib/measurementApi';
import type { DesignPayload, RoomPresetAndWall, WallContext } from '../lib/designTypes';

type ConfidenceLevel = 'high' | 'medium' | 'low';

function mapConfidence(
  c: 'high' | 'medium' | 'low' | 'very_low' | null | undefined
): ConfidenceLevel {
  if (c === 'high' || c === 'medium' || c === 'low') return c;
  return 'low';
}

function getMarkerCounts(result: MeasurementResult) {
  const markers = result.wall?.detected_markers ?? [];
  let charuco = 0;
  let aruco = 0;
  for (const m of markers) {
    if (m.type === 'charuco') charuco++;
    else if (m.type === 'aruco') aruco++;
  }
  return { charuco, aruco };
}

export function Results() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as {
    result?: MeasurementResult;
    imageUrl?: string;
    roomPreset?: RoomPresetAndWall;
    wallContext?: WallContext;
  } | undefined;
  const result = state?.result;
  const imageUrl = state?.imageUrl;
  const roomPreset = state?.roomPreset;
  const wallContext = state?.wallContext;
  const imageUrlRef = useRef(imageUrl);

  const [showTechnical, setShowTechnical] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [animateNumbers, setAnimateNumbers] = useState(false);
  const [jsonCopied, setJsonCopied] = useState(false);

  const designPayload: DesignPayload = {
    measurement: result!,
    ...(wallContext && { wallContext }),
    ...(roomPreset && { roomPreset }),
  };

  const handleCopyJson = () => {
    const json = JSON.stringify(designPayload, null, 2);
    navigator.clipboard.writeText(json).then(() => {
      setJsonCopied(true);
      setTimeout(() => setJsonCopied(false), 2000);
    });
  };

  /** Pass measurement to Visualiser designer (Next.js). Redirect to Visualiser URL with payload in query for cross-origin. */
  const handleContinueToDesign = () => {
    if (!result) return;
    const minimalPayload = {
      wall_width_mm: result.wall_width_mm ?? 0,
      wall_height_mm: result.wall_height_mm ?? 0,
      ...(wallContext && { wallContext: { roomName: wallContext.roomName, direction: wallContext.direction } }),
      ...(roomPreset && { roomPreset: { presetLabel: roomPreset.presetLabel, wallLabel: roomPreset.wallLabel } }),
    };
    try {
      sessionStorage.setItem('nestup_aruco_design_payload', JSON.stringify(minimalPayload));
    } catch {
      // ignore storage errors
    }
    const env = (import.meta as { env?: { VITE_VISUALISER_URL?: string } }).env;
    let base: string;
    if (window.location.hostname === 'localhost') {
      base = 'http://localhost:3000';
    } else if (env?.VITE_VISUALISER_URL) {
      base = env.VITE_VISUALISER_URL;
    } else {
      base = window.location.origin;
    }
    base = base.replace(/\/$/, '');
    const json = JSON.stringify(minimalPayload);
    const base64 = btoa(unescape(encodeURIComponent(json)));
    const dataParam = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    window.location.href = `${base}/visualiser/designer?fromArUco=1&data=${encodeURIComponent(dataParam)}`;
  };

  // Revoke blob URL on unmount
  useEffect(() => {
    imageUrlRef.current = imageUrl;
    return () => {
      if (imageUrlRef.current?.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrlRef.current);
      }
    };
  }, [imageUrl]);

  // Redirect if no result
  useEffect(() => {
    if (!result) {
      navigate('/capture', { replace: true });
    }
  }, [result, navigate]);

  useEffect(() => {
    setTimeout(() => setAnimateNumbers(true), 100);
  }, []);

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const { charuco, aruco } = getMarkerCounts(result);
      const uncertainty_mm =
        result.wall_width_uncertainty_mm != null && result.wall_height_uncertainty_mm != null
          ? Math.round(
              (result.wall_width_uncertainty_mm + result.wall_height_uncertainty_mm) / 2
            )
          : result.wall_width_uncertainty_mm ?? result.wall_height_uncertainty_mm ?? 0;
      const confidence = mapConfidence(
        result.wall_width_confidence ?? result.wall_height_confidence
      );

      const { error } = await supabase.from('measurements').insert({
        wall_height_mm: result.wall_height_mm ?? 0,
        wall_width_mm: result.wall_width_mm ?? 0,
        uncertainty_mm,
        confidence,
        charuco_markers: charuco,
        aruco_markers: aruco,
        skirting_detected: false,
        measurement_date: new Date().toISOString().slice(0, 10),
      });

      if (!error) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  if (!result) {
    return null;
  }

  const wallHeightMm = result.wall_height_mm ?? 0;
  const wallWidthMm = result.wall_width_mm ?? 0;
  const uncertaintyMm =
    result.wall_width_uncertainty_mm != null && result.wall_height_uncertainty_mm != null
      ? Math.round(
          (result.wall_width_uncertainty_mm + result.wall_height_uncertainty_mm) / 2
        )
      : result.wall_width_uncertainty_mm ?? result.wall_height_uncertainty_mm ?? 0;
  const confidence = mapConfidence(
    result.wall_width_confidence ?? result.wall_height_confidence
  );
  const { charuco: charucoCount, aruco: arucoCount } = getMarkerCounts(result);
  const calibration = result.calibration as {
    height_methods?: Record<string, number>;
    scale_statistics?: { mean_mm_per_px?: number; std_dev_mm_per_px?: number };
  } | undefined;
  const heightMethods = calibration?.height_methods;
  const scaleStats = calibration?.scale_statistics;

  return (
    <div className="min-h-screen bg-nestup-warm">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-nestup-charcoal mb-3">
            Measurement Complete
          </h1>
          <p className="text-lg text-nestup-charcoal-light">
            Your wall has been successfully measured
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div
            className={`transition-all duration-700 ${
              animateNumbers ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <MeasurementCard
              label="Wall Height"
              value={wallHeightMm}
              unit="mm"
              subValue={`${(wallHeightMm / 1000).toFixed(2)} meters`}
            />
          </div>

          <div
            className={`transition-all duration-700 delay-100 ${
              animateNumbers ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <MeasurementCard
              label="Wall Width"
              value={wallWidthMm}
              unit="mm"
              subValue={`${(wallWidthMm / 1000).toFixed(2)} meters`}
            />
          </div>

          <div
            className={`transition-all duration-700 delay-200 ${
              animateNumbers ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <Card>
              <div className="text-center">
                <p className="text-sm text-nestup-charcoal-light mb-3">Confidence</p>
                <div className="flex justify-center">
                  <ConfidenceBadge level={confidence} />
                </div>
              </div>
            </Card>
          </div>

          <div
            className={`transition-all duration-700 delay-300 ${
              animateNumbers ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <Card>
              <div className="text-center">
                <p className="text-sm text-nestup-charcoal-light mb-2">Uncertainty</p>
                <div className="text-3xl font-bold text-nestup-charcoal">
                  ±{uncertaintyMm}
                  <span className="text-lg ml-1">mm</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <Card className="mb-8">
          <h3 className="font-semibold text-nestup-charcoal mb-4">Annotated Image</h3>
          <div className="aspect-video bg-nestup-beige rounded-nestup flex items-center justify-center relative overflow-hidden">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Wall capture"
                className="w-full h-full object-contain"
              />
            ) : (
              <svg viewBox="0 0 400 300" className="w-full h-full">
                <rect x="0" y="0" width="400" height="300" fill="#EAE6DF" />
                <line
                  x1="50"
                  y1="50"
                  x2="350"
                  y2="50"
                  stroke="#7BA878"
                  strokeWidth="3"
                  strokeDasharray="5,5"
                />
                <text
                  x="200"
                  y="45"
                  textAnchor="middle"
                  fontSize="12"
                  fill="#7BA878"
                  fontWeight="bold"
                >
                  Ceiling
                </text>
                <line
                  x1="50"
                  y1="250"
                  x2="350"
                  y2="250"
                  stroke="#7BA878"
                  strokeWidth="3"
                  strokeDasharray="5,5"
                />
                <text
                  x="200"
                  y="267"
                  textAnchor="middle"
                  fontSize="12"
                  fill="#7BA878"
                  fontWeight="bold"
                >
                  Floor
                </text>
                <line
                  x1="50"
                  y1="50"
                  x2="50"
                  y2="250"
                  stroke="#D4A574"
                  strokeWidth="3"
                  strokeDasharray="5,5"
                />
                <text
                  x="30"
                  y="150"
                  textAnchor="middle"
                  fontSize="12"
                  fill="#D4A574"
                  fontWeight="bold"
                  transform="rotate(-90, 30, 150)"
                >
                  Left
                </text>
                <line
                  x1="350"
                  y1="50"
                  x2="350"
                  y2="250"
                  stroke="#D4A574"
                  strokeWidth="3"
                  strokeDasharray="5,5"
                />
                <text
                  x="370"
                  y="150"
                  textAnchor="middle"
                  fontSize="12"
                  fill="#D4A574"
                  fontWeight="bold"
                  transform="rotate(90, 370, 150)"
                >
                  Right
                </text>
                <rect
                  x="180"
                  y="130"
                  width="40"
                  height="40"
                  fill="#D4A574"
                  stroke="white"
                  strokeWidth="2"
                  rx="4"
                />
                <rect
                  x="50"
                  y="242"
                  width="300"
                  height="8"
                  fill="#B8875E"
                  stroke="white"
                  strokeWidth="2"
                />
              </svg>
            )}
          </div>
          <p className="text-sm text-nestup-charcoal-light mt-4 text-center">
            {imageUrl
              ? 'Your wall image'
              : 'Detected markers and boundaries highlighted on your wall image'}
          </p>
        </Card>

        <Card className="mb-8">
          <button
            onClick={() => setShowTechnical(!showTechnical)}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="font-semibold text-nestup-charcoal">Technical Details</h3>
            {showTechnical ? (
              <ChevronUp className="text-nestup-charcoal-light" />
            ) : (
              <ChevronDown className="text-nestup-charcoal-light" />
            )}
          </button>

          {showTechnical && (
            <div className="mt-4 pt-4 border-t border-nestup-sand space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-nestup-charcoal-light">CharuCo markers detected:</span>
                <span className="text-nestup-charcoal font-medium">{charucoCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-nestup-charcoal-light">ArUco markers detected:</span>
                <span className="text-nestup-charcoal font-medium">{arucoCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-nestup-charcoal-light">Skirting marker detected:</span>
                <span className="text-nestup-charcoal font-medium">No</span>
              </div>
              {scaleStats && (
                <div className="flex justify-between">
                  <span className="text-nestup-charcoal-light">Scale (mm/px):</span>
                  <span className="text-nestup-charcoal font-medium">
                    {scaleStats.mean_mm_per_px != null
                      ? scaleStats.mean_mm_per_px.toFixed(4)
                      : '—'}
                  </span>
                </div>
              )}
              {heightMethods && Object.keys(heightMethods).length > 0 && (
                <div className="pt-3 border-t border-nestup-sand">
                  <p className="text-nestup-charcoal-light mb-2">Height calculation methods:</p>
                  <ul className="space-y-1 ml-4">
                    {Object.entries(heightMethods).map(([method, value]) => (
                      <li key={method} className="text-nestup-charcoal">
                        {method}: {value}mm
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Card>

        <Card className="mb-8">
          <button
            onClick={() => setShowJson(!showJson)}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="font-semibold text-nestup-charcoal">API response (JSON)</h3>
            {showJson ? (
              <ChevronUp className="text-nestup-charcoal-light" />
            ) : (
              <ChevronDown className="text-nestup-charcoal-light" />
            )}
          </button>
          {showJson && (
            <div className="mt-4 pt-4 border-t border-nestup-sand">
              <div className="flex justify-end mb-2">
                <Button
                  variant="secondary"
                  onClick={handleCopyJson}
                  className="flex items-center gap-2 text-sm py-2"
                >
                  <Copy size={16} />
                  {jsonCopied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
              <pre className="p-4 bg-nestup-beige rounded-nestup text-xs text-nestup-charcoal overflow-auto max-h-80 font-mono whitespace-pre-wrap break-all">
                {JSON.stringify(designPayload, null, 2)}
              </pre>
            </div>
          )}
        </Card>

        <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center items-center">
          <Button
            onClick={handleSave}
            disabled={saving || saved}
            className="flex items-center gap-2"
          >
            <Save size={20} />
            {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Measurement'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate('/capture', { state: { roomPreset, wallContext } })}
            className="flex items-center gap-2"
          >
            <RotateCcw size={20} />
            Measure Another Wall
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate('/wall-details')}
            className="flex items-center gap-2"
          >
            <PlusSquare size={20} />
            Next wall
          </Button>
          <Button
            onClick={handleContinueToDesign}
            className="flex items-center gap-2"
          >
            <Layout size={20} />
            Continue to design
          </Button>
          <Button variant="tertiary" onClick={() => navigate('/')} className="flex items-center gap-2">
            <Home size={20} />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
