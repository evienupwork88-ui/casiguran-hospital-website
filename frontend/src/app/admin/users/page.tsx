"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { createUser, deactivateUser, getAdminUsers, updateUser, type StaffUser } from "@/lib/api/users";
import { useNotifications } from "@/components/providers/notification-provider";

const emptyForm = {
  email: "",
  fullName: "",
  role: "editor" as "admin" | "editor",
  password: "",
  isActive: true,
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
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
      await createUser(form);
      setForm(emptyForm);
      showSuccess("Staff user created.", "Saved");
      await loadUsers();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create user.";
      setError(message);
      showError(message, "Unable to create user");
    } finally {
      setIsSubmitting(false);
    }
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
      <form onSubmit={handleSubmit} className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            Full name
            <input
              autoComplete="name"
              value={form.fullName}
              onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white"
              required
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white"
              required
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Role
            <select
              value={form.role}
              onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as "admin" | "editor" }))}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white"
            >
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Password
            <input
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white"
              required
            />
          </label>
        </div>

        {error ? (
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
            {isSubmitting ? "Saving..." : "Create user"}
          </button>
        </div>
      </form>

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
