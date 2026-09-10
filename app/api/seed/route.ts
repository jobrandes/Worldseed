import { NextRequest, NextResponse } from "next/server";
import { saveWorld, worldExists, deleteWorld } from "@/lib/store";
import { generateSeedWorld } from "@/lib/evolution";
import { saveImage } from "@/lib/images";

export async function POST(req: NextRequest) {
  if (await worldExists()) {
    return NextResponse.json(
      { error: "A world already exists. Reset it first if you want to plant a new one." },
      { status: 409 }
    );
  }

  const formData = await req.formData();
  const name = String(formData.get("name") || "").trim();
  const seedPrompt = String(formData.get("seedPrompt") || "").trim();

  if (!name || !seedPrompt) {
    return NextResponse.json({ error: "Name and seed description are required." }, { status: 400 });
  }

  const imagePaths: string[] = [];
  const files = formData.getAll("images").filter((f): f is File => f instanceof File);
  for (const file of files.slice(0, 3)) {
    if (!file.size) continue;
    imagePaths.push(await saveImage(file));
  }

  const world = await generateSeedWorld(name, seedPrompt, imagePaths);
  await saveWorld(world);

  return NextResponse.json({ world });
}

export async function DELETE() {
  await deleteWorld();
  return NextResponse.json({ ok: true });
}
