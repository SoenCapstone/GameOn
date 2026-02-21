import type { AxiosInstance } from "axios";

export type PaymentEntityType = "LEAGUE" | "TEAM";

type PaymentIntentResponse = Record<string, string | undefined>;

export function pickClientSecret(respData: unknown): string | null {
  if (!respData || typeof respData !== "object") return null;
  const data = respData as PaymentIntentResponse;
  return (
    data.clientSecret ??
    data.paymentIntentClientSecret ??
    data.payment_intent_client_secret ??
    null
  );
}

export function buildIntentPayload(args: {
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

export function formatAmount(amountCents: number): string {
  return `$${(amountCents / 100).toFixed(2)}`;
}

export function getDefaultDescription(
  entityType: PaymentEntityType,
  entityId: string,
): string {
  return entityType === "LEAGUE"
    ? `Publish league (${entityId})`
    : `Publish team (${entityId})`;
}

export type RunPaymentFlowArgs = Readonly<{
  api: AxiosInstance;
  entityType: PaymentEntityType;
  entityId: string;
  amount: number;
  currency?: string;
  description?: string;
  initPaymentSheet: (params: {
    paymentIntentClientSecret: string;
    merchantDisplayName: string;
  }) => Promise<{ error?: { message: string } }>;
  presentPaymentSheet: () => Promise<{ error?: { message: string } }>;
}>;

export async function runPaymentFlow({
  api,
  entityType,
  entityId,
  amount,
  currency = "cad",
  description,
  initPaymentSheet,
  presentPaymentSheet,
}: RunPaymentFlowArgs): Promise<void> {
  const resp = await api.post(
    "/api/v1/payments/intent",
    buildIntentPayload({
      entityType,
      entityId,
      amount,
      currency,
      description: description ?? getDefaultDescription(entityType, entityId),
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
    throw new Error(presentRes.error.message);
  }
}
