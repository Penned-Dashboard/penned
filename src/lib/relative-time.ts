/** "Just now", "5 min ago", "3 hr ago", "Yesterday", "12 Nov". */
export function relativeTime(iso: string, now: Date = new Date()) {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return "";
  const minutes = Math.floor((now.getTime() - then.getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  if (hours < 48) return "Yesterday";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(then);
}
