import type { Role } from "@/lib/types";

export const roleMeta: Record<
  Role,
  {
    portalTitle: string;
    portalSubtitle: string;
    accentClass: string;
    nav: { label: string; href: string }[];
  }
> = {
  client: {
    portalTitle: "Penned",
    portalSubtitle: "Content Ops Engine",
    accentClass: "from-blue-600 to-cyan-400",
    nav: [
      { label: "Dashboard", href: "/client" },
      { label: "New Order", href: "/client/new-order" },
      { label: "Bulk Orders", href: "/client/bulk-orders" },
      { label: "All Orders", href: "/client/orders" },
      { label: "Completed Orders", href: "/client/orders?view=completed" },
      { label: "Client Folders", href: "/client/folders" },
      { label: "Billing", href: "/client/billing" },
      { label: "Settings", href: "/client/settings" },
    ],
  },
  writer: {
    portalTitle: "Penned",
    portalSubtitle: "Writer Portal",
    accentClass: "from-blue-600 to-emerald-400",
    nav: [
      { label: "Dashboard", href: "/writer" },
      { label: "Job Marketplace", href: "/writer#job-marketplace" },
      { label: "My Jobs", href: "/writer#my-jobs" },
      { label: "Earnings", href: "/writer#earnings" },
      { label: "Rankings", href: "/writer#rankings" },
      { label: "Settings", href: "/writer/settings" },
    ],
  },
  admin: {
    portalTitle: "Penned",
    portalSubtitle: "Admin Portal",
    accentClass: "from-blue-600 to-sky-400",
    nav: [
      { label: "Dashboard", href: "/admin" },
      { label: "Orders", href: "/admin#operations" },
      { label: "Payouts", href: "/admin#payouts" },
      { label: "Content Types", href: "/admin#content-types" },
      { label: "Security", href: "/security" },
      { label: "Settings", href: "/admin/settings" },
    ],
  },
};
