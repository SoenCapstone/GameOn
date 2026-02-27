import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Alert } from "react-native";
import CreateLeagueScreen from "@/app/(contexts)/leagues/create";

const mockBack = jest.fn();
const mockSetOptions = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack }),
}));

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ setOptions: mockSetOptions }),
}));

const mockPost: jest.Mock<Promise<{ data: { id: string; slug: string } }>, [unknown, { name: string; sport: string; privacy: string }]> = jest.fn(
  async (_arg1: unknown, _arg2: { name: string; sport: string; privacy: string }) => ({
    data: { id: "league-1", slug: "test-league" },
  })
);

jest.mock("@/hooks/use-axios-clerk", () => ({
  useAxiosWithClerk: () => ({
    post: mockPost,
  }),
  GO_LEAGUE_SERVICE_ROUTES: {
    CREATE: "api/v1/leagues/create",
    LEAGUE_LOGO: (id: string) => `api/v1/leagues/${id}/logo`,
    ALL: "api/v1/leagues",
  },
}));

jest.mock("@/components/ui/content-area", () => ({
  ContentArea: ({ children }: { children?: React.ReactNode }) => children,
}));

const mockSetLeagueName = jest.fn();
const mockSetSelectedSport = jest.fn();
const mockSetSelectedLevel = jest.fn();
const mockSetRegion = jest.fn();
const mockSetLocation = jest.fn();

const defaultLeagueFormState = () => ({
  leagueName: "",
  setLeagueName: mockSetLeagueName,
  selectedSport: null,
  setSelectedSport: mockSetSelectedSport,
  selectedLevel: null,
  setSelectedLevel: mockSetSelectedLevel,
  region: "Canada",
  setRegion: mockSetRegion,
  location: "",
  setLocation: mockSetLocation,
});

jest.mock("@/hooks/use-league-form", () => ({
  useLeagueForm: jest.fn(() => defaultLeagueFormState()),
}));

let queryClient: QueryClient;

function renderScreen() {
  queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
        staleTime: Infinity,
      },
      mutations: {
        retry: false,
        gcTime: Infinity,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <CreateLeagueScreen />
    </QueryClientProvider>,
  );
}

function getCreateButton() {
  const opts =
    mockSetOptions.mock.calls[mockSetOptions.mock.calls.length - 1]?.[0];
  const Header = opts?.headerTitle;
  if (!Header || typeof Header !== "function")
    throw new Error("headerTitle not set");
  const { getByText } = render(<Header />);
  return getByText("Create");
}

describe("CreateLeagueScreen", () => {
  const { useLeagueForm } = jest.requireMock("@/hooks/use-league-form");
  beforeEach(() => {
    jest.clearAllMocks();
    (useLeagueForm as jest.Mock).mockImplementation(() => defaultLeagueFormState());
  });

  afterEach(() => {
    queryClient?.clear();
  });

  it("shows validation errors when required fields missing", () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    renderScreen();

    fireEvent.press(getCreateButton());

    expect(alertSpy).toHaveBeenCalledWith(
      "League creation failed",
      "League name is required",
    );
  });

  it("creates league with PRIVATE privacy by default", async () => {
    const { useLeagueForm } = jest.requireMock("@/hooks/use-league-form");
    (useLeagueForm as jest.Mock).mockReturnValue({
      ...defaultLeagueFormState(),
      leagueName: "My League",
      selectedSport: { id: "soccer", label: "Soccer" },
    });

    renderScreen();
    fireEvent.press(getCreateButton());

    await waitFor(() => expect(mockPost).toHaveBeenCalled());

    const [, payload] = mockPost.mock.calls[0] as [unknown, { name: string; sport: string; privacy: string }];
    expect(payload).toMatchObject({
      name: "My League",
      sport: "soccer",
      privacy: "PRIVATE",
    });
  });

  it("navigates back after successful creation", async () => {
    const { useLeagueForm } = jest.requireMock("@/hooks/use-league-form");
    (useLeagueForm as jest.Mock).mockReturnValue({
      ...defaultLeagueFormState(),
      leagueName: "My League",
      selectedSport: { id: "soccer", label: "Soccer" },
    });

    renderScreen();
    fireEvent.press(getCreateButton());

    await waitFor(() => expect(mockBack).toHaveBeenCalled());
  });
});
