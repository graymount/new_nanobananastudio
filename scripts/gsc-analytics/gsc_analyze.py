#!/usr/bin/env python3
"""
gsc_analyze.py — Analyze GSC CSV exports and produce seo_report.md.

Reads CSVs written by gsc_fetch.py and generates:
  - Derived CSV files (brand/non-brand splits, opportunity tables)
  - A comprehensive Markdown report (seo_report.md)

Configuration (env vars or .env file):
  OUTPUT_DIR     directory containing CSVs from gsc_fetch.py (default: ./output)
  BRAND_TERMS    comma-separated brand patterns
                 (default: "nano banana,nanobanana,nano-banana,nanobananastudio")
  CLUSTER_SEEDS  comma-separated keyword seeds for cluster highlighting
                 (default: "text rendering,misspelling,blurry text,typography,
                            diffusion text,font,lettering,readable,ocr")
  TOP_N          rows to show in tables (default: 30)
"""

from __future__ import annotations

import csv
import json
import logging
import math
import os
import re
import sys
from collections import Counter, defaultdict
from datetime import datetime
from io import StringIO
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("gsc_analyze")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _load_env_file() -> None:
    env_path = Path(__file__).resolve().parent / ".env"
    if not env_path.exists():
        return
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip("\"'"))


def _env(key: str, default: str | None = None) -> str:
    return os.environ.get(key, default or "")


def read_csv(path: Path) -> list[dict]:
    if not path.exists() or path.stat().st_size == 0:
        return []
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def _num(v: str, as_type=float):
    try:
        return as_type(v)
    except (ValueError, TypeError):
        return 0


def _pct(v: float) -> str:
    return f"{v * 100:.2f}%"


def _fmt_int(v: int | float) -> str:
    return f"{int(v):,}"


def _fmt_pos(v: float) -> str:
    return f"{v:.1f}"


def _safe_ctr(clicks: float, impressions: float) -> float:
    return clicks / impressions if impressions else 0.0


# ---------------------------------------------------------------------------
# Data loading
# ---------------------------------------------------------------------------

def load_data(out_dir: Path) -> dict[str, list[dict]]:
    names = [
        "daily", "queries", "pages", "countries",
        "devices", "query_page", "search_appearance",
    ]
    data: dict[str, list[dict]] = {}
    for name in names:
        rows = read_csv(out_dir / f"{name}.csv")
        # cast numeric fields
        for r in rows:
            for k in ("clicks", "impressions", "position"):
                if k in r:
                    r[k] = _num(r[k])
            if "ctr" in r:
                r["ctr"] = _num(r["ctr"])
        data[name] = rows
        log.info("Loaded %s: %d rows", name, len(rows))
    return data


# ---------------------------------------------------------------------------
# Brand / non-brand classification
# ---------------------------------------------------------------------------

def classify_brand(query: str, brand_patterns: list[str]) -> bool:
    q = query.lower()
    return any(p in q for p in brand_patterns)


def split_brand(
    rows: list[dict], brand_patterns: list[str], query_key: str = "query"
) -> tuple[list[dict], list[dict]]:
    brand, nonbrand = [], []
    for r in rows:
        (brand if classify_brand(r[query_key], brand_patterns) else nonbrand).append(r)
    return brand, nonbrand


# ---------------------------------------------------------------------------
# Aggregation helpers
# ---------------------------------------------------------------------------

def agg_totals(rows: list[dict]) -> dict[str, float]:
    clicks = sum(r["clicks"] for r in rows)
    impressions = sum(r["impressions"] for r in rows)
    ctr = _safe_ctr(clicks, impressions)
    # weighted avg position
    pos_weight = sum(r["position"] * r["impressions"] for r in rows)
    position = pos_weight / impressions if impressions else 0.0
    return {
        "clicks": clicks,
        "impressions": impressions,
        "ctr": ctr,
        "position": position,
    }


