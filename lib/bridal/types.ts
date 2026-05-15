import type {
  BRIDAL_GENERATION_JOB_STATUSES,
  BRIDAL_GENERATION_JOB_TYPES,
  BRIDAL_IMAGE_TYPES,
  BRIDAL_PAYMENT_STATUSES,
  BRIDAL_REPORT_STATUSES,
  BRIDAL_VOTE_TYPES,
} from "./constants";

export type BridalImageType = (typeof BRIDAL_IMAGE_TYPES)[number];
export type BridalReportStatus = (typeof BRIDAL_REPORT_STATUSES)[number];
export type BridalPaymentStatus = (typeof BRIDAL_PAYMENT_STATUSES)[number];
export type BridalGenerationJobType = (typeof BRIDAL_GENERATION_JOB_TYPES)[number];
export type BridalGenerationJobStatus = (typeof BRIDAL_GENERATION_JOB_STATUSES)[number];
export type BridalVoteType = (typeof BRIDAL_VOTE_TYPES)[number];

export type BridalSessionStatus = "active" | "bound" | "expired";
export type BridalUploadStatus = "uploaded" | "processing" | "failed";
export type BridalModerationStatus = "pending" | "approved" | "rejected";
export type BridalGeneratedImageStatus = "pending" | "generating" | "success" | "failed";
export type BridalReportLanguage = "en" | "zh";

export type BridalQuizAnswers = {
  venue: string;
  season: string;
  dressBudget: string;
  styleWords: string[];
  silhouettes: string[];
  necklines: string[];
  coverage: string;
  bodyComfort: string[];
  shoppingConcerns: string[];
  appointmentGoal: string;
};

export type BridalRecommendationDraft = {
  rank: 1 | 2 | 3;
  styleName: string;
  silhouette: string;
  neckline: string;
  fabric: string;
  venueMatch: string;
  whyItWorks: string;
  whatToAvoid: string;
  budgetMin: number;
  budgetMax: number;
  budgetGuardrail: string;
  tryFirst: string[];
  skipFirst: string[];
  consultantScript: string;
  salesPressureReminder: string;
  detailCaptions: {
    neckline: string;
    waist: string;
    sleeve: string;
  };
};
