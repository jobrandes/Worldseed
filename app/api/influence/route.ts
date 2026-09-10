import { NextRequest, NextResponse } from "next/server";
import { randomUUID as uuid } from "crypto";
import { getWorld, saveWorld } from "@/lib/store";
import { saveImage } from "@/lib/images";

export async function POST(req: NextRequest) {
  const world = await getWorld();
  if (!world) {
    return NextResponse.json({ error: "No world exists yet." }, { status: 404 });
  }

  const formData = await req.formData();
  const note = String(formData.get("note") || "").trim();
  const photo = formData.get("photo");

  let imagePath: string | undefined;
  if (photo instanceof File && photo.size) {
    imagePath = await saveImage(photo);
  }

  if (!note && !imagePath) {
    return NextResponse.json({ error: "Provide a note or a photo." }, { status: 400 });
  }

  world.influences.push({
    id: uuid(),
    timestamp: new Date().toISOString(),
    note: note || undefined,
    imagePath,
    consumed: false,
  });

  await saveWorld(world);

  return NextResponse.json({ world });
}
