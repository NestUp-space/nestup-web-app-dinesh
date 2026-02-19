/**
 * Vision-service API client for wall measurement.
 * Uses NEXT_PUBLIC_MEASUREMENT_API_URL (default http://127.0.0.1:8000).
 */

export const API_BASE_URL =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_MEASUREMENT_API_URL) ||
  'http://127.0.0.1:8000';

export interface MeasurementResult {
  status: 'success' | 'failed';
  wall_width_mm: number | null;
  wall_height_mm: number | null;
  aruco_id: number | null;
  mm_per_pixel: number | null;
  confidence_score: number;
  geometry_valid: boolean;
  error_message: string | null;
  wall_width_uncertainty_mm: number | null;
  wall_height_uncertainty_mm: number | null;
  wall_width_confidence: 'high' | 'medium' | 'low' | 'very_low' | null;
  wall_height_confidence: 'high' | 'medium' | 'low' | 'very_low' | null;
  guidance: string | null;
  calibration?: Record<string, unknown>;
  wall?: {
    corners_px?: number[][];
    width_px?: number;
    height_px?: number;
    detected_markers?: Array<{ type: 'aruco' | 'charuco'; id: number; corners_px: number[][]; center_px: number[] }>;
    detection_details?: unknown;
    uncertainty?: unknown;
  };
  processing_time_ms?: number;
}

export interface MeasureWallOptions {
  distance_mm?: number;
  intrinsics_mm_per_px?: number;
  laser_width_mm?: string;
  laser_height_mm?: string;
}

/**
 * Send image to vision-service and return measurement result.
 */
export async function measureWall(
  file: File,
  options?: MeasureWallOptions
): Promise<MeasurementResult> {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('aruco_size_mm', '74');

  if (options?.distance_mm != null && options.distance_mm > 0) {
    formData.append('distance_mm', String(options.distance_mm));
  }
  if (options?.intrinsics_mm_per_px != null && options.intrinsics_mm_per_px > 0) {
    formData.append('intrinsics_mm_per_px', String(options.intrinsics_mm_per_px));
  }
  if (options?.laser_width_mm?.trim()) {
    formData.append('laser_width_mm', options.laser_width_mm.trim());
  }
  if (options?.laser_height_mm?.trim()) {
    formData.append('laser_height_mm', options.laser_height_mm.trim());
  }

  const response = await fetch(`${API_BASE_URL}/measure-wall`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data as MeasurementResult;
}
