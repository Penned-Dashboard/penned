"use client";

import { useMemo, useState } from "react";
import { submitBulkOrdersAction } from "@/app/client/actions";
import { SectionCard } from "@/components/dashboard-cards";
import { serviceCatalog } from "@/lib/content-catalog";
import { calculateOrderPrice, formatUsdFromCents, writingTierFromDb } from "@/lib/pricing";
import type { ClientFolder, ContentTypeOption } from "@/lib/orders";

type BulkRow = {
  id: string;
  client: string;
  contentType: string;
  tier: "on-demand" | "signature" | "rank";
  title: string;
  briefLink: string;
  wordCount: string;
  language: string;
  keywords: string;
  industry: string;
  folderId: string;
  delivery: "standard" | "priority" | "rush";
};

const orderableServices = serviceCatalog.filter((service) => service.isOrderable);
/** Liam’s live template — clients should File → Make a copy. Price is calculated in the dashboard, never from a sheet price column. */
const GOOGLE_SHEET_TEMPLATE =
  "https://docs.google.com/spreadsheets/d/1gbRV6wFDnwAcYdX3HvDVcXqpaQfAXJ2nxE8v0NLeapc/copy";

function emptyRow(): BulkRow {
  return {
    id: crypto.randomUUID(),
    client: "",
    contentType: orderableServices[0]?.name ?? "Blog Post",
    tier: "on-demand",
    title: "",
    briefLink: "",
    wordCount: "1200",
    language: "English (UK)",
    keywords: "",
    industry: "",
    folderId: "",
    delivery: "standard",
  };
}

function dueLabel(delivery: BulkRow["delivery"]) {
  return delivery === "rush" ? "Within 48h of acceptance" : "Within 72h of acceptance";
}

function isFilledRow(row: BulkRow) {
  return Boolean(row.title.trim() || row.client.trim() || Number(row.wordCount));
}

