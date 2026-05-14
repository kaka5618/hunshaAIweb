"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

export function PaymentConfirmationRefresh() {
  const router = useRouter();
  const t = useTranslations("bridalReport");

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.refresh();
    }, 2500);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <section className="mt-8 rounded-lg border border-border bg-card p-8 text-center">
      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
      <h2 className="mt-4 text-2xl font-semibold text-foreground">
        {t("paymentConfirming.title")}
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
        {t("paymentConfirming.description")}
      </p>
    </section>
  );
}
