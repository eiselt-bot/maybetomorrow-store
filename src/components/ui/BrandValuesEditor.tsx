'use client';

/**
 * BrandValuesEditor — client component for managing 5 ranked brand values.
 * Supports:
 * - Editing text in each slot
 * - Drag + drop reordering (native HTML5 dnd)
 * - ▲ / ▼ keyboard-friendly arrow buttons as fallback
 *
 * The surrounding server-action form receives value_0..value_4 in the
 * currently-rendered order via hidden inputs. The form action itself is
 * unchanged (updateBrandValuesForm).
 */

import { useState, useRef } from 'react';

type Props = {
  initialValues: string[];
  primary: string;
};

export function BrandValuesEditor({ initialValues, primary }: Props) {
  // Pad/truncate to exactly 5 slots
  const [values, setValues] = useState<string[]>(() => {
    const padded = [...initialValues];
    while (padded.length < 5) padded.push('');
    return padded.slice(0, 5);
  });
  const dragIndex = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  function handleChange(i: number, v: string) {
    const next = [...values];
    next[i] = v;
    setValues(next);
  }

  function move(i: number, dir: -1 | 1) {
    const target = i + dir;
    if (target < 0 || target >= 5) return;
    const next = [...values];
    [next[i], next[target]] = [next[target], next[i]];
    setValues(next);
  }

  function handleDragStart(e: React.DragEvent, i: number) {
    dragIndex.current = i;
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e: React.DragEvent, i: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOver !== i) setDragOver(i);
  }

  function handleDragLeave() {
    setDragOver(null);
  }

  function handleDrop(e: React.DragEvent, targetIdx: number) {
    e.preventDefault();
    const src = dragIndex.current;
    dragIndex.current = null;
    setDragOver(null);
    if (src === null || src === targetIdx) return;
    const next = [...values];
    const [moved] = next.splice(src, 1);
    next.splice(targetIdx, 0, moved);
    setValues(next);
  }

  function handleDragEnd() {
    dragIndex.current = null;
    setDragOver(null);
  }

  const placeholders = [
    'Handcrafted with care',
    'Rooted in Diani',
    'Fair to every maker',
    'Lasting, not throw-away',
    'Straight from the source',
  ];

  return (
    <div className="space-y-4">
      {values.map((val, i) => {
        const isDragTarget = dragOver === i;
        return (
          <div
            key={i}
            draggable
            onDragStart={(e) => handleDragStart(e, i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, i)}
            onDragEnd={handleDragEnd}
            className={`relative flex items-center gap-4 rounded-2xl border-2 bg-gradient-to-br from-sand-50 to-white p-4 transition-all ${
              isDragTarget
                ? 'border-ochre-500 ring-4 ring-ochre-400/30 scale-[1.01]'
                : 'border-teal-900/10 hover:border-ochre-400/50'
            }`}
            style={{ borderColor: !isDragTarget ? `${primary}30` : undefined }}
          >
            {/* Drag handle */}
            <div
              className="flex flex-col items-center gap-0.5 text-teal-900/30 cursor-grab active:cursor-grabbing select-none"
              title="Drag to reorder"
              aria-hidden
            >
              <span className="text-xl leading-none">⋮⋮</span>
              <span className="text-[9px] uppercase tracking-widest">drag</span>
            </div>

            {/* Rank badge */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base shadow-md flex-shrink-0"
              style={{ backgroundColor: primary }}
            >
              {i + 1}
            </div>

            {/* Value textarea */}
            <div className="flex-1 min-w-0">
              <label className="block text-[10px] font-semibold tracking-widest uppercase text-teal-900/50 mb-1">
                Value {i + 1} {i === 0 && '· most important'}
              </label>
              <textarea
                value={val}
                onChange={(e) => handleChange(i, e.target.value)}
                rows={2}
                placeholder={placeholders[i]}
                className="w-full resize-none rounded-lg border border-teal-900/10 bg-white px-3 py-2 text-sm text-teal-900 placeholder:text-teal-900/30 focus:outline-none focus:ring-2 focus:ring-ochre-400/30 transition font-display leading-snug"
              />
              {/* Hidden input so the form action receives the current order */}
              <input type="hidden" name={`value_${i}`} value={val} />
            </div>

            {/* Up/down arrows (drag-drop fallback) */}
            <div className="flex flex-col gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="w-7 h-7 rounded-md border border-teal-900/15 text-teal-900/60 hover:text-ochre-600 hover:border-ochre-500 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center justify-center"
                aria-label="Move up"
                title="Move up"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === 4}
                className="w-7 h-7 rounded-md border border-teal-900/15 text-teal-900/60 hover:text-ochre-600 hover:border-ochre-500 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center justify-center"
                aria-label="Move down"
                title="Move down"
              >
                ▼
              </button>
            </div>
          </div>
        );
      })}

      <p className="text-xs text-teal-900/50 text-center mt-2">
        Drag cards to reorder, or use the ▲ / ▼ buttons. Rank 1 is the most
        important value and steers the mockup generator most strongly.
      </p>
    </div>
  );
}
