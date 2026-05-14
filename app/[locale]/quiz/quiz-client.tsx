"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/button";
import { cn } from "@/lib/utils";
import type { BridalQuizAnswers } from "@/lib/bridal/types";

type QuizQuestion = {
  id: keyof BridalQuizAnswers;
  type: "single" | "multi";
  options: string[];
};

const questions: QuizQuestion[] = [
  { id: "venue", type: "single", options: ["garden", "church", "beach", "ballroom", "cityHall", "outdoorEstate"] },
  { id: "season", type: "single", options: ["spring", "summer", "fall", "winter", "notSure"] },
  { id: "dressBudget", type: "single", options: ["under1000", "1000to2000", "2000to3500", "3500plus", "notSure"] },
  { id: "styleWords", type: "multi", options: ["romantic", "classic", "modern", "minimal", "glamorous", "bohemian"] },
  { id: "silhouettes", type: "multi", options: ["aLine", "ballGown", "mermaid", "sheath", "empire", "notSure"] },
  { id: "necklines", type: "multi", options: ["sweetheart", "vNeck", "square", "offShoulder", "highNeck", "strapless"] },
  { id: "coverage", type: "single", options: ["sleeveless", "shortSleeve", "longSleeve", "moreCoverage", "openToAll"] },
  { id: "bodyComfort", type: "multi", options: ["arms", "midsection", "hips", "bust", "height", "noConcern"] },
  { id: "shoppingConcerns", type: "multi", options: ["pressure", "budget", "tooManyOptions", "bodyConfidence", "familyOpinions", "timeline"] },
  { id: "appointmentGoal", type: "single", options: ["narrowStyle", "avoidPressure", "stayOnBudget", "feelConfident", "compareOptions"] },
];

const emptyAnswers: BridalQuizAnswers = {
  venue: "",
  season: "",
  dressBudget: "",
  styleWords: [],
  silhouettes: [],
  necklines: [],
  coverage: "",
  bodyComfort: [],
  shoppingConcerns: [],
  appointmentGoal: "",
};

export function BridalQuizClient() {
  const t = useTranslations("bridalQuiz");
  const router = useRouter();
  const locale = useLocale();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<BridalQuizAnswers>(emptyAnswers);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = questions[step];
  const progress = useMemo(() => ((step + 1) / questions.length) * 100, [step]);
  const currentValue = answers[currentQuestion.id];
  const canContinue = Array.isArray(currentValue) ? currentValue.length > 0 : Boolean(currentValue);

  function updateAnswer(option: string) {
    setError(null);
    setAnswers((current) => {
      const existingValue = current[currentQuestion.id];

      if (currentQuestion.type === "multi" && Array.isArray(existingValue)) {
        const nextValue = existingValue.includes(option)
          ? existingValue.filter((item) => item !== option)
          : [...existingValue, option];

        return {
          ...current,
          [currentQuestion.id]: nextValue,
        };
      }

      return {
        ...current,
        [currentQuestion.id]: option,
      };
    });
  }

  async function submitQuiz() {
    setIsSubmitting(true);
    setError(null);

    try {
      const sessionResponse = await fetch("/api/bridal/session", {
        method: "POST",
      });

      if (!sessionResponse.ok) {
        throw new Error(t("errors.session"));
      }

      const quizResponse = await fetch("/api/bridal/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });

      if (!quizResponse.ok) {
        const data = (await quizResponse.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || t("errors.save"));
      }

      router.push(`/${locale}/upload`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t("errors.save"));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleNext() {
    if (!canContinue) {
      setError(t("errors.required"));
      return;
    }

    if (step === questions.length - 1) {
      void submitQuiz();
      return;
    }

    setStep((current) => current + 1);
    setError(null);
  }

  return (
    <main className="min-h-screen bg-background px-6 py-24">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {t("eyebrow")}
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
          {t("title")}
        </h1>
        <p className="mt-5 text-base leading-8 text-muted-foreground">
          {t("description")}
        </p>

        <div className="mt-10 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-3 text-sm text-muted-foreground">
          {t("step", { current: step + 1, total: questions.length })}
        </div>

        <section className="mt-8 rounded-lg border border-border bg-card p-6 md:p-8">
          <h2 className="text-2xl font-semibold text-foreground">
            {t(`questions.${currentQuestion.id}.title`)}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {currentQuestion.type === "multi" ? t("multiHint") : t("singleHint")}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {currentQuestion.options.map((option) => {
              const selected = Array.isArray(currentValue)
                ? currentValue.includes(option)
                : currentValue === option;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => updateAnswer(option)}
                  className={cn(
                    "rounded-md border px-4 py-3 text-left text-sm transition",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:bg-secondary"
                  )}
                >
                  {t(`questions.${currentQuestion.id}.options.${option}`)}
                </button>
              );
            })}
          </div>

          {error && (
            <p className="mt-5 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="simple"
              onClick={() => {
                setStep((current) => Math.max(0, current - 1));
                setError(null);
              }}
              disabled={step === 0 || isSubmitting}
            >
              {t("actions.back")}
            </Button>
            <Button type="button" onClick={handleNext} disabled={isSubmitting}>
              {step === questions.length - 1
                ? isSubmitting
                  ? t("actions.saving")
                  : t("actions.finish")
                : t("actions.next")}
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}

