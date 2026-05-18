import crypto from "node:crypto";
import {
  createCheckoutSession,
  getCreemApiBase,
  verifyReturnUrlSignature,
  verifyWebhookSignature,
} from "@/lib/payments/creem";

const originalEnv = process.env;

describe("Creem payments", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = {
      ...originalEnv,
      CREEM_API_KEY: "creem_test_key",
      CREEM_WEBHOOK_SECRET: "webhook_secret",
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("uses the Creem test API base when test mode is enabled", () => {
    process.env.CREEM_TEST_MODE = "true";
    delete process.env.CREEM_API_BASE;

    expect(getCreemApiBase()).toBe("https://test-api.creem.io");
  });

  it("creates a checkout session with product, customer, request id, and metadata", async () => {
    process.env.CREEM_TEST_MODE = "true";
    delete process.env.CREEM_API_BASE;

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "ch_test_123",
          checkout_url: "https://pay.creem.io/checkout/ch_test_123",
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await createCheckoutSession({
      userId: "user_1",
      key: "bridal_report",
      kind: "one_time",
      creemPriceId: "prod_test_123",
      customerEmail: "buyer@example.com",
      requestId: "bridal-report:report_1",
      successUrl: "https://yourbridalstyle.com/report/report_1?success=1",
      cancelUrl: "https://yourbridalstyle.com/report/report_1",
      metadata: {
        productType: "bridal_report",
        reportId: "report_1",
      },
    });

    expect(result).toEqual({
      id: "ch_test_123",
      url: "https://pay.creem.io/checkout/ch_test_123",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://test-api.creem.io/v1/checkouts",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "creem_test_key",
        },
      }),
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      product_id: "prod_test_123",
      success_url: "https://yourbridalstyle.com/report/report_1?success=1",
      request_id: "bridal-report:report_1",
      customer: {
        email: "buyer@example.com",
      },
      metadata: {
        userId: "user_1",
        key: "bridal_report",
        kind: "one_time",
        productType: "bridal_report",
        reportId: "report_1",
      },
    });
  });

  it("verifies Creem webhook signatures against the raw request body", () => {
    const rawBody = JSON.stringify({ id: "evt_1", eventType: "checkout.completed" });
    const signature = crypto
      .createHmac("sha256", "webhook_secret")
      .update(rawBody)
      .digest("hex");

    expect(verifyWebhookSignature(new Headers({ "creem-signature": signature }), rawBody)).toBe(true);
    expect(verifyWebhookSignature(new Headers({ "creem-signature": "bad" }), rawBody)).toBe(false);
  });

  it("verifies Creem return URL signatures using sorted query parameters", () => {
    const signedPayload = [
      "checkout_id=ch_123",
      "customer_id=cus_123",
      "order_id=ord_123",
      "product_id=prod_123",
      "request_id=bridal-report:report_1",
    ].join("|");
    const signature = crypto
      .createHmac("sha256", "creem_test_key")
      .update(signedPayload)
      .digest("hex");

    expect(
      verifyReturnUrlSignature(
        new URLSearchParams({
          order_id: "ord_123",
          request_id: "bridal-report:report_1",
          checkout_id: "ch_123",
          customer_id: "cus_123",
          product_id: "prod_123",
          signature,
        }),
      ),
    ).toBe(true);
  });

  it("does not require a Creem API key when local simulation is enabled", async () => {
    process.env.CREEM_SIMULATE = "true";
    delete process.env.CREEM_API_KEY;

    const result = await createCheckoutSession({
      userId: "user_1",
      key: "bridal_report",
      kind: "one_time",
      successUrl: "https://yourbridalstyle.com/report/report_1?success=1",
      cancelUrl: "https://yourbridalstyle.com/report/report_1",
    });

    expect(result.url).toContain("/api/payments/creem/redirect-placeholder?");
  });
});
