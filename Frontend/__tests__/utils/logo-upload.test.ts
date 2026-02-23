import {
  ALLOWED_LOGO_MIME_TYPES,
  getLogoFileExtension,
  isAllowedLogoMimeType,
} from "@/utils/logo-upload";

describe("logo-upload utils", () => {
  describe("isAllowedLogoMimeType", () => {
    it("accepts supported mime types with case/whitespace normalization", () => {
      expect(isAllowedLogoMimeType("image/png")).toBe(true);
      expect(isAllowedLogoMimeType(" IMAGE/SVG+XML ")).toBe(true);
      expect(isAllowedLogoMimeType("image/webp")).toBe(true);
    });

    it("rejects unsupported or missing mime types", () => {
      expect(isAllowedLogoMimeType("image/jpeg")).toBe(false);
      expect(isAllowedLogoMimeType("application/json")).toBe(false);
      expect(isAllowedLogoMimeType("")).toBe(false);
      expect(isAllowedLogoMimeType(null)).toBe(false);
      expect(isAllowedLogoMimeType(undefined)).toBe(false);
    });

    it("keeps the allowed list aligned with expected transparent formats", () => {
      expect(ALLOWED_LOGO_MIME_TYPES).toEqual([
        "image/png",
        "image/svg+xml",
        "image/webp",
      ]);
    });
  });

  describe("getLogoFileExtension", () => {
    it("maps known mime types to extensions", () => {
      expect(getLogoFileExtension("image/png")).toBe("png");
      expect(getLogoFileExtension("image/svg+xml")).toBe("svg");
      expect(getLogoFileExtension("image/webp")).toBe("webp");
    });

    it("extracts extension from unknown image mime types", () => {
      expect(getLogoFileExtension("image/jpeg")).toBe("jpeg");
      expect(getLogoFileExtension("image/heic+special")).toBe("heic");
    });

    it("falls back to png for malformed mime type", () => {
      expect(getLogoFileExtension("invalid")).toBe("png");
    });
  });
});
