# Changelog

- Make the nightly handoff idempotent, require the Part 1 adapter rank, route approved corrections through GBrain, and compare reset runs against GM.
- Add GM Nightly Loop as Part 2 with a checkpoint handoff and one-command demo.
- Add the skill parser: `make data` reads GBrain's 75 skills and 3 rule files into `data/skills.json`
- Add `make routing`: teacher rewordings of each skill's triggers, with every eval intent filtered out
- Add `make behavior`: raw notes filed into GBrain pages, kept only if they pass the page checker
