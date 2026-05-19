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
    "Strict outfit-edit image. Keep the uploaded photo's original face, head, hair, body shape, pose, camera angle, crop, background, and lighting. Replace only the visible clothing with the complete wedding dress direction. If the uploaded photo is not full-length, do not invent missing body parts or force a head-to-toe fashion shot.",
  neckline_detail:
    "Strict outfit-edit detail from face, collarbone, neckline, and upper bodice. Keep the exact same face and hair from the upload. Change only the visible clothing and neckline area.",
  waist_detail:
    "Strict outfit-edit detail from upper torso to hip focused on waist definition, bodice fit, skirt transition, hip comfort, and silhouette structure. Keep body proportions and pose from the uploaded image.",
  sleeve_detail:
    "Strict outfit-edit detail focused on shoulder, sleeve, arm coverage, neckline edge, fabric texture, and modesty preference. Preserve the uploaded person's arms, shoulders, pose, and identity.",
  venue_scene:
    "Environmental scene showing the dress direction in the likely wedding venue context.",
};

const SHARED_IDENTITY_INSTRUCTIONS = [
  "This is a strict image-to-image clothing edit, not a text-to-image generation.",
  "Use the uploaded image as the canvas. Do not create a new person, new portrait, or new fashion model.",
  "Keep the uploaded person's face pixel-level recognizable: same facial structure, eye shape, nose, mouth, jawline, skin tone, age impression, ethnicity, hair, and expression.",
  "Keep the original pose, body proportions, camera angle, crop, background, and lighting unless a small clothing boundary adjustment is required.",
  "Edit only the clothing into a wedding dress that matches the recommendation.",
  "Do not redraw the face, beautify into a different person, westernize, asianize, slim the body, change age, change ethnicity, change hairstyle, or replace the uploaded person.",
  "If the source image has casual clothes or a coat, remove or cover only the garment area with bridal fabric; keep visible face, hands, and body geometry consistent.",
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
    "Photorealistic realistic try-on edit, refined ivory or white wedding dress, realistic fabric texture blended into the existing photo.",
    "Do not violate the bride's preferred neckline, coverage, or comfort constraints.",
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
