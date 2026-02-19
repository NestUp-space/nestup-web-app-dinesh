/**
 * Contract for passing ArUco measurement data into the Visualiser designer.
 * Used when the user clicks "Continue to design" on the ArUco Results page.
 */

export const ARUCO_DESIGN_STORAGE_KEY = 'nestup_aruco_design_payload';

export const ARUCO_DESIGN_QUERY_PARAM = 'fromArUco';

export const ARUCO_DESIGN_DATA_PARAM = 'data';

/** Minimal payload stored by ArUco and consumed by the designer */
export interface ArUcoDesignPayload {
  wall_width_mm: number;
  wall_height_mm: number;
  wallContext?: { roomName: string; direction: string };
  roomPreset?: { presetLabel: string; wallLabel: string };
}

const MIN_DIMENSION_MM = 100;
const MAX_DIMENSION_MM = 10000;

/**
 * Validates and optionally clamps wall dimensions.
 * Returns the payload if valid, or null if invalid.
 */
export function validateArUcoPayload(
  raw: unknown
): ArUcoDesignPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const width = typeof o.wall_width_mm === 'number' ? o.wall_width_mm : Number(o.wall_width_mm);
  const height = typeof o.wall_height_mm === 'number' ? o.wall_height_mm : Number(o.wall_height_mm);
  if (!Number.isFinite(width) || !Number.isFinite(height)) return null;
  if (width < MIN_DIMENSION_MM || height < MIN_DIMENSION_MM) return null;
  const wall_width_mm = Math.min(MAX_DIMENSION_MM, Math.max(MIN_DIMENSION_MM, width));
  const wall_height_mm = Math.min(MAX_DIMENSION_MM, Math.max(MIN_DIMENSION_MM, height));
  const payload: ArUcoDesignPayload = { wall_width_mm, wall_height_mm };
  if (o.wallContext && typeof o.wallContext === 'object') {
    const wc = o.wallContext as Record<string, unknown>;
    payload.wallContext = {
      roomName: String(wc.roomName ?? ''),
      direction: String(wc.direction ?? ''),
    };
  }
  if (o.roomPreset && typeof o.roomPreset === 'object') {
    const rp = o.roomPreset as Record<string, unknown>;
    payload.roomPreset = {
      presetLabel: String(rp.presetLabel ?? ''),
      wallLabel: String(rp.wallLabel ?? ''),
    };
  }
  return payload;
}

/**
 * Decodes the base64url-encoded payload from the URL query param and validates it.
 * Returns the payload if valid, or null if missing or invalid.
 * Decoding matches ArUco: btoa(unescape(encodeURIComponent(json))).
 */
export function getPayloadFromUrl(encoded: string | null): ArUcoDesignPayload | null {
  if (!encoded || typeof encoded !== 'string') return null;
  try {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padding = base64.length % 4;
    const padded = padding ? base64 + '='.repeat(4 - padding) : base64;
    const json = decodeURIComponent(escape(atob(padded)));
    const parsed = JSON.parse(json) as unknown;
    return validateArUcoPayload(parsed);
  } catch {
    return null;
  }
}

/**
 * Reads and consumes the ArUco payload from sessionStorage if present.
 * Removes the key after reading so it is only applied once.
 */
export function readAndClearArUcoPayload(): ArUcoDesignPayload | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(ARUCO_DESIGN_STORAGE_KEY);
    sessionStorage.removeItem(ARUCO_DESIGN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return validateArUcoPayload(parsed);
  } catch {
    return null;
  }
}
