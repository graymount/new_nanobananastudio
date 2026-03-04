#!/usr/bin/env python3
"""
gsc_compare.py — Structured 28-day comparative SEO report.

Fetches GSC data for two consecutive 28-day periods and generates
a Markdown report comparing brand vs non-brand growth, query coverage
expansion, page-level distribution, position movement, and device splits.

Uses the same .env configuration as gsc_fetch.py.
"""

from __future__ import annotations

import csv
import json
import logging
import os
import re
import sys
import time
from collections import defaultdict
from datetime import date, datetime, timedelta
from io import StringIO
from pathlib import Path
from typing import Any

from google.auth.transport.requests import Request
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("gsc_compare")

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]
API_PAGE_SIZE = 25_000
MAX_RETRIES = 5
RETRY_BACKOFF = 2

# Text-rendering related keywords for flagging new queries
TEXT_RENDERING_KEYWORDS = [
    "text rendering", "text in image", "misspell", "blurry", "typography",
    "font", "lettering", "readable", "ocr", "ai text", "text generation",
    "text accuracy", "garbled text", "wrong text", "spelled wrong",
    "text overlay", "text on image", "watermark text", "banner text",
]


# ---------------------------------------------------------------------------
# Env / Auth helpers (same as gsc_fetch.py)
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


def _env(key: str, default: str | None = None, required: bool = False) -> str:
    val = os.environ.get(key, default)
    if required and not val:
        log.error("Missing required env var: %s", key)
        sys.exit(1)
    return val  # type: ignore[return-value]


def _build_service(creds_path: str):
    creds = service_account.Credentials.from_service_account_file(
        creds_path, scopes=SCOPES
    )
    creds.refresh(Request())
    return build("searchconsole", "v1", credentials=creds, cache_discovery=False)


def _api_call_with_retry(fn, *args, **kwargs) -> Any:
    delay = RETRY_BACKOFF
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            return fn(*args, **kwargs).execute()
        except HttpError as exc:
            code = exc.resp.status
            if code in (429, 500, 502, 503) and attempt < MAX_RETRIES:
                log.warning(
                    "HTTP %d on attempt %d/%d — retrying in %ds",
                    code, attempt, MAX_RETRIES, delay,
                )
                time.sleep(delay)
                delay *= 2
            else:
                raise
    return None


# ---------------------------------------------------------------------------
# Data fetching
# ---------------------------------------------------------------------------
def fetch_report(
    service, site_url: str, start: str, end: str,
    dimensions: list[str], max_rows: int = 5000,
) -> list[dict]:
    all_rows: list[dict] = []
    start_row = 0
    while True:
        body: dict[str, Any] = {
            "startDate": start,
            "endDate": end,
            "dimensions": dimensions,
            "rowLimit": min(API_PAGE_SIZE, max_rows - start_row),
            "startRow": start_row,
            "searchType": "web",
        }
        resp = _api_call_with_retry(
            service.searchanalytics().query, siteUrl=site_url, body=body
        )
        rows = resp.get("rows", [])
        if not rows:
            break
        for r in rows:
            row_dict: dict[str, Any] = {}
            for i, dim in enumerate(dimensions):
                row_dict[dim] = r["keys"][i]
            row_dict["clicks"] = r["clicks"]
            row_dict["impressions"] = r["impressions"]
            row_dict["ctr"] = r["ctr"]
            row_dict["position"] = r["position"]
            all_rows.append(row_dict)
        start_row += len(rows)
        log.info(
            "  … fetched %d rows (total %d) for dims=%s",
            len(rows), len(all_rows), dimensions,
        )
        if len(rows) < body["rowLimit"] or len(all_rows) >= max_rows:
            break
    return all_rows


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _safe_ctr(clicks: float, impressions: float) -> float:
    return clicks / impressions if impressions else 0.0


def _fmt_int(v) -> str:
    return f"{int(v):,}"


def _fmt_pos(v: float) -> str:
    return f"{v:.1f}"


def _pct(v: float) -> str:
    return f"{v * 100:.2f}%"


