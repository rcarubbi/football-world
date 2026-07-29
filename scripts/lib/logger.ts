const startTime = Date.now();

function elapsed(): string {
  const s = Math.floor((Date.now() - startTime) / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m${sec}s` : `${sec}s`;
}

export function log(tag: string, msg?: string): void {
  console.log(`[${elapsed()}] ${msg ? `${tag}: ${msg}` : tag}`);
}

export function warn(msg: string): void {
  console.warn(`[${elapsed()}] WARN: ${msg}`);
}

export function error(msg: string, err?: unknown): void {
  console.error(`[${elapsed()}] ERROR: ${msg}`);
  if (err) console.error(err);
}
