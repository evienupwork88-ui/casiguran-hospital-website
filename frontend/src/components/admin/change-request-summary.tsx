import type { AdminChangeRequest } from "@/lib/api/admin-change-requests";

function formatFieldLabel(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (character) => character.toUpperCase());
}

function formatFieldValue(value: unknown) {
  if (typeof value === "string") return value || "(empty)";
  if (value === null) return "(empty)";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value, null, 2);
}

export function ChangeRequestSummary({ item }: { item: AdminChangeRequest }) {
  const fields = Object.entries(item.requestBody);

  return (
    <div className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-white p-3">
      {fields.length ? (
        <dl className="space-y-2">
          {fields.map(([key, value]) => (
            <div key={key} className="grid gap-1 sm:grid-cols-[9rem_minmax(0,1fr)]">
              <dt className="text-xs font-semibold text-slate-600">{formatFieldLabel(key)}</dt>
              <dd className="min-w-0 whitespace-pre-wrap break-words text-xs text-slate-800">{formatFieldValue(value)}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-xs text-slate-600">
          {item.method === "DELETE"
            ? "This is a deletion request; no form fields were submitted."
            : "No form fields were submitted with this request."}
        </p>
      )}
      <details>
        <summary className="cursor-pointer text-xs font-semibold text-slate-600">Request target</summary>
        <p className="mt-1 break-all font-mono text-[11px] text-slate-600">
          {item.method} {item.requestPath}
        </p>
      </details>
      {item.files.length ? (
        <ul className="space-y-1 border-t border-slate-100 pt-2 text-xs text-slate-600">
          {item.files.map((file, index) => (
            <li key={`${file.fieldName}-${index}`}>
              {formatFieldLabel(file.fieldName)}: {file.originalName} ({Math.ceil(file.size / 1024)} KB)
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
