import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { MenuPicker } from "@/components/ui/menu-picker";
import * as runtime from "@/utils/runtime";
import { Picker } from "@expo/ui/swift-ui";
import {
  disabled as disabledModifier,
  fixedSize,
  opacity,
} from "@expo/ui/swift-ui/modifiers";

const mockShowActionSheetWithOptions = jest.fn();

jest.mock("@expo/react-native-action-sheet", () => ({
  useActionSheet: () => ({
    showActionSheetWithOptions: mockShowActionSheetWithOptions,
  }),
}));

jest.mock("@expo/vector-icons", () => {
  const ReactMock = jest.requireActual("react");
  const { View } = jest.requireActual("react-native");
  return {
    Ionicons: (props: Record<string, unknown>) =>
      ReactMock.createElement(View, { testID: "ionicon", ...props }),
  };
});

jest.mock("@expo/ui/swift-ui", () => {
  const ReactMock = jest.requireActual("react");
  const { View } = jest.requireActual("react-native");
  return {
    Host: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
      [key: string]: unknown;
    }) => ReactMock.createElement(View, props, children),
    Picker: jest.fn((props: Record<string, unknown>) =>
      ReactMock.createElement(View, { testID: "swift-picker", ...props }),
    ),
  };
});

jest.mock("@expo/ui/swift-ui/modifiers", () => ({
  disabled: jest.fn((value: boolean) => ({ type: "disabled", value })),
  fixedSize: jest.fn((value: unknown) => ({ type: "fixedSize", value })),
  opacity: jest.fn((value: number) => ({ type: "opacity", value })),
}));

jest.mock("@/utils/runtime", () => {
  let expoGo = true;
  return {
    get isRunningInExpoGo() {
      return expoGo;
    },
    __setExpoGo: (value: boolean) => {
      expoGo = value;
    },
  };
});

const runtimeTyped = runtime as unknown as {
  __setExpoGo: (value: boolean) => void;
  isRunningInExpoGo: boolean;
};

describe("MenuPicker", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    runtimeTyped.__setExpoGo(true);
  });

  it("uses ActionSheet flow in Expo Go and updates selected value", () => {
    const onValueChange = jest.fn();
    const { getByText } = render(
      <MenuPicker
        title="Pick role"
        options={["Owner", "Member"]}
        value="Owner"
        onValueChange={onValueChange}
      />,
    );

    fireEvent.press(getByText("Owner"));

    expect(mockShowActionSheetWithOptions).toHaveBeenCalledTimes(1);
    const [config, callback] = mockShowActionSheetWithOptions.mock.calls[0];
    expect(config.title).toBe("Pick role");
    expect(config.options).toEqual(["Owner", "Member"]);

    callback(1);
    expect(onValueChange).toHaveBeenCalledWith("Member");
  });

  it("does not open ActionSheet when disabled", () => {
    const { getByText } = render(
      <MenuPicker
        options={["Owner", "Member"]}
        value="Owner"
        onValueChange={jest.fn()}
        disabled={true}
      />,
    );

    fireEvent.press(getByText("Owner"));
    expect(mockShowActionSheetWithOptions).not.toHaveBeenCalled();
  });

  it("uses Swift Picker flow outside Expo Go", () => {
    runtimeTyped.__setExpoGo(false);
    const onValueChange = jest.fn();
    render(
      <MenuPicker
        options={["Owner", "Member"]}
        value="Member"
        onValueChange={onValueChange}
        disabled={true}
      />,
    );

    const pickerCall = (Picker as jest.Mock).mock.calls[0][0];
    expect(pickerCall.options).toEqual(["Owner", "Member"]);
    expect(pickerCall.selectedIndex).toBe(1);
    expect(pickerCall.variant).toBe("menu");
    expect(pickerCall.color).toBe("rgba(235,235,245,0.35)");

    pickerCall.onOptionSelected({ nativeEvent: { index: 0 } });
    expect(onValueChange).toHaveBeenCalledWith("Owner");

    expect(fixedSize).toHaveBeenCalledWith({
      horizontal: true,
      vertical: true,
    });
    expect(disabledModifier).toHaveBeenCalledWith(true);
    expect(opacity).toHaveBeenCalledWith(0.5);
  });
});
