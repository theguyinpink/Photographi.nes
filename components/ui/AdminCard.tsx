import type React from "react";

export function AdminCard({
  title,
  subtitle,
  children,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-black/10 bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
      {title ? (
        <div className="mb-5">
          <div className="text-xs uppercase tracking-[0.22em] text-black/40">
            {title}
          </div>
          {subtitle ? (
            <div className="mt-2 text-sm text-black/60">{subtitle}</div>
          ) : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}
