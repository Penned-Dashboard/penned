"use client";

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
import { calculateOrderPrice, formatUsdFromCents, writingTierFromDb } from "@/lib/pricing";

export function OrderForm({
  contentTypes,
  folders,
  presetContentTypeId,
}: {
  contentTypes: ContentTypeOption[];
  folders: ClientFolder[];
  presetContentTypeId?: string;
  hideContentTypeSelect?: boolean;
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
  const [language, setLanguage] = useState("English");
  const [industry, setIndustry] = useState("");
  const [wordCount, setWordCount] = useState("1500");
  const [serviceValues, setServiceValues] = useState<Record<string, string>>({});

  const selectedType = orderableTypes.find((type) => type.id === selectedContentTypeId);
  const selectedFolder = folders.find((folder) => folder.id === selectedFolderId) ?? null;
  const parsedWordCount = Number(wordCount) || 0;
  const pricePreview = calculateOrderPrice({
    words: parsedWordCount,
    tier: writingTierFromDb(serviceTier),
    language,
    delivery: priority,
    industry,
    contentTypeKey: selectedType?.key,
  });
  const estimatedTotal = pricePreview.totalCents / 100;
  const visibleServiceFields = (selectedType?.fields ?? []).filter((field) => {
    if (!field.showWhen) {
      return true;
    }

    return serviceValues[field.showWhen.field] === field.showWhen.equals;
  });

  return (
    <form action={formAction} className="grid gap-5 md:grid-cols-2">
      {state.message && !state.success ? (
        <div className="md:col-span-2 rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {state.message}
        </div>
      ) : null}

      <label>
        <span className="dashboard-label">Client folder</span>
        <select
          className={inputClass(Boolean(state.errors.clientFolderId))}
          name="clientFolderId"
          onChange={(event) => {
            const nextFolderId = event.target.value;
            setSelectedFolderId(nextFolderId);
            const nextFolder = folders.find((folder) => folder.id === nextFolderId);
            if (nextFolder && !clientLabel.trim()) {
              setClientLabel(nextFolder.name);
            }
          }}
          value={selectedFolderId}
        >
          <option value="">No linked folder</option>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </select>
        <FieldError message={state.errors.clientFolderId} />
      </label>

      <Field
        label="Client"
        name="clientLabel"
        placeholder="Acme Agency / End client"
        error={state.errors.clientLabel}
        onChange={setClientLabel}
        value={clientLabel}
      />

      <div className="md:col-span-2">
        <input name="contentTypeId" type="hidden" value={selectedType?.id ?? ""} />
        <span className="dashboard-label">Service</span>
        <div className="mt-2 grid gap-3 md:grid-cols-3">
          {orderableTypes.map((type) => {
            const selected = type.id === selectedType?.id;
            return (
              <button
                className={`rounded-[1.15rem] border px-4 py-4 text-left transition ${
                  selected ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"
                }`}
                key={type.id}
                onClick={() => {
                  setSelectedContentTypeId(type.id);
                  setServiceValues({});
                }}
                type="button"
              >
                <p className="font-semibold text-slate-950">{type.name}</p>
                <p className="mt-2 text-sm text-slate-500">{type.priceLabel}</p>
              </button>
            );
          })}
        </div>
        <FieldError message={state.errors.contentTypeId} />
      </div>

      <label className="md:col-span-2">
        <span className="dashboard-label">Writing level</span>
        <p className="mb-2 text-sm text-slate-500">
          Need volume? Standard. Client says no AI? Signature. Regulated or technical niche? Specialist.
        </p>
        <select
          className={inputClass(Boolean(state.errors.serviceTier))}
          name="serviceTier"
          onChange={(event) => {
            const value = event.target.value;
            setServiceTier(
              value === "rank" ? "rank" : value === "signature" ? "signature" : "on-demand",
            );
          }}
          value={serviceTier}
        >
          <option value="on-demand">Standard · $0.06 per word</option>
          <option value="signature">Signature · $0.15 per word</option>
          <option value="rank">Specialist · from $0.35 per word</option>
        </select>
        <FieldError message={state.errors.serviceTier} />
      </label>

      {serviceTier === "rank" ? (
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
          <p className="mt-1 text-xs text-slate-500">We&apos;ll match a writer who knows it. Medical or legal uses $0.45 per word.</p>
          <FieldError message={state.errors.industry} />
        </label>
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
            ? "On Standard: languages other than English add $0.02 per word."
            : "On Signature and Specialist: every language is included at no extra cost."}
        </p>
        <FieldError message={state.errors.language} />
      </label>

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
        label="Target word count"
        name="wordCount"
        placeholder={selectedFolder?.defaultWordCount || "1500"}
        type="number"
        error={state.errors.wordCount}
        onChange={setWordCount}
        required
        value={wordCount}
      />

      <input name="dueDate" type="hidden" value="" />

      <label className="md:col-span-2">
        <span className="dashboard-label">Target keywords</span>
        <textarea
          className={`${inputClass(Boolean(state.errors.targetKeywords))} min-h-24`}
          name="targetKeywords"
          placeholder="Main keyword first, then any others"
        />
        <FieldError message={state.errors.targetKeywords} />
      </label>

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
        <FieldError message={state.errors.priority} />
      </label>

      <Field
        label="Primary CTA"
        name="primaryCta"
        placeholder="Book a strategy call"
        error={state.errors.primaryCta}
      />

      <label className="md:col-span-2">
        <span className="dashboard-label">Reference links</span>
        <textarea
          className={`${inputClass(Boolean(state.errors.referenceLinks))} min-h-24`}
          name="referenceLinks"
          placeholder="Paste links, research notes, competitors, internal docs, or transcript links."
        />
        <FieldError message={state.errors.referenceLinks} />
      </label>

      <label className="md:col-span-2">
        <span className="dashboard-label">Notes for production</span>
        <textarea
          className={`${inputClass(Boolean(state.errors.brief))} min-h-36`}
          name="brief"
          placeholder="Goals, structure expectations, compliance notes, required claims, delivery context, and anything the team should know."
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
          Documents: .docx, .txt, .md. Media: .mp3, .mp4, .wav. No PDFs. Max 50MB per file.
        </p>
      </label>

      {selectedType ? (
        <div className="md:col-span-2 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5" key={selectedType.id}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Service-specific fields
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                {selectedType.name}
              </h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                {selectedType.whatYouGet}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Perfect for: {selectedType.perfectFor}
              </p>
            </div>
            <div className="rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-right">
              <p className="text-sm text-slate-500">Pricing</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">
                {selectedType.priceLabel}
              </p>
              {priority === "rush" ? (
                <p className="text-xs text-slate-500">
                  {serviceTier === "rank" ? "Rush +$0.10/word included" : "Rush +$0.02/word included"}
                </p>
              ) : null}
            </div>
          </div>

          {visibleServiceFields.length ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {visibleServiceFields.map((field) => (
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
          ) : (
            <div className="mt-5 rounded-[1rem] border border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-slate-500">
              No extra service-specific fields are required for this content type.
            </div>
          )}
        </div>
      ) : null}

      <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-4 rounded-[1.25rem] bg-orange-50 px-4 py-4 text-sm text-orange-900">
        <div className="space-y-1">
          <p>
            {selectedType
              ? `${formatRate(activeRateCents)}/word · ${selectedType.name}`
              : "Choose a content type to see pricing."}
          </p>
          <p>
            Estimated total: {formatUsdFromCents(pricePreview.totalCents)}
            <span className="mt-1 block text-xs font-normal text-slate-500">
              Due within {pricePreview.deliveryHours} hours of acceptance
            </span>
          </p>
          <p>
            Blank optional fields are still saved for the production team to review.
          </p>
          {state.message && state.success ? (
            <p className="text-emerald-700">{state.message}</p>
          ) : null}
        </div>
        <button className="button-primary" disabled={pending} type="submit">
          {pending ? "Submitting..." : "Submit order"}
        </button>
      </div>
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
              {option}
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

function formatRate(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
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
  if (!message) {
    return null;
  }

  return <p className="mt-2 text-sm text-rose-600">{message}</p>;
}

function inputClass(hasError: boolean) {
  return hasError
    ? "dashboard-input border-rose-300 bg-rose-50/60 focus:border-rose-400 focus:ring-rose-200"
    : "dashboard-input";
}
