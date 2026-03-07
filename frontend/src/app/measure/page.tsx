import { redirect } from 'next/navigation';

/**
 * Redirects to the wall measurement app (same host at /measurements).
 * Share this URL (e.g. yoursite.com/measure); users will be sent to /measurements.
 * Set NEXT_PUBLIC_ARUCO_APP_URL to override (e.g. a separately deployed measurement app).
 */
export default function MeasurePage() {
  const appUrl = process.env.NEXT_PUBLIC_ARUCO_APP_URL || '/measurements';
  redirect(appUrl);
}
