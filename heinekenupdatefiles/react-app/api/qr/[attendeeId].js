import { generateCheckinQrPng } from '../_lib/qr.js';

// Unauthenticated fallback for guests whose email client blocked the inline
// QR image. Anyone with the attendeeId can view it, but that's no different
// from having the QR itself — the actual check-in mutation is staff-gated.
export default async function handler(req, res) {
  const { attendeeId } = req.query;
  const png = await generateCheckinQrPng(attendeeId);
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'private, max-age=3600');
  res.status(200).send(png);
}
