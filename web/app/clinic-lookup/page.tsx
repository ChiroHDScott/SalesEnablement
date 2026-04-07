"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Star, Users, ChevronRight } from "lucide-react";

interface ClinicResult {
    place_id: string;
    company_name: string;
    address: string;
    city: string;
    state: string;
    gm_zip5: string;
    rating: number | null;
    reviews: number | null;
    practitioner_count: number | null;
}

function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
    let timer: ReturnType<typeof setTimeout>;
    return ((...args: any[]) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    }) as T;
}

export default function ClinicLookupPage() {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<ClinicResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const search = useCallback(
        debounce(async (q: string) => {
            if (q.length < 2) {
                setResults([]);
                setSearched(false);
                return;
            }
            setLoading(true);
            try {
                const res = await fetch(`/api/clinic-search?q=${encodeURIComponent(q)}`);
                const data = await res.json();
                setResults(data);
                setSearched(true);
            } finally {
                setLoading(false);
            }
        }, 300),
        []
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        search(val);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#FF3B00] rounded-md flex items-center justify-center">
                        <Search className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold text-gray-900">BDR Clinic Intelligence</h1>
                        <p className="text-xs text-gray-500">Search any chiropractic clinic in the TAM</p>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-10">
                {/* Search input */}
                <div className="relative mb-8">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        {loading
                            ? <div className="w-5 h-5 border-2 border-[#FF3B00] border-t-transparent rounded-full animate-spin" />
                            : <Search className="w-5 h-5 text-gray-400" />
                        }
                    </div>
                    <input
                        autoFocus
                        type="text"
                        value={query}
                        onChange={handleChange}
                        placeholder="Search by clinic name, city, or zip…"
                        className="w-full pl-12 pr-4 py-4 text-base bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF3B00] focus:border-transparent placeholder-gray-400"
                    />
                </div>

                {/* Empty state */}
                {!searched && !loading && (
                    <div className="text-center py-20 text-gray-400">
                        <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p className="text-sm">Start typing to search across {" "}
                            <span className="font-medium text-gray-500">80,000+ clinics</span>
                        </p>
                    </div>
                )}

                {/* No results */}
                {searched && results.length === 0 && !loading && (
                    <div className="text-center py-16 text-gray-400">
                        <p className="text-sm">No clinics found for <span className="font-medium text-gray-600">"{query}"</span></p>
                        <p className="text-xs mt-1">Try a different name or city</p>
                    </div>
                )}

                {/* Results */}
                {results.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-xs text-gray-400 mb-3">
                            {results.length} result{results.length !== 1 ? "s" : ""} for "{query}"
                        </p>
                        {results.map((clinic) => (
                            <button
                                key={clinic.place_id}
                                onClick={() => router.push(`/clinic-lookup/${clinic.place_id}`)}
                                className="w-full text-left bg-white border border-gray-200 rounded-xl px-5 py-4 hover:border-[#FF3B00] hover:shadow-md transition-all group"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-gray-900 truncate">
                                                {clinic.company_name}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-1 text-sm text-gray-500">
                                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                            <span className="truncate">
                                                {clinic.address}{clinic.city ? `, ${clinic.city}` : ""}{clinic.state ? `, ${clinic.state}` : ""} {clinic.gm_zip5 ?? ""}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 flex-shrink-0">
                                        {clinic.rating && (
                                            <div className="flex items-center gap-1 text-sm">
                                                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                                <span className="font-medium text-gray-700">{clinic.rating}</span>
                                                {clinic.reviews && (
                                                    <span className="text-gray-400 text-xs">({clinic.reviews})</span>
                                                )}
                                            </div>
                                        )}
                                        {clinic.practitioner_count != null && clinic.practitioner_count > 0 && (
                                            <div className="flex items-center gap-1 text-xs text-gray-400">
                                                <Users className="w-3.5 h-3.5" />
                                                <span>{clinic.practitioner_count}</span>
                                            </div>
                                        )}
                                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#FF3B00] transition-colors" />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
