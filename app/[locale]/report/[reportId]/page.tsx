import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { eq } from "drizzle-orm";
import {
  Check,
  Download,
  FileText,
  LockKeyhole,
  MessageSquareText,
  Share2,
  Shirt,
  Sparkles,
  WalletCards,
  X,
} from "lucide-react";
import { Button } from "@/components/button";
import { db } from "@/lib/db";
import { bridalGeneratedImage, bridalRecommendation, bridalReport } from "@/lib/db/schema";
import { canAccessBridalResource } from "@/lib/bridal/permissions";
import { getBridalSessionIdFromCookies } from "@/lib/bridal/session";
import { generatePageMetadata } from "@/lib/metadata";
import type { Locale } from "@/i18n.config";
import type { ElementType } from "react";
import { BridalUnlockButton } from "./unlock-button";
import { GenerateFullReportButton } from "./generate-full-button";
import Image from "next/image";
import { PaymentConfirmationRefresh } from "./payment-confirmation-refresh";

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
  const { locale, reportId } = await props.params;
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

  const imageByRecommendationId = new Map(
    generatedImages
      .filter(image => image.generationStatus === "success" && image.r2Key)
      .map(image => [image.recommendationId, image]),
  );
  const hasSuccessfulImages = imageByRecommendationId.size > 0;

  const price = `$${(report.priceCents / 100).toFixed(2)}`;

  return (
    <main className="min-h-screen bg-background px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <section>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {t("eyebrow")}
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
              {t("title")}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-muted-foreground">
              {t("description")}
            </p>
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
              {["visuals", "details", "scripts"].map((key) => (
                <div key={key} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>{t(`unlock.includes.${key}`)}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>

        <section className="mt-12 grid gap-5 lg:grid-cols-3">
          {recommendations.map((recommendation) => (
            <article
              key={recommendation.id}
              className="rounded-lg border border-border bg-card p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    {t("recommendation.rank", { rank: recommendation.rank })}
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold text-foreground">
                    {recommendation.styleName}
                  </h2>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {recommendation.silhouette}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <Fact icon={Shirt} label={t("recommendation.neckline")} value={recommendation.neckline} />
                <Fact icon={Sparkles} label={t("recommendation.fabric")} value={recommendation.fabric} />
                <Fact
                  icon={WalletCards}
                  label={t("recommendation.budget")}
                  value={`$${recommendation.budgetMin.toLocaleString()}-$${recommendation.budgetMax.toLocaleString()}`}
                />
              </div>

              <div className="mt-6 space-y-5">
                <Section title={t("recommendation.venueMatch")} body={recommendation.venueMatch} />
                <Section title={t("recommendation.whyItWorks")} body={recommendation.whyItWorks} />
                <Section title={t("recommendation.whatToAvoid")} body={recommendation.whatToAvoid} muted />
              </div>

              {imageByRecommendationId.get(recommendation.id)?.r2Key && (
                <div className="mt-6 overflow-hidden rounded-lg border border-border">
                  <Image
                    src={imageByRecommendationId.get(recommendation.id)?.r2Key as string}
                    alt={t("recommendation.imageAlt", { name: recommendation.styleName })}
                    width={900}
                    height={900}
                    className="aspect-square w-full object-cover object-top"
                    unoptimized
                  />
                </div>
              )}

              <div className="mt-6 rounded-lg border border-border bg-background p-4">
                <p className="text-sm font-medium text-foreground">
                  {t("recommendation.tryFirst")}
                </p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {recommendation.tryFirst.slice(0, report.isPaid ? undefined : 2).map((item) => (
                    <li key={item} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 flex-none text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {report.isPaid && (
                <div className="mt-4 rounded-lg border border-border bg-background p-4">
                  <p className="text-sm font-medium text-foreground">
                    {t("recommendation.skipFirst")}
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {recommendation.skipFirst.map((item) => (
                      <li key={item} className="flex gap-2">
                        <X className="mt-0.5 h-4 w-4 flex-none text-muted-foreground" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          ))}
        </section>

        {report.isPaid && (
          <section className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center gap-2">
                <MessageSquareText className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-semibold text-foreground">
                  {t("appointment.title")}
                </h2>
              </div>
              <div className="mt-5 space-y-4">
                {recommendations.map((recommendation) => (
                  <div key={recommendation.id} className="rounded-lg border border-border bg-background p-4">
                    <p className="text-sm font-medium text-foreground">
                      {recommendation.styleName}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      &ldquo;{recommendation.consultantScript}&rdquo;
                    </p>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {recommendation.salesPressureReminder}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center gap-2">
                <WalletCards className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-semibold text-foreground">
                  {t("budget.title")}
                </h2>
              </div>
              <div className="mt-5 space-y-4">
                {recommendations.map((recommendation) => (
                  <div key={recommendation.id} className="rounded-lg border border-border bg-background p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-medium text-foreground">
                        {recommendation.styleName}
                      </p>
                      <span className="text-sm text-muted-foreground">
                        ${recommendation.budgetMin.toLocaleString()}-${recommendation.budgetMax.toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {recommendation.budgetGuardrail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {report.isPaid && (
          <section className="mt-8 rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-semibold text-foreground">
                {t("detailCaptions.title")}
              </h2>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              {recommendations.map((recommendation) => (
                <div key={recommendation.id} className="rounded-lg border border-border bg-background p-4">
                  <p className="text-sm font-medium text-foreground">
                    {recommendation.styleName}
                  </p>
                  <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                    <Caption label={t("detailCaptions.neckline")} value={recommendation.detailCaptions.neckline} />
                    <Caption label={t("detailCaptions.waist")} value={recommendation.detailCaptions.waist} />
                    <Caption label={t("detailCaptions.sleeve")} value={recommendation.detailCaptions.sleeve} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {report.isPaid && (
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
                <Button as={Link} href={`/${locale}/report/${report.id}`} variant="outline">
                  <Share2 className="mr-2 h-4 w-4" />
                  {t("deliverables.share")}
                </Button>
              </div>
            </div>
          </section>
        )}

        {!report.isPaid && returnedFromPayment && <PaymentConfirmationRefresh />}

        {!report.isPaid && !returnedFromPayment && (
          <section className="mt-8 rounded-lg border border-border bg-card p-8 text-center">
            <LockKeyhole className="mx-auto h-8 w-8 text-primary" />
            <h2 className="mt-4 text-2xl font-semibold text-foreground">{t("locked.title")}</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              {t("locked.description")}
            </p>
            <div className="mt-6 flex justify-center">
              <BridalUnlockButton reportId={report.id} price={price} />
            </div>
          </section>
        )}

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
