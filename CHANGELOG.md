# Changelog

- Add the skill parser: `make data` reads GBrain's 75 skills and 3 rule files into `data/skills.json`
- Add the GM app: Arena, Scoreboard, Tonight and Review, in the GBrain workspace style
- Add the `gm-route` QM skill: QM asks GM for every task, and 👎 or a reply becomes a fix waiting for review
- Add routing pairs with a leak filter that removes Garry's eval cases and logs the count
- Add the River SFT job, the benchmark and the nightly loop with a regression gate
- Add Memorable workflows and Finegrain pages as nightly lesson sources
- Add the GBrain skillpack manifest with `gm-compile` and `gm-night`, routing evals, and tests
