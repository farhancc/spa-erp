"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, Lock, User, ArrowRight, Sparkles, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check for existing server-side session (HTTP-only cookie) instead of localStorage
    fetch("/api/superadmin/login")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) window.location.href = "/superadmin";
      })
      .catch(() => {/* no session */});
  }, []);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/superadmin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        window.location.href = "/superadmin";
      } else {
        setError(data.error || "Invalid email or password. Please try again.");
        setLoading(false);
      }
    } catch {
      setError("Unable to connect to server. Please try again.");
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex items-center justify-center px-4 relative overflow-hidden selection:bg-emerald-500 selection:text-white">
      
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-gradient-to-br from-emerald-600/20 to-teal-600/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[50%] rounded-full bg-gradient-to-tl from-emerald-600/15 to-teal-600/10 blur-[100px]" />
      </div>

      {/* Card */}
      <div className="w-full max-w-md relative z-10">
        
        {/* Logo */}
        <div className="text-center mb-8 space-y-3">
          <Link href="/" className="inline-flex flex-col items-center gap-2 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-xl shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Shield className="size-6 text-white" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Careva
            </span>
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-slate-100">Super Admin Login</h1>
            <p className="text-xs text-slate-500 mt-1">Sign in to access the platform control desk</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-sm space-y-5">
          
          {/* Error */}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl p-3 text-xs font-bold flex items-center gap-2">
              <Shield className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="admin@careva.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-slate-100 outline-none transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-xl py-3 pl-10 pr-12 text-sm font-medium text-slate-100 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold text-sm rounded-xl hover:opacity-95 shadow-lg shadow-emerald-500/15 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <Sparkles className="size-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Unlock Control Desk
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="pt-2 border-t border-slate-800 text-center">
            <p className="text-[10px] text-slate-600">
              Credentials: Use configured environment variables
            </p>
          </div>
        </div>

        {/* Footer link */}
        <div className="text-center mt-6 text-xs text-slate-600">
          <Link href="/" className="hover:text-slate-400 transition-colors">← Back to Marketing Site</Link>
        </div>

      </div>
    </div>
  );
}
