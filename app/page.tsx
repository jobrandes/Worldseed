import { redirect } from "next/navigation";
import { worldExists } from "@/lib/store";

// This route checks live server-side state (does a world file exist?) on
// every request, so it must never be statically cached at build time.
export const dynamic = "force-dynamic";

export default async function Home() {
  if (await worldExists()) {
    redirect("/world");
  } else {
    redirect("/seed");
  }
}
