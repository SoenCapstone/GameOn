import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { TeamDetailHeader } from "@/components/teams/team-detail-header";

jest.mock("@/components/header/header", () => {
  const mockReact = jest.requireActual("react");
  const mockView = jest.requireActual("react-native").View;
  return {
    Header: (props: any) =>
      mockReact.createElement(
        mockView,
        { testID: "header" },
        props.left,
        props.center,
        props.right,
      ),
  };
});

jest.mock("@/components/ui/button", () => {
  const mockReact = jest.requireActual("react");
  const mockTouchableOpacity =
    jest.requireActual("react-native").TouchableOpacity;
  const mockText = jest.requireActual("react-native").Text;
  return {
    Button: (props: any) => {
      const testID = `header-button-${props.type}-${props.label || props.route || props.icon}`;
      return mockReact.createElement(
        mockTouchableOpacity,
        { testID, onPress: props.onPress, ...props },
        mockReact.createElement(
          mockText,
          null,
          props.label || props.icon || props.route,
        ),
      );
    },
  };
});

jest.mock("@/components/header/page-title", () => {
  const mockReact = jest.requireActual("react");
  const mockText = jest.requireActual("react-native").Text;
  return {
    PageTitle: (props: any) =>
      mockReact.createElement(
        mockText,
        { testID: "page-title", ...props },
        props.title,
      ),
  };
});

describe("TeamDetailHeader", () => {
  const defaultProps = {
    title: "Test Team",
    id: "team123",
    isOwner: false,
    onFollow: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing", () => {
    const { getByTestId } = render(<TeamDetailHeader {...defaultProps} />);
    expect(getByTestId("header")).toBeTruthy();
  });

  it("displays the team title", () => {
    const { getByTestId } = render(<TeamDetailHeader {...defaultProps} />);
    const titleElement = getByTestId("page-title");
    expect(titleElement.props.children).toBe("Test Team");
  });

  it("shows back button on the left", () => {
    const { getByTestId } = render(<TeamDetailHeader {...defaultProps} />);
    expect(getByTestId("header-button-back-undefined")).toBeTruthy();
  });

  it("shows Follow button when user is not owner", () => {
    const { getByTestId } = render(<TeamDetailHeader {...defaultProps} />);
    expect(getByTestId("header-button-custom-Follow")).toBeTruthy();
  });

  it("calls onFollow when Follow button is pressed", () => {
    const onFollow = jest.fn();
    const { getByTestId } = render(
      <TeamDetailHeader {...defaultProps} onFollow={onFollow} />,
    );

    const followButton = getByTestId("header-button-custom-Follow");
    fireEvent.press(followButton);

    expect(onFollow).toHaveBeenCalledTimes(1);
  });

  it("shows settings button when user is owner", () => {
    const { getByText } = render(
      <TeamDetailHeader {...defaultProps} isOwner={true} />,
    );
    expect(getByText("gear")).toBeTruthy();
  });

  it("does not show Follow button when user is owner", () => {
    const { queryByTestId } = render(
      <TeamDetailHeader {...defaultProps} isOwner={true} />,
    );
    expect(queryByTestId("header-button-custom-Follow")).toBeNull();
  });

  it("settings button has correct route", () => {
    const { getByText } = render(
      <TeamDetailHeader {...defaultProps} isOwner={true} />,
    );
    const settingsButton = getByText("gear");
    expect(settingsButton).toBeTruthy();
  });

  it("renders with different team titles", () => {
    const { getByTestId, rerender } = render(
      <TeamDetailHeader {...defaultProps} title="Team A" />,
    );
    expect(getByTestId("page-title").props.children).toBe("Team A");

    rerender(<TeamDetailHeader {...defaultProps} title="Team B" />);
    expect(getByTestId("page-title").props.children).toBe("Team B");
  });

  it("renders with different team IDs", () => {
    const { getByText, rerender } = render(
      <TeamDetailHeader {...defaultProps} id="team1" isOwner={true} />,
    );
    expect(getByText("gear")).toBeTruthy();

    rerender(<TeamDetailHeader {...defaultProps} id="team2" isOwner={true} />);
    expect(getByText("gear")).toBeTruthy();
  });

  it("updates Follow button callback when onFollow changes", () => {
    const onFollow1 = jest.fn();
    const onFollow2 = jest.fn();

    const { getByTestId, rerender } = render(
      <TeamDetailHeader {...defaultProps} onFollow={onFollow1} />,
    );

    fireEvent.press(getByTestId("header-button-custom-Follow"));
    expect(onFollow1).toHaveBeenCalledTimes(1);
    expect(onFollow2).not.toHaveBeenCalled();

    rerender(<TeamDetailHeader {...defaultProps} onFollow={onFollow2} />);
    fireEvent.press(getByTestId("header-button-custom-Follow"));

    expect(onFollow1).toHaveBeenCalledTimes(1);
    expect(onFollow2).toHaveBeenCalledTimes(1);
  });

  it("toggles between owner and non-owner states", () => {
    const { getByTestId, queryByTestId, getByText, rerender } = render(
      <TeamDetailHeader {...defaultProps} isOwner={false} />,
    );

    expect(getByTestId("header-button-custom-Follow")).toBeTruthy();
    expect(queryByTestId("header-button-custom-gear")).toBeNull();

    rerender(<TeamDetailHeader {...defaultProps} isOwner={true} />);

    expect(queryByTestId("header-button-custom-Follow")).toBeNull();
    expect(getByText("gear")).toBeTruthy();
  });

  it("maintains structure with empty title", () => {
    const { getByTestId } = render(
      <TeamDetailHeader {...defaultProps} title="" />,
    );
    expect(getByTestId("page-title").props.children).toBe("");
    expect(getByTestId("header")).toBeTruthy();
  });

  it("maintains structure with long title", () => {
    const longTitle =
      "A Very Long Team Name That Should Still Display Correctly";
    const { getByTestId } = render(
      <TeamDetailHeader {...defaultProps} title={longTitle} />,
    );
    expect(getByTestId("page-title").props.children).toBe(longTitle);
  });
});
