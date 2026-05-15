import Image from "next/image";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, eq, gt } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { Check, Shirt, Sparkles } from "lucide-react";
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
        </header>

        <section className="mt-8 grid gap-5 lg:grid-cols-3">
          {recommendations.map((recommendation) => {
            const imageUrl = imageByRecommendationId.get(recommendation.id);

            return (
              <article key={recommendation.id} className="overflow-hidden rounded-lg border border-[#d8cdbd] bg-[#fffaf3] shadow-sm">
                {imageUrl && (
                  <Image
                    src={imageUrl}
                    alt={t("imageAlt", { name: recommendation.styleName })}
                    width={900}
                    height={1100}
                    className="h-[420px] w-full object-cover object-top"
                    unoptimized
                  />
                )}

                <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#756a5c]">
                      {t("rank", { rank: recommendation.rank })}
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold">
                      {recommendation.styleName}
                    </h2>
                  </div>
                  <span className="rounded-full border border-[#d8cdbd] px-3 py-1 text-xs font-medium text-[#5f694c]">
                    {recommendation.silhouette}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <Fact icon={Shirt} label={t("neckline")} value={recommendation.neckline} />
                  <Fact icon={Sparkles} label={t("fabric")} value={recommendation.fabric} />
                </div>

                <div className="mt-6 space-y-5">
                  <Section title={t("venueMatch")} body={recommendation.venueMatch} />
                  <Section title={t("whyItWorks")} body={recommendation.whyItWorks} />
                </div>

                <div className="mt-6 rounded-lg border border-border bg-background p-4">
                  <p className="text-sm font-medium text-foreground">{t("tryFirst")}</p>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {recommendation.tryFirst.slice(0, 3).map((item) => (
                      <li key={item} className="flex gap-2">
                        <Check className="mt-0.5 h-4 w-4 flex-none text-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
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
