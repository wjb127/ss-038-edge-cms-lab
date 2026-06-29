import { NextResponse } from "next/server";
import { postsPaged } from "@/lib/cms";

// GET: 발행된 페이지 목록(페이지네이션). ?page=1&per_page=10
export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const perPage = Math.min(100, Math.max(1, Number(url.searchParams.get("per_page")) || 10));
  const result = await postsPaged({ type: "page", status: "published", page, perPage });
  return NextResponse.json(result.items, {
    headers: {
      "x-wp-total": String(result.total),
      "x-wp-totalpages": String(result.totalPages)
    }
  });
}
