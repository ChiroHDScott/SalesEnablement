import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
    _req: NextRequest,
    { params }: { params: { place_id: string } }
) {
    try {
        const { place_id } = params;
        const db = supabaseAdmin();

        // Core location + contact
        const [{ data: location }, { data: contact }] = await Promise.all([
            db.from("tam_locations").select("*").eq("place_id", place_id).single(),
            db.from("tam_contacts").select("*").eq("place_id", place_id).maybeSingle(),
        ]);

        if (!location) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        // Everything else in parallel
        const [
            { data: reviews },
            { data: chirotouch },
            { data: npiOrg },
            { data: npiChanges },
        ] = await Promise.all([
            db.from("reviews_classified")
                .select("*")
                .eq("place_id", place_id)
                .order("stars", { ascending: false })
                .limit(50),
            db.from("competitor_chirotouch")
                .select("*")
                .eq("tam_place_id", place_id)
                .maybeSingle(),
            location.npi_org
                ? db.from("npi_organizations").select("*").eq("npi", location.npi_org).maybeSingle()
                : Promise.resolve({ data: null, error: null }),
            location.npi_org
                ? db.from("npi_changes").select("*").eq("npi", location.npi_org).maybeSingle()
                : Promise.resolve({ data: null, error: null }),
        ]);

        // Practitioners — prefer contact's NPI, fall back to zip
        let practitioners: any[] = [];
        if (contact?.practitioner_npi) {
            const { data } = await db
                .from("npi_practitioners_geocoded")
                .select("*")
                .eq("npi", contact.practitioner_npi)
                .limit(1);
            practitioners = data ?? [];
        } else if (location.gm_zip5) {
            const { data } = await db
                .from("npi_practitioners_geocoded")
                .select("*")
                .eq("zip", location.gm_zip5)
                .limit(8);
            practitioners = data ?? [];
        }

        // City benchmarks
        const { data: benchmarks } = location.city
            ? await db.from("city_benchmarks").select("*").eq("city", location.city).maybeSingle()
            : { data: null };

        // CHD data matched by zip
        let chdNewPt: any[] = [], chdTotal: any[] = [], chdTypes: any[] = [];
        if (location.gm_zip5) {
            const [a, b, c] = await Promise.all([
                db.from("chd_new_patient_appointments").select("*").eq("location_zip", location.gm_zip5).limit(5),
                db.from("chd_total_appointments").select("*").eq("location_zip", location.gm_zip5).limit(5),
                db.from("chd_appointment_types").select("*").eq("location_zip", location.gm_zip5).limit(5),
            ]);
            chdNewPt = a.data ?? [];
            chdTotal = b.data ?? [];
            chdTypes = c.data ?? [];
        }

        // Build pain category counts
        const painCounts: Record<string, number> = {};
        for (const r of reviews ?? []) {
            if (!r.pain_categories) continue;
            for (const cat of r.pain_categories.split("|")) {
                const c = cat.trim();
                if (c) painCounts[c] = (painCounts[c] ?? 0) + 1;
            }
        }

        const top3Reviews = (reviews ?? []).slice(0, 3);
        const painReviews = (reviews ?? []).filter(r => r.signal_strength === "strong").slice(0, 10);

        return NextResponse.json({
            location,
            contact,
            reviews: top3Reviews,
            pain_reviews: painReviews,
            pain_counts: painCounts,
            chirotouch,
            npi_org: npiOrg,
            npi_changes: npiChanges,
            practitioners,
            benchmarks,
            chd_new_patient: chdNewPt,
            chd_total: chdTotal,
            chd_types: chdTypes,
        });
    } catch (err: any) {
        console.error("Clinic API error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
