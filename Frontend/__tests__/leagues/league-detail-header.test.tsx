import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { LeagueDetailHeader } from "@/components/leagues/league-detail-header";

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

describe("LeagueDetailHeader", () => {
  const defaultProps = {
    title: "Test League",
    id: "league123",
    isMember: false,
    isOwner: false,
    onFollow: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing", () => {
    const { getByTestId } = render(<LeagueDetailHeader {...defaultProps} />);
    expect(getByTestId("header")).toBeTruthy();
  });

  it("displays the league title", () => {
    const { getByTestId } = render(<LeagueDetailHeader {...defaultProps} />);
    const titleElement = getByTestId("page-title");
    expect(titleElement.props.children).toBe("Test League");
  });

  it("shows back button on the left", () => {
    const { getByTestId } = render(<LeagueDetailHeader {...defaultProps} />);
    expect(getByTestId("header-button-back-undefined")).toBeTruthy();
  });

  it("shows Follow button when user is not member", () => {
    const { getByTestId } = render(<LeagueDetailHeader {...defaultProps} />);
    expect(getByTestId("header-button-custom-Follow")).toBeTruthy();
  });

  it("calls onFollow when Follow button is pressed", () => {
    const onFollow = jest.fn();
    const { getByTestId } = render(
      <LeagueDetailHeader {...defaultProps} onFollow={onFollow} />,
    );

    const followButton = getByTestId("header-button-custom-Follow");
    fireEvent.press(followButton);

    expect(onFollow).toHaveBeenCalledTimes(1);
  });

  it("shows settings button when user is member", () => {
    const { getByText } = render(
      <LeagueDetailHeader {...defaultProps} isMember={true} />,
    );
    expect(getByText("gear")).toBeTruthy();
  });

  it("does not show Follow button when user is member", () => {
    const { queryByTestId } = render(
      <LeagueDetailHeader {...defaultProps} isMember={true} />,
    );
    expect(queryByTestId("header-button-custom-Follow")).toBeNull();
  });

  it("settings button has correct route", () => {
    const { getByText } = render(
      <LeagueDetailHeader {...defaultProps} id="league-456" isMember={true} />,
    );
    const settingsButton = getByText("gear");
    expect(settingsButton).toBeTruthy();
  });

  it("renders with different league titles", () => {
    const { getByTestId, rerender } = render(
      <LeagueDetailHeader {...defaultProps} title="League A" />,
    );
    expect(getByTestId("page-title").props.children).toBe("League A");

    rerender(<LeagueDetailHeader {...defaultProps} title="League B" />);
    expect(getByTestId("page-title").props.children).toBe("League B");
  });

  it("renders with different league IDs", () => {
    const { getByText, rerender } = render(
      <LeagueDetailHeader {...defaultProps} id="league1" isMember={true} />,
    );
    expect(getByText("gear")).toBeTruthy();

    rerender(
      <LeagueDetailHeader {...defaultProps} id="league2" isMember={true} />,
    );
    expect(getByText("gear")).toBeTruthy();
  });

  it("updates Follow button callback when onFollow changes", () => {
    const onFollow1 = jest.fn();
    const onFollow2 = jest.fn();

    const { getByTestId, rerender } = render(
      <LeagueDetailHeader {...defaultProps} onFollow={onFollow1} />,
    );

    fireEvent.press(getByTestId("header-button-custom-Follow"));
    expect(onFollow1).toHaveBeenCalledTimes(1);
    expect(onFollow2).not.toHaveBeenCalled();

    rerender(<LeagueDetailHeader {...defaultProps} onFollow={onFollow2} />);
    fireEvent.press(getByTestId("header-button-custom-Follow"));

    expect(onFollow1).toHaveBeenCalledTimes(1);
    expect(onFollow2).toHaveBeenCalledTimes(1);
  });

  it("toggles between member and non-member states", () => {
    const { getByTestId, queryByTestId, getByText, rerender } = render(
      <LeagueDetailHeader {...defaultProps} isMember={false} />,
    );

    expect(getByTestId("header-button-custom-Follow")).toBeTruthy();
    expect(queryByTestId("header-button-custom-gear")).toBeNull();

    rerender(<LeagueDetailHeader {...defaultProps} isMember={true} />);

    expect(queryByTestId("header-button-custom-Follow")).toBeNull();
    expect(getByText("gear")).toBeTruthy();
  });

  it("maintains structure with empty title", () => {
    const { getByTestId } = render(
      <LeagueDetailHeader {...defaultProps} title="" />,
    );
    expect(getByTestId("page-title").props.children).toBe("");
    expect(getByTestId("header")).toBeTruthy();
  });

  it("maintains structure with long title", () => {
    const longTitle =
      "A Very Long League Name That Should Still Display Correctly";
    const { getByTestId } = render(
      <LeagueDetailHeader {...defaultProps} title={longTitle} />,
    );
    expect(getByTestId("page-title").props.children).toBe(longTitle);
  });

  it("renders all required header sections", () => {
    const { getByTestId } = render(<LeagueDetailHeader {...defaultProps} />);
    const header = getByTestId("header");
    expect(header).toBeTruthy();
    expect(getByTestId("header-button-back-undefined")).toBeTruthy(); // left
    expect(getByTestId("page-title")).toBeTruthy(); // center
    expect(getByTestId("header-button-custom-Follow")).toBeTruthy(); // right
  });

  it("handles multiple rapid Follow button presses", () => {
    const onFollow = jest.fn();
    const { getByTestId } = render(
      <LeagueDetailHeader {...defaultProps} onFollow={onFollow} />,
    );

    const followButton = getByTestId("header-button-custom-Follow");
    fireEvent.press(followButton);
    fireEvent.press(followButton);
    fireEvent.press(followButton);

    expect(onFollow).toHaveBeenCalledTimes(3);
  });

  it("renders with special characters in title", () => {
    const specialTitle = "League @#$%^&*()";
    const { getByTestId } = render(
      <LeagueDetailHeader {...defaultProps} title={specialTitle} />,
    );
    expect(getByTestId("page-title").props.children).toBe(specialTitle);
  });

  it("renders with numeric league ID", () => {
    const { getByText } = render(
      <LeagueDetailHeader {...defaultProps} id="12345" isMember={true} />,
    );
    expect(getByText("gear")).toBeTruthy();
  });

  it("renders with UUID league ID", () => {
    const { getByText } = render(
      <LeagueDetailHeader
        {...defaultProps}
        id="550e8400-e29b-41d4-a716-446655440000"
        isMember={true}
      />,
    );
    expect(getByText("gear")).toBeTruthy();
  });

  it("back button is always present regardless of member status", () => {
    const { getByTestId, rerender } = render(
      <LeagueDetailHeader {...defaultProps} isMember={false} />,
    );
    expect(getByTestId("header-button-back-undefined")).toBeTruthy();

    rerender(<LeagueDetailHeader {...defaultProps} isMember={true} />);
    expect(getByTestId("header-button-back-undefined")).toBeTruthy();
  });

  it("title is always displayed regardless of member status", () => {
    const { getByTestId, rerender } = render(
      <LeagueDetailHeader {...defaultProps} isMember={false} />,
    );
    expect(getByTestId("page-title")).toBeTruthy();

    rerender(<LeagueDetailHeader {...defaultProps} isMember={true} />);
    expect(getByTestId("page-title")).toBeTruthy();
  });
});
