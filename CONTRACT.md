# The contract

Four files connect the ML side (Arav) and the product side (Rithvik).
Each file has one writer. The other person only reads it.

| # | File | Writer → Reader | What it is |
|---|---|---|---|
| 1 | `.env` (shape in `.env.example`) | Arav → Rithvik | Where GM lives: an OpenAI-compatible endpoint |
| 2 | `results/results.json` | Arav → Rithvik | Benchmark scores for the Scoreboard |
| 3 | `results/night-run.json` | Arav → Rithvik | Status of one nightly retrain, for the Night view |
| 4 | `data/corrections.jsonl` | Rithvik → Arav | Fixes users make with the "correct this" button |

## `"mock": true`

The committed `results.json` and `night-run.json` are mock data with zeros.
Real runs write `"mock": false`.
**The UI must show a big "MOCK DATA" label when `mock` is true**, so no mock number ends up in a screenshot or the video.

## 1. GM endpoint

```
GM_BASE_URL=https://...   # from River
GM_MODEL=gm-v1
GM_API_KEY=               # real value only in .env
```

Call it like any OpenAI chat endpoint: `POST {GM_BASE_URL}/chat/completions` with `model = GM_MODEL`.
Until GM is trained, these point at the untrained base model (hand-off at `0:50`).

## 2. `results/results.json`

- `tasks`: the task ids used as keys in `scores`.
- `models[]`: one entry per model. Names: `Claude`, `GPT`, `Base`, `GM`.
  - `prompt_tokens`: measured tokens of resolver/skill text in the prompt. GM gets none.
  - `scores[task]`: `accuracy` (0–1), `p50_latency_ms` (median), `cost_per_task_usd`.
- `garry_baselines`: Garry's own Opus / Sonnet / Haiku accuracy from `baseline-runs/`.

## 3. `results/night-run.json`

- `steps[]` always in this order: `collect`, `examples`, `train`, `gate`, `promote`.
- `status` is one of: `pending`, `running`, `done`, `failed`, `rolled_back`.
- `detail`: one short line of text for the UI.
- `before_after`: the corrected prompt, yesterday's GM answer, today's GM answer.

## 4. `data/corrections.jsonl`

One JSON object per line. Append only. Never rewrite old lines.

```json
{ "ts": "2026-09-27T15:50:00Z", "prompt": "", "gm_answer": "", "correct_answer": "" }
```

The committed file is empty on purpose: every line in it is treated as a real correction and becomes training data.
