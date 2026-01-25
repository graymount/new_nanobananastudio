# Phase 5: Testing Checklist

## Pre-Deployment Verification

### Build Status ✅
- [x] `pnpm build` completes successfully
- [x] No TypeScript errors
- [x] No build warnings

### SEO Files Generated ✅
- [x] `/robots.txt` - Generated with correct rules
- [x] `/sitemap.xml` - Generated with all pages (EN/ZH)
- [x] JSON-LD structured data in layout

---

## Post-Deployment Tests

### 1. Google Search Console Setup
**Steps to verify:**
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add property: `https://new.nanobananastudio.com`
3. Choose verification method:
   - **Recommended**: HTML tag (add to `<head>`)
   - OR: DNS TXT record
   - OR: HTML file upload

**To add HTML meta verification:**
Edit `src/app/[locale]/layout.tsx` and add in the metadata:
```typescript
export const metadata = {
  verification: {
    google: 'YOUR_VERIFICATION_CODE',
  },
};
```

### 2. Lighthouse SEO Audit
**Run these tests on the deployed site:**

```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run SEO audit
lighthouse https://new.nanobananastudio.com --only-categories=seo --output=json --output-path=./lighthouse-seo.json

# Run full audit
lighthouse https://new.nanobananastudio.com --output=html --output-path=./lighthouse-report.html
```

**Target scores:**
- SEO: > 90
- Performance: > 80
- Accessibility: > 90
- Best Practices: > 90

### 3. Mobile-Friendly Test
**Online tools:**
1. [Google Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)
2. Enter: `https://new.nanobananastudio.com`
3. Verify: "Page is mobile friendly"

### 4. Link Verification
**Pages to check manually:**

| Page | URL | Check |
|------|-----|-------|
| Homepage EN | `/` | ✅ All sections load |
| Homepage ZH | `/zh` | ✅ All sections load |
| Pricing EN | `/pricing` | ✅ Plans display correctly |
| Pricing ZH | `/zh/pricing` | ✅ Plans display correctly |
| Blog EN | `/blog` | ✅ Posts list loads |
| Blog ZH | `/zh/blog` | ✅ Posts list loads |
| Blog Post | `/blog/what-is-xxx` | ✅ Post renders |
| Showcases | `/showcases` | ✅ Images load |
| Updates | `/updates` | ✅ Changelog loads |

**External links to verify:**
- [ ] "Start Creating" button → opens nanobananastudio.com
- [ ] "Open App" nav link → opens nanobananastudio.com
- [ ] Footer links work correctly

### 5. SEO Metadata Verification

**Check with browser DevTools (View Source or Inspect):**

```
Homepage should have:
<title>Nano Banana Studio - AI Image Generator & Editor</title>
<meta name="description" content="Create stunning AI images...">
<meta name="keywords" content="AI image generator...">
<link rel="canonical" href="https://new.nanobananastudio.com">

Open Graph:
<meta property="og:title" content="...">
<meta property="og:description" content="...">
<meta property="og:image" content="...">
<meta property="og:url" content="...">

Twitter:
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="...">
```

### 6. Structured Data Validation

**Test with Google's Rich Results Test:**
1. Go to [Rich Results Test](https://search.google.com/test/rich-results)
2. Enter: `https://new.nanobananastudio.com`
3. Verify:
   - Organization schema detected
   - WebApplication schema detected
   - No errors

---

## Sitemap Verification

**Check sitemap content:**
```
https://new.nanobananastudio.com/sitemap.xml
```

**Expected entries:**
- Homepage (EN/ZH)
- Pricing (EN/ZH)
- Blog (EN/ZH)
- Showcases (EN/ZH)
- Updates (EN/ZH)
- Blog posts (EN/ZH)

---

## Robots.txt Verification

**Check robots.txt:**
```
https://new.nanobananastudio.com/robots.txt
```

**Expected content:**
```
User-Agent: *
Allow: /
Disallow: /*?*q=
Disallow: /privacy-policy
Disallow: /terms-of-service
Disallow: /settings/*
Disallow: /activity/*
Disallow: /admin/*
Disallow: /api/*

Sitemap: https://new.nanobananastudio.com/sitemap.xml
```

---

## Performance Quick Check

**Core Web Vitals to monitor:**
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

**Tools:**
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [WebPageTest](https://www.webpagetest.org/)

---

## Sign-Off

| Test | Status | Notes |
|------|--------|-------|
| Build | ✅ | Completed successfully |
| Sitemap | ✅ | All pages included |
| Robots.txt | ✅ | Correct configuration |
| Google Search Console | ⏳ | Awaiting deployment |
| Lighthouse SEO | ⏳ | Awaiting deployment |
| Mobile-Friendly | ⏳ | Awaiting deployment |
| Links | ✅ | All internal links valid |
| Metadata | ✅ | All pages have SEO tags |
| Structured Data | ✅ | JSON-LD added |

---

## Next Steps After Testing

1. **If all tests pass:**
   - Proceed to Phase 6: Domain Switch

2. **If issues found:**
   - Fix issues
   - Re-run build
   - Re-test affected areas
