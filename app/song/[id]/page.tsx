"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
  popularity: number;
  bpm: number;
  energy: number;
  trend_status: string;
}

/* ─── Helpers ────────────────────────────────────────────────────── */

function safeNum(value: number | null | undefined, fallback = 0): number {
  if (value === null || value === undefined) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/* ─── Page ────────────────────────────────────────────────────────── */

export default function SongDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const spotlightRef = useRef<HTMLDivElement>(null);
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (spotlightRef.current) {
      spotlightRef.current.style.left = `${e.clientX}px`;
      spotlightRef.current.style.top = `${e.clientY}px`;
    }
  }, []);

  /* ─── Fetch song ─── */
  useEffect(() => {
    if (!id) return;
    const fetchSong = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("songs")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw new Error(error.message);
        if (!data) throw new Error("Song not found.");
        setSong(data as Song);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load song.";
        setError(msg);
        console.error("Song detail error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSong();
  }, [id]);

  /* ─── Loading ─── */
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
        <div className="relative z-10 mx-auto flex min-h-screen max-w-3xl items-center justify-center px-5 sm:px-8 lg:px-10">
          <div className="w-full">
            <div className="shimmer mb-6 h-64 w-full rounded-2xl" />
            <div className="shimmer mb-4 h-8 w-3/4 rounded-lg" />
            <div className="shimmer mb-2 h-5 w-1/2 rounded-lg" />
            <div className="mt-6 grid grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="shimmer h-20 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Error ─── */
  if (error || !song) {
    return (
      <div className="relative min-h-screen bg-[#0a0a1a]">
        <div className="liquid-bg">
          <div className="liquid-orb liquid-orb--1" />
          <div className="liquid-orb liquid-orb--2" />
          <div className="liquid-orb liquid-orb--3" />
          <div className="liquid-orb liquid-orb--4" />
          <div className="liquid-orb liquid-orb--5" />
        </div>
        <div className="relative z-10 mx-auto flex min-h-screen max-w-3xl items-center justify-center px-5 sm:px-8 lg:px-10">
          <div className="glass-card w-full rounded-2xl px-8 py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10">
              <svg className="h-8 w-8 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white">Song not found</h2>
            <p className="mt-2 text-sm text-white/50">{error || "The song you're looking for doesn't exist."}</p>
            <Link
              href="/trending"
              className="glass-btn mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white/90"
            >
              ← Back to Trending
            </Link>
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

      <div className="relative z-10 mx-auto max-w-3xl px-5 py-6 sm:px-8 lg:px-10">
        {/* ─── Back link ─── */}
        <Link
          href="/trending"
          className="animate-fade-in mb-6 inline-flex items-center gap-2 text-sm text-white/40 transition hover:text-white/70"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Trending
        </Link>

        {/* ─── Hero card ─── */}
        <section className="animate-fade-in glass-card rounded-2xl overflow-hidden">
          {/* Gradient header */}
          <div className="bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent px-6 py-10 sm:px-10 sm:py-14">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h1 className="text-3xl font-bold text-white sm:text-4xl">
                    {song.song_name || "Unknown Track"}
                  </h1>
                  {song.trend_status && (
                    <span className="shrink-0 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300 border border-amber-500/20">
                      {song.trend_status}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-lg text-white/50">
                  {song.artist_name || "Unknown Artist"}
                </p>

                {/* Badge row */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {song.niche && (
                    <span className="rounded-lg bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300 border border-indigo-500/20">
                      {song.niche}
                    </span>
                  )}
                  {song.mood && (
                    <span className="rounded-lg bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300 border border-emerald-500/20">
                      {song.mood}
                    </span>
                  )}
                  {song.genre && (
                    <span className="rounded-lg bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-300 border border-purple-500/20">
                      {song.genre}
                    </span>
                  )}
                </div>
              </div>

              {/* Trend score — large */}
              <div className="flex shrink-0 flex-col items-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                  <span className="text-3xl font-bold text-indigo-300">
                    {safeNum(song.trend_score, 0)}
                  </span>
                </div>
                <span className="mt-1.5 text-xs text-white/30">Trend Score</span>
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-px bg-white/[0.04] sm:grid-cols-3">
            {/* Popularity */}
            <div className="bg-[#0a0a1a] px-6 py-5">
              <p className="text-xs text-white/30">Popularity</p>
              <p className="mt-1 text-xl font-bold text-white">{safeNum(song.popularity, 0)}</p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-white/5">
                <div
                  className="h-1.5 rounded-full bg-emerald-500/50 transition-all"
                  style={{ width: `${Math.min(100, safeNum(song.popularity, 0))}%` }}
                />
              </div>
            </div>

            {/* BPM */}
            <div className="bg-[#0a0a1a] px-6 py-5">
              <p className="text-xs text-white/30">BPM</p>
              <p className="mt-1 text-xl font-bold text-white">
                {safeNum(song.bpm, 0) > 0 ? safeNum(song.bpm, 0) : "—"}
              </p>
            </div>

            {/* Energy */}
            <div className="bg-[#0a0a1a] px-6 py-5">
              <p className="text-xs text-white/30">Energy</p>
              <p className="mt-1 text-xl font-bold text-white">{safeNum(song.energy, 0)}</p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-white/5">
                <div
                  className="h-1.5 rounded-full bg-amber-500/50 transition-all"
                  style={{ width: `${Math.min(100, safeNum(song.energy, 0))}%` }}
                />
              </div>
            </div>

            {/* Niche (expanded) */}
            <div className="bg-[#0a0a1a] px-6 py-5">
              <p className="text-xs text-white/30">Niche</p>
              <p className="mt-1 text-sm font-semibold text-white">{song.niche || "—"}</p>
            </div>

            {/* Mood (expanded) */}
            <div className="bg-[#0a0a1a] px-6 py-5">
              <p className="text-xs text-white/30">Mood</p>
              <p className="mt-1 text-sm font-semibold text-emerald-300">{song.mood || "—"}</p>
            </div>

            {/* Genre (expanded) */}
            <div className="bg-[#0a0a1a] px-6 py-5">
              <p className="text-xs text-white/30">Genre</p>
              <p className="mt-1 text-sm font-semibold text-purple-300">{song.genre || "—"}</p>
            </div>
          </div>
        </section>

        {/* ─── Spotify Button ─── */}
        <div className="animate-fade-in mt-6">
          {song.spotify_url ? (
            <a
              href={song.spotify_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-[#1DB954] px-6 py-4 text-base font-bold text-black transition-all hover:bg-[#1ed760] hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.66.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
              Open in Spotify
            </a>
          ) : (
            <div className="glass-card rounded-2xl px-6 py-4 text-center">
              <p className="text-sm text-white/30">Spotify link not available for this track.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}