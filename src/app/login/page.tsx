"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div
      className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-10"
      style={{
        background:
          "radial-gradient(120% 80% at 50% -10%, #d4edd0 0%, #e9f4e6 55%, #e0efdb 100%)",
      }}
    >
      {/* soft roofline motif */}
      <svg
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 opacity-50"
        width="560"
        height="200"
        viewBox="0 0 560 200"
        preserveAspectRatio="none"
      >
        <path
          d="M0 120 L90 60 L180 120 L270 55 L360 120 L450 60 L560 120 L560 0 L0 0 Z"
          fill="rgba(10,123,41,.05)"
        />
        <path
          d="M0 150 L90 95 L180 150 L270 92 L360 150 L450 95 L560 150"
          fill="none"
          stroke="rgba(10,123,41,.14)"
          strokeWidth="2"
        />
      </svg>

      <div
        className="relative z-10 w-full max-w-[400px] rounded-[22px] border bg-card p-9"
        style={{ boxShadow: "0 24px 60px -24px rgba(18,61,32,.28)" }}
      >
        <div className="mb-7 flex flex-col items-center">
          <BrandLogo className="size-[60px] rounded-[18px]" iconSize={30} />
          <div className="mt-4 font-display text-[28px] font-extrabold tracking-tight text-foreground">
            Roofactor
          </div>
          <div className="mt-1 text-[13px] text-muted-foreground">
            Sign in to your workspace
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
            Email
          </label>
          <div className="mb-[18px] flex h-12 items-center gap-2.5 rounded-xl border bg-muted px-3.5">
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#7aa47c"
              strokeWidth="2"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
            </svg>
            <input
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="h-full flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-[#9db99d]"
            />
          </div>

          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
            Password
          </label>
          <div className="mb-6 flex h-12 items-center gap-2.5 rounded-xl border bg-muted px-3.5">
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#7aa47c"
              strokeWidth="2"
            >
              <rect x="4" y="11" width="16" height="9" rx="2" />
              <path d="M8 11V8a4 4 0 018 0v3" />
            </svg>
            <input
              name="password"
              type={showPw ? "text" : "password"}
              required
              placeholder="Enter your password"
              className="h-full flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-[#9db99d]"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "Hide password" : "Show password"}
              className="text-[#9db99d] hover:text-muted-foreground"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>

          {error && (
            <p className="mb-3 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-primary text-[15px] font-semibold text-primary-foreground transition-colors hover:brightness-95 disabled:opacity-70"
            style={{ boxShadow: "0 8px 18px rgba(10,123,41,.35)" }}
          >
            {loading ? "Signing in…" : "Log in"}
            {!loading && (
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
