"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/button";

type ReportStatusResponse = {
  reportId: string;
  status: string;
  recommendationCount: number;
};

const readyStatuses = new Set(["preview_ready", "awaiting_payment", "paid", "generating", "ready"]);
const failedStatuses = new Set(["failed", "expired"]);

export function BridalGeneratingClient({ reportId }: { reportId: string | null }) {
  const t = useTranslations("bridalGenerating");
  const locale = useLocale();
  const router = useRouter();
  const [error, setError] = useState<string | null>(reportId ? null : t("errors.missingReport"));
  const [status, setStatus] = useState<string>("generating_preview");

  useEffect(() => {
    if (!reportId) {
      return;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    async function poll() {
      try {
        const response = await fetch(`/api/bridal/report/${reportId}`);
        const payload = (await response.json().catch(() => null)) as
          | (ReportStatusResponse & { error?: string })
          | null;

        if (!response.ok) {
          throw new Error(payload?.error || t("errors.status"));
        }

        if (cancelled || !payload) {
          return;
        }

        setStatus(payload.status);

        if (readyStatuses.has(payload.status) && payload.recommendationCount > 0) {
          router.replace(`/${locale}/report/${payload.reportId}`);
          return;
        }

        if (failedStatuses.has(payload.status)) {
          setError(t("errors.failed"));
          return;
        }

        timeoutId = setTimeout(poll, 1600);
      } catch (pollError) {
        if (!cancelled) {
          setError(pollError instanceof Error ? pollError.message : t("errors.status"));
        }
      }
    }

    poll();

    return () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [locale, reportId, router, t]);

  return (
    <main className="min-h-screen bg-background px-6 py-28">
      <div className="mx-auto max-w-2xl rounded-lg border border-border bg-card p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          {error ? <RefreshCw className="h-5 w-5" /> : <Loader2 className="h-5 w-5 animate-spin" />}
        </div>

        <p className="mt-6 text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {t("eyebrow")}
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-foreground">{t("title")}</h1>
        <p className="mt-4 text-base leading-8 text-muted-foreground">
          {error ? error : t("description")}
        </p>

        <div className="mt-8 rounded-lg border border-border bg-background p-4 text-left">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t("statusLabel")}</span>
            <span className="font-medium text-foreground">{t(`statuses.${status}`)}</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-primary" />
          </div>
        </div>

        {error && (
          <div className="mt-8 flex justify-center">
            <Button type="button" onClick={() => window.location.reload()}>
              {t("actions.retry")}
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
