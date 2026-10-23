"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Shell } from "../../components/shell";
import { MetricCard } from "../../features/dashboard/components/MetricCard";
import { ProjectProgressList } from "../../features/dashboard/components/ProjectProgressList";
import type { DashboardSummary } from "../../features/dashboard/types";
import { api } from "../../features/shared/api";

export default function Dashboard() {
  const [data, setData] = useState<DashboardSummary>(); const [error, setError] = useState("");
  useEffect(() => { api<DashboardSummary>("/dashboard/summary").then(setData).catch(() => setError("Your session may have expired.")); }, []);
  const completion = data?.totalTasks ? Math.round(data.completedTasks / data.totalTasks * 100) : 0;
  return <Shell title="Dashboard"><div className="mb-6 flex items-center justify-between"><p className="text-sm text-[#89909b]">Here’s what is happening across your workspace today.</p><Link href="/projects" className="rounded-lg bg-[#252b35] px-4 py-2.5 text-sm font-bold text-white">View projects</Link></div>
    <div className="grid gap-4 md:grid-cols-4"><MetricCard label="Total projects" value={data?.projects ?? "—"} trend="↑ 12% this month" href="/projects" /><MetricCard label="Active projects" value={data?.activeProjects ?? "—"} trend="↑ 8% this month" href="/projects" /><MetricCard label="Completed tasks" value={data ? `${data.completedTasks}/${data.totalTasks}` : "—"} trend="↑ 24% this month" href="/projects" /><MetricCard label="Overdue tasks" value={data?.overdue ?? "—"} trend="Needs attention" href="/projects" attention /></div>
    {error && <p className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
    <section className="mt-5 grid gap-5 xl:grid-cols-[1.6fr_1fr_0.9fr]"><div className="card p-6"><div className="flex items-center justify-between"><div><h2 className="font-extrabold">Active tasks</h2><p className="mt-1 text-xs text-[#9aa0a9]">Current workload by project</p></div><Link href="/projects" className="text-xs font-bold text-[#59616d] underline">View all</Link></div><ProjectProgressList projects={data?.recentProjects ?? []} /></div>
      <Link href="/projects" className="card block p-6 transition hover:-translate-y-0.5 hover:border-[#4774d9]"><h2 className="font-extrabold">Completion report</h2><p className="mt-1 text-xs text-[#9aa0a9]">All workspace tasks · Open projects →</p><div className="mx-auto mt-7 grid h-36 w-36 place-items-center rounded-full" style={{ background: `conic-gradient(#4774d9 ${completion}%, #edf0f4 0)` }}><div className="grid h-28 w-28 place-items-center rounded-full bg-white"><div className="text-center"><p className="text-3xl font-extrabold">{completion}%</p><p className="text-[10px] text-[#9aa0a9]">Completed</p></div></div></div><div className="mt-6 flex justify-between text-xs"><span className="text-[#89909b]">Completed <b className="text-[#20242b]">{data?.completedTasks ?? 0}</b></span><span className="text-[#89909b]">Total <b className="text-[#20242b]">{data?.totalTasks ?? 0}</b></span></div></Link>
      <div className="card p-6"><h2 className="font-extrabold">Upcoming</h2><p className="mt-1 text-xs text-[#9aa0a9]">Your next deadlines</p><div className="mt-6 space-y-3"><Link href="/calendar" className="flex gap-3 rounded-lg p-2 transition hover:bg-[#fafbfc]"><span className="mt-1 h-2 w-2 rounded-full bg-[#f0c51b]" /><div><p className="text-sm font-bold">Project milestones</p><p className="mt-1 text-[11px] text-[#9aa0a9]">Review calendar →</p></div></Link><Link href="/users" className="flex gap-3 rounded-lg p-2 transition hover:bg-[#fafbfc]"><span className="mt-1 h-2 w-2 rounded-full bg-[#4774d9]" /><div><p className="text-sm font-bold">Team check-in</p><p className="mt-1 text-[11px] text-[#9aa0a9]">Open team members →</p></div></Link></div></div>
    </section></Shell>;
}
