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

type ImageSnapshot = {
  image: HTMLImageElement;
  src: string;
  srcset: string;
};

function shouldProxyImage(src: string) {
  if (!src || src.startsWith("data:") || src.startsWith("blob:")) {
    return false;
  }

  try {
    const url = new URL(src, window.location.href);
    return url.origin !== window.location.origin;
  } catch {
    return false;
  }
}

function proxiedImageUrl(src: string) {
  return `/api/bridal/image-proxy?url=${encodeURIComponent(src)}`;
}

async function prepareImagesForExport(target: HTMLElement) {
  const snapshots: ImageSnapshot[] = [];
  const images = Array.from(target.querySelectorAll("img"));

  await Promise.all(images.map(image => {
    const source = image.currentSrc || image.src;

    snapshots.push({
      image,
      src: image.src,
      srcset: image.srcset,
    });

    if (!shouldProxyImage(source)) {
      return Promise.resolve();
    }

    return new Promise<void>(resolve => {
      const finish = () => resolve();

      image.onload = finish;
      image.onerror = finish;
      image.srcset = "";
      image.src = proxiedImageUrl(source);

      if (image.complete) {
        resolve();
      }
    });
  }));

  return () => {
    for (const snapshot of snapshots) {
      snapshot.image.onload = null;
      snapshot.image.onerror = null;
      snapshot.image.srcset = snapshot.srcset;
      snapshot.image.src = snapshot.src;
    }
  };
}

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

    let restoreImages = () => {};

    try {
      restoreImages = await prepareImagesForExport(target);
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
      restoreImages();
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
