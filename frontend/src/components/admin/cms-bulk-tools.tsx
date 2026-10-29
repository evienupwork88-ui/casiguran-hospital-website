"use client";

import { useState } from "react";
import readXlsxFile from "read-excel-file/browser";
import { useNotifications } from "@/components/providers/notification-provider";
import { containsProfanity } from "@/lib/profanity-filter";
import {
  bulkDeleteCmsRecords,
  importCmsRecords,
  type CmsBulkResource,
  type CmsBulkResult,
} from "@/lib/api/cms-bulk";

type RateFeeCategory = "pharmacy" | "dental" | "himd" | "laboratory" | "radiology";

const resourceColumns: Record<CmsBulkResource, { label: string; columns: string[]; required: string[]; help?: string }> = {
  news: {
    label: "News",
    columns: ["title", "slug", "excerpt", "body", "coverImageUrl", "externalUrl", "status", "publishedAt"],
    required: ["title", "slug"],
  },
  announcements: {
    label: "Updates",
    columns: ["title", "body", "priority", "status", "publishAt", "expiresAt"],
    required: ["title", "body"],
  },
  events: {
    label: "Events",
    columns: ["title", "description", "location", "startAt", "endAt", "coverImageUrl", "status"],
    required: ["title", "startAt"],
  },
  faqs: {
    label: "FAQs",
    columns: ["question", "answer", "category", "displayOrder", "isActive"],
    required: ["question", "answer", "category", "displayOrder", "isActive"],
  },
  trainings: {
    label: "Trainings",
    columns: ["title", "description", "externalUrl", "status"],
    required: ["title", "description", "externalUrl"],
  },
  "rate-fees": {
    label: "Rate & Fees",
    columns: ["category", "section", "itemName", "price1", "price2", "price3", "displayOrder", "isActive"],
    required: ["category", "itemName"],
  },
  documents: {
    label: "Document metadata",
    columns: ["title", "description", "category", "filePath", "fileSize", "mimeType", "status", "publishedAt"],
    required: ["filePath"],
    help: "Import metadata for files already uploaded below. Copy the file path shown in the Documents list; upload PDFs through the normal upload form.",
  },
};

type PreviewRow = {
  rowNumber: number;
  record: Record<string, unknown>;
  errors: string[];
};

function isBlankRow(row: unknown[]): boolean {
  return row.every((cell) => cell === null || cell === undefined || cell === "");
}

function normalizeCell(key: string, value: unknown): unknown {
  if (value === null || value === undefined || value === "") return undefined;
  if (value instanceof Date) return value.toISOString();
  if (key === "displayOrder" || key === "fileSize") {
    if (typeof value === "number") return value;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  }
  if (key === "isActive") {
    if (typeof value === "boolean") return value;
    if (typeof value === "string" && /^(true|false)$/i.test(value.trim())) return value.trim().toLowerCase() === "true";
  }
  return typeof value === "string" ? value.trim() : value;
}

function canonicalHeader(resource: CmsBulkResource, header: string): string | undefined {
  const normalized = header.trim().toLowerCase().replace(/[\s_-]+/g, " ");
  const exact = resourceColumns[resource].columns.find((column) => column.toLowerCase().replace(/[\s_-]+/g, " ") === normalized);
  if (exact) return exact;
  if (resource !== "rate-fees") return undefined;
  const aliases: Record<string, string> = {
    "category / procedure": "itemName",
    "category/procedure": "itemName",
    "views / remarks": "viewsRemarks",
    "views/remarks": "viewsRemarks",
    "price (php)": "price1",
    "price php": "price1",
    "price (₱)": "price1",
    item: "itemName",
    "item / service": "itemName",
    service: "itemName",
    services: "itemName",
    examination: "itemName",
    "service / examination": "itemName",
    procedure: "itemName",
    test: "itemName",
    particular: "itemName",
    particulars: "itemName",
    name: "itemName",
    amount: "price1",
    fee: "price1",
    price: "price1",
    "reg. price": "price1",
    "regular price": "price1",
    "opd/maip": "price1",
    "senior/pwd": "price2",
    "senior / pwd": "price2",
    phic: "price2",
    discount: "price3",
    "price 1": "price1",
    "price 2": "price2",
    "price 3": "price3",
    "is active": "isActive",
    "display order": "displayOrder",
  };
  return aliases[normalized];
}

