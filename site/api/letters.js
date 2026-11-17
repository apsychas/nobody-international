// Receives a letter from the form and stores it as a private JSON file in Vercel Blob.
import { put } from '@vercel/blob';
import { randomUUID } from 'node:crypto';

const LIMITS = { name: 300, location: 300, contact: 300, role: 100, letter: 20000 };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'POST only' });
  }
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  if (body.company) return res.status(200).json({ ok: true }); // hidden field: a bot

  const letter = {};
  for (const [field, max] of Object.entries(LIMITS)) {
    letter[field] = String(body[field] ?? '').trim().slice(0, max);
  }
  if (!letter.name || !letter.location || !letter.contact || !letter.letter) {
    return res.status(400).json({ error: 'Name, place, contact and letter are required.' });
  }
  letter.received = new Date().toISOString();

  await put(
    `letters/${letter.received.slice(0, 10)}/${randomUUID()}.json`,
    JSON.stringify(letter, null, 2),
    { access: 'private', contentType: 'application/json', addRandomSuffix: false },
  );
  return res.status(200).json({ ok: true });
}
