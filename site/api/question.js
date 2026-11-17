// Public side of an "open question": serves the question for a reply link and
// stores each answer with the website letters, tagged with the question's code.
import { put, get } from '@vercel/blob';
import { randomUUID } from 'node:crypto';

const CODE = /^[a-z2-7]{6}$/;
const LIMITS = { name: 300, location: 300, contact: 300, letter: 20000 };

async function load(code) {
  if (!CODE.test(code || '')) return null;
  const r = await get(`scout/questions/${code}.json`, { access: 'private' }).catch(() => null);
  if (!r || r.statusCode !== 200) return null;
  const q = JSON.parse(await new Response(r.stream).text());
  return q.active ? q : null;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') {
    const q = await load(String(req.query?.c || ''));
    if (!q) return res.status(404).json({ error: 'This question is closed.' });
    return res.status(200).json({ text: q.text, rtl: Boolean(q.rtl), ui: q.ui || {} });
  }
  if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return res.status(405).json({ error: 'GET or POST only' }); }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  if (body.company) return res.status(200).json({ ok: true }); // hidden field: a bot
  const q = await load(String(body.c || ''));
  if (!q) return res.status(404).json({ error: 'This question is closed.' });

  const answer = {};
  for (const [field, max] of Object.entries(LIMITS)) answer[field] = String(body[field] ?? '').trim().slice(0, max);
  if (!answer.letter) return res.status(400).json({ error: 'Please write an answer.' });
  Object.assign(answer, {
    name: answer.name || 'Anonymous', role: 'Answered a question', received: new Date().toISOString(),
    question_code: q.code, question: q.text, question_english: q.english, question_placement: q.placement,
    location: answer.location || q.country,
  });
  await put(`letters/${answer.received.slice(0, 10)}/q-${q.code}-${randomUUID()}.json`, JSON.stringify(answer, null, 2),
    { access: 'private', contentType: 'application/json', addRandomSuffix: false });
  return res.status(200).json({ ok: true });
}
