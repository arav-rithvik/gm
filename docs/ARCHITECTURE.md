# Architecture

```
Part 1: compile (once)                          Part 2: every night (Finegrain)
GBrain skills ─▶ data/skills.json               approved corrections (Review page)
             ─▶ data/routing.jsonl (leak-free)  Memorable verified workflows      ─▶ night/sources.py
             ─▶ train/river_sft.py ─▶ GM        Finegrain shared pages
                                                        │
                                                        ▼
                                  examples + replay ─▶ train from yesterday's GM (River)
                                                        ─▶ night/gate.py ─▶ promote or roll back
```

| Piece | File | Job |
|---|---|---|
| Skill parser | `data/parse_skills.py` | Reads GBrain's skills and rule files |
| Routing pairs | `data/routing_pairs.py` | Open teacher writes new wordings; `leak_filter.py` removes eval matches |
| Training | `train/river_sft.py` | Starts a River SFT job, saves the job ID |
| Benchmark | `bench/run_bench.py` | Scores models on Garry's held-out fixtures → `results/results.json` |
| Night loop | `night/night.py` | collect → examples → train → gate → promote → `results/night-run.json` |
| Lesson sources | `night/sources.py` | Corrections, Memorable workflows, Finegrain pages |
| Gate | `night/gate.py` | No case that passed yesterday may fail today |
| App | `arena/` | Arena, Scoreboard, Tonight, Review |
| QM skill | `qm-skills/gm-route` | QM asks GM for every task; 👎 and replies become fixes |
| Skillpack | `skillpack.json`, `skills/` | `gm-compile` and `gm-night` for GBrain |

**Memorable** records the workflows a team actually ran and verified. Each one becomes a lesson for the night loop, so GM learns from what worked, not only from what was fixed.
