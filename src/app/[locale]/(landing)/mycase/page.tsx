import { getTranslations, setRequestLocale } from 'next-intl/server';

import { getThemeBlock } from '@/core/theme';
import { locales } from '@/config/locale';
import { getMetadata } from '@/shared/lib/seo';

export const dynamic = 'force-static';
export const revalidate = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const generateMetadata = getMetadata({
  metadataKey: 'pages.mycase.metadata',
  canonicalUrl: '/mycase',
});

export default async function MyCasePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // get page data
  const t = await getTranslations('pages.mycase');

  const section = {
    id: 'gallery',
    title: t.raw('page.sections.gallery.title'),
    description: t.raw('page.sections.gallery.description'),
  };

  // load gallery component
  const MyCaseGallery = await getThemeBlock('mycase-gallery');

  return <MyCaseGallery section={section} />;
}
