"use client";

import { useState } from "react";

/** Public signup is client-only; writers are invited and sign in. */
export function RolePicker({ defaultRole }: { defaultRole?: "client" | "writer" }) {
  const [role] = useState<"client">("client");
  void defaultRole;

  return (
    <div className="rounded-[1.25rem] border border-[var(--penned-navy)] bg-[rgba(145,185,210,0.18)] p-4">
      <input name="role" type="hidden" value={role} />
      <p className="text-base font-semibold text-slate-950">Client account</p>
      <p className="mt-1 text-sm text-slate-500">
        Order and manage content. Writers sign in with an invited account.
      </p>
    </div>
  );
}
