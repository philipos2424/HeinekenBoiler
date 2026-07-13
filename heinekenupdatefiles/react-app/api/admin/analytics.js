import { prisma } from '../_lib/prisma.js';
import { requireAdmin } from '../_lib/auth.js';

const TREND_DAYS = 14;

export default async function handler(req, res) {
  if (!(await requireAdmin(req, res))) return;

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

  // Bucket into per-day counts in JS — the guest list is small enough that
  // this is simpler and safer than a raw SQL date_trunc query.
  const buckets = new Map();
  for (let i = TREND_DAYS - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, 0);
  }
  for (const row of recent) {
    const key = row.createdAt.toISOString().slice(0, 10);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }

  return res.status(200).json({
    totals: {
      accepted,
      declined,
      noResponse,
      total: accepted + declined,
      checkedIn,
    },
    trend: Array.from(buckets.entries()).map(([date, count]) => ({ date, count })),
  });
}
