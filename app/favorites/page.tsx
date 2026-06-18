"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/* ─── Types ──────────────────────────────────────────────────────── */

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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ─── User navbar ──────────────────────────────────────────────────── */

function UserNavbar({ user, onSignOut }: { user: any; onSignOut: () => void }) {
  const avatarUrl = user?.user_metadata?.avatar_url;
  const displayName = user?.user_metadata?.full_name || user?.email || "User";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/Dashboard"
        className="glass-btn inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white/80 transition-all hover:text-white"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        Dashboard
      </Link>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={displayName}
          className="h-8 w-8 rounded-full border border-white/20 object-cover"
        />
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-bold text-indigo-300">
          {initials}
        </div>
      )}
      <button
        onClick={onSignOut}
        className="glass-btn rounded-xl px-3 py-1.5 text-xs font-semibold text-rose-300/70 hover:text-rose-200"
      >
        Logout
      </button>
    </div>
  );
}

/* ─── Component ──────────────────────────────────────────────────── */

export default function FavoritesPage() {
  const router = useRouter();
  const [saved, setSaved] = useState<SavedSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const spotlightRef = useRef<HTMLDivElement>(null);
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (spotlightRef.current) {
      spotlightRef.current.style.left = `${e.clientX}px`;
      spotlightRef.current.style.top = `${e.clientY}px`;
    }
  }, []);

  /* ─── Fetch user + saved ─── */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/loginpage");
          return;
        }
        setUser(user);

        const { data, error } = await supabase
          .from("saved_songs")
          .select("*")
          .eq("user_id", user.id)
          .order("saved_at", { ascending: false });

        if (error) throw error;
        setSaved((data || []) as SavedSong[]);
      } catch (err) {
        console.error("Failed to load favorites:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  /* ─── Remove ─── */
  const removeSong = async (song: SavedSong) => {
    setRemovingId(song.id);
    try {
      const { error } = await supabase.from("saved_songs").delete().eq("id", song.id);
      if (error) throw error;
      setSaved((prev) => prev.filter((s) => s.id !== song.id));
    } catch (err) {
      console.error("Remove error:", err);
    } finally {
      setRemovingId(null);
    }
  };

  /* ─── Sign out ─── */
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/loginpage");
  };

  /* ─── Filter ─── */
  const filtered = saved.filter((song) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      song.song_name.toLowerCase().includes(q) ||
      song.artist_name.toLowerCase().includes(q)
    );
  });

  const totalCount = saved.length;

  /* ─── Loading ─── */
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
            Loading favorites…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen" onMouseMove={handleMouseMove}>
      <div className="liquid-bg">
        <div className="liquid-orb liquid-orb--1" />
        <div className="liquid-orb liquid-orb--2" />
        <div className="liquid-orb liquid-orb--3" />
        <div className="liquid-orb liquid-orb--4" />
        <div className="liquid-orb liquid-orb--5" />
      </div>
      <div ref={spotlightRef} className="spotlight" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-4xl px-5 py-6 sm:px-8 lg:px-10">
        {/* ─── Header with user info ─── */}
        <header className="animate-fade-in glass-card mb-6 flex flex-col gap-4 rounded-2xl px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
              ReelIQ Studio
            </p>
            <h1 className="mt-1 text-3xl font-bold text-gradient sm:text-4xl">My Favorites</h1>
            <p className="mt-1 text-sm text-white/40">
              {totalCount} saved {totalCount === 1 ? "track" : "tracks"}
            </p>
          </div>
          <UserNavbar user={user} onSignOut={handleSignOut} />
        </header>

        {/* ─── Search ─── */}
        <div className="animate-fade-in animate-fade-in-delay-1 mb-4">
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 backdrop-blur-sm transition-all duration-300 focus-within:border-indigo-500/40 focus-within:bg-white/[0.05]">
            <svg className="h-5 w-5 shrink-0 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder="Search favorites..."
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

        {/* ─── Song list ─── */}
        <section className="animate-fade-in animate-fade-in-delay-2">
          {filtered.length > 0 ? (
            <div className="grid gap-3">
              {filtered.map((song, idx) => (
                <article
                  key={song.id}
                  className="glass-song rounded-xl p-4"
                  style={{ animationDelay: `${idx * 0.04}s` }}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-sm font-bold text-amber-400">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <Link href={`/song/${song.id}`} className="hover:underline">
                          <h3 className="max-w-[200px] truncate font-semibold text-white sm:max-w-[350px]">
                            {song.song_name || "Unknown Track"}
                          </h3>
                        </Link>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/40">
                          {song.artist_name && <span>{song.artist_name}</span>}
                          {song.niche && <span className="text-indigo-300/60">{song.niche}</span>}
                          <span>Saved {song.saved_at ? formatDate(song.saved_at) : ""}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-300">
                        {safeNum(song.trend_score, 0)}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                          safeNum(song.growth_24h, 0) >= 0
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                            : "border-rose-500/20 bg-rose-500/10 text-rose-300"
                        }`}
                      >
                        {formatTrend(safeNum(song.growth_24h, 0))}
                      </span>

                      <button
                        onClick={() => removeSong(song)}
                        disabled={removingId === song.id}
                        className="glass-btn inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-300/70 hover:text-rose-200"
                      >
                        {removingId === song.id ? (
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        ) : (
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        )}
                        Remove
                      </button>

                      {song.spotify_url && (
                        <a
                          href={song.spotify_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#1DB954]/15 px-2.5 py-1.5 text-xs font-semibold text-[#1DB954] hover:bg-[#1DB954]/25"
                        >
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
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
            <div className="glass-upload rounded-xl px-5 py-16 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10">
                  <svg className="h-8 w-8 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-base font-semibold text-white/60">
                    {searchQuery ? "No matching favorites." : "No favorites saved yet."}
                  </p>
                  <p className="mt-1 text-sm text-white/30">
                    {searchQuery
                      ? "Try a different search term."
                      : "Save songs from Trending to build your favorites."}
                  </p>
                </div>
                {!searchQuery && (
                  <Link
                    href="/trending"
                    className="glass-btn inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white/90"
                  >
                    Browse Trending
                  </Link>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}