# GM

**Your team's AI learns from its mistakes while you sleep, and you own it.**

> "GBrain gets better the more it's used. Every correction your team makes becomes training data, and GM improves overnight."

GM is an open-weight model trained on [GBrain](https://github.com/garrytan/gbrain)'s skills, named for the brain it learned from. It runs inside [QM](https://github.com/yc-software/qm), trains on River, and learns your company every night with [Finegrain](https://github.com/edreisMD/finegrain).

---

## The idea in 30 seconds

**Today:** every time you ask GBrain to do something, the AI first rereads a long rulebook, Garry's routing file. That is **4,000 to 11,000 tokens on every single request** (measured in Garry's own eval runs, below). It's like a new hire who rereads the whole handbook before answering any question. And when you fix a mistake, the fix lives in a prompt, not in the AI.

**GM:** we teach the rulebook to an open model once, so the rules live inside the model. It answers from memory, with a prompt of just one line plus your request.

**Every night:** when someone on your team fixes a mistake, a person approves the fix, GM practices it overnight, and tomorrow it gets it right. Nobody rewrites a prompt.

**You own it:** the model weights, the training data and every lesson your team taught it. Switch providers and your AI keeps everything it learned.

---

## See it in Slack (the 60-second story)

1. **Ask.** In Slack: *"Run this week's Build-A-Pay."* GM picks a skill in about 200 ms, and QM shows its pick on the first line: `GM → daily-task-manager`. That's the wrong skill.
2. **Fix it.** A teammate reacts 👎 or replies *"No, that's our Build-A-Pay procedure."* QM logs the fix.
3. **Approve.** A person clicks **Approve** on the Review page. **Nothing trains GM without a human OK.**
4. **Tonight.** GM trains on the approved fix on River. A test gate checks that it didn't get worse at anything else. If it did, yesterday's GM stays live.
5. **Tomorrow.** Same ask, new thread: `GM → auroville-build-a-pay`. Right the first time.

