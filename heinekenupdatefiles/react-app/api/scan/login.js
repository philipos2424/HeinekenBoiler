import { prisma } from '../_lib/prisma.js';
import { verifyPassword } from '../_lib/password.js';
import { createStaffSessionToken, staffCookieName, staffMaxAgeSeconds } from '../_lib/session.js';
import { setCookie } from '../_lib/cookies.js';
import { rateLimit, clientIp } from '../_lib/rate-limit.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!rateLimit(`staff-login:${clientIp(req)}`, 8, 10 * 60 * 1000)) {
    return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
  }

  const username = (req.body?.username ?? '').toString().trim();
  const password = (req.body?.password ?? '').toString();

  if (!username || !password) {
    return res.status(400).json({ error: 'Please enter your username and password.' });
  }

  const staffUser = await prisma.staffUser.findUnique({ where: { username } });
  if (!staffUser || !verifyPassword(password, staffUser.passwordHash, staffUser.passwordSalt)) {
    return res.status(401).json({ error: 'Incorrect username or password.' });
  }

  const token = await createStaffSessionToken(staffUser.id);
  setCookie(res, staffCookieName, token, staffMaxAgeSeconds);
  return res.status(200).json({ ok: true });
}
