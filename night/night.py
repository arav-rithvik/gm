"""GM's nightly loop: collect -> examples -> train -> gate -> promote.

Writes results/night-run.json after every step, so the Tonight page shows
the run live. Training starts from yesterday's GM, never from scratch.
"""
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "train"))
from gate import passes  # noqa: E402
from sources import collect  # noqa: E402

OUT = "results/night-run.json"
STEPS = ["collect", "examples", "train", "gate", "promote"]


def write(state: dict) -> None:
    json.dump(state, open(OUT, "w"), indent=2)


def main() -> None:
    state = {"mock": False, "night": int(os.environ.get("NIGHT", "1")),
             "steps": [{"id": s, "status": "pending", "detail": ""} for s in STEPS],
             "before_after": {"prompt": "", "before": "", "after": ""}}
    step = {s["id"]: s for s in state["steps"]}

    step["collect"]["status"] = "running"; write(state)
    lessons, counts = collect()
    step["collect"].update(status="done", detail=", ".join(f"{v} {k}" for k, v in counts.items()))

    step["examples"]["status"] = "running"; write(state)
    replay = [json.loads(l) for l in open("data/routing.jsonl")][:120] if os.path.exists("data/routing.jsonl") else []
    step["examples"].update(status="done", detail=f"{len(lessons)} new + {len(replay)} replay")

    step["train"]["status"] = "running"; write(state)
    from river_sft import main as train  # noqa: E402
    job = train(base_model=os.environ.get("GM_MODEL", "gm-v1"), extra=lessons + replay)
    step["train"].update(status="done", detail=f"River job {job}")

    step["gate"]["status"] = "running"; write(state)
    old = json.load(open("results/heldout-yesterday.json")) if os.path.exists("results/heldout-yesterday.json") else {}
    new = json.load(open("results/heldout-today.json")) if os.path.exists("results/heldout-today.json") else old
    ok, why = passes(old, new)
    step["gate"].update(status="done" if ok else "failed", detail=why)

    step["promote"].update(status="done" if ok else "rolled_back",
                           detail="new GM is live" if ok else "yesterday's GM stays live")
    if lessons:
        state["before_after"]["prompt"] = lessons[0]["prompt"]
    write(state)
    print(f"night {state['night']}: {'promoted' if ok else 'rolled back'} ({why})")


if __name__ == "__main__":
    t = time.time(); main(); print(f"{time.time() - t:.1f}s")
