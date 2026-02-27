import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { TeamDetailsCard } from "@/components/teams/details-card";
import { ViewStyle } from "react-native";

describe("TeamDetailsCard", () => {
  let mockOnOpenPicker: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnOpenPicker = jest.fn();
  });

  it("renders correctly with all labels and empty labels", () => {
    const { getByText: getByText1 } = render(
      <TeamDetailsCard
        sportLabel="Soccer"
        scopeLabel="Recreational"
        cityLabel="Toronto"
        onOpenPicker={mockOnOpenPicker}
      />,
    );

    expect(getByText1("Details")).toBeTruthy();
    expect(getByText1("Sports")).toBeTruthy();
    expect(getByText1("Soccer ⌵")).toBeTruthy();
    expect(getByText1("Scope")).toBeTruthy();
    expect(getByText1("Recreational ⌵")).toBeTruthy();
    expect(getByText1("Location")).toBeTruthy();
    expect(getByText1("Toronto ⌵")).toBeTruthy();

    const { getByText: getByText2 } = render(
      <TeamDetailsCard
        sportLabel=""
        scopeLabel=""
        cityLabel=""
        onOpenPicker={mockOnOpenPicker}
      />,
    );

    expect(getByText2("Sports")).toBeTruthy();
    expect(getByText2("Scope")).toBeTruthy();
    expect(getByText2("Location")).toBeTruthy();
  });

  it("calls onOpenPicker with correct type when each row is pressed", () => {
    const { getByText } = render(
      <TeamDetailsCard
        sportLabel="Soccer"
        scopeLabel="Recreational"
        cityLabel="Toronto"
        onOpenPicker={mockOnOpenPicker}
      />,
    );

    const rows = [
      { text: "Soccer ⌵", type: "sport" },
      { text: "Recreational ⌵", type: "scope" },
      { text: "Toronto ⌵", type: "city" },
    ];

    rows.forEach(({ text, type }) => {
      mockOnOpenPicker.mockClear();
      fireEvent.press(getByText(text));
      expect(mockOnOpenPicker).toHaveBeenCalledWith(type);
      expect(mockOnOpenPicker).toHaveBeenCalledTimes(1);
    });
  });

  it("handles multiple presses and numeric/whitespace labels", () => {
    const { getByText } = render(
      <TeamDetailsCard
        sportLabel="Soccer"
        scopeLabel="Recreational"
        cityLabel="Toronto"
        onOpenPicker={mockOnOpenPicker}
      />,
    );

    fireEvent.press(getByText("Soccer ⌵"));
    fireEvent.press(getByText("Recreational ⌵"));
    fireEvent.press(getByText("Toronto ⌵"));

    expect(mockOnOpenPicker).toHaveBeenCalledTimes(3);
    expect(mockOnOpenPicker).toHaveBeenNthCalledWith(1, "sport");
    expect(mockOnOpenPicker).toHaveBeenNthCalledWith(2, "scope");
    expect(mockOnOpenPicker).toHaveBeenNthCalledWith(3, "city");

    mockOnOpenPicker.mockClear();

    const sportRow = getByText("Soccer ⌵");
    fireEvent.press(sportRow);
    fireEvent.press(sportRow);
    fireEvent.press(sportRow);

    expect(mockOnOpenPicker).toHaveBeenCalledTimes(3);
    expect(mockOnOpenPicker).toHaveBeenCalledWith("sport");

    mockOnOpenPicker.mockClear();

    const { getByText: getByText2 } = render(
      <TeamDetailsCard
        sportLabel="5v5 Soccer"
        scopeLabel="Division 2"
        cityLabel="Area 51"
        onOpenPicker={mockOnOpenPicker}
      />,
    );

    expect(getByText2("5v5 Soccer ⌵")).toBeTruthy();
    expect(getByText2("Division 2 ⌵")).toBeTruthy();
    expect(getByText2("Area 51 ⌵")).toBeTruthy();

    const { getByText: getByText3 } = render(
      <TeamDetailsCard
        sportLabel="  Soccer  "
        scopeLabel="  Recreational  "
        cityLabel="  Toronto  "
        onOpenPicker={mockOnOpenPicker}
      />,
    );

    expect(getByText3("  Soccer   ⌵")).toBeTruthy();
    expect(getByText3("  Recreational   ⌵")).toBeTruthy();
    expect(getByText3("  Toronto   ⌵")).toBeTruthy();
  });

  it("handles long labels and special/unicode characters", () => {
    const longSport = "A".repeat(50);
    const longScope = "Very Competitive Professional Level";
    const longCity = "San Francisco Bay Area";

    const { getByText: getByText1 } = render(
      <TeamDetailsCard
        sportLabel={longSport}
        scopeLabel="Recreational"
        cityLabel="Toronto"
        onOpenPicker={mockOnOpenPicker}
      />,
    );

    expect(getByText1(`${longSport} ⌵`)).toBeTruthy();

    const { getByText: getByText2 } = render(
      <TeamDetailsCard
        sportLabel="Soccer"
        scopeLabel={longScope}
        cityLabel="Toronto"
        onOpenPicker={mockOnOpenPicker}
      />,
    );

    expect(getByText2(`${longScope} ⌵`)).toBeTruthy();

    const { getByText: getByText3 } = render(
      <TeamDetailsCard
        sportLabel="Soccer"
        scopeLabel="Recreational"
        cityLabel={longCity}
        onOpenPicker={mockOnOpenPicker}
      />,
    );

    expect(getByText3(`${longCity} ⌵`)).toBeTruthy();

    const { getByText: getByText4 } = render(
      <TeamDetailsCard
        sportLabel="Soccer & Basketball"
        scopeLabel="Semi-Pro"
        cityLabel="New York, NY"
        onOpenPicker={mockOnOpenPicker}
      />,
    );

    expect(getByText4("Soccer & Basketball ⌵")).toBeTruthy();
    expect(getByText4("Semi-Pro ⌵")).toBeTruthy();
    expect(getByText4("New York, NY ⌵")).toBeTruthy();

    const { getByText: getByText5 } = render(
      <TeamDetailsCard
        sportLabel="サッカー"
        scopeLabel="レクリエーション"
        cityLabel="東京"
        onOpenPicker={mockOnOpenPicker}
      />,
    );

    expect(getByText5("サッカー ⌵")).toBeTruthy();
    expect(getByText5("レクリエーション ⌵")).toBeTruthy();
    expect(getByText5("東京 ⌵")).toBeTruthy();
  });

  it("renders with readonly props and all rows are accessible", () => {
    const props = {
      sportLabel: "Hockey",
      scopeLabel: "Recreational",
      cityLabel: "Toronto",
      onOpenPicker: mockOnOpenPicker,
    } as const;

    const { getByText } = render(<TeamDetailsCard {...props} />);

    expect(getByText("Hockey ⌵")).toBeTruthy();

    const sportRow = getByText("Hockey ⌵").parent;
    const scopeRow = getByText("Recreational ⌵").parent;
    const cityRow = getByText("Toronto ⌵").parent;

    expect(sportRow?.props.accessible).not.toBe(false);
    expect(scopeRow?.props.accessible).not.toBe(false);
    expect(cityRow?.props.accessible).not.toBe(false);
  });

  it("handles label headers and alternative press methods", () => {
    const { getAllByText, getByText } = render(
      <TeamDetailsCard
        sportLabel="Soccer"
        scopeLabel="Recreational"
        cityLabel="Toronto"
        onOpenPicker={mockOnOpenPicker}
      />,
    );

    const labels = getAllByText(/Sports|Scope|Location/);
    expect(labels.length).toBeGreaterThanOrEqual(3);

    mockOnOpenPicker.mockClear();
    const sportsLabel = getByText("Sports");
    fireEvent.press(sportsLabel.parent);

    expect(mockOnOpenPicker).toHaveBeenCalledWith("sport");
  });

  it("handles empty string labels with dropdown indicator", () => {
    const { getByText } = render(
      <TeamDetailsCard
        sportLabel=""
        scopeLabel=""
        cityLabel=""
        onOpenPicker={mockOnOpenPicker}
      />,
    );

    getByText("Sports").parent?.parent?.children.find(
      (child: { props: { style?: ViewStyle } }) =>
        child.props.style === undefined || Array.isArray(child.props.style),
    );

    expect(getByText("Sports")).toBeTruthy();
    expect(getByText("Scope")).toBeTruthy();
    expect(getByText("Location")).toBeTruthy();
  });

  it("does not call onOpenPicker on divider press", () => {
    render(
      <TeamDetailsCard
        sportLabel="Soccer"
        scopeLabel="Recreational"
        cityLabel="Toronto"
        onOpenPicker={mockOnOpenPicker}
      />,
    );

    expect(mockOnOpenPicker).not.toHaveBeenCalled();
  });
});