function getResourceConfig(resource: CmsBulkResource, rateFeeCategory?: RateFeeCategory) {
  const config = resourceColumns[resource];
  if (resource !== "rate-fees" || !rateFeeCategory) return config;
  return {
    ...config,
    label: `${RATE_FEE_CATEGORY_LABELS[rateFeeCategory]} Rate & Fees`,
    columns: config.columns.filter((column) => column !== "category"),
    required: config.required.filter((column) => column !== "category"),
    help: `This import is for ${RATE_FEE_CATEGORY_LABELS[rateFeeCategory]} only. The category is assigned automatically; do not add a category column.`,
  };
}

const RATE_FEE_CATEGORY_LABELS: Record<RateFeeCategory, string> = {
  pharmacy: "Pharmacy Pricelist",
  dental: "Dental Examination",
  himd: "HIMD Services",
  laboratory: "Laboratory Services",
  radiology: "Radiology Services",
};

function validateRecord(resource: CmsBulkResource, record: Record<string, unknown>, rowNumber: number, config = resourceColumns[resource]): string[] {
  const errors = config.required.flatMap((key) => {
    const value = record[key];
    return value === undefined || value === null || value === "" ? [`${key} is required`] : [];
  });
  const textLimits: Record<string, number> = {
    title: 200, slug: 200, excerpt: 300, body: resource === "news" ? 20000 : 5000,
    question: 200, answer: 1000, description: resource === "trainings" ? 5000 : 5000,
    location: 200, itemName: 200, section: 100, filePath: 1000, mimeType: 150,
  };
  for (const [key, max] of Object.entries(textLimits)) {
    const value = record[key];
    if (typeof value === "string" && value.length > max) errors.push(`${key} must be ${max} characters or fewer`);
  }
  if (resource === "news") {
    if (!/^[a-z0-9-]+$/.test(String(record.slug ?? ""))) errors.push("slug must contain lowercase letters, numbers, and hyphens only");
    if (!record.body && !record.externalUrl) errors.push("body or externalUrl is required");
  }
  if (resource === "announcements" && !["normal", "urgent", undefined, ""].includes(record.priority as string | undefined)) errors.push("priority must be normal or urgent");
  if (resource === "events" && !isValidDate(record.startAt)) errors.push("startAt must be a valid date and time");
  if (resource === "faqs" && !["Patient Care", "Billing & PhilHealth", "Documents", "Emergency", "General"].includes(String(record.category))) errors.push("category is not supported");
  if (resource === "faqs" && (containsProfanity(String(record.question ?? "")) || containsProfanity(String(record.answer ?? "")))) errors.push("use respectful language");
  if (resource === "rate-fees" && !["pharmacy", "dental", "himd", "laboratory", "radiology"].includes(String(record.category))) errors.push("category is not supported");
  if (resource === "documents" && !["report", "org_chart", "policy", "citizens_charter", "development_plan", "patient_rights", "other", undefined, ""].includes(record.category as string | undefined)) errors.push("category is not supported");
  if (record.status !== undefined && record.status !== "" && !["draft", "published"].includes(String(record.status))) errors.push("status must be draft or published");
  for (const key of ["publishedAt", "publishAt", "expiresAt", "startAt", "endAt"]) {
    if (record[key] !== undefined && record[key] !== "" && !isValidDate(record[key])) errors.push(`${key} must be a valid date and time`);
  }
  for (const key of ["coverImageUrl", "externalUrl"]) {
    const value = record[key];
    if (value !== undefined && value !== "" && !isHttpUrl(value)) errors.push(`${key} must be a valid HTTP or HTTPS URL`);
  }
  if (resource === "trainings" && !isHttpUrl(record.externalUrl)) errors.push("externalUrl must be a valid HTTP or HTTPS URL because imports cannot include images");
  if (resource === "faqs" || resource === "rate-fees") {
    if (record.displayOrder !== undefined && record.displayOrder !== "" && (!Number.isInteger(record.displayOrder) || Number(record.displayOrder) < 0)) errors.push("displayOrder must be a non-negative whole number");
    if (record.isActive !== undefined && record.isActive !== "" && typeof record.isActive !== "boolean") errors.push("isActive must be TRUE or FALSE");
  }
  if (resource === "documents" && record.fileSize !== undefined && record.fileSize !== "" && (!Number.isInteger(record.fileSize) || Number(record.fileSize) < 0)) errors.push("fileSize must be a non-negative whole number");
  return errors.map((error) => `Row ${rowNumber}: ${error}`);
}

