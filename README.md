# Worldseed

Plant a seed. Return to find it has grown.

A private, single-user web app where you describe a small world, and it
evolves quietly over real time — shaped by how much time has passed and
by whatever real-life notes or photos you feed it.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- File-based JSON storage (`data/world.json`) — no database setup required
- Optional Claude-powered evolution (falls back to a built-in deterministic
  generator if no API key is set, so the app works out of the box)

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 — it will send you straight to the seed-planting
form the first time, and to your world every time after that.

### Optional: richer, AI-generated evolution

Without any setup, Worldseed generates world text with a built-in
deterministic engine — it's coherent and works fine, but simple. To let
Claude write the world's summaries, events, and letters instead:

1. Copy `.env.example` to `.env.local`
2. Add your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
3. Restart `npm run dev`

No key required for anything else to work.

## Deploying to Netlify

Worldseed's storage layer auto-detects where it's running:

- **Locally** (`npm run dev`) — world state goes in `data/world.json`,
  images go in `public/uploads/`.
- **On Netlify** — world state and images go in [Netlify Blobs](https://docs.netlify.com/blobs/overview/)
  instead, since serverless functions don't have a persistent filesystem.
  Nothing to configure — Blobs provision automatically the first time the
  app writes to them.

A site named `worldseed-mvp` has already been created for you on Netlify.
To deploy this code to it, run this from inside the project folder:

```bash
npx -y @netlify/mcp@latest --site-id b10296eb-128a-4b1d-bb61-2011dc2471a4 --proxy-path "<ask Claude for a fresh link if this one has expired>"
```

That link is short-lived — if it's stopped working, just ask me and I'll
generate a new one. After the first deploy, you can also deploy straight
from the Netlify dashboard or `netlify deploy` once the site is linked
locally with `netlify link`.

**Known quirk (local only, doesn't affect Netlify or `npm run dev`):**
if you build and run this with `npm run build && npm run start` (production
mode) locally, Next.js caches the `public/` folder listing at startup, so
images uploaded *after* the server starts won't be served until you
restart it. `npm run dev` doesn't have this issue, and neither does
Netlify (images go through Blobs there, not the filesystem).

## How it works

- **Plant a seed** (`/seed`) — name, short description, up to 3 optional
  reference images. This generates the world's initial state.
- **Check in** (`/world`) — shows the current summary, atmosphere,
  locations, inhabitants, and recent events, plus how long it's been since
  your last visit.
- **Advance the world** — the world auto-evolves once per visit if more
  than an hour has passed since you last checked in, and you can also
  trigger it manually any time.
- **Send something real** — a short note and/or photo from your day. It's
  queued as an "influence" and gently shapes the *next* evolution (rather
  than instantly rewriting the world).
- **Hear from the world** — generates a short first-person "letter from
  the world," or a one-line visual scene description you could later feed
  to an image model.
- **Plant a different world** — clears the current world so you can start
  fresh (single-user MVP, so this is a hard reset, not multi-world support).

## Data model

See `lib/types.ts` for the full `WorldState` shape. In short: a world has
a name/seed, current in-world time, a running summary and atmosphere,
locations, inhabitants (each with a short evolving status), a recent-events
list, a full history log, and a queue of user-submitted "influences."

## Project structure

```
app/
  page.tsx              → redirects to /seed or /world
  seed/page.tsx          → seed-planting page
  world/page.tsx          → main check-in view
  api/
    seed/route.ts         → POST create, DELETE reset
    world/route.ts        → GET current world state
    evolve/route.ts       → POST advance the world
    influence/route.ts    → POST submit a real-life note/photo
    report/route.ts       → POST generate letter or scene prompt
components/
  SeedForm.tsx
  WorldView.tsx
lib/
  types.ts               → WorldState data model
  store.ts                → file-based persistence
  evolution.ts             → seed generation + evolution logic (Claude or fallback)
data/
  world.json              → created at runtime, gitignored
```

## Extending it later

The whole thing is intentionally small and readable so you can grow it:
- Swap `lib/store.ts` for SQLite/Postgres without touching anything else —
  it's the only file that touches persistence.
- `lib/evolution.ts` is the only file that talks to Claude — the JSON
  contract in each prompt is easy to extend with new fields.
- Multi-world support would mean keying `data/*.json` by world id instead
  of a single file, plus a world-picker page.

## A note on quality

- Pinned to Next.js **14.2.35** (not 14.2.15) — the December 2025 Next.js
  security advisories affect earlier 14.x releases.
- Uses Node's built-in `crypto.randomUUID()` instead of the `uuid` package
  to avoid an open dependency vulnerability and keep the dependency list
  minimal.
- Type-checks clean (`npx tsc --noEmit`) and builds clean (`npm run build`).
- One low-severity, build-time-only advisory remains in a dependency
  bundled *inside* Next.js itself (a `postcss` source-map path issue) —
  not fixable without moving to Next.js 15/16, and not exploitable in a
  local single-user runtime.
