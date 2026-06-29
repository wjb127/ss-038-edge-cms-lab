import { NextResponse } from "next/server";
import { terms } from "@/lib/cms";

export async function GET() {
  return NextResponse.json(await terms());
}
