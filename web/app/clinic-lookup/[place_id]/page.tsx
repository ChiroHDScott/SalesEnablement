"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft, Star, MapPin, Phone, Globe, Users, Calendar,
    TrendingUp, MessageSquare, AlertCircle, CheckCircle,
    Building2, Zap, ChevronDown, ChevronUp, ExternalLink
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface ClinicData {
    location: any;
    contact: any;
    reviews: any[];
    pain_reviews: any[];
    pain_counts: Record<string, number>;
    chirotouch: any;
    npi_org: any;
    npi_changes: any;
    practitioners: any[];
    benchmarks: any;
    chd_new_patient: any[];
    chd_total: any[];
    chd_types: any[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(val: any, suffix = "") {
    if (val == null || val === "") return "—";
    return `${val}${suffix}`;
}

function fmtDate(d: string | null) {
    if (!d) return "—";
    const dt = new Date(d);
    return dt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function clinicAge(enumDate: string | null) {
    if (!enumDate) return null;
    const years = Math.floor((Date.now() - new Date(enumDate).getTime()) / (1000 * 60 * 60 * 24 * 365));
    return years;
}

const PAIN_LABEL: Record<string, string> = {
    SCHEDULING: "Scheduling", COMMUNICATION: "Communication",
    BILLING: "Billing", DOCUMENTATION: "Documentation",
    STAFF_ISSUES: "Staff Issues", LEGACY_TECH: "Legacy Tech",
    GROWTH: "Growth Issues", MULTI_LOCATION: "Multi-Location",
};

const PAIN_PRODUCT: Record<string, string> = {
    SCHEDULING: "SKED", COMMUNICATION: "SKED",
    BILLING: "ChiroHD", DOCUMENTATION: "ChiroHD",
    STAFF_ISSUES: "ChiroHD", LEGACY_TECH: "ChiroHD",
    GROWTH: "SPARK", MULTI_LOCATION: "ChiroHD",
};

const PAIN_COLOR: Record<string, string> = {
    SCHEDULING: "bg-blue-50 text-blue-700 border-blue-200",
    COMMUNICATION: "bg-blue-50 text-blue-700 border-blue-200",
    BILLING: "bg-red-50 text-red-700 border-red-200",
    DOCUMENTATION: "bg-red-50 text-red-700 border-red-200",
    STAFF_ISSUES: "bg-orange-50 text-orange-700 border-orange-200",
    LEGACY_TECH: "bg-purple-50 text-purple-700 border-purple-200",
    GROWTH: "bg-green-50 text-green-700 border-green-200",
    MULTI_LOCATION: "bg-gray-50 text-gray-700 border-gray-200",
};

function StarRow({ rating }: { rating: number }) {
    return (
        <span className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className={`w-3.5 h-3.5 ${i <= rating ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}`} />
            ))}
        </span>
    );
}

function Section({ title, children, icon }: { title: string; children: React.ReactNode; icon?: React.ReactNode }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
                {icon && <span className="text-gray-400">{icon}</span>}
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h2>
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

function StatRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div className="flex justify-between items-baseline py-1.5 border-b border-gray-50 last:border-0">
            <span className="text-sm text-gray-500">{label}</span>
            <span className={`text-sm font-medium ${highlight ? "text-[#FF3B00]" : "text-gray-800"}`}>{value}</span>
        </div>
    );
}

