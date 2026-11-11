"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { signUpAction } from "@/app/(auth)/actions";
import { PennedLogo } from "@/components/penned-logo";
import {
  CLIENT_TYPEFORM_EMBED_ID,
  CLIENT_TYPEFORM_URL,
  CONTENT_NEED_OPTIONS,
  CONTENT_SOURCE_OPTIONS,
  INDUSTRY_OPTIONS,
} from "@/lib/signup-onboarding";

type Step = "email" | "details" | "agency" | "typeform";

const steps: Step[] = ["email", "details", "agency", "typeform"];

export function ClientSignupFlow({ error }: { error?: string }) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [isUkCompany, setIsUkCompany] = useState(false);
  const [agencyName, setAgencyName] = useState("");
  const [contentNeeds, setContentNeeds] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [contentSource, setContentSource] = useState("");
  const [typeformOpened, setTypeformOpened] = useState(false);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (step !== "typeform") return;
    const existing = document.querySelector("script[data-penned-typeform]");
    if (existing) return;
    const script = document.createElement("script");
    script.src = "https://embed.typeform.com/next/embed.js";
    script.async = true;
    script.dataset.pennedTypeform = "true";
    document.body.appendChild(script);
  }, [step]);

  const stepIndex = steps.indexOf(step);
  const progressLabel = useMemo(() => {
    if (step === "email") return "Step 1 of 4 · Work email";
    if (step === "details") return "Step 2 of 4 · Your details";
    if (step === "agency") return "Step 3 of 4 · About your agency";
    return "Step 4 of 4 · What brought you here";
  }, [step]);

  function toggleValue(list: string[], value: string, setter: (next: string[]) => void) {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  function goToDetails() {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setLocalError("That email doesn’t look right. Check it and try again.");
      return;
    }
    setLocalError("");
    setStep("details");
  }

  function goToAgency() {
    if (!firstName.trim() || !lastName.trim() || password.length < 8) {
      setLocalError("Add your name and a password with at least 8 characters.");
      return;
    }
    setLocalError("");
    setStep("agency");
  }

  function goToTypeform(skipAgency = false) {
    if (!skipAgency && !agencyName.trim()) {
      setLocalError("Add your agency name, or choose Skip for now.");
      return;
    }
    if (skipAgency) {
      setAgencyName((current) => current || "");
    }
    setLocalError("");
    setStep("typeform");
  }

  return (
    <div className="w-full max-w-md rounded-[2rem] border border-white/15 bg-white p-8 shadow-[0_30px_70px_rgba(0,0,0,0.35)]">
      <div className="flex justify-center">
        <Link href="/">
          <PennedLogo />
        </Link>
      </div>

      <p className="mt-6 text-center text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
        {progressLabel}
      </p>

      {step === "email" ? (
        <>
          <h1 className="mt-3 text-center text-4xl font-semibold tracking-[-0.05em] text-[var(--penned-navy)]">
            Create your Penned account
          </h1>
          <p className="mt-3 text-center text-base text-slate-500">
            Free to join. Order your first piece in about a minute.
          </p>

          <div className="mt-8 grid gap-3">
            <a className="button-secondary w-full text-center" href="/sign-in?oauth=google">
              Continue with Google
            </a>
            <a className="button-secondary w-full text-center" href="/sign-in?oauth=microsoft">
              Continue with Microsoft
            </a>
            <p className="text-center text-xs text-slate-400">
              These connect your email only. You still complete the steps below for new accounts.
            </p>
          </div>

          <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            or
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <label className="block">
            <span className="dashboard-label">Work email</span>
            <input
              className="dashboard-input"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@youragency.com"
              type="email"
              value={email}
            />
          </label>
          {(localError || error) && <ErrorBox message={localError || mapError(error)} />}
          <button className="button-primary mt-5 w-full" onClick={goToDetails} type="button">
            Start my content engine
          </button>
          <p className="mt-3 text-center text-xs text-slate-500">
            Free to create. Pay only when you place an order.
          </p>
          <p className="mt-4 text-center text-xs leading-5 text-slate-500">
            By continuing you agree to our{" "}
            <Link className="font-semibold underline" href="/terms" target="_blank">
              Terms
            </Link>{" "}
            and{" "}
            <Link className="underline" href="/privacy" target="_blank">
              Privacy Policy
            </Link>
            .
          </p>
        </>
      ) : null}

      {step === "details" ? (
        <>
          <h1 className="mt-3 text-center text-4xl font-semibold tracking-[-0.05em] text-[var(--penned-navy)]">
            Almost there
          </h1>
          <p className="mt-3 text-center text-base text-slate-500">
            Add your name and choose a password.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="dashboard-label">First name</span>
              <input
                className="dashboard-input"
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="John"
                type="text"
                value={firstName}
              />
            </label>
            <label className="block">
              <span className="dashboard-label">Last name</span>
              <input
                className="dashboard-input"
                onChange={(event) => setLastName(event.target.value)}
                placeholder="Doe"
                type="text"
                value={lastName}
              />
            </label>
          </div>
          <label className="mt-4 block">
            <span className="dashboard-label">Password</span>
            <input
              className="dashboard-input"
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              type="password"
              value={password}
            />
          </label>
          <label className="mt-4 flex items-start gap-3 text-sm text-slate-600">
            <input
              checked={isUkCompany}
              className="mt-1"
              onChange={(event) => setIsUkCompany(event.target.checked)}
              type="checkbox"
            />
            <span>This is a UK company. Content writing bills will include 20% UK VAT.</span>
          </label>
          {localError ? <ErrorBox message={localError} /> : null}
          <div className="mt-5 flex gap-3">
            <button className="button-secondary flex-1" onClick={() => setStep("email")} type="button">
              Back
            </button>
            <button className="button-primary flex-1" onClick={goToAgency} type="button">
              Continue
            </button>
          </div>
        </>
      ) : null}

      {step === "agency" ? (
        <>
          <h1 className="mt-3 text-center text-3xl font-semibold tracking-[-0.05em] text-[var(--penned-navy)]">
            Tell us about your agency
          </h1>
          <p className="mt-3 text-center text-base text-slate-500">
            Four quick questions so we can match the right writers and tier. About 30 seconds.
          </p>
          <label className="mt-8 block">
            <span className="dashboard-label">Agency name</span>
            <input
              className="dashboard-input"
              onChange={(event) => setAgencyName(event.target.value)}
              placeholder="Your agency"
              type="text"
              value={agencyName}
            />
          </label>
          <fieldset className="mt-5">
            <legend className="dashboard-label">What do your clients need most?</legend>
            <div className="mt-3 grid gap-2">
              {CONTENT_NEED_OPTIONS.map((option) => (
                <label key={option} className="flex items-center gap-3 text-sm text-slate-600">
                  <input
                    checked={contentNeeds.includes(option)}
                    onChange={() => toggleValue(contentNeeds, option, setContentNeeds)}
                    type="checkbox"
                  />
                  {option}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="mt-5">
            <legend className="dashboard-label">Which industries do you write for?</legend>
            <div className="mt-3 grid gap-2">
              {INDUSTRY_OPTIONS.map((option) => (
                <label key={option} className="flex items-center gap-3 text-sm text-slate-600">
                  <input
                    checked={industries.includes(option)}
                    onChange={() => toggleValue(industries, option, setIndustries)}
                    type="checkbox"
                  />
                  {option}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="mt-5 block">
            <span className="dashboard-label">Where do you get content today?</span>
            <select
              className="dashboard-input"
              onChange={(event) => setContentSource(event.target.value)}
              value={contentSource}
            >
              <option value="">Select one</option>
              {CONTENT_SOURCE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          {localError ? <ErrorBox message={localError} /> : null}
          <div className="mt-5 flex flex-wrap gap-3">
            <button className="button-secondary" onClick={() => setStep("details")} type="button">
              Back
            </button>
            <button className="button-primary flex-1" onClick={() => goToTypeform(false)} type="button">
              Continue
            </button>
            <button
              className="w-full text-sm font-semibold text-slate-500 underline"
              onClick={() => goToTypeform(true)}
              type="button"
            >
              Skip for now
            </button>
          </div>
        </>
      ) : null}

      {step === "typeform" ? (
        <>
          <h1 className="mt-3 text-center text-3xl font-semibold tracking-[-0.05em] text-[var(--penned-navy)]">
            What brought you here today
          </h1>
          <p className="mt-3 text-center text-base text-slate-500">
            One short form for Liam’s team, then you’re in.
          </p>
          <div className="mt-6 overflow-hidden rounded-[1.25rem] border border-slate-200 bg-slate-50">
            <div data-tf-live={CLIENT_TYPEFORM_EMBED_ID} style={{ minHeight: 420, width: "100%" }} />
          </div>
          <a
            className="mt-4 inline-flex text-sm font-semibold text-[var(--penned-navy)] underline"
            href={CLIENT_TYPEFORM_URL}
            onClick={() => setTypeformOpened(true)}
            rel="noreferrer"
            target="_blank"
          >
            Open the form in a new tab
          </a>
          <form action={signUpAction} className="mt-6 space-y-4">
            <input name="role" type="hidden" value="client" />
            <input name="email" type="hidden" value={email.trim()} />
            <input name="firstName" type="hidden" value={firstName.trim()} />
            <input name="lastName" type="hidden" value={lastName.trim()} />
            <input name="password" type="hidden" value={password} />
            <input name="companyName" type="hidden" value={agencyName.trim()} />
            {isUkCompany ? <input name="isUkCompany" type="hidden" value="on" /> : null}
            <input name="onboardingContentNeeds" type="hidden" value={contentNeeds.join("|")} />
            <input name="onboardingIndustries" type="hidden" value={industries.join("|")} />
            <input name="onboardingContentSource" type="hidden" value={contentSource} />
            <input name="onboardingTypeform" type="hidden" value={typeformOpened ? "opened" : "shown"} />
            <label className="flex items-start gap-3 text-sm text-slate-600">
              <input className="mt-1" name="acceptTerms" required type="checkbox" />
              <span>
                I agree to the{" "}
                <Link className="font-semibold underline" href="/terms" target="_blank">
                  client terms
                </Link>
                , including working with Penned writers only through Penned.
              </span>
            </label>
            {(localError || error) && stepIndex === 3 ? (
              <ErrorBox message={localError || mapError(error)} />
            ) : null}
            <div className="flex gap-3">
              <button className="button-secondary" onClick={() => setStep("agency")} type="button">
                Back
              </button>
              <button className="button-primary flex-1" type="submit">
                Create account
              </button>
            </div>
          </form>
        </>
      ) : null}

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link className="font-semibold text-[var(--penned-navy)]" href="/sign-in">
          Log in
        </Link>
      </p>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <p className="mt-4 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {message}
    </p>
  );
}

function mapError(error?: string) {
  if (error === "exists") return "You already have an account with this email. Log in instead.";
  if (error === "setup") {
    return "Password auth or terms/VAT columns need the latest Supabase SQL. Run the setup scripts, then try again.";
  }
  if (error === "env") {
    return "Signup is not configured in this deployment yet. Add Supabase env vars to this Vercel Preview environment.";
  }
  if (error === "failed") return "Something went wrong on our end. Try again in a moment.";
  if (error === "invalid") {
    return "Please complete all fields, accept the client terms, and use a password with at least 8 characters.";
  }
  return error || "";
}
