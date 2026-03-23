/**
 * Minimal typings for `file-saver` — used only from gcodeGenerator browser download path.
 * Production builds often omit devDependencies (@types/file-saver); this keeps `tsc` green.
 */
declare module 'file-saver' {
  export function saveAs(data: Blob, filename?: string, options?: unknown): void;
}
