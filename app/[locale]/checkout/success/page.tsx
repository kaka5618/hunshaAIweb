import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { and, desc, eq } from "drizzle-orm";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/button";
import { Container } from "@/components/container";
import { db } from "@/lib/db";
import { bridalPayment, bridalReport } from "@/lib/db/schema";
import { getActiveSessionUser } from "@/lib/auth/session";
import { getVerifiedCreemReturnUrlPayload } from "@/lib/payments/creem";
import type { Locale } from "@/i18n.config";

type CheckoutSuccessPageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function localePrefix(locale: Locale) {
  return `/${locale}`;
}

function toUrlSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined) {
          params.append(key, item);
        }
      }
    } else if (value !== undefined) {
      params.set(key, value);
    }
  }

  return params;
}

function reportUrl(
  locale: Locale,
  reportId: string,
  searchParams: Record<string, string | string[] | undefined> = {},
) {
  const params = toUrlSearchParams(searchParams);
  params.set("success", "1");

  return `${localePrefix(locale)}/report/${reportId}?${params.toString()}`;
}

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: CheckoutSuccessPageProps) {
  const { locale } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const payload = getVerifiedCreemReturnUrlPayload(resolvedSearchParams);
  const reportIdFromRequest = payload?.requestId?.startsWith("bridal-report:")
    ? payload.requestId.replace("bridal-report:", "")
    : null;

  if (reportIdFromRequest) {
    redirect(reportUrl(locale, reportIdFromRequest, resolvedSearchParams));
  }

  const access = await getActiveSessionUser(await headers());
  let latestReportId: string | null = null;

  if (access.ok) {
    const [latestPaidPayment] = await db
      .select({ reportId: bridalPayment.reportId })
      .from(bridalPayment)
      .where(and(eq(bridalPayment.userId, access.user.id), eq(bridalPayment.status, "paid")))
      .orderBy(desc(bridalPayment.paidAt), desc(bridalPayment.createdAt))
      .limit(1);

    latestReportId = latestPaidPayment?.reportId ?? null;

    if (!latestReportId) {
      const [latestAwaitingReport] = await db
        .select({ id: bridalReport.id })
        .from(bridalReport)
        .where(
          and(
            eq(bridalReport.userId, access.user.id),
            eq(bridalReport.status, "awaiting_payment"),
          ),
        )
        .orderBy(desc(bridalReport.updatedAt), desc(bridalReport.createdAt))
        .limit(1);

      latestReportId = latestAwaitingReport?.id ?? null;
    }
  }

  if (latestReportId) {
    redirect(reportUrl(locale, latestReportId));
  }

  const t = await getTranslations("checkoutSuccess");
  const fallbackHref = `${localePrefix(locale)}/dashboard`;

  return (
    <main className="min-h-screen bg-[#fffaf4] py-20">
      <Container>
        <section className="mx-auto max-w-2xl rounded-2xl border border-[#ded3c1] bg-white p-8 text-center shadow-sm md:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e9f7ef] text-[#217a45]">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-normal text-foreground md:text-4xl">
            {t("title")}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted-foreground">
            {t("fallback")}
          </p>
          <Button as={Link} href={fallbackHref} className="mt-8">
            {t("goDashboard")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </section>
      </Container>
    </main>
  );
}
