import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { eq } from "drizzle-orm";
import {
  ArrowRight,
  Check,
  Download,
  FileText,
  LockKeyhole,
  Scissors,
  Shirt,
  Sparkles,
  WalletCards,
  X,
} from "lucide-react";
import { Button } from "@/components/button";
import { db } from "@/lib/db";
import { getPlaceholderBridalImageUrl } from "@/lib/bridal/images";
import {
  bridalGeneratedImage,
  bridalRecommendation,
  bridalReport,
} from "@/lib/db/schema";
import { canAccessBridalResource } from "@/lib/bridal/permissions";
import { getBridalSessionIdFromCookies } from "@/lib/bridal/session";
import { generatePageMetadata } from "@/lib/metadata";
import { getVerifiedCreemReturnUrlPayload } from "@/lib/payments/creem";
import { unlockBridalReportFromCreemReturn } from "@/lib/bridal/payment";
import type { Locale } from "@/i18n.config";
import type { ElementType } from "react";
import { BridalUnlockButton } from "./unlock-button";
import { GenerateFullReportButton } from "./generate-full-button";
import Image from "next/image";
import { PaymentConfirmationRefresh } from "./payment-confirmation-refresh";
import { BridalShareButton } from "./share-button";

export async function generateMetadata(
  props: {
    params: Promise<{ locale: Locale; reportId: string }>;
  },
): Promise<Metadata> {
  const { locale, reportId } = await props.params;
  const t = await getTranslations({ locale, namespace: "bridalReport" });

  return generatePageMetadata({
    locale,
    path: `/report/${reportId}`,
    title: t("meta.title"),
    description: t("meta.description"),
  });
}

