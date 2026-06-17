"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

type RecommendationHistory = {
  id: string;
  user_id?: string | null;
  reel_url?: string | null;
  niche?: string | null;
  songs?: string[] | null;
  created_at?: string | null;
};

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<RecommendationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          router.push("/loginpage");
          return;
        }

        const { data, error } = await supabase
          .from("recommendation_history")
          .select("*");

        if (error) {
          throw error;
        }

        const rows = ((data || []) as RecommendationHistory[])
          .filter((item) => !item.user_id || item.user_id === user.id)
          .sort((first, second) => {
            const firstDate = first.created_at
              ? new Date(first.created_at).getTime()
              : 0;
            const secondDate = second.created_at
              ? new Date(second.created_at).getTime()
              : 0;

            return secondDate - firstDate;
          });

        setHistory(rows);
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

    setHistory((prev) =>
      prev.filter((item) => item.reel_url !== reelUrl)
    );

    alert("Reel deleted successfully");
  };

  const getSongNames = (item: RecommendationHistory) => {
    return item.songs ?? [];
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
              Upload History
            </h1>
          </div>

          <Link
            href="/Dashboard"
            className="inline-flex w-full justify-center rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 sm:w-auto"
          >
            Back to Dashboard
          </Link>
        </header>

        {loading ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-800">
            Loading your previous uploads...
          </div>
        ) : errorMessage ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
            {errorMessage}
          </div>
        ) : history.length > 0 ? (
          <section className="grid gap-5 md:grid-cols-2">
            {history.map((item) => {
              const songNames = getSongNames(item);

              return (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
                >
                  <div className="flex aspect-video items-center justify-center bg-slate-100">
                    {item.reel_url ? (
                      <video
                        src={item.reel_url}
                        controls
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <p className="text-sm text-slate-500">
                        No reel preview available.
                      </p>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="text-lg font-semibold capitalize text-slate-950">
                          {item.niche || "Uploaded reel"}
                        </h2>
                        {item.created_at && (
                          <p className="mt-1 text-sm text-slate-500">
                            {new Date(item.created_at).toLocaleString()}
                          </p>
                        )}
                      </div>

                      <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                        {songNames.length} songs
                      </span>
                    </div>

                    <button
                      onClick={() => item.reel_url && handleDelete(item.reel_url)}
                      className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                    >
                      Delete Reel
                    </button>

                    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-700">
                        Recommended songs
                      </p>

                      {songNames.length > 0 ? (
                        <div className="mt-3 grid gap-2">
                          {songNames.map((songName, index) => (
                            <div
                              key={`${item.id}-${songName}-${index}`}
                              className="rounded-md border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-700 shadow-sm"
                            >
                              {songName}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 rounded-md border border-dashed border-slate-300 bg-white px-3 py-3 text-sm text-slate-500">
                          No recommendations found
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-12 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">
              No uploads yet
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Upload a reel from your dashboard to see it here.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