function isValidDate(value: unknown): boolean {
  return typeof value === "string" && value.trim() !== "" && !Number.isNaN(Date.parse(value));
}

function isHttpUrl(value: unknown): boolean {
  if (typeof value !== "string" || value.trim() === "") return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function downloadTemplate(resource: CmsBulkResource, config: typeof resourceColumns[CmsBulkResource]) {
  const blob = new Blob([`${config.columns.join(",")}\r\n`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${resource}-${config.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-template.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function CmsSpreadsheetImport({
  resource,
  rateFeeCategory,
  onImported,
}: {
  resource: CmsBulkResource;
  rateFeeCategory?: RateFeeCategory;
  onImported: () => void | Promise<void>;
}) {
  const config = getResourceConfig(resource, rateFeeCategory);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const { showSuccess, showError } = useNotifications();
  const invalidRows = preview.filter((row) => row.errors.length > 0).length;

  async function handleFile(file: File | undefined) {
    setPreview([]);
    setError("");
    setFileName(file?.name ?? "");
    if (!file) return;
    if (!/\.xlsx$/i.test(file.name)) {
      setError("Choose an .xlsx workbook. Open the CSV template in Excel and save it as .xlsx first.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Workbook must be 5 MB or smaller.");
      return;
    }
    try {
      const sheets = await readXlsxFile(file);
      const rows = sheets[0]?.data ?? [];
      if (rows.length < 2) throw new Error("The workbook needs a header row and at least one data row.");
      const specialRateFeeHeaderRow = resource === "rate-fees" && rateFeeCategory === "radiology"
        ? rows.findIndex((row) => row.some((cell) => typeof cell === "string" && canonicalHeader(resource, cell) === "itemName") &&
          row.some((cell) => typeof cell === "string" && canonicalHeader(resource, cell) === "price1"))
        : -1;
      const headerRowIndex = specialRateFeeHeaderRow >= 0 ? specialRateFeeHeaderRow : 0;
      const headers = rows[headerRowIndex].map((cell) => typeof cell === "string" ? cell.trim() : "");
      const normalizedHeaders = headers.map((header) => header.toLowerCase());
      const duplicates = normalizedHeaders.filter((header, index) => header && normalizedHeaders.indexOf(header) !== index);
      if (duplicates.length) throw new Error(`Duplicate column header: ${duplicates[0]}`);
      const mappedHeaders = headers.map((header) => header ? canonicalHeader(resource, header) : undefined);
      const duplicateMappedHeaders = mappedHeaders.filter((header, index) => header && mappedHeaders.indexOf(header) !== index);
      if (duplicateMappedHeaders.length) throw new Error(`Duplicate column mapping: ${duplicateMappedHeaders[0]}`);
      const missingHeaders = config.required.filter((required) => !mappedHeaders.includes(required));
      if (missingHeaders.length) throw new Error(`Missing required column${missingHeaders.length > 1 ? "s" : ""}: ${missingHeaders.join(", ")}`);
      const unknownHeaders = headers.filter((header, index) => header && !mappedHeaders[index] && !(resource === "rate-fees" && mappedHeaders[index] === "viewsRemarks"));
      if (unknownHeaders.length) throw new Error(`Unsupported column${unknownHeaders.length > 1 ? "s" : ""}: ${unknownHeaders.join(", ")}`);
      if (mappedHeaders.some((header) => header === "category") && rateFeeCategory) {
        const categoryColumn = mappedHeaders.findIndex((header) => header === "category");
        const importedCategories = rows.slice(headerRowIndex + 1).map((row) => row[categoryColumn]).filter((value) => value !== null && value !== undefined && value !== "");
        if (importedCategories.some((value) => {
          const importedCategory = String(value).trim().toLowerCase();
          return importedCategory !== rateFeeCategory && importedCategory !== RATE_FEE_CATEGORY_LABELS[rateFeeCategory].toLowerCase();
        })) {
          throw new Error(`The workbook category must match the selected ${RATE_FEE_CATEGORY_LABELS[rateFeeCategory]} tab.`);
        }
      }

      const populatedRows = rows.slice(headerRowIndex + 1).map((cells, index) => ({ cells, rowNumber: index + headerRowIndex + 2 })).filter(({ cells }) => !isBlankRow(cells));
      if (specialRateFeeHeaderRow >= 0) {
        const itemColumn = mappedHeaders.indexOf("itemName");
        const viewsColumn = mappedHeaders.indexOf("viewsRemarks");
        const priceColumn = mappedHeaders.indexOf("price1");
        let currentSection = "";
        const importedRows: PreviewRow[] = [];
        for (const { cells, rowNumber } of populatedRows) {
          const itemName = String(cells[itemColumn] ?? "").trim();
          const viewsRemarks = viewsColumn < 0 ? "" : String(cells[viewsColumn] ?? "").trim();
          const rawPrice = cells[priceColumn];
          const price = rawPrice === null || rawPrice === undefined || rawPrice === "" ? "" : String(rawPrice).trim();
          if (!price && itemName && !viewsRemarks) {
            currentSection = itemName;
            continue;
          }
          if (!price || !itemName) continue;
          const record = {
            category: rateFeeCategory,
            section: currentSection,
            itemName: viewsRemarks ? `${itemName} ${viewsRemarks}` : itemName,
            price1: price,
            price2: "",
            price3: "",
            displayOrder: importedRows.length,
            isActive: true,
          };
          importedRows.push({ rowNumber, record, errors: validateRecord(resource, record, rowNumber, config) });
        }
        if (!importedRows.length) throw new Error("No priced procedures were found beneath the workbook headers.");
        if (importedRows.length > 250) throw new Error("Import up to 250 procedures at a time.");
        setPreview(importedRows);
        return;
      }
      if (!populatedRows.length) throw new Error("The workbook has no data rows.");
      if (populatedRows.length > 25) throw new Error("Import up to 25 rows at a time.");
      setPreview(populatedRows.map(({ cells, rowNumber }) => {
        const workbookRecord = Object.fromEntries(headers.flatMap((header, index) => {
          if (!header) return [];
          const key = canonicalHeader(resource, header);
          return key ? [[key, normalizeCell(key, cells[index])]] : [];
        }));
        const record = resource === "rate-fees" && rateFeeCategory
          ? { ...workbookRecord, category: rateFeeCategory }
          : workbookRecord;
        const errors = validateRecord(resource, record, rowNumber, config);
        if (resource === "rate-fees" && rateFeeCategory && workbookRecord.category && workbookRecord.category !== rateFeeCategory) {
          errors.push(`Row ${rowNumber}: category must match the selected ${RATE_FEE_CATEGORY_LABELS[rateFeeCategory]} tab`);
        }
        return { rowNumber, record, errors };
      }));
    } catch (parseError) {
      setError(parseError instanceof Error ? parseError.message : "Unable to read this workbook.");
    }
  }

  async function handleImport() {
    if (preview.length === 0 || invalidRows > 0) return;
    if (!window.confirm(`Import ${preview.length} ${config.label} record${preview.length === 1 ? "" : "s"}?`)) return;
    setIsImporting(true);
    try {
      const result: CmsBulkResult = { succeeded: 0, failures: [] };
      for (let index = 0; index < preview.length; index += 25) {
        const batch = preview.slice(index, index + 25);
        try {
          const batchResult = await importCmsRecords(resource, batch.map((row) => row.record), batch.map((row) => row.rowNumber));
          result.succeeded += batchResult.succeeded;
          result.failures.push(...batchResult.failures);
        } catch (batchError) {
          const message = batchError instanceof Error ? batchError.message : "The batch request failed.";
          result.failures.push(...preview.slice(index).map((row) => ({ row: row.rowNumber, message })));
          break;
        }
      }
      if (result.failures.length) {
        const failedRows = new Set(result.failures.map((failure) => failure.row));
        setPreview((current) => current.filter((row) => failedRows.has(row.rowNumber)));
        const details = result.failures.map((failure) => `Row ${failure.row}: ${failure.message}`).join("\n");
        showError(`${result.succeeded} imported; ${result.failures.length} failed.\n${details}\nFailed records remain selected for correction.`, "Import partially completed");
      } else {
        setPreview([]);
        setFileName("");
        showSuccess(`${result.succeeded} ${config.label.toLowerCase()} record${result.succeeded === 1 ? "" : "s"} imported.`, "Import complete");
      }
      await onImported();
    } catch (importError) {
      showError(importError instanceof Error ? importError.message : "Unable to import workbook.", "Import failed");
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <section className="mb-5 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-900">Import {config.label} from Excel</h2>
          <p className="text-xs text-slate-500">{config.help ?? (resource === "rate-fees" && rateFeeCategory === "radiology"
            ? "Upload the Radiology price list directly. Procedures are grouped by section and imported in batches of 25 (up to 250 per upload)."
            : "Use the CSV header template, save as .xlsx, then upload up to 25 rows. The first worksheet is used.")}</p>
        </div>
        <button type="button" onClick={() => downloadTemplate(resource, config)} className="rounded-lg border border-violet-200 px-3 py-2 text-sm font-semibold text-violet-800 hover:bg-violet-50">Download template</button>
      </div>
      <input type="file" accept=".xlsx" aria-label={`Choose ${config.label} Excel workbook`} onChange={(event) => void handleFile(event.target.files?.[0])} className="mt-3 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-violet-100 file:px-3 file:py-2 file:font-semibold file:text-violet-800" />
      {fileName ? <p className="mt-2 text-xs text-slate-500">Selected: {fileName}</p> : null}
      {error ? <p role="alert" className="mt-2 text-sm text-red-700">{error}</p> : null}
      {preview.length ? (
        <>
          <p className="mt-3 text-sm text-slate-700">{preview.length - invalidRows} valid · {invalidRows} with errors. All rows must be valid to import.</p>
          <div className="mt-2 max-h-48 overflow-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-50"><tr><th className="px-3 py-2">Sheet row</th><th className="px-3 py-2">Preview</th><th className="px-3 py-2">Validation</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{preview.slice(0, 10).map((row) => (
                <tr key={row.rowNumber} className={row.errors.length ? "bg-red-50" : ""}>
                  <td className="px-3 py-2">{row.rowNumber}</td>
                  <td className="max-w-md truncate px-3 py-2">{String(row.record.title ?? row.record.question ?? row.record.itemName ?? row.record.filePath ?? "")}</td>
                  <td className="px-3 py-2">{row.errors.length ? row.errors.join("; ") : "Ready"}</td>
                </tr>
              ))}</tbody>
            </table>
            {preview.length > 10 ? <p className="p-2 text-xs text-slate-500">Showing 10 of {preview.length} rows.</p> : null}
          </div>
          <button type="button" onClick={() => void handleImport()} disabled={invalidRows > 0 || isImporting} className="mt-3 rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{isImporting ? "Importing..." : `Import ${preview.length} rows`}</button>
        </>
      ) : null}
    </section>
  );
}

export function CmsBulkDeleteButton({
  resource,
  ids,
  itemLabel,
  onDeleted,
}: {
  resource: CmsBulkResource;
  ids: string[];
  itemLabel: string;
  onDeleted: () => void | Promise<void>;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { showSuccess, showError } = useNotifications();

  async function handleDelete() {
    if (!ids.length || ids.length > 100) return;
    const action = resource === "faqs" ? "Archive from the public site" : "Permanently delete";
    const storedFiles = resource === "documents" ? " and their stored files" : "";
    if (!window.confirm(`${action} ${ids.length} selected ${itemLabel}${ids.length === 1 ? "" : "s"}${storedFiles}?`)) return;
    setIsDeleting(true);
    try {
      const result = await bulkDeleteCmsRecords(resource, ids);
      if (result.failures.length) {
        showError(`${result.succeeded} processed; ${result.failures.length} failed. ${result.failures.map((failure) => `Item ${failure.row - 1}: ${failure.message}`).join("\n")}`, "Some items were not processed");
      } else {
        showSuccess(`${result.succeeded} ${itemLabel}${result.succeeded === 1 ? "" : "s"} ${resource === "faqs" ? "archived" : "deleted"}.`, "Complete");
      }
      await onDeleted();
    } catch (deleteError) {
      showError(deleteError instanceof Error ? deleteError.message : "Unable to process selected items.", "Bulk action failed");
    } finally {
      setIsDeleting(false);
    }
  }

  if (!ids.length) return null;
  return (
    <div className="flex items-center gap-3">
      {ids.length > 100 ? <p role="alert" className="text-sm text-red-700">Select no more than 100 records per action.</p> : null}
      {ids.length <= 100 ? (
        <button type="button" onClick={() => void handleDelete()} disabled={isDeleting} className="rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50">
          {isDeleting ? "Processing..." : `${resource === "faqs" ? "Archive" : "Delete"} ${ids.length} selected`}
        </button>
      ) : null}
    </div>
  );
}
