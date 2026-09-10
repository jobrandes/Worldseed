"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function SeedForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [seedPrompt, setSeedPrompt] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files).slice(0, 3);
    setImages(arr);
    setPreviews(arr.map((f) => URL.createObjectURL(f)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !seedPrompt.trim()) {
      setError("A world name and a seed description are both required.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("seedPrompt", seedPrompt.trim());
      images.forEach((img) => formData.append("images", img));

      const res = await fetch("/api/seed", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }

      router.push("/world");
      router.refresh();
    } catch (err) {
      setError("Could not reach the world. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-ink-700 bg-ink-900/60 p-5 sm:p-8 shadow-2xl shadow-black/40"
    >
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-mist-300 mb-2">
          World name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Halloway"
          maxLength={60}
          className="w-full rounded-lg border border-ink-600 bg-ink-800 px-4 py-3 text-mist-100 placeholder:text-ink-500 focus:border-ember-500 focus:outline-none focus:ring-1 focus:ring-ember-500 text-base"
        />
      </div>

      <div>
        <label htmlFor="seedPrompt" className="block text-sm font-medium text-mist-300 mb-2">
          Seed description
        </label>
        <textarea
          id="seedPrompt"
          value={seedPrompt}
          onChange={(e) => setSeedPrompt(e.target.value)}
          placeholder="Describe the world you want to grow. A place, a feeling, an image — a sentence or two is plenty."
          rows={5}
          maxLength={600}
          className="w-full resize-none rounded-lg border border-ink-600 bg-ink-800 px-4 py-3 text-mist-100 placeholder:text-ink-500 focus:border-ember-500 focus:outline-none focus:ring-1 focus:ring-ember-500 text-base"
        />
        <p className="mt-1 text-xs text-ink-500 text-right">{seedPrompt.length}/600</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-mist-300 mb-2">
          Reference images (optional, up to 3)
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="block w-full text-sm text-mist-400 file:mr-4 file:rounded-lg file:border-0 file:bg-ink-700 file:px-4 file:py-2 file:text-mist-200 file:text-sm hover:file:bg-ink-600 file:cursor-pointer cursor-pointer"
        />
        {previews.length > 0 && (
          <div className="mt-3 flex gap-3 flex-wrap">
            {previews.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                alt="preview"
                className="h-20 w-20 sm:h-24 sm:w-24 rounded-lg object-cover border border-ink-600"
              />
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full sm:w-auto rounded-lg bg-ember-500 px-6 py-3 text-ink-950 font-medium tracking-wide hover:bg-ember-400 active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Planting…" : "Plant the seed"}
      </button>
    </form>
  );
}
