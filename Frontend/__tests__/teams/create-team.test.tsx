import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Alert } from "react-native";
import CreateTeamScreen from "@/app/(contexts)/teams/create-team";

const mockBack = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack }),
}));

const mockPost: jest.Mock<any, any> = jest.fn(async () => ({
  data: { id: "team-1", slug: "test-team" },
}));

jest.mock("@/hooks/use-axios-clerk", () => ({
  useAxiosWithClerk: () => ({
    post: mockPost,
  }),
  GO_TEAM_SERVICE_ROUTES: {
    CREATE: "api/v1/teams/create",
    ALL: "api/v1/teams",
  },
}));

jest.mock("@/components/ui/content-area", () => ({
  ContentArea: ({ children }: any) => children,
}));

jest.mock("@/components/teams/logo-picker", () => ({
  TeamLogoSection: () => null,
}));

jest.mock("@/components/payments/public-payment-modal", () => () => null);

function renderScreen() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={client}>
      <CreateTeamScreen />
    </QueryClientProvider>,
  );
}

describe("CreateTeamScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows validation errors when required fields missing", () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    const { getByText } = renderScreen();

    fireEvent.press(getByText("Create Team"));

    expect(alertSpy).toHaveBeenCalledWith(
      "Team creation failed",
      "Team name is required",
    );
  });

  it("creates team with PUBLIC privacy when toggle is on", async () => {
    const { getByPlaceholderText, getByText } = renderScreen();

    fireEvent.changeText(getByPlaceholderText("Team Name"), "My Team");
    fireEvent.press(getByText("Sports"));
    fireEvent.press(getByText("Soccer"));
    fireEvent.press(getByText("Location"));
    fireEvent.press(getByText("Toronto"));

    fireEvent.press(getByText("Create Team"));

    await waitFor(() => expect(mockPost).toHaveBeenCalled());

    const [, payload] = mockPost.mock.calls[0];
    expect(payload).toMatchObject({
      name: "My Team",
      sport: "soccer",
      location: "Toronto",
      privacy: "PUBLIC",
    });
  });

  it("creates team with PRIVATE privacy when toggle off", async () => {
    const { getByPlaceholderText, getByText, getByRole } = renderScreen();

    fireEvent.changeText(getByPlaceholderText("Team Name"), "Hidden Team");
    fireEvent.press(getByText("Sports"));
    fireEvent.press(getByText("Soccer"));
    fireEvent.press(getByText("Location"));
    fireEvent.press(getByText("Toronto"));

    fireEvent(getByRole("switch"), "valueChange", false);

    fireEvent.press(getByText("Create Team"));

    await waitFor(() => expect(mockPost).toHaveBeenCalled());

    const [, payload] = mockPost.mock.calls[0];
    expect(payload.privacy).toBe("PRIVATE");
  });

  it("navigates back after successful creation", async () => {
    const { getByPlaceholderText, getByText } = renderScreen();

    fireEvent.changeText(getByPlaceholderText("Team Name"), "Nav Team");
    fireEvent.press(getByText("Sports"));
    fireEvent.press(getByText("Soccer"));
    fireEvent.press(getByText("Location"));
    fireEvent.press(getByText("Toronto"));
    fireEvent.press(getByText("Create Team"));

    await waitFor(() => expect(mockBack).toHaveBeenCalled());
  });
});
