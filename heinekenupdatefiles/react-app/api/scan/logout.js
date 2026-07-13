import { staffCookieName } from '../_lib/session.js';
import { clearCookie } from '../_lib/cookies.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  clearCookie(res, staffCookieName);
  return res.status(200).json({ ok: true });
}
