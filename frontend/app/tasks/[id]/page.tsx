"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Shell } from "../../../components/shell";
import { api } from "../../../lib/api";
export default function TaskPage() {
  const { id } = useParams<{ id: string }>();
  const [task, setTask] = useState<any>();
  const [comment, setComment] = useState("");
  useEffect(() => {
    if (id) api<any>(`/tasks/${id}`).then(setTask);
  }, [id]);
  async function addComment() {
    if (!comment.trim()) return;
    await api(`/tasks/${id}/comments`, {
      method: "POST",
      body: JSON.stringify({ content: comment }),
    });
    setComment("");
    api<any>(`/tasks/${id}`).then(setTask);
  }
  return (
    <Shell title={task?.title || "Task details"}>
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="card p-7">
          <span className="pill bg-mint">
            {task?.status?.replace("_", " ")}
          </span>
          <h2 className="mt-5 text-3xl font-black">{task?.title}</h2>
          <p className="mt-4 leading-7 text-black/60">
            {task?.description || "No description provided."}
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-black/40">Priority</p>
              <p className="mt-1 font-bold">{task?.priority}</p>
            </div>
            <div>
              <p className="text-black/40">Version</p>
              <p className="mt-1 font-bold">{task?.version}</p>
            </div>
          </div>
        </div>
        <div className="card p-7">
          <h2 className="font-bold">Comments</h2>
          <div className="mt-5 space-y-4">
            {task?.comments?.map((c: any) => (
              <div key={c.id} className="rounded-2xl bg-cream p-4">
                <p className="text-sm">{c.content}</p>
                <p className="mt-2 text-xs text-black/40">{c.author.name}</p>
              </div>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment…"
            className="mt-5 min-h-24 w-full rounded-xl border border-black/10 p-3"
          />
          <button
            onClick={addComment}
            className="mt-3 rounded-full bg-ink px-5 py-2 text-sm font-bold text-white"
          >
            Comment
          </button>
        </div>
      </div>
    </Shell>
  );
}
