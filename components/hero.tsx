"use client";

import { Button } from "./button";
import { HiArrowRight } from "react-icons/hi2";
import { Badge } from "./badge";
import { motion } from "framer-motion";

import { useRouter } from "next/navigation";
import { LocaleLink } from "@/components/locale-link";
import { useTranslations, useLocale } from 'next-intl';

export const Hero = () => {
  const router = useRouter();
  const t = useTranslations('hero');
  const locale = useLocale();
  const previewImages = [
    "/bridal/home-dress-full.png",
    "/bridal/home-dress-detail.png",
    "/bridal/home-report-table.png",
  ];

  return (
    <div className="flex flex-col min-h-screen pt-20 md:pt-40 relative overflow-hidden">
      <motion.div
        initial={{
          y: 40,
          opacity: 0,
        }}
        animate={{
          y: 0,
          opacity: 1,
        }}
        transition={{
          ease: "easeOut",
          duration: 0.5,
        }}
        className="flex justify-center"
      >
        <Badge onClick={() => router.push(`/${locale}/pricing`)}>
          {t('badge')}
        </Badge>
      </motion.div>
      <motion.h1
        initial={{
          y: 40,
          opacity: 0,
        }}
        animate={{
          y: 0,
          opacity: 1,
        }}
        transition={{
          ease: "easeOut",
          duration: 0.5,
        }}
        className="text-2xl md:text-4xl lg:text-8xl font-semibold max-w-6xl mx-auto text-center mt-6 relative z-10"
      >
        {t('title')}
      </motion.h1>
      <motion.h2
        initial={{
          y: 40,
          opacity: 0,
        }}
        animate={{
          y: 0,
          opacity: 1,
        }}
        transition={{
          ease: "easeOut",
          duration: 0.5,
          delay: 0.2,
        }}
        className="text-center mt-6 text-base md:text-xl text-muted-foreground max-w-3xl mx-auto relative z-10 font-normal"
      >
        {t('description')}
      </motion.h2>
      <motion.div
        initial={{
          y: 80,
          opacity: 0,
        }}
        animate={{
          y: 0,
          opacity: 1,
        }}
        transition={{
          ease: "easeOut",
          duration: 0.5,
          delay: 0.4,
        }}
        className="flex items-center gap-4 justify-center mt-6 relative z-10"
      >
        <Button
          as={LocaleLink}
          href="/quiz"
        >
          {t('cta.primary')}
        </Button>
        <Button
          as={LocaleLink}
          href="/pricing"
          variant="simple"
          className="flex space-x-2 items-center group"
        >
          <span>{t('cta.secondary')}</span>
          <HiArrowRight className="text-muted-foreground group-hover:translate-x-1 stroke-[1px] h-3 w-3 transition-transform duration-200" />
        </Button>
      </motion.div>
      <div className="mx-auto mt-20 w-full max-w-7xl rounded-[32px] border border-border bg-[#fffaf4] p-3 shadow-[0_28px_90px_rgba(42,33,23,0.10)] dark:bg-secondary">
        <div className="relative overflow-hidden rounded-[24px] border border-border bg-background p-5 md:p-8">
          <div className="grid gap-5 md:grid-cols-[0.8fr_1.05fr_0.8fr]">
            <div className="space-y-4">
              <div className="hero-float-card rounded-2xl border border-border bg-background/90 p-5 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('preview.cards.neckline.label')}
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-foreground">
                  {t('preview.cards.neckline.title')}
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {t('preview.cards.neckline.description')}
                </p>
              </div>
              <div className="hero-float-card hero-float-delay rounded-2xl border border-dashed border-border bg-background/70 p-5 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('preview.cards.waist.label')}
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-foreground">
                  {t('preview.cards.waist.title')}
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {t('preview.cards.waist.description')}
                </p>
              </div>
              <div className="hidden overflow-hidden rounded-2xl border border-border bg-background shadow-sm md:block">
                <div
                  className="h-36 bg-cover bg-center"
                  style={{ backgroundImage: "url('/bridal/home-dress-detail.png')" }}
                />
              </div>
            </div>

            <div className="relative min-h-[580px] overflow-hidden rounded-3xl border border-border bg-[#d7c8b8] shadow-xl">
              {previewImages.map((src, index) => (
                <div
                  key={src}
                  className="hero-preview-slide absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url('${src}')`,
                    animationDelay: `${index * 3.2}s`,
                  }}
                />
              ))}
              <div className="absolute right-5 top-5 z-10 hidden w-36 overflow-hidden rounded-2xl border border-white/45 bg-white/25 shadow-2xl backdrop-blur-md md:block">
                <div
                  className="h-28 bg-cover bg-center"
                  style={{ backgroundImage: "url('/bridal/home-report-table.png')" }}
                />
                <p className="px-3 py-2 text-xs font-semibold text-white drop-shadow">
                  {t('preview.thumb.report')}
                </p>
              </div>
              <div className="absolute bottom-24 left-5 z-10 hidden w-32 overflow-hidden rounded-2xl border border-white/45 bg-white/25 shadow-2xl backdrop-blur-md md:block">
                <div
                  className="h-28 bg-cover bg-center"
                  style={{ backgroundImage: "url('/bridal/home-dress-detail.png')" }}
                />
                <p className="px-3 py-2 text-xs font-semibold text-white drop-shadow">
                  {t('preview.thumb.detail')}
                </p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/95" />
              <div className="absolute left-0 right-0 top-[43%] border-t border-dashed border-foreground/40" />
              <div className="absolute inset-x-0 bottom-0 h-[58%] backdrop-blur-md" />
              <div className="hero-unlock-pulse absolute left-1/2 top-[43%] z-20 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-white/40 bg-foreground px-5 py-3 text-sm font-semibold text-background shadow-2xl">
                {t('preview.unlock')}
              </div>
              <div className="absolute bottom-6 left-6 right-6 z-10 rounded-2xl border border-border bg-background/85 p-5 backdrop-blur-md">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('preview.planLabel')}
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-foreground">
                  {t('preview.planTitle')}
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {t('preview.planDescription')}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="hero-float-card hero-float-delay rounded-2xl border border-border bg-background/90 p-5 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('preview.cards.sleeve.label')}
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-foreground">
                  {t('preview.cards.sleeve.title')}
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {t('preview.cards.sleeve.description')}
                </p>
              </div>
              <div className="hero-float-card rounded-2xl border border-border bg-background/90 p-5 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('preview.cards.salon.label')}
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-foreground">
                  {t('preview.cards.salon.title')}
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {t('preview.cards.salon.description')}
                </p>
              </div>
              <div className="hidden overflow-hidden rounded-2xl border border-border bg-background shadow-sm md:block">
                <div
                  className="h-36 bg-cover bg-center"
                  style={{ backgroundImage: "url('/bridal/home-report-table.png')" }}
                />
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-border bg-background p-6">
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t('preview.writtenPlan.label')}
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-foreground">
                {t('preview.writtenPlan.title')}
              </h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {t('preview.writtenPlan.description')}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-[#171717] p-6 text-white">
              <p className="text-sm font-semibold uppercase tracking-wide text-white/60">
                {t('preview.includes.label')}
              </p>
              <ul className="mt-4 space-y-3 text-sm text-white/85">
                <li>{t('preview.includes.visuals')}</li>
                <li>{t('preview.includes.details')}</li>
                <li>{t('preview.includes.export')}</li>
              </ul>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-background" />
        </div>
      </div>
      <style jsx>{`
        .hero-preview-slide {
          opacity: 0;
          transform: scale(1.03);
          animation: heroPreviewFade 9.6s ease-in-out infinite;
        }

        .hero-preview-slide:first-child {
          opacity: 1;
        }

        .hero-float-card {
          animation: heroFloat 6s ease-in-out infinite;
        }

        .hero-float-delay {
          animation-delay: 1.8s;
        }

        .hero-unlock-pulse {
          animation: heroUnlockPulse 2.8s ease-in-out infinite;
        }

        @keyframes heroPreviewFade {
          0%,
          28% {
            opacity: 1;
            transform: scale(1);
          }
          38%,
          90% {
            opacity: 0;
            transform: scale(1.035);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes heroFloat {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes heroUnlockPulse {
          0%,
          100% {
            box-shadow: 0 24px 60px rgba(0, 0, 0, 0.24);
          }
          50% {
            box-shadow: 0 28px 80px rgba(0, 0, 0, 0.34);
          }
        }
      `}</style>
    </div>
  );
};
