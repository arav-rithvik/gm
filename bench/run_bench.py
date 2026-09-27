"""Score each model on Garry's resolver eval and write results/results.json.

Accuracy is exact-skill match, the same as Garry's harness. Prompt tokens are
the measured prompt size per request. Models without a key are skipped and
left at zero, and the file stays marked mock until GM itself is scored.
"""
import json
import os
import statistics
import time
import urllib.request

FIXTURES = os.environ.get("FIXTURES", "arena/fixtures.jsonl")
PRICES = {"Claude": (2.0, 10.0), "Base": (0.33, 0.82), "GM": (0.33, 0.82)}  # $ per 1M tokens


def openai_route(base: str, key: str, model: str, system: str, intent: str) -> tuple[str, int, int]:
    req = urllib.request.Request(
        f"{base.rstrip('/')}/chat/completions",
        data=json.dumps({"model": model, "max_tokens": 64, "messages": [
            {"role": "system", "content": system}, {"role": "user", "content": intent}]}).encode(),
        headers={"content-type": "application/json", "authorization": f"Bearer {key}"},
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        body = json.load(r)
    u = body.get("usage", {})
    return body["choices"][0]["message"]["content"].strip(), u.get("prompt_tokens", 0), u.get("completion_tokens", 0)


def score(name: str, route) -> dict:
    rows = [json.loads(l) for l in open(FIXTURES) if l.strip()]
    held = [r for r in rows if r.get("split") == "held_out"] or rows
    ok, ms, cost, ptok = 0, [], [], []
    for r in held:
        t = time.time()
        got, pin, pout = route(r["intent"])
        ms.append((time.time() - t) * 1000)
        ok += got.strip("`'\" .").lower() == r["expected_skill"]
        ptok.append(pin)
        cost.append((pin * PRICES[name][0] + pout * PRICES[name][1]) / 1e6)
    return {"name": name, "prompt_tokens": int(statistics.median(ptok)), "scores": {"resolver-heldout": {
        "accuracy": ok / len(held), "p50_latency_ms": int(statistics.median(ms)),
        "cost_per_task_usd": statistics.mean(cost)}}}


def main() -> None:
    out = json.load(open("results/results.json"))
    system = "Route the request to one GBrain skill. Reply with the skill slug only."
    models = []
    for name, base, key, model in [
        ("Base", os.environ.get("BASE_BASE_URL"), os.environ.get("RIVER_API_KEY", ""), os.environ.get("GM_BASE_MODEL")),
        ("GM", os.environ.get("GM_BASE_URL"), os.environ.get("GM_API_KEY", ""), os.environ.get("GM_MODEL")),
    ]:
        if base and model:
            models.append(score(name, lambda i, b=base, k=key, m=model: openai_route(b, k, m, system, i)))
    for m in models:
        out["models"] = [m if x["name"] == m["name"] else x for x in out["models"]]
    out["mock"] = not any(m["name"] == "GM" for m in models)
    out["generated_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    json.dump(out, open("results/results.json", "w"), indent=2)
    print(f"scored: {[m['name'] for m in models] or 'none (no endpoints set)'}")


if __name__ == "__main__":
    main()
