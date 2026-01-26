import { getTranslations, setRequestLocale } from 'next-intl/server';

import { ImageGenerator } from '@/shared/blocks/generator/image';
import { Tutorial } from '@/shared/blocks/generator/tutorial';
import { getMetadata } from '@/shared/lib/seo';

export const generateMetadata = getMetadata({
  metadataKey: 'app.metadata',
  canonicalUrl: '/app',
});

export default async function AppPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ref_image?: string; prompt?: string }>;
}) {
  const { locale } = await params;
  const { ref_image, prompt } = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations('app');

  return (
    <div className="min-h-screen pt-20">
      <div className="container py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">{t('description')}</p>
        </div>

        <ImageGenerator
          srOnlyTitle={t('title')}
          className="py-0 md:py-0"
          initialRefImage={ref_image}
          initialPrompt={prompt}
        />

        {/* Tutorial Section for SEO and User Guidance */}
        <Tutorial className="mt-16 border-t pt-16" />
      </div>
    </div>
  );
}
