# Bootstrap runbook

1. `cp .env.example .env` and fill in the keys (River, teacher model, Anthropic for the Claude baseline).
2. `make setup` clones GBrain at a pinned commit and installs Python deps.
3. `make data` builds `data/skills.json`.
4. `make routing` builds `data/routing.jsonl` and prints how many eval leaks it removed.
5. `make train` starts the River job. Put the finished model name in `GM_MODEL`.
6. `make bench` writes `results/results.json`.
7. `make app` opens the GM app on http://localhost:5173.
8. In QM's `.env`, set `PLUGIN_SKILLS_DIRS=/path/to/gm/qm-skills` and start QM.
9. `make night` runs one nightly retrain. Schedule it with QM's crons or cron.
