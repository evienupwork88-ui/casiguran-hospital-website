"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { createUser, deactivateUser, getAdminUsers, updateUser, type StaffUser } from "@/lib/api/users";
import { useNotifications } from "@/components/providers/notification-provider";

const emptyForm = {
  email: "",
  firstName: "",
  middleName: "",
  lastName: "",
  nameExtension: "",
  password: "",
  isActive: true,
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const { showSuccess, showError } = useNotifications();

  async function loadUsers() {
    try {
      const data = await getAdminUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load users.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (editingUserId) {
        await updateUser(editingUserId, {
          email: form.email,
          firstName: form.firstName,
          middleName: form.middleName,
          lastName: form.lastName,
          nameExtension: form.nameExtension,
          ...(form.password ? { password: form.password } : {}),
        });
        showSuccess("Staff account updated.", "Saved");
      } else {
        await createUser(form);
        showSuccess("Editor account created.", "Saved");
      }
      setForm(emptyForm);
      setEditingUserId(null);
      await loadUsers();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create user.";
      setError(message);
      showError(message, "Unable to create user");
    } finally {
      setIsSubmitting(false);
    }
  }

  function beginEdit(user: StaffUser) {
    setEditingUserId(user.id);
    setForm({
      email: user.email,
      firstName: user.firstName,
      middleName: user.middleName,
      lastName: user.lastName,
      nameExtension: user.nameExtension,
      password: "",
      isActive: user.isActive,
    });
    setError("");
  }

  async function handleToggleStatus(user: StaffUser) {
    try {
      await updateUser(user.id, { isActive: !user.isActive });
      showSuccess(`User ${user.isActive ? "disabled" : "enabled"}.`, "Status updated");
      await loadUsers();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to update user status.";
      setError(message);
      showError(message, "Unable to update status");
    }
  }

  async function handleDeactivate(user: StaffUser) {
    if (!window.confirm(`Deactivate ${user.fullName}? This action cannot be undone here.`)) return;

    try {
      await deactivateUser(user.id);
      showSuccess("Staff user deactivated.", "Deactivated");
      await loadUsers();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to deactivate user.";
      setError(message);
      showError(message, "Unable to deactivate user");
    }
  }

  return (
    <AdminShell title="Staff Users">
      <form onSubmit={handleSubmit} className="mb-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold text-slate-900">{editingUserId ? "Edit staff account" : "Create editor account"}</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            First name
            <input
              maxLength={100}
              autoComplete="given-name"
              value={form.firstName}
              onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white"
              required
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Middle name <span className="font-normal text-slate-500">(optional)</span>
            <input
              maxLength={100}
              autoComplete="additional-name"
              value={form.middleName}
              onChange={(event) => setForm((current) => ({ ...current, middleName: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Last name
            <input
              maxLength={100}
              autoComplete="family-name"
              value={form.lastName}
              onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white"
              required
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Name extension <span className="font-normal text-slate-500">(optional, e.g. Jr., III)</span>
            <input
              maxLength={30}
              autoComplete="honorific-suffix"
              value={form.nameExtension}
              onChange={(event) => setForm((current) => ({ ...current, nameExtension: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              maxLength={254}
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white"
              required
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Password
            <input
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white"
              required={!editingUserId}
            />
            <span className="mt-1 block text-xs font-normal text-slate-500">{editingUserId ? "Leave blank to keep the current password. New passwords must be at least 12 characters." : "Use at least 12 characters."}</span>
          </label>
        </div>

        {error ? (
          <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-6 flex justify-end">
          {editingUserId ? (
            <button type="button" onClick={() => { setEditingUserId(null); setForm(emptyForm); setError(""); }} className="mr-3 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
          ) : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-violet-400"
          >
            {isSubmitting ? "Saving..." : editingUserId ? "Save changes" : "Create editor"}
          </button>
        </div>
      </form>
      <p className="mb-6 text-sm text-slate-600">Only Editor accounts can be created here. The single Admin account is managed separately. Existing accounts can be edited here, but the Admin cannot be disabled or demoted.</p>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-[720px] divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Name</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Role</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-500">Loading users...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-500">No staff users yet.</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 text-sm font-medium text-slate-900">
                    <div>{user.fullName}</div>
                    <div className="text-slate-500">{user.email}</div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-700 capitalize">{user.role}</td>
                  <td className="px-5 py-4 text-sm text-slate-700">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => beginEdit(user)} className="rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5 font-medium text-violet-700 hover:bg-violet-100">Edit</button>
                      {user.role === "editor" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(user)}
                            className="rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5 font-medium text-violet-700 hover:bg-violet-100"
                          >
                            {user.isActive ? "Disable" : "Enable"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeactivate(user)}
                            className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 font-medium text-red-700 hover:bg-red-100"
                          >
                            Deactivate
                          </button>
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <Link href="/admin/content" className="text-sm font-medium text-violet-700 hover:text-violet-800">
          ← Back to content overview
        </Link>
      </div>
    </AdminShell>
  );
}
