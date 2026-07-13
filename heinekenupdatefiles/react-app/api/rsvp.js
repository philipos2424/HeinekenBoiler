import { z } from 'zod';
import { prisma } from './_lib/prisma.js';
import { normalizePhone } from './_lib/phone.js';
import { rateLimit, clientIp } from './_lib/rate-limit.js';
import { sendConfirmationEmail } from './_lib/mailer.js';

const rsvpSchema = z.object({
  response: z.enum(['accept', 'decline']),
  fullName: z.string().trim().min(2, 'Please enter your full name').max(120),
  phone: z.string().trim().min(6, 'Please enter a valid phone number'),
  email: z.union([z.literal(''), z.string().trim().email()]).optional(),
  dietary: z.string().trim().max(200).optional(),
  message: z.string().trim().max(500).optional(),
  // Honeypot: real users never fill this in.
  website: z.string().max(0).optional(),
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!rateLimit(`rsvp:${clientIp(req)}`, 5, 10 * 60 * 1000)) {
    return res.status(429).json({ error: 'Too many attempts. Please try again in a few minutes.' });
  }

  const parsed = rsvpSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Please check your details and try again.' });
  }

  if (parsed.data.website) {
    // Honeypot tripped. Pretend a generic error so bots don't learn anything.
    return res.status(400).json({ error: 'Something went wrong. Please try again.' });
  }

  const isAccepting = parsed.data.response === 'accept';

  if (isAccepting && !parsed.data.email) {
    return res.status(400).json({ error: 'Please enter your email so we can send your confirmation and entry QR code.' });
  }

  const normalizedPhone = normalizePhone(parsed.data.phone);
  if (!normalizedPhone) {
    return res.status(400).json({ error: 'Please enter a valid phone number.' });
  }

  const existing = await prisma.attendee.findUnique({ where: { phone: normalizedPhone } });

  if (existing) {
    return res.status(200).json({
      alreadyRegistered: true,
      response: existing.response ?? 'ACCEPTED',
      attendee: { id: existing.id, fullName: existing.fullName, phone: existing.phone },
    });
  }

  const attendee = await prisma.attendee.create({
    data: {
      fullName: parsed.data.fullName,
      phone: normalizedPhone,
      email: isAccepting ? parsed.data.email || null : null,
      dietary: isAccepting ? parsed.data.dietary || null : null,
      message: parsed.data.message || null,
      response: isAccepting ? 'ACCEPTED' : 'DECLINED',
    },
  });

  if (isAccepting) {
    await sendConfirmationEmail(attendee);
  }

  return res.status(201).json({
    alreadyRegistered: false,
    response: isAccepting ? 'ACCEPTED' : 'DECLINED',
    attendee: { id: attendee.id, fullName: attendee.fullName, phone: attendee.phone },
  });
}
