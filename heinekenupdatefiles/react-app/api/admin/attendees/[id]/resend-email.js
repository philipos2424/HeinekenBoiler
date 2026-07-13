import { prisma } from '../../../_lib/prisma.js';
import { requireAdmin } from '../../../_lib/auth.js';
import { sendConfirmationEmail } from '../../../_lib/mailer.js';

export default async function handler(req, res) {
  if (!(await requireAdmin(req, res))) return;
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const attendee = await prisma.attendee.findUnique({ where: { id } });

  if (!attendee) {
    return res.status(404).json({ error: 'Attendee not found.' });
  }
  if (attendee.response !== 'ACCEPTED') {
    return res.status(400).json({ error: 'Only accepted RSVPs receive a confirmation email.' });
  }
  if (!attendee.email) {
    return res.status(400).json({ error: 'This attendee has no email on file.' });
  }

  await sendConfirmationEmail(attendee);

  const updated = await prisma.attendee.findUnique({ where: { id } });
  return res.status(200).json({ attendee: updated });
}
