export default function ProgressCard({
  label,
  value,
  hint,
  accent = "brand",
  icon,
}) {
  const accents = {
    brand: "bg-brand-50 text-brand-700 border-brand-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
    ink: "bg-ink-50 text-ink-700 border-ink-100",
  };
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="label">{label}</div>
          <div className="mt-2 text-3xl font-semibold text-ink-900 tabular-nums">{value}</div>
          {hint ? <div className="mt-1 text-sm muted">{hint}</div> : null}
        </div>
        {icon ? (
          <div
            className={`h-10 w-10 rounded-xl border flex items-center justify-center text-base ${
              accents[accent] || accents.brand
            }`}
          >
            {icon}
          </div>
        ) : null}
      </div>
    </div>
  );
}
