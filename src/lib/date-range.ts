// Pure calendar helpers for the stay date picker. Dates are "YYYY-MM-DD"
// strings, computed in UTC so daylight-saving changes never shift a day.
// No imports: the node test runner loads this file directly.

export type DateLocale = "en" | "ar";

const DAY = 86400000;

export function toStamp(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const t = Date.UTC(y, m - 1, d);
  const date = new Date(t);
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d ? t : null;
}

export function fromStamp(t: number): string {
  return new Date(t).toISOString().slice(0, 10);
}

export function addDays(value: string, days: number): string {
  const t = toStamp(value);
  return t === null ? "" : fromStamp(t + days * DAY);
}

export function nightsCount(checkin: string, checkout: string): number {
  const a = toStamp(checkin), b = toStamp(checkout);
  return a === null || b === null ? 0 : Math.max(0, Math.round((b - a) / DAY));
}

/** First day of the month containing `value`, as "YYYY-MM-01". */
export function monthOf(value: string): string {
  return /^\d{4}-\d{2}/.test(value) ? `${value.slice(0, 7)}-01` : "";
}

export function addMonths(month: string, delta: number): string {
  const t = toStamp(month);
  if (t === null) return "";
  const d = new Date(t);
  return fromStamp(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + delta, 1));
}

/** Week starts on Sunday in Arabic (as in Egypt) and Monday in English. */
export function weekStart(locale: DateLocale): number {
  return locale === "ar" ? 0 : 1;
}

/** Six rows of seven cells; "" marks a cell outside the month. */
export function monthGrid(month: string, locale: DateLocale): string[][] {
  const t = toStamp(month);
  if (t === null) return [];
  const first = new Date(t);
  const lead = (first.getUTCDay() - weekStart(locale) + 7) % 7;
  const days = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  const cells: string[] = [];
  for (let i = 0; i < lead; i++) cells.push("");
  for (let d = 1; d <= days; d++) cells.push(fromStamp(t + (d - 1) * DAY));
  while (cells.length % 7) cells.push("");
  const rows: string[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

export type RangeDraft = { checkin: string; checkout: string; picking: "checkin" | "checkout" };

/** What a click on `day` does to the draft range. */
export function pickDay(draft: RangeDraft, day: string): RangeDraft {
  if (draft.picking === "checkin" || !draft.checkin || day <= draft.checkin) {
    // A new arrival keeps a later departure, otherwise asks for one.
    const keep = draft.picking === "checkin" && draft.checkout > day ? draft.checkout : "";
    return { checkin: day, checkout: keep, picking: "checkout" };
  }
  return { checkin: draft.checkin, checkout: day, picking: "checkin" };
}

/** Western digits in both languages, so dates read the same everywhere on the site. */
function intlLocale(locale: DateLocale) {
  return locale === "ar" ? "ar-EG-u-nu-latn" : "en-GB";
}

function asDate(value: string) {
  const t = toStamp(value);
  return t === null ? null : new Date(t);
}

export function formatLong(value: string, locale: DateLocale): string {
  const d = asDate(value);
  return d ? new Intl.DateTimeFormat(intlLocale(locale),
    { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(d) : "";
}

export function formatShort(value: string, locale: DateLocale): string {
  const d = asDate(value);
  return d ? new Intl.DateTimeFormat(intlLocale(locale),
    { day: "numeric", month: "short", timeZone: "UTC" }).format(d) : "";
}

export function formatFull(value: string, locale: DateLocale): string {
  const d = asDate(value);
  return d ? new Intl.DateTimeFormat(intlLocale(locale),
    { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(d) : "";
}

export function formatMonth(month: string, locale: DateLocale): string {
  const d = asDate(month);
  return d ? new Intl.DateTimeFormat(intlLocale(locale),
    { month: "long", year: "numeric", timeZone: "UTC" }).format(d) : "";
}

export function weekdayLabels(locale: DateLocale): string[] {
  // 2023-01-01 was a Sunday.
  const f = new Intl.DateTimeFormat(intlLocale(locale),
    { weekday: locale === "ar" ? "narrow" : "short", timeZone: "UTC" });
  return Array.from({ length: 7 }, (_, i) =>
    f.format(new Date(Date.UTC(2023, 0, 1 + ((i + weekStart(locale)) % 7)))));
}

export function nightsLabel(n: number, locale: DateLocale): string {
  if (locale === "en") return `${n} ${n === 1 ? "night" : "nights"}`;
  if (n === 1) return "ليلة واحدة";
  if (n === 2) return "ليلتان";
  if (n >= 3 && n <= 10) return `${n} ليالٍ`;
  return `${n} ليلة`;
}

/** Same day of the month `delta` months away, clamped to that month's last day. */
export function shiftMonthDay(value: string, delta: number): string {
  const month = addMonths(monthOf(value), delta);
  const t = toStamp(month);
  if (t === null) return "";
  const d = new Date(t);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  return `${month.slice(0, 8)}${String(Math.min(Number(value.slice(8, 10)), last)).padStart(2, "0")}`;
}
