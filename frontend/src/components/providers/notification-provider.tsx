"use client";

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  XCircle,
} from "lucide-react";

type NotificationVariant = "success" | "error" | "warning" | "info";

type ToastNotification = {
  id: string;
  title: string;
  message?: string;
  variant: NotificationVariant;
  duration?: number;
};

type NotificationContextValue = {
  showToast: (input: {
    title: string;
    message?: string;
    variant?: NotificationVariant;
    duration?: number;
  }) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

function getIcon(variant: NotificationVariant) {
  const sharedClassName = "h-5 w-5 shrink-0";

  switch (variant) {
    case "success":
      return <CheckCircle2 className={`${sharedClassName} text-emerald-600`} />;
    case "error":
      return <XCircle className={`${sharedClassName} text-red-600`} />;
    case "warning":
      return <AlertTriangle className={`${sharedClassName} text-amber-600`} />;
    case "info":
      return <Info className={`${sharedClassName} text-violet-600`} />;
    default:
      return <Info className={`${sharedClassName} text-violet-600`} />;
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((input: {
    title: string;
    message?: string;
    variant?: NotificationVariant;
    duration?: number;
  }) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const variant = input.variant ?? "info";
    const nextToast: ToastNotification = {
      id,
      title: input.title,
      message: input.message,
      variant,
      duration: input.duration ?? (variant === "error" ? 6000 : 4500),
    };

    setToasts((current) => {
      const duplicate = current.find(
        (toast) =>
          toast.variant === nextToast.variant &&
          toast.title === nextToast.title &&
          toast.message === nextToast.message,
      );

      if (duplicate) {
        return current;
      }

      return [...current, nextToast];
    });

    window.setTimeout(() => {
      dismissToast(id);
    }, input.duration ?? (variant === "error" ? 6000 : 4500));
  }, [dismissToast]);

  const contextValue = useMemo<NotificationContextValue>(
    () => ({
      showToast,
      showSuccess: (message, title = "Success") => showToast({ title, message, variant: "success" }),
      showError: (message, title = "Something went wrong") => showToast({ title, message, variant: "error" }),
      showWarning: (message, title = "Warning") => showToast({ title, message, variant: "warning" }),
      showInfo: (message, title = "Information") => showToast({ title, message, variant: "info" }),
    }),
    [showToast],
  );

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <div
        className="pointer-events-none fixed right-3 top-3 z-[100] flex w-[min(92vw,24rem)] flex-col gap-3 sm:right-5 sm:top-5"
      >
        {toasts.map((toast) => {
          const toneClasses = {
            success: "border-emerald-200 bg-emerald-50 text-emerald-950",
            error: "border-red-200 bg-red-50 text-red-950",
            warning: "border-amber-200 bg-amber-50 text-amber-950",
            info: "border-violet-200 bg-violet-50 text-violet-950",
          };

          return (
            <div
              key={toast.id}
              role={toast.variant === "error" ? "alert" : "status"}
              aria-live={toast.variant === "error" ? "assertive" : "polite"}
              className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-3 shadow-[0_18px_40px_rgba(76,29,149,0.08)] backdrop-blur-sm ${toneClasses[toast.variant]}`}
            >
              <div className="mt-0.5">{getIcon(toast.variant)}</div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.message ? (
                  <p className="mt-1 text-sm leading-6 opacity-90">{toast.message}</p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
                className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full text-current/70 transition hover:bg-black/5 hover:text-current"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }

  return context;
}
