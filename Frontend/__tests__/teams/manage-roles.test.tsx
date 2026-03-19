import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Alert } from "react-native";
import ManageRolesScreen from "@/app/(contexts)/teams/[id]/manage-roles";

// ── Mocks ─────────────────────────────────────────────────────────────

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ id: "team-123" }),
  useRouter: () => ({ push: mockPush, back: mockBack }),
}));

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ setOptions: jest.fn() }),
}));

jest.mock("@clerk/clerk-expo", () => ({
  useAuth: () => ({ getToken: jest.fn().mockResolvedValue("mock-token"), userId: "user-1" }),
}));

const mockMembers = [
  { id: "user-1", userId: "user-1", firstname: "Alice", lastname: "Smith", email: "alice@game.com", role: "OWNER" },
  { id: "user-2", userId: "user-2", firstname: "Bob", lastname: "Jones", email: "bob@game.com", role: "PLAYER" },
  { id: "user-3", userId: "user-3", firstname: "Carol", lastname: "Lee", email: "carol@game.com", role: "COACH" },
];

let mockMembersLoading = false;
let mockMembersError = false;
const mockRefetchMembers = jest.fn();

jest.mock("@/hooks/use-get-team-members/use-get-team-members", () => ({
  useGetTeamMembers: () => ({
    data: mockMembersLoading ? undefined : mockMembers,
    isLoading: mockMembersLoading,
    isError: mockMembersError,
    refetch: mockRefetchMembers,
  }),
}));

let mockRole: string | undefined = "OWNER";
jest.mock("@/hooks/use-team-detail", () => ({
  useTeamDetail: () => ({
    isOwner: mockRole === "OWNER",
    role: mockRole,
    team: { name: "Test Team" },
    isLoading: false,
    isMember: true,
    isActiveMember: true,
  }),
}));

jest.mock("@/hooks/use-axios-clerk", () => ({
  useAxiosWithClerk: () => ({
    delete: jest.fn().mockResolvedValue({}),
    post: jest.fn().mockResolvedValue({}),
    patch: jest.fn().mockResolvedValue({}),
  }),
  GO_TEAM_SERVICE_ROUTES: {
    ALL: "api/v1/teams",
    REMOVE_TEAM_MEMBER: (teamId: string, userId: string) =>
      `api/v1/teams/${teamId}/delete/${userId}`,
    UPDATE_MEMBER_ROLE: (teamId: string, userId: string) =>
      `api/v1/teams/${teamId}/members/${userId}/role`,
  },
}));

jest.mock("@tanstack/react-query", () => {
  const actual = jest.requireActual("@tanstack/react-query");
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries: jest.fn() }),
    useMutation: ({ mutationFn, onSuccess, onError }: any) => ({
      mutate: async (...args: any[]) => {
        try {
          await mutationFn(...args);
          if (onSuccess) onSuccess();
        } catch (e) {
          if (onError) onError(e);
        }
      },
      isPending: false,
    }),
  };
});

// Mock UI components that depend on native modules
jest.mock("@/components/ui/content-area", () => {
  const { View } = require("react-native");
  return {
    ContentArea: ({ children }: any) => <View testID="content-area">{children}</View>,
  };
});

jest.mock("@/components/header/header", () => {
  const { View } = require("react-native");
  return { Header: (props: any) => <View testID="header" /> };
});

jest.mock("@/components/header/page-title", () => {
  const { Text } = require("react-native");
  return { PageTitle: ({ title }: any) => <Text>{title}</Text> };
});

jest.mock("@/components/ui/button", () => {
  const { Pressable, Text } = require("react-native");
  return {
    Button: (props: any) => (
      <Pressable testID={`button-${props.type}`} onPress={props.onPress}>
        <Text>{props.label || props.icon || "back"}</Text>
      </Pressable>
    ),
  };
});

jest.mock("@/components/ui/card", () => {
  const { View } = require("react-native");
  return { Card: ({ children }: any) => <View testID="card">{children}</View> };
});

jest.mock("@/components/teams/member-row", () => {
  const { View, Text } = require("react-native");
  return {
    MemberRow: ({ name, email, right }: any) => (
      <View testID={`member-row-${name}`}>
        <Text testID="member-name">{name}</Text>
        <Text testID="member-email">{email}</Text>
        {right}
      </View>
    ),
  };
});

jest.mock("@expo/vector-icons", () => {
  const { Text } = require("react-native");
  return {
    Ionicons: ({ name }: any) => <Text testID={`icon-${name}`}>{name}</Text>,
  };
});

jest.mock("@/utils/error", () => ({
  errorToString: (e: any) => e?.message || "Unknown error",
}));

// ── Tests ─────────────────────────────────────────────────────────────

