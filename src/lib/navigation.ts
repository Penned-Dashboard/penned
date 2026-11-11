import type { Role } from "@/lib/types";
import { rolePath } from "@/lib/types";

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
    portalSubtitle: "Writer",
    accentClass: "from-[#17253F] to-[#DDF479]",
    nav: [
      { label: "Dashboard", href: "/writer" },
      { label: "My jobs", href: "/writer/jobs" },
      { label: "Job board", href: "/writer/marketplace" },
      { label: "My standing", href: "/writer/rankings" },
      { label: "Earnings", href: "/writer/earnings" },
      { label: "Settings", href: "/writer/settings" },
    ],
  },
  admin: {
    portalTitle: "Penned",
    portalSubtitle: "Admin",
    accentClass: "from-[#17253F] to-[#91B9D2]",
    nav: [
      { label: "Dashboard", href: "/admin" },
      { label: "Orders", href: "/admin/orders" },
      { label: "Messages", href: "/admin/messages" },
      { label: "Flags", href: "/admin/flags" },
      { label: "Clients", href: "/admin/clients" },
      { label: "Writers", href: "/admin/writers" },
      { label: "Payouts", href: "/admin/payouts" },
      { label: "Pricing & services", href: "/admin/pricing" },
      { label: "Settings", href: "/admin/settings" },
    ],
  },
  account_manager: {
    portalTitle: "Penned",
    portalSubtitle: "Account Manager",
    accentClass: "from-[#17253F] to-[#91B9D2]",
    nav: [
      { label: "Today", href: rolePath("account_manager") },
      { label: "Briefs to check", href: `${rolePath("account_manager")}/briefs` },
      { label: "Messages", href: `${rolePath("account_manager")}/messages` },
      { label: "Flags", href: `${rolePath("account_manager")}/flags` },
      { label: "Orders", href: `${rolePath("account_manager")}/orders` },
      { label: "My clients", href: `${rolePath("account_manager")}/clients` },
      { label: "Writers", href: `${rolePath("account_manager")}/writers` },
      { label: "Settings", href: `${rolePath("account_manager")}/settings` },
    ],
  },
  editor: {
    portalTitle: "Penned",
    portalSubtitle: "Editor",
    accentClass: "from-[#17253F] to-[#91B9D2]",
    nav: [
      { label: "Edit queue", href: "/editor" },
      { label: "My edits", href: "/editor/my-edits" },
      { label: "Done", href: "/editor/done" },
      { label: "Earnings", href: "/editor/earnings" },
      { label: "Settings", href: "/editor/settings" },
    ],
  },
};
