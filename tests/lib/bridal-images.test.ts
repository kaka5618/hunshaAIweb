import {
  buildBridalImagePrompt,
  BRIDAL_REPORT_IMAGE_TYPES,
  getPlaceholderBridalImageUrl,
} from "@/lib/bridal/images";

describe("bridal image helpers", () => {
  it("builds a Seedream-ready image prompt from recommendation fields", () => {
    const prompt = buildBridalImagePrompt({
      styleName: "Romantic Garden Bride",
      silhouette: "A-line",
      neckline: "Sweetheart",
      fabric: "Lace over satin",
      venueMatch: "Works well for a garden ceremony.",
    });

    expect(prompt).toContain("Romantic Garden Bride");
    expect(prompt).toContain("A-line");
    expect(prompt).toContain("Sweetheart");
    expect(prompt).toContain("image-to-image edit");
    expect(prompt).toContain("virtual bridal try-on");
    expect(prompt).toContain("Change the outfit into a wedding dress");
    expect(prompt).toContain("Preserve the uploaded person's facial identity, ethnicity");
    expect(prompt).toContain("Do not westernize, asianize");
    expect(prompt).toContain("Full-length, head-to-toe bridal editorial image");
    expect(prompt).toContain("Avoid logos");
  });

  it("builds constrained detail prompts from quiz answers", () => {
    const prompt = buildBridalImagePrompt(
      {
        styleName: "Conservative V-Neck Classic",
        silhouette: "A-line",
        neckline: "V-neck",
        fabric: "Matte satin",
        venueMatch: "Works well for a hotel ballroom.",
      },
      "neckline_detail",
      {
        venue: "hotel ballroom",
        season: "spring",
        dressBudget: "3000-5000",
        styleWords: ["classic"],
        silhouettes: ["A-line"],
        necklines: ["conservative V-neck"],
        coverage: "conservative",
        bodyComfort: ["arm coverage"],
        shoppingConcerns: ["budget pressure"],
        appointmentGoal: "compare safe options",
      },
    );

    expect(prompt).toContain("Close detail image from face, collarbone, neckline, and upper bodice");
    expect(prompt).toContain("Bride coverage preference: conservative");
    expect(prompt).toContain("same bride and same dress direction");
    expect(prompt).toContain("Do not introduce a different model");
  });

  it("defines four fixed image types for each full report direction", () => {
    expect(BRIDAL_REPORT_IMAGE_TYPES).toEqual([
      "full_body",
      "neckline_detail",
      "waist_detail",
      "sleeve_detail",
    ]);
  });

  it("returns stable placeholder images by rank", () => {
    expect(getPlaceholderBridalImageUrl(1)).toBe("/bridal-feature-look.jpeg");
    expect(getPlaceholderBridalImageUrl(2)).toBe("/bridal-feature-detail.png");
    expect(getPlaceholderBridalImageUrl(4)).toBe("/bridal-feature-look.jpeg");
  });
});
