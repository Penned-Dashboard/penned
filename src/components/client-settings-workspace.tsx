"use client";

import { useState } from "react";
import { updateClientBillingAction } from "@/app/client/actions";
import { SectionCard } from "@/components/dashboard-cards";

const teamRoles = [
  {
    name: "Owner",
    detail: "Billing, users, all clients, and all orders",
  },
  {
    name: "Manager",
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

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "pending";
};

export function ClientSettingsWorkspace({
  fullName,
  email,
  isUkCompany = false,
  billingCountry = "",
  vatNumber = "",
  billingNotice,
}: {
  fullName: string;
  email: string;
  isUkCompany?: boolean;
  billingCountry?: string;
  vatNumber?: string;
  billingNotice?: string | null;
}) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Content manager");
  const [inviteMessage, setInviteMessage] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [walletThreshold, setWalletThreshold] = useState("500");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [ukCompany, setUkCompany] = useState(isUkCompany);
  const [team, setTeam] = useState<TeamMember[]>([
    { id: "owner", name: fullName, email, role: "Owner", status: "active" },
  ]);
  const [enabledRules, setEnabledRules] = useState<Record<string, boolean>>({
    spend: true,
    "new-folder": true,
    wallet: false,
    rush: true,
  });
  const selectedRole = teamRoles.find((role) => role.name === inviteRole) ?? teamRoles[0];

  return (
    <>
      <SectionCard title="Workspace details" description="Profile shown in the top bar across the dashboard.">
        <div className="grid gap-4 md:grid-cols-[120px_1fr]">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-[var(--penned-navy)] text-xl font-semibold text-white">
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="" className="h-full w-full object-cover" src={avatarPreview} />
            ) : (
              fullName
                .split(" ")
                .map((part) => part[0])
                .filter(Boolean)
                .slice(0, 2)
                .join("")
                .toUpperCase()
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <InfoBlock label="Full name" value={fullName} />
            <InfoBlock label="Email" value={email} />
            <label className="md:col-span-2">
              <span className="dashboard-label">Profile picture</span>
              <input
                accept="image/*"
                className="dashboard-input"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => setAvatarPreview(String(reader.result ?? ""));
                  reader.readAsDataURL(file);
                  setSavedMessage("Profile picture ready. It will show in the top bar on your next save.");
                }}
                type="file"
              />
            </label>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        description="UK companies are charged 20% VAT on content writing bills."
        title="Billing country & VAT"
      >
        <form action={updateClientBillingAction} className="grid gap-4 md:grid-cols-2">
          <label className="flex items-start gap-3 md:col-span-2">
            <input
              checked={ukCompany}
              className="mt-1"
              name="isUkCompany"
              onChange={(event) => setUkCompany(event.target.checked)}
              type="checkbox"
            />
            <span className="text-sm text-slate-600">
              This is a UK company. Content writing bills include 20% UK VAT on top.
            </span>
          </label>
          <label>
            <span className="dashboard-label">Billing country</span>
            <input
              className="dashboard-input"
              defaultValue={billingCountry || (ukCompany ? "United Kingdom" : "")}
              name="billingCountry"
              placeholder="United Kingdom"
              type="text"
            />
          </label>
          <label>
            <span className="dashboard-label">VAT number (optional)</span>
            <input
              className="dashboard-input"
              defaultValue={vatNumber}
              name="vatNumber"
              placeholder="GB123456789"
              type="text"
            />
          </label>
          <button className="button-primary md:col-span-2 md:w-fit" type="submit">
            Save billing details
          </button>
        </form>
        {billingNotice ? <p className="mt-3 text-sm font-medium text-emerald-700">{billingNotice}</p> : null}
      </SectionCard>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionCard title="Team" description="Invite colleagues and manage pending invites.">
          <div className="space-y-3">
            {team.map((member) => (
              <div key={member.id} className="dashboard-list-row">
                <div>
                  <p className="font-semibold text-slate-950">{member.name}</p>
                  <p className="text-sm text-slate-500">
                    {member.email} · {member.role}
                  </p>
                </div>
                {member.status === "pending" ? (
                  <div className="flex gap-2">
                    <span className="dashboard-pill">Invite sent</span>
                    <button
                      className="button-secondary"
                      onClick={() => setInviteMessage(`Invite resent to ${member.email}.`)}
                      type="button"
                    >
                      Resend
                    </button>
                    <button
                      className="button-secondary"
                      onClick={() => setTeam((current) => current.filter((item) => item.id !== member.id))}
                      type="button"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <span className="text-sm text-slate-500">Active</span>
                )}
              </div>
            ))}
          </div>

          <form
            className="mt-5 grid gap-4 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!inviteEmail.trim()) {
                setInviteMessage("Enter an email address before sending an invite.");
                return;
              }
              setTeam((current) => [
                ...current,
                {
                  id: crypto.randomUUID(),
                  name: inviteEmail.split("@")[0],
                  email: inviteEmail,
                  role: inviteRole,
                  status: "pending",
                },
              ]);
              setInviteMessage(`Invite sent to ${inviteEmail} as ${inviteRole}.`);
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
            <label className="md:col-span-2">
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
              <p className="mt-2 text-xs text-slate-500">{selectedRole.detail}</p>
            </label>
            <button className="button-primary" type="submit">
              Send invite
            </button>
          </form>
          {inviteMessage ? <p className="mt-3 text-sm font-medium text-emerald-700">{inviteMessage}</p> : null}
        </SectionCard>

        <SectionCard title="Approval rules" description="Stop large or sensitive orders going out unchecked.">
          <div className="space-y-3">
            <label className="flex items-start gap-3 rounded-[1rem] border border-slate-200 bg-white p-4">
              <input
                checked={Boolean(enabledRules.spend)}
                className="mt-1"
                onChange={(event) => {
                  setEnabledRules((current) => ({ ...current, spend: event.target.checked }));
                  setSavedMessage("Saved");
                }}
                type="checkbox"
              />
              <span>
                <p className="font-semibold text-slate-950">Require approval over $250</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Recommended for larger briefs or any order that crosses the spend threshold.
                </p>
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-[1rem] border border-slate-200 bg-white p-4">
              <input
                checked={Boolean(enabledRules["new-folder"])}
                className="mt-1"
                onChange={(event) => {
                  setEnabledRules((current) => ({ ...current, "new-folder": event.target.checked }));
                  setSavedMessage("Saved");
                }}
                type="checkbox"
              />
              <span>
                <p className="font-semibold text-slate-950">
                  Require approval for the first order under a new client folder
                </p>
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-[1rem] border border-slate-200 bg-white p-4">
              <input
                checked={Boolean(enabledRules.wallet)}
                className="mt-1"
                onChange={(event) => {
                  setEnabledRules((current) => ({ ...current, wallet: event.target.checked }));
                  setSavedMessage("Saved");
                }}
                type="checkbox"
              />
              <span className="w-full">
                <p className="font-semibold text-slate-950">Require approval if wallet falls below</p>
                <input
                  className="dashboard-input mt-3 max-w-[10rem]"
                  onChange={(event) => {
                    setWalletThreshold(event.target.value.replace(/[^0-9.]/g, ""));
                    setSavedMessage("Saved");
                  }}
                  value={walletThreshold}
                />
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-[1rem] border border-slate-200 bg-white p-4">
              <input
                checked={Boolean(enabledRules.rush)}
                className="mt-1"
                onChange={(event) => {
                  setEnabledRules((current) => ({ ...current, rush: event.target.checked }));
                  setSavedMessage("Saved");
                }}
                type="checkbox"
              />
              <span>
                <p className="font-semibold text-slate-950">Require approval for rush fees</p>
              </span>
            </label>
          </div>
          {savedMessage ? <p className="mt-4 text-sm font-medium text-emerald-700">{savedMessage}</p> : null}
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
