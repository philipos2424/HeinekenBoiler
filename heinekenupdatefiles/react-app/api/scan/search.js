import { prisma } from '../_lib/prisma.js';
import { requireScanAuth } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (!(await requireScanAuth(req, res))) return;

  const q = (req.query.q ?? '').toString().trim();
  if (!q || q.length < 2) {
    return res.status(200).json({ attendees: [] });
  }

  // Staff only need enough to identify and check someone in, not full PII
  // (no email/dietary notes).
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
