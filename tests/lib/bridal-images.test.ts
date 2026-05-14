import {
  buildBridalImagePrompt,
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
    expect(prompt).toContain("Avoid logos");
  });

  it("returns stable placeholder images by rank", () => {
    expect(getPlaceholderBridalImageUrl(1)).toBe("/bridal-feature-look.jpeg");
    expect(getPlaceholderBridalImageUrl(2)).toBe("/bridal-feature-detail.png");
    expect(getPlaceholderBridalImageUrl(4)).toBe("/bridal-feature-look.jpeg");
  });
});
