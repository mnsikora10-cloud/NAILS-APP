// Wspólne funkcje: wywołanie Gemini (z ponawianiem przy przeciążeniu), walidacja zdjęcia, prosty limit zapytań.
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function gemini(model, parts, generationConfig) {
  const delays = [1500, 3000, 6000]; // ponowienia, gdy model jest przeciążony
  let lastErr;
  for (let i = 0; i <= delays.length; i++) {
    const r = await fetch(BASE + model + ':generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({ contents: [{ parts }], generationConfig })
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok) {
      const c = j.candidates && j.candidates[0];
      return (c && c.content && c.content.parts) || [];
    }
    lastErr = new Error((j.error && j.error.message) || 'HTTP ' + r.status);
    const retryable = r.status === 429 || r.status === 500 || r.status === 503;
    if (!retryable || i === delays.length) break;
    await sleep(delays[i]);
  }
  throw lastErr;
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
