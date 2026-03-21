---
description: "Weekly GSC strategy: keyword clusters, ranking opportunities, content direction (7+7 day comparison)"
---

# GSC Weekly Strategy Report

Run a weekly strategic analysis comparing this week vs last week using Google Search Console data.

## Protocol

You MUST follow the GSC Service Account Usage Protocol from CLAUDE.md exactly:

1. `cd ~/seo/gsc-nanobanana`
2. Run preflight: `./run.sh` (runs doctor.py, validates credentials)
3. If doctor fails, stop and report the error

## Data Fetch

Fetch **two 7-day periods** for comparison (accounting for GSC's ~3 day lag):

```bash
cd ~/seo/gsc-nanobanana

# This week (most recent 7 days available)
export END_DATE=$(date -v-3d +%Y-%m-%d)
export START_DATE=$(date -v-10d +%Y-%m-%d)
export OUTPUT_DIR=outputs/weekly_this_$(date +%Y%m%d)
./run.sh /Users/mount/project/web/nanobananastudio.com/scripts/gsc-analytics/gsc_fetch.py

# Last week
export END_DATE=$(date -v-10d +%Y-%m-%d)
export START_DATE=$(date -v-17d +%Y-%m-%d)
export OUTPUT_DIR=outputs/weekly_last_$(date +%Y%m%d)
./run.sh /Users/mount/project/web/nanobananastudio.com/scripts/gsc-analytics/gsc_fetch.py
```

## Analysis

Read both sets of CSVs and produce a strategic weekly report:

1. **Week-over-Week Summary** — Clicks, impressions, CTR, position changes with % deltas
2. **Keyword Clusters** — Group queries by topic, identify growing/declining clusters
3. **Ranking Movement** — Queries that moved up/down significantly in position
4. **New Opportunities** — Queries that appeared this week but not last week
5. **Lost Queries** — Queries that disappeared or dropped significantly
6. **Page Performance** — Pages gaining/losing traffic
7. **Content Direction** — Based on emerging queries, suggest content topics to pursue

## Context

Refer to the project's strategic focus from CLAUDE.md:
- Text-centric image generation and text rendering reliability
- Brand: Nano Banana Studio
- Brand terms: nano banana, nanobanana, nano-banana, nanobananastudio
- Seed keywords: text rendering, misspelling, blurry text, typography, diffusion text, font, lettering, readable, ocr

## Output Format

```
## GSC Weekly — Week of YYYY-MM-DD

### Performance Summary
| Metric | This Week | Last Week | Change |
|--------|-----------|-----------|--------|
| Clicks | X | X | +X% |
| Impressions | X | X | +X% |
| Avg CTR | X% | X% | +X% |
| Avg Position | X.X | X.X | +X.X |

### Key Movements
- [trending up/down queries]

### Content Opportunities
- [suggested topics based on query trends]

### Recommended Actions
1. [prioritized action items for the week]
```
