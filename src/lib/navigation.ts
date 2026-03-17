import type { Role } from "@/lib/types";

export const roleMeta: Record<
  Role,
  {
    navLabel: string;
    kicker: string;
    eyebrowTone: string;
    pageTone: string;
  }
> = {
  client: {
    navLabel: "Client",
    kicker: "Client workspace",
    eyebrowTone: "text-orange-700",
    pageTone: "from-[#ffe2cf] via-[#fff6ef] to-[#f4efe8]",
  },
  writer: {
    navLabel: "Writer",
    kicker: "Writer workspace",
    eyebrowTone: "text-emerald-700",
    pageTone: "from-[#dff7eb] via-[#f2fff8] to-[#eef5f1]",
  },
  admin: {
    navLabel: "Admin",
    kicker: "Admin workspace",
    eyebrowTone: "text-sky-700",
    pageTone: "from-[#d9efff] via-[#f3faff] to-[#edf2f7]",
  },
};
