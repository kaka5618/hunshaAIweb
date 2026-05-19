"use client";

import { useTranslations } from 'next-intl';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('auth.sidePanel');

  const slides = [
    {
      className: "scale-100",
      overlay: "bg-gradient-to-br from-[#d4c2ae]/20 via-transparent to-[#6a5849]/35",
      position: "center",
    },
    {
      className: "scale-110",
      overlay: "bg-gradient-to-br from-[#efe4d8]/35 via-transparent to-[#534840]/45",
      position: "42% 50%",
    },
    {
      className: "scale-105",
      overlay: "bg-gradient-to-br from-[#e7e2dc]/25 via-transparent to-[#727b67]/35",
      position: "58% 50%",
    },
  ];

  return (
    <>
      <div className="w-full min-h-screen grid grid-cols-1 md:grid-cols-2">
        {children}
        <div className="relative z-20 hidden min-h-screen w-full overflow-hidden border-l border-border bg-[#211d19] md:flex">
          <div className="absolute inset-0">
            {slides.map((slide, index) => (
              <div
                key={slide.position}
                className="auth-bridal-slide absolute inset-0 overflow-hidden"
                style={{ animationDelay: `${index * 4}s` }}
              >
                <div
                  className={`absolute inset-0 bg-cover bg-no-repeat ${slide.className}`}
                  style={{
                    backgroundImage: "url('/bridal-feature-look.jpeg')",
                    backgroundPosition: slide.position,
                  }}
                />
                <div className={`absolute inset-0 ${slide.overlay}`} />
              </div>
            ))}
            <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/15 to-black/70" />
            <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/55 to-transparent" />
          </div>

          <div className="relative z-10 flex h-full min-h-screen w-full flex-col justify-end px-10 py-12 xl:px-16">
            <div className="mb-8 inline-flex w-fit rounded-full border border-white/35 bg-white/15 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-md">
              {t('eyebrow')}
            </div>
            <div className="max-w-xl">
              <h2 className="text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
                {t('title')}
              </h2>
              <p className="mt-5 text-lg leading-8 text-white/80">
                {t('description')}
              </p>
            </div>
            <div className="mt-10 grid gap-4 xl:grid-cols-[1fr_0.85fr]">
              <div className="rounded-2xl border border-white/25 bg-white/15 p-5 text-white shadow-2xl backdrop-blur-xl">
                <p className="text-sm font-semibold uppercase tracking-wide text-white/70">
                  {t('previewLabel')}
                </p>
                <p className="mt-2 text-base leading-7 text-white/90">
                  {t('previewText')}
                </p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-black/20 p-5 text-white backdrop-blur-lg">
                <p className="text-sm font-semibold uppercase tracking-wide text-white/65">
                  {t('includesLabel')}
                </p>
                <ul className="mt-3 space-y-2 text-sm text-white/85">
                  <li>{t('includes.visuals')}</li>
                  <li>{t('includes.fitNotes')}</li>
                  <li>{t('includes.salonScript')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
