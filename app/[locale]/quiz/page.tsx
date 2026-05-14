import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { generatePageMetadata } from "@/lib/metadata";
import type { Locale } from "@/i18n.config";
import { BridalQuizClient } from "./quiz-client";

export async function generateMetadata(
  props: {
    params: Promise<{ locale: Locale }>;
  }
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "bridalQuiz" });

  return generatePageMetadata({
    locale,
    path: "/quiz",
    title: t("meta.title"),
    description: t("meta.description"),
  });
}

export default function BridalQuizPage() {
  return <BridalQuizClient />;
}

