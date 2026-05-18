import { Metadata } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.yourbridalstyle.com'

interface GenerateMetadataProps {
  locale: string
  path: string
  title: string
  description: string
  ogImage?: string
}

export function generatePageMetadata({
  locale,
  path,
  title,
  description,
  ogImage = `${baseUrl}/og-image.png`,
}: GenerateMetadataProps): Metadata {
  const canonicalUrl = `${baseUrl}/${locale}${path}`

  // Generate alternate language URLs
  const alternates = {
    canonical: canonicalUrl,
    languages: {
      'en-US': `${baseUrl}/en${path}`,
      'zh-CN': `${baseUrl}/zh${path}`,
      'x-default': `${baseUrl}${path}`,
    },
  }

  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Find My Bridal Look',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: locale === 'zh' ? 'zh_CN' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}
