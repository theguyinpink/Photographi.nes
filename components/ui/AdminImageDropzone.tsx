"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Props = {
  onError?: (message: string) => void;
  label?: string;
  help?: string;
  required?: boolean;
  initialUrl?: string | null;
  value: File | null;
  onChange: (f: File | null) => void;
  accept?: string;
  maxSizeMb?: number;
};

export function AdminImageDropzone({
  label = "Image",
  help = "PNG/JPG — déjà watermarkée",
  required,
  initialUrl,
  value,
  onChange,
  accept = "image/*",
  maxSizeMb = 15,
  onError,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const previewUrl = useMemo(() => {
    if (value) return URL.createObjectURL(value);
    return null;
  }, [value]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const pick = useCallback(() => inputRef.current?.click(), []);

  const validate = useCallback((f: File) => {
    if (f.size > maxSizeMb * 1024 * 1024) {
      return `Fichier trop lourd (max ${maxSizeMb}MB).`;
    }
    if (!f.type.startsWith("image/")) {
      return "Le fichier doit être une image.";
    }
    return null;
  }, [maxSizeMb]);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    const err = validate(f);
    if (err) {
      onChange(null);
      onError?.(err);
      throw new Error(err);
    }
    onChange(f);
  }, [onChange, validate]);

  const onInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      handleFiles(e.target.files);
    } catch {
      // noop
    } finally {
      e.target.value = "";
    }
  }, [handleFiles]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    try {
      handleFiles(e.dataTransfer.files);
    } catch {
      // noop
    }
  }, [handleFiles]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-zinc-900">
            {label} {required ? <span className="text-red-500">*</span> : null}
          </div>
          <div className="text-xs text-zinc-500">{help}</div>
        </div>

        {value ? (
          <button
            type="button"
            className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50"
            onClick={() => onChange(null)}
          >
            Retirer
          </button>
        ) : (
          <button
            type="button"
            className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50"
            onClick={pick}
          >
            Choisir…
          </button>
        )}
      </div>

      <div
        onClick={pick}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={[
          "group cursor-pointer rounded-2xl border bg-white p-3 transition",
          dragOver ? "border-zinc-400" : "border-zinc-200",
          "hover:border-zinc-400",
        ].join(" ")}
      >
        <div className="flex items-start gap-3">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Aperçu" className="h-full w-full object-cover" />
            ) : initialUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={initialUrl} alt="Image actuelle" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
                preview
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            {value ? (
              <div className="space-y-1">
                <div className="truncate text-sm font-medium text-zinc-900">{value.name}</div>
                <div className="text-xs text-zinc-500">
                  {(value.size / (1024 * 1024)).toFixed(2)} MB • {value.type || "image"}
                </div>
                <div className="text-xs text-zinc-500">Clique pour remplacer • ou glisse-dépose</div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-sm text-zinc-900">
                  Glisse ton image ici, ou clique pour choisir
                </div>
                <div className="text-xs text-zinc-500">
                  1 seule image par produit (watermark déjà appliqué)
                </div>
              </div>
            )}
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={onInput}
        />
      </div>
    </div>
  );
}
