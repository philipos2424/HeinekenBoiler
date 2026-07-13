import { prisma } from '../../_lib/prisma.js';
import { requireScanAuth } from '../../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await requireScanAuth(req, res);
  if (!auth) return;

  const { attendeeId } = req.query;

  const attendee = await prisma.attendee.findUnique({ where: { id: attendeeId } });
  if (!attendee) {
    return res.status(404).json({ status: 'not_found' });
  }
  if (attendee.response !== 'ACCEPTED') {
    return res.status(200).json({
      status: 'not_accepted',
      attendee: { fullName: attendee.fullName, response: attendee.response },
    });
  }

  // Atomic guarded update: avoids a lost-update race if two scanners hit the
  // same guest's QR at once. Only the request that actually flips
  // checkedInAt from null gets count === 1.
  const result = await prisma.attendee.updateMany({
    where: { id: attendeeId, checkedInAt: null },
    data: {
      checkedInAt: new Date(),
      checkedInByStaffId: auth.kind === 'staff' ? auth.staffUserId : null,
    },
  });

  const current = await prisma.attendee.findUnique({ where: { id: attendeeId } });

  if (result.count === 1) {
    return res.status(200).json({
      status: 'checked_in',
      attendee: { fullName: current.fullName, checkedInAt: current.checkedInAt },
    });
  }

  return res.status(200).json({
    status: 'already_checked_in',
    attendee: { fullName: current.fullName, checkedInAt: current.checkedInAt },
  });
}
