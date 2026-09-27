"""Start a River SFT job for GM.

Merges data/routing.jsonl (and data/behavior.jsonl when present), holds out
10% for validation, and submits the job. The job ID goes to
results/train-job.json so the night loop and the README can cite it.
"""
import json
import os
import random
import urllib.request

RIVER_URL = os.environ.get("RIVER_BASE_URL", "")
RIVER_KEY = os.environ.get("RIVER_API_KEY", "")
BASE_MODEL = os.environ.get("GM_BASE_MODEL", "Qwen/Qwen3.5-9B")
SYSTEM = "Route the request to one GBrain skill. Reply with the skill slug only."


def load(path: str) -> list[dict]:
    return [json.loads(l) for l in open(path) if l.strip()] if os.path.exists(path) else []


def to_chat(ex: dict) -> dict:
    return {"messages": [
        {"role": "system", "content": SYSTEM},
        {"role": "user", "content": ex["prompt"]},
        {"role": "assistant", "content": ex["completion"]},
    ]}


def post(path: str, body: dict) -> dict:
    req = urllib.request.Request(
        f"{RIVER_URL.rstrip('/')}{path}", data=json.dumps(body).encode(),
        headers={"content-type": "application/json", "authorization": f"Bearer {RIVER_KEY}"},
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.load(r)


def main(base_model: str = BASE_MODEL, extra: list[dict] | None = None) -> str:
    data = load("data/routing.jsonl") + load("data/behavior.jsonl") + (extra or [])
    random.Random(0).shuffle(data)
    cut = max(1, len(data) // 10)
    job = post("/fine_tuning/jobs", {
        "model": base_model,
        "training_data": [to_chat(x) for x in data[cut:]],
        "validation_data": [to_chat(x) for x in data[:cut]],
    })
    os.makedirs("results", exist_ok=True)
    json.dump({"job_id": job.get("id"), "base_model": base_model, "examples": len(data)},
              open("results/train-job.json", "w"), indent=2)
    print(f"River job {job.get('id')} started on {base_model} with {len(data)} examples")
    return job.get("id", "")


if __name__ == "__main__":
    main()
