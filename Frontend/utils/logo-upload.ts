export const ALLOWED_LOGO_MIME_TYPES: readonly string[] = [
  "image/png",
  "image/svg+xml",
  "image/webp",
];

const MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/svg+xml": "svg",
  "image/webp": "webp",
};

export function isAllowedLogoMimeType(
  mimeType: string | null | undefined,
): boolean {
  if (!mimeType) return false;
  return ALLOWED_LOGO_MIME_TYPES.includes(mimeType.toLowerCase().trim());
}

export function getLogoFileExtension(mimeType: string): string {
  const normalized = mimeType.toLowerCase().trim();
  return (
    MIME_TO_EXT[normalized] ??
    normalized.split("/")[1]?.split("+")[0] ??
    "png"
  );
}
