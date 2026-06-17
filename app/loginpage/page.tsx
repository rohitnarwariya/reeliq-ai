"use client";

import { useState, useEffect, FormEvent, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type FieldName = "email" | "password";

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

type ToastType = "success" | "error";

interface Toast {
  type: ToastType;
  message: string;
  visible: boolean;
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true); // session check
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [toast, setToast] = useState<Toast>({
    type: "success",
    message: "",
    visible: false,
  });

  const spotlightRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback((type: ToastType, message: string) => {
    setToast({ type, message, visible: true });
    setTimeout(
      () => setToast((prev) => ({ ...prev, visible: false })),
      4000
    );
  }, []);

  /* ─── Session guard: logged-in users → /Dashboard ─── */
  useEffect(() => {
    const check = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        router.replace("/Dashboard");
        return;
      }
      setLoading(false);
    };
    check();
  }, [router]);

  /* ─── Mouse spotlight ─── */
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (spotlightRef.current) {
      spotlightRef.current.style.left = `${e.clientX}px`;
      spotlightRef.current.style.top = `${e.clientY}px`;
    }
  }, []);

  /* ─── Client-side validation ─── */
  const validate = (): FormErrors => {
    const errs: FormErrors = {};
    if (!email.trim()) errs.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      errs.email = "Enter a valid email address.";

    if (!password) errs.password = "Password is required.";
    else if (password.length < 6)
      errs.password = "Password must be at least 6 characters.";
    return errs;
  };

  /* ─── Handle login ─── */
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setSubmitting(false);
      setErrors({ general: error.message });
      showToast("error", error.message);
      return;
    }

    showToast("success", "Welcome back!");
    setTimeout(() => router.push("/Dashboard"), 600);
  };

  /* ─── Loading guard ─── */
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a1a]">
        <div className="glass-loading flex flex-col items-center gap-5 rounded-2xl px-10 py-12">
          <div className="relative flex h-12 w-12 items-center justify-center">
            <div className="absolute inset-0 animate-ping rounded-full bg-indigo-500/30" />
            <div className="absolute inset-2 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
            <div className="h-3 w-3 rounded-full bg-indigo-400" />
          </div>
          <p className="text-sm font-medium tracking-wide text-white/60">
            Checking session…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4"
      onMouseMove={handleMouseMove}
    >
      {/* ─── Liquid Glass Background ─── */}
      <div className="liquid-bg">
        <div className="liquid-orb liquid-orb--1" />
        <div className="liquid-orb liquid-orb--2" />
        <div className="liquid-orb liquid-orb--3" />
        <div className="liquid-orb liquid-orb--4" />
        <div className="liquid-orb liquid-orb--5" />
      </div>

      {/* ─── Mouse spotlight ─── */}
      <div ref={spotlightRef} className="spotlight" aria-hidden="true" />

      {/* ─── Toast ─── */}
      <div
        className={`fixed right-4 top-4 z-50 max-w-sm transform rounded-xl border px-5 py-3 text-sm font-medium shadow-2xl backdrop-blur-xl transition-all duration-500 ${
          toast.visible
            ? "translate-x-0 opacity-100"
            : "translate-x-8 opacity-0 pointer-events-none"
        } ${
          toast.type === "success"
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
            : "border-rose-500/30 bg-rose-500/10 text-rose-300"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">
            {toast.type === "success" ? "✓" : "✕"}
          </span>
          <span>{toast.message}</span>
        </div>
      </div>

      {/* ─── Auth Card ─── */}
      <div className="animate-fade-in glass-card relative z-10 w-full max-w-md rounded-3xl p-8 sm:p-10">
        {/* Logo / Branding */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-sm">
            <span className="text-2xl font-bold text-gradient">R</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="mt-1 text-sm text-white/40">
            Sign in to your ReelIQ Studio account
          </p>
        </div>

        {/* ─── General error ─── */}
        {errors.general && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/8 px-4 py-3 text-sm text-rose-300 backdrop-blur-sm">
            <svg
              className="h-4 w-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            {errors.general}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          {/* ─── Email ─── */}
          <div>
            <label
              htmlFor="login-email"
              className="mb-1.5 block text-sm font-medium text-white/60"
            >
              Email address
            </label>
            <div
              className={`flex items-center gap-3 rounded-xl border bg-white/[0.03] px-4 py-3 backdrop-blur-sm transition-all duration-300 focus-within:border-indigo-500/40 focus-within:bg-white/[0.05] ${
                errors.email
                  ? "border-rose-500/40"
                  : "border-white/10"
              }`}
            >
              <svg
                className="h-5 w-5 shrink-0 text-white/30"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                />
              </svg>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email)
                    setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                disabled={submitting}
                className="w-full bg-transparent text-sm text-white placeholder-white/30 outline-none disabled:opacity-50"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-rose-400">{errors.email}</p>
            )}
          </div>

          {/* ─── Password ─── */}
          <div>
            <label
              htmlFor="login-password"
              className="mb-1.5 block text-sm font-medium text-white/60"
            >
              Password
            </label>
            <div
              className={`flex items-center gap-3 rounded-xl border bg-white/[0.03] px-4 py-3 backdrop-blur-sm transition-all duration-300 focus-within:border-indigo-500/40 focus-within:bg-white/[0.05] ${
                errors.password
                  ? "border-rose-500/40"
                  : "border-white/10"
              }`}
            >
              <svg
                className="h-5 w-5 shrink-0 text-white/30"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password)
                    setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                disabled={submitting}
                className="w-full bg-transparent text-sm text-white placeholder-white/30 outline-none disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="shrink-0 text-white/30 transition hover:text-white/60"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-rose-400">{errors.password}</p>
            )}
          </div>

          {/* ─── Remember me ─── */}
          <label className="flex cursor-pointer items-center gap-2.5">
            <div
              onClick={() => setRememberMe((v) => !v)}
              className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all ${
                rememberMe
                  ? "border-indigo-500 bg-indigo-500/20"
                  : "border-white/10 bg-white/[0.03] hover:border-white/20"
              }`}
            >
              {rememberMe && (
                <svg className="h-3 w-3 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </div>
            <span className="text-sm text-white/50">Remember me</span>
          </label>

          {/* ─── Submit ─── */}
          <button
            type="submit"
            disabled={submitting}
            className="glass-btn mt-1 flex w-full items-center justify-center gap-2.5 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Signing in…
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                Sign In
              </>
            )}
          </button>
        </form>

        {/* ─── Navigation ─── */}
        <p className="mt-6 text-center text-sm text-white/40">
          Don't have an account?{" "}
          <Link
            href="/signuppage"
            className="font-semibold text-indigo-400 transition hover:text-indigo-300"
          >
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}