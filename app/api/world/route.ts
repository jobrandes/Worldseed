import { NextResponse } from "next/server";
import { getWorld } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const world = await getWorld();
  if (!world) {
    return NextResponse.json({ world: null }, { status: 200 });
  }
  return NextResponse.json({ world });
}
