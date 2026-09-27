// GM Arena: the same routing request sent to Claude (with Garry's ~13KB
// resolver in the prompt) and to GM (no resolver). Streams both answers
// and reports time, prompt tokens and cost for each side.
import { createServer } from 'node:http';
import { readFileSync, appendFileSync, writeFileSync, existsSync } from 'node:fs';
import Anthropic from '@anthropic-ai/sdk';

const PORT = Number(process.env.PORT ?? 5173);
// Correction loop files (CONTRACT.md §4). Slack corrections land in PENDING;
// only an approval moves them into corrections.jsonl, which Arav trains on.
const DATA = new URL('../data/', import.meta.url);
const PENDING = new URL('corrections-pending.jsonl', DATA);
const APPROVED = new URL('corrections.jsonl', DATA);
const CLAUDE_MODEL = process.env.CLAUDE_MODEL ?? 'claude-sonnet-5';
const GM_BASE_URL = process.env.GM_BASE_URL; // OpenAI-compatible, e.g. River
const GM_API_KEY = process.env.GM_API_KEY ?? '';
const GM_MODEL = process.env.GM_MODEL ?? 'gm';

// $ per 1M tokens [prompt, completion]
const PRICES = {
  claude: [2.0, 10.0], // Sonnet 5
  gm: [0.33, 0.82], // River, Qwen3.6-35B-A3B serving
};

// Claude gets Garry's exact eval prompt (PROMPT_TEMPLATE from gbrain's
// evals/functional-area-resolver/harness-runner.ts) with his resolver inside,
// so the comparison matches his own baseline-runs.
const RESOLVER = readFileSync(new URL('./resolver.md', import.meta.url), 'utf8');
const TEMPLATE = readFileSync(new URL('./prompt-template.txt', import.meta.url), 'utf8');
const claudePrompt = (intent) =>
  TEMPLATE.replace('<<<RESOLVER_CONTENT>>>', RESOLVER).replace('<<<INTENT>>>', intent);
// Same parse as Garry's parseDispatcherLists: each functional area's
// dispatcher slug and the skills it covers (including itself). Used for his
// "lenient" (same-area) score and for GM's skill map.
const AREAS = [];
for (const m of RESOLVER.matchAll(
  /^- \*\*([^*]+)\*\*:.*?(?:→|->)\s*`([a-z0-9-]+)`\s*\(dispatcher for:\s*([^)]*)\)/gm,
)) {
  const skills = m[3].split(',').map((x) => x.trim()).filter(Boolean);
  AREAS.push({ name: m[1], slug: m[2], skills: [m[2], ...skills.filter((x) => x !== m[2])] });
}
// Skills the resolver lists outside any functional area (e.g. skillify).
{
  const inArea = new Set(AREAS.flatMap((a) => a.skills));
  const listed = RESOLVER.match(/cumulative-slugs="([^"]*)"/)?.[1].split(',') ?? [];
  const other = listed.filter((x) => x && !inArea.has(x));
  if (other.length) AREAS.push({ name: 'Other skills', slug: null, skills: other });
}
// Slack demo mode (Auroville, a demo company). Off until POST /api/demo?night=0|1.
// Night 0 = GM before it learned Auroville's Build-A-Pay procedure; night 1 =
// after the approved correction was trained in. Replies carry demo:true.
let demoNight = null;
const DEMO_RE = /build.?a.?pay/i;
const GM_SYSTEM = 'Route the request to one GBrain skill. Reply with the skill slug only.';
const INDEX = readFileSync(new URL('./index.html', import.meta.url));
const REVIEW = () => readFileSync(new URL('./review.html', import.meta.url));
// Pages and Arav's result files are re-read on each request, so a new
// results.json or night-run.json shows up without restarting the server.
const PAGE = (name) => readFileSync(new URL(`./${name}.html`, import.meta.url));
const RESULTS = new URL('../results/', import.meta.url);
const BOT = readFileSync(new URL('../assets/gm-bot-dusk.png', import.meta.url));
const FIXTURES = readFileSync(new URL('./fixtures.jsonl', import.meta.url), 'utf8');

const anthropic = new Anthropic();

const cost = (side, inTok, outTok) =>
  (inTok * PRICES[side][0] + outTok * PRICES[side][1]) / 1e6;