def agg_by_key(rows: list[dict], key: str) -> list[dict]:
    """Group rows by *key* and aggregate metrics."""
    buckets: dict[str, dict] = defaultdict(
        lambda: {"clicks": 0, "impressions": 0, "_pos_w": 0.0}
    )
    for r in rows:
        b = buckets[r[key]]
        b["clicks"] += r["clicks"]
        b["impressions"] += r["impressions"]
        b["_pos_w"] += r["position"] * r["impressions"]
    result = []
    for val, b in buckets.items():
        imp = b["impressions"]
        result.append({
            key: val,
            "clicks": b["clicks"],
            "impressions": imp,
            "ctr": _safe_ctr(b["clicks"], imp),
            "position": b["_pos_w"] / imp if imp else 0.0,
        })
    return result


# ---------------------------------------------------------------------------
# Trend helpers
# ---------------------------------------------------------------------------

def compute_trend(daily: list[dict]) -> dict[str, Any]:
    """Simple first-half vs second-half comparison."""
    if len(daily) < 2:
        return {"direction": "N/A", "pct": 0}
    mid = len(daily) // 2
    first_half = daily[:mid]
    second_half = daily[mid:]
    c1 = sum(r["clicks"] for r in first_half)
    c2 = sum(r["clicks"] for r in second_half)
    if c1 == 0:
        pct = 100.0 if c2 > 0 else 0.0
    else:
        pct = ((c2 - c1) / c1) * 100
    direction = "up" if pct > 0 else ("down" if pct < 0 else "flat")
    return {"direction": direction, "pct": round(pct, 1), "c1": c1, "c2": c2}


# ---------------------------------------------------------------------------
# Opportunity tables
# ---------------------------------------------------------------------------

def high_imp_low_ctr(queries: list[dict], imp_min: int = 50, ctr_max: float = 0.005):
    return sorted(
        [r for r in queries if r["impressions"] >= imp_min and r["ctr"] <= ctr_max],
        key=lambda r: -r["impressions"],
    )


def position_opportunities(queries: list[dict], pos_min: float = 6, pos_max: float = 15):
    return sorted(
        [r for r in queries if pos_min <= r["position"] <= pos_max],
        key=lambda r: -r["impressions"],
    )


def zero_click_pages(pages: list[dict]):
    return sorted(
        [r for r in pages if r["clicks"] == 0 and r["impressions"] > 0],
        key=lambda r: -r["impressions"],
    )


def high_ctr_low_imp(pages: list[dict], ctr_min: float = 0.05, imp_max: int = 100):
    return sorted(
        [r for r in pages if r["ctr"] >= ctr_min and 0 < r["impressions"] <= imp_max and r["clicks"] > 0],
        key=lambda r: -r["ctr"],
    )


# ---------------------------------------------------------------------------
# Content cluster analysis (n-gram based)
# ---------------------------------------------------------------------------

STOP_WORDS = frozenset(
    "a an the and or but in on at to for of is it that this with from by as are "
    "was were be been how what which who whom do does did can could will would "
    "shall should may might i me my we our you your he she they them their its "
    "not no nor so if than too very just about up out over into".split()
)


def tokenize(text: str) -> list[str]:
    return [w for w in re.findall(r"[a-z0-9]+", text.lower()) if w not in STOP_WORDS and len(w) > 1]


def extract_ngrams(tokens: list[str], n: int = 2) -> list[str]:
    grams = []
    for i in range(len(tokens) - n + 1):
        grams.append(" ".join(tokens[i : i + n]))
    return grams


