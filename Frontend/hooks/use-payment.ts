import { useCallback, useState } from "react";
import { useStripe } from "@stripe/stripe-react-native";
import type { AxiosInstance } from "axios";
import { toast } from "@/utils/toast";
import { errorToString } from "@/utils/error";
import { type PaymentEntityType, runPaymentFlow } from "@/utils/payment";

export type { PaymentEntityType } from "@/utils/payment";

export type UsePaymentArgs = Readonly<{
  api: AxiosInstance;
  entityType: PaymentEntityType;
  entityId: string;
  amount: number;
  currency?: string;
  description?: string;
  successTitle?: string;
  successMessage?: string;
}>;

export function usePayment({
  api,
  entityType,
  entityId,
  amount,
  currency = "cad",
  description,
  successTitle = "Payment Successful",
  successMessage = "Your changes have been applied.",
}: UsePaymentArgs) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [isPaying, setIsPaying] = useState(false);

  const runPayment = useCallback(
    async (onPaidSuccess?: () => void | Promise<void>) => {
      if (isPaying) return;
      try {
        setIsPaying(true);
        await runPaymentFlow({
          api,
          entityType,
          entityId,
          amount,
          currency,
          description,
          initPaymentSheet,
          presentPaymentSheet,
        });
        await onPaidSuccess?.();
        toast.success(successTitle, {
          description: successMessage,
        });
      } catch (e) {
        toast.error("Payment Failed", {
          description: errorToString(e),
        });
      } finally {
        setIsPaying(false);
      }
    },
    [
      amount,
      api,
      currency,
      description,
      entityId,
      entityType,
      initPaymentSheet,
      isPaying,
      presentPaymentSheet,
      successMessage,
      successTitle,
    ],
  );

  return { runPayment, isPaying };
}
