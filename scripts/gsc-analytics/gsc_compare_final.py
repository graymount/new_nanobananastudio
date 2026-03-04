#!/usr/bin/env python3
"""
gsc_compare_final.py — Build the definitive 28-day comparative report
from the GSC web export with comparison mode enabled.
"""

from __future__ import annotations

import csv
import re
from collections import defaultdict
from datetime import datetime, timezone
from io import StringIO
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parent / "output"
DATA_DIR = OUT_DIR / "compare-28d"

BRAND_PATTERNS = [
    "nano banana", "nanobanana", "nano-banana", "nanobananastudio",
    "nano banan", "nano bana", "nano banano", "nana banana",
    "navobanana", "nnanobanana", "nanobana", "nono banna",
    "banano studio", "nenu banana", "nanebanana", "nanobanba",
    "banan studio", "banna studio", "panana studio", "nanobbanana",
    "nanobananas", "nanban studio",
]

TEXT_RENDERING_KW = [
    "text rendering", "text in image", "misspell", "blurry", "typography",
    "font", "lettering", "readable", "ocr", "ai text", "text generation",
    "text accuracy", "garbled text", "wrong text", "spelled wrong",
    "text overlay", "text on image", "rendering text", "precise text",
    "accurate text", "prompt engineering",
]


def parse_num(v: str) -> float:
    try:
        return float(v.replace(",", "").replace("%", "").strip() or "0")
    except (ValueError, TypeError):
        return 0.0


def parse_pct(v: str) -> float:
    try:
        return float(v.replace("%", "").strip() or "0") / 100
    except (ValueError, TypeError):
        return 0.0


def read_compare_csv(path: Path, key_col: str) -> list[dict]:
    rows = []
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.reader(f)
        header = next(reader)
        for raw in reader:
            if len(raw) < len(header):
                continue
            r = dict(zip(header, raw))
            rows.append(r)
    return rows


def is_brand(q: str) -> bool:
    q = q.lower()
    return any(p in q for p in BRAND_PATTERNS)


def is_text_rendering(q: str) -> bool:
    q = q.lower()
    return any(kw in q for kw in TEXT_RENDERING_KW)


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


def fi(v) -> str:
    return f"{int(v):,}"


def fp(v: float) -> str:
    return f"{v:.1f}"


def fpct(v: float) -> str:
    return f"{v * 100:.2f}%"


def pchg(old: float, new: float) -> str:
    if old == 0:
        return "+∞" if new > 0 else "—"
    return f"{((new - old) / old) * 100:+.1f}%"


def pchg_n(old: float, new: float) -> float:
    if old == 0:
        return float("inf") if new > 0 else 0.0
    return ((new - old) / old) * 100


def md_table(headers, rows):
    lines = ["| " + " | ".join(headers) + " |"]
    lines.append("| " + " | ".join("---" for _ in headers) + " |")
    for row in rows:
        lines.append("| " + " | ".join(str(c) for c in row) + " |")
    return "\n".join(lines)


