/* eslint-disable @next/next/no-img-element */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import messages from "@/messages/en.json";
import { BridalUploadClient } from "@/app/[locale]/upload/upload-client";

const routerPushMock = vi.fn();

function getNestedValue(source: Record<string, unknown>, path: string) {
  return path.split(".").reduce<unknown>((value, key) => {
    if (value && typeof value === "object" && key in value) {
      return (value as Record<string, unknown>)[key];
    }

    return undefined;
  }, source);
}

vi.mock("next-intl", () => ({
  useLocale: () => "zh",
  useTranslations: (namespace?: string) => {
    const root = namespace
      ? (getNestedValue(messages as Record<string, unknown>, namespace) as Record<string, unknown>)
      : (messages as Record<string, unknown>);

    return (path: string) => {
      const value = getNestedValue(root, path);

      if (typeof value !== "string") {
        throw new Error(`Missing translation for ${namespace ?? "root"}:${path}`);
      }

      return value;
    };
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerPushMock,
  }),
}));

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { src: string }) => {
    const { alt, src, priority, unoptimized, ...imgProps } = props;
    void priority;
    void unoptimized;

    return <img alt={alt} src={src} {...imgProps} />;
  },
}));

describe("BridalUploadClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:test-preview"),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("generates English report content even when the UI locale is not English", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ reportId: "report-1" }),
      });

    vi.stubGlobal("fetch", fetchMock);

    render(<BridalUploadClient />);

    const file = new File(["photo"], "bride.jpg", { type: "image/jpeg" });
    const input = document.querySelector("input[type='file']") as HTMLInputElement;
    await userEvent.upload(input, file);

    await userEvent.click(screen.getByLabelText(/right to upload this photo/i));
    await userEvent.click(screen.getByLabelText(/at least 18 years old/i));
    await userEvent.click(screen.getByLabelText(/AI-generated style simulation/i));
    await userEvent.click(screen.getByRole("button", { name: "Continue to Preview" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/bridal/generate-preview",
        expect.objectContaining({
          body: JSON.stringify({ locale: "en" }),
        }),
      );
    });
    expect(routerPushMock).toHaveBeenCalledWith("/zh/generating?reportId=report-1");
  });
});
