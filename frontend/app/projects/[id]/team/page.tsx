"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Shell } from "../../../../components/shell";
import { api } from "../../../../lib/api";
export default function Team() {
  const { id } = useParams<{ id: string }>();
  const [members, setMembers] = useState<any[]>([]);
  useEffect(() => {
    if (id) api<any[]>(`/projects/${id}/team`).then(setMembers);
  }, [id]);
  return (
    <Shell title="Project team">
      <div className="card divide-y divide-black/5">
        {members.map((m) => (
          <div className="flex items-center justify-between p-5" key={m.id}>
            <div>
              <p className="font-bold">{m.user.name}</p>
              <p className="text-sm text-black/45">{m.user.email}</p>
            </div>
            <span className="pill bg-mint">{m.role.toLowerCase()}</span>
          </div>
        ))}
      </div>
    </Shell>
  );
}
