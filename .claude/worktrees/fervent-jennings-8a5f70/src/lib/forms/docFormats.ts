/**
 * Official portal document constraints.
 *
 * Single source of truth for accepted upload formats, shared by the mobile
 * uploader and the desktop upload manager so both enforce identical rules.
 */
export const FORMAT_MIME: Record<string, string[]> = {
  pdf: ['application/pdf'],
  jpeg: ['image/jpeg', 'image/jpg'],
  jpg: ['image/jpeg', 'image/jpg'],
  png: ['image/png'],
}

/** Expand a service's accepted format list into concrete MIME types. */
export const mimesFor = (formats: string[]): string[] => formats.flatMap((f) => FORMAT_MIME[f] ?? [])