def cluster_queries(
    queries: list[dict],
    seed_keywords: list[str] | None = None,
    top_clusters: int = 25,
) -> list[dict]:
    """
    Group queries by shared bigrams. Return top clusters sorted by
    total impressions.
    """
    gram_stats: dict[str, dict] = defaultdict(
        lambda: {"queries": [], "clicks": 0, "impressions": 0}
    )
    for r in queries:
        tokens = tokenize(r["query"])
        bigrams = set(extract_ngrams(tokens, 2))
        # also add unigrams for broader grouping
        unigrams = set(extract_ngrams(tokens, 1))
        for g in bigrams | unigrams:
            s = gram_stats[g]
            s["queries"].append(r["query"])
            s["clicks"] += r["clicks"]
            s["impressions"] += r["impressions"]

    results = []
    for gram, s in gram_stats.items():
        is_seed = False
        if seed_keywords:
            is_seed = any(sk in gram for sk in seed_keywords)
        results.append({
            "cluster": gram,
            "query_count": len(set(s["queries"])),
            "clicks": s["clicks"],
            "impressions": s["impressions"],
            "ctr": _safe_ctr(s["clicks"], s["impressions"]),
            "seed_match": is_seed,
        })

    # sort by impressions, but boost seed matches
    results.sort(key=lambda r: (-int(r["seed_match"]), -r["impressions"]))
    return results[:top_clusters]


# ---------------------------------------------------------------------------
# Device comparison
# ---------------------------------------------------------------------------

def device_comparison(devices: list[dict]) -> list[dict]:
    out = []
    for d in devices:
        out.append({
            "device": d.get("device", "unknown"),
            "clicks": d["clicks"],
            "impressions": d["impressions"],
            "ctr": d["ctr"],
            "position": d["position"],
        })
    return out


def device_gap_flags(devices: list[dict]) -> list[str]:
    by_dev = {d["device"]: d for d in devices}
    flags = []
    mob = by_dev.get("MOBILE")
    desk = by_dev.get("DESKTOP")
    if mob and desk:
        if mob["ctr"] > 0 and desk["ctr"] > 0:
            ratio = mob["ctr"] / desk["ctr"]
            if ratio < 0.7:
                flags.append(
                    f"Mobile CTR ({_pct(mob['ctr'])}) is significantly lower "
                    f"than Desktop ({_pct(desk['ctr'])}). Consider mobile UX improvements."
                )
            elif ratio > 1.4:
                flags.append(
                    f"Desktop CTR ({_pct(desk['ctr'])}) is significantly lower "
                    f"than Mobile ({_pct(mob['ctr'])}). Check desktop SERP appearance."
                )
        pos_diff = abs(mob["position"] - desk["position"])
        if pos_diff > 3:
            worse = "MOBILE" if mob["position"] > desk["position"] else "DESKTOP"
            flags.append(
                f"{worse} avg position ({_fmt_pos(by_dev[worse]['position'])}) is "
                f"significantly worse (gap={_fmt_pos(pos_diff)} positions). "
                f"Investigate mobile-friendliness or page speed."
            )
    return flags


# ---------------------------------------------------------------------------
# International
# ---------------------------------------------------------------------------

def top_countries_with_detail(
    countries: list[dict],
    query_page: list[dict],
    queries_data: list[dict],
    top_n: int = 10,
) -> list[dict]:
    """Return top countries. (Query/page drill-down is per-country only if
    the query_page data includes country dim — GSC doesn't, so we just
    show global top queries for now and note it.)"""
    result = sorted(countries, key=lambda r: -r["clicks"])[:top_n]
    return result


# ---------------------------------------------------------------------------
# Markdown report
# ---------------------------------------------------------------------------

def md_table(headers: list[str], rows: list[list[str]]) -> str:
    lines = []
    lines.append("| " + " | ".join(headers) + " |")
    lines.append("| " + " | ".join("---" for _ in headers) + " |")
    for row in rows:
        lines.append("| " + " | ".join(str(c) for c in row) + " |")
    return "\n".join(lines)


