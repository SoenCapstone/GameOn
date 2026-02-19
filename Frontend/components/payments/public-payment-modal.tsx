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
import {
  type PaymentEntityType,
  formatAmount,
  runPaymentFlow,
} from "@/utils/payment";

type Props = Readonly<{
  visible: boolean;
  onClose: () => void;
  api: AxiosInstance;
  entityType: PaymentEntityType;
  entityId: string;
  amount: number;
  currency?: string;
  description?: string;
  confirmButtonLabel?: string;
  successTitle?: string;
  successMessage?: string;
  onPaidSuccess: () => Promise<void>;
}>;

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

  const formattedAmount = useMemo(() => formatAmount(amount), [amount]);

  const startPayment = useCallback(async () => {
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
