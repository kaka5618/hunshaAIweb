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
    "Create a complete full-body bridal try-on portrait. Preserve the uploaded person's face, hair, skin tone, body shape, age impression, and recognizable identity, but you may extend the composition to show the entire body and full wedding dress from head to toe. The dress, shoes, skirt, train, and venue background must be visible. Do not crop the head, waist, hem, hands, or feet.",
  neckline_detail:
    "Create a polished close-up detail rendering of the exact neckline and upper bodice from this plan's generated full-body bridal look. Focus on collarbone, neckline edge, bodice construction, lace or fabric texture, and how the neckline frames the upper body. This should look like a dedicated editorial detail image, not a screenshot crop and not a new face portrait.",
  waist_detail:
    "Create a polished close-up detail rendering of the exact waist and bodice-to-skirt transition from this plan's generated full-body bridal look. Focus on waist seam, corset or bodice structure, belt or ribbon, fabric tension, hip comfort, and silhouette transition. Do not show a face-focused portrait.",
  sleeve_detail:
    "Create a polished close-up detail rendering of the exact sleeve, shoulder, cuff, and arm-coverage design from this plan's generated full-body bridal look. Focus on sleeve length, cuff edge, lace or fabric texture, shoulder coverage, and how it supports the bride's coverage preference. Do not show a face-focused portrait.",
  venue_scene:
    "Create an environmental full-body bridal scene that makes the venue choice obvious while keeping the uploaded person's face and body identity recognizable.",
};

const SHARED_IDENTITY_INSTRUCTIONS = [
  "Use the uploaded image as the identity reference. Do not create a different model.",
  "Keep the uploaded person's face highly recognizable: same facial structure, eye shape, nose, mouth, jawline, skin tone, age impression, ethnicity, hair, and expression.",
  "Keep body proportions realistic and consistent with the uploaded person. Do not slim, reshape, age, westernize, asianize, or beautify into a different person.",
  "Replace casual clothes with a wedding dress that matches the recommendation and quiz answers.",
  "Do not redraw the face, beautify into a different person, westernize, asianize, slim the body, change age, change ethnicity, change hairstyle, or replace the uploaded person.",
  "If the source image is cropped or casual, use it as the face and body identity reference, then create a polished bridal visualization with the same person.",
].join(" ");

const DETAIL_REFERENCE_INSTRUCTIONS = [
  "For detail images, use the provided full-body bridal look as the design reference, not the original casual upload.",
  "The close-up must match the same dress design, fabric, neckline, sleeve, waist construction, venue mood, and identity direction as the full-body plan.",
  "Generate a clean display-ready detail visual of the selected garment area; do not simply crop or zoom a screenshot.",
].join(" ");

function list(values: string[]) {
  return values.length > 0 ? values.join(", ") : "No preference";
}

function pickByRank(values: string[] | undefined, rank: number, fallback: string) {
  const cleanValues = values?.filter(Boolean) ?? [];
  if (cleanValues.length === 0) {
    return fallback;
  }

  return cleanValues[(Math.max(rank, 1) - 1) % cleanValues.length];
}

function detailFocus(imageType: BridalImageType, answers?: BridalQuizAnswers) {
  if (!answers) {
    return "";
  }

  if (imageType === "neckline_detail") {
    return `Detail priority: clearly visualize neckline preference "${list(answers.necklines)}" with coverage preference "${answers.coverage}".`;
  }

  if (imageType === "waist_detail") {
    return `Detail priority: solve body comfort notes "${list(answers.bodyComfort)}" through waist placement, bodice structure, skirt transition, and movement comfort.`;
  }

  if (imageType === "sleeve_detail") {
    return `Detail priority: show sleeve and arm coverage choices for comfort notes "${list(answers.bodyComfort)}" and coverage preference "${answers.coverage}".`;
  }

  if (imageType === "full_body" || imageType === "venue_scene") {
    return `Scene priority: make the ${answers.venue} venue and ${answers.season} season visually obvious in the background, lighting, and dress practicality.`;
  }

  return "";
}

