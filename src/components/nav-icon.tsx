import type { ReactNode } from "react";

/**
 * Presentation only: the icon and the small group heading for each menu item.
 * The menu itself (labels, links, order) still comes from lib/navigation.ts.
 */

const stroke = {
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const SHAPES: Record<string, ReactNode> = {
  home: (
    <>
      <path d="M4 11.5 12 5l8 6.5V20H4z" {...stroke} />
      <path d="M10 20v-5h4v5" {...stroke} />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" {...stroke} />,
  layers: (
    <>
      <path d="m12 4 8 4-8 4-8-4z" {...stroke} />
      <path d="m4 12 8 4 8-4M4 16l8 4 8-4" {...stroke} />
    </>
  ),
  list: <path d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01" {...stroke} />,
  folder: <path d="M4 7h6l2 2h8v10H4z" {...stroke} />,
  wallet: (
    <>
      <path d="M4 7h14a2 2 0 0 1 2 2v9H4z" {...stroke} />
      <path d="M4 7V6a1 1 0 0 1 1-1h11M16 13.5h.01" {...stroke} />
    </>
  ),
  card: (
    <>
      <rect height="12" rx="2" width="17" x="3.5" y="6" {...stroke} />
      <path d="M3.5 10h17" {...stroke} />
    </>
  ),
  cog: (
    <>
      <circle cx="12" cy="12" r="3" {...stroke} />
      <path
        d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M6 18l1.6-1.6M16.4 7.6 18 6"
        {...stroke}
      />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="8.5" {...stroke} />
      <path d="M9.8 9.5a2.3 2.3 0 1 1 3.2 2.1c-.7.3-1 .8-1 1.6M12 16.5v.2" {...stroke} />
    </>
  ),
  inbox: (
    <>
      <path d="M4 13 6.5 6h11L20 13v6H4z" {...stroke} />
      <path d="M4 13h5a3 3 0 0 0 6 0h5" {...stroke} />
    </>
  ),
  flag: <path d="M6 20V5h11l-2 4 2 4H6" {...stroke} />,
  users: (
    <>
      <circle cx="9" cy="9" r="3.2" {...stroke} />
      <path
        d="M3.5 19c.6-3 2.7-4.5 5.5-4.5s4.9 1.5 5.5 4.5M16 6.2a3 3 0 0 1 0 5.6M17.5 14.8c1.7.6 2.7 2 3 4.2"
        {...stroke}
      />
    </>
  ),
  chat: <path d="M5 5.5h14v10H10.5l-4 3.5v-3.5H5z" {...stroke} />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" {...stroke} />,
  pen: (
    <>
      <path d="m4.5 19.5 1-4L16 5l3 3L8.5 18.5l-4 1Z" {...stroke} />
      <path d="m14 7 3 3" {...stroke} />
    </>
  ),
  star: <path d="m12 4 2.4 5 5.4.7-4 3.8 1 5.4L12 16.3 7.2 18.9l1-5.4-4-3.8 5.4-.7z" {...stroke} />,
  coin: (
    <>
      <circle cx="12" cy="12" r="8.5" {...stroke} />
      <path
        d="M12 7v10M14.5 9.5c-.5-.9-1.4-1.4-2.5-1.4-1.5 0-2.5.8-2.5 1.9 0 2.6 5.2 1.2 5.2 3.9 0 1.1-1.1 1.9-2.7 1.9-1.3 0-2.3-.6-2.8-1.600"
        {...stroke}
      />
    </>
  ),
  board: (
    <>
      <rect height="14" rx="1" width="4.5" x="4" y="5" {...stroke} />
      <rect height="9" rx="1" width="4.5" x="10" y="5" {...stroke} />
      <rect height="11" rx="1" width="4.5" x="16" y="5" {...stroke} />
    </>
  ),
  tag: (
    <>
      <path d="M4 4h7l9 9-7 7-9-9z" {...stroke} />
      <path d="M8 8h.01" {...stroke} />
    </>
  ),
  more: <path d="M5 12h.01M12 12h.01M19 12h.01" {...stroke} />,
  out: <path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9" {...stroke} />,
  search: (
    <>
      <circle cx="11" cy="11" r="6" {...stroke} />
      <path d="m16 16 4 4" {...stroke} />
    </>
  ),
};

/** Icon by the last part of the link, so a new menu item still gets a sensible default. */
const ICON_BY_SEGMENT: Record<string, string> = {
  "new-order": "plus",
  "bulk-orders": "layers",
  orders: "list",
  jobs: "list",
  folders: "folder",
  clients: "folder",
  "content-budget": "wallet",
  billing: "card",
  settings: "cog",
  help: "help",
  marketplace: "board",
  rankings: "star",
  earnings: "coin",
  payouts: "coin",
  briefs: "inbox",
  messages: "chat",
  flags: "flag",
  writers: "users",
  pricing: "tag",
  "my-edits": "pen",
  done: "check",
};

/** A small heading shown above the first item of each group. */
const GROUP_STARTS: Record<string, Record<string, string>> = {
  client: { folders: "Clients and money", settings: "Account" },
  writer: { rankings: "You" },
  editor: { earnings: "You" },
  "account-manager": { clients: "People", settings: "Account" },
  admin: { clients: "People", payouts: "Money", settings: "Account" },
};

function parts(href: string) {
  const path = href.split("?")[0].split("#")[0];
  const segments = path.split("/").filter(Boolean);
  return { workspace: segments[0] ?? "", last: segments.length > 1 ? segments[segments.length - 1] : "" };
}

export function navIconName(href: string) {
  const { workspace, last } = parts(href);
  if (!last) return workspace === "editor" ? "inbox" : "home";
  return ICON_BY_SEGMENT[last] ?? "list";
}

/** The group heading that starts at this item, or null. The first item starts "Work". */
export function navGroupHeading(href: string, index: number) {
  if (index === 0) return "Work";
  const { workspace, last } = parts(href);
  return GROUP_STARTS[workspace]?.[last] ?? null;
}

export function isNewOrderLink(href: string) {
  return parts(href).last === "new-order";
}

export function NavIcon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <svg aria-hidden="true" className="shrink-0" fill="none" height={size} viewBox="0 0 24 24" width={size}>
      {SHAPES[name] ?? SHAPES.list}
    </svg>
  );
}
