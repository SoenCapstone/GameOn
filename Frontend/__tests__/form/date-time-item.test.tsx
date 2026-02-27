import React from "react";
import { render } from "@testing-library/react-native";
import { DateTimeItem } from "@/components/form/date-time-item";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAccentColor } from "@/contexts/accent-color-context";

jest.mock("expo-blur", () => {
  const ReactMock = jest.requireActual("react");
  const { View } = jest.requireActual("react-native");
  return {
      BlurView: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
        ReactMock.createElement(View, props, children),
  };
});

jest.mock("@react-native-community/datetimepicker", () => {
  const ReactMock = jest.requireActual("react");
  const { View } = jest.requireActual("react-native");
  return {
    __esModule: true,
    default: jest.fn((props: { [key: string]: unknown }) =>
      ReactMock.createElement(View, { testID: "date-time-picker", ...props }),
    ),
  };
});

jest.mock("@/contexts/accent-color-context", () => ({
  useAccentColor: jest.fn(() => "#00AAFF"),
}));

describe("DateTimeItem", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAccentColor as jest.Mock).mockReturnValue("#00AAFF");
  });

  it("uses context accent color when picker accent is not provided", () => {
    render(
      <DateTimeItem
        label="Starts"
        value={new Date("2025-01-01T00:00:00.000Z")}
        mode="date"
        onChange={jest.fn()}
      />,
    );

    const call = (DateTimePicker as jest.Mock).mock.calls[0][0];
    expect(call.accentColor).toBe("#00AAFF");
  });

  it("prefers picker accentColor when provided", () => {
    render(
      <DateTimeItem
        label="Starts"
        value={new Date("2025-01-01T00:00:00.000Z")}
        mode="date"
        onChange={jest.fn()}
        accentColor="#FF00FF"
      />,
    );

    const call = (DateTimePicker as jest.Mock).mock.calls[0][0];
    expect(call.accentColor).toBe("#FF00FF");
  });
});
