/**
 * Normalizes opening_hours keys to lowercase weekday names.
 * Expected shape: { monday: { open: "10:00", close: "22:00" }, ... }
 */
function normalizeHours(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    out[String(k).toLowerCase()] = v;
  }
  return out;
}

function timeToMinutes(hhmm) {
  if (!hhmm || typeof hhmm !== 'string') return null;
  const [h, m] = hhmm.split(':').map((x) => parseInt(x, 10));
  if (Number.isNaN(h)) return null;
  return h * 60 + (Number.isNaN(m) ? 0 : m);
}

/** Current weekday key in Africa/Lagos ("monday", … "sunday"). */
function lagosWeekdayKey() {
  const d = new Date();
  const w = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Lagos',
    weekday: 'long',
  }).format(d);
  return w.toLowerCase();
}

/** Minutes since midnight in Africa/Lagos. */
function lagosMinutesSinceMidnight() {
  const d = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Lagos',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const hour = parseInt(
    parts.find((p) => p.type === 'hour')?.value ?? '0',
    10
  );
  const minute = parseInt(
    parts.find((p) => p.type === 'minute')?.value ?? '0',
    10
  );
  return hour * 60 + minute;
}

/**
 * True if current Lagos time is within [open, close] for today.
 * Unknown / invalid hours → true (treat as open; card can still show info).
 */
export function isOpenNow(openingHours) {
  const hours = normalizeHours(openingHours);
  if (!hours) return true;
  const day = lagosWeekdayKey();
  const slot = hours[day];
  if (!slot?.open || !slot?.close) return true;
  const openM = timeToMinutes(slot.open);
  const closeM = timeToMinutes(slot.close);
  if (openM == null || closeM == null) return true;
  const now = lagosMinutesSinceMidnight();
  if (closeM < openM) {
    return now >= openM || now <= closeM;
  }
  return now >= openM && now <= closeM;
}

export function nextOpenHint(openingHours) {
  const hours = normalizeHours(openingHours);
  if (!hours) return '';
  const day = lagosWeekdayKey();
  const slot = hours[day];
  if (slot?.open) return `Opens at ${slot.open}`;
  return '';
}
