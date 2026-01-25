# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

**Nano Banana Studio - New Site** is an SEO-friendly frontend for the AI image generation service. Built with Next.js 16 (SSR/SSG) based on ShipAny Template Two.

### Migration Strategy

This project follows a **progressive migration** approach:

| Role | Domain | Responsibility |
|------|--------|----------------|
| **New Site** (this repo) | nanobananastudio.com (target) | SEO entry, landing pages, blog, product info |
| **Old Site** | app.nanobananastudio.com (target) | AI tool functionality, user login, payments |

**Current Status:**
- New site: `new.nanobananastudio.com` (testing)
- Old site: `nanobananastudio.com` (production)

**Goal:** After validation, swap domains so new site becomes the main entry point while old site becomes the functional app zone.

### Old Site Reference

Located at: `/Users/liuwnfng/dev/web100/nanobananastuidio.com`
- React + Vite SPA (not SEO-friendly)
- Cloudflare Pages deployment
- Google Gemini API for AI image generation
- Creem.io payment integration

## Development Commands

```bash
# Development (with Turbopack)
pnpm dev

# Build
pnpm build
pnpm build:fast  # With increased memory limit

# Database
pnpm db:generate  # Generate migrations
pnpm db:migrate   # Run migrations
pnpm db:push      # Push schema changes
pnpm db:studio    # Open Drizzle Studio

# Code quality
pnpm lint
pnpm format

# Cloudflare deployment
pnpm cf:preview
pnpm cf:deploy
```

## Architecture

### Tech Stack

- **Framework**: Next.js 16.0.7 + React 19 + TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Drizzle ORM + PostgreSQL
- **Auth**: Better Auth
- **i18n**: next-intl (en, zh)
- **Content**: Fumadocs + MDX
- **UI**: shadcn/ui + Radix UI

### Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── [locale]/          # i18n routes
│   │   ├── (landing)/     # Public pages (home, blog, pricing)
│   │   ├── (auth)/        # Authentication pages
│   │   ├── (docs)/        # Documentation
│   │   └── (admin)/       # Admin dashboard
│   └── api/               # API routes
├── core/                   # Core modules
│   ├── auth/              # Better Auth config
│   ├── db/                # Drizzle ORM config
│   ├── i18n/              # Internationalization
│   └── theme/             # Theme provider
├── config/                 # Configuration
│   ├── locale/messages/   # Translation files (en/, zh/)
│   ├── style/             # Global styles
│   └── db/schema.ts       # Database schema
├── shared/                 # Shared code
│   ├── blocks/            # UI block components
│   ├── components/ui/     # shadcn components
│   ├── lib/seo.ts         # SEO utilities
│   └── services/          # Business logic
└── extensions/            # Optional features (ai, payment, email)

content/                   # MDX content
├── docs/                  # Documentation
├── pages/                 # Legal pages (privacy, terms)
├── posts/                 # Blog posts
└── logs/                  # Changelog
```

### Key Files

| Purpose | File |
|---------|------|
| SEO metadata | `src/shared/lib/seo.ts` |
| i18n config | `src/core/i18n/config.ts` |
| Database | `src/core/db/index.ts` |
| Auth | `src/core/auth/index.ts` |
| Environment | `src/config/index.ts` |
| Robots.txt | `src/app/robots.ts` |

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# App
NEXT_PUBLIC_APP_URL=https://new.nanobananastudio.com
NEXT_PUBLIC_APP_NAME=Nano Banana Studio
NEXT_PUBLIC_APP_LOGO=/logo.png
NEXT_PUBLIC_DEFAULT_LOCALE=en

# Database
DATABASE_URL=postgresql://...
DATABASE_PROVIDER=postgresql

# Auth
AUTH_SECRET=your-secret

# Optional: AI, Payment, Email extensions
```

## Migration Phases

### Phase 1: Brand Customization ✅
- [x] Environment configuration (.env created)
- [x] Logo and brand assets (favicon.png, logo.png)
- [x] Homepage content (Hero, features, usage, pricing, FAQ, CTA)
- [x] Navigation setup (header/footer EN/ZH)
- [x] Database setup (Supabase, schema: nanobananastudio_new)

### Phase 2: SEO Content (Current)
- [ ] Core pages (about, pricing, features, showcases)
- [ ] Blog posts (tutorials, use cases)
- [ ] Legal pages customization
- [ ] Multi-language content

### Phase 3: SEO Technical
- [ ] Metadata for all pages
- [ ] Dynamic sitemap generation
- [ ] Structured data (Schema.org)
- [ ] Performance optimization

### Phase 4: Integration
- [ ] "Start Creating" button → app.nanobananastudio.com
- [ ] Unified visual style with old site
- [ ] Navigation links between sites

### Phase 5: Testing
- [ ] Google Search Console verification
- [ ] Lighthouse SEO score > 90
- [ ] Mobile-friendly test
- [ ] All links working

### Phase 6: Domain Switch
- [ ] Deploy old site to app.nanobananastudio.com
- [ ] Deploy new site to nanobananastudio.com
- [ ] Configure 301 redirects
- [ ] Monitor for 48 hours

## Common Tasks

### Adding a New Page

1. Create page in `src/app/[locale]/(landing)/your-page/page.tsx`
2. Add translations in `src/config/locale/messages/{en,zh}/pages/your-page.json`
3. Update navigation if needed

### Adding a Blog Post

1. Create MDX file in `content/posts/your-post.mdx` (English)
2. Create `content/posts/your-post.zh.mdx` (Chinese)
3. Include frontmatter: title, description, date, author

### Updating SEO Metadata

Use the `getMetadata()` helper from `src/shared/lib/seo.ts`:

```typescript
export const generateMetadata = getMetadata({
  title: 'Page Title',
  description: 'Page description',
  keywords: 'keyword1, keyword2',
});
```

### Adding Translations

1. Add JSON file in `src/config/locale/messages/en/your-namespace.json`
2. Add Chinese version in `src/config/locale/messages/zh/your-namespace.json`
3. Register path in `src/config/locale/index.ts` if new namespace

## Deployment

### Vercel (Recommended)
```bash
# Automatic via git push, or:
vercel deploy
```

### Cloudflare
```bash
pnpm cf:deploy
```

## Notes

- Always keep old site running until migration is complete
- Test thoroughly on `new.nanobananastudio.com` before domain switch
- Preserve Google SEO weight during domain transition with proper 301 redirects
