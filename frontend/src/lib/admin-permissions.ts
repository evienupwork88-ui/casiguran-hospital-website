const adminOnlyPaths = [
  "/admin/settings",
  "/admin/users",
  "/admin/audit-logs",
  "/admin/change-requests",
];

export function isAdminOnlyPath(pathname: string): boolean {
  return adminOnlyPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}
