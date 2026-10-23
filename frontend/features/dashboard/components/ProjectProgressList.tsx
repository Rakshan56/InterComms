import Link from "next/link";
import type { ProjectSummary } from "../../shared/types";

export function ProjectProgressList({ projects }: { projects: ProjectSummary[] }) {
  return <div className="mt-6 space-y-5">{projects.map(project => <Link href={`/projects/${project.id}/tasks`} key={project.id} className="block rounded-lg p-2 transition hover:bg-[#fafbfc]">
    <div className="flex justify-between text-sm"><span className="font-bold">{project.name}</span><span className="font-bold text-[#89909b]">{project.completion}%</span></div>
    <div className="mt-2 h-2 rounded-full bg-[#eef0f3]"><div className="h-2 rounded-full bg-[#4774d9]" style={{ width: `${Math.max(project.completion, 3)}%` }} /></div>
    <p className="mt-2 text-[11px] text-[#9aa0a9]">{project.status.toLowerCase()} · Open tasks →</p>
  </Link>)}</div>;
}