function BenchmarkBar({ label, value, benchmark, top25 }: { label: string; value?: number; benchmark?: number; top25?: number }) {
    if (!benchmark) return null;
    const max = Math.max(value ?? 0, top25 ?? benchmark * 1.5, benchmark) * 1.2;
    const clinicPct = value ? Math.min((value / max) * 100, 100) : 0;
    const benchPct = Math.min((benchmark / max) * 100, 100);
    const top25Pct = top25 ? Math.min((top25 / max) * 100, 100) : 0;

    const status = value == null ? "unknown"
        : value >= (top25 ?? Infinity) ? "top25"
        : value >= benchmark ? "above"
        : "below";

    const statusColor = status === "top25" ? "bg-green-500" : status === "above" ? "bg-blue-500" : status === "below" ? "bg-red-400" : "bg-gray-300";

    return (
        <div className="mb-4">
            <div className="flex justify-between mb-1">
                <span className="text-xs text-gray-500">{label}</span>
                <span className={`text-xs font-semibold ${status === "top25" ? "text-green-600" : status === "above" ? "text-blue-600" : status === "below" ? "text-red-500" : "text-gray-400"}`}>
                    {value != null ? value : "No data"}
                    {status === "top25" && " · Top 25%"}
                    {status === "above" && " · Above avg"}
                    {status === "below" && " · Below avg"}
                </span>
            </div>
            <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                {value != null && <div className={`absolute h-full rounded-full ${statusColor}`} style={{ width: `${clinicPct}%` }} />}
                <div className="absolute h-full w-0.5 bg-gray-400" style={{ left: `${benchPct}%` }} title={`Median: ${benchmark}`} />
                {top25 && <div className="absolute h-full w-0.5 bg-gray-600" style={{ left: `${top25Pct}%` }} title={`Top 25%: ${top25}`} />}
            </div>
            <div className="flex justify-between mt-0.5">
                <span className="text-[10px] text-gray-400">Median: {benchmark}</span>
                {top25 && <span className="text-[10px] text-gray-400">Top 25%: {top25}</span>}
            </div>
        </div>
    );
}

