"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { getDefaultOneTimePack } from "@/lib/billing-display";

export function PricingTable() {
  const t = useTranslations("pricing");
  const reportPack = getDefaultOneTimePack();

  const tableRows = [
    {
      title: t("comparison.rows.purchaseType"),
      value: t("comparison.values.oneTime"),
    },
    {
      title: t("comparison.rows.monthlyPrice"),
      value: reportPack.displayPrice,
    },
    {
      title: t("comparison.rows.delivery"),
      value: t("details.oneTimeDelivery"),
    },
    {
      title: t("comparison.rows.bestFor"),
      value: t("comparison.values.bestForCredits"),
    },
  ];

  return (
    <div className="relative z-20 mx-auto w-full px-4 py-28">
      <div className="mx-auto max-w-3xl overflow-hidden rounded-lg border border-border bg-card">
        <table className="min-w-full divide-y divide-border">
          <thead>
            <tr>
              <th className="px-6 py-4 text-left text-lg font-semibold text-foreground">
                {t("comparison.title")}
              </th>
              <th className="px-6 py-4 text-left text-lg font-semibold text-foreground">
                {t("tiers.credits.name")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tableRows.map((row) => (
              <tr key={row.title}>
                <td className="px-6 py-4 text-sm font-medium text-foreground">
                  {row.title}
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {row.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

