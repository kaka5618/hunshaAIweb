"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Share2 } from "lucide-react";
import { Button } from "@/components/button";

export function BridalShareButton({ reportId }: { reportId: string }) {
  const t = useTranslations("bridalReport");
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleShare() {
    setIsLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/bridal/report/${reportId}/share`, {
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;

      if (!response.ok || !payload?.url) {
        throw new Error(payload?.error || t("deliverables.shareError"));
      }

      const localizedUrl = `${window.location.origin}/${locale}${payload.url}`;
      await navigator.clipboard.writeText(localizedUrl);
      setMessage(t("deliverables.shareCopied"));
    } catch (shareError) {
      setError(shareError instanceof Error ? shareError.message : t("deliverables.shareError"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <Button type="button" onClick={handleShare} disabled={isLoading} variant="outline">
        <Share2 className="mr-2 h-4 w-4" />
        {isLoading ? t("deliverables.shareLoading") : t("deliverables.share")}
      </Button>
      {message && <p className="mt-2 text-sm text-primary">{message}</p>}
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
