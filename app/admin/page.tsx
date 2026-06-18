"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

type Song = {
  id: string;
  song_name: string;
  artist_name: string;
  spotify_url: string;
  bpm: number;
  energy: number;
  mood: string;
  trend_score: number;
  created_at?: string | null;
};

type SongForm = {
  song_name: string;
  artist_name: string;
  spotify_url: string;
  bpm: number | "";
  energy: number | "";
  mood: string;
  trend_score: number | "";
};

const EMPTY_FORM: SongForm = {
  song_name: "",
  artist_name: "",
  spotify_url: "",
  bpm: "",
  energy: "",
  mood: "Calm",
  trend_score: "",
};

const MOOD_OPTIONS = [
  "Calm",
  "Energetic",
  "Aggressive",
  "Cinematic",
  "Emotional",
];

function safeNum(value: number | string | null | undefined, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export default function AdminPage() {
  const router = useRouter();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SongForm>(EMPTY_FORM);
  const [isAdding, setIsAdding] = useState(false);

  const spotlightRef = useRef<HTMLDivElement>(null);
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (spotlightRef.current) {
      spotlightRef.current.style.left = `${e.clientX}px`;
      spotlightRef.current.style.top = `${e.clientY}px`;
    }
  }, []);

  const fetchSongs = async () => {
    setLoading(true);
    setErrorMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      setErrorMessage(userError.message);
      setLoading(false);
      return;
    }

    if (!user) {
      router.push("/loginpage");
      return;
    }

    const { data, error } = await supabase
      .from("trending_songs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
    } else {
      setSongs((data || []) as Song[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchSongs();
  }, [router]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setIsAdding(false);
  };

  const handleAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleEdit = (song: Song) => {
    setIsAdding(false);
    setEditingId(song.id);
    setForm({
      song_name: song.song_name ?? "",
      artist_name: song.artist_name ?? "",
      spotify_url: song.spotify_url ?? "",
      bpm: song.bpm ?? "",
      energy: song.energy ?? "",
      mood: song.mood ?? "Calm",
      trend_score: song.trend_score ?? "",
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this song permanently?")) return;

    const { error } = await supabase
      .from("trending_songs")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setSongs((prev) => prev.filter((s) => s.id !== id));
    if (editingId === id) resetForm();
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMessage("");

    const payload = {
      song_name: form.song_name || null,
      artist_name: form.artist_name || null,
      spotify_url: form.spotify_url || null,
      bpm: safeNum(form.bpm, 0),
      energy: safeNum(form.energy, 0),
      mood: form.mood || "Calm",
      trend_score: safeNum(form.trend_score, 0),
    };

    let error: Error | null = null;

    if (isAdding) {
      const { error: insertError } = await supabase
        .from("trending_songs")
        .insert([payload]);
      error = insertError;
    } else if (editingId) {
      const { error: updateError } = await supabase
        .from("trending_songs")
        .update(payload)
        .eq("id", editingId);
      error = updateError;
    }

    if (error) {
      setErrorMessage(error.message);
      setSaving(false);
      return;
    }

    resetForm();
    setSaving(false);
    await fetchSongs();
  };

  const isFormInvalid =
    !form.song_name.trim() ||
    safeNum(form.trend_score, 0) < 0 ||
    safeNum(form.bpm, 0) < 0 ||
    safeNum(form.energy, 0) < 0 ||
    safeNum(form.energy, 0) > 100;

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
              Admin Dashboard
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

        {/* ─── Actions ─── */}
        <div className="animate-fade-in animate-fade-in-delay-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-white/50">
            {loading ? "Loading songs…" : `${songs.length} songs in trending_songs`}
          </p>
          <button
            onClick={handleAdd}
            className="glass-btn inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white/90 sm:w-auto"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add New Song
          </button>
        </div>

        {/* ─── Add / Edit Form ─── */}
        {(isAdding || editingId) && (
          <section className="animate-fade-in glass-card rounded-2xl p-6 sm:p-7">
            <h2 className="text-lg font-semibold text-white">
              {isAdding ? "Add New Song" : "Edit Song"}
            </h2>
            <p className="mt-1 text-sm text-white/40">
              Fill in the fields below. All values are required unless noted.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-white/50">
                  Song Name *
                </label>
                <input
                  type="text"
                  value={form.song_name}
                  onChange={(e) => setForm({ ...form, song_name: e.target.value })}
                  className="glass-input w-full rounded-xl border border-slate-500/20 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/40 backdrop-blur-sm transition focus:border-indigo-400/60 focus:outline-none"
                  placeholder="Track title"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-white/50">
                  Artist *
                </label>
                <input
                  type="text"
                  value={form.artist_name}
                  onChange={(e) => setForm({ ...form, artist_name: e.target.value })}
                  className="glass-input w-full rounded-xl border border-slate-500/20 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/40 backdrop-blur-sm transition focus:border-indigo-400/60 focus:outline-none"
                  placeholder="Artist name"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-white/50">
                  Spotify URL
                </label>
                <input
                  type="url"
                  value={form.spotify_url}
                  onChange={(e) => setForm({ ...form, spotify_url: e.target.value })}
                  className="glass-input w-full rounded-xl border border-slate-500/20 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/40 backdrop-blur-sm transition focus:border-indigo-400/60 focus:outline-none"
                  placeholder="https://open.spotify.com/track/..."
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-white/50">
                  Mood
                </label>
                <select
                  value={form.mood}
                  onChange={(e) => setForm({ ...form, mood: e.target.value })}
                  className="glass-input w-full rounded-xl border border-slate-500/20 bg-white/5 px-4 py-2.5 text-sm text-white backdrop-blur-sm transition focus:border-indigo-400/60 focus:outline-none"
                >
                  {MOOD_OPTIONS.map((m) => (
                    <option key={m} value={m} className="bg-slate-900 text-white">
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-white/50">
                  BPM
                </label>
                <input
                  type="number"
                  value={form.bpm}
                  onChange={(e) => setForm({ ...form, bpm: e.target.value === "" ? "" : Number(e.target.value) })}
                  className="glass-input w-full rounded-xl border border-slate-500/20 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/40 backdrop-blur-sm transition focus:border-indigo-400/60 focus:outline-none"
                  placeholder="120"
                  min={0}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-white/50">
                  Energy (0-100)
                </label>
                <input
                  type="number"
                  value={form.energy}
                  onChange={(e) => setForm({ ...form, energy: e.target.value === "" ? "" : Number(e.target.value) })}
                  className="glass-input w-full rounded-xl border border-slate-500/20 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/40 backdrop-blur-sm transition focus:border-indigo-400/60 focus:outline-none"
                  placeholder="75"
                  min={0}
                  max={100}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-white/50">
                  Trend Score
                </label>
                <input
                  type="number"
                  value={form.trend_score}
                  onChange={(e) => setForm({ ...form, trend_score: e.target.value === "" ? "" : Number(e.target.value) })}
                  className="glass-input w-full rounded-xl border border-slate-500/20 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/40 backdrop-blur-sm transition focus:border-indigo-400/60 focus:outline-none"
                  placeholder="85"
                  min={0}
                />
              </div>
            </div>

            {errorMessage && (
              <p className="mt-4 text-sm text-rose-300">{errorMessage}</p>
            )}

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={resetForm}
                className="rounded-xl border border-slate-500/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/70 transition hover:border-indigo-500/30 hover:text-white/90"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || isFormInvalid}
                className="glass-btn rounded-xl px-5 py-2.5 text-sm font-semibold text-white/90 disabled:opacity-40"
              >
                {saving ? "Saving…" : "Save Song"}
              </button>
            </div>
          </section>
        )}

        {/* ─── Songs Table ─── */}
        <section className="animate-fade-in animate-fade-in-delay-2 glass-card overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-500/10 text-white/40">
                  <th className="px-5 py-3 font-semibold">Song Name</th>
                  <th className="px-5 py-3 font-semibold">Artist</th>
                  <th className="px-5 py-3 font-semibold text-center">BPM</th>
                  <th className="px-5 py-3 font-semibold text-center">Energy</th>
                  <th className="px-5 py-3 font-semibold text-center">Mood</th>
                  <th className="px-5 py-3 font-semibold text-center">Trend Score</th>
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-500/10">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-white/40">
                      Loading songs…
                    </td>
                  </tr>
                ) : songs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-white/40">
                      No songs found in trending_songs.
                    </td>
                  </tr>
                ) : (
                  songs.map((song) => (
                    <tr key={song.id} className="transition hover:bg-white/[0.02]">
                      <td className="px-5 py-3 font-medium text-white">
                        {song.song_name || "—"}
                      </td>
                      <td className="px-5 py-3 text-white/60">
                        {song.artist_name || "—"}
                      </td>
                      <td className="px-5 py-3 text-center text-white/70">
                        {safeNum(song.bpm, 0)}
                      </td>
                      <td className="px-5 py-3 text-center text-white/70">
                        {safeNum(song.energy, 0)}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                          {song.mood || "Calm"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center font-semibold text-amber-300">
                        {safeNum(song.trend_score, 0)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(song)}
                            className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300 transition hover:border-indigo-500/40 hover:text-indigo-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(song.id)}
                            className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:border-rose-500/40 hover:text-rose-200"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ─── Empty state shown only when no form and no songs ─── */}
        {!loading && !isAdding && songs.length === 0 && (
          <div className="animate-fade-in glass-card flex flex-col items-center justify-center gap-4 rounded-2xl px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
              <svg className="h-7 w-7 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0v-4.5m17.25 4.5v-4.5m-17.25-10.5v-4.5m17.25 4.5v4.5M3.375 3.75h17.25M3.375 3.75v4.5m0-4.5h17.25m-17.25 0v-4.5m17.25 4.5v4.5" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">No songs in library</h2>
              <p className="mt-1 text-sm text-white/40">
                Add your first trending song to get started.
              </p>
            </div>
            <button
              onClick={handleAdd}
              className="glass-btn inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white/90"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add New Song
            </button>
          </div>
        )}
      </div>
    </div>
  );
}