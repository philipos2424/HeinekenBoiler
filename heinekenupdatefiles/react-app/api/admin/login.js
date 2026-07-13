import { createAdminSessionToken, adminCookieName, adminMaxAgeSeconds } from '../_lib/session.js';
import { setCookie } from '../_lib/cookies.js';
import { rateLimit, clientIp } from '../_lib/rate-limit.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!rateLimit(`admin-login:${clientIp(req)}`, 8, 10 * 60 * 1000)) {
    return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
  }

  const password = req.body?.password ?? '';
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Incorrect password.' });
  }

  const token = await createAdminSessionToken();
  setCookie(res, adminCookieName, token, adminMaxAgeSeconds);
  return res.status(200).json({ ok: true });
}
