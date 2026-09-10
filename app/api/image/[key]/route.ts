import { NextRequest, NextResponse } from "next/server";
import { getImageStoreForRoute } from "@/lib/images";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  context: { params: { key: string } } | { params: Promise<{ key: string }> }
) {
  const params = await context.params;
  const store = await getImageStoreForRoute();
  const result = await store.getWithMetadata(params.key, { type: "arrayBuffer" });

  if (!result) {
    return new NextResponse("Not found", { status: 404 });
  }

  const contentType = (result.metadata?.contentType as string) || "image/jpeg";

  return new NextResponse(result.data as ArrayBuffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
