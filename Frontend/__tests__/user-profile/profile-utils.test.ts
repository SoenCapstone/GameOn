import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { File } from "expo-file-system";
import {
  handleSaveProfile,
  confirmLogout,
} from "@/components/user-profile/profile-utils";
import { pickImage } from "@/utils/pick-image";

jest.mock("react-native", () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock("expo-image-manipulator", () => {
  const mockContext = {
    crop: jest.fn().mockReturnThis(),
    renderAsync: jest.fn().mockResolvedValue({
      saveAsync: jest.fn().mockResolvedValue({ uri: "file:///cropped.jpg" }),
      release: jest.fn(),
    }),
    release: jest.fn(),
  };
  return {
    ImageManipulator: {
      manipulate: jest.fn(() => mockContext),
    },
    SaveFormat: { JPEG: "jpeg", PNG: "png", WEBP: "webp" },
  };
});

jest.mock("expo-file-system", () => ({
  File: jest.fn(),
}));

jest.mock("@/utils/logger", () => ({
  createScopedLog: () => ({
    info: jest.fn(),
    error: jest.fn(),
  }),
}));

const mockFile = File as jest.MockedClass<typeof File>;

describe("handleSaveProfile", () => {
  let mockUser: any;
  let mockRouter: any;
  let mockAlert: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAlert = jest.spyOn(Alert, "alert");

    mockUser = {
      update: jest.fn().mockResolvedValue(undefined),
      setProfileImage: jest.fn().mockResolvedValue(undefined),
      hasImage: false,
    };

    mockRouter = {
      back: jest.fn(),
    };
  });

  afterEach(() => {
    mockAlert.mockRestore();
  });

  it("validates firstName and lastName, showing appropriate alerts", async () => {
    await handleSaveProfile({
      user: mockUser,
      firstName: "",
      lastName: "Doe",
      email: "john@example.com",
      image: null,
      router: mockRouter,
    });

    expect(mockAlert).toHaveBeenCalledWith(
      "First Name must not be empty",
      "Please enter a valid First Name",
    );
    expect(mockUser.update).not.toHaveBeenCalled();

    mockAlert.mockClear();

    await handleSaveProfile({
      user: mockUser,
      firstName: "   ",
      lastName: "Doe",
      email: "john@example.com",
      image: null,
      router: mockRouter,
    });

    expect(mockAlert).toHaveBeenCalledWith(
      "First Name must not be empty",
      "Please enter a valid First Name",
    );
    expect(mockUser.update).not.toHaveBeenCalled();

    mockAlert.mockClear();

    await handleSaveProfile({
      user: mockUser,
      firstName: "John",
      lastName: "",
      email: "john@example.com",
      image: null,
      router: mockRouter,
    });

    expect(mockAlert).toHaveBeenCalledWith(
      "Last Name must not be empty",
      "Please enter a valid Last Name",
    );
    expect(mockUser.update).not.toHaveBeenCalled();

    mockAlert.mockClear();

    await handleSaveProfile({
      user: mockUser,
      firstName: "John",
      lastName: "   ",
      email: "john@example.com",
      image: null,
      router: mockRouter,
    });

    expect(mockAlert).toHaveBeenCalledWith(
      "Last Name must not be empty",
      "Please enter a valid Last Name",
    );
    expect(mockUser.update).not.toHaveBeenCalled();
  });

  it("manages profile image updates based on image state and user hasImage", async () => {
    await handleSaveProfile({
      user: mockUser,
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      image: null,
      router: mockRouter,
    });

    expect(mockUser.update).toHaveBeenCalledWith({
      firstName: "John",
      lastName: "Doe",
    });
    expect(mockAlert).toHaveBeenCalledWith("Success", "Profile updated");
    expect(mockRouter.back).toHaveBeenCalled();

    jest.clearAllMocks();

    mockUser.hasImage = true;
    await handleSaveProfile({
      user: mockUser,
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      image: null,
      router: mockRouter,
    });

    expect(mockUser.setProfileImage).toHaveBeenCalledWith({ file: null });
    expect(mockAlert).toHaveBeenCalledWith("Success", "Profile updated");

    jest.clearAllMocks();

    mockUser.hasImage = false;
    await handleSaveProfile({
      user: mockUser,
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      image: null,
      router: mockRouter,
    });

    expect(mockUser.setProfileImage).not.toHaveBeenCalled();
    expect(mockAlert).toHaveBeenCalledWith("Success", "Profile updated");
  });

  it("handles profile image upload with various formats and file types", async () => {
    const mockFileInstance = {
      base64: jest.fn().mockResolvedValue("base64string"),
    };
    mockFile.mockImplementation(() => mockFileInstance as any);

    await handleSaveProfile({
      user: mockUser,
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      image: { uri: "file:///local/image.jpg", mimeType: "image/jpeg" },
      router: mockRouter,
    });

    expect(mockFile).toHaveBeenCalledWith("file:///local/image.jpg");
    expect(mockFileInstance.base64).toHaveBeenCalled();
    expect(mockUser.setProfileImage).toHaveBeenCalledWith({
      file: "data:image/jpeg;base64,base64string",
    });
    expect(mockAlert).toHaveBeenCalledWith("Success", "Profile updated");

    jest.clearAllMocks();
    mockFile.mockImplementation(() => mockFileInstance as any);

    mockFileInstance.base64.mockResolvedValue("base64string");
    await handleSaveProfile({
      user: mockUser,
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      image: { uri: "file:///local/image.jpg" },
      router: mockRouter,
    });

    expect(mockUser.setProfileImage).toHaveBeenCalledWith({
      file: "data:image/jpeg;base64,base64string",
    });

    jest.clearAllMocks();
    mockFile.mockImplementation(() => mockFileInstance as any);

    mockFileInstance.base64.mockResolvedValue("pngbase64");
    await handleSaveProfile({
      user: mockUser,
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      image: { uri: "file:///local/image.png", mimeType: "image/png" },
      router: mockRouter,
    });

    expect(mockUser.setProfileImage).toHaveBeenCalledWith({
      file: "data:image/png;base64,pngbase64",
    });

    jest.clearAllMocks();

    await handleSaveProfile({
      user: mockUser,
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      image: { uri: "https://example.com/image.jpg" },
      router: mockRouter,
    });

    expect(mockUser.setProfileImage).not.toHaveBeenCalled();
    expect(mockAlert).toHaveBeenCalledWith("Success", "Profile updated");

    jest.clearAllMocks();

    await handleSaveProfile({
      user: mockUser,
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      image: 12345,
      router: mockRouter,
    });

    expect(mockUser.setProfileImage).not.toHaveBeenCalled();
    expect(mockAlert).toHaveBeenCalledWith("Success", "Profile updated");
  });

  it("handles errors during profile or image update", async () => {
    let consoleSpy = jest.spyOn(console, "error").mockImplementation();

    const error = new Error("Network error");
    mockUser.update.mockRejectedValue(error);

    await handleSaveProfile({
      user: mockUser,
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      image: null,
      router: mockRouter,
    });

    expect(consoleSpy).toHaveBeenCalledWith("Fetch error:", "Network error");
    expect(mockAlert).toHaveBeenCalledWith(
      "Error",
      "Failed to update profile: Network error",
    );
    expect(mockRouter.back).toHaveBeenCalled();

    consoleSpy.mockRestore();
    jest.clearAllMocks();

    const imageError = new Error("Image upload failed");
    mockUser.setProfileImage.mockRejectedValue(imageError);
    mockUser.update.mockResolvedValue(undefined);
    const mockFileInstance = {
      base64: jest.fn().mockResolvedValue("base64string"),
    };
    mockFile.mockImplementation(() => mockFileInstance as any);
    consoleSpy = jest.spyOn(console, "error").mockImplementation();

    await handleSaveProfile({
      user: mockUser,
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      image: { uri: "file:///local/image.jpg" },
      router: mockRouter,
    });

    expect(mockAlert).toHaveBeenCalledWith(
      "Error",
      "Failed to update profile: Image upload failed",
    );
    expect(mockRouter.back).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});

describe("pickImage", () => {
  let mockSetImage: jest.Mock;
  let mockAlert: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetImage = jest.fn();
    mockAlert = jest.spyOn(Alert, "alert");
  });

  afterEach(() => {
    mockAlert.mockRestore();
  });

  it("handles permission request and denied/granted responses", async () => {
    (
      ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock
    ).mockResolvedValue({
      granted: false,
    });

    await pickImage(mockSetImage);

    expect(ImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalled();
    expect(mockAlert).toHaveBeenCalledWith(
      "Permission denied",
      "You need to allow access to your media library.",
    );
    expect(mockSetImage).not.toHaveBeenCalled();

    jest.clearAllMocks();

    (
      ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock
    ).mockResolvedValue({
      granted: true,
    });
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: true,
      assets: [],
    });

    await pickImage(mockSetImage);

    expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
      exif: false,
    });
  });

  it("handles image selection with various mime types and asset scenarios", async () => {
    (
      ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock
    ).mockResolvedValue({
      granted: true,
    });

    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: "file:///selected/image.jpg",
          mimeType: "image/jpeg",
        },
      ],
    });

    await pickImage(mockSetImage);

    expect(mockSetImage).toHaveBeenCalledWith({
      uri: "file:///selected/image.jpg",
      mimeType: "image/jpeg",
    });

    jest.clearAllMocks();
    (
      ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock
    ).mockResolvedValue({
      granted: true,
    });

    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: "file:///selected/image.jpg",
          mimeType: undefined,
        },
      ],
    });

    await pickImage(mockSetImage);

    expect(mockSetImage).toHaveBeenCalledWith({
      uri: "file:///selected/image.jpg",
      mimeType: "image/jpeg",
    });

    jest.clearAllMocks();
    (
      ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock
    ).mockResolvedValue({
      granted: true,
    });

    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: "file:///selected/image.png",
          mimeType: "image/png",
        },
      ],
    });

    await pickImage(mockSetImage);

    expect(mockSetImage).toHaveBeenCalledWith({
      uri: "file:///selected/image.png",
      mimeType: "image/png",
    });

    jest.clearAllMocks();
    (
      ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock
    ).mockResolvedValue({
      granted: true,
    });

    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [
        { uri: "file:///first.jpg", mimeType: "image/jpeg" },
        { uri: "file:///second.jpg", mimeType: "image/jpeg" },
      ],
    });

    await pickImage(mockSetImage);

    expect(mockSetImage).toHaveBeenCalledWith({
      uri: "file:///first.jpg",
      mimeType: "image/jpeg",
    });

    jest.clearAllMocks();
    (
      ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock
    ).mockResolvedValue({
      granted: true,
    });

    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: true,
      assets: [],
    });

    await pickImage(mockSetImage);

    expect(mockSetImage).not.toHaveBeenCalled();

    jest.clearAllMocks();
    (
      ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock
    ).mockResolvedValue({
      granted: true,
    });

    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [],
    });

    await pickImage(mockSetImage);

    expect(mockSetImage).not.toHaveBeenCalled();
  });

  it("handles errors during permission or image picker operations", async () => {
    let consoleSpy = jest.spyOn(console, "error").mockImplementation();

    const permissionError = new Error("Permission error");
    (
      ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock
    ).mockRejectedValue(permissionError);

    await pickImage(mockSetImage);

    expect(consoleSpy).toHaveBeenCalledWith(
      "Image picker error:",
      "Permission error",
    );
    expect(mockAlert).toHaveBeenCalledWith(
      "Error",
      "Failed to pick image: Permission error",
    );
    expect(mockSetImage).not.toHaveBeenCalled();

    (
      ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock
    ).mockResolvedValue({
      granted: true,
    });
    const pickerError = new Error("Picker crashed");
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockRejectedValue(
      pickerError,
    );
    consoleSpy = jest.spyOn(console, "error").mockImplementation();

    await pickImage(mockSetImage);

    expect(consoleSpy).toHaveBeenCalledWith(
      "Image picker error:",
      "Picker crashed",
    );
    expect(mockAlert).toHaveBeenCalledWith(
      "Error",
      "Failed to pick image: Picker crashed",
    );
    expect(mockSetImage).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});

