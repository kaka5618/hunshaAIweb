import {
  buildBridalImagePrompt,
  BRIDAL_REPORT_IMAGE_TYPES,
  getBridalVisualDirection,
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
      rank: 1,
    });

    expect(prompt).toContain("Romantic Garden Bride");
    expect(prompt).toContain("A-line");
    expect(prompt).toContain("Sweetheart");
    expect(prompt).toContain("complete full-body bridal try-on portrait");
    expect(prompt).toContain("Use the uploaded image as the identity reference");
    expect(prompt).toContain("Replace casual clothes with a wedding dress");
    expect(prompt).toContain("Keep the uploaded person's face highly recognizable");
    expect(prompt).toContain("Do not redraw the face");
    expect(prompt).toContain("entire wedding dress visible");
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
        rank: 1,
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

    expect(prompt).toContain("Create a polished close-up detail rendering of the exact neckline");
    expect(prompt).toContain("Bride coverage preference: conservative");
    expect(prompt).toContain('Detail priority: clearly visualize neckline preference "conservative V-neck"');
    expect(prompt).toContain("use the provided full-body bridal look as the design reference");
    expect(prompt).toContain("not simply crop or zoom a screenshot");
    expect(prompt).toContain("tight editorial garment-detail composition");
    expect(prompt).toContain("Do not redraw the face");
  });

  it("assigns different visual preferences across ranked directions", () => {
    const answers = {
      venue: "beach",
      season: "summer",
      dressBudget: "3000-5000",
      styleWords: ["romantic", "minimal"],
      silhouettes: ["A-line", "mermaid"],
      necklines: ["V-neck", "strapless"],
      coverage: "balanced",
      bodyComfort: ["arm coverage"],
      shoppingConcerns: ["budget pressure"],
      appointmentGoal: "compare options",
    };

    expect(
      getBridalVisualDirection(
        {
          rank: 1,
          silhouette: "fallback silhouette",
          neckline: "fallback neckline",
          fabric: "lace",
          venueMatch: "outdoor",
        },
        answers,
      ),
    ).toMatchObject({
      visualNeckline: "V-neck",
      visualSilhouette: "A-line",
      venue: "beach",
    });

    expect(
      getBridalVisualDirection(
        {
          rank: 2,
          silhouette: "fallback silhouette",
          neckline: "fallback neckline",
          fabric: "lace",
          venueMatch: "outdoor",
        },
        answers,
      ),
    ).toMatchObject({
      visualNeckline: "strapless",
      visualSilhouette: "mermaid",
      venue: "beach",
    });
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
