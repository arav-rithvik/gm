---
name: gm-night
description: Run GM's nightly retrain. Collect approved corrections, Memorable workflows and Finegrain pages, train from yesterday's GM, and promote only if the regression gate passes.
triggers:
  - retrain gm tonight
  - run the night loop
  - teach gm what the team fixed today
---

# gm-night: GM learns your company while you sleep

1. **Collect.** Approved rows in `data/corrections.jsonl`, verified workflows from Memorable, and shared pages from Finegrain.
2. **Examples.** Turn each lesson into training pairs, plus a replay set from yesterday so nothing is forgotten.
3. **Train.** Start from yesterday's GM on River.
4. **Gate.** The new model must match or beat yesterday's on the held-out set, with no case that used to pass now failing.
5. **Promote or roll back.** Write `results/night-run.json` either way.

Run it with `make night`. Nothing trains that a person did not approve.