def _pct_change(old: float, new: float) -> str:
    if old == 0:
        return "+∞" if new > 0 else "0.00%"
    change = ((new - old) / old) * 100
    return f"{change:+.2f}%"


def _pct_change_num(old: float, new: float) -> float:
    if old == 0:
        return float("inf") if new > 0 else 0.0
    return ((new - old) / old) * 100


def agg_totals(rows: list[dict]) -> dict[str, float]:
    clicks = sum(r["clicks"] for r in rows)
    impressions = sum(r["impressions"] for r in rows)
    ctr = _safe_ctr(clicks, impressions)
    pos_weight = sum(r["position"] * r["impressions"] for r in rows)
    position = pos_weight / impressions if impressions else 0.0
    return {"clicks": clicks, "impressions": impressions, "ctr": ctr, "position": position}


def classify_brand(query: str, brand_patterns: list[str]) -> bool:
    q = query.lower()
    return any(p in q for p in brand_patterns)


def split_brand(rows: list[dict], brand_patterns: list[str]):
    brand, nonbrand = [], []
    for r in rows:
        (brand if classify_brand(r["query"], brand_patterns) else nonbrand).append(r)
    return brand, nonbrand


def is_text_rendering_related(query: str) -> bool:
    q = query.lower()
    return any(kw in q for kw in TEXT_RENDERING_KEYWORDS)


def md_table(headers: list[str], rows: list[list[str]]) -> str:
    lines = []
    lines.append("| " + " | ".join(headers) + " |")
    lines.append("| " + " | ".join("---" for _ in headers) + " |")
    for row in rows:
        lines.append("| " + " | ".join(str(c) for c in row) + " |")
    return "\n".join(lines)


def classify_page(url: str) -> str:
    """Classify a URL as homepage, blog, app, or other."""
    if re.search(r"/(en|zh|es|ja|ko)?/?$", url) or url.rstrip("/").endswith(".com"):
        return "homepage"
    if "/blog" in url:
        return "blog"
    if "/app" in url:
        return "app"
    if "/pricing" in url:
        return "pricing"
    return "other"


