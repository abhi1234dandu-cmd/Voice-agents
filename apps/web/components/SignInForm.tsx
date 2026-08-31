"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { demoCredentials, validateLogin } from "@/lib/demo-platform";

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState(demoCredentials.email);
  const [password, setPassword] = useState(demoCredentials.password);
  const [error, setError] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!validateLogin(email, password)) {
      setError("Use the documented local demo credentials.");
      return;
    }
    window.localStorage.setItem(
      "votell-session",
      JSON.stringify({ email, organizationId: "org_demo_northstar" }),
    );
    router.push("/dashboard");
  }

  return (
    <form
      onSubmit={submit}
      className="surface mx-auto w-full max-w-xl rounded-lg p-6 sm:p-8"
    >
      <div className="mb-6 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-lg bg-teal-signal text-graphite-950">
          <LockKeyhole aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-3xl font-black text-white">Sign in</h1>
          <p className="text-sm text-slate-400">
            Local development authentication with seeded credentials.
          </p>
        </div>
      </div>

      <label className="mb-4 block text-sm font-semibold text-slate-300">
        <span className="mb-2 block">Email</span>
        <input
          className="field"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
        />
      </label>

      <label className="mb-4 block text-sm font-semibold text-slate-300">
        <span className="mb-2 block">Password</span>
        <input
          className="field"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
        />
      </label>

      {error ? (
        <p className="mb-4 rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-100">
          {error}
        </p>
      ) : null}

      <button className="btn-primary w-full" type="submit">
        Continue to dashboard
      </button>

      <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
        <p className="font-bold text-white">Demo credentials</p>
        <p className="mt-1">Email: {demoCredentials.email}</p>
        <p>Password: {demoCredentials.password}</p>
      </div>
    </form>
  );
}
