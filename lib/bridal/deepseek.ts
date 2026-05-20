import { bridalRecommendationsResponseSchema } from "./validation";
import { buildBridalRecommendationPrompt, buildFallbackBridalRecommendations } from "./prompts";
import type { BridalQuizAnswers, BridalRecommendationDraft, BridalReportLanguage } from "./types";

type DeepSeekChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

type GenerateBridalRecommendationsOptions = {
  apiKey?: string;
  model?: string;
  fetcher?: typeof fetch;
  locale?: BridalReportLanguage;
};

const DEFAULT_DEEPSEEK_API_URL = "https://api.deepseek.com";

function extractJsonObject(content: string) {
  const trimmed = content.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("DeepSeek response did not include JSON");
  }

  return trimmed.slice(start, end + 1);
}

export function parseBridalRecommendationResponse(content: string): BridalRecommendationDraft[] {
  const parsed = JSON.parse(extractJsonObject(content));
  const result = bridalRecommendationsResponseSchema.parse(parsed);

  return [...result.recommendations].sort((a, b) => a.rank - b.rank);
}

export async function generateBridalRecommendations(
  answers: BridalQuizAnswers,
  options: GenerateBridalRecommendationsOptions = {},
): Promise<BridalRecommendationDraft[]> {
  const apiKey = options.apiKey ?? process.env.DEEPSEEK_API_KEY;
  const model = options.model ?? process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash";
  const apiUrl = (process.env.DEEPSEEK_API_URL ?? DEFAULT_DEEPSEEK_API_URL).replace(/\/$/, "");
  const locale = options.locale ?? "en";

  if (!apiKey) {
    return buildFallbackBridalRecommendations(answers, locale);
  }

  const fetcher = options.fetcher ?? fetch;
  try {
    const response = await fetcher(`${apiUrl}/chat/completions`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are a senior bridal stylist writing a paid shopping report. Be specific, diagnostic, and practical. Explain tradeoffs, identify why a choice fits the bride's stated constraints, and write like a human consultant, not a generic AI assistant. You obey the requested output language exactly.",
          },
          {
            role: "user",
            content: buildBridalRecommendationPrompt(answers, locale),
          },
        ],
        temperature: 0.55,
        max_tokens: 4200,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(errorText || `DeepSeek request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as DeepSeekChatResponse;
    const content = payload.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("DeepSeek response did not include message content");
    }

    return parseBridalRecommendationResponse(content);
  } catch (error) {
    console.error("DeepSeek bridal recommendation failed, using fallback:", error);
    return buildFallbackBridalRecommendations(answers, locale);
  }
}
