import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { desc, eq } from "drizzle-orm";
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
  bridalUploadedPhoto,
} from "@/lib/db/schema";
import { canAccessBridalResource } from "@/lib/bridal/permissions";
import { getBridalSessionIdFromCookies } from "@/lib/bridal/session";
import { generatePageMetadata } from "@/lib/metadata";
import { getR2PublicUrl } from "@/lib/r2-storage";
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
    searchParams?: Promise<{ success?: string }>;
  },
) {
  const { reportId } = await props.params;
  const searchParams = props.searchParams ? await props.searchParams : {};
  const returnedFromPayment = searchParams.success === "1";
  const t = await getTranslations("bridalReport");
  const sessionId = await getBridalSessionIdFromCookies();

  const [report] = await db
    .select()
    .from(bridalReport)
    .where(eq(bridalReport.id, reportId))
    .limit(1);

  if (!report || !canAccessBridalResource({ sessionId, resource: report })) {
    notFound();
  }

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

  const [uploadedPhoto] = await db
    .select({
      r2Key: bridalUploadedPhoto.r2Key,
      processedR2Key: bridalUploadedPhoto.processedR2Key,
    })
    .from(bridalUploadedPhoto)
    .where(eq(bridalUploadedPhoto.sessionId, report.sessionId))
    .orderBy(desc(bridalUploadedPhoto.createdAt))
    .limit(1);

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
  const hasSuccessfulImages = imageByRecommendationId.size > 0;

  const price = `$${(report.priceCents / 100).toFixed(2)}`;
  const budgetMin = Math.min(...recommendations.map(recommendation => recommendation.budgetMin));
  const budgetMax = Math.max(...recommendations.map(recommendation => recommendation.budgetMax));
  const leadingRecommendation = recommendations[0];
  const referenceImageUrl = uploadedPhoto
    ? getR2PublicUrl(uploadedPhoto.processedR2Key ?? uploadedPhoto.r2Key)
    : null;

  return (
    <main className="min-h-screen bg-background px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <section>
            <p className="text-sm font-medium uppercase text-muted-foreground">
              {t("eyebrow")}
            </p>
            <h1 className="mt-4 text-4xl font-semibold text-foreground md:text-6xl">
              {t("title")}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-muted-foreground">
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

          <aside className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                {report.isPaid ? <Check className="h-5 w-5" /> : <LockKeyhole className="h-5 w-5" />}
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {report.isPaid ? t("unlock.paidTitle") : t("unlock.title")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {report.isPaid ? t("unlock.paidDescription") : t("unlock.description", { price })}
                </p>
              </div>
            </div>

            {!report.isPaid && (
              <BridalUnlockButton reportId={report.id} price={price} className="mt-6" />
            )}

            <div className="mt-6 space-y-3 text-sm text-muted-foreground">
              {["visuals", "details", "scripts"].map(key => (
                <div key={key} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>{t(`unlock.includes.${key}`)}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>

        {leadingRecommendation && (
          <section className="mt-10 rounded-lg border border-border bg-card p-6">
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("snapshot.label")}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-foreground">
                  {t("snapshot.title", { name: leadingRecommendation.styleName })}
                </h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
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
          <section className="mt-8 rounded-lg border border-border bg-card p-5 md:p-8">
            <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
              <div className="overflow-hidden rounded-lg border border-border bg-background">
                <div className="grid gap-0 md:grid-cols-[0.85fr_1.15fr]">
                  <Image
                    src={referenceImageUrl ?? getPlaceholderBridalImageUrl(leadingRecommendation.rank)}
                    alt={t("recommendation.imageAlt", { name: leadingRecommendation.styleName })}
                    width={900}
                    height={1100}
                    className="h-full min-h-[360px] w-full object-cover object-top"
                    unoptimized
                  />
                  <div className="p-6">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("recommendation.rank", { rank: leadingRecommendation.rank })}
                    </p>
                    <h2 className="mt-3 text-3xl font-semibold text-foreground">
                      {leadingRecommendation.styleName}
                    </h2>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">
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

              <aside className="rounded-lg border border-border bg-background p-6">
                <LockKeyhole className="h-6 w-6 text-primary" />
                <h2 className="mt-4 text-2xl font-semibold text-foreground">
                  {t("previewUnlock.title")}
                </h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
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

            <div className="mt-5 rounded-lg border border-border bg-background p-6 md:p-8">
              <div className="mx-auto max-w-4xl">
                <p className="text-sm font-medium uppercase text-muted-foreground">
                  {t("recommendation.detailEyebrow")}
                </p>
                <h2 className="mt-3 text-3xl font-semibold text-foreground">
                  {t("recommendation.detailTitle", { name: leadingRecommendation.styleName })}
                </h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {t("recommendation.visualReportIntro")}
                </p>

                <VisualAnalysisBoard
                  imageUrl={referenceImageUrl ?? getPlaceholderBridalImageUrl(leadingRecommendation.rank)}
                  imageAlt={t("recommendation.imageAlt", { name: leadingRecommendation.styleName })}
                  reportId={report.id}
                  price={price}
                  labels={{
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

        {report.isPaid && hasSuccessfulImages && (
        <section className="mt-8">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">
                {t("recommendation.sectionTitle")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t("recommendation.sectionPaid")}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 rounded-lg border border-border bg-card p-3">
            {recommendations.map(recommendation => (
              <Button
                key={recommendation.id}
                as={Link}
                href={`#direction-${recommendation.rank}`}
                variant={recommendation.rank === 1 ? "default" : "outline"}
                className="h-10"
              >
                {t("recommendation.planButton", { rank: recommendation.rank })}
              </Button>
            ))}
          </div>

          <div className="mt-6 space-y-8">
            {recommendations.map((recommendation) => {
              const imageUrl =
                imageByRecommendationId.get(recommendation.id)?.r2Key ??
                referenceImageUrl ??
                getPlaceholderBridalImageUrl(recommendation.rank);

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
                    detailNeckline: t("detailCaptions.neckline"),
                    detailWaist: t("detailCaptions.waist"),
                    detailSleeve: t("detailCaptions.sleeve"),
                    budgetTitle: t("budget.title"),
                  }}
                />
              );
            })}
          </div>
        </section>
        )}

        {report.isPaid && hasSuccessfulImages && (
          <section className="mt-8 rounded-lg border border-border bg-card p-8">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">
                  {t("deliverables.title")}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
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

        {report.isPaid && !hasSuccessfulImages && (
          <section className="mt-8 rounded-lg border border-border bg-card p-8 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-primary" />
            <h2 className="mt-4 text-2xl font-semibold text-foreground">
              {t("fullGeneration.title")}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              {t("fullGeneration.description")}
            </p>
            <div className="mt-6 flex justify-center">
              <GenerateFullReportButton reportId={report.id} autoStart={returnedFromPayment} />
            </div>
          </section>
        )}
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
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold text-foreground">{value}</p>
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
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <div className="mt-3 flex items-center gap-2 text-sm font-medium text-foreground">
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
  imageUrl: string;
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
    detailNeckline: string;
    detailWaist: string;
    detailSleeve: string;
    budgetTitle: string;
  };
}) {
  return (
    <article id={`direction-${recommendation.rank}`} className="scroll-mt-24 overflow-hidden rounded-lg border border-border bg-card">
      <div className="grid gap-0 lg:grid-cols-[0.88fr_1.12fr]">
        <div className="border-b border-border bg-background lg:border-b-0 lg:border-r">
          <div className="overflow-hidden">
            <Image
              src={imageUrl}
              alt={imageAlt}
              width={1000}
              height={1300}
              className="h-[520px] w-full object-cover object-top lg:h-full lg:min-h-[760px]"
              unoptimized
            />
          </div>
        </div>

        <div className="p-6 md:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                {labels.rank}
              </p>
              <h3 className="mt-3 text-3xl font-semibold text-foreground">
                {recommendation.styleName}
              </h3>
            </div>
            <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {recommendation.silhouette}
            </span>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Fact icon={Scissors} label={labels.silhouette} value={recommendation.silhouette} />
            <Fact icon={Shirt} label={labels.neckline} value={recommendation.neckline} />
            <Fact icon={Sparkles} label={labels.fabric} value={recommendation.fabric} />
            <Fact
              icon={WalletCards}
              label={labels.budget}
              value={`$${recommendation.budgetMin.toLocaleString()}-$${recommendation.budgetMax.toLocaleString()}`}
            />
          </div>

          <div className="mt-7 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-5 rounded-lg border border-border bg-background p-5">
              <Section title={labels.venueMatch} body={recommendation.venueMatch} />
              <Section title={labels.whyItWorks} body={recommendation.whyItWorks} />
              <Section title={labels.whatToAvoid} body={recommendation.whatToAvoid} muted />
            </div>

            <div className="space-y-5">
              <div className="rounded-lg border border-border bg-background p-5">
                <p className="text-sm font-medium text-foreground">
                  {labels.tryFirst}
                </p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {recommendation.tryFirst.map(item => (
                    <li key={item} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 flex-none text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border border-border bg-background p-5">
                <p className="text-sm font-medium text-foreground">
                  {labels.skipFirst}
                </p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {recommendation.skipFirst.map(item => (
                    <li key={item} className="flex gap-2">
                      <X className="mt-0.5 h-4 w-4 flex-none text-muted-foreground" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-7">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h4 className="text-xl font-semibold text-foreground">
                {labels.detailTitle}
              </h4>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <ImageCaption
                imageUrl={detailImages.neckline}
                label={labels.detailNeckline}
                value={recommendation.detailCaptions.neckline}
              />
              <ImageCaption
                imageUrl={detailImages.waist}
                label={labels.detailWaist}
                value={recommendation.detailCaptions.waist}
              />
              <ImageCaption
                imageUrl={detailImages.sleeve}
                label={labels.detailSleeve}
                value={recommendation.detailCaptions.sleeve}
              />
            </div>
          </div>

          <div className="mt-7 grid gap-5 lg:grid-cols-2">
            <div className="rounded-lg border border-border bg-background p-5">
              <p className="text-sm font-medium text-foreground">
                {labels.budgetTitle}
              </p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {recommendation.budgetGuardrail}
              </p>
            </div>

            <div className="rounded-lg border border-border bg-primary/5 p-5">
              <p className="text-sm font-medium text-foreground">
                {labels.storeScript}
              </p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                &ldquo;{recommendation.consultantScript}&rdquo;
              </p>
              <p className="mt-3 border-t border-border pt-3 text-sm leading-6 text-muted-foreground">
                <span className="font-medium text-foreground">{labels.salesPressure}: </span>
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
    <div className="relative mt-6 overflow-hidden rounded-lg border border-border bg-card p-5 md:p-8">
      <div className="relative mx-auto max-w-5xl pb-4">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)_minmax(0,1fr)] lg:items-start">
          <div className="order-2 grid gap-5 lg:order-1">
            <CalloutBox label={labels.neckline} value={captions.neckline} />
            <CalloutBox label={labels.waist} value={captions.waist} muted />
            <CalloutBox label={labels.sleeve} value={captions.sleeve} muted />
          </div>

          <div className="order-1 overflow-hidden rounded-lg border border-border bg-background shadow-sm lg:order-2">
            <Image
              src={imageUrl}
              alt={imageAlt}
              width={900}
              height={1400}
              className="h-[520px] w-full object-cover object-top lg:h-[680px]"
              unoptimized
            />
          </div>

          <div className="order-3 grid gap-5">
            <CalloutBox label={labels.neckline} value={captions.neckline} />
            <CalloutBox label={labels.sleeve} value={captions.sleeve} />
          </div>

          <div className="pointer-events-none absolute left-[27%] top-[7rem] hidden h-px w-[16%] rotate-12 border-t border-dashed border-foreground/50 lg:block" />
          <div className="pointer-events-none absolute left-[27%] top-[21rem] hidden h-px w-[16%] rotate-6 border-t border-dashed border-foreground/50 lg:block" />
          <div className="pointer-events-none absolute left-[27%] top-[35rem] hidden h-px w-[16%] -rotate-14 border-t border-dashed border-foreground/50 lg:block" />
          <div className="pointer-events-none absolute right-[27%] top-[11rem] hidden h-px w-[16%] -rotate-12 border-t border-dashed border-foreground/50 lg:block" />
          <div className="pointer-events-none absolute right-[27%] top-[31rem] hidden h-px w-[16%] rotate-12 border-t border-dashed border-foreground/50 lg:block" />
        </div>

        <div className="mt-6">
          <div className="rounded-lg border border-border bg-background p-5 lg:p-6">
            <p className="text-center text-sm font-semibold text-foreground">
              {labels.textPlan}
            </p>
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <div className="space-y-5 rounded-lg border border-border bg-card p-4">
                <Section title={writtenPlan.venueTitle} body={writtenPlan.venue} />
                <Section title={writtenPlan.whyTitle} body={writtenPlan.why} />
                <Section title={writtenPlan.avoidTitle} body={writtenPlan.avoid} muted />
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-sm font-medium text-foreground">
                  {writtenPlan.tryTitle}
                </p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {writtenPlan.tryItems.map(item => (
                    <li key={item} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 flex-none text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-sm font-medium text-foreground">
                  {writtenPlan.skipTitle}
                </p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {writtenPlan.skipItems.map(item => (
                    <li key={item} className="flex gap-2">
                      <X className="mt-0.5 h-4 w-4 flex-none text-muted-foreground" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-sm font-medium text-foreground">
                  {writtenPlan.budgetTitle}
                </p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {writtenPlan.budget}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-primary/5 p-4">
                <p className="text-sm font-medium text-foreground">
                  {writtenPlan.scriptTitle}
                </p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  &ldquo;{writtenPlan.script}&rdquo;
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-sm font-medium text-foreground">
                  {writtenPlan.deliverablesTitle}
                </p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
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

      <div className="pointer-events-none absolute inset-x-0 bottom-0 top-[42%] z-20 bg-background/25 backdrop-blur-md [mask-image:linear-gradient(to_bottom,transparent,black_14%,black)]" />
      <div className="pointer-events-none absolute inset-x-5 top-[42%] z-30 border-t border-dashed border-foreground/30 md:inset-x-8" />
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
    <div className={muted ? "rounded-lg border border-dashed border-border bg-background/80 p-4" : "rounded-lg border border-border bg-background p-4 shadow-sm"}>
      <p className="text-sm font-semibold text-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
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
}: {
  imageUrl?: string;
  label: string;
  value: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      {imageUrl && (
        <Image
          src={imageUrl}
          alt={label}
          width={720}
          height={480}
          className="h-40 w-full object-cover object-top"
          unoptimized
        />
      )}
      <div className="p-4">
        <Caption label={label} value={value} />
      </div>
    </div>
  );
}
