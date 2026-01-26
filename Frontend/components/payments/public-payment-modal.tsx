import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";
import { useStripe } from "@stripe/stripe-react-native";
import type { AxiosInstance } from "axios";
import { errorToString } from "@/utils/error";

export type PaymentEntityType = "LEAGUE" | "TEAM";

type Props = Readonly<{
  visible: boolean;
  onClose: () => void;
  api: AxiosInstance;
  entityType: PaymentEntityType;
  entityId: string;
  amount: number; // cents
  currency?: string; // default "cad"
  description?: string;
  confirmButtonLabel?: string;
  successTitle?: string;
  successMessage?: string;
  onPaidSuccess: () => Promise<void>;
}>;

type PaymentIntentResponse = Record<string, string | undefined>;

function pickClientSecret(respData: unknown): string | null {
  if (!respData || typeof respData !== "object") return null;
  const data = respData as PaymentIntentResponse;

  return (
    data.clientSecret ??
    data.paymentIntentClientSecret ??
    data.payment_intent_client_secret ??
    null
  );
}

function buildIntentPayload(args: {
  entityType: PaymentEntityType;
  entityId: string;
  amount: number;
  currency: string;
  description: string;
}) {
  const base = {
    amount: args.amount,
    currency: args.currency,
    description: args.description,
  } as Record<string, unknown>;

  if (args.entityType === "LEAGUE") {
    base.leagueId = args.entityId;
  } else {
    base.teamId = args.entityId;
  }

  return base;
}

export default function PublicPaymentModal({
  visible,
  onClose,
  api,
  entityType,
  entityId,
  amount,
  currency = "cad",
  description,
  confirmButtonLabel = "Pay & Continue",
  successTitle = "Payment successful",
  successMessage = "Your changes have been applied.",
  onPaidSuccess,
}: Props) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [isPaying, setIsPaying] = useState(false);

  const formattedAmount = useMemo(() => {
    const dollars = (amount / 100).toFixed(2);
    return `$${dollars}`;
  }, [amount]);

  const startPayment = useCallback(async () => {
    if (isPaying) return;

    try {
      setIsPaying(true);

      const resp = await api.post(
        "/api/v1/payments/intent",
        buildIntentPayload({
          entityType,
          entityId,
          amount,
          currency,
          description:
            description ??
            (entityType === "LEAGUE"
              ? `Publish league (${entityId})`
              : `Publish team (${entityId})`),
        }),
      );

      const clientSecret = pickClientSecret(resp.data);
      if (!clientSecret) {
        throw new Error("Backend response missing Stripe client secret.");
      }

      const initRes = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: "GameOn",
      });

      if (initRes.error) {
        throw new Error(initRes.error.message);
      }

      const presentRes = await presentPaymentSheet();
      if (presentRes.error) {
        Alert.alert("Payment not completed", presentRes.error.message);
        return;
      }

      await onPaidSuccess();

      Alert.alert(successTitle, successMessage);
      onClose();
    } catch (e) {
      Alert.alert("Payment failed", errorToString(e));
    } finally {
      setIsPaying(false);
    }
  }, [
    amount,
    api,
    currency,
    description,
    entityId,
    entityType,
    initPaymentSheet,
    isPaying,
    onClose,
    onPaidSuccess,
    presentPaymentSheet,
    successMessage,
    successTitle,
  ]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.55)",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <View
          style={{
            borderRadius: 18,
            backgroundColor: "#0B1B2B",
            padding: 16,
          }}
        >
          <Text style={{ color: "white", fontSize: 18, fontWeight: "600" }}>
            {entityType === "LEAGUE" ? "League" : "Team"} publication payment
          </Text>

          <Text style={{ color: "rgba(255,255,255,0.8)", marginTop: 8 }}>
            Amount: {formattedAmount}
          </Text>

          <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
            <Pressable
              onPress={onClose}
              disabled={isPaying}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: "rgba(255,255,255,0.12)",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "white" }}>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={startPayment}
              disabled={isPaying}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: "#1E90FF",
                alignItems: "center",
              }}
            >
              {isPaying ? (
                <ActivityIndicator />
              ) : (
                <Text style={{ color: "white", fontWeight: "600" }}>
                  {confirmButtonLabel}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
