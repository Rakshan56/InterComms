import Link from "next/link";

export function MetricCard({
  label,
  value,
  trend,
  href,
  attention = false,
}: {
  label: string;
  value: string | number;
  trend: string;
  href: string;
  attention?: boolean;
}) {
  return (
    <Link
      href={href}
      className="card p-5 transition hover:-translate-y-0.5 hover:border-[#4774d9]"
    >
      <p className="text-xs font-semibold text-[#89909b]">{label}</p>
      <p className="mt-3 text-3xl font-extrabold">{value}</p>
      <p
        className={`mt-3 text-[11px] font-bold ${attention ? "text-[#ed6b72]" : "text-[#1d9a73]"}`}
      >
        {trend}
      </p>
      <p className="mt-3 text-[11px] font-bold text-[#4774d9]">
        Open section →
      </p>
    </Link>
  );
}
