import { NextResponse } from "next/server";
import { getWorld, saveWorld } from "@/lib/store";
import { evolveWorld } from "@/lib/evolution";

export async function POST() {
  const world = await getWorld();
  if (!world) {
    return NextResponse.json({ error: "No world exists yet." }, { status: 404 });
  }

  const hoursElapsed =
    (Date.now() - new Date(world.lastEvolvedAt).getTime()) / (1000 * 60 * 60);

  const pendingInfluences = world.influences.filter((i) => !i.consumed);

  const { world: updatedWorld, changeSummary } = await evolveWorld(
    world,
    hoursElapsed,
    pendingInfluences
  );

  await saveWorld(updatedWorld);

  return NextResponse.json({ world: updatedWorld, changeSummary, hoursElapsed });
}
