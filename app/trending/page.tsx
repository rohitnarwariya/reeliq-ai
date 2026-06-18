"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

/* ─── Types ──────────────────────────────────────────────────────── */

interface Song {
  id: string;
  song_name: string;
  artist_name: string;
  spotify_url: string;
  niche: string;
  mood: string;
  genre: string;
  trend_score: number;
  trend_status: string;
  bpm: number;
  energy: number;
}

/* ─── Filter options ─────────────────────────────────────────────── */

const NICHE_OPTIONS = [
  "All",
  "Fitness",
  "Travel",
  "Motivation",
  "Business",
  "Education",
  "Gaming",
  "Lifestyle",
] as const;

const MOOD_OPTIONS = [
  "All",
  "Calm",
  "Energetic",
  "Aggressive",
  "Cinematic",
  "Emotional",
] as const;

/* ─── Helpers ────────────────────────────────────────────────────── */

function safeNum(value: number | null | undefined, fallback = 0): number {
  if (value === null || value === undefined) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/* ─── Skeleton card ──────────────────────────────────────────────── */

function SongCardSkeleton() {
  return (
    <div className="shimmer rounded-xl p-5" style={{ borderRadius: "12px" }}>
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 shrink-0 rounded-xl bg-white/5" />
        <div className="flex-1">
          <div className="h-5 w-3/4 rounded bg-white/5" />
          <div className="mt-2 h-4 w-1/2 rounded bg-white/5" />
          <div className="mt-3 flex gap-2">
            <div className="h-6 w-16 rounded-full bg-white/5" />
            <div className="h-6 w-20 rounded-full bg-white/5" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Page component ─────────────────────────────────────────────── */

export default function TrendingPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeNiche, setActiveNiche] = useState<string>("All");
  const [activeMood, setActiveMood] = useState<string>("All");

  const spotlightRef = useRef<HTMLDivElement>(null);
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (spotlightRef.current) {
      spotlightRef.current.style.left = `${e.clientX}px`;
      spotlightRef.current.style.top = `${e.clientY}px`;
    }
  }, []);

  /* ─── Fetch songs ─── */
  useEffect(() => {
    const fetchSongs = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log("[Trending] Fetching from 'songs' table...");
        console.log("[Trending] supabase client:", supabase ? "exists" : "MISSING");

        const { data, error } = await supabase
          .from("songs")
          .select("*")
          .order("trend_score", { ascending: false });

        console.log("[Trending] SUPABASE ERROR:", error);
        console.log("[Trending] SUPABASE DATA:", data);
        console.log("[Trending] ROW COUNT:", data?.length);
        console.log("[Trending] Table used: 'songs'");

        if (error) {
          console.log("[Trending] ERROR TYPE:", error.name, "CODE:", error.code, "DETAILS:", error.details);
          throw new Error(error.message);
        }

        setSongs((data || []) as Song[]);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load songs.";
        console.error("[Trending] CATCH ERROR:", err);
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchSongs();
  }, []);

  /* ─── Filter + search ─── */
  const filtered = songs.filter((song) => {
    const matchesNiche = activeNiche === "All" || song.niche === activeNiche;
    const matchesMood = activeMood === "All" || song.mood === activeMood;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      song.song_name.toLowerCase().includes(q) ||
      (song.artist_name && song.artist_name.toLowerCase().includes(q));
    return matchesNiche && matchesMood && matchesSearch;
  });

  /* ─── Unique moods from data ─── */
  const availableMoods = Array.from(new Set(songs.map((s) => s.mood).filter(Boolean)));

  /* ─── Loading state ─── */
  if (loading) {
    return (
      <div className="relative min-h-screen bg-[#0a0a1a]">
        <div className="liquid-bg">
          <div className="liquid-orb liquid-orb--1" />
          <div className="liquid-orb liquid-orb--2" />
          <div className="liquid-orb liquid-orb--3" />
          <div className="liquid-orb liquid-orb--4" />
          <div className="liquid-orb liquid-orb--5" />
        </div>
        <div className="relative z-10 mx-auto max-w-6xl px-5 py-6 sm:px-8 lg:px-10">
          <div className="shimmer mb-6 rounded-2xl p-6">
            <div className="h-5 w-24 rounded bg-white/5" />
            <div className="mt-2 h-8 w-48 rounded bg-white/5" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SongCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ─── Error state ─── */
  if (error) {
    return (
      <div className="relative min-h-screen bg-[#0a0a1a]">
        <div className="liquid-bg">
          <div className="liquid-orb liquid-orb--1" />
          <div className="liquid-orb liquid-orb--2" />
          <div className="liquid-orb liquid-orb--3" />
          <div className="liquid-orb liquid-orb--4" />
          <div className="liquid-orb liquid-orb--5" />
        </div>
        <div className="relative z-10 mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center px-5 sm:px-8 lg:px-10">
          <div className="glass-card rounded-2xl px-8 py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10">
              <svg className="h-8 w-8 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white">Failed to load songs</h2>
            <p className="mt-2 text-sm text-white/50">{error}</p>
            <p className="mt-2 text-xs text-white/30">Check browser console for full debug logs.</p>
            <button
              onClick={() => window.location.reload()}
              className="glass-btn mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white/90"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen" onMouseMove={handleMouseMove}>
      {/* ─── Liquid Glass Background ─── */}
      <div className="liquid-bg">
        <div className="liquid-orb liquid-orb--1" />
        <div className="liquid-orb liquid-orb--2" />
        <div className="liquid-orb liquid-orb--3" />
        <div className="liquid-orb liquid-orb--4" />
        <div className="liquid-orb liquid-orb--5" />
      </div>
      <div ref={spotlightRef} className="spotlight" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-6xl px-5 py-6 sm:px-8 lg:px-10">
        {/* ─── Header ─── */}
        <header className="animate-fade-in glass-card mb-6 flex flex-col gap-4 rounded-2xl px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
              ReelIQ Studio
            </p>
            <h1 className="mt-1 text-3xl font-bold text-gradient sm:text-4xl">
              Trending Songs
            </h1>
            <p className="mt-1 text-sm text-white/40">
              {songs.length} tracks · {filtered.length} shown
            </p>
          </div>
          <Link
            href="/Dashboard"
            className="glass-btn inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white/90 sm:w-auto"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </Link>
        </header>

        {/* ─── Search ─── */}
        <div className="animate-fade-in animate-fade-in-delay-1 mb-4">
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 backdrop-blur-sm transition-all duration-300 focus-within:border-indigo-500/40 focus-within:bg-white/[0.05]">
            <svg className="h-5 w-5 shrink-0 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder="Search by song name or artist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-white placeholder-white/30 outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="shrink-0 text-white/30 hover:text-white/60">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* ─── Filter chips ─── */}
        <div className="animate-fade-in animate-fade-in-delay-1 mb-6 flex flex-wrap gap-3">
          {/* Niche filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-white/30">Niche:</span>
            {NICHE_OPTIONS.map((niche) => (
              <button
                key={niche}
                onClick={() => setActiveNiche(niche)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  activeNiche === niche
                    ? "bg-indigo-500/20 text-indigo-200 border border-indigo-500/40"
                    : "bg-white/[0.04] text-white/40 border border-white/10 hover:text-white/70 hover:border-white/20"
                }`}
              >
                {niche === "All" ? "All" : niche}
              </button>
            ))}
          </div>

          {/* Mood filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-white/30">Mood:</span>
            <button
              onClick={() => setActiveMood("All")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                activeMood === "All"
                  ? "bg-indigo-500/20 text-indigo-200 border border-indigo-500/40"
                  : "bg-white/[0.04] text-white/40 border border-white/10 hover:text-white/70 hover:border-white/20"
              }`}
            >
              All
            </button>
            {MOOD_OPTIONS.filter((m) => m !== "All" && availableMoods.includes(m)).map((mood) => (
              <button
                key={mood}
                onClick={() => setActiveMood(mood)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  activeMood === mood
                    ? "bg-emerald-500/20 text-emerald-200 border border-emerald-500/40"
                    : "bg-white/[0.04] text-white/40 border border-white/10 hover:text-white/70 hover:border-white/20"
                }`}
              >
                {mood}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Song grid ─── */}
        <section className="animate-fade-in animate-fade-in-delay-2">
          {filtered.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((song, idx) => (
                <Link
                  href={`/song/${song.id}`}
                  key={song.id || idx}
                  className="glass-song group rounded-xl p-5 transition-all hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5 block"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="flex flex-col gap-3">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-base font-semibold text-white">
                          {song.song_name || "Unknown Track"}
                        </h3>
                        <p className="mt-0.5 text-sm text-white/40">
                          {song.artist_name || "Unknown Artist"}
                        </p>
                      </div>
                      {/* Trend status badge */}
                      {song.trend_status && (
                        <span className="shrink-0 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300 border border-amber-500/20">
                          {song.trend_status}
                        </span>
                      )}
                    </div>

                    {/* Meta row */}
                    <div className="flex flex-wrap gap-1.5">
                      {song.niche && (
                        <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium text-indigo-300">
                          {song.niche}
                        </span>
                      )}
                      {song.mood && (
                        <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                          {song.mood}
                        </span>
                      )}
                      {song.genre && (
                        <span className="rounded-md bg-purple-500/10 px-2 py-0.5 text-[11px] font-medium text-purple-300">
                          {song.genre}
                        </span>
                      )}
                    </div>

                    {/* Score + actions row */}
                    <div className="mt-1 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-indigo-300">
                          {safeNum(song.trend_score, 0)}
                        </span>
                        {song.bpm > 0 && (
                          <span className="text-xs text-white/30">
                            {safeNum(song.bpm, 0)} BPM
                          </span>
                        )}
                      </div>

                      {/* Spotify button */}
                      {song.spotify_url ? (
                        <a
                          href={song.spotify_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#1DB954]/15 px-3 py-1.5 text-xs font-semibold text-[#1DB954] transition-all hover:bg-[#1DB954]/25"
                        >
                          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.66.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                          </svg>
                          Open in Spotify
                        </a>
                      ) : null}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="glass-upload rounded-xl px-5 py-16 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
                  <svg className="h-8 w-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                  </svg>
                </div>
                <p className="text-base font-semibold text-white/50">
                  {searchQuery || activeNiche !== "All" || activeMood !== "All"
                    ? "No songs match your filters."
                    : "No songs available yet."}
                </p>
                <p className="text-sm text-white/30">
                  {searchQuery
                    ? "Try a different search term."
                    : "Check back later for trending tracks."}
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}