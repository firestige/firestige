import time
import requests
import pandas as pd

URL = "https://api.gdeltproject.org/api/v2/doc/doc"
QUERIES = {
    "deepseek": "DeepSeek",
    "openclaw_token": '"OpenClaw" AND (token OR cost OR billing OR usage)',
    "agent_token_cost": '("AI Agent" OR "coding agent") AND (token OR cost OR billing OR usage)',
}


def fetch(query: str):
    params = {
        "query": query,
        "mode": "TimelineVol",
        "format": "json",
        "startdatetime": "20250301000000",
        "enddatetime": "20260305235959",
    }
    resp = requests.get(URL, params=params, timeout=60)
    if resp.status_code != 200:
        return None, resp.status_code
    timeline = resp.json()["timeline"][0]["data"]
    return pd.DataFrame(timeline), 200


for name, query in QUERIES.items():
    df, code = fetch(query)
    time.sleep(5.2)
    if code != 200:
        print(f"{name}: status={code}")
        continue
    non_zero = int((df["value"] > 0).sum())
    max_value = float(df["value"].max())
    mean_value = float(df["value"].mean())
    print(f"{name}: rows={len(df)}, non_zero={non_zero}, max={max_value:.4f}, mean={mean_value:.4f}")
