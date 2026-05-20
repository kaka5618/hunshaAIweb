"use client";

import { useState } from "react";
import { toPng } from "html-to-image";
import { Download } from "lucide-react";
import { Button } from "@/components/button";

type DownloadPlanImageButtonProps = {
  targetId: string;
  fileName: string;
  label: string;
  loadingLabel: string;
  errorLabel: string;
};

export function DownloadPlanImageButton({
  targetId,
  fileName,
  label,
  loadingLabel,
  errorLabel,
}: DownloadPlanImageButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    const target = document.getElementById(targetId);

    if (!target) {
      setError(errorLabel);
      return;
    }

    setIsDownloading(true);
    setError(null);

    try {
      const dataUrl = await toPng(target, {
        backgroundColor: "#fffaf3",
        cacheBust: true,
        includeQueryParams: true,
        pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        filter: node => {
          if (!(node instanceof HTMLElement)) {
            return true;
          }

          return node.dataset.exportHidden !== "true";
        },
      });

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = fileName;
      link.click();
    } catch (downloadError) {
      console.error("Failed to download bridal report image", downloadError);
      setError(errorLabel);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 md:items-end" data-export-hidden="true">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleDownload}
        disabled={isDownloading}
        className="bg-white/80"
      >
        <Download className="mr-2 h-4 w-4" />
        {isDownloading ? loadingLabel : label}
      </Button>
      {error ? (
        <p className="max-w-xs text-xs leading-5 text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
