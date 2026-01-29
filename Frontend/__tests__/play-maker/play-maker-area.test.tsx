import React from "react";
import { render } from "@testing-library/react-native";
import { PlayMakerArea } from "../../components/play-maker/play-maker-area";
import { useGetTeamMembers } from "@/hooks/use-get-team-members/use-get-team-members";
import { useRenderPlayMakerShapes } from "@/hooks/use-render-play-maker-shapes";
import { TeamDetailContext } from "@/contexts/team-detail-context";

jest.mock("@/hooks/use-get-team-members/use-get-team-members", () => ({
  useGetTeamMembers: jest.fn(),
}));

jest.mock("@/hooks/use-render-play-maker-shapes", () => ({
  useRenderPlayMakerShapes: jest.fn(),
}));

jest.mock("@/components/play-maker/play-maker-board", () => ({
  PlayMakerBoard: ({ children }: any) => <>{children}</>,
}));

jest.mock("@/components/play-maker/shapes-tab", () => ({
  ShapesTab: () => null,
}));

jest.mock("@/components/play-maker/clear-shapes-button", () => ({
  ClearShapesButton: () => null,
}));

let lastPanelProps: any = undefined;

jest.mock("@/components/play-maker/player-assignment-panel", () => ({
  PlayerAssignmentPanel: (props: any) => {
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

const makeProps = () =>
  ({
    styles: {
      container: {},
      boardWrapper: {},
      shapeArea: {},
      panelArea: {},
    },
    boardConfig: {} as any,
  }) as any;

const renderWithTeam = (ui: React.ReactElement, teamId = "team-123") => {
  return render(
    <TeamDetailContext.Provider value={{ id: teamId } as any}>
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
    } as any);

    const { getByTestId } = renderWithTeam(<PlayMakerArea {...makeProps()} />);

    expect(getByTestId("team-loading")).toBeTruthy();
    expect(lastPanelProps).toBeUndefined();
  });

  it("renders PlayerAssignmentPanel when not loading and passes props", () => {
    const data = [{ id: "1", name: "Alice" }];

    mockedUseGetTeamMembers.mockReturnValue({
      data,
      isLoading: false,
    } as any);

    const { queryByTestId } = renderWithTeam(
      <PlayMakerArea {...makeProps()} />,
    );

    expect(queryByTestId("team-loading")).toBeNull();
    expect(lastPanelProps).toBeDefined();
    expect(lastPanelProps.data).toBe(data);
    expect(lastPanelProps.selectedShapeId).toBe(null);
    expect(Array.isArray(lastPanelProps.shapes)).toBe(true);
    expect(typeof lastPanelProps.setShapes).toBe("function");
  });
});
