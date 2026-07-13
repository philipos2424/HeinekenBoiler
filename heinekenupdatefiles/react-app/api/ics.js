import { generateEventIcs } from './_lib/ics.js';

export default async function handler(req, res) {
  const ics = generateEventIcs();
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', 'inline; filename="heineken-eboiler-unveiling.ics"');
  res.status(200).send(ics);
}
