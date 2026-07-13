import { prisma } from '../../_lib/prisma.js';
import { requireAdmin } from '../../_lib/auth.js';

const PAGE_SIZE = 50;

export default async function handler(req, res) {
  if (!(await requireAdmin(req, res))) return;
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
