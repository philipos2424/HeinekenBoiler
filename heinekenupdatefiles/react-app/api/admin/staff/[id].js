import { prisma } from '../../_lib/prisma.js';
import { requireAdmin } from '../../_lib/auth.js';

export default async function handler(req, res) {
  if (!(await requireAdmin(req, res))) return;
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', 'DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { id } = req.query;
  await prisma.staffUser.delete({ where: { id } });
  return res.status(200).json({ ok: true });
}
