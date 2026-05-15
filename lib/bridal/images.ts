import type { BridalImageType, BridalQuizAnswers, BridalRecommendationDraft } from "./types";

export const BRIDAL_PLACEHOLDER_IMAGE_URLS = [
  "/bridal-feature-look.jpeg",
  "/bridal-feature-detail.png",
  "/starter/bridal-dashboard-light.png",
];

export const BRIDAL_REPORT_IMAGE_TYPES: BridalImageType[] = [
  "full_body",
  "neckline_detail",
  "waist_detail",
  "sleeve_detail",
];

const IMAGE_TYPE_INSTRUCTIONS: Record<BridalImageType, string> = {
  full_body:
    "Full-body bridal styling image showing the complete dress direction, posture, skirt shape, and overall appointment-ready look.",
  neckline_detail:
    "Close detail crop focused on neckline and upper bodice. Respect the bride's neckline and coverage preferences.",
  waist_detail:
    "Close detail crop focused on waist definition, skirt transition, hip comfort, and silhouette structure.",
  sleeve_detail:
    "Close detail crop focused on sleeve, arm coverage, shoulder coverage, fabric texture, and modesty preference.",
  venue_scene:
    "Environmental scene showing the dress direction in the likely wedding venue context.",
};

function list(values: string[]) {
  return values.length > 0 ? values.join(", ") : "No preference";
}

export function buildBridalImagePrompt(
  recommendation: {
  styleName: string;
  silhouette: string;
  neckline: string;
  fabric: string;
  venueMatch: string;
  },
  imageType: BridalImageType = "full_body",
  answers?: BridalQuizAnswers,
) {
  return [
    "Create a tasteful AI bridal look visualization for a paid style report.",
    "Use the uploaded person as the reference and transform that same person into the recommended wedding dress look.",
    IMAGE_TYPE_INSTRUCTIONS[imageType],
    `Style direction: ${recommendation.styleName}.`,
    `Dress silhouette: ${recommendation.silhouette}.`,
    `Neckline: ${recommendation.neckline}.`,
    `Fabric and texture: ${recommendation.fabric}.`,
    `Venue context: ${recommendation.venueMatch}.`,
    answers ? `Bride style words: ${list(answers.styleWords)}.` : "",
    answers ? `Bride preferred silhouettes: ${list(answers.silhouettes)}.` : "",
    answers ? `Bride preferred necklines: ${list(answers.necklines)}.` : "",
    answers ? `Bride coverage preference: ${answers.coverage}.` : "",
    answers ? `Bride body comfort notes: ${list(answers.bodyComfort)}.` : "",
    answers ? `Bride shopping concerns: ${list(answers.shoppingConcerns)}.` : "",
    "Photorealistic bridal editorial style, refined ivory dress, soft natural light, elegant boutique or venue setting.",
    "Preserve the uploaded person's identity, face, body proportions, skin tone, and pose as much as possible.",
    "Do not introduce a different model or a different person.",
    "Do not violate the bride's preferred neckline, coverage, or comfort constraints.",
    "Keep the result modest, polished, commercially usable, and focused on the dress design.",
    "Avoid logos, readable brand text, distorted anatomy, exaggerated fantasy styling, and overly revealing composition.",
  ].filter(Boolean).join("\n");
}

export function getPlaceholderBridalImageUrl(rank: number) {
  return BRIDAL_PLACEHOLDER_IMAGE_URLS[(Math.max(rank, 1) - 1) % BRIDAL_PLACEHOLDER_IMAGE_URLS.length];
}

export function recommendationToImagePrompt(recommendation: BridalRecommendationDraft) {
  return buildBridalImagePrompt(recommendation);
}
