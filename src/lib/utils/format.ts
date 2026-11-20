/*
 * Date formatting for the interface. The locale is fixed to English because
 * the whole UI is in English
 */
const dateTime = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });
const dateOnly = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });
const timeOnly = new Intl.DateTimeFormat("en-US", { timeStyle: "short" });
const numbers = new Intl.NumberFormat("en-US");

/** "Nov 6, 2026, 9:05 AM" */
export function formatDateTime(iso: string) {
  return dateTime.format(new Date(iso));
}

/** "Nov 6, 2026" */
export function formatDate(iso: string) {
  return dateOnly.format(new Date(iso));
}

/** "9:05 AM" */
export function formatTime(iso: string) {
  return timeOnly.format(new Date(iso));
}

/** "1,234" */
export function formatNumber(value: number) {
  return numbers.format(value);
}
