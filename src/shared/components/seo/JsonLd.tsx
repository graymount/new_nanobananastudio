'use client';

import { envConfigs } from '@/config';

/**
 * JSON-LD Structured Data Components
 *
 * These components use dangerouslySetInnerHTML which is safe here because:
 * 1. All data comes from our own config/props, not user input
 * 2. JSON.stringify escapes any special characters
 * 3. This is the standard pattern for JSON-LD in React/Next.js
 */

// Organization schema for the website
export function OrganizationJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: envConfigs.app_name || 'Nano Banana Studio',
    url: envConfigs.app_url,
    logo: `${envConfigs.app_url}/logo.png`,
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@nanobananastudio.com',
      contactType: 'customer service',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// WebApplication schema for the AI tool
export function WebApplicationJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: envConfigs.app_name || 'Nano Banana Studio',
    url: envConfigs.app_url,
    description: 'AI-powered image generator and editor using natural language. Create stunning visuals from text descriptions or transform existing photos.',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: '0',
      highPrice: '69.9',
      offerCount: '3',
    },
    featureList: [
      'Text-to-image generation',
      'AI image editing',
      'Multiple artistic styles',
      'Cyberpunk style',
      'Anime/Miyazaki style',
      'Watercolor style',
      'Pixel art style',
      'Photorealistic style',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// FAQ schema for FAQ sections
interface FAQItem {
  question: string;
  answer: string;
}

export function FAQJsonLd({ items }: { items: FAQItem[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// Blog post schema
interface BlogPostJsonLdProps {
  title: string;
  description: string;
  url: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  authorName?: string;
}

export function BlogPostJsonLd({
  title,
  description,
  url,
  image,
  datePublished,
  dateModified,
  authorName = 'Nano Banana Team',
}: BlogPostJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description: description,
    url: url,
    image: image || `${envConfigs.app_url}/preview.png`,
    datePublished: datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Person',
      name: authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: envConfigs.app_name || 'Nano Banana Studio',
      logo: {
        '@type': 'ImageObject',
        url: `${envConfigs.app_url}/logo.png`,
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// Product schema for pricing page
interface PricingPlan {
  name: string;
  description: string;
  price: number;
  currency: string;
}

export function ProductJsonLd({ plans }: { plans: PricingPlan[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: envConfigs.app_name || 'Nano Banana Studio',
    description: 'AI-powered image generator and editor',
    brand: {
      '@type': 'Brand',
      name: 'Nano Banana Studio',
    },
    offers: plans.map((plan) => ({
      '@type': 'Offer',
      name: plan.name,
      description: plan.description,
      price: plan.price,
      priceCurrency: plan.currency,
      availability: 'https://schema.org/InStock',
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// BreadcrumbList schema
interface BreadcrumbItem {
  name: string;
  url: string;
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