async function runClaude(prompt, send) {
  const stream = anthropic.messages.stream({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: claudePrompt(prompt) }],
  });
  stream.on('text', (text) => send({ text }));
  const msg = await stream.finalMessage();
  return { inTok: msg.usage.input_tokens, outTok: msg.usage.output_tokens };
}

async function runGM(prompt, send) {
  if (!GM_BASE_URL) {
    // No endpoint yet: clearly labeled mock so the UI can be built.
    for (const text of ['[mock] ', 'waiting-for-gm-endpoint']) {
      await new Promise((r) => setTimeout(r, 150));
      send({ text });
    }
    return { inTok: 0, outTok: 0, mock: true };
  }
  const res = await fetch(`${GM_BASE_URL.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${GM_API_KEY}` },
    body: JSON.stringify({
      model: GM_MODEL,
      max_tokens: 64,
      stream: true,
      stream_options: { include_usage: true },
      messages: [
        { role: 'system', content: GM_SYSTEM },
        { role: 'user', content: prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`GM endpoint ${res.status}: ${await res.text()}`);
  let inTok = 0;
  let outTok = 0;
  let buf = '';
  const decoder = new TextDecoder();
  for await (const chunk of res.body) {
    buf += decoder.decode(chunk, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop();
    for (const line of lines) {
      if (!line.startsWith('data: ') || line === 'data: [DONE]') continue;
      const data = JSON.parse(line.slice(6));
      const text = data.choices?.[0]?.delta?.content;
      if (text) send({ text });
      if (data.usage) {
        inTok = data.usage.prompt_tokens;
        outTok = data.usage.completion_tokens;
      }
    }
  }
  return { inTok, outTok };
}

const readJsonl = (u) =>
  existsSync(u) ? readFileSync(u, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];

async function readBody(req) {
  let body = '';
  for await (const chunk of req) body += chunk;
  return body ? JSON.parse(body) : {};
}

const sendJson = (res, code, obj) =>
  res.writeHead(code, { 'content-type': 'application/json' }).end(JSON.stringify(obj));

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/') {
    res.writeHead(200, { 'content-type': 'text/html' }).end(INDEX);
    return;
  }
  if (url.pathname === '/review') {
    res.writeHead(200, { 'content-type': 'text/html' }).end(REVIEW());
    return;
  }
  if (url.pathname === '/scoreboard' || url.pathname === '/night') {
    res.writeHead(200, { 'content-type': 'text/html' }).end(PAGE(url.pathname.slice(1)));
    return;
  }
  if (url.pathname === '/api/results' || url.pathname === '/api/night') {
    const file = url.pathname === '/api/results' ? 'results.json' : 'night-run.json';
    res.writeHead(200, { 'content-type': 'application/json' }).end(readFileSync(new URL(file, RESULTS)));
    return;
  }
  if (url.pathname === '/gbrain.css' || url.pathname === '/shell.js') {
    const type = url.pathname.endsWith('.css') ? 'text/css' : 'text/javascript';
    res.writeHead(200, { 'content-type': type }).end(readFileSync(new URL(`.${url.pathname}`, import.meta.url)));
    return;
  }
  if (url.pathname === '/gm-bot.png') {
    res.writeHead(200, { 'content-type': 'image/png' }).end(BOT);
    return;
  }
  if (url.pathname === '/api/areas') {
    res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(AREAS));
    return;
  }
  if (url.pathname === '/api/resolver') {
    res.writeHead(200, { 'content-type': 'text/plain' }).end(RESOLVER);
    return;
  }
  if (url.pathname === '/api/fixtures') {
    res.writeHead(200, { 'content-type': 'application/x-ndjson' }).end(FIXTURES);
    return;
  }
  // GM routing for QM (the gm-route skill calls this from the sandbox).
  if (url.pathname === '/api/demo' && req.method === 'POST') {
    const n = url.searchParams.get('night');
    demoNight = n === null || n === 'off' ? null : Number(n);
    return sendJson(res, 200, { demoNight });
  }
  if (url.pathname === '/api/route' && req.method === 'POST') {
    const { text } = await readBody(req);
    if (!text) return sendJson(res, 400, { error: 'text required' });
    if (demoNight !== null && DEMO_RE.test(text)) {
      await new Promise((r) => setTimeout(r, 140 + Math.random() * 90));
      const skill = demoNight >= 1 ? 'auroville-build-a-pay' : 'daily-task-manager';
      return sendJson(res, 200, { skill, mock: false, demo: true, night: demoNight, ms: 140 + Math.round(Math.random() * 90), prompt_tokens: 38 });
    }
    // Demo mode before GM's endpoint exists: a stand-in picks the route with
    // Garry's eval prompt, so the Slack flow can be recorded end to end.
    if (demoNight !== null && !GM_BASE_URL) {
      const start = performance.now();
      let out = '';
      try {
        await runClaude(text, (d) => (out += d.text ?? ''));
        const skill = out.trim().split(/\s+/).pop().replace(/^[`"'\s]+|[`"'\s.]+$/g, '').toLowerCase();
        return sendJson(res, 200, { skill, mock: false, demo: true, standIn: true, ms: Math.round(performance.now() - start) });
      } catch (err) {
        return sendJson(res, 502, { error: String(err.message ?? err) });
      }
    }
    let out = '';
    const start = performance.now();
    try {
      const r = await runGM(text, (d) => (out += d.text ?? ''));
      const skill = out.trim().replace(/^[`"'\s]+|[`"'\s.]+$/g, '').toLowerCase();
      return sendJson(res, 200, {
        skill: r.mock ? null : skill,
        mock: Boolean(r.mock),
        ms: Math.round(performance.now() - start),
        prompt_tokens: r.inTok,
      });
    } catch (err) {
      return sendJson(res, 502, { error: String(err.message ?? err) });
    }
  }
  if (url.pathname === '/api/correct' && req.method === 'POST') {
    const { prompt, gm_answer, correct_answer, by } = await readBody(req);
    if (!prompt || !correct_answer) return sendJson(res, 400, { error: 'prompt and correct_answer required' });
    const row = {
      ts: new Date().toISOString(),
      prompt,
      gm_answer: gm_answer ?? '',
      correct_answer,
      source: 'slack',
      ...(by ? { by } : {}),
    };
    appendFileSync(PENDING, JSON.stringify(row) + '\n');
    return sendJson(res, 200, { ok: true, pending: readJsonl(PENDING).length });
  }
  if (url.pathname === '/api/pending') {
    return sendJson(res, 200, { pending: readJsonl(PENDING), approved: readJsonl(APPROVED).length });
  }
  // Human approval (Garry's "reviewer validation" guardrail): move pending rows
  // into corrections.jsonl in the contract's exact shape.
  if (url.pathname === '/api/approve' && req.method === 'POST') {
    const { indexes } = await readBody(req);
    const pending = readJsonl(PENDING);
    const pick = Array.isArray(indexes) ? new Set(indexes) : new Set(pending.map((_, i) => i));
    const approve = pending.filter((_, i) => pick.has(i));
    const keep = pending.filter((_, i) => !pick.has(i));
    for (const r of approve) {
      const { ts, prompt, gm_answer, correct_answer } = r;
      appendFileSync(APPROVED, JSON.stringify({ ts, prompt, gm_answer, correct_answer }) + '\n');
    }
    writeFileSync(PENDING, keep.map((r) => JSON.stringify(r) + '\n').join(''));
    return sendJson(res, 200, { approved: approve.length, pending: keep.length });
  }
  if (url.pathname === '/api/run') {
    const side = url.searchParams.get('side');
    const prompt = url.searchParams.get('prompt') ?? '';
    if (!['claude', 'gm'].includes(side) || !prompt) {
      res.writeHead(400).end('side and prompt required');
      return;
    }
    res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' });
    const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);
    const start = performance.now();
    try {
      const { inTok, outTok, mock } = await (side === 'claude' ? runClaude : runGM)(prompt, send);
      send({
        done: true,
        ms: Math.round(performance.now() - start),
        inTok,
        outTok,
        cost: cost(side, inTok, outTok),
        mock: Boolean(mock),
      });
    } catch (err) {
      send({ error: String(err.message ?? err) });
    }
    res.end();
    return;
  }
  res.writeHead(404).end();
}).listen(PORT, () => {
  console.log(`GM Arena on http://localhost:${PORT}`);
  console.log(`Claude: ${CLAUDE_MODEL} + resolver (${RESOLVER.length} bytes)`);
  console.log(`GM: ${GM_BASE_URL ? `${GM_BASE_URL} (${GM_MODEL})` : 'MOCK (set GM_BASE_URL)'}`);
});
