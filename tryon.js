// Nakładanie wybranego wzoru na paznokcie ze zdjęcia (model do edycji obrazów).
const fs = require('fs'), path = require('path');
const { gemini, img, parseImage, limited } = require('./_gemini');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metoda niedozwolona.' });
  if (limited(req)) return res.status(429).json({ error: 'Za dużo prób. Spróbuj za kilka minut.' });
  const { image, designId } = req.body || {};
  const photo = parseImage(image);
  const designs = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'designs.json'), 'utf8'));
  const d = designs.find((x) => x.id === Number(designId));
  if (!photo || !d) return res.status(400).json({ error: 'Nieprawidłowe dane.' });

  const ref = fs.readFileSync(path.join(process.cwd(), 'public', d.img)).toString('base64');
  const prompt =
    'You are given two images. Image 1 is a photo of a person\'s hand. Image 2 is a reference photo of a nail design. ' +
    'Edit image 1: replace ONLY the nail design on the fingernails with the nail design from image 2 ' +
    '(colors, pattern, french tip, decorations, 3D elements, finish). ' +
    'Keep the hand, fingers, skin, pose, background, lighting, framing and the nail shape and length from image 1 exactly unchanged. ' +
    'Do not add or remove fingers. Return only the edited image 1.';
  try {
    const parts = await gemini(process.env.IMAGE_MODEL || 'gemini-3.8-flash', [{ text: prompt }, img(photo), img(ref)], { responseModalities: ['TEXT', 'IMAGE'] });
    const out = parts.find((p) => p.inlineData || p.inline_data);
    if (!out) return res.status(502).json({ error: 'Model nie zwrócił obrazu. Spróbuj z innym zdjęciem.' });
    const o = out.inlineData || out.inline_data;
    return res.status(200).json({ image: 'data:' + (o.mimeType || o.mime_type || 'image/png') + ';base64,' + o.data });
  } catch (e) {
    console.error(e);
    return res.status(502).json({ error: 'Nie udało się wygenerować wizualizacji. Spróbuj ponownie.' });
  }
};
