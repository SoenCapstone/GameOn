import React from "react";
import { render } from "@testing-library/react-native";
import NativePicker from "@/components/ui/native-picker";
import { Picker, Text as SwiftText } from "@expo/ui/swift-ui";
import {
  disabled as disabledModifier,
  fixedSize,
  foregroundStyle,
  opacity,
  pickerStyle,
  tag,
  tint,
} from "@expo/ui/swift-ui/modifiers";

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
    Text: jest.fn(
      (props: { children: React.ReactNode; [key: string]: unknown }) =>
        ReactMock.createElement(View, { testID: "swift-text", ...props }),
    ),
  };
});

jest.mock("@expo/ui/swift-ui/modifiers", () => ({
  disabled: jest.fn((value: boolean) => ({ type: "disabled", value })),
  fixedSize: jest.fn((value: unknown) => ({ type: "fixedSize", value })),
  foregroundStyle: jest.fn((value: unknown) => ({
    type: "foregroundStyle",
    value,
  })),
  opacity: jest.fn((value: number) => ({ type: "opacity", value })),
  pickerStyle: jest.fn((value: unknown) => ({ type: "pickerStyle", value })),
  tag: jest.fn((value: unknown) => ({ type: "tag", value })),
  tint: jest.fn((value: unknown) => ({ type: "tint", value })),
}));

describe("NativePicker", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("selection value", () => {
    it("uses the value when it exists in options", () => {
      render(
        <NativePicker
          options={["Owner", "Member"]}
          value="Owner"
          onValueChange={jest.fn()}
        />,
      );
      const pickerCall = (Picker as jest.Mock).mock.calls[0][0];
      expect(pickerCall.selection).toBe("Owner");
    });

    it("falls back to placeholder when value is not in options", () => {
      render(
        <NativePicker
          options={["Owner", "Member"]}
          value=""
          placeholder="Select role"
          onValueChange={jest.fn()}
        />,
      );
      const pickerCall = (Picker as jest.Mock).mock.calls[0][0];
      expect(pickerCall.selection).toBe("Select role");
    });

    it("falls back to undefined when value is not in options and no placeholder", () => {
      render(
        <NativePicker
          options={["Owner", "Member"]}
          value=""
          onValueChange={jest.fn()}
        />,
      );
      const pickerCall = (Picker as jest.Mock).mock.calls[0][0];
      expect(pickerCall.selection).toBeUndefined();
    });
  });

  describe("label / title", () => {
    it("passes title as Picker label", () => {
      render(
        <NativePicker
          title="Role"
          options={["Owner", "Member"]}
          value="Owner"
          onValueChange={jest.fn()}
        />,
      );
      const pickerCall = (Picker as jest.Mock).mock.calls[0][0];
      expect(pickerCall.label).toBe("Role");
    });

    it("omits label when no title is provided", () => {
      render(
        <NativePicker
          options={["Owner", "Member"]}
          value="Owner"
          onValueChange={jest.fn()}
        />,
      );
      const pickerCall = (Picker as jest.Mock).mock.calls[0][0];
      expect(pickerCall.label).toBeUndefined();
    });
  });

  describe("option rendering", () => {
    it("renders one SwiftText per option when no placeholder", () => {
      render(
        <NativePicker
          options={["Owner", "Member"]}
          value="Owner"
          onValueChange={jest.fn()}
        />,
      );
      expect((SwiftText as jest.Mock).mock.calls).toHaveLength(2);
      expect(tag).toHaveBeenCalledWith("Owner");
      expect(tag).toHaveBeenCalledWith("Member");
    });

    it("renders placeholder as first SwiftText when provided", () => {
      render(
        <NativePicker
          options={["Owner", "Member"]}
          value=""
          placeholder="Select role"
          onValueChange={jest.fn()}
        />,
      );
      expect((SwiftText as jest.Mock).mock.calls).toHaveLength(3);
      expect(tag).toHaveBeenCalledWith("Select role");
      expect(tag).toHaveBeenCalledWith("Owner");
      expect(tag).toHaveBeenCalledWith("Member");
    });
  });

  describe("onSelectionChange", () => {
    it("calls onValueChange when a real option is selected", () => {
      const onValueChange = jest.fn();
      render(
        <NativePicker
          options={["Owner", "Member"]}
          value="Owner"
          onValueChange={onValueChange}
        />,
      );
      const pickerCall = (Picker as jest.Mock).mock.calls[0][0];
      pickerCall.onSelectionChange("Member");
      expect(onValueChange).toHaveBeenCalledWith("Member");
    });

    it("does not call onValueChange when the placeholder is selected", () => {
      const onValueChange = jest.fn();
      render(
        <NativePicker
          options={["Owner", "Member"]}
          value=""
          placeholder="Select role"
          onValueChange={onValueChange}
        />,
      );
      const pickerCall = (Picker as jest.Mock).mock.calls[0][0];
      pickerCall.onSelectionChange("Select role");
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("does not call onValueChange for non-string selection values", () => {
      const onValueChange = jest.fn();
      render(
        <NativePicker
          options={["Owner", "Member"]}
          value="Owner"
          onValueChange={onValueChange}
        />,
      );
      const pickerCall = (Picker as jest.Mock).mock.calls[0][0];
      pickerCall.onSelectionChange(42);
      expect(onValueChange).not.toHaveBeenCalled();
    });
  });

  describe("disabled state", () => {
    it("applies disabled modifiers when disabled=true", () => {
      render(
        <NativePicker
          options={["Owner", "Member"]}
          value="Owner"
          onValueChange={jest.fn()}
          disabled={true}
        />,
      );
      expect(disabledModifier).toHaveBeenCalledWith(true);
      expect(opacity).toHaveBeenCalledWith(0.5);
      expect(tint).toHaveBeenCalledWith("rgba(235,235,245,0.35)");
      expect(foregroundStyle).toHaveBeenCalledWith("rgba(235,235,245,0.35)");
    });

    it("applies enabled modifiers when disabled=false", () => {
      render(
        <NativePicker
          options={["Owner", "Member"]}
          value="Owner"
          onValueChange={jest.fn()}
          disabled={false}
        />,
      );
      expect(disabledModifier).toHaveBeenCalledWith(false);
      expect(opacity).toHaveBeenCalledWith(1);
      expect(tint).toHaveBeenCalledWith("rgba(235,235,245,0.6)");
      expect(foregroundStyle).toHaveBeenCalledWith("rgba(235,235,245,0.6)");
    });

    it("defaults to enabled when disabled prop is omitted", () => {
      render(
        <NativePicker
          options={["Owner"]}
          value="Owner"
          onValueChange={jest.fn()}
        />,
      );
      expect(disabledModifier).toHaveBeenCalledWith(false);
      expect(opacity).toHaveBeenCalledWith(1);
    });
  });

  describe("always-applied modifiers", () => {
    it("always applies pickerStyle('menu') and fixedSize", () => {
      render(
        <NativePicker
          options={["Owner"]}
          value="Owner"
          onValueChange={jest.fn()}
        />,
      );
      expect(pickerStyle).toHaveBeenCalledWith("menu");
      expect(fixedSize).toHaveBeenCalledWith({
        horizontal: true,
        vertical: true,
      });
    });
  });
});
