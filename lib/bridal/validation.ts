import { z } from "zod";
import {
  BRIDAL_GENERATION_JOB_STATUSES,
  BRIDAL_GENERATION_JOB_TYPES,
  BRIDAL_IMAGE_TYPES,
  BRIDAL_PAYMENT_STATUSES,
  BRIDAL_REPORT_STATUSES,
  BRIDAL_VOTE_TYPES,
} from "./constants";

export const bridalReportStatusSchema = z.enum(BRIDAL_REPORT_STATUSES);
export const bridalImageTypeSchema = z.enum(BRIDAL_IMAGE_TYPES);
export const bridalPaymentStatusSchema = z.enum(BRIDAL_PAYMENT_STATUSES);
export const bridalGenerationJobTypeSchema = z.enum(BRIDAL_GENERATION_JOB_TYPES);
export const bridalGenerationJobStatusSchema = z.enum(BRIDAL_GENERATION_JOB_STATUSES);
export const bridalVoteTypeSchema = z.enum(BRIDAL_VOTE_TYPES);

export const bridalQuizAnswersSchema = z.object({
  venue: z.string().min(1),
  season: z.string().min(1),
  dressBudget: z.string().min(1),
  styleWords: z.array(z.string().min(1)).min(1),
  silhouettes: z.array(z.string().min(1)).min(1),
  necklines: z.array(z.string().min(1)).min(1),
  coverage: z.string().min(1),
  bodyComfort: z.array(z.string().min(1)),
  shoppingConcerns: z.array(z.string().min(1)),
  appointmentGoal: z.string().min(1),
});

export const bridalRecommendationDraftSchema = z.object({
  rank: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  styleName: z.string().min(1),
  silhouette: z.string().min(1),
  neckline: z.string().min(1),
  fabric: z.string().min(1),
  venueMatch: z.string().min(1),
  whyItWorks: z.string().min(1),
  whatToAvoid: z.string().min(1),
  budgetMin: z.number().int().nonnegative(),
  budgetMax: z.number().int().nonnegative(),
  budgetGuardrail: z.string().min(1),
  tryFirst: z.array(z.string().min(1)).min(1),
  skipFirst: z.array(z.string().min(1)),
  consultantScript: z.string().min(1),
  salesPressureReminder: z.string().min(1),
  detailCaptions: z.object({
    neckline: z.string().min(1),
    waist: z.string().min(1),
    sleeve: z.string().min(1),
  }),
});

export const bridalRecommendationsResponseSchema = z.object({
  recommendations: z
    .array(bridalRecommendationDraftSchema)
    .length(3)
    .refine(
      recommendations => new Set(recommendations.map(item => item.rank)).size === 3,
      "Recommendations must include ranks 1, 2, and 3",
    ),
});

