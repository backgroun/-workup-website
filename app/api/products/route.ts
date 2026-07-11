import { NextResponse } from "next/server";
import { getPublicProducts } from "@/lib/products-server";

export async function GET() {
  const products = await getPublicProducts();
  return NextResponse.json(products);
}
