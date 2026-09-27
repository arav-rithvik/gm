# GM

**"GBrain gets better the more it's used. Every correction your team makes becomes training data, and GM improves overnight."**

GM is an open-weight model compiled from [GBrain](https://github.com/garrytan/gbrain)'s skills, named for the brain it was compiled from. It has two parts: Part 1 teaches the model how to use a brain; **GM Nightly Loop** teaches it how your company works.

Facts stay in Gbrain. GM's weights hold skills, company procedures, and the judgment to look facts up instead of guessing.

## GM vs. the base model vs. Claude

**Task:** read a request and pick the right GBrain skill. **Test:** 283 held-out intents from GBrain's own `routing-eval.jsonl` files, none of them in training.

| Model | What is in the prompt | Prompt tokens | Accuracy |
|---|---|---:|---:|
| Base `Qwen3.5-9B` | a one-line instruction | 45 | **1.8%** |
| Base `Qwen3.5-9B` + GBrain | all of `RESOLVER.md` | 5,109 | **88.0%** |
| **GM v1** (GBrain in the weights) | **the same one-line instruction** | **45** | **84.5%** |
| Claude + GBrain | GBrain's resolver | — | not run on this test¹ |

**GM matches 96% of the base model's accuracy with GBrain's rules, from a prompt 113× smaller.**

¹ We had no Claude key at the hackathon. Garry's own receipts on his 5-case held-out set (`evals/functional-area-resolver`) put Claude Opus at 86.7% and Sonnet and Haiku at 100%. That is a different, smaller test. On it, GM scores 40% and the base model with GBrain scores 60%, the most any model can score with GBrain's 75 skills.

## Part 1 results

GM v1 is `Qwen/Qwen3.5-9B` with a rank-16 LoRA, trained on River for 118 steps (2 epochs, 1,872 routing pairs, 591 s). The task: read a request and name the one GBrain skill that should handle it. The test is 283 held-out intents from GBrain's own `skills/*/routing-eval.jsonl` files. None of them are in the training data (leak check: 0 of 2,079 pairs).

Training took the same model from 1.8% to 84.5% on the table at the top.

Notes:
- Every model answers directly (thinking off). The base runs on OpenRouter and GM on River's checkpoint sampler, so their latencies are not comparable and are left out here. `results/results.json` has the raw values.
- Garry's own 5-case held-out set (`evals/functional-area-resolver`) has 2 answers that are not among GBrain's 75 skills, so no model here can score above 60% on it. GM scores 40%, and the base model with the rules scores 60%. For reference, Garry's receipts put Opus at 86.7% and Sonnet and Haiku at 100% on that set.
- Reproduce: `make train` trains GM and writes `train/gm-checkpoint.json`; `make bench` scores every model and writes `results/results.json` and `results/bench-cases.jsonl` (one line per answer).

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
make train        # train GM on River, write train/gm-checkpoint.json (needs RIVER_API_KEY)
make bench        # score Base, Base + resolver and GM on the held-out routing tests
make part2-demo   # generate SFT, RL and held-out data without credentials
make part2-test   # run the GM Nightly Loop tests
make night        # real River run from GM_CHECKPOINT
```

For a real night, copy `.env.example` to `.env`, keep secrets out of Git, and export `RIVER_API_KEY`, `GM_BASE_MODEL`, `GM_CHECKPOINT`, and `GM_LORA_RANK` from Part 1. See [CONTRACT.md](CONTRACT.md) for the exact handoff and [GM Nightly Loop](night/gm-nightly-loop/README.md) for employee and company installation.
