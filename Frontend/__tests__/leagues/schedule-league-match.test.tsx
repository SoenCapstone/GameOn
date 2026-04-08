import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "@/utils/toast";
import ScheduleLeagueMatchScreen from "@/app/(app)/leagues/[id]/matches/schedule";
const mockSetOptions = jest.fn();
const mockReplace = jest.fn();
const mockDismissTo = jest.fn();
const mockPush = jest.fn();
const mockBack = jest.fn();
const mockCreateLeagueMatch = jest.fn();
const mockValidateLeagueMatchSchedule = jest.fn();
const mockApiGet = jest.fn();
let capturedSubmit: (() => void | Promise<void>) | undefined;
let scheduleHeaderRenderCount = 0;

jest.mock("@/utils/toast", () => ({
  toast: Object.assign(jest.fn(), {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
    loading: jest.fn(),
    promise: jest.fn(),
    dismiss: jest.fn(),
    wiggle: jest.fn(),
    custom: jest.fn(),
  }),
}));

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ id: "league-1", tab: "matches" }),
  useNavigation: () => ({ setOptions: mockSetOptions }),
  useRouter: () => ({
    replace: mockReplace,
    dismissTo: mockDismissTo,
    push: mockPush,
    back: mockBack,
  }),
}));

jest.mock("@/components/ui/content-area", () => ({
  ContentArea: ({
    children,
    toolbar,
  }: {
    children: React.ReactNode;
    toolbar?: React.ReactNode;
  }) => (
    <>
      {toolbar}
      {children}
    </>
  ),
}));


jest.mock("@/components/ui/button", () => ({
  Button: ({
    label,
    onPress,
    isInteractive = true,
  }: {
    label: string;
    onPress: () => void;
    isInteractive?: boolean;
  }) => {
    const ReactMock = jest.requireActual("react");
    const { Pressable, Text } = jest.requireActual("react-native");
    return ReactMock.createElement(
      Pressable,
      {
        accessibilityRole: "button",
        testID: `header-button-${label.replaceAll(" ", "-").toLowerCase()}`,
        onPress: isInteractive ? onPress : undefined,
      },
      ReactMock.createElement(Text, null, label),
    );
  },
}));

jest.mock("@/components/form/form-toolbar", () => ({
  FormToolbar: ({
    onSubmit,
  }: {
    onSubmit: () => void | Promise<void>;
  }) => {
    capturedSubmit = onSubmit;
    scheduleHeaderRenderCount += 1;
    return null;
  },
}));

