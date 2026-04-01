import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Alert } from "react-native";
import CreateLeagueScreen from "@/app/(app)/leagues/create";

const mockBack = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack }),
}));

const mockPost: jest.Mock<
  Promise<{ data: { id: string; slug: string } }>,
  [unknown, { name: string; sport: string; privacy: string }]
> = jest.fn(
  async (
    _arg1: unknown,
    _arg2: { name: string; sport: string; privacy: string },
  ) => ({
    data: { id: "league-1", slug: "test-league" },
  }),
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

jest.mock("@/components/ui/content-area", () => {
  const ReactMock = jest.requireActual("react");
  return {
    ContentArea: ({
      children,
      toolbar,
    }: {
      children?: React.ReactNode;
      toolbar?: React.ReactNode;
    }) => ReactMock.createElement(ReactMock.Fragment, null, toolbar, children),
  };
});

jest.mock("@/components/form/form-toolbar", () => {
  const ReactMock = jest.requireActual("react");
  const { Pressable, Text } = jest.requireActual("react-native");
  return {
    FormToolbar: ({
      label = "Save",
      onSubmit,
    }: {
      label?: string;
      onSubmit: () => void;
    }) =>
      ReactMock.createElement(
        Pressable,
        {
          accessibilityRole: "button",
          testID: "form-toolbar-submit",
          onPress: onSubmit,
        },
        ReactMock.createElement(Text, null, label),
      ),
  };
});

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

function getCreateButton(screen: ReturnType<typeof renderScreen>) {
  return screen.getByTestId("form-toolbar-submit");
}

describe("CreateLeagueScreen", () => {
  const { useLeagueForm } = jest.requireMock("@/hooks/use-league-form");
  beforeEach(() => {
    jest.clearAllMocks();
    (useLeagueForm as jest.Mock).mockImplementation(() =>
      defaultLeagueFormState(),
    );
  });

  afterEach(() => {
    queryClient?.clear();
  });

  it("shows validation errors when required fields missing", () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    const screen = renderScreen();

    fireEvent.press(getCreateButton(screen));

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

    const screen = renderScreen();
    fireEvent.press(getCreateButton(screen));

    await waitFor(() => expect(mockPost).toHaveBeenCalled());

    const [, payload] = mockPost.mock.calls[0] as [
      unknown,
      { name: string; sport: string; privacy: string },
    ];
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

    const screen = renderScreen();
    fireEvent.press(getCreateButton(screen));

    await waitFor(() => expect(mockBack).toHaveBeenCalled());
  });
});
