"""C2: routing pairs (request -> skill) for GM's first behavior.

An open teacher model (never Claude: Anthropic Commercial Terms D.4) writes
new wordings of each skill's triggers. Anything that matches Garry's eval
fixtures or a routing-eval.jsonl intent is removed, and the count is logged.
"""
import glob
import json
import os
import sys
import urllib.request

sys.path.insert(0, os.path.dirname(__file__))
from leak_filter import filter_leaks  # noqa: E402

TEACHER_URL = os.environ.get("TEACHER_BASE_URL", "")
TEACHER_MODEL = os.environ.get("TEACHER_MODEL", "Qwen/Qwen3.5-9B")
TEACHER_KEY = os.environ.get("TEACHER_API_KEY", "")
PER_SKILL = int(os.environ.get("WORDINGS_PER_SKILL", "20"))
GBRAIN_DIR = os.environ.get("GBRAIN_DIR", "vendor/gbrain")


def teacher(prompt: str) -> str:
    req = urllib.request.Request(
        f"{TEACHER_URL.rstrip('/')}/chat/completions",
        data=json.dumps({"model": TEACHER_MODEL, "messages": [{"role": "user", "content": prompt}]}).encode(),
        headers={"content-type": "application/json", "authorization": f"Bearer {TEACHER_KEY}"},
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.load(r)["choices"][0]["message"]["content"]


def eval_intents() -> list[str]:
    paths = glob.glob(f"{GBRAIN_DIR}/evals/functional-area-resolver/fixtures*.jsonl")
    paths += glob.glob(f"{GBRAIN_DIR}/**/routing-eval.jsonl", recursive=True) + ["evals/routing-eval.jsonl"]
    out = []
    for p in paths:
        for line in open(p):
            if line.strip():
                row = json.loads(line)
                out.append(row.get("intent") or row.get("prompt") or "")
    return [x for x in out if x]


def main() -> None:
    skills = json.load(open("data/skills.json"))["skills"]
    examples = []
    for s in skills:
        seed = "\n".join(s.get("triggers") or [s.get("description", "")])
        text = teacher(
            f"Write {PER_SKILL} different ways a busy person might ask for this, one per line, no numbering:\n{seed}"
        )
        for line in text.splitlines():
            if line.strip():
                examples.append({"prompt": line.strip(), "completion": s["name"]})
    kept, removed = filter_leaks(examples, eval_intents())
    with open("data/routing.jsonl", "w") as f:
        for ex in kept:
            f.write(json.dumps(ex) + "\n")
    json.dump({"generated": len(examples), "kept": len(kept), "removed_as_leaks": removed},
              open("data/routing-stats.json", "w"), indent=2)
    print(f"routing pairs: {len(kept)} kept, {removed} removed as eval leaks")


if __name__ == "__main__":
    main()
