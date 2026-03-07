import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ScheduleTeamMatchScreen from "@/app/(contexts)/teams/[id]/matches/schedule";

const mockSetOptions = jest.fn();
const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockBack = jest.fn();
const mockCreateTeamMatch = jest.fn();
const mockApiGet = jest.fn();
const mockToast = jest.fn();
const mockAlert = jest.fn();
let capturedSubmit: (() => void | Promise<void>) | undefined;

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ id: "team-1" }),
  useNavigation: () => ({ setOptions: mockSetOptions }),
  useRouter: () => ({ replace: mockReplace, push: mockPush, back: mockBack }),
}));

jest.mock("@/components/ui/content-area", () => ({
  ContentArea: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("@/components/header/header", () => ({
  Header: ({ right }: { right: React.ReactNode }) => {
    const ReactMock = jest.requireActual("react");
    return ReactMock.createElement(ReactMock.Fragment, null, right);
  },
}));

jest.mock("@/components/header/page-title", () => ({
  PageTitle: () => null,
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
  Form.Switch = ({
    label,
    value,
    onValueChange,
  }: {
    label: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) =>
    ReactMock.createElement(
      Pressable,
      {
        testID: `switch-${idPart(label)}`,
        onPress: () => onValueChange(!value),
      },
      ReactMock.createElement(Text, null, label),
    );

  return { Form };
});

jest.mock("@/hooks/use-team-detail", () => ({
  useTeamDetail: () => ({
    team: { id: "team-1", name: "My Team", sport: "soccer" },
  }),
}));

jest.mock("@/hooks/use-matches", () => ({
  useCreateTeamMatch: () => ({
    mutateAsync: mockCreateTeamMatch,
    isPending: false,
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
  GO_TEAM_SERVICE_ROUTES: {
    ALL: "/teams",
  },
  GO_USER_SERVICE_ROUTES: {
    BY_ID: (id: string) => `/users/${id}`,
  },
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

jest.mock("@/hooks/use-schedule-header", () => ({
  useScheduleHeader: ({ onSubmit }: { onSubmit: () => void | Promise<void> }) => {
    capturedSubmit = onSubmit;
  },
}));

async function submitSchedule() {
  if (!capturedSubmit) {
    throw new Error("schedule submit handler not captured");
  }
  await act(async () => {
    await capturedSubmit?.();
  });
}

describe("ScheduleTeamMatchScreen", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    capturedSubmit = undefined;
    
    const { Alert } = jest.requireActual("react-native");
    jest.spyOn(Alert, "alert").mockImplementation(mockAlert);
    
    mockCreateTeamMatch.mockResolvedValue({
      match: { id: "m1" },
      refereeInviteSent: true,
    });
    mockApiGet.mockImplementation((url: string) => {
      if (url === "/teams") {
        return Promise.resolve({
          data: {
            items: [
              { id: "team-1", name: "My Team", sport: "soccer" },
              { id: "team-2", name: "Rivals", sport: "soccer" },
            ],
          },
        });
      }
      if (url === "/users/ref-1") {
        return Promise.resolve({
          data: { firstname: "John", lastname: "Ref" },
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

  it("creates a team match invite without referee by default", async () => {
    const { getByTestId } = render(
      <QueryClientProvider client={queryClient}>
        <ScheduleTeamMatchScreen />
      </QueryClientProvider>,
    );

    await waitFor(() =>
      expect(getByTestId("menu-away-team-rivals")).toBeTruthy(),
    );
    fireEvent.press(getByTestId("menu-away-team-rivals"));
    await submitSchedule();

    await waitFor(() => expect(mockCreateTeamMatch).toHaveBeenCalledTimes(1));

    expect(mockCreateTeamMatch).toHaveBeenCalledWith(
      expect.objectContaining({
        homeTeamId: "team-1",
        awayTeamId: "team-2",
        requiresReferee: false,
      }) as unknown,
    );
    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockToast).toHaveBeenCalledWith("Match scheduled");
  });

  it("creates an official team match and includes selected referee", async () => {
    const { getByTestId } = render(
      <QueryClientProvider client={queryClient}>
        <ScheduleTeamMatchScreen />
      </QueryClientProvider>,
    );

    await waitFor(() =>
      expect(getByTestId("menu-away-team-rivals")).toBeTruthy(),
    );
    fireEvent.press(getByTestId("menu-away-team-rivals"));
    fireEvent.press(getByTestId("switch-official-match"));

    await waitFor(() =>
      expect(getByTestId("menu-choose-referee-john-ref")).toBeTruthy(),
    );
    fireEvent.press(getByTestId("menu-choose-referee-john-ref"));
    await submitSchedule();

    await waitFor(() => expect(mockCreateTeamMatch).toHaveBeenCalledTimes(1));

    expect(mockCreateTeamMatch).toHaveBeenCalledWith(
      expect.objectContaining({
        homeTeamId: "team-1",
        awayTeamId: "team-2",
        requiresReferee: true,
        refereeUserId: "ref-1",
      }) as unknown,
    );
  });
});
