/**
 * How notifications are shown: which icon and colour each kind gets, how a run
 * of similar unread items is folded into one line in the bell, and the time
 * headings on the notifications page. Display only: nothing here reads or
 * writes the database.
 */

export type NotificationIconName =
  | "draft"
  | "clock"
  | "alert"
  | "comment"
  | "money"
  | "order"
  | "person"
  | "check"
  | "pen"
  | "cancel"
  | "bell";

/** calm = for information or a normal next step; good = good news; urgent = time matters. */
export type NotificationTone = "calm" | "good" | "urgent";

type Look = { icon: NotificationIconName; tone: NotificationTone };

const LOOKS: Record<string, Look> = {
  new_client: { icon: "person", tone: "calm" },
  new_order: { icon: "order", tone: "calm" },
  edit_ready: { icon: "pen", tone: "calm" },
  draft_ready: { icon: "draft", tone: "calm" },
  sent_back: { icon: "pen", tone: "urgent" },
  changes_requested: { icon: "pen", tone: "urgent" },
  changes_requested_team: { icon: "pen", tone: "urgent" },
  approved: { icon: "check", tone: "good" },
  brief_accepted: { icon: "check", tone: "good" },
  assigned: { icon: "order", tone: "calm" },
  cancelled: { icon: "cancel", tone: "urgent" },
  comment: { icon: "comment", tone: "calm" },
  payout_requested: { icon: "money", tone: "calm" },
  payout: { icon: "money", tone: "good" },
  deadline: { icon: "clock", tone: "urgent" },
  overdue: { icon: "alert", tone: "urgent" },
  // Team alerts from the scheduler (the kind is the first part of its key).
  brief_unchecked: { icon: "clock", tone: "urgent" },
  unclaimed: { icon: "alert", tone: "urgent" },
  writer_missed: { icon: "alert", tone: "urgent" },
  at_risk: { icon: "alert", tone: "urgent" },
  client_missed: { icon: "alert", tone: "urgent" },
  editor_waiting_team: { icon: "clock", tone: "urgent" },
};

/** Unknown kinds get a plain bell, so a new kind never breaks the list. */
export function notificationLook(kind: string): Look {
  return LOOKS[kind] ?? { icon: "bell", tone: "calm" };
}

/**
 * Kinds that can pile up (a bulk order produces one per piece). Deadline and
 * overdue alerts are never folded: each one matters on its own.
 */
const GROUP_TITLES: Record<string, (count: number) => string> = {
  draft_ready: (n) => `${n} drafts ready to review`,
  edit_ready: (n) => `${n} drafts ready to edit`,
  comment: (n) => `${n} new comments`,
  assigned: (n) => `${n} new assignments`,
  new_order: (n) => `${n} new orders to check`,
  brief_accepted: (n) => `${n} briefs accepted`,
  approved: (n) => `${n} pieces approved`,
  changes_requested: (n) => `${n} revision requests`,
  changes_requested_team: (n) => `${n} revision requests`,
  cancelled: (n) => `${n} orders cancelled`,
};

/** Fold when at least this many unread items share a kind. */
export const GROUP_AT = 3;

export const UNREAD_PAGE = "/notifications?show=unread";

type Showable = {
  id: string;
  title: string;
  body: string;
  href: string;
  kind: string;
  createdAt: string;
  read: boolean;
};

export type PanelEntry = Showable & {
  /** Set when this line stands for several unread notifications of one kind. */
  count?: number;
};

/** "Draft ready to review: Spring guide" -> "Spring guide". */
function subjectOf(title: string) {
  const colon = title.indexOf(": ");
  if (colon > -1) return title.slice(colon + 2).trim();
  const on = title.indexOf(" on ");
  if (on > -1) return title.slice(on + 4).trim();
  return title.trim();
}

function summarise(titles: string[]) {
  const names = titles.map(subjectOf).filter(Boolean);
  if (names.length <= 2) return names.join(" and ");
  const rest = names.length - 2;
  return `${names[0]}, ${names[1]} and ${rest} more`;
}

/**
 * The bell's short list. `items` are newest first. Three or more unread items
 * of the same kind become one line that opens the unread list, placed where the
 * newest of them was. Everything else is shown as it is.
 */
export function groupForPanel<T extends Showable>(items: T[], max = 8): PanelEntry[] {
  const unreadByKind = new Map<string, T[]>();
  for (const item of items) {
    if (item.read || !GROUP_TITLES[item.kind]) continue;
    unreadByKind.set(item.kind, [...(unreadByKind.get(item.kind) ?? []), item]);
  }

  const done = new Set<string>();
  const entries: PanelEntry[] = [];
  for (const item of items) {
    const group = item.read ? undefined : unreadByKind.get(item.kind);
    if (group && group.length >= GROUP_AT) {
      if (done.has(item.kind)) continue;
      done.add(item.kind);
      entries.push({
        id: `group:${item.kind}`,
        title: GROUP_TITLES[item.kind](group.length),
        body: summarise(group.map((member) => member.title)),
        href: UNREAD_PAGE,
        kind: item.kind,
        createdAt: item.createdAt,
        read: false,
        count: group.length,
      });
    } else {
      entries.push(item);
    }
    if (entries.length >= max) break;
  }
  return entries;
}

const HOUR_MS = 60 * 60 * 1000;

/**
 * "Last 24 hours", "This week" or "Older". Counted back from now rather than
 * by calendar day, so it reads the same in every time zone.
 */
export function dayHeading(iso: string, now: Date = new Date()) {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return "Older";
  const age = now.getTime() - then.getTime();
  if (age < 24 * HOUR_MS) return "Last 24 hours";
  if (age < 7 * 24 * HOUR_MS) return "This week";
  return "Older";
}

/** Splits a newest-first list into day sections, keeping the order. */
export function groupByDay<T extends { createdAt: string }>(items: T[], now: Date = new Date()) {
  const sections: { heading: string; items: T[] }[] = [];
  for (const item of items) {
    const heading = dayHeading(item.createdAt, now);
    const last = sections[sections.length - 1];
    if (last && last.heading === heading) last.items.push(item);
    else sections.push({ heading, items: [item] });
  }
  return sections;
}
