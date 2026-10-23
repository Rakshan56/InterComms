"use client";
import { useEffect, useState } from "react";
import { api } from "../../shared/api";
import type { CurrentUser } from "../../shared/types";

export function ProfileForm() {
  const [user, setUser] = useState<CurrentUser>();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    api<CurrentUser>("/auth/me")
      .then((current) => {
        setUser(current);
        setName(current.name);
        setEmail(current.email);
      })
      .catch(() => setMessage("Unable to load your profile."));
  }, []);
  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const updated = await api<CurrentUser>("/users/me", {
        method: "PATCH",
        body: JSON.stringify({ name, email }),
      });
      setUser(updated);
      setName(updated.name);
      setEmail(updated.email);
      setMessage("Profile updated successfully.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update your profile.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="card max-w-2xl p-7">
      <p className="text-sm text-[#89909b]">
        Update your permitted profile details.
      </p>
      <div className="mt-6 flex items-center gap-4 rounded-xl bg-[#f7f8fa] p-4">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-[#f0c51b] font-bold">
          {user?.name?.slice(0, 2).toUpperCase() ?? "…"}
        </span>
        <div>
          <p className="font-bold">{user?.name ?? "Loading…"}</p>
          <p className="text-xs text-[#89909b]">
            {user?.role?.replaceAll("_", " ")}
          </p>
        </div>
      </div>
      <label className="mt-7 block text-sm font-bold">
        Name
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-2 w-full rounded-xl border border-black/10 p-3 outline-none focus:border-[#4774d9]"
        />
      </label>
      <label className="mt-5 block text-sm font-bold">
        Email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 w-full rounded-xl border border-black/10 p-3 outline-none focus:border-[#4774d9]"
        />
      </label>
      {message && (
        <p
          className={`mt-4 rounded-xl p-3 text-sm ${message.includes("successfully") ? "bg-[#e1f5ed] text-[#1d8d6a]" : "bg-red-50 text-red-700"}`}
        >
          {message}
        </p>
      )}
      <button
        onClick={save}
        disabled={saving || !user}
        className="mt-7 rounded-lg bg-[#252b35] px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}