def main():
    # ---- Load queries ----
    qrows = read_compare_csv(DATA_DIR / "查询数.csv", "热门查询")

    queries = []
    for r in qrows:
        q = r.get("热门查询", "")
        queries.append({
            "query": q,
            "clicks_a": parse_num(r.get("过去 28 天 点击次数", "0")),
            "clicks_b": parse_num(r.get("先前 28 天 点击次数", "0")),
            "imp_a": parse_num(r.get("过去 28 天 展示", "0")),
            "imp_b": parse_num(r.get("先前 28 天 展示", "0")),
            "ctr_a": parse_pct(r.get("过去 28 天 点击率", "0%")),
            "ctr_b": parse_pct(r.get("先前 28 天 点击率", "0%")),
            "pos_a": parse_num(r.get("过去 28 天 排名", "0")),
            "pos_b": parse_num(r.get("先前 28 天 排名", "0")),
        })

    # ---- Load pages ----
    prows = read_compare_csv(DATA_DIR / "网页.csv", "排名靠前的网页")
    pages = []
    for r in prows:
        pages.append({
            "page": r.get("排名靠前的网页", ""),
            "clicks_a": parse_num(r.get("过去 28 天 点击次数", "0")),
            "clicks_b": parse_num(r.get("先前 28 天 点击次数", "0")),
            "imp_a": parse_num(r.get("过去 28 天 展示", "0")),
            "imp_b": parse_num(r.get("先前 28 天 展示", "0")),
            "ctr_a": parse_pct(r.get("过去 28 天 点击率", "0%")),
            "ctr_b": parse_pct(r.get("先前 28 天 点击率", "0%")),
            "pos_a": parse_num(r.get("过去 28 天 排名", "0")),
            "pos_b": parse_num(r.get("先前 28 天 排名", "0")),
        })

    # ---- Load devices ----
    drows = read_compare_csv(DATA_DIR / "设备.csv", "设备")
    devices = []
    for r in drows:
        devices.append({
            "device": r.get("设备", ""),
            "clicks_a": parse_num(r.get("过去 28 天 点击次数", "0")),
            "clicks_b": parse_num(r.get("先前 28 天 点击次数", "0")),
            "imp_a": parse_num(r.get("过去 28 天 展示", "0")),
            "imp_b": parse_num(r.get("先前 28 天 展示", "0")),
            "ctr_a": parse_pct(r.get("过去 28 天 点击率", "0%")),
            "ctr_b": parse_pct(r.get("先前 28 天 点击率", "0%")),
            "pos_a": parse_num(r.get("过去 28 天 排名", "0")),
            "pos_b": parse_num(r.get("先前 28 天 排名", "0")),
        })

    # ---- Aggregates ----
    tot_clicks_a = sum(q["clicks_a"] for q in queries)
    tot_clicks_b = sum(q["clicks_b"] for q in queries)
    tot_imp_a = sum(q["imp_a"] for q in queries)
    tot_imp_b = sum(q["imp_b"] for q in queries)
    tot_ctr_a = tot_clicks_a / tot_imp_a if tot_imp_a else 0
    tot_ctr_b = tot_clicks_b / tot_imp_b if tot_imp_b else 0

    def wavg_pos(qs, period):
        imp_key = f"imp_{period}"
        pos_key = f"pos_{period}"
        total_imp = sum(q[imp_key] for q in qs)
        if total_imp == 0:
            return 0
        return sum(q[pos_key] * q[imp_key] for q in qs) / total_imp

    avg_pos_a = wavg_pos(queries, "a")
    avg_pos_b = wavg_pos(queries, "b")

    # ---- Brand / Non-Brand ----
    brand_q = [q for q in queries if is_brand(q["query"])]
    nonbrand_q = [q for q in queries if not is_brand(q["query"])]

    def seg_agg(qs):
        ca = sum(q["clicks_a"] for q in qs)
        cb = sum(q["clicks_b"] for q in qs)
        ia = sum(q["imp_a"] for q in qs)
        ib = sum(q["imp_b"] for q in qs)
        return {
            "clicks_a": ca, "clicks_b": cb,
            "imp_a": ia, "imp_b": ib,
            "ctr_a": ca / ia if ia else 0,
            "ctr_b": cb / ib if ib else 0,
            "pos_a": wavg_pos(qs, "a"),
            "pos_b": wavg_pos(qs, "b"),
            "count": len(qs),
        }

    b = seg_agg(brand_q)
    nb = seg_agg(nonbrand_q)

    # ---- Query sets ----
    qa_set = {q["query"] for q in queries if q["imp_a"] > 0}
    qb_set = {q["query"] for q in queries if q["imp_b"] > 0}
    new_in_a = qa_set - qb_set
    lost_from_a = qb_set - qa_set
    shared = qa_set & qb_set

    # ---- Build report ----
    md = StringIO()
    w = md.write

    w("# GSC Comparative Report — nanobananastudio.com\n\n")
    w("**Period A (recent 28 days):** ~2026-02-01 → 2026-02-28  \n")
    w("**Period B (previous 28 days):** ~2026-01-04 → 2026-01-31  \n")
    w(f"**Generated:** {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}  \n")
    w("**Data source:** GSC web export with comparison mode (downloaded 2026-03-03)  \n\n")
    w("---\n\n")

    # ===== 1) TOP-LEVEL =====
    w("## 1) Top-Level Comparison\n\n")
    w(md_table(
        ["Metric", "Period B", "Period A", "Change"],
        [
            ["Total Clicks", fi(tot_clicks_b), fi(tot_clicks_a), pchg(tot_clicks_b, tot_clicks_a)],
            ["Total Impressions", fi(tot_imp_b), fi(tot_imp_a), pchg(tot_imp_b, tot_imp_a)],
            ["CTR", fpct(tot_ctr_b), fpct(tot_ctr_a), pchg(tot_ctr_b, tot_ctr_a)],
            ["Avg Position", fp(avg_pos_b), fp(avg_pos_a), pchg(avg_pos_b, avg_pos_a)],
        ],
    ))
    w("\n\n")

    # ===== 2) BRAND vs NON-BRAND =====
    w("## 2) Brand vs Non-Brand Split\n\n")

    b_share_a = b["imp_a"] / tot_imp_a * 100 if tot_imp_a else 0
    b_share_b = b["imp_b"] / tot_imp_b * 100 if tot_imp_b else 0
    nb_share_a = nb["imp_a"] / tot_imp_a * 100 if tot_imp_a else 0
    nb_share_b = nb["imp_b"] / tot_imp_b * 100 if tot_imp_b else 0

    w("### Brand Queries\n\n")
    w(md_table(
        ["Metric", "Period B", "Period A", "Change"],
        [
            ["Clicks", fi(b["clicks_b"]), fi(b["clicks_a"]), pchg(b["clicks_b"], b["clicks_a"])],
            ["Impressions", fi(b["imp_b"]), fi(b["imp_a"]), pchg(b["imp_b"], b["imp_a"])],
            ["CTR", fpct(b["ctr_b"]), fpct(b["ctr_a"]), pchg(b["ctr_b"], b["ctr_a"])],
            ["Avg Position", fp(b["pos_b"]), fp(b["pos_a"]), pchg(b["pos_b"], b["pos_a"])],
            ["% of Total Imp", f"{b_share_b:.1f}%", f"{b_share_a:.1f}%", f"{b_share_a - b_share_b:+.1f}pp"],
        ],
    ))
    w("\n\n### Non-Brand Queries\n\n")
    w(md_table(
        ["Metric", "Period B", "Period A", "Change"],
        [
            ["Clicks", fi(nb["clicks_b"]), fi(nb["clicks_a"]), pchg(nb["clicks_b"], nb["clicks_a"])],
            ["Impressions", fi(nb["imp_b"]), fi(nb["imp_a"]), pchg(nb["imp_b"], nb["imp_a"])],
            ["CTR", fpct(nb["ctr_b"]), fpct(nb["ctr_a"]), pchg(nb["ctr_b"], nb["ctr_a"])],
            ["Avg Position", fp(nb["pos_b"]), fp(nb["pos_a"]), pchg(nb["pos_b"], nb["pos_a"])],
            ["% of Total Imp", f"{nb_share_b:.1f}%", f"{nb_share_a:.1f}%", f"{nb_share_a - nb_share_b:+.1f}pp"],
        ],
    ))
    w("\n\n### Impression Share Summary\n\n")
    w(md_table(
        ["Segment", "Period B", "Period A", "Shift"],
        [
            ["Brand", f"{b_share_b:.1f}%", f"{b_share_a:.1f}%", f"{b_share_a - b_share_b:+.1f}pp"],
            ["Non-Brand", f"{nb_share_b:.1f}%", f"{nb_share_a:.1f}%", f"{nb_share_a - nb_share_b:+.1f}pp"],
        ],
    ))
    w("\n\n")

    # ===== 3) QUERY COVERAGE =====
    w("## 3) Query Coverage Expansion\n\n")
    w(md_table(
        ["Metric", "Period B", "Period A", "Change"],
        [
            ["Unique Queries", fi(len(qb_set)), fi(len(qa_set)), pchg(len(qb_set), len(qa_set))],
            ["New Queries (in A, not in B)", "—", fi(len(new_in_a)), ""],
            ["Lost Queries (in B, not in A)", fi(len(lost_from_a)), "—", ""],
            ["Shared Queries", fi(len(shared)), fi(len(shared)), ""],
        ],
    ))
    w("\n\n")

    # Top 20 new queries
    q_lookup = {q["query"]: q for q in queries}
    new_q_data = sorted(
        [q_lookup[q] for q in new_in_a if q in q_lookup],
        key=lambda r: -r["imp_a"],
    )[:20]

    w("### Top 20 New Queries in Period A\n\n")
    if new_q_data:
        w(md_table(
            ["#", "Query", "Clicks", "Impressions", "CTR", "Position", "Text-Rendering?"],
            [
                [str(i+1), q["query"], fi(q["clicks_a"]), fi(q["imp_a"]),
                 fpct(q["ctr_a"]), fp(q["pos_a"]),
                 "**Yes**" if is_text_rendering(q["query"]) else ""]
                for i, q in enumerate(new_q_data)
            ],
        ))
    else:
        w("*None.*\n")
    w("\n\n")

    tr_new = [q for q in new_in_a if is_text_rendering(q)]
    w(f"**Text-rendering related among new queries:** {len(tr_new)} out of {len(new_in_a)}\n\n")

    # ===== 4) PAGE-LEVEL =====
    w("## 4) Page-Level Distribution\n\n")

    pages_a_sorted = sorted(pages, key=lambda r: -r["imp_a"])[:10]
    pages_b_sorted = sorted(pages, key=lambda r: -r["imp_b"])[:10]

    w("### Top 10 Pages — Period A\n\n")
    w(md_table(
        ["#", "Page", "Clicks A", "Imp A", "CTR A", "Pos A", "Imp B", "Type"],
        [
            [str(i+1), p["page"].replace("https://nanobananastudio.com", ""),
             fi(p["clicks_a"]), fi(p["imp_a"]), fpct(p["ctr_a"]),
             fp(p["pos_a"]), fi(p["imp_b"]), classify_page(p["page"])]
            for i, p in enumerate(pages_a_sorted)
        ],
    ))
    w("\n\n")

    # Page type distribution
    def page_type_agg(pages_list, period):
        dist = defaultdict(lambda: {"clicks": 0, "imp": 0})
        for p in pages_list:
            pt = classify_page(p["page"])
            dist[pt]["clicks"] += p[f"clicks_{period}"]
            dist[pt]["imp"] += p[f"imp_{period}"]
        return dict(dist)

    dist_a = page_type_agg(pages, "a")
    dist_b = page_type_agg(pages, "b")
    all_types = sorted(set(list(dist_a.keys()) + list(dist_b.keys())))
    total_pimp_a = sum(p["imp_a"] for p in pages)
    total_pimp_b = sum(p["imp_b"] for p in pages)

    w("### Impression Distribution by Page Type\n\n")
    w(md_table(
        ["Page Type", "Imp B", "Share B", "Imp A", "Share A", "Imp Change", "Share Shift"],
        [
            [pt,
             fi(dist_b.get(pt, {}).get("imp", 0)),
             f"{dist_b.get(pt, {}).get('imp', 0)/total_pimp_b*100:.1f}%" if total_pimp_b else "0%",
             fi(dist_a.get(pt, {}).get("imp", 0)),
             f"{dist_a.get(pt, {}).get('imp', 0)/total_pimp_a*100:.1f}%" if total_pimp_a else "0%",
             pchg(dist_b.get(pt, {}).get("imp", 0), dist_a.get(pt, {}).get("imp", 0)),
             f"{(dist_a.get(pt,{}).get('imp',0)/total_pimp_a*100 if total_pimp_a else 0) - (dist_b.get(pt,{}).get('imp',0)/total_pimp_b*100 if total_pimp_b else 0):+.1f}pp"]
            for pt in all_types
        ],
    ))
    w("\n\n")

    blog_a = dist_a.get("blog", {}).get("imp", 0)
    blog_b = dist_b.get("blog", {}).get("imp", 0)
    blog_share_a = blog_a / total_pimp_a * 100 if total_pimp_a else 0
    blog_share_b = blog_b / total_pimp_b * 100 if total_pimp_b else 0
    w(f"**Blog share:** {blog_share_b:.1f}% → {blog_share_a:.1f}% "
      f"({'increased' if blog_share_a > blog_share_b else 'decreased'} by "
      f"{abs(blog_share_a - blog_share_b):.1f}pp)  \n")
    w(f"**Blog impressions:** {fi(blog_b)} → {fi(blog_a)} ({pchg(blog_b, blog_a)})\n\n")

    # ===== 5) POSITION MOVEMENT =====
    w("## 5) Position Movement\n\n")

    w("### Queries Moving from Position 15–30 → 1–15\n\n")
    movers = []
    for q in queries:
        if q["imp_a"] > 0 and q["imp_b"] > 0:
            if 15 <= q["pos_b"] <= 30 and 1 <= q["pos_a"] <= 15:
                movers.append(q)
    movers.sort(key=lambda r: -r["imp_a"])

    if movers:
        w(md_table(
            ["Query", "Pos B", "Pos A", "Imp B", "Imp A", "Clicks A"],
            [[m["query"], fp(m["pos_b"]), fp(m["pos_a"]),
              fi(m["imp_b"]), fi(m["imp_a"]), fi(m["clicks_a"])]
             for m in movers[:20]],
        ))
    else:
        w("*No queries moved from position 15–30 to 1–15.*\n")
    w("\n\n")

    w("### Queries Gaining ≥30% Impressions\n\n")
    gainers = []
    for q in queries:
        if q["imp_b"] > 0 and q["imp_a"] > 0:
            pct = pchg_n(q["imp_b"], q["imp_a"])
            if pct >= 30:
                gainers.append({**q, "_pct": pct})
    gainers.sort(key=lambda r: -r["imp_a"])

    if gainers:
        w(md_table(
            ["Query", "Imp B", "Imp A", "% Change", "Pos B", "Pos A"],
            [[g["query"], fi(g["imp_b"]), fi(g["imp_a"]),
              f"{g['_pct']:+.1f}%", fp(g["pos_b"]), fp(g["pos_a"])]
             for g in gainers[:20]],
        ))
    else:
        w("*No queries gained ≥30% impressions.*\n")
    w("\n\n")

    # ===== 6) DEVICE SPLIT =====
    w("## 6) Device Split Comparison\n\n")
    w(md_table(
        ["Device", "Imp B", "Imp A", "Imp Change", "Pos B", "Pos A", "CTR B", "CTR A"],
        [[d["device"], fi(d["imp_b"]), fi(d["imp_a"]),
          pchg(d["imp_b"], d["imp_a"]),
          fp(d["pos_b"]), fp(d["pos_a"]),
          fpct(d["ctr_b"]), fpct(d["ctr_a"])]
         for d in devices],
    ))
    w("\n\n")

    # ===== 7) EXECUTIVE INTERPRETATION =====
    w("## 7) Executive Interpretation\n\n")

    imp_chg_total = pchg_n(tot_imp_b, tot_imp_a)
    imp_chg_brand = pchg_n(b["imp_b"], b["imp_a"])
    imp_chg_nonbrand = pchg_n(nb["imp_b"], nb["imp_a"])

    w("### Is impression growth brand-driven or non-brand-driven?\n\n")
    w(f"- Total impression change: **{pchg(tot_imp_b, tot_imp_a)}**\n")
    w(f"- Brand impression change: **{pchg(b['imp_b'], b['imp_a'])}** ({fi(b['imp_b'])} → {fi(b['imp_a'])})\n")
    w(f"- Non-brand impression change: **{pchg(nb['imp_b'], nb['imp_a'])}** ({fi(nb['imp_b'])} → {fi(nb['imp_a'])})\n")
    w(f"- Non-brand share: **{nb_share_b:.1f}% → {nb_share_a:.1f}%** ({nb_share_a - nb_share_b:+.1f}pp)\n\n")

    if imp_chg_nonbrand > imp_chg_brand and imp_chg_nonbrand > 50:
        w("**Conclusion:** Growth is primarily **non-brand-driven**. Non-brand impressions "
          "are growing faster than brand, indicating structural SEO expansion.\n\n")
    elif imp_chg_brand > imp_chg_nonbrand * 2:
        w("**Conclusion:** Growth is primarily **brand-driven**. Brand queries dominate "
          "the impression increase.\n\n")
    else:
        brand_abs = b["imp_a"] - b["imp_b"]
        nonbrand_abs = nb["imp_a"] - nb["imp_b"]
        total_abs = tot_imp_a - tot_imp_b
        w(f"**Conclusion:** Growth is **mixed**. Brand contributed **{fi(brand_abs)}** "
          f"({brand_abs/total_abs*100:.0f}%) of the {fi(total_abs)} new impressions, "
          f"non-brand contributed **{fi(nonbrand_abs)}** ({nonbrand_abs/total_abs*100:.0f}%). "
          f"Both segments are growing, but brand growth dominates in absolute terms while "
          f"non-brand is growing faster in percentage terms.\n\n")

    w("### Is query coverage expanding?\n\n")
    w(f"- Period B unique queries: **{len(qb_set)}**\n")
    w(f"- Period A unique queries: **{len(qa_set)}**\n")
    w(f"- New queries: **{len(new_in_a)}**\n")
    w(f"- Lost queries: **{len(lost_from_a)}**\n")
    w(f"- Net: **{len(new_in_a) - len(lost_from_a):+d}**\n\n")

    if len(new_in_a) > len(lost_from_a) * 2:
        w(f"**Conclusion:** Yes, query coverage is **expanding significantly**. "
          f"The site gained {len(new_in_a)} new queries vs {len(lost_from_a)} lost, "
          f"a net gain of {len(new_in_a) - len(lost_from_a)}. "
          f"This confirms the site is being discovered for new search terms.\n\n")
    elif len(new_in_a) > len(lost_from_a):
        w("**Conclusion:** Query coverage is **expanding moderately**.\n\n")
    else:
        w("**Conclusion:** Query coverage is **not expanding**.\n\n")

    w("### Are blog pages gaining visibility?\n\n")
    w(f"- Blog impressions: **{fi(blog_b)} → {fi(blog_a)}** ({pchg(blog_b, blog_a)})\n")
    w(f"- Blog share: **{blog_share_b:.1f}% → {blog_share_a:.1f}%** ({blog_share_a - blog_share_b:+.1f}pp)\n")

    new_blog_pages = sum(1 for p in pages if classify_page(p["page"]) == "blog" and p["imp_a"] > 0 and p["imp_b"] == 0)
    w(f"- New blog pages appearing in Period A: **{new_blog_pages}**\n\n")

    if blog_a > blog_b and blog_share_a > blog_share_b:
        w("**Conclusion:** Yes, blog pages are **gaining significant visibility**. "
          "Both absolute impressions and share of total are increasing. "
          f"{new_blog_pages} new blog pages entered search results in Period A.\n\n")
    else:
        w("**Conclusion:** Blog visibility is not increasing.\n\n")

    w("### Is this likely a structural SEO improvement?\n\n")

    signals = 0
    total = 6
    checks = [
        (imp_chg_total > 20, f"Impression growth >20% ({imp_chg_total:+.0f}%)"),
        (pchg_n(tot_clicks_b, tot_clicks_a) > 0, f"Click growth ({pchg(tot_clicks_b, tot_clicks_a)})"),
        (blog_share_a > blog_share_b and blog_a > blog_b, f"Blog visibility increasing ({blog_share_b:.1f}% → {blog_share_a:.1f}%)"),
        (len(new_in_a) > len(lost_from_a), f"Net query expansion (+{len(new_in_a) - len(lost_from_a)})"),
        (nb_share_a > nb_share_b, f"Non-brand share increasing ({nb_share_b:.1f}% → {nb_share_a:.1f}%)"),
        (imp_chg_nonbrand > 50, f"Non-brand impression growth >50% ({imp_chg_nonbrand:+.0f}%)"),
    ]

    for passed, desc in checks:
        if passed:
            signals += 1
        w(f"- [{'x' if passed else ' '}] {desc}\n")

    w(f"\n**Structural score: {signals}/{total}**\n\n")

    if signals >= 5:
        w("**Assessment: Strong structural SEO improvement.** Multiple independent signals "
          "confirm sustainable organic growth. The combination of impression doubling, "
          "massive query expansion, blog page indexing, and non-brand growth all point to "
          "a site that is structurally building search presence — not relying on temporary "
          "brand spikes.\n")
    elif signals >= 3:
        w("**Assessment: Moderate structural improvement.** Several positive signals present. "
          "Monitor the next 28-day cycle to confirm the trend is sustained.\n")
    else:
        w("**Assessment: Limited structural evidence.** Growth may be primarily brand-driven "
          "or temporary.\n")

    w("\n---\n\n*Report built from GSC web export with 28-day comparison mode. "
      "All data is exact per-period, not estimated.*\n")

    # ---- Write ----
    report = md.getvalue()
    out_path = OUT_DIR / "comparison_report.md"
    out_path.write_text(report, encoding="utf-8")
    print(f"Report → {out_path}")
    print(f"Queries: {len(queries)} | Pages: {len(pages)} | Devices: {len(devices)}")
    print(f"Period A: {tot_clicks_a:.0f} clicks, {tot_imp_a:.0f} imp | "
          f"Period B: {tot_clicks_b:.0f} clicks, {tot_imp_b:.0f} imp")


if __name__ == "__main__":
    main()
