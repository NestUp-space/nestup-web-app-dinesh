'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Save, RotateCcw, Home, Layout, PlusSquare, Copy, X, Pencil } from 'lucide-react';
import { Button, Card, MeasurementCard, ConfidenceBadge } from '@/components/measurements';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useMeasurementFlow } from '@/context/MeasurementFlowContext';
import { supabase } from '@/lib/measurements/supabase';
import type { MeasurementResult } from '@/lib/measurements/measurementApi';
import type { DesignPayload } from '@/lib/measurements/designTypes';

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

const FEATURE_COLORS: Record<string, string> = {
  window: 'rgba(59, 130, 246, 0.6)',
  door: 'rgba(34, 197, 94, 0.6)',
  switchboard: 'rgba(234, 179, 8, 0.6)',
};

const FEATURE_TYPES = ['window', 'door', 'switchboard'] as const;
type FeatureType = (typeof FEATURE_TYPES)[number];

function getFeatureLabel(type: string): string {
  return type === 'window' ? 'Window' : type === 'door' ? 'Door' : 'Switchboard';
}

function getFeatureSummaryFromFeatures(
  features: MeasurementResult['features']
): { windows: string; doors: string; switchboards: string } | null {
  if (features === undefined) return null;
  let windows = 0;
  let doors = 0;
  let switchboards = 0;
  for (const f of features) {
    if (f.type === 'window') windows++;
    else if (f.type === 'door') doors++;
    else if (f.type === 'switchboard') switchboards++;
  }
  return {
    windows: windows ? `${windows} window${windows > 1 ? 's' : ''} detected` : 'No windows found',
    doors: doors ? `${doors} door${doors > 1 ? 's' : ''} detected` : 'No doors found',
    switchboards: switchboards ? `${switchboards} switchboard${switchboards > 1 ? 's' : ''} detected` : 'No switchboards found',
  };
}

