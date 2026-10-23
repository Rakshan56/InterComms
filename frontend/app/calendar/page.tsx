"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Shell } from "../../components/shell";
import { api } from "../../lib/api";

type CalendarTask = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string;
  project: { id: string; name: string };
  assignee?: { id: string; name: string };
};
const dateKey = (date: Date) => date.toISOString().slice(0, 10);

export default function Calendar() {
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [month, setMonth] = useState(() => new Date());
  const [error, setError] = useState("");
  useEffect(() => {
    api<CalendarTask[]>("/calendar")
      .then(setTasks)
      .catch(() => setError("Unable to load your calendar."));
  }, []);
  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const cells: (Date | null)[] = Array(first.getDay()).fill(null);
    for (let day = 1; day <= last.getDate(); day += 1)
      cells.push(new Date(month.getFullYear(), month.getMonth(), day));
    while (cells.length % 7) cells.push(null);
    return cells;
  }, [month]);
  const tasksByDate = new Map(
    tasks.map((task) => [dateKey(new Date(task.dueDate)), task]),
  );
  const monthLabel = month.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  return (
    <Shell title="Calendar">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-[#89909b]">
          Plan deadlines across your accessible projects.
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMonth(new Date())}
            className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-[#59616d]"
          >
            Today
          </button>
          <button
            onClick={() =>
              setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
            }
            className="rounded-lg bg-white px-3 py-2 text-sm"
          >
            ←
          </button>
          <button
            onClick={() =>
              setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
            }
            className="rounded-lg bg-white px-3 py-2 text-sm"
          >
            →
          </button>
        </div>
      </div>
      {error && (
        <p className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#edf0f3] p-5">
          <h2 className="text-lg font-extrabold">{monthLabel}</h2>
          <span className="text-xs text-[#89909b]">
            {tasks.length} scheduled task{tasks.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="grid grid-cols-7 border-b border-[#edf0f3] bg-[#fafbfc]">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="p-3 text-center text-[10px] font-bold uppercase tracking-wide text-[#a0a6af]"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const task = day ? tasksByDate.get(dateKey(day)) : undefined;
            return (
              <div
                key={`${day?.toISOString() ?? "empty"}-${index}`}
                className="min-h-28 border-b border-r border-[#edf0f3] p-2"
              >
                {day && (
                  <p
                    className={`text-xs font-bold ${dateKey(day) === dateKey(new Date()) ? "grid h-6 w-6 place-items-center rounded-full bg-[#f0c51b]" : "text-[#89909b]"}`}
                  >
                    {day.getDate()}
                  </p>
                )}
                {task && (
                  <Link
                    href={`/tasks/${task.id}`}
                    className="mt-2 block rounded-lg bg-[#e7efff] p-2 text-[11px] font-bold text-[#315eb7] hover:bg-[#d9e6ff]"
                  >
                    <span className="block truncate">{task.title}</span>
                    <span className="mt-1 block truncate text-[10px] font-normal">
                      {task.project.name}
                    </span>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-5 card p-5">
        <h2 className="font-extrabold">Scheduled tasks</h2>
        <div className="mt-4 space-y-2">
          {tasks
            .filter(
              (task) =>
                new Date(task.dueDate).getMonth() === month.getMonth() &&
                new Date(task.dueDate).getFullYear() === month.getFullYear(),
            )
            .map((task) => (
              <Link
                href={`/tasks/${task.id}`}
                key={task.id}
                className="flex items-center justify-between rounded-lg p-3 hover:bg-[#fafbfc]"
              >
                <div>
                  <p className="text-sm font-bold">{task.title}</p>
                  <p className="text-xs text-[#89909b]">
                    {task.project.name} ·{" "}
                    {new Date(task.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <span className="pill bg-[#f1f2f4] text-[#89909b]">
                  {task.status.replace("_", " ").toLowerCase()}
                </span>
              </Link>
            ))}
        </div>
      </div>
    </Shell>
  );
}
