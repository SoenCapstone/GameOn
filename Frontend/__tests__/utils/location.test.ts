jest.mock("expo-location", () => ({
  getForegroundPermissionsAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: {
    Balanced: "balanced",
  },
}));

jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
  },
}));

jest.mock("@/utils/toast", () => ({
  toast: {
    warning: jest.fn(),
    error: jest.fn(),
  },
}));

describe("location utils", () => {
  function getLocationMock() {
    return jest.requireMock("expo-location") as {
      getForegroundPermissionsAsync: jest.Mock;
      requestForegroundPermissionsAsync: jest.Mock;
      getCurrentPositionAsync: jest.Mock;
      Accuracy: { Balanced: string };
    };
  }

  function getRouterMock() {
    return (jest.requireMock("expo-router") as {
      router: { push: jest.Mock };
    }).router;
  }

  function getToastMock() {
    return (jest.requireMock("@/utils/toast") as {
      toast: { warning: jest.Mock; error: jest.Mock };
    }).toast;
  }

  function getReactNative() {
    return require("react-native") as typeof import("react-native");
  }

  function importModule() {
    return require("@/utils/location") as typeof import("@/utils/location");
  }

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    const { Alert, Linking } = getReactNative();
    jest.spyOn(Alert, "alert").mockImplementation(jest.fn());
    jest.spyOn(Linking, "openSettings").mockResolvedValue();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns true from requestLocationPermission when permission is already granted", async () => {
    const Location = getLocationMock();
    Location.getForegroundPermissionsAsync.mockResolvedValue({
      status: "granted",
    });

    const { requestLocationPermission } = importModule();

    await expect(requestLocationPermission()).resolves.toBe(true);
    expect(Location.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
  });

  it("requests permission and shows a warning toast when access remains denied", async () => {
    const Location = getLocationMock();
    const toast = getToastMock();
    Location.getForegroundPermissionsAsync.mockResolvedValue({
      status: "undetermined",
    });
    Location.requestForegroundPermissionsAsync.mockResolvedValue({
      status: "denied",
    });

    const { requestLocationPermission } = importModule();

    await expect(requestLocationPermission()).resolves.toBe(false);
    expect(toast.warning).toHaveBeenCalledWith("Location Access Needed", {
      description: "Grant access in Settings, or update your Explore Preferences.",
    });
  });

  it("reads and returns the current coordinates when permission is granted", async () => {
    const Location = getLocationMock();
    Location.getForegroundPermissionsAsync.mockResolvedValue({
      status: "granted",
    });
    Location.getCurrentPositionAsync.mockResolvedValue({
      coords: {
        latitude: 45.5,
        longitude: -73.56,
      },
    });

    const { getCurrentLocation } = importModule();

    await expect(getCurrentLocation()).resolves.toEqual({
      latitude: 45.5,
      longitude: -73.56,
    });
    expect(Location.getCurrentPositionAsync).toHaveBeenCalledWith({
      accuracy: Location.Accuracy.Balanced,
    });
  });

  it("shows an alert the first time location access is denied and a toast afterwards", async () => {
    const { Alert } = getReactNative();
    const Location = getLocationMock();
    const toast = getToastMock();
    Location.getForegroundPermissionsAsync.mockResolvedValue({
      status: "denied",
    });

    const { getCurrentLocation } = importModule();

    await expect(getCurrentLocation()).resolves.toBeNull();
    expect(Alert.alert).toHaveBeenCalledWith(
      "Location Access Needed",
      "GameOn uses location access to show nearby matches in Explore. Grant access in Settings, or update your Explore Preferences.",
      expect.arrayContaining([
        expect.objectContaining({ text: "Update Explore Preferences" }),
        expect.objectContaining({ text: "Open Settings" }),
        expect.objectContaining({ text: "Cancel", style: "destructive" }),
      ]),
    );

    await expect(getCurrentLocation()).resolves.toBeNull();
    expect(toast.warning).toHaveBeenCalledWith("Location Access Needed", {
      description: "Grant access in Settings, or update your Explore Preferences.",
    });
  });

  it("wires the denied alert actions to navigation and settings", async () => {
    const { Alert, Linking } = getReactNative();
    const Location = getLocationMock();
    const router = getRouterMock();
    Location.getForegroundPermissionsAsync.mockResolvedValue({
      status: "denied",
    });

    const { getCurrentLocation } = importModule();
    await getCurrentLocation();

    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2] as {
      text: string;
      onPress?: () => void;
    }[];

    buttons.find((button) => button.text === "Update Explore Preferences")
      ?.onPress?.();
    buttons.find((button) => button.text === "Open Settings")?.onPress?.();

    expect(router.push).toHaveBeenCalledWith("/settings");
    expect(Linking.openSettings).toHaveBeenCalledTimes(1);
  });

  it("shows an error toast when reading the current location fails", async () => {
    const Location = getLocationMock();
    const toast = getToastMock();
    Location.getForegroundPermissionsAsync.mockResolvedValue({
      status: "granted",
    });
    Location.getCurrentPositionAsync.mockRejectedValue(
      new Error("gps failed"),
    );

    const { getCurrentLocation } = importModule();

    await expect(getCurrentLocation()).resolves.toBeNull();
    expect(toast.error).toHaveBeenCalledWith("Location Error", {
      description: "We couldn't read your location. Try again in a moment.",
    });
  });

  it("returns null from getCurrentLocation when permission remains denied after prompting", async () => {
    const Location = getLocationMock();
    const toast = getToastMock();
    Location.getForegroundPermissionsAsync.mockResolvedValue({
      status: "undetermined",
    });
    Location.requestForegroundPermissionsAsync.mockResolvedValue({
      status: "denied",
    });

    const { getCurrentLocation } = importModule();

    await expect(getCurrentLocation()).resolves.toBeNull();
    expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
    expect(toast.warning).toHaveBeenCalledWith("Location Access Needed", {
      description: "Grant access in Settings, or update your Explore Preferences.",
    });
  });

  it("reads the current location after permission is granted from the prompt", async () => {
    const Location = getLocationMock();
    Location.getForegroundPermissionsAsync.mockResolvedValue({
      status: "undetermined",
    });
    Location.requestForegroundPermissionsAsync.mockResolvedValue({
      status: "granted",
    });
    Location.getCurrentPositionAsync.mockResolvedValue({
      coords: {
        latitude: 43.65,
        longitude: -79.38,
      },
    });

    const { getCurrentLocation } = importModule();

    await expect(getCurrentLocation()).resolves.toEqual({
      latitude: 43.65,
      longitude: -79.38,
    });
    expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(Location.getCurrentPositionAsync).toHaveBeenCalledTimes(1);
  });
});
