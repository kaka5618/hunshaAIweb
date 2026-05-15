"use client";

import Image from "next/image";
import { ChangeEvent, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/button";
import { BRIDAL_UPLOAD_MAX_BYTES } from "@/lib/bridal/upload";

type UploadState = {
  file: File | null;
  previewUrl: string | null;
  consent: boolean;
  ageConfirmed: boolean;
  aiDisclosureAccepted: boolean;
};

const initialState: UploadState = {
  file: null,
  previewUrl: null,
  consent: false,
  ageConfirmed: false,
  aiDisclosureAccepted: false,
};

export function BridalUploadClient() {
  const t = useTranslations("bridalUpload");
  const router = useRouter();
  const locale = useLocale();
  const [state, setState] = useState<UploadState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const canUpload = useMemo(
    () =>
      Boolean(
        state.file &&
          state.consent &&
          state.ageConfirmed &&
          state.aiDisclosureAccepted &&
          !isUploading
      ),
    [isUploading, state]
  );

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setError(null);

    if (!file) {
      setState((current) => ({ ...current, file: null, previewUrl: null }));
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError(t("errors.type"));
      return;
    }

    if (file.size > BRIDAL_UPLOAD_MAX_BYTES) {
      setError(t("errors.size"));
      return;
    }

    setState((current) => ({
      ...current,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
  }

  async function handleUpload() {
    if (!state.file) {
      setError(t("errors.fileRequired"));
      return;
    }

    if (!canUpload) {
      setError(t("errors.consent"));
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const sessionResponse = await fetch("/api/bridal/session", {
        method: "POST",
      });

      if (!sessionResponse.ok) {
        throw new Error(t("errors.session"));
      }

      const formData = new FormData();
      formData.append("file", state.file);
      formData.append("consent", String(state.consent));
      formData.append("ageConfirmed", String(state.ageConfirmed));
      formData.append("aiDisclosureAccepted", String(state.aiDisclosureAccepted));

      const response = await fetch("/api/bridal/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || t("errors.upload"));
      }

      const generateResponse = await fetch("/api/bridal/generate-preview", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ locale }),
      });

      if (!generateResponse.ok) {
        const data = (await generateResponse.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || t("errors.generate"));
      }

      const data = (await generateResponse.json()) as { reportId?: string };
      const query = data.reportId ? `?reportId=${encodeURIComponent(data.reportId)}` : "";

      router.push(`/${locale}/generating${query}`);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : t("errors.upload"));
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-6 py-24">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {t("eyebrow")}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
            {t("title")}
          </h1>
          <p className="mt-5 text-base leading-8 text-muted-foreground">
            {t("description")}
          </p>
        </div>

        <section className="rounded-lg border border-border bg-card p-6 md:p-8">
          <label className="block rounded-lg border border-dashed border-border bg-background p-6 text-center transition hover:bg-secondary">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={handleFileChange}
            />
            <span className="text-sm font-medium text-foreground">
              {state.file ? state.file.name : t("dropzone.cta")}
            </span>
            <span className="mt-2 block text-xs text-muted-foreground">
              {t("dropzone.help")}
            </span>
          </label>

          {state.previewUrl && (
            <div className="mt-6 overflow-hidden rounded-lg border border-border">
              <Image
                src={state.previewUrl}
                alt={t("previewAlt")}
                width={900}
                height={1100}
                className="max-h-[420px] w-full object-contain"
                unoptimized
              />
            </div>
          )}

          <div className="mt-6 space-y-3">
            {(["consent", "ageConfirmed", "aiDisclosureAccepted"] as const).map((key) => (
              <label key={key} className="flex gap-3 text-sm leading-6 text-muted-foreground">
                <input
                  type="checkbox"
                  checked={state[key]}
                  onChange={(event) =>
                    setState((current) => ({
                      ...current,
                      [key]: event.target.checked,
                    }))
                  }
                  className="mt-1 h-4 w-4 rounded border-border"
                />
                <span>{t(`consents.${key}`)}</span>
              </label>
            ))}
          </div>

          {error && (
            <p className="mt-5 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="mt-8 flex justify-end">
            <Button type="button" onClick={handleUpload} disabled={!canUpload}>
              {isUploading ? t("actions.uploading") : t("actions.continue")}
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
