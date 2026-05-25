type Props = {
  scoreV: number;
  scoreA: number;
  scoreK: number;
};

export function VAKChart({ scoreV, scoreA, scoreK }: Props) {
  const max = Math.max(scoreV, scoreA, scoreK, 1);
  const bars: { label: string; value: number; color: string }[] = [
    { label: "Visual", value: scoreV, color: "bg-sky-500" },
    { label: "Auditory", value: scoreA, color: "bg-amber-500" },
    { label: "Kinesthetic", value: scoreK, color: "bg-emerald-500" },
  ];

  return (
    <div className="space-y-3">
      {bars.map((b) => (
        <div key={b.label}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">{b.label}</span>
            <span className="tabular-nums text-slate-600">{b.value}</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full ${b.color} transition-all`}
              style={{ width: `${(b.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
