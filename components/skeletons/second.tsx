"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const recommendations = [
  {
    name: "Romantic A-line",
    detail: "Garden venue · Lace · $1.8k-$2.6k",
    score: "96%",
  },
  {
    name: "Clean Satin Column",
    detail: "City hall · Satin · $1.4k-$2.2k",
    score: "91%",
  },
  {
    name: "Soft Sleeve Classic",
    detail: "Chapel · Crepe · $2.0k-$3.1k",
    score: "88%",
  },
];

export const SkeletonTwo = () => {
  return (
    <div className="relative mt-4 h-full w-full">
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background via-background to-transparent pointer-events-none" />
      <div className="mx-auto h-full max-w-[360px] rounded-[36px] border border-border bg-muted p-3 shadow-2xl">
        <div className="h-full rounded-[28px] border border-border bg-card p-4">
          <div className="mx-auto h-5 w-20 rounded-full bg-muted" />

          <div className="mt-5 overflow-hidden rounded-2xl border border-border">
            <Image
              src="/bridal-feature-look.jpeg"
              alt="Mobile bridal look preview"
              width={700}
              height={700}
              className="h-44 w-full object-cover object-top"
            />
          </div>

          <div className="mt-4">
            <p className="text-sm font-semibold text-foreground">AI Bridal Preview</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Three visual directions with neckline, waist, sleeve, and venue detail cards.
            </p>
          </div>

          <div className="mt-4 space-y-2">
            {recommendations.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0.65, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className="rounded-xl border border-border bg-background p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-foreground">{item.name}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">{item.detail}</p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary">
                    {item.score}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
