import React from "react";
import {
  render,
  fireEvent,
  act,
  waitFor,
  cleanup,
} from "@testing-library/react-native";
import CreateTeamScreen from "@/app/(contexts)/teams/create-team";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Alert } from "react-native";

jest.spyOn(console, "warn").mockImplementation(() => {});
jest.spyOn(console, "error").mockImplementation(() => {});

const mockBack = jest.fn();
const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, replace: mockReplace }),
}));

let mockPost: jest.Mock;
jest.mock("@/hooks/use-axios-clerk", () => {
  const original = jest.requireActual("@/hooks/use-axios-clerk");
  return {
    __esModule: true,
    ...original,
    useAxiosWithClerk: jest.fn(() => ({
      get post() {
        if (!mockPost) {
          mockPost = jest.fn(async () => ({
            data: { id: "abc", slug: "my-new-team" },
          }));
        }
        return mockPost;
      },
      defaults: { headers: { common: {} } },
    })),
  };
});

jest.mock("@/components/ui/content-area", () => {
  return {
    __esModule: true,
    ContentArea: ({ children }: any) => children,
  };
});

jest.mock("@/components/teams/logo-picker", () => {
  return {
    __esModule: true,
    TeamLogoSection: () => null,
  };
});

beforeEach(() => {
  jest.clearAllMocks();
  mockPost = jest.fn(async () => ({
    data: { id: "abc", slug: "my-new-team" },
  }));
});

function createDelayedResponse() {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ data: { id: "abc", slug: "my-new-team" } }), 50);
  });
}

describe("CreateTeamScreen", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false, gcTime: 0 },
      },
    });
  });

  afterEach(async () => {
    cleanup();
    queryClient.clear();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  function renderWithClient(ui: React.ReactElement) {
    return render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
    );
  }

  it("renders core UI elements", () => {
    const { getByPlaceholderText, getByText } = renderWithClient(
      <CreateTeamScreen />,
    );

    expect(getByPlaceholderText("Team Name")).toBeTruthy();
    expect(getByText("Details")).toBeTruthy();
    expect(getByText("Visibility")).toBeTruthy();
    expect(getByText("Create Team")).toBeTruthy();
  });

  it("shows validation warnings when required fields are missing", () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    const { getByPlaceholderText, getByText } = renderWithClient(
      <CreateTeamScreen />,
    );

    fireEvent.changeText(getByPlaceholderText("Team Name"), "My New Team");
    fireEvent.press(getByText("Create Team"));

    expect(alertSpy).toHaveBeenCalledWith(
      "Team creation failed",
      "Sport is required",
    );
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockBack).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  it("allows clearing the team name", () => {
    const { getByPlaceholderText, getByText, queryByDisplayValue } =
      renderWithClient(<CreateTeamScreen />);
    const input = getByPlaceholderText("Team Name");
    fireEvent.changeText(input, "Temp Name");
    expect(queryByDisplayValue("Temp Name")).toBeTruthy();
    fireEvent.press(getByText("✕"));
    expect(queryByDisplayValue("Temp Name")).toBeFalsy();
  });

  it("selects sport and city then submits and navigates", async () => {
    const { getByText, getByPlaceholderText, findByText } = renderWithClient(
      <CreateTeamScreen />,
    );
    fireEvent.changeText(getByPlaceholderText("Team Name"), "My New Team");

    fireEvent.press(getByText("Sports"));
    expect(await findByText("Select Sport")).toBeTruthy();
    fireEvent.press(getByText("Soccer"));

    fireEvent.press(getByText("Location"));
    expect(await findByText("Select City")).toBeTruthy();
    fireEvent.press(getByText("Toronto"));

    act(() => {
      fireEvent.press(getByText("Create Team"));
    });

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalled();
    });
    expect(mockPost).toHaveBeenCalledTimes(1);
    const [url, body] = mockPost.mock.calls[0];
    expect(url).toContain("api/v1/teams/create");
    expect(body).toMatchObject({
      name: "My New Team",
      privacy: "PUBLIC",
      sport: "soccer",
    });

    expect(mockReplace).toHaveBeenCalledWith("/teams/abc");
  });

  it("respects privacy toggle (PRIVATE)", async () => {
    const { getByText, getByPlaceholderText, getByRole } = renderWithClient(
      <CreateTeamScreen />,
    );
    fireEvent.changeText(getByPlaceholderText("Team Name"), "Hidden Team");
    fireEvent.press(getByText("Sports"));
    fireEvent.press(getByText("Soccer"));
    fireEvent.press(getByText("Location"));
    fireEvent.press(getByText("Toronto"));
    const switchToggle = getByRole("switch");
    fireEvent(switchToggle, "valueChange", false);
    act(() => {
      fireEvent.press(getByText("Create Team"));
    });

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalled();
    });
    const [, body] = mockPost.mock.calls[0];
    expect(body.privacy).toBe("PRIVATE");
  });

  it("shows 'Creating...' while request is in-flight", async () => {
    mockPost.mockImplementationOnce(() => createDelayedResponse());

    const { getByText, getByPlaceholderText } = renderWithClient(
      <CreateTeamScreen />,
    );
    fireEvent.changeText(getByPlaceholderText("Team Name"), "Async Team");
    fireEvent.press(getByText("Sports"));
    fireEvent.press(getByText("Soccer"));
    fireEvent.press(getByText("Location"));
    fireEvent.press(getByText("Toronto"));

    act(() => {
      fireEvent.press(getByText("Create Team"));
    });
    await waitFor(() => {
      expect(getByText("Creating...")).toBeTruthy();
    });

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalled();
    });
  });
});
