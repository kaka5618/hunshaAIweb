"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/button";

export function GenerateFullReportButton({
  reportId,
  autoStart = false,
  initialProgress = null,
}: {
  reportId: string;
  autoStart?: boolean;
  initialProgress?: { success: number; failed: number; total: number } | null;
}) {
  const t = useTranslations("bridalReport");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ success: number; failed: number; total: number } | null>(initialProgress);
  const hasAutoStarted = useRef(false);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tips = t.raw("fullGeneration.waitTips.items") as string[];

  const clearPollTimer = useCallback(() => {
    if (pollTimer.current) {
      clearTimeout(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  const pollStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/bridal/report/${reportId}`, {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as {
        status?: string;
        imageProgress?: { success: number; failed: number; total: number };
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(payload?.error || t("fullGeneration.statusError"));
      }

      if (payload?.imageProgress) {
        setProgress(payload.imageProgress);
      }

      if (payload?.status === "ready") {
        clearPollTimer();
        setIsLoading(false);
        router.refresh();
        return;
      }

      if (payload?.status === "failed") {
        clearPollTimer();
        setIsLoading(false);
        setError(t("fullGeneration.error"));
        return;
      }

      pollTimer.current = setTimeout(() => {
        void pollStatus();
      }, 5000);
    } catch (statusError) {
      clearPollTimer();
      setIsLoading(false);
      setError(statusError instanceof Error ? statusError.message : t("fullGeneration.statusError"));
    }
  }, [clearPollTimer, reportId, router, t]);

  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setProgress(current => current ?? { success: 0, failed: 0, total: 12 });

    try {
      const response = await fetch(`/api/bridal/report/${reportId}/generate-full`, {
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        status?: string;
        progress?: { success: number; failed: number; total: number };
      } | null;

      if (!response.ok) {
        throw new Error(payload?.error || t("fullGeneration.error"));
      }

      if (payload?.progress) {
        setProgress(payload.progress);
      }

      if (payload?.status === "ready") {
        setIsLoading(false);
        router.refresh();
        return;
      }

      await pollStatus();
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : t("fullGeneration.error"));
      setIsLoading(false);
    }
  }, [reportId, router, pollStatus, t]);

  useEffect(() => {
    return () => {
      clearPollTimer();
    };
  }, [clearPollTimer]);

  useEffect(() => {
    if (!autoStart || hasAutoStarted.current) {
      return;
    }

    hasAutoStarted.current = true;
    void handleGenerate();
  }, [autoStart, handleGenerate]);

  const visibleProgress = progress ?? { success: 0, failed: 0, total: 12 };
  const percent = Math.min(100, Math.round((visibleProgress.success / visibleProgress.total) * 100));
  const stageKey =
    visibleProgress.success === 0
      ? "fullLooks"
      : visibleProgress.success < 4
        ? "details"
        : visibleProgress.success < visibleProgress.total
          ? "quality"
          : "export";

  return (
    <div className="w-full text-left">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-lg border border-[#d8cdbd] bg-white/75 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#756a5c]">
                {t("fullGeneration.progressEyebrow")}
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-[#1f1b16]">
                {t("fullGeneration.progressTitle")}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#655d52]">
                {t("fullGeneration.progressHint")}
              </p>
            </div>
            <Button type="button" onClick={handleGenerate} disabled={isLoading}>
              {isLoading ? t("fullGeneration.loading") : t("fullGeneration.cta")}
            </Button>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="font-medium text-[#1f1b16]">
                {t("fullGeneration.progress", visibleProgress)}
              </span>
              <span className="text-[#756a5c]">{percent}%</span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-[#eadfce]">
              <div
                className="h-full rounded-full bg-[#1f1b16] transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-4">
              {(["fullLooks", "details", "quality", "export"] as const).map(key => (
                <div
                  key={key}
                  className={
                    key === stageKey
                      ? "rounded-lg border border-[#1f1b16] bg-[#1f1b16] px-3 py-2 text-xs font-medium text-white"
                      : "rounded-lg border border-[#e4dacb] bg-[#fffaf3] px-3 py-2 text-xs font-medium text-[#655d52]"
                  }
                >
                  {t(`fullGeneration.stages.${key}`)}
                </div>
              ))}
            </div>
          </div>

          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
        </div>

        <div className="rounded-lg border border-[#d8cdbd] bg-[#fffaf3] p-5">
          <p className="text-sm font-semibold text-[#1f1b16]">
            {t("fullGeneration.waitTips.title")}
          </p>
          <div className="mt-4 space-y-3">
            {tips.slice(0, 4).map(tip => (
              <div key={tip} className="rounded-lg border border-[#e4dacb] bg-white/70 p-3 text-sm leading-6 text-[#655d52]">
                {tip}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
