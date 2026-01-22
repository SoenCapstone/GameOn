import React, { useCallback, useMemo, useState } from "react";
import { Alert, Modal, Pressable, Text, View, ActivityIndicator } from "react-native";
import { useStripe } from "@stripe/stripe-react-native";
import type { AxiosInstance } from "axios";
import { errorToString } from "@/utils/error";

type Props = Readonly<{
  visible: boolean;
  onClose: () => void;
  api: AxiosInstance;
  leagueId: string;
  amount: number; // cents
  currency?: string; // default "cad"
  description?: string;
  onPaidSuccess: () => Promise<void>;
}>;

type PaymentIntentResponse = Record<string, string | undefined>;

function isPaymentIntentResponse(value: object): value is PaymentIntentResponse {
  return value !== null;
}

function pickClientSecret(respData: object): string | null {
  if (!isPaymentIntentResponse(respData)) return null;

  return (
    respData.clientSecret ??
    respData.paymentIntentClientSecret ??
    respData.payment_intent_client_secret ??
    null
  );
}



export default function LeaguePaymentModal({
  visible,
  onClose,
  api,
  leagueId,
  amount,
  currency = "cad",
  description,
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

      const resp = await api.post("/api/v1/payments/intent", {
        leagueId,
        amount,
        currency,
        description: description ?? `League payment (${leagueId})`,
      });

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

      Alert.alert("Payment successful", "You have joined the league.");
      onClose();
    } catch (e) {
        Alert.alert("Payment failed", errorToString(e));
    } finally {
      setIsPaying(false);
    }
  }, [
    api,
    amount,
    currency,
    description,
    initPaymentSheet,
    isPaying,
    leagueId,
    onClose,
    onPaidSuccess,
    presentPaymentSheet,
  ]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
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
            League payment
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
                <Text style={{ color: "white", fontWeight: "600" }}>Pay & Accept</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
