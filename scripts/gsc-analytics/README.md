# GSC Analytics — Search Console Data Extraction & SEO Report

A self-contained Python toolkit that extracts search performance data from Google Search Console via the API, then produces CSV exports and a comprehensive Markdown SEO report.

## Prerequisites

- Python 3.11+
- A Google Cloud project with the **Search Console API** enabled
- A **Service Account** JSON key (not OAuth browser flow)

## Setup

### 1. Create a Service Account

1. Go to [Google Cloud Console → IAM & Admin → Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
2. Select your project (or create one)
3. Click **Create Service Account**
   - Name: `gsc-reader` (or anything)
   - Role: no IAM role needed (GSC uses its own permissions)
4. Click the service account → **Keys** tab → **Add Key** → **Create new key** → **JSON**
5. Download the JSON file and save it (e.g., `./service-account.json`)

### 2. Enable the Search Console API

1. Go to [APIs & Services → Library](https://console.cloud.google.com/apis/library)
2. Search for **Google Search Console API**
3. Click **Enable**

### 3. Add Service Account to GSC

This is the critical step — without it the API returns empty results.

1. Open [Google Search Console](https://search.google.com/search-console)
2. Select your property (e.g., `nanobananastudio.com`)
3. Go to **Settings** (gear icon) → **Users and permissions**
4. Click **Add user**
5. Enter the **service account email** (e.g., `gsc-reader@your-project.iam.gserviceaccount.com`)
6. Set permission to **Full** (read-only is sufficient but "Full" ensures all data access)
7. Click **Add**

The service account email is in the JSON key file under the `client_email` field.

### 4. Install Dependencies

```bash
cd scripts/gsc-analytics
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 5. Configure

```bash
cp .env.example .env
# Edit .env with your values
```

Key settings:

| Variable | Description | Example |
|----------|-------------|---------|
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to service account JSON | `./service-account.json` |
| `GSC_SITE_URL` | GSC property identifier | `sc-domain:nanobananastudio.com` |
| `START_DATE` | Start of date range | `2025-12-01` |
| `END_DATE` | End of date range | `2026-03-01` |
| `BRAND_TERMS` | Comma-separated brand patterns | `nano banana,nanobanana` |
| `CLUSTER_SEEDS` | Keywords for cluster highlighting | `text rendering,typography` |
| `OUTPUT_DIR` | Output directory | `./output` |

**Property URL formats:**
- Domain property: `sc-domain:nanobananastudio.com`
- URL-prefix property: `https://nanobananastudio.com/`

## Usage

### Step 1: Fetch data

```bash
python gsc_fetch.py
```

This creates CSV files in `OUTPUT_DIR`:

| File | Contents |
|------|----------|
| `daily.csv` | Day-by-day clicks/impressions/CTR/position |
| `queries.csv` | Top queries (up to MAX_ROWS) |
| `pages.csv` | Top pages (up to MAX_ROWS) |
| `countries.csv` | Per-country breakdown |
| `devices.csv` | Mobile/Desktop/Tablet split |
| `query_page.csv` | Query × Page matrix |
| `search_appearance.csv` | Rich result types (if available) |
| `meta.json` | Fetch metadata |

### Step 2: Analyze & generate report

```bash
python gsc_analyze.py
```

This reads the CSVs and produces:

| File | Contents |
|------|----------|
| `seo_report.md` | Full Markdown SEO report |
| `queries_brand.csv` | Brand queries subset |
| `queries_nonbrand.csv` | Non-brand queries subset |
| `opp_high_imp_low_ctr.csv` | High impressions, low CTR |
| `opp_position_6_15.csv` | Striking-distance queries |
| `opp_zero_click_pages.csv` | Pages with 0 clicks |
| `opp_high_ctr_low_imp.csv` | Expansion candidates |
| `content_clusters.csv` | N-gram content clusters |

### One-liner

```bash
python gsc_fetch.py && python gsc_analyze.py
```

## Report Sections

The generated `seo_report.md` includes:

1. **Executive Summary** — totals + trend direction
2. **Brand vs Non-Brand** — split metrics + top queries for each
3. **Opportunity Tables**
   - High impressions, low CTR (title/meta rewrite targets)
   - Position 6–15 (striking distance, can push to top 5)
   - Zero-click pages (content/intent mismatch)
   - High CTR, low impressions (scale-up candidates)
4. **Content Clusters** — bigram analysis with seed-keyword highlighting
5. **International Split** — top countries
6. **Device Split** — mobile vs desktop gaps
7. **Top Pages** — by clicks
8. **Search Appearance** — rich result types
9. **Next Actions** — 5–10 prioritized, data-grounded recommendations
10. **Appendix** — API limitations + URL Inspection API guide

## What the GSC API Cannot Provide

| Data | Available? | Alternative |
|------|-----------|-------------|
| Search performance (clicks, impressions, CTR, position) | Yes | — |
| Index coverage (indexed/excluded/error pages) | No | URL Inspection API (1 URL at a time) |
| Core Web Vitals | No | CrUX API or PageSpeed Insights API |
| Manual actions | No | GSC web UI only |
| Sitemap status | Partial | Sitemaps API (no per-URL detail) |
| Rich results validation | No | Rich Results Test tool |
| Historical data > 16 months | No | Archive your own exports |
| Real-time data | No | 2–3 day lag |

## Troubleshooting

**"Service account cannot access site"**
→ You haven't added the service account email in GSC Settings → Users and permissions. See Step 3 above.

**Empty results / 0 rows**
→ Check that `GSC_SITE_URL` exactly matches how the property appears in GSC. Domain properties use `sc-domain:example.com`, URL-prefix properties use `https://example.com/`.

**403 Forbidden**
→ The Search Console API may not be enabled. Go to [APIs & Services](https://console.cloud.google.com/apis/library) and enable it.

**429 Too Many Requests**
→ The script has built-in retry with exponential backoff. If persistent, reduce `MAX_ROWS` or add delays.

## Extending

- **Country × Query drill-down:** Add `["country", "query"]` dimension to `gsc_fetch.py`
- **Date × Query (brand/non-brand daily):** Add `["date", "query"]` dimension (beware: large result sets)
- **URL Inspection API:** See the appendix in the generated report for sample code
- **Scheduled runs:** Use cron to run daily/weekly and track trends over time
