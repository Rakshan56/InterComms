"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  CalendarDays,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  Users,
  UserCircle,
} from "lucide-react";
import { api } from "../lib/api";
type CurrentUser = { name: string; email: string; role: string };
type SearchResults = {
  projects: { id: string; name: string; status: string }[];
  tasks: {
    id: string;
    title: string;
    status: string;
    project: { id: string; name: string };
  }[];
};
export function Shell({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const path = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser>();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({
    projects: [],
    tasks: [],
  });
  const [searching, setSearching] = useState(false);
  useEffect(() => {
    api<CurrentUser>("/auth/me")
      .then(setUser)
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    const value = query.trim();
    if (value.length < 2) {
      setResults({ projects: [], tasks: [] });
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = window.setTimeout(() => {
      api<SearchResults>(`/search?q=${encodeURIComponent(value)}`)
        .then(setResults)
        .catch(() => setResults({ projects: [], tasks: [] }))
        .finally(() => setSearching(false));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);
  const nav = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/projects", label: "Projects", icon: FolderKanban },
    { href: "/users", label: "Members", icon: Users },
    { href: "/profile", label: "Settings", icon: Settings },
  ];
  async function logout() {
    await fetch("http://localhost:4000/api/v1/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    router.push("/login");
  }
  const hasResults = results.projects.length > 0 || results.tasks.length > 0;
  return (
    <div className="min-h-screen bg-[#f4f5f7] text-[#20242b]">
      <aside className="fixed hidden h-screen w-[232px] border-r border-[#e6e8ec] bg-white px-4 py-6 md:block">
        <div className="flex items-center gap-2 px-3 text-lg font-extrabold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#252b35] text-white">
            ✦
          </span>{" "}
          InterComms
        </div>
        <nav className="mt-12 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-semibold ${path.startsWith(href) ? "bg-[#f0c51b] text-[#20242b]" : "text-[#89909b] hover:bg-[#f5f6f8]"}`}
            >
              <Icon size={17} strokeWidth={2.2} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-7 left-4 right-4 border-t border-[#edf0f3] pt-5">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 text-[13px] font-semibold text-[#89909b]"
          >
            <LogOut size={17} /> Log out
          </button>
        </div>
      </aside>
      <main className="md:ml-[232px]">
        <header className="flex h-[76px] items-center gap-6 border-b border-[#e6e8ec] bg-white px-6 md:px-10">
          <div className="relative max-w-[420px] flex-1">
            <Search
              className="absolute left-3 top-2.5 text-[#a9afb8]"
              size={17}
            />
            <input
              aria-label="Search projects and tasks"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setQuery("");
              }}
              placeholder="Search projects and tasks"
              className="w-full rounded-xl bg-[#f5f6f8] py-2.5 pl-10 pr-4 text-sm outline-none placeholder:text-[#a9afb8]"
            />
            {query.trim().length >= 2 && (
              <div className="absolute left-0 right-0 top-12 z-20 overflow-hidden rounded-xl border border-[#e6e8ec] bg-white shadow-lg">
                {searching && (
                  <p className="p-4 text-xs text-[#89909b]">Searching…</p>
                )}
                {!searching && !hasResults && (
                  <p className="p-4 text-xs text-[#89909b]">
                    No matching projects or tasks.
                  </p>
                )}
                {!searching && results.projects.length > 0 && (
                  <div>
                    <p className="border-b border-[#edf0f3] px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-[#a0a6af]">
                      Projects
                    </p>
                    {results.projects.map((project) => (
                      <Link
                        onClick={() => setQuery("")}
                        href={`/projects/${project.id}`}
                        key={project.id}
                        className="block px-4 py-3 hover:bg-[#fafbfc]"
                      >
                        <p className="text-sm font-bold">{project.name}</p>
                        <p className="text-[11px] text-[#89909b]">
                          {project.status.toLowerCase()} · Open project →
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
                {!searching && results.tasks.length > 0 && (
                  <div>
                    <p className="border-b border-[#edf0f3] px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-[#a0a6af]">
                      Tasks
                    </p>
                    {results.tasks.map((task) => (
                      <Link
                        onClick={() => setQuery("")}
                        href={`/tasks/${task.id}`}
                        key={task.id}
                        className="block px-4 py-3 hover:bg-[#fafbfc]"
                      >
                        <p className="text-sm font-bold">{task.title}</p>
                        <p className="text-[11px] text-[#89909b]">
                          {task.project.name} · {task.status.toLowerCase()} ·
                          Open task →
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="ml-auto flex items-center gap-5 text-[#89909b]">
            <Link
              aria-label="Open calendar"
              href="/calendar"
              className="rounded-lg p-2 hover:bg-[#f5f6f8]"
            >
              <CalendarDays size={18} />
            </Link>
            <Link
              aria-label="Open notifications"
              href="/notifications"
              className="relative rounded-lg p-2 hover:bg-[#f5f6f8]"
            >
              <Bell size={18} />
              <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[#ed6b72]" />
            </Link>
            <Link
              href="/profile"
              className="flex items-center gap-2 border-l border-[#e6e8ec] pl-5"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#f0c51b] text-xs font-bold">
                {user?.name?.slice(0, 2).toUpperCase() ?? "…"}
              </span>
              <span className="hidden text-left text-xs font-semibold text-[#20242b] lg:block">
                {user?.name ?? "Loading…"}
                <br />
                <span className="font-normal text-[#9aa0a9]">
                  {user?.role?.replaceAll("_", " ") ?? ""}
                </span>
              </span>
              <UserCircle size={16} />
            </Link>
          </div>
        </header>
        <div className="px-6 pb-12 pt-8 md:px-10">
          <div className="mb-7">
            <p className="text-xs font-medium text-[#9aa0a9]">
              Workspace / InterComms
            </p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight">
              {title}
            </h1>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
