import { NextResponse } from "next/server";
import { getPublicStores } from "@/lib/publicStores";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const region = searchParams.get("region") ?? undefined;
  const stores = await getPublicStores(region);
  return NextResponse.json(stores);
}
