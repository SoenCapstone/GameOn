beforeEach(() => {
  jest.resetModules();
});

const mockExpo = (inExpoGo: boolean) => {
  jest.doMock("expo", () => ({
    __esModule: true,
    isRunningInExpoGo: jest.fn().mockReturnValue(inExpoGo),
  }));
};

const mockConstants = (executionEnvironment: string | undefined) => {
  jest.doMock("expo-constants", () => ({
    __esModule: true,
    default: { executionEnvironment },
  }));
};

const mockPlatform = (OS: string, Version: string | number = "18.0") => {
  jest.doMock("react-native", () => ({
    Platform: { OS, Version },
  }));
};

describe("isRunningInExpoGo", () => {
  it("returns true when expo reports Expo Go", () => {
    mockExpo(true);
    mockConstants("bare");
    mockPlatform("ios");
    const { isRunningInExpoGo, runtime } = require("@/utils/runtime");
    expect(isRunningInExpoGo).toBe(true);
    expect(runtime.isRunningInExpoGo).toBe(true);
  });

  it("returns false when expo reports a native build", () => {
    mockExpo(false);
    mockConstants("bare");
    mockPlatform("ios");
    const { isRunningInExpoGo } = require("@/utils/runtime");
    expect(isRunningInExpoGo).toBe(false);
  });
});

describe("isBareWorkflow / isStandaloneApp", () => {
  it("detects bare workflow", () => {
    mockExpo(false);
    mockConstants("bare");
    mockPlatform("ios");
    const { isBareWorkflow, isStandaloneApp } = require("@/utils/runtime");
    expect(isBareWorkflow).toBe(true);
    expect(isStandaloneApp).toBe(false);
  });

  it("detects standalone app", () => {
    mockExpo(false);
    mockConstants("standalone");
    mockPlatform("ios");
    const { isBareWorkflow, isStandaloneApp } = require("@/utils/runtime");
    expect(isBareWorkflow).toBe(false);
    expect(isStandaloneApp).toBe(true);
  });

  it("returns false for both when executionEnvironment is undefined", () => {
    mockExpo(false);
    mockConstants(undefined);
    mockPlatform("ios");
    const { isBareWorkflow, isStandaloneApp } = require("@/utils/runtime");
    expect(isBareWorkflow).toBe(false);
    expect(isStandaloneApp).toBe(false);
  });
});

describe("platform flags", () => {
  it("detects iOS", () => {
    mockExpo(false);
    mockConstants("bare");
    mockPlatform("ios", "18.0");
    const { isIOS, isAndroid, runtime } = require("@/utils/runtime");
    expect(isIOS).toBe(true);
    expect(isAndroid).toBe(false);
    expect(runtime.platformOS).toBe("ios");
    expect(runtime.platformVersion).toBe("18.0");
  });

  it("detects Android", () => {
    mockExpo(false);
    mockConstants("bare");
    mockPlatform("android", 34);
    const { isIOS, isAndroid, runtime } = require("@/utils/runtime");
    expect(isIOS).toBe(false);
    expect(isAndroid).toBe(true);
    expect(runtime.platformOS).toBe("android");
    expect(runtime.platformVersion).toBe(34);
  });
});

describe("runtime object", () => {
  it("aggregates all flags correctly", () => {
    mockExpo(true);
    mockConstants("bare");
    mockPlatform("ios");
    const { runtime } = require("@/utils/runtime");
    expect(runtime.isRunningInExpoGo).toBe(true);
    expect(runtime.isBareWorkflow).toBe(true);
    expect(runtime.isStandaloneApp).toBe(false);
    expect(runtime.executionEnvironment).toBe("bare");
    expect(runtime.isIOS).toBe(true);
    expect(runtime.isAndroid).toBe(false);
  });
});
