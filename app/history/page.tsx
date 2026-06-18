"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

type ReelRecord = {
  id: string;
  user_id?: string | null;
  video_url?: string | null;
  duration?: number | null;
  fps?: number | null;
  pace_score?: number | null;
  energy_score?: number | null;
  mood?: string | null;
  editing_style?: string | null;
  created_at?: string | null;
};

type RecommendationRecord = {
  id: string;
  user_id?: string | null;
  reel_url?: string | null;
  songs?: Array<{ song_name: string; match_score: number; trend_score: number }> | null;
  created_at?: string | null;
};

type HistoryEntry = {
  id: string;
  reel: ReelRecord;
  recommendations: RecommendationRecord;
  displayDate: string;
};

/* ─── Safely format a number ─── */
function safeNum(value: number | null | undefined, fallback = 0): number {
  return value === null || value === undefined || isNaN(value) ? fallback : value;
}

const MOOD_FILTERS = ["All", "Calm", "Energetic", "Aggressive", "Cinematic"] as const;

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [moodFilter, setMoodFilter] = useState<string>("All");

  const spotlightRef = useRef<HTMLDivElement>(null);
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (spotlightRef.current) {
      spotlightRef.current.style.left = `${e.clientX}px`;
      spotlightRef.current.style.top = `${e.clientY}px`;
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user) {
          router.push("/loginpage");
          return;
        }

        /* ─── Fetch reels for this user ─── */
        const { data: reels, error: reelError } = await supabase
          .from("reels")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (reelError) throw reelError;

        const reelRecords = (reels || []) as ReelRecord[];

        /* ─── Fetch ALL recommendation_history, filter client-side by reel_url ─── */
        const { data: recs, error: recError } = await supabase
          .from("recommendation_history")
          .select("*");

        if (recError) throw recError;

        const allRecs = (recs || []) as RecommendationRecord[];
        const userRecs = allRecs.filter((r) => r.user_id === user.id);

        /* ─── Build map: reel_url → recommendation record ─── */
        const recMap = new Map<string, RecommendationRecord>();
        for (const rec of userRecs) {
          if (rec.reel_url) {
            recMap.set(rec.reel_url, rec);
          }
        }

        /* ─── Join reels with recommendations ─── */
        const entries: HistoryEntry[] = reelRecords.map((reel) => {
          const rec = reel.video_url ? recMap.get(reel.video_url) : undefined;
          const displayDate = reel.created_at
            ? new Date(reel.created_at).toLocaleString()
            : "Unknown date";

          return {
            id: reel.id,
            reel,
            recommendations: rec || {
              id: reel.id,
              reel_url: reel.video_url,
              songs: [],
              created_at: reel.created_at,
            },
            displayDate,
          };
        });

        setHistory(entries);
      } catch (error) {
        console.error("Error loading upload history:", error);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load upload history."
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const handleDelete = async (reelUrl: string) => {
    if (!window.confirm("Delete this reel permanently?")) return;

    const { error: historyError } = await supabase
      .from("recommendation_history")
      .delete()
      .eq("reel_url", reelUrl);

    if (historyError) {
      alert(historyError.message);
      return;
    }

    const { error: reelError } = await supabase
      .from("reels")
      .delete()
      .eq("video_url", reelUrl);

    if (reelError) {
      alert(reelError.message);
      return;
    }

    setHistory((prev) => prev.filter((item) => item.reel.video_url !== reelUrl));
    alert("Reel deleted successfully");
  };

  const getSongRecords = (item: HistoryEntry) => {
    const songs = item.recommendations.songs;
    if (songs && songs.length > 0) return songs;
    return [];
  };

  /* ─── Filtered + searched results ─── */
  const filteredHistory = history.filter((item) => {
    const reel = item.reel;
    const mood = (reel.mood || "").toLowerCase();
    const editingStyle = (reel.editing_style || "").toLowerCase();
    const q = searchQuery.trim().toLowerCase();

    // Mood filter
    const matchesMoodFilter =
      moodFilter === "All" || mood === moodFilter.toLowerCase();

    // Search query matches mood or editing style
    const matchesSearch =
      !q ||
      mood.includes(q) ||
      editingStyle.includes(q) ||
      reel.mood?.toLowerCase().includes(q) ||
      reel.editing_style?.toLowerCase().includes(q);

    return matchesMoodFilter && matchesSearch;
  });

  return (
    <div
      className="relative min-h-screen"
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

      {/* ─── Content ─── */}
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-6 sm:px-8 lg:px-10">
        {/* ─── Header ─── */}
        <header className="animate-fade-in glass-card flex flex-col gap-4 rounded-2xl px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
              ReelIQ Studio
            </p>
            <h1 className="mt-1 text-3xl font-bold text-gradient sm:text-4xl">
              Upload History
            </h1>
          </div>

          <Link
            href="/Dashboard"
            className="glass-btn inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white/90 sm:w-auto"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
            </svg>
            Back to Dashboard
          </Link>
        </header>

        {/* ─── Search + Filters ─── */}
        <div className="animate-fade-in animate-fade-in-delay-1 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search by mood or style…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input w-full rounded-xl border border-slate-500/20 bg-white/5 px-4 py-2.5 pl-10 text-sm text-white placeholder-white/40 backdrop-blur-sm transition focus:border-indigo-400/60 focus:outline-none"
            />
            <svg className="absolute left-3 top-2.5 h-4 w-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
          </div>

          <div className="flex flex-wrap gap-2">
            {MOOD_FILTERS.map((mood) => (
              <button
                key={mood}
                onClick={() => setMoodFilter(mood)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold backdrop-blur-sm transition ${
                  moodFilter === mood
                    ? "border border-indigo-500/40 bg-indigo-500/20 text-indigo-200 shadow-lg shadow-indigo-500/10"
                    : "border border-slate-500/20 bg-white/5 text-white/60 hover:border-indigo-500/30 hover:text-white/80"
                }`}
              >
                {mood}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            <div className="relative flex h-10 w-10 items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-full bg-indigo-500/30" />
              <div className="absolute inset-1.5 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
            </div>
            <p className="text-sm text-white/50">Loading your upload history…</p>
          </div>
        ) : errorMessage ? (
          <div className="animate-fade-in rounded-xl border border-rose-500/20 bg-rose-500/8 px-6 py-4 text-sm text-rose-300 backdrop-blur-sm">
            {errorMessage}
          </div>
        ) : filteredHistory.length > 0 ? (
          <section className="grid gap-6 md:grid-cols-2">
            {filteredHistory.map((item) => {
              const songRecords = getSongRecords(item);
              const reel = item.reel;

              return (
                <article
                  key={item.id}
                  className="animate-fade-in glass-card overflow-hidden rounded-2xl"
                  style={{ animationDelay: `${0.05 * history.indexOf(item)}s` }}
                >
                  {/* ─── Video preview ─── */}
                  <div className="glass-video flex aspect-video items-center justify-center">
                    {reel.video_url ? (
                      <video
                        src={reel.video_url}
                        controls
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <p className="text-sm text-white/30">No preview</p>
                    )}
                  </div>

                  <div className="p-5 sm:p-6">
                    {/* ─── Date + song count header ─── */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-white">
                          {reel.mood || "Uploaded Reel"}
                        </h2>
                        <p className="mt-1 text-xs text-white/40">
                          {item.displayDate}
                        </p>
                      </div>

                      <span className="w-fit rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300 backdrop-blur-sm">
                        {songRecords.length} tracks
                      </span>
                    </div>

                    {/* ─── Reel Analysis Summary ─── */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {reel.energy_score !== null && reel.energy_score !== undefined && (
                        <span className="rounded-full border border-indigo-500/20 bg-indigo-500/8 px-3 py-1 text-xs font-semibold text-indigo-300 backdrop-blur-sm">
                          ⚡ {safeNum(reel.energy_score)}/100
                        </span>
                      )}
                      {reel.pace_score !== null && reel.pace_score !== undefined && (
                        <span className="rounded-full border border-cyan-500/20 bg-cyan-500/8 px-3 py-1 text-xs font-semibold text-cyan-300 backdrop-blur-sm">
                          🏃 Pace {safeNum(reel.pace_score)}/100
                        </span>
                      )}
                      {reel.mood && (
                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/8 px-3 py-1 text-xs font-semibold text-emerald-300 backdrop-blur-sm">
                          🎭 {reel.mood}
                        </span>
                      )}
                      {reel.editing_style && (
                        <span className="rounded-full border border-purple-500/20 bg-purple-500/8 px-3 py-1 text-xs font-semibold text-purple-300 backdrop-blur-sm">
                          ✂️ {reel.editing_style}
                        </span>
                      )}
                      {reel.duration !== null && reel.duration !== undefined && (
                        <span className="rounded-full border border-slate-500/20 bg-slate-500/8 px-3 py-1 text-xs font-semibold text-slate-300 backdrop-blur-sm">
                          ⏱ {safeNum(reel.duration, 0)}s
                        </span>
                      )}
                    </div>

                    {/* ─── Recommended songs ─── */}
                    <div className="mt-5 rounded-xl border border-slate-500/10 bg-white/[0.02] p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
                        Recommended Songs
                      </p>

                      {songRecords.length > 0 ? (
                        <div className="mt-3 grid gap-2">
                          {songRecords.map((song, index) => (
                            <div
                              key={`${item.id}-${song.song_name}-${index}`}
                              className="rounded-lg border border-slate-500/10 bg-white/[0.03] px-3 py-2.5"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/5 text-xs font-bold text-white/50">
                                    {index + 1}
                                  </span>
                                  <span className="text-sm font-medium text-white">
                                    {song.song_name || "Unknown"}
                                  </span>
                                </div>
                                <div className="flex gap-2">
                                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                                    {safeNum(song.match_score, 0)}%
                                  </span>
                                  <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-300">
                                    T{safeNum(song.trend_score, 0)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 text-xs text-white/30">No recommendations found</p>
                      )}
                    </div>

                    {/* ─── Actions ─── */}
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      {reel.video_url && (
                        <a
                          href={reel.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="glass-btn inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold text-cyan-300/80 sm:w-auto"
                        >
                          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.66.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                          </svg>
                          Open Video
                        </a>
                      )}

                      <button
                        onClick={() => reel.video_url && handleDelete(reel.video_url)}
                        className="rounded-md bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
                      >
                        Delete Reel
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <div className="animate-fade-in glass-card flex flex-col items-center justify-center gap-4 rounded-2xl px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
              <svg className="h-7 w-7 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0v-4.5m17.25 4.5v-4.5m-17.25-10.5v-4.5m17.25 4.5v4.5M3.375 3.75h17.25M3.375 3.75v4.5m0-4.5h17.25m-17.25 0v-4.5m17.25 4.5v4.5" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">No uploads yet</h2>
              <p className="mt-1 text-sm text-white/40">
                Head to the Dashboard to upload your first reel.
              </p>
            </div>
            <Link
              href="/Dashboard"
              className="glass-btn mt-2 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white/90"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Upload Reel
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
