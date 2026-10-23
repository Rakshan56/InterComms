"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Shell } from "../../components/shell";
import { api } from "../../lib/api";
type Notification = { id: string; action: string; actor: string; createdAt: string; project: { id: string; name: string } | null; task: { id: string; title: string; projectId: string } | null };
const labels: Record<string, string> = { PROJECT_CREATED: "created a project", PROJECT_ARCHIVED: "archived a project", TASK_CREATED: "created a task", TASK_UPDATED: "updated a task", COMMENT_CREATED: "added a comment", COMMENT_DELETED: "deleted a comment" };
export default function Notifications() {
  const [items, setItems] = useState<Notification[]>([]); const [error, setError] = useState("");
  useEffect(() => { api<Notification[]>("/notifications").then(setItems).catch(() => setError("Unable to load notifications.")); }, []);
  return <Shell title="Notifications"><div className="mb-6 flex items-center justify-between"><p className="text-sm text-[#89909b]">Recent activity from your accessible workspace.</p><Link href="/dashboard" className="text-xs font-bold text-[#4774d9]">Back to dashboard</Link></div><div className="card divide-y divide-[#edf0f3]">{error && <p className="p-6 text-sm text-red-700">{error}</p>}{!error && !items.length && <div className="p-12 text-center"><p className="font-bold">You’re all caught up</p><p className="mt-2 text-sm text-[#89909b]">New project and task activity will appear here.</p></div>}{items.map(item => { const href = item.task ? `/tasks/${item.task.id}` : item.project ? `/projects/${item.project.id}` : "/dashboard"; return <Link href={href} key={item.id} className="flex items-start gap-4 p-5 transition hover:bg-[#fafbfc]"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#e7efff] text-xs font-bold text-[#315eb7]">{item.actor.slice(0, 2).toUpperCase()}</span><div className="min-w-0 flex-1"><p className="text-sm"><b>{item.actor}</b> {labels[item.action] ?? item.action.toLowerCase().replaceAll("_", " ")}</p><p className="mt-1 truncate text-xs text-[#89909b]">{item.task?.title ?? item.project?.name ?? "Workspace activity"} · {new Date(item.createdAt).toLocaleString()}</p></div><span className="text-xs font-bold text-[#4774d9]">Open →</span></Link>; })}</div></Shell>;
}
