"use client";

import { useState, type KeyboardEvent } from "react";

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
};

export function TagInput({ value, onChange, placeholder }: Props) {
  const [draft, setDraft] = useState("");

  function commit(raw: string) {
    const v = raw.trim();
    if (!v) return;
    if (value.includes(v)) {
      setDraft("");
      return;
    }
    onChange([...value, v]);
    setDraft("");
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit(draft);
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-slate-300 bg-white p-1.5 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500">
      {value.map((tag, i) => (
        <span
          key={`${tag}-${i}`}
          className="inline-flex items-center gap-1 rounded bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700"
        >
          {tag}
          <button
            type="button"
            onClick={() => remove(i)}
            className="text-brand-600 hover:text-brand-800"
            aria-label={`Hapus ${tag}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => commit(draft)}
        placeholder={value.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[8rem] border-0 bg-transparent px-1.5 py-1 text-sm focus:outline-none focus:ring-0"
      />
    </div>
  );
}
