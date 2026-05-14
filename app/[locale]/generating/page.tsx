import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { generatePageMetadata } from "@/lib/metadata";
import type { Locale } from "@/i18n.config";
import { BridalGeneratingClient } from "./generating-client";

export async function generateMetadata(
  props: {
    params: Promise<{ locale: Locale }>;
  },
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "bridalGenerating" });

  return generatePageMetadata({
    locale,
    path: "/generating",
    title: t("meta.title"),
    description: t("meta.description"),
  });
}

export default async function GeneratingPage(
  props: {
    searchParams: Promise<{ reportId?: string }>;
  },
) {
  const { reportId } = await props.searchParams;

  return <BridalGeneratingClient reportId={reportId ?? null} />;
}
