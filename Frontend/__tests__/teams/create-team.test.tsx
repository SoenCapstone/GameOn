import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Alert } from "react-native";
import CreateTeamScreen from "@/app/(contexts)/teams/create";

const mockBack = jest.fn();
const mockSetOptions = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack }),
}));

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ setOptions: mockSetOptions }),
}));

const mockPost: jest.Mock<
  Promise<{ data: { id: string; slug: string } }>,
  [unknown, { name: string; sport: string; location: string; privacy: string }]
> = jest.fn(
  async (
    _arg1: unknown,
    _arg2: { name: string; sport: string; location: string; privacy: string },
  ) => ({
    data: { id: "team-1", slug: "test-team" },
  }),
);

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
  ContentArea: ({ children }: { children?: React.ReactNode }) => children,
}));

jest.mock("@/hooks/use-team-form", () => {
  const actual = jest.requireActual("@/hooks/use-team-form");
  const { SPORTS, CITIES } = jest.requireActual("@/constants/form-constants");
  return {
    ...actual,
    useTeamForm: (props?: Parameters<typeof actual.useTeamForm>[0]) => {
      const result = actual.useTeamForm(props);
      return {
        ...result,
        // Pre-fill sport and city so tests don't need to open native pickers
        selectedSport: result.selectedSport ?? SPORTS[0],
        selectedCity: result.selectedCity ?? CITIES[1],
        // allowedRegions is now required by backend contract
        selectedAllowedRegions:
          result.selectedAllowedRegions.length > 0
            ? result.selectedAllowedRegions
            : [CITIES[1].label],
      };
    },
  };
});

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
      <CreateTeamScreen />
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

describe("CreateTeamScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient?.clear();
  });

  it("shows validation errors when required fields missing", () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    renderScreen();

    fireEvent.press(getCreateButton());

    expect(alertSpy).toHaveBeenCalledWith(
      "Team creation failed",
      "Team name is required",
    );
  });

  it("creates team with PRIVATE privacy by default", async () => {
    const { getByPlaceholderText } = renderScreen();

    fireEvent.changeText(getByPlaceholderText("Enter team name"), "My Team");
    fireEvent.press(getCreateButton());

    await waitFor(() => expect(mockPost).toHaveBeenCalled());

    const [, payload] = mockPost.mock.calls[0] as [
      unknown,
      { name: string; sport: string; location: string; privacy: string },
    ];
    expect(payload).toMatchObject({
      name: "My Team",
      sport: "soccer",
      location: "Toronto",
      allowedRegions: ["Toronto"],
      privacy: "PRIVATE",
    });
  });

  it("navigates back after successful creation", async () => {
    const { getByPlaceholderText } = renderScreen();

    fireEvent.changeText(getByPlaceholderText("Enter team name"), "Nav Team");
    fireEvent.press(getCreateButton());

    await waitFor(() => expect(mockBack).toHaveBeenCalled());
  });
});
