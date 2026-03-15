import { render, fireEvent } from "@testing-library/react-native";
import { PlayerAssignmentPanel } from "@/components/play-maker/player-assignment-panel";
import { assignPlayerToShape } from "@/components/play-maker/utils";
import { Shape } from "@/components/play-maker/model";

jest.mock("@/components/ui/card", () => ({
  Card: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

jest.mock("@/components/play-maker/utils", () => ({
  assignPlayerToShape: jest.fn(),
}));

const mockedAssignPlayerToShape = assignPlayerToShape as jest.MockedFunction<
  typeof assignPlayerToShape
>;

describe("PlayerAssignmentPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders member names", () => {
    const data = [
      {
        id: "m1",
        firstname: "Alice",
        lastname: "Smith",
        email: "alice@example.com",
      },
      {
        id: "m2",
        firstname: "Bob",
        lastname: "Jones",
        email: "bob@example.com",
      },
    ];

    const shapes: Shape[] = [];
    const setShapes = jest.fn();

    const { getByText } = render(
      <PlayerAssignmentPanel
        data={data}
        selectedShapeId={"shape-1"}
        shapes={shapes}
        setShapes={setShapes}
      />,
    );

    expect(getByText("Alice Smith")).toBeTruthy();
    expect(getByText("Bob Jones")).toBeTruthy();
  });

  it("calls assignPlayerToShape with correct args when Assign is pressed", () => {
    const data = [
      {
        id: "m1",
        firstname: "Alice",
        lastname: "Smith",
        email: "alice@example.com",
      },
    ];

    const shapes: Shape[] = [
      {
        id: "shape-1",
        type: "person",
        x: 0,
        y: 0,
        size: 1,
      },
    ];
    const setShapes = jest.fn();
    const selectedShapeId = "shape-1";

    const { getByLabelText } = render(
      <PlayerAssignmentPanel
        data={data}
        selectedShapeId={selectedShapeId}
        shapes={shapes}
        setShapes={setShapes}
      />,
    );

    const button = getByLabelText("Assign Alice Smith to player icon");
    fireEvent.press(button);

    expect(mockedAssignPlayerToShape).toHaveBeenCalledTimes(1);
    expect(mockedAssignPlayerToShape).toHaveBeenCalledWith(
      "m1",
      selectedShapeId,
      shapes,
      setShapes,
    );
  });
});