def build_report(data: dict[str, list[dict]], brand_patterns: list[str],
                 seed_keywords: list[str], top_n: int, out_dir: Path,
                 meta: dict) -> str:
    md = StringIO()
    w = md.write

    site_url = meta.get("site_url", "unknown")
    start = meta.get("start_date", "?")
    end = meta.get("end_date", "?")

    w(f"# SEO Report — {site_url}\n\n")
    w(f"**Period:** {start} → {end}  \n")
    w(f"**Generated:** {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}  \n")
    w(f"**Brand patterns:** `{'`, `'.join(brand_patterns)}`\n\n")
    w("---\n\n")

    # ---- Executive summary -------------------------------------------------
    daily = data["daily"]
    queries = data["queries"]
    pages = data["pages"]
    countries = data["countries"]
    devices = data["devices"]
    query_page = data["query_page"]

    totals = agg_totals(queries)
    trend = compute_trend(daily)

    w("## 1. Executive Summary\n\n")
    w(md_table(
        ["Metric", "Value"],
        [
            ["Total Clicks", _fmt_int(totals["clicks"])],
            ["Total Impressions", _fmt_int(totals["impressions"])],
            ["Avg CTR", _pct(totals["ctr"])],
            ["Avg Position", _fmt_pos(totals["position"])],
            ["Trend (clicks, 1st half → 2nd half)", f"{trend['direction']} {trend['pct']:+.1f}%"],
        ],
    ))
    w("\n\n")

    # ---- Brand vs Non-Brand ------------------------------------------------
    w("## 2. Brand vs Non-Brand\n\n")
    brand_q, nonbrand_q = split_brand(queries, brand_patterns)
    b_tot = agg_totals(brand_q) if brand_q else {"clicks": 0, "impressions": 0, "ctr": 0, "position": 0}
    nb_tot = agg_totals(nonbrand_q) if nonbrand_q else {"clicks": 0, "impressions": 0, "ctr": 0, "position": 0}

    w(md_table(
        ["Segment", "Clicks", "Impressions", "CTR", "Avg Position"],
        [
            ["Brand", _fmt_int(b_tot["clicks"]), _fmt_int(b_tot["impressions"]),
             _pct(b_tot["ctr"]), _fmt_pos(b_tot["position"])],
            ["Non-Brand", _fmt_int(nb_tot["clicks"]), _fmt_int(nb_tot["impressions"]),
             _pct(nb_tot["ctr"]), _fmt_pos(nb_tot["position"])],
        ],
    ))
    w("\n\n")

    # Brand daily
    brand_daily_map: dict[str, dict] = {}
    nonbrand_daily_map: dict[str, dict] = {}
    # We need to re-classify from query_page or daily — daily doesn't have query dim.
    # We'll build a per-date breakdown from the query-level data is not possible
    # since queries don't have date dim. Note this as a limitation.
    w("*Note: Per-day brand/non-brand split requires `date × query` dimension, "
      "which may exceed API limits. Use `gsc_fetch.py` with custom dimensions if needed.*\n\n")

    # Top brand queries
    w("### Top Brand Queries\n\n")
    brand_q_sorted = sorted(brand_q, key=lambda r: -r["clicks"])[:top_n]
    if brand_q_sorted:
        w(md_table(
            ["Query", "Clicks", "Impressions", "CTR", "Position"],
            [[r["query"], _fmt_int(r["clicks"]), _fmt_int(r["impressions"]),
              _pct(r["ctr"]), _fmt_pos(r["position"])] for r in brand_q_sorted],
        ))
    else:
        w("*No brand queries found.*\n")
    w("\n\n")

    # Top non-brand queries
    w("### Top Non-Brand Queries\n\n")
    nb_q_sorted = sorted(nonbrand_q, key=lambda r: -r["clicks"])[:top_n]
    if nb_q_sorted:
        w(md_table(
            ["Query", "Clicks", "Impressions", "CTR", "Position"],
            [[r["query"], _fmt_int(r["clicks"]), _fmt_int(r["impressions"]),
              _pct(r["ctr"]), _fmt_pos(r["position"])] for r in nb_q_sorted],
        ))
    else:
        w("*No non-brand queries found.*\n")
    w("\n\n")

    # ---- Opportunities -----------------------------------------------------
    w("## 3. Opportunity Tables\n\n")

    # 3a. High impressions + low CTR
    w("### 3a. High Impressions, Low CTR (imp ≥ 50, CTR ≤ 0.5%)\n\n")
    opp_hilo = high_imp_low_ctr(queries)[:top_n]
    if opp_hilo:
        w(md_table(
            ["Query", "Impressions", "Clicks", "CTR", "Position"],
            [[r["query"], _fmt_int(r["impressions"]), _fmt_int(r["clicks"]),
              _pct(r["ctr"]), _fmt_pos(r["position"])] for r in opp_hilo],
        ))
        w("\n*Action: Rewrite title/meta for these queries to improve CTR.*\n")
    else:
        w("*None found.*\n")
    w("\n\n")

    # 3b. Position 6-15 (near-top / page-2 edge)
    w("### 3b. Position 6–15 Opportunities (striking distance)\n\n")
    opp_pos = position_opportunities(queries)[:top_n]
    if opp_pos:
        w(md_table(
            ["Query", "Impressions", "Clicks", "CTR", "Position"],
            [[r["query"], _fmt_int(r["impressions"]), _fmt_int(r["clicks"]),
              _pct(r["ctr"]), _fmt_pos(r["position"])] for r in opp_pos],
        ))
        w("\n*Action: Strengthen content and internal links for these queries to push into top 5.*\n")
    else:
        w("*None found.*\n")
    w("\n\n")

    # 3c. Zero-click pages
    w("### 3c. Pages with Impressions but Zero Clicks\n\n")
    opp_zero = zero_click_pages(pages)[:top_n]
    if opp_zero:
        w(md_table(
            ["Page", "Impressions", "Position"],
            [[r["page"], _fmt_int(r["impressions"]), _fmt_pos(r["position"])]
             for r in opp_zero],
        ))
        w("\n*Action: Improve title tags and meta descriptions. Consider if content matches search intent.*\n")
    else:
        w("*None found — all pages with impressions received at least one click.*\n")
    w("\n\n")

    # 3d. High CTR, low impressions (expansion candidates)
    w("### 3d. High CTR but Low Impressions (expansion candidates)\n\n")
    opp_hcli = high_ctr_low_imp(pages)[:top_n]
    if opp_hcli:
        w(md_table(
            ["Page", "Clicks", "Impressions", "CTR", "Position"],
            [[r["page"], _fmt_int(r["clicks"]), _fmt_int(r["impressions"]),
              _pct(r["ctr"]), _fmt_pos(r["position"])] for r in opp_hcli],
        ))
        w("\n*Action: These pages convert well. Expand content depth, add internal links, "
          "and build backlinks to increase impressions.*\n")
    else:
        w("*None found.*\n")
    w("\n\n")

    # ---- Content Clusters --------------------------------------------------
    w("## 4. Content Clusters (n-gram analysis)\n\n")
    clusters = cluster_queries(queries, seed_keywords=seed_keywords, top_clusters=30)
    if clusters:
        w(md_table(
            ["Cluster", "# Queries", "Clicks", "Impressions", "CTR", "Seed Match"],
            [[c["cluster"], str(c["query_count"]), _fmt_int(c["clicks"]),
              _fmt_int(c["impressions"]), _pct(c["ctr"]),
              "Yes" if c["seed_match"] else ""] for c in clusters],
        ))
        seed_hits = [c for c in clusters if c["seed_match"]]
        if seed_hits:
            w(f"\n**Seed-matched clusters:** {', '.join(c['cluster'] for c in seed_hits)}\n")
            w("These clusters align with the text-rendering reliability positioning. "
              "Consider deepening content around them.\n")
    else:
        w("*Not enough query data to form clusters.*\n")
    w("\n\n")

    # ---- International Split -----------------------------------------------
    w("## 5. International Split\n\n")
    top_countries = top_countries_with_detail(countries, query_page, queries, top_n=15)
    if top_countries:
        w(md_table(
            ["Country", "Clicks", "Impressions", "CTR", "Avg Position"],
            [[r["country"], _fmt_int(r["clicks"]), _fmt_int(r["impressions"]),
              _pct(r["ctr"]), _fmt_pos(r["position"])] for r in top_countries],
        ))
        w("\n*Note: Per-country query breakdown requires a separate `country × query` "
          "API call (not included in default fetch).*\n")
    else:
        w("*No country data available.*\n")
    w("\n\n")

    # ---- Device Split ------------------------------------------------------
    w("## 6. Device Split\n\n")
    dev_rows = device_comparison(devices)
    if dev_rows:
        w(md_table(
            ["Device", "Clicks", "Impressions", "CTR", "Avg Position"],
            [[d["device"], _fmt_int(d["clicks"]), _fmt_int(d["impressions"]),
              _pct(d["ctr"]), _fmt_pos(d["position"])] for d in dev_rows],
        ))
        w("\n")
        flags = device_gap_flags(devices)
        for f in flags:
            w(f"- {f}\n")
        if not flags:
            w("*No significant mobile/desktop gaps detected.*\n")
    else:
        w("*No device data available.*\n")
    w("\n\n")

    # ---- Top Pages ---------------------------------------------------------
    w("## 7. Top Pages\n\n")
    top_pages = sorted(pages, key=lambda r: -r["clicks"])[:top_n]
    if top_pages:
        w(md_table(
            ["Page", "Clicks", "Impressions", "CTR", "Position"],
            [[r["page"], _fmt_int(r["clicks"]), _fmt_int(r["impressions"]),
              _pct(r["ctr"]), _fmt_pos(r["position"])] for r in top_pages],
        ))
    w("\n\n")

    # ---- Search Appearance -------------------------------------------------
    sa = data.get("search_appearance", [])
    if sa:
        w("## 8. Search Appearance\n\n")
        w(md_table(
            ["Appearance", "Clicks", "Impressions", "CTR", "Position"],
            [[r.get("searchAppearance", "?"), _fmt_int(r["clicks"]),
              _fmt_int(r["impressions"]), _pct(r["ctr"]),
              _fmt_pos(r["position"])] for r in sa],
        ))
        w("\n\n")

    # ---- Next Actions ------------------------------------------------------
    w("## 9. Next Actions (Prioritized)\n\n")
    actions = _generate_actions(
        totals, trend, opp_hilo, opp_pos, opp_zero, opp_hcli,
        clusters, devices, brand_q, nonbrand_q, seed_keywords,
    )
    for i, a in enumerate(actions, 1):
        w(f"{i}. **{a['title']}** — {a['detail']}\n")
    w("\n\n")

    # ---- API Limitations ---------------------------------------------------
    w("## Appendix: What GSC API Cannot Provide\n\n")
    w("""\
- **Index Coverage / Page Indexing:** The Search Analytics API only returns search
  performance data. Index coverage (indexed/excluded/error pages) is available
  via the **URL Inspection API** (`urlInspection.index.inspect`) — one URL at a
  time, which makes bulk inspection slow. Consider integrating it for your top
  pages or pages with zero impressions.
- **Core Web Vitals:** CWV data is not available via the Search Console API.
  Use the CrUX API or PageSpeed Insights API instead.
- **Manual Actions / Security Issues:** Not exposed via API.
- **Sitemaps detail:** The Sitemaps API shows submitted sitemaps and their status,
  but not per-URL indexing detail.
- **Rich Results / Structured Data validation:** Not available via API;
  use the Rich Results Test tool.
- **Historical data beyond 16 months:** GSC retains ~16 months of data.
- **Unsampled data:** For very large sites, data may be sampled. The API does not
  indicate whether sampling occurred.
- **Real-time data:** There is a 2–3 day lag in Search Console data.

### Optional: URL Inspection API Integration

To check indexing status for specific URLs:

```python
from googleapiclient.discovery import build

service = build("searchconsole", "v1", credentials=creds)
result = service.urlInspection().index().inspect(
    body={
        "inspectionUrl": "https://nanobananastudio.com/en/blog/my-post",
        "siteUrl": "sc-domain:nanobananastudio.com",
    }
).execute()
print(result["inspectionResult"]["indexStatusResult"]["coverageState"])
# e.g. "Submitted and indexed"
```

Rate limit: ~600 requests/minute. Best used for targeted checks on important pages.
""")

    return md.getvalue()


