// Single source of truth for event details used by the mailer, ICS file, and
// QR/check-in links. Keep in sync with the copy in src/pages/RsvpPage.jsx.
export const event = {
  name: 'HEINEKEN Ethiopia E-Boiler Unveiling',
  organizer: 'HEINEKEN Ethiopia',
  startsAt: '2026-07-28T14:00:00+03:00',
  endsAt: '2026-07-28T18:00:00+03:00',
  timezoneLabel: 'East Africa Time (UTC+3)',
  venue: {
    name: 'HEINEKEN Ethiopia Kilinto Brewery',
    address: 'Kilinto, Akaki Kality Sub-City, Addis Ababa, Ethiopia',
  },
};

export function siteUrl() {
  return (process.env.SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}
