import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("wu-auth")?.value;
  const validToken = process.env.AUTH_TOKEN ?? "wu-session-ok";
  return NextResponse.json({ loggedIn: token === validToken });
}
