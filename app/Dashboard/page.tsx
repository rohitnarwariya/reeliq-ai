"use client";

import { useEffect, useState } from "react";
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
  song_name?: string | null;
  songs?: string[] | null;
};

type DashboardAnalytics = {
  totalUploads: number;
  favoriteNiche: string;
  totalRecommendedSongs: number;
};

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
          .select("song_name, songs")
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
      ).reduce((total, recommendation) => {
        if (recommendation.songs && recommendation.songs.length > 0) {
          return total + recommendation.songs.length;
        }

        return recommendation.song_name ? total + 1 : total;
      }, 0);

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
        .select("song_name, songs")
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
    ).reduce((total, recommendation) => {
      if (recommendation.songs && recommendation.songs.length > 0) {
        return total + recommendation.songs.length;
      }

      return recommendation.song_name ? total + 1 : total;
    }, 0);

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
        try {
          for (const song of filteredSongs) {
            const {
              data: existingRecommendation,
              error: existingRecommendationError,
            } = await supabase
              .from("recommendation_history")
              .select("*")
              .eq("user_id", user.id)
              .eq("reel_url", uploadedVideoUrl)
              .eq("song_name", song.audio_name)
              .maybeSingle();

            if (existingRecommendationError) {
              throw existingRecommendationError;
            }

            if (existingRecommendation) {
              console.log(
                "Recommendation history already exists:",
                existingRecommendation
              );
              continue;
            }

            const { data: recommendationData, error: recommendationError } =
              await supabase
                .from("recommendation_history")
                .insert([
                  {
                    user_id: user.id,
                    reel_url: uploadedVideoUrl,
                    song_name: song.audio_name,
                    spotify_url: song.spotify_url,
                    niche: uploadNiche,
                  },
                ])
                .select();

            if (recommendationError) {
              throw recommendationError;
            }

            console.log(
              "Recommendation history inserted successfully:",
              recommendationData
            );
          }
        } catch (recommendationInsertError) {
          console.error(
            "Error inserting recommendation history:",
            recommendationInsertError
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

  return (
    <main className="min-h-screen bg-[#f6f7fb] text-slate-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">
              ReelIQ Studio
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">
              Dashboard
            </h1>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/history"
              className="inline-flex w-full justify-center rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 sm:w-auto"
            >
              History
            </Link>

            <button
              onClick={handleSignOut}
              className="w-full rounded-md border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-600 shadow-sm transition hover:border-rose-300 hover:bg-rose-50 sm:w-auto"
            >
              Sign Out
            </button>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">
                  Upload reel
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Choose a niche and upload a video to get matching audio recommendations.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Select Niche
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {niches.map((niche) => (
                    <button
                      key={niche}
                      type="button"
                      onClick={() => setSelectedNiche(niche)}
                      className={`rounded-md border px-3 py-2 text-sm font-semibold capitalize transition ${
                        selectedNiche === niche
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {niche}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Video file
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {selectedFileName || "No file selected"}
                    </p>
                  </div>

                  <label className="inline-flex cursor-pointer items-center justify-center rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
                    {uploading ? "Uploading..." : "Choose Video"}
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
                <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                  Uploading video and finding recommendations...
                </div>
              )}
            </div>
          </div>

          <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-semibold text-slate-950">
              Reel preview
            </h2>

            <div className="mt-4 flex aspect-[9/16] items-center justify-center overflow-hidden rounded-lg bg-slate-100">
              {videoUrl ? (
                <video
                  src={videoUrl}
                  controls
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="px-6 text-center text-sm text-slate-500">
                  Your uploaded reel will appear here.
                </div>
              )}
            </div>
          </aside>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">
                Recommended songs
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {songs.length > 0
                  ? `${songs.length} tracks matched with ${selectedNiche}.`
                  : "Recommendations will appear after upload."}
              </p>
            </div>

            <span className="rounded-full bg-cyan-50 px-3 py-1 text-sm font-semibold capitalize text-cyan-700">
              {selectedNiche}
            </span>
          </div>

          {songs.length > 0 ? (
            <div className="mt-5 grid gap-3">
              {songs.map((song, index) => (
                <article
                  key={`${song.audio_name}-${index}`}
                  className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-emerald-200 hover:shadow-sm"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-950 text-sm font-bold text-white">
                        {index + 1}
                      </div>

                      <div>
                        <h3 className="font-semibold text-slate-950">
                          {song.audio_name}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {song.artist_name || "Unknown artist"}
                        </p>
                      </div>
                    </div>

                    {song.trend_score && (
                      <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                        Trend {song.trend_score}
                      </span>
                    )}
                  </div>

                  {song.reason && (
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {song.reason}
                    </p>
                  )}

                  {song.spotify_url && (
                    <a
                      href={song.spotify_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex rounded-md border border-cyan-200 px-3 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50"
                    >
                      Open on Spotify
                    </a>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
              Upload a reel to generate your first recommendation list.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