# ---------------------------------------------------------------------------
# Report builder
# ---------------------------------------------------------------------------
def build_comparison_report(
    site_url: str,
    period_a_start: str, period_a_end: str,
    period_b_start: str, period_b_end: str,
    queries_a: list[dict], queries_b: list[dict],
    pages_a: list[dict], pages_b: list[dict],
    devices_a: list[dict], devices_b: list[dict],
    brand_patterns: list[str],
) -> str:
    md = StringIO()
    w = md.write

    w(f"# GSC Comparative Report — {site_url}\n\n")
    w(f"**Period A (recent):** {period_a_start} → {period_a_end}  \n")
    w(f"**Period B (previous):** {period_b_start} → {period_b_end}  \n")
    w(f"**Generated:** {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}  \n")
    w(f"**Brand patterns:** `{'`, `'.join(brand_patterns)}`\n\n")
    w("---\n\n")

    # ==================================================================
    # 1) Top-Level Comparison Table
    # ==================================================================
    w("## 1) Top-Level Comparison\n\n")
    tot_a = agg_totals(queries_a)
    tot_b = agg_totals(queries_b)

    w(md_table(
        ["Metric", "Period B", "Period A", "Change"],
        [
            ["Clicks", _fmt_int(tot_b["clicks"]), _fmt_int(tot_a["clicks"]),
             _pct_change(tot_b["clicks"], tot_a["clicks"])],
            ["Impressions", _fmt_int(tot_b["impressions"]), _fmt_int(tot_a["impressions"]),
             _pct_change(tot_b["impressions"], tot_a["impressions"])],
            ["CTR", _pct(tot_b["ctr"]), _pct(tot_a["ctr"]),
             _pct_change(tot_b["ctr"], tot_a["ctr"])],
            ["Avg Position", _fmt_pos(tot_b["position"]), _fmt_pos(tot_a["position"]),
             _pct_change(tot_b["position"], tot_a["position"])],
        ],
    ))
    w("\n\n")

    # ==================================================================
    # 2) Brand vs Non-Brand Split
    # ==================================================================
    w("## 2) Brand vs Non-Brand Split\n\n")
    brand_a, nonbrand_a = split_brand(queries_a, brand_patterns)
    brand_b, nonbrand_b = split_brand(queries_b, brand_patterns)

    bt_a = agg_totals(brand_a) if brand_a else {"clicks": 0, "impressions": 0, "ctr": 0, "position": 0}
    bt_b = agg_totals(brand_b) if brand_b else {"clicks": 0, "impressions": 0, "ctr": 0, "position": 0}
    nbt_a = agg_totals(nonbrand_a) if nonbrand_a else {"clicks": 0, "impressions": 0, "ctr": 0, "position": 0}
    nbt_b = agg_totals(nonbrand_b) if nonbrand_b else {"clicks": 0, "impressions": 0, "ctr": 0, "position": 0}

    brand_share_a = (bt_a["impressions"] / tot_a["impressions"] * 100) if tot_a["impressions"] else 0
    brand_share_b = (bt_b["impressions"] / tot_b["impressions"] * 100) if tot_b["impressions"] else 0
    nonbrand_share_a = (nbt_a["impressions"] / tot_a["impressions"] * 100) if tot_a["impressions"] else 0
    nonbrand_share_b = (nbt_b["impressions"] / tot_b["impressions"] * 100) if tot_b["impressions"] else 0

    w("### Brand Queries\n\n")
    w(md_table(
        ["Metric", "Period B", "Period A", "Change"],
        [
            ["Clicks", _fmt_int(bt_b["clicks"]), _fmt_int(bt_a["clicks"]),
             _pct_change(bt_b["clicks"], bt_a["clicks"])],
            ["Impressions", _fmt_int(bt_b["impressions"]), _fmt_int(bt_a["impressions"]),
             _pct_change(bt_b["impressions"], bt_a["impressions"])],
            ["CTR", _pct(bt_b["ctr"]), _pct(bt_a["ctr"]),
             _pct_change(bt_b["ctr"], bt_a["ctr"])],
            ["Avg Position", _fmt_pos(bt_b["position"]), _fmt_pos(bt_a["position"]),
             _pct_change(bt_b["position"], bt_a["position"])],
            ["% of Total Impressions", f"{brand_share_b:.1f}%", f"{brand_share_a:.1f}%", ""],
        ],
    ))
    w("\n\n")

    w("### Non-Brand Queries\n\n")
    w(md_table(
        ["Metric", "Period B", "Period A", "Change"],
        [
            ["Clicks", _fmt_int(nbt_b["clicks"]), _fmt_int(nbt_a["clicks"]),
             _pct_change(nbt_b["clicks"], nbt_a["clicks"])],
            ["Impressions", _fmt_int(nbt_b["impressions"]), _fmt_int(nbt_a["impressions"]),
             _pct_change(nbt_b["impressions"], nbt_a["impressions"])],
            ["CTR", _pct(nbt_b["ctr"]), _pct(nbt_a["ctr"]),
             _pct_change(nbt_b["ctr"], nbt_a["ctr"])],
            ["Avg Position", _fmt_pos(nbt_b["position"]), _fmt_pos(nbt_a["position"]),
             _pct_change(nbt_b["position"], nbt_a["position"])],
            ["% of Total Impressions", f"{nonbrand_share_b:.1f}%", f"{nonbrand_share_a:.1f}%", ""],
        ],
    ))
    w("\n\n")

    w("### Impression Share Summary\n\n")
    w(md_table(
        ["Segment", "Period B Share", "Period A Share", "Shift"],
        [
            ["Brand", f"{brand_share_b:.1f}%", f"{brand_share_a:.1f}%",
             f"{brand_share_a - brand_share_b:+.1f}pp"],
            ["Non-Brand", f"{nonbrand_share_b:.1f}%", f"{nonbrand_share_a:.1f}%",
             f"{nonbrand_share_a - nonbrand_share_b:+.1f}pp"],
        ],
    ))
    w("\n\n")

    # ==================================================================
    # 3) Query Coverage Expansion
    # ==================================================================
    w("## 3) Query Coverage Expansion\n\n")

    queries_a_set = {r["query"] for r in queries_a}
    queries_b_set = {r["query"] for r in queries_b}

    new_queries_in_a = queries_a_set - queries_b_set
    lost_queries = queries_b_set - queries_a_set
    shared_queries = queries_a_set & queries_b_set

    w(md_table(
        ["Metric", "Period B", "Period A", "Change"],
        [
            ["Unique Queries", _fmt_int(len(queries_b_set)), _fmt_int(len(queries_a_set)),
             _pct_change(len(queries_b_set), len(queries_a_set))],
            ["New Queries (in A, not in B)", "—", _fmt_int(len(new_queries_in_a)), ""],
            ["Lost Queries (in B, not in A)", _fmt_int(len(lost_queries)), "—", ""],
            ["Shared Queries", _fmt_int(len(shared_queries)), _fmt_int(len(shared_queries)), ""],
        ],
    ))
    w("\n\n")

    # Build lookup for period A query data
    qa_lookup = {r["query"]: r for r in queries_a}

    # Top 20 new queries by impressions
    new_q_data = sorted(
        [qa_lookup[q] for q in new_queries_in_a if q in qa_lookup],
        key=lambda r: -r["impressions"],
    )[:20]

    w("### Top 20 New Queries in Period A (by impressions)\n\n")
    if new_q_data:
        w(md_table(
            ["#", "Query", "Clicks", "Impressions", "CTR", "Position", "Text-Rendering Related"],
            [
                [str(i + 1), r["query"], _fmt_int(r["clicks"]), _fmt_int(r["impressions"]),
                 _pct(r["ctr"]), _fmt_pos(r["position"]),
                 "Yes" if is_text_rendering_related(r["query"]) else ""]
                for i, r in enumerate(new_q_data)
            ],
        ))
    else:
        w("*No new queries found.*\n")
    w("\n\n")

    # Count text-rendering related among new queries
    tr_count = sum(1 for q in new_queries_in_a if is_text_rendering_related(q))
    w(f"**Text-rendering related new queries:** {tr_count} out of {len(new_queries_in_a)} "
      f"({tr_count / len(new_queries_in_a) * 100:.1f}% of new queries)\n\n" if new_queries_in_a
      else "")

    # ==================================================================
    # 4) Page-Level Distribution
    # ==================================================================
    w("## 4) Page-Level Distribution\n\n")

    # Top 10 pages each period
    pages_a_sorted = sorted(pages_a, key=lambda r: -r["impressions"])[:10]
    pages_b_sorted = sorted(pages_b, key=lambda r: -r["impressions"])[:10]

    w("### Top 10 Pages — Period A\n\n")
    if pages_a_sorted:
        w(md_table(
            ["#", "Page", "Clicks", "Impressions", "CTR", "Position", "Type"],
            [
                [str(i + 1), r["page"], _fmt_int(r["clicks"]), _fmt_int(r["impressions"]),
                 _pct(r["ctr"]), _fmt_pos(r["position"]), classify_page(r["page"])]
                for i, r in enumerate(pages_a_sorted)
            ],
        ))
    w("\n\n")

    w("### Top 10 Pages — Period B\n\n")
    if pages_b_sorted:
        w(md_table(
            ["#", "Page", "Clicks", "Impressions", "CTR", "Position", "Type"],
            [
                [str(i + 1), r["page"], _fmt_int(r["clicks"]), _fmt_int(r["impressions"]),
                 _pct(r["ctr"]), _fmt_pos(r["position"]), classify_page(r["page"])]
                for i, r in enumerate(pages_b_sorted)
            ],
        ))
    w("\n\n")

    # Impression distribution by page type
    def page_type_dist(pages):
        dist = defaultdict(lambda: {"clicks": 0, "impressions": 0})
        for r in pages:
            pt = classify_page(r["page"])
            dist[pt]["clicks"] += r["clicks"]
            dist[pt]["impressions"] += r["impressions"]
        return dict(dist)

    dist_a = page_type_dist(pages_a)
    dist_b = page_type_dist(pages_b)
    all_types = sorted(set(list(dist_a.keys()) + list(dist_b.keys())))

    total_imp_a = sum(r["impressions"] for r in pages_a)
    total_imp_b = sum(r["impressions"] for r in pages_b)

    w("### Impression Distribution by Page Type\n\n")
    dist_rows = []
    for pt in all_types:
        imp_b = dist_b.get(pt, {}).get("impressions", 0)
        imp_a = dist_a.get(pt, {}).get("impressions", 0)
        share_b = (imp_b / total_imp_b * 100) if total_imp_b else 0
        share_a = (imp_a / total_imp_a * 100) if total_imp_a else 0
        dist_rows.append([
            pt,
            _fmt_int(imp_b), f"{share_b:.1f}%",
            _fmt_int(imp_a), f"{share_a:.1f}%",
            _pct_change(imp_b, imp_a),
        ])
    w(md_table(
        ["Page Type", "Imp B", "Share B", "Imp A", "Share A", "Imp Change"],
        dist_rows,
    ))
    w("\n\n")

    blog_share_a = dist_a.get("blog", {}).get("impressions", 0) / total_imp_a * 100 if total_imp_a else 0
    blog_share_b = dist_b.get("blog", {}).get("impressions", 0) / total_imp_b * 100 if total_imp_b else 0
    blog_grew = blog_share_a > blog_share_b
    w(f"**Blog impression share:** {blog_share_b:.1f}% → {blog_share_a:.1f}% "
      f"({'increased' if blog_grew else 'decreased'} by {abs(blog_share_a - blog_share_b):.1f}pp)\n\n")

    # ==================================================================
    # 5) Position Movement
    # ==================================================================
    w("## 5) Position Movement\n\n")

    # Build lookups
    qb_lookup = {r["query"]: r for r in queries_b}

    # 5a. Queries that moved from pos 15-30 in B to pos 1-15 in A
    w("### Queries Moving from Position 15–30 → 1–15\n\n")
    movers = []
    for q in shared_queries:
        ra = qa_lookup.get(q)
        rb = qb_lookup.get(q)
        if ra and rb:
            if 15 <= rb["position"] <= 30 and ra["position"] <= 15:
                movers.append({
                    "query": q,
                    "pos_b": rb["position"],
                    "pos_a": ra["position"],
                    "imp_b": rb["impressions"],
                    "imp_a": ra["impressions"],
                    "clicks_a": ra["clicks"],
                })
    movers.sort(key=lambda r: -r["imp_a"])

    if movers:
        w(md_table(
            ["Query", "Position B", "Position A", "Imp B", "Imp A", "Clicks A"],
            [
                [m["query"], _fmt_pos(m["pos_b"]), _fmt_pos(m["pos_a"]),
                 _fmt_int(m["imp_b"]), _fmt_int(m["imp_a"]), _fmt_int(m["clicks_a"])]
                for m in movers[:20]
            ],
        ))
    else:
        w("*No queries moved from position 15–30 to 1–15.*\n")
    w("\n\n")

    # 5b. Queries that gained >=30% impressions
    w("### Queries Gaining ≥30% Impressions\n\n")
    gainers = []
    for q in shared_queries:
        ra = qa_lookup.get(q)
        rb = qb_lookup.get(q)
        if ra and rb and rb["impressions"] > 0:
            pct = _pct_change_num(rb["impressions"], ra["impressions"])
            if pct >= 30:
                gainers.append({
                    "query": q,
                    "imp_b": rb["impressions"],
                    "imp_a": ra["impressions"],
                    "pct": pct,
                    "pos_b": rb["position"],
                    "pos_a": ra["position"],
                })
    gainers.sort(key=lambda r: -r["imp_a"])

    if gainers:
        w(md_table(
            ["Query", "Imp B", "Imp A", "% Change", "Position B", "Position A"],
            [
                [g["query"], _fmt_int(g["imp_b"]), _fmt_int(g["imp_a"]),
                 f"{g['pct']:+.1f}%", _fmt_pos(g["pos_b"]), _fmt_pos(g["pos_a"])]
                for g in gainers[:20]
            ],
        ))
    else:
        w("*No queries gained ≥30% impressions.*\n")
    w("\n\n")

    # ==================================================================
    # 6) Device Split Comparison
    # ==================================================================
    w("## 6) Device Split Comparison\n\n")

    dev_a_map = {r["device"]: r for r in devices_a}
    dev_b_map = {r["device"]: r for r in devices_b}
    all_devices = sorted(set(list(dev_a_map.keys()) + list(dev_b_map.keys())))

    dev_rows = []
    for d in all_devices:
        da = dev_a_map.get(d, {"clicks": 0, "impressions": 0, "ctr": 0, "position": 0})
        db = dev_b_map.get(d, {"clicks": 0, "impressions": 0, "ctr": 0, "position": 0})
        dev_rows.append([
            d,
            _fmt_int(db["impressions"]), _fmt_int(da["impressions"]),
            _pct_change(db["impressions"], da["impressions"]),
            _fmt_pos(db["position"]), _fmt_pos(da["position"]),
            _pct(db["ctr"]), _pct(da["ctr"]),
        ])

    w(md_table(
        ["Device", "Imp B", "Imp A", "Imp Change", "Pos B", "Pos A", "CTR B", "CTR A"],
        dev_rows,
    ))
    w("\n\n")

    # ==================================================================
    # 7) Executive Interpretation
    # ==================================================================
    w("## 7) Executive Interpretation\n\n")

    # Is impression growth brand-driven or non-brand-driven?
    imp_change_total = _pct_change_num(tot_b["impressions"], tot_a["impressions"])
    imp_change_brand = _pct_change_num(bt_b["impressions"], bt_a["impressions"])
    imp_change_nonbrand = _pct_change_num(nbt_b["impressions"], nbt_a["impressions"])

    w("### Is impression growth brand-driven or non-brand-driven?\n\n")
    w(f"- Total impression change: **{imp_change_total:+.1f}%**\n")
    w(f"- Brand impression change: **{imp_change_brand:+.1f}%**\n")
    w(f"- Non-brand impression change: **{imp_change_nonbrand:+.1f}%**\n")
    w(f"- Non-brand share shifted: **{nonbrand_share_b:.1f}% → {nonbrand_share_a:.1f}%** "
      f"({nonbrand_share_a - nonbrand_share_b:+.1f}pp)\n\n")

    if imp_change_total > 5:
        if imp_change_nonbrand > imp_change_brand:
            w("**Conclusion:** Growth is primarily **non-brand-driven**. "
              "Non-brand queries are growing faster than brand queries, "
              "indicating structural SEO expansion.\n\n")
        elif imp_change_brand > imp_change_nonbrand * 2:
            w("**Conclusion:** Growth is primarily **brand-driven**. "
              "Brand search volume is increasing faster than non-brand, "
              "suggesting external awareness activity (Product Hunt, social, etc.) "
              "rather than organic SEO expansion.\n\n")
        else:
            w("**Conclusion:** Growth is **mixed** — both brand and non-brand are "
              "growing at similar rates. This suggests a combination of "
              "brand awareness and SEO improvements.\n\n")
    elif imp_change_total < -5:
        w("**Conclusion:** Impressions are **declining**. "
          "Investigate whether this is seasonal, algorithm-related, or due to "
          "technical issues.\n\n")
    else:
        w("**Conclusion:** Impressions are roughly **flat** between periods. "
          "No significant growth or decline detected.\n\n")

    # Is query coverage expanding?
    w("### Is query coverage expanding?\n\n")
    query_expansion = _pct_change_num(len(queries_b_set), len(queries_a_set))
    w(f"- Unique queries: **{len(queries_b_set)} → {len(queries_a_set)}** "
      f"({query_expansion:+.1f}%)\n")
    w(f"- New queries appearing: **{len(new_queries_in_a)}**\n")
    w(f"- Queries lost: **{len(lost_queries)}**\n")
    net = len(new_queries_in_a) - len(lost_queries)
    w(f"- Net query change: **{net:+d}**\n\n")

    if net > 0 and query_expansion > 10:
        w("**Conclusion:** Yes, query coverage is **expanding significantly**. "
          f"The site gained {len(new_queries_in_a)} new queries while losing {len(lost_queries)}, "
          f"a net gain of {net}.\n\n")
    elif net > 0:
        w("**Conclusion:** Query coverage is **slightly expanding**. "
          "The site is appearing for new queries, but growth is moderate.\n\n")
    else:
        w("**Conclusion:** Query coverage is **not expanding** — the site "
          "lost more queries than it gained.\n\n")

    # Are blog pages gaining visibility?
    w("### Are blog pages gaining visibility?\n\n")
    blog_imp_b = dist_b.get("blog", {}).get("impressions", 0)
    blog_imp_a = dist_a.get("blog", {}).get("impressions", 0)
    blog_change = _pct_change_num(blog_imp_b, blog_imp_a)
    w(f"- Blog impressions: **{_fmt_int(blog_imp_b)} → {_fmt_int(blog_imp_a)}** "
      f"({blog_change:+.1f}%)\n")
    w(f"- Blog share of total: **{blog_share_b:.1f}% → {blog_share_a:.1f}%**\n\n")

    if blog_change > 10 and blog_grew:
        w("**Conclusion:** Yes, blog pages are **gaining visibility**. "
          "Both absolute impressions and share of total are increasing.\n\n")
    elif blog_change > 0:
        w("**Conclusion:** Blog visibility is **slightly improving** but not a dominant driver.\n\n")
    else:
        w("**Conclusion:** Blog pages are **not gaining visibility** in this period.\n\n")

    # Is this likely a structural SEO improvement?
    w("### Is this likely a structural SEO improvement?\n\n")

    structural_signals = 0
    total_signals = 5

    if imp_change_nonbrand > 10:
        structural_signals += 1
        w("- [x] Non-brand impressions growing (>10%)\n")
    else:
        w("- [ ] Non-brand impressions growing (>10%)\n")

    if query_expansion > 10:
        structural_signals += 1
        w("- [x] Query coverage expanding (>10%)\n")
    else:
        w("- [ ] Query coverage expanding (>10%)\n")

    if blog_grew and blog_change > 10:
        structural_signals += 1
        w("- [x] Blog visibility increasing\n")
    else:
        w("- [ ] Blog visibility increasing\n")

    if movers:
        structural_signals += 1
        w(f"- [x] Position improvements detected ({len(movers)} queries moved into top 15)\n")
    else:
        w("- [ ] Position improvements detected\n")

    if nonbrand_share_a > nonbrand_share_b:
        structural_signals += 1
        w("- [x] Non-brand share of impressions increasing\n")
    else:
        w("- [ ] Non-brand share of impressions increasing\n")

    w(f"\n**Structural score: {structural_signals}/{total_signals}**\n\n")

    if structural_signals >= 4:
        w("**Assessment:** This is very likely a **structural SEO improvement**. "
          "Multiple signals confirm sustainable organic growth driven by content expansion "
          "and improved rankings, not just brand awareness.\n")
    elif structural_signals >= 2:
        w("**Assessment:** There are **some structural signals** but the evidence is mixed. "
          "Growth may be partially structural and partially driven by brand or external factors. "
          "Monitor the next 28-day cycle for confirmation.\n")
    else:
        w("**Assessment:** Limited evidence of structural improvement. "
          "Growth (if any) appears to be driven by brand awareness or temporary fluctuations "
          "rather than sustainable SEO expansion.\n")

    w("\n---\n")
    w(f"\n*Report generated from GSC Search Analytics API. "
      f"Up to 5,000 rows fetched per dimension per period. "
      f"Data has a 2–3 day lag.*\n")

    return md.getvalue()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main() -> None:
    _load_env_file()

    creds_path = _env("GOOGLE_APPLICATION_CREDENTIALS", required=True)
    site_url = _env("GSC_SITE_URL", required=True)
    max_rows = int(_env("MAX_ROWS", "5000"))
    out_dir = Path(_env("OUTPUT_DIR", str(Path(__file__).resolve().parent / "output")))
    brand_terms = [
        t.strip().lower()
        for t in _env(
            "BRAND_TERMS",
            "nano banana,nanobanana,nano-banana,nanobananastudio"
        ).split(",")
        if t.strip()
    ]

    # Calculate time windows
    # GSC data has 2-3 day lag, so end at 3 days ago
    today = date.today()
    end_a = today - timedelta(days=3)
    start_a = end_a - timedelta(days=27)  # 28 days inclusive
    end_b = start_a - timedelta(days=1)
    start_b = end_b - timedelta(days=27)  # 28 days inclusive

    period_a_start = start_a.isoformat()
    period_a_end = end_a.isoformat()
    period_b_start = start_b.isoformat()
    period_b_end = end_b.isoformat()

    out_dir.mkdir(parents=True, exist_ok=True)

    log.info("Site: %s", site_url)
    log.info("Period A: %s → %s", period_a_start, period_a_end)
    log.info("Period B: %s → %s", period_b_start, period_b_end)
    log.info("Output: %s", out_dir)
    log.info("Brand terms: %s", brand_terms)

    service = _build_service(creds_path)

    # Verify access
    sites = service.sites().list().execute().get("siteEntry", [])
    urls = [s["siteUrl"] for s in sites]
    if site_url not in urls:
        log.error("Cannot access '%s'. Available: %s", site_url, urls)
        sys.exit(1)
    log.info("Access verified")

    # Fetch Period A
    log.info("=== Fetching Period A ===")
    log.info("Fetching queries (A) …")
    queries_a = fetch_report(service, site_url, period_a_start, period_a_end, ["query"], max_rows)
    log.info("Fetching pages (A) …")
    pages_a = fetch_report(service, site_url, period_a_start, period_a_end, ["page"], max_rows)
    log.info("Fetching devices (A) …")
    devices_a = fetch_report(service, site_url, period_a_start, period_a_end, ["device"], 10)

    # Fetch Period B
    log.info("=== Fetching Period B ===")
    log.info("Fetching queries (B) …")
    queries_b = fetch_report(service, site_url, period_b_start, period_b_end, ["query"], max_rows)
    log.info("Fetching pages (B) …")
    pages_b = fetch_report(service, site_url, period_b_start, period_b_end, ["page"], max_rows)
    log.info("Fetching devices (B) …")
    devices_b = fetch_report(service, site_url, period_b_start, period_b_end, ["device"], 10)

    # Export raw CSVs
    def write_csv(rows, path):
        if not rows:
            path.write_text("")
            return
        fieldnames = list(rows[0].keys())
        with open(path, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=fieldnames)
            w.writeheader()
            w.writerows(rows)
        log.info("Wrote %d rows → %s", len(rows), path)

    write_csv(queries_a, out_dir / "compare_queries_a.csv")
    write_csv(queries_b, out_dir / "compare_queries_b.csv")
    write_csv(pages_a, out_dir / "compare_pages_a.csv")
    write_csv(pages_b, out_dir / "compare_pages_b.csv")
    write_csv(devices_a, out_dir / "compare_devices_a.csv")
    write_csv(devices_b, out_dir / "compare_devices_b.csv")

    # Build report
    report = build_comparison_report(
        site_url=site_url,
        period_a_start=period_a_start, period_a_end=period_a_end,
        period_b_start=period_b_start, period_b_end=period_b_end,
        queries_a=queries_a, queries_b=queries_b,
        pages_a=pages_a, pages_b=pages_b,
        devices_a=devices_a, devices_b=devices_b,
        brand_patterns=brand_terms,
    )

    report_path = out_dir / "comparison_report.md"
    report_path.write_text(report, encoding="utf-8")
    log.info("Report → %s", report_path)

    # Also save metadata
    meta = {
        "site_url": site_url,
        "period_a": {"start": period_a_start, "end": period_a_end},
        "period_b": {"start": period_b_start, "end": period_b_end},
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "queries_a_count": len(queries_a),
        "queries_b_count": len(queries_b),
        "pages_a_count": len(pages_a),
        "pages_b_count": len(pages_b),
    }
    (out_dir / "compare_meta.json").write_text(
        json.dumps(meta, indent=2, ensure_ascii=False)
    )

    log.info("Done.")


if __name__ == "__main__":
    main()
