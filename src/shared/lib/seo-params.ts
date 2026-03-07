/**
 * SEO Satellite Site — URL Parameter Ingestion
 *
 * Reads query parameters passed from SEO satellite sites into /app.
 *
 * Schema:
 *   source - SEO site identifier (e.g. "poster-generator")
 *   tool   - Generator type (e.g. "poster", "logo", "thumbnail")
 *   prompt - Pre-filled prompt text (URL-encoded)
 */

export interface SeoParams {
  source?: string;
  tool?: string;
  prompt?: string;
}

const MAX_PARAM_LENGTH = 200;
const MAX_PROMPT_LENGTH = 2000;

function sanitizeSlug(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  const decoded = (() => {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  })();
  // Allow alphanumeric, hyphens, underscores, dots
  const cleaned = decoded.trim().replace(/[^\w\-.:]/g, '').slice(0, MAX_PARAM_LENGTH);
  return cleaned || undefined;
}

function sanitizePrompt(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  const decoded = (() => {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  })();
  return decoded.trim().slice(0, MAX_PROMPT_LENGTH) || undefined;
}

/**
 * Parse and sanitize SEO parameters from Next.js searchParams.
 * Returns undefined fields for missing/invalid params — never throws.
 */
export function parseSeoParams(raw: Record<string, string | string[] | undefined>): SeoParams {
  const get = (key: string): string | undefined => {
    const v = raw[key];
    if (Array.isArray(v)) return v[0];
    return v ?? undefined;
  };

  return {
    source: sanitizeSlug(get('source')),
    tool: sanitizeSlug(get('tool')),
    prompt: sanitizePrompt(get('prompt')),
  };
}
