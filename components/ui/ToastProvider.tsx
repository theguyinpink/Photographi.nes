"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastKind = "success" | "error" | "info";

type Toast = {
  id: string;
  kind: ToastKind;
  title?: string;
  message: string;
  createdAt: number;
  timeoutMs: number;
};

type ToastInput = Omit<Toast, "id" | "createdAt">;

type ToastCtx = {
  push: (t: ToastInput) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
};

const Ctx = createContext<ToastCtx | null>(null);

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((t: ToastInput) => {
    const id = uid();
    const toast: Toast = {
      id,
      createdAt: Date.now(),
      timeoutMs: t.timeoutMs ?? 3500,
      kind: t.kind ?? "info",
      title: t.title,
      message: t.message,
    };

    setToasts((prev) => [...prev, toast]);

    window.setTimeout(() => remove(id), toast.timeoutMs);
  }, [remove]);

  const api = useMemo<ToastCtx>(() => ({
    push,
    success: (message, title) => push({ kind: "success", message, title, timeoutMs: 2800 }),
    error: (message, title) => push({ kind: "error", message, title, timeoutMs: 5500 }),
    info: (message, title) => push({ kind: "info", message, title, timeoutMs: 3500 }),
  }), [push]);

  return (
    <Ctx.Provider value={api}>
      {children}

      {/* Toast stack */}
      <div className="fixed bottom-4 right-4 z-50 flex w-[min(420px,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              "rounded-2xl border bg-white/90 p-3 shadow-sm backdrop-blur",
              t.kind === "success" ? "border-emerald-200" : "",
              t.kind === "error" ? "border-red-200" : "",
              t.kind === "info" ? "border-zinc-200" : "",
            ].join(" ")}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <div
                className={[
                  "mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
                  t.kind === "success" ? "bg-emerald-500" : "",
                  t.kind === "error" ? "bg-red-500" : "",
                  t.kind === "info" ? "bg-zinc-500" : "",
                ].join(" ")}
              />
              <div className="min-w-0 flex-1">
                {t.title ? <div className="text-sm font-medium text-zinc-900">{t.title}</div> : null}
                <div className="text-sm text-zinc-700">{t.message}</div>
              </div>

              <button
                type="button"
                onClick={() => remove(t.id)}
                className="rounded-xl px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useToast must be used within ToastProvider");
  return v;
}