def _generate_actions(
    totals, trend, opp_hilo, opp_pos, opp_zero, opp_hcli,
    clusters, devices, brand_q, nonbrand_q, seed_keywords,
) -> list[dict]:
    actions = []

    # 1) CTR engineering
    if opp_hilo:
        top3 = ", ".join(f'"{r["query"]}"' for r in opp_hilo[:3])
        actions.append({
            "title": "Title/Meta CTR Engineering",
            "detail": (
                f"{len(opp_hilo)} queries have high impressions but CTR ≤ 0.5%. "
                f"Rewrite title tags and meta descriptions for top queries: {top3}. "
                "Include power words, numbers, and clear value propositions."
            ),
        })

    # 2) Striking distance
    if opp_pos:
        top3 = ", ".join(f'"{r["query"]}"' for r in opp_pos[:3])
        actions.append({
            "title": "Push Striking-Distance Queries Into Top 5",
            "detail": (
                f"{len(opp_pos)} queries rank at position 6–15. "
                f"Focus on: {top3}. "
                "Add internal links, expand content depth, earn backlinks."
            ),
        })

    # 3) Zero-click pages
    if opp_zero:
        actions.append({
            "title": "Fix Zero-Click Pages",
            "detail": (
                f"{len(opp_zero)} pages have impressions but zero clicks. "
                "Audit title tags and meta descriptions. Check if content matches "
                "the searcher's intent."
            ),
        })

    # 4) Expand high-CTR pages
    if opp_hcli:
        actions.append({
            "title": "Scale High-CTR Pages",
            "detail": (
                f"{len(opp_hcli)} pages have strong CTR but low impressions. "
                "These pages convert well — expand their content, add internal links, "
                "and build external links to grow their visibility."
            ),
        })

    # 5) Content clusters
    seed_clusters = [c for c in clusters if c.get("seed_match")]
    if seed_clusters:
        names = ", ".join(f'"{c["cluster"]}"' for c in seed_clusters[:3])
        actions.append({
            "title": "Deepen Text-Rendering Content Clusters",
            "detail": (
                f"Seed-matched clusters found: {names}. "
                "Create or expand content around these topics to reinforce "
                "the text-rendering reliability positioning."
            ),
        })

    # 6) Device gap
    dev_by = {d.get("device"): d for d in devices}
    mob = dev_by.get("MOBILE")
    desk = dev_by.get("DESKTOP")
    if mob and desk and mob["ctr"] > 0 and desk["ctr"] > 0:
        if mob["ctr"] / desk["ctr"] < 0.7:
            actions.append({
                "title": "Improve Mobile SERP Appearance",
                "detail": (
                    f"Mobile CTR ({_pct(mob['ctr'])}) is much lower than Desktop "
                    f"({_pct(desk['ctr'])}). Review how titles/descriptions truncate "
                    "on mobile. Check mobile page speed."
                ),
            })

    # 7) Brand awareness
    b_clicks = sum(r["clicks"] for r in brand_q)
    nb_clicks = sum(r["clicks"] for r in nonbrand_q)
    total = b_clicks + nb_clicks
    if total > 0 and b_clicks / total < 0.1:
        actions.append({
            "title": "Build Brand Awareness",
            "detail": (
                f"Brand queries account for only {_pct(b_clicks / total)} of clicks. "
                "Increase brand visibility through Product Hunt updates, "
                "social media, partnerships, and community engagement."
            ),
        })

    # 8) Trend action
    if trend["direction"] == "down" and abs(trend["pct"]) > 10:
        actions.append({
            "title": "Investigate Traffic Decline",
            "detail": (
                f"Clicks declined {trend['pct']:+.1f}% (1st half vs 2nd half). "
                "Check for algorithm updates, lost rankings, or technical issues. "
                "Review Google Search status dashboard."
            ),
        })
    elif trend["direction"] == "up" and trend["pct"] > 20:
        actions.append({
            "title": "Capitalize on Growth Momentum",
            "detail": (
                f"Clicks grew {trend['pct']:+.1f}%. Double down on what's working: "
                "identify which queries/pages drove the growth and create more "
                "content in those clusters."
            ),
        })

    # 9) Internal linking
    actions.append({
        "title": "Internal Linking Audit",
        "detail": (
            "Review internal link structure for top pages and opportunity queries. "
            "Ensure striking-distance queries have supporting internal links "
            "from high-authority pages on the site."
        ),
    })

    # 10) Structured data
    actions.append({
        "title": "Expand Structured Data",
        "detail": (
            "Add HowTo, FAQ, or Article structured data to key content pages. "
            "Rich results can significantly improve CTR. "
            "Validate with Google's Rich Results Test."
        ),
    })

    return actions[:10]


