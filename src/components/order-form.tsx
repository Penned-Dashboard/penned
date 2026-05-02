"use client";

import { useActionState } from "react";
import { submitOrderAction } from "@/app/client/actions";
import {
  initialOrderFormState,
  type OrderFormState,
} from "@/lib/order-schema";

type ContentTypeOption = {
  id: string;
  name: string;
};

export function OrderForm({
  contentTypes,
  presetContentTypeId,
  hideContentTypeSelect,
}: {
  contentTypes: ContentTypeOption[];
  presetContentTypeId?: string;
  hideContentTypeSelect?: boolean;
}) {
  const [state, formAction, pending] = useActionState<OrderFormState, FormData>(
    submitOrderAction,
    initialOrderFormState,
  );

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      {state.message && !state.success ? (
        <div className="md:col-span-2 rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {state.message}
        </div>
      ) : null}
      <Field
        label="Content title"
        name="title"
        placeholder="AI workflow guide for operations leaders"
        error={state.errors.title}
      />

      {hideContentTypeSelect ? (
        <div className="md:col-span-2">
          <input name="contentTypeId" type="hidden" value={presetContentTypeId} />
          <FieldError message={state.errors.contentTypeId} />
        </div>
      ) : (
        <label>
          <span className="dashboard-label">Content type</span>
          <select
            className={inputClass(Boolean(state.errors.contentTypeId))}
            defaultValue={presetContentTypeId ?? ""}
            name="contentTypeId"
            required
          >
            <option disabled value="">
              Select a content type
            </option>
            {contentTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
          <FieldError message={state.errors.contentTypeId} />
        </label>
      )}

      <Field
        label="Target audience"
        name="targetAudience"
        placeholder="B2B SaaS operations managers"
        error={state.errors.targetAudience}
      />

      <Field
        label="Tone of voice"
        name="toneOfVoice"
        placeholder="Clear, strategic, and credible"
        error={state.errors.toneOfVoice}
      />

      <Field
        label="Target keywords"
        name="targetKeywords"
        placeholder="ai operations, content workflow, editorial ops"
        className="md:col-span-2"
        error={state.errors.targetKeywords}
      />

      <Field
        label="Due date"
        name="dueDate"
        type="date"
        error={state.errors.dueDate}
      />

      <Field
        label="Target word count"
        name="wordCount"
        placeholder="1500"
        type="number"
        error={state.errors.wordCount}
      />

      <label>
        <span className="dashboard-label">Priority</span>
        <select
          className={inputClass(Boolean(state.errors.priority))}
          defaultValue="standard"
          name="priority"
          required
        >
          <option value="standard">Standard</option>
          <option value="priority">Priority</option>
          <option value="rush">Rush</option>
        </select>
        <FieldError message={state.errors.priority} />
      </label>

      <Field
        label="Primary CTA"
        name="primaryCta"
        placeholder="Book a strategy call"
        className="md:col-span-2"
        error={state.errors.primaryCta}
      />

      <label className="md:col-span-2">
        <span className="dashboard-label">Reference links</span>
        <textarea
          className={`${inputClass(Boolean(state.errors.referenceLinks))} min-h-24`}
          name="referenceLinks"
          placeholder="Paste links, research notes, competitors, or internal docs. Separate with commas or new lines."
          required
        />
        <FieldError message={state.errors.referenceLinks} />
      </label>

      <label className="md:col-span-2">
        <span className="dashboard-label">Brief</span>
        <textarea
          className={`${inputClass(Boolean(state.errors.brief))} min-h-32`}
          name="brief"
          placeholder="Goals, tone, key points, keywords, structure expectations, and guardrails."
          required
        />
        <FieldError message={state.errors.brief} />
      </label>

      <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] bg-orange-50 px-4 py-3 text-sm text-orange-900">
        <div className="space-y-1">
          <p>
            Orders are written directly to Supabase and pushed into the live writer marketplace.
          </p>
          {state.message && state.success ? (
            <p className={state.success ? "text-emerald-700" : "text-orange-900"}>
              {state.message}
            </p>
          ) : null}
        </div>
        <button className="button-primary" disabled={pending} type="submit">
          {pending ? "Submitting..." : "Submit order"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  placeholder,
  type = "text",
  className,
  error,
}: {
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
  className?: string;
  error?: string;
}) {
  return (
    <label className={className}>
      <span className="dashboard-label">{label}</span>
      <input
        className={inputClass(Boolean(error))}
        min={type === "number" ? 0 : undefined}
        name={name}
        placeholder={placeholder}
        required
        type={type}
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
