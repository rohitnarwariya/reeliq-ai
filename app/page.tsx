"use client";

import Link from "next/link";

const steps = [
  {
    title: "Upload a reel",
    text: "Add your short video and choose the content niche you want to target.",
  },
  {
    title: "Read the mood",
    text: "ReelIQ matches your clip with the energy and audience style behind it.",
  },
  {
    title: "Pick a track",
    text: "Get song ideas that fit the reel before you post.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f6f7fb] text-slate-950">
      <section
        className="relative min-h-[82vh] overflow-hidden bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(2, 6, 23, 0.92) 0%, rgba(15, 23, 42, 0.78) 48%, rgba(15, 23, 42, 0.2) 100%), url('https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1800&q=80')",
        }}
      >
        <div className="mx-auto flex min-h-[82vh] w-full max-w-6xl flex-col justify-between px-5 py-6 sm:px-8 lg:px-10">
          <nav className="flex items-center justify-between">
            <Link
              href="/"
              className="text-xl font-bold tracking-wide text-white"
            >
              ReelIQ
            </Link>

            <Link
              href="/loginpage"
              className="rounded-md border border-white/25 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white hover:text-slate-950"
            >
              Login
            </Link>
          </nav>

          <div className="max-w-2xl pb-12 pt-24 text-white sm:pt-28">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300">
              AI song recommendations
            </p>

            <h1 className="mt-5 text-5xl font-bold leading-tight sm:text-6xl">
              ReelIQ
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-200">
              Upload your reels and find songs that match the niche, mood, and
              posting style of your video.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signuppage"
                className="inline-flex justify-center rounded-md bg-emerald-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-300"
              >
                Get Started
              </Link>

              <Link
                href="/loginpage"
                className="inline-flex justify-center rounded-md bg-white/10 px-5 py-3 text-sm font-bold text-white ring-1 ring-white/25 backdrop-blur transition hover:bg-white hover:text-slate-950"
              >
                Open Dashboard
              </Link>
            </div>
          </div>

          <div className="grid gap-3 pb-6 sm:grid-cols-3">
            <div className="rounded-lg border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
              <p className="text-2xl font-bold">3</p>
              <p className="mt-1 text-sm text-slate-200">Supported niches</p>
            </div>

            <div className="rounded-lg border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
              <p className="text-2xl font-bold">Fast</p>
              <p className="mt-1 text-sm text-slate-200">Upload to results flow</p>
            </div>

            <div className="rounded-lg border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
              <p className="text-2xl font-bold">Spotify</p>
              <p className="mt-1 text-sm text-slate-200">Track links when available</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-5 py-12 sm:px-8 md:grid-cols-[0.85fr_1.15fr] lg:px-10">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">
            Workflow
          </p>
          <h2 className="mt-3 text-3xl font-bold text-slate-950">
            From reel upload to usable song ideas
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            ReelIQ keeps the process focused: upload a video, choose the niche,
            and review songs that fit the content before you publish.
          </p>
        </div>

        <div className="grid gap-3">
          {steps.map((step, index) => (
            <article
              key={step.title}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-950 text-sm font-bold text-white">
                  {index + 1}
                </div>

                <div>
                  <h3 className="font-semibold text-slate-950">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {step.text}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
