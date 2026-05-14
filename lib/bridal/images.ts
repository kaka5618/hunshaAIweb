import type { BridalRecommendationDraft } from "./types";

export const BRIDAL_PLACEHOLDER_IMAGE_URLS = [
  "/bridal-feature-look.jpeg",
  "/bridal-feature-detail.png",
  "/starter/bridal-dashboard-light.png",
];

export function buildBridalImagePrompt(recommendation: {
  styleName: string;
  silhouette: string;
  neckline: string;
  fabric: string;
  venueMatch: string;
}) {
  return [
    "Create a tasteful AI bridal look visualization for a paid style report.",
    `Style direction: ${recommendation.styleName}.`,
    `Dress silhouette: ${recommendation.silhouette}.`,
    `Neckline: ${recommendation.neckline}.`,
    `Fabric and texture: ${recommendation.fabric}.`,
    `Venue context: ${recommendation.venueMatch}.`,
    "Photorealistic bridal editorial style, refined ivory dress, soft natural light, elegant boutique or venue setting.",
    "Keep the result modest, polished, commercially usable, and focused on the dress design.",
    "Avoid logos, readable brand text, distorted anatomy, exaggerated fantasy styling, and overly revealing composition.",
  ].join("\n");
}

export function getPlaceholderBridalImageUrl(rank: number) {
  return BRIDAL_PLACEHOLDER_IMAGE_URLS[(Math.max(rank, 1) - 1) % BRIDAL_PLACEHOLDER_IMAGE_URLS.length];
}

export function recommendationToImagePrompt(recommendation: BridalRecommendationDraft) {
  return buildBridalImagePrompt(recommendation);
}
