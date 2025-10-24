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
});
