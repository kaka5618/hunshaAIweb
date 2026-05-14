import type { BridalQuizAnswers, BridalRecommendationDraft } from "./types";

function list(values: string[]) {
  return values.length > 0 ? values.join(", ") : "No preference";
}

export function buildBridalRecommendationPrompt(answers: BridalQuizAnswers) {
  return [
    "You are a senior bridal stylist creating a paid bridal look report.",
    "Return only valid JSON. Do not include markdown, commentary, or code fences.",
    "Create exactly 3 distinct bridal dress recommendations for the bride.",
    "Each recommendation must be practical for shopping appointments, budget-aware, and emotionally reassuring without overpromising fit.",
    "Use the bride's quiz answers as constraints, not as loose inspiration.",
    "",
    "Required JSON shape:",
    JSON.stringify(
      {
        recommendations: [
          {
            rank: 1,
            styleName: "Short memorable style name",
            silhouette: "Primary silhouette",
            neckline: "Primary neckline",
            fabric: "Primary fabric or texture",
            venueMatch: "Why this fits the venue and season",
            whyItWorks: "Why this works for her preferences and comfort notes",
            whatToAvoid: "Specific features to avoid first",
            budgetMin: 1200,
            budgetMax: 2600,
            budgetGuardrail: "How to stay inside budget while shopping",
            tryFirst: ["Specific feature to ask for"],
            skipFirst: ["Specific feature to skip"],
            consultantScript: "One sentence she can say to a bridal consultant",
            salesPressureReminder: "One sentence that helps her resist pressure",
            detailCaptions: {
              neckline: "Caption for neckline detail image",
              waist: "Caption for waist/detail image",
              sleeve: "Caption for sleeve/coverage detail image",
            },
          },
        ],
      },
      null,
      2,
    ),
    "",
    "Bride quiz answers:",
    `Venue: ${answers.venue}`,
    `Season: ${answers.season}`,
    `Dress budget: ${answers.dressBudget}`,
    `Style words: ${list(answers.styleWords)}`,
    `Preferred silhouettes: ${list(answers.silhouettes)}`,
    `Preferred necklines: ${list(answers.necklines)}`,
    `Coverage preference: ${answers.coverage}`,
    `Body comfort notes: ${list(answers.bodyComfort)}`,
    `Shopping concerns: ${list(answers.shoppingConcerns)}`,
    `Appointment goal: ${answers.appointmentGoal}`,
  ].join("\n");
}

export function buildFallbackBridalRecommendations(
  answers: BridalQuizAnswers,
): BridalRecommendationDraft[] {
  const budgetMax = Number.parseInt(answers.dressBudget.match(/\d+/g)?.at(-1) ?? "2500", 10);
  const safeBudgetMax = Number.isFinite(budgetMax) ? budgetMax : 2500;
  const safeBudgetMin = Math.max(500, Math.round(safeBudgetMax * 0.45));
  const firstSilhouette = answers.silhouettes[0] ?? "A-line";
  const firstNeckline = answers.necklines[0] ?? "soft scoop";

  return [
    {
      rank: 1,
      styleName: "Clean Venue-Ready Romance",
      silhouette: firstSilhouette,
      neckline: firstNeckline,
      fabric: "structured crepe with soft lining",
      venueMatch: `A polished ${firstSilhouette} shape works well for ${answers.venue} in ${answers.season}.`,
      whyItWorks: `It keeps the focus on ${answers.styleWords.join(", ") || "a refined bridal feel"} while respecting your coverage preference.`,
      whatToAvoid: "Skip heavy embellishment before you try clean structured gowns.",
      budgetMin: safeBudgetMin,
      budgetMax: safeBudgetMax,
      budgetGuardrail: "Start with samples under your top budget so alterations and accessories still fit.",
      tryFirst: ["structured bodice", "simple skirt movement", "comfortable lining"],
      skipFirst: ["very heavy beading", "stiff skirts", "trend details you did not request"],
      consultantScript: `I want a ${firstSilhouette} gown with a ${firstNeckline} neckline that feels polished but comfortable.`,
      salesPressureReminder: "You can pause before saying yes; the right dress should match both the look and the budget.",
      detailCaptions: {
        neckline: `A ${firstNeckline} neckline keeps the upper body balanced and intentional.`,
        waist: "A lightly defined waist adds shape without making the dress feel restrictive.",
        sleeve: "Soft coverage details can be added without changing the main silhouette.",
      },
    },
    {
      rank: 2,
      styleName: "Soft Editorial Classic",
      silhouette: answers.silhouettes[1] ?? firstSilhouette,
      neckline: answers.necklines[1] ?? firstNeckline,
      fabric: "matte satin or mikado",
      venueMatch: `The fabric photographs cleanly and suits a ${answers.venue} setting.`,
      whyItWorks: "It gives bridal presence without forcing a high-drama gown if that feels uncomfortable.",
      whatToAvoid: "Avoid dresses that rely on dramatic trains as the main selling point.",
      budgetMin: safeBudgetMin,
      budgetMax: safeBudgetMax,
      budgetGuardrail: "Compare base dress price and alteration estimates before adding veils or overskirts.",
      tryFirst: ["matte fabric", "supportive internal structure", "minimal back detail"],
      skipFirst: ["fragile sheer panels", "oversized bows", "unplanned overskirts"],
      consultantScript: "Please pull gowns that feel classic in photos and easy to move in during the appointment.",
      salesPressureReminder: "A dress can be beautiful and still not be the best choice for you.",
      detailCaptions: {
        neckline: "A cleaner neckline gives accessories room to work.",
        waist: "A smooth waist keeps the look timeless instead of busy.",
        sleeve: "Optional sleeve coverage should feel integrated, not like an afterthought.",
      },
    },
    {
      rank: 3,
      styleName: "Light Romantic Texture",
      silhouette: "A-line",
      neckline: firstNeckline,
      fabric: "soft tulle with restrained lace",
      venueMatch: `Light texture gives movement for ${answers.season} without overpowering the venue.`,
      whyItWorks: "It is a useful third try-on lane if the cleaner options feel too plain.",
      whatToAvoid: "Skip lace patterns that feel costume-like or distract from your face.",
      budgetMin: safeBudgetMin,
      budgetMax: safeBudgetMax,
      budgetGuardrail: "Ask whether lace, appliques, and hem changes increase alteration cost.",
      tryFirst: ["light lace placement", "soft skirt volume", "comfortable straps"],
      skipFirst: ["scratchy bodices", "dense appliques", "very long cathedral trains"],
      consultantScript: "I want to compare one softer romantic option, but it still needs to feel wearable.",
      salesPressureReminder: "Keep this as a comparison dress, not a pressure purchase.",
      detailCaptions: {
        neckline: "Soft texture near the neckline should frame, not crowd, the face.",
        waist: "Subtle texture at the waist can add interest while keeping proportions clean.",
        sleeve: "Light sleeve detail works best when it matches the gown fabric.",
      },
    },
  ];
}
