import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";

const rows = [
  ["A-line", "Sweetheart", "Garden", "Lace", "$1.5k-$2.5k", "Soft sleeve"],
  ["Column", "Square neck", "City hall", "Satin", "$1.2k-$2.2k", "Minimal"],
  ["Ball gown", "Off-shoulder", "Chapel", "Tulle", "$2k-$3.5k", "Romantic"],
];

export const SkeletonFour = () => {
  return (
    <div className="relative mt-10 flex h-full flex-col justify-center overflow-hidden bg-background py-6">
      {rows.map((row, index) => (
        <InfiniteMovingCards
          key={row.join("-")}
          speed={index === 1 ? "slow" : "normal"}
          direction={index === 1 ? "right" : "left"}
        >
          <MovingGrid items={row} highlighted={index === 0} />
        </InfiniteMovingCards>
      ))}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background to-transparent" />

      <div className="absolute left-1/2 top-1/2 z-30 w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card/95 p-5 shadow-2xl backdrop-blur">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          Appointment-ready guidance
        </div>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          Converts style signals into budget guardrails, try-first details, and consultant scripts.
        </p>
      </div>
    </div>
  );
};

function MovingGrid({
  items,
  highlighted,
}: {
  items: string[];
  highlighted?: boolean;
}) {
  return (
    <div className="relative z-20 mb-4 flex flex-shrink-0 space-x-4">
      {items.map((item) => (
        <span
          key={item}
          className={cn(
            "min-w-28 rounded-md border border-border bg-card px-3 py-2 text-center text-sm text-muted-foreground shadow-sm",
            highlighted && "bg-primary/10 text-foreground",
          )}
        >
          {item}
        </span>
      ))}
    </div>
  );
}
