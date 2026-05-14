export const BRIDAL_REPORT_PRICE_CENTS = 1990;
export const BRIDAL_REPORT_CURRENCY = "usd";
export const BRIDAL_REPORT_PRODUCT_TYPE = "bridal_report";

export const BRIDAL_ANONYMOUS_SESSION_TTL_HOURS = 72;
export const BRIDAL_UPLOAD_TTL_HOURS = 72;
export const BRIDAL_REPORT_TTL_DAYS = 180;
export const BRIDAL_IMAGE_MAX_RETRIES = 2;

export const BRIDAL_PROMPT_VERSION = "bridal-v1";

export const BRIDAL_IMAGE_TYPES = [
  "full_body",
  "neckline_detail",
  "waist_detail",
  "sleeve_detail",
  "venue_scene",
] as const;

export const BRIDAL_REPORT_STATUSES = [
  "draft",
  "generating_preview",
  "preview_ready",
  "awaiting_payment",
  "paid",
  "generating",
  "ready",
  "failed",
  "expired",
] as const;

export const BRIDAL_PAYMENT_STATUSES = [
  "pending",
  "paid",
  "failed",
  "refunded",
] as const;

export const BRIDAL_GENERATION_JOB_TYPES = [
  "copy",
  "image",
  "pdf",
  "email",
] as const;

export const BRIDAL_GENERATION_JOB_STATUSES = [
  "pending",
  "running",
  "success",
  "failed",
] as const;

export const BRIDAL_VOTE_TYPES = [
  "best_overall",
  "best_for_venue",
  "most_elegant",
  "most_you",
] as const;

