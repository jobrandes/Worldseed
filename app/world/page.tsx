import { redirect } from "next/navigation";
import { getWorld } from "@/lib/store";
import WorldView from "@/components/WorldView";

// Always read the current world state fresh — never statically cached.
export const dynamic = "force-dynamic";

export default async function WorldPage() {
  const world = await getWorld();
  if (!world) {
    redirect("/seed");
  }
  return <WorldView initialWorld={world} />;
}
