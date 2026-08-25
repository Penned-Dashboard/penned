"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientFolderAction } from "@/app/client/actions";
import { SectionCard } from "@/components/dashboard-shell";
import type { ClientFolder } from "@/lib/orders";

const PAGE_SIZE = 8;

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
  const router = useRouter();
  const [query, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedId, setSelectedId] = useState(folders[0]?.id ?? "");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return folders;
    }

    return folders.filter((folder) =>
      [
        folder.name,
        folder.toneGuide,
        folder.targetAudience,
        folder.brandNotes,
        folder.complianceNotes,
        folder.preferredContentTypes.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [folders, query]);

  const visibleFolders = filtered.slice(0, visibleCount);
  const selectedFolder = folders.find((folder) => folder.id === selectedId) ?? null;
  const showCreate = createMode || !folders.length;

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

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionCard
          title="Client folders"
          description="Search and select a folder to view brand notes, briefs, and delivery defaults. The list stays collapsed until you click."
        >
          <label>
            <span className="dashboard-label">Search folders</span>
            <input
              className="dashboard-input"
              onChange={(event) => {
                setSearch(event.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              placeholder="Search by client name, tone, or content type"
              value={query}
            />
          </label>

          {visibleFolders.length ? (
            <div className="mt-4 space-y-2">
              {visibleFolders.map((folder) => {
                const active = !showCreate && folder.id === selectedFolder?.id;
                return (
                  <button
                    className={`w-full rounded-[1.15rem] border px-4 py-4 text-left transition ${
                      active
                        ? "border-blue-300 bg-blue-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                    key={folder.id}
                    onClick={() => {
                      setSelectedId(folder.id);
                      router.replace("/client/folders", { scroll: false });
                    }}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{folder.name}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {folder.orderCount} linked order{folder.orderCount === 1 ? "" : "s"}
                          {folder.targetAudience ? ` · ${folder.targetAudience}` : ""}
                        </p>
                      </div>
                      <span className="text-sm text-slate-400">{active ? "Open" : "View"}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 rounded-[1.25rem] border border-dashed border-slate-200 bg-white/70 p-6 text-sm leading-7 text-slate-500">
              <p className="font-semibold text-slate-900">
                {query ? "No folders match this search" : "No client folders yet"}
              </p>
              <p className="mt-2">
                {query
                  ? "Try another client name or clear the search."
                  : "Create a folder for each end client so orders can inherit brand notes, templates, and compliance guidance."}
              </p>
            </div>
          )}

          {filtered.length > visibleCount ? (
            <button
              className="button-secondary mt-4"
              onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
              type="button"
            >
              Load more folders
            </button>
          ) : null}
        </SectionCard>

        {showCreate ? (
          <SectionCard
            title="Create a folder"
            description="Store reusable brief links, tone guidance, delivery defaults, and account context."
          >
            <CreateFolderForm />
          </SectionCard>
        ) : selectedFolder ? (
          <SectionCard
            title={selectedFolder.name}
            description="Folder details stay on the right so the client list can stay compact as the workspace grows."
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <p className="text-sm text-slate-500">
                {selectedFolder.orderCount} linked order{selectedFolder.orderCount === 1 ? "" : "s"}
              </p>
              {selectedFolder.briefTemplateUrl ? (
                <a
                  className="button-secondary"
                  href={selectedFolder.briefTemplateUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Open brief template
                </a>
              ) : null}
            </div>
            <dl className="mt-5 grid gap-3 md:grid-cols-2">
              <Info label="Tone guide" value={selectedFolder.toneGuide || "Not set"} />
              <Info label="Default word count" value={selectedFolder.defaultWordCount || "Not set"} />
              <Info label="Target audience" value={selectedFolder.targetAudience || "Not set"} />
              <Info label="Delivery preference" value={selectedFolder.deliveryPreference || "Not set"} />
              <Info
                label="Preferred content types"
                value={
                  selectedFolder.preferredContentTypes.length
                    ? selectedFolder.preferredContentTypes.join(", ")
                    : "Not set"
                }
              />
              <Info label="Compliance notes" value={selectedFolder.complianceNotes || "Not set"} />
            </dl>
            {selectedFolder.brandNotes ? (
              <div className="mt-4 rounded-[1rem] border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
                {selectedFolder.brandNotes}
              </div>
            ) : null}
            {selectedFolder.contentCalendarNotes ? (
              <div className="mt-3 rounded-[1rem] border border-dashed border-slate-200 bg-white p-4 text-sm leading-6 text-slate-500">
                Content calendar: {selectedFolder.contentCalendarNotes}
              </div>
            ) : null}
            <button
              className="button-secondary mt-5"
              onClick={() => router.replace("/client/folders?create=1", { scroll: false })}
              type="button"
            >
              Create another folder
            </button>
          </SectionCard>
        ) : null}
      </section>
    </div>
  );
}

function CreateFolderForm() {
  return (
    <form action={createClientFolderAction} className="grid gap-4">
      <Field label="Client name" name="name" placeholder="Acme Robotics" required />
      <Field label="Brief template link" name="briefTemplateUrl" placeholder="https://docs.google.com/..." />
      <label>
        <span className="dashboard-label">Preferred content types</span>
        <div className="grid gap-2 rounded-[1rem] border border-slate-200 bg-slate-50 p-4">
          {[
            "SEO Content",
            "Blog Post",
            "Article",
            "Technical Article",
            "Expert Writing / Thought Leadership",
            "Press Release",
          ].map((type) => (
            <label key={type} className="flex items-start gap-3 text-sm text-slate-700">
              <input className="mt-1" name="preferredContentTypes" type="checkbox" value={type} />
              <span>{type}</span>
            </label>
          ))}
        </div>
      </label>
      <Field label="Tone guide" name="toneGuide" placeholder="Clear, direct, and evidence-backed" />
      <Field label="Default word count" name="defaultWordCount" placeholder="1200" type="number" />
      <Field label="Target audience" name="targetAudience" placeholder="Technical buyers in mid-market SaaS" />
      <Field label="Delivery preference" name="deliveryPreference" placeholder="Google Doc + CMS-ready meta" />
      <Textarea
        label="Brand notes"
        name="brandNotes"
        placeholder="Voice, positioning, proof points, claims to avoid, and any evergreen brand guidance."
      />
      <Textarea
        label="Compliance notes"
        name="complianceNotes"
        placeholder="Forbidden claims, legal phrasing, regulated-industry cautions, or approval rules."
      />
      <Textarea
        label="Content calendar notes"
        name="contentCalendarNotes"
        placeholder="Upcoming launches, campaigns, or repeat monthly deliverables."
      />
      <button className="button-primary" type="submit">
        Create folder
      </button>
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
    <div className="rounded-[1rem] border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}
