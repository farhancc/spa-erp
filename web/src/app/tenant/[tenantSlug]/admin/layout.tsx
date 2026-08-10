"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  Receipt, Sparkles, Shield, LogOut, Sliders, Smartphone, Lock, User, Eye, EyeOff, 
  ArrowRight, AlertCircle, Users, Calendar, Scissors, ShoppingBag, BarChart3, CalendarDays, 
  Award, Tag, MessageSquare, Clock, Globe, Laptop, HelpCircle, ChevronRight, Activity,
  Coins, FileText, Menu, X, Gift, Bell, CheckCircle
} from "lucide-react";
import { getTenantBySlug } from "../../../../shared/utils/utils";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  badge?: string;
}

const navItems: readonly NavItem[] = [
  { id: "POS", label: "POS Console", icon: Receipt, badge: "Live" },
  { id: "CRM", label: "CRM Matrix", icon: Users },
  { id: "BOOKINGS", label: "Bookings List", icon: Calendar },
  { id: "SERVICES", label: "Services Catalog", icon: Scissors },
  { id: "PRODUCTS", label: "Product Shelf", icon: ShoppingBag },
  { id: "PAYROLL", label: "Payroll & Clock", icon: Coins, badge: "Staff" },
  { id: "CONSENTS", label: "Treatment Consents", icon: FileText },
  { id: "LOYALTY", label: "Loyalty Program", icon: Gift },
  { id: "SUBSCRIPTIONS", label: "Subscriptions", icon: Award },
  { id: "COUPONS", label: "Coupon Registry", icon: Tag },
  { id: "WHATSAPP", label: "WhatsApp CRM", icon: MessageSquare, badge: "New" },
  { id: "CMS", label: "CMS Settings", icon: Sliders },
  { id: "REPORTS", label: "Analytics Reports", icon: BarChart3 },
  { id: "SCHEDULE", label: "Staff Schedule", icon: CalendarDays },
  { id: "AUDIT", label: "Audit Logs", icon: Activity },
];

interface PlanModel {
  name: string;
  price: number;
  features: string[];
}

function hasFeature(planFeatures: string[], tabId: string): boolean {
  const normFeatures = planFeatures.map(f => f.toLowerCase().trim());
  switch (tabId) {
    case "POS":
      return normFeatures.some(f => f.includes("billing") || f.includes("pos"));
    case "CRM":
      return normFeatures.some(f => f.includes("customer") || f.includes("crm") || f.includes("loyalty"));
    case "BOOKINGS":
      return normFeatures.some(f => f.includes("booking"));
    case "SERVICES":
      return normFeatures.some(f => f.includes("services") || f.includes("add services") || f.includes("service"));
    case "SCHEDULE":
      return normFeatures.some(f => f.includes("stylist") || f.includes("schedule") || f.includes("staff"));
    case "CMS":
      return normFeatures.some(f => f.includes("cms") || f.includes("website") || f.includes("branding"));
    case "PRODUCTS":
      return normFeatures.some(f => f.includes("inventory") || f.includes("product"));
    case "PAYROLL":
      return normFeatures.some(f => f.includes("payroll") || f.includes("attendance"));
    case "CONSENTS":
      return normFeatures.some(f => f.includes("consent") || f.includes("medical"));
    case "LOYALTY":
      return true; // always unlocked — loyalty config is available on all plans
    case "WHATSAPP":
      return normFeatures.some(f => f.includes("whatsapp"));
    case "REPORTS":
      return normFeatures.some(f => f.includes("report") || f.includes("analytics"));
    case "COUPONS":
      return normFeatures.some(f => f.includes("coupon"));
    case "SUBSCRIPTIONS":
      return normFeatures.some(f => f.includes("loyalty") || f.includes("subscription"));
    case "AUDIT":
      return normFeatures.some(f => f.includes("audit") || f.includes("report") || f.includes("analytics"));
    default:
      return false;
  }
}

