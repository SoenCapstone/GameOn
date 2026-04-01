import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { MenuPicker } from "@/components/ui/menu-picker";
import * as runtime from "@/utils/runtime";

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

jest.mock("@/components/ui/native-picker", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const runtimeTyped = runtime as unknown as {
  __setExpoGo: (value: boolean) => void;
  isRunningInExpoGo: boolean;
};

describe("MenuPicker", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    runtimeTyped.__setExpoGo(true);
  });

  describe("in Expo Go (ActionSheet)", () => {
    it("displays the selected value as the button label", () => {
      const { getByText } = render(
        <MenuPicker
          options={["Owner", "Member"]}
          value="Owner"
          onValueChange={jest.fn()}
        />,
      );
      expect(getByText("Owner")).toBeTruthy();
    });

    it("displays the placeholder when value is not in options", () => {
      const { getByText } = render(
        <MenuPicker
          options={["Owner", "Member"]}
          value=""
          placeholder="Select role"
          onValueChange={jest.fn()}
        />,
      );
      expect(getByText("Select role")).toBeTruthy();
    });

    it("opens ActionSheet with all options on press", () => {
      const { getByText } = render(
        <MenuPicker
          title="Pick role"
          options={["Owner", "Member"]}
          value="Owner"
          onValueChange={jest.fn()}
        />,
      );
      fireEvent.press(getByText("Owner"));
      expect(mockShowActionSheetWithOptions).toHaveBeenCalledTimes(1);
      const [config] = mockShowActionSheetWithOptions.mock.calls[0];
      expect(config.title).toBe("Pick role");
      expect(config.options).toEqual(["Owner", "Member"]);
    });

    it("ActionSheet options do not include the placeholder", () => {
      const { getByText } = render(
        <MenuPicker
          title="Pick role"
          options={["Owner", "Member"]}
          value=""
          placeholder="Select role"
          onValueChange={jest.fn()}
        />,
      );
      fireEvent.press(getByText("Select role"));
      const [config] = mockShowActionSheetWithOptions.mock.calls[0];
      expect(config.options).toEqual(["Owner", "Member"]);
    });

    it("calls onValueChange with the tapped option", () => {
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
      const [, callback] = mockShowActionSheetWithOptions.mock.calls[0];
      callback(1);
      expect(onValueChange).toHaveBeenCalledWith("Member");
    });

    it("does not call onValueChange when callback index is out of bounds", () => {
      const onValueChange = jest.fn();
      const { getByText } = render(
        <MenuPicker
          options={["Owner", "Member"]}
          value="Owner"
          onValueChange={onValueChange}
        />,
      );
      fireEvent.press(getByText("Owner"));
      const [, callback] = mockShowActionSheetWithOptions.mock.calls[0];
      callback(undefined);
      expect(onValueChange).not.toHaveBeenCalled();
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
  });

  describe("outside Expo Go (NativePicker)", () => {
    it("does not open ActionSheet when not in Expo Go", () => {
      runtimeTyped.__setExpoGo(false);
      const { queryByText } = render(
        <MenuPicker
          options={["Owner", "Member"]}
          value="Owner"
          onValueChange={jest.fn()}
        />,
      );
      expect(queryByText("Owner")).toBeNull();
      expect(mockShowActionSheetWithOptions).not.toHaveBeenCalled();
    });
  });
});
