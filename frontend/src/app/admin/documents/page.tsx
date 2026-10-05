"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { deleteDocument, getAdminDocuments, type DocumentItem, updateDocument, uploadDocument } from "@/lib/api/documents";
import { useNotifications } from "@/components/providers/notification-provider";

const emptyForm = {
  title: "",
  description: "",
  category: "other" as DocumentItem["category"],
  status: "draft" as "draft" | "published",
};

const localDraftKey = "cdh-admin-documents-draft";

const CATEGORY_LABELS: Record<string, string> = {
  report: "Report",
  policy: "Policy",
  citizens_charter: "Citizen's Charter",
  org_chart: "Org Chart",
  development_plan: "Hospital Development Plan",
  other: "Other",
};

const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "gif", "svg"];

function validateFile(file: File): string | null {
  const extension = file.name.toLowerCase().split(".").pop();
  const limit = ["jpg", "jpeg", "png", "webp"].includes(extension ?? "") ? 5 : 15;
  if (file.size > limit * 1024 * 1024) return `File exceeds the ${limit}MB limit for this file type.`;
  return null;
}

function getFileKind(extension?: string | null, mimeType?: string | null): "pdf" | "image" | "other" {
  const ext = (extension ?? "").toLowerCase().replace(".", "");
  const mime = (mimeType ?? "").toLowerCase();
  if (ext === "pdf" || mime.includes("pdf")) return "pdf";
  if (IMAGE_EXTENSIONS.includes(ext) || mime.startsWith("image/")) return "image";
  return "other";
}

function FilePreview({
  url,
  name,
  extension,
  mimeType,
}: {
  url?: string | null;
  name: string;
  extension?: string | null;
  mimeType?: string | null;
}) {
  const kind = getFileKind(extension, mimeType);

  if (!url) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-slate-500">
        No preview available for this file.
      </div>
    );
  }

  if (kind === "pdf") {
    return <iframe key={url} src={url} title={`Preview of ${name}`} className="h-full w-full border-0" />;
  }

  if (kind === "image") {
    return (
      <div className="flex h-full items-center justify-center overflow-auto p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={name} className="max-h-full max-w-full object-contain" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-1 p-6 text-center">
      <p className="text-sm font-semibold text-slate-900">Preview not available for this file type</p>
      <p className="text-xs text-slate-500">Word, Excel, and PowerPoint files can&apos;t be previewed in the browser.</p>
    </div>
  );
}

