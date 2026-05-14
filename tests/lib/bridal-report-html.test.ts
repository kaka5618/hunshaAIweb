import { buildBridalReportHtml, escapeHtml } from "@/lib/bridal/report-html";

const recommendation = {
  id: "recommendation-1",
  rank: 1,
  styleName: "Romantic <Garden>",
  silhouette: "A-line",
  neckline: "Sweetheart",
  fabric: "Lace",
  venueMatch: "Works for the venue.",
  whyItWorks: "Balances comfort and style.",
  whatToAvoid: "Avoid heavy trains.",
  budgetMin: 1200,
  budgetMax: 2400,
  budgetGuardrail: "Keep alterations in reserve.",
  tryFirst: ["Soft lace"],
  skipFirst: ["Heavy beading"],
  consultantScript: "Can we start with A-line gowns?",
  salesPressureReminder: "You can pause before deciding.",
  detailCaptions: {
    neckline: "Frames the upper body.",
    waist: "Defines the waist.",
    sleeve: "Keeps coverage soft.",
  },
};

describe("bridal report HTML export", () => {
  it("escapes user-facing content", () => {
    expect(escapeHtml("<script>alert('x')</script>")).toBe(
      "&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;",
    );
  });

  it("builds a printable HTML report", () => {
    const html = buildBridalReportHtml({
      title: "Your Bridal Style Report",
      generatedAt: new Date("2026-05-14T00:00:00.000Z"),
      recommendations: [recommendation],
      images: [{ recommendationId: "recommendation-1", r2Key: "/image.png" }],
    });

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Your Bridal Style Report");
    expect(html).toContain("Romantic &lt;Garden&gt;");
    expect(html).toContain("/image.png");
    expect(html).toContain("Use your browser print dialog");
  });
});
