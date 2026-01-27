# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

**Nano Banana Studio - New Site** is an SEO-friendly frontend for the AI image generation service. Built with Next.js 16 (SSR/SSG) based on ShipAny Template Two.

### Key Features

- **AI Image Generator** (`/app`) - Text-to-image and image-to-image generation powered by Google Gemini
- **My Gallery** (`/mycase`) - Personal gallery with lightbox view, delete functionality, and "Create with this image" feature
- **Prompt Inspirations** - Homepage section with clickable prompt cards that auto-fill the generator
- **Use Cases** - Showcase of different AI image use cases (e-commerce, social media, art, photo enhancement)
- **Activity Dashboard** (`/activity`) - View AI task history
- **Settings** (`/settings`) - Profile, billing, and credits management
- **Bilingual Support** - Full EN/ZH localization

### Migration Strategy

This project follows a **progressive migration** approach:

| Role | Domain | Responsibility |
|------|--------|----------------|
| **New Site** (this repo) | nanobananastudio.com (target) | SEO entry, landing pages, blog, product info, AI tools |
| **Classic Site** | classic.nanobananastudio.com | Legacy version for reference |

**Current Status:** ✅ Domain Switch Completed
- Production site: `nanobananastudio.com` (live)
- Classic site: `classic.nanobananastudio.com` (legacy reference)

**Data Migration:** ✅ Completed
- Users, subscriptions, credits migrated from old site
- Both sites share the same Supabase database (different schemas)
- Old schema: `public`, New schema: `nanobananastudio_new`
- Migration scripts: `scripts/migration/`

### Classic Site Reference

Located at: `/Users/liuwnfng/dev/web100/nanobananastuidio.com`
- React + Vite SPA (not SEO-friendly)
- Cloudflare Pages deployment
- Google Gemini API for AI image generation
- Creem.io payment integration

### Payment Integration

- **Provider:** Creem.io
- **Webhook:** `/api/payment/notify/creem`
- **Plans:** Free (8 credits), Pro ($29.90/mo, 300 credits), Max ($99.90/mo, 1000 credits)
- **Status:** ✅ Verified working

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
│   │   ├── (landing)/     # Public pages
│   │   │   ├── app/       # AI Image Generator page
│   │   │   ├── mycase/    # User's personal gallery
│   │   │   ├── pricing/   # Pricing page
│   │   │   └── blog/      # Blog
│   │   ├── (auth)/        # Authentication pages
│   │   ├── (docs)/        # Documentation
│   │   └── (admin)/       # Admin dashboard
│   └── api/               # API routes
│       └── user/images/   # User's AI-generated images API
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
│   │   ├── generator/     # AI image generator components
│   │   └── gallery/       # Gallery components
│   ├── components/ui/     # shadcn components
│   ├── lib/seo.ts         # SEO utilities
│   └── services/          # Business logic
├── themes/default/blocks/ # Theme-specific blocks
│   ├── prompt-inspirations.tsx  # Clickable prompt cards
│   ├── use-cases.tsx            # Use case showcase
│   ├── showcases-gallery.tsx    # User gallery block
│   └── hero-generator.tsx       # Homepage hero with generator
└── extensions/            # Optional features (ai, payment, email)

content/                   # MDX content
├── docs/                  # Documentation
├── pages/                 # Legal pages (privacy, terms)
├── posts/                 # Blog posts
└── logs/                  # Changelog

public/imgs/               # Static images
├── inspirations/          # Prompt inspiration images
├── use-cases/             # Use case images
└── showcases/             # Sample showcase images
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
| AI Image Generator | `src/shared/blocks/generator/image.tsx` |
| Theme blocks index | `src/themes/default/blocks/index.tsx` |
| Homepage config (EN) | `src/config/locale/messages/en/pages/index.json` |
| Homepage config (ZH) | `src/config/locale/messages/zh/pages/index.json` |

### Theme Block System

Theme blocks are registered in `src/themes/default/blocks/index.tsx` and referenced by name in page config JSON files.

**Available Blocks:**
- `hero-generator` - Homepage hero with embedded prompt input
- `prompt-inspirations` - Grid of clickable prompt cards
- `use-cases` - Alternating left/right showcase sections
- `showcases-gallery` - User's personal image gallery
- `features` - Feature grid with icons
- `pricing-preview` - Pricing tier cards
- `faq` - Accordion FAQ section
- `cta` - Call-to-action section

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# App
NEXT_PUBLIC_APP_URL=https://nanobananastudio.com
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

### Phase 2: SEO Content ✅
- [x] Pricing page content (Free/Pro/Max plans)
- [x] Blog posts (AI image generation tutorial EN/ZH)
- [x] Legal pages customization (Privacy/Terms EN/ZH)
- [x] Multi-language content

### Phase 3: SEO Technical ✅
- [x] Metadata for all pages (homepage, blog, pricing)
- [x] Dynamic sitemap generation (src/app/sitemap.ts)
- [x] Structured data (Organization, WebApplication JSON-LD)
- [x] SEO keywords in common metadata

### Phase 4: Integration ✅
- [x] APP_TOOL_URL env variable for easy domain switching
- [x] Unified visual style (cyberpunk CSS utilities)
- [x] Navigation "Open App" link added (EN/ZH)

