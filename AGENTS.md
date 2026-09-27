# AGENTS.md

This repo is **GM (Garry's Model)**, built by Arav and Rithvik at the YC *Own Your Intelligence* Hackathon.

Read these two files before doing anything:

- **[IDEA.md](IDEA.md):** the idea: what GM is, why it matters, what goes into the weights, and how it works.
- **[g.md](g.md):** how we build it at this hackathon: the ordered checklist, who does what (Arav / Rithvik), the hand-offs, the contract files, and the rules.

If the two files disagree, **g.md wins**. It is the newer, verified plan.

## Rules for every agent

- Never train on Claude or GPT outputs. Training rewordings come from an open model only.
- Never let an eval case (Garry's fixtures or any `routing-eval.jsonl` intent) leak into training data.
- Never put a made-up or simulated number in the README, video or UI. Every number comes from `make bench` or `make night`.
- Never add AI co-author trailers (`Co-Authored-By`, "Generated with") to commits.
- Don't copy QM's source into this repo. Extend QM through config only.
