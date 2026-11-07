"use client";

import { useMemo, useState } from "react";
import { createClientFolderAction } from "@/app/client/actions";
import { serviceCatalog } from "@/lib/content-catalog";
import type { ClientFolder } from "@/lib/orders";

const PAGE_SIZE = 12;

export function ClientFoldersWorkspace({
  folders,
  createMode,
  message,
  messageState,
}: {
  folders: ClientFolder[];
  createMode: boolean;
  message?: string;
  messageState?: string;
}) {
  const [query, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedId, setSelectedId] = useState(folders[0]?.id ?? "");
  const [showCreate, setShowCreate] = useState(createMode || !folders.length);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return folders;
    return folders.filter((folder) =>
      [folder.name, folder.toneGuide, folder.targetAudience, folder.brandNotes]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [folders, query]);

  const visibleFolders = filtered.slice(0, visibleCount);
  const selectedFolder = folders.find((folder) => folder.id === selectedId) ?? null;

  return (
    <div className="grid gap-4">
      {message ? (
        <div
          className={`rounded-[1.25rem] px-5 py-4 text-sm ${
            messageState === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {message}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="min-w-[16rem] flex-1">
          <span className="sr-only">Search clients</span>
          <input
            className="dashboard-input"
            onChange={(event) => {
              setSearch(event.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            placeholder="Search clients"
            value={query}
          />
        </label>
        <button
          className="button-primary"
          onClick={() => setShowCreate((open) => !open)}
          type="button"
        >
          {showCreate ? "Close form" : "Add a client"}
        </button>
      </div>

      {showCreate ? (
        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-950">Add a client</h2>
          <p className="mt-2 text-sm text-slate-500">
            Save their tone and defaults so every new order starts filled in.
          </p>
          <CreateFolderForm onCancel={() => setShowCreate(false)} />
        </section>
      ) : null}

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
        {visibleFolders.length ? (
          <div className="space-y-2">
            {visibleFolders.map((folder) => {
              const active = folder.id === selectedFolder?.id;
              return (
                <button
                  className={`w-full rounded-[1.15rem] border px-4 py-4 text-left transition ${
                    active ? "border-[#91B9D2] bg-[#F3F8FB]" : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                  key={folder.id}
                  onClick={() => setSelectedId(folder.id)}
                  type="button"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{folder.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {folder.orderCount} order{folder.orderCount === 1 ? "" : "s"}
                        {folder.toneGuide ? ` · ${folder.toneGuide}` : ""}
                      </p>
                    </div>
                    <span className="text-sm text-slate-400">{active ? "Selected" : "Open"}</span>
                  </div>
                  {active ? (
                    <dl className="mt-4 grid gap-3 border-t border-slate-100 pt-4 md:grid-cols-3">
                      <Info label="Tone" value={folder.toneGuide || "Not set"} />
                      <Info label="Default words" value={folder.defaultWordCount || "Not set"} />
                      <Info label="Audience" value={folder.targetAudience || "Not set"} />
                      {folder.preferredContentTypes.length ? (
                        <Info
                          label="Preferred types"
                          value={folder.preferredContentTypes.join(", ")}
                        />
                      ) : null}
                      {folder.brandNotes ? <Info label="Brand notes" value={folder.brandNotes} /> : null}
                      {folder.complianceNotes ? (
                        <Info label="Compliance" value={folder.complianceNotes} />
                      ) : null}
                    </dl>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[1.25rem] border border-dashed border-slate-200 p-6 text-sm text-slate-500">
            <p className="font-semibold text-slate-900">
              {query ? "No clients match this search" : "No clients yet"}
            </p>
            <p className="mt-2">
              {query ? "Try another name." : "Add your first client to reuse tone, audience and word-count defaults."}
            </p>
          </div>
        )}

        {filtered.length > visibleCount ? (
          <button
            className="button-secondary mt-4"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            type="button"
          >
            Load more
          </button>
        ) : null}
      </section>
    </div>
  );
}

function CreateFolderForm({ onCancel }: { onCancel: () => void }) {
  const [showMore, setShowMore] = useState(false);
  const preferredTypes = serviceCatalog.filter((service) => service.isOrderable).map((service) => service.name);

  return (
    <form action={createClientFolderAction} className="mt-6 grid gap-4">
      <Field label="Client name" name="name" placeholder="Acme Robotics" required />
      <Field label="Tone" name="toneGuide" placeholder="Clear, direct, and evidence-backed" />
      <Field label="Default word count" name="defaultWordCount" placeholder="1200" type="number" />

      <button
        className="justify-self-start text-sm font-semibold text-[var(--penned-navy)] underline"
        onClick={() => setShowMore((open) => !open)}
        type="button"
      >
        {showMore ? "Hide extra detail" : "Add more detail"}
      </button>

      {showMore ? (
        <div className="grid gap-4 rounded-[1.25rem] border border-slate-200 bg-slate-50/80 p-5">
          <Field label="Brief template link" name="briefTemplateUrl" placeholder="https://docs.google.com/..." />
          <Field label="Preferred writer (optional)" name="preferredWriter" placeholder="First name only" />
          <Field label="Target audience" name="targetAudience" placeholder="Technical buyers in mid-market SaaS" />
          <Field label="Delivery preference" name="deliveryPreference" placeholder="Google Doc" />
          <label>
            <span className="dashboard-label">Preferred content types</span>
            <div className="mt-2 grid gap-2 rounded-[1rem] border border-slate-200 bg-white p-4 md:grid-cols-2">
              {preferredTypes.map((type) => (
                <label key={type} className="flex items-start gap-3 text-sm text-slate-700">
                  <input className="mt-1" name="preferredContentTypes" type="checkbox" value={type} />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </label>
          <Textarea label="Brand notes" name="brandNotes" placeholder="Voice, claims to avoid, proof points." />
          <Textarea label="Compliance notes" name="complianceNotes" placeholder="Forbidden claims or approval rules." />
          <Textarea
            label="Content calendar notes"
            name="contentCalendarNotes"
            placeholder="Upcoming launches or repeat monthly deliverables."
          />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button className="button-primary" type="submit">
          Save client
        </button>
        <button className="button-secondary" onClick={onCancel} type="button">
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  placeholder,
  required = false,
  type = "text",
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label>
      <span className="dashboard-label">{label}</span>
      <input className="dashboard-input" name={name} placeholder={placeholder} required={required} type={type} />
    </label>
  );
}

function Textarea({
  label,
  name,
  placeholder,
}: {
  label: string;
  name: string;
  placeholder?: string;
}) {
  return (
    <label>
      <span className="dashboard-label">{label}</span>
      <textarea className="dashboard-input min-h-28" name={name} placeholder={placeholder} />
    </label>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-slate-200 bg-white p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}
