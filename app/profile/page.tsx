"use client";

import { useState, useEffect, FormEvent, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface FormErrors {
  fullName?: string;
  instagramHandle?: string;
  instagramUrl?: string;
  niche?: string;
  followerRange?: string;
  general?: string;
}

type ToastType = "success" | "error";

interface Toast {
  type: ToastType;
  message: string;
  visible: boolean;
}

export default function ProfilePage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [niche, setNiche] = useState("");
  const [followerRange, setFollowerRange] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  /* ─── Session guard ─── */
  useEffect(() => {
    const check = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/loginpage");
        return;
      }

      // Load existing profile
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (data) {
        setFullName(data.full_name || "");
        setInstagramHandle(data.instagram_handle || "");
        setInstagramUrl(data.instagram_url || "");
        setNiche(data.niche || "");
        setFollowerRange(data.follower_range || "");
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

    if (!fullName.trim()) errs.fullName = "Full name is required.";
    else if (fullName.trim().length < 2)
      errs.fullName = "Name must be at least 2 characters.";

    if (!niche.trim()) errs.niche = "Niche is required.";

    return errs;
  };

  /* ─── Handle save ─── */
  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErrors({ general: "Unauthorized." });
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("profiles").upsert({
      user_id: user.id,
      full_name: fullName.trim(),
      instagram_handle: instagramHandle.trim() || null,
      instagram_url: instagramUrl.trim() || null,
      niche: niche.trim(),
      follower_range: followerRange.trim(),
    });

    if (error) {
      setErrors({ general: error.message });
      showToast("error", error.message);
      setSaving(false);
      return;
    }

    showToast("success", "Profile saved successfully!");
    setSaving(false);
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
            Loading profile…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12"
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

      {/* ─── Profile Card ─── */}
      <div className="animate-fade-in glass-card relative z-10 w-full max-w-md rounded-3xl p-8 sm:p-10">
        {/* Logo / Branding */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-sm">
            <span className="text-2xl font-bold text-gradient">R</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Edit Profile</h1>
          <p className="mt-1 text-sm text-white/40">
            Update your creator information
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

        <form onSubmit={handleSave} className="flex flex-col gap-5">
          {/* ─── Full Name ─── */}
          <div>
            <label
              htmlFor="profile-name"
              className="mb-1.5 block text-sm font-medium text-white/60"
            >
              Full name
            </label>
            <div
              className={`flex items-center gap-3 rounded-xl border bg-white/[0.03] px-4 py-3 backdrop-blur-sm transition-all duration-300 focus-within:border-indigo-500/40 focus-within:bg-white/[0.05] ${
                errors.fullName ? "border-rose-500/40" : "border-white/10"
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
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
              <input
                id="profile-name"
                type="text"
                autoComplete="name"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName)
                    setErrors((prev) => ({ ...prev, fullName: undefined }));
                }}
                disabled={saving}
                className="w-full bg-transparent text-sm text-white placeholder-white/30 outline-none disabled:opacity-50"
              />
            </div>
            {errors.fullName && (
              <p className="mt-1 text-xs text-rose-400">{errors.fullName}</p>
            )}
          </div>

          {/* ─── Instagram Handle (optional) ─── */}
          <div>
            <label
              htmlFor="profile-instagram"
              className="mb-1.5 block text-sm font-medium text-white/60"
            >
              Instagram Handle <span className="text-white/30">(optional)</span>
            </label>
            <div
              className={`flex items-center gap-3 rounded-xl border bg-white/[0.03] px-4 py-3 backdrop-blur-sm transition-all duration-300 focus-within:border-indigo-500/40 focus-within:bg-white/[0.05] ${
                errors.instagramHandle ? "border-rose-500/40" : "border-white/10"
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
                  d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
                />
              </svg>
              <input
                id="profile-instagram"
                type="text"
                placeholder="@username"
                value={instagramHandle}
                onChange={(e) => {
                  setInstagramHandle(e.target.value);
                  if (errors.instagramHandle)
                    setErrors((prev) => ({ ...prev, instagramHandle: undefined }));
                }}
                disabled={saving}
                className="w-full bg-transparent text-sm text-white placeholder-white/30 outline-none disabled:opacity-50"
              />
            </div>
            {errors.instagramHandle && (
              <p className="mt-1 text-xs text-rose-400">{errors.instagramHandle}</p>
            )}
          </div>

          {/* ─── Instagram URL (optional) ─── */}
          <div>
            <label
              htmlFor="profile-instagram-url"
              className="mb-1.5 block text-sm font-medium text-white/60"
            >
              Instagram URL <span className="text-white/30">(optional)</span>
            </label>
            <div
              className={`flex items-center gap-3 rounded-xl border bg-white/[0.03] px-4 py-3 backdrop-blur-sm transition-all duration-300 focus-within:border-indigo-500/40 focus-within:bg-white/[0.05] ${
                errors.instagramUrl ? "border-rose-500/40" : "border-white/10"
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
                  d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
                />
              </svg>
              <input
                id="profile-instagram-url"
                type="url"
                placeholder="https://instagram.com/username"
                value={instagramUrl}
                onChange={(e) => {
                  setInstagramUrl(e.target.value);
                  if (errors.instagramUrl)
                    setErrors((prev) => ({ ...prev, instagramUrl: undefined }));
                }}
                disabled={saving}
                className="w-full bg-transparent text-sm text-white placeholder-white/30 outline-none disabled:opacity-50"
              />
            </div>
            {errors.instagramUrl && (
              <p className="mt-1 text-xs text-rose-400">{errors.instagramUrl}</p>
            )}
          </div>

          {/* ─── Niche ─── */}
          <div>
            <label
              htmlFor="profile-niche"
              className="mb-1.5 block text-sm font-medium text-white/60"
            >
              Niche
            </label>
            <div
              className={`flex items-center gap-3 rounded-xl border bg-white/[0.03] px-4 py-3 backdrop-blur-sm transition-all duration-300 focus-within:border-indigo-500/40 focus-within:bg-white/[0.05] ${
                errors.niche ? "border-rose-500/40" : "border-white/10"
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
                  d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 6h.008v.008H6V6z"
                />
              </svg>
              <input
                id="profile-niche"
                type="text"
                placeholder="e.g. fitness, fashion, travel"
                value={niche}
                onChange={(e) => {
                  setNiche(e.target.value);
                  if (errors.niche)
                    setErrors((prev) => ({ ...prev, niche: undefined }));
                }}
                disabled={saving}
                className="w-full bg-transparent text-sm text-white placeholder-white/30 outline-none disabled:opacity-50"
              />
            </div>
            {errors.niche && (
              <p className="mt-1 text-xs text-rose-400">{errors.niche}</p>
            )}
          </div>

          {/* ─── Follower Range ─── */}
          <div>
            <label
              htmlFor="profile-followers"
              className="mb-1.5 block text-sm font-medium text-white/60"
            >
              Follower Range
            </label>
            <div
              className={`flex items-center gap-3 rounded-xl border bg-white/[0.03] px-4 py-3 backdrop-blur-sm transition-all duration-300 focus-within:border-indigo-500/40 focus-within:bg-white/[0.05] ${
                errors.followerRange ? "border-rose-500/40" : "border-white/10"
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
                  d="M15 19.128a9.38 9.38 0 002.625-3.382c0-.528-.168-.998-.464-1.326a2.255 2.255 0 00-1.336-.573 18.904 18.904 0 00-4.774-1.122c-1.244-.164-2.479.1-3.568.724a2.25 2.25 0 00-.878 3.183c.36.796.887 1.553 1.544 2.21M15 19.128v-3.372m0 0a2.25 2.25 0 00-1.104-1.953M15 19.128v-3.372m0 3.372a2.25 2.25 0 001.104-1.953M15 15.756v-3.372m0 0a2.25 2.25 0 01-1.104-1.953M15 15.756v-3.372m0 3.372a2.25 2.25 0 001.104-1.953M12 12.75a2.25 2.25 0 00-4.5 0 2.25 2.25 0 004.5 0z"
                />
              </svg>
              <input
                id="profile-followers"
                type="text"
                placeholder="e.g. 1K-10K, 10K-100K"
                value={followerRange}
                onChange={(e) => {
                  setFollowerRange(e.target.value);
                  if (errors.followerRange)
                    setErrors((prev) => ({ ...prev, followerRange: undefined }));
                }}
                disabled={saving}
                className="w-full bg-transparent text-sm text-white placeholder-white/30 outline-none disabled:opacity-50"
              />
            </div>
            {errors.followerRange && (
              <p className="mt-1 text-xs text-rose-400">{errors.followerRange}</p>
            )}
          </div>

          {/* ─── Submit ─── */}
          <button
            type="submit"
            disabled={saving}
            className="glass-btn mt-1 flex w-full items-center justify-center gap-2.5 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Saving…
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Save Changes
              </>
            )}
          </button>
        </form>

        {/* ─── Navigation ─── */}
        <p className="mt-6 text-center text-sm text-white/40">
          <Link
            href="/Dashboard"
            className="font-semibold text-indigo-400 transition hover:text-indigo-300"
          >
            ← Back to Dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}