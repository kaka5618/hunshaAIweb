"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Heart, MapPin, Sparkles, UserRoundCheck } from "lucide-react";
import { Button } from "@/components/button";

const voteTypes = [
  { key: "best_overall", icon: Heart },
  { key: "best_for_venue", icon: MapPin },
  { key: "most_elegant", icon: Sparkles },
  { key: "most_you", icon: UserRoundCheck },
] as const;

export function BridalShareVoteButtons({
  token,
  recommendationId,
}: {
  token: string;
  recommendationId: string;
}) {
  const t = useTranslations("bridalShare");
  const [selected, setSelected] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function vote(voteType: string) {
    setIsLoading(voteType);
    setError(null);

    try {
      const response = await fetch(`/api/bridal/share/${token}/vote`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          recommendationId,
          voteType,
        }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.error || t("votes.error"));
      }

      setSelected(voteType);
    } catch (voteError) {
      setError(voteError instanceof Error ? voteError.message : t("votes.error"));
    } finally {
      setIsLoading(null);
    }
  }

  return (
    <div className="mt-6 rounded-lg border border-border bg-background p-4">
      <p className="text-sm font-medium text-foreground">{t("votes.title")}</p>
      <div className="mt-3 grid gap-2">
        {voteTypes.map(({ key, icon: Icon }) => (
          <Button
            key={key}
            type="button"
            variant={selected === key ? "primary" : "outline"}
            size="sm"
            onClick={() => vote(key)}
            disabled={Boolean(isLoading)}
            className="justify-start rounded-md"
          >
            <Icon className="mr-2 h-4 w-4" />
            {isLoading === key ? t("votes.saving") : t(`votes.types.${key}`)}
          </Button>
        ))}
      </div>
      {selected && <p className="mt-3 text-sm text-primary">{t("votes.saved")}</p>}
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
    </div>
  );
}
