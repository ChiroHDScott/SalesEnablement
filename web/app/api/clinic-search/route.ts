import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
    const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    if (q.length < 2) return NextResponse.json([]);

    const db = supabaseAdmin();

    // 1. Full-text search (fast, ranked)
    const { data: ftsResults } = await db
        .from("tam_locations")
        .select("place_id, company_name, address, city, state, gm_zip5, rating, reviews, practitioner_count")
        .textSearch("search_vector", q.split(/\s+/).join(" & "), { type: "plain" })
        .limit(20);

    // 2. Trigram similarity fallback for typos / partial names
    const { data: trigramResults } = await db
        .rpc("search_clinics_fuzzy", { query: q, max_results: 20 });

    // Merge: deduplicate by place_id, fts first
    const seen = new Set<string>();
    const merged: any[] = [];
    for (const row of [...(ftsResults ?? []), ...(trigramResults ?? [])]) {
        if (!seen.has(row.place_id)) {
            seen.add(row.place_id);
            merged.push(row);
        }
    }

    return NextResponse.json(merged.slice(0, 25));
}