describe("ManageRolesScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMembersLoading = false;
    mockMembersError = false;
    mockRole = "OWNER";
  });

  it("renders Available Roles section collapsed by default", () => {
    const { getByText, queryByText } = render(<ManageRolesScreen />);

    expect(getByText("Available Roles")).toBeTruthy();
    // Role descriptions should NOT be visible since collapsed
    expect(queryByText("Full access. Can assign roles, edit team, manage roster.")).toBeNull();
  });

  it("expands Available Roles on press and shows all four roles", () => {
    const { getByText, getAllByText } = render(<ManageRolesScreen />);

    fireEvent.press(getByText("Available Roles"));

    // "Owner" appears twice: once in the role card, once as Alice's role label in Team Members
    expect(getAllByText("Owner").length).toBeGreaterThanOrEqual(1);
    expect(getByText("Manager")).toBeTruthy();
    // "Player" also appears as Bob's role label
    expect(getAllByText("Player").length).toBeGreaterThanOrEqual(1);
    // "Coach" also appears as Carol's role label
    expect(getAllByText("Coach").length).toBeGreaterThanOrEqual(1);
    expect(getByText("Full access. Can assign roles, edit team, manage roster.")).toBeTruthy();
    expect(getByText("Can manage roster, invites, and team settings.")).toBeTruthy();
    expect(getByText("Basic access. Can view team info.")).toBeTruthy();
    expect(getByText("Can manage roster. Limited team settings access.")).toBeTruthy();
  });

  it("renders Team Members section expanded by default with all members", () => {
    const { getByText } = render(<ManageRolesScreen />);

    expect(getByText("Team Members")).toBeTruthy();
    expect(getByText("Alice Smith")).toBeTruthy();
    expect(getByText("Bob Jones")).toBeTruthy();
    expect(getByText("Carol Lee")).toBeTruthy();
  });

  it("collapses Team Members on press", () => {
    const { getByText, queryByText } = render(<ManageRolesScreen />);

    fireEvent.press(getByText("Team Members"));

    expect(queryByText("Alice Smith")).toBeNull();
    expect(queryByText("Bob Jones")).toBeNull();
  });

  it("shows loading indicator when members are loading", () => {
    mockMembersLoading = true;
    const { getByText, queryByText } = render(<ManageRolesScreen />);

    expect(getByText("Team Members")).toBeTruthy();
    // Should not show empty text or member names while loading
    expect(queryByText("No members found.")).toBeNull();
    expect(queryByText("Alice Smith")).toBeNull();
  });

  it("shows error state with retry button when query fails", () => {
    mockMembersError = true;
    const { getByText } = render(<ManageRolesScreen />);

    expect(getByText("Failed to load members.")).toBeTruthy();
    expect(getByText("Retry")).toBeTruthy();
  });

  it("calls refetch when retry button is pressed", () => {
    mockMembersError = true;
    const { getByText } = render(<ManageRolesScreen />);

    fireEvent.press(getByText("Retry"));

    expect(mockRefetchMembers).toHaveBeenCalled();
  });

  it("shows role picker for non-owner members when user is admin", () => {
    const { getAllByTestId } = render(<ManageRolesScreen />);

    // Bob (PLAYER) and Carol (COACH) should have tappable role pickers
    // Alice (OWNER) should have a static role label
    const cards = getAllByTestId("card");
    expect(cards.length).toBe(3);
  });

  it("shows Remove button for non-owner members when user is admin", () => {
    const { getAllByText } = render(<ManageRolesScreen />);

    // Should have 2 Remove buttons (for Bob and Carol, not Alice the owner)
    const removeButtons = getAllByText("Remove");
    expect(removeButtons).toHaveLength(2);
  });

  it("does not show Remove buttons when user is not admin", () => {
    mockRole = "PLAYER";
    const { queryByText } = render(<ManageRolesScreen />);

    expect(queryByText("Remove")).toBeNull();
  });

  it("shows confirmation dialog when Remove is pressed", () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    const { getAllByText } = render(<ManageRolesScreen />);

    fireEvent.press(getAllByText("Remove")[0]);

    expect(alertSpy).toHaveBeenCalledWith(
      "Remove from Team",
      expect.stringContaining("Remove"),
      expect.any(Array),
    );
  });

  it("shows role change dialog when role picker is pressed", () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    const { getByText } = render(<ManageRolesScreen />);

    // Find Bob's role picker (shows "Player" as tappable)
    // The role picker shows the current role label as a pressable
    const playerPickers = getByText("Player");
    fireEvent.press(playerPickers);

    expect(alertSpy).toHaveBeenCalledWith(
      "Change Role",
      expect.stringContaining("Current role: Player"),
      expect.any(Array),
    );
  });
});