export default function AdminDocumentsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);
  const editPreviewUrlRef = useRef<string | null>(null);
  const [items, setItems] = useState<DocumentItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editSelectedFile, setEditSelectedFile] = useState<File | null>(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreateDirty, setIsCreateDirty] = useState(false);
  const [isEditDirty, setIsEditDirty] = useState(false);
  const [restoredDraft, setRestoredDraft] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [navigationError, setNavigationError] = useState("");
  const { showSuccess, showError } = useNotifications();

  const hasUnsavedChanges = isCreateDirty || isEditDirty;
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges);

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  // Sets the replacement file and manages its blob preview URL (revokes the old one).
  const setEditFile = useCallback((file: File | null) => {
    if (editPreviewUrlRef.current) URL.revokeObjectURL(editPreviewUrlRef.current);
    const url = file ? URL.createObjectURL(file) : null;
    editPreviewUrlRef.current = url;
    setEditPreviewUrl(url);
    setEditSelectedFile(file);
  }, []);

  const closeEdit = useCallback(() => {
    setEditingId(null);
    setEditFile(null);
    if (editFileInputRef.current) editFileInputRef.current.value = "";
    setIsEditDirty(false);
    setError("");
  }, [setEditFile]);

  // Close/Cancel/Escape: magtanong muna kapag may unsaved na binago sa edit modal
  const requestCloseEdit = useCallback(() => {
    if (isEditDirty && !window.confirm("Discard your unsaved changes?")) return;
    closeEdit();
  }, [isEditDirty, closeEdit]);

  async function loadItems() {
    try {
      const data = await getAdminDocuments();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load documents.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadItems(), 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const savedDraft = window.localStorage.getItem(localDraftKey);
      if (!savedDraft) return;

      try {
        setForm({ ...emptyForm, ...JSON.parse(savedDraft) });
        setRestoredDraft(true);
      } catch {
        window.localStorage.removeItem(localDraftKey);
      }
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!isCreateDirty) return;
    window.localStorage.setItem(localDraftKey, JSON.stringify(form));
  }, [form, isCreateDirty]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    function warnBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const browserNavigation = (window as Window & { navigation?: EventTarget }).navigation;
    if (!browserNavigation) return;

    const handleNavigate: EventListener = (event) => {
      const navigationEvent = event as Event & {
        canIntercept?: boolean;
        navigationType?: string;
        destination?: { url?: string };
      };
      if (!navigationEvent.canIntercept || !hasUnsavedChangesRef.current || !navigationEvent.destination?.url) return;

      const destination = new URL(navigationEvent.destination.url);
      if (destination.origin !== window.location.origin) return;

      event.preventDefault();
      setNavigationError("");
      setPendingNavigation(`${destination.pathname}${destination.search}${destination.hash}`);
    };

    browserNavigation.addEventListener("navigate", handleNavigate);
    return () => browserNavigation.removeEventListener("navigate", handleNavigate);
  }, []);

  // Escape closes the top-most dialog
  useEffect(() => {
    if (!editingId && !pendingNavigation) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || isSubmitting) return;
      if (pendingNavigation) setPendingNavigation(null);
      else requestCloseEdit();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editingId, pendingNavigation, isSubmitting, requestCloseEdit]);

  // Revoke any leftover blob URL on unmount
  useEffect(() => {
    return () => {
      if (editPreviewUrlRef.current) URL.revokeObjectURL(editPreviewUrlRef.current);
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!form.title.trim()) {
      setError("Please enter a title.");
      return;
    }

    if (!selectedFile) {
      setError("Please choose a document file.");
      return;
    }

    const fileError = validateFile(selectedFile);
    if (fileError) {
      setError(fileError);
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", form.title.trim());
      formData.append("description", form.description);
      formData.append("category", form.category);
      formData.append("status", form.status);
      formData.append("file", selectedFile);
      await uploadDocument(formData);
      showSuccess(form.status === "published" ? "Document published." : "Document saved as a draft.", "Saved");
      setForm(emptyForm);
      setSelectedFile(null);
      setIsCreateDirty(false);
      setRestoredDraft(false);
      window.localStorage.removeItem(localDraftKey);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadItems();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save document.";
      setError(message);
      showError(message, "Unable to save document");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Shared by "Save changes" and "Save changes & leave". Throws on failure.
  async function saveEdit() {
    if (!editingId) return;

    if (!editForm.title.trim()) throw new Error("Title is required.");
    const payload = { ...editForm, title: editForm.title.trim() };

    if (editSelectedFile) {
      const fileError = validateFile(editSelectedFile);
      if (fileError) throw new Error(fileError);

      const formData = new FormData();
      formData.append("title", payload.title);
      formData.append("description", payload.description);
      formData.append("category", payload.category);
      formData.append("status", payload.status);
      formData.append("file", editSelectedFile);
      const replacement = await uploadDocument(formData);

      try {
        await deleteDocument(editingId);
      } catch (deleteError) {
        await deleteDocument(replacement.id).catch(() => undefined);
        throw deleteError;
      }
      showSuccess("Document and file replaced.", "Saved");
    } else {
      await updateDocument(editingId, payload);
      showSuccess("Document updated.", "Saved");
    }

    setEditingId(null);
    setEditFile(null);
    if (editFileInputRef.current) editFileInputRef.current.value = "";
    setIsEditDirty(false);
    await loadItems();
  }

  async function handleEditSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId) return;

    const confirmMessage = editSelectedFile
      ? `Replace the current file with "${editSelectedFile.name}"? The old file will be permanently deleted.`
      : "Save your changes to this document?";
    const publicNote =
      editForm.status === "published"
        ? "\n\nThis document is published, so the changes will be visible on the public website."
        : "";
    if (!window.confirm(confirmMessage + publicNote)) return;

    setError("");
    setIsSubmitting(true);

    try {
      await saveEdit();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to update document.";
      setError(message);
      showError(message, "Unable to update document");
    } finally {
      setIsSubmitting(false);
    }
  }

  function beginEdit(item: DocumentItem) {
    setEditingId(item.id);
    setEditForm({ title: item.title, description: item.description ?? "", category: item.category, status: item.status });
    setEditFile(null);
    if (editFileInputRef.current) editFileInputRef.current.value = "";
    setIsEditDirty(false);
    setError("");
  }

  function requestNavigation(href: string) {
    if (!hasUnsavedChangesRef.current) return false;
    setNavigationError("");
    setPendingNavigation(href);
    return true;
  }

  async function saveDraftAndNavigate() {
    if (!pendingNavigation) return;
    setNavigationError("");
    setIsSubmitting(true);

    try {
      if (isEditDirty && editingId) {
        await saveEdit();
      }

      if (isCreateDirty) {
        if (form.title.trim() && selectedFile) {
          const fileError = validateFile(selectedFile);
          if (fileError) throw new Error(fileError);

          const formData = new FormData();
          formData.append("title", form.title.trim());
          formData.append("description", form.description);
          formData.append("category", form.category);
          formData.append("status", "draft");
          formData.append("file", selectedFile);
          await uploadDocument(formData);
          window.localStorage.removeItem(localDraftKey);
        } else {
          const draftForm = { ...form, status: "draft" as const };
          window.localStorage.setItem(localDraftKey, JSON.stringify(draftForm));
        }
      }

      const destination = pendingNavigation;
      // Update the ref right away so the navigate listener doesn't intercept our own push
      hasUnsavedChangesRef.current = false;
      setIsCreateDirty(false);
      setIsEditDirty(false);
      setPendingNavigation(null);
      router.push(destination);
    } catch (err) {
      setNavigationError(err instanceof Error ? err.message : "Unable to save your changes.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function discardAndNavigate() {
    if (!pendingNavigation) return;
    const destination = pendingNavigation;
    if (isCreateDirty) window.localStorage.removeItem(localDraftKey);
    hasUnsavedChangesRef.current = false;
    setIsCreateDirty(false);
    setIsEditDirty(false);
    setPendingNavigation(null);
    router.push(destination);
  }

  const editingDocument = items.find((item) => item.id === editingId) ?? null;
  const currentFileName = editingDocument?.filePath.split("/").pop() ?? "Stored document";
  const currentFileUrl = editingDocument ? (editingDocument.viewUrl ?? editingDocument.downloadUrl) : undefined;

  const leaveMessage = [
    isEditDirty && editingId ? "Your document edits will be saved." : null,
    isCreateDirty
      ? form.title.trim() && selectedFile
        ? "Your new document and file will be saved as a draft in Documents."
        : "Your new-document form fields will be saved in this browser. You will need to select the file again when you return."
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  async function handleDelete(item: DocumentItem) {
    if (!window.confirm(`Delete "${item.title}" and its stored file?`)) return;
    try {
      await deleteDocument(item.id);
      if (editingId === item.id) {
        closeEdit();
        setEditForm(emptyForm);
      }
      showSuccess("Document deleted.", "Deleted");
      await loadItems();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Unable to delete document.", "Delete failed");
    }
  }

  return (
    <AdminShell title="Documents" onNavigationAttempt={requestNavigation}>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-slate-600">
          Manage public documents, reports, policies, the Citizen&apos;s Charter, the organizational chart, and the Hospital Development Plan.
        </p>
      </div>

      {restoredDraft ? (
        <div role="status" className="mb-5 border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Your unfinished form was restored. Please select its file again; browsers do not retain file selections.
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700 md:col-span-2">
            Title
            <input
              list="document-title-suggestions"
              value={form.title}
              onChange={(event) => {
                setForm((current) => ({ ...current, title: event.target.value }));
                setIsCreateDirty(true);
              }}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white"
              required
            />
            <datalist id="document-title-suggestions">
              <option value="Hospital Development Plan" />
            </datalist>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Category
            <select
              value={form.category}
              onChange={(event) => {
                setForm((current) => ({ ...current, category: event.target.value as DocumentItem["category"] }));
                setIsCreateDirty(true);
              }}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white"
            >
              <option value="report">Report</option>
              <option value="policy">Policy</option>
              <option value="citizens_charter">Citizen&apos;s Charter</option>
              <option value="org_chart">Org chart</option>
              <option value="development_plan">Hospital Development Plan</option>
              <option value="other">Other</option>
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Status
            <select
              value={form.status}
              onChange={(event) => {
                setForm((current) => ({ ...current, status: event.target.value as "draft" | "published" }));
                setIsCreateDirty(true);
              }}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
            <span className="mt-1 block text-xs font-normal text-slate-500">
              Drafts stay in the admin console. Published documents appear on the public website.
            </span>
          </label>

          <label className="block text-sm font-medium text-slate-700 md:col-span-2">
            File
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
              onChange={(event) => {
                setSelectedFile(event.target.files?.[0] ?? null);
                setIsCreateDirty(true);
                setRestoredDraft(false);
              }}
              className="mt-2 block w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 file:mr-3 file:rounded-full file:border-0 file:bg-violet-700 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
              required
            />
          </label>

          <label className="block text-sm font-medium text-slate-700 md:col-span-2">
            Description
            <textarea
              value={form.description}
              onChange={(event) => {
                setForm((current) => ({ ...current, description: event.target.value }));
                setIsCreateDirty(true);
              }}
              className="mt-2 min-h-24 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white"
            />
          </label>
        </div>

        {error && !editingId ? (
          <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-violet-400"
          >
            {isSubmitting ? "Saving..." : form.status === "published" ? "Publish document" : "Save as draft"}
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-[720px] divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Title</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Category</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status</th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-500">Loading documents...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-500">No documents yet.</td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 text-sm font-medium text-slate-900">{item.title}</td>
                  <td className="px-5 py-4 text-sm text-slate-700">{CATEGORY_LABELS[item.category] ?? item.category}</td>
                  <td className="px-5 py-4 text-sm text-slate-700">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {item.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right text-sm">
                    <button type="button" onClick={() => beginEdit(item)} className="font-semibold text-violet-700 hover:text-violet-900">Edit</button>
                    <button type="button" onClick={() => handleDelete(item)} className="ml-4 font-semibold text-red-700 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <Link
          href="/admin/content"
          onClick={(event) => {
            if (requestNavigation("/admin/content")) event.preventDefault();
          }}
          className="text-sm font-medium text-violet-700 hover:text-violet-800"
        >
          ← Back to content overview
        </Link>
      </div>

      {editingId ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="edit-document-title" className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">Document details</p>
                <h2 id="edit-document-title" className="mt-2 text-2xl font-semibold text-slate-950">Edit document</h2>
              </div>
              <button type="button" onClick={requestCloseEdit} aria-label="Close" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-xl leading-none text-slate-500 hover:bg-slate-50">&times;</button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-5">
              <label className="block text-sm font-medium text-slate-700">
                Title
                <input required value={editForm.title} onChange={(event) => {
                  setEditForm((current) => ({ ...current, title: event.target.value }));
                  setIsEditDirty(true);
                }} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900" />
              </label>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Category
                  <select value={editForm.category} onChange={(event) => {
                    setEditForm((current) => ({ ...current, category: event.target.value as DocumentItem["category"] }));
                    setIsEditDirty(true);
                  }} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900">
                    <option value="report">Report</option>
                    <option value="policy">Policy</option>
                    <option value="citizens_charter">Citizen&apos;s Charter</option>
                    <option value="org_chart">Org chart</option>
                    <option value="development_plan">Hospital Development Plan</option>
                    <option value="other">Other</option>
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Publication status
                  <select value={editForm.status} onChange={(event) => {
                    setEditForm((current) => ({ ...current, status: event.target.value as "draft" | "published" }));
                    setIsEditDirty(true);
                  }} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                  <span className="mt-1 block text-xs font-normal text-slate-500">Drafts stay in admin; published documents are public.</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700" htmlFor="replacement-document-file">Replace file (optional)</label>
                <p className="mt-1 text-xs text-slate-500">
                  Current file: {currentFileName}. Leave this empty to keep it.
                </p>
                <input
                  id="replacement-document-file"
                  ref={editFileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
                  onChange={(event) => {
                    setEditFile(event.target.files?.[0] ?? null);
                    setIsEditDirty(true);
                  }}
                  className="mt-2 block w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 file:mr-3 file:rounded-full file:border-0 file:bg-violet-700 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
                />
                {editSelectedFile ? <p className="mt-2 text-sm text-violet-700">Replacement selected: {editSelectedFile.name}</p> : null}

                {/* Preview: replacement file kung may napili, kung wala ang kasalukuyang file */}
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {editSelectedFile ? "New file preview (not saved yet)" : "Current file preview"}
                    </p>
                    {(editSelectedFile ? editPreviewUrl : currentFileUrl) ? (
                      <a
                        href={(editSelectedFile ? editPreviewUrl : currentFileUrl) ?? undefined}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-violet-700 hover:text-violet-900"
                      >
                        Open in new tab
                      </a>
                    ) : null}
                  </div>
                  <div className="h-80 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    {editSelectedFile ? (
                      <FilePreview
                        url={editPreviewUrl}
                        name={editSelectedFile.name}
                        extension={editSelectedFile.name.split(".").pop()}
                        mimeType={editSelectedFile.type}
                      />
                    ) : (
                      <FilePreview
                        url={currentFileUrl}
                        name={currentFileName}
                        extension={editingDocument?.fileExtension ?? currentFileName.split(".").pop()}
                        mimeType={editingDocument?.mimeType}
                      />
                    )}
                  </div>
                </div>
              </div>
              <label className="block text-sm font-medium text-slate-700">
                Description
                <textarea value={editForm.description} onChange={(event) => {
                  setEditForm((current) => ({ ...current, description: event.target.value }));
                  setIsEditDirty(true);
                }} className="mt-2 min-h-28 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900" />
              </label>
              {error ? <div role="alert" className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
              <div className="flex justify-end gap-3">
                <button type="button" onClick={requestCloseEdit} className="border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-60">{isSubmitting ? "Saving..." : "Save changes"}</button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {pendingNavigation ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/55 p-4" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="save-draft-title" className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">Unsaved changes</p>
            <h2 id="save-draft-title" className="mt-2 text-xl font-semibold text-slate-950">Save before leaving?</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{leaveMessage}</p>
            {navigationError ? <div role="alert" className="mt-4 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{navigationError}</div> : null}
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button type="button" disabled={isSubmitting} onClick={() => setPendingNavigation(null)} className="border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Stay</button>
              <button type="button" disabled={isSubmitting} onClick={discardAndNavigate} className="border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Discard</button>
              <button type="button" disabled={isSubmitting} onClick={saveDraftAndNavigate} className="bg-violet-700 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-60">{isSubmitting ? "Saving..." : isEditDirty && editingId ? "Save changes & leave" : "Save draft & leave"}</button>
            </div>
          </section>
        </div>
      ) : null}
    </AdminShell>
  );
}