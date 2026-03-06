from __future__ import annotations

from datetime import date, timedelta
import time
import requests
import pandas as pd
import matplotlib.pyplot as plt
from pytrends.request import TrendReq


def build_deepseek_trend(output_path: str) -> None:
    pytrends = TrendReq(hl="en-US", tz=0)
    pytrends.build_payload(["DeepSeek"], timeframe="today 12-m", geo="")
    trend = pytrends.interest_over_time().reset_index()
    if "isPartial" in trend.columns:
        trend = trend.drop(columns=["isPartial"])

    plt.figure(figsize=(10, 4.8))
    plt.plot(trend["date"], trend["DeepSeek"], linewidth=2)
    plt.title("DeepSeek Discussion Trend (Google Trends, last 12 months)")
    plt.xlabel("Date")
    plt.ylabel("Interest (0-100)")
    plt.grid(alpha=0.25)
    plt.tight_layout()
    plt.savefig(output_path, dpi=180)
    plt.close()


def month_range(month_start: date) -> tuple[date, date]:
    if month_start.month == 12:
        next_month = date(month_start.year + 1, 1, 1)
    else:
        next_month = date(month_start.year, month_start.month + 1, 1)
    return month_start, next_month - timedelta(days=1)


def past_month_starts(n_months: int = 12) -> list[date]:
    today = date.today()
    cur = date(today.year, today.month, 1)
    months: list[date] = []
    for _ in range(n_months):
        months.append(cur)
        if cur.month == 1:
            cur = date(cur.year - 1, 12, 1)
        else:
            cur = date(cur.year, cur.month - 1, 1)
    return list(reversed(months))


def github_issue_count(query: str) -> int:
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "intro-evidence-chart-script",
    }
    resp = requests.get(
        "https://api.github.com/search/issues",
        params={"q": query, "per_page": 1},
        headers=headers,
        timeout=30,
    )
    if resp.status_code != 200:
        return 0
    return int(resp.json().get("total_count", 0))


def build_openclaw_token_trend(output_path: str) -> pd.DataFrame:
    labels: list[str] = []
    counts: list[int] = []

    for month_start in past_month_starts(12):
        start, end = month_range(month_start)
        query = (
            '"OpenClaw" (token OR cost OR usage OR billing) '
            f"in:title,body created:{start.isoformat()}..{end.isoformat()}"
        )
        count = github_issue_count(query)
        labels.append(f"{month_start.year}-{month_start.month:02d}")
        counts.append(count)
        time.sleep(1.2)

    series = pd.DataFrame({"month": labels, "count": counts})

    plt.figure(figsize=(10, 4.8))
    plt.plot(series["month"], series["count"], marker="o", linewidth=2)
    plt.title("OpenClaw Token-Cost Discussion Trend (GitHub issues/posts, monthly)")
    plt.xlabel("Month")
    plt.ylabel("Discussion count")
    plt.xticks(rotation=45)
    plt.grid(alpha=0.25)
    plt.tight_layout()
    plt.savefig(output_path, dpi=180)
    plt.close()

    return series


def main() -> None:
    deepseek_chart = "deepseek-discussion-trend.png"
    openclaw_chart = "openclaw-token-discussion-trend.png"

    build_deepseek_trend(deepseek_chart)
    series = build_openclaw_token_trend(openclaw_chart)

    print(f"saved: {deepseek_chart}")
    print(f"saved: {openclaw_chart}")
    print(series.to_string(index=False))


if __name__ == "__main__":
    main()
