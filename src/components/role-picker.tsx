"use client";

import { useState } from "react";

export function RolePicker({ defaultRole }: { defaultRole: "client" | "writer" }) {
  const [role, setRole] = useState<"client" | "writer">(defaultRole);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label
        className={`cursor-pointer rounded-[1.25rem] border p-4 transition ${
          role === "client" ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white"
        }`}
      >
        <input
          checked={role === "client"}
          className="sr-only"
          name="role"
          onChange={() => setRole("client")}
          type="radio"
          value="client"
        />
        <p className="text-base font-semibold text-slate-950">I need content</p>
        <p className="mt-1 text-sm text-slate-500">Order and manage content</p>
      </label>
      <label
        className={`cursor-pointer rounded-[1.25rem] border p-4 transition ${
          role === "writer" ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white"
        }`}
      >
        <input
          checked={role === "writer"}
          className="sr-only"
          name="role"
          onChange={() => setRole("writer")}
          type="radio"
          value="writer"
        />
        <p className="text-base font-semibold text-slate-950">I write content</p>
        <p className="mt-1 text-sm text-slate-500">Find work and earn</p>
      </label>
    </div>
  );
}
