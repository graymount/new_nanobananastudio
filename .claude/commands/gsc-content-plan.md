---
description: "GSC-driven content roadmap: next article topic, outline, and keywords from real search data (28-day window)"
---

# GSC Content Plan

Generate a data-driven content plan based on real GSC query data. Identify the best next article to write, provide a full outline, and map keywords to target.

## Protocol

You MUST follow the GSC Service Account Usage Protocol from CLAUDE.md exactly:

1. `cd ~/seo/gsc-nanobanana`
2. Run preflight: `./run.sh` (runs doctor.py, validates credentials)
3. If doctor fails, stop and report the error

## Data Fetch

Fetch **28 days** of data with full query and page detail:

```bash
cd ~/seo/gsc-nanobanana
export END_DATE=$(date -v-3d +%Y-%m-%d)
export START_DATE=$(date -v-31d +%Y-%m-%d)
export OUTPUT_DIR=outputs/content_plan_$(date +%Y%m%d)
export MAX_ROWS=5000
./run.sh /Users/mount/project/web/nanobananastudio.com/scripts/gsc-analytics/gsc_fetch.py
```

Then run the analyzer for cluster analysis:

```bash
export OUTPUT_DIR=outputs/content_plan_$(date +%Y%m%d)
./run.sh /Users/mount/project/web/nanobananastudio.com/scripts/gsc-analytics/gsc_analyze.py
```

## Analysis

Read the output CSVs and existing blog content, then:

1. **Query Gap Analysis** — Find query clusters that have impressions but no matching content page. These are topics users search for but the site doesn't adequately cover.

2. **Content Cluster Mapping** — Map existing blog posts to query clusters. Identify:
   - Well-covered topics (have content + rankings)
   - Under-served topics (queries exist, content is thin)
   - Missing topics (queries exist, no content at all)

3. **Next Article Recommendation** — Pick the single best article to write next, based on:
   - Search volume (impressions) of the query cluster
   - Competition level (current position — lower = less competitive)
   - Strategic fit (alignment with text-rendering reliability positioning)
   - Content gap (no existing page covers it well)

4. **Article Outline** — For the recommended article:
   - Suggested title (SEO-optimized)
   - Target primary keyword + secondary keywords
   - H2/H3 outline with key points per section
   - Suggested word count
   - Internal linking targets (existing pages to link to/from)
   - Languages to create (en, zh, es, ja, ko per project config)

5. **Content Pipeline** — Rank the top 5 article ideas by priority

## Context

Refer to CLAUDE.md for:
- Blog posts are MDX files in `content/posts/`
- Supported languages: en, zh, es, ja, ko
- Strategic focus: text-centric image generation, text rendering reliability
- Brand terms and seed keywords for cluster matching

Also check existing blog posts:
```bash
ls /Users/mount/project/web/nanobananastudio.com/content/posts/*.mdx | head -20
```

## Output Format

```
## GSC Content Plan — YYYY-MM-DD

### Content Gap Summary
- X query clusters with no matching content
- X clusters with thin coverage
- X clusters well-covered

### Recommended Next Article
**Title:** "..."
**Primary Keyword:** ... (X impressions, position X.X)
**Secondary Keywords:** ..., ..., ...
**Strategic Fit:** [why this aligns with text-rendering positioning]

#### Outline
1. H2: ...
   - Key point
   - Key point
2. H2: ...
   ...

**Word Count:** ~X,XXX
**Languages:** en, zh, es, ja, ko
**Internal Links:** Link to [page1], [page2]

### Content Pipeline (Top 5)
| Priority | Topic | Impressions | Position | Gap Type |
|----------|-------|-------------|----------|----------|
| 1 | ... | X | X.X | Missing |
| 2 | ... | X | X.X | Thin |
```