export default async function BridalReportPage(
  props: {
    params: Promise<{ locale: Locale; reportId: string }>;
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
  },
) {
  const { reportId } = await props.params;
  const searchParams = props.searchParams ? await props.searchParams : {};
  const creemReturnPayload = getVerifiedCreemReturnUrlPayload(searchParams);
  const returnedFromPayment =
    searchParams.success === "1" ||
    Boolean(creemReturnPayload);
  const t = await getTranslations("bridalReport");
  const sessionId = await getBridalSessionIdFromCookies();

  const [initialReport] = await db
    .select()
    .from(bridalReport)
    .where(eq(bridalReport.id, reportId))
    .limit(1);

  if (!initialReport || !canAccessBridalResource({ sessionId, resource: initialReport })) {
    notFound();
  }

  const report = await unlockBridalReportFromCreemReturn({
    report: initialReport,
    payload: creemReturnPayload,
  });

  const recommendations = await db
    .select()
    .from(bridalRecommendation)
    .where(eq(bridalRecommendation.reportId, report.id))
    .orderBy(bridalRecommendation.rank);

  if (recommendations.length === 0) {
    notFound();
  }

  const generatedImages = await db
    .select()
    .from(bridalGeneratedImage)
    .where(eq(bridalGeneratedImage.reportId, report.id));

  const imageByRecommendationId = new Map(
    generatedImages
      .filter(image => image.generationStatus === "success" && !image.errorMessage && image.r2Key && image.type === "full_body")
      .map(image => [image.recommendationId, image]),
  );
  const imageByRecommendationAndType = new Map(
    generatedImages
      .filter(image => image.generationStatus === "success" && !image.errorMessage && image.r2Key)
      .map(image => [`${image.recommendationId}:${image.type}`, image.r2Key as string]),
  );
  const cleanPrimaryVisualCount = generatedImages
    .filter(image => image.generationStatus === "success" && !image.errorMessage && image.r2Key && image.type === "full_body")
    .length;
  const failedPrimaryVisualCount = generatedImages
    .filter(image => image.generationStatus === "failed" && image.type === "full_body")
    .length;
  const fullReportImageProgress = {
    success: cleanPrimaryVisualCount,
    failed: failedPrimaryVisualCount,
    total: 3,
  };
  const paidVisualsIncomplete = report.isPaid && cleanPrimaryVisualCount < fullReportImageProgress.total;

  const price = `$${(report.priceCents / 100).toFixed(2)}`;
  const budgetMin = Math.min(...recommendations.map(recommendation => recommendation.budgetMin));
  const budgetMax = Math.max(...recommendations.map(recommendation => recommendation.budgetMax));
  const leadingRecommendation = recommendations[0];
  const leadingPreviewImageUrl = leadingRecommendation
    ? imageByRecommendationId.get(leadingRecommendation.id)?.r2Key
    : null;
  return (
    <main className="min-h-screen bg-[#f7f2ea] px-6 py-16 text-[#1f1b16]">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <section>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#756a5c]">
              {t("eyebrow")}
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
              {t("title")}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-[#655d52]">
              {t("description")}
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <SummaryMetric label={t("summary.directions")} value={recommendations.length.toString()} />
              <SummaryMetric
                label={t("summary.budgetRange")}
                value={`$${budgetMin.toLocaleString()}-$${budgetMax.toLocaleString()}`}
              />
              <SummaryMetric
                label={t("summary.status")}
                value={report.isPaid ? t("summary.unlocked") : t("summary.preview")}
              />
            </div>
          </section>

          <aside className="rounded-lg border border-[#d8cdbd] bg-[#fffaf3] p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                {report.isPaid ? <Check className="h-5 w-5" /> : <LockKeyhole className="h-5 w-5" />}
              </div>
              <div>
                <p className="font-semibold">
                  {report.isPaid ? t("unlock.paidTitle") : t("unlock.title")}
                </p>
                <p className="text-sm text-[#655d52]">
                  {report.isPaid ? t("unlock.paidDescription") : t("unlock.description", { price })}
                </p>
              </div>
            </div>

            {!report.isPaid && (
              <BridalUnlockButton reportId={report.id} price={price} className="mt-6" />
            )}

            <div className="mt-6 space-y-3 text-sm text-[#655d52]">
              {["visuals", "details", "scripts"].map(key => (
                <div key={key} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>{t(`unlock.includes.${key}`)}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>

        {!report.isPaid && leadingRecommendation && (
          <section className="mt-10 rounded-lg border border-[#d8cdbd] bg-[#fffaf3] p-6 shadow-sm">
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <p className="text-sm font-medium text-[#756a5c]">
                  {t("snapshot.label")}
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  {t("snapshot.title", { name: leadingRecommendation.styleName })}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[#655d52]">
                  {t("snapshot.description")}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <DecisionTile
                  icon={Shirt}
                  label={t("recommendation.neckline")}
                  value={leadingRecommendation.neckline}
                />
                <DecisionTile
                  icon={Scissors}
                  label={t("recommendation.silhouette")}
                  value={leadingRecommendation.silhouette}
                />
                <DecisionTile
                  icon={WalletCards}
                  label={t("recommendation.budget")}
                  value={`$${leadingRecommendation.budgetMin.toLocaleString()}-$${leadingRecommendation.budgetMax.toLocaleString()}`}
                />
              </div>
            </div>
          </section>
        )}

        {!report.isPaid && leadingRecommendation && (
          <section className="mt-8 rounded-lg border border-[#d8cdbd] bg-[#fffaf3] p-5 shadow-sm md:p-8">
            <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
              <div className="overflow-hidden rounded-lg border border-[#d8cdbd] bg-white">
                <div className="grid gap-0 md:grid-cols-[0.85fr_1.15fr]">
                  <Image
                    src={leadingPreviewImageUrl ?? getPlaceholderBridalImageUrl(leadingRecommendation.rank)}
                    alt={t("recommendation.imageAlt", { name: leadingRecommendation.styleName })}
                    width={900}
                    height={1100}
                    className="h-full min-h-[360px] w-full bg-white object-contain object-center"
                    unoptimized
                  />
                  <div className="p-6">
                    <p className="text-sm font-medium text-[#756a5c]">
                      {t("recommendation.rank", { rank: leadingRecommendation.rank })}
                    </p>
                    <h2 className="mt-3 text-3xl font-semibold">
                      {leadingRecommendation.styleName}
                    </h2>
                    <p className="mt-4 text-sm leading-7 text-[#655d52]">
                      {leadingRecommendation.whyItWorks}
                    </p>
                    <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                      <Fact icon={Scissors} label={t("recommendation.silhouette")} value={leadingRecommendation.silhouette} />
                      <Fact icon={Shirt} label={t("recommendation.neckline")} value={leadingRecommendation.neckline} />
                      <Fact icon={Sparkles} label={t("recommendation.fabric")} value={leadingRecommendation.fabric} />
                      <Fact
                        icon={WalletCards}
                        label={t("recommendation.budget")}
                        value={`$${leadingRecommendation.budgetMin.toLocaleString()}-$${leadingRecommendation.budgetMax.toLocaleString()}`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <aside className="rounded-lg border border-[#d8cdbd] bg-white/70 p-6">
                <LockKeyhole className="h-6 w-6 text-primary" />
                <h2 className="mt-4 text-2xl font-semibold">
                  {t("previewUnlock.title")}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[#655d52]">
                  {t("previewUnlock.description")}
                </p>
                <BridalUnlockButton reportId={report.id} price={price} className="mt-6" />
              </aside>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {recommendations.map(recommendation => (
                <button
                  key={recommendation.id}
                  type="button"
                  className={
                    recommendation.rank === 1
                      ? "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                      : "rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground"
                  }
                  disabled={recommendation.rank !== 1}
                >
                  {t("recommendation.planButton", { rank: recommendation.rank })}
                </button>
              ))}
            </div>

              <div className="mt-5 rounded-lg border border-[#d8cdbd] bg-white/70 p-6 md:p-8">
              <div className="mx-auto max-w-4xl">
                  <p className="text-sm font-medium uppercase tracking-[0.14em] text-[#756a5c]">
                  {t("recommendation.detailEyebrow")}
                </p>
                  <h2 className="mt-3 text-3xl font-semibold">
                  {t("recommendation.detailTitle", { name: leadingRecommendation.styleName })}
                </h2>
                  <p className="mt-3 text-sm leading-7 text-[#655d52]">
                  {t("recommendation.visualReportIntro")}
                </p>

                <VisualAnalysisBoard
                  imageUrl={leadingPreviewImageUrl ?? getPlaceholderBridalImageUrl(leadingRecommendation.rank)}
                  imageAlt={t("recommendation.imageAlt", { name: leadingRecommendation.styleName })}
                  reportId={report.id}
                  price={price}
                  labels={{
                    visualMapTitle: t("recommendation.visualMapTitle"),
                    openPreview: t("recommendation.openPreview"),
                    lockedBelow: t("recommendation.lockedBelow"),
                    neckline: t("detailCaptions.neckline"),
                    waist: t("detailCaptions.waist"),
                    sleeve: t("detailCaptions.sleeve"),
                    textPlan: t("recommendation.textPlan"),
                  }}
                  captions={leadingRecommendation.detailCaptions}
                  writtenPlan={{
                    venueTitle: t("recommendation.venueMatch"),
                    venue: leadingRecommendation.venueMatch,
                    whyTitle: t("recommendation.whyItWorks"),
                    why: leadingRecommendation.whyItWorks,
                    avoidTitle: t("recommendation.whatToAvoid"),
                    avoid: leadingRecommendation.whatToAvoid,
                    tryTitle: t("recommendation.tryFirst"),
                    tryItems: leadingRecommendation.tryFirst,
                    skipTitle: t("recommendation.skipFirst"),
                    skipItems: leadingRecommendation.skipFirst,
                    budgetTitle: t("budget.title"),
                    budget: leadingRecommendation.budgetGuardrail,
                    scriptTitle: t("recommendation.storeScript"),
                    script: leadingRecommendation.consultantScript,
                    deliverablesTitle: t("recommendation.fullDeliverables"),
                    deliverables: t("recommendation.fullDeliverablesDescription"),
                    pdfLabel: t("deliverables.pdf"),
                    shareLabel: t("deliverables.share"),
                  }}
                />
              </div>
            </div>
          </section>
        )}

        {report.isPaid && (
          <section className="mt-10">
            <div className="rounded-lg border border-[#d8cdbd] bg-[#fffaf3] p-6 shadow-sm md:p-8">
              <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#756a5c]">
                    {t("recommendation.fullReportEyebrow")}
                  </p>
                  <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight md:text-5xl">
                    {t("recommendation.sectionTitle")}
                  </h2>
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-[#655d52] md:text-base">
                    {t("recommendation.sectionPaid")}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <SummaryMetric label={t("recommendation.summaryPlans")} value="3" />
                  <SummaryMetric label={t("recommendation.summaryVisuals")} value="12" />
                  <SummaryMetric label={t("recommendation.summaryTools")} value={t("recommendation.summaryToolsValue")} />
                </div>
              </div>

              <div className="mt-8 grid gap-3 md:grid-cols-3">
                {recommendations.map(recommendation => (
                  <Button
                    key={recommendation.id}
                    as={Link}
                    href={`#direction-${recommendation.rank}`}
                    variant="outline"
                    className="h-auto justify-start rounded-lg border-[#d8cdbd] bg-white/70 p-4 text-left hover:bg-white"
                  >
                    <span className="block">
                      <span className="block text-xs font-medium uppercase tracking-[0.16em] text-[#756a5c]">
                        {t("recommendation.planButton", { rank: recommendation.rank })}
                      </span>
                      <span className="mt-2 block text-sm font-semibold text-[#1f1b16]">
                        {recommendation.styleName}
                      </span>
                      <span className="mt-1 block text-xs font-normal text-[#655d52]">
                        {recommendation.silhouette}
                      </span>
                    </span>
                  </Button>
                ))}
              </div>

              {paidVisualsIncomplete && (
                <div className="mt-8">
                  <GenerateFullReportButton
                    reportId={report.id}
                    autoStart={returnedFromPayment || report.status === "generating"}
                    initialProgress={fullReportImageProgress}
                  />
                </div>
              )}
            </div>

            <div className="mt-8 space-y-8">
              {recommendations.map((recommendation) => {
                const imageUrl = imageByRecommendationId.get(recommendation.id)?.r2Key ?? undefined;

                return (
                  <FullRecommendationReport
                    key={recommendation.id}
                    recommendation={recommendation}
                    imageUrl={imageUrl}
                    imageAlt={t("recommendation.imageAlt", { name: recommendation.styleName })}
                    detailImages={{
                      neckline: imageByRecommendationAndType.get(`${recommendation.id}:neckline_detail`),
                      waist: imageByRecommendationAndType.get(`${recommendation.id}:waist_detail`),
                      sleeve: imageByRecommendationAndType.get(`${recommendation.id}:sleeve_detail`),
                    }}
                    labels={{
                      rank: t("recommendation.rank", { rank: recommendation.rank }),
                      silhouette: t("recommendation.silhouette"),
                      neckline: t("recommendation.neckline"),
                      fabric: t("recommendation.fabric"),
                      budget: t("recommendation.budget"),
                      venueMatch: t("recommendation.venueMatch"),
                      whyItWorks: t("recommendation.whyItWorks"),
                      whatToAvoid: t("recommendation.whatToAvoid"),
                      tryFirst: t("recommendation.tryFirst"),
                      skipFirst: t("recommendation.skipFirst"),
                      storeScript: t("recommendation.storeScript"),
                      salesPressure: t("recommendation.salesPressureReminder"),
                      detailTitle: t("detailCaptions.title"),
                      atAGlance: t("recommendation.atAGlance"),
                      detailNeckline: t("detailCaptions.neckline"),
                      detailWaist: t("detailCaptions.waist"),
                      detailSleeve: t("detailCaptions.sleeve"),
                      budgetTitle: t("budget.title"),
                      generatingFullBody: t("fullGeneration.placeholders.fullBody"),
                      generatingDetail: t("fullGeneration.placeholders.detail"),
                      generatingHint: t("fullGeneration.placeholders.hint"),
                    }}
                  />
                );
              })}
            </div>
          </section>
        )}

        {report.isPaid && (
          <section className="mt-8 rounded-lg border border-[#d8cdbd] bg-[#fffaf3] p-8 shadow-sm">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <h2 className="text-2xl font-semibold">
                  {t("deliverables.title")}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#655d52]">
                  {t("deliverables.description")}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button as={Link} href={`/api/bridal/report/${report.id}/export`} target="_blank" variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  {t("deliverables.pdf")}
                </Button>
                <BridalShareButton reportId={report.id} />
              </div>
            </div>
          </section>
        )}

        {!report.isPaid && returnedFromPayment && <PaymentConfirmationRefresh />}
      </div>
    </main>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-[#e4dacb] bg-white/60 p-3">
      <div className="flex items-center gap-2 text-xs text-[#756a5c]">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <p className="mt-2 text-sm font-medium">{value}</p>
    </div>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#d8cdbd] bg-[#fffaf3] p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#756a5c]">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}

function DecisionTile({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-[#e4dacb] bg-white/60 p-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase text-[#756a5c]">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <div className="mt-3 flex items-center gap-2 text-sm font-medium">
        <ArrowRight className="h-4 w-4 text-primary" />
        <span>{value}</span>
      </div>
    </div>
  );
}

function FullRecommendationReport({
  recommendation,
  imageUrl,
  imageAlt,
  detailImages,
  labels,
}: {
  recommendation: {
    id: string;
    rank: number;
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
  imageUrl?: string;
  imageAlt: string;
  detailImages: {
    neckline?: string;
    waist?: string;
    sleeve?: string;
  };
  labels: {
    rank: string;
    silhouette: string;
    neckline: string;
    fabric: string;
    budget: string;
    venueMatch: string;
    whyItWorks: string;
    whatToAvoid: string;
    tryFirst: string;
    skipFirst: string;
    storeScript: string;
    salesPressure: string;
    detailTitle: string;
    atAGlance: string;
    detailNeckline: string;
    detailWaist: string;
    detailSleeve: string;
    budgetTitle: string;
    generatingFullBody: string;
    generatingDetail: string;
    generatingHint: string;
  };
}) {
  return (
    <article id={`direction-${recommendation.rank}`} className="scroll-mt-24 overflow-hidden rounded-lg border border-[#d8cdbd] bg-[#fffaf3] shadow-sm">
      <div className="border-b border-[#d8cdbd] bg-[#f3eadc] px-6 py-5 md:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#756a5c]">
              {labels.rank}
            </p>
            <h3 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight md:text-4xl">
              {recommendation.styleName}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-medium text-[#5f694c]">
            <span className="rounded-full border border-[#d8cdbd] bg-white/70 px-3 py-1">
              {recommendation.silhouette}
            </span>
            <span className="rounded-full border border-[#d8cdbd] bg-white/70 px-3 py-1">
              {recommendation.neckline}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-0 xl:grid-cols-[minmax(360px,0.92fr)_1.08fr]">
        <div className="border-b border-[#d8cdbd] bg-white xl:border-b-0 xl:border-r">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={imageAlt}
              width={1100}
              height={1400}
              className="h-[620px] w-full bg-white object-contain object-center xl:h-full xl:min-h-[900px]"
              unoptimized
            />
          ) : (
            <GeneratingVisualPlaceholder
              title={labels.generatingFullBody}
              description={labels.generatingHint}
              className="h-[620px] xl:h-full xl:min-h-[900px]"
            />
          )}
        </div>

        <div className="p-6 md:p-8">
          <div>
            <p className="text-sm font-semibold text-[#1f1b16]">
              {labels.atAGlance}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Fact icon={Scissors} label={labels.silhouette} value={recommendation.silhouette} />
              <Fact icon={Shirt} label={labels.neckline} value={recommendation.neckline} />
              <Fact icon={Sparkles} label={labels.fabric} value={recommendation.fabric} />
              <Fact
                icon={WalletCards}
                label={labels.budget}
                value={`$${recommendation.budgetMin.toLocaleString()}-$${recommendation.budgetMax.toLocaleString()}`}
              />
            </div>
          </div>

          <div className="mt-7 grid gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Section title={labels.whyItWorks} body={recommendation.whyItWorks} />
            </div>
            <Section title={labels.venueMatch} body={recommendation.venueMatch} />
          </div>

          <div className="mt-7 grid gap-4 lg:grid-cols-3">
            <div className="rounded-lg border border-[#e4dacb] bg-white/70 p-5">
              <p className="text-sm font-medium">
                {labels.tryFirst}
              </p>
              <ul className="mt-3 space-y-2 text-sm text-[#655d52]">
                {recommendation.tryFirst.map(item => (
                  <li key={item} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 flex-none text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-[#e4dacb] bg-white/70 p-5">
              <p className="text-sm font-medium">
                {labels.skipFirst}
              </p>
              <ul className="mt-3 space-y-2 text-sm text-[#655d52]">
                {recommendation.skipFirst.map(item => (
                  <li key={item} className="flex gap-2">
                    <X className="mt-0.5 h-4 w-4 flex-none text-muted-foreground" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-[#e4dacb] bg-white/70 p-5">
              <Section title={labels.whatToAvoid} body={recommendation.whatToAvoid} muted />
            </div>
          </div>

          <div className="mt-7">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h4 className="text-xl font-semibold">
                {labels.detailTitle}
              </h4>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <ImageCaption
                imageUrl={detailImages.neckline}
                label={labels.detailNeckline}
                value={recommendation.detailCaptions.neckline}
                placeholderTitle={labels.generatingDetail}
                placeholderDescription={labels.generatingHint}
              />
              <ImageCaption
                imageUrl={detailImages.waist}
                label={labels.detailWaist}
                value={recommendation.detailCaptions.waist}
                placeholderTitle={labels.generatingDetail}
                placeholderDescription={labels.generatingHint}
              />
              <ImageCaption
                imageUrl={detailImages.sleeve}
                label={labels.detailSleeve}
                value={recommendation.detailCaptions.sleeve}
                placeholderTitle={labels.generatingDetail}
                placeholderDescription={labels.generatingHint}
              />
            </div>
          </div>

          <div className="mt-7 grid gap-5 lg:grid-cols-2">
            <div className="rounded-lg border border-[#e4dacb] bg-white/70 p-5">
              <p className="text-sm font-medium">
                {labels.budgetTitle}
              </p>
              <p className="mt-3 text-sm leading-6 text-[#655d52]">
                {recommendation.budgetGuardrail}
              </p>
            </div>

            <div className="rounded-lg border border-[#d8cdbd] bg-[#f3eadc] p-5">
              <p className="text-sm font-medium">
                {labels.storeScript}
              </p>
              <p className="mt-3 text-sm leading-6 text-[#655d52]">
                &ldquo;{recommendation.consultantScript}&rdquo;
              </p>
              <p className="mt-3 border-t border-[#d8cdbd] pt-3 text-sm leading-6 text-[#655d52]">
                <span className="font-medium text-[#1f1b16]">{labels.salesPressure}: </span>
                {recommendation.salesPressureReminder}
              </p>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function VisualAnalysisBoard({
  imageUrl,
  imageAlt,
  reportId,
  price,
  labels,
  captions,
  writtenPlan,
}: {
  imageUrl: string;
  imageAlt: string;
  reportId: string;
  price: string;
  labels: {
    visualMapTitle: string;
    openPreview: string;
    lockedBelow: string;
    neckline: string;
    waist: string;
    sleeve: string;
    textPlan: string;
  };
  captions: {
    neckline: string;
    waist: string;
    sleeve: string;
  };
  writtenPlan: {
    venueTitle: string;
    venue: string;
    whyTitle: string;
    why: string;
    avoidTitle: string;
    avoid: string;
    tryTitle: string;
    tryItems: string[];
    skipTitle: string;
    skipItems: string[];
    budgetTitle: string;
    budget: string;
    scriptTitle: string;
    script: string;
    deliverablesTitle: string;
    deliverables: string;
    pdfLabel: string;
    shareLabel: string;
  };
}) {
  return (
    <div className="relative mt-6 overflow-hidden rounded-lg border border-[#d8cdbd] bg-[#fffaf3] p-4 shadow-sm md:p-7">
      <div className="mb-6 flex flex-col gap-3 border-b border-[#e4dacb] pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#756a5c]">
            {labels.openPreview}
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-[#1f1b16]">
            {labels.visualMapTitle}
          </h3>
        </div>
        <p className="max-w-sm text-sm leading-6 text-[#655d52]">
          {labels.lockedBelow}
        </p>
      </div>

      <div className="relative mx-auto max-w-6xl pb-4">
        <div className="grid gap-5 lg:grid-cols-[minmax(220px,0.82fr)_minmax(280px,390px)_minmax(220px,0.82fr)] lg:items-start">
          <div className="order-2 grid gap-5 lg:order-1">
            <CalloutBox label={labels.neckline} value={captions.neckline} />
            <CalloutBox label={labels.waist} value={captions.waist} />
          </div>

          <div className="order-1 overflow-hidden rounded-lg border border-[#d8cdbd] bg-white shadow-sm lg:order-2">
            <Image
              src={imageUrl}
              alt={imageAlt}
              width={900}
              height={1400}
              className="h-[520px] w-full bg-white object-contain object-center lg:h-[660px]"
              unoptimized
            />
          </div>

          <div className="order-3 grid gap-5">
            <CalloutBox label={labels.sleeve} value={captions.sleeve} />
            <div className="rounded-lg border border-[#e4dacb] bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-[#1f1b16]">
                {labels.textPlan}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#655d52]">
                {writtenPlan.venue}
              </p>
            </div>
          </div>

          <div className="pointer-events-none absolute left-[23%] top-[6.5rem] hidden h-px w-[18%] rotate-12 border-t border-dashed border-[#756a5c]/60 lg:block" />
          <div className="pointer-events-none absolute left-[23%] top-[18rem] hidden h-px w-[18%] rotate-6 border-t border-dashed border-[#756a5c]/60 lg:block" />
          <div className="pointer-events-none absolute right-[23%] top-[12rem] hidden h-px w-[18%] -rotate-12 border-t border-dashed border-[#756a5c]/60 lg:block" />
        </div>

        <div className="mt-6">
          <div className="rounded-lg border border-[#d8cdbd] bg-white p-5 lg:p-6">
            <p className="text-center text-sm font-semibold text-[#1f1b16]">
              {labels.textPlan}
            </p>
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <div className="space-y-5 rounded-lg border border-[#e4dacb] bg-[#fffaf3] p-4">
                <Section title={writtenPlan.venueTitle} body={writtenPlan.venue} />
                <Section title={writtenPlan.whyTitle} body={writtenPlan.why} />
                <Section title={writtenPlan.avoidTitle} body={writtenPlan.avoid} muted />
              </div>
              <div className="rounded-lg border border-[#e4dacb] bg-[#fffaf3] p-4">
                <p className="text-sm font-medium text-[#1f1b16]">
                  {writtenPlan.tryTitle}
                </p>
                <ul className="mt-3 space-y-2 text-sm text-[#655d52]">
                  {writtenPlan.tryItems.map(item => (
                    <li key={item} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 flex-none text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-[#e4dacb] bg-[#fffaf3] p-4">
                <p className="text-sm font-medium text-[#1f1b16]">
                  {writtenPlan.skipTitle}
                </p>
                <ul className="mt-3 space-y-2 text-sm text-[#655d52]">
                  {writtenPlan.skipItems.map(item => (
                    <li key={item} className="flex gap-2">
                      <X className="mt-0.5 h-4 w-4 flex-none text-muted-foreground" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-[#e4dacb] bg-[#fffaf3] p-4">
                <p className="text-sm font-medium text-[#1f1b16]">
                  {writtenPlan.budgetTitle}
                </p>
                <p className="mt-3 text-sm leading-6 text-[#655d52]">
                  {writtenPlan.budget}
                </p>
              </div>
              <div className="rounded-lg border border-[#d8cdbd] bg-[#f3eadc] p-4">
                <p className="text-sm font-medium text-[#1f1b16]">
                  {writtenPlan.scriptTitle}
                </p>
                <p className="mt-3 text-sm leading-6 text-[#655d52]">
                  &ldquo;{writtenPlan.script}&rdquo;
                </p>
              </div>
              <div className="rounded-lg border border-[#e4dacb] bg-[#fffaf3] p-4">
                <p className="text-sm font-medium text-[#1f1b16]">
                  {writtenPlan.deliverablesTitle}
                </p>
                <p className="mt-3 text-sm leading-6 text-[#655d52]">
                  {writtenPlan.deliverables}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button type="button" variant="outline" disabled>
                    <Download className="mr-2 h-4 w-4" />
                    {writtenPlan.pdfLabel}
                  </Button>
                  <Button type="button" variant="outline" disabled>
                    <FileText className="mr-2 h-4 w-4" />
                    {writtenPlan.shareLabel}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 top-[42%] z-20 bg-[#fffaf3]/35 backdrop-blur-md [mask-image:linear-gradient(to_bottom,transparent,black_14%,black)]" />
      <div className="pointer-events-none absolute inset-x-5 top-[42%] z-30 border-t border-dashed border-[#756a5c]/45 md:inset-x-8" />
      <div className="absolute left-1/2 top-[42%] z-40 -translate-x-1/2 -translate-y-1/2">
        <BridalUnlockButton reportId={reportId} price={price} />
      </div>
    </div>
  );
}

function CalloutBox({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className={muted ? "rounded-lg border border-dashed border-[#d8cdbd] bg-white/80 p-4" : "rounded-lg border border-[#e4dacb] bg-white p-4 shadow-sm"}>
      <p className="text-sm font-semibold text-[#1f1b16]">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-[#655d52]">
        {value}
      </p>
    </div>
  );
}

function Section({
  title,
  body,
  muted = false,
}: {
  title: string;
  body: string;
  muted?: boolean;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className={muted ? "mt-2 text-sm leading-6 text-muted-foreground" : "mt-2 text-sm leading-6 text-foreground/80"}>
        {body}
      </p>
    </div>
  );
}

function Caption({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 leading-6 text-foreground/80">{value}</p>
    </div>
  );
}

function ImageCaption({
  imageUrl,
  label,
  value,
  placeholderTitle,
  placeholderDescription,
}: {
  imageUrl?: string;
  label: string;
  value: string;
  placeholderTitle?: string;
  placeholderDescription?: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={label}
          width={720}
          height={480}
          className="h-40 w-full object-cover object-top"
          unoptimized
        />
      ) : (
        <GeneratingVisualPlaceholder
          title={placeholderTitle ?? label}
          description={placeholderDescription ?? ""}
          className="h-40"
          compact
        />
      )}
      <div className="p-4">
        <Caption label={label} value={value} />
      </div>
    </div>
  );
}

function GeneratingVisualPlaceholder({
  title,
  description,
  className = "",
  compact = false,
}: {
  title: string;
  description: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={`relative flex w-full items-center justify-center overflow-hidden bg-[#efe5d6] ${className}`}>
      <div className="absolute inset-0 animate-pulse bg-[linear-gradient(110deg,rgba(255,250,243,0.2),rgba(255,255,255,0.82),rgba(255,250,243,0.2))]" />
      <div className="absolute inset-0 backdrop-blur-sm" />
      <div className={compact ? "relative z-10 px-4 text-center" : "relative z-10 max-w-xs px-6 text-center"}>
        <Sparkles className={compact ? "mx-auto h-4 w-4 text-[#756a5c]" : "mx-auto h-7 w-7 text-[#756a5c]"} />
        <p className={compact ? "mt-2 text-xs font-semibold text-[#1f1b16]" : "mt-4 text-lg font-semibold text-[#1f1b16]"}>
          {title}
        </p>
        {description && (
          <p className={compact ? "mt-1 text-[11px] leading-4 text-[#655d52]" : "mt-2 text-sm leading-6 text-[#655d52]"}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
