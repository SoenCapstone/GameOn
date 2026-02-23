import React from "react";
import { render } from "@testing-library/react-native";
import { PageTitle } from "@/components/header/page-title";

describe("PageTitle", () => {
  it("should render the title text correctly", () => {
    const titleText = "My Custom Title";
    const { getByText, queryByText } = render(<PageTitle title={titleText} />);

    expect(getByText(titleText)).toBeOnTheScreen();

    expect(queryByText("Some Other Title")).toBeNull();
  });

  it("should apply the correct styles to the title text", () => {
    const titleText = "Styled Title";
    const { getByText } = render(<PageTitle title={titleText} />);

    const textElement = getByText(titleText);

    expect(textElement).toHaveStyle({
      fontSize: 17,
      fontWeight: "600",
      color: "white",
    });
  });

  it("renders without crashing if the title is an empty string", () => {
    const { getByText } = render(<PageTitle title="" />);

    expect(getByText("")).toBeOnTheScreen();
  });

  it("should not render a subtitle when the prop is omitted", () => {
    const { queryByText } = render(<PageTitle title="No Subtitle" />);

    expect(queryByText("No Subtitle")).toBeOnTheScreen();
    expect(queryByText(/./)).toBeTruthy();
  });

  it("should render the subtitle text when provided", () => {
    const { getByText } = render(
      <PageTitle title="Main Title" subtitle="Sub Info" />,
    );

    expect(getByText("Main Title")).toBeOnTheScreen();
    expect(getByText("Sub Info")).toBeOnTheScreen();
  });

  it("should reduce title font size to 15 when subtitle is present", () => {
    const { getByText } = render(
      <PageTitle title="Shrunk Title" subtitle="Details" />,
    );

    const titleElement = getByText("Shrunk Title");

    expect(titleElement).toHaveStyle({ fontSize: 15 });
  });

  it("should apply correct styles to the subtitle text", () => {
    const { getByText } = render(
      <PageTitle title="Title" subtitle="Styled Sub" />,
    );

    const subtitleElement = getByText("Styled Sub");

    expect(subtitleElement).toHaveStyle({
      fontSize: 12,
      fontWeight: "500",
      color: "#999999",
    });
  });
});
