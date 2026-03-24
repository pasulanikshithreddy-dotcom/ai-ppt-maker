export function StatCard({
  label,
  value,
  change,
}: {
  label: string;
  value: string;
  change: string;
}) {
  return (
    <div className="surface-card rounded-[1.5rem] p-5">
      <p className="text-sm text-mist">{label}</p>
      <p className="mt-4 font-display text-4xl font-semibold text-white">{value}</p>
      <p className="mt-3 text-sm text-cyan">{change}</p>
    </div>
  );
}
