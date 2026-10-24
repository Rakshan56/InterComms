"use client";
import { useEffect, useState } from "react";
import { Shell } from "../../components/shell";
import { api } from "../../lib/api";
export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    api<any[]>("/users")
      .then(setUsers)
      .catch((e) => setError(e.message));
  }, []);
  return (
    <Shell title="Team directory">
      <div className="card divide-y divide-black/5">
        {error ? (
          <p className="p-8 text-red-700">{error}</p>
        ) : (
          users.map((u) => (
            <div className="flex items-center justify-between p-5" key={u.id}>
              <div>
                <p className="font-bold">{u.name}</p>
                <p className="text-sm text-black/45">{u.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="pill bg-mint">
                  {u.role.replace("_", " ").toLowerCase()}
                </span>
                <span className="text-xs text-black/40">
                  {u.active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </Shell>
  );
}
