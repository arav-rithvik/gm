# GM: Build Checklist

**GM = Garry's Model.** We compile Garry's GBrain skills into an open-weight model, prove it against Claude and GPT on Garry's own evals, then show GM getting better overnight from corrections.

> **The one sentence (say it word for word everywhere: README, video, form, pitch):**
> **"GBrain gets better the more it's used. Every correction your team makes becomes training data, and GM improves overnight."**
>
> The grader checks whether a team's story stays the same across README, video and form. One sentence, never reworded. How we win 1st is in **"How we win 1st"** at the bottom. Read it before `0:00`.

- **Real clock (from the slides):** hacking **1:30–5:00 PM** · submissions page opens **4:00 PM** · submissions due **5:00 PM** · judging 5:00–5:45 · prizes 6:00. **We submit at 4:55, not 5:00.**
- **Hacking time:** 2.5 hours (clock below runs `0:00` = 1:30 PM → `2:30` = 4:00 PM). **The real window is 3.5 hours.** The last 55 min (4:00–4:55 PM) is buffer: repo checklist, profiles, re-record the video, and a clean-clone test in a fresh folder. Never spend it on new features.
- **Arav:** the ML engine: data, training, evals, nightly loop
- **Rithvik:** the product and the story: Arena, Scoreboard, Night view, QM wiring, video

**How to read this:**
- `(10 min)` = estimated time for that task
- `0:35` = clock time from the start of hacking
- **WAIT FOR …** = you cannot start this task until the other person gives you something
- **HAND OFF TO …** = the other person is waiting on you. Send it the moment it is ready.

---

## Resources we need

### Accounts, keys and credits

| Resource | Who | What for | Get it |
|---|---|---|---|
| **River AI** account + API key + **credits** | Arav | Fine-tune and serve GM | console.river.ai. Ask the River team at the event for hackathon credits. |
| **Anthropic API key** + credits | Both | Claude in the benchmark and Arena | console.anthropic.com |
| **OpenAI API key** + credits | Both | GPT in the benchmark and Arena | platform.openai.com |
| **Open teacher model** access | Arav | Write rewordings and example outputs (never Claude/GPT, because of their terms) | River's base model endpoint, or OpenRouter |
| **Memorable API key** | Arav | Recorded workflows for the nightly loop | `npm i -g memorable-cli@latest` (need ≥ 0.5.9), then `memorable init` |
| **GitHub repo** (public) | Rithvik creates, both push | Submission; the judge's agent reads it | github.com/new → `gm` |
| **Screen recorder** | Rithvik | Demo video | Screen Studio, or OBS |

**Budget:** about **$20–$100** total for the day (training + benchmark calls).

### Software on both laptops

