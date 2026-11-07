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
    portalSubtitle: "",
    accentClass: "from-[#17253F] to-[#91B9D2]",
    nav: [
      { label: "Dashboard", href: "/client" },
      { label: "New order", href: "/client/new-order" },
      { label: "Bulk orders", href: "/client/bulk-orders" },
      { label: "Orders", href: "/client/orders" },
      { label: "Client folders", href: "/client/folders" },
      { label: "Content budget", href: "/client/content-budget" },
      { label: "Billing", href: "/client/billing" },
      { label: "Settings", href: "/client/settings" },
      { label: "Help", href: "/client/help" },
    ],
  },
  writer: {
    portalTitle: "Penned",
    portalSubtitle: "Writer Portal",
    accentClass: "from-[#17253F] to-[#DDF479]",
    nav: [
      { label: "Dashboard", href: "/writer" },
      { label: "Assigned Jobs", href: "/writer/assigned" },
      { label: "Job Marketplace", href: "/writer/marketplace" },
      { label: "My Jobs", href: "/writer/jobs" },
      { label: "Rankings", href: "/writer/rankings" },
      { label: "Earnings", href: "/writer/earnings" },
      { label: "Settings", href: "/writer/settings" },
    ],
  },
  admin: {
    portalTitle: "Penned",
    portalSubtitle: "Admin Portal",
    accentClass: "from-[#17253F] to-[#91B9D2]",
    nav: [
      { label: "Dashboard", href: "/admin" },
      { label: "All Orders", href: "/admin/orders" },
      { label: "People", href: "/admin/people" },
      { label: "Payouts", href: "/admin#payouts" },
      { label: "Content Types", href: "/admin#content-types" },
      { label: "Security notes", href: "/security" },
      { label: "Settings", href: "/admin/settings" },
    ],
  },
};