export function BulkOrderWorkspace({
  contentTypes,
  folders,
  applyUkVat = false,
}: {
  contentTypes: ContentTypeOption[];
  folders: ClientFolder[];
  applyUkVat?: boolean;
}) {
  const [rows, setRows] = useState<BulkRow[]>([emptyRow(), emptyRow(), emptyRow()]);
  const [pasteValue, setPasteValue] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const [paymentSource, setPaymentSource] = useState("wallet");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  function updateRow(id: string, patch: Partial<BulkRow>) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  const filledRows = useMemo(() => rows.filter(isFilledRow), [rows]);
  const issues = useMemo(() => validateRows(filledRows, folders), [filledRows, folders]);
  const summary = useMemo(
    () => summarizeRows(filledRows, contentTypes, applyUkVat),
    [filledRows, contentTypes, applyUkVat],
  );
  const walletBalance = 3750;
  const remainingAfterBatch = Math.max(0, walletBalance - summary.estimatedTotal);

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
    setAttemptedSubmit(true);
    if (issues.length) {
      setMessage("Fix the flagged rows before submitting this batch.");
      return;
    }

    setPending(true);
    const result = await submitBulkOrdersAction({
      paymentSource,
      rows: filledRows.map((row) => ({
        client: row.client || "Unnamed client",
        contentType: row.contentType,
        tier: row.tier,
        title: row.title,
        wordCount: Number(row.wordCount),
        language: row.language,
        keywords: row.keywords,
        industry: row.industry,
        folderId: row.folderId,
        delivery: row.delivery,
        briefLink: row.briefLink,
      })),
    });
    setPending(false);
    setMessage(result.message);
  }

  return (
    <div className="grid gap-4">
      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title="Add your orders"
          description="Use our Google Sheet template, paste rows in, or add them one at a time."
        >
          <div className="flex flex-wrap gap-3">
            <a className="button-secondary" href={GOOGLE_SHEET_TEMPLATE} rel="noreferrer" target="_blank">
              Use our Google Sheet template
            </a>
            <button className="button-secondary" onClick={() => setRows((current) => [...current, emptyRow()])} type="button">
              Add row
            </button>
            <button className="button-secondary" onClick={() => setShowPaste((open) => !open)} type="button">
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
          <p className="mt-3 text-xs text-slate-500">
            Open the template, choose File → Make a copy, fill it in, then download as CSV or Excel and upload it here.
          </p>
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
            <Metric label="Estimated total" value={formatUsdFromCents(Math.round(summary.estimatedTotal * 100))} />
            <Metric label="Wallet deduction" value={formatUsdFromCents(Math.round(summary.estimatedTotal * 100))} />
            <Metric label="Remaining balance" value={formatUsdFromCents(Math.round(remainingAfterBatch * 100))} />
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Only rows with content are counted. Empty starter rows are ignored until you fill them in.
            {applyUkVat ? " Totals include 20% UK VAT." : ""} Prices are calculated in the dashboard — the Sheet price column is ignored.
          </p>
        </SectionCard>
      </section>

      <SectionCard
        title="Batch table"
        description="Missing fields are flagged when you submit. Client folder is optional. Specialist rows need keywords."
      >
        <div className="overflow-x-auto rounded-[1.25rem] border border-slate-200">
          <table className="min-w-[1280px] w-full border-collapse text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                {["Title", "Link to brief", "Content type", "Writing level", "Words", "Language", "Delivery", "Due", "Keywords", "Industry", "Client / Folder", ""].map((label) => (
                  <th className={`px-3 py-3 font-medium ${label === "Writing level" ? "min-w-[9rem]" : ""}`} key={label}>
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
                      onChange={(event) => updateRow(row.id, { title: event.target.value })}
                      value={row.title}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="dashboard-input"
                      onChange={(event) => updateRow(row.id, { briefLink: event.target.value })}
                      placeholder="https://"
                      value={row.briefLink}
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
                  <td className="min-w-[9rem] px-3 py-2">
                    <select
                      className="dashboard-input"
                      onChange={(event) => {
                        const value = event.target.value;
                        updateRow(row.id, {
                          tier:
                            value === "rank" ? "rank" : value === "signature" ? "signature" : "on-demand",
                        });
                      }}
                      value={row.tier}
                    >
                      <option value="on-demand">Standard</option>
                      <option value="signature">Signature</option>
                      <option value="rank">Specialist</option>
                    </select>
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
                    <select
                      className="dashboard-input"
                      onChange={(event) =>
                        updateRow(row.id, {
                          delivery:
                            event.target.value === "rush"
                              ? "rush"
                              : event.target.value === "priority"
                                ? "priority"
                                : "standard",
                        })
                      }
                      value={row.delivery}
                    >
                      <option value="standard">Standard</option>
                      <option value="priority">Priority</option>
                      <option value="rush">Rush</option>
                    </select>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-500">
                    {dueLabel(row.delivery)}
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="dashboard-input"
                      onChange={(event) => updateRow(row.id, { keywords: event.target.value })}
                      placeholder={row.tier === "rank" ? "Required" : "Optional"}
                      value={row.keywords}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="dashboard-input"
                      onChange={(event) => updateRow(row.id, { industry: event.target.value })}
                      placeholder={row.tier === "rank" ? "e.g. medical" : ""}
                      value={row.industry}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="grid gap-2">
                      <input
                        className="dashboard-input"
                        onChange={(event) => updateRow(row.id, { client: event.target.value })}
                        placeholder="Client name"
                        value={row.client}
                      />
                      <select
                        className="dashboard-input"
                        onChange={(event) => updateRow(row.id, { folderId: event.target.value })}
                        value={row.folderId}
                      >
                        <option value="">No folder</option>
                        {folders.map((folder) => (
                          <option key={folder.id} value={folder.id}>
                            {folder.name}
                          </option>
                        ))}
                      </select>
                    </div>
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

        {attemptedSubmit && issues.length ? (
          <div className="mt-4 rounded-[1.15rem] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
            <p className="font-semibold">Fix these before checkout</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </div>
        ) : null}
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
          <button className="button-primary" disabled={pending} onClick={() => void onSubmit()} type="button">
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
    if (!row.title.trim()) issues.push(`${label}: missing title.`);
    if (!row.briefLink.trim()) issues.push(`${label}: missing link to brief.`);
    if (!row.contentType.trim()) issues.push(`${label}: missing content type.`);
    if (!Number(row.wordCount)) issues.push(`${label}: missing word count.`);
    if (row.tier === "rank" && !row.keywords.trim()) {
      issues.push(`${label}: missing target keyword for Specialist.`);
    }
    if (row.tier === "rank" && !row.industry.trim()) {
      issues.push(`${label}: missing client's industry for Specialist.`);
    }
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

function summarizeRows(rows: BulkRow[], contentTypes: ContentTypeOption[], applyUkVat = false) {
  const totalOrders = rows.length;
  const totalWords = rows.reduce((sum, row) => sum + (Number(row.wordCount) || 0), 0);
  const standardCount = rows.filter((row) => row.tier === "on-demand").length;
  const signatureCount = rows.filter((row) => row.tier === "signature").length;
  const rankCount = rows.filter((row) => row.tier === "rank").length;
  const estimatedTotalCents = rows.reduce((sum, row) => {
    const service = contentTypes.find((type) => type.name === row.contentType);
    return (
      sum +
      calculateOrderPrice({
        words: Number(row.wordCount) || 0,
        tier: writingTierFromDb(row.tier),
        language: row.language,
        delivery: row.delivery,
        industry: row.industry,
        contentTypeKey: service?.key,
        applyUkVat,
      }).totalCents
    );
  }, 0);

  return {
    totalOrders,
    totalWords,
    estimatedTotal: estimatedTotalCents / 100,
    tierMix: `${standardCount} Standard, ${signatureCount} Signature, ${rankCount} Specialist`,
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
