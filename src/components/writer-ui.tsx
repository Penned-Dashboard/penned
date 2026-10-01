import {
  COUNTDOWN_TONE_CLASSES,
  STATUS_TONE_CLASSES,
  formatCountdown,
  getCountdownTone,
  type WriterStatus,
} from "@/lib/writer-status";
import type { ReactNode } from "react";

export type NoticeParams = { notice?: string; noticeMessage?: string };

export function Notice({ notice, noticeMessage }: NoticeParams) {
  const message = noticeMessage?.trim();

  if (!message || (notice !== "success" && notice !== "error")) {
    return null;
  }

  return (
    <div
      className={`rounded-[1.25rem] border px-5 py-4 text-sm font-medium ${
        notice === "error"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
      role="status"
    >
      {message}
    </div>
  );
}

export function StatusBadge({ status }: { status: WriterStatus }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_TONE_CLASSES[status.tone]}`}
    >
      {status.label}
    </span>
  );
}

/** Green > 48h, amber 12-48h, red < 12h or overdue. Rendered on the server at request time. */
export function CountdownBadge({ dueDate }: { dueDate: string | null }) {
  const tone = getCountdownTone(dueDate);

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold ${COUNTDOWN_TONE_CLASSES[tone]}`}
      data-tone={tone}
    >
      {formatCountdown(dueDate)}
    </span>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-white/70 p-6 text-sm leading-7 text-slate-500">
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-2">{body}</p>
    </div>
  );
}

export function DataTable({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-separate border-spacing-y-2 text-left text-sm">
        <thead>
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="px-4 pb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <td
      className={`border-y border-slate-100 bg-white px-4 py-3 align-middle first:rounded-l-2xl first:border-l last:rounded-r-2xl last:border-r ${className}`}
    >
      {children}
    </td>
  );
}

export function MetricCard({
  label,
  value,
  hint,
  tone = "white",
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "white" | "orange" | "cyan" | "indigo" | "emerald";
}) {
  const toneClass = {
    white: "border-slate-200 bg-white",
    orange: "border-orange-200 bg-orange-50",
    cyan: "border-cyan-200 bg-cyan-50",
    indigo: "border-indigo-200 bg-indigo-50",
    emerald: "border-emerald-200 bg-emerald-50",
  }[tone];

  return (
    <article className={`rounded-[1.5rem] border p-5 ${toneClass}`}>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-slate-950">{value}</h2>
      <p className="mt-3 text-sm text-slate-500">{hint}</p>
    </article>
  );
}
