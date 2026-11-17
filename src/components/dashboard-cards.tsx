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
    <article className="flex flex-col gap-1 rounded-[20px] border border-[var(--line)] bg-white px-6 py-5">
      <p className="text-[14.5px] font-bold text-[var(--penned-navy)]">
        {label}
      </p>
      <h2 className="text-[40px] font-bold leading-[1.05] tracking-[-0.02em] tabular-nums text-[var(--penned-navy)]">
        {value}
      </h2>
      <p className="text-[14.5px] leading-6 text-[var(--ink-2)]">{hint}</p>
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
      className="rounded-[20px] border border-[var(--line)] bg-white p-[18px] md:p-6"
    >
      <div className="mb-4">
        <h2 className="text-[19px] font-bold tracking-[-0.015em] text-[var(--penned-navy)]">
          {title}
        </h2>
        {description.trim() ? (
          <p className="mt-1 max-w-2xl text-[14.5px] leading-6 text-[var(--ink-2)]">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
