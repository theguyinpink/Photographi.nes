import * as React from "react";

export function AdminField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <label className="text-sm font-semibold tracking-tight">{label}</label>
        {hint ? <span className="text-xs text-black/40">{hint}</span> : null}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

export function AdminInput(
  props: React.InputHTMLAttributes<HTMLInputElement>
) {
  return (
    <input
      {...props}
      className={
        "w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none " +
        "focus:border-black/30 focus:ring-0 " +
        (props.className ?? "")
      }
    />
  );
}

export function AdminTextarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  return (
    <textarea
      {...props}
      className={
        "w-full min-h-30 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none " +
        "focus:border-black/30 focus:ring-0 " +
        (props.className ?? "")
      }
    />
  );
}
