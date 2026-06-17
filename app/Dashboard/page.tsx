"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

type Song = {
  niche: string;
  audio_name: string;
  artist_name?: string;
  spotify_url?: string;
  trend_score?: number | string;
  reason?: string;
};

const niches = ["motivation", "fitness", "travel"];

type AnalyzeResponse = {
  niche?: string;
};

type ReelAnalytics = {
  niche?: string | null;
};

type RecommendationAnalytics = {
  songs?: string[] | null;
};

type DashboardAnalytics = {
  totalUploads: number;
  favoriteNiche: string;
  totalRecommendedSongs: number;
};

/* ─── Number counter hook ─── */
function useCountUp(target: number, duration = 1200) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (target === 0) {
      setDisplay(0);
      return;
    }
    const startTime = performance.now();
    let raf: number;

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      setDisplay(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return display;
}

export default function DashboardPage() {
  const router = useRouter();

  const [videoUrl, setVideoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedNiche, setSelectedNiche] = useState("motivation");
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<DashboardAnalytics>({
    totalUploads: 0,
    favoriteNiche: "None",
    totalRecommendedSongs: 0,
  });

  /* ─── Mouse spotlight ref ─── */
  const spotlightRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (spotlightRef.current) {
      spotlightRef.current.style.left = `${e.clientX}px`;
      spotlightRef.current.style.top = `${e.clientY}px`;
    }
  }, []);

  // Count-up displays
  const uploadCount = useCountUp(analytics.totalUploads);
  const recCount = useCountUp(analytics.totalRecommendedSongs);

  useEffect(() => {
    const loadDashboardAnalytics = async () => {
      setAnalyticsLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Error loading user:", userError);
        setAnalyticsLoading(false);
        return;
      }

      if (!user) {
        router.push("/loginpage");
        setAnalyticsLoading(false);
        return;
      }

      const { data: reelData, error: reelError } = await supabase
        .from("reels")
        .select("niche")
        .eq("user_id", user.id);

      if (reelError) {
        console.error("Error loading reel analytics:", reelError);
        setAnalyticsLoading(false);
        return;
      }

      const { data: recommendationData, error: recommendationError } =
        await supabase
          .from("recommendation_history")
          .select("songs")
          .eq("user_id", user.id);

      if (recommendationError) {
        console.error(
          "Error loading recommendation analytics:",
          recommendationError
        );
      }

      const userReels = (reelData || []) as ReelAnalytics[];
      const nicheCounts = userReels.reduce<Record<string, number>>(
        (counts, reel) => {
          if (!reel.niche) return counts;

          counts[reel.niche] = (counts[reel.niche] || 0) + 1;
          return counts;
        },
        {}
      );

      const favoriteNiche =
        Object.entries(nicheCounts).sort(
          ([, firstCount], [, secondCount]) => secondCount - firstCount
        )[0]?.[0] || "None";

      const totalRecommendedSongs = (
        (recommendationData || []) as RecommendationAnalytics[]
      ).reduce(
        (total, recommendation) =>
          total + (recommendation.songs?.length || 0),
        0
      );

      setAnalytics({
        totalUploads: userReels.length,
        favoriteNiche:
          favoriteNiche === "None"
            ? favoriteNiche
            : favoriteNiche.charAt(0).toUpperCase() + favoriteNiche.slice(1),
        totalRecommendedSongs,
      });

      setAnalyticsLoading(false);
    };

    loadDashboardAnalytics();
  }, [router]);

  const refreshDashboardAnalytics = async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return;
    }

    const { data: reelData, error: reelError } = await supabase
      .from("reels")
      .select("niche")
      .eq("user_id", user.id);

    if (reelError) {
      console.error("Error refreshing reel analytics:", reelError);
      return;
    }

      const { data: recommendationData, error: recommendationError } =
        await supabase
          .from("recommendation_history")
          .select("songs")
          .eq("user_id", user.id);

    if (recommendationError) {
      console.error(
        "Error refreshing recommendation analytics:",
        recommendationError
      );
    }

    const userReels = (reelData || []) as ReelAnalytics[];
    const nicheCounts = userReels.reduce<Record<string, number>>(
      (counts, reel) => {
        if (!reel.niche) return counts;

        counts[reel.niche] = (counts[reel.niche] || 0) + 1;
        return counts;
      },
      {}
    );

    const favoriteNiche =
      Object.entries(nicheCounts).sort(
        ([, firstCount], [, secondCount]) => secondCount - firstCount
      )[0]?.[0] || "None";

    const totalRecommendedSongs = (
      (recommendationData || []) as RecommendationAnalytics[]
    ).reduce(
      (total, recommendation) =>
        total + (recommendation.songs?.length || 0),
      0
    );

    setAnalytics({
      totalUploads: userReels.length,
      favoriteNiche:
        favoriteNiche === "None"
          ? favoriteNiche
          : favoriteNiche.charAt(0).toUpperCase() + favoriteNiche.slice(1),
      totalRecommendedSongs,
    });
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/loginpage");
  };

  const handleUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setUploading(true);
    setSelectedFileName(file.name);
    setSongs([]);

    try {
      let uploadNiche = selectedNiche;

      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filename: file.name,
          }),
        });

        if (response.ok) {
          const aiResult = (await response.json()) as AnalyzeResponse;
          console.log("AI RESULT:", aiResult);
          const normalizedNiche = aiResult.niche?.toLowerCase().trim();

          if (normalizedNiche && niches.includes(normalizedNiche)) {
            uploadNiche = normalizedNiche;
            setSelectedNiche(normalizedNiche);
          }
        }
      } catch (analyzeError) {
        console.warn("AI niche analysis skipped:", analyzeError);
      }

      const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const fileName = `${crypto.randomUUID()}-${safeFileName}`;

      const { error: uploadError } = await supabase.storage
        .from("reels")
        .upload(fileName, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from("reels")
        .getPublicUrl(fileName);

      const uploadedVideoUrl = publicUrlData.publicUrl;
      setVideoUrl(uploadedVideoUrl);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not found");
      }

      const { data: reelData, error: reelError } = await supabase
        .from("reels")
        .insert([
          {
            user_id: user.id,
            video_url: uploadedVideoUrl,
            niche: uploadNiche,
            mood: null,
            energy: null,
          },
        ])
        .select();

      if (reelError) {
        throw reelError;
      }

      const insertedReelId = reelData?.[0]?.id;

      if (!insertedReelId) {
        throw new Error("Reel uploaded, but reel id was not returned.");
      }

      const { data: audioData, error: audioError } = await supabase
        .from("audio_library")
        .select("*");

      if (audioError) {
        throw audioError;
      }

      const filteredSongs = ((audioData as Song[] | null)?.filter(
        (audio) => audio.niche === uploadNiche
      ) || []) as Song[];

      setSongs(filteredSongs);

      if (filteredSongs.length > 0) {
        const songNames = filteredSongs.map((song) => song.audio_name);

        const { error: recommendationError } = await supabase
          .from("recommendation_history")
          .insert([
            {
              user_id: user.id,
              reel_url: uploadedVideoUrl,
              niche: uploadNiche,
              songs: songNames,
            },
          ]);

        if (recommendationError) {
          console.error(
            "Error inserting recommendation history:",
            recommendationError
          );
          alert(
            "Reel uploaded, but history could not be saved. Check Supabase RLS policy for recommendation_history."
          );
        }
      }

      alert(`Upload successful. Found ${filteredSongs.length} songs.`);
      await refreshDashboardAnalytics();
    } catch (error) {
      console.error("Upload error:", error);

      alert(
        error instanceof Error
          ? error.message
          : JSON.stringify(error)
      );
    } finally {
      setUploading(false);
    }
  };

  /* ─── Loading state ─── */
  if (analyticsLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a1a]">
        <div className="glass-loading flex flex-col items-center gap-5 rounded-2xl px-10 py-12">
          <div className="relative flex h-12 w-12 items-center justify-center">
            <div className="absolute inset-0 animate-ping rounded-full bg-indigo-500/30" />
            <div className="absolute inset-2 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
            <div className="h-3 w-3 rounded-full bg-indigo-400" />
          </div>
          <p className="text-sm font-medium tracking-wide text-white/60">
            Checking authentication…
          </p>
        </div>
      </div>
    );
  }

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

      {/* ─── Mouse-follow spotlight ─── */}
      <div ref={spotlightRef} className="spotlight" aria-hidden="true" />

      {/* ─── Content ─── */}
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-6 sm:px-8 lg:px-10">
        {/* ─── Header ─── */}
        <header
          className="animate-fade-in glass-card flex flex-col gap-4 rounded-2xl px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
              ReelIQ Studio
            </p>
            <h1 className="mt-1 text-3xl font-bold text-gradient sm:text-4xl">
              Dashboard
            </h1>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/history"
              className="glass-btn inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white/90 sm:w-auto"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History
            </Link>

            <button
              onClick={handleSignOut}
              className="glass-btn inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-rose-300/90 hover:text-rose-200 sm:w-auto"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </header>

        {/* ─── Analytics cards ─── */}
        <div className="grid animate-fade-in animate-fade-in-delay-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Uploads</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">
              {analyticsLoading ? "…" : analytics.totalUploads}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Favorite Niche</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">
              {analyticsLoading ? "…" : analytics.favoriteNiche}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Songs Recommended</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">
              {analyticsLoading ? "…" : analytics.totalRecommendedSongs}
            </p>
          </div>
        </div>

        {/* ─── Main grid ─── */}
        <section className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* ─── Upload card ─── */}
          <div className="animate-fade-in animate-fade-in-delay-2 glass-card rounded-2xl p-6 sm:p-7">
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Upload Reel
                </h2>
                <p className="mt-1 text-sm text-white/40">
                  Choose a niche and upload a video to get matching audio recommendations.
                </p>
              </div>

              {/* Niche selector */}
              <div>
                <label className="mb-3 block text-sm font-semibold text-white/70">
                  Select Niche
                </label>

                <div className="grid grid-cols-3 gap-2.5">
                  {niches.map((niche) => (
                    <button
                      key={niche}
                      type="button"
                      onClick={() => setSelectedNiche(niche)}
                      className={`rounded-xl px-3 py-2.5 text-sm font-semibold capitalize transition-all duration-300 ${
                        selectedNiche === niche
                          ? "glass-niche-active text-white"
                          : "glass-niche-inactive text-white/50 hover:text-white/80"
                      }`}
                    >
                      {niche}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload zone */}
              <div className="glass-upload rounded-2xl p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
                      <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white/80">
                        Video file
                      </p>
                      <p className="mt-0.5 text-xs text-white/40">
                        {selectedFileName || "No file selected"}
                      </p>
                    </div>
                  </div>

                  <label className="glass-btn inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white/90 transition-all">
                    {uploading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Uploading…
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Choose Video
                      </>
                    )}
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleUpload}
                      disabled={uploading}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>

              {uploading && (
                <div className="animate-fade-in flex items-center gap-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-3 text-sm font-medium text-indigo-300 backdrop-blur-sm">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
                  Uploading video and finding recommendations…
                </div>
              )}
            </div>
          </div>

          {/* ─── Video preview ─── */}
          <aside className="animate-fade-in animate-fade-in-delay-2 glass-card rounded-2xl p-6 sm:p-7">
            <h2 className="text-xl font-semibold text-white">Reel Preview</h2>

            <div className="glass-video mt-4 flex aspect-[9/16] items-center justify-center">
              {videoUrl ? (
                <video
                  src={videoUrl}
                  controls
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 px-6 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
                    <svg className="h-7 w-7 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  <p className="text-sm text-white/30">
                    Your uploaded reel will appear here.
                  </p>
                </div>
              )}
            </div>
          </aside>
        </section>

        {/* ─── Recommended songs ─── */}
        <section className="animate-fade-in animate-fade-in-delay-3 glass-card rounded-2xl p-6 sm:p-7">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Recommended Songs
              </h2>
              <p className="mt-1 text-sm text-white/40">
                {songs.length > 0
                  ? `${songs.length} tracks matched with ${selectedNiche}.`
                  : "Recommendations will appear after upload."}
              </p>
            </div>

            <span className="w-fit rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3.5 py-1 text-sm font-semibold capitalize text-indigo-300 backdrop-blur-sm">
              {selectedNiche}
            </span>
          </div>

          {songs.length > 0 ? (
            <div className="mt-5 grid gap-3">
              {songs.map((song, index) => (
                <article
                  key={`${song.audio_name}-${index}`}
                  className="glass-song rounded-xl p-4"
                  style={{ animationDelay: `${0.4 + index * 0.08}s` }}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-sm font-bold text-white/60 backdrop-blur-sm">
                        {index + 1}
                      </div>

                      <div>
                        <h3 className="font-semibold text-white">{song.audio_name}</h3>
                        <p className="mt-0.5 text-sm text-white/40">
                          {song.artist_name || "Unknown artist"}
                        </p>
                      </div>
                    </div>

                    {song.trend_score && (
                      <span className="w-fit rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-300 backdrop-blur-sm">
                        Trend {song.trend_score}
                      </span>
                    )}
                  </div>

                  {song.reason && (
                    <p className="mt-3 text-sm leading-6 text-white/50">
                      {song.reason}
                    </p>
                  )}

                  {song.spotify_url && (
                    <a
                      href={song.spotify_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass-btn mt-3 inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold text-cyan-300/80"
                    >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.66.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                      </svg>
                      Open on Spotify
                    </a>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="glass-upload mt-5 rounded-xl px-5 py-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
                  <svg className="h-6 w-6 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                  </svg>
                </div>
                <p className="text-sm text-white/30">
                  Upload a reel to generate your first recommendation list.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}