function AnnotatedImage({
  src,
  markers,
  features,
}: {
  src: string;
  markers?: Array<{ type: 'aruco' | 'charuco'; id: number; corners_px: number[][]; center_px: number[] }>;
  features?: MeasurementResult['features'];
}) {
  const [size, setSize] = useState({ w: 0, h: 0, natW: 0, natH: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    const onLoad = () => {
      const { naturalWidth: natW, naturalHeight: natH } = img;
      const rect = img.getBoundingClientRect();
      setSize({ w: rect.width, h: rect.height, natW, natH });
    };
    if (img.complete) onLoad();
    else img.addEventListener('load', onLoad);
    const ro = new ResizeObserver(() => {
      if (img.complete && img.naturalWidth) onLoad();
    });
    ro.observe(img);
    return () => {
      img.removeEventListener('load', onLoad);
      ro.disconnect();
    };
  }, [src]);

  const hasOverlay = (markers?.length ?? 0) > 0 || (features?.length ?? 0) > 0;
  const { natW, natH } = size;
  if (natW <= 0 || natH <= 0) {
    return <img ref={imgRef} src={src} alt="Wall capture" className="w-full h-full object-contain" />;
  }

  return (
    <div className="grid grid-cols-1 grid-rows-1 w-full h-full [&>*]:col-start-1 [&>*]:row-start-1">
      <img
        ref={imgRef}
        src={src}
        alt="Wall capture"
        className="w-full h-full object-contain"
      />
      {hasOverlay && (
        <svg
          className="w-full h-full min-w-0 min-h-0 pointer-events-none"
          viewBox={`0 0 ${natW} ${natH}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {markers?.map((m, i) => {
            const pts = m.corners_px?.flat().join(',');
            if (!pts) return null;
            return (
              <g key={`m-${i}`}>
                <polygon
                  points={pts}
                  fill="none"
                  stroke={m.type === 'charuco' ? '#7BA878' : '#D4A574'}
                  strokeWidth={Math.max(2, natW * 0.003)}
                />
                <text
                  x={m.center_px?.[0] ?? 0}
                  y={(m.center_px?.[1] ?? 0) - 8}
                  textAnchor="middle"
                  fill="white"
                  fontSize={Math.max(12, natW * 0.02)}
                  fontWeight="bold"
                  stroke="black"
                  strokeWidth={1}
                >
                  {m.type === 'charuco' ? 'ChArUco' : 'ArUco'}
                </text>
              </g>
            );
          })}
          {features?.map((f, i) => {
            const [x1, y1, x2, y2] = f.bbox_px ?? [0, 0, 0, 0];
            const w = x2 - x1;
            const h = y2 - y1;
            const label = f.type === 'window' ? 'Window' : f.type === 'door' ? 'Door' : 'Switchboard';
            const color = FEATURE_COLORS[f.type] ?? 'rgba(128,128,128,0.6)';
            return (
              <g key={`f-${i}`}>
                <rect
                  x={x1}
                  y={y1}
                  width={w}
                  height={h}
                  fill="none"
                  stroke={color}
                  strokeWidth={Math.max(2, natW * 0.003)}
                />
                <text
                  x={x1}
                  y={y1 - 4}
                  fill="white"
                  fontSize={Math.max(11, natW * 0.018)}
                  fontWeight="bold"
                  stroke="black"
                  strokeWidth={1}
                >
                  {label}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

export default function ResultsPage() {
  const router = useRouter();
  const { result, imageUrl, roomPreset, wallContext, setResult } = useMeasurementFlow();
  const imageUrlRef = useRef(imageUrl);

  const [showTechnical, setShowTechnical] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [animateNumbers, setAnimateNumbers] = useState(false);
  const [jsonCopied, setJsonCopied] = useState(false);
  const [editingFeatureIndex, setEditingFeatureIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{
    type: FeatureType;
    width_mm: number | '';
    height_mm: number | '';
    x_mm: number | '';
    y_mm: number | '';
  }>({ type: 'window', width_mm: '', height_mm: '', x_mm: '', y_mm: '' });

  const designPayload: DesignPayload | null = result
    ? { measurement: result, ...(wallContext && { wallContext }), ...(roomPreset && { roomPreset }) }
    : null;

  const handleCopyJson = () => {
    if (!designPayload) return;
    const json = JSON.stringify(designPayload, null, 2);
    navigator.clipboard.writeText(json).then(() => {
      setJsonCopied(true);
      setTimeout(() => setJsonCopied(false), 2000);
    });
  };

  const handleRemoveFeature = (index: number) => {
    if (!result?.features) return;
    const next = result.features.filter((_, i) => i !== index);
    setResult({ ...result, features: next });
  };

  const handleSaveEditedFeature = (index: number, updates: { type: FeatureType; width_mm?: number; height_mm?: number; x_mm?: number; y_mm?: number }) => {
    if (!result?.features || index < 0 || index >= result.features.length) return;
    const next = result.features.map((f, i) =>
      i === index
        ? { ...f, type: updates.type, ...(updates.width_mm != null && { width_mm: updates.width_mm }), ...(updates.height_mm != null && { height_mm: updates.height_mm }), ...(updates.x_mm != null && { x_mm: updates.x_mm }), ...(updates.y_mm != null && { y_mm: updates.y_mm }) }
        : f
    );
    setResult({ ...result, features: next });
    setEditingFeatureIndex(null);
  };

  const handleContinueToDesign = () => {
    if (!result) return;
    const minimalPayload = {
      wall_width_mm: result.wall_width_mm ?? 0,
      wall_height_mm: result.wall_height_mm ?? 0,
      ...(wallContext && { wallContext: { roomName: wallContext.roomName, direction: wallContext.direction } }),
      ...(roomPreset && { roomPreset: { presetLabel: roomPreset.presetLabel, wallLabel: roomPreset.wallLabel } }),
      features: result.features?.map((f) => ({
        type: f.type,
        x_mm: f.x_mm,
        y_mm: f.y_mm,
        width_mm: f.width_mm,
        height_mm: f.height_mm,
      })) ?? [],
    };
    try {
      sessionStorage.setItem('nestup_aruco_design_payload', JSON.stringify(minimalPayload));
    } catch {
      // ignore
    }
    const base =
      typeof window !== 'undefined'
        ? (process.env.NEXT_PUBLIC_ARUCO_APP_URL || window.location.origin).replace(/\/$/, '')
        : '';
    const json = JSON.stringify(minimalPayload);
    const base64 = btoa(unescape(encodeURIComponent(json)));
    const dataParam = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    if (base) {
      window.location.href = `${base}/visualiser/designer?fromArUco=1&data=${encodeURIComponent(dataParam)}`;
    }
  };

  useEffect(() => {
    imageUrlRef.current = imageUrl;
    return () => {
      if (imageUrlRef.current?.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrlRef.current);
      }
    };
  }, [imageUrl]);

  useEffect(() => {
    if (!result) router.replace('/measurements/capture');
  }, [result, router]);

  useEffect(() => {
    const t = setTimeout(() => setAnimateNumbers(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (editingFeatureIndex === null || !result?.features?.[editingFeatureIndex]) return;
    const f = result.features[editingFeatureIndex];
    const type = (FEATURE_TYPES.includes(f.type as FeatureType) ? f.type : 'window') as FeatureType;
    setEditForm({
      type,
      width_mm: f.width_mm ?? '',
      height_mm: f.height_mm ?? '',
      x_mm: f.x_mm ?? '',
      y_mm: f.y_mm ?? '',
    });
  }, [editingFeatureIndex, result?.features]);

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

  if (!result) return null;

  const hasArUco = result.status === 'success' && (result.wall_width_mm ?? 0) > 0 && (result.wall_height_mm ?? 0) > 0;
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
            {hasArUco ? 'Measurement Complete' : 'Detection Complete'}
          </h1>
          <p className="text-lg text-nestup-charcoal-light">
            {hasArUco ? 'Your wall has been successfully measured' : 'ArUco marker not detected. ChArUco marker not detected. Showing detected objects below.'}
          </p>
        </div>

        {(getFeatureSummaryFromFeatures(result.features) ?? result.feature_summary) && (
          <Card className="mb-6">
            <h3 className="font-semibold text-nestup-charcoal mb-3">Detected on wall</h3>
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="text-nestup-charcoal">
                {(getFeatureSummaryFromFeatures(result.features) ?? result.feature_summary)?.windows}
              </span>
              <span className="text-nestup-charcoal">
                {(getFeatureSummaryFromFeatures(result.features) ?? result.feature_summary)?.doors}
              </span>
              <span className="text-nestup-charcoal">
                {(getFeatureSummaryFromFeatures(result.features) ?? result.feature_summary)?.switchboards}
              </span>
            </div>
          </Card>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {hasArUco && (
            <>
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
            </>
          )}
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
              <AnnotatedImage
                src={imageUrl}
                markers={result.wall?.detected_markers}
                features={result.features}
              />
            ) : (
              <svg viewBox="0 0 400 300" className="w-full h-full">
                <rect x="0" y="0" width="400" height="300" fill="#EAE6DF" />
                <line x1="50" y1="50" x2="350" y2="50" stroke="#7BA878" strokeWidth="3" strokeDasharray="5,5" />
                <text x="200" y="45" textAnchor="middle" fontSize="12" fill="#7BA878" fontWeight="bold">Ceiling</text>
                <line x1="50" y1="250" x2="350" y2="250" stroke="#7BA878" strokeWidth="3" strokeDasharray="5,5" />
                <text x="200" y="267" textAnchor="middle" fontSize="12" fill="#7BA878" fontWeight="bold">Floor</text>
                <line x1="50" y1="50" x2="50" y2="250" stroke="#D4A574" strokeWidth="3" strokeDasharray="5,5" />
                <text x="30" y="150" textAnchor="middle" fontSize="12" fill="#D4A574" fontWeight="bold" transform="rotate(-90, 30, 150)">Left</text>
                <line x1="350" y1="50" x2="350" y2="250" stroke="#D4A574" strokeWidth="3" strokeDasharray="5,5" />
                <text x="370" y="150" textAnchor="middle" fontSize="12" fill="#D4A574" fontWeight="bold" transform="rotate(90, 370, 150)">Right</text>
                <rect x="180" y="130" width="40" height="40" fill="#D4A574" stroke="white" strokeWidth="2" rx="4" />
                <rect x="50" y="242" width="300" height="8" fill="#B8875E" stroke="white" strokeWidth="2" />
              </svg>
            )}
          </div>
          <p className="text-sm text-nestup-charcoal-light mt-4 text-center">
            {imageUrl ? 'Your wall image' : 'Detected markers and boundaries highlighted on your wall image'}
          </p>
        </Card>

        <Card className="mb-8">
          <button
            onClick={() => setShowTechnical(!showTechnical)}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="font-semibold text-nestup-charcoal">Technical Details</h3>
            {showTechnical ? <ChevronUp className="text-nestup-charcoal-light" /> : <ChevronDown className="text-nestup-charcoal-light" />}
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
                    {scaleStats.mean_mm_per_px != null ? scaleStats.mean_mm_per_px.toFixed(4) : '—'}
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
              <div className="pt-3 border-t border-nestup-sand">
                <p className="text-nestup-charcoal-light mb-2">Detected objects</p>
                {result.features && result.features.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {result.features.map((f, i) => {
                      const color = FEATURE_COLORS[f.type] ?? 'rgba(128,128,128,0.6)';
                      const label = getFeatureLabel(f.type);
                      const dims =
                        f.width_mm != null && f.height_mm != null
                          ? ` ${Math.round(f.width_mm)} × ${Math.round(f.height_mm)} mm`
                          : '';
                      return (
                        <div
                          key={i}
                          className="inline-flex items-center gap-1.5 pl-3 pr-1 py-1.5 rounded-full border-2 text-sm font-medium text-nestup-charcoal shadow-sm"
                          style={{ borderColor: color, backgroundColor: color.replace('0.6', '0.2') }}
                        >
                          <span>
                            {label}
                            {dims}
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingFeatureIndex(i)}
                            className="p-1 rounded hover:bg-black/10 text-nestup-charcoal-light hover:text-nestup-charcoal"
                            title="Edit"
                            aria-label="Edit object"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveFeature(i)}
                            className="p-1 rounded hover:bg-red-100 text-nestup-charcoal-light hover:text-red-600"
                            title="Remove"
                            aria-label="Remove object"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-nestup-charcoal-light text-sm">No objects detected</p>
                )}
              </div>
            </div>
          )}
        </Card>

        <Dialog
          open={editingFeatureIndex !== null}
          onOpenChange={(open) => !open && setEditingFeatureIndex(null)}
        >
          <DialogContent className="sm:max-w-md bg-nestup-warm border-nestup-sand">
            <DialogHeader>
              <DialogTitle className="text-nestup-charcoal">Edit object</DialogTitle>
            </DialogHeader>
            {editingFeatureIndex !== null && result?.features?.[editingFeatureIndex] && (
              <div className="grid gap-4 py-2">
                <div>
                  <label className="text-sm font-medium text-nestup-charcoal block mb-1.5">Type</label>
                  <select
                    value={editForm.type}
                    onChange={(e) => setEditForm((p) => ({ ...p, type: e.target.value as FeatureType }))}
                    className="w-full rounded-nestup border border-nestup-sand bg-white px-3 py-2 text-nestup-charcoal text-sm"
                  >
                    <option value="window">Window</option>
                    <option value="door">Door</option>
                    <option value="switchboard">Switchboard</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-nestup-charcoal block mb-1.5">Width (mm)</label>
                    <input
                      type="number"
                      min={0}
                      value={editForm.width_mm === '' ? '' : editForm.width_mm}
                      onChange={(e) =>
                        setEditForm((p) => ({
                          ...p,
                          width_mm: e.target.value === '' ? '' : Number(e.target.value),
                        }))
                      }
                      className="w-full rounded-nestup border border-nestup-sand bg-white px-3 py-2 text-nestup-charcoal text-sm"
                      placeholder="—"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-nestup-charcoal block mb-1.5">Height (mm)</label>
                    <input
                      type="number"
                      min={0}
                      value={editForm.height_mm === '' ? '' : editForm.height_mm}
                      onChange={(e) =>
                        setEditForm((p) => ({
                          ...p,
                          height_mm: e.target.value === '' ? '' : Number(e.target.value),
                        }))
                      }
                      className="w-full rounded-nestup border border-nestup-sand bg-white px-3 py-2 text-nestup-charcoal text-sm"
                      placeholder="—"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-nestup-charcoal block mb-1.5">X (mm)</label>
                    <input
                      type="number"
                      value={editForm.x_mm === '' ? '' : editForm.x_mm}
                      onChange={(e) =>
                        setEditForm((p) => ({
                          ...p,
                          x_mm: e.target.value === '' ? '' : Number(e.target.value),
                        }))
                      }
                      className="w-full rounded-nestup border border-nestup-sand bg-white px-3 py-2 text-nestup-charcoal text-sm"
                      placeholder="—"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-nestup-charcoal block mb-1.5">Y (mm)</label>
                    <input
                      type="number"
                      value={editForm.y_mm === '' ? '' : editForm.y_mm}
                      onChange={(e) =>
                        setEditForm((p) => ({
                          ...p,
                          y_mm: e.target.value === '' ? '' : Number(e.target.value),
                        }))
                      }
                      className="w-full rounded-nestup border border-nestup-sand bg-white px-3 py-2 text-nestup-charcoal text-sm"
                      placeholder="—"
                    />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="secondary"
                onClick={() => setEditingFeatureIndex(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (editingFeatureIndex === null) return;
                  handleSaveEditedFeature(editingFeatureIndex, {
                    type: editForm.type,
                    width_mm: editForm.width_mm === '' ? undefined : editForm.width_mm,
                    height_mm: editForm.height_mm === '' ? undefined : editForm.height_mm,
                    x_mm: editForm.x_mm === '' ? undefined : editForm.x_mm,
                    y_mm: editForm.y_mm === '' ? undefined : editForm.y_mm,
                  });
                }}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card className="mb-8">
          <button
            onClick={() => setShowJson(!showJson)}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="font-semibold text-nestup-charcoal">API response (JSON)</h3>
            {showJson ? <ChevronUp className="text-nestup-charcoal-light" /> : <ChevronDown className="text-nestup-charcoal-light" />}
          </button>
          {showJson && designPayload && (
            <div className="mt-4 pt-4 border-t border-nestup-sand">
              <div className="flex justify-end mb-2">
                <Button variant="secondary" onClick={handleCopyJson} className="flex items-center gap-2 text-sm py-2">
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
          <Button onClick={handleSave} disabled={saving || saved} className="flex items-center gap-2">
            <Save size={20} />
            {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Measurement'}
          </Button>
          <Button variant="secondary" onClick={() => router.push('/measurements/capture')} className="flex items-center gap-2">
            <RotateCcw size={20} />
            Measure Another Wall
          </Button>
          <Button variant="secondary" onClick={() => router.push('/measurements/wall-details')} className="flex items-center gap-2">
            <PlusSquare size={20} />
            Next wall
          </Button>
          <Button onClick={handleContinueToDesign} disabled={!hasArUco} className="flex items-center gap-2" title={!hasArUco ? 'Wall dimensions required' : undefined}>
            <Layout size={20} />
            Continue to design
          </Button>
          <Button variant="tertiary" onClick={() => router.push('/measurements')} className="flex items-center gap-2">
            <Home size={20} />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
