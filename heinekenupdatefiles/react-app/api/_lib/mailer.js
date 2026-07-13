import nodemailer from 'nodemailer';
import { prisma } from './prisma.js';
import { event, siteUrl } from './config.js';
import { generateCheckinQrPng } from './qr.js';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
  return transporter;
}

const dateLabel = new Date(event.startsAt).toLocaleDateString('en-US', {
  timeZone: 'Africa/Nairobi',
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const timeLabel = `${new Date(event.startsAt).toLocaleTimeString('en-US', {
  timeZone: 'Africa/Nairobi',
  hour: 'numeric',
  minute: '2-digit',
})} - ${new Date(event.endsAt).toLocaleTimeString('en-US', {
  timeZone: 'Africa/Nairobi',
  hour: 'numeric',
  minute: '2-digit',
})} (${event.timezoneLabel})`;

function confirmationEmailHtml(fullName, attendeeId) {
  const base = siteUrl();
  const firstName = fullName.split(' ')[0];
  return `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#f4eede;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4eede;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;max-width:480px;width:100%;">
            <tr>
              <td style="background-color:#f4eede;padding:28px 32px;text-align:center;">
                <img src="${base}/assets/heineken-ethiopia-logo.png" alt="${event.organizer}" width="140" style="display:block;margin:0 auto;" />
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 4px;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#00843d;">You're On The List</p>
                <h1 style="margin:0 0 16px;font-size:22px;color:#0f3d26;">Thank you, ${firstName}!</h1>
                <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#444444;">
                  We're delighted you'll be joining us. Please bring the QR code below, we'll scan it at
                  the entrance.
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4eede;border-radius:12px;margin-bottom:24px;">
                  <tr>
                    <td style="padding:20px;text-align:left;">
                      <p style="margin:0 0 4px;font-size:16px;font-weight:bold;color:#0f3d26;">${event.name}</p>
                      <p style="margin:0 0 2px;font-size:13px;color:#555555;">${dateLabel}</p>
                      <p style="margin:0 0 2px;font-size:13px;color:#555555;">${timeLabel}</p>
                      <p style="margin:0;font-size:13px;color:#555555;">${event.venue.name}</p>
                    </td>
                  </tr>
                </table>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="padding-bottom:24px;">
                      <img src="cid:checkin-qr" alt="Your entry QR code" width="220" height="220" style="display:block;border:8px solid #f4eede;border-radius:12px;" />
                      <p style="margin:12px 0 0;font-size:11px;color:#999999;">
                        Can't see your code? <a href="${base}/api/qr/${attendeeId}" style="color:#00843d;">View it here</a>
                      </p>
                    </td>
                  </tr>
                </table>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center">
                      <a href="${base}/api/ics" style="display:inline-block;background-color:#00843d;color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;padding:14px 28px;border-radius:999px;">
                        Add to Calendar
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="background-color:#0f3d26;padding:20px 32px;text-align:center;">
                <p style="margin:0;font-size:11px;color:#c3c3c3;">Enjoy Heineken&reg; Responsibly.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendConfirmationEmail(attendee) {
  if (!attendee.email) return;

  try {
    const qrPng = await generateCheckinQrPng(attendee.id);
    await getTransporter().sendMail({
      from: `"${event.organizer}" <${process.env.GMAIL_USER}>`,
      to: attendee.email,
      subject: `You're confirmed: ${event.name}`,
      html: confirmationEmailHtml(attendee.fullName, attendee.id),
      attachments: [
        {
          filename: 'entry-qr.png',
          content: qrPng,
          cid: 'checkin-qr',
        },
      ],
    });

    await prisma.attendee.update({
      where: { id: attendee.id },
      data: { confirmationEmailSentAt: new Date(), confirmationEmailError: null },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error sending email';
    await prisma.attendee.update({
      where: { id: attendee.id },
      data: { confirmationEmailError: message },
    });
  }
}
