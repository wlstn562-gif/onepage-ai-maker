"use client";

import { useState } from "react";
import Head from "next/head";

export default function GoDeliver() {
    const [isDarkMode, setIsDarkMode] = useState(false);

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
        document.documentElement.classList.toggle("dark");
    };

    return (
        <div className={`font-display antialiased selection:bg-primary/30 ${isDarkMode ? "dark" : ""}`}>
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                            <span className="material-icons-round text-black text-xl">local_shipping</span>
                        </div>
                        <span className="text-2xl font-extrabold tracking-tighter text-slate-900 dark:text-white">
                            GODELIVER
                        </span>
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#benefits" className="font-semibold text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">
                            Benefits
                        </a>
                        <a href="#how-it-works" className="font-semibold text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">
                            Process
                        </a>
                        <a href="#faq" className="font-semibold text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">
                            FAQ
                        </a>
                        <button
                            onClick={toggleDarkMode}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-slate-600 dark:text-slate-300"
                        >
                            {isDarkMode ? (
                                <span className="material-icons-round text-primary">light_mode</span>
                            ) : (
                                <span className="material-icons-round">dark_mode</span>
                            )}
                        </button>
                        <a
                            href="#register"
                            className="bg-accent-black dark:bg-primary text-white dark:text-black px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform"
                        >
                            Join Now
                        </a>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="bg-background-light dark:bg-background-dark min-h-screen pt-20 transition-colors duration-300">

                {/* Head for icons */}
                <div className="hidden">
                    <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet" />
                </div>

                {/* Hero Section */}
                <header className="relative pt-20 pb-20 overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
                        <div className="absolute inset-0 bg-[#FFC700] opacity-[0.03] pattern-dots"></div>
                    </div>

                    <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center relative z-10">
                        <div>
                            <div className="inline-block px-4 py-1.5 mb-6 bg-primary/10 border border-primary/20 rounded-full">
                                <span className="text-sm font-bold text-yellow-600 dark:text-primary tracking-wide">
                                    NEW OPPORTUNITIES AWAIT
                                </span>
                            </div>
                            <h1 className="text-6xl md:text-7xl font-extrabold leading-[1.1] mb-6 text-slate-900 dark:text-white">
                                Drive your <span className="text-primary">future</span> forward.
                            </h1>
                            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-lg leading-relaxed">
                                Join the fastest-growing delivery network. Earn more, work whenever you want, and be your own boss with GoDeliver.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <a
                                    href="#register"
                                    className="px-8 py-4 bg-primary text-black font-extrabold rounded-2xl shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all"
                                >
                                    Get Started Today
                                </a>
                                <button className="px-8 py-4 bg-white dark:bg-card-dark border border-gray-200 dark:border-gray-700 text-slate-900 dark:text-white font-bold rounded-2xl flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                                    <span className="material-icons-round">play_circle</span>
                                    How it works
                                </button>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary/20 rounded-full blur-[100px]"></div>
                            <div className="relative bg-primary rounded-large p-8 overflow-hidden transform rotate-2 hover:rotate-0 transition-transform duration-500">
                                <img
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuC3Dc1D7N6R-DGegnutHMUlqHMWflNC3zNfuvbeLztFhPF75BMcIvuVBQA7D0mSW3loZ6rgzvhqn_fm3-usHYNo5PdSk9w_LpqYNrD-mJnTx9Y_1mU6JAwxO2fBijHSP8Scx8V_e9uMZpAK4Kjw3-NVZRI0K6itNkoJyh2HU29ElAzmPLLSHBfAe-arTdMWodzRhiLhvHI09IvOQhFDHyrKn-2xyk_HV8dpeDBXKeVJQLnZyG0U-SiiE5fKFR9I44YQx8u9R1WUnziO"
                                    alt="Delivery partner"
                                    className="rounded-2xl shadow-2xl mix-blend-multiply opacity-90 grayscale-[20%] w-full h-auto object-cover"
                                />

                                {/* Float Card */}
                                <div className="absolute bottom-12 right-12 bg-white dark:bg-accent-black p-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-bounce duration-[3000ms]">
                                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                        <span className="material-icons-round text-green-600">payments</span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                                            Earnings Paid
                                        </p>
                                        <p className="font-bold text-lg text-slate-900 dark:text-white">
                                            +$1,240.50
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Benefits Section */}
                <section id="benefits" className="py-24 bg-accent-black text-white overflow-hidden rounded-t-[3rem]">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
                            <div>
                                <h2 className="text-4xl md:text-5xl font-extrabold mb-4">Why choose us?</h2>
                                <p className="text-slate-400 max-w-md">
                                    We provide the tools and platform, you provide the drive. Here is why our partners love us.
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <button className="w-14 h-14 rounded-full border border-gray-700 flex items-center justify-center hover:bg-primary hover:text-black transition-all">
                                    <span className="material-icons-round">arrow_back</span>
                                </button>
                                <button className="w-14 h-14 rounded-full bg-primary text-black flex items-center justify-center hover:scale-110 transition-all">
                                    <span className="material-icons-round">arrow_forward</span>
                                </button>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {/* Card 1 */}
                            <div className="group bg-zinc-900 p-10 rounded-large border border-zinc-800 hover:border-primary transition-all duration-500 hover:-translate-y-2">
                                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-8 rotate-3 group-hover:rotate-12 transition-transform">
                                    <span className="material-icons-round text-black text-3xl">trending_up</span>
                                </div>
                                <h3 className="text-2xl font-extrabold mb-4">High Income</h3>
                                <p className="text-slate-400 leading-relaxed">
                                    Active partners earn an average of $600 - $1,200 per week. With our surge pricing, your time is worth more.
                                </p>
                            </div>

                            {/* Card 2 */}
                            <div className="group bg-primary p-10 rounded-large text-black hover:-translate-y-2 transition-all duration-500">
                                <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mb-8 -rotate-3 group-hover:-rotate-12 transition-transform">
                                    <span className="material-icons-round text-primary text-3xl">celebration</span>
                                </div>
                                <h3 className="text-2xl font-extrabold mb-4">Weekly Bonuses</h3>
                                <p className="text-black/70 font-semibold leading-relaxed">
                                    Complete milestone deliveries and unlock extra rewards. We celebrate your hard work with real cash incentives.
                                </p>
                            </div>

                            {/* Card 3 */}
                            <div className="group bg-zinc-900 p-10 rounded-large border border-zinc-800 hover:border-primary transition-all duration-500 hover:-translate-y-2">
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 rotate-3 group-hover:rotate-12 transition-transform">
                                    <span className="material-icons-round text-black text-3xl">schedule</span>
                                </div>
                                <h3 className="text-2xl font-extrabold mb-4">Total Freedom</h3>
                                <p className="text-slate-400 leading-relaxed">
                                    No fixed hours. No boss. Turn on the app when you want to earn, and turn it off when you're done. Simple.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Register Section */}
                <section id="register" className="py-24 relative overflow-hidden bg-background-light dark:bg-background-dark">
                    <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
                        <div>
                            <h2 className="text-5xl font-extrabold mb-10 text-slate-900 dark:text-white">
                                Become a driver <span className="text-primary block">today!</span>
                            </h2>
                            <div className="space-y-12">
                                <div className="flex gap-6">
                                    <div className="flex-shrink-0 w-12 h-12 bg-primary text-black font-extrabold rounded-full flex items-center justify-center text-xl shadow-lg shadow-primary/30">1</div>
                                    <div>
                                        <h4 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Register Online</h4>
                                        <p className="text-slate-600 dark:text-slate-400">Fill out the simple form on the right. It takes less than 2 minutes.</p>
                                    </div>
                                </div>
                                <div className="flex gap-6">
                                    <div className="flex-shrink-0 w-12 h-12 bg-gray-200 dark:bg-card-dark text-slate-400 font-extrabold rounded-full flex items-center justify-center text-xl">2</div>
                                    <div>
                                        <h4 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Download the App</h4>
                                        <p className="text-slate-600 dark:text-slate-400">Install our GoDeliver Partner app from the App Store or Google Play Store.</p>
                                    </div>
                                </div>
                                <div className="flex gap-6">
                                    <div className="flex-shrink-0 w-12 h-12 bg-gray-200 dark:bg-card-dark text-slate-400 font-extrabold rounded-full flex items-center justify-center text-xl">3</div>
                                    <div>
                                        <h4 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Start Earning</h4>
                                        <p className="text-slate-600 dark:text-slate-400">Complete your verification and pick up your first order. Earnings are daily.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-primary p-8 md:p-12 rounded-[2.5rem] shadow-2xl relative">
                            <div className="absolute -top-6 -right-6 w-24 h-24 bg-white dark:bg-accent-black rounded-full flex items-center justify-center transform rotate-12 shadow-xl">
                                <span className="text-3xl">🚀</span>
                            </div>
                            <h3 className="text-3xl font-extrabold text-black mb-8">Registration</h3>
                            <form className="space-y-4">
                                <div>
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        className="w-full px-6 py-4 rounded-2xl bg-white border-none focus:ring-4 focus:ring-black/10 text-slate-900 placeholder:text-slate-400 font-semibold"
                                    />
                                </div>
                                <div>
                                    <input
                                        type="email"
                                        placeholder="Email Address"
                                        className="w-full px-6 py-4 rounded-2xl bg-white border-none focus:ring-4 focus:ring-black/10 text-slate-900 placeholder:text-slate-400 font-semibold"
                                    />
                                </div>
                                <div>
                                    <input
                                        type="tel"
                                        placeholder="Phone Number (+1 000 000 00)"
                                        className="w-full px-6 py-4 rounded-2xl bg-white border-none focus:ring-4 focus:ring-black/10 text-slate-900 placeholder:text-slate-400 font-semibold"
                                    />
                                </div>
                                <div>
                                    <select className="w-full px-6 py-4 rounded-2xl bg-white border-none focus:ring-4 focus:ring-black/10 text-slate-900 font-semibold appearance-none">
                                        <option value="">Vehicle Type</option>
                                        <option value="bike">Bicycle</option>
                                        <option value="scooter">Scooter / Moped</option>
                                        <option value="car">Car</option>
                                        <option value="truck">Van / Light Truck</option>
                                    </select>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full py-5 bg-accent-black text-white font-extrabold rounded-2xl hover:scale-[1.02] active:scale-95 transition-all mt-4 text-lg shadow-xl"
                                >
                                    REGISTER NOW
                                </button>
                            </form>
                            <p className="text-center mt-6 text-black/60 text-sm font-semibold">
                                By clicking register, you agree to our Terms of Service.
                            </p>
                        </div>
                    </div>
                </section>

                {/* App Download / CTA Section */}
                <section className="pb-24 px-6 bg-background-light dark:bg-background-dark">
                    <div className="max-w-7xl mx-auto bg-primary rounded-[3rem] p-12 lg:p-20 flex flex-col lg:flex-row items-center gap-12 overflow-hidden relative shadow-2xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>

                        <div className="lg:w-1/2 z-10">
                            <h2 className="text-4xl md:text-5xl font-extrabold text-black mb-6">
                                Earn up to $200 / day delivering with GoDeliver
                            </h2>
                            <p className="text-black/70 text-lg font-semibold mb-10 max-w-md">
                                Deliver small parcels, groceries, and more in your city. Real-time earnings and local support at every step.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <button className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-2xl cursor-pointer hover:bg-slate-800 transition-all">
                                    <span className="material-icons-round">apple</span>
                                    <div className="text-left">
                                        <p className="text-[10px] uppercase font-bold opacity-60">Download on</p>
                                        <p className="font-bold leading-tight">App Store</p>
                                    </div>
                                </button>
                                <button className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-2xl cursor-pointer hover:bg-slate-800 transition-all">
                                    <span className="material-icons-round">play_arrow</span>
                                    <div className="text-left">
                                        <p className="text-[10px] uppercase font-bold opacity-60">Get it on</p>
                                        <p className="font-bold leading-tight">Google Play</p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div className="lg:w-1/2 flex justify-center lg:justify-end">
                            <div className="relative w-72 h-[500px] bg-black rounded-[3rem] p-4 shadow-2xl rotate-6 hover:rotate-0 transition-transform duration-700">
                                <div className="w-full h-full bg-slate-900 rounded-[2.5rem] overflow-hidden border-4 border-slate-800 flex flex-col">
                                    {/* App Header */}
                                    <div className="h-1/3 bg-primary p-6 relative">
                                        <div className="flex justify-between items-center mb-6">
                                            <span className="material-icons-round text-black">menu</span>
                                            <div className="w-8 h-8 rounded-full bg-black/20"></div>
                                        </div>
                                        <p className="text-black font-extrabold text-xl">Good Morning, Alex!</p>
                                        <div className="mt-4 bg-black rounded-xl p-3 flex justify-between items-center">
                                            <span className="text-primary text-xs font-bold tracking-wider">OFFLINE</span>
                                            <div className="w-10 h-5 bg-zinc-700 rounded-full relative">
                                                <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* App Body Placeholder */}
                                    <div className="p-4 space-y-4 flex-1 bg-slate-900">
                                        <div className="bg-zinc-800 h-24 rounded-2xl p-4 flex items-center gap-4 animate-pulse">
                                            <div className="w-12 h-12 bg-primary/20 rounded-xl"></div>
                                            <div className="space-y-2 flex-1">
                                                <div className="h-2 bg-zinc-700 rounded w-3/4"></div>
                                                <div className="h-2 bg-zinc-700 rounded w-1/2"></div>
                                            </div>
                                        </div>
                                        <div className="bg-zinc-800 h-24 rounded-2xl p-4 flex items-center gap-4 animate-pulse delay-150">
                                            <div className="w-12 h-12 bg-primary/20 rounded-xl"></div>
                                            <div className="space-y-2 flex-1">
                                                <div className="h-2 bg-zinc-700 rounded w-3/4"></div>
                                                <div className="h-2 bg-zinc-700 rounded w-1/2"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-white dark:bg-black py-12 border-t border-gray-100 dark:border-gray-900 transition-colors duration-300">
                    <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <span className="material-icons-round text-black text-sm">local_shipping</span>
                            </div>
                            <span className="text-xl font-extrabold tracking-tighter text-slate-900 dark:text-white">
                                GODELIVER
                            </span>
                        </div>

                        <div className="flex gap-8 text-sm font-bold text-slate-500">
                            <a href="#" className="hover:text-primary transition-colors">About</a>
                            <a href="#" className="hover:text-primary transition-colors">Safety</a>
                            <a href="#" className="hover:text-primary transition-colors">Terms</a>
                            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
                        </div>

                        <div className="flex gap-4">
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-100 dark:bg-card-dark flex items-center justify-center hover:bg-primary transition-colors group">
                                <span className="material-icons-round text-slate-500 group-hover:text-black">facebook</span>
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-100 dark:bg-card-dark flex items-center justify-center hover:bg-primary transition-colors group">
                                <span className="material-icons-round text-slate-500 group-hover:text-black">alternate_email</span>
                            </a>
                        </div>
                    </div>
                    <div className="text-center mt-12 text-slate-400 text-xs font-semibold">
                        © {new Date().getFullYear()} GoDeliver Logistics Inc. All rights reserved.
                    </div>
                </footer>
            </main>
        </div>
    );
}
