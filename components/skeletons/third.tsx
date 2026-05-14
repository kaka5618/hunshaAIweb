"use client";

import { CheckCircle2, CircleDollarSign, FileText, ImageIcon, LockKeyhole } from "lucide-react";

const rows = [
  {
    icon: FileText,
    title: "Style quiz",
    detail: "Venue, season, budget, comfort notes",
    status: "Complete",
  },
  {
    icon: ImageIcon,
    title: "Photo upload",
    detail: "Temporary reference image for AI styling",
    status: "Ready",
  },
  {
    icon: CheckCircle2,
    title: "DeepSeek copy",
    detail: "3 recommendations and consultant scripts",
    status: "Generated",
  },
  {
    icon: LockKeyhole,
    title: "Full report",
    detail: "Unlock all visuals and appointment guidance",
    status: "$19.90",
  },
];

export const SkeletonThree = () => {
  return (
    <div className="relative mx-auto mt-10 h-full w-full max-w-xl rounded-lg border border-border bg-card shadow-2xl">
      <div className="absolute inset-x-0 bottom-0 z-[11] h-28 bg-gradient-to-t from-background via-background to-transparent pointer-events-none" />

      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Report workflow</p>
            <p className="mt-1 text-xs text-muted-foreground">Built for a paid bridal style report</p>
          </div>
          <div className="flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
            <CircleDollarSign className="h-3.5 w-3.5" />
            Creem
          </div>
        </div>
      </div>

      <div className="space-y-3 p-4">
        {rows.map((row) => (
          <div
            key={row.title}
            className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border border-border bg-background p-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <row.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-foreground">{row.title}</p>
              <p className="mt-1 truncate text-[10px] text-muted-foreground">{row.detail}</p>
            </div>
            <span className="rounded-full bg-muted px-2 py-1 text-[10px] text-muted-foreground">
              {row.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
