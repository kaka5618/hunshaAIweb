"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/button";

export function BridalUnlockButton({
  reportId,
  price,
  className,
}: {
  reportId: string;
  price: string;
  className?: string;
}) {
  const t = useTranslations("bridalReport");
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUnlock() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/payments/creem/checkout", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          kind: "one_time",
          key: "bridal_report",
          reportId,
          locale,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;

      if (response.status === 401) {
        const callbackUrl = `/${locale}/report/${reportId}`;
        window.location.href = `/${locale}/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
        return;
      }

      if (!response.ok || !payload?.url) {
        throw new Error(payload?.error || t("unlock.error"));
      }

      window.location.href = payload.url;
    } catch (unlockError) {
      setError(unlockError instanceof Error ? unlockError.message : t("unlock.error"));
      setIsLoading(false);
    }
  }

  return (
    <div className={className}>
      <Button type="button" onClick={handleUnlock} disabled={isLoading} className="w-full">
        {isLoading ? t("unlock.loading") : t("unlock.cta", { price })}
      </Button>
      {error && (
        <p className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
