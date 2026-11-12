// Analiza zdjęcia dłoni i wybór wzorów z biblioteki.
const fs = require('fs'), path = require('path');
const { gemini, img, parseImage, limited } = require('./_gemini');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metoda niedozwolona.' });
  if (limited(req)) return res.status(429).json({ error: 'Za dużo prób. Spróbuj za kilka minut.' });
  const photo = parseImage((req.body || {}).image);
  if (!photo) return res.status(400).json({ error: 'Nieprawidłowe zdjęcie.' });

  const designs = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'designs.json'), 'utf8'));
  const lib = designs.map((d) => ({ id: d.id, nazwa: d.n, tagi: d.t, ksztalt: d.k, okazja: d.o, sezon: d.s }));
  const prompt =
    'Jesteś stylistką paznokci. Na zdjęciu są paznokcie klientki. Oceń kształt, długość, odcień skóry i obecny stan lub stylizację. ' +
    'Następnie wybierz do 3 wzorów z biblioteki (każdy najwyżej raz, od najlepiej pasującego) i dla każdego napisz po polsku 1-2 zdania opisu pod tę osobę. ' +
    'Biblioteka: ' + JSON.stringify(lib) + '. ' +
    'Odpowiedz WYŁĄCZNIE jako JSON: {"analiza":{"ksztalt":"","dlugosc":"","odcien_skory":"","obecny_stan":""},"wybrane":[{"id":0,"opis":""}]}. ' +
    'Jeśli na zdjęciu nie widać paznokci, odpowiedz: {"blad":"krótki komunikat po polsku"}.';
  try {
    const parts = await gemini(process.env.TEXT_MODEL || 'gemini-2.5-flash', [{ text: prompt }, img(photo)], { responseMimeType: 'application/json' });
    const data = JSON.parse(parts.map((p) => p.text || '').join(''));
    if (data.blad) return res.status(200).json({ blad: data.blad });
    data.wybrane = (data.wybrane || []).filter((w) => designs.some((d) => d.id === w.id));
    return res.status(200).json(data);
  } catch (e) {
    console.error(e);
    return res.status(502).json({ error: 'Nie udało się przeanalizować zdjęcia. Spróbuj ponownie.' });
  }
};
