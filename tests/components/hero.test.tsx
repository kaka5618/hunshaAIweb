/* eslint-disable @next/next/no-img-element */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import messages from "@/messages/en.json";
import { Hero } from "@/components/hero";

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
  useLocale: () => "en",
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

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: React.PropsWithChildren<{ href: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { src: string }) => {
    const { alt, src, priority, ...imgProps } = props;
    void priority;

    return <img alt={alt} src={src} {...imgProps} />;
  },
}));

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  motion: new Proxy(
    {},
    {
      get: (_target, tag) => {
        return (props: React.PropsWithChildren<Record<string, unknown>>) => {
          const {
            children,
            initial,
            animate,
            exit,
            transition,
            ...elementProps
          } = props;

          void initial;
          void animate;
          void exit;
          void transition;

          return React.createElement(
            typeof tag === "string" ? tag : "div",
            elementProps,
            children
          );
        };
      },
    }
  ),
}));

describe("Hero", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("routes the primary bridal CTAs to quiz and pricing", () => {
    render(<Hero />);

    expect(screen.getByRole("heading", { name: "Find My Bridal Look" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start the Style Quiz" })).toHaveAttribute(
      "href",
      "/en/quiz"
    );
    expect(screen.getByRole("link", { name: "See What's Included" })).toHaveAttribute(
      "href",
      "/en/pricing"
    );

    fireEvent.click(screen.getByRole("button", { name: "Bridal Style Report · $19.90 one-time" }));
    expect(routerPushMock).toHaveBeenCalledWith("/en/pricing");
  });
});
