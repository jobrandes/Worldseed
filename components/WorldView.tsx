"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WorldState } from "@/lib/types";

function timeSince(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default function WorldView({ initialWorld }: { initialWorld: WorldState }) {
  const router = useRouter();
  const [world, setWorld] = useState<WorldState>(initialWorld);
  const [evolving, setEvolving] = useState(false);
  const [changeSummary, setChangeSummary] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [influencePhoto, setInfluencePhoto] = useState<File | null>(null);
  const [submittingInfluence, setSubmittingInfluence] = useState(false);
  const [reportKind, setReportKind] = useState<"letter" | "scene" | null>(null);
  const [reportText, setReportText] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [autoEvolved, setAutoEvolved] = useState(false);

  const hoursSinceEvolve =
    (Date.now() - new Date(world.lastEvolvedAt).getTime()) / (1000 * 60 * 60);

  async function evolve() {
    setEvolving(true);
    setChangeSummary(null);
    try {
      const res = await fetch("/api/evolve", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setWorld(data.world);
        setChangeSummary(data.changeSummary);
      }
    } finally {
      setEvolving(false);
    }
  }

  // Auto-evolve once per page load if a meaningful amount of time has passed.
  useEffect(() => {
    if (!autoEvolved && hoursSinceEvolve > 1) {
      setAutoEvolved(true);
      evolve();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitInfluence(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim() && !influencePhoto) return;
    setSubmittingInfluence(true);
    try {
      const formData = new FormData();
      if (note.trim()) formData.append("note", note.trim());
      if (influencePhoto) formData.append("photo", influencePhoto);
      const res = await fetch("/api/influence", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        setWorld(data.world);
        setNote("");
        setInfluencePhoto(null);
      }
    } finally {
      setSubmittingInfluence(false);
    }
  }

  async function generateReport(kind: "letter" | "scene") {
    setReportKind(kind);
    setReportLoading(true);
    setReportText(null);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      const data = await res.json();
      if (res.ok) {
        setReportText(kind === "letter" ? data.letter : data.scenePrompt);
      }
    } finally {
      setReportLoading(false);
    }
  }

  async function resetWorld() {
    if (!confirm("This will erase the current world so you can plant a new seed. Continue?")) return;
    setResetting(true);
    await fetch("/api/seed", { method: "DELETE" });
    router.push("/seed");
    router.refresh();
  }

  const pendingInfluences = world.influences.filter((i) => !i.consumed);

  return (
    <main className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-mist-100">{world.name}</h1>
          <p className="text-xs sm:text-sm text-ink-500 mt-1">
            Last visited {timeSince(world.lastEvolvedAt)}
          </p>
        </div>
        <button
          onClick={resetWorld}
          disabled={resetting}
          className="text-xs text-ink-500 hover:text-mist-300 underline underline-offset-2 disabled:opacity-50"
        >
          {resetting ? "Resetting…" : "Plant a different world"}
        </button>
      </div>

      {/* Change summary banner */}
      {changeSummary && (
        <div className="rounded-xl border border-ember-500/30 bg-ember-500/5 px-4 py-3 text-sm text-ember-400 animate-breathe">
          {changeSummary}
        </div>
      )}

      {/* Summary card */}
      <section className="rounded-2xl border border-ink-700 bg-ink-900/60 p-5 sm:p-7 shadow-xl shadow-black/30">
        <p className="text-mist-200 leading-relaxed text-sm sm:text-base">{world.summary}</p>
        <p className="mt-4 text-xs sm:text-sm italic text-mist-400">{world.atmosphere}</p>
      </section>

      {/* Grid: locations + inhabitants (stacked on mobile, side-by-side on desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <section className="rounded-2xl border border-ink-700 bg-ink-900/40 p-5">
          <h2 className="font-serif text-lg text-mist-200 mb-3">Locations</h2>
          <ul className="space-y-3">
            {world.locations.map((loc) => (
              <li key={loc.id}>
                <p className="text-sm font-medium text-mist-100">{loc.name}</p>
                <p className="text-xs sm:text-sm text-mist-400">{loc.description}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-ink-700 bg-ink-900/40 p-5">
          <h2 className="font-serif text-lg text-mist-200 mb-3">Inhabitants</h2>
          <ul className="space-y-3">
            {world.inhabitants.map((inh) => (
              <li key={inh.id}>
                <p className="text-sm font-medium text-mist-100">{inh.name}</p>
                <p className="text-xs sm:text-sm text-mist-400">{inh.description}</p>
                {inh.status && (
                  <p className="text-xs text-ember-400/80 mt-0.5">{inh.status}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Recent events */}
      <section className="rounded-2xl border border-ink-700 bg-ink-900/40 p-5">
        <h2 className="font-serif text-lg text-mist-200 mb-3">Recent events</h2>
        <ul className="space-y-2">
          {world.recentEvents.map((ev, i) => (
            <li key={i} className="text-sm text-mist-400 flex gap-2">
              <span className="text-ink-600">•</span>
              <span>{ev}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Evolve button */}
      <div className="flex justify-center">
        <button
          onClick={evolve}
          disabled={evolving}
          className="rounded-lg bg-ink-700 hover:bg-ink-600 px-6 py-3 text-mist-100 font-medium tracking-wide transition disabled:opacity-50 w-full sm:w-auto"
        >
          {evolving ? "The world is shifting…" : "Advance the world"}
        </button>
      </div>

      {/* Influence form */}
      <section className="rounded-2xl border border-ink-700 bg-ink-900/60 p-5 sm:p-7">
        <h2 className="font-serif text-lg text-mist-200 mb-1">Send something real</h2>
        <p className="text-xs text-ink-500 mb-4">
          Share a note or photo from your day. It will gently shape what happens next.
        </p>
        {pendingInfluences.length > 0 && (
          <p className="text-xs text-ember-400 mb-3">
            {pendingInfluences.length} input{pendingInfluences.length > 1 ? "s" : ""} waiting to shape the next evolution.
          </p>
        )}
        <form onSubmit={submitInfluence} className="space-y-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="I had a quiet walk today…"
            rows={3}
            maxLength={400}
            className="w-full resize-none rounded-lg border border-ink-600 bg-ink-800 px-4 py-3 text-mist-100 placeholder:text-ink-500 focus:border-ember-500 focus:outline-none focus:ring-1 focus:ring-ember-500 text-sm sm:text-base"
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setInfluencePhoto(e.target.files?.[0] || null)}
            className="block w-full text-xs text-mist-400 file:mr-3 file:rounded-lg file:border-0 file:bg-ink-700 file:px-3 file:py-1.5 file:text-mist-200 file:text-xs hover:file:bg-ink-600 file:cursor-pointer cursor-pointer"
          />
          <button
            type="submit"
            disabled={submittingInfluence || (!note.trim() && !influencePhoto)}
            className="w-full sm:w-auto rounded-lg bg-ember-500 px-5 py-2.5 text-ink-950 font-medium hover:bg-ember-400 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submittingInfluence ? "Sending…" : "Send"}
          </button>
        </form>
      </section>

      {/* Generate */}
      <section className="rounded-2xl border border-ink-700 bg-ink-900/40 p-5 sm:p-7">
        <h2 className="font-serif text-lg text-mist-200 mb-4">Hear from the world</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => generateReport("letter")}
            disabled={reportLoading}
            className="flex-1 rounded-lg border border-ink-600 bg-ink-800 px-4 py-2.5 text-sm text-mist-200 hover:bg-ink-700 transition disabled:opacity-50"
          >
            {reportLoading && reportKind === "letter" ? "Writing…" : "Letter from the world"}
          </button>
          <button
            onClick={() => generateReport("scene")}
            disabled={reportLoading}
            className="flex-1 rounded-lg border border-ink-600 bg-ink-800 px-4 py-2.5 text-sm text-mist-200 hover:bg-ink-700 transition disabled:opacity-50"
          >
            {reportLoading && reportKind === "scene" ? "Imagining…" : "Describe the scene"}
          </button>
        </div>
        {reportText && (
          <div className="mt-4 rounded-lg border border-ink-700 bg-ink-950/60 p-4 text-sm text-mist-300 whitespace-pre-wrap leading-relaxed">
            {reportText}
          </div>
        )}
      </section>
    </main>
  );
}
