# GM

> **“GBrain gets better the more it's used. Every correction your team makes becomes training data, and GM improves overnight.”**

GM is an open-weight model that learns in two parts:

1. **Learn how to use a brain — once.** Part 1 compiles [GBrain](https://github.com/garrytan/gbrain)'s routing, filing, formatting, and citation skills into the model.
2. **Learn how your company works — every night.** Part 2, **GM Nightly Loop**, turns approved company knowledge and corrections into training data, evaluates a candidate model, and promotes it only when it passes the gate.

```text
Garry's GBrain skills ── train once ──▶ GM
                                           │
Approved company knowledge ── every night ─┴──▶ GM + your company
```

GM keeps the boundary deliberate: **skills, procedures, calibration, and lookup judgment go into the weights; people, deals, permissions, and changing facts stay in GBrain.** Facts remain editable, permission-aware, and available at inference time instead of becoming undeletable model memory.

Built by the GM and Finegrain teams for the YC *Own Your Intelligence* hackathon.

## Try it in one command

Requirements: Python 3.12+, [uv](https://docs.astral.sh/uv/), and Git.

```bash
git clone https://github.com/arav-rithvik/gm.git
cd gm
make quickstart
```

`make quickstart` compiles the Part 1 skill dataset, runs both test suites, and builds a credential-free Part 2 dataset from fictional company pages. It does not call River or present simulated training as a live result.

Useful commands:

```bash
make data         # compile GBrain skills for Part 1
make test         # test the Part 1 contracts
make part2-demo   # build inspectable SFT, RL, and held-out fixture data
make part2-test   # test the nightly company-learning pipeline
make night        # run a real company night from the Part 1 checkpoint
```

The offline demo processes 18 fictional pages and five earlier page versions across all four task families. Its datasets are marked as demo artifacts and cannot be submitted for training.

## How the complete loop works

```text
Claude / Codex / Pi / other agents
              │
              ▼
     Mac menu-bar companion
              │ selected projects only
              ▼
      Personal GBrain on-device
              │ compiled, explicitly shared notes
              ▼
       Scoped GBrain OAuth relay
              │
              ▼
       Company GBrain server       ◀── permissions · revisions · dashboard
              │
              ▼
  River teacher + independent critic
              │
              ▼
 SFT examples · RL tasks · held-out tests
              │
              ▼
      SFT → RL → evaluate → gate
              │
              ├── pass ──▶ promote candidate
              └── fail ──▶ retain current checkpoint
```

GBrain owns company memory, access control, revisions, and the company dashboard. GM Nightly Loop owns the learning pipeline. Data generation runs on the company host; model training runs on River. Employee Macs do not need River credentials and never train a model.

### Part 1: compile GBrain skills into GM

Part 1 teaches model behavior shared by every company:

- Select the right GBrain skill.
- File a page in the right place.
- Produce the expected page structure.
- Cite sources and maintain links.

This replaces thousands of repeated instruction tokens with a short invocation while leaving live facts in the brain. The Part 1 team publishes three values for Part 2:

```bash
GM_BASE_MODEL=Qwen/Qwen3.5-9B
GM_CHECKPOINT=river://...  # the trained Part 1 checkpoint
GM_LORA_RANK=16            # must match the Part 1 adapter
```

### Part 2: learn company procedures overnight

Part 2 starts its first company run from `GM_CHECKPOINT`, not from raw Qwen. Later nights resume from the last promoted company checkpoint and replay prior approved training material. The base model and LoRA rank are checked so an incompatible adapter cannot be continued accidentally.

To run a real night:

```bash
export RIVER_API_KEY=...                 # keep this outside Git
export GM_BASE_MODEL=Qwen/Qwen3.5-9B    # must match Part 1
export GM_CHECKPOINT=river://...         # produced by Part 1
export GM_LORA_RANK=16                   # must match Part 1
make night
```

Without those values, `make night` stops before mutation and preserves the checked-in mock result. See [CONTRACT.md](CONTRACT.md) for the complete handoff.

## Corrections become approved brain pages

The Arena's **Correct this** action writes the request pattern and approved behavior to the company GBrain. It does not copy the rejected model answer into curriculum source text.

Only pages with all three approval signals enter the loop:

```yaml
visibility: brain-wide
tags: [finegrain-share]
finegrain_training: true
```

Conversation, transcript, and session pages are excluded. Removing approval withdraws the page on the next successful relay. If withdrawn material exists in a promoted model's lineage, the next candidate rebuilds from the Part 1 GM foundation—deleting a dataset row cannot unlearn an already distributed checkpoint.

## What employees share

The Mac companion reads supported Claude, Codex, Pi, and generic JSONL histories locally. It uses incremental cursors and handles incomplete lines and file rotation without modifying original session files.

The compiler is intentionally conservative:

- It selects explicit user-stated decisions and conventions.
- Tool output, images, and reasoning blocks are excluded.
- Known secrets are scrubbed before publication.
- Unknown or mixed project identity stays private.
- Empty project selection shares nothing automatically.
- Only selected project paths are eligible to leave the laptop.

The relay sends the compiled title, body, and minimal provenance. It does not send raw traces, sidecars, credentials, local paths, or the employee's private brain. GBrain OAuth and revision checks enforce scoped company writes.

## What gets trained and tested

The nightly compiler emphasizes company behavior rather than memorizing facts:

| Task | What GM learns |
|---|---|
| **Procedure** | Follow the company's approved way of doing something. |
| **Abstention** | Consult GBrain instead of inventing an answer. |
| **Staleness** | Prefer the current procedure over an earlier revision. |
| **Recall** | Recover a small amount of stable, approved knowledge with evidence. |

A River teacher proposes examples and a separate critic checks grounding, answerability, and leakage. Sources are grouped before train/eval splitting, exact and near duplicates are removed, and generated records are schema- and evidence-validated.

The run produces inspectable `memories.jsonl`, `curricula.jsonl`, `sft.jsonl`, `rl.jsonl`, `eval.jsonl`, `manifest.json`, critic reviews, rejection reasons, usage data, and an HTML report. The bounded RL environment is a two-turn GBrain snapshot lookup: request a page, receive its current snapshot, then answer with a citation or abstain. It executes no generated code.

## The promotion gate

A candidate becomes current only after evaluation. The gate checks for:

- measurable improvement on company-held-out tasks;
- no increase in confident errors;
- no unacceptable per-suite regression; and
- no unacceptable loss on the bundled general-capability smoke suite.

If the candidate fails, the current checkpoint remains live. `results/night-run.json` exposes the real collect → examples → train → gate → promote state and one genuine before/after evaluation case to the existing Night UI. Checked-in result files remain visibly marked as mock until a real provider run replaces them.

## Install for a company

The complete server, employee companion, deployment, and existing-GBrain instructions live in [GM Nightly Loop](night/gm-nightly-loop/README.md).

From the repository root, the two primary installers are:

```bash
# Company host: Docker Compose, GBrain, Postgres/pgvector, and trainer
night/gm-nightly-loop/scripts/install-server.sh

# Employee Mac: personal GBrain, scoped company profile, and menu-bar app
night/gm-nightly-loop/scripts/install-employee.sh \
  --company acme --employee-id alice \
  --company-url https://brain.acme.example \
  --credentials ~/Downloads/alice.json \
  --share-project ~/work/acme
```

The server defaults to a nightly 02:00 UTC schedule and supports `nightly`, `weekly`, `monthly`, `manual`, and `once` cadences. Deployments create private settings under the Part 2 `.gm/deployment/` directory; API keys and generated owner credentials do not belong in Git. Put any public deployment behind HTTPS.

Already have a company GBrain? Keep it. The nightly loop can use an existing host profile or a scoped thin-client profile without reinitializing the brain.

## Repository map

```text
data/                         Part 1 GBrain skill compiler
night/run.py                  Root collect → train → gate status adapter
night/gm-nightly-loop/
  apps/macos/                 Native employee menu-bar companion
  deploy/                     GBrain, Postgres, and trainer deployment
  src/gm_nightly/             Capture, relay, curriculum, River, gate, schedule
  fixtures/                   Fictional company demo corpus
  tests/                      Part 2 verification suite
results/                      Part 1 benchmark and Night UI contracts
CONTRACT.md                   Part 1 ↔ Part 2 ↔ UI handoff
```

Start with the [Part 2 README](night/gm-nightly-loop/README.md), [integration contract](night/gm-nightly-loop/docs/GM-INTEGRATION.md), [sample output](night/gm-nightly-loop/results/sample.json), and [implementation plan](night/gm-nightly-loop/docs/PLAN.md).

## Current scope

This is an initial working framework, not a claim that a live company model has already been trained. A real night requires the Part 1 checkpoint, matching adapter configuration, and River credentials.

The local extractor is intentionally narrow, secret detection is best effort, the general suite is a smoke test rather than a comprehensive benchmark, and source-built Mac apps are not notarized. Provider integrations and per-user adapters remain extension points unless they are explicitly present in the repository.

MIT license.
