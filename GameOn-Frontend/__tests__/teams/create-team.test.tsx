import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import CreateTeamScreen from "@/app/(contexts)/teams/create-team";

const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
jest.spyOn(console, "warn").mockImplementation(() => {});
jest.spyOn(console, "error").mockImplementation(() => {});

const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack }),
}));

jest.mock("@/components/ui/content-area", () => {
  const React = require("react");
  return {
    __esModule: true,
    ContentArea: ({ children }: any) =>
      React.createElement(React.Fragment, null, children),
  };
});

jest.mock("@/components/teams/logo-picker", () => {
  const React = require("react");
  return {
    __esModule: true,
    TeamLogoSection: () => React.createElement(React.Fragment, null),
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("CreateTeamScreen", () => {
  it("renders core UI elements", () => {
    const { getByPlaceholderText, getByText } = render(<CreateTeamScreen />);

    expect(getByPlaceholderText("Team Name")).toBeTruthy();
    expect(getByText("Details")).toBeTruthy();
    expect(getByText("Visibility")).toBeTruthy();
    expect(getByText("Create Team")).toBeTruthy();
  });

  it("submits with minimal data and navigates back", () => {
    const { getByPlaceholderText, getByText } = render(<CreateTeamScreen />);

    fireEvent.changeText(getByPlaceholderText("Team Name"), "My New Team");
    fireEvent.press(getByText("Create Team"));

    expect(logSpy).toHaveBeenCalledWith(
      "Create team payload:",
      expect.objectContaining({
        teamName: "My New Team",
        scopeId: "casual",
        isPublic: true,
        logoUri: null,
        sportId: undefined,
        cityId: undefined,
      })
    );


    expect(mockBack).toHaveBeenCalled();
  });
});