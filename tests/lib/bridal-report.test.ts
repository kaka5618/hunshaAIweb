import {
  getBridalAnonymousSessionExpiry,
  getBridalReportExpiry,
  getBridalUploadExpiry,
  isBridalReportPaidStatus,
  resolvePaidReportStatus,
} from "@/lib/bridal/report";

describe("bridal report helpers", () => {
  it("calculates expiry windows from the provided clock", () => {
    const now = new Date("2026-05-14T00:00:00.000Z");

    expect(getBridalAnonymousSessionExpiry(now).toISOString()).toBe(
      "2026-05-17T00:00:00.000Z"
    );
    expect(getBridalUploadExpiry(now).toISOString()).toBe(
      "2026-05-17T00:00:00.000Z"
    );
    expect(getBridalReportExpiry(now).toISOString()).toBe(
      "2026-11-10T00:00:00.000Z"
    );
  });

  it("treats paid, generating, and ready reports as paid access states", () => {
    expect(isBridalReportPaidStatus("awaiting_payment")).toBe(false);
    expect(isBridalReportPaidStatus("paid")).toBe(true);
    expect(isBridalReportPaidStatus("generating")).toBe(true);
    expect(isBridalReportPaidStatus("ready")).toBe(true);
  });

  it("keeps paid reports in generating state while images are still pending", () => {
    expect(resolvePaidReportStatus(true)).toBe("generating");
    expect(resolvePaidReportStatus(false)).toBe("ready");
  });
});

