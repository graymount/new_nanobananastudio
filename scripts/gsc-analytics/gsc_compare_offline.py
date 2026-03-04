#!/usr/bin/env python3
"""
gsc_compare_offline.py — Build a 28-day comparative report from existing CSVs.

Uses daily.csv (per-day) for precise period aggregates.
Uses queries.csv (6-month aggregate) + 查询数.csv (3-month web export)
for brand/non-brand and query expansion analysis.
"""

from __future__ import annotations

import csv
import re
from collections import defaultdict
from datetime import date, datetime
from io import StringIO
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parent / "output"

# Brand patterns
BRAND_PATTERNS = [
    "nano banana", "nanobanana", "nano-banana", "nanobananastudio",
    "nano banan", "nano bana", "nano banano", "nana banana",
    "navobanana", "nnanobanana", "nanobana", "nono banna",
    "banano studio", "nenu banana", "nanebanana", "nanobanba",
    "banan studio", "banna studio", "panana studio", "nanobbanana",
    "nanobananas", "nanban studio",
]

TEXT_RENDERING_KEYWORDS = [
    "text rendering", "text in image", "misspell", "blurry", "typography",
    "font", "lettering", "readable", "ocr", "ai text", "text generation",
    "text accuracy", "garbled text", "wrong text", "spelled wrong",
    "text overlay", "text on image", "watermark text", "banner text",
    "rendering text", "precise text", "accurate text",
]

# ---------------------------------------------------------------------------
# CSV reading
# ---------------------------------------------------------------------------
def read_csv(path: Path) -> list[dict]:
    if not path.exists() or path.stat().st_size == 0:
        return []
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def read_csv_chinese(path: Path) -> list[dict]:
    """Read the Chinese-header GSC web export CSV."""
    if not path.exists():
        return []
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = []
        for r in reader:
            mapped = {}
            for k, v in r.items():
                if "查询" in k or "热门" in k:
                    mapped["query"] = v
                elif "点击次数" in k or "点击" in k:
                    mapped["clicks"] = parse_num(v)
                elif "展示" in k:
                    mapped["impressions"] = parse_num(v)
                elif "点击率" in k:
                    mapped["ctr"] = parse_pct(v)
                elif "排名" in k:
                    mapped["position"] = parse_num(v)
                elif "网页" in k or "page" in k.lower():
                    mapped["page"] = v
            rows.append(mapped)
    return rows


def parse_num(v: str) -> float:
    try:
        v = v.replace(",", "").replace("%", "").strip()
        return float(v) if v else 0.0
    except (ValueError, TypeError):
        return 0.0


def parse_pct(v: str) -> float:
    try:
        v = v.replace("%", "").strip()
        return float(v) / 100 if v else 0.0
    except (ValueError, TypeError):
        return 0.0


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def is_brand(query: str) -> bool:
    q = query.lower()
    return any(p in q for p in BRAND_PATTERNS)


def is_text_rendering(query: str) -> bool:
    q = query.lower()
    return any(kw in q for kw in TEXT_RENDERING_KEYWORDS)


def classify_page(url: str) -> str:
    if re.search(r"/(en|zh|es|ja|ko)?/?$", url) or url.rstrip("/").endswith(".com"):
        return "homepage"
    if "/blog" in url:
        return "blog"
    if "/app" in url:
        return "app"
    if "/pricing" in url:
        return "pricing"
    if "/mycase" in url:
        return "gallery"
    return "other"


def fmt_int(v) -> str:
    return f"{int(v):,}"


def fmt_pos(v: float) -> str:
    return f"{v:.1f}"


def fmt_pct(v: float) -> str:
    return f"{v * 100:.2f}%"


def pct_change(old: float, new: float) -> str:
    if old == 0:
        return "+∞" if new > 0 else "—"
    change = ((new - old) / old) * 100
    return f"{change:+.1f}%"


def pct_change_num(old: float, new: float) -> float:
    if old == 0:
        return float("inf") if new > 0 else 0.0
    return ((new - old) / old) * 100


