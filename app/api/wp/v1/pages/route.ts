import { NextResponse } from "next/server";
import { posts } from "@/lib/cms";

export async function GET() {
  return NextResponse.json(await posts("page", "published"));
}
