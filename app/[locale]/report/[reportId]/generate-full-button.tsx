"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/button";

export function GenerateFullReportButton({
  reportId,
  autoStart = false,
}: {
  reportId: string;
  autoStart?: boolean;
}) {
  const t = useTranslations("bridalReport");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ success: number; failed: number; total: number } | null>(null);
  const hasAutoStarted = useRef(false);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  return (
    <div>
      <Button type="button" onClick={handleGenerate} disabled={isLoading}>
        {isLoading ? t("fullGeneration.loading") : t("fullGeneration.cta")}
      </Button>
      {progress && isLoading && (
        <div className="mt-4 min-w-64">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{t("fullGeneration.progress", progress)}</span>
            <span>{Math.round((progress.success / progress.total) * 100)}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(100, (progress.success / progress.total) * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("fullGeneration.progressHint")}
          </p>
        </div>
      )}
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
    </div>
  );
}
