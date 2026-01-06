"use client";

import Image from "next/image"; // Import Image from next/image for optimization since user specifically asked for Next.js

import { useState } from "react";
// Lucide icons
import { Check, X } from "lucide-react";

export default function Home() {
    const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("annual");

    const plans = [
        {
            name: "ENTRY",
            price: { monthly: 314, annual: 299 },
            suffix: "*",
            highlight: false,
        },
        {
            name: "SCALE",
            price: { monthly: 498, annual: 468 },
            suffix: "",
            highlight: false,
        },
        {
            name: "PERFORMANCE",
            price: { monthly: 598, annual: 558 },
            suffix: "",
            highlight: "blue", // Using string identifiers for custom styling logic
        },
        {
            name: "AUTOMATION",
            price: { monthly: 798, annual: 738 },
            suffix: "**",
            highlight: "gold",
        },
    ];

    const features = [
        {
            title: "Texting Credits (monthly)",
            values: ["$0.03 per text", "8,500 included", "12,500 included", "15,000 included"],
        },
        {
            title: "Full ChiroHD EHR Platform",
            subtitle: "(Scheduling, Billing, Records, Care Plans)",
            checks: [true, true, true, true],
        },
        {
            title: "Basic Text Infrastructure (No Automation)",
            subtitle: "(Sends via office number/ChiroHD interface)",
            checks: [true, true, true, true],
        },
        {
            title: "SKED Patient Mobile App & Portal",
            checks: [false, true, true, true],
        },
        {
            title: "Automated Reminders & Family Scheduling",
            checks: [false, true, true, true],
        },
        {
            title: "Automated Google Reviews Booster",
            checks: [false, true, true, true],
        },
        {
            title: "Smart Reactivation & Drip Campaigns",
            checks: [false, false, true, true],
        },
        {
            title: "Premium Integrations",
            subtitle: "(CLA Synapse, GHL)",
            checks: [false, false, true, true],
        },
        {
            title: "New + Existing Patient Portals",
            subtitle: "(CLA Synapse, GHL)",
            checks: [false, false, true, true],
        },
        {
            title: "SPARK AI Chatbot & Lead Conversion Engine",
            checks: [false, false, false, true],
        },
        {
            title: "VIP Concierge Support",
            checks: [false, false, false, true],
        },
    ];

    const bestSuited = [
        { text: <>Budget<br />Foundation</>, color: "" },
        { text: <>Smart<br />Efficiency</>, color: "text-blue-500" },
        { text: <>High-Volume<br />Retention</>, color: "text-fuchsia-600" }, // pinkish purple
        { text: <>Complex<br />Scaling</>, color: "text-orange-500" },
    ];

    return (
        <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-blue-50 py-16 px-4 sm:px-6 lg:px-8 font-inter text-gray-900">
            <div className="max-w-7xl mx-auto">
                {/* Header / Logos */}
                <header className="flex justify-center items-center gap-12 mb-12 flex-wrap">
                    <div className="relative h-12 w-48">
                        <Image src="/chirohd.png" alt="ChiroHD" fill className="object-contain" />
                    </div>
                    <div className="relative h-10 w-32">
                        <Image src="/sked.png" alt="SKED" fill className="object-contain" />
                    </div>
                    <div className="relative h-11 w-40">
                        <Image src="/spark.png" alt="Spark" fill className="object-contain" />
                    </div>
                </header>

                {/* Toggle */}
                <div className="flex justify-center items-center gap-4 mb-12">
                    <span
                        className={`cursor-pointer font-medium ${billingPeriod === "monthly" ? "text-blue-600" : "text-gray-500"
                            }`}
                        onClick={() => setBillingPeriod("monthly")}
                    >
                        Monthly
                    </span>
                    <div
                        className={`w-14 h-8 bg-blue-600 rounded-full p-1 cursor-pointer transition-colors duration-300 relative`}
                        onClick={() =>
                            setBillingPeriod(billingPeriod === "monthly" ? "annual" : "monthly")
                        }
                    >
                        <div
                            className={`bg-white w-6 h-6 rounded-full shadow-md transform duration-300 absolute top-1 ${billingPeriod === "annual" ? "left-7" : "left-1"
                                }`}
                        ></div>
                    </div>
                    <span
                        className={`cursor-pointer font-medium flex items-center gap-2 ${billingPeriod === "annual" ? "text-blue-600" : "text-gray-500"
                            }`}
                        onClick={() => setBillingPeriod("annual")}
                    >
                        Annual
                    </span>
                </div>

                {/* Pricing Table */}
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
                    {/* Table Header */}
                    <div className="grid grid-cols-5 bg-gray-50/50 border-b border-gray-200 divide-x divide-gray-200">
                        <div className="p-6 flex flex-col justify-end">
                            <span className="text-xs font-bold text-gray-400 tracking-wider mb-2">COMPARISON</span>
                            <h2 className="text-2xl font-bold text-gray-900 font-playfair">Key Features</h2>
                        </div>
                        {plans.map((plan, idx) => (
                            <div key={idx} className={`p-6 text-center flex flex-col items-center ${plan.highlight === 'blue' ? 'bg-blue-50/50' :
                                plan.highlight === 'gold' ? 'bg-orange-50/50' : ''
                                }`}>
                                <span className={`text-sm font-bold tracking-wider mb-4 ${plan.highlight === 'blue' ? 'text-blue-600' :
                                    plan.highlight === 'gold' ? 'text-orange-500' : 'text-gray-500'
                                    }`}>
                                    {plan.name}
                                </span>
                                <div className="flex items-baseline justify-center text-gray-900">
                                    <span className="text-2xl font-semibold">$</span>
                                    <span className="text-4xl font-bold tracking-tight">
                                        {billingPeriod === "monthly" ? plan.price.monthly : plan.price.annual}
                                    </span>
                                    <span className="text-gray-500 ml-1">/mo{plan.suffix}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Feature Rows */}
                    <div className="divide-y divide-gray-200">
                        {features.map((feature: any, idx) => (
                            <div key={idx} className="grid grid-cols-5 divide-x divide-gray-200 hover:bg-gray-50 transition-colors group">
                                <div className="p-4 px-6 flex flex-col justify-center">
                                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{feature.title}</h3>
                                    {feature.subtitle && <p className="text-sm text-gray-500 mt-1">{feature.subtitle}</p>}
                                </div>
                                {(feature.values || feature.checks).map((item: any, i: number) => (
                                    <div key={i} className={`p-4 flex items-center justify-center ${plans[i].highlight === 'blue' ? 'bg-blue-50/30' :
                                        plans[i].highlight === 'gold' ? 'bg-orange-50/30' : ''
                                        }`}>
                                        {typeof item === 'string' ? (
                                            <span className="text-xs font-bold text-center">{item}</span>
                                        ) : item === true ? (
                                            <div className="bg-blue-600 rounded-full p-1 shadow-sm">
                                                <Check className="w-4 h-4 text-white" strokeWidth={3} />
                                            </div>
                                        ) : (
                                            <span className="text-gray-300 font-bold text-xl">&mdash;</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* CTA Row */}
                    <div className="grid grid-cols-5 divide-x divide-gray-200 border-t border-gray-200">
                        <div className="p-6"></div> {/* Empty label col */}
                        {plans.map((plan, idx) => (
                            <div key={idx} className={`p-6 flex justify-center items-center ${plan.highlight === 'blue' ? 'bg-blue-50/30' :
                                plan.highlight === 'gold' ? 'bg-orange-50/30' : ''
                                }`}>
                                <button className={`w-full py-3 px-4 rounded-xl font-bold transition-all shadow-sm hover:shadow-lg transform hover:-translate-y-0.5 ${plan.highlight === 'blue' ? 'bg-blue-600 text-white hover:bg-blue-700' :
                                    plan.highlight === 'gold' ? 'bg-orange-500 text-white hover:bg-orange-600' :
                                        'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-600 hover:text-blue-600'
                                    }`}>
                                    Book Demo
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Footer Row / Best Suited */}
                    <div className="grid grid-cols-5 border-t border-gray-200 divide-x divide-gray-200 bg-gray-50/50">
                        <div className="p-6 flex items-center">
                            <h3 className="font-bold text-gray-700 uppercase tracking-wider text-xs">Best Suited For</h3>
                        </div>
                        {bestSuited.map((item, idx) => (
                            <div key={idx} className={`p-6 flex items-center justify-center text-center font-bold text-sm leading-relaxed ${item.color}`}>
                                {item.text}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footnotes */}
                <div className="mt-16 border-t border-gray-200 pt-10 pb-12">
                    <h4 className="text-center text-sm font-bold text-gray-400 uppercase tracking-widest mb-8">Additional Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto px-4">
                        <div className="bg-white/60 p-5 rounded-2xl border border-white shadow-sm backdrop-blur-sm">
                            <p className="text-sm text-gray-600 leading-relaxed"><span className="font-bold text-blue-900 block mb-1">* ENTRY Plan</span>Incurs an additional $0.03 per text message usage fee.</p>
                        </div>
                        <div className="bg-white/60 p-5 rounded-2xl border border-white shadow-sm backdrop-blur-sm">
                            <p className="text-sm text-gray-600 leading-relaxed"><span className="font-bold text-blue-900 block mb-1">** AUTOMATION Package</span>Incurs additional performance-based fees based on results.</p>
                        </div>
                        <div className="bg-white/60 p-5 rounded-2xl border border-white shadow-sm backdrop-blur-sm">
                            <p className="text-sm text-gray-600 leading-relaxed"><span className="font-bold text-blue-900 block mb-1">Onboarding</span>ChiroHD Onboarding: $799<br />ChiroHD Data Migration: $499</p>
                        </div>
                        <div className="bg-white/60 p-5 rounded-2xl border border-white shadow-sm backdrop-blur-sm md:col-span-2 lg:col-span-3 text-center">
                            <p className="text-sm text-gray-600 leading-relaxed"><span className="font-bold text-gray-900">Note:</span> ChiroHD Digitized paperwork limited to 3 forms, 10 pages</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
