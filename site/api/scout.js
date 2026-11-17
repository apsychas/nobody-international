// The private scout: searches for people, reads website letters, proposes
// introductions, and keeps the review queue. Everything is behind SCOUT_PASSWORD
// and stored in the same private Blob store as the letters.
import Anthropic from '@anthropic-ai/sdk';
import { put, get, list } from '@vercel/blob';
import { createHash, timingSafeEqual, randomBytes } from 'node:crypto';
import { ARCHETYPE, RUBRIC, LANES, HIGH_RISK, REGIONS, STORY_TYPES } from '../lib/brief.js';

// With ANTHROPIC_API_KEY set, calls go straight to Anthropic. Without it they go
// through Vercel AI Gateway, signed by the project's own identity token and
// billed to the Vercel account, so no separate key is needed.
let gatewayToken = '';
const direct = () => Boolean(process.env.ANTHROPIC_API_KEY);
const model = () => (direct() ? 'claude-opus-5-5' : 'anthropic/claude-opus-5.5');
const TRAITS = Object.keys(RUBRIC);
const BUDGET_MS = 240_000; // stop starting new model work after this; the function limit is 300s

// ---------- storage -----------------------------------------------------------

const hash = (s) => createHash('sha1').update(s).digest('hex').slice(0, 20);

async function readJson(pathname) {
  const r = await get(pathname, { access: 'private' });
  if (!r || r.statusCode !== 200) return null;
  return JSON.parse(await new Response(r.stream).text());
}
async function writeJson(pathname, data) {
  await put(pathname, JSON.stringify(data, null, 2), {
    access: 'private', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true,
  });
}
async function listAll(prefix) {
  const out = [];
  let cursor;
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    out.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return out;
}
async function readAll(prefix) {
  const blobs = await listAll(prefix);
  const docs = await Promise.all(blobs.map((b) => readJson(b.pathname).catch(() => null)));
  return docs.filter(Boolean);
}

// ---------- model -------------------------------------------------------------

const client = () => (direct() ? new Anthropic() : new Anthropic({ apiKey: gatewayToken, baseURL: 'https://ai-gateway.vercel.sh' }));
const textOf = (msg) => msg.content.filter((b) => b.type === 'text').map((b) => b.text).join('');

async function research(system, prompt, searches, deadline) {
  let messages = [{ role: 'user', content: prompt }];
  for (let i = 0; i < 4; i++) {
    const base = {
      model: model(), max_tokens: 16000, thinking: { type: 'adaptive' }, output_config: { effort: 'medium' }, system, messages,
    };
    const reply = direct()
      ? await client().beta.messages.stream({
          ...base, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',
          tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: searches }],
        }).finalMessage()
      : await client().messages.stream({
          ...base, tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: searches }],
        }).finalMessage();
    if (reply.stop_reason === 'refusal') return '';
    if (reply.stop_reason !== 'pause_turn' || Date.now() > deadline) return textOf(reply);
    messages = [messages[0], { role: 'assistant', content: reply.content }];
  }
  return '';
}

async function structure(system, content, schema) {
  const reply = await client().messages.create({
    model: model(),
    max_tokens: 16000,
    output_config: { effort: 'low', format: { type: 'json_schema', schema } },
    system,
    messages: [{ role: 'user', content }],
  });
  if (reply.stop_reason !== 'end_turn') return null;
  const text = textOf(reply);
  try { return JSON.parse(text); } catch {}
  try { return JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)); } catch { return null; }
}

const obj = (properties) => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
const str = (description) => ({ type: 'string', description });
const LEAD = obj({
  name: str('Public name or handle exactly as they publish it'),
  place: str('Town or region'),
  role: str("Their job or role, e.g. 'school events coordinator'"),
  story: str('Two or three sentences in English: what they see from where they stand, and what is happening around them'),
  moment: str('In a few words: the difficult or unprecedented time they are living through, e.g. "school closures after the 2025 floods"'),
  pitch: str('One sentence in English: why this person could carry a film'),
  in_their_words: str('A short quotation in the original language, or empty'),
  sources: { type: 'array', items: { type: 'string' }, description: 'Public URLs the claims come from' },
  scores: obj(Object.fromEntries(TRAITS.map((t) => [t, { type: 'integer', description: `0-3. ${RUBRIC[t]}` }]))),
  themes: { type: 'array', items: { type: 'string' }, description: "3-6 lowercase tags, e.g. 'school', 'mining town'" },
  story_type: { type: 'string', enum: Object.keys(STORY_TYPES), description: 'The one kind of story this is. ' + Object.entries(STORY_TYPES).map(([k, v]) => `${k}: ${v}`).join('; ') },
  cautions: str('Anything a human should check before any contact: safety, minors, consent, doubt about facts'),
});
const LEADS = obj({ leads: { type: 'array', items: LEAD } });
const INTROS = obj({
  introductions: {
    type: 'array',
    items: obj({
      a: str('First name, exactly as given'),
      b: str('Second name, exactly as given'),
      why: str('What these two would recognise in each other'),
      first_question: str('One question to open their first conversation'),
    }),
  },
});

