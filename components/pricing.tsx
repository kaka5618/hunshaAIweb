"use client";

import { IconCircleCheckFilled } from "@tabler/icons-react";
import { motion } from "framer-motion";
import { useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "./button";
import { useSession } from "@/lib/auth-client";
import { getDefaultOneTimePack } from "@/lib/billing-display";

export function Pricing() {
  const session = useSession();
  const router = useRouter();
  const t = useTranslations("pricing");
  const locale = useLocale();
  const userId = session.data?.user?.id;
  const reportPack = getDefaultOneTimePack();

  const startCheckout = useCallback(async () => {
    if (!userId) {
      router.push(`/${locale}/signup`);
      return;
    }

    const res = await fetch("/api/payments/creem/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: reportPack.key, kind: "one_time" }),
    });

    if (!res.ok) {
      return;
    }

    const { url } = (await res.json()) as { url: string };
    window.location.href = url;
  }, [locale, reportPack.key, router, userId]);

  return (
    <div className="relative z-20 mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-[1fr_0.9fr]">
      <div className="rounded-lg border border-border bg-card p-8">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {t("comparison.values.oneTime")}
        </p>
        <h3 className="mt-4 text-3xl font-semibold text-foreground">
          {t("tiers.credits.name")}
        </h3>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          {t("tiers.credits.description")}
        </p>
        <div className="mt-8 flex items-end gap-3">
          <motion.span
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="text-5xl font-bold tracking-tight text-foreground"
          >
            {reportPack.displayPrice}
          </motion.span>
          <span className="pb-2 text-sm text-muted-foreground">
            {t("details.oneTimeDelivery")}
          </span>
        </div>
        <Button
          onClick={startCheckout}
          className="mt-8 block w-full rounded-full px-3.5 py-2.5 text-center text-sm font-semibold sm:w-auto"
        >
          {t("tiers.credits.cta", { credits: reportPack.displayCredits })}
        </Button>
      </div>

      <div className="rounded-lg bg-primary p-8 text-primary-foreground">
        <h4 className="text-lg font-semibold">{t("comparison.title")}</h4>
        <ul className="mt-6 space-y-4 text-sm leading-6 text-primary-foreground/85">
          {(t.raw("tiers.credits.features") as string[]).map((feature) => (
            <li key={feature} className="flex gap-x-3">
              <IconCircleCheckFilled
                className="h-6 w-5 flex-none text-primary-foreground"
                aria-hidden="true"
              />
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

