#!/usr/bin/env python3
"""
gsc_fetch.py — Google Search Console data extraction.

Fetches search analytics data via the Search Console API using a
service-account credential and writes CSV files to OUTPUT_DIR.

Configuration (env vars or .env file):
  GSC_SITE_URL                   e.g. "sc-domain:nanobananastudio.com"
  GOOGLE_APPLICATION_CREDENTIALS path to service-account JSON key
  START_DATE                     YYYY-MM-DD  (default: 90 days ago)
  END_DATE                       YYYY-MM-DD  (default: 3 days ago)
  OUTPUT_DIR                     directory for CSVs (default: ./output)
  MAX_ROWS                       per-report cap (default: 5000)
"""

from __future__ import annotations

import csv
import json
import logging
import os
import sys
import time
from datetime import date, datetime, timedelta
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
log = logging.getLogger("gsc_fetch")

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]
API_PAGE_SIZE = 25_000  # max rows per request
MAX_RETRIES = 5
RETRY_BACKOFF = 2  # seconds, doubles each retry


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _load_env_file() -> None:
    """Load .env from script dir if it exists (simple key=value parser)."""
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
                k, v = k.strip(), v.strip().strip("\"'")
                os.environ.setdefault(k, v)


def _env(key: str, default: str | None = None, required: bool = False) -> str:
    val = os.environ.get(key, default)
    if required and not val:
        log.error("Missing required env var: %s", key)
        sys.exit(1)
    return val  # type: ignore[return-value]


def _parse_date(s: str) -> date:
    return datetime.strptime(s, "%Y-%m-%d").date()


def _build_service(creds_path: str):
    """Authenticate and return a Search Console service object."""
    creds = service_account.Credentials.from_service_account_file(
        creds_path, scopes=SCOPES
    )
    creds.refresh(Request())
    service = build("searchconsole", "v1", credentials=creds, cache_discovery=False)
    return service


def _api_call_with_retry(fn, *args, **kwargs) -> Any:
    """Call *fn* with exponential back-off on transient errors."""
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
    return None  # unreachable


# ---------------------------------------------------------------------------
# Fetching
# ---------------------------------------------------------------------------
def fetch_report(
    service,
    site_url: str,
    start: str,
    end: str,
    dimensions: list[str],
    max_rows: int = 5000,
    search_type: str = "web",
    dimension_filter_groups: list[dict] | None = None,
) -> list[dict]:
    """
    Paginate through searchAnalytics.query and return all rows.

    Each row dict has keys matching *dimensions* plus
    clicks / impressions / ctr / position.
    """
    all_rows: list[dict] = []
    start_row = 0

    while True:
        body: dict[str, Any] = {
            "startDate": start,
            "endDate": end,
            "dimensions": dimensions,
            "rowLimit": min(API_PAGE_SIZE, max_rows - start_row),
            "startRow": start_row,
            "searchType": search_type,
        }
        if dimension_filter_groups:
            body["dimensionFilterGroups"] = dimension_filter_groups

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


def write_csv(rows: list[dict], path: Path) -> None:
    if not rows:
        log.warning("No rows to write for %s", path.name)
        path.write_text("")
        return
    fieldnames = list(rows[0].keys())
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)
    log.info("Wrote %d rows → %s", len(rows), path)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main() -> None:
    _load_env_file()

    creds_path = _env("GOOGLE_APPLICATION_CREDENTIALS", required=True)
    site_url = _env("GSC_SITE_URL", required=True)
    today = date.today()
    start = _env("START_DATE", (today - timedelta(days=90)).isoformat())
    end = _env("END_DATE", (today - timedelta(days=3)).isoformat())
    out_dir = Path(_env("OUTPUT_DIR", str(Path(__file__).resolve().parent / "output")))
    max_rows = int(_env("MAX_ROWS", "5000"))

    out_dir.mkdir(parents=True, exist_ok=True)
    log.info("Site: %s | Range: %s → %s | Output: %s", site_url, start, end, out_dir)

    service = _build_service(creds_path)

    # Verify access -----------------------------------------------------------
    sites = service.sites().list().execute().get("siteEntry", [])
    urls = [s["siteUrl"] for s in sites]
    if site_url not in urls:
        log.error(
            "Service account cannot access '%s'. Accessible sites: %s",
            site_url, urls,
        )
        log.error(
            "Add the service account email as a user in GSC "
            "(Settings → Users and permissions → Add user, role=Full)."
        )
        sys.exit(1)
    log.info("Access verified for %s", site_url)

    # 1) Daily time series ----------------------------------------------------
    log.info("Fetching daily time series …")
    daily = fetch_report(service, site_url, start, end, ["date"], max_rows=10_000)
    daily.sort(key=lambda r: r["date"])
    write_csv(daily, out_dir / "daily.csv")

    # 2) Queries report -------------------------------------------------------
    log.info("Fetching queries report …")
    queries = fetch_report(service, site_url, start, end, ["query"], max_rows=max_rows)
    queries.sort(key=lambda r: -r["impressions"])
    write_csv(queries, out_dir / "queries.csv")

    # 3) Pages report ---------------------------------------------------------
    log.info("Fetching pages report …")
    pages = fetch_report(service, site_url, start, end, ["page"], max_rows=max_rows)
    pages.sort(key=lambda r: -r["impressions"])
    write_csv(pages, out_dir / "pages.csv")

    # 4) Countries report -----------------------------------------------------
    log.info("Fetching countries report …")
    countries = fetch_report(service, site_url, start, end, ["country"], max_rows=300)
    countries.sort(key=lambda r: -r["clicks"])
    write_csv(countries, out_dir / "countries.csv")

    # 5) Devices report -------------------------------------------------------
    log.info("Fetching devices report …")
    devices = fetch_report(service, site_url, start, end, ["device"], max_rows=10)
    write_csv(devices, out_dir / "devices.csv")

    # 6) Query × Page matrix --------------------------------------------------
    log.info("Fetching query × page matrix …")
    qp = fetch_report(
        service, site_url, start, end, ["query", "page"], max_rows=max_rows
    )
    qp.sort(key=lambda r: -r["impressions"])
    write_csv(qp, out_dir / "query_page.csv")

    # 7) Search appearance (optional, may be empty) ---------------------------
    log.info("Fetching search appearance report …")
    try:
        sa = fetch_report(
            service, site_url, start, end, ["searchAppearance"], max_rows=100
        )
        write_csv(sa, out_dir / "search_appearance.csv")
    except HttpError as exc:
        log.warning("Search appearance not available: %s", exc)

    # Write metadata ----------------------------------------------------------
    meta = {
        "site_url": site_url,
        "start_date": start,
        "end_date": end,
        "fetched_at": datetime.utcnow().isoformat() + "Z",
        "files": [f.name for f in sorted(out_dir.glob("*.csv"))],
    }
    meta_path = out_dir / "meta.json"
    meta_path.write_text(json.dumps(meta, indent=2, ensure_ascii=False))
    log.info("Metadata → %s", meta_path)
    log.info("Done. All CSVs in %s", out_dir)


if __name__ == "__main__":
    main()
