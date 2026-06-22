"use client";

import { RATING_SCALE_LABELS } from "@/lib/survey-questions";

type Props = {
  name: string;
  value: number | null;
  onChange: (val: number) => void;
};

const VALUES: (1 | 2 | 3 | 4)[] = [1, 2, 3, 4];

const TONE: Record<number, { active: string; dot: string; emoji: string }> = {
  1: { active: "border-red-500 bg-red-50 text-red-700 ring-red-200", dot: "bg-red-500", emoji: "😞" },
  2: { active: "border-amber-500 bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-500", emoji: "😐" },
  3: { active: "border-sky-500 bg-sky-50 text-sky-700 ring-sky-200", dot: "bg-sky-500", emoji: "🙂" },
  4: { active: "border-emerald-500 bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500", emoji: "😄" },
};

export function RatingScale({ name, value, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {VALUES.map((v) => {
        const selected = value === v;
        const tone = TONE[v];
        return (
          <label
            key={v}
            className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 p-3 text-center transition active:scale-[0.98] ${
              selected
                ? `${tone.active} ring-2`
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={v}
              checked={selected}
              onChange={() => onChange(v)}
              className="sr-only"
            />
            <span className="text-2xl leading-none" aria-hidden>
              {tone.emoji}
            </span>
            <span
              className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                selected ? tone.dot : "bg-slate-300"
              }`}
            >
              {v}
            </span>
            <span className="text-[11px] font-medium leading-tight sm:text-xs">
              {RATING_SCALE_LABELS[v]}
            </span>
          </label>
        );
      })}
    </div>
  );
}
