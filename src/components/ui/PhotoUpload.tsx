'use client';

/**
 * PhotoUpload — admin file-picker that uploads to /api/upload and writes
 * the returned URL into a hidden <input name={name}> so the surrounding
 * server-action form can submit it like any other text field.
 *
 * Shows a thumbnail preview of the current value, a "Choose file" button,
 * and inline progress/error state. Works inside any <form>.
 */

import { useState, useTransition } from 'react';

type Props = {
  name: string;
  label?: string;
  defaultUrl?: string | null;
  required?: boolean;
  className?: string;
};

export function PhotoUpload({
  name,
  label = 'Photo',
  defaultUrl = '',
  required = false,
  className = '',
}: Props) {
  const [url, setUrl] = useState<string>(defaultUrl ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (file.size > 5 * 1024 * 1024) {
      setError(`File too large: ${(file.size / 1024 / 1024).toFixed(1)} MB > 5 MB`);
      e.target.value = '';
      return;
    }

    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.append('file', file);
        const r = await fetch('/api/upload', { method: 'POST', body: fd });
        if (!r.ok) {
          const j = await r.json().catch(() => ({ error: r.statusText }));
          setError(j.error ?? 'Upload failed');
          return;
        }
        const j = (await r.json()) as { url: string };
        setUrl(j.url);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        e.target.value = '';
      }
    });
  }

  function clearPhoto() {
    setUrl('');
    setError(null);
  }

  return (
    <div className={className}>
      <label className="block text-xs font-semibold tracking-widest uppercase text-teal-900/60 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      <input type="hidden" name={name} value={url} />

      <div className="flex items-start gap-4">
        {url ? (
          <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-teal-900/10 bg-sand-50 flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt="preview"
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-24 h-24 rounded-lg border-2 border-dashed border-teal-900/15 bg-sand-50 flex-shrink-0 flex items-center justify-center text-[10px] text-teal-900/40">
            no photo
          </div>
        )}

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <label
              className={`inline-flex items-center rounded-lg border border-teal-900/15 bg-white px-3 py-1.5 text-xs font-semibold text-teal-900 cursor-pointer hover:border-ochre-500 hover:text-ochre-600 transition ${
                isPending ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              {isPending ? 'Uploading…' : url ? 'Replace' : 'Choose file'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={onPick}
                disabled={isPending}
                className="sr-only"
              />
            </label>
            {url && !isPending && (
              <button
                type="button"
                onClick={clearPhoto}
                className="inline-flex items-center rounded-lg border border-teal-900/10 px-3 py-1.5 text-xs text-teal-900/60 hover:border-red-400 hover:text-red-600 transition"
              >
                Remove
              </button>
            )}
          </div>

          {url && (
            <p className="text-[10px] text-teal-900/50 font-mono truncate">
              {url}
            </p>
          )}
          {error && <p className="text-[11px] text-red-600">{error}</p>}
          <p className="text-[10px] text-teal-900/40">
            JPEG, PNG, WebP, GIF · max 5 MB
          </p>
        </div>
      </div>
    </div>
  );
}
