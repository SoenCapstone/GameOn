import React from "react";
import { render } from "@testing-library/react-native";
import { IconContainer } from "@/components/play-maker/play-maker-icon/icon-container";
import { SvgXml } from "react-native-svg";

jest.mock("react-native-svg", () => {
  return {
    SvgXml: jest.fn(() => null),
  };
});

const mockedSvgXml = SvgXml as unknown as jest.Mock;

describe("IconContainer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders SvgXml with xml and default size", () => {
    const xml = "<svg></svg>";

    render(<IconContainer xml={xml} />);

    expect(mockedSvgXml).toHaveBeenCalledTimes(1);

    const props = mockedSvgXml.mock.calls[0][0];
    expect(props.xml).toBe(xml);
    expect(props.width).toBe(32);
    expect(props.height).toBe(32);
  });

  it("renders SvgXml with custom size", () => {
    const xml = "<svg></svg>";

    render(<IconContainer xml={xml} size={48} />);

    expect(mockedSvgXml).toHaveBeenCalledTimes(1);

    const props = mockedSvgXml.mock.calls[0][0];
    expect(props.xml).toBe(xml);
    expect(props.width).toBe(48);
    expect(props.height).toBe(48);
  });
});
