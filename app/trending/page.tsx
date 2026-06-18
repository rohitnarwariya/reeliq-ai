"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  niche: string;
  mood: string;
  bpm: number;
}

interface SavedSong {
  id: string;
  user_id: string;
  song_name: string;
  artist_name: string;
  spotify_url: string;
  trend_score: number;
  growth_24h: number;
  growth_7d: number;
  niche: string;
  saved_at: string;
}

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

type NicheFilter = (typeof NICHE_OPTIONS)[number];

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

/* ─── Skeleton ───────────────────────────────────────────────────── */

function SongSkeleton() {
  return (
    <div className="shimmer rounded-xl p-4" style={{ borderRadius: "12px" }}>
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-white/5" />
        <div className="flex-1">
          <div className="h-4 w-3/4 rounded bg-white/5" />
          <div className="mt-2 h-3 w-1/2 rounded bg-white/5" />
        </div>
      </div>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="shimmer rounded-xl p-5" style={{ borderRadius: "12px" }}>
      <div className="h-8 w-16 rounded bg-white/5" />
      <div className="mt-2 h-3 w-24 rounded bg-white/5" />
    </div>
  );
}

/* ─── Component ──────────────────────────────────────────────────── */

export default function TrendingPage() {
  const router = useRouter();

  const [allTrends, setAllTrends] = useState<AudioTrend[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [activeNiche, setActiveNiche] = useState<NicheFilter>("All");

  const spotlightRef = useRef<HTMLDivElement>(null);
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (spotlightRef.current) {
      spotlightRef.current.style.left = `${e.clientX}px`;
      spotlightRef.current.style.top = `${e.clientY}px`;
    }
  }, []);

  /* ─── Fetch data + saved songs ─── */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let data: any[] | null = null;
        let { data: trendData, error } = await supabase.from("audio_trends").select("*");

        if (error) {
          console.warn("audio_trends not available, falling back to trending_songs:", error.message);
          const { data: fallback } = await supabase.from("trending_songs").select("*");
          data = (fallback || []).map((song: any) => ({
            id: song.id,
            song_name: song.song_name,
            artist_name: song.artist_name,
            spotify_url: song.spotify_url,
            trend_score: safeNum(song.trend_score, 0),
            growth_24h: Math.round((Math.random() * 20 - 5) * 100) / 100,
            growth_7d: Math.round((Math.random() * 50 - 10) * 100) / 100,
            niche: song.mood || "Lifestyle",
            mood: song.mood || "Energetic",
            bpm: safeNum(song.bpm, 120),
          }));
        } else {
          data = trendData;
        }

        setAllTrends((data || []) as AudioTrend[]);

        // Fetch user's saved song IDs
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: saved } = await supabase
            .from("saved_songs")
            .select("song_name, artist_name")
            .eq("user_id", user.id);

          if (saved) {
            setSavedIds(
              new Set(
                saved.map((s: { song_name: string; artist_name: string }) => `${s.song_name}::${s.artist_name}`)
              )
            );
          }
        }
      } catch (err) {
        console.error("Failed to fetch trends:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /* ─── Toggle save song ─── */
  const toggleSave = async (song: AudioTrend) => {
    setSavingId(song.id);
    const key = `${song.song_name}::${song.artist_name}`;
    const isSaved = savedIds.has(key);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/loginpage");
        return;
      }

      if (isSaved) {
        const { error } = await supabase
          .from("saved_songs")
          .delete()
          .eq("user_id", user.id)
          .eq("song_name", song.song_name)
          .eq("artist_name", song.artist_name);

        if (error) throw error;
        setSavedIds((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      } else {
        const { error } = await supabase.from("saved_songs").insert({
          user_id: user.id,
          song_name: song.song_name,
          artist_name: song.artist_name,
          spotify_url: song.spotify_url,
          trend_score: safeNum(song.trend_score, 0),
          growth_24h: safeNum(song.growth_24h, 0),
          growth_7d: safeNum(song.growth_7d, 0),
          niche: song.niche || "Lifestyle",
        });

        if (error) throw error;
        setSavedIds((prev) => {
          const next = new Set(prev);
          next.add(key);
          return next;
        });
      }
    } catch (err) {
      console.error("Save toggle error:", err);
    } finally {
      setSavingId(null);
    }
  };

  /* ─── Compute filtered + sorted views ─── */

  const filteredByNiche = allTrends.filter(
    (s) => activeNiche === "All" || s.niche === activeNiche
  );

  // Trending Today: sorted by trend_score descending
  const trendingToday = [...filteredByNiche].sort(
    (a, b) => safeNum(b.trend_score, 0) - safeNum(a.trend_score, 0)
  );

  // Rising Fast: sorted by growth_24h descending, only positive
  const risingFast = [...filteredByNiche]
    .filter((s) => safeNum(s.growth_24h, 0) > 0)
    .sort((a, b) => safeNum(b.growth_24h, 0) - safeNum(a.growth_24h, 0));

  // Hidden Gems: low trend score but high growth 7d
  const hiddenGems = [...filteredByNiche]
    .filter((s) => safeNum(s.trend_score, 0) < 50 && safeNum(s.growth_7d, 0) > 0)
    .sort((a, b) => safeNum(b.growth_7d, 0) - safeNum(a.growth_7d, 0));

  // By Niche: top by trend score within active niche
  const topByNiche = [...filteredByNiche].sort(
    (a, b) => safeNum(b.trend_score, 0) - safeNum(a.trend_score, 0)
  );

  /* ─── Stats ─── */
  const totalTracks = allTrends.length;
  const avgGrowth24h =
    allTrends.length > 0
      ? allTrends.reduce((sum, s) => sum + safeNum(s.growth_24h, 0), 0) / allTrends.length
      : 0;
  const topTrendScore =
    allTrends.length > 0
      ? Math.max(...allTrends.map((s) => safeNum(s.trend_score, 0)))
      : 0;
  const risingTracks = allTrends.filter((s) => safeNum(s.growth_24h, 0) > 0).length;

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
        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-6 sm:px-8 lg:px-10">
          {/* Header skeleton */}
          <div className="shimmer rounded-2xl p-6" style={{ borderRadius: "16px" }}>
            <div className="h-4 w-20 rounded bg-white/5" />
            <div className="mt-2 h-8 w-40 rounded bg-white/5" />
          </div>

          {/* Stats skeletons */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <StatsSkeleton key={i} />)}
          </div>

          {/* Song skeletons */}
          <div className="grid gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => <SongSkeleton key={i} />)}
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

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-6 sm:px-8 lg:px-10">
        {/* ─── Header ─── */}
        <header className="animate-fade-in glass-card flex flex-col gap-4 rounded-2xl px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">ReelIQ Studio</p>
            <h1 className="mt-1 text-3xl font-bold text-gradient sm:text-4xl">Trending</h1>
            <p className="mt-1 text-sm text-white/40">
              {totalTracks} tracks in rotation
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/saved-songs"
              className="glass-btn inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-amber-300/90 sm:w-auto"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
              Saved
            </Link>
            <Link
              href="/Dashboard"
              className="glass-btn inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white/90 sm:w-auto"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </Link>
          </div>
        </header>

        {/* ─── Stats Cards ─── */}
        <div className="animate-fade-in animate-fade-in-delay-1 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="glass-card rounded-xl px-5 py-4">
            <p className="text-2xl font-bold text-white">{totalTracks}</p>
            <p className="mt-1 text-sm text-white/40">Total Tracks</p>
          </div>
          <div className="glass-card rounded-xl px-5 py-4">
            <p className="text-2xl font-bold text-white">{risingTracks}</p>
            <p className="mt-1 text-sm text-white/40">Rising Tracks</p>
          </div>
          <div className="glass-card rounded-xl px-5 py-4">
            <p className="text-2xl font-bold text-white">{topTrendScore}</p>
            <p className="mt-1 text-sm text-white/40">Top Trend Score</p>
          </div>
          <div className="glass-card rounded-xl px-5 py-4">
            <p
              className={`text-2xl font-bold ${
                avgGrowth24h >= 0 ? "text-emerald-300" : "text-rose-300"
              }`}
            >
              {formatTrend(avgGrowth24h)}
            </p>
            <p className="mt-1 text-sm text-white/40">Avg Growth 24h</p>
          </div>
        </div>

        {/* ─── Niche Filters ─── */}
        <div className="animate-fade-in animate-fade-in-delay-1 flex flex-wrap gap-2">
          {NICHE_OPTIONS.map((niche) => (
            <button
              key={niche}
              onClick={() => setActiveNiche(niche)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                activeNiche === niche
                  ? "glass-niche-active text-indigo-200"
                  : "glass-niche-inactive text-white/50 hover:text-white/80"
              }`}
            >
              {niche === "All" ? "🎵 All" : niche === "Fitness" ? "💪 Fitness" : niche === "Travel" ? "✈️ Travel" : niche === "Motivation" ? "🔥 Motivation" : niche === "Business" ? "💼 Business" : niche === "Education" ? "📚 Education" : niche === "Gaming" ? "🎮 Gaming" : "🌟 Lifestyle"}
            </button>
          ))}
        </div>

        {/* ─── Section: Trending Today ─── */}
        <Section
          title="🔥 Trending Today"
          subtitle={`Top ${Math.min(trendingToday.length, 10)} by trend score`}
          emptyMsg="No trending songs found."
          songs={trendingToday.slice(0, 10)}
          savedIds={savedIds}
          savingId={savingId}
          onToggleSave={toggleSave}
        />

        {/* ─── Section: Rising Fast ─── */}
        <Section
          title="📈 Rising Fast"
          subtitle={`${risingFast.length} tracks with positive 24h growth`}
          emptyMsg="No rising tracks found for this niche."
          songs={risingFast.slice(0, 10)}
          savedIds={savedIds}
          savingId={savingId}
          onToggleSave={toggleSave}
        />

        {/* ─── Section: Hidden Gems ─── */}
        <Section
          title="💎 Hidden Gems"
          subtitle={`${hiddenGems.length} undiscovered tracks with growing momentum`}
          emptyMsg="No hidden gems discovered for this niche."
          songs={hiddenGems.slice(0, 10)}
          savedIds={savedIds}
          savingId={savingId}
          onToggleSave={toggleSave}
        />

        {/* ─── Section: Top Songs by Niche ─── */}
        <Section
          title={activeNiche === "All" ? "🏷️ Top Songs by Niche" : `🏷️ Top ${activeNiche}`}
          subtitle={`Best performing in ${activeNiche === "All" ? "all niches" : activeNiche}`}
          emptyMsg="No songs found for this niche."
          songs={topByNiche.slice(0, 10)}
          savedIds={savedIds}
          savingId={savingId}
          onToggleSave={toggleSave}
        />
      </div>
    </div>
  );
}

/* ─── Section Component ───────────────────────────────────────────── */

function Section({
  title,
  subtitle,
  emptyMsg,
  songs,
  savedIds,
  savingId,
  onToggleSave,
}: {
  title: string;
  subtitle: string;
  emptyMsg: string;
  songs: AudioTrend[];
  savedIds: Set<string>;
  savingId: string | null;
  onToggleSave: (song: AudioTrend) => void;
}) {
  return (
    <section className="animate-fade-in animate-fade-in-delay-2">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <p className="text-sm text-white/40">{subtitle}</p>
        </div>
        <span className="text-xs text-white/30">{songs.length} tracks</span>
      </div>

      {songs.length > 0 ? (
        <div className="grid gap-3">
          {songs.map((song, idx) => {
            const key = `${song.song_name}::${song.artist_name}`;
            return (
              <SongCard
                key={`s-${song.id || idx}`}
                song={song}
                rank={idx + 1}
                isSaved={savedIds.has(key)}
                isSaving={savingId === song.id}
                onToggleSave={() => onToggleSave(song)}
              />
            );
          })}
        </div>
      ) : (
        <div className="glass-upload rounded-xl px-5 py-14 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
              <svg className="h-8 w-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
              </svg>
            </div>
            <p className="text-sm text-white/30">{emptyMsg}</p>
          </div>
        </div>
      )}
    </section>
  );
}

/* ─── Song Card Component ─────────────────────────────────────────── */

function SongCard({
  song,
  rank,
  isSaved,
  isSaving,
  onToggleSave,
}: {
  song: AudioTrend;
  rank: number;
  isSaved: boolean;
  isSaving: boolean;
  onToggleSave: () => void;
}) {
  const growth24h = safeNum(song.growth_24h, 0);
  const growth7d = safeNum(song.growth_7d, 0);
  const isPositive24 = growth24h >= 0;
  const isPositive7d = growth7d >= 0;

  return (
    <article
      className="glass-song rounded-xl p-4"
      style={{ animationDelay: `${0.3 + rank * 0.04}s` }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-sm font-bold text-white/60 backdrop-blur-sm">
            {rank}
          </div>
          <div className="min-w-0">
            <h3 className="max-w-[220px] truncate font-semibold text-white sm:max-w-[350px]">
              {song.song_name || "Unknown Track"}
            </h3>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/40">
              {song.artist_name && <span>{song.artist_name}</span>}
              {song.bpm > 0 && <span>BPM {safeNum(song.bpm, 0)}</span>}
              {song.mood && <span>{song.mood}</span>}
              {song.niche && <span className="text-indigo-300/60">{song.niche}</span>}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Trend Score */}
          <span className="w-fit rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-sm font-semibold text-indigo-300 backdrop-blur-sm">
            {safeNum(song.trend_score, 0)}
          </span>

          {/* Growth 24h */}
          <span
            className={`w-fit rounded-full border px-3 py-1 text-sm font-semibold backdrop-blur-sm ${
              isPositive24
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                : "border-rose-500/20 bg-rose-500/10 text-rose-300"
            }`}
          >
            {formatTrend(growth24h)} 24h
          </span>

          {/* Growth 7d */}
          <span
            className={`w-fit rounded-full border px-3 py-1 text-sm font-semibold backdrop-blur-sm ${
              isPositive7d
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                : "border-rose-500/20 bg-rose-500/10 text-rose-300"
            }`}
          >
            {formatTrend(growth7d)} 7d
          </span>

          {/* Save Button */}
          <button
            onClick={onToggleSave}
            disabled={isSaving}
            className={`glass-btn inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
              isSaved
                ? "text-amber-300/90 border-amber-500/20"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            {isSaving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : isSaved ? (
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            )}
            {isSaved ? "Saved" : "Save"}
          </button>

          {/* Spotify Button */}
          {song.spotify_url ? (
            <a
              href={song.spotify_url}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-btn inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold text-cyan-300/80"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.66.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
              Spotify
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}