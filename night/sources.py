"""Where tonight's lessons come from.

1. Corrections a person approved on the Review page (data/corrections.jsonl).
2. Verified workflows recorded by Memorable (`memorable recall`).
3. Shared pages from Finegrain's company GBrain (FINEGRAIN_EXPORT, a JSONL file).
Each source returns training pairs: {"prompt", "completion", "source"}.
"""
import json
import os
import subprocess


def corrections(path: str = "data/corrections.jsonl") -> list[dict]:
    if not os.path.exists(path):
        return []
    rows = [json.loads(l) for l in open(path) if l.strip()]
    return [{"prompt": r["prompt"], "completion": r["correct_answer"], "source": "correction"} for r in rows]


def memorable_workflows(query: str = "verified workflow") -> list[dict]:
    try:
        out = subprocess.run(["memorable", "recall", query, "--json"], capture_output=True, text=True, timeout=60)
        items = json.loads(out.stdout or "[]")
    except (FileNotFoundError, json.JSONDecodeError, subprocess.TimeoutExpired):
        return []
    return [{"prompt": i.get("task", ""), "completion": i.get("skill") or i.get("steps", ""), "source": "memorable"}
            for i in items if i.get("task")]


def finegrain_pages(path: str = os.environ.get("FINEGRAIN_EXPORT", "")) -> list[dict]:
    if not path or not os.path.exists(path):
        return []
    rows = [json.loads(l) for l in open(path) if l.strip()]
    return [{"prompt": r["question"], "completion": r["answer"], "source": "finegrain"} for r in rows if r.get("shared")]


def collect() -> tuple[list[dict], dict[str, int]]:
    parts = {"corrections": corrections(), "memorable": memorable_workflows(), "finegrain": finegrain_pages()}
    return [x for v in parts.values() for x in v], {k: len(v) for k, v in parts.items()}
