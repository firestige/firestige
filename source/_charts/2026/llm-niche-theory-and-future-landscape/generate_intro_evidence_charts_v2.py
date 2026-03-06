"""
生成引言两张趋势图的 ECharts 数据快照（JS 文件）。

输出：
  deepseek-discussion-trend.js
  openclaw-agent-token-discussion-trend.js

用法：
  python generate_intro_evidence_charts_v2.py

每次重跑都会覆盖 JS 文件（数据快照更新）。
博客直接引用 JS 文件渲染交互图，不再依赖 PNG。
"""
from __future__ import annotations

import json
import time
import requests
import pandas as pd

URL   = "https://api.gdeltproject.org/api/v2/doc/doc"
START = "20250301000000"
END   = "20260305235959"

DEEPSEEK_QUERY   = "DeepSeek"
AGENT_COST_QUERY = '("OpenClaw" OR "AI Agent" OR "coding agent") AND (token OR "token cost" OR billing OR usage OR "context window")'


# ── 数据获取 ──────────────────────────────────────────────────

def fetch_timeline(query: str) -> pd.DataFrame:
    params = {
        "query": query,
        "mode":  "TimelineVol",
        "format": "json",
        "startdatetime": START,
        "enddatetime":   END,
    }
    last_exc: Exception | None = None
    for attempt in range(6):
        wait = 5 * (2 ** attempt)
        try:
            resp = requests.get(URL, params=params, timeout=60)
        except (requests.exceptions.SSLError,
                requests.exceptions.ConnectionError) as exc:
            last_exc = exc
            print(f"  [retry {attempt+1}] connection error — waiting {wait}s")
            time.sleep(wait)
            continue
        if resp.status_code == 429:
            print(f"  [retry {attempt+1}] 429 — waiting {wait}s")
            time.sleep(wait)
            continue
        resp.raise_for_status()
        raw = resp.json()["timeline"][0]["data"]
        df  = pd.DataFrame(raw)
        df["date"]  = pd.to_datetime(df["date"], utc=True)
        df["value"] = pd.to_numeric(df["value"], errors="coerce").fillna(0.0)
        return df[["date", "value"]]
    raise RuntimeError(f"GDELT API failed after 6 retries — last: {last_exc}")


def to_weekly(df: pd.DataFrame) -> pd.DataFrame:
    out = df.set_index("date").resample("W").mean().reset_index()
    out["value_ma"] = out["value"].rolling(3, min_periods=1).mean()
    return out


# ── JS 文件生成 ────────────────────────────────────────────────

def write_echarts_js(
    path: str,
    title: str,
    weekly_df: pd.DataFrame,
    raw_color: str,
    ma_color: str,
    fetched_at: str,
) -> None:
    dates = weekly_df["date"].dt.strftime("%Y-%m-%d").tolist()
    raw   = [round(v, 4) for v in weekly_df["value"].tolist()]
    ma    = [round(v, 4) for v in weekly_df["value_ma"].tolist()]

    option = {
        "title": {
            "text":    title,
            "subtext": f"数据来源：GDELT，快照日期：{fetched_at}",
            "left":    "center",
            "textStyle":    {"fontSize": 14, "fontWeight": "bold", "color": "#1a1a2e"},
            "subtextStyle": {"fontSize": 11, "color": "#888"},
        },
        "tooltip": {
            "trigger": "axis",
            "axisPointer": {"type": "cross", "label": {"backgroundColor": "#555"}},
        },
        "legend": {
            "data":   ["Weekly avg", "3-week MA"],
            "top":    55,
            "right":  20,
            "textStyle": {"fontSize": 12},
        },
        "grid": {"left": 60, "right": 30, "top": 90, "bottom": 50},
        "xAxis": {
            "type": "category",
            "data": dates,
            "axisLabel": {"rotate": 30, "fontSize": 10, "color": "#555"},
            "axisLine":  {"lineStyle": {"color": "#ccc"}},
            "boundaryGap": False,
        },
        "yAxis": {
            "type": "value",
            "name": "Volume Intensity",
            "nameTextStyle": {"color": "#888", "fontSize": 11},
            "splitLine": {"lineStyle": {"type": "dashed", "color": "#eee"}},
            "axisLabel": {"color": "#555"},
        },
        "series": [
            {
                "name":    "Weekly avg",
                "type":    "line",
                "data":    raw,
                "smooth":  True,
                "symbol":  "none",
                "lineStyle": {"color": raw_color, "width": 1.5, "opacity": 0.6},
                "areaStyle": {"color": raw_color, "opacity": 0.08},
            },
            {
                "name":    "3-week MA",
                "type":    "line",
                "data":    ma,
                "smooth":  True,
                "symbol":  "none",
                "lineStyle": {"color": ma_color, "width": 2.5},
            },
        ],
    }

    js = f"// ECharts option — {title}\n// 数据快照：{fetched_at}（由 generate_intro_evidence_charts_v2.py 生成）\n"
    js += "(" + json.dumps(option, ensure_ascii=False, indent=2) + ")\n"

    with open(path, "w", encoding="utf-8") as f:
        f.write(js)
    print(f"  → {path}")


# ── 主流程 ────────────────────────────────────────────────────

def main() -> None:
    import os
    from datetime import datetime, timezone

    base  = os.path.dirname(os.path.abspath(__file__))
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    print("Fetching DeepSeek timeline …")
    ds_df     = fetch_timeline(DEEPSEEK_QUERY)
    ds_weekly = to_weekly(ds_df)

    print("Waiting 30s before next GDELT request …")
    time.sleep(30)

    print("Fetching Agent/OpenClaw timeline …")
    ag_df     = fetch_timeline(AGENT_COST_QUERY)
    ag_weekly = to_weekly(ag_df)

    write_echarts_js(
        path      = os.path.join(base, "deepseek-discussion-trend.js"),
        title     = "DeepSeek Discussion Trend（GDELT，过去 12 个月）",
        weekly_df = ds_weekly,
        raw_color = "#dea821",
        ma_color  = "#5094af",
        fetched_at= today,
    )

    write_echarts_js(
        path      = os.path.join(base, "openclaw-agent-token-discussion-trend.js"),
        title     = "OpenClaw/Agent Token-Cost Discussion Trend（GDELT）",
        weekly_df = ag_weekly,
        raw_color = "#2ba193",
        ma_color  = "#ee7411",
        fetched_at= today,
    )

    print("Done.")
    print(f"DeepSeek — {len(ds_weekly)} weeks, max={ds_df['value'].max():.2f}")
    print(f"Agent    — {len(ag_weekly)} weeks, max={ag_df['value'].max():.2f}")


if __name__ == "__main__":
    main()
