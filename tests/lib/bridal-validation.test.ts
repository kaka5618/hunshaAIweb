import {
  bridalQuizAnswersSchema,
  bridalRecommendationsResponseSchema,
} from "@/lib/bridal/validation";

const recommendation = {
  rank: 1,
  styleName: "Romantic Garden Bride",
  silhouette: "A-line",
  neckline: "Sweetheart",
  fabric: "Lace over satin",
  venueMatch: "Works well for a garden ceremony.",
  whyItWorks: "It balances softness with structure.",
  whatToAvoid: "Avoid overly heavy ball gowns.",
  budgetMin: 1200,
  budgetMax: 2400,
  budgetGuardrail: "Ask to start under your stated limit.",
  tryFirst: ["A-line lace overlay", "Supportive bodice", "Light skirt movement"],
  skipFirst: ["Heavy cathedral train", "Scratchy sleeve trim"],
  consultantScript: "Can we start with romantic A-line gowns?",
  salesPressureReminder: "You can ask to return to your original brief.",
  detailCaptions: {
    neckline: "The neckline frames the upper body softly.",
    waist: "The waist detail adds definition.",
    sleeve: "The sleeve keeps coverage light.",
  },
};

describe("bridalRecommendationsResponseSchema", () => {
  it("accepts three ranked recommendation drafts", () => {
    const result = bridalRecommendationsResponseSchema.safeParse({
      recommendations: [
        recommendation,
        { ...recommendation, rank: 2, styleName: "Modern Chapel Bride" },
        { ...recommendation, rank: 3, styleName: "Coastal Minimal Bride" },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects duplicate ranks", () => {
    const result = bridalRecommendationsResponseSchema.safeParse({
      recommendations: [
        recommendation,
        { ...recommendation, styleName: "Modern Chapel Bride" },
        { ...recommendation, rank: 3, styleName: "Coastal Minimal Bride" },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects thin shopping guidance", () => {
    const result = bridalRecommendationsResponseSchema.safeParse({
      recommendations: [
        { ...recommendation, tryFirst: ["A-line lace overlay"], skipFirst: ["Heavy cathedral train"] },
        { ...recommendation, rank: 2, styleName: "Modern Chapel Bride" },
        { ...recommendation, rank: 3, styleName: "Coastal Minimal Bride" },
      ],
    });

    expect(result.success).toBe(false);
  });
});

describe("bridalQuizAnswersSchema", () => {
  it("accepts the 10-question bridal quiz payload", () => {
    const result = bridalQuizAnswersSchema.safeParse({
      venue: "garden",
      season: "spring",
      dressBudget: "1000to2000",
      styleWords: ["romantic", "classic"],
      silhouettes: ["aLine"],
      necklines: ["sweetheart"],
      coverage: "shortSleeve",
      bodyComfort: ["arms"],
      shoppingConcerns: ["budget"],
      appointmentGoal: "stayOnBudget",
    });

    expect(result.success).toBe(true);
  });

  it("rejects incomplete quiz payloads", () => {
    const result = bridalQuizAnswersSchema.safeParse({
      venue: "garden",
    });

    expect(result.success).toBe(false);
  });
});
