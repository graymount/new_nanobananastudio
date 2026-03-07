'use client';

import { useEffect } from 'react';

import type { SeoParams } from '@/shared/lib/seo-params';

/**
 * Logs SEO satellite entry parameters to the console.
 * Future hook point for analytics integration.
 */
export function SeoEntryTracker({ params }: { params: SeoParams }) {
  useEffect(() => {
    const { source, tool, prompt } = params;
    if (!source && !tool && !prompt) return;

    console.log('[seo-entry]', {
      source: source ?? null,
      tool: tool ?? null,
      prompt: prompt ? '(provided)' : null,
      timestamp: new Date().toISOString(),
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
