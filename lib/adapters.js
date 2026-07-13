export const PLATFORM_STATUS = {
  YouTube:   'live',
  X:         'manual',
  LinkedIn:  'manual',
  Instagram: 'manual',
};

export function hoursSince(iso) {
  return (Date.now() - new Date(iso).getTime()) / 3_600_000;
}

export function relTime(iso) {
  const h = hoursSince(iso);
  if (h < 1)  return `${Math.round(h * 60)}m`;
  if (h < 24) return `${Math.round(h)}h`;
  return `${Math.round(h / 24)}d`;
}

export function fmtCount(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export function scoreSignal(views, ageHours) {
  const vph = views / Math.max(ageHours, 1);
  let signal, velocityNum;
  if (vph > 50_000)     { signal = 'high';     velocityNum = Math.round(vph / 1000) * 10; }
  else if (vph > 5_000) { signal = 'rising';   velocityNum = Math.round(vph / 100)  * 5;  }
  else                  { signal = 'moderate'; velocityNum = Math.round(vph / 100);        }
  return { signal, velocity: `+${velocityNum}%` };
}

export function extractBuzz(text) {
  return text
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 4)
    .slice(0, 6);
}
