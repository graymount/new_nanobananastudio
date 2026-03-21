---
description: "Long-term SEO growth map: cluster analysis, expansion plan, 6-12 month forecast (90-day window)"
---

# GSC Growth Map

Build a long-term SEO growth strategy from 90 days of GSC data. Analyze trends, map content clusters, and create a 6-12 month expansion plan.

## Protocol

You MUST follow the GSC Service Account Usage Protocol from CLAUDE.md exactly:

1. `cd ~/seo/gsc-nanobanana`
2. Run preflight: `./run.sh` (runs doctor.py, validates credentials)
3. If doctor fails, stop and report the error

## Data Fetch

Fetch **90 days** of data for trend analysis:

```bash
cd ~/seo/gsc-nanobanana
export END_DATE=$(date -v-3d +%Y-%m-%d)
export START_DATE=$(date -v-93d +%Y-%m-%d)
export OUTPUT_DIR=outputs/growth_map_$(date +%Y%m%d)
export MAX_ROWS=5000
./run.sh /Users/mount/project/web/nanobananastudio.com/scripts/gsc-analytics/gsc_fetch.py
```

Then run the full analyzer:

```bash
export OUTPUT_DIR=outputs/growth_map_$(date +%Y%m%d)
./run.sh /Users/mount/project/web/nanobananastudio.com/scripts/gsc-analytics/gsc_analyze.py
```

## Analysis

Read all output CSVs and the generated `seo_report.md`. Produce a comprehensive growth map:

### 1. Trend Analysis (90 days)
- Monthly click/impression trends (Month 1 vs Month 2 vs Month 3)
- Overall trajectory: growing, flat, or declining?
- Seasonal patterns if detectable

### 2. Content Cluster Map
- Group all queries into thematic clusters
- For each cluster: total impressions, clicks, avg position, trend direction
- Map clusters to existing site pages
- Identify cluster gaps (search demand with no content)
- Flag clusters aligned with strategic positioning (text rendering reliability)

### 3. Competitive Position Assessment
- Which clusters is the site strongest in? (position < 5)
- Which clusters is the site weakest in? (position > 20)
- Which clusters are growing fastest in impressions?

### 4. Geographic Analysis
- Top countries by clicks and impressions
- Underserved language markets (high impressions, low CTR in a locale)
- Localization priorities

### 5. Six-Month Expansion Plan
For each month, specify:
- Content to create (article topics, target keywords)
- Pages to optimize (title/meta rewrites, content expansion)
- Technical SEO tasks
- Link building targets

### 6. Twelve-Month Forecast
- Projected click growth based on current trajectory + planned improvements
- Key milestones to track
- Risk factors (algorithm changes, competition, seasonality)

## Context

From CLAUDE.md:
- Strategic focus: text-centric image generation, text rendering reliability
- NOT pursuing: video generation, 3D, general-purpose competition
- Supported languages: en, zh, es, ja, ko
- Brand terms: nano banana, nanobanana, nano-banana, nanobananastudio
- Seed keywords: text rendering, misspelling, blurry text, typography, diffusion text, font, lettering, readable, ocr

Also check existing content:
```bash
ls /Users/mount/project/web/nanobananastudio.com/content/posts/*.mdx 2>/dev/null
```

## Output Format

```
## GSC Growth Map — YYYY-MM-DD (90-day analysis)

### Executive Summary
- Current trajectory: [growing/flat/declining]
- Biggest opportunity: [cluster name]
- Biggest risk: [issue]

### 90-Day Trend
| Month | Clicks | Impressions | Avg Position | Direction |
|-------|--------|-------------|-------------|-----------|

### Content Cluster Map
| Cluster | Queries | Impressions | Clicks | Avg Pos | Trend | Coverage |
|---------|---------|-------------|--------|---------|-------|----------|
| text rendering | X | X | X | X.X | up | 2 pages |

### Geographic Priorities
| Country | Clicks | Impressions | CTR | Priority |
|---------|--------|-------------|-----|----------|

### 6-Month Plan
**Month 1:** ...
**Month 2:** ...
...

### 12-Month Milestones
1. [milestone + target date]
2. ...
```
