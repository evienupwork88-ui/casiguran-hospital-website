export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  firstName: string;
  middleName: string;
  lastName: string;
  nameExtension: string;
  role: "admin" | "editor";
  mfaEnabled: boolean;
  requiresMfaSetup: boolean;
  requiresMfaVerification: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const CSRF_STORAGE_KEY = "cdh_csrf";

export class ApiRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiRequestError(data?.error?.message ?? "Request failed", response.status);
  }

  return data as T;
}

export function getCsrfToken(): string | null {
  if (typeof document !== "undefined") {
    const match = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith("cdh_csrf="));
    if (match) return decodeURIComponent(match.split("=")[1] ?? "");
  }
  return typeof window === "undefined" ? null : window.sessionStorage.getItem(CSRF_STORAGE_KEY);
}

function csrfHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const csrfToken = getCsrfToken();
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  return headers;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await parseJson<{ user: AuthUser; csrfToken?: string }>(response);
  if (data.csrfToken) window.sessionStorage.setItem(CSRF_STORAGE_KEY, data.csrfToken);
  return data.user;
}

export async function startMfaSetup(): Promise<{ secret: string; otpauthUrl: string }> {
  const response = await fetch(`${API_BASE_URL}/api/auth/mfa/setup`, {
    method: "POST",
    credentials: "include",
    headers: csrfHeaders(),
    body: JSON.stringify({}),
  });
  return parseJson(response);
}

export async function completeMfaSetup(code: string): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/api/auth/mfa/setup/complete`, {
    method: "POST",
    credentials: "include",
    headers: csrfHeaders(),
    body: JSON.stringify({ code }),
  });
  const data = await parseJson<{ recoveryCodes: string[]; csrfToken?: string }>(response);
  if (data.csrfToken) window.sessionStorage.setItem(CSRF_STORAGE_KEY, data.csrfToken);
  return data.recoveryCodes;
}

export async function verifyMfa(code: string, useRecoveryCode: boolean): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/auth/mfa/verify`, {
    method: "POST",
    credentials: "include",
    headers: csrfHeaders(),
    body: JSON.stringify({ code, useRecoveryCode }),
  });
  const data = await parseJson<{ message: string; csrfToken?: string }>(response);
  if (data.csrfToken) window.sessionStorage.setItem(CSRF_STORAGE_KEY, data.csrfToken);
}

export async function requestPasswordReset(email: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  await parseJson<{ message: string }>(response);
}

export async function resetPassword(email: string, code: string, password: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code, password }),
  });
  await parseJson<{ message: string }>(response);
}

export async function getMe(): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  const data = await parseJson<{ user: AuthUser; csrfToken?: string }>(response);
  if (data.csrfToken) window.sessionStorage.setItem(CSRF_STORAGE_KEY, data.csrfToken);
  return data.user;
}

export async function logout(): Promise<void> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (csrfToken) {
    headers["x-csrf-token"] = csrfToken;
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
    headers,
  });

  await parseJson<{ message: string }>(response);
  window.sessionStorage.removeItem(CSRF_STORAGE_KEY);
}