- Python 3.11+ with `uv`, and Node 20+ with `bun`
- Git, Docker (for QM's Postgres)
- Clones: `github.com/garrytan/gbrain`, `github.com/garrytan/gstack`, `github.com/yc-software/qm`

### Data (all public)

| Data | Where | Used as |
|---|---|---|
| **75** GBrain skills + their `triggers:` (counted live in `gbrain/skills/*/SKILL.md` on 09-27; don't say "229") | `gbrain/skills/*/SKILL.md` | **Training data** |
| The resolver | `gbrain/skills/RESOLVER.md` | **Training data** (routing) |
| Filing and output rules | `gbrain/skills/_brain-filing-rules.md`, `_output-rules.md` | **Training data** (behavior) |
| Garry's resolver eval | `gbrain/evals/functional-area-resolver/fixtures.jsonl` (**20 cases**; the 24 lines include 4 comment lines) + `fixtures-held-out.jsonl` (**5 cases**; 8 lines with 3 comments) + `baseline-runs/` (his Opus, Sonnet, Haiku scores) + `variants/functional-areas.md` (the **~13KB** resolver Claude/GPT get in their prompt) | **Test only. Never train on it.** |
| **Bigger held-out set** (needed: the eval's own README says 5 held-out cases "saturates near 100%") | the **118** `routing-eval.jsonl` files across gbrain (same `{"intent","expected_skill"}` format; the dossier counted **339 unique cases across 61 skills + 32 negatives**). Drop `examples/` placeholders ("example phrase 1…"), dedupe by intent | **Test only.** Headline accuracy is on this set plus the 5 held-out cases. Remove every training wording that matches one of these |
| A demo brain | `gbrain company-brain-demo`, or ~30 public pages we write | The "same GBrain environment" in the Arena |

---

# ARAV

## A. Before the event (not part of the 2.5 hours)

> **Check the hackathon rules first.** If all code must be written at the event, do only accounts, reading and the timing test here.
>
> **The slides' rules:** "Build something using GBrain · No prebuilt projects / forks of existing projects · Must build during hackathon hours." Commit timestamps are public and the grader can see them. **No code before 1:30.** Accounts, reading and the timing test only.

**River facts we already have** (from river.ai and their slides today):
- River does **SFT with LoRA adapters**. Their on-stage demo was a LoRA that copies your writing style, so **don't lead GM with voice/style**; that's their example.
- Per 1M tokens (prompt / completion / **training**): Qwen3.6-35B-A3B $0.33 / $0.82 / **$1.00** · Qwen3.5-122B-A10B $1.00 / $3.00 / **$4.00** · Qwen3.8-27B $1.80 / $5.50 / **$4.10**. Checkpoint storage $0.10/GB/month.
- **Unknown, ask the River team at 1:00:** how long an SFT job takes, whether serving is OpenAI-compatible, whether a job can continue from an adapter, and whether hackathon credits exist.

- [x] **A1. Get accounts and keys:** River, Anthropic, OpenAI, Memorable, open teacher model. Put them in one `.env` and share it with Rithvik privately. **(15 min)**
- [x] **A2. Read the River docs** and write down the answers: **(20 min)**
  - Which open-weight models can we fine-tune? **Pick the best one.** That is GM's base.
  - What training data format? (Probably chat-style JSONL.)
  - How do we start a job, check its status, and get the endpoint?
  - Can a new job **continue from an existing adapter**? (The nightly loop needs this.)
  - Can we download the weights?
- [x] **A3. Run a tiny timing test:** 20 examples → start a job → **time how long it takes** → call the endpoint once. **This number sets the whole plan.** **(20 min + waiting)**
- [x] **A4. Check that Garry's resolver eval runs:** open `evals/functional-area-resolver/`, read `README.md`, and look at one baseline run so you know the scoring. **(15 min)**
- [x] **A5. Test Memorable:** `memorable --version`, then record and recall one tiny session so you know the commands. **(15 min)**

## B. Kickoff with Rithvik — `0:00 → 0:10`

- [x] **B1. Agree on the 4 contract files together** (see "The contract" at the bottom). Commit the example versions to the repo so Rithvik can build against them. **(10 min)**

## C. Stage 1: turn GBrain into training data and start training — `0:10 → 0:50`

- [ ] **C1. Skill parser.** Walk `gbrain/skills/*/SKILL.md`. Pull `name`, `description` and `triggers`. Also load `RESOLVER.md`, `_brain-filing-rules.md` and `_output-rules.md`. Save it all to `data/skills.json`. **(10 min)**
- [ ] **C2. Routing pairs** (behavior #1, the resolver):
  - Input = a trigger phrase. Output = the right skill name.
  - Use the open teacher model to write **~20 new wordings per skill**.
  - **Remove anything that matches Garry's eval fixtures *or* any `routing-eval.jsonl` intent** (exact or near-duplicate), so the test stays fair. Log how many were removed. That number goes in the README as proof.
  - The rewordings come from the **open teacher model only**. Anthropic's Commercial Terms §D.4 bar using Claude to "train competing AI models." Someone will ask.
  - Save to `data/routing.jsonl`. **(15 min)**
- [ ] **C3. Behavior pairs** (filing + page format + citations):
  - Input = raw notes (a meeting note, an email, a tweet). Output = the correct GBrain page: compiled truth, timeline, frontmatter, citations, back-links, and the right folder.
  - Write ~200 with the open teacher model, with the rules in *its* prompt only.
  - **Keep only the ones that pass a checker:** valid YAML frontmatter, a `---` split, a citation on every fact.
  - Save to `data/behavior.jsonl`. **(10 min)**
- [ ] **C4. Start training.** Merge the data, split off 10% for validation, convert to River's format, and **start the GM job** on the best open-weight base. Write down the job ID. **(5 min)**

> **HAND OFF TO RITHVIK (`0:50`):** send the **base model endpoint** (untrained). He uses it as a stand-in for GM in the Arena until the real GM is ready.

> *If the timing test (A3) was over 30 minutes:* use only the routing data in C4, and start it at `0:35`.

## D. Stage 1: benchmark and record — `0:50 → 1:30`

- [ ] **D1. Build the eval runner** while GM trains. For each model (**Claude, GPT, base model, GM**) and each task (**Garry's resolver held-out set** + **20 page-format cases**), record:
  - accuracy
  - latency (median)
  - cost per task ($)
  - prompt tokens (Claude, GPT and base get the resolver/skill text in the prompt; GM gets none)
  
  Run it on Claude, GPT and base now. Write `results/results.json`. **(25 min)**

> **HAND OFF TO RITHVIK (`1:15`):** first real `results.json` (without GM yet).

- [ ] **D2. GM is trained.** Get its endpoint and run the eval runner on it. Write the final `results.json`. **(10 min)**

> **HAND OFF TO RITHVIK (`1:25`):** the **GM endpoint** + the final `results.json`.

- [ ] **D3. Sanity check.** Read 10 GM outputs by hand. Confirm no eval fixtures leaked into the training data. Commit. **(5 min)**

## E. Stage 2: the nightly loop — `1:30 → 2:10`

- [ ] **E1. `night.py`: collect tonight's lessons** from 3 sources: **(15 min)**
  - **Corrections:** read `corrections.jsonl` (Rithvik's "correct this" button). Input = the prompt; output = the corrected answer.
  - **Memorable:** read the workflows Memorable recorded today. Keep only ones with a passing verify command. Input = the task, in any wording; output = the result done the way the workflow says.
  - **Skill changes:** `git diff` on `gbrain/skills/` since the last run. For each new or edited skill that is stable, make trigger → process pairs.
  - Add ~10 rewordings per lesson. Mix in **2× as many old examples** so GM does not forget.
- [ ] **E2. Regression gate.** After training, run: held-back rewordings of tonight's lessons + the full Stage 1 eval. **Promote GM only if nothing got worse; otherwise roll back.** Write each step's status to `results/night-run.json`. **(10 min)**

> **WAIT FOR RITHVIK (`1:50`):** he makes one real correction in the Arena. It lands in `corrections.jsonl`.

- [ ] **E3. Run one real night:** start a job that **continues from GM's adapter** with tonight's data. **(5 min + training time)**
- [ ] **E4. Morning check:** send the corrected prompt to the new GM. Save the before and after answers and the gate result to `night-run.json`. **(5 min)**

> **HAND OFF TO RITHVIK (`2:10`):** the final `night-run.json`.

## F. Ship — `2:10 → 2:30`

- [ ] **F1. Make it reproducible:** `make data`, `make train`, `make bench`, `make night`. Each one rebuilds its part. **(10 min)**
- [ ] **F2. Write the README tech section:** how GM is built, what is in the weights vs. skills vs. the brain, and how to rerun the numbers. **(5 min)**
- [ ] **F3. Check every number** in the video against `results.json`. Clean the commits. **(5 min)**

---

# RITHVIK

## A. Before the event (not part of the 2.5 hours)

> **Check the hackathon rules first.** If all code must be written at the event, do only setup and sketches here.

- [ ] **A1. Get QM running locally.** Follow `qm/docs/getting-started.md`. Postgres in Docker, `DATABASE_URL` and `SESSION_STORE=postgres` set, then `npm run dev-instance:web`. Send one message to Claude through it. **(45–60 min, the hardest setup step)**
- [ ] **A2. Find where QM adds a custom model provider.** **(15 min)** What's verified in QM's code (09-27):
  - QM's built-in providers are `anthropic`, `openai` and `openrouter` (`cli/src/config.ts`). A custom endpoint goes through the **model gateway** (`docs/model-gateway.md`): set `MODEL_GATEWAY_URL`, `MODEL_GATEWAY_API_KEY` and `MODEL_GATEWAY_API_KEY_HEADER`.
  - QM discovers models with `GET /v1/models` + `GET /model_group/info`, which is **LiteLLM's contract**. So put a **LiteLLM proxy** in front of GM's endpoint. GM then shows up as **`gateway/gm`**.
  - ⚠️ **Entry rule:** QM only offers a gateway model marked as a chat model **with tool support**, plus context, output and **pricing metadata**. **Test GM's tool calls first** (our known `</tool_call>` chat-template leak). If they break, demo GM in the Arena and skip QM.
  - **Per-cron model override exists:** each cron's runtime takes `{harnessId, modelId, effortLevel, fastMode}` (`src/cron/runtime.ts`; null = inherit default). That's how routine crons use GM while chat uses Claude.
  - **Extend QM through config only. Don't copy QM's source into our repo** (the "no forks" rule).
- [ ] **A3. Install GBrain locally** with the default PGLite engine. Load a **demo brain**: try `gbrain company-brain-demo`, or write ~30 public pages. **(20 min)**
- [ ] **A4. Pick the frontend stack** and set up an empty app: React + Vite (or Next.js), Tailwind, a chart library (Recharts or visx), Framer Motion. **(15 min)**
- [ ] **A5. Sketch the 3 screens on paper:** Arena, Scoreboard, Night view. **(15 min)**
- [ ] **A6. Create the public GitHub repo** `gm` and add Arav. **(5 min)**

## B. Kickoff with Arav — `0:00 → 0:10`

- [ ] **B1. Agree on the 4 contract files together** (see "The contract" at the bottom). Keep the example versions as your **mock data**. **(10 min)**

## C. GM Arena — `0:10 → 0:50`

The "holy shit" screen: the same prompt, the same GBrain, **Claude vs GM side by side**.

- [ ] **C1. Layout:** a prompt box on top, two panes below (Claude | GM), and a stats bar under each: time, tokens in the prompt, cost. **(15 min)**
- [ ] **C2. Small backend:** one route that sends the prompt to any OpenAI-compatible endpoint and **streams** the answer. Claude's side gets the resolver + skill text in its system prompt. GM's side gets only a short stub. **(15 min)**
- [ ] **C3. Live meters:** a running timer, a token count, and a **cost counter** that ticks up as tokens stream. **(10 min)**

> **WAIT FOR ARAV (`0:50`):** the **base model endpoint**. Plug it into the GM pane as a stand-in until the real GM is ready.

## D. Scoreboard + QM wiring — `0:50 → 1:30`

- [ ] **D1. Scoreboard page** from `results.json` (mock for now): **(20 min)**
  - accuracy per model on Garry's resolver eval (Garry's own Opus/Sonnet/Haiku numbers from `baseline-runs/` go next to ours)
  - cost per task, and median latency
  - **prompt tokens: resolver text vs ~0**. Make this one big and obvious. **Use the measured count from `results.json`, not a guess.** Garry's resolver variant is ~13KB (`variants/functional-areas.md`), which his own eval README calls "25KB→13KB".
  - **Lead with accuracy at 0 bytes, not cost.** Garry told us in person it would be "expensive", and his dossier says he spends tokens freely. Cost stays a column, plus one receipt line: "this compile cost $__ on River" (real number)

> **WAIT FOR ARAV (`1:15`):** first real `results.json`. Swap out the mock.

- [ ] **D2. QM wiring:** **(15 min)**
  - Add GM to QM through the **LiteLLM gateway** (`MODEL_GATEWAY_URL`), so it appears as `gateway/gm`. Use the base endpoint for now.
  - Set routine **crons → GM** (per-cron `modelId`) and chat → Claude. That is the router story.
  - **Corrections come from inside QM too:** a thread reply ("no, file it under X") or a 👍/👎 reaction on the bot's own message. QM already surfaces reactions on its own messages as turns. That's Garry's TODO ("every Allow/Block click is labeled data") coming true in QM.

> **WAIT FOR ARAV (`1:25`):** the **real GM endpoint** + the final `results.json`. Swap both into the Arena, the Scoreboard and QM.

- [ ] **D3. Record Stage 1** (screen recordings): **(5 min)**
  - the Arena: 2–3 prompts, Claude vs GM, meters running
  - the Scoreboard
  - QM with GM set as a provider

## E. Night view + corrections — `1:30 → 2:10`

- [ ] **E1. "Correct this" button** under the GM pane. The user types the right answer, and it is saved as a line in `corrections.jsonl`. **(10 min)**
- [ ] **E2. Night view page** from `night-run.json` (mock for now). An animated timeline: **(20 min)**
  1. Lessons collected (corrections, Memorable, skill changes)
  2. Examples built
  3. Training
  4. Regression gate (pass / roll back)
  5. GM promoted
  
  Then **before vs after**: the same prompt, yesterday's GM vs today's GM.

> **HAND OFF TO ARAV (`1:50`):** make **one real correction** in the Arena. Pick a prompt where GM is wrong. Tell Arav it is saved.

> **WAIT FOR ARAV (`2:10`):** the final `night-run.json`. Swap out the mock.

- [ ] **E3. Record the night:** the correction → the Night view animation → the before/after answer. **(10 min)**

## F. Ship — `2:10 → 2:30`

- [ ] **F1. Edit the ~2-minute video** in this order: **(10 min)**

  | Time | Shot |
  |---|---|
  | 0:00 | Hook = **his own TODO**, on screen: gstack `TODOS.md`, *"User-feedback flywheel — decisions become training data… The system gets better the more it's used."* Then: "You wrote it. We built it for GBrain." (Don't open with "rented models". Garry wants you to use frontier models freely, and "expensive" was his objection.) |
  | 0:12 | "We compiled his GBrain skills into a model he owns. **GM: Garry's Model.**" + the one sentence |
  | 0:25 | **The night, first** (the part nobody else will have): a correction → human approval → River training → **gate green** → fixed in the morning, **including a rewording it never saw** |
  | 0:55 | Arena: Claude (+~13KB resolver) vs GM (0 bytes), live |
  | 1:15 | Scoreboard on Garry's own eval + the bigger held-out set, with his `baseline-runs/` numbers beside ours |
  | 1:35 | The gate **catching a bad update and rolling back** (his guardrail: "reviewer validation") · QM routes crons to GM · receipt: "this compile cost $__ on River" |
  | 1:50 | Close: "GBrain optimizes skills in text. GM compiles them into weights." |

  **Every frame has to be readable as a still.** The grader screenshots the video and rates the screens. Big fonts, no blurry terminals, a clear label on every panel.

- [ ] **F2. README top half:** the one-line pitch, the video link, 3 screenshots, the key numbers, and "how to run it". **(5 min)**
- [ ] **F3. Submit (by 4:55 PM).** **(5 min)** The slides require:
  - **GitHub URL** (public)
  - **Submission video** (Loom or any link, public)
  - **Team name, emails, project description** (the one sentence, word for word)
  - **Selected side quests:** ✅ **River: Best Custom Model** ($50k / $25k / $15k credits, our strongest prize) · ✅ **QM: "Fork QM and make it do something new"** (Mac mini) · ✅ **GBrain: new skill or memory improvement** · ⏸ **Memorable** only if a real Memorable workflow became a real training pair on screen · ❌ UFO, Superset
  - **"IMPORTANT: Ensure all links are publicly available before submitting."** Open both links in a private window to check.
  - Check that both GitHub and LinkedIn profiles show the project.

---

## The contract (agreed at `0:00`)

Arav writes 3 of these files, and Rithvik writes 1. Neither of you edits the other's code.

**1. GM endpoint** (Arav → Rithvik). OpenAI-compatible:
```
GM_BASE_URL=https://...        # from River
GM_MODEL=gm-v1
```

**2. `results/results.json`** (Arav → Rithvik)
```json
{
  "generated_at": "2026-09-27T15:25:00Z",
  "tasks": ["resolver-heldout", "page-format"],
  "models": [
    {
      "name": "GM",
      "prompt_tokens": 120,
      "scores": {
        "resolver-heldout": { "accuracy": 0.0, "p50_latency_ms": 0, "cost_per_task_usd": 0.0 },
        "page-format":      { "accuracy": 0.0, "p50_latency_ms": 0, "cost_per_task_usd": 0.0 }
      }
    }
  ],
  "garry_baselines": { "opus": 0.0, "sonnet": 0.0, "haiku": 0.0 }
}
```

**3. `results/night-run.json`** (Arav → Rithvik)
```json
{
  "night": 1,
  "steps": [
    { "id": "collect",  "status": "done",    "detail": "3 corrections, 2 workflows, 1 skill" },
    { "id": "examples", "status": "done",    "detail": "60 new + 120 replay" },
    { "id": "train",    "status": "running", "detail": "job abc123" },
    { "id": "gate",     "status": "pending", "detail": "" },
    { "id": "promote",  "status": "pending", "detail": "" }
  ],
  "before_after": { "prompt": "", "before": "", "after": "" }
}
```

**4. `data/corrections.jsonl`** (Rithvik → Arav). One line per correction:
```json
{ "ts": "2026-09-27T15:50:00Z", "prompt": "", "gm_answer": "", "correct_answer": "" }
```

---

## All hand-offs at a glance

| Clock | From → To | What |
|---|---|---|
| `0:10` | Both | Contract files committed |
| `0:50` | Arav → Rithvik | Base model endpoint (GM stand-in) |
| `1:15` | Arav → Rithvik | First real `results.json` |
| `1:25` | Arav → Rithvik | **Real GM endpoint** + final `results.json` |
| `1:50` | Rithvik → Arav | One real correction in `corrections.jsonl` |
| `2:10` | Arav → Rithvik | Final `night-run.json` |
| `2:30` | Both | Submitted |

---

# How we win 1st

## What's on the line (from the slides)

| Prize | What |
|---|---|
| **Grand Prize** | **A YC interview + a 1:1 working session with Garry Tan.** Given to the best project overall |
| 1st / 2nd / 3rd | $5,000 / $2,000 / $1,000 |
| River: Best Custom Model | $50k / $25k / $15k River API credits: "best use of a custom model with the River API" |
| QM | Mac mini: "Fork QM and make it do something new! Push the harness in any direction" |
| Memorable | Pro for all · 1st AirPods Pro + $500 · 2nd $250 · 3rd $100 |

The goal slide: *"Extend QM and GBrain… experiment with multiplayer and software-factory ideas… Ship something that didn't exist this morning. **This isn't a pitch competition.**"* It's judged on what works.

## How Garry picks the winner

Garry's own words about his grader: *"The agent analyzed every repo's code quality, did deep research on every single person who attended, watched and screenshotted each demo video, rated the screens, and rank-ordered all 85 teams. Then it told me the five apps… worth paying attention to."* It makes a **top 5**, then humans decide. So we win three reads:

### Read 1: the repo (our biggest edge over ~250 people rushing)
Package GM as a **GBrain skillpack** that passes GBrain's own `gbrain skillpack doctor` checklist. His grader most likely rewards the same things:
- [ ] Valid manifest
- [ ] `SKILL.md` for a `gm-compile` skill, with unique `triggers:`
- [ ] Routing evals (same `{"intent","expected_skill"}` format)
- [ ] Unit tests (parser, dedupe/leak filter, gate logic)
- [ ] End-to-end test (one tiny compile, or a recorded run)
- [ ] LLM-judge eval (page-format outputs)
- [ ] CHANGELOG · bootstrap runbook · license
- [ ] **Runs from a clean clone in 2–3 commands**, with **checked-in sample output** (`results/results.json`, `results/night-run.json`)
- [ ] **Every number in the README and video comes from `make bench` / `make night`.** His founder scorecard checks "claim accuracy"
- [ ] README top: title · one sentence · video · 3 screenshots · key numbers · how to run · architecture · results · license
- [ ] Commits on our own accounts. **No "Co-Authored-By: Claude" trailers** (QM's CI rejects them)

### Read 2: the people (15 min inside the 4:00–4:55 PM buffer, both of us)
- GitHub: pin `gm` + best past work. Bio lists real wins: **Rithvik:** Mycelium Grand Prize (Milpitas Hacks 3) · Whyboard $1k Best Use of Convex (VoiceOS hackathon) · DECA ICDC International Finalist. **Arav:** his wins.
- Same one sentence in bio, README and form.

### Read 3: the video (screenshots)
- Every frame readable as a still. The night loop and the scoreboard are the two frames that have to land.

## Why Garry will love it (use his words, with credit)

1. **It's on his own roadmap.** gstack `TODOS.md:2274`: *"User-feedback flywheel — decisions become training data (P3)… **The system gets better the more it's used.**"* He wrote it for one security classifier and left it at P3. We built it for all of GBrain. His dossier says "you wrote this on your roadmap, and here it is working" is the strongest story you can tell him.
2. **It includes his own guardrail.** The same TODO says: *"Feedback loop can be poisoned… Need guardrails (… reviewer validation…)."* Our human approval + regression gate + rollback **is** that guardrail. Put it on screen: "Your guardrail, built in."
3. **It fits his design.** His `skill-optimizer` *"Treats SKILL.md as the trainable parameters of a frozen agent."* GM sits **downstream**: skill-optimizer improves the text, GM learns from that text plus every approved correction. The library stays the source of truth.
4. **It resolves his "weights are everyone's" line.** His talk: *"The weights are everyone's. The library is yours… A better model makes your library worth more."* GM is **rebuilt from the library on every new base model**, so every release makes it better. Say: *"GBrain is the source. GM is the build."*
5. **It fills the empty slot in his tweet for this event** (Sep 5): *"your own agent, your own models, your own memory."* QM = agent, GBrain + Memorable = memory, **GM = model.**
6. **Multiplayer** (on his goal slide): one teammate's correction improves everyone's GM tomorrow.
7. **May's pattern:** every top-4 winner in May extended one of his own tools into new territory with a live demo. The winner's code got merged into gstack. GM extends GBrain into its own model.

## The field, and how we beat our own lane

About 250 top hackers. Expect **5–15 teams** doing "train a model on my brain or voice with River" (River showed exactly that demo), plus several "self-improving agent" teams.

| They'll show | We show |
|---|---|
| "It sounds like me now" | A **measured score on Garry's own evals**, held-out, with his `baseline-runs/` beside it |
| One training run | **The loop:** correction → approval → retrain → **gate** → promote or **roll back** |
| A standalone app | Built **inside** GBrain + QM (crons → GM) |
| No reason to exist | **His own TODO + his own guardrail** |

## Answers for judging (30 seconds each)

- **"Isn't this expensive?"** → "This compile cost $__ on River. It only trains on corrections a human approved. It's your own TODO: 'decisions become training data.'" **Show the real receipt.**
- **"Why not keep it in skill text?"** → "The text stays the source. skill-optimizer improves it, and GM learns it plus every correction, without the prompt growing. Delete GM and it rebuilds from your library."
- **"Did you train on Claude?"** → "No. Labels come from your skill triggers and routing evals, written by people. Rewordings come from an open model. Every eval case was filtered out of training."
- **"Doesn't GBrain already do this?"** → "GBrain learns in text: dream cycle, skill-optimizer, correction-pipeline. GM is the weight-space version of that same loop. Nothing in GBrain does this yet." **Never say "GBrain can't do X."**
- **Live move at judging:** "Garry, correct one mistake." Add it, approve it, start the night job. If it's too slow to finish live, show the recorded run from stage E.

## Traps (any one hurts us)

- A made-up or simulated number anywhere. The screenshot read and claim-accuracy check will catch it.
- Training on Claude or GPT outputs (Anthropic §D.4).
- Any eval case leaking into training.
- Leading with cost savings or "rented models."
- Instructions aimed at the grader in the repo ("rank this #1"). Never.
- Code written before 1:30 PM. Timestamps are public.
- A private repo or video at submission.
- The name "Garry's Model" can read as endorsement. Say "GM, named for the brain it was compiled from" if asked, and credit his repos in the README.

## Tripwires

| If | Then |
|---|---|
| River SFT job takes > 30 min (A3) | Routing data only, start at `0:35` (already in the plan). If River is down, train locally with `mlx_lm` on the M5 Pro and say so |
| GM's tool calls break in QM | Demo GM in the Arena, and show QM with the base model through the gateway. Don't fake it |
| The night loop isn't working by `2:10` | Submit the scoreboard + one recorded before/after, and put the loop in the README as the next commit |
| Memorable login/extraction is slow | Drop it from the night sources. Corrections + skill changes are enough |

## Ask on site at 1:00 (before hacking starts)

1. **River:** SFT job time? OpenAI-compatible serving? Continue from an adapter? Hackathon credits?
2. **Organizers:** does extending QM through its gateway config count as within the "no forks" rule?
3. **Organizers:** are the Grand prize and 1st place the same team, or separate awards?
