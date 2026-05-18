import Image from "next/image";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, eq, gt } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { Check, Scissors, Shirt, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import {
  bridalGeneratedImage,
  bridalRecommendation,
  bridalReport,
  bridalShareToken,
} from "@/lib/db/schema";
import { generatePageMetadata } from "@/lib/metadata";
import type { Locale } from "@/i18n.config";
import type { ElementType } from "react";

export async function generateMetadata(
  props: {
    params: Promise<{ locale: Locale; token: string }>;
  },
): Promise<Metadata> {
  const { locale, token } = await props.params;
  const t = await getTranslations({ locale, namespace: "bridalShare" });

  return generatePageMetadata({
    locale,
    path: `/share/${token}`,
    title: t("meta.title"),
    description: t("meta.description"),
  });
}

export default async function BridalSharePage(
  props: {
    params: Promise<{ token: string }>;
  },
) {
  const { token } = await props.params;
  const t = await getTranslations("bridalShare");

  const [share] = await db
    .select({
      reportId: bridalShareToken.reportId,
      title: bridalReport.title,
    })
    .from(bridalShareToken)
    .innerJoin(bridalReport, eq(bridalReport.id, bridalShareToken.reportId))
    .where(
      and(
        eq(bridalShareToken.token, token),
        eq(bridalShareToken.enabled, true),
        gt(bridalShareToken.expiresAt, new Date()),
        eq(bridalReport.shareEnabled, true),
      ),
    )
    .limit(1);

  if (!share) {
    notFound();
  }

  const recommendations = await db
    .select()
    .from(bridalRecommendation)
    .where(eq(bridalRecommendation.reportId, share.reportId))
    .orderBy(bridalRecommendation.rank);

  const generatedImages = await db
    .select()
    .from(bridalGeneratedImage)
    .where(eq(bridalGeneratedImage.reportId, share.reportId));

  const imageByRecommendationId = new Map(
    generatedImages
      .filter(image => image.generationStatus === "success" && !image.errorMessage && image.r2Key && image.type === "full_body")
      .map(image => [image.recommendationId, image.r2Key as string]),
  );
  const imageByRecommendationAndType = new Map(
    generatedImages
      .filter(image => image.generationStatus === "success" && !image.errorMessage && image.r2Key)
      .map(image => [`${image.recommendationId}:${image.type}`, image.r2Key as string]),
  );

  return (
    <main className="min-h-screen bg-[#f7f2ea] px-6 py-16 text-[#1f1b16]">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-lg border border-[#d8cdbd] bg-[#fffaf3] p-8 shadow-sm md:p-10">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#756a5c]">
            {t("eyebrow")}
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
            {share.title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[#655d52]">
            {t("description")}
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <SummaryMetric label={t("summaryDirections")} value={recommendations.length.toString()} />
            <SummaryMetric label={t("summaryVisuals")} value={imageByRecommendationAndType.size.toString()} />
            <SummaryMetric label={t("summaryType")} value={t("summaryTypeValue")} />
          </div>
        </header>

        <section className="mt-8 space-y-8">
          {recommendations.map((recommendation) => {
            const imageUrl = imageByRecommendationId.get(recommendation.id);
            const necklineImage = imageByRecommendationAndType.get(`${recommendation.id}:neckline_detail`);
            const waistImage = imageByRecommendationAndType.get(`${recommendation.id}:waist_detail`);
            const sleeveImage = imageByRecommendationAndType.get(`${recommendation.id}:sleeve_detail`);

            return (
              <article key={recommendation.id} className="overflow-hidden rounded-lg border border-[#d8cdbd] bg-[#fffaf3] shadow-sm">
                <div className="border-b border-[#d8cdbd] bg-[#f3eadc] px-6 py-5 md:px-8">
                  <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#756a5c]">
                        {t("rank", { rank: recommendation.rank })}
                      </p>
                      <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                        {recommendation.styleName}
                      </h2>
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
                  {imageUrl && (
                    <div className="border-b border-[#d8cdbd] bg-white xl:border-b-0 xl:border-r">
                      <Image
                        src={imageUrl}
                        alt={t("imageAlt", { name: recommendation.styleName })}
                        width={1100}
                        height={1400}
                        className="h-[560px] w-full object-cover object-top xl:h-full xl:min-h-[760px]"
                        unoptimized
                      />
                    </div>
                  )}

                  <div className="p-6 md:p-8">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Fact icon={Scissors} label={t("silhouette")} value={recommendation.silhouette} />
                      <Fact icon={Shirt} label={t("neckline")} value={recommendation.neckline} />
                      <Fact icon={Sparkles} label={t("fabric")} value={recommendation.fabric} />
                    </div>

                    <div className="mt-7 grid gap-5 lg:grid-cols-2">
                      <Section title={t("whyItWorks")} body={recommendation.whyItWorks} />
                      <Section title={t("venueMatch")} body={recommendation.venueMatch} />
                    </div>

                    <div className="mt-7 rounded-lg border border-[#e4dacb] bg-white/70 p-5">
                      <p className="text-sm font-medium text-foreground">{t("tryFirst")}</p>
                      <ul className="mt-3 space-y-2 text-sm text-[#655d52]">
                        {recommendation.tryFirst.slice(0, 3).map((item) => (
                          <li key={item} className="flex gap-2">
                            <Check className="mt-0.5 h-4 w-4 flex-none text-primary" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-7">
                      <h3 className="text-xl font-semibold">{t("detailTitle")}</h3>
                      <div className="mt-4 grid gap-4 md:grid-cols-3">
                        <DetailImage imageUrl={necklineImage} label={t("detailNeckline")} value={recommendation.detailCaptions.neckline} />
                        <DetailImage imageUrl={waistImage} label={t("detailWaist")} value={recommendation.detailCaptions.waist} />
                        <DetailImage imageUrl={sleeveImage} label={t("detailSleeve")} value={recommendation.detailCaptions.sleeve} />
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#e4dacb] bg-white/60 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#756a5c]">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
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

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[#655d52]">{body}</p>
    </div>
  );
}

function DetailImage({
  imageUrl,
  label,
  value,
}: {
  imageUrl?: string;
  label: string;
  value: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#e4dacb] bg-white/70">
      {imageUrl && (
        <Image
          src={imageUrl}
          alt={label}
          width={720}
          height={480}
          className="h-36 w-full object-cover object-top"
          unoptimized
        />
      )}
      <div className="p-4">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#756a5c]">{label}</p>
        <p className="mt-2 text-sm leading-6 text-[#655d52]">{value}</p>
      </div>
    </div>
  );
}
