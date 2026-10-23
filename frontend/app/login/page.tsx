"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@intercomms.local");
  const [password, setPassword] = useState("InterComms123!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("http://localhost:4000/api/v1/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      setError("The email or password is incorrect.");
      setLoading(false);
      return;
    }
    router.push("/dashboard");
  }
  return (
    <main className="grid min-h-screen place-items-center bg-ink p-6">
      <form onSubmit={submit} className="card w-full max-w-md p-8">
        <div className="mb-8 flex items-center gap-2 text-xl font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-white">
            ✦
          </span>{" "}
          InterComms
        </div>
        <h1 className="text-3xl font-black">Welcome back</h1>
        <p className="mt-2 text-black/50">Sign in to your workspace.</p>
        <label className="mt-8 block text-sm font-semibold">
          Email
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-xl border border-black/10 p-3 outline-none focus:border-ink"
          />
        </label>
        <label className="mt-4 block text-sm font-semibold">
          Password
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-xl border border-black/10 p-3 outline-none focus:border-ink"
          />
        </label>
        {error && (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <button
          disabled={loading}
          className="mt-7 w-full rounded-full bg-ink py-3 font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
        <p className="mt-5 text-center text-xs text-black/40">
          Demo accounts use the password InterComms123!
        </p>
      </form>
    </main>
  );
}
