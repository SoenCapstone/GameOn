import * as ImagePicker from "expo-image-picker";
import { pickImage } from "@/utils/pick-image";

jest.mock("expo-image-picker");

describe("pickImage", () => {
  it("calls setImage with image data when image is picked", async () => {
    (
      ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock
    ).mockResolvedValue({ granted: true });
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: "valid-image.jpg",
          width: 100,
          height: 100,
          mimeType: "image/jpeg",
        },
      ],
    });

    const setImage = jest.fn();
    await pickImage(setImage);
    expect(setImage).toHaveBeenCalledWith({
      uri: "valid-image.jpg",
      mimeType: "image/jpeg",
    });
  });

  it("shows alert when permission is denied", async () => {
    (
      ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock
    ).mockResolvedValue({ granted: false });
    const alertSpy = jest
      .spyOn(jest.requireActual("react-native").Alert, "alert")
      .mockImplementation(() => {});
    const setImage = jest.fn();
    await pickImage(setImage);
    expect(alertSpy).toHaveBeenCalledWith(
      "Permission denied",
      "You need to allow access to your media library.",
    );
    expect(setImage).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it("does not call setImage if picker is canceled", async () => {
    (
      ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock
    ).mockResolvedValue({ granted: true });
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: true,
      assets: [],
    });
    const setImage = jest.fn();
    await pickImage(setImage);
    expect(setImage).not.toHaveBeenCalled();
  });

  it("handles cropping for non-square images", async () => {
    (
      ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock
    ).mockResolvedValue({ granted: true });
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: "non-square.jpg",
          width: 200,
          height: 100,
          mimeType: "image/jpeg",
        },
      ],
    });
    const cropMock = jest.fn();
    const renderAsyncMock = jest.fn(() =>
      Promise.resolve({
        saveAsync: jest.fn(() => Promise.resolve({ uri: "cropped.jpg" })),
        release: jest.fn(),
      }),
    );
    const releaseMock = jest.fn();
    jest
      .spyOn(
        jest.requireActual("expo-image-manipulator").ImageManipulator,
        "manipulate",
      )
      .mockImplementation(() => ({
        crop: cropMock,
        renderAsync: renderAsyncMock,
        release: releaseMock,
      }));
    const setImage = jest.fn();
    await pickImage(setImage);
    expect(setImage).toHaveBeenCalledWith({
      uri: "cropped.jpg",
      mimeType: "image/jpeg",
    });
  });

  it("shows alert on error", async () => {
    (
      ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock
    ).mockRejectedValue(new Error("fail"));
    const alertSpy = jest
      .spyOn(jest.requireActual("react-native").Alert, "alert")
      .mockImplementation(() => {});
    const setImage = jest.fn();
    await pickImage(setImage);
    expect(alertSpy).toHaveBeenCalledWith(
      "Error",
      expect.stringContaining("Failed to pick image: fail"),
    );
    alertSpy.mockRestore();
  });
});