const QUESTIONS = obj({
  questions: {
    type: 'array',
    items: obj({
      text: str('The question, in the requested language, as a native speaker in that job would phrase it. One sentence, under 25 words.'),
      english: str('What the question says, in plain English'),
      why: str('One sentence: why an insider would feel compelled to answer this'),
      placements: { type: 'array', items: { type: 'string' }, description: '3-5 specific places to post it: kinds of forum, group, newsletter or radio slot, and any of the listed organisations that fit' },
    }),
  },
  rtl: { type: 'boolean', description: 'True if the language is written right to left' },
  ui: obj({
    answer: str("In the requested language: 'Write your answer here. Any length.'"),
    name: str("In the requested language: 'Your name (optional)'"),
    contact: str("In the requested language: 'How we can reach you, if you want a reply (optional)'"),
    safe: str("In the requested language: 'Only write what is safe for you to write.'"),
    send: str("In the requested language: 'Send'"),
    thanks: str("In the requested language: 'Thank you. We read every answer.'"),
    asked_by: str("In the requested language: 'This question is asked by Nobody International, the team behind the Oscar-winning film Mr. Nobody Against Putin. We help people tell their own stories.'"),
    who: str("In the requested language: 'Who we are'"),
  }),
});

const QUESTION_SYSTEM = `You write open questions for Nobody International, a documentary initiative. Pavel Talankin, a school videographer in Russia, was not found by a search: he saw a question, and answered it with a long, angry letter. We want to ask questions like that one.

We are looking for people with a unique perspective during difficult or unprecedented times.

Write three different questions for people in the job and country given. Each question:
- is one sentence a person in that job would stop scrolling for, because only an insider could answer it;
- is about what they themselves see, do or have been told to do, never asking them to name or expose colleagues, patients, pupils or anyone else;
- does not mention films, prizes or money, and promises nothing;
- is written the way people in that job actually talk in that language, not translated from English.
Make the three differ in angle: one about what has changed in these times, one about what they record or keep, one about what nobody outside would believe.`;

const RUBRIC_TEXT = TRAITS.map((t) => `- ${t}: ${RUBRIC[t]}`).join('\n');

const SCOUT_SYSTEM = `You are a scout for Nobody International, a documentary initiative that looks for people with a unique perspective during difficult or unprecedented times, before the film world has found them.

${ARCHETYPE}

Rules
- Search in the language you are given, using the words a local would use. Do not search in English unless English is the language given.
- Only people who have already chosen to publish under their own name or handle. Never infer identities, never combine sources to unmask anyone, never collect contact details, addresses, family members or employers beyond what the person states publicly.
- No minors.
- Cast a wide net. The traits above are for scoring, not for ruling people out: report every person who has a perspective of their own on difficult or unprecedented times and some sign they might tell it, including partial fits and people you have doubts about. People will do the filtering later. Aim for eight to twelve people per search, and use every search you are given, varying the wording each time.
- Leave out only two kinds of person: anyone who has won an international prize or award, and established film or media professionals. Everyone else stays in. If someone has had national press coverage, a local prize or some film experience, include them and say so.
- For each person, state your doubts plainly in what a human should check. Never drop someone because of a doubt.
- Start from what is happening in this country now and in the last few years, nationally and in small places, then look for the people living it. If you are given an event or situation, stay with it.
- For each find give: public name, place, role, what they see from where they stand, what difficult or unprecedented thing is happening around them, why this could be a film, one short quotation in the original language, the URLs, and what a human should check before contact.`;

const RISK_RULES = `

This country is higher-risk: being identified as someone with a critical story can cost a person their job, their freedom or their family's safety. Extra rules here:
- Name a person only if they have already made themselves public, by their own choice and under their own name, on the very subject of their story. If in doubt, leave them out.
- Never name anyone who writes anonymously or under a pseudonym, and never guess who is behind an account.
- Prefer people who have already left the country or who speak with the backing of an organisation.
- In what a human should check, say how exposed the person already is and which organisation could make a safe introduction.`;

