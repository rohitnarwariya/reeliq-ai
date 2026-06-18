"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

/* ─── Types ──────────────────────────────────────────────────────── */

interface AudioTrend {
  id: string;
  song_name: string;
  artist_name: string;
  spotify_url: string;
  trend_score: number;
  growth_24h: number;
  growth_7d: number;
  mood: string;
}

/* ─── Helpers ────────────────────────────────────────────────────── */

function safeNum(value: number | null | undefined, fallback = 0): number {
  if (value === null || value === undefined) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function formatTrend(value: number): string {
  const abs = Math.abs(value);
  const prefix = value >= 0 ? "+" : "-";
  if (abs >= 1_000_000) return `${prefix}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${prefix}${(abs / 1_000).toFixed(1)}K`;
  return `${prefix}${abs}`;
}

/* ─── Data ───────────────────────────────────────────────────────── */

const steps = [
  {
    icon: "📊",
    title: "Discover Trends",
    text: "Find rising audio before everyone else. Stay ahead of the curve with real-time trend data.",
  },
  {
    icon: "🤖",
    title: "Analyze Your Reel",
    text: "AI understands your content, mood and editing style. Upload any reel and get instant insights.",
  },
  {
    icon: "🎯",
    title: "Get Better Music Matches",
    text: "Receive personalized song recommendations that match your content perfectly.",
  },
];

const features = [
  {
    icon: "🤖",
    title: "AI Reel Analysis",
    text: "Vision-powered AI analyzes your video frames to understand mood, editing style, and content type.",
  },
  {
    icon: "📈",
    title: "Trending Audio Discovery",
    text: "Find songs before they peak with real-time trend scores and growth tracking.",
  },
  {
    icon: "🏷️",
    title: "Niche-Based Trends",
    text: "Filter trends by Fitness, Travel, Gaming, Lifestyle and more. Find what works for your niche.",
  },
  {
    icon: "⭐",
    title: "Song Match Score",
    text: "Every recommendation includes a match percentage so you know exactly how well a song fits.",
  },
  {
    icon: "📋",
    title: "Recommendation History",
    text: "Never lose a great suggestion. All your recommendations are saved and searchable.",
  },
  {
    icon: "💡",
    title: "Creator Insights",
    text: "Understand why each song matches your content with AI-generated reasoning and analysis.",
  },
];

const whyPoints = [
  {
    icon: "🚀",
    title: "Discover songs before they peak",
    text: "Real-time growth tracking helps you find trending audio early, before it saturates the platform.",
  },
  {
    icon: "🎨",
    title: "Match audio to your content style",
    text: "AI analyzes your reel's visual content to recommend music that fits your unique style and niche.",
  },
  {
    icon: "⏱️",
    title: "Save hours searching for trends",
    text: "Stop scrolling through playlists. Get curated recommendations in seconds, not hours.",
  },
  {
    icon: "📊",
    title: "Improve reel performance with AI",
    text: "Data-driven recommendations help you choose audio that resonates with your audience and boosts reach.",
  },
];

export default function HomePage() {
  const [trendingSongs, setTrendingSongs] = useState<AudioTrend[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(true);

  /* ─── Fetch trending songs ─── */
  useEffect(() => {
    const fetchTrends = async () => {
      try {
        let { data, error } = await supabase.from("audio_trends").select("*").limit(6);
        if (error) {
          const { data: fallback } = await supabase.from("trending_songs").select("*").limit(6);
          data = fallback;
        }
        setTrendingSongs((data || []) as AudioTrend[]);
      } catch {
        // silent
      } finally {
        setLoadingTrends(false);
      }
    };
    fetchTrends();
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0a0a1a]">
      {/* ─── Fixed Liquid Glass Background ─── */}
      <div className="liquid-bg">
        <div className="liquid-orb liquid-orb--1" />
        <div className="liquid-orb liquid-orb--2" />
        <div className="liquid-orb liquid-orb--3" />
        <div className="liquid-orb liquid-orb--4" />
        <div className="liquid-orb liquid-orb--5" />
      </div>

      {/* ─── ═══════════════════════════════════════════════
            SECTION 1 — HERO WITH NAVBAR
            ═══════════════════════════════════════════════ ─── */}
      <section className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-5 sm:px-8 lg:px-10">
        {/* ─── Navbar ─── */}
        <nav className="animate-fade-in flex items-center justify-between py-6">
          <Link href="/" className="text-2xl font-bold text-gradient tracking-tight">
            ReelIQ
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/trending" className="hidden text-sm font-medium text-white/50 transition hover:text-white/80 sm:block">
              Trending
            </Link>
            <Link href="/#features" className="hidden text-sm font-medium text-white/50 transition hover:text-white/80 sm:block">
              Features
            </Link>
            <Link href="/#about" className="hidden text-sm font-medium text-white/50 transition hover:text-white/80 sm:block">
              About
            </Link>
            <Link
              href="/loginpage"
              className="glass-btn rounded-xl px-5 py-2.5 text-sm font-semibold text-white/90"
            >
              Login
            </Link>
          </div>
        </nav>

        {/* ─── Hero Content ─── */}
        <div className="flex flex-1 flex-col justify-center pb-20 pt-10">
          <div className="max-w-3xl">
            {/* Gradient glow behind headline */}
            <div className="pointer-events-none absolute -top-20 left-1/2 h-96 w-[800px] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[120px]" />

            <p className="animate-fade-in text-sm font-semibold uppercase tracking-[0.22em] text-indigo-400">
              AI-Powered Music Discovery
            </p>

            <h1 className="animate-fade-in mt-5 text-5xl font-bold leading-tight text-white sm:text-6xl lg:text-7xl">
              Find the Perfect Trending Audio{" "}
              <span className="text-gradient">Before Your Reel Goes Live.</span>
            </h1>

            <p className="animate-fade-in mt-6 max-w-2xl text-lg leading-8 text-white/50">
              Discover trending songs, analyze your reels with AI, and get music
              recommendations that match your content.
            </p>

            <div className="animate-fade-in mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/Dashboard"
                className="group inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:shadow-indigo-500/40 hover:scale-[1.02]"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Analyze Reel
              </Link>

              <Link
                href="/trending"
                className="glass-btn inline-flex items-center justify-center gap-2.5 rounded-xl px-7 py-3.5 text-sm font-semibold text-white/80 transition-all hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
                Explore Trending Songs
              </Link>
            </div>

            {/* ─── Hero Stats ─── */}
            <div className="animate-fade-in mt-14 grid gap-4 sm:grid-cols-3">
              <div className="glass-card rounded-xl px-5 py-4">
                <p className="text-2xl font-bold text-white">AI Vision</p>
                <p className="mt-1 text-sm text-white/40">Frame-by-frame analysis</p>
              </div>
              <div className="glass-card rounded-xl px-5 py-4">
                <p className="text-2xl font-bold text-white">Real-time</p>
                <p className="mt-1 text-sm text-white/40">Trending data</p>
              </div>
              <div className="glass-card rounded-xl px-5 py-4">
                <p className="text-2xl font-bold text-white">Smart</p>
                <p className="mt-1 text-sm text-white/40">Match scoring</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── ═══════════════════════════════════════════════
            SECTION 2 — TRENDING SONGS PREVIEW
            ═══════════════════════════════════════════════ ─── */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-20 sm:px-8 lg:px-10">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-400">
              Real-time Data
            </p>
            <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
              Trending Right Now
            </h2>
          </div>
          <Link
            href="/trending"
            className="glass-btn inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white/80 transition-all hover:text-white"
          >
            View All Trending Songs
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        {loadingTrends ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="shimmer rounded-xl p-5" style={{ borderRadius: "12px" }}>
                <div className="h-4 w-3/4 rounded bg-white/5" />
                <div className="mt-2 h-3 w-1/2 rounded bg-white/5" />
              </div>
            ))}
          </div>
        ) : trendingSongs.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trendingSongs.slice(0, 6).map((song, idx) => (
              <article
                key={song.id || idx}
                className="glass-song rounded-xl p-5"
                style={{ animationDelay: `${idx * 0.08}s` }}
              >
                <div className="flex flex-col gap-3">
                  <div>
                    <h3 className="font-semibold text-white truncate">
                      {song.song_name || "Unknown Track"}
                    </h3>
                    <p className="mt-0.5 text-sm text-white/40">
                      {song.artist_name || "Unknown Artist"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="w-fit rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-sm font-semibold text-indigo-300 backdrop-blur-sm">
                      {safeNum(song.trend_score, 0)}
                    </span>
                    {song.growth_24h !== undefined && (
                      <span
                        className={`w-fit rounded-full border px-3 py-1 text-sm font-semibold backdrop-blur-sm ${
                          safeNum(song.growth_24h, 0) >= 0
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                            : "border-rose-500/20 bg-rose-500/10 text-rose-300"
                        }`}
                      >
                        {formatTrend(safeNum(song.growth_24h, 0))}
                      </span>
                    )}
                    {song.spotify_url && (
                      <a
                        href={song.spotify_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto glass-btn inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-cyan-300/80"
                      >
                        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.66.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                        </svg>
                        Spotify
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-xl px-5 py-12 text-center">
            <p className="text-sm text-white/30">No trending songs available yet. Check back soon.</p>
          </div>
        )}
      </section>

      {/* ─── ═══════════════════════════════════════════════
            SECTION 3 — HOW REELIQ WORKS
            ═══════════════════════════════════════════════ ─── */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-20 sm:px-8 lg:px-10">
        <div className="mb-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-400">
            Simple Workflow
          </p>
          <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
            How ReelIQ Works
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/40">
            Three simple steps to find the perfect audio for your next viral reel.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step, idx) => (
            <div key={step.title} className="group relative">
              {/* Connector line */}
              {idx < steps.length - 1 && (
                <div className="absolute -right-3 top-12 hidden text-2xl text-white/10 md:block">
                  →
                </div>
              )}
              <div className="glass-card rounded-2xl p-6 text-center transition-all hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-3xl backdrop-blur-sm">
                  {step.icon}
                </div>
                <div className="mb-3 flex items-center justify-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-300">
                    {idx + 1}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/40">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── ═══════════════════════════════════════════════
            SECTION 4 — FEATURES
            ═══════════════════════════════════════════════ ─── */}
      <section id="features" className="relative z-10 mx-auto max-w-6xl px-5 pb-20 sm:px-8 lg:px-10">
        <div className="mb-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-400">
            Everything You Need
          </p>
          <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
            Powerful Features
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/40">
            Built for creators who want smarter music recommendations.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="glass-card group rounded-2xl p-6 transition-all hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-xl backdrop-blur-sm">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/40">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── ═══════════════════════════════════════════════
            SECTION 5 — WHY REELIQ
            ═══════════════════════════════════════════════ ─── */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-20 sm:px-8 lg:px-10">
        <div className="glass-card rounded-3xl overflow-hidden">
          <div className="grid lg:grid-cols-2">
            {/* Left — gradient decoration */}
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent" />
              <div className="flex h-full items-center justify-center p-12">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-sm">
                    <span className="text-5xl font-bold text-gradient">R</span>
                  </div>
                  <p className="text-3xl font-bold text-white">ReelIQ</p>
                  <p className="mt-2 text-white/40">AI Music Discovery</p>
                </div>
              </div>
            </div>

            {/* Right — content */}
            <div className="p-8 sm:p-12">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-400">
                Why ReelIQ
              </p>
              <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
                Built For Creators Who{" "}
                <span className="text-gradient">Want More Reach.</span>
              </h2>

              <div className="mt-8 grid gap-5">
                {whyPoints.map((point) => (
                  <div key={point.title} className="flex gap-4">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-lg">
                      {point.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{point.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-white/40">{point.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── ═══════════════════════════════════════════════
            SECTION 6 — ABOUT REELIQ
            ═══════════════════════════════════════════════ ─── */}
      <section id="about" className="relative z-10 mx-auto max-w-6xl px-5 pb-20 sm:px-8 lg:px-10">
        <div className="glass-card rounded-2xl p-8 sm:p-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-400">
            Our Mission
          </p>
          <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
            About ReelIQ
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/50">
            ReelIQ helps creators discover trending audio and make smarter content
            decisions using AI-powered reel analysis and music intelligence. We
            believe every creator deserves the perfect soundtrack for their story.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-white/40">
            <div className="flex items-center gap-2">
              <span className="text-indigo-400">✓</span> AI-Powered
            </div>
            <div className="flex items-center gap-2">
              <span className="text-indigo-400">✓</span> Real-Time Data
            </div>
            <div className="flex items-center gap-2">
              <span className="text-indigo-400">✓</span> Creator First
            </div>
            <div className="flex items-center gap-2">
              <span className="text-indigo-400">✓</span> Free to Start
            </div>
          </div>
        </div>
      </section>

      {/* ─── ═══════════════════════════════════════════════
            SECTION 7 — FINAL CTA
            ═══════════════════════════════════════════════ ─── */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-20 sm:px-8 lg:px-10">
        <div className="glass-card relative overflow-hidden rounded-3xl px-6 py-16 text-center sm:px-12">
          {/* Glow effect */}
          <div className="pointer-events-none absolute -inset-20 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-transparent blur-[100px]" />

          <p className="relative text-sm font-semibold uppercase tracking-[0.18em] text-indigo-400">
            Get Started
          </p>
          <h2 className="relative mt-3 text-3xl font-bold text-white sm:text-4xl">
            Ready To Find Your{" "}
            <span className="text-gradient">Next Viral Audio?</span>
          </h2>
          <p className="relative mx-auto mt-3 max-w-lg text-white/40">
            Join creators who use ReelIQ to discover trending audio and make
            data-driven content decisions.
          </p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/Dashboard"
              className="group inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:shadow-indigo-500/40 hover:scale-[1.02]"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Analyze My Reel
            </Link>
            <Link
              href="/trending"
              className="glass-btn inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold text-white/80 transition-all hover:text-white"
            >
              Browse Trends
            </Link>
          </div>
        </div>
      </section>

      {/* ─── ═══════════════════════════════════════════════
            FOOTER
            ═══════════════════════════════════════════════ ─── */}
      <footer className="relative z-10 mx-auto max-w-6xl px-5 pb-8 sm:px-8 lg:px-10">
        <div className="glass-card rounded-2xl px-6 py-8 sm:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link href="/" className="text-xl font-bold text-gradient">
                ReelIQ
              </Link>
              <p className="mt-1 text-sm text-white/30">
                AI-powered music discovery for creators.
              </p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <Link href="/trending" className="text-white/40 transition hover:text-white/70">
                Trending
              </Link>
              <Link href="/Dashboard" className="text-white/40 transition hover:text-white/70">
                Dashboard
              </Link>
              <Link href="/history" className="text-white/40 transition hover:text-white/70">
                History
              </Link>
              <Link href="/profile" className="text-white/40 transition hover:text-white/70">
                Profile
              </Link>
            </div>
          </div>
          <div className="mt-6 border-t border-white/5 pt-6 text-center text-xs text-white/20">
            © {new Date().getFullYear()} ReelIQ. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}