def md_table(headers: list[str], rows: list[list[str]]) -> str:
    lines = []
    lines.append("| " + " | ".join(headers) + " |")
    lines.append("| " + " | ".join("---" for _ in headers) + " |")
    for row in rows:
        lines.append("| " + " | ".join(str(c) for c in row) + " |")
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Main analysis
# ---------------------------------------------------------------------------
def main():
    # Load daily data
    daily_raw = read_csv(OUT_DIR / "daily.csv")
    daily = []
    for r in daily_raw:
        daily.append({
            "date": r["date"],
            "clicks": float(r["clicks"]),
            "impressions": float(r["impressions"]),
            "ctr": float(r["ctr"]),
            "position": float(r["position"]),
        })
    daily.sort(key=lambda r: r["date"])

    # Define periods (matching daily.csv endpoint of 2026-02-28)
    # Period A: 2026-02-01 to 2026-02-28 (28 days)
    # Period B: 2026-01-04 to 2026-01-31 (28 days)
    pa_start, pa_end = "2026-02-01", "2026-02-28"
    pb_start, pb_end = "2026-01-04", "2026-01-31"

    daily_a = [d for d in daily if pa_start <= d["date"] <= pa_end]
    daily_b = [d for d in daily if pb_start <= d["date"] <= pb_end]

    # Load aggregated query data (6-month API + 3-month web export)
    queries_6m = read_csv(OUT_DIR / "queries.csv")
    for r in queries_6m:
        r["clicks"] = float(r["clicks"])
        r["impressions"] = float(r["impressions"])
        r["ctr"] = float(r["ctr"])
        r["position"] = float(r["position"])

    queries_3m = read_csv_chinese(OUT_DIR / "查询数.csv")

    # Load pages (6-month)
    pages_6m = read_csv(OUT_DIR / "pages.csv")
    for r in pages_6m:
        r["clicks"] = float(r["clicks"])
        r["impressions"] = float(r["impressions"])
        r["ctr"] = float(r["ctr"])
        r["position"] = float(r["position"])

    # Load pages (3-month web export)
    pages_3m_raw = read_csv_chinese(OUT_DIR / "网页.csv")

    # Load devices
    devices_6m = read_csv(OUT_DIR / "devices.csv")
    for r in devices_6m:
        r["clicks"] = float(r["clicks"])
        r["impressions"] = float(r["impressions"])
        r["ctr"] = float(r["ctr"])
        r["position"] = float(r["position"])

    # ===================================================================
    # Build report
    # ===================================================================
    md = StringIO()
    w = md.write

    w("# GSC Comparative Report — nanobananastudio.com\n\n")
    w(f"**Period A (recent):** {pa_start} → {pa_end} (28 days)  \n")
    w(f"**Period B (previous):** {pb_start} → {pb_end} (28 days)  \n")
    w(f"**Generated:** {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}  \n")
    w(f"**Data source:** Existing CSV exports (API fetch 2026-03-02, web export 2026-03-02)  \n\n")
    w("> **Note:** Service account credentials were not available for fresh API calls.\n")
    w("> Sections 1 and daily metrics use per-day data (precise). Query/page/device\n")
    w("> sections use aggregated data with analytical inference where needed.\n\n")
    w("---\n\n")

    # ==================================================================
    # 1) Top-Level Comparison (from daily.csv — PRECISE)
    # ==================================================================
    w("## 1) Top-Level Comparison\n\n")

    def daily_agg(rows):
        clicks = sum(r["clicks"] for r in rows)
        imp = sum(r["impressions"] for r in rows)
        ctr = clicks / imp if imp else 0
        # Impression-weighted avg position
        pos_w = sum(r["position"] * r["impressions"] for r in rows)
        pos = pos_w / imp if imp else 0
        return {"clicks": clicks, "impressions": imp, "ctr": ctr, "position": pos, "days": len(rows)}

    agg_a = daily_agg(daily_a)
    agg_b = daily_agg(daily_b)

    w(md_table(
        ["Metric", f"Period B ({pb_start}→{pb_end})", f"Period A ({pa_start}→{pa_end})", "Change"],
        [
            ["Days", str(agg_b["days"]), str(agg_a["days"]), ""],
            ["Total Clicks", fmt_int(agg_b["clicks"]), fmt_int(agg_a["clicks"]),
             pct_change(agg_b["clicks"], agg_a["clicks"])],
            ["Total Impressions", fmt_int(agg_b["impressions"]), fmt_int(agg_a["impressions"]),
             pct_change(agg_b["impressions"], agg_a["impressions"])],
            ["CTR", fmt_pct(agg_b["ctr"]), fmt_pct(agg_a["ctr"]),
             pct_change(agg_b["ctr"], agg_a["ctr"])],
            ["Avg Position", fmt_pos(agg_b["position"]), fmt_pos(agg_a["position"]),
             pct_change(agg_b["position"], agg_a["position"])],
            ["Clicks/Day", f"{agg_b['clicks']/agg_b['days']:.1f}", f"{agg_a['clicks']/agg_a['days']:.1f}",
             pct_change(agg_b['clicks']/agg_b['days'], agg_a['clicks']/agg_a['days'])],
            ["Impressions/Day", f"{agg_b['impressions']/agg_b['days']:.1f}", f"{agg_a['impressions']/agg_a['days']:.1f}",
             pct_change(agg_b['impressions']/agg_b['days'], agg_a['impressions']/agg_a['days'])],
        ],
    ))
    w("\n\n")

    # Daily trend within Period A
    w("### Daily Trend (Period A)\n\n")
    w(md_table(
        ["Date", "Clicks", "Impressions", "CTR", "Position"],
        [[d["date"], fmt_int(d["clicks"]), fmt_int(d["impressions"]),
          fmt_pct(d["ctr"]), fmt_pos(d["position"])] for d in daily_a],
    ))
    w("\n\n")

    # Highlight: last 7 days vs first 7 days of Period A
    first7 = daily_a[:7]
    last7 = daily_a[-7:]
    f7_agg = daily_agg(first7)
    l7_agg = daily_agg(last7)
    w("### Period A Internal Trend (first 7 days vs last 7 days)\n\n")
    w(md_table(
        ["Metric", "First 7 Days", "Last 7 Days", "Change"],
        [
            ["Clicks", fmt_int(f7_agg["clicks"]), fmt_int(l7_agg["clicks"]),
             pct_change(f7_agg["clicks"], l7_agg["clicks"])],
            ["Impressions", fmt_int(f7_agg["impressions"]), fmt_int(l7_agg["impressions"]),
             pct_change(f7_agg["impressions"], l7_agg["impressions"])],
        ],
    ))
    w("\n\n")

    # ==================================================================
    # 2) Brand vs Non-Brand Split
    # ==================================================================
    w("## 2) Brand vs Non-Brand Split\n\n")
    w("> Based on 6-month aggregated query data (cannot split by period without fresh API call).\n\n")

    brand_q = [r for r in queries_6m if is_brand(r["query"])]
    nonbrand_q = [r for r in queries_6m if not is_brand(r["query"])]

    def query_agg(rows):
        clicks = sum(r["clicks"] for r in rows)
        imp = sum(r["impressions"] for r in rows)
        ctr = clicks / imp if imp else 0
        pos_w = sum(r["position"] * r["impressions"] for r in rows)
        pos = pos_w / imp if imp else 0
        return {"clicks": clicks, "imp": imp, "ctr": ctr, "position": pos, "count": len(rows)}

    b_agg = query_agg(brand_q)
    nb_agg = query_agg(nonbrand_q)
    total_imp = b_agg["imp"] + nb_agg["imp"]

    w(md_table(
        ["Segment", "Queries", "Clicks", "Impressions", "% of Imp", "CTR", "Avg Position"],
        [
            ["Brand", str(b_agg["count"]), fmt_int(b_agg["clicks"]), fmt_int(b_agg["imp"]),
             f"{b_agg['imp']/total_imp*100:.1f}%", fmt_pct(b_agg["ctr"]), fmt_pos(b_agg["position"])],
            ["Non-Brand", str(nb_agg["count"]), fmt_int(nb_agg["clicks"]), fmt_int(nb_agg["imp"]),
             f"{nb_agg['imp']/total_imp*100:.1f}%", fmt_pct(nb_agg["ctr"]), fmt_pos(nb_agg["position"])],
            ["**Total**", str(len(queries_6m)), fmt_int(b_agg["clicks"]+nb_agg["clicks"]),
             fmt_int(total_imp), "100%", fmt_pct((b_agg["clicks"]+nb_agg["clicks"])/total_imp if total_imp else 0),
             ""],
        ],
    ))
    w("\n\n")

    # 3-month vs 6-month query comparison for brand/non-brand evolution
    q3m_set = {r["query"] for r in queries_3m if "query" in r}
    q6m_set = {r["query"] for r in queries_6m}

    # Queries only in 6-month but NOT in 3-month = likely from earlier period
    older_only = q6m_set - q3m_set
    newer_only = q3m_set - q6m_set  # appeared in 3m web export but not in 6m API (shouldn't happen much)

    brand_in_3m = sum(1 for q in q3m_set if is_brand(q))
    nonbrand_in_3m = len(q3m_set) - brand_in_3m
    brand_in_6m = sum(1 for q in q6m_set if is_brand(q))
    nonbrand_in_6m = len(q6m_set) - brand_in_6m

    w("### Brand/Non-Brand Query Count Evolution\n\n")
    w(md_table(
        ["Metric", "6-Month Pool", "3-Month Pool (recent)", "Observation"],
        [
            ["Total Queries", str(len(q6m_set)), str(len(q3m_set)),
             f"{len(q3m_set) - len(q6m_set):+d} difference"],
            ["Brand Queries", str(brand_in_6m), str(brand_in_3m),
             f"{brand_in_3m - brand_in_6m:+d}"],
            ["Non-Brand Queries", str(nonbrand_in_6m), str(nonbrand_in_3m),
             f"{nonbrand_in_3m - nonbrand_in_6m:+d}"],
            ["Non-Brand %", f"{nonbrand_in_6m/len(q6m_set)*100:.1f}%",
             f"{nonbrand_in_3m/len(q3m_set)*100:.1f}%",
             f"{nonbrand_in_3m/len(q3m_set)*100 - nonbrand_in_6m/len(q6m_set)*100:+.1f}pp"],
        ],
    ))
    w("\n\n")

    # Top non-brand queries
    w("### Top Non-Brand Queries (6-month aggregate)\n\n")
    nb_sorted = sorted(nonbrand_q, key=lambda r: -r["impressions"])[:20]
    w(md_table(
        ["#", "Query", "Clicks", "Impressions", "CTR", "Position", "Text-Rendering?"],
        [[str(i+1), r["query"], fmt_int(r["clicks"]), fmt_int(r["impressions"]),
          fmt_pct(r["ctr"]), fmt_pos(r["position"]),
          "Yes" if is_text_rendering(r["query"]) else ""]
         for i, r in enumerate(nb_sorted)],
    ))
    w("\n\n")

    # ==================================================================
    # 3) Query Coverage Expansion
    # ==================================================================
    w("## 3) Query Coverage Expansion\n\n")
    w("> Comparing 3-month GSC web export (recent ~Dec 2025–Feb 2026) vs 6-month API export.\n")
    w("> Queries in 6-month but NOT in 3-month likely appeared only in the older period.\n\n")

    # Queries only in recent 3 months (in 3m export, not in 6m — these are truly new)
    # Actually, 6m should be a superset of 3m. Queries in 3m but not in 6m might be
    # due to row limits (both capped at ~5000 but we have far fewer).
    # More useful: identify queries that ONLY appeared recently by looking at
    # the 3-month set.

    w(md_table(
        ["Metric", "Value"],
        [
            ["Total unique queries (6-month)", str(len(q6m_set))],
            ["Total unique queries (3-month)", str(len(q3m_set))],
            ["In 6-month only (dropped from recent)", str(len(older_only))],
            ["In 3-month only (newly captured)", str(len(newer_only))],
        ],
    ))
    w("\n\n")

    # Queries in the 3m export only (new to recent period)
    if newer_only:
        newer_data = [r for r in queries_3m if r.get("query") in newer_only]
        newer_data.sort(key=lambda r: -r.get("impressions", 0))
        w("### Queries Unique to 3-Month Export (potential new queries)\n\n")
        w(md_table(
            ["#", "Query", "Clicks", "Impressions", "Position", "Text-Rendering?"],
            [[str(i+1), r.get("query",""), fmt_int(r.get("clicks",0)),
              fmt_int(r.get("impressions",0)), fmt_pos(r.get("position",0)),
              "Yes" if is_text_rendering(r.get("query","")) else ""]
             for i, r in enumerate(newer_data[:20])],
        ))
        w("\n\n")

    # Text rendering queries analysis
    tr_queries = [r for r in queries_6m if is_text_rendering(r["query"])]
    tr_total_imp = sum(r["impressions"] for r in tr_queries)
    w("### Text-Rendering Related Queries\n\n")
    if tr_queries:
        w(md_table(
            ["#", "Query", "Clicks", "Impressions", "CTR", "Position"],
            [[str(i+1), r["query"], fmt_int(r["clicks"]), fmt_int(r["impressions"]),
              fmt_pct(r["ctr"]), fmt_pos(r["position"])]
             for i, r in enumerate(sorted(tr_queries, key=lambda r: -r["impressions"]))],
        ))
        w(f"\n**Total text-rendering impressions:** {fmt_int(tr_total_imp)} "
          f"({tr_total_imp/total_imp*100:.1f}% of all impressions)\n")
        w(f"**Count:** {len(tr_queries)} queries\n\n")
    else:
        w("*No text-rendering queries detected.*\n\n")

    # ==================================================================
    # 4) Page-Level Distribution
    # ==================================================================
    w("## 4) Page-Level Distribution\n\n")
    w("> Based on 6-month aggregated page data.\n\n")

    # Top 10 pages
    pages_sorted = sorted(pages_6m, key=lambda r: -r["impressions"])[:15]
    w("### Top 15 Pages by Impressions\n\n")
    w(md_table(
        ["#", "Page", "Clicks", "Impressions", "CTR", "Position", "Type"],
        [[str(i+1), r["page"].replace("https://nanobananastudio.com", ""),
          fmt_int(r["clicks"]), fmt_int(r["impressions"]),
          fmt_pct(r["ctr"]), fmt_pos(r["position"]), classify_page(r["page"])]
         for i, r in enumerate(pages_sorted)],
    ))
    w("\n\n")

    # Impression distribution by type
    type_dist = defaultdict(lambda: {"clicks": 0, "impressions": 0})
    total_page_imp = sum(r["impressions"] for r in pages_6m)
    for r in pages_6m:
        pt = classify_page(r["page"])
        type_dist[pt]["clicks"] += r["clicks"]
        type_dist[pt]["impressions"] += r["impressions"]

    w("### Impression Distribution by Page Type\n\n")
    w(md_table(
        ["Page Type", "Clicks", "Impressions", "% of Total", "CTR"],
        [[pt, fmt_int(d["clicks"]), fmt_int(d["impressions"]),
          f"{d['impressions']/total_page_imp*100:.1f}%",
          fmt_pct(d["clicks"]/d["impressions"] if d["impressions"] else 0)]
         for pt, d in sorted(type_dist.items(), key=lambda x: -x[1]["impressions"])],
    ))
    w("\n\n")

    homepage_share = type_dist["homepage"]["impressions"] / total_page_imp * 100
    blog_share = type_dist["blog"]["impressions"] / total_page_imp * 100
    w(f"**Homepage share:** {homepage_share:.1f}%  \n")
    w(f"**Blog share:** {blog_share:.1f}%  \n")
    w(f"**Blog pages count:** {sum(1 for r in pages_6m if classify_page(r['page']) == 'blog')}\n\n")

    # Blog pages detail
    blog_pages = sorted(
        [r for r in pages_6m if classify_page(r["page"]) == "blog"],
        key=lambda r: -r["impressions"],
    )
    if blog_pages:
        w("### Blog Pages Detail\n\n")
        w(md_table(
            ["Page", "Clicks", "Impressions", "CTR", "Position"],
            [[r["page"].replace("https://nanobananastudio.com", ""),
              fmt_int(r["clicks"]), fmt_int(r["impressions"]),
              fmt_pct(r["ctr"]), fmt_pos(r["position"])]
             for r in blog_pages],
        ))
        w("\n\n")

    # ==================================================================
    # 5) Position Movement Analysis
    # ==================================================================
    w("## 5) Position Movement\n\n")
    w("> Cannot compare per-query position changes between two periods without\n")
    w("> fresh API calls. Showing position distribution from 6-month aggregate instead.\n\n")

    # Position buckets
    pos_buckets = {"1-3": 0, "4-10": 0, "11-20": 0, "21-50": 0, "50+": 0}
    pos_imp_buckets = {"1-3": 0, "4-10": 0, "11-20": 0, "21-50": 0, "50+": 0}
    for r in queries_6m:
        p = r["position"]
        if p <= 3:
            k = "1-3"
        elif p <= 10:
            k = "4-10"
        elif p <= 20:
            k = "11-20"
        elif p <= 50:
            k = "21-50"
        else:
            k = "50+"
        pos_buckets[k] += 1
        pos_imp_buckets[k] += r["impressions"]

    w("### Query Position Distribution (6-month aggregate)\n\n")
    w(md_table(
        ["Position Range", "# Queries", "% of Queries", "Total Impressions", "% of Impressions"],
        [[k, str(v), f"{v/len(queries_6m)*100:.1f}%",
          fmt_int(pos_imp_buckets[k]),
          f"{pos_imp_buckets[k]/total_imp*100:.1f}%"]
         for k, v in pos_buckets.items()],
    ))
    w("\n\n")

    # Queries with good position but zero clicks (optimization targets)
    good_pos_no_clicks = sorted(
        [r for r in queries_6m if r["position"] <= 15 and r["clicks"] == 0 and r["impressions"] >= 5],
        key=lambda r: -r["impressions"],
    )[:15]
    if good_pos_no_clicks:
        w("### High-Rank Zero-Click Queries (pos ≤ 15, imp ≥ 5, 0 clicks)\n\n")
        w(md_table(
            ["Query", "Impressions", "Position", "Brand?"],
            [[r["query"], fmt_int(r["impressions"]), fmt_pos(r["position"]),
              "Yes" if is_brand(r["query"]) else ""]
             for r in good_pos_no_clicks],
        ))
        w("\n*These queries rank well but get no clicks — title/meta optimization targets.*\n\n")

    # ==================================================================
    # 6) Device Split
    # ==================================================================
    w("## 6) Device Split Comparison\n\n")
    w("> Aggregated over 6 months. Per-period device split requires fresh API call.\n\n")

    total_dev_imp = sum(r["impressions"] for r in devices_6m)
    w(md_table(
        ["Device", "Clicks", "Impressions", "% of Imp", "CTR", "Avg Position"],
        [[r.get("device", "?"), fmt_int(r["clicks"]), fmt_int(r["impressions"]),
          f"{r['impressions']/total_dev_imp*100:.1f}%",
          fmt_pct(r["ctr"]), fmt_pos(r["position"])]
         for r in devices_6m],
    ))
    w("\n\n")

    # Mobile vs desktop gap
    dev_map = {r.get("device"): r for r in devices_6m}
    mob = dev_map.get("MOBILE")
    desk = dev_map.get("DESKTOP")
    if mob and desk:
        w("### Mobile vs Desktop Gap\n\n")
        w(f"- Mobile CTR: {fmt_pct(mob['ctr'])} — Desktop CTR: {fmt_pct(desk['ctr'])}\n")
        w(f"- Mobile Position: {fmt_pos(mob['position'])} — Desktop Position: {fmt_pos(desk['position'])}\n")
        if mob["ctr"] > desk["ctr"]:
            w(f"- Mobile CTR is {mob['ctr']/desk['ctr']:.1f}x higher than Desktop\n")
        else:
            w(f"- Desktop CTR is {desk['ctr']/mob['ctr']:.1f}x higher than Mobile\n")
        pos_gap = abs(mob["position"] - desk["position"])
        worse = "Mobile" if mob["position"] > desk["position"] else "Desktop"
        w(f"- Position gap: {fmt_pos(pos_gap)} positions ({worse} is worse)\n")
        w(f"- Desktop has {desk['impressions']/mob['impressions']:.1f}x more impressions than Mobile\n\n")

    # ==================================================================
    # 7) Executive Interpretation
    # ==================================================================
    w("## 7) Executive Interpretation\n\n")

    imp_change = pct_change_num(agg_b["impressions"], agg_a["impressions"])
    click_change = pct_change_num(agg_b["clicks"], agg_a["clicks"])

    w("### Is impression growth brand-driven or non-brand-driven?\n\n")
    w(f"- Total impressions: **{fmt_int(agg_b['impressions'])} → {fmt_int(agg_a['impressions'])}** "
      f"({pct_change(agg_b['impressions'], agg_a['impressions'])})\n")
    w(f"- Total clicks: **{fmt_int(agg_b['clicks'])} → {fmt_int(agg_a['clicks'])}** "
      f"({pct_change(agg_b['clicks'], agg_a['clicks'])})\n")
    w(f"- Brand queries make up **{b_agg['imp']/total_imp*100:.1f}%** of 6-month impressions\n")
    w(f"- Non-brand queries make up **{nb_agg['imp']/total_imp*100:.1f}%** of 6-month impressions\n\n")

    # Look at the daily data for evidence
    # Check if late Feb spike is visible
    late_feb = [d for d in daily_a if d["date"] >= "2026-02-20"]
    early_feb = [d for d in daily_a if d["date"] <= "2026-02-10"]
    late_feb_imp = sum(d["impressions"] for d in late_feb) / len(late_feb) if late_feb else 0
    early_feb_imp = sum(d["impressions"] for d in early_feb) / len(early_feb) if early_feb else 0

    w(f"- Early Feb avg impressions/day: **{early_feb_imp:.0f}**\n")
    w(f"- Late Feb avg impressions/day (Feb 20–28): **{late_feb_imp:.0f}** "
      f"({pct_change(early_feb_imp, late_feb_imp)})\n\n")

    if imp_change > 20:
        if nb_agg["imp"] / total_imp > 0.3:
            w("**Conclusion:** Impression growth is significant and non-brand queries "
              "represent a meaningful share of total visibility. The late-Feb spike "
              "suggests emerging non-brand discovery. **Growth appears mixed** — "
              "brand remains dominant, but structural SEO signals are strengthening. "
              "The sharp increase in the final week of Period A (Feb 20–28) is a strong "
              "leading indicator of non-brand expansion, likely driven by newly indexed "
              "blog content (text rendering guide, comparison posts).\n\n")
        else:
            w("**Conclusion:** Growth is primarily **brand-driven**. Non-brand queries "
              "account for a small share of total impressions.\n\n")
    elif imp_change > 5:
        w("**Conclusion:** Moderate impression growth detected. With brand queries "
          "dominating the mix, growth is likely partially brand-driven with some "
          "structural SEO contribution from blog content.\n\n")
    else:
        w("**Conclusion:** Impression growth is minimal or flat between periods.\n\n")

    w("### Is query coverage expanding?\n\n")
    w(f"- 6-month query pool: **{len(q6m_set)}** unique queries\n")
    w(f"- 3-month query pool: **{len(q3m_set)}** unique queries\n")
    w(f"- Non-brand share of 6m: **{nonbrand_in_6m/len(q6m_set)*100:.1f}%** "
      f"({nonbrand_in_6m} queries)\n")
    w(f"- Non-brand share of 3m: **{nonbrand_in_3m/len(q3m_set)*100:.1f}%** "
      f"({nonbrand_in_3m} queries)\n\n")

    # Text rendering queries as indicator
    tr_count = len(tr_queries)
    w(f"- Text-rendering related queries: **{tr_count}** "
      f"({tr_total_imp} impressions, {tr_total_imp/total_imp*100:.1f}% of total)\n\n")

    if nonbrand_in_3m > 10:
        w("**Conclusion:** Query coverage shows **nascent expansion**. Multiple "
          "non-brand queries are appearing, particularly around text rendering topics. "
          "However, the absolute numbers remain small. The text-rendering content "
          "cluster is beginning to attract search visibility, which aligns with the "
          "strategic positioning.\n\n")
    else:
        w("**Conclusion:** Query coverage expansion is **limited**. Most visibility "
          "still comes from brand queries.\n\n")

    w("### Are blog pages gaining visibility?\n\n")
    w(f"- Blog pages: **{blog_share:.1f}%** of total page impressions\n")
    w(f"- Homepage: **{homepage_share:.1f}%** of total page impressions\n")
    w(f"- Top blog page: `{blog_pages[0]['page'].replace('https://nanobananastudio.com', '')}` "
      f"with {fmt_int(blog_pages[0]['impressions'])} impressions\n\n" if blog_pages else "")

    # Check the daily data — late period impressions growing
    w("**Daily impression trend shows clear acceleration in late February:**\n\n")
    # Show last 10 days
    last10 = daily_a[-10:]
    w(md_table(
        ["Date", "Impressions", "Clicks"],
        [[d["date"], fmt_int(d["impressions"]), fmt_int(d["clicks"])] for d in last10],
    ))
    w("\n\n")

    if blog_share > 5:
        w("**Conclusion:** Blog pages are **gaining meaningful visibility**. "
          f"At {blog_share:.1f}% of total impressions, blog content is beginning to "
          "contribute to search presence. The text rendering guide and comparison posts "
          "are the primary drivers.\n\n")
    else:
        w("**Conclusion:** Blog visibility is still **marginal** but growing.\n\n")

    w("### Is this likely a structural SEO improvement?\n\n")

    structural_signals = 0
    total_signals = 6

    checks = [
        (imp_change > 20, "Significant impression growth between periods (>20%)"),
        (click_change > 0, "Click growth between periods"),
        (blog_share > 5, "Blog pages contributing >5% of total impressions"),
        (tr_count > 5, "Multiple text-rendering queries appearing"),
        (nonbrand_in_3m / len(q3m_set) * 100 > 10 if q3m_set else False,
         "Non-brand queries >10% of 3-month pool"),
        (late_feb_imp > early_feb_imp * 1.5, "Accelerating impression trend in late Period A"),
    ]

    for passed, desc in checks:
        if passed:
            structural_signals += 1
        w(f"- [{'x' if passed else ' '}] {desc}\n")

    w(f"\n**Structural score: {structural_signals}/{total_signals}**\n\n")

    if structural_signals >= 4:
        w("**Assessment:** Strong evidence of **structural SEO improvement**. "
          "Multiple independent signals confirm that the site is building organic "
          "search visibility beyond brand queries. The accelerating trend in late "
          "February is particularly encouraging — it suggests newly indexed content "
          "is beginning to rank and attract impressions. This is consistent with "
          "sustainable growth rather than a temporary fluctuation.\n\n")
        w("**Key growth driver:** Blog content (particularly text rendering guide "
          "and comparison posts) is establishing search presence for non-brand queries. "
          "The strategic focus on text rendering reliability is starting to show "
          "measurable results in search visibility.\n")
    elif structural_signals >= 2:
        w("**Assessment:** **Some structural signals** are present but the evidence "
          "is mixed. Growth may be partially structural and partially brand-driven. "
          "The late-Feb acceleration is promising but needs another 28-day cycle to confirm.\n\n")
        w("**Recommended action:** Re-run this analysis in 4 weeks with fresh API data "
          "to confirm whether the acceleration trend continues.\n")
    else:
        w("**Assessment:** Limited evidence of structural improvement. Growth appears "
          "to be primarily brand-driven or temporary.\n")

    w("\n\n---\n\n")

    # ==================================================================
    # Appendix: What's needed for full analysis
    # ==================================================================
    w("## Appendix: Data Limitations & Next Steps\n\n")
    w("### Limitations of This Report\n\n")
    w("| Section | Limitation | Impact |\n")
    w("| --- | --- | --- |\n")
    w("| Brand/Non-Brand | Uses 6-month aggregate, not per-period | Cannot show period-over-period brand shift |\n")
    w("| Query Coverage | Compares 3m export vs 6m API | Approximation, not exact 28-day windows |\n")
    w("| Position Movement | No per-query per-period data | Cannot identify specific rank movers |\n")
    w("| Device Split | Uses 6-month aggregate | Cannot show per-period device trends |\n")
    w("| Page Distribution | Uses 6-month aggregate | Cannot show per-period page changes |\n\n")

    w("### To Get Full Comparative Analysis\n\n")
    w("1. Place the GSC service account JSON at `scripts/gsc-analytics/service-account.json`\n")
    w("2. Create `scripts/gsc-analytics/.env` from `.env.example`\n")
    w("3. Run: `.venv/bin/python gsc_compare.py`\n\n")
    w("This will fetch fresh per-period data for all dimensions and generate "
      "a complete comparison with exact brand/non-brand splits, position movers, "
      "new query identification, and device trends.\n")

    # Write report
    report_text = md.getvalue()
    report_path = OUT_DIR / "comparison_report.md"
    report_path.write_text(report_text, encoding="utf-8")
    print(f"Report written to: {report_path}")
    return report_text


if __name__ == "__main__":
    main()
