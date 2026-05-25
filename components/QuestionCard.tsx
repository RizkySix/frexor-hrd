"use client";

import type { Question } from "@/lib/questions";

type Props = {
  question: Question;
  value: "A" | "B" | "C" | null;
  onChange: (val: "A" | "B" | "C") => void;
};

export function QuestionCard({ question, value, onChange }: Props) {
  const opts: ("A" | "B" | "C")[] = ["A", "B", "C"];
  return (
    <div
      id={`q-${question.no}`}
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm scroll-mt-24"
    >
      <div className="flex items-start gap-3">
        <span className="inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-full bg-brand-100 px-2 text-xs font-semibold text-brand-700">
          {question.no}
        </span>
        <p className="font-medium text-slate-900">{question.text}</p>
      </div>

      <div className="mt-4 space-y-2">
        {opts.map((opt) => {
          const selected = value === opt;
          return (
            <label
              key={opt}
              className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2 text-sm transition ${
                selected
                  ? "border-brand-500 bg-brand-50"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name={`q-${question.no}`}
                value={opt}
                checked={selected}
                onChange={() => onChange(opt)}
                className="mt-0.5 h-4 w-4 accent-brand-500"
              />
              <span>
                <span className="mr-2 font-semibold text-slate-700">{opt}.</span>
                {question.options[opt]}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