function getPlanFeatures(planName: string | undefined): string[] {
  let plans: PlanModel[] = [];
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("global_subscription_plans");
    if (stored) {
      try {
        plans = JSON.parse(stored);
      } catch (e) {
        console.error("Failed to parse global plans", e);
      }
    }
  }
  
  if (!plans || plans.length === 0) {
    plans = [
      { name: "Essential", price: 999, features: ["POS Console", "CRM Matrix", "Bookings", "Services Catalog", "Product Shelf", "Basic Analytics"] },
      { name: "Growth", price: 2499, features: ["POS Console", "CRM Matrix", "Bookings", "Services Catalog", "Product Shelf", "Basic Analytics", "Payroll & Clock", "Staff Schedule", "Coupon Registry", "Subscriptions", "Advanced Analytics", "WhatsApp CRM"] },
      { name: "Premium", price: 4999, features: ["POS Console", "CRM Matrix", "Bookings", "Services Catalog", "Product Shelf", "Basic Analytics", "Payroll & Clock", "Staff Schedule", "Coupon Registry", "Subscriptions", "Advanced Analytics", "WhatsApp CRM", "Treatment Consents", "Audit Logs", "Custom Branding", "Priority Support", "Multi-user Roles"] },
    ];
  }
  
  let normPlan = (planName || "Essential").trim().toLowerCase();
  
  const match = plans.find(p => p.name.toLowerCase() === normPlan);
  return match ? match.features : [];
}

function isTabAllowed(planName: string | undefined, tabId: string): boolean {
  const features = getPlanFeatures(planName);
  return hasFeature(features, tabId);
}

function SidebarNav({ tenantSlug, userRole, tenantPlan, onItemClick }: { tenantSlug: string; userRole: string; tenantPlan: string; onItemClick?: () => void }) {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "POS";

  const visibleItems = navItems.filter(item => {
    if (userRole === "OWNER") return true;
    if (userRole === "MANAGER") {
      return !["SUBSCRIPTIONS", "WHATSAPP", "CMS"].includes(item.id);
    }
    if (userRole === "RECEPTIONIST") {
      return ["POS", "CRM", "BOOKINGS", "SERVICES", "SCHEDULE"].includes(item.id);
    }
    if (userRole === "STYLIST") {
      return ["SCHEDULE", "SERVICES", "PAYROLL", "BOOKINGS"].includes(item.id);
    }
    return false;
  });

  return (
    <nav className="space-y-1.5 flex flex-col md:flex-col overflow-y-auto select-none no-scrollbar w-full">
      {visibleItems.map(item => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        const isAllowed = isTabAllowed(tenantPlan, item.id);
        
        return (
          <Link
            key={item.id}
            href={`/tenant/${tenantSlug}/admin?tab=${item.id}`}
            onClick={onItemClick}
            className={`group flex items-center justify-between px-4 py-3 rounded-xl text-[11px] font-semibold tracking-wider transition-all duration-200 shrink-0 border uppercase w-full font-minimal ${
              isActive
                ? 'bg-stone-900 border-stone-900 text-white shadow-xs'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-100/75'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-[#FAF9F6]' : 'text-stone-400 group-hover:text-stone-600'}`}>
                <Icon className="size-4" />
              </div>
              <span className="flex items-center gap-1.5">
                {item.label}
                {!isAllowed && <Lock className="size-3 text-amber-500 shrink-0" />}
              </span>
            </div>
            {item.badge && (
              <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full shrink-0 tracking-normal normal-case border ${
                isActive 
                  ? 'bg-white/10 text-white border-white/20'
                  : 'bg-stone-100 text-stone-600 border-stone-200 group-hover:bg-stone-200/60 group-hover:text-stone-800'
              }`}>
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function BottomTabBar({ tenantSlug, setIsMobileMenuOpen }: { tenantSlug: string; setIsMobileMenuOpen: (open: boolean) => void }) {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "POS";

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/80 px-4 py-2.5 flex items-center justify-around shadow-[0_-8px_30px_rgb(28,25,23,0.04)] pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
      {[
        { id: "POS", label: "POS", icon: Receipt },
        { id: "CRM", label: "CRM", icon: Users },
        { id: "BOOKINGS", label: "Bookings", icon: Calendar },
        { id: "WHATSAPP", label: "WhatsApp", icon: MessageSquare },
      ].map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <Link
            key={item.id}
            href={`/tenant/${tenantSlug}/admin?tab=${item.id}`}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              isActive ? "text-stone-900 font-semibold" : "text-stone-400 hover:text-stone-750"
            }`}
          >
            <Icon className={`size-4.5 ${isActive ? "text-stone-900" : "text-stone-400"}`} />
            <span className="text-[9px] font-bold tracking-wider uppercase">{item.label}</span>
          </Link>
        );
      })}
      
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-stone-400 hover:text-stone-750 cursor-pointer"
      >
        <Menu className="size-4.5" />
        <span className="text-[9px] font-bold tracking-wider uppercase">More</span>
      </button>
    </div>
  );
}

