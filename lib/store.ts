import fs from "fs";
import path from "path";
import { WorldState } from "./types";

// process.env.NETLIFY is only set at BUILD time, not at runtime inside the
// deployed function — so we can't rely on it here. LAMBDA_TASK_ROOT (and
// NETLIFY_DEV, when running `netlify dev` locally) are actually present
// when the code executes, which is what we need to check at request time.
const IS_NETLIFY = Boolean(
  process.env.LAMBDA_TASK_ROOT || process.env.NETLIFY_DEV || process.env.NETLIFY
);

const DATA_DIR = path.join(process.cwd(), "data");
const WORLD_FILE = path.join(DATA_DIR, "world.json");
const STORE_NAME = "worldseed";
const BLOB_KEY = "world.json";

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

async function getBlobStore() {
  const { getStore } = await import("@netlify/blobs");
  // Strong consistency: without this, a read immediately after a write can
  // see a stale (empty) result, since Blobs defaults to eventual consistency.
  // That's exactly what caused "plant a seed → bounced back to /seed" — the
  // write succeeded, but the redirect check read a stale view a moment later.
  return getStore({ name: STORE_NAME, consistency: "strong" });
}

export async function getWorld(): Promise<WorldState | null> {
  if (IS_NETLIFY) {
    const store = await getBlobStore();
    const data = await store.get(BLOB_KEY, { type: "json" });
    return (data as WorldState) ?? null;
  }

  ensureDataDir();
  if (!fs.existsSync(WORLD_FILE)) return null;
  const raw = fs.readFileSync(WORLD_FILE, "utf-8");
  if (!raw.trim()) return null;
  try {
    return JSON.parse(raw) as WorldState;
  } catch {
    return null;
  }
}

export async function saveWorld(world: WorldState): Promise<void> {
  if (IS_NETLIFY) {
    const store = await getBlobStore();
    await store.setJSON(BLOB_KEY, world);
    return;
  }

  ensureDataDir();
  fs.writeFileSync(WORLD_FILE, JSON.stringify(world, null, 2), "utf-8");
}

export async function worldExists(): Promise<boolean> {
  return (await getWorld()) !== null;
}

// Single-user MVP: allow resetting to plant a new seed.
export async function deleteWorld(): Promise<void> {
  if (IS_NETLIFY) {
    const store = await getBlobStore();
    await store.delete(BLOB_KEY);
    return;
  }

  ensureDataDir();
  if (fs.existsSync(WORLD_FILE)) {
    fs.unlinkSync(WORLD_FILE);
  }
}
