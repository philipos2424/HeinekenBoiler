import { prisma } from '../_lib/prisma.js';
import { requireScanAuth } from '../_lib/auth.js';
import { verifyPassword } from '../_lib/password.js';
import { createStaffSessionToken, staffCookieName, staffMaxAgeSeconds } from '../_lib/session.js';
import { setCookie, clearCookie } from '../_lib/cookies.js';
import { rateLimit, clientIp } from '../_lib/rate-limit.js';

// Same reasoning as api/admin/[...path].js: one catch-all function instead of
// five separate route files, to stay under Vercel's per-deployment function cap.

async function handleLogin(req, res) {
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

function handleLogout(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  clearCookie(res, staffCookieName);
  return res.status(200).json({ ok: true });
}

async function handleMe(req, res) {
  const auth = await requireScanAuth(req, res);
  if (!auth) return;
  return res.status(200).json({ ok: true, kind: auth.kind });
}

async function handleSearch(req, res) {
  const auth = await requireScanAuth(req, res);
  if (!auth) return;
  const q = (req.query.q ?? '').toString().trim();
  if (!q || q.length < 2) return res.status(200).json({ attendees: [] });
  const attendees = await prisma.attendee.findMany({
    where: {
      OR: [
        { fullName: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: { id: true, fullName: true, phone: true, response: true, checkedInAt: true },
    take: 10,
    orderBy: { fullName: 'asc' },
  });
  return res.status(200).json({ attendees });
}

async function handleCheckin(req, res, attendeeId) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const auth = await requireScanAuth(req, res);
  if (!auth) return;

  const attendee = await prisma.attendee.findUnique({ where: { id: attendeeId } });
  if (!attendee) return res.status(404).json({ status: 'not_found' });
  if (attendee.response !== 'ACCEPTED') {
    return res.status(200).json({
      status: 'not_accepted',
      attendee: { fullName: attendee.fullName, response: attendee.response },
    });
  }

  const result = await prisma.attendee.updateMany({
    where: { id: attendeeId, checkedInAt: null },
    data: {
      checkedInAt: new Date(),
      checkedInByStaffId: auth.kind === 'staff' ? auth.staffUserId : null,
    },
  });

  const current = await prisma.attendee.findUnique({ where: { id: attendeeId } });

  if (result.count === 1) {
    return res.status(200).json({ status: 'checked_in', attendee: { fullName: current.fullName, checkedInAt: current.checkedInAt } });
  }
  return res.status(200).json({ status: 'already_checked_in', attendee: { fullName: current.fullName, checkedInAt: current.checkedInAt } });
}

export default async function handler(req, res) {
  const segments = Array.isArray(req.query.path) ? req.query.path : req.query.path ? [req.query.path] : [];
  const [first, second] = segments;

  if (req.query.__debug === '1') {
    return res.status(200).json({ url: req.url, method: req.method, query: req.query, segments });
  }

  if (first === 'login' && segments.length === 1) return handleLogin(req, res);
  if (first === 'logout' && segments.length === 1) return handleLogout(req, res);
  if (first === 'me' && segments.length === 1) return handleMe(req, res);
  if (first === 'search' && segments.length === 1) return handleSearch(req, res);
  if (first === 'checkin' && segments.length === 2) return handleCheckin(req, res, second);

  return res.status(404).json({ error: 'Not found' });
}