export default function TenantAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenantSlug: string }>;
}) {
  const resolvedParams = React.use(params);
  const tenantSlug = resolvedParams.tenantSlug || "luxcuts";

  const [businessName, setBusinessName] = useState(tenantSlug);
  const [tenantPlan, setTenantPlan] = useState<string>("Essential");
  const [outlets, setOutlets] = useState<any[]>([]);
  const [ownerName, setOwnerName] = useState("Outlet Manager");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [userRole, setUserRole] = useState<string>("OWNER");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ─── NOTIFICATION SYSTEM ───
  interface AdminNotification {
    id: string;
    type: "NEW_BOOKING" | "CANCELLED" | "CONFIRMED" | "COMPLETED";
    title: string;
    message: string;
    time: string;
    isRead: boolean;
    outletName?: string;
  }
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const lastSeenIdsRef = React.useRef<Set<string>>(new Set());
  const lastStatusRef = React.useRef<Record<string, string>>({});

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Poll bookings every 30s for new/changed entries
  useEffect(() => {
    if (!isAuthenticated || !tenantSlug) return;

    const pollNotifications = () => {
      const selectedOutletId = localStorage.getItem(`active_outlet_id_${tenantSlug}`);
      if (!selectedOutletId) return;

      const outletObj = outlets.find(o => o.id === selectedOutletId);
      const outletName = outletObj ? outletObj.name : "Main Outlet";

      fetch(`/api/bookings?outletId=${selectedOutletId}&limit=50`, {
        headers: { "x-tenant-slug": tenantSlug },
      })
        .then(r => r.json())
        .then((data: any) => {
          const list: any[] = Array.isArray(data) ? data : (data?.data || []);
          const newNotifs: AdminNotification[] = [];

          list.forEach((b: any) => {
            const prevStatus = lastStatusRef.current[b.id];
            const isNew = !lastSeenIdsRef.current.has(b.id);
            const statusChanged = prevStatus && prevStatus !== b.status;

            if (isNew && lastSeenIdsRef.current.size > 0) {
              newNotifs.push({
                id: `notif_${b.id}_new`,
                type: "NEW_BOOKING",
                title: "New Booking Received",
                message: `${b.customerName || b.customer?.name || "A customer"} booked ${b.serviceName || b.items?.[0]?.service?.name || "a service"} for ${b.date || (b.scheduledAt ? new Date(b.scheduledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "")}`,
                time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
                isRead: false,
                outletName
              });
            } else if (statusChanged) {
              if (b.status === "CANCELLED") {
                newNotifs.push({
                  id: `notif_${b.id}_cancel_${Date.now()}`,
                  type: "CANCELLED",
                  title: "Booking Cancelled",
                  message: `${b.customerName || b.customer?.name || "A customer"} cancelled their ${b.serviceName || b.items?.[0]?.service?.name || "booking"}`,
                  time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
                  isRead: false,
                  outletName
                });
              } else if (b.status === "CONFIRMED") {
                newNotifs.push({
                  id: `notif_${b.id}_confirm_${Date.now()}`,
                  type: "CONFIRMED",
                  title: "Booking Confirmed",
                  message: `${b.customerName || b.customer?.name || "Customer"}'s ${b.serviceName || b.items?.[0]?.service?.name || "booking"} is now confirmed`,
                  time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
                  isRead: false,
                  outletName
                });
              } else if (b.status === "COMPLETED") {
                newNotifs.push({
                  id: `notif_${b.id}_done_${Date.now()}`,
                  type: "COMPLETED",
                  title: "Service Completed",
                  message: `${b.customerName || b.customer?.name || "Customer"}'s appointment has been marked complete`,
                  time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
                  isRead: false,
                  outletName
                });
              }
            }

            // Update refs
            lastSeenIdsRef.current.add(b.id);
            lastStatusRef.current[b.id] = b.status;
          });

          if (newNotifs.length > 0) {
            setNotifications(prev => [...newNotifs, ...prev].slice(0, 50));
          }
        })
        .catch(() => { /* silent fail */ });
    };

    // Initial load
    const selectedOutletId = localStorage.getItem(`active_outlet_id_${tenantSlug}`);
    if (selectedOutletId) {
      fetch(`/api/bookings?outletId=${selectedOutletId}&limit=50`, {
        headers: { "x-tenant-slug": tenantSlug },
      })
        .then(r => r.json())
        .then((data: any) => {
          const list: any[] = Array.isArray(data) ? data : (data?.data || []);
          list.forEach((b: any) => {
            lastSeenIdsRef.current.add(b.id);
            lastStatusRef.current[b.id] = b.status;
          });
        })
        .catch(() => { });
    }

    const interval = setInterval(pollNotifications, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, tenantSlug, outlets]);

  // Close notification dropdown on outside click
  useEffect(() => {
    if (!isNotifOpen) return;
    const handler = () => setIsNotifOpen(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [isNotifOpen]);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    // Set running system clock
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    if (typeof window !== "undefined") {
      // 1. Clear all localStorage admin keys immediately
      localStorage.removeItem(`tenant_admin_${tenantSlug}`);
      localStorage.removeItem(`owner_admin_session_${tenantSlug}`);

      // 2. Call the logout API to expire the HTTP-only session cookie
      try {
        await fetch("/api/tenants/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: tenantSlug }),
        });
      } catch (err) {
        console.error("Logout API call failed:", err);
      }

      // 3. Hard redirect to /login — forces full page reload & React state reset
      window.location.href = `/tenant/${tenantSlug}/login`;
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      getTenantBySlug(tenantSlug).then((match) => {
        if (match) {
          setBusinessName(match.name);
          setTenantPlan(match.planName || "Essential");
          setOutlets(match.outlets || [
            {
              id: "out_calicut",
              name: "LuxCuts Calicut Central",
              address: "2nd Floor, Focus Mall, Calicut, Kerala — 673004",
              phone: "+91 98451 00291",
              timings: "09:00 AM - 09:00 PM (Mon-Sun)",
              slug: "calicut"
            },
            {
              id: "out_cochin",
              name: "LuxCuts Cochin Waterfront",
              address: "G-240, Marine Drive Promenade, Kochi, Kerala — 682031",
              phone: "+91 97444 88301",
              timings: "10:00 AM - 10:00 PM (Mon-Sun)",
              slug: "cochin"
            },
            {
              id: "out_trivandrum",
              name: "LuxCuts Trivandrum Heights",
              address: "3rd Floor, Mall of Travancore, Trivandrum, Kerala — 695024",
              phone: "+91 95622 77401",
              timings: "09:00 AM - 10:00 PM (Mon-Sun)",
              slug: "trivandrum"
            }
          ]);
        }
      });

      // Verify session token — cookie is the ONLY source of truth.
      // localStorage is only used to cache display data, never to grant access.
      const verifySession = () => {
        return fetch(`/api/tenants/verify-session?slug=${encodeURIComponent(tenantSlug)}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.ok && data.user) {
              setIsAuthenticated(true);
              setOwnerName(data.user.name || "Outlet Manager");
              setOwnerEmail(data.user.email || "");
              setUserRole(data.user.role || "OWNER");
              // Cache display name for UI only (not for auth)
              localStorage.setItem(`tenant_admin_${tenantSlug}`, "true");
              return true;
            } else {
              // Cookie is invalid/expired — deny access, clear stale localStorage
              localStorage.removeItem(`tenant_admin_${tenantSlug}`);
              localStorage.removeItem(`owner_admin_session_${tenantSlug}`);
              setIsAuthenticated(false);
              return false;
            }
          })
          .catch(() => {
            // Network error — fail closed (deny access)
            setIsAuthenticated(false);
            return false;
          });
      };

      verifySession().finally(() => {
        setChecking(false);
      });

      // Periodic silent refresh check: Call verify-session every 5 minutes
      // If verify-session receives an expired access token, the route will silently refresh using refresh token
      const refreshInterval = setInterval(() => {
        verifySession();
      }, 1000 * 60 * 5);

      return () => clearInterval(refreshInterval);
    }
  }, [tenantSlug]);

  // Inactivity detection: Auto logout after 15 minutes of inactivity
  useEffect(() => {
    if (!isAuthenticated) return;

    let timeoutId: NodeJS.Timeout;
    const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.warn("Session expired due to user inactivity.");
        handleLogout();
      }, INACTIVITY_TIMEOUT);
    };

    // Activity event listeners
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    events.forEach((name) => {
      window.addEventListener(name, resetTimer);
    });

    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach((name) => {
        window.removeEventListener(name, resetTimer);
      });
    };
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    try {
      const res = await fetch("/api/tenants/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: tenantSlug,
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        localStorage.setItem(`tenant_admin_${tenantSlug}`, "true");
        setOwnerName(data.user?.name || "Outlet Manager");
        setOwnerEmail(data.user?.email || "");
        setUserRole(data.user?.role || "OWNER");
        setIsAuthenticated(true);
      } else {
        setLoginError(data.error || "Invalid credentials. Check your email and password.");
      }
    } catch (err) {
      console.error("Login API call failed:", err);
      // Do NOT fall back to flat-file credential check — we cannot verify
      // passwords without the authoritative hash from PostgreSQL.
      setLoginError("Authentication service is temporarily unavailable. Please try again shortly.");
    } finally {
      setLoginLoading(false);
    }
  };

  // Loading state
  if (checking) {
    return (
      <div className="min-h-screen bg-[#FBFAF7] flex flex-col gap-4 items-center justify-center relative overflow-hidden font-minimal">
        {/* Glow meshes */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#E5DFD5]/40 blur-[130px]" />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-stone-900 flex items-center justify-center shadow-md border border-stone-200 animate-pulse">
            <Receipt className="size-6 text-[#FAF9F6]" />
          </div>
          <p className="text-[10px] font-semibold tracking-widest text-stone-600 uppercase">Verifying Authorization</p>
        </div>
      </div>
    );
  }

  // Minimalist Luxury Login Gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FBFAF7] text-stone-800 font-minimal flex items-center justify-center px-4 relative overflow-hidden selection:bg-stone-900 selection:text-white">
        
        {/* Soft elegant mesh backdrops */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[55%] rounded-full bg-gradient-to-br from-[#ECE7DF] via-[#F3EFE7] to-transparent blur-[140px] opacity-70" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[55%] h-[50%] rounded-full bg-gradient-to-tl from-[#E5ECD8] via-[#F1F4EB] to-transparent blur-[140px] opacity-60" />
        </div>

        <div className="w-full max-w-[28rem] relative z-10 py-8">
          
          {/* Identity Block */}
          <div className="text-center mb-8 space-y-4">
            <div className="inline-flex flex-col items-center gap-4">
              <img src="/logo-icon.png" alt="Careva Logo" className="w-14 h-14 object-contain rounded-2xl bg-white border border-stone-200 p-1 shadow-xs" />
              <div className="space-y-1">
                <span className="text-3xl font-normal font-luxury tracking-normal text-stone-900 block leading-tight">{businessName}</span>
                <span className="text-[9px] block font-semibold tracking-[0.22em] text-stone-500 uppercase font-minimal">Workspace Control Desk</span>
              </div>
            </div>
          </div>

          {/* Frosted paper card */}
          <div className="bg-white border border-stone-200/80 rounded-3xl p-8 md:p-10 shadow-[0_8px_30px_rgb(28,25,23,0.03)] space-y-6">
            
            <div className="flex items-center gap-3.5 pb-5 border-b border-stone-150">
              <div className="w-10 h-10 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center justify-center text-stone-700">
                <Shield className="size-4.5" />
              </div>
              <div>
                <p className="font-semibold text-stone-900 text-xs uppercase tracking-wider">Access Authorization</p>
                <p className="text-[10px] text-stone-500 mt-0.5">Please authorize to unlock operations console</p>
              </div>
            </div>

            {loginError && (
              <div className="bg-rose-500/5 border border-rose-500/15 text-rose-800 rounded-xl p-3.5 text-xs font-semibold flex items-center gap-2.5">
                <AlertCircle className="size-4 shrink-0 text-rose-600" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest">Email or Phone</label>
                <div className="relative group">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-stone-400 group-focus-within:text-stone-700 transition-colors" />
                  <input
                    type="text"
                    required
                    placeholder={ownerEmail || "owner@careva.in or +91..."}
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-[#FAFAF9] border border-stone-200 focus:border-stone-800 rounded-xl py-3 pl-10 pr-4 text-xs text-stone-900 outline-none transition-all placeholder:text-stone-400 focus:ring-1 focus:ring-stone-800/10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest">Workspace Key</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-stone-400 group-focus-within:text-stone-700 transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-[#FAFAF9] border border-stone-200 focus:border-stone-800 rounded-xl py-3 pl-10 pr-10 text-xs text-stone-900 outline-none transition-all placeholder:text-stone-400 focus:ring-1 focus:ring-stone-800/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>

              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full mt-2 py-3 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-[10px] uppercase tracking-widest rounded-xl shadow-xs transition-all active:scale-[0.99] flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
              >
                {loginLoading ? (
                  <><Sparkles className="size-3.5 animate-spin text-stone-300" /> Authorizing...</>
                ) : (
                  <>Open Workspace <ArrowRight className="size-3.5" /></>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-stone-150 text-center">
              <Link href={`/tenant/${tenantSlug}`} className="text-xs text-stone-500 hover:text-stone-800 font-semibold transition-colors inline-flex items-center gap-1.5">
                <span>← Customer Storefront</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Minimalist Luxury Admin Console Workspace
  return (
    <div className="bg-[#FBFAF7] text-stone-800 h-screen max-h-screen overflow-hidden font-minimal flex flex-col md:flex-row selection:bg-stone-900 selection:text-white relative p-2 md:p-6 gap-3 md:gap-6">
      
      {/* Elegant minimalist background meshes */}
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-[#F2EDE2]/20 rounded-full blur-[140px] pointer-events-none aurora-glow-slow" />
      <div className="absolute bottom-0 left-0 w-[35rem] h-[35rem] bg-[#E8ECD8]/15 rounded-full blur-[140px] pointer-events-none aurora-glow-slow" />

      {/* MOBILE TOP BAR */}
      <div className="md:hidden w-full bg-white border border-stone-200/80 rounded-2xl flex items-center justify-between p-3.5 shadow-xs shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="relative z-30 w-9 h-9 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-800 focus:outline-none cursor-pointer hover:bg-stone-100 transition-colors"
          >
            <Menu className="size-4.5" />
          </button>
          <span className="font-normal font-luxury text-base tracking-tight text-stone-900 capitalize">
            {businessName}
          </span>
        </div>
        <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center text-[10px] font-bold text-white uppercase shrink-0">
          {ownerName.slice(0, 2).toUpperCase()}
        </div>
      </div>

      {/* MOBILE SIDEBAR DRAWER OVERLAY */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm transition-opacity duration-200 z-40"
          />
          
          {/* Drawer Sidebar */}
          <aside className="fixed inset-y-0 left-0 z-50 w-full max-w-[260px] bg-white border-r border-stone-200 p-5 shadow-2xl overflow-y-auto flex flex-col">
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer z-50"
            >
              <X className="size-4.5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-stone-900 flex items-center justify-center shadow-sm shrink-0">
                <Receipt className="size-4.5" />
              </div>
              <div>
                <span className="font-normal font-luxury text-base tracking-tight text-stone-900 block leading-tight capitalize">
                  {businessName}
                </span>
                <span className="text-[8px] font-bold tracking-[0.18em] text-stone-400 mt-0.5 block uppercase">Operations Desk</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-0.5 no-scrollbar mb-5">
              <Suspense fallback={<div className="h-48 bg-stone-100 rounded-xl animate-pulse" />}>
                <SidebarNav 
                  tenantSlug={tenantSlug} 
                  userRole={userRole} 
                  tenantPlan={tenantPlan} 
                  onItemClick={() => setIsMobileMenuOpen(false)} 
                />
              </Suspense>
            </div>

            <div className="pt-4 border-t border-stone-150 flex flex-col gap-3 mt-auto">
              <div className="flex items-center gap-3 bg-stone-50/80 p-2.5 rounded-xl border border-stone-200/60">
                <div className="w-7 h-7 rounded-lg bg-stone-900 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                  {ownerName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-stone-900 leading-tight truncate">{ownerName}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="w-1 h-1 rounded-full bg-emerald-600 shrink-0" />
                    <p className="text-[8px] text-stone-400 font-bold uppercase tracking-wider font-minimal">{userRole}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Link 
                  href={`/tenant/${tenantSlug}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200/80 text-stone-600 hover:text-stone-900 text-[8px] font-bold uppercase tracking-wider transition-all active:scale-95 text-center"
                >
                  <Globe className="size-3 text-stone-400" />
                  <span>Storefront</span>
                </Link>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl bg-stone-50 hover:bg-rose-50 border border-stone-200/80 hover:border-rose-200 text-rose-700 text-[8px] font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer text-center"
                >
                  <LogOut className="size-3 text-rose-500" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-full md:w-68 bg-white border border-stone-200/80 rounded-3xl flex-col justify-between shrink-0 p-6 md:p-7 shadow-[0_4px_20px_rgba(28,25,23,0.02)] relative">
        
        <div className="space-y-8 flex-1 flex flex-col">
          {/* Logo & Tenant Identity */}
          <div className="flex items-center gap-3">
            <img src="/logo-icon.png" alt="Careva Logo" className="w-10 h-10 object-contain rounded-xl border border-stone-200 p-0.5 shadow-sm shrink-0" />
            <div>
              <span className="font-normal font-luxury text-lg tracking-tight text-stone-900 block leading-tight capitalize">
                {businessName}
              </span>
              <span className="text-[8px] font-bold tracking-[0.18em] text-stone-400 mt-1 block uppercase font-minimal">Operations Desk</span>
            </div>
          </div>

          {/* Navigation links */}
          <div className="flex-1 overflow-y-auto pr-0.5 no-scrollbar">
            <Suspense fallback={<div className="h-48 bg-stone-100 rounded-xl animate-pulse" />}>
              <SidebarNav tenantSlug={tenantSlug} userRole={userRole} tenantPlan={tenantPlan} />
            </Suspense>
          </div>
        </div>

        {/* Manager/Owner footer metadata */}
        <div className="pt-5 border-t border-stone-150 mt-6 flex flex-col gap-3.5">
          <div className="flex items-center gap-3 bg-stone-50/80 p-3 rounded-xl border border-stone-200/60">
            <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
              {ownerName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-stone-900 leading-tight truncate">{ownerName}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                <p className="text-[9px] text-stone-400 font-bold uppercase tracking-wider font-minimal">{userRole}</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Link 
              href={`/tenant/${tenantSlug}`}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200/80 text-stone-600 hover:text-stone-900 text-[9px] font-bold uppercase tracking-wider transition-all active:scale-95 text-center font-minimal"
            >
              <Globe className="size-3 text-stone-400" />
              <span>Storefront</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-stone-50 hover:bg-rose-50 border border-stone-200/80 hover:border-rose-200 text-rose-700 text-[9px] font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer text-center font-minimal"
            >
              <LogOut className="size-3 text-rose-500" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MINIMALIST MAIN DISPLAY CONSOLE */}
      <main className="flex-1 flex flex-col min-w-0 bg-white border border-stone-200/80 rounded-2xl md:rounded-3xl shadow-[0_4px_20px_rgba(28,25,23,0.02)] overflow-hidden relative">
        
        {/* Panel header */}
        <header className="px-5 md:px-8 py-4 md:py-6 border-b border-stone-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4 shrink-0">
          <div className="space-y-0.5 md:space-y-1">
            <div className="flex items-center gap-1.5">
              <Laptop className="size-3.5 text-stone-400 shrink-0" />
              <span className="text-[8px] font-bold tracking-[0.18em] text-stone-400 uppercase font-minimal">Workspace Node</span>
            </div>
            <h1 className="font-normal font-luxury text-xl md:text-3xl text-stone-900 tracking-tight leading-none capitalize">{tenantSlug} Console</h1>
            <p className="hidden sm:block text-xs text-stone-500 pt-0.5 font-medium font-minimal">Checkout terminals, bookings agenda, services and retail inventory dashboard</p>
          </div>
          
          <div className="flex items-center gap-2.5 md:gap-3 shrink-0 self-start sm:self-auto font-minimal">
            {/* System Clock */}
            {currentTime && (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-50 border border-stone-200 text-stone-600 font-mono text-[9px] font-semibold">
                <Clock className="size-3 text-stone-400" />
                <span>{currentTime}</span>
              </div>
            )}
            
            {/* Authorization Status */}
            <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-stone-50 text-stone-700 border border-stone-200 text-[8px] md:text-[9px] font-bold uppercase tracking-wider">
              <span className="w-1 h-1 rounded-full bg-stone-800" />
              <Activity className="size-3 text-stone-600" />
              <span>Workspace Verified</span>
            </div>

            {/* ── NOTIFICATION BELL + DROPDOWN ── */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsNotifOpen(prev => !prev);
                  // Mark all as read when opening
                  if (!isNotifOpen) {
                    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                  }
                }}
                className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-600 hover:text-stone-900 transition-all cursor-pointer active:scale-95"
                title="Notifications"
              >
                <Bell className="size-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 shadow-md animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {isNotifOpen && (
                <div
                  className="absolute right-0 top-12 w-80 sm:w-96 bg-white border border-stone-200 rounded-2xl shadow-2xl z-50 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 bg-stone-50">
                    <div className="flex items-center gap-2">
                      <Bell className="size-3.5 text-stone-600" />
                      <span className="text-xs font-bold text-stone-900 uppercase tracking-wide">Notifications</span>
                      {notifications.length > 0 && (
                        <span className="px-1.5 py-0.5 bg-stone-200 text-stone-600 text-[9px] font-bold rounded-full">{notifications.length}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {notifications.length > 0 && (
                        <button
                          onClick={() => setNotifications([])}
                          className="text-[10px] text-stone-400 hover:text-rose-500 font-semibold transition-colors cursor-pointer"
                        >
                          Clear all
                        </button>
                      )}
                      <button
                        onClick={() => setIsNotifOpen(false)}
                        className="w-6 h-6 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-900 hover:bg-stone-200 transition-all cursor-pointer"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Notification List */}
                  <div className="max-h-96 overflow-y-auto divide-y divide-stone-100">
                    {notifications.length === 0 ? (
                      <div className="py-12 text-center">
                        <Bell className="size-8 text-stone-200 mx-auto mb-3" />
                        <p className="text-xs text-stone-400 font-medium">No notifications yet</p>
                        <p className="text-[10px] text-stone-300 mt-1">New bookings and cancellations will appear here</p>
                      </div>
                    ) : (
                      notifications.slice(0, 20).map((notif) => (
                        <div
                          key={notif.id}
                          className={`px-4 py-3.5 flex items-start gap-3 transition-colors hover:bg-stone-50/60 ${
                            !notif.isRead ? "bg-rose-50/30" : ""
                          }`}
                        >
                          {/* Status dot */}
                          <div className={`mt-1 shrink-0 w-7 h-7 rounded-xl flex items-center justify-center ${
                            notif.type === "NEW_BOOKING" ? "bg-emerald-100" :
                            notif.type === "CANCELLED" ? "bg-rose-100" :
                            notif.type === "CONFIRMED" ? "bg-blue-100" :
                            "bg-stone-100"
                          }`}>
                            {notif.type === "NEW_BOOKING" && <Calendar className="size-3.5 text-emerald-600" />}
                            {notif.type === "CANCELLED" && <X className="size-3.5 text-rose-600" />}
                            {notif.type === "CONFIRMED" && <CheckCircle className="size-3.5 text-blue-600" />}
                            {notif.type === "COMPLETED" && <CheckCircle className="size-3.5 text-stone-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <p className="text-xs font-bold text-stone-900 truncate">{notif.title}</p>
                              {!notif.isRead && (
                                <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-rose-500" />
                              )}
                            </div>
                            <p className="text-[11px] text-stone-500 leading-snug">{notif.message}</p>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <span className="text-[10px] text-stone-300 font-medium">{notif.time}</span>
                              {notif.outletName && (
                                <>
                                  <span className="text-stone-200 text-[10px]">•</span>
                                  <span className="text-[8px] bg-stone-50 border border-stone-200 text-stone-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">{notif.outletName}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer hint */}
                  {notifications.length > 0 && (
                    <div className="px-4 py-2.5 border-t border-stone-100 bg-stone-50">
                      <p className="text-[9px] text-stone-400 text-center">Polls every 30 seconds · Showing last {Math.min(notifications.length, 20)} events</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>
        
        {/* Scrollable Workspace content */}
        <div className="flex-1 p-4 pb-24 md:pb-8 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto font-minimal">
          {children}
        </div>
      </main>

      <Suspense fallback={null}>
        <BottomTabBar tenantSlug={tenantSlug} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      </Suspense>
    </div>
  );
}

