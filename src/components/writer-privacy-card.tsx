"use client";

import { useState } from "react";

export function WriterPrivacyCard({
  firstName,
  avatarUrl,
  initiallyStarred = false,
}: {
  firstName: string;
  avatarUrl?: string | null;
  initiallyStarred?: boolean;
}) {
  const [starred, setStarred] = useState(initiallyStarred);
  const initial = firstName.trim().charAt(0).toUpperCase() || "W";

  return (
    <div className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div
          className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[var(--penned-navy)] text-sm font-semibold text-white select-none"
          onContextMenu={(event) => event.preventDefault()}
          onDragStart={(event) => event.preventDefault()}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              className="pointer-events-none h-full w-full object-cover"
              draggable={false}
              src={avatarUrl}
            />
          ) : (
            initial
          )}
        </div>
        <div>
          <p className="text-sm text-slate-500">Writer</p>
          <p className="font-semibold text-slate-950">{firstName}</p>
        </div>
      </div>
      <button
        aria-label={starred ? `Unstar ${firstName}` : `Star ${firstName}`}
        className={`rounded-full px-3 py-2 text-sm font-semibold ${
          starred ? "bg-[#DDF479] text-[var(--penned-navy)]" : "border border-slate-200 text-slate-600"
        }`}
        onClick={() => setStarred((value) => !value)}
        type="button"
      >
        {starred ? "★ Starred" : "☆ Star"}
      </button>
    </div>
  );
}
