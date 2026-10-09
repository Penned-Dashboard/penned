import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <article className="rounded-[1.5rem] border border-[rgba(23,37,63,0.1)] bg-white p-5 shadow-[0_18px_40px_rgba(23,37,63,0.04)]">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
        {label}
      </p>
      <h2 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-[var(--penned-navy)]">
        {value}
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">{hint}</p>
    </article>
  );
}

export function SectionCard({
  title,
  description,
  children,
  id,
}: {
  title: string;
  description: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section
      id={id}
      className="rounded-[1.75rem] border border-[rgba(23,37,63,0.1)] bg-white p-5 shadow-[0_18px_40px_rgba(23,37,63,0.04)] md:p-6"
    >
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
          Section
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--penned-navy)]">
          {title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}
