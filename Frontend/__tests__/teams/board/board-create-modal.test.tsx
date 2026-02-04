import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import { BoardCreateModal } from "@/components/teams/board/board-create-modal";

jest.mock("react-native", () => {
  const ReactMock = jest.requireActual("react");
  const MockView = (props: any) =>
    ReactMock.createElement("View", props, props.children);
  const MockText = (props: any) =>
    ReactMock.createElement("Text", props, props.children);
  const MockTextInput = (props: any) =>
    ReactMock.createElement("TextInput", props, props.children);
  const MockPressable = (props: any) =>
    ReactMock.createElement("Pressable", props, props.children);
  MockView.displayName = "MockView";
  MockText.displayName = "MockText";
  MockTextInput.displayName = "MockTextInput";
  MockPressable.displayName = "MockPressable";
  return {
    View: MockView,
    Text: MockText,
    TextInput: MockTextInput,
    Pressable: MockPressable,
    Alert: { alert: jest.fn() },
    StyleSheet: {
      create: (styles: any) => styles,
      flatten: (styles: any) => styles,
    },
    Modal: ({ children, visible }: any) => (visible ? children : null),
  };
});

jest.mock("@react-navigation/elements", () => ({
  useHeaderHeight: () => 0,
}));

jest.mock("react-native-keyboard-controller", () => {
  return {
    KeyboardAwareScrollView: ({ children }: any) => children,
  };
});

jest.mock("@/components/ui/background", () => ({
  Background: () => null,
}));

jest.mock("@/components/ui/button", () => {
  const ReactMock = jest.requireActual("react");
  return {
    Button: (props: any) =>
      ReactMock.createElement(
        "Text",
        {
          testID: `button-${props.icon || props.label || props.type}`,
          onPress: props.onPress,
        },
        props.icon || props.label || props.type,
      ),
  };
});

jest.mock("@/components/form/form", () => {
  const ReactMock = jest.requireActual("react");

  const MockView = (props: any) =>
    ReactMock.createElement("View", props, props.children);
  const MockText = (props: any) =>
    ReactMock.createElement("Text", props, props.children);
  MockView.displayName = "FormMockView";
  MockText.displayName = "FormMockText";

  const Form = ({ children }: any) => <MockView>{children}</MockView>;

  const MenuItem = ({ label, options, value, onValueChange }: any) => (
    <MockView>
      <MockText>{`${label}: ${value}`}</MockText>
      {options.map((opt: string) =>
        ReactMock.createElement(
          "Text",
          {
            key: `${label}-${opt}`,
            testID: `menu-${label}-${opt}`,
            onPress: () => onValueChange(opt),
          },
          opt,
        ),
      )}
    </MockView>
  );
  MenuItem.displayName = "FormMenu";

  const ButtonItem = ({ label, onPress }: any) =>
    ReactMock.createElement(
      "Text",
      { testID: `form-button-${label}`, onPress },
      label,
    );
  ButtonItem.displayName = "FormButton";

  Form.Menu = MenuItem;
  Form.Button = ButtonItem;
  return { Form };
});

describe("BoardCreateModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("prefills edit mode content and shows loading label", () => {
    const editPost = {
      id: "post-1",
      type: "training",
      scope: "everyone",
      content: "Existing post",
      createdAt: "2025-01-01",
      authorId: "user-1",
      authorName: "Coach",
    } as any;

    const { getByText, getByDisplayValue, getByPlaceholderText } = render(
      <BoardCreateModal
        visible={true}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        isLoading={true}
        editPost={editPost}
      />,
    );

    expect(getByText("Edit Post")).toBeTruthy();
    expect(getByDisplayValue("Existing post")).toBeTruthy();
    expect(getByText("Type: training")).toBeTruthy();
    expect(getByText("Scope: everyone")).toBeTruthy();
    expect(getByText("Updating...")).toBeTruthy();
    expect(getByPlaceholderText("Enter text").props.editable).toBe(false);
  });

  it("shows validation alert when content is empty", () => {
    const alertSpy = jest.spyOn(Alert, "alert");

    const { getByTestId } = render(
      <BoardCreateModal
        visible={true}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
      />,
    );

    fireEvent.press(getByTestId("form-button-Post"));

    expect(alertSpy).toHaveBeenCalledWith(
      "Failed to Post",
      "Please enter content",
    );
  });

  it("submits trimmed content and resets after success", async () => {
    const onClose = jest.fn();
    const onSubmit = jest.fn(async () => undefined);

    const { getByPlaceholderText, getByTestId, getByText } = render(
      <BoardCreateModal visible={true} onClose={onClose} onSubmit={onSubmit} />,
    );

    fireEvent.changeText(getByPlaceholderText("Enter text"), "  Hello  ");
    fireEvent.press(getByTestId("menu-Type-game"));
    fireEvent.press(getByTestId("menu-Scope-everyone"));

    fireEvent.press(getByTestId("form-button-Post"));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith("game", "everyone", "Hello");
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    expect(getByText("Type: general")).toBeTruthy();
    expect(getByText("Scope: players")).toBeTruthy();
    expect(getByPlaceholderText("Enter text").props.value).toBe("");
  });
});
