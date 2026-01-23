"use client";

import * as React from "react";

type Variant = "primary" | "ghost" | "outline" | "danger";

export function AdminButton({
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition " +
    "disabled:opacity-50 disabled:cursor-not-allowed";

  const styles: Record<Variant, string> = {
    primary: "bg-black text-white hover:bg-black/90",
    ghost: "bg-transparent text-black/70 hover:bg-black/[0.04]",
    outline:
      "border border-black/12 bg-white text-black/80 hover:bg-black/[0.03]",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  return <button className={`${base} ${styles[variant]} ${className}`} {...props} />;
}
