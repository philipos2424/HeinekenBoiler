import { z } from 'zod';
import { prisma } from '../_lib/prisma.js';
import { requireAdmin } from '../_lib/auth.js';
import { createAdminSessionToken, adminCookieName, adminMaxAgeSeconds } from '../_lib/session.js';
import { setCookie, clearCookie } from '../_lib/cookies.js';
import { rateLimit, clientIp } from '../_lib/rate-limit.js';
import { hashPassword } from '../_lib/password.js';
import { sendConfirmationEmail } from '../_lib/mailer.js';
import { pathSegments } from '../_lib/route-segments.js';

// Vercel Hobby plan caps a deployment at 12 serverless functions. The admin
// area alone used to be 10 separate route files, so everything under
// /api/admin/* is dispatched from this single catch-all instead — same URLs,
// same behavior, just one function instead of ten.

const PAGE_SIZE = 50;

async function handleLogin(req, res) {
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

function handleLogout(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  clearCookie(res, adminCookieName);
  return res.status(200).json({ ok: true });
}

function handleMe(req, res) {
  return res.status(200).json({ ok: true });
}

async function handleAnalytics(req, res) {
  const TREND_DAYS = 14;
  const [accepted, declined, noResponse, checkedIn, recent] = await Promise.all([
    prisma.attendee.count({ where: { response: 'ACCEPTED' } }),
    prisma.attendee.count({ where: { response: 'DECLINED' } }),
    prisma.attendee.count({ where: { response: null } }),
    prisma.attendee.count({ where: { response: 'ACCEPTED', checkedInAt: { not: null } } }),
    prisma.attendee.findMany({
      where: {
        response: { not: null },
        createdAt: { gte: new Date(Date.now() - TREND_DAYS * 24 * 60 * 60 * 1000) },
      },
      select: { createdAt: true },
    }),
  ]);

  const buckets = new Map();
  for (let i = TREND_DAYS - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const row of recent) {
    const key = row.createdAt.toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return res.status(200).json({
    totals: { accepted, declined, noResponse, total: accepted + declined, checkedIn },
    trend: Array.from(buckets.entries()).map(([date, count]) => ({ date, count })),
  });
}

async function handleAttendeesList(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const search = (req.query.search ?? '').toString().trim();
  const cursor = req.query.cursor ? req.query.cursor.toString() : null;
  const responseFilter = req.query.response ? req.query.response.toString() : null;

  const where = {
    ...(search
      ? {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(responseFilter === 'ACCEPTED' || responseFilter === 'DECLINED'
      ? { response: responseFilter }
      : responseFilter === 'NONE'
        ? { response: null }
        : {}),
  };

  const [attendees, total] = await Promise.all([
    prisma.attendee.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    }),
    prisma.attendee.count({ where }),
  ]);

  const hasMore = attendees.length > PAGE_SIZE;
  const page = hasMore ? attendees.slice(0, PAGE_SIZE) : attendees;

  return res.status(200).json({
    attendees: page,
    nextCursor: hasMore ? (page[page.length - 1]?.id ?? null) : null,
    total,
  });
}

function csvEscape(value) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

async function handleAttendeesExport(req, res) {
  const attendees = await prisma.attendee.findMany({ orderBy: { createdAt: 'desc' } });
  const header = ['Full Name', 'Phone', 'Email', 'Dietary', 'Registered At', 'Response', 'Checked In At', 'Blocked'];
  const rows = attendees.map((a) =>
    [
      a.fullName,
      a.phone,
      a.email ?? '',
      a.dietary ?? '',
      a.createdAt.toISOString(),
      a.response ?? 'No Response',
      a.checkedInAt ? a.checkedInAt.toISOString() : '',
      a.blocked ? 'Yes' : 'No',
    ]
      .map((v) => csvEscape(String(v)))
      .join(',')
  );
  const csv = [header.join(','), ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="heineken-eboiler-rsvps.csv"');
  return res.status(200).send(csv);
}

const blockSchema = z.object({ blocked: z.boolean() });

async function handleAttendeeById(req, res, id) {
  if (req.method === 'PATCH') {
    const parsed = blockSchema.safeParse(req.body ?? {});
    if (!parsed.success) return res.status(400).json({ error: 'Invalid request.' });
    const attendee = await prisma.attendee.update({ where: { id }, data: { blocked: parsed.data.blocked } });
    return res.status(200).json({ attendee });
  }
  if (req.method === 'DELETE') {
    await prisma.attendee.delete({ where: { id } });
    return res.status(200).json({ ok: true });
  }
  res.setHeader('Allow', 'PATCH, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleResendEmail(req, res, id) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const attendee = await prisma.attendee.findUnique({ where: { id } });
  if (!attendee) return res.status(404).json({ error: 'Attendee not found.' });
  if (attendee.response !== 'ACCEPTED') {
    return res.status(400).json({ error: 'Only accepted RSVPs receive a confirmation email.' });
  }
  if (!attendee.email) return res.status(400).json({ error: 'This attendee has no email on file.' });
  await sendConfirmationEmail(attendee);
  const updated = await prisma.attendee.findUnique({ where: { id } });
  return res.status(200).json({ attendee: updated });
}

const createStaffSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(40)
    .regex(/^[a-zA-Z0-9._-]+$/, 'Username can only contain letters, numbers, dots, dashes, underscores'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
});

async function handleStaffList(req, res) {
  if (req.method === 'GET') {
    const staff = await prisma.staffUser.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, username: true, createdAt: true },
    });
    return res.status(200).json({ staff });
  }
  if (req.method === 'POST') {
    const parsed = createStaffSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid request.' });
    }
    const existing = await prisma.staffUser.findUnique({ where: { username: parsed.data.username } });
    if (existing) return res.status(409).json({ error: 'That username is already taken.' });
    const { hash, salt } = hashPassword(parsed.data.password);
    const staffUser = await prisma.staffUser.create({
      data: { username: parsed.data.username, passwordHash: hash, passwordSalt: salt },
      select: { id: true, username: true, createdAt: true },
    });
    return res.status(201).json({ staff: staffUser });
  }
  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleStaffDelete(req, res, id) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', 'DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  await prisma.staffUser.delete({ where: { id } });
  return res.status(200).json({ ok: true });
}

export default async function handler(req, res) {
  const segments = pathSegments(req, '/api/admin/');
  const [first, second, third] = segments;

  // /login is the only public admin route — everything else needs a valid
  // admin session, checked once here before dispatching.
  if (first === 'login' && segments.length === 1) return handleLogin(req, res);

  if (!(await requireAdmin(req, res))) return;

  if (first === 'logout' && segments.length === 1) return handleLogout(req, res);
  if (first === 'me' && segments.length === 1) return handleMe(req, res);
  if (first === 'analytics' && segments.length === 1) return handleAnalytics(req, res);

  if (first === 'attendees') {
    if (segments.length === 1) return handleAttendeesList(req, res);
    if (segments.length === 2 && second === 'export') return handleAttendeesExport(req, res);
    if (segments.length === 2) return handleAttendeeById(req, res, second);
    if (segments.length === 3 && third === 'resend-email') return handleResendEmail(req, res, second);
  }

  if (first === 'staff') {
    if (segments.length === 1) return handleStaffList(req, res);
    if (segments.length === 2) return handleStaffDelete(req, res, second);
  }

  return res.status(404).json({ error: 'Not found' });
}
