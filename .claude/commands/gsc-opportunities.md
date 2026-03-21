---
description: "GSC growth mining: easiest keywords to rank + specific optimization actions (28-day window)"
---

# GSC Opportunities Report

Mine GSC data for the easiest growth wins — keywords close to ranking, high-impression/low-CTR gaps, and pages ready to scale.

## Protocol

You MUST follow the GSC Service Account Usage Protocol from CLAUDE.md exactly:

1. `cd ~/seo/gsc-nanobanana`
2. Run preflight: `./run.sh` (runs doctor.py, validates credentials)
3. If doctor fails, stop and report the error

## Data Fetch

Fetch **28 days** of data:

```bash
cd ~/seo/gsc-nanobanana
export END_DATE=$(date -v-3d +%Y-%m-%d)
export START_DATE=$(date -v-31d +%Y-%m-%d)
export OUTPUT_DIR=outputs/opportunities_$(date +%Y%m%d)
export MAX_ROWS=5000
./run.sh /Users/mount/project/web/nanobananastudio.com/scripts/gsc-analytics/gsc_fetch.py
```

Then run the analyzer to generate opportunity tables:

```bash
export OUTPUT_DIR=outputs/opportunities_$(date +%Y%m%d)
./run.sh /Users/mount/project/web/nanobananastudio.com/scripts/gsc-analytics/gsc_analyze.py
```

## Analysis

Read the generated CSVs (especially the `opp_*.csv` files) and the `seo_report.md`. Focus on:

1. **Striking Distance Keywords (Position 6-15)** — Queries almost on page 1. For each:
   - Current position, impressions, clicks
   - Which page ranks for it
   - Specific action: add internal links, expand content, improve title/meta

2. **High Impressions / Low CTR** — Queries getting seen but not clicked. For each:
   - Suggest improved title tag and meta description
   - Check if the ranking page matches search intent

3. **Zero-Click Pages** — Pages with impressions but no clicks
   - Diagnose why (poor title? wrong intent? bad position?)
   - Specific fix recommendation

4. **High-CTR / Low-Impression Pages** — Pages that convert well but aren't visible enough
   - Suggest ways to increase their reach (internal links, content expansion, backlinks)

5. **Quick Wins Ranking** — Rank all opportunities by effort/impact ratio:
   - Low effort + high impact = do first
   - High effort + high impact = plan for
   - Low effort + low impact = batch later

## Output Format

```
## GSC Opportunities — YYYY-MM-DD (28-day window)

### Quick Wins (Do This Week)
1. **[query/page]** — [specific action with expected impact]
2. ...

### Striking Distance Keywords
| Query | Position | Impressions | Page | Action |
|-------|----------|-------------|------|--------|

### CTR Improvement Targets
| Query | Impressions | CTR | Suggested Title |
|-------|-------------|-----|-----------------|

### Pages to Scale
| Page | Clicks | CTR | Action |
|------|--------|-----|--------|

### Effort/Impact Matrix
| Priority | Opportunity | Effort | Expected Impact |
|----------|-------------|--------|-----------------|
| 1 | ... | Low | High |
```
