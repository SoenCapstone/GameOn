import React from "react";
import { render } from "@testing-library/react-native";
import { PlayMakerArea } from "@/components/play-maker/play-maker-area";
import { useGetTeamMembers } from "@/hooks/use-get-team-members/use-get-team-members";
import { useRenderPlayMakerShapes } from "@/hooks/use-render-play-maker-shapes";
import { TeamDetailContext } from "@/contexts/team-detail-context";
import { useTeamDetail } from "@/hooks/use-team-detail";

jest.mock("@/hooks/use-get-team-members/use-get-team-members");
jest.mock("@/hooks/use-render-play-maker-shapes");
jest.mock("@/components/play-maker/play-maker-board", () => ({
  PlayMakerBoard: ({ children }: { children?: React.ReactNode }) => (
    <>{children}</>
  ),
}));
jest.mock("@/components/play-maker/shapes-tab", () => ({
  ShapesTab: () => null,
}));
jest.mock("@/components/play-maker/clear-shapes-button", () => ({
  ClearShapesButton: () => null,
}));

let lastPanelProps: Record<string, unknown> | undefined = undefined;
jest.mock("@/components/play-maker/player-assignment-panel", () => ({
  PlayerAssignmentPanel: (props: Record<string, unknown>) => {
    lastPanelProps = props;
    return null;
  },
}));

const mockedUseGetTeamMembers = useGetTeamMembers as jest.MockedFunction<
  typeof useGetTeamMembers
>;
const mockedUseRenderPlayMakerShapes =
  useRenderPlayMakerShapes as jest.MockedFunction<
    typeof useRenderPlayMakerShapes
  >;

const makeProps = () => ({
  styles: {
    container: {},
    boardWrapper: {},
    shapeArea: {},
    panelArea: {},
  },
  boardConfig: undefined,
});

const renderWithTeam = (ui: React.ReactElement, teamId = "team-123") => {
  const teamDetailValue = {
    id: teamId,
    team: {
      id: teamId,
      name: "Test Team",
      sport: null,
      location: null,
      logoUrl: null,
      scope: null,
      privacy: "PUBLIC",
      ownerUserId: null,
    },
    isLoading: false,
    refreshing: false,
    onRefresh: jest.fn(),
    handleFollow: jest.fn(),
    title: "Test Team",
    isOwner: false,
    isMember: false,
    isActiveMember: false,
    role: "PLAYER",
    memStatus: "ACTIVE",
    joinedAt: null,
  };
  return render(
    <TeamDetailContext.Provider
      value={
        teamDetailValue as ReturnType<typeof useTeamDetail> & { id: string }
      }
    >
      {ui}
    </TeamDetailContext.Provider>,
  );
};

describe("PlayMakerArea", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    lastPanelProps = undefined;
    mockedUseRenderPlayMakerShapes.mockReturnValue([]);
  });

  it("shows loading indicator when team members are loading", () => {
    mockedUseGetTeamMembers.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      isError: false,
      isPending: true,
      isLoadingError: false,
      isSuccess: false,
      status: "pending",
      refetch: jest.fn(),
      failureCount: 0,
      isFetched: false,
      isFetchedAfterMount: false,
      isFetching: false,
      isRefetching: false,
      isStale: false,
      dataUpdatedAt: 0,
      errorUpdatedAt: 0,
      fetchStatus: "idle",
      isPlaceholderData: false,
      isPaused: false,
      isRefetchError: false,
      failureReason: null,
      errorUpdateCount: 0,
      isInitialLoading: false,
      isEnabled: true,
      promise: Promise.resolve([]),
    });

    const { getByTestId } = renderWithTeam(<PlayMakerArea {...makeProps()} />);
    expect(getByTestId("team-loading")).toBeTruthy();
    expect(lastPanelProps).toBeUndefined();
  });

  it("renders PlayerAssignmentPanel when not loading and passes props", () => {
    const data = [
      {
        id: "1",
        name: "Alice",
        email: "alice@example.com",
        firstname: "Alice",
        lastname: "Smith",
      },
    ];

    mockedUseGetTeamMembers.mockReturnValue({
      data,
      isLoading: false,
      error: null,
      isError: false,
      isPending: false,
      isLoadingError: false,
      isSuccess: true,
      status: "success",
      refetch: jest.fn(),
      failureCount: 0,
      isFetched: true,
      isFetchedAfterMount: true,
      isFetching: false,
      isRefetching: false,
      isStale: false,
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      fetchStatus: "idle",
      isPlaceholderData: false,
      isPaused: false,
      isRefetchError: false,
      failureReason: null,
      errorUpdateCount: 0,
      isInitialLoading: false,
      isEnabled: true,
      promise: Promise.resolve([]),
    });

    const { queryByTestId } = renderWithTeam(
      <PlayMakerArea {...makeProps()} />,
    );
    expect(queryByTestId("team-loading")).toBeNull();
    expect(lastPanelProps).toBeDefined();
    expect(lastPanelProps?.data).toBe(data);
    expect(lastPanelProps?.selectedShapeId).toBe(null);
    expect(Array.isArray(lastPanelProps?.shapes)).toBe(true);
    expect(typeof lastPanelProps?.setShapes).toBe("function");
  });
});
