# GM

**"GBrain gets better the more it's used. Every correction your team makes becomes training data, and GM improves overnight."**

GM is an open-weight model compiled from [GBrain](https://github.com/garrytan/gbrain)'s skills, named for the brain it was compiled from. It has two parts: Part 1 teaches the model how to use a brain; **GM Nightly Loop** teaches it how your company works.

Facts stay in Gbrain. GM's weights hold skills, company procedures, and the judgment to look facts up instead of guessing.

## Start in one command

Needs Python 3.12+, [uv](https://docs.astral.sh/uv/) and git.

```bash
git clone https://github.com/arav-rithvik/gm.git
cd gm
make quickstart
```

`make quickstart` builds the Part 1 skill dataset, runs both test suites, and generates the credential-free GM Nightly Loop demo. The demo uses fictional company pages and never submits them for training.

Useful commands:

```bash
make data         # compile Gbrain skills for Part 1
make pairs        # write routing + behavior training pairs (needs the teacher keys in .env)
make part2-demo   # generate SFT, RL and held-out data without credentials
make part2-test   # run the GM Nightly Loop tests
make night        # real River run from GM_CHECKPOINT
```

For a real night, copy `.env.example` to `.env`, keep secrets out of Git, and export `RIVER_API_KEY`, `GM_BASE_MODEL`, `GM_CHECKPOINT`, and `GM_LORA_RANK` from Part 1. See [CONTRACT.md](CONTRACT.md) for the exact handoff and [GM Nightly Loop](night/gm-nightly-loop/README.md) for employee and company installation.