export function getBridalVisualDirection(
  recommendation: {
    rank: number;
    silhouette: string;
    neckline: string;
    fabric: string;
    venueMatch: string;
  },
  answers?: BridalQuizAnswers,
) {
  const rank = recommendation.rank || 1;
  const visualNeckline = pickByRank(answers?.necklines, rank, recommendation.neckline);
  const visualSilhouette = pickByRank(answers?.silhouettes, rank, recommendation.silhouette);
  const visualStyle = pickByRank(answers?.styleWords, rank, "");

  return {
    visualNeckline,
    visualSilhouette,
    visualStyle,
    venue: answers?.venue || recommendation.venueMatch,
    season: answers?.season || "",
    coverage: answers?.coverage || "",
    comfort: answers?.bodyComfort ?? [],
    concerns: answers?.shoppingConcerns ?? [],
  };
}

export function buildBridalImagePrompt(
  recommendation: {
  rank?: number;
  styleName: string;
  silhouette: string;
  neckline: string;
  fabric: string;
  venueMatch: string;
  },
  imageType: BridalImageType = "full_body",
  answers?: BridalQuizAnswers,
) {
  const visualDirection = getBridalVisualDirection(
    {
      rank: recommendation.rank ?? 1,
      silhouette: recommendation.silhouette,
      neckline: recommendation.neckline,
      fabric: recommendation.fabric,
      venueMatch: recommendation.venueMatch,
    },
    answers,
  );

  return [
    "Create a premium bridal styling visualization for a paid wedding dress report.",
    SHARED_IDENTITY_INSTRUCTIONS,
    IMAGE_TYPE_INSTRUCTIONS[imageType],
    imageType === "full_body" || imageType === "venue_scene" ? "" : DETAIL_REFERENCE_INSTRUCTIONS,
    `Style direction: ${recommendation.styleName}.`,
    `Recommendation silhouette: ${recommendation.silhouette}.`,
    `Recommendation neckline: ${recommendation.neckline}.`,
    `Primary visual silhouette for this plan: ${visualDirection.visualSilhouette}.`,
    `Primary visual neckline for this plan: ${visualDirection.visualNeckline}.`,
    visualDirection.visualStyle ? `Primary visual mood for this plan: ${visualDirection.visualStyle}.` : "",
    `Fabric and texture: ${recommendation.fabric}.`,
    `Venue context: ${recommendation.venueMatch}.`,
    `Visual venue background: ${visualDirection.venue}.`,
    visualDirection.season ? `Season and light: ${visualDirection.season}.` : "",
    answers ? `Bride style words: ${list(answers.styleWords)}.` : "",
    answers ? `Bride preferred silhouettes: ${list(answers.silhouettes)}.` : "",
    answers ? `Bride preferred necklines: ${list(answers.necklines)}.` : "",
    answers ? `Bride coverage preference: ${answers.coverage}.` : "",
    answers ? `Bride body comfort notes: ${list(answers.bodyComfort)}.` : "",
    answers ? `Bride shopping concerns: ${list(answers.shoppingConcerns)}.` : "",
    detailFocus(imageType, answers),
    "Photorealistic realistic try-on, refined ivory or white wedding dress, realistic fabric texture, premium bridal boutique report quality.",
    imageType === "full_body" || imageType === "venue_scene"
      ? "Composition requirement: vertical full-body fashion portrait, head-to-toe, entire wedding dress visible, centered person, no crop at head, hem, hands, or feet."
      : "Composition requirement: tight editorial garment-detail composition, the selected dress area fills most of the frame, avoid head-only portraits, avoid distant full-body framing.",
    "Do not violate the bride's preferred neckline, coverage, or comfort constraints.",
    "If the bride selected multiple preferences, this plan should visibly represent its assigned preference instead of repeating the same design across all plans.",
    "Keep the result modest, polished, commercially usable, shareable, and focused on practical dress design without changing identity.",
    "Avoid logos, readable brand text, watermarks, distorted anatomy, distorted face, waxy skin, new model face, exaggerated fantasy styling, unrelated accessories, and overly revealing composition.",
  ].filter(Boolean).join("\n");
}

export function getPlaceholderBridalImageUrl(rank: number) {
  return BRIDAL_PLACEHOLDER_IMAGE_URLS[(Math.max(rank, 1) - 1) % BRIDAL_PLACEHOLDER_IMAGE_URLS.length];
}

export function recommendationToImagePrompt(recommendation: BridalRecommendationDraft) {
  return buildBridalImagePrompt(recommendation);
}
