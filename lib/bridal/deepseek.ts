import { bridalRecommendationsResponseSchema } from "./validation";
import { buildBridalRecommendationPrompt, buildFallbackBridalRecommendations } from "./prompts";
import type { BridalQuizAnswers, BridalRecommendationDraft } from "./types";

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
};

const DEEPSEEK_CHAT_COMPLETIONS_URL = "https://api.deepseek.com/chat/completions";

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

  if (!apiKey) {
    return buildFallbackBridalRecommendations(answers);
  }

  const fetcher = options.fetcher ?? fetch;
  const response = await fetcher(DEEPSEEK_CHAT_COMPLETIONS_URL, {
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
            "You write concise, concrete bridal styling recommendations for a paid shopping report.",
        },
        {
          role: "user",
          content: buildBridalRecommendationPrompt(answers),
        },
      ],
      temperature: 0.45,
      max_tokens: 2200,
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
}
