import { z } from 'zod';
import { prisma } from '../../_lib/prisma.js';
import { requireAdmin } from '../../_lib/auth.js';

const bodySchema = z.object({ blocked: z.boolean() });

export default async function handler(req, res) {
  if (!(await requireAdmin(req, res))) return;
  const { id } = req.query;

  if (req.method === 'PATCH') {
    const parsed = bodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request.' });
    }
    const attendee = await prisma.attendee.update({
      where: { id },
      data: { blocked: parsed.data.blocked },
    });
    return res.status(200).json({ attendee });
  }

  if (req.method === 'DELETE') {
    await prisma.attendee.delete({ where: { id } });
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'PATCH, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
