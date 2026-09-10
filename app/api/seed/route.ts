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
  try {
    for (const file of files.slice(0, 3)) {
      if (!file.size) continue;
      imagePaths.push(await saveImage(file));
    }

    const world = await generateSeedWorld(name, seedPrompt, imagePaths);
    await saveWorld(world);

    return NextResponse.json({ world });
  } catch (err) {
    // Surface real failures as JSON instead of letting them fall through to
    // a generic error page the client can't parse (that showed up as
    // "nothing happened" in the UI with no visible error).
    console.error("Seed creation failed:", err);
    return NextResponse.json(
      { error: "Something went wrong while planting the seed. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  await deleteWorld();
  return NextResponse.json({ ok: true });
}