describe("confirmLogout", () => {
  let mockSignOut: jest.Mock;
  let mockLog: any;
  let mockAlert: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSignOut = jest.fn();
    mockLog = {
      info: jest.fn(),
    };
    mockAlert = jest.spyOn(Alert, "alert");
  });

  afterEach(() => {
    mockAlert.mockRestore();
  });

  it("returns a function", () => {
    const result = confirmLogout(mockSignOut, mockLog);
    expect(typeof result).toBe("function");
  });

  it("shows confirmation alert when called", () => {
    const logoutFn = confirmLogout(mockSignOut, mockLog);
    logoutFn();

    expect(mockAlert).toHaveBeenCalledWith(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: expect.any(Function),
        },
      ],
      { cancelable: true },
    );
  });

  it("calls signOut when user confirms", () => {
    const logoutFn = confirmLogout(mockSignOut, mockLog);
    logoutFn();

    const alertCall = mockAlert.mock.calls[0];
    const buttons = alertCall[2];
    const signOutButton = buttons[1];
    signOutButton.onPress();

    expect(mockLog.info).toHaveBeenCalledWith("User confirmed sign out");
    expect(mockSignOut).toHaveBeenCalled();
  });

  it("does not call signOut when user cancels", () => {
    const logoutFn = confirmLogout(mockSignOut, mockLog);
    logoutFn();

    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it("logs info message when user confirms", () => {
    const logoutFn = confirmLogout(mockSignOut, mockLog);
    logoutFn();

    const alertCall = mockAlert.mock.calls[0];
    const buttons = alertCall[2];
    const signOutButton = buttons[1];
    signOutButton.onPress();

    expect(mockLog.info).toHaveBeenCalledWith("User confirmed sign out");
  });

  it("configures alert as cancelable", () => {
    const logoutFn = confirmLogout(mockSignOut, mockLog);
    logoutFn();

    const alertCall = mockAlert.mock.calls[0];
    const options = alertCall[3];
    expect(options.cancelable).toBe(true);
  });

  it("has cancel button with cancel style", () => {
    const logoutFn = confirmLogout(mockSignOut, mockLog);
    logoutFn();

    const alertCall = mockAlert.mock.calls[0];
    const buttons = alertCall[2];
    const cancelButton = buttons[0];
    expect(cancelButton.text).toBe("Cancel");
    expect(cancelButton.style).toBe("cancel");
  });

  it("has sign out button with destructive style", () => {
    const logoutFn = confirmLogout(mockSignOut, mockLog);
    logoutFn();

    const alertCall = mockAlert.mock.calls[0];
    const buttons = alertCall[2];
    const signOutButton = buttons[1];
    expect(signOutButton.text).toBe("Sign Out");
    expect(signOutButton.style).toBe("destructive");
  });
});
