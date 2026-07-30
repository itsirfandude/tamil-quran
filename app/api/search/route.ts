

import "server-only";

import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

type SearchEntry = {
  surah: number;
  ayah: number;
  tamil: string;
};

let searchIndexPromise: Promise<SearchEntry[]> | null = null;

function getSearchIndex() {
  if (!searchIndexPromise) {
    const filePath = path.join(process.cwd(), "public", "data", "search-index.json");
    searchIndexPromise = fs
      .readFile(filePath, "utf8")
      .then((content) => JSON.parse(content) as SearchEntry[]);
  }

  return searchIndexPromise;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json([]);
  }

  const index = await getSearchIndex();
  const results = index
    .filter((entry) => entry.tamil.includes(query))
    .slice(0, 60);

  return NextResponse.json(results, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}