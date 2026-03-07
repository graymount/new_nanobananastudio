import { getTranslations, setRequestLocale } from 'next-intl/server';

import { SeoEntryTracker } from '@/shared/blocks/common/seo-entry-tracker';
import { ImageGenerator } from '@/shared/blocks/generator/image';
import { Tutorial } from '@/shared/blocks/generator/tutorial';
import { getMetadata } from '@/shared/lib/seo';
import { parseSeoParams } from '@/shared/lib/seo-params';

export const generateMetadata = getMetadata({
  metadataKey: 'app.metadata',
  canonicalUrl: '/app',
});

export default async function AppPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const rawParams = await searchParams;
  setRequestLocale(locale);

  const seoParams = parseSeoParams(rawParams);

  // Backward compat: also read ref_image directly (used by gallery "Create with this image")
  const refImageRaw = rawParams.ref_image;
  const ref_image = typeof refImageRaw === 'string' ? refImageRaw : undefined;

  const t = await getTranslations('app');

  return (
    <div className="min-h-screen relative overflow-hidden">
      <SeoEntryTracker params={seoParams} />
      {/* Ambient Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 animate-pulse-slow" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4 animate-pulse-slow animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-24 pb-8 md:pt-28 md:pb-12">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto animate-in-1">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Powered by Google Gemini
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
              <span className="text-gradient-cosmic-static">{t('title')}</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              {t('description')}
            </p>
          </div>
        </div>
      </section>

      {/* Generator Section */}
      <ImageGenerator
        srOnlyTitle={t('title')}
        className="py-4 md:py-8"
        initialRefImage={ref_image}
        initialPrompt={seoParams.prompt}
        initialTool={seoParams.tool}
        initialSource={seoParams.source}
      />

      {/* Tutorial Section */}
      <Tutorial className="mt-8 border-t border-border/50 pt-16" />
    </div>
  );
}
