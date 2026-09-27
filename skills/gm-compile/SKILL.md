---
name: gm-compile
description: Compile this brain's GBrain skills into GM, an open-weight model trained on River, and report its score on Garry's resolver eval.
triggers:
  - compile my skills into a model
  - train gm
  - build my own routing model
  - make gbrain run on my own model
---

# gm-compile: turn your skills into weights

Use when the user wants their own model that already knows their GBrain skills.

1. `make data` reads every `skills/*/SKILL.md` and the rule files into `data/skills.json`.
2. `make routing` writes ~20 new wordings per skill with an open teacher model, then removes anything that matches an eval case. It prints how many it removed.
3. `make train` starts a River SFT job and saves the job ID in `results/train-job.json`.
4. `make bench` scores Claude, the base model and GM on Garry's held-out fixtures and writes `results/results.json`.

Report the held-out accuracy, the prompt tokens per request, and what the compile cost on River. Never report a number that is not in `results/`.
