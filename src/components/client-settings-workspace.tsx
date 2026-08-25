"use client";

import { useState } from "react";
import { SectionCard } from "@/components/dashboard-shell";

const teamRoles = [
  {
    name: "Owner",
    detail: "Billing, users, all clients, and all orders",
  },
  {
    name: "Account manager",
    detail: "Create orders, approve spend, and view assigned clients",
  },
  {
    name: "Content manager",
    detail: "Create drafts, submit briefs, and request revisions",
  },
  {
    name: "Finance",
    detail: "View invoices, wallet, and statements only",
  },
  {
    name: "Viewer",
    detail: "Read-only access",
  },
];

const approvalRules = [
  {
    id: "spend",
    title: "Require approval over £250",
    detail: "Recommended for larger briefs or any order that crosses the spend threshold.",
  },
  {
    id: "new-folder",
    title: "Require approval for the first order under a new client folder",
    detail: "Helps senior team members confirm the initial setup before repeat work begins.",
  },
  {
    id: "wallet",
    title: "Require approval if wallet balance will fall below a set threshold",
    detail: "Protects prepaid budgets from accidental depletion.",
  },
  {
    id: "rush",
    title: "Require approval for rush fees",
    detail: "Useful when turnaround speed changes commercial expectations.",
  },
];

export function ClientSettingsWorkspace({
  fullName,
  email,
}: {
  fullName: string;
  email: string;
}) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Content manager");
  const [inviteMessage, setInviteMessage] = useState("");
  const [enabledRules, setEnabledRules] = useState<Record<string, boolean>>({
    spend: true,
    "new-folder": true,
    wallet: false,
    rush: true,
  });

  return (
    <>
      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <SectionCard
          title="Workspace profile"
          description="Core account details tied to your content operations workspace."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <InfoBlock label="Full name" value={fullName} />
            <InfoBlock label="Email" value={email} />
            <InfoBlock label="Role" value="Client" />
            <InfoBlock label="Default workflow" value="Order, review, approve" />
          </div>
        </SectionCard>

        <SectionCard
          title="Billing contact"
          description="Where invoices, payment notifications, and account terms are routed."
        >
          <div className="space-y-3">
            <PreferenceRow label="Primary billing contact" value={email} />
            <PreferenceRow label="VAT / tax records" value="Stored with invoice exports" />
            <PreferenceRow label="Payment terms" value="Prepaid unless Priority Account is approved" />
            <PreferenceRow label="Account owner" value={fullName} />
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionCard
          title="Invite a team member"
          description="Add colleagues with a role that matches how your agency actually works."
        >
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!inviteEmail.trim()) {
                setInviteMessage("Enter an email address before sending an invite.");
                return;
              }
              setInviteMessage(`Invite queued for ${inviteEmail} as ${inviteRole}.`);
              setInviteEmail("");
            }}
          >
            <label className="md:col-span-2">
              <span className="dashboard-label">Email address</span>
              <input
                className="dashboard-input"
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="teammate@agency.com"
                type="email"
                value={inviteEmail}
              />
            </label>
            <label>
              <span className="dashboard-label">Role</span>
              <select
                className="dashboard-input"
                onChange={(event) => setInviteRole(event.target.value)}
                value={inviteRole}
              >
                {teamRoles.map((role) => (
                  <option key={role.name} value={role.name}>
                    {role.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <button className="button-primary w-full" type="submit">
                Send invite
              </button>
            </div>
          </form>
          {inviteMessage ? <p className="mt-3 text-sm font-medium text-emerald-700">{inviteMessage}</p> : null}
          <div className="mt-5 space-y-3">
            {teamRoles.map((role) => (
              <div key={role.name} className="dashboard-list-row items-start">
                <p className="font-semibold text-slate-950">{role.name}</p>
                <p className="min-w-0 max-w-md text-right text-sm text-slate-500">{role.detail}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Approval rules"
          description="Use lightweight controls to prevent junior team members from submitting large or sensitive work unchecked."
        >
          <div className="space-y-3">
            {approvalRules.map((rule) => (
              <label key={rule.id} className="flex items-start gap-3 rounded-[1rem] border border-slate-200 bg-white p-4">
                <input
                  checked={Boolean(enabledRules[rule.id])}
                  className="mt-1"
                  onChange={(event) =>
                    setEnabledRules((current) => ({ ...current, [rule.id]: event.target.checked }))
                  }
                  type="checkbox"
                />
                <span>
                  <p className="font-semibold text-slate-950">{rule.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{rule.detail}</p>
                </span>
              </label>
            ))}
          </div>
        </SectionCard>
      </section>
    </>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[1.15rem] bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 break-all text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function PreferenceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-[1rem] border border-slate-200 bg-white p-4 sm:flex-row sm:items-start sm:justify-between">
      <p className="shrink-0 font-medium text-slate-700">{label}</p>
      <p className="min-w-0 break-all text-slate-500 sm:text-right">{value}</p>
    </div>
  );
}
