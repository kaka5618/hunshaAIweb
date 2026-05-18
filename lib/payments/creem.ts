import crypto from "node:crypto";

type CreateCheckoutParams = {
  userId: string;
  key: string; // plan or pack key
  kind: "subscription" | "one_time";
  successUrl: string;
  cancelUrl: string;
  creemPriceId?: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
  requestId?: string;
};

export type CreateCheckoutResult = {
  url: string;
  id?: string;
};

function getEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

export function getCreemApiBase() {
  if (process.env.CREEM_API_BASE) {
    return process.env.CREEM_API_BASE.replace(/\/$/, "");
  }

  return process.env.CREEM_TEST_MODE === "true"
    ? "https://test-api.creem.io"
    : "https://api.creem.io";
}

function getCheckoutPath() {
  const path = process.env.CREEM_CHECKOUT_PATH || "/v1/checkouts";
  return path.startsWith("/") ? path : `/${path}`;
}

export async function createCheckoutSession(params: CreateCheckoutParams): Promise<CreateCheckoutResult> {
  const simulate = process.env.CREEM_SIMULATE === "true";

  if (simulate) {
    const searchParams = new URLSearchParams({
      success: "1",
      successUrl: params.successUrl,
      cancelUrl: params.cancelUrl,
      userId: params.userId,
      key: params.key,
      kind: params.kind,
    });

    for (const [key, value] of Object.entries(params.metadata ?? {})) {
      searchParams.set(key, value);
    }

    return { url: `/api/payments/creem/redirect-placeholder?${searchParams.toString()}` };
  }

  const apiKey = getEnv("CREEM_API_KEY");
  if (!params.creemPriceId) {
    throw new Error("Creem product id is not configured for this checkout item");
  }

  const payload: Record<string, unknown> = {
    product_id: params.creemPriceId,
    success_url: params.successUrl,
    request_id: params.requestId,
    customer: params.customerEmail ? { email: params.customerEmail } : undefined,
    metadata: {
      userId: params.userId,
      key: params.key,
      kind: params.kind,
      ...params.metadata,
    },
  };

  const endpointUrl = `${getCreemApiBase()}${getCheckoutPath()}`;

  try {
    const res = await fetch(endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey, // Creem uses x-api-key header, not Authorization Bearer
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Creem checkout create failed: ${res.status} ${errorText}`);
    }

    const data = (await res.json()) as {
      id?: string;
      url?: string;
      checkout_url?: string;
      checkoutUrl?: string;
    };
    const redirectUrl = data.checkout_url || data.checkoutUrl || data.url;
    
    if (!redirectUrl) {
      throw new Error("Creem checkout response missing checkout_url");
    }
    
    return { url: redirectUrl, id: data.id };
  } catch (error) {
    console.error("Error creating Creem checkout session:", error);
    throw error;
  }
}

export function verifyWebhookSignature(headers: Headers, rawBody: string): boolean {
  const signature = headers.get("creem-signature") || headers.get("x-creem-signature");
  if (!signature) {
    console.error("Missing creem-signature header");
    return false;
  }

  const webhookSecret = process.env.CREEM_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("CREEM_WEBHOOK_SECRET not configured");
    return false;
  }

  // Generate signature using HMAC-SHA256
  const computedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  // Compare signatures (timing-safe comparison)
  const sigBuf = Buffer.from(signature);
  const compBuf = Buffer.from(computedSignature);
  if (sigBuf.length !== compBuf.length) {
    return false;
  }
  const isValid = crypto.timingSafeEqual(sigBuf, compBuf);
  
  if (!isValid) {
    // Log less verbose error (signatures might contain sensitive info)
    console.error("Webhook signature verification failed");
  }

  return isValid;
}

export function verifyReturnUrlSignature(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
): boolean {
  const apiKey = process.env.CREEM_API_KEY;
  if (!apiKey) return false;

  const entries =
    params instanceof URLSearchParams
      ? Array.from(params.entries())
      : Object.entries(params).flatMap(([key, value]) => {
          if (Array.isArray(value)) return value.map(item => [key, item] as const);
          return value === undefined ? [] : ([[key, value]] as const);
        });

  const signature = entries.find(([key]) => key === "signature")?.[1];
  if (!signature) return false;

  const signedPayload = entries
    .filter(([key]) => key !== "signature")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("|");

  const computedSignature = crypto
    .createHmac("sha256", apiKey)
    .update(signedPayload)
    .digest("hex");

  const sigBuf = Buffer.from(signature);
  const compBuf = Buffer.from(computedSignature);
  return sigBuf.length === compBuf.length && crypto.timingSafeEqual(sigBuf, compBuf);
}
