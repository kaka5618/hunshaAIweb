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
  const hasAutoStarted = useRef(false);

  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/bridal/report/${reportId}/generate-full`, {
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.error || t("fullGeneration.error"));
      }

      router.refresh();
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : t("fullGeneration.error"));
    } finally {
      setIsLoading(false);
    }
  }, [reportId, router, t]);

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
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
    </div>
  );
}
