import React from "react";
import {
  render,
  fireEvent,
  act,
  waitFor,
  cleanup,
} from "@testing-library/react-native";
import CreateLeagueScreen from "@/app/(contexts)/leagues/create-league";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Alert } from "react-native";

jest.spyOn(console, "warn").mockImplementation(() => {});
jest.spyOn(console, "error").mockImplementation(() => {});

const mockBack = jest.fn();
const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, replace: mockReplace }),
}));

const mockToast = jest.fn();
jest.mock("@/utils/toast", () => ({
  toast: (msg: string) => mockToast(msg),
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
            data: { id: "abc", slug: "my-new-league" },
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

beforeEach(() => {
  jest.clearAllMocks();
  mockPost = jest.fn(async () => ({
    data: { id: "abc", slug: "my-new-league" },
  }));
});

function createDelayedResponse() {
  return new Promise((resolve) => {
    setTimeout(
      () => resolve({ data: { id: "abc", slug: "my-new-league" } }),
      50,
    );
  });
}

describe("CreateLeagueScreen", () => {
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
      <CreateLeagueScreen />,
    );

    expect(getByPlaceholderText("League Name")).toBeTruthy();
    expect(getByText("Details")).toBeTruthy();
    expect(getByText("Visibility")).toBeTruthy();
    expect(getByText("Create League")).toBeTruthy();
  });

  it("shows validation warnings when required fields are missing", () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    const { getByPlaceholderText, getByText } = renderWithClient(
      <CreateLeagueScreen />,
    );

    fireEvent.changeText(getByPlaceholderText("League Name"), "My League");
    fireEvent.press(getByText("Create League"));

    expect(alertSpy).toHaveBeenCalledWith(
      "League creation failed",
      "Sport is required",
    );
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockBack).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  it("selects sport then submits and navigates", async () => {
    const { getByText, getByPlaceholderText, findByText } = renderWithClient(
      <CreateLeagueScreen />,
    );
    fireEvent.changeText(getByPlaceholderText("League Name"), "My League");

    fireEvent.press(getByText("Sport"));
    expect(await findByText("Select Sport")).toBeTruthy();
    fireEvent.press(getByText("Soccer"));

    act(() => {
      fireEvent.press(getByText("Create League"));
    });

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalled();
    });
    const [url, body] = mockPost.mock.calls[0];
    expect(url).toContain("api/v1/leagues/create");
    expect(body).toMatchObject({
      name: "My League",
      privacy: "PUBLIC",
      sport: "soccer",
    });

    await waitFor(() => {
      expect(mockBack).toHaveBeenCalled();
    });
    expect(mockToast).toHaveBeenCalledWith("League created");
  });

  it("respects privacy toggle (PRIVATE)", async () => {
    const { getByText, getByPlaceholderText, getByRole } = renderWithClient(
      <CreateLeagueScreen />,
    );
    fireEvent.changeText(getByPlaceholderText("League Name"), "Hidden League");
    fireEvent.press(getByText("Sport"));
    fireEvent.press(getByText("Soccer"));
    const switchToggle = getByRole("switch");
    fireEvent(switchToggle, "valueChange", false);

    act(() => {
      fireEvent.press(getByText("Create League"));
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
      <CreateLeagueScreen />,
    );
    fireEvent.changeText(getByPlaceholderText("League Name"), "Async League");
    fireEvent.press(getByText("Sport"));
    fireEvent.press(getByText("Soccer"));

    act(() => {
      fireEvent.press(getByText("Create League"));
    });
    await waitFor(() => {
      expect(getByText("Creating...")).toBeTruthy();
    });

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalled();
    }, { timeout: 200 });
    await waitFor(() => {
      expect(mockBack).toHaveBeenCalled();
    }, { timeout: 200 });
  });
});
