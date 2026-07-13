import { z } from 'zod';
import { prisma } from '../../_lib/prisma.js';
import { requireAdmin } from '../../_lib/auth.js';
import { hashPassword } from '../../_lib/password.js';

const createSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(40)
    .regex(/^[a-zA-Z0-9._-]+$/, 'Username can only contain letters, numbers, dots, dashes, underscores'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
});

export default async function handler(req, res) {
  if (!(await requireAdmin(req, res))) return;

  if (req.method === 'GET') {
    const staff = await prisma.staffUser.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, username: true, createdAt: true },
    });
    return res.status(200).json({ staff });
  }

  if (req.method === 'POST') {
    const parsed = createSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid request.' });
    }

    const existing = await prisma.staffUser.findUnique({ where: { username: parsed.data.username } });
    if (existing) {
      return res.status(409).json({ error: 'That username is already taken.' });
    }

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
