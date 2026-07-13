import { prisma } from '../../_lib/prisma.js';
import { requireAdmin } from '../../_lib/auth.js';

function csvEscape(value) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export default async function handler(req, res) {
  if (!(await requireAdmin(req, res))) return;

  const attendees = await prisma.attendee.findMany({ orderBy: { createdAt: 'desc' } });

  const header = [
    'Full Name',
    'Phone',
    'Email',
    'Dietary',
    'Registered At',
    'Response',
    'Checked In At',
    'Blocked',
  ];
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
  res.status(200).send(csv);
}