jest.mock("@/components/form/form", () => {
  const ReactMock = jest.requireActual("react");
  const { View, Text, TextInput, Pressable } =
    jest.requireActual("react-native");
  const idPart = (input: string) => input.replaceAll(" ", "-").toLowerCase();

  const Form = ({ children }: { children: React.ReactNode }) =>
    ReactMock.createElement(View, null, children);
  Form.Section = ({ children }: { children: React.ReactNode }) =>
    ReactMock.createElement(View, null, children);
  Form.Input = ({
    label,
    value,
    onChangeText,
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
  }) =>
    ReactMock.createElement(
      View,
      null,
      ReactMock.createElement(Text, null, label),
      ReactMock.createElement(TextInput, { value, onChangeText }),
    );
  Form.Menu = ({
    label,
    options = [],
    value,
    onValueChange,
  }: {
    label: string;
    options?: string[];
    value: string;
    onValueChange: (option: string) => void;
  }) =>
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
  Form.DateTime = ({ label }: { label: string }) =>
    ReactMock.createElement(Text, null, label);
  Form.Link = ({ label, onPress }: { label: string; onPress: () => void }) =>
    ReactMock.createElement(
      Pressable,
      { onPress },
      ReactMock.createElement(Text, null, label),
    );
  Form.Button = ({ label, onPress }: { label: string; onPress: () => void }) =>
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
  useValidateLeagueMatchSchedule: () => ({
    mutateAsync: mockValidateLeagueMatchSchedule,
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
  useLeagueVenues: () => ({
    data: [{ id: "venue-1", name: "Stadium", city: "Montreal" }],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
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

jest.mock("@/utils/logger", () => ({
  createScopedLog: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

async function submitSchedule() {
  if (!capturedSubmit) {
    throw new Error("schedule submit handler not captured");
  }
  await act(async () => {
    await capturedSubmit?.();
  });
}

async function waitForSubmitRefresh(previousCount: number) {
  await waitFor(() => {
    expect(scheduleHeaderRenderCount).toBeGreaterThan(previousCount);
  });
  return scheduleHeaderRenderCount;
}

describe("ScheduleLeagueMatchScreen", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    capturedSubmit = undefined;
    scheduleHeaderRenderCount = 0;

    mockCreateLeagueMatch.mockResolvedValue({ id: "m1" });
    mockValidateLeagueMatchSchedule.mockResolvedValue({ allowed: true });
    mockApiGet.mockImplementation((url: string) => {
      if (url === "/users/ref-1") {
        return Promise.resolve({
          data: { firstname: "Jane", lastname: "Ref" },
        });
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

    let renderCount = scheduleHeaderRenderCount;

    await waitFor(() =>
      expect(getByTestId("menu-home-team-alpha-fc")).toBeTruthy(),
    );
    fireEvent.press(getByTestId("menu-home-team-alpha-fc"));
    renderCount = await waitForSubmitRefresh(renderCount);
    fireEvent.press(getByTestId("menu-away-team-beta-fc"));
    fireEvent.press(getByTestId("menu-venue-stadium"));
    renderCount = await waitForSubmitRefresh(renderCount);

    await waitFor(() =>
      expect(getByTestId("menu-choose-referee-jane-ref")).toBeTruthy(),
    );
    fireEvent.press(getByTestId("menu-choose-referee-jane-ref"));
    await waitForSubmitRefresh(renderCount);
    await submitSchedule();

    await waitFor(() => expect(mockCreateLeagueMatch).toHaveBeenCalledTimes(1));
    expect(mockValidateLeagueMatchSchedule).toHaveBeenCalledTimes(1);
    expect(mockCreateLeagueMatch).toHaveBeenCalledWith(
      expect.objectContaining({
        homeTeamId: "team-1",
        awayTeamId: "team-2",
        venueId: "venue-1",
        refereeUserId: "ref-1",
      }) as unknown,
    );
    const createPayload = mockCreateLeagueMatch.mock.calls[0]?.[0];
    expect(createPayload).toBeDefined();
    expect(
      new Date(createPayload.startTime).getTime() + 15 * 60 * 1000,
    ).toBe(new Date(createPayload.endTime).getTime());
    expect(toast.success).toHaveBeenCalledWith("Match Scheduled");
    expect(mockDismissTo).toHaveBeenCalledWith({
      pathname: "/leagues/league-1",
      params: { tab: "matches" },
    });
  });

  it("blocks submission when backend validation reports a same-day conflict", async () => {
    mockValidateLeagueMatchSchedule.mockResolvedValue({
      allowed: false,
      code: "LEAGUE_TEAM_SAME_DAY_CONFLICT",
      conflictingTeamIds: ["team-2"],
    });

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
    fireEvent.press(getByTestId("menu-venue-stadium"));
    await waitFor(() =>
      expect(getByTestId("menu-choose-referee-jane-ref")).toBeTruthy(),
    );
    fireEvent.press(getByTestId("menu-choose-referee-jane-ref"));
    await submitSchedule();

    expect(mockValidateLeagueMatchSchedule).toHaveBeenCalledTimes(1);
    expect(mockCreateLeagueMatch).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("Match Schedule Failed", {
      description:
        "Beta FC already has a confirmed match on this day. League teams are limited to one match per day.",
    });
  });
});