const RELAY_SYSTEM = `You are a scout for Nobody International, a documentary initiative that looks for people with a story only they can tell.

In this search you do NOT look for individuals and you name no private person.

Find the trusted public intermediaries through whom an open call for stories could travel, so that people can choose to come to us, and through whom a safe introduction could be made: independent and exile media in the language, diaspora associations, teacher, medical and labour networks abroad, university departments, legal aid and press-freedom groups, community media trainers, film schools in exile. For each give: name, where it is based, who it reaches inside the country, why people trust it, the URL. Search in the language given.`;

function finish(lead, extra) {
  const scores = Object.fromEntries(TRAITS.map((t) => [t, Math.max(0, Math.min(3, Number(lead.scores?.[t]) || 0))]));
  return {
    ...lead, scores,
    story_type: STORY_TYPES[lead.story_type] ? lead.story_type : 'other',
    total: TRAITS.reduce((n, t) => n + scores[t], 0),
    found: new Date().toISOString().slice(0, 10),
    status: 'unreviewed',
    ...extra,
  };
}

// ---------- actions -----------------------------------------------------------

const PLACE = /^[\p{L}\p{M}' .()-]{2,60}$/u; // a country or language name, nothing else
const isHighRisk = (country) => [...HIGH_RISK].some((c) => c.toLowerCase() === country.toLowerCase());

async function run(body) {
  const { lane, searches = 8 } = body;
  // Any country and language may be searched, not only those in the brief.
  const country = String(body.country || '').trim(), language = String(body.language || '').trim();
  if (!PLACE.test(country) || !PLACE.test(language)) throw fail(400, 'Enter a country and a language, in letters only.');
  // In higher-risk countries the page runs an organisations search first
  // ('intermediaries'), then the ordinary searches for people.
  const risky = isHighRisk(country), orgs = lane === 'intermediaries';
  const event = String(body.event || '').trim();
  if (event && !/^[\p{L}\p{M}\p{N}' .(),&/:-]{2,140}$/u.test(event)) throw fail(400, 'Describe the event in plain words, without symbols.');
  const types = (Array.isArray(body.types) ? body.types : []).filter((t) => STORY_TYPES[t] && t !== 'other');
  if (!orgs && !LANES[lane]) throw fail(400, 'Unknown lane.');
  const deadline = Date.now() + BUDGET_MS;
  const prompt = `Country: ${country}. Language to search in: ${language}.` +
    (orgs ? '' : `\nWhere to look this time: ${LANES[lane]}`) +
    (event ? `\nThe event or situation to look into: ${event}` : '') +
    (types.length ? `\nOnly these kinds of story this time: ${types.map((t) => STORY_TYPES[t]).join('; ')}. Leave out anything else.` : '');
  const notes = await research(orgs ? RELAY_SYSTEM : SCOUT_SYSTEM + (risky ? RISK_RULES : ''), prompt, Math.max(1, Math.min(10, searches)), deadline);
  if (!notes.trim()) return { found: 0, added: 0 };
  const parsed = await structure(
    'Convert these scouting notes into records: one record for every person or organisation named in them, including those the scout had doubts about or scored low. Invent nothing: leave a field empty rather than guess. Score each record 0-3 on:\n' +
      RUBRIC_TEXT + (orgs ? '\nThese are organisations: set every score to 0.' : ''),
    notes, LEADS);
  const existing = new Set((await listAll('scout/leads/')).map((b) => b.pathname));
  let added = 0;
  for (const raw of parsed?.leads || []) {
    if (!raw.name) continue;
    const id = hash(`${raw.name.toLowerCase()}|${country}`);
    const pathname = `scout/leads/${id}.json`;
    if (existing.has(pathname)) continue;
    if (risky && !orgs) raw.cautions = `Higher-risk country: do not contact directly. Approach through a trusted organisation and take security advice first. ${raw.cautions || ''}`.trim();
    await writeJson(pathname, finish(raw, { id, kind: orgs ? 'intermediary' : 'person', country, language, lane, origin: 'scout' }));
    added++;
  }
  return { found: parsed?.leads?.length || 0, added };
}

async function intake() {
  const deadline = Date.now() + BUDGET_MS;
  const [letters, leads] = await Promise.all([listAll('letters/'), listAll('scout/leads/')]);
  const done = new Set(leads.map((b) => b.pathname));
  const pending = letters.filter((b) => !done.has(`scout/leads/${hash(b.pathname)}.json`));
  let processed = 0;
  for (const blob of pending) {
    if (processed >= 4 || Date.now() > deadline) break;
    const letter = await readJson(blob.pathname);
    if (!letter) continue;
    const parsed = await structure(
      `A person wrote to Nobody International, in any language.\n\n${ARCHETYPE}\n\nProduce exactly one record from their message. Write 'story' in English, keep 'in_their_words' in their language, leave 'sources' empty. Use only what they wrote. If they are a filmmaker, funder or someone recommending another person rather than a person with their own story, say so in 'role' and 'story' and set every score to 0. Score 0-3 on:\n${RUBRIC_TEXT}`,
      JSON.stringify(letter), LEADS);
    const raw = parsed?.leads?.[0] || {
      name: letter.name, place: letter.location, role: letter.role, story: 'Could not be read automatically. Open the letter.',
      in_their_words: '', sources: [], scores: {}, themes: [], story_type: 'other', moment: '', pitch: '', cautions: 'Not scored.',
    };
    const id = hash(blob.pathname);
    await writeJson(`scout/leads/${id}.json`, finish(raw, {
      id, kind: 'person', country: letter.location || '', language: '', lane: letter.question_code ? 'question' : 'open-call', origin: 'inbound',
      answered: letter.question_english || letter.question || '', answered_at: letter.question_placement || '',
      name: letter.name || raw.name, contact: letter.contact || '', wrote_as: letter.role || '',
      letter: letter.letter || '', received: letter.received || '',
    }));
    processed++;
  }
  return { processed, remaining: pending.length - processed };
}

async function match({ min = 12 }) {
  const leads = await readAll('scout/leads/');
  const people = leads
    .filter((l) => l.kind === 'person' && l.status !== 'passed' && (l.total / ((Object.keys(l.scores || {}).length || TRAITS.length) * 3)) * 18 >= min)
    .map(({ name, country, role, story, themes, moment }) => ({ name, country, role, story, themes, moment }));
  if (people.length < 2) return { proposed: 0, added: 0, people: people.length };
  const parsed = await structure(
    'These people each have a story and do not know each other. Propose introductions between pairs in DIFFERENT countries who would recognise something in each other: the same vantage point, the same kind of upheaval, or two halves of one story. Quality over coverage; an obvious topical overlap is not enough. Use names exactly as given.',
    JSON.stringify(people), INTROS);
  const existing = new Set((await listAll('scout/intros/')).map((b) => b.pathname));
  let added = 0;
  for (const intro of parsed?.introductions || []) {
    const id = hash([intro.a, intro.b].sort().join('|'));
    const pathname = `scout/intros/${id}.json`;
    if (existing.has(pathname)) continue;
    await writeJson(pathname, { ...intro, id, proposed: new Date().toISOString().slice(0, 10) });
    added++;
  }
  return { proposed: parsed?.introductions?.length || 0, added, people: people.length };
}

async function mark({ id, status }) {
  if (!/^[0-9a-f]{20}$/.test(id || '') || !['unreviewed', 'shortlist', 'passed'].includes(status)) throw fail(400, 'Bad request.');
  const pathname = `scout/leads/${id}.json`;
  const lead = await readJson(pathname);
  if (!lead) throw fail(404, 'No such lead.');
  await writeJson(pathname, { ...lead, status });
  return { ok: true };
}

const WORDS = /^[\p{L}\p{M}' .(),&/-]{2,80}$/u;
const questionPath = (code) => `scout/questions/${code}.json`;

async function draft(body) {
  const country = String(body.country || '').trim(), language = String(body.language || '').trim(), job = String(body.job || '').trim();
  if (!PLACE.test(country) || !PLACE.test(language) || !WORDS.test(job)) throw fail(400, 'Enter a country, a language and a kind of work, in letters only.');
  const orgs = (await readAll('scout/leads/')).filter((l) => l.kind === 'intermediary' && l.country.toLowerCase() === country.toLowerCase()).map((l) => l.name).slice(0, 30);
  const parsed = await structure(QUESTION_SYSTEM,
    `Country: ${country}\nLanguage: ${language}\nKind of work: ${job}\nOrganisations we already know there: ${orgs.length ? orgs.join('; ') : 'none yet'}`, QUESTIONS);
  if (!parsed?.questions?.length) throw fail(409, 'No questions came back. Try again.');
  return { country, language, job, ...parsed };
}

async function saveQuestion(body) {
  const country = String(body.country || '').trim(), language = String(body.language || '').trim(), job = String(body.job || '').trim();
  const text = String(body.text || '').trim().slice(0, 400), placement = String(body.placement || '').trim().slice(0, 200);
  if (!PLACE.test(country) || !PLACE.test(language) || !WORDS.test(job) || !text || !placement) throw fail(400, 'A question needs its text and where it will be placed.');
  const ui = {};
  for (const k of ['answer', 'name', 'contact', 'safe', 'send', 'thanks', 'asked_by', 'who']) ui[k] = String(body.ui?.[k] || '').slice(0, 400);
  const code = [...randomBytes(6)].map((b) => 'abcdefghijklmnopqrstuvwxyz234567'[b % 32]).join('');
  const q = { code, country, language, job, text, english: String(body.english || '').slice(0, 400), placement, rtl: Boolean(body.rtl), ui, active: true, created: new Date().toISOString().slice(0, 10) };
  await writeJson(questionPath(code), q);
  return q;
}

async function setQuestion({ code, active }) {
  if (!/^[a-z2-7]{6}$/.test(code || '')) throw fail(400, 'Bad request.');
  const q = await readJson(questionPath(code));
  if (!q) throw fail(404, 'No such question.');
  await writeJson(questionPath(code), { ...q, active: Boolean(active) });
  return { ok: true };
}

async function questions() {
  const [list, letters] = await Promise.all([readAll('scout/questions/'), listAll('letters/')]);
  const counts = {};
  for (const b of letters) { const m = b.pathname.match(/\/q-([a-z2-7]{6})-/); if (m) counts[m[1]] = (counts[m[1]] || 0) + 1; }
  return { questions: list.map((q) => ({ ...q, replies: counts[q.code] || 0 })).sort((a, b) => (b.created || '').localeCompare(a.created || '')) };
}

const ACTIONS = {
  questions, draft, saveQuestion, setQuestion,
  config: async () => ({
    regions: REGIONS.map(([country, languages]) => ({ country, languages })),
    highRisk: [...HIGH_RISK],
    lanes: LANES, rubric: RUBRIC, storyTypes: STORY_TYPES,
  }),
  leads: async () => {
    const [leads, intros, letters] = await Promise.all([readAll('scout/leads/'), readAll('scout/intros/'), listAll('letters/')]);
    const read = new Set(leads.filter((l) => l.origin === 'inbound').map((l) => l.id));
    return { leads, intros, unreadLetters: letters.filter((b) => !read.has(hash(b.pathname))).length };
  },
  run, intake, match, mark,
};

// ---------- entry -------------------------------------------------------------

function fail(status, message) { return Object.assign(new Error(message), { status }); }

function allowed(given) {
  const want = process.env.SCOUT_PASSWORD || '';
  const a = createHash('sha256').update(String(given || '')).digest();
  const b = createHash('sha256').update(want).digest();
  return want.length >= 8 && timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'POST only' }); }
  if (!process.env.SCOUT_PASSWORD || process.env.SCOUT_PASSWORD.length < 8) {
    return res.status(503).json({ error: 'Not set up yet: add SCOUT_PASSWORD (8 characters or more) in the Vercel project settings, then redeploy.' });
  }
  if (!allowed(req.headers['x-scout-key'])) return res.status(401).json({ error: 'Wrong password.' });
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const action = ACTIONS[body.action];
  if (!action) return res.status(400).json({ error: 'Unknown action.' });
  gatewayToken = req.headers['x-vercel-oidc-token'] || process.env.VERCEL_OIDC_TOKEN || '';
  if (['run', 'intake', 'match', 'draft'].includes(body.action) && !direct() && !gatewayToken) {
    return res.status(503).json({ error: 'No AI access: add ANTHROPIC_API_KEY in the Vercel project settings, then redeploy.' });
  }
  try {
    return res.status(200).json(await action(body));
  } catch (err) {
    if (err.status && err.status < 500 && !(err instanceof Anthropic.APIError)) return res.status(err.status).json({ error: err.message });
    console.error(body.action, err);
    const hint = err instanceof Anthropic.AuthenticationError ? 'AI access was refused. Check AI Gateway is enabled for the Vercel team, or the API key.'
      : err instanceof Anthropic.RateLimitError ? 'Rate limit reached. Wait a minute and try again.'
      : err instanceof Anthropic.APIError ? `AI service error ${err.status ?? ''}: ${err.message}`
      : 'Something failed on the server. The details are in the Vercel logs.';
    return res.status(502).json({ error: hint });
  }
}
