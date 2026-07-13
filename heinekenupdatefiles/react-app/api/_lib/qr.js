import QRCode from 'qrcode';
import { siteUrl } from './config.js';

export function checkinUrlForAttendee(attendeeId) {
  return `${siteUrl()}/scan/dashboard?a=${attendeeId}`;
}

export async function generateCheckinQrPng(attendeeId) {
  return QRCode.toBuffer(checkinUrlForAttendee(attendeeId), {
    type: 'png',
    width: 480,
    margin: 2,
    color: { dark: '#0B1D0E', light: '#FFFFFF' },
  });
}
