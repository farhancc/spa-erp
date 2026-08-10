"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles, ArrowRight, Globe, Shield, CheckCircle,
  User, Mail, Phone, Building2, MapPin, Store, Lock, Eye, EyeOff, AlertCircle
} from "lucide-react";
import { getSharedTenants, saveSharedTenant } from "../../shared/utils/utils";

export default function SignupPage() {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Super admin gate
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);

  // Signup form
  const [ownerName, setOwnerName] = useState("");
  const [salonName, setSalonName] = useState("");
  const [slug, setSlug] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [outlets, setOutlets] = useState("1");
  const [plan, setPlan] = useState("Growth Plan");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/superadmin/login", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setIsSuperAdmin(true);
        }
      })
      .catch(console.error);
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoading(true);
    setAdminError("");
    try {
      const res = await fetch("/api/superadmin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      });
      const data = await res.json();
      if (data.ok) {
        setIsSuperAdmin(true);
      } else {
        setAdminError(data.error || "Invalid credentials.");
      }
    } catch {
      setAdminError("Failed to verify credentials. Please try again.");
    } finally {
      setAdminLoading(false);
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!ownerPassword) {
      setFormError("Owner Password is required.");
      return;
    }

    if (ownerPassword.length < 8) {
      setFormError("Owner Password must be at least 8 characters long.");
      return;
    }

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!cleanSlug) {
      setFormError("Subdomain slug is required.");
      return;
    }

    if (ownerPassword === `${cleanSlug}@123` || ownerPassword === "password123") {
      setFormError("Owner Password cannot be a weak default value.");
      return;
    }

    const asyncSubmit = async () => {
      const current = await getSharedTenants();

      const isDuplicate = current.some(
        (t: { slug: string; name: string }) =>
          t.slug.toLowerCase() === cleanSlug ||
          t.name.toLowerCase() === salonName.toLowerCase()
      );

      if (isDuplicate) {
        setFormError("Salon name or slug already exists.");
        return;
      }

      const planPrices: Record<string, number> = {
        "Essential Plan": 999,
        "Growth Plan": 2499,
        "Premium Plan": 4999,
      };

      const newTenant = {
        id: `ten_${Date.now()}`,
        name: salonName,
        slug: cleanSlug,
        planName: plan.replace(" Plan", ""),
        monthlyPrice: planPrices[plan] || 2499,
        outletsCount: Number(outlets),
        isActive: true,
        onboardedAt: new Date().toISOString().split("T")[0],
        email,
        phone: phone || "+91 99999 99999",
        ownerName,
        city,
        role: "OWNER",
        ownerPassword, // Sent to backend API, stripped when storing to local cache
      };

      await saveSharedTenant(newTenant);
      setLoading(true);

      setTimeout(() => {
        const disableSubdomainRedirect = process.env.NEXT_PUBLIC_DISABLE_SUBDOMAIN_REDIRECT === 'true';
        if (disableSubdomainRedirect) {
          window.location.href = `/tenant/${cleanSlug}`;
        } else {
          const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || "lvh.me";
          const port = window.location.port ? `:${window.location.port}` : "";
          window.location.href = `http://${cleanSlug}.${domain}${port}`;
        }
      }, 800);
    };

    asyncSubmit();
  };

  const planOptions = [
    { value: "Essential Plan", label: "Essential", price: "₹999/mo", color: "text-slate-400" },
    { value: "Growth Plan", label: "Growth", price: "₹2,499/mo", color: "text-amber-400" },
    { value: "Premium Plan", label: "Premium", price: "₹4,999/mo", color: "text-purple-400" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex items-center justify-center px-4 py-12 relative overflow-hidden selection:bg-rose-500 selection:text-white">

      {/* BG */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[60%] rounded-full bg-gradient-to-bl from-rose-600/15 to-amber-600/10 blur-[130px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[50%] rounded-full bg-gradient-to-tr from-rose-600/10 to-purple-600/10 blur-[100px]" />
      </div>

      <div className="w-full max-w-lg relative z-10">

        {/* Logo */}
        <div className="text-center mb-8 space-y-2">
          <Link href="/" className="inline-flex flex-col items-center gap-2 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center shadow-xl shadow-rose-500/20 group-hover:scale-105 transition-transform">
              <Store className="size-6 text-white" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-rose-400 to-amber-400 bg-clip-text text-transparent">
              Careva
            </span>
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-slate-100">Launch Your Salon</h1>
            <p className="text-xs text-slate-500 mt-1">Provision a branded subdomain for your business</p>
          </div>
        </div>

        {/* ── GATE: Super Admin Auth ── */}
        {!isSuperAdmin ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-sm space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Shield className="size-5" />
              </div>
              <div>
                <p className="font-bold text-slate-100 text-sm">Admin Authorization Required</p>
                <p className="text-[10px] text-slate-500">Salon registration requires Super Admin approval</p>
              </div>
            </div>

            {adminError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl p-3 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{adminError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admin Email</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="admin@careva.in"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500/50 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-slate-100 outline-none transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                  <input
                    type={showAdminPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500/50 rounded-xl py-3 pl-10 pr-12 text-sm font-medium text-slate-100 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showAdminPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={adminLoading}
                className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-amber-500 text-white font-extrabold text-sm rounded-xl hover:opacity-95 shadow-lg shadow-rose-500/15 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer mt-2"
              >
                {adminLoading ? (
                  <><Sparkles className="size-4 animate-spin" /> Verifying...</>
                ) : (
                  <>Authorize & Continue <ArrowRight className="size-4" /></>
                )}
              </button>
            </form>

            <p className="text-center text-[10px] text-slate-600 pt-2 border-t border-slate-800">
              Already an admin?{" "}
              <Link href="/login" className="text-emerald-500 hover:text-emerald-400 font-bold transition-colors">
                Go to Admin Login
              </Link>
            </p>
          </div>
        ) : (
          /* ── SIGNUP FORM ── */
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-sm space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle className="size-5" />
              </div>
              <div>
                <p className="font-bold text-slate-100 text-sm">Admin Verified — Register Salon</p>
                <p className="text-[10px] text-slate-500">Fill in salon details to provision the subdomain</p>
              </div>
            </div>

            {formError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl p-3 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4">

              {/* Owner Name */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Owner Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Farhan"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500/50 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-slate-100 outline-none transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>

              {/* Salon Name */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Salon Business Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lavender Spa & Salon"
                    value={salonName}
                    onChange={(e) => {
                      setSalonName(e.target.value);
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""));
                    }}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500/50 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-slate-100 outline-none transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>

              {/* Subdomain */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subdomain Slug</label>
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl overflow-hidden focus-within:border-rose-500/50 transition-all">
                  <Globe className="size-4 text-slate-500 ml-3.5 shrink-0" />
                  <input
                    type="text"
                    required
                    placeholder="lavender"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
                    className="flex-1 bg-transparent py-3 px-3 text-sm font-medium text-slate-100 outline-none placeholder:text-slate-600"
                  />
                  <span className="bg-slate-900 border-l border-slate-800 text-[10px] font-bold text-slate-500 px-4 py-3 font-mono whitespace-nowrap">.careva.in</span>
                </div>
              </div>

              {/* City + Outlets */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Salon City</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Calicut"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500/50 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-slate-100 outline-none transition-all placeholder:text-slate-600"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Outlets</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="20"
                    value={outlets}
                    onChange={(e) => setOutlets(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500/50 rounded-xl py-3 px-4 text-sm font-medium text-slate-100 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Plan */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subscription Plan</label>
                <div className="grid grid-cols-3 gap-2">
                  {planOptions.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPlan(p.value)}
                      className={`rounded-xl border py-3 px-2 text-center cursor-pointer transition-all ${
                        plan === p.value
                          ? "border-rose-500/50 bg-rose-500/10"
                          : "border-slate-800 bg-slate-950 hover:border-slate-700"
                      }`}
                    >
                      <p className={`text-xs font-extrabold ${plan === p.value ? "text-rose-400" : p.color}`}>{p.label}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{p.price}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Email + Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      placeholder="owner@salon.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500/50 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-slate-100 outline-none transition-all placeholder:text-slate-600"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="+91 99999 55555"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500/50 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-slate-100 outline-none transition-all placeholder:text-slate-600"
                    />
                  </div>
                </div>
              </div>

              {/* Owner Password */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Owner Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                  <input
                    type={showOwnerPassword ? "text" : "password"}
                    required
                    placeholder="Minimum 8 characters"
                    value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500/50 rounded-xl py-3 pl-10 pr-12 text-sm font-medium text-slate-100 outline-none transition-all placeholder:text-slate-655"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    {showOwnerPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-amber-500 text-white font-extrabold text-sm rounded-xl hover:opacity-95 shadow-lg shadow-rose-500/15 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer mt-2"
              >
                {loading ? (
                  <><Sparkles className="size-4 animate-spin" /> Provisioning Subdomain...</>
                ) : (
                  <>Deploy Salon Container <ArrowRight className="size-4" /></>
                )}
              </button>
            </form>

            <p className="text-center text-[10px] text-slate-600 pt-2 border-t border-slate-800">
              Already have a salon?{" "}
              <Link href="/login" className="text-emerald-500 hover:text-emerald-400 font-bold transition-colors">
                Go to Admin Login
              </Link>
            </p>
          </div>
        )}

        <div className="text-center mt-6 text-xs text-slate-600">
          <Link href="/" className="hover:text-slate-400 transition-colors">← Back to Marketing Site</Link>
        </div>
      </div>
    </div>
  );
}
