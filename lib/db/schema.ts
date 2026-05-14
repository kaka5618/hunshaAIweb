import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  // total available credits for the user
  credits: integer("credits").default(0).notNull(),
  // user role: 'admin' | 'user'
  role: text("role").default("user").notNull(),
  // current subscription plan
  planKey: text("plan_key").default("free"),
  // ban status
  banned: boolean("banned").default(false).notNull(),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// Payment records (one-time purchases and subscription renewals)
export const payment = pgTable("payment", {
  id: text("id").primaryKey(),
  provider: varchar("provider", { length: 32 }).default("creem").notNull(),
  providerPaymentId: text("provider_payment_id").notNull().unique(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  amountCents: integer("amount_cents").notNull(),
  currency: varchar("currency", { length: 8 }).default("usd").notNull(),
  status: varchar("status", { length: 32 }).notNull(),
  type: varchar("type", { length: 32 }).notNull(), // 'one_time' | 'subscription'
  planKey: varchar("plan_key", { length: 64 }),
  creditsGranted: integer("credits_granted").default(0).notNull(),
  raw: text("raw"), // store provider payload as JSON string
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Active subscriptions
export const subscription = pgTable("subscription", {
  id: text("id").primaryKey(),
  provider: varchar("provider", { length: 32 }).default("creem").notNull(),
  providerSubId: text("provider_sub_id").notNull().unique(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  planKey: varchar("plan_key", { length: 64 }).notNull(),
  status: varchar("status", { length: 32 }).notNull(),
  currentPeriodEnd: timestamp("current_period_end"),
  raw: text("raw"), // store provider payload as JSON string
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});

// Credit ledger for auditability
export const creditLedger = pgTable("credit_ledger", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  delta: integer("delta").notNull(),
  reason: varchar("reason", { length: 64 }).notNull(), // 'subscription_cycle' | 'one_time_pack' | 'adjustment' | 'chat_usage' | ...
  paymentId: text("payment_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const subscriptionCreditSchedule = pgTable(
  "subscription_credit_schedule",
  {
    id: text("id").primaryKey(),
    subscriptionId: text("subscription_id")
      .notNull()
      .references(() => subscription.id, { onDelete: "cascade" })
      .unique(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    planKey: varchar("plan_key", { length: 64 }).notNull(),
    creditsPerGrant: integer("credits_per_grant").notNull(),
    intervalMonths: integer("interval_months").notNull(),
    grantsRemaining: integer("grants_remaining").notNull(),
    totalCreditsRemaining: integer("total_credits_remaining").notNull(),
    nextGrantAt: timestamp("next_grant_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  table => ({
    nextGrantIdx: index("subscription_credit_schedule_next_grant_idx").on(table.nextGrantAt),
  }),
);

// Chat sessions
export const chatSession = pgTable("chat_session", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  title: text("title"),
  model: varchar("model", { length: 48 }).default("doubao-1-5-thinking-pro-250415").notNull(),
  totalMessages: integer("total_messages").default(0).notNull(),
  totalCreditsUsed: integer("total_credits_used").default(0).notNull(),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});

// Chat messages
export const chatMessage = pgTable("chat_message", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => chatSession.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 16 }).notNull(), // 'user' | 'assistant' | 'system'
  content: text("content").notNull(),
  creditsUsed: integer("credits_used").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Generation history for images and videos
export const generationHistory = pgTable("generation_history", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 16 }).notNull(), // 'image' | 'video'
  prompt: text("prompt").notNull(),
  imageUrl: text("image_url"), // For image-to-video generation
  resultUrl: text("result_url"), // Final result URL
  taskId: text("task_id"), // For async video generation tracking
  status: varchar("status", { length: 16 }).notNull().default("pending"), // pending, processing, completed, failed
  creditsUsed: integer("credits_used").default(0).notNull(),
  metadata: text("metadata"), // JSON string for additional data
  error: text("error"), // Error message if failed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const bridalAnonymousSession = pgTable(
  "bridal_anonymous_session",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    status: varchar("status", { length: 16 }).default("active").notNull(),
    deviceInfo: jsonb("device_info").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
  },
  table => ({
    userIdx: index("bridal_anonymous_session_user_idx").on(table.userId),
    expiresAtIdx: index("bridal_anonymous_session_expires_at_idx").on(table.expiresAt),
  }),
);

export const bridalQuizAnswer = pgTable(
  "bridal_quiz_answer",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => bridalAnonymousSession.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    answers: jsonb("answers").$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  table => ({
    sessionIdx: index("bridal_quiz_answer_session_idx").on(table.sessionId),
    userIdx: index("bridal_quiz_answer_user_idx").on(table.userId),
  }),
);

export const bridalUploadedPhoto = pgTable(
  "bridal_uploaded_photo",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => bridalAnonymousSession.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    r2Key: text("r2_key").notNull(),
    processedR2Key: text("processed_r2_key"),
    uploadStatus: varchar("upload_status", { length: 32 }).default("uploaded").notNull(),
    qualityScore: real("quality_score"),
    moderationStatus: varchar("moderation_status", { length: 32 }).default("pending").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  table => ({
    sessionIdx: index("bridal_uploaded_photo_session_idx").on(table.sessionId),
    userIdx: index("bridal_uploaded_photo_user_idx").on(table.userId),
    expiresAtIdx: index("bridal_uploaded_photo_expires_at_idx").on(table.expiresAt),
  }),
);

export const bridalReport = pgTable(
  "bridal_report",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => bridalAnonymousSession.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    title: text("title").default("Your Bridal Style Report").notNull(),
    status: varchar("status", { length: 32 }).default("draft").notNull(),
    isPaid: boolean("is_paid").default(false).notNull(),
    priceCents: integer("price_cents").default(1990).notNull(),
    currency: varchar("currency", { length: 8 }).default("usd").notNull(),
    pdfR2Key: text("pdf_r2_key"),
    shareEnabled: boolean("share_enabled").default(false).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  table => ({
    sessionIdx: index("bridal_report_session_idx").on(table.sessionId),
    userIdx: index("bridal_report_user_idx").on(table.userId),
    statusIdx: index("bridal_report_status_idx").on(table.status),
  }),
);

export const bridalRecommendation = pgTable(
  "bridal_recommendation",
  {
    id: text("id").primaryKey(),
    reportId: text("report_id")
      .notNull()
      .references(() => bridalReport.id, { onDelete: "cascade" }),
    sessionId: text("session_id")
      .notNull()
      .references(() => bridalAnonymousSession.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    rank: integer("rank").notNull(),
    styleName: text("style_name").notNull(),
    silhouette: text("silhouette").notNull(),
    neckline: text("neckline").notNull(),
    fabric: text("fabric").notNull(),
    venueMatch: text("venue_match").notNull(),
    whyItWorks: text("why_it_works").notNull(),
    whatToAvoid: text("what_to_avoid").notNull(),
    budgetMin: integer("budget_min").notNull(),
    budgetMax: integer("budget_max").notNull(),
    budgetGuardrail: text("budget_guardrail").notNull(),
    tryFirst: jsonb("try_first").$type<string[]>().notNull(),
    skipFirst: jsonb("skip_first").$type<string[]>().notNull(),
    consultantScript: text("consultant_script").notNull(),
    salesPressureReminder: text("sales_pressure_reminder").notNull(),
    detailCaptions: jsonb("detail_captions")
      .$type<{ neckline: string; waist: string; sleeve: string }>()
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  table => ({
    reportRankUnique: uniqueIndex("bridal_recommendation_report_rank_unique").on(
      table.reportId,
      table.rank,
    ),
    reportIdx: index("bridal_recommendation_report_idx").on(table.reportId),
    userIdx: index("bridal_recommendation_user_idx").on(table.userId),
  }),
);

export const bridalGeneratedImage = pgTable(
  "bridal_generated_image",
  {
    id: text("id").primaryKey(),
    reportId: text("report_id")
      .notNull()
      .references(() => bridalReport.id, { onDelete: "cascade" }),
    recommendationId: text("recommendation_id")
      .notNull()
      .references(() => bridalRecommendation.id, { onDelete: "cascade" }),
    sessionId: text("session_id")
      .notNull()
      .references(() => bridalAnonymousSession.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    type: varchar("type", { length: 32 }).notNull(),
    r2Key: text("r2_key"),
    thumbnailR2Key: text("thumbnail_r2_key"),
    generationStatus: varchar("generation_status", { length: 32 }).default("pending").notNull(),
    seedreamPrompt: text("seedream_prompt").notNull(),
    promptVersion: varchar("prompt_version", { length: 32 }).notNull(),
    retryCount: integer("retry_count").default(0).notNull(),
    errorMessage: text("error_message"),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  table => ({
    imageTypeUnique: uniqueIndex("bridal_generated_image_type_unique").on(
      table.recommendationId,
      table.type,
    ),
    reportIdx: index("bridal_generated_image_report_idx").on(table.reportId),
    statusIdx: index("bridal_generated_image_status_idx").on(table.generationStatus),
  }),
);

export const bridalPayment = pgTable(
  "bridal_payment",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sessionId: text("session_id").references(() => bridalAnonymousSession.id, { onDelete: "set null" }),
    reportId: text("report_id")
      .notNull()
      .references(() => bridalReport.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 32 }).default("creem").notNull(),
    amountCents: integer("amount_cents").default(1990).notNull(),
    currency: varchar("currency", { length: 8 }).default("usd").notNull(),
    status: varchar("status", { length: 32 }).default("pending").notNull(),
    creemCheckoutId: text("creem_checkout_id"),
    creemPaymentId: text("creem_payment_id"),
    raw: text("raw"),
    refundReason: text("refund_reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    paidAt: timestamp("paid_at"),
  },
  table => ({
    checkoutUnique: uniqueIndex("bridal_payment_creem_checkout_unique").on(table.creemCheckoutId),
    paymentUnique: uniqueIndex("bridal_payment_creem_payment_unique").on(table.creemPaymentId),
    reportIdx: index("bridal_payment_report_idx").on(table.reportId),
    userIdx: index("bridal_payment_user_idx").on(table.userId),
  }),
);

export const bridalShareToken = pgTable(
  "bridal_share_token",
  {
    id: text("id").primaryKey(),
    reportId: text("report_id")
      .notNull()
      .references(() => bridalReport.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    enabled: boolean("enabled").default(true).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  table => ({
    reportIdx: index("bridal_share_token_report_idx").on(table.reportId),
    expiresAtIdx: index("bridal_share_token_expires_at_idx").on(table.expiresAt),
  }),
);

export const bridalVote = pgTable(
  "bridal_vote",
  {
    id: text("id").primaryKey(),
    reportId: text("report_id")
      .notNull()
      .references(() => bridalReport.id, { onDelete: "cascade" }),
    recommendationId: text("recommendation_id")
      .notNull()
      .references(() => bridalRecommendation.id, { onDelete: "cascade" }),
    voteType: varchar("vote_type", { length: 32 }).notNull(),
    voterName: text("voter_name"),
    voterIpHash: text("voter_ip_hash").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  table => ({
    voterUnique: uniqueIndex("bridal_vote_voter_unique").on(
      table.reportId,
      table.voterIpHash,
      table.voteType,
    ),
    reportIdx: index("bridal_vote_report_idx").on(table.reportId),
  }),
);

export const bridalGenerationJob = pgTable(
  "bridal_generation_job",
  {
    id: text("id").primaryKey(),
    reportId: text("report_id")
      .notNull()
      .references(() => bridalReport.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 32 }).notNull(),
    status: varchar("status", { length: 32 }).default("pending").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    retryCount: integer("retry_count").default(0).notNull(),
    lastError: text("last_error"),
    lockedAt: timestamp("locked_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  table => ({
    pendingIdx: index("bridal_generation_job_pending_idx").on(table.status, table.createdAt),
    reportIdx: index("bridal_generation_job_report_idx").on(table.reportId),
  }),
);

// Password reset tokens
export const passwordResetToken = pgTable("password_reset_token", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Newsletter subscriptions
export const newsletterSubscription = pgTable("newsletter_subscription", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  status: varchar("status", { length: 16 }).notNull().default("active"), // active, unsubscribed
  unsubscribeToken: text("unsubscribe_token").notNull().unique(),
  subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
  unsubscribedAt: timestamp("unsubscribed_at"),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});
