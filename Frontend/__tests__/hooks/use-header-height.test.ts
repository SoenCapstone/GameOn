import AsyncStorage from "@react-native-async-storage/async-storage";
import { renderHook, waitFor } from "@testing-library/react-native";
import { useHeaderHeight } from "@/hooks/use-header-height";
import { useHeaderHeight as useNavigationHeaderHeight } from "@react-navigation/elements";

jest.mock("@react-navigation/elements", () => ({
  useHeaderHeight: jest.fn(),
}));

describe("use-header-height", () => {
  const mockedAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
  const mockedNavigationHeaderHeight = jest.mocked(useNavigationHeaderHeight);
  const originalConsoleLog = console.log;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedAsyncStorage.getItem.mockResolvedValue(null);
    mockedNavigationHeaderHeight.mockReturnValue(0);
    console.log = jest.fn();
  });

  afterAll(() => {
    console.log = originalConsoleLog;
  });

  it("returns the live navigation height when it is a positive whole number", () => {
    mockedNavigationHeaderHeight.mockReturnValue(48);

    const { result } = renderHook(() => useHeaderHeight());

    expect(result.current).toBe(48);
  });

  it("returns zero when neither navigation nor storage has a valid height", () => {
    const { result } = renderHook(() => useHeaderHeight());

    expect(result.current).toBe(0);
  });

  it("saves live whole-number heights and ignores fractional navigation heights", async () => {
    mockedNavigationHeaderHeight.mockReturnValue(32);

    const { result, rerender } = renderHook(() => useHeaderHeight());

    expect(result.current).toBe(32);

    await waitFor(() => {
      expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
        "headerHeight",
        "32",
      );
    });

    mockedNavigationHeaderHeight.mockReturnValue(72.5);
    rerender({});

    expect(result.current).toBe(32);
    expect(mockedAsyncStorage.setItem).not.toHaveBeenCalledWith(
      "headerHeight",
      "72.5",
    );

    mockedNavigationHeaderHeight.mockReturnValue(24);
    rerender({});

    await waitFor(() => {
      expect(result.current).toBe(24);
    });

    expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
      "headerHeight",
      "24",
    );
  });

  it("hydrates the fallback height from AsyncStorage", async () => {
    mockedAsyncStorage.getItem.mockResolvedValueOnce("100");

    const { result } = renderHook(() => useHeaderHeight());

    await waitFor(() => {
      expect(result.current).toBe(100);
    });

    expect(mockedAsyncStorage.getItem).toHaveBeenCalledWith("headerHeight");
  });

  it("keeps using the fallback height until navigation reports a whole number", async () => {
    mockedAsyncStorage.getItem.mockResolvedValueOnce("100");

    const { result, rerender } = renderHook(() => useHeaderHeight());

    await waitFor(() => {
      expect(result.current).toBe(100);
    });

    mockedNavigationHeaderHeight.mockReturnValue(110.5);
    rerender({});

    expect(result.current).toBe(100);
    expect(mockedAsyncStorage.setItem).not.toHaveBeenCalledWith(
      "headerHeight",
      "110.5",
    );

    mockedNavigationHeaderHeight.mockReturnValue(112);
    rerender({});

    await waitFor(() => {
      expect(result.current).toBe(112);
    });
  });
});
