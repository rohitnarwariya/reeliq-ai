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
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [toast, setToast] = useState<Toast>({
    type: "success",
    message: "",
    visible: false,
  });

  const spotlightRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback((type: ToastType, message: string) => {
    setToast({ type, message, visible: true });
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 4000);
  }, []);

  /* ─── Session guard ─── */
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

  /* ─── Validation ─── */
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

  /* ─── Email login ─── */
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

  /* ─── OAuth login ─── */
  const handleOAuthLogin = async (provider: "google" | "github") => {
    setOauthLoading(provider);
    setErrors({});

    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
        },
      });

      if (error) {
        setErrors({ general: error.message });
        showToast("error", error.message);
        setOauthLoading(null);
      }
      // If no error, the browser will redirect to the OAuth provider
    } catch (err) {
      const message = err instanceof Error ? err.message : "OAuth login failed.";
      setErrors({ general: message });
      showToast("error", message);
      setOauthLoading(null);
    }
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
          <span className="text-lg">{toast.type === "success" ? "✓" : "✕"}</span>
          <span>{toast.message}</span>
        </div>
      </div>

      {/* ─── Auth Card ─── */}
      <div className="animate-fade-in glass-card relative z-10 w-full max-w-md rounded-3xl p-8 sm:p-10">
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
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            {errors.general}
          </div>
        )}

        {/* ─── OAuth Buttons ─── */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => handleOAuthLogin("google")}
            disabled={oauthLoading !== null}
            className="glass-btn flex w-full items-center justify-center gap-3 rounded-xl px-5 py-3 text-sm font-semibold text-white/90 transition-all disabled:opacity-50"
          >
            {oauthLoading === "google" ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Continue with Google
          </button>

          <button
            onClick={() => handleOAuthLogin("github")}
            disabled={oauthLoading !== null}
            className="glass-btn flex w-full items-center justify-center gap-3 rounded-xl px-5 py-3 text-sm font-semibold text-white/90 transition-all disabled:opacity-50"
          >
            {oauthLoading === "github" ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            )}
            Continue with GitHub
          </button>
        </div>

        {/* ─── Divider ─── */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-white/30">or sign in with email</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          {/* ─── Email ─── */}
          <div>
            <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-white/60">
              Email address
            </label>
            <div
              className={`flex items-center gap-3 rounded-xl border bg-white/[0.03] px-4 py-3 backdrop-blur-sm transition-all duration-300 focus-within:border-indigo-500/40 focus-within:bg-white/[0.05] ${
                errors.email ? "border-rose-500/40" : "border-white/10"
              }`}
            >
              <svg className="h-5 w-5 shrink-0 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                disabled={submitting}
                className="w-full bg-transparent text-sm text-white placeholder-white/30 outline-none disabled:opacity-50"
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-rose-400">{errors.email}</p>}
          </div>

          {/* ─── Password ─── */}
          <div>
            <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-white/60">
              Password
            </label>
            <div
              className={`flex items-center gap-3 rounded-xl border bg-white/[0.03] px-4 py-3 backdrop-blur-sm transition-all duration-300 focus-within:border-indigo-500/40 focus-within:bg-white/[0.05] ${
                errors.password ? "border-rose-500/40" : "border-white/10"
              }`}
            >
              <svg className="h-5 w-5 shrink-0 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
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
            {errors.password && <p className="mt-1 text-xs text-rose-400">{errors.password}</p>}
          </div>

          {/* ─── Remember me ─── */}
          <label className="flex cursor-pointer items-center gap-2.5">
            <div
              onClick={() => setRememberMe((v) => !v)}
              className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all ${
                rememberMe ? "border-indigo-500 bg-indigo-500/20" : "border-white/10 bg-white/[0.03] hover:border-white/20"
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
          <Link href="/signuppage" className="font-semibold text-indigo-400 transition hover:text-indigo-300">
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}