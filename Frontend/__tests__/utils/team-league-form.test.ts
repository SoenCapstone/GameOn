import { toast } from "@/utils/toast";
import {
  clearLogoSelection,
  pickLogo,
  uploadLogo,
  type PickedLogo,
} from "@/utils/team-league-form";
import { pickImage } from "@/utils/pick-image";
import { AxiosInstance } from "axios";

jest.mock("@/utils/pick-image", () => ({
  pickImage: jest.fn(),
}));
jest.mock("@/utils/toast", () => ({
  toast: Object.assign(jest.fn(), {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
    loading: jest.fn(),
    promise: jest.fn(),
    dismiss: jest.fn(),
    wiggle: jest.fn(),
    custom: jest.fn(),
  }),
}));

describe("team-league-form utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("pickLogo", () => {
    it("shows a warning toast and does not set logo when mime type is unsupported", async () => {
      const setPickedLogo = jest.fn();
      (pickImage as jest.Mock).mockImplementation(
        async (onPick: (logo: unknown) => void) => {
          onPick({ uri: "file:///tmp/logo.jpg", mimeType: "image/jpeg" });
        },
      );

      await pickLogo(setPickedLogo);

      expect(toast.warning).toHaveBeenCalledWith("Unsupported Format", {
        description:
          "Only images with transparent background are supported for logos.",
      });
      expect(setPickedLogo).not.toHaveBeenCalled();
    });

    it("normalizes and sets logo for supported mime type", async () => {
      const setPickedLogo = jest.fn();
      (pickImage as jest.Mock).mockImplementation(
        async (onPick: (logo: unknown) => void) => {
          onPick({ uri: "file:///tmp/logo.png", mimeType: " IMAGE/PNG " });
        },
      );

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
      api.post.mockResolvedValue({
        data: { publicUrl: "https://cdn/logo.webp" },
      });

      const appendSpy = jest.spyOn(FormData.prototype, "append");
      const pickedLogo: PickedLogo = {
        uri: "file:///tmp/logo.webp",
        mimeType: "image/webp",
      };

      const result = await uploadLogo(
        api as unknown as AxiosInstance,
        "/upload",
        pickedLogo,
      );

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

      const result = await uploadLogo(
        api as unknown as AxiosInstance,
        "/upload",
        {
          uri: "file:///tmp/logo.svg",
          mimeType: "image/svg+xml",
        },
      );

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
