import { getTranslations, setRequestLocale } from 'next-intl/server';

import { getThemePage } from '@/core/theme';
import { envConfigs } from '@/config';
import { locales, defaultLocale } from '@/config/locale';
import { Empty } from '@/shared/blocks/common';
import {
  getPost,
  getPostRawMeta,
  getPostFAQItems,
  getRelatedPosts,
} from '@/shared/models/post';
import {
  BlogPostJsonLd,
  BreadcrumbJsonLd,
  FAQJsonLd,
} from '@/shared/components/seo/JsonLd';
import { DynamicPage } from '@/shared/types/blocks/landing';

export const revalidate = 86400; // 24 hours

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations('pages.blog.metadata');

  const canonicalUrl =
    locale !== envConfigs.locale
      ? `${envConfigs.app_url}/${locale}/blog/${slug}`
      : `${envConfigs.app_url}/blog/${slug}`;

  // build hreflang alternates for all locales
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] =
      loc === defaultLocale
        ? `${envConfigs.app_url}/blog/${slug}`
        : `${envConfigs.app_url}/${loc}/blog/${slug}`;
  }
  languages['x-default'] = `${envConfigs.app_url}/blog/${slug}`;

  const post = await getPost({ slug, locale });
  if (!post) {
    return {
      title: `${slug} | ${t('title')}`,
      description: t('description'),
      alternates: {
        canonical: canonicalUrl,
        languages,
      },
    };
  }

  const imageUrl = post.image
    ? `${envConfigs.app_url}${post.image}`
    : `${envConfigs.app_url}${envConfigs.app_preview_image}`;

  const seoTitle = post.seo_title || post.title;
  const seoDescription = post.seo_description || post.description;

  return {
    title: seoTitle,
    description: seoDescription,
    alternates: {
      canonical: canonicalUrl,
      languages,
    },
    openGraph: {
      type: 'article',
      locale,
      url: canonicalUrl,
      title: seoTitle,
      description: seoDescription,
      siteName: envConfigs.app_name || '',
      images: [imageUrl],
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDescription,
      images: [imageUrl],
    },
  };
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const post = await getPost({ slug, locale });

  if (!post) {
    return <Empty message={`Post not found`} />;
  }

  // Fetch JSON-LD data and FAQ items in parallel
  const [rawMeta, faqItems] = await Promise.all([
    getPostRawMeta({ slug, locale }),
    getPostFAQItems({ slug, locale }),
  ]);

  // Fetch related posts (uses keywords from rawMeta for better matching)
  const finalRelatedPosts = await getRelatedPosts({
    slug,
    locale,
    keywords: rawMeta?.keywords,
  });

  // Canonical URL for JSON-LD (must match generateMetadata logic)
  const canonicalUrl =
    locale !== envConfigs.locale
      ? `${envConfigs.app_url}/${locale}/blog/${slug}`
      : `${envConfigs.app_url}/blog/${slug}`;

  const imageUrl = post.image
    ? `${envConfigs.app_url}${post.image}`
    : rawMeta?.image
      ? `${envConfigs.app_url}${rawMeta.image}`
      : `${envConfigs.app_url}${envConfigs.app_preview_image}`;

  // build page sections
  const page: DynamicPage = {
    sections: {
      blogDetail: {
        block: 'blog-detail',
        data: {
          post,
          relatedPosts: finalRelatedPosts,
        },
      },
    },
  };

  const Page = await getThemePage('dynamic-page');

  return (
    <>
      {/* BlogPosting JSON-LD */}
      {rawMeta && (
        <BlogPostJsonLd
          title={post.title || ''}
          description={post.description || ''}
          url={canonicalUrl}
          image={imageUrl}
          datePublished={rawMeta.datePublished}
          dateModified={rawMeta.dateModified}
          authorName={rawMeta.authorName || post.author_name}
        />
      )}

      {/* Breadcrumb JSON-LD */}
      <BreadcrumbJsonLd
        items={[
          {
            name: 'Home',
            url:
              locale !== envConfigs.locale
                ? `${envConfigs.app_url}/${locale}`
                : envConfigs.app_url,
          },
          {
            name: 'Blog',
            url:
              locale !== envConfigs.locale
                ? `${envConfigs.app_url}/${locale}/blog`
                : `${envConfigs.app_url}/blog`,
          },
          { name: post.title || slug, url: canonicalUrl },
        ]}
      />

      {/* FAQ JSON-LD (only if FAQ section exists) */}
      {faqItems.length > 0 && (
        <FAQJsonLd
          items={faqItems.map((item) => ({
            question: item.question,
            answer: item.answer,
          }))}
        />
      )}

      <Page locale={locale} page={page} />
    </>
  );
}
