// Wspólne funkcje: wywołanie Gemini, walidacja zdjęcia, prosty limit zapytań.
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models/';

async function gemini(model, parts, generationConfig) {
  const r = await fetch(BASE + model + ':generateContent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
    body: JSON.stringify({ contents: [{ parts }], generationConfig })
  });
  const j = await r.json();
  if (!r.ok) throw new Error((j.error && j.error.message) || 'HTTP ' + r.status);
  const c = j.candidates && j.candidates[0];
  return (c && c.content && c.content.parts) || [];
}

const img = (b64) => ({ inline_data: { mime_type: 'image/jpeg', data: b64 } });

// Przyjmuje tylko JPEG jako data URL, do ok. 2 MB.
function parseImage(dataUrl) {
  const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl || '');
  return m && m[1].length < 2800000 ? m[1] : null;
}

// Prosty limit na adres IP (działa w obrębie jednej instancji, więc to tylko podstawowa ochrona).
const hits = new Map();
function limited(req, max = 10, windowMs = 10 * 60 * 1000) {
  const ip = String(req.headers['x-forwarded-for'] || 'x').split(',')[0].trim();
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > max;
}

module.exports = { gemini, img, parseImage, limited };
