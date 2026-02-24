import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ScheduleLeagueMatchScreen from "@/app/(contexts)/leagues/[id]/matches/schedule";

const mockSetOptions = jest.fn();
const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockCreateLeagueMatch = jest.fn();
const mockApiGet = jest.fn();
const mockToast = jest.fn();

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ id: "league-1" }),
  useNavigation: () => ({ setOptions: mockSetOptions }),
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
}));

jest.mock("@/components/ui/content-area", () => ({
  ContentArea: ({ children }: any) => children,
}));

jest.mock("@/components/header/header", () => ({
  Header: ({ right }: any) => {
    const ReactMock = require("react");
    return ReactMock.createElement(ReactMock.Fragment, null, right);
  },
}));

jest.mock("@/components/header/page-title", () => ({
  PageTitle: () => null,
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ label, onPress, isInteractive = true }: any) => {
    const ReactMock = require("react");
    const { Pressable, Text } = require("react-native");
    return ReactMock.createElement(
      Pressable,
      { accessibilityRole: "button", onPress: isInteractive ? onPress : undefined },
      ReactMock.createElement(Text, null, label),
    );
  },
}));

jest.mock("@/components/form/form", () => {
  const ReactMock = require("react");
  const { View, Text, TextInput, Pressable } = require("react-native");
  const idPart = (input: string) => input.replaceAll(" ", "-").toLowerCase();

  const Form = ({ children }: any) => ReactMock.createElement(View, null, children);
  Form.Section = ({ children }: any) => ReactMock.createElement(View, null, children);
  Form.Input = ({ label, value, onChangeText }: any) =>
    ReactMock.createElement(
      View,
      null,
      ReactMock.createElement(Text, null, label),
      ReactMock.createElement(TextInput, { value, onChangeText }),
    );
  Form.Menu = ({ label, options = [], value, onValueChange }: any) =>
    ReactMock.createElement(
      View,
      null,
      ReactMock.createElement(Text, null, label),
      ReactMock.createElement(Text, null, value),
      ...options.map((option: string) =>
        ReactMock.createElement(
          Pressable,
          {
            key: `${label}-${option}`,
            testID: `menu-${idPart(label)}-${idPart(option)}`,
            onPress: () => onValueChange(option),
          },
          ReactMock.createElement(Text, null, option),
        ),
      ),
    );
  Form.DateTime = ({ label }: any) => ReactMock.createElement(Text, null, label);
  Form.Link = ({ label, onPress }: any) =>
    ReactMock.createElement(
      Pressable,
      { onPress },
      ReactMock.createElement(Text, null, label),
    );
  const MockSwitch = () => null;
  MockSwitch.displayName = "MockSwitch";
  Form.Switch = MockSwitch;

  return { Form };
});

jest.mock("@/hooks/use-matches", () => ({
  useCreateLeagueMatch: () => ({
    mutateAsync: mockCreateLeagueMatch,
    isPending: false,
  }),
  useLeagueTeams: () => ({
    data: [{ teamId: "team-1" }, { teamId: "team-2" }],
  }),
  useTeamsByIds: () => ({
    data: {
      "team-1": { id: "team-1", name: "Alpha FC" },
      "team-2": { id: "team-2", name: "Beta FC" },
    },
    isLoading: false,
    error: null,
  }),
  useReferees: () => ({
    data: [{ userId: "ref-1" }],
    isLoading: false,
    error: null,
  }),
}));

jest.mock("@/hooks/use-axios-clerk", () => ({
  useAxiosWithClerk: () => ({
    get: mockApiGet,
  }),
  GO_USER_SERVICE_ROUTES: {
    BY_ID: (id: string) => `/users/${id}`,
  },
}));

jest.mock("@clerk/clerk-expo", () => ({
  useAuth: () => ({
    userId: "user-1",
  }),
}));

jest.mock("@/components/sign-up/utils", () => ({
  toast: (message: string) => mockToast(message),
}));

jest.mock("@/utils/logger", () => ({
  createScopedLog: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

function getScheduleButton() {
  const latestOptions = mockSetOptions.mock.calls[mockSetOptions.mock.calls.length - 1]?.[0];
  const HeaderTitle = latestOptions?.headerTitle;
  if (!HeaderTitle || typeof HeaderTitle !== "function") {
    throw new Error("headerTitle not set");
  }
  const { getByText } = render(<HeaderTitle />);
  return getByText("Schedule");
}

describe("ScheduleLeagueMatchScreen", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateLeagueMatch.mockResolvedValue({ id: "m1" });
    mockApiGet.mockImplementation((url: string) => {
      if (url === "/users/ref-1") {
        return Promise.resolve({ data: { firstname: "Jane", lastname: "Ref" } });
      }
      return Promise.resolve({ data: {} });
    });
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: Infinity, staleTime: Infinity },
        mutations: { retry: false, gcTime: Infinity },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it("creates a league match with home/away teams and referee", async () => {
    const { getByTestId } = render(
      <QueryClientProvider client={queryClient}>
        <ScheduleLeagueMatchScreen />
      </QueryClientProvider>,
    );

    await waitFor(() =>
      expect(getByTestId("menu-home-team-alpha-fc")).toBeTruthy(),
    );
    fireEvent.press(getByTestId("menu-home-team-alpha-fc"));
    fireEvent.press(getByTestId("menu-away-team-beta-fc"));

    await waitFor(() =>
      expect(getByTestId("menu-choose-referee-jane-ref")).toBeTruthy(),
    );
    fireEvent.press(getByTestId("menu-choose-referee-jane-ref"));
    fireEvent.press(getScheduleButton());

    await waitFor(() => expect(mockCreateLeagueMatch).toHaveBeenCalledTimes(1));
    expect(mockCreateLeagueMatch).toHaveBeenCalledWith(
      expect.objectContaining({
        homeTeamId: "team-1",
        awayTeamId: "team-2",
        refereeUserId: "ref-1",
      }),
    );
    expect(mockToast).toHaveBeenCalledWith("Match scheduled");
    expect(mockReplace).toHaveBeenCalledWith("/leagues/league-1");
  });
});
