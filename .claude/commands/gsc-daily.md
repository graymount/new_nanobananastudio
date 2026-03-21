---
description: "Daily GSC signal monitoring: anomalies, new queries, impression changes (3-day window)"
---

# GSC Daily Signal Monitor

Run a quick daily check on Google Search Console data for nanobananastudio.com.

## Protocol

You MUST follow the GSC Service Account Usage Protocol from CLAUDE.md exactly:

1. `cd ~/seo/gsc-nanobanana`
2. Run preflight: `./run.sh` (runs doctor.py, validates credentials)
3. If doctor fails, stop and report the error

## Data Fetch

After doctor passes, fetch **3 days** of data (the most recent available, accounting for GSC's ~3 day lag):

```bash
cd ~/seo/gsc-nanobanana
./run.sh scripts/fetch_all.py
```

If `fetch_all.py` does not support custom date ranges, use the project's `gsc_fetch.py` instead:

```bash
cd ~/seo/gsc-nanobanana
export START_DATE=$(date -v-6d +%Y-%m-%d)
export END_DATE=$(date -v-3d +%Y-%m-%d)
export OUTPUT_DIR=outputs/daily_$(date +%Y%m%d)
./run.sh /Users/mount/project/web/nanobananastudio.com/scripts/gsc-analytics/gsc_fetch.py
```

## Analysis

After fetching, read the output CSVs and provide a **concise** daily briefing:

1. **Traffic snapshot** — Total clicks/impressions for the period
2. **Anomalies** — Any significant spikes or drops vs. normal levels (if prior data exists in `outputs/`, compare)
3. **New queries** — Queries appearing that weren't seen in previous fetches (compare with older output files if available)
4. **Top movers** — Queries/pages with biggest impression or position changes
5. **Quick flags** — Anything that needs immediate attention

## Output Format

Keep it short — this is a 30-second daily check. Use a compact format:

```
## GSC Daily — YYYY-MM-DD

**Period:** YYYY-MM-DD → YYYY-MM-DD
**Clicks:** X | **Impressions:** X | **Avg CTR:** X% | **Avg Position:** X.X

### Signals
- [signal 1]
- [signal 2]

### New Queries (if any)
- query1 (X imp, pos X.X)

### Action Items
- [anything urgent]
```
