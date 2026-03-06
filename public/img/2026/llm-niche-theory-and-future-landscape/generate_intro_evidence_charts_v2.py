from __future__ import annotations

import requests
import pandas as pd
import matplotlib.pyplot as plt
import time

URL = "https://api.gdeltproject.org/api/v2/doc/doc"
START = "20250301000000"
END = "20260305235959"

DEEPSEEK_QUERY = "DeepSeek"
AGENT_COST_QUERY = '("OpenClaw" OR "AI Agent" OR "coding agent") AND (token OR "token cost" OR billing OR usage OR "context window")'


def fetch_timeline(query: str) -> pd.DataFrame:
    params = {
        "query": query,
        "mode": "TimelineVol",
        "format": "json",
        "startdatetime": START,
        "enddatetime": END,
    }
    last_exc: Exception | None = None
    for attempt in range(6):
        wait = 5 * (2 ** attempt)   # 5 10 20 40 80 160 s
        try:
            resp = requests.get(URL, params=params, timeout=60)
        except (requests.exceptions.SSLError,
                requests.exceptions.ConnectionError) as exc:
            last_exc = exc
            print(f"  [retry {attempt+1}] connection error: {exc!r} — waiting {wait}s")
            time.sleep(wait)
            continue
        if resp.status_code == 429:
            print(f"  [retry {attempt+1}] 429 — waiting {wait}s")
            time.sleep(wait)
            continue
        resp.raise_for_status()
        raw = resp.json()["timeline"][0]["data"]
        df = pd.DataFrame(raw)
        df["date"] = pd.to_datetime(df["date"], utc=True)
        df["value"] = pd.to_numeric(df["value"], errors="coerce").fillna(0.0)
        return df[["date", "value"]]
    raise RuntimeError(f"GDELT API failed after 6 retries — last error: {last_exc}")


def to_weekly(df: pd.DataFrame) -> pd.DataFrame:
    out = df.set_index("date").resample("W").mean().reset_index()
    out["value_ma"] = out["value"].rolling(3, min_periods=1).mean()
    return out


def save_deepseek_chart(df_weekly: pd.DataFrame, output: str) -> None:
    plt.figure(figsize=(10, 4.8))
    plt.plot(df_weekly["date"], df_weekly["value"], alpha=0.55, linewidth=1.5,
             color='#dea821', label="Weekly avg")   # Tuscan Sun — warm contrast to blue MA
    plt.plot(df_weekly["date"], df_weekly["value_ma"], linewidth=2.5,
             color='#5094af', label="3-week MA")   # Charcoal Blue
    plt.title("DeepSeek Discussion Trend (GDELT, last 12 months)")
    plt.xlabel("Date")
    plt.ylabel("Volume Intensity")
    plt.legend(frameon=False)
    plt.grid(alpha=0.18, color='#e8e8e8')
    plt.tight_layout()
    plt.savefig(output, dpi=180)
    plt.close()


def save_agent_cost_chart(df_weekly: pd.DataFrame, output: str) -> None:
    plt.figure(figsize=(10, 4.8))
    plt.plot(df_weekly["date"], df_weekly["value"], alpha=0.55, linewidth=1.5,
             color='#2ba193', label="Weekly avg")   # Verdigris — cool contrast to orange MA
    plt.plot(df_weekly["date"], df_weekly["value_ma"], linewidth=2.5,
             color='#ee7411', label="3-week MA")   # Sandy Brown
    plt.title("OpenClaw/Agent Token-Cost Discussion Trend (GDELT)")
    plt.xlabel("Date")
    plt.ylabel("Volume Intensity")
    plt.legend(frameon=False)
    plt.grid(alpha=0.18, color='#e8e8e8')
    plt.tight_layout()
    plt.savefig(output, dpi=180)
    plt.close()


def main() -> None:
    deepseek_df = fetch_timeline(DEEPSEEK_QUERY)
    time.sleep(30)   # give GDELT a cooling-off window between queries
    agent_df = fetch_timeline(AGENT_COST_QUERY)

    deepseek_weekly = to_weekly(deepseek_df)
    agent_weekly = to_weekly(agent_df)

    deepseek_out = "deepseek-discussion-trend-v2.png"
    agent_out = "openclaw-agent-token-discussion-trend-v2.png"

    save_deepseek_chart(deepseek_weekly, deepseek_out)
    save_agent_cost_chart(agent_weekly, agent_out)

    print(f"saved: {deepseek_out}")
    print(f"saved: {agent_out}")
    print("deepseek stats:", deepseek_df["value"].describe().to_dict())
    print("agent-cost stats:", agent_df["value"].describe().to_dict())
    print("agent-cost query:", AGENT_COST_QUERY)


if __name__ == "__main__":
    main()
