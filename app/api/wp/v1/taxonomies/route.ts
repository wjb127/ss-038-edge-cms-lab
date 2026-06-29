import { NextResponse } from "next/server";
import { taxonomies } from "@/lib/cms";

export async function GET() {
  return NextResponse.json(await taxonomies());
}
