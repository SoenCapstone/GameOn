import React from "react";
import { Alert } from "react-native";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import LeaguePaymentModal from "../../components/payments/league-payment";
import type { AxiosInstance } from "axios";

const mockInitPaymentSheet = jest.fn();
const mockPresentPaymentSheet = jest.fn();

jest.mock("@stripe/stripe-react-native", () => ({
  useStripe: () => ({
    initPaymentSheet: mockInitPaymentSheet,
    presentPaymentSheet: mockPresentPaymentSheet,
  }),
}));

describe("LeaguePaymentModal", () => {
  const api = {
    post: jest.fn(),
  } as unknown as AxiosInstance;

  const onClose = jest.fn();
  const onPaidSuccess = jest.fn(async () => undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    (Alert.alert as jest.Mock).mockRestore?.();
  });

  function renderModal(overrides?: Partial<React.ComponentProps<typeof LeaguePaymentModal>>) {
    return render(
      <LeaguePaymentModal
        visible
        onClose={onClose}
        api={api}
        leagueId="league-123"
        amount={1500}
        currency="cad"
        description="Join league"
        onPaidSuccess={onPaidSuccess}
        {...overrides}
      />,
    );
  }

  it("renders amount formatted", () => {
    const { getByText } = renderModal({ amount: 1234 });
    expect(getByText("Amount: $12.34")).toBeTruthy();
  });

  it("starts payment flow and accepts on success", async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({
      data: { clientSecret: "pi_secret_123" },
    });

    mockInitPaymentSheet.mockResolvedValueOnce({}); // no error
    mockPresentPaymentSheet.mockResolvedValueOnce({}); // no error

    const { getByText } = renderModal();

    fireEvent.press(getByText("Pay & Accept"));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/api/v1/payments/intent", {
        leagueId: "league-123",
        amount: 1500,
        currency: "cad",
        description: "Join league",
      });
    });

    await waitFor(() => {
      expect(mockInitPaymentSheet).toHaveBeenCalledWith({
        paymentIntentClientSecret: "pi_secret_123",
        merchantDisplayName: "GameOn",
      });
    });

    await waitFor(() => {
      expect(mockPresentPaymentSheet).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(onPaidSuccess).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        "Payment successful",
        "You have joined the league.",
      );
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("shows error if backend doesn't return client secret", async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({ data: {} });

    const { getByText } = renderModal();

    fireEvent.press(getByText("Pay & Accept"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Payment failed",
        "Backend response missing Stripe client secret.",
      );
    });

    expect(mockInitPaymentSheet).not.toHaveBeenCalled();
    expect(mockPresentPaymentSheet).not.toHaveBeenCalled();
    expect(onPaidSuccess).not.toHaveBeenCalled();
  });

  it("shows error if initPaymentSheet returns error", async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({
      data: { clientSecret: "pi_secret_123" },
    });

    mockInitPaymentSheet.mockResolvedValueOnce({
      error: { message: "Init failed" },
    });

    const { getByText } = renderModal();

    fireEvent.press(getByText("Pay & Accept"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("Payment failed", "Init failed");
    });

    expect(mockPresentPaymentSheet).not.toHaveBeenCalled();
    expect(onPaidSuccess).not.toHaveBeenCalled();
  });

  it("shows 'Payment not completed' if presentPaymentSheet returns error", async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({
      data: { clientSecret: "pi_secret_123" },
    });

    mockInitPaymentSheet.mockResolvedValueOnce({});
    mockPresentPaymentSheet.mockResolvedValueOnce({
      error: { message: "User cancelled" },
    });

    const { getByText } = renderModal();

    fireEvent.press(getByText("Pay & Accept"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("Payment not completed", "User cancelled");
    });

    expect(onPaidSuccess).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("clicking Cancel calls onClose", () => {
    const { getByText } = renderModal();
    fireEvent.press(getByText("Cancel"));
    expect(onClose).toHaveBeenCalled();
  });
});
