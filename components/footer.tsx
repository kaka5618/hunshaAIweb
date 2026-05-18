"use client";
import React from "react";
import { Logo } from "./Logo";
import { useTranslations } from 'next-intl';
import { LocaleLink } from './locale-link';
import { NewsletterInline } from './newsletter-inline';

export const Footer = () => {
  const t = useTranslations();
  
  const productLinks = [
    {
      name: t('footer.product.quiz'),
      href: "/quiz",
    },
    {
      name: t('footer.product.sampleReport'),
      href: "/",
    },
    {
      name: t('navigation.main.pricing'),
      href: "/pricing",
    },
  ];

  const resourceLinks = [
    {
      name: t('navigation.main.blog'),
      href: "/blog",
    },
    {
      name: t('footer.resources.salonPrep'),
      href: "/blog",
    },
    {
      name: t('navigation.main.contact'),
      href: "/contact",
    },
  ];

  const legal = [
    {
      name: t('navigation.footer.legal.terms'),
      href: "/terms",
    },
    {
      name: t('navigation.footer.legal.privacy'),
      href: "/privacy",
    },
    {
      name: t('navigation.footer.legal.cookies'),
      href: "/cookies",
    },
    {
      name: t('navigation.footer.legal.refund'),
      href: "/refund",
    },
  ];
  const socials = [
    {
      name: t('footer.social.instagram'),
      href: "https://www.instagram.com/",
      external: true,
    },
    {
      name: t('footer.social.pinterest'),
      href: "https://www.pinterest.com/",
      external: true,
    },
  ];
  return (
    <div className="relative overflow-hidden border-t border-border bg-[#fffaf4]">
      <div className="relative px-8 pb-24 pt-16 md:pb-28 md:pt-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 text-sm text-muted-foreground md:grid-cols-[1.45fr_0.75fr_0.75fr_0.75fr_0.65fr]">
            <div className="max-w-md">
              <div className="mb-5 flex">
                <Logo />
              </div>
              <p className="text-base leading-7 text-muted-foreground">
                {t('footer.tagline')}
              </p>
              <div className="mt-5 text-xs text-muted-foreground/80">
                {t('common.brand.copyright')}
              </div>
              <div className="mt-6">
                <NewsletterInline />
              </div>
            </div>

            <div>
              <h3 className="mb-5 text-sm font-semibold text-foreground">
                {t('footer.product.title')}
              </h3>
              <div className="flex flex-col space-y-4">
                {productLinks.map((link) => (
                  <LocaleLink key={link.name} className="transition-colors hover:text-foreground" href={link.href}>
                    {link.name}
                  </LocaleLink>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-5 text-sm font-semibold text-foreground">
                {t('footer.resources.title')}
              </h3>
              <div className="flex flex-col space-y-4">
                {resourceLinks.map((link) => (
                  <LocaleLink key={link.name} className="transition-colors hover:text-foreground" href={link.href}>
                    {link.name}
                  </LocaleLink>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-5 text-sm font-semibold text-foreground">
                {t('footer.legal.title')}
              </h3>
              <div className="flex flex-col space-y-4">
                {legal.map((link) => (
                  <LocaleLink key={link.name} className="transition-colors hover:text-foreground" href={link.href}>
                    {link.name}
                  </LocaleLink>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-5 text-sm font-semibold text-foreground">
                {t('footer.social.title')}
              </h3>
              <div className="flex flex-col space-y-4">
                {socials.map((link) => (
                  <a key={link.name} className="transition-colors hover:text-foreground" href={link.href} target="_blank" rel="noopener noreferrer">
                    {link.name}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
        <p className="pointer-events-none absolute bottom-[-2rem] right-4 select-none text-[18vw] font-black leading-none tracking-normal text-foreground/[0.035]">
          BRIDAL
        </p>
      </div>
    </div>
  );
};