# ---------------------------------------------------------------------------
# CSV export of derived tables
# ---------------------------------------------------------------------------

def export_derived(data, brand_patterns, seed_keywords, out_dir):
    queries = data["queries"]
    pages = data["pages"]

    brand_q, nonbrand_q = split_brand(queries, brand_patterns)

    # Brand queries CSV
    _write_csv(brand_q, out_dir / "queries_brand.csv")
    _write_csv(nonbrand_q, out_dir / "queries_nonbrand.csv")

    # Opportunity CSVs
    _write_csv(high_imp_low_ctr(queries), out_dir / "opp_high_imp_low_ctr.csv")
    _write_csv(position_opportunities(queries), out_dir / "opp_position_6_15.csv")
    _write_csv(zero_click_pages(pages), out_dir / "opp_zero_click_pages.csv")
    _write_csv(high_ctr_low_imp(pages), out_dir / "opp_high_ctr_low_imp.csv")

    # Clusters
    clusters = cluster_queries(queries, seed_keywords=seed_keywords)
    _write_csv(clusters, out_dir / "content_clusters.csv")


def _write_csv(rows, path):
    if not rows:
        path.write_text("")
        return
    fieldnames = list(rows[0].keys())
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)
    log.info("Derived CSV → %s (%d rows)", path.name, len(rows))


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    _load_env_file()

    out_dir = Path(_env("OUTPUT_DIR") or (Path(__file__).resolve().parent / "output"))
    brand_terms = [
        t.strip().lower()
        for t in _env(
            "BRAND_TERMS",
            "nano banana,nanobanana,nano-banana,nanobananastudio"
        ).split(",")
        if t.strip()
    ]
    seed_keywords = [
        t.strip().lower()
        for t in _env(
            "CLUSTER_SEEDS",
            "text rendering,misspelling,blurry text,typography,"
            "diffusion text,font,lettering,readable,ocr"
        ).split(",")
        if t.strip()
    ]
    top_n = int(_env("TOP_N") or "30")

    log.info("Output dir: %s", out_dir)
    log.info("Brand patterns: %s", brand_terms)
    log.info("Cluster seeds: %s", seed_keywords)

    if not out_dir.exists():
        log.error("Output dir %s does not exist. Run gsc_fetch.py first.", out_dir)
        sys.exit(1)

    # Load metadata
    meta_path = out_dir / "meta.json"
    meta = json.loads(meta_path.read_text()) if meta_path.exists() else {}

    # Load data
    data = load_data(out_dir)

    # Export derived CSVs
    export_derived(data, brand_terms, seed_keywords, out_dir)

    # Build report
    report = build_report(data, brand_terms, seed_keywords, top_n, out_dir, meta)
    report_path = out_dir / "seo_report.md"
    report_path.write_text(report, encoding="utf-8")
    log.info("Report → %s", report_path)
    log.info("Done.")


if __name__ == "__main__":
    main()