// ── Talking Points Generator ──────────────────────────────────────────────────
function generateTalkingPoints(data: ClinicData): string[] {
    const points: string[] = [];
    const { location, contact, chirotouch, npi_org, npi_changes, benchmarks, pain_counts, chd_new_patient, chd_total } = data;

    // ChiroTouch displacement
    if (chirotouch?.uses_chirotouch) {
        points.push(`🎯 Confirmed ChiroTouch user — strong displacement opportunity. Ask: "How long have you been on ChiroTouch, and what's one thing you wish it did better?"`);
    }

    // Ownership change
    if (npi_changes?.owner_changed) {
        points.push(`🔄 Recent ownership change detected (${fmtDate(npi_changes?.last_update_date)}). New owners often reevaluate systems. Ask: "Has the ownership transition changed any of your operational priorities?"`);
    }

    // Name change
    if (npi_changes?.name_changed) {
        points.push(`📋 Practice name recently changed — may indicate rebrand or expansion. Worth probing current growth strategy.`);
    }

    // Below-average new patients
    const npMedian = benchmarks?.np_month_median;
    const chdNp = chd_new_patient?.[0]?.total_2025;
    if (chdNp && npMedian && chdNp / 12 < npMedian * 0.85) {
        points.push(`📉 New patient volume running below market average (~${Math.round(chdNp / 12)}/mo vs ${npMedian} median). SPARK and SKED can close this gap. Ask: "What's your current new patient strategy?"`);
    }

    // Below-average visit count
    const visitsMedian = benchmarks?.visits_week_median;
    const chdVisits = chd_total?.[0]?.total_2025;
    if (chdVisits && visitsMedian && chdVisits / 52 < visitsMedian * 0.85) {
        points.push(`📊 Weekly visit volume below market average. Scheduling friction may be a contributor — SKED's online booking and automated reminders directly address this.`);
    }

    // High review pain signals
    if ((pain_counts["SCHEDULING"] ?? 0) >= 2) {
        points.push(`⏰ ${pain_counts["SCHEDULING"]} scheduling-related pain signals in reviews. Lead with SKED's real-time booking and no-show reduction features.`);
    }
    if ((pain_counts["BILLING"] ?? 0) >= 2) {
        points.push(`💰 ${pain_counts["BILLING"]} billing complaints in reviews. ChiroHD's integrated billing and claims workflow is a direct answer. Ask: "How much time does your team spend on claims follow-up each week?"`);
    }
    if ((pain_counts["LEGACY_TECH"] ?? 0) >= 1) {
        points.push(`🖥️ Patients are calling out technology frustrations in reviews. This is a rare and powerful signal — they're feeling the pain of legacy software.`);
    }
    if ((pain_counts["DOCUMENTATION"] ?? 0) >= 2) {
        points.push(`📝 Multiple documentation complaints. Ask about SOAP note efficiency and whether the doctor is the one writing notes.`);
    }

    // Multi-location potential
    const locCount = contact?.loc_count ?? 0;
    if (locCount > 1) {
        points.push(`🏢 ${locCount} locations in this market. Multi-location practices need scalable systems — position ChiroHD's enterprise controls and consolidated reporting.`);
    }

    // Solo practitioner
    const isSole = data.practitioners?.[0]?.is_sole_proprietor === "Y" ||
                   (location?.practitioner_count === 1);
    if (isSole) {
        points.push(`👤 Solo practitioner — time efficiency is critical. Lead with ChiroHD's automated workflows and how it reduces admin overhead without adding headcount.`);
    }

    // Strong rating — use as anchor
    if ((location?.rating ?? 0) >= 4.7 && (location?.reviews ?? 0) >= 50) {
        points.push(`⭐ Exceptional reputation (${location?.rating} stars, ${location?.reviews} reviews). They're delivering excellent care — position ChiroHD as the system that protects and amplifies that reputation at scale.`);
    }

    // New practice (< 3 years)
    const age = clinicAge(npi_org?.provider_enumeration_date);
    if (age !== null && age <= 3) {
        points.push(`🌱 Practice is only ~${age} year${age === 1 ? "" : "s"} old. Early-stage clinics that build on the right systems from the start avoid costly migrations later.`);
    }

    if (points.length === 0) {
        points.push("No automated insights available — review the data above and build a custom pitch based on their unique profile.");
    }

    return points;
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ClinicDetailPage() {
    const { place_id } = useParams() as { place_id: string };
    const router = useRouter();
    const [data, setData] = useState<ClinicData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAllReviews, setShowAllReviews] = useState(false);

    useEffect(() => {
        fetch(`/api/clinic/${place_id}`)
            .then(r => r.json())
            .then(setData)
            .catch(() => setError("Failed to load clinic data"))
            .finally(() => setLoading(false));
    }, [place_id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#FF3B00] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !data?.location) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                    <p className="text-gray-600">{error ?? "Clinic not found"}</p>
                    <button onClick={() => router.back()} className="mt-4 text-sm text-[#FF3B00] hover:underline">← Back to search</button>
                </div>
            </div>
        );
    }

    const { location, contact, reviews, pain_reviews, pain_counts, chirotouch,
            npi_org, npi_changes, practitioners, benchmarks, chd_new_patient, chd_total, chd_types } = data;

    const age = clinicAge(npi_org?.provider_enumeration_date);
    const talkingPoints = generateTalkingPoints(data);
    const topPains = Object.entries(pain_counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top nav */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <span className="text-gray-300">/</span>
                    <span className="text-sm text-gray-800 font-medium truncate">{location.company_name}</span>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

                {/* Hero */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                                <h1 className="text-2xl font-bold text-gray-900">{location.company_name}</h1>
                                {chirotouch?.uses_chirotouch && (
                                    <span className="text-xs bg-purple-100 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full font-medium">
                                        ChiroTouch
                                    </span>
                                )}
                                {npi_changes?.owner_changed && (
                                    <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                                        Owner Changed
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-3">
                                <MapPin className="w-4 h-4 flex-shrink-0" />
                                <span>{location.address}{location.city ? `, ${location.city}` : ""}{location.state ? `, ${location.state}` : ""} {location.gm_zip5 ?? ""}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm">
                                {location.phone && (
                                    <a href={`tel:${location.phone}`} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800">
                                        <Phone className="w-3.5 h-3.5" />{location.phone}
                                    </a>
                                )}
                                {location.website && (
                                    <a href={location.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-500 hover:text-blue-700">
                                        <Globe className="w-3.5 h-3.5" />{location.domain ?? location.website}
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            {location.rating && (
                                <div className="flex items-center gap-2">
                                    <StarRow rating={Math.round(location.rating)} />
                                    <span className="text-lg font-bold text-gray-800">{location.rating}</span>
                                </div>
                            )}
                            {location.reviews && (
                                <span className="text-xs text-gray-400">{location.reviews.toLocaleString()} reviews</span>
                            )}
                        </div>
                    </div>

                    {/* Quick stats row */}
                    <div className="mt-5 pt-5 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-xl font-bold text-gray-800">{age != null ? `${age}y` : "—"}</div>
                            <div className="text-xs text-gray-400 mt-0.5">Practice Age</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xl font-bold text-gray-800">{fmt(location.practitioner_count ?? (practitioners?.length || null))}</div>
                            <div className="text-xs text-gray-400 mt-0.5">Practitioners</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xl font-bold text-gray-800">{fmt(contact?.loc_count)}</div>
                            <div className="text-xs text-gray-400 mt-0.5">Locations (Market)</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xl font-bold text-gray-800">
                                {chirotouch?.uses_chirotouch ? "ChiroTouch" : location.competitor_primary_platform ?? "Unknown"}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">EHR</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left column */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Talking Points */}
                        <Section title="Suggested Talking Points" icon={<Zap className="w-4 h-4" />}>
                            <div className="space-y-3">
                                {talkingPoints.map((pt, i) => (
                                    <div key={i} className="flex gap-3">
                                        <div className="flex-1 text-sm text-gray-700 leading-relaxed">{pt}</div>
                                    </div>
                                ))}
                            </div>
                        </Section>

                        {/* Reviews */}
                        <Section title="Google Reviews" icon={<Star className="w-4 h-4" />}>
                            {reviews.length === 0 ? (
                                <p className="text-sm text-gray-400">No reviews loaded</p>
                            ) : (
                                <>
                                    {/* Pain signal summary */}
                                    {topPains.length > 0 && (
                                        <div className="mb-5 p-4 bg-gray-50 rounded-lg">
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Pain Signal Summary</p>
                                            <div className="flex flex-wrap gap-2">
                                                {topPains.map(([cat, count]) => (
                                                    <span
                                                        key={cat}
                                                        className={`text-xs px-2.5 py-1 rounded-full border font-medium ${PAIN_COLOR[cat] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}
                                                    >
                                                        {PAIN_LABEL[cat] ?? cat} · {count}
                                                        {PAIN_PRODUCT[cat] && (
                                                            <span className="ml-1 opacity-60">→ {PAIN_PRODUCT[cat]}</span>
                                                        )}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Top 3 reviews */}
                                    <div className="space-y-4">
                                        {reviews.map((r, i) => (
                                            <div key={i} className={`border rounded-lg p-4 ${r.signal_strength === "strong" ? "border-amber-200 bg-amber-50" : "border-gray-100 bg-white"}`}>
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <StarRow rating={r.stars} />
                                                        {r.signal_strength === "strong" && (
                                                            <span className="text-xs text-amber-700 font-medium">Pain Signal</span>
                                                        )}
                                                    </div>
                                                    {r.title && <p className="text-xs font-medium text-gray-600 truncate max-w-[200px]">{r.title}</p>}
                                                </div>
                                                <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{r.text}</p>
                                                {r.summary && (
                                                    <p className="text-xs text-gray-500 mt-2 italic">AI summary: {r.summary}</p>
                                                )}
                                                {r.pain_categories && (
                                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                                        {r.pain_categories.split("|").filter(Boolean).map((cat: string) => (
                                                            <span key={cat} className={`text-xs px-2 py-0.5 rounded-full border ${PAIN_COLOR[cat.trim()] ?? "bg-gray-50 text-gray-500 border-gray-200"}`}>
                                                                {PAIN_LABEL[cat.trim()] ?? cat.trim()}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Strong pain reviews */}
                                    {pain_reviews.length > 0 && (
                                        <div className="mt-4">
                                            <button
                                                onClick={() => setShowAllReviews(!showAllReviews)}
                                                className="flex items-center gap-1.5 text-sm text-[#FF3B00] hover:underline"
                                            >
                                                {showAllReviews ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                {showAllReviews ? "Hide" : `Show ${pain_reviews.length} pain signal review${pain_reviews.length !== 1 ? "s" : ""}`}
                                            </button>
                                            {showAllReviews && (
                                                <div className="mt-3 space-y-3">
                                                    {pain_reviews.map((r, i) => (
                                                        <div key={i} className="border border-red-100 bg-red-50 rounded-lg p-4">
                                                            <StarRow rating={r.stars} />
                                                            <p className="text-sm text-gray-700 mt-2 leading-relaxed">{r.text}</p>
                                                            {r.pain_categories && (
                                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                                    {r.pain_categories.split("|").filter(Boolean).map((cat: string) => (
                                                                        <span key={cat} className={`text-xs px-2 py-0.5 rounded-full border ${PAIN_COLOR[cat.trim()] ?? "bg-gray-50 text-gray-500 border-gray-200"}`}>
                                                                            {PAIN_LABEL[cat.trim()] ?? cat.trim()}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </Section>

                        {/* CHD Appointment Data (if CHD customer) */}
                        {(chd_new_patient?.length > 0 || chd_total?.length > 0) && (
                            <Section title="ChiroHD Performance Data" icon={<TrendingUp className="w-4 h-4" />}>
                                {chd_new_patient?.[0] && (
                                    <div className="mb-4">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">New Patients 2025 — {chd_new_patient[0].location_name}</p>
                                        <div className="grid grid-cols-6 gap-1 text-center">
                                            {["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"].map(m => (
                                                <div key={m} className="bg-gray-50 rounded p-2">
                                                    <div className="text-xs text-gray-400 uppercase">{m}</div>
                                                    <div className="text-sm font-semibold text-gray-800 mt-0.5">{chd_new_patient[0][m] ?? "—"}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-2 text-sm text-gray-600">
                                            Total 2025: <span className="font-semibold text-gray-800">{chd_new_patient[0].total_2025?.toLocaleString() ?? "—"}</span>
                                        </div>
                                    </div>
                                )}
                                {chd_total?.[0] && (
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Total Appointments 2025</p>
                                        <div className="grid grid-cols-6 gap-1 text-center">
                                            {["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"].map(m => (
                                                <div key={m} className="bg-gray-50 rounded p-2">
                                                    <div className="text-xs text-gray-400 uppercase">{m}</div>
                                                    <div className="text-sm font-semibold text-gray-800 mt-0.5">{chd_total[0][m] ?? "—"}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-2 text-sm text-gray-600">
                                            Total 2025: <span className="font-semibold text-gray-800">{chd_total[0].total_2025?.toLocaleString() ?? "—"}</span>
                                        </div>
                                    </div>
                                )}
                                {chd_types?.[0] && (
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Appointment Types</p>
                                        <p className="text-sm text-gray-700">{chd_types[0].appointment_types_list}</p>
                                    </div>
                                )}
                            </Section>
                        )}
                    </div>

                    {/* Right column */}
                    <div className="space-y-6">

                        {/* Contact */}
                        <Section title="Primary Contact" icon={<Users className="w-4 h-4" />}>
                            {contact?.contact_full_name ? (
                                <div className="space-y-3">
                                    <div>
                                        <p className="font-semibold text-gray-800">{contact.contact_full_name}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{contact.name_source?.replace(/_/g, " ")}</p>
                                    </div>
                                    {contact.best_email && (
                                        <a href={`mailto:${contact.best_email}`} className="block text-sm text-blue-500 hover:underline truncate">
                                            {contact.best_email}
                                        </a>
                                    )}
                                    {contact.best_phone && (
                                        <a href={`tel:${contact.best_phone}`} className="block text-sm text-gray-600 hover:text-gray-800">
                                            {contact.best_phone}
                                        </a>
                                    )}
                                    {contact.linkedin_url && (
                                        <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
                                            LinkedIn <ExternalLink className="w-3 h-3" />
                                            {contact.linkedin_validated && <CheckCircle className="w-3 h-3 text-green-500" />}
                                        </a>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400">No contact info available</p>
                            )}
                        </Section>

                        {/* Staff & Practice Info */}
                        <Section title="Practice Info" icon={<Building2 className="w-4 h-4" />}>
                            <div>
                                {npi_org && (
                                    <>
                                        <StatRow label="NPI Org" value={npi_org.npi} />
                                        <StatRow label="Legal Name" value={npi_org.organization_name ?? "—"} />
                                        {npi_org.authorized_official_first_name && (
                                            <StatRow
                                                label="Authorized Official"
                                                value={`${npi_org.authorized_official_first_name} ${npi_org.authorized_official_last_name ?? ""}`}
                                            />
                                        )}
                                        <StatRow label="Enrolled" value={fmtDate(npi_org.provider_enumeration_date)} />
                                    </>
                                )}
                                {age != null && (
                                    <StatRow label="Practice Age" value={`~${age} year${age === 1 ? "" : "s"}`} />
                                )}
                                {practitioners && practitioners.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-gray-50">
                                        <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide font-semibold">Practitioners</p>
                                        {practitioners.slice(0, 5).map((p: any, i: number) => (
                                            <div key={i} className="py-1.5 flex justify-between text-sm">
                                                <span className="text-gray-700">
                                                    {p.provider_first_name} {p.provider_last_name}
                                                    {p.provider_credential_text ? `, ${p.provider_credential_text}` : ""}
                                                </span>
                                                {p.is_sole_proprietor === "Y" && (
                                                    <span className="text-xs text-gray-400">Solo</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {npi_changes && (npi_changes.owner_changed || npi_changes.name_changed || npi_changes.address_changed) && (
                                    <div className="mt-3 pt-3 border-t border-gray-50">
                                        <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide mb-2">Recent Changes</p>
                                        {npi_changes.owner_changed && <p className="text-xs text-gray-600">⚠️ Ownership changed ({fmtDate(npi_changes.last_update_date)})</p>}
                                        {npi_changes.name_changed && <p className="text-xs text-gray-600">⚠️ Practice name changed</p>}
                                        {npi_changes.address_changed && <p className="text-xs text-gray-600">⚠️ Address changed</p>}
                                        {npi_changes.old_address && npi_changes.current_address !== npi_changes.old_address && (
                                            <p className="text-xs text-gray-400 mt-1">Was: {npi_changes.old_address}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </Section>

                        {/* City Benchmarks */}
                        {(benchmarks || contact?.cva_median) && (
                            <Section title="Market Benchmarks" icon={<TrendingUp className="w-4 h-4" />}>
                                <p className="text-xs text-gray-400 mb-4">{location.city} market · {benchmarks?.loc_count ?? contact?.loc_count} clinics</p>
                                <BenchmarkBar
                                    label="Cost per Visit (CVA)"
                                    benchmark={benchmarks?.cva_median ?? contact?.cva_median}
                                    top25={benchmarks?.cva_top25 ?? contact?.cva_top25}
                                />
                                <BenchmarkBar
                                    label="Patient Value (PVA)"
                                    benchmark={benchmarks?.pva_median ?? contact?.pva_median}
                                    top25={benchmarks?.pva_top25 ?? contact?.pva_top25}
                                />
                                <BenchmarkBar
                                    label="Visits / Week"
                                    value={chd_total?.[0]?.total_2025 ? Math.round(chd_total[0].total_2025 / 52) : undefined}
                                    benchmark={benchmarks?.visits_week_median ?? contact?.visits_week_median}
                                    top25={benchmarks?.visits_week_top25 ?? contact?.visits_week_top25}
                                />
                                <BenchmarkBar
                                    label="New Patients / Month"
                                    value={chd_new_patient?.[0]?.total_2025 ? Math.round(chd_new_patient[0].total_2025 / 12) : undefined}
                                    benchmark={benchmarks?.np_month_median ?? contact?.np_month_median}
                                    top25={benchmarks?.np_month_top25 ?? contact?.np_month_top25}
                                />
                                <BenchmarkBar
                                    label="Reactivations / Month"
                                    benchmark={benchmarks?.reacts_median ?? contact?.reacts_median}
                                    top25={benchmarks?.reacts_top25 ?? contact?.reacts_top25}
                                />
                                {(benchmarks?.react_value ?? contact?.react_value) && (
                                    <p className="text-xs text-gray-500 mt-2">
                                        Reactivation value: <span className="font-medium text-gray-700">${(benchmarks?.react_value ?? contact?.react_value)?.toLocaleString()}/yr</span>
                                    </p>
                                )}
                            </Section>
                        )}

                        {/* EHR */}
                        <Section title="EHR" icon={<MessageSquare className="w-4 h-4" />}>
                            {chirotouch ? (
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-sm font-semibold text-purple-700">ChiroTouch</span>
                                        <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">{chirotouch.confidence_tier}</span>
                                    </div>
                                    <p className="text-xs text-gray-400">Match confidence: {chirotouch.match_confidence}%</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Match type: {chirotouch.match_type?.replace(/_/g, " ")}</p>
                                </div>
                            ) : location.competitor_primary_platform ? (
                                <div>
                                    <p className="text-sm font-medium text-gray-700">{location.competitor_primary_platform}</p>
                                    <p className="text-xs text-gray-400 mt-1">Detected via TAM scan</p>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400">EHR not identified</p>
                            )}
                        </Section>

                    </div>
                </div>
            </div>
        </div>
    );
}
