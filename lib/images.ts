import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const IS_NETLIFY = Boolean(
  process.env.LAMBDA_TASK_ROOT || process.env.NETLIFY_DEV || process.env.NETLIFY
);
const IMAGE_STORE_NAME = "worldseed-images";

async function getImageStore() {
  const { getStore } = await import("@netlify/blobs");
  return getStore(IMAGE_STORE_NAME);
}

/**
 * Saves an uploaded image and returns a URL path the browser can load it
 * from. On Netlify this goes through Blobs (served via /api/image/[key]
 * since the filesystem isn't writable/persistent in serverless functions).
 * Locally it's written straight to public/uploads.
 */
export async function saveImage(file: File): Promise<string> {
  if (!file.size) throw new Error("Empty file");

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const key = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (IS_NETLIFY) {
    const store = await getImageStore();
    await store.set(key, new Blob([buffer]), {
      metadata: { contentType: file.type || "image/jpeg" },
    });
    return `/api/image/${key}`;
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  fs.writeFileSync(path.join(uploadDir, key), buffer);
  return `/uploads/${key}`;
}

export async function getImageStoreForRoute() {
  return getImageStore();
}
