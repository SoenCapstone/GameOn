import React from "react";
import { render } from "@testing-library/react-native";
import { TeamForm } from "@/components/teams/team-form";
import { Form } from "@/components/form/form";
import { Button } from "@/components/ui/button";

jest.mock("@/components/form/form", () => {
  const ReactMock = jest.requireActual("react");
  const { View } = jest.requireActual("react-native");
  return {
    Form: {
      Section: ({ children }: { children?: React.ReactNode }) => ReactMock.createElement(View, null, children),
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

describe("TeamForm", () => {
  const onChange = {
    onTeamNameChange: jest.fn(),
    onSportChange: jest.fn(),
    onScopeChange: jest.fn(),
    onCityChange: jest.fn(),
    onPickLogo: jest.fn(),
    onRemoveLogo: jest.fn(),
  };

  const baseValues = {
    teamName: "My Team",
    selectedSport: null,
    selectedScope: { id: "casual", label: "Casual" },
    selectedCity: null,
  } as const;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("prefers picked logo over uploaded logo and default", () => {
    render(
      <TeamForm
        values={baseValues}
        logo={{
          pickedLogo: { uri: "file:///picked.png", mimeType: "image/png" },
          logoUri: "https://cdn/uploaded.png",
        }}
        onChange={onChange}
      />,
    );

    const imageProps = (Form.Image as jest.Mock).mock.calls[0][0];
    expect(imageProps.image).toEqual({ uri: "file:///picked.png" });
  });

  it("uses uploaded logo when picked logo is missing, else falls back to default", () => {
    const { rerender } = render(
      <TeamForm
        values={baseValues}
        logo={{ pickedLogo: null, logoUri: "https://cdn/uploaded.png" }}
        onChange={onChange}
      />,
    );

    let imageProps = (Form.Image as jest.Mock).mock.calls[0][0];
    expect(imageProps.image).toEqual({ uri: "https://cdn/uploaded.png" });

    rerender(<TeamForm values={baseValues} logo={{ pickedLogo: null }} onChange={onChange} />);
    imageProps = (Form.Image as jest.Mock).mock.calls[1][0];
    expect(imageProps.image).toBe("default-logo");
  });

  it("wires image/button actions and handles menu selection rules", () => {
    render(<TeamForm values={baseValues} logo={{ pickedLogo: null }} onChange={onChange} />);

    const imageProps = (Form.Image as jest.Mock).mock.calls[0][0];
    imageProps.onPress();
    expect(onChange.onPickLogo).toHaveBeenCalledTimes(1);

    const buttonProps = (Button as jest.Mock).mock.calls[0][0];
    buttonProps.onPress();
    expect(onChange.onRemoveLogo).toHaveBeenCalledTimes(1);

    const inputProps = (Form.Input as jest.Mock).mock.calls[0][0];
    inputProps.onChangeText("Updated Team");
    expect(onChange.onTeamNameChange).toHaveBeenCalledWith("Updated Team");

    const menuCalls = ((Form.Menu as jest.Mock).mock.calls as [Record<string, unknown>][]).map(
      ([props]) => props,
    );
    const sportMenu = menuCalls.find((x) => x.label === "Sport");
    const scopeMenu = menuCalls.find((x) => x.label === "Scope");
    const cityMenu = menuCalls.find((x) => x.label === "Location");

    if (sportMenu && typeof sportMenu.onValueChange === "function") {
      (sportMenu.onValueChange as (value: string) => void)("None");
      expect(onChange.onSportChange).toHaveBeenCalledWith(null);
      (sportMenu.onValueChange as (value: string) => void)("Soccer");
      expect(onChange.onSportChange).toHaveBeenCalledWith({
        id: "soccer",
        label: "Soccer",
      });
    }

    if (scopeMenu && typeof scopeMenu.onValueChange === "function") {
      (scopeMenu.onValueChange as (value: string) => void)("Managed");
      expect(onChange.onScopeChange).toHaveBeenCalledWith({
        id: "managed",
        label: "Managed",
      });
    }

    if (cityMenu && typeof cityMenu.onValueChange === "function") {
      cityMenu.onValueChange("Select location");
      expect(onChange.onCityChange).toHaveBeenCalledWith(null);
      cityMenu.onValueChange("Toronto");
      expect(onChange.onCityChange).toHaveBeenCalledWith({
        id: "tor",
        label: "Toronto",
      });
    }
  });
});
