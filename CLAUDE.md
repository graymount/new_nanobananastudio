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
- **Multilingual Support** - Full localization for EN, ZH, ES, JA, KO (5 languages)

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

Located at: `/Users/liuwnfng/dev/web100/classic.nanobananastudio.com`
- React + Vite SPA (not SEO-friendly)
- Cloudflare Pages deployment
- Google Gemini API for AI image generation
- Creem.io payment integration

### Payment Integration

- **Provider:** Creem.io
- **Webhook:** `/api/payment/notify/creem`
- **Plans:** Free (8 credits), Pro ($29.90/mo, 300 credits), Max ($69.90/mo, 1000 credits)
- **Status:** ✅ Verified working

### Authentication

- **Method:** Google OAuth only (email/password registration disabled to prevent abuse)
- **Provider:** Better Auth
- **New User Benefits:** 8 free credits + welcome email
- **Config:** `/admin/settings/auth` (Google OAuth enabled, Email Auth disabled)

### Email Integration

**Outbound (Sending):**
- **Provider:** Resend
- **Account:** wnfng.liu+nanobananastudio@gmail.com
- **API Key Name:** nanobananastudio-production
- **Region:** Tokyo (ap-northeast-1)
- **Sender Email:** support@nanobananastudio.com
- **DNS Records:** ✅ Verified (DKIM, SPF, MX, DMARC)
- **Status:** ✅ Configured
- **Welcome Email:** Sent automatically on new user registration (EN/ZH based on locale)
- **Preview:** `/api/admin/emails/preview-welcome?locale=en` (requires admin login)

**Inbound (Receiving):**
- **Provider:** Cloudflare Email Routing + Worker
- **Worker:** `workers/email-receiver/` - forwards emails to webhook
- **Webhook:** `/api/webhook/email`
- **Setup:** See `workers/email-receiver/README.md`
- **Status:** ⚠️ Requires deployment (run `cd workers/email-receiver && pnpm deploy`)

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
- **i18n**: next-intl (en, zh, es, ja, ko)
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
│   ├── locale/messages/   # Translation files (en/, zh/, es/, ja/, ko/)
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
| Homepage config | `src/config/locale/messages/{locale}/pages/index.json` |
| Locale config | `src/config/locale/index.ts` |

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
2. Add translations in `src/config/locale/messages/{en,zh,es,ja,ko}/pages/your-page.json`
3. Update navigation if needed

### Adding a Blog Post

1. Create MDX file in `content/posts/your-post.mdx` (English)
2. Create localized versions: `your-post.zh.mdx`, `your-post.es.mdx`, `your-post.ja.mdx`, `your-post.ko.mdx`
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
2. Add translations for other languages in `zh/`, `es/`, `ja/`, `ko/` directories
3. Register path in `src/config/locale/index.ts` if new namespace

**Supported Languages:**
- `en` - English (default)
- `zh` - Chinese (中文)
- `es` - Spanish (Español)
- `ja` - Japanese (日本語)
- `ko` - Korean (한국어)

### Modifying Homepage Sections

Homepage sections are configured in `src/config/locale/messages/{en,zh,es,ja,ko}/pages/index.json`:

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
| Emails | `/admin/emails` | Email inbox/outbox management |
| Email Compose | `/admin/emails/compose` | Send new emails |

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
| `/api/admin/emails/send` | POST | Send email (admin) |
| `/api/admin/emails/reply` | POST | Reply to email (admin) |
| `/api/admin/emails/preview-welcome` | GET | Preview welcome email template |
| `/api/webhook/email` | POST | Receive inbound emails (Cloudflare) |

### Configuration Files

| Purpose | File |
|---------|------|
| Landing header/footer | `src/config/locale/messages/{locale}/landing.json` |
| Settings sidebar | `src/config/locale/messages/{locale}/settings/sidebar.json` |
| Activity sidebar | `src/config/locale/messages/{locale}/activity/sidebar.json` |
| Pricing plans | `src/config/locale/messages/{locale}/pages/pricing.json` |

Note: `{locale}` refers to language directories: `en`, `zh`, `es`, `ja`, `ko`

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

### Marketing & SEO Strategy

**Traffic Sources (observed):**
- Direct visits
- ChatGPT referrals (chatgpt.com) - users asking ChatGPT for AI image tools get recommended here

**ChatGPT/AI Chatbot Optimization:**

AI chatbots recommend sites based on their training data. To increase recommendations:

1. **Increase Web Presence:**
   - Product Hunt launch
   - AlternativeTo listing (as Midjourney/DALL-E alternative)
   - Reddit posts (r/AIart, r/StableDiffusion)
   - Medium/Dev.to tutorials

2. **Target Keywords (include in homepage & blog):**
   - "free AI image generator"
   - "text to image AI tool"
   - "AI art generator online"
   - "Gemini image generation"
   - "best AI image generator 2025"

3. **Comparison Content:**
   - "Nano Banana Studio vs Midjourney"
   - "Top 10 Free AI Image Generators"

4. **Structured Data:** Already have WebApplication JSON-LD

**SEO TODO:**
- [ ] Product Hunt launch
- [ ] AlternativeTo listing
- [ ] Write comparison blog posts
- [ ] Optimize meta descriptions with target keywords
- [ ] Reddit community engagement

**User Demographics (from registrations):**
- English (en) - primary
- Arabic (ar) - emerging market (no localization yet)
- Chinese (zh), Spanish (es), Japanese (ja), Korean (ko) - supported
