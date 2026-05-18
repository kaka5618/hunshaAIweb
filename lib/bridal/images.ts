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
    "Full-length, head-to-toe bridal editorial image showing the same person in the complete wedding dress direction. The full gown, neckline, waist, sleeve or coverage treatment, skirt shape, and shoes area should be visible. Do not crop the head or replace the person with a fashion model.",
  neckline_detail:
    "Close detail image from face, collarbone, neckline, and upper bodice. Keep enough of the same face and hair visible for identity continuity. Show the recommended neckline and coverage clearly, as if it is a cropped detail from the same dress direction.",
  waist_detail:
    "Close detail image from upper torso to hip focused on waist definition, bodice fit, skirt transition, hip comfort, and silhouette structure. Keep the same dress direction and person continuity from the full-body look.",
  sleeve_detail:
    "Close detail image focused on shoulder, sleeve, arm coverage, neckline edge, fabric texture, and modesty preference. Keep the same dress direction and person continuity from the full-body look.",
  venue_scene:
    "Environmental scene showing the dress direction in the likely wedding venue context.",
};

const SHARED_IDENTITY_INSTRUCTIONS = [
  "This is an image-to-image edit using the uploaded photo as the source, not a text-to-image request.",
  "This is a virtual bridal try-on for the uploaded person, not a fashion editorial casting a similar model.",
  "Preserve the uploaded person's facial identity, ethnicity, age impression, facial structure, eye shape, nose, mouth, jawline, hairstyle, hair color, body proportions, skin tone, and general pose as much as possible.",
  "Change the outfit into a wedding dress that matches the recommendation, while keeping the person recognizable as the uploaded bride.",
  "Do not westernize, asianize, glamorize into a new face, change ethnicity, change age, or introduce a different beauty standard.",
  "Do not introduce a different model, celebrity face, mannequin, extra person, or unrelated stock-photo bride.",
  "For detail images, make the crop feel like it belongs to the same bride and same dress direction as the full-body image.",
].join(" ");

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
    "Create a premium bridal styling visualization for a paid wedding dress report.",
    SHARED_IDENTITY_INSTRUCTIONS,
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
    "Photorealistic bridal boutique report photography, refined ivory or white wedding dress, soft natural light, clean premium background, realistic fabric texture.",
    "Do not violate the bride's preferred neckline, coverage, or comfort constraints.",
    "Keep the result modest, polished, commercially usable, shareable, and focused on practical dress design.",
    "Avoid logos, readable brand text, watermarks, distorted anatomy, exaggerated fantasy styling, unrelated accessories, and overly revealing composition.",
  ].filter(Boolean).join("\n");
}

export function getPlaceholderBridalImageUrl(rank: number) {
  return BRIDAL_PLACEHOLDER_IMAGE_URLS[(Math.max(rank, 1) - 1) % BRIDAL_PLACEHOLDER_IMAGE_URLS.length];
}

export function recommendationToImagePrompt(recommendation: BridalRecommendationDraft) {
  return buildBridalImagePrompt(recommendation);
}
