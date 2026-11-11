"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { submitOrderAction } from "@/app/client/actions";
import type { ClientFolder, ContentTypeOption } from "@/lib/orders";
import {
  initialOrderFormState,
  type OrderFormState,
} from "@/lib/order-schema";
import {
  FILE_ACCEPT,
  getRushLabel,
  supportedLanguages,
} from "@/lib/content-catalog";
import {
  calculateOrderPrice,
  formatUsdFromCents,
  isFlatPricedType,
  writingTier,
  writingTierFromDb,
  writingTierToDb,
} from "@/lib/pricing";

export function OrderForm({
  contentTypes,
  folders,
  presetContentTypeId,
  budgetRemainingCents = 0,
  applyUkVat = false,
}: {
  contentTypes: ContentTypeOption[];
  folders: ClientFolder[];
  presetContentTypeId?: string;
  hideContentTypeSelect?: boolean;
  budgetRemainingCents?: number;
  applyUkVat?: boolean;
}) {
  const orderableTypes = useMemo(
    () => contentTypes.filter((type) => type.isOrderable),
    [contentTypes],
  );
  const [state, formAction, pending] = useActionState<OrderFormState, FormData>(
    submitOrderAction,
    initialOrderFormState,
  );
  const [selectedContentTypeId, setSelectedContentTypeId] = useState(
    presetContentTypeId ?? orderableTypes[0]?.id ?? "",
  );
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [clientLabel, setClientLabel] = useState("");
  const [serviceTier, setServiceTier] = useState<"on-demand" | "signature" | "rank">("on-demand");
  const [priority, setPriority] = useState<"standard" | "priority" | "rush">("standard");
  const [language, setLanguage] = useState("English (UK)");
  const [industry, setIndustry] = useState("");
  const [surferOptIn, setSurferOptIn] = useState(false);
  const [wordCount, setWordCount] = useState("1500");
  const [showMoreDetail, setShowMoreDetail] = useState(false);
  const [serviceValues, setServiceValues] = useState<Record<string, string>>({});

  const selectedType = orderableTypes.find((type) => type.id === selectedContentTypeId);
  const selectedFolder = folders.find((folder) => folder.id === selectedFolderId) ?? null;
  const flatPriced = isFlatPricedType(selectedType?.key);
  const parsedWordCount = Number(wordCount) || 0;
  const effectiveTier = flatPriced ? "on-demand" : serviceTier;
  const pricePreview = calculateOrderPrice({
    words: parsedWordCount,
    tier: writingTierFromDb(effectiveTier),
    language,
    delivery: flatPriced ? "standard" : priority,
    industry: flatPriced ? "" : industry,
    contentTypeKey: selectedType?.key,
    applyUkVat,
  });
  const remainingAfter = Math.max(0, budgetRemainingCents - pricePreview.totalCents);
  const visibleServiceFields = (selectedType?.fields ?? []).filter((field) => {
    if (!field.showWhen) return true;
    return serviceValues[field.showWhen.field] === field.showWhen.equals;
  });
  // Drop duplicate CTA fields — keep primaryCta only.
  const serviceFieldsWithoutCta = visibleServiceFields.filter(
    (field) => !/call to action|primary cta|cta/i.test(field.label),
  );

  return (
    <form action={formAction} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="grid gap-5">
        {state.message && !state.success ? (
          <div className="rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {state.message}
          </div>
        ) : null}

        <label>
          <span className="dashboard-label">Client</span>
          <select
            className={inputClass(Boolean(state.errors.clientFolderId || state.errors.clientLabel))}
            name="clientFolderId"
            onChange={(event) => {
              const nextFolderId = event.target.value;
              setSelectedFolderId(nextFolderId);
              const nextFolder = folders.find((folder) => folder.id === nextFolderId);
              if (nextFolder) {
                setClientLabel(nextFolder.name);
                if (nextFolder.defaultWordCount) {
                  setWordCount(String(nextFolder.defaultWordCount));
                }
              }
            }}
            value={selectedFolderId}
          >
            <option value="">Type a new client name below, or pick a folder</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
          <input
            className={`${inputClass(Boolean(state.errors.clientLabel))} mt-2`}
            name="clientLabel"
            onChange={(event) => setClientLabel(event.target.value)}
            placeholder="Or type a new client name"
            value={clientLabel}
          />
          <p className="mt-1 text-xs text-slate-500">
            Pick a client to fill in their tone and audience, or type a new name.
          </p>
          <FieldError message={state.errors.clientLabel || state.errors.clientFolderId} />
        </label>

        <input name="contentTypeId" type="hidden" value={selectedType?.id ?? ""} />

        {!flatPriced ? (
          <div>
            <span className="dashboard-label">Writing level</span>
            <p className="mb-3 text-sm text-slate-500">
              Need volume? Standard. Client says no AI? Signature. Regulated or technical niche? Specialist.
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              {writingTier.map((tier) => {
                const dbValue = writingTierToDb(tier.value);
                const selected = serviceTier === dbValue;
                return (
                  <button
                    className={`rounded-[1.15rem] border px-4 py-4 text-left transition ${
                      selected ? "border-[#91B9D2] bg-[#F3F8FB]" : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                    key={tier.value}
                    onClick={() => setServiceTier(dbValue)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-slate-950">
                        {tier.label} · {tier.rateLabel}
                      </p>
                      {selected ? (
                        <span className="text-[var(--penned-navy)]" aria-hidden>
                          ✓
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm leading-5 text-slate-500">{tier.description}</p>
                  </button>
                );
              })}
            </div>
            <input name="serviceTier" type="hidden" value={serviceTier} />
            <p className="mt-2 text-xs text-slate-500">
              Pick the level this client needs. You can choose a different one on every order.
            </p>
            <FieldError message={state.errors.serviceTier} />
          </div>
        ) : (
          <input name="serviceTier" type="hidden" value="on-demand" />
        )}

        {!flatPriced && serviceTier === "rank" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="dashboard-label">Client&apos;s industry</span>
              <input
                className={inputClass(Boolean(state.errors.industry))}
                name="industry"
                onChange={(event) => setIndustry(event.target.value)}
                placeholder="e.g. iGaming, fintech, insurance, medical"
                required
                value={industry}
              />
              <p className="mt-1 text-xs text-slate-500">We&apos;ll match a writer who knows it.</p>
              <FieldError message={state.errors.industry} />
            </label>
            <label className="flex items-start gap-3 rounded-[1.15rem] border border-slate-200 bg-white px-4 py-4 text-sm text-slate-700">
              <input
                checked={surferOptIn}
                className="mt-1"
                name="surferOptimisation"
                onChange={(event) => setSurferOptIn(event.target.checked)}
                type="checkbox"
                value="yes"
              />
              <span>
                <span className="font-semibold text-slate-950">Optimise with Surfer or Clearscope</span>
                <span className="mt-1 block text-xs text-slate-500">Shown on Specialist only.</span>
              </span>
            </label>
          </div>
        ) : (
          <input name="industry" type="hidden" value="" />
        )}

        <Field
          label="Working title or topic"
          name="title"
          placeholder="AI workflow guide for operations leaders"
          error={state.errors.title}
          required
        />

        <div className="grid gap-4 md:grid-cols-2">
          {!flatPriced ? (
            <label>
              <span className="dashboard-label">Language and market</span>
              <select
                className={inputClass(Boolean(state.errors.language))}
                name="language"
                onChange={(event) => setLanguage(event.target.value)}
                value={language}
              >
                {supportedLanguages.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">
                {serviceTier === "on-demand"
                  ? "On Standard: languages other than English add $0.02 per word. Included on Signature and Specialist."
                  : "Written directly in your chosen language, at no extra cost."}
              </p>
              <FieldError message={state.errors.language} />
            </label>
          ) : (
            <input name="language" type="hidden" value={language} />
          )}

          {flatPriced ? (
            <input name="wordCount" type="hidden" value="1000" />
          ) : (
            <Field
              label="Target word count"
              name="wordCount"
              placeholder={selectedFolder?.defaultWordCount || "1500"}
              type="number"
              error={state.errors.wordCount}
              onChange={setWordCount}
              required
              value={wordCount}
            />
          )}
        </div>

        {!flatPriced ? (
          <label>
            <span className="dashboard-label">Delivery</span>
            <select
              className={inputClass(Boolean(state.errors.priority))}
              name="priority"
              onChange={(event) =>
                setPriority(
                  event.target.value === "rush"
                    ? "rush"
                    : event.target.value === "priority"
                      ? "priority"
                      : "standard",
                )
              }
              value={priority}
            >
              <option value="standard">Standard · 72 hours</option>
              <option value="priority">Priority · 72 hours, ahead of your other orders</option>
              <option value="rush">{getRushLabel(selectedType?.key, serviceTier)}</option>
            </select>
            <p className="mt-1 text-xs text-slate-500">
              The clock starts when we accept your brief. If we&apos;re late, 25% of the price goes back on your
              balance.
            </p>
            <FieldError message={state.errors.priority} />
          </label>
        ) : (
          <input name="priority" type="hidden" value="standard" />
        )}

        <label>
          <span className="dashboard-label">Target keywords</span>
          <textarea
            className={`${inputClass(Boolean(state.errors.targetKeywords))} min-h-24`}
            name="targetKeywords"
            placeholder="Main keyword first, then any others"
          />
          <FieldError message={state.errors.targetKeywords} />
        </label>

        <Field
          label="Preferred writer (optional)"
          name="preferredWriter"
          placeholder="We'll ask them first if they're free"
          error={undefined}
        />

        <input name="dueDate" type="hidden" value="" />

        <button
          className="justify-self-start text-sm font-semibold text-[var(--penned-navy)] underline"
          onClick={() => setShowMoreDetail((current) => !current)}
          type="button"
        >
          {showMoreDetail ? "Hide extra detail" : "Add more detail"}
        </button>

        {showMoreDetail ? (
          <div className="grid gap-5 rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-5 md:grid-cols-2">
            <Field
              label="Target reader"
              name="targetAudience"
              placeholder="B2B SaaS operations managers"
              error={state.errors.targetAudience}
            />
            <Field
              label="Tone of voice"
              name="toneOfVoice"
              placeholder={selectedFolder?.toneGuide || "Clear, strategic, and credible"}
              error={state.errors.toneOfVoice}
            />
            <Field
              className="md:col-span-2"
              label="Call to action"
              name="primaryCta"
              placeholder="Book a strategy call"
              error={state.errors.primaryCta}
            />
            <label className="md:col-span-2">
              <span className="dashboard-label">Reference links</span>
              <textarea
                className={`${inputClass(Boolean(state.errors.referenceLinks))} min-h-24`}
                name="referenceLinks"
                placeholder="Links to examples, research or pages to beat"
              />
              <FieldError message={state.errors.referenceLinks} />
            </label>
            <label className="md:col-span-2">
              <span className="dashboard-label">Anything else the writer should know?</span>
              <textarea
                className={`${inputClass(Boolean(state.errors.brief))} min-h-28`}
                name="brief"
                placeholder="Goals, structure, claims to include or avoid"
              />
              <FieldError message={state.errors.brief} />
            </label>
            <label className="md:col-span-2">
              <span className="dashboard-label">Supporting files</span>
              <input
                accept={FILE_ACCEPT}
                className="dashboard-input"
                multiple
                name="supportingFiles"
                type="file"
              />
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Word, text or audio files, up to 50MB each. PDFs aren&apos;t supported yet.
              </p>
            </label>

            {selectedType && serviceFieldsWithoutCta.length ? (
              <div className="md:col-span-2 rounded-[1.25rem] border border-slate-200 bg-white p-5">
                <p className="text-sm font-semibold text-slate-900">
                  For {selectedType.name.toLowerCase()}s
                </p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {serviceFieldsWithoutCta.map((field) => (
                    <ServiceField
                      field={field}
                      key={field.id}
                      onValueChange={(value) =>
                        setServiceValues((current) => ({ ...current, [field.id]: value }))
                      }
                      value={serviceValues[field.id] ?? ""}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <>
            <input name="targetAudience" type="hidden" value="" />
            <input name="toneOfVoice" type="hidden" value={selectedFolder?.toneGuide || ""} />
            <input name="primaryCta" type="hidden" value="" />
            <input name="referenceLinks" type="hidden" value="" />
            <input name="brief" type="hidden" value="" />
          </>
        )}
      </div>

      <aside className="xl:sticky xl:top-6 xl:self-start">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-950">Order summary</p>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <p>
              <span className="font-medium text-slate-900">{selectedType?.name ?? "Content type"}</span>
              {" · "}
              <Link className="underline" href="/client/new-order">
                Change
              </Link>
            </p>
            {!flatPriced ? (
              <p>
                {writingTierFromDb(serviceTier)} · {parsedWordCount.toLocaleString()} words
              </p>
            ) : null}
            <p>{language}</p>
            {!flatPriced ? (
              <p>
                {priority === "rush" ? "Rush" : priority === "priority" ? "Priority" : "Standard"} · Due within{" "}
                {pricePreview.deliveryHours} hours of acceptance
              </p>
            ) : (
              <p>Due within {pricePreview.deliveryHours} hours of acceptance</p>
            )}
          </div>

          <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm">
            {pricePreview.lines.map((line) => (
              <div className="flex items-center justify-between gap-3" key={line.label}>
                <span className="text-slate-500">{line.label}</span>
                <span className="font-medium text-slate-900">{formatUsdFromCents(line.amountCents)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between gap-3 pt-2 text-base font-semibold text-slate-950">
              <span>Total</span>
              <span>{formatUsdFromCents(pricePreview.totalCents)}</span>
            </div>
          </div>

          <p className="mt-4 text-xs leading-5 text-slate-500">
            Paid from your budget. {formatUsdFromCents(remainingAfter)} left after this order.
            {applyUkVat ? " Includes 20% UK VAT." : ""}
          </p>

          {state.message && state.success ? (
            <p className="mt-3 text-sm text-emerald-700">{state.message}</p>
          ) : null}

          <button className="button-primary mt-5 w-full" disabled={pending} type="submit">
            {pending ? "Placing order…" : "Place order"}
          </button>
        </div>
      </aside>
    </form>
  );
}

function ServiceField({
  field,
  onValueChange,
  value,
}: {
  field: ContentTypeOption["fields"][number];
  onValueChange: (value: string) => void;
  value: string;
}) {
  const inputName = `serviceField__${field.id}`;
  const hint = field.hint ? (
    <p className="mt-2 text-xs leading-5 text-slate-500">{field.hint}</p>
  ) : null;

  if (field.kind === "textarea") {
    return (
      <label className="md:col-span-2">
        <span className="dashboard-label">{field.label}</span>
        <textarea
          className="dashboard-input min-h-28"
          name={inputName}
          onChange={(event) => onValueChange(event.target.value)}
          placeholder={field.placeholder}
          required={field.required}
          value={value}
        />
        {hint}
      </label>
    );
  }

  if (field.kind === "file") {
    return (
      <label className="md:col-span-2">
        <span className="dashboard-label">{field.label}</span>
        <input
          accept={field.accept ?? FILE_ACCEPT}
          className="dashboard-input"
          multiple
          name={`upload__${field.id}`}
          onChange={(event) => {
            const names = Array.from(event.target.files ?? [])
              .map((file) => file.name)
              .join(", ");
            onValueChange(names);
          }}
          type="file"
        />
        <input name={inputName} type="hidden" value={value} />
        {hint}
      </label>
    );
  }

  if (field.kind === "select") {
    return (
      <label>
        <span className="dashboard-label">{field.label}</span>
        <select
          className="dashboard-input"
          name={inputName}
          onChange={(event) => onValueChange(event.target.value)}
          required={field.required}
          value={value}
        >
          <option value="">Select an option</option>
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option === "Not sure — you decide" ? "Not sure, you decide" : option}
            </option>
          ))}
        </select>
        {hint}
      </label>
    );
  }

  if (field.kind === "multiselect") {
    return (
      <fieldset className="rounded-[1rem] border border-slate-200 bg-white px-4 py-4">
        <legend className="dashboard-label">{field.label}</legend>
        <div className="grid gap-2">
          {(field.options ?? []).map((option) => (
            <label key={option} className="flex items-start gap-3 text-sm text-slate-700">
              <input className="mt-1" name={inputName} type="checkbox" value={option} />
              <span>{option}</span>
            </label>
          ))}
        </div>
        {hint}
      </fieldset>
    );
  }

  return (
    <label>
      <span className="dashboard-label">{field.label}</span>
      <input
        className="dashboard-input"
        name={inputName}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder={field.placeholder}
        required={field.required}
        type={field.kind === "date" ? "date" : "text"}
        value={value}
      />
      {hint}
    </label>
  );
}

function Field({
  label,
  name,
  placeholder,
  type = "text",
  className,
  error,
  onChange,
  required = false,
  value,
}: {
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
  className?: string;
  error?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  value?: string;
}) {
  return (
    <label className={className}>
      <span className="dashboard-label">{label}</span>
      <input
        className={inputClass(Boolean(error))}
        min={type === "number" ? 0 : undefined}
        name={name}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        placeholder={placeholder}
        required={required}
        type={type}
        value={value}
      />
      <FieldError message={error} />
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-2 text-sm text-rose-600">{message}</p>;
}

function inputClass(hasError: boolean) {
  return hasError
    ? "dashboard-input border-rose-300 bg-rose-50/60 focus:border-rose-400 focus:ring-rose-200"
    : "dashboard-input";
}
