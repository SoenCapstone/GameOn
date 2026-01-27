import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Alert } from "react-native";
import CreateLeagueScreen from "@/app/(contexts)/leagues/create-league";

const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack }),
}));

const mockPost: jest.Mock<any, any> = jest.fn(async () => ({
  data: { id: "league-1", slug: "test-league" },
}));

jest.mock("@/hooks/use-axios-clerk", () => ({
  useAxiosWithClerk: () => ({
    post: mockPost,
  }),
  GO_LEAGUE_SERVICE_ROUTES: {
    CREATE: "api/v1/leagues/create",
    ALL: "api/v1/leagues",
  },
}));

jest.mock("@/components/ui/content-area", () => ({
  ContentArea: ({ children }: any) => children,
}));

function renderScreen() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={client}>
      <CreateLeagueScreen />
    </QueryClientProvider>,
  );
}

describe("CreateLeagueScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows validation errors when required fields missing", () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    const { getByText } = renderScreen();

    fireEvent.press(getByText("Create League"));

    expect(alertSpy).toHaveBeenCalledWith(
      "League creation failed",
      "League name is required",
    );
  });

  it("creates league with PRIVATE privacy by default", async () => {
    const { getByPlaceholderText, getByText } = renderScreen();

    fireEvent.changeText(getByPlaceholderText("League Name"), "My League");
    fireEvent.press(getByText("Sport"));
    fireEvent.press(getByText("Soccer"));
    fireEvent.press(getByText("Create League"));

    await waitFor(() => expect(mockPost).toHaveBeenCalled());

    const [, payload] = mockPost.mock.calls[0] as any[];
    expect(payload).toMatchObject({
      name: "My League",
      sport: "soccer",
      privacy: "PRIVATE",
    });
  });

  it("navigates back after successful creation", async () => {
    const { getByPlaceholderText, getByText } = renderScreen();

    fireEvent.changeText(getByPlaceholderText("League Name"), "My League");
    fireEvent.press(getByText("Sport"));
    fireEvent.press(getByText("Soccer"));
    fireEvent.press(getByText("Create League"));

    await waitFor(() => expect(mockBack).toHaveBeenCalled());
  });
});
