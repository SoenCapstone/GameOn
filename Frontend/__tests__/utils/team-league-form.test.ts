import { Alert } from "react-native";
import {
  clearLogoSelection,
  pickLogo,
  uploadLogo,
  type PickedLogo,
} from "@/utils/team-league-form";
import { pickImage } from "@/utils/pick-image";

jest.mock("@/utils/pick-image", () => ({
  pickImage: jest.fn(),
}));

describe("team-league-form utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("pickLogo", () => {
    it("alerts and does not set logo when mime type is unsupported", async () => {
      const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(jest.fn());
      const setPickedLogo = jest.fn();
      (pickImage as jest.Mock).mockImplementation(async (onPick: any) => {
        onPick({ uri: "file:///tmp/logo.jpg", mimeType: "image/jpeg" });
      });

      await pickLogo(setPickedLogo);

      expect(alertSpy).toHaveBeenCalledWith(
        "Unsupported format",
        "Only images with transparent background are supported for logos.",
      );
      expect(setPickedLogo).not.toHaveBeenCalled();
    });

    it("normalizes and sets logo for supported mime type", async () => {
      const setPickedLogo = jest.fn();
      (pickImage as jest.Mock).mockImplementation(async (onPick: any) => {
        onPick({ uri: "file:///tmp/logo.png", mimeType: " IMAGE/PNG " });
      });

      await pickLogo(setPickedLogo);

      expect(setPickedLogo).toHaveBeenCalledWith({
        uri: "file:///tmp/logo.png",
        mimeType: "image/png",
      });
    });
  });

  describe("uploadLogo", () => {
    it("uploads form data and returns publicUrl", async () => {
      const api = { post: jest.fn() };
      api.post.mockResolvedValue({ data: { publicUrl: "https://cdn/logo.webp" } });

      const appendSpy = jest.spyOn(FormData.prototype, "append");
      const pickedLogo: PickedLogo = {
        uri: "file:///tmp/logo.webp",
        mimeType: "image/webp",
      };

      const result = await uploadLogo(api as any, "/upload", pickedLogo);

      expect(appendSpy).toHaveBeenCalledWith(
        "file",
        expect.objectContaining({
          uri: "file:///tmp/logo.webp",
          type: "image/webp",
          name: "logo.webp",
        }),
      );
      expect(api.post).toHaveBeenCalledWith("/upload", expect.any(FormData));
      expect(result).toBe("https://cdn/logo.webp");
    });

    it("returns empty string when publicUrl is missing", async () => {
      const api = { post: jest.fn() };
      api.post.mockResolvedValue({ data: {} });

      const result = await uploadLogo(api as any, "/upload", {
        uri: "file:///tmp/logo.svg",
        mimeType: "image/svg+xml",
      });

      expect(result).toBe("");
    });
  });

  describe("clearLogoSelection", () => {
    it("clears both picked logo and displayed uri", () => {
      const setPickedLogo = jest.fn();
      const setLogoUri = jest.fn();

      clearLogoSelection(setPickedLogo, setLogoUri);

      expect(setPickedLogo).toHaveBeenCalledWith(null);
      expect(setLogoUri).toHaveBeenCalledWith("");
    });
  });
});
