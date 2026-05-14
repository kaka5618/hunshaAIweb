import {
  generateBridalRecommendations,
  parseBridalRecommendationResponse,
} from "@/lib/bridal/deepseek";
import { buildBridalRecommendationPrompt } from "@/lib/bridal/prompts";
import type { BridalQuizAnswers } from "@/lib/bridal/types";

const answers: BridalQuizAnswers = {
  venue: "garden",
  season: "spring",
  dressBudget: "1000to2500",
  styleWords: ["romantic", "classic"],
  silhouettes: ["A-line"],
  necklines: ["sweetheart"],
  coverage: "short sleeve",
  bodyComfort: ["arms"],
  shoppingConcerns: ["budget"],
  appointmentGoal: "stay on budget",
};

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
  tryFirst: ["A-line lace overlay"],
  skipFirst: ["Heavy cathedral train"],
  consultantScript: "Can we start with romantic A-line gowns?",
  salesPressureReminder: "You can ask to return to your original brief.",
  detailCaptions: {
    neckline: "The neckline frames the upper body softly.",
    waist: "The waist detail adds definition.",
    sleeve: "The sleeve keeps coverage light.",
  },
};

function responseContent() {
  return JSON.stringify({
    recommendations: [
      recommendation,
      { ...recommendation, rank: 2, styleName: "Modern Chapel Bride" },
      { ...recommendation, rank: 3, styleName: "Coastal Minimal Bride" },
    ],
  });
}

describe("bridal DeepSeek generation", () => {
  it("builds a concrete recommendation prompt from quiz answers", () => {
    const prompt = buildBridalRecommendationPrompt(answers);

    expect(prompt).toContain("Return only valid JSON");
    expect(prompt).toContain("Venue: garden");
    expect(prompt).toContain("Style words: romantic, classic");
    expect(prompt).toContain("Appointment goal: stay on budget");
  });

  it("parses valid recommendation JSON", () => {
    const result = parseBridalRecommendationResponse(responseContent());

    expect(result).toHaveLength(3);
    expect(result[0].rank).toBe(1);
    expect(result[2].styleName).toBe("Coastal Minimal Bride");
  });

  it("calls DeepSeek with the selected model", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: responseContent() } }],
      }),
    });

    const result = await generateBridalRecommendations(answers, {
      apiKey: "test-key",
      model: "deepseek-v4-flash",
      fetcher,
    });

    const requestBody = JSON.parse(fetcher.mock.calls[0][1].body);

    expect(result).toHaveLength(3);
    expect(fetcher).toHaveBeenCalledWith(
      "https://api.deepseek.com/chat/completions",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(requestBody.model).toBe("deepseek-v4-flash");
    expect(requestBody.response_format).toEqual({ type: "json_object" });
  });

  it("uses deterministic fallback recommendations without an API key", async () => {
    const result = await generateBridalRecommendations(answers, { apiKey: "" });

    expect(result).toHaveLength(3);
    expect(result[0].styleName).toBe("Clean Venue-Ready Romance");
  });
});