> **Demo honesty:** Auroville is a made-up company for the demo. In demo mode (`POST /api/demo?night=0|1`), the two Build-A-Pay routes are scripted so the story plays in Slack. Until GM's River endpoint is connected, demo mode also routes every other request with a stand-in (Claude with Garry's eval prompt), marked `standIn: true` in the response. With an endpoint set, every other request goes to GM. Real measured numbers are in [Results](#results) and `results/`.

---

## How it works

```
  Slack (QM)                     GM service                  River
 ┌──────────────┐  request   ┌───────────────┐          ┌──────────────┐
 │ "Run Build-  │──────────▶ │ GM picks the  │◀─weights─│ nightly      │
 │  A-Pay"      │ ◀──skill── │ GBrain skill  │          │ training     │
 └──────┬───────┘            └───────────────┘          └──────▲───────┘
        │ 👎 / "no, it's X"                                    │
        ▼                                                      │
 ┌──────────────┐  Approve   ┌──────────────────────┐          │
 │ Review page  │──────────▶ │ corrections.jsonl    │──────────┘
 │ (a human)    │            │ (only approved rows) │  test gate → promote
 └──────────────┘            └──────────────────────┘
```

**Two parts:**

1. **Part 1, GM learns how to use a brain.** We train Garry's GBrain skills (routing, filing, page format, citations) into an open model. It's the same for every company.
2. **Part 2, GM learns your company every night.** Finegrain sends each person's approved notes and fixes into the company GBrain. Every night the model trains on them, starting from GM, and goes live only if it passes the gate.

**Facts stay in the brain.** GM learns *how* your company works, not *who* is who. A fact baked into weights can't be deleted or permission-checked, so GM looks facts up.

---

## Results

Garry's own resolver eval (`gbrain/evals/functional-area-resolver`), exact-skill match:

| Model | Held-out | 60 training cases | Rulebook tokens per request |
|---|---|---|---|
| Claude Opus 4.7 (Garry's run) | 13/15 | 38/60 | 6,004 |
| Claude Sonnet 4.6 (Garry's run) | 15/15 | 36/60 | 4,089 |
| Claude Haiku 4.5 (Garry's run) | 15/15 | 32/60 | 4,089 |
| Claude Sonnet 5 (our run, 25 cases) | 4/5 | 11/20 | 6,006 median |
| **GM** | *training now: `results/results.json`* | | one line + the request |

Our Sonnet 5 run is in [`results/claude-sonnet-5-baseline.json`](results/claude-sonnet-5-baseline.json). Median 1.55 s per request, $0.31 for all 25 cases.

---

## Run it

Needs Python 3.11+, [uv](https://docs.astral.sh/uv/), Node 24 and git.

```sh
make setup   # clone GBrain at a pinned commit, install Python deps
make data    # build data/skills.json from GBrain's skills and rule files
make test    # run the unit tests
```

**The GM app** (Arena, Scoreboard, Tonight, Review):

```sh
cd arena && npm install && npm start   # http://localhost:5173
```

Put keys in `arena/.env` (never committed): `ANTHROPIC_API_KEY` for the Claude side, plus `GM_BASE_URL`, `GM_MODEL`, `GM_API_KEY` for GM (any OpenAI-compatible endpoint, such as River). Without a GM endpoint, the GM side is clearly labeled as a mock.

**Inside QM (Slack):** set `PLUGIN_SKILLS_DIRS=/path/to/gm/qm-skills` in QM's `.env` and start QM. The `gm-route` skill asks GM for every task and turns 👎 and replies into fixes waiting for review.

**The full pipeline:**

```sh
make routing   # new wordings per skill from an open teacher; eval leaks removed and counted
make train     # start GM's River SFT job
make bench     # score Claude, the base model and GM on Garry's held-out set
make night     # tonight's retrain: collect → examples → train → gate → promote
```

| Page | What it shows |
|---|---|
| `/` Arena | The same request to Claude (with the 13 KB rulebook) and to GM (with none), side by side |
| `/scoreboard` | Accuracy, speed, cost and rulebook tokens per model, next to Garry's own runs |
| `/night` Tonight | The nightly retrain: collect → examples → train → gate → promote, and yesterday's GM vs today's |
| `/review` | Fixes from Slack waiting for a human to approve |

---

## Where the lessons come from

| Source | What GM learns from it |
|---|---|
| **Review page** | Fixes a teammate made in Slack and a person approved |
| **Memorable** | Workflows the team actually ran and verified, so GM learns what worked, not only what was fixed |
| **Finegrain** | Pages each person marked as shared in the company GBrain |

## What's in the repo

| Folder | What's inside |
|---|---|
| `arena/` | The GM app: Arena, Scoreboard, Tonight, Review |
| `qm-skills/gm-route` | The QM skill that asks GM for every task |
| `skills/` + `skillpack.json` | GBrain skillpack: `gm-compile` and `gm-night` |
| `data/` | Skill parser, routing pairs, leak filter, approved corrections |
| `train/` | River SFT job |
| `bench/` | Benchmark on Garry's eval |
| `night/` | Nightly loop, lesson sources, regression gate |
| `evals/` | Routing evals for the skillpack |
| `tests/` | Unit tests (`make test`) |
| `results/` | Scores and the latest night run |
| `docs/` | [Architecture](docs/ARCHITECTURE.md) and the [bootstrap runbook](docs/BOOTSTRAP.md) |

## Rules we follow

- **A human approves every fix** before it becomes training data.
- **No test questions in training.** Anything matching Garry's eval cases or routing evals is removed, and the count is logged.
- **No Claude outputs in training data** (Anthropic Commercial Terms §D.4). Training text comes from open models only.
- **The gate protects you.** A new model goes live only if it beats yesterday's on held-out tests with no regressions.

---

## Built with

[GBrain](https://github.com/garrytan/gbrain) · [QM](https://github.com/yc-software/qm) · River · Memorable · [Finegrain](https://github.com/edreisMD/finegrain)

Built by Arav, Rithvik and the Finegrain team at the YC *Own Your Intelligence* Hackathon, Sep 27, 2026.

MIT license (see [LICENSE](LICENSE)). `arena/resolver.md` and `arena/prompt-template.txt` come from GBrain (MIT, © Garry Tan).
