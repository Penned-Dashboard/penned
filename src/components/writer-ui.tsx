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
      className={`rounded-[14px] border px-5 py-4 text-[14.5px] font-semibold ${
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
    <div className="rounded-[14px] border border-dashed border-[var(--line-2)] bg-[#fbfcfe] px-5 py-7 text-center text-[14.5px] leading-6 text-[var(--ink-2)]">
      <p className="text-base font-bold text-[var(--penned-navy)]">{title}</p>
      <p className="mt-1">{body}</p>
    </div>
  );
}

export function DataTable({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left text-[14.5px]">
        <thead>
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="whitespace-nowrap border-b border-[var(--line)] px-3 py-2.5 text-[11.5px] font-bold uppercase tracking-[0.1em] text-[var(--ink-3)]"
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
      className={`border-b border-[var(--line)] bg-white px-3 py-[15px] align-middle ${className}`}
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
    white: "border-[var(--line)] bg-white",
    orange: "border-[var(--line)] bg-white",
    cyan: "border-[var(--line)] bg-white",
    indigo: "border-[var(--line)] bg-white",
    emerald: "border-[var(--line)] bg-white",
  }[tone];

  return (
    <article className={`flex flex-col gap-1 rounded-[20px] border px-6 py-5 ${toneClass}`}>
      <p className="text-[14.5px] font-bold text-[var(--penned-navy)]">{label}</p>
      <h2 className="text-[40px] font-bold leading-[1.05] tracking-[-0.02em] tabular-nums text-[var(--penned-navy)]">{value}</h2>
      <p className="text-[14.5px] leading-6 text-[var(--ink-2)]">{hint}</p>
    </article>
  );
}
