import React from "react";
import { render } from "@testing-library/react-native";
import { LeagueForm } from "@/components/leagues/league-form";
import { Form } from "@/components/form/form";
import { Button } from "@/components/ui/button";

jest.mock("@/components/form/form", () => {
  const ReactMock = jest.requireActual("react");
  const { View } = require("react-native");
  return {
    Form: {
      Section: ({ children }: any) => ReactMock.createElement(View, null, children),
      Image: jest.fn(() => null),
      Input: jest.fn(() => null),
      Menu: jest.fn(() => null),
    },
  };
});

jest.mock("@/components/ui/button", () => ({
  Button: jest.fn(() => null),
}));

jest.mock("@/constants/images", () => ({
  images: {
    defaultLogo: "default-logo",
  },
}));

describe("LeagueForm", () => {
  const onChange = {
    onLeagueNameChange: jest.fn(),
    onSportChange: jest.fn(),
    onLevelChange: jest.fn(),
    onLocationChange: jest.fn(),
    onPickLogo: jest.fn(),
    onRemoveLogo: jest.fn(),
  };

  const baseValues = {
    leagueName: "My League",
    selectedSport: null,
    selectedLevel: null,
    region: "North America",
    location: "",
  } as const;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("selects logo source with picked > uploaded > default priority", () => {
    const { rerender } = render(
      <LeagueForm
        values={baseValues}
        logo={{
          pickedLogo: { uri: "file:///picked.png", mimeType: "image/png" },
          logoUri: "https://cdn/uploaded.png",
        }}
        onChange={onChange}
      />,
    );

    let imageProps = ((Form as any).Image as jest.Mock).mock.calls[0][0];
    expect(imageProps.image).toEqual({ uri: "file:///picked.png" });

    rerender(
      <LeagueForm
        values={baseValues}
        logo={{ pickedLogo: null, logoUri: "https://cdn/uploaded.png" }}
        onChange={onChange}
      />,
    );
    imageProps = ((Form as any).Image as jest.Mock).mock.calls[1][0];
    expect(imageProps.image).toEqual({ uri: "https://cdn/uploaded.png" });

    rerender(<LeagueForm values={baseValues} logo={{ pickedLogo: null }} onChange={onChange} />);
    imageProps = ((Form as any).Image as jest.Mock).mock.calls[2][0];
    expect(imageProps.image).toBe("default-logo");
  });

  it("wires actions and applies menu/input behaviors", () => {
    render(<LeagueForm values={baseValues} logo={{ pickedLogo: null }} onChange={onChange} />);

    const imageProps = ((Form as any).Image as jest.Mock).mock.calls[0][0];
    imageProps.onPress();
    expect(onChange.onPickLogo).toHaveBeenCalledTimes(1);

    const buttonProps = (Button as jest.Mock).mock.calls[0][0];
    buttonProps.onPress();
    expect(onChange.onRemoveLogo).toHaveBeenCalledTimes(1);

    const inputCalls = (((Form as any).Input as jest.Mock).mock.calls as any[]).map(
      ([props]) => props,
    );
    const nameInput = inputCalls.find((x) => x.label === "Name");
    const regionInput = inputCalls.find((x) => x.label === "Region");

    nameInput.onChangeText("Updated League");
    expect(onChange.onLeagueNameChange).toHaveBeenCalledWith("Updated League");
    expect(regionInput.editable).toBe(false);
    expect(regionInput.value).toBe("North America");

    const menuCalls = (((Form as any).Menu as jest.Mock).mock.calls as any[]).map(
      ([props]) => props,
    );
    const sportMenu = menuCalls.find((x) => x.label === "Sport");
    const levelMenu = menuCalls.find((x) => x.label === "Level");
    const locationMenu = menuCalls.find((x) => x.label === "Location");

    sportMenu.onValueChange("None");
    expect(onChange.onSportChange).toHaveBeenCalledWith(null);
    sportMenu.onValueChange("Soccer");
    expect(onChange.onSportChange).toHaveBeenCalledWith({
      id: "soccer",
      label: "Soccer",
    });

    levelMenu.onValueChange("Optional");
    expect(onChange.onLevelChange).toHaveBeenCalledWith(null);
    levelMenu.onValueChange("Competitive");
    expect(onChange.onLevelChange).toHaveBeenCalledWith({
      id: "COMPETITIVE",
      label: "Competitive",
    });

    locationMenu.onValueChange("City");
    expect(onChange.onLocationChange).toHaveBeenCalledWith("");
    locationMenu.onValueChange("Montreal");
    expect(onChange.onLocationChange).toHaveBeenCalledWith("Montreal");
  });
});
