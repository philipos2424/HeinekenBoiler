import { createEvent } from 'ics';
import { event } from './config.js';

function toIcsDateArray(iso) {
  const d = new Date(iso);
  return [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes()];
}

export function generateEventIcs() {
  const { error, value } = createEvent({
    title: event.name,
    start: toIcsDateArray(event.startsAt),
    startInputType: 'utc',
    end: toIcsDateArray(event.endsAt),
    endInputType: 'utc',
    location: `${event.venue.name}, ${event.venue.address}`,
    description: `Join us for ${event.name}.`,
    organizer: { name: event.organizer },
  });
  if (error) throw error;
  return value;
}
