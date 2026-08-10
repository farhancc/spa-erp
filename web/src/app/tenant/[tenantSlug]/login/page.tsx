"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getTenantBySlug, getTenantHref } from "../../../../shared/utils/utils";
import Link from "next/link";
import { Sparkles, Mail, Lock, CheckCircle2, ChevronLeft, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function TenantCustomerLogin() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantSlug = (params?.tenantSlug as string) || "luxcuts";
  const redirectPath = searchParams.get("redirect") || "";

  const [businessName, setBusinessName] = useState("Storefront");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Theme states
  const [activeTemplate, setActiveTemplate] = useState<"LUXURY" | "MINIMAL" | "SPA" | "BARBER" | "WELLNESS">("LUXURY");
  const [accentColor, setAccentColor] = useState<"gold" | "rose" | "emerald" | "amber">("gold");
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    getTenantBySlug(tenantSlug).then((match) => {
      if (match) {
        setBusinessName(match.name);
        if (match.activeTemplate) setActiveTemplate(match.activeTemplate);
        if (match.accentColor) setAccentColor(match.accentColor);
        if (match.logoUrl) setLogoUrl(match.logoUrl);
      }
    });
  }, [tenantSlug]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.title = `Sign In | ${businessName}`;
    }
  }, [businessName]);

  const themeClasses = {
    LUXURY: {
      bg: "bg-slate-950 text-slate-100",
      accent: {
        gold: "text-amber-400 border-amber-400/20 bg-amber-400/10 focus:ring-amber-500",
        rose: "text-rose-400 border-rose-400/20 bg-rose-400/10 focus:ring-rose-500",
        emerald: "text-emerald-400 border-emerald-400/20 bg-emerald-400/10 focus:ring-emerald-500",
        amber: "text-orange-400 border-orange-400/20 bg-orange-400/10 focus:ring-orange-500"
      },
      gradientAccent: {
        gold: "from-amber-400 via-amber-200 to-amber-500",
        rose: "from-rose-400 via-rose-300 to-rose-500",
        emerald: "from-emerald-400 via-emerald-300 to-emerald-500",
        amber: "from-orange-400 via-yellow-400 to-orange-500"
      },
      buttonAccent: {
        gold: "bg-amber-500 hover:bg-amber-600 shadow-amber-500/10 text-slate-950",
        rose: "bg-rose-500 hover:bg-rose-600 shadow-rose-500/10 text-white",
        emerald: "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/10 text-slate-950",
        amber: "bg-orange-500 hover:bg-orange-600 shadow-orange-500/10 text-white"
      },
      font: "font-sans tracking-tight",
      card: "bg-slate-900/40 border-slate-900 backdrop-blur-md",
      nav: "border-b border-slate-900 bg-slate-950/80"
    },
    MINIMAL: {
      bg: "bg-neutral-50 text-neutral-900",
      accent: {
        gold: "text-stone-900 border-stone-250 bg-stone-105 focus:ring-stone-500",
        rose: "text-stone-900 border-stone-250 bg-stone-105 focus:ring-stone-500",
        emerald: "text-stone-900 border-stone-250 bg-stone-105 focus:ring-stone-500",
        amber: "text-stone-900 border-stone-250 bg-stone-105 focus:ring-stone-500"
      },
      gradientAccent: {
        gold: "from-stone-900 to-stone-700",
        rose: "from-stone-900 to-stone-700",
        emerald: "from-stone-900 to-stone-700",
        amber: "from-stone-900 to-stone-700"
      },
      buttonAccent: {
        gold: "bg-stone-900 hover:bg-stone-850 text-white shadow-none",
        rose: "bg-stone-900 hover:bg-stone-850 text-white shadow-none",
        emerald: "bg-stone-900 hover:bg-stone-850 text-white shadow-none",
        amber: "bg-stone-900 hover:bg-stone-850 text-white shadow-none"
      },
      font: "font-mono tracking-normal",
      card: "bg-white border-neutral-200",
      nav: "border-b border-neutral-200 bg-white/80"
    },
    SPA: {
      bg: "bg-[#f4f7f6] text-[#2c3e35]",
      accent: {
        gold: "text-teal-700 border-teal-650/20 bg-teal-50 focus:ring-teal-500",
        rose: "text-rose-700 border-rose-650/20 bg-rose-50 focus:ring-rose-500",
        emerald: "text-emerald-700 border-emerald-650/20 bg-emerald-50 focus:ring-emerald-500",
        amber: "text-[#6b7c6c] border-[#6b7c6c]/20 bg-[#f0f4f1] focus:ring-slate-500"
      },
      gradientAccent: {
        gold: "from-teal-800 to-teal-600",
        rose: "from-rose-800 to-rose-600",
        emerald: "from-emerald-800 to-emerald-600",
        amber: "from-[#6b7c6c] to-[#4e5d4f]"
      },
      buttonAccent: {
        gold: "bg-teal-750 hover:bg-teal-800 text-white shadow-none",
        rose: "bg-rose-750 hover:bg-rose-850 text-white shadow-none",
        emerald: "bg-emerald-750 hover:bg-emerald-800 text-white shadow-none",
        amber: "bg-[#6b7c6c] hover:bg-[#566557] text-white shadow-none"
      },
      font: "font-serif tracking-normal",
      card: "bg-white border-teal-100",
      nav: "border-b border-teal-50 bg-[#f4f7f6]/85"
    },
    BARBER: {
      bg: "bg-zinc-950 text-zinc-100",
      accent: {
        gold: "text-amber-500 border-amber-500/20 bg-amber-500/10 focus:ring-amber-500",
        rose: "text-red-500 border-red-500/20 bg-red-500/10 focus:ring-red-500",
        emerald: "text-cyan-500 border-cyan-500/20 bg-cyan-500/10 focus:ring-cyan-500",
        amber: "text-blue-500 border-blue-500/20 bg-blue-500/10 focus:ring-blue-500"
      },
      gradientAccent: {
        gold: "from-amber-500 to-yellow-600",
        rose: "from-red-500 to-orange-600",
        emerald: "from-cyan-500 to-blue-600",
        amber: "from-blue-500 to-indigo-600"
      },
      buttonAccent: {
        gold: "bg-amber-500 hover:bg-amber-600 text-black shadow-lg",
        rose: "bg-red-500 hover:bg-red-600 text-white shadow-lg",
        emerald: "bg-cyan-500 hover:bg-cyan-600 text-black shadow-lg",
        amber: "bg-blue-500 hover:bg-blue-600 text-white shadow-lg"
      },
      font: "font-sans uppercase tracking-widest font-semibold",
      card: "bg-zinc-900 border-zinc-800",
      nav: "border-b border-zinc-900 bg-zinc-950/80"
    },
    WELLNESS: {
      bg: "bg-[#faf8f5] text-[#2c1d11]",
      accent: {
        gold: "text-amber-800 border-amber-800/20 bg-amber-50 focus:ring-amber-500",
        rose: "text-rose-700 border-rose-700/20 bg-rose-50 focus:ring-rose-500",
        emerald: "text-emerald-700 border-emerald-700/20 bg-emerald-50 focus:ring-emerald-500",
        amber: "text-[#6b5847] border-[#6b5847]/20 bg-[#fbf9f6] focus:ring-amber-650"
      },
      gradientAccent: {
        gold: "from-amber-700 to-amber-500",
        rose: "from-rose-700 to-rose-500",
        emerald: "from-emerald-700 to-emerald-500",
        amber: "from-[#8c6d53] to-[#6b5847]"
      },
      buttonAccent: {
        gold: "bg-amber-800 hover:bg-amber-900 text-white shadow-none",
        rose: "bg-[#b07d50] hover:bg-[#96673f] text-white shadow-none",
        emerald: "bg-emerald-750 hover:bg-emerald-800 text-white shadow-none",
        amber: "bg-[#8c6d53] hover:bg-[#735942] text-white shadow-none"
      },
      font: "font-sans tracking-tight",
      card: "bg-white border-[#f0eae1] shadow-sm",
      nav: "border-b border-[#f0eae1] bg-[#faf8f5]/90"
    }
  };

  const currentTheme = themeClasses[activeTemplate as keyof typeof themeClasses] || themeClasses.LUXURY;

  const inputClasses = 
    activeTemplate === 'MINIMAL' ? 'bg-white border-stone-200 focus:border-stone-500 text-stone-900 placeholder:text-stone-400' :
    activeTemplate === 'SPA' ? 'bg-white border-teal-100 focus:border-teal-350 text-[#2c3e35] placeholder:text-teal-300' :
    activeTemplate === 'BARBER' ? 'bg-zinc-950 border-zinc-800 focus:border-zinc-600 text-zinc-100 placeholder:text-zinc-750' :
    activeTemplate === 'WELLNESS' ? 'bg-white border-[#f0eae1] focus:border-amber-800 text-[#2c1d11] placeholder:text-[#a69688]' :
    'bg-slate-950 border-slate-850 focus:border-slate-700 text-slate-200 placeholder:text-slate-650';

  const backLinkClasses = 
    activeTemplate === 'MINIMAL' ? 'text-stone-500 hover:text-stone-900' :
    activeTemplate === 'SPA' ? 'text-teal-600 hover:text-teal-800' :
    activeTemplate === 'WELLNESS' ? 'text-amber-800 hover:text-amber-900' :
    'text-slate-400 hover:text-slate-200';

  const labelClasses = 
    activeTemplate === 'MINIMAL' ? 'text-stone-500' :
    activeTemplate === 'SPA' ? 'text-teal-700' :
    'text-slate-400';

  const accentTextClass = 
    activeTemplate === "MINIMAL" ? "text-stone-900 font-bold" : 
    activeTemplate === "SPA" ? "text-teal-750" : 
    accentColor === "gold" ? "text-amber-400" :
    accentColor === "rose" ? "text-rose-455" :
    accentColor === "emerald" ? "text-emerald-400" :
    "text-orange-400"; // amber

  const badgeClasses = 
    activeTemplate === 'MINIMAL' ? 'bg-stone-100 text-stone-700 border-stone-200' :
    activeTemplate === 'SPA' ? 'bg-teal-50 text-teal-700 border-teal-100' :
    activeTemplate === 'BARBER' ? 'bg-zinc-900 text-zinc-300 border-zinc-800' :
    'bg-rose-500/10 text-rose-400 border-rose-500/20';

  const orbs = 
    activeTemplate === "MINIMAL" ? null :
    activeTemplate === "SPA" ? (
      <>
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-teal-500/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
      </>
    ) : activeTemplate === "BARBER" ? (
      <>
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />
      </>
    ) : (
      <>
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-rose-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />
      </>
    );

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Try backend authentication
    try {
      const response = await fetch("/api/customers/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug: tenantSlug,
          email: email,
          password: password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.ok && data.customer) {
          localStorage.setItem(`tenant_user_session_${tenantSlug}`, JSON.stringify(data.customer));
          setSuccess("Authentication successful! Redirecting...");
          
          setTimeout(() => {
            if (redirectPath === "booking") {
              window.location.href = getTenantHref(tenantSlug, "/booking");
            } else if (redirectPath && redirectPath !== "account") {
              window.location.href = redirectPath.startsWith("/") ? redirectPath : `/${redirectPath}`;
            } else {
              // Default: send customers to their account dashboard
              window.location.href = getTenantHref(tenantSlug, "/account");
            }
          }, 1000);
          return;
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        // Try authenticating as tenant owner/admin/manager
        try {
          const adminResponse = await fetch("/api/tenants/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              slug: tenantSlug,
              email: email,
              password: password,
            }),
          });
          if (adminResponse.ok) {
            const adminData = await adminResponse.json();
            if (adminData.ok && adminData.user) {
              localStorage.setItem(`owner_admin_session_${tenantSlug}`, "authenticated");
              setSuccess("Recognized administrator session! Redirecting to Admin Panel...");
              setTimeout(() => {
                window.location.href = getTenantHref(tenantSlug, "/admin");
              }, 1000);
              return;
            }
          }
        } catch (adminErr) {
          console.warn("Admin fallback login attempt failed:", adminErr);
        }

        setError(errData.error || "Incorrect credentials. Please try again.");
      }
    } catch (err) {
      setError("Failed to connect to authentication server. Please try again later.");
      console.error("Login connection error:", err);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col justify-center items-center px-6 py-12 relative overflow-hidden transition-colors duration-300 ${currentTheme.bg} ${currentTheme.font}`}>
      {/* Background Orbs */}
      {orbs}

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 space-y-8">
        
        {/* Back Link */}
        <div className="flex justify-start">
          <a
            href={isMounted ? getTenantHref(tenantSlug, "/") : "/"}
            className={`flex items-center gap-1.5 text-xs font-bold transition-colors group ${backLinkClasses}`}
          >
            <ChevronLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Storefront</span>
          </a>
        </div>

        {/* Brand Header */}
        <div className="text-center space-y-2.5">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] uppercase font-bold tracking-widest ${badgeClasses}`}>
            <Sparkles className="size-3" />
            <span>Member Gate</span>
          </div>
          <div className="flex flex-col items-center justify-center gap-2">
            {logoUrl ? (
              <img src={logoUrl} alt={businessName} className="h-10 w-auto object-contain max-w-[150px] rounded mb-1" />
            ) : (
              <h1 className={`text-3xl font-black uppercase tracking-tight ${accentTextClass}`}>
                {businessName}
              </h1>
            )}
            <p className="text-xs opacity-60">Sign in to your customer membership account</p>
          </div>
        </div>

        {/* Form Card */}
        <div className={`rounded-3xl p-8 border shadow-2xl transition-all duration-300 space-y-6 ${currentTheme.card}`}>
          <h2 className="text-lg font-bold tracking-tight">Access Dashboard</h2>

          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-455 rounded-xl text-xs font-bold leading-relaxed">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-455 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="size-4.5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-1.5">
              <label className={`block text-[10px] font-bold uppercase tracking-widest ${labelClasses}`}>Email or Phone</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="size-4" />
                </span>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. name@example.com or +919988877777"
                  className={`w-full border rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold outline-none transition-all ${inputClasses}`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className={`block text-[10px] font-bold uppercase tracking-widest ${labelClasses}`}>Password</label>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="size-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full border rounded-xl py-2.5 pl-10 pr-10 text-xs font-semibold outline-none transition-all ${inputClasses}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-350 transition-colors"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={`w-full py-3 text-xs uppercase font-extrabold tracking-widest rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer mt-6 shadow-lg ${
                activeTemplate === 'MINIMAL' ? 'bg-black text-white hover:bg-stone-850' : 
                activeTemplate === 'SPA' ? 'bg-teal-750 hover:bg-teal-800 text-white shadow-none' : 
                activeTemplate === 'BARBER' ? 'bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black shadow-cyan-500/10' : 
                currentTheme.buttonAccent[accentColor]
              }`}
            >
              <span>Verify Credentials</span>
              <ArrowRight className="size-3.5" />
            </button>
          </form>

          <div className={`pt-5 border-t flex justify-between items-center text-[11px] ${
            activeTemplate === 'MINIMAL' ? 'border-stone-150' : 
            activeTemplate === 'SPA' ? 'border-teal-50' : 
            'border-slate-900/60'
          }`}>
            <span className="opacity-55">New to this brand?</span>
            <Link
              href={isMounted ? getTenantHref(tenantSlug, `/signup${redirectPath ? `?redirect=${redirectPath}` : ""}`) : `/signup${redirectPath ? `?redirect=${redirectPath}` : ""}`}
              className={`font-bold uppercase tracking-wider transition-colors ${
                activeTemplate === 'MINIMAL' ? 'text-stone-900 hover:text-stone-600' :
                activeTemplate === 'SPA' ? 'text-teal-750 hover:text-teal-900' :
                activeTemplate === 'BARBER' ? 'text-cyan-500 hover:text-cyan-400' :
                accentColor === 'gold' ? 'text-amber-400 hover:text-amber-300' :
                accentColor === 'rose' ? 'text-rose-400 hover:text-rose-300' :
                accentColor === 'emerald' ? 'text-emerald-400 hover:text-emerald-300' :
                'text-orange-400 hover:text-orange-300'
              }`}
            >
              Create Account
            </Link>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[10px] opacity-40">
          Secure Tenant Isolation. Protected by Careva SaaS Core.
        </div>

      </div>
    </div>
  );
}
