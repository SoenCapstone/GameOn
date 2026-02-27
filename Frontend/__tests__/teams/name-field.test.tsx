import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { TeamNameField } from "@/components/teams/name-field";

describe("TeamNameField", () => {
  let mockOnChangeTeamName: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnChangeTeamName = jest.fn();
  });

  it("renders correctly with empty and provided team name, displays Name label", () => {
    const {
      getByPlaceholderText: getByPlaceholderText1,
      getByText: getByText1,
    } = render(
      <TeamNameField teamName="" onChangeTeamName={mockOnChangeTeamName} />,
    );

    const input1 = getByPlaceholderText1("Team Name");
    expect(input1).toBeTruthy();
    expect(input1.props.value).toBe("");
    expect(getByText1("Name")).toBeTruthy();

    const { getByPlaceholderText: getByPlaceholderText2 } = render(
      <TeamNameField
        teamName="My Team"
        onChangeTeamName={mockOnChangeTeamName}
      />,
    );

    const input2 = getByPlaceholderText2("Team Name");
    expect(input2.props.value).toBe("My Team");
  });

  it("handles text changes and clear button interaction", () => {
    const { getByPlaceholderText } = render(
      <TeamNameField teamName="" onChangeTeamName={mockOnChangeTeamName} />,
    );

    const input = getByPlaceholderText("Team Name");
    fireEvent.changeText(input, "New Team");

    expect(mockOnChangeTeamName).toHaveBeenCalledWith("New Team");

    mockOnChangeTeamName.mockClear();

    const { getByPlaceholderText: getByPlaceholderText2 } = render(
      <TeamNameField
        teamName="Old Team"
        onChangeTeamName={mockOnChangeTeamName}
      />,
    );

    const input2 = getByPlaceholderText2("Team Name");
    fireEvent.changeText(input2, "Updated Team");

    expect(mockOnChangeTeamName).toHaveBeenCalledWith("Updated Team");

    mockOnChangeTeamName.mockClear();

    const { getByText } = render(
      <TeamNameField
        teamName="My Team"
        onChangeTeamName={mockOnChangeTeamName}
      />,
    );

    const clearButton = getByText("✕");
    fireEvent.press(clearButton);

    expect(mockOnChangeTeamName).toHaveBeenCalledWith("");
  });

  it("manages clear button visibility based on team name presence", () => {
    const { queryByText: queryByText1 } = render(
      <TeamNameField teamName="" onChangeTeamName={mockOnChangeTeamName} />,
    );

    let clearButton = queryByText1("✕");
    expect(clearButton).toBeNull();

    const { getByText: getByText1 } = render(
      <TeamNameField
        teamName="My Team"
        onChangeTeamName={mockOnChangeTeamName}
      />,
    );

    clearButton = getByText1("✕");
    expect(clearButton).toBeTruthy();

    const { getByText: getByText2 } = render(
      <TeamNameField teamName="A" onChangeTeamName={mockOnChangeTeamName} />,
    );

    clearButton = getByText2("✕");
    expect(clearButton).toBeTruthy();

    const { getByText: getByText3 } = render(
      <TeamNameField teamName="   " onChangeTeamName={mockOnChangeTeamName} />,
    );

    clearButton = getByText3("✕");
    expect(clearButton).toBeTruthy();
  });

  it("handles various text formats (long, special, unicode, numeric, whitespace)", () => {
    const longName = "A".repeat(100);
    const { getByPlaceholderText: getByPlaceholderText1 } = render(
      <TeamNameField
        teamName={longName}
        onChangeTeamName={mockOnChangeTeamName}
      />,
    );

    let input = getByPlaceholderText1("Team Name");
    expect(input.props.value).toBe(longName);

    const specialName = "Team @#$%^&*()";
    const { getByPlaceholderText: getByPlaceholderText2 } = render(
      <TeamNameField
        teamName={specialName}
        onChangeTeamName={mockOnChangeTeamName}
      />,
    );

    input = getByPlaceholderText2("Team Name");
    expect(input.props.value).toBe(specialName);

    const unicodeName = "チーム 🏆";
    const { getByPlaceholderText: getByPlaceholderText3 } = render(
      <TeamNameField
        teamName={unicodeName}
        onChangeTeamName={mockOnChangeTeamName}
      />,
    );

    input = getByPlaceholderText3("Team Name");
    expect(input.props.value).toBe(unicodeName);

    const whitespaceName = "   Team   Name   ";
    const { getByPlaceholderText: getByPlaceholderText4 } = render(
      <TeamNameField
        teamName={whitespaceName}
        onChangeTeamName={mockOnChangeTeamName}
      />,
    );

    input = getByPlaceholderText4("Team Name");
    expect(input.props.value).toBe(whitespaceName);

    const { getByPlaceholderText: getByPlaceholderText5 } = render(
      <TeamNameField
        teamName="123456"
        onChangeTeamName={mockOnChangeTeamName}
      />,
    );

    input = getByPlaceholderText5("Team Name");
    expect(input.props.value).toBe("123456");

    const { getByPlaceholderText: getByPlaceholderText6 } = render(
      <TeamNameField
        teamName="Team123"
        onChangeTeamName={mockOnChangeTeamName}
      />,
    );

    input = getByPlaceholderText6("Team Name");
    expect(input.props.value).toBe("Team123");
  });

  it("handles clearing and re-entering text, tracks callback count", () => {
    const { getByText, rerender, queryByText } = render(
      <TeamNameField
        teamName="Initial"
        onChangeTeamName={mockOnChangeTeamName}
      />,
    );

    expect(getByText("✕")).toBeTruthy();

    fireEvent.press(getByText("✕"));
    expect(mockOnChangeTeamName).toHaveBeenCalledWith("");

    rerender(
      <TeamNameField teamName="" onChangeTeamName={mockOnChangeTeamName} />,
    );
    expect(queryByText("✕")).toBeNull();

    mockOnChangeTeamName.mockClear();

    const { getByPlaceholderText } = render(
      <TeamNameField teamName="" onChangeTeamName={mockOnChangeTeamName} />,
    );

    const input = getByPlaceholderText("Team Name");
    fireEvent.changeText(input, "Test");

    expect(mockOnChangeTeamName).toHaveBeenCalledTimes(1);
  });

  it("renders with readonly props and clear button is accessible", () => {
    const props = {
      teamName: "Test Team",
      onChangeTeamName: mockOnChangeTeamName,
    } as const;

    const { getByPlaceholderText, getByText } = render(
      <TeamNameField {...props} />,
    );

    const input = getByPlaceholderText("Team Name");
    expect(input.props.value).toBe("Test Team");

    const clearButton = getByText("✕");
    expect(clearButton.props.accessible).not.toBe(false);
  });
});
