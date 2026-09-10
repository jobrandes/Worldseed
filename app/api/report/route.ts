import { NextRequest, NextResponse } from "next/server";
import { getWorld } from "@/lib/store";
import { generateLetter, generateScenePrompt } from "@/lib/evolution";

export async function POST(req: NextRequest) {
  const world = await getWorld();
  if (!world) {
    return NextResponse.json({ error: "No world exists yet." }, { status: 404 });
  }

  const { kind } = await req.json();

  if (kind === "letter") {
    const letter = await generateLetter(world);
    return NextResponse.json({ letter });
  }
  if (kind === "scene") {
    const scenePrompt = await generateScenePrompt(world);
    return NextResponse.json({ scenePrompt });
  }
  return NextResponse.json({ error: "Unknown report kind." }, { status: 400 });
}