### Phase 5: Testing ✅
- [x] Build verification (pnpm build successful)
- [x] Sitemap generation verified
- [x] Robots.txt verified
- [x] Link checker script created
- [x] Testing checklist created (docs/TESTING_CHECKLIST.md)
- [ ] Google Search Console (requires deployment)
- [ ] Lighthouse audit (requires deployment)
- [ ] Mobile-friendly test (requires deployment)

### Phase 6: Feature Development ✅
- [x] AI Image Generator (`/app`) - text-to-image and image-to-image
- [x] My Gallery (`/mycase`) - user's personal AI image gallery
- [x] Homepage redesign - Prompt Inspirations + Use Cases sections
- [x] Prompt auto-fill via URL query parameters
- [x] Gallery lightbox with "Create with this image" feature
- [x] Gallery delete functionality

### Phase 7: Payment & Settings ✅
- [x] Creem.io payment webhook verified working
- [x] Settings page simplified (removed API Keys, Payments)
- [x] Billing page simplified (hidden cancel options)
- [x] Activity page simplified (removed AI Chats)
- [x] User dropdown menu updated (added Settings entry)
- [x] Data migration from old site completed

### Phase 8: Domain Switch ✅
- [x] Deploy new site to nanobananastudio.com
- [x] Configure 301 redirects from classic site
- [x] Domain switch completed (2025-01)

## Common Tasks

### AI Image Generator URL Parameters

The `/app` page accepts query parameters to pre-fill the generator:

```
/app?prompt=Your%20prompt%20here     # Pre-fill text prompt
/app?ref_image=https://...           # Pre-load reference image for image-to-image
```

This is used by:
- Prompt Inspirations cards ("Try this prompt" → `/app?prompt=...`)
- Use Cases buttons ("Try it now" → `/app?prompt=...`)
- My Gallery lightbox ("Create with this image" → `/app?ref_image=...`)

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

### Modifying Homepage Sections

Homepage sections are configured in `src/config/locale/messages/{en,zh}/pages/index.json`:

```json
{
  "page": {
    "show_sections": ["hero", "features", "prompt_inspirations", "use_cases", "pricing_preview", "faq", "cta"],
    "sections": {
      "hero": { "block": "hero-generator", "title": "...", ... },
      "prompt_inspirations": { "block": "prompt-inspirations", ... },
      "use_cases": { "block": "use-cases", ... }
    }
  }
}
```

- `show_sections`: Array of section keys to display (order matters)
- `sections`: Configuration for each section
- `block`: References a theme block from `src/themes/default/blocks/`

### Adding a New Theme Block

1. Create component in `src/themes/default/blocks/your-block.tsx`
2. Export from `src/themes/default/blocks/index.tsx`
3. Reference by name in page config JSON: `"block": "your-block"`

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

- Classic site remains available at `classic.nanobananastudio.com` for reference
- Production URL: `https://nanobananastudio.com`
- Sitemap URL: `https://nanobananastudio.com/sitemap.xml`

### Image Assets

Images for homepage sections are stored in:
- `/public/imgs/inspirations/` - Prompt inspiration cards (cyberpunk-city.png, cute-cat.png, fantasy-landscape.png, abstract-art.png)
- `/public/imgs/use-cases/` - Use case images (ecommerce.png, social-media.png, art-illustration.png, photo-editing.png)
- `/public/imgs/showcases/` - Sample showcase images

### Admin Panel

Admin dashboard at `/admin` with role-based access control:

| Page | Path | Description |
|------|------|-------------|
| Users | `/admin/users` | User management with search |
| User Creations | `/admin/users/[id]/creations` | View user's AI-generated images |
| AI Tasks | `/admin/ai-tasks` | All AI tasks with filtering |
| Subscriptions | `/admin/subscriptions` | Subscription management |
| Credits | `/admin/credits` | Credit transactions |
| Payments | `/admin/payments` | Payment records |

**User Actions (dropdown):**
- View Creations - See user's AI-generated content
- Edit User - Modify user info
- Edit Roles - Assign roles
- Grant Credits - Add credits to user

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/user/images` | GET | Get user's AI-generated images (requires auth) |
| `/api/user/images` | DELETE | Delete an AI-generated image (requires auth) |
| `/api/ai/generate` | POST | Generate AI image |
| `/api/proxy/file` | GET | Proxy for downloading images |
| `/api/payment/notify/creem` | POST | Creem.io payment webhook |

### Configuration Files

| Purpose | File |
|---------|------|
| Landing header/footer | `src/config/locale/messages/{en,zh}/landing.json` |
| Settings sidebar | `src/config/locale/messages/{en,zh}/settings/sidebar.json` |
| Activity sidebar | `src/config/locale/messages/{en,zh}/activity/sidebar.json` |
| Pricing plans | `src/config/locale/messages/{en,zh}/pages/pricing.json` |

### Data Migration

Migration scripts are in `scripts/migration/`:
- `migrate-users.ts` - Migrate users and OAuth accounts
- `migrate-usage.ts` - Migrate subscriptions and credits
- `migrate-images.ts` - Migrate AI-generated images
- `run-all.ts` - Run all migrations
- `check-balance.ts` - Verify user balance after migration

```bash
# Run migration (dry run first)
DRY_RUN=true pnpm migrate

# Run actual migration
DRY_RUN=false pnpm migrate
```
