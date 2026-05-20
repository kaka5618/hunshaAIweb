"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type DetailPlanProgress = {
  recommendationId: string;
  rank: number;
  styleName: string;
  success: number;
  failed: number;
  total: number;
  status: string;
};

export function DetailGenerationProgress({
  reportId,
  initialPlanProgress,
}: {
  reportId: string;
  initialPlanProgress: DetailPlanProgress[];
}) {
  const t = useTranslations("bridalReport");
  const router = useRouter();
  const [planProgress, setPlanProgress] = useState(initialPlanProgress);
  const [error, setError] = useState<string | null>(null);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasStartedBackfill = useRef(false);
  const previousDoneCount = useRef(
    initialPlanProgress.reduce((count, plan) => count + plan.success, 0),
  );

  const aggregate = useMemo(() => {
    const success = planProgress.reduce((count, plan) => count + plan.success, 0);
    const failed = planProgress.reduce((count, plan) => count + plan.failed, 0);
    const total = planProgress.reduce((count, plan) => count + plan.total, 0);

    return { success, failed, total };
  }, [planProgress]);
  const isComplete = aggregate.total > 0 && aggregate.success >= aggregate.total;
  const activePlan =
    planProgress.find(plan => plan.success < plan.total && plan.failed === 0) ??
    planProgress.find(plan => plan.success < plan.total);
  const percent = aggregate.total > 0
    ? Math.min(100, Math.round((aggregate.success / aggregate.total) * 100))
    : 0;

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
        detailPlanProgress?: DetailPlanProgress[];
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(payload?.error || t("fullGeneration.detailProgress.statusError"));
      }

      if (payload?.detailPlanProgress) {
        const doneCount = payload.detailPlanProgress.reduce((count, plan) => count + plan.success, 0);
        setPlanProgress(payload.detailPlanProgress);

        if (doneCount > previousDoneCount.current) {
          previousDoneCount.current = doneCount;
          router.refresh();
        }

        const complete = payload.detailPlanProgress.every(plan => plan.success >= plan.total);
        if (complete) {
          clearPollTimer();
          router.refresh();
          return;
        }
      }

      pollTimer.current = setTimeout(() => {
        void pollStatus();
      }, 5000);
    } catch (statusError) {
      clearPollTimer();
      setError(statusError instanceof Error ? statusError.message : t("fullGeneration.detailProgress.statusError"));
    }
  }, [clearPollTimer, reportId, router, t]);

  useEffect(() => {
    if (isComplete || hasStartedBackfill.current) {
      return;
    }

    hasStartedBackfill.current = true;
    void fetch(`/api/bridal/report/${reportId}/generate-full`, { method: "POST" })
      .catch(() => undefined)
      .finally(() => {
        void pollStatus();
      });
  }, [isComplete, pollStatus, reportId]);

  useEffect(() => {
    return () => {
      clearPollTimer();
    };
  }, [clearPollTimer]);

  if (isComplete) {
    return null;
  }

  return (
    <div className="rounded-lg border border-[#d8cdbd] bg-white/80 p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#756a5c]">
            {t("fullGeneration.detailProgress.eyebrow")}
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-[#1f1b16]">
            {t("fullGeneration.detailProgress.title")}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#655d52]">
            {activePlan
              ? t("fullGeneration.detailProgress.active", {
                rank: activePlan.rank,
                name: activePlan.styleName,
              })
              : t("fullGeneration.detailProgress.description")}
          </p>
        </div>
        <div className="rounded-lg border border-[#e4dacb] bg-[#fffaf3] px-4 py-3 text-sm font-medium text-[#1f1b16]">
          {t("fullGeneration.detailProgress.count", aggregate)}
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="font-medium text-[#1f1b16]">
            {t("fullGeneration.detailProgress.progress", aggregate)}
          </span>
          <span className="text-[#756a5c]">{percent}%</span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-[#eadfce]">
          <div
            className="h-full rounded-full bg-[#1f1b16] transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {planProgress.map(plan => {
          const planPercent = Math.min(100, Math.round((plan.success / plan.total) * 100));
          const ready = plan.success >= plan.total;
          const partial = !ready && plan.failed > 0;

          return (
            <div key={plan.recommendationId} className="rounded-lg border border-[#e4dacb] bg-[#fffaf3] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#756a5c]">
                    {t("fullGeneration.detailProgress.plan", { rank: plan.rank })}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#1f1b16]">
                    {plan.styleName}
                  </p>
                </div>
                <span className="rounded-full border border-[#d8cdbd] bg-white px-2 py-1 text-xs text-[#655d52]">
                  {ready
                    ? t("fullGeneration.detailProgress.ready")
                    : partial
                      ? t("fullGeneration.detailProgress.partial")
                      : t("fullGeneration.detailProgress.generating")}
                </span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#eadfce]">
                <div
                  className="h-full rounded-full bg-[#5f694c] transition-all duration-500"
                  style={{ width: `${planPercent}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-[#756a5c]">
                {t("fullGeneration.detailProgress.planCount", plan)}
              </p>
            </div>
          );
        })}
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
    </div>
  );
}
