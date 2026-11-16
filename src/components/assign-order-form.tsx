import { assignEditorAction, assignWriterAction } from "@/app/assign-actions";

type Person = { id: string; full_name?: string | null; email?: string | null };

function label(person: Person) {
  return person.full_name?.trim() || person.email || "Unnamed";
}

/**
 * Assign or change the writer and editor on an order (account managers and
 * admin). Writers can only be assigned once the brief is accepted.
 */
export function AssignOrderForm({
  orderId,
  returnTo,
  writers,
  editors,
  currentWriterId,
  currentEditorId,
  canAssignWriter,
  writerHint,
  compact = false,
}: {
  orderId: string;
  returnTo: string;
  writers: Person[];
  editors: Person[];
  currentWriterId: string | null;
  currentEditorId: string | null;
  canAssignWriter: boolean;
  writerHint?: string;
  compact?: boolean;
}) {
  const selectClass = compact
    ? "w-full min-w-[9rem] rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs"
    : "dashboard-input";
  const buttonClass = compact
    ? "rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-[var(--penned-navy)]"
    : "button-secondary";

  return (
    <div className={compact ? "grid gap-2" : "grid gap-4 md:grid-cols-2"}>
      <form action={assignWriterAction} className="grid gap-1.5">
        <input name="orderId" type="hidden" value={orderId} />
        <input name="returnTo" type="hidden" value={returnTo} />
        {compact ? null : <span className="dashboard-label">Writer</span>}
        <select
          aria-label="Writer"
          className={selectClass}
          defaultValue={currentWriterId ?? ""}
          disabled={!canAssignWriter}
          name="writerId"
        >
          <option value="">{canAssignWriter ? "Choose a writer" : "Writer"}</option>
          {writers.map((writer) => (
            <option key={writer.id} value={writer.id}>
              {label(writer)}
            </option>
          ))}
        </select>
        {canAssignWriter ? (
          <button className={`${buttonClass} w-fit`} type="submit">
            {currentWriterId ? "Change writer" : "Assign writer"}
          </button>
        ) : writerHint ? (
          <span className="text-xs text-slate-500">{writerHint}</span>
        ) : null}
      </form>

      <form action={assignEditorAction} className="grid gap-1.5">
        <input name="orderId" type="hidden" value={orderId} />
        <input name="returnTo" type="hidden" value={returnTo} />
        {compact ? null : <span className="dashboard-label">Editor</span>}
        <select aria-label="Editor" className={selectClass} defaultValue={currentEditorId ?? ""} name="editorId">
          <option value="">{editors.length ? "Choose an editor" : "No editors yet"}</option>
          {editors.map((editor) => (
            <option key={editor.id} value={editor.id}>
              {label(editor)}
            </option>
          ))}
        </select>
        {editors.length ? (
          <button className={`${buttonClass} w-fit`} type="submit">
            {currentEditorId ? "Change editor" : "Assign editor"}
          </button>
        ) : null}
      </form>
    </div>
  );
}
