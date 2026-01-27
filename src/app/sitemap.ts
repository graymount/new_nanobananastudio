import { MetadataRoute } from 'next';

import { envConfigs } from '@/config';
import { locales, defaultLocale } from '@/config/locale';
import { getPostsAndCategories } from '@/shared/models/post';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = envConfigs.app_url;

  // Static pages that should be indexed
  const staticPages = [
    '', // Homepage
    '/app', // AI Image Generator
    '/pricing',
    '/blog',
  ];

  // Generate entries for static pages (all locales)
  const staticEntries: MetadataRoute.Sitemap = [];

  for (const page of staticPages) {
    // Default locale (no prefix)
    staticEntries.push({
      url: `${appUrl}${page}`,
      lastModified: new Date(),
      changeFrequency: page === '' ? 'daily' : 'weekly',
      priority: page === '' ? 1.0 : 0.8,
    });

    // Other locales
    for (const locale of locales) {
      if (locale !== defaultLocale) {
        staticEntries.push({
          url: `${appUrl}/${locale}${page}`,
          lastModified: new Date(),
          changeFrequency: page === '' ? 'daily' : 'weekly',
          priority: page === '' ? 1.0 : 0.8,
        });
      }
    }
  }

  // Generate entries for blog posts
  const blogEntries: MetadataRoute.Sitemap = [];

  try {
    // Get posts for each locale
    for (const locale of locales) {
      const { posts } = await getPostsAndCategories({
        locale,
        page: 1,
        limit: 100
      });

      for (const post of posts) {
        const urlPath = locale === defaultLocale
          ? `/blog/${post.slug}`
          : `/${locale}/blog/${post.slug}`;

        blogEntries.push({
          url: `${appUrl}${urlPath}`,
          lastModified: post.created_at ? new Date(post.created_at) : new Date(),
          changeFrequency: 'monthly',
          priority: 0.6,
        });
      }
    }
  } catch (error) {
    console.error('Error generating blog sitemap entries:', error);
  }

  return [...staticEntries, ...blogEntries];
}
