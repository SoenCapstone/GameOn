import React from "react";
import { render } from "@testing-library/react-native";
import { LeagueForm } from "@/components/leagues/league-form";
import { Form } from "@/components/form/form";
import { Button } from "@/components/ui/button";

jest.mock("@/components/form/form", () => {
  const ReactMock = jest.requireActual("react");
  const { View } = jest.requireActual("react-native");
  return {
    Form: {
      Section: ({ children }: Record<string, unknown>) =>
        ReactMock.createElement(View, null, children),
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

    let imageProps = (Form.Image as jest.Mock).mock.calls[0][0];
    expect(imageProps.image).toEqual({ uri: "file:///picked.png" });

    rerender(
      <LeagueForm
        values={baseValues}
        logo={{ pickedLogo: null, logoUri: "https://cdn/uploaded.png" }}
        onChange={onChange}
      />,
    );
    imageProps = (Form.Image as jest.Mock).mock.calls[1][0];
    expect(imageProps.image).toEqual({ uri: "https://cdn/uploaded.png" });

    rerender(
      <LeagueForm
        values={baseValues}
        logo={{ pickedLogo: null }}
        onChange={onChange}
      />,
    );
    imageProps = (Form.Image as jest.Mock).mock.calls[2][0];
    expect(imageProps.image).toBe("default-logo");
  });

  it("wires actions and applies menu/input behaviors", () => {
    render(
      <LeagueForm
        values={baseValues}
        logo={{ pickedLogo: null }}
        onChange={onChange}
      />,
    );

    const imageProps = (Form.Image as jest.Mock).mock.calls[0][0];
    imageProps.onPress();
    expect(onChange.onPickLogo).toHaveBeenCalledTimes(1);

    const buttonProps = (Button as jest.Mock).mock.calls[0][0];
    buttonProps.onPress();
    expect(onChange.onRemoveLogo).toHaveBeenCalledTimes(1);

    const inputCalls = (Form.Input as jest.Mock).mock.calls.map(
      ([props]: [Record<string, unknown>]) => props,
    );
    const nameInput = inputCalls.find(
      (x: Record<string, unknown>) => x.label === "Name",
    );
    const regionInput = inputCalls.find(
      (x: Record<string, unknown>) => x.label === "Region",
    );

    if (nameInput && typeof nameInput.onChangeText === "function") {
      (nameInput.onChangeText as (val: string) => void)("Updated League");
      expect(onChange.onLeagueNameChange).toHaveBeenCalledWith(
        "Updated League",
      );
    }
    if (regionInput) {
      expect(regionInput.editable).toBe(false);
      expect(regionInput.value).toBe("North America");
    }

    const menuCalls = (Form.Menu as jest.Mock).mock.calls.map(
      ([props]: [Record<string, unknown>]) => props,
    );
    const sportMenu = menuCalls.find(
      (x: Record<string, unknown>) => x.label === "Sport",
    );
    const levelMenu = menuCalls.find(
      (x: Record<string, unknown>) => x.label === "Level",
    );
    const locationMenu = menuCalls.find(
      (x: Record<string, unknown>) => x.label === "Location",
    );

    if (sportMenu && typeof sportMenu.onValueChange === "function") {
      (sportMenu.onValueChange as (val: string) => void)("None");
      expect(onChange.onSportChange).toHaveBeenCalledWith(null);
      (sportMenu.onValueChange as (val: string) => void)("Soccer");
      expect(onChange.onSportChange).toHaveBeenCalledWith({
        id: "soccer",
        label: "Soccer",
      });
    }
    if (levelMenu && typeof levelMenu.onValueChange === "function") {
      (levelMenu.onValueChange as (val: string) => void)("Optional");
      expect(onChange.onLevelChange).toHaveBeenCalledWith(null);
      (levelMenu.onValueChange as (val: string) => void)("Competitive");
      expect(onChange.onLevelChange).toHaveBeenCalledWith({
        id: "COMPETITIVE",
        label: "Competitive",
      });
    }
    if (locationMenu && typeof locationMenu.onValueChange === "function") {
      (locationMenu.onValueChange as (val: string) => void)("City");
      expect(onChange.onLocationChange).toHaveBeenCalledWith("");
      (locationMenu.onValueChange as (val: string) => void)("Montreal");
      expect(onChange.onLocationChange).toHaveBeenCalledWith("Montreal");
    }
  });
});
