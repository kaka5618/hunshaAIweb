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
    expect(prompt).toContain("strict image-to-image clothing edit");
    expect(prompt).toContain("Use the uploaded image as the canvas");
    expect(prompt).toContain("Edit only the clothing into a wedding dress");
    expect(prompt).toContain("Keep the uploaded person's face pixel-level recognizable");
    expect(prompt).toContain("Do not redraw the face");
    expect(prompt).toContain("do not invent missing body parts");
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

    expect(prompt).toContain("Strict outfit-edit detail from face, collarbone, neckline, and upper bodice");
    expect(prompt).toContain("Bride coverage preference: conservative");
    expect(prompt).toContain("Keep the exact same face and hair from the upload");
    expect(prompt).toContain("Do not redraw the face");
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
