"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Shield, Sparkles, LayoutDashboard, Settings, Layers, LogOut, Terminal, Activity, Mail } from "lucide-react";

function SuperAdminSidebar({
  isLoggedIn,
  handleLogout,
}: {
  isLoggedIn: boolean;
  handleLogout: () => void;
}) {
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view") || "monitor";

  return (
    <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-900 bg-slate-950/60 backdrop-blur-md flex flex-col justify-between shrink-0 p-6">
      <div className="space-y-8">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img src="/logo-icon.png" alt="Careva Logo" className="w-9 h-9 object-contain rounded-xl shadow-lg shadow-emerald-500/20" />
          <div>
            <span className="font-black text-xl tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Careva
            </span>
            <span className="text-[9px] block font-mono tracking-widest text-slate-500 font-extrabold -mt-1.5 uppercase">Super Admin</span>
          </div>
        </div>

        {/* Nav List */}
        <nav className="space-y-1.5 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 gap-2 md:gap-0 select-none no-scrollbar w-full">
          <Link 
            href="/superadmin?view=monitor"
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all border ${
              currentView === "monitor"
                ? "bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-400 shadow-sm shadow-emerald-500/5"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
            }`}
          >
            <LayoutDashboard className="size-4" />
            <span>Platform Monitor</span>
          </Link>
          <Link 
            href="/superadmin?view=leads"
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all border ${
              currentView === "leads"
                ? "bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-400 shadow-sm shadow-emerald-500/5"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
            }`}
          >
            <Mail className="size-4" />
            <span>Demo Requests</span>
          </Link>
          <Link 
            href="/superadmin?view=plans"
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all border ${
              currentView === "plans"
                ? "bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-400 shadow-sm shadow-emerald-500/5"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
            }`}
          >
            <Layers className="size-4" />
            <span>SaaS Pricing Plans</span>
          </Link>
          <Link 
            href="/superadmin?view=settings"
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all border ${
              currentView === "settings"
                ? "bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-400 shadow-sm shadow-emerald-500/5"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
            }`}
          >
            <Settings className="size-4" />
            <span>System Settings</span>
          </Link>
        </nav>
      </div>

      {/* Back Link */}
      <div className="pt-6 border-t border-slate-900 mt-6 md:mt-0 flex md:flex-col gap-3 justify-between items-center md:items-stretch">
        <div className="flex items-center gap-2.5 mb-2 md:mb-0">
          <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] font-black text-slate-350 shrink-0">
            SA
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-extrabold text-slate-300">Super Administrator</p>
            <p className="text-[10px] text-slate-500 font-mono">platform@careva.in</p>
          </div>
        </div>
        
        {isLoggedIn ? (
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900/30 hover:bg-rose-950/20 border border-slate-850 hover:border-rose-900/30 text-slate-400 hover:text-rose-400 text-xs font-bold transition-all active:scale-[0.98] w-full cursor-pointer"
          >
            <LogOut className="size-3.5" />
            <span>Sign Out</span>
          </button>
        ) : (
          <Link 
            href="/"
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900/50 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 text-slate-450 hover:text-slate-300 text-xs font-bold transition-all active:scale-[0.98] w-full"
          >
            <LogOut className="size-3.5" />
            <span>Marketing Website</span>
          </Link>
        )}
      </div>
    </aside>
  );
}

function MainHeader() {
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view") || "monitor";

  const titles = {
    monitor: {
      title: "Platform Control Desk",
      desc: "Real-time SaaS telemetry, business tenant mapping, and workspace administration"
    },
    leads: {
      title: "Demo Request Leads",
      desc: "Track and review free demo requests submitted by salon businesses on the landing page"
    },
    plans: {
      title: "Subscription pricing Modeler",
      desc: "Fine-tune global revenue model, customize tier features, and manage active pricing structures"
    },
    settings: {
      title: "Core System Settings",
      desc: "Super admin feature toggles, environment configs, and platform health dashboard"
    }
  };

  const currentInfo = titles[currentView as keyof typeof titles] || titles.monitor;

  return (
    <header className="px-8 py-5 border-b border-slate-900 flex justify-between items-center bg-slate-950/40 backdrop-blur-md sticky top-0 z-40">
      <div>
        <h1 className="font-black text-xl md:text-2xl text-slate-100 tracking-tight">{currentInfo.title}</h1>
        <p className="text-xs text-slate-500 mt-0.5">{currentInfo.desc}</p>
      </div>
      <div className="flex items-center gap-2 text-xs font-bold px-3.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        SaaS Core Active
      </div>
    </header>
  );
}

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Always start false on both server and client (SSR-safe).
  // After hydration, useEffect reads localStorage and updates state.
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Read optimistic state from localStorage immediately after mount
    const cachedLogin = localStorage.getItem("super_admin_logged_in") === "true";
    setIsLoggedIn(cachedLogin);
    setMounted(true);

    // Background server-side session verification
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    fetch("/api/superadmin/login", { signal: controller.signal, credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        clearTimeout(timeout);
        if (data.ok) {
          setIsLoggedIn(true);
          localStorage.setItem("super_admin_logged_in", "true");
          window.dispatchEvent(new Event("super_admin_login"));
        } else {
          setIsLoggedIn(false);
          localStorage.setItem("super_admin_logged_in", "false");
          window.dispatchEvent(new Event("super_admin_login"));
        }
      })
      .catch((e) => {
        clearTimeout(timeout);
        console.warn("Superadmin session check failed, using cached state:", e);
      });

    // Listen for login/logout events dispatched elsewhere
    const handleLoginUpdate = () => {
      setIsLoggedIn(localStorage.getItem("super_admin_logged_in") === "true");
    };
    window.addEventListener("super_admin_login", handleLoginUpdate);
    return () => window.removeEventListener("super_admin_login", handleLoginUpdate);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/superadmin/login", { method: "DELETE" });
    } catch (e) {
      console.error(e);
    }
    localStorage.setItem("super_admin_logged_in", "false");
    setIsLoggedIn(false);
    window.location.reload();
  };

  // Before hydration completes, render a neutral state that matches SSR output.
  // This prevents the "server: login gate / client: dashboard" mismatch.
  if (!mounted) {
    return (
      <div className="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Shield className="size-5 text-emerald-400" />
          </div>
          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest font-bold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="bg-slate-950 text-slate-100 min-h-screen font-sans selection:bg-rose-500 selection:text-white relative overflow-hidden">
        {/* Background glow highlights */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] rounded-full bg-teal-500/5 blur-[120px] pointer-events-none" />
        <Suspense fallback={<div className="p-8 text-center text-xs">Loading login gate...</div>}>
          {children}
        </Suspense>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen font-sans flex flex-col md:flex-row selection:bg-rose-500 selection:text-white relative overflow-hidden">
      {/* Background glow highlights */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] rounded-full bg-teal-500/5 blur-[120px] pointer-events-none" />
      
      <Suspense fallback={<div className="p-8 text-center text-xs">Loading sidebar...</div>}>
        <SuperAdminSidebar isLoggedIn={isLoggedIn} handleLogout={handleLogout} />
      </Suspense>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 z-10">
        <Suspense fallback={<div className="p-8 text-center text-xs">Loading header...</div>}>
          <MainHeader />
        </Suspense>
        
        <div className="flex-1 p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <Suspense fallback={
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500" />
            </div>
          }>
            {children}
          </Suspense>
        </div>
      </main>
    </div>
  );
}
