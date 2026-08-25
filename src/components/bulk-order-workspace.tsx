"use client";

import { useMemo, useState } from "react";
import { submitBulkOrdersAction } from "@/app/client/actions";
import { SectionCard } from "@/components/dashboard-shell";
import { RANK_RATE_CENTS, serviceCatalog } from "@/lib/content-catalog";
import type { ClientFolder, ContentTypeOption } from "@/lib/orders";

type BulkRow = {
  id: string;
  client: string;
  contentType: string;
  tier: "on-demand" | "rank";
  title: string;
  wordCount: string;
  language: string;
  keywords: string;
  folderId: string;
};

const orderableServices = serviceCatalog.filter((service) => service.isOrderable);

function emptyRow(): BulkRow {
  return {
    id: crypto.randomUUID(),
    client: "",
    contentType: orderableServices[0]?.name ?? "Blog Post",
    tier: "on-demand",
    title: "",
    wordCount: "1200",
    language: "English",
    keywords: "",
    folderId: "",
  };
}

export function BulkOrderWorkspace({
  contentTypes,
  folders,
}: {
  contentTypes: ContentTypeOption[];
  folders: ClientFolder[];
}) {
  const [rows, setRows] = useState<BulkRow[]>([emptyRow(), emptyRow(), emptyRow()]);
  const [pasteValue, setPasteValue] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const [paymentSource, setPaymentSource] = useState("wallet");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  function updateRow(id: string, patch: Partial<BulkRow>) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  const issues = useMemo(() => validateRows(rows, folders), [rows, folders]);
  const summary = useMemo(() => summarizeRows(rows, contentTypes), [rows, contentTypes]);

  async function importDelimited(text: string) {
    const parsed = parseDelimited(text);
    if (!parsed.length) {
      setMessage("No rows found to import.");
      return;
    }

    setRows(parsed.map((row) => ({ ...emptyRow(), ...row })));
    setShowPaste(false);
    setPasteValue("");
    setMessage(`${parsed.length} rows imported. Review validation before checkout.`);
  }

  async function onUpload(file: File) {
    const text = await file.text();
    await importDelimited(text);
  }

  async function onSubmit() {
    if (issues.length) {
      setMessage("Fix the flagged rows before submitting this batch.");
      return;
    }

    setPending(true);
    const result = await submitBulkOrdersAction({
      paymentSource,
      rows: rows.map((row) => ({
        client: row.client,
        contentType: row.contentType,
        tier: row.tier,
        title: row.title,
        wordCount: Number(row.wordCount),
        language: row.language,
        keywords: row.keywords,
        folderId: row.folderId,
      })),
    });
    setPending(false);
    setMessage(result.message);
  }

  return (
    <div className="grid gap-4">
      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title="Add rows"
          description="Build a batch manually, paste from Google Sheets, or upload a CSV / Excel export."
        >
          <div className="flex flex-wrap gap-3">
            <button className="button-secondary" onClick={() => setRows((current) => [...current, emptyRow()])} type="button">
              Add row
            </button>
            <button className="button-primary" onClick={() => setShowPaste((open) => !open)} type="button">
              Paste from Google Sheets
            </button>
            <label className="button-secondary cursor-pointer">
              Upload CSV / Excel
              <input
                accept=".csv,.tsv,.txt,application/vnd.ms-excel,text/csv"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void onUpload(file);
                  }
                }}
                type="file"
              />
            </label>
          </div>
          {showPaste ? (
            <div className="mt-4 grid gap-3">
              <textarea
                className="dashboard-input min-h-36 font-mono text-sm"
                onChange={(event) => setPasteValue(event.target.value)}
                placeholder="Paste rows copied from Google Sheets. Headers can be included."
                value={pasteValue}
              />
              <button className="button-primary self-start" onClick={() => void importDelimited(pasteValue)} type="button">
                Import pasted rows
              </button>
            </div>
          ) : null}
        </SectionCard>

        <SectionCard
          title="Price preview"
          description="Agencies need commercial visibility before committing the batch."
        >
          <div className="grid gap-3 md:grid-cols-2">
            <Metric label="Total orders" value={String(summary.totalOrders)} />
            <Metric label="Total words" value={summary.totalWords.toLocaleString()} />
            <Metric label="Tier mix" value={summary.tierMix} />
            <Metric label="Estimated total" value={`$${summary.estimatedTotal.toLocaleString()}`} />
            <Metric label="Wallet deduction" value={`$${summary.estimatedTotal.toLocaleString()}`} />
            <Metric label="Remaining balance" value="$3,750" />
          </div>
        </SectionCard>
      </section>

      <SectionCard
        title="Batch table"
        description="Missing fields are flagged before checkout. Duplicate titles, missing folders, and Rank keyword gaps are checked here."
      >
        <div className="overflow-x-auto rounded-[1.25rem] border border-slate-200">
          <table className="min-w-[1100px] w-full border-collapse text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                {["Client", "Content type", "Tier", "Title", "Words", "Language", "Keywords", "Folder", ""].map((label) => (
                  <th className="px-3 py-3 font-medium" key={label}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr className="border-t border-slate-200" key={row.id}>
                  <td className="px-3 py-2">
                    <input
                      className="dashboard-input"
                      onChange={(event) => updateRow(row.id, { client: event.target.value })}
                      value={row.client}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      className="dashboard-input"
                      onChange={(event) => updateRow(row.id, { contentType: event.target.value })}
                      value={row.contentType}
                    >
                      {orderableServices.map((service) => (
                        <option key={service.key} value={service.name}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      className="dashboard-input"
                      onChange={(event) =>
                        updateRow(row.id, { tier: event.target.value === "rank" ? "rank" : "on-demand" })
                      }
                      value={row.tier}
                    >
                      <option value="on-demand">On-demand</option>
                      <option value="rank">Rank</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="dashboard-input"
                      onChange={(event) => updateRow(row.id, { title: event.target.value })}
                      value={row.title}
                    />
                  </td>
                  <td className="w-28 px-3 py-2">
                    <input
                      className="dashboard-input"
                      onChange={(event) => updateRow(row.id, { wordCount: event.target.value })}
                      type="number"
                      value={row.wordCount}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="dashboard-input"
                      onChange={(event) => updateRow(row.id, { language: event.target.value })}
                      value={row.language}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="dashboard-input"
                      onChange={(event) => updateRow(row.id, { keywords: event.target.value })}
                      value={row.keywords}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      className="dashboard-input"
                      onChange={(event) => updateRow(row.id, { folderId: event.target.value })}
                      value={row.folderId}
                    >
                      <option value="">Select folder</option>
                      {folders.map((folder) => (
                        <option key={folder.id} value={folder.id}>
                          {folder.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      className="text-sm font-medium text-rose-600"
                      onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))}
                      type="button"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {issues.length ? (
          <div className="mt-4 rounded-[1.15rem] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
            <p className="font-semibold">Validation before checkout</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-4 text-sm text-emerald-700">All rows look ready for batch checkout.</p>
        )}
      </SectionCard>

      <SectionCard
        title="Choose payment source"
        description="Use wallet balance, card, invoice allowance, or split the remainder after the wallet is applied."
      >
        <div className="grid gap-3 md:grid-cols-2">
          {[
            ["wallet", "Wallet balance"],
            ["card", "Card"],
            ["invoice", "Invoice allowance, if approved"],
            ["split", "Split payment: remaining wallet, then card"],
            ["approval", "Request approval from account owner"],
          ].map(([value, label]) => (
            <label key={value} className="flex items-center gap-3 rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
              <input
                checked={paymentSource === value}
                name="paymentSource"
                onChange={() => setPaymentSource(value)}
                type="radio"
                value={value}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-2xl text-sm leading-6 text-slate-500">
            Submitting creates individual orders under one parent batch ID so Penned can produce item by item while the agency tracks the batch as one submission.
          </p>
          <button className="button-primary" disabled={pending || Boolean(issues.length)} onClick={() => void onSubmit()} type="button">
            {pending ? "Submitting batch..." : "Submit batch"}
          </button>
        </div>
        {message ? <p className="mt-4 text-sm font-medium text-slate-700">{message}</p> : null}
      </SectionCard>
    </div>
  );
}

function validateRows(rows: BulkRow[], folders: ClientFolder[]) {
  const issues: string[] = [];
  const titles = new Map<string, number>();

  rows.forEach((row, index) => {
    const label = `Row ${index + 1}`;
    if (!row.client.trim()) issues.push(`${label}: missing client.`);
    if (!row.contentType.trim()) issues.push(`${label}: missing content type.`);
    if (!row.title.trim()) issues.push(`${label}: missing title.`);
    if (!Number(row.wordCount)) issues.push(`${label}: missing word count.`);
    if (row.tier === "rank" && !row.keywords.trim()) issues.push(`${label}: missing target keyword for Rank.`);
    if (!row.folderId) issues.push(`${label}: missing client folder.`);
    if (row.folderId && !folders.some((folder) => folder.id === row.folderId)) {
      issues.push(`${label}: unknown client folder.`);
    }
    const titleKey = row.title.trim().toLowerCase();
    if (titleKey) {
      titles.set(titleKey, (titles.get(titleKey) ?? 0) + 1);
    }
  });

  for (const [title, count] of titles.entries()) {
    if (count > 1) {
      issues.push(`Duplicate title: ${title}`);
    }
  }

  return issues;
}

function summarizeRows(rows: BulkRow[], contentTypes: ContentTypeOption[]) {
  const totalOrders = rows.length;
  const totalWords = rows.reduce((sum, row) => sum + (Number(row.wordCount) || 0), 0);
  const rankCount = rows.filter((row) => row.tier === "rank").length;
  const estimatedTotal = rows.reduce((sum, row) => {
    const service = contentTypes.find((type) => type.name === row.contentType);
    const rate = (service?.basePriceCents ?? 5) + (row.tier === "rank" ? RANK_RATE_CENTS : 0);
    return sum + ((Number(row.wordCount) || 0) * rate) / 100;
  }, 0);

  return {
    totalOrders,
    totalWords,
    estimatedTotal,
    tierMix: `${totalOrders - rankCount} On-demand, ${rankCount} Rank`,
  };
}

function parseDelimited(text: string): Partial<BulkRow>[] {
  const lines = text
    .trim()
    .split(/\r?\n/)
    .map((line) => line.split(/\t|,/).map((cell) => cell.trim().replace(/^"|"$/g, "")))
    .filter((line) => line.some(Boolean));

  if (!lines.length) {
    return [];
  }

  const header = lines[0].map((cell) => cell.toLowerCase());
  const hasHeader = header.some((cell) =>
    ["client", "title", "content type", "word count", "language", "tier"].includes(cell),
  );
  const body = hasHeader ? lines.slice(1) : lines;
  const indexFor = (names: string[]) => header.findIndex((cell) => names.includes(cell));

  return body.map((cells) => {
    const pick = (names: string[], fallbackIndex: number) =>
      hasHeader && indexFor(names) >= 0 ? cells[indexFor(names)] ?? "" : cells[fallbackIndex] ?? "";

    return {
      client: pick(["client", "client name"], 0),
      contentType: pick(["content type", "service"], 1) || orderableServices[0]?.name,
      tier: pick(["tier"], 2).toLowerCase().includes("rank") ? "rank" : "on-demand",
      title: pick(["title", "topic"], 3),
      wordCount: pick(["word count", "words"], 4) || "1200",
      language: pick(["language"], 5) || "English",
      keywords: pick(["keywords", "keyword"], 6),
    } satisfies Partial<BulkRow>;
  });
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}
