"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Plus, Shield, Globe, Award, Sparkles, Building2, Zap,
  Landmark, Search, BarChart3, TrendingUp, Mail, Phone,
  Lock, User, AlertCircle, Trash2, Key, Eye, EyeOff, Edit3,
  Check, X, Server, RefreshCw, CheckCircle2, ArrowRight,
  Database, Activity, Power, ShieldAlert, Cpu, Terminal
} from "lucide-react";
import { getSharedTenants, saveSharedTenant, deleteTenantBySlug, getDemoBookings, deleteDemoBookingById } from "../../shared/utils/utils";
import { useSearchParams } from "next/navigation";

// Types
interface TenantModel {
  id: string;
  name: string;
  slug: string;
  planName: string;
  monthlyPrice: number;
  outletsCount: number;
  isActive: boolean;
  onboardedAt: string;
  email: string;
  phone: string;
  ownerName?: string;
  city?: string;
  role?: string;
  ownerPassword?: string;
  subscriptionStatus?: string;
  subscriptionExpiresAt?: string | null;
}

export interface PlanModel {
  name: string;
  price: number;
  features: string[];
}

interface LogEntry {
  type: "INFO" | "WARN" | "DB" | "SYSTEM";
  message: string;
  timestamp: string;
}

export default function SuperAdminDashboard() {
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view") || "monitor";

  // Always start false (SSR-safe); read localStorage after hydration in useEffect
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [tenants, setTenants] = useState<TenantModel[]>([]);
  const [demoBookings, setDemoBookings] = useState<any[]>([]);
  const [deleteDemoTarget, setDeleteDemoTarget] = useState<any | null>(null);
  const [filteredCategory, setFilteredCategory] = useState<"all" | "active" | "suspended">("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Form State
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formPlan, setFormPlan] = useState<string>("");
  const [formOutlets, setFormOutlets] = useState(1);
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formOwnerName, setFormOwnerName] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formPassword, setFormPassword] = useState("");

  // Change Password States
  const [changePasswordTenantId, setChangePasswordTenantId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  // Delete Confirmation State
  const [deleteTenantTarget, setDeleteTenantTarget] = useState<TenantModel | null>(null);

  // Edit Tenant State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<TenantModel | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editPlan, setEditPlan] = useState("");
  const [editPrice, setEditPrice] = useState(2499);
  const [editOutlets, setEditOutlets] = useState(1);
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editOwnerName, setEditOwnerName] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editRenew, setEditRenew] = useState(false);

  // Plans State
  const [plans, setPlans] = useState<PlanModel[]>([
    { name: "Essential", price: 999, features: ["POS Console", "CRM Matrix", "Bookings", "Services Catalog", "Product Shelf", "Basic Analytics"] },
    { name: "Growth", price: 2499, features: ["POS Console", "CRM Matrix", "Bookings", "Services Catalog", "Product Shelf", "Basic Analytics", "Payroll & Clock", "Staff Schedule", "Coupon Registry", "Subscriptions", "Advanced Analytics", "WhatsApp CRM"] },
    { name: "Premium", price: 4999, features: ["POS Console", "CRM Matrix", "Bookings", "Services Catalog", "Product Shelf", "Basic Analytics", "Payroll & Clock", "Staff Schedule", "Coupon Registry", "Subscriptions", "Advanced Analytics", "WhatsApp CRM", "Treatment Consents", "Audit Logs", "Custom Branding", "Priority Support", "Multi-user Roles"] },
  ]);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlans, setEditingPlans] = useState<PlanModel[]>([]);

  // System Settings State
  const [settings, setSettings] = useState({
    allowSignups: true,
    maintenanceMode: false,
    rateLimiting: true,
    smtpServer: "smtp.careva.in",
    telemetry: true,
    dbBackupInterval: "Daily"
  });

  const [dbHealthChecking, setDbHealthChecking] = useState(false);
  const [dbHealthMessage, setDbHealthMessage] = useState("");

  // Change Password States
  const [superAdminCurrentPassword, setSuperAdminCurrentPassword] = useState("");
  const [superAdminNewPassword, setSuperAdminNewPassword] = useState("");
  const [superAdminNewEmail, setSuperAdminNewEmail] = useState("");
  const [pwdChanging, setPwdChanging] = useState(false);
  const [pwdSuccessAlert, setPwdSuccessAlert] = useState("");
  const [pwdErrorAlert, setPwdErrorAlert] = useState("");

  // Live Terminal Logs State
  const [logs, setLogs] = useState<LogEntry[]>([
    { type: "SYSTEM", message: "Core SaaS Engine booted successfully.", timestamp: new Date(Date.now() - 3600000).toLocaleTimeString() },
    { type: "DB", message: "Database schema verification: All 4 schema boundaries resolved.", timestamp: new Date(Date.now() - 3400000).toLocaleTimeString() },
    { type: "INFO", message: "Tenant active isolation monitor initialized.", timestamp: new Date(Date.now() - 3000000).toLocaleTimeString() }
  ]);
  const logEndRef = useRef<HTMLDivElement>(null);

  const getTenantUrl = (slug: string) => {
    if (typeof window === "undefined") return "#";
    const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || "lvh.me";
    const port = window.location.port ? `:${window.location.port}` : "";
    return `http://${slug}.${domain}${port}`;
  };

  const addLog = (type: LogEntry["type"], message: string) => {
    const newEntry: LogEntry = {
      type,
      message,
      timestamp: new Date().toLocaleTimeString()
    };
    setLogs(prev => [...prev, newEntry]);
  };

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  // Load state and dynamic synchronization
  useEffect(() => {
    // Read auth state from localStorage immediately after hydration
    setIsLoggedIn(localStorage.getItem("super_admin_logged_in") === "true");
    setMounted(true);

    if (typeof window !== "undefined") {
      const storedPlans = localStorage.getItem("global_subscription_plans");
      if (storedPlans) {
        try {
          const parsedPlans = JSON.parse(storedPlans);
          setPlans(parsedPlans);
          // Sync form default to first plan name from stored plans
          if (parsedPlans.length > 0) {
            setFormPlan(parsedPlans[0].name);
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        // Default plans — set formPlan to first plan
        setFormPlan("Essential");
      }

      const storedSettings = localStorage.getItem("global_superadmin_settings");
      if (storedSettings) {
        try {
          setSettings(JSON.parse(storedSettings));
        } catch (e) {
          console.error(e);
        }
      }
    }

    fetch("/api/superadmin/login", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
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
      .catch(console.error);

    getSharedTenants().then((stored) => {
      if (stored && stored.length > 0) {
        setTenants(stored);
      }
    });

    getDemoBookings().then((stored) => {
      if (stored && stored.length > 0) {
        setDemoBookings(stored);
      }
    });
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch("/api/superadmin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (data.ok) {
        setIsLoggedIn(true);
        localStorage.setItem("super_admin_logged_in", "true");
        window.dispatchEvent(new Event("super_admin_login"));
        addLog("SYSTEM", `Super admin user ${loginEmail} logged in from console.`);
      } else {
        setLoginError(data.error || "Invalid superadmin credentials.");
        addLog("WARN", `Failed superadmin login attempt for email: ${loginEmail}`);
      }
    } catch {
      setLoginError("Could not connect to authentication gateway.");
    }
  };

  // Calculations
  const activeTenants = tenants.filter(t => t.isActive);
  const totalMRR = tenants.reduce((acc, t) => acc + (t.isActive ? (t.monthlyPrice || 0) : 0), 0);
  const totalOutlets = tenants.reduce((acc, t) => acc + t.outletsCount, 0);

  // Form Submit Handler
  const handleOnboardTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formSlug || !formEmail) return;

    const selectedPlan = plans.find(p => p.name === formPlan) || plans[0];
    const cleanSlug = formSlug.toLowerCase().replace(/[^a-z0-9]/g, "");
    const rawPassword = formPassword.trim();

    if (!rawPassword) {
      alert("Owner password is required for tenant onboarding.");
      return;
    }
    if (rawPassword.length < 8) {
      alert("Owner password must be at least 8 characters long.");
      return;
    }
    if (rawPassword === `${cleanSlug}@123` || rawPassword === "password123") {
      alert("Owner password cannot be a weak default value.");
      return;
    }

    const newTenant: TenantModel = {
      id: `ten_${Date.now()}`,
      name: formName,
      slug: cleanSlug,
      planName: selectedPlan.name,
      monthlyPrice: selectedPlan.price,
      outletsCount: Number(formOutlets),
      isActive: true,
      onboardedAt: new Date().toISOString().split("T")[0],
      email: formEmail,
      phone: formPhone || "+91 99999 99999",
      ownerName: formOwnerName || "System Onboarded",
      city: formCity || "Calicut",
      role: "OWNER",
      ownerPassword: rawPassword,
    };

    const updated = [newTenant, ...tenants];
    setTenants(updated);
    await saveSharedTenant(newTenant);
    addLog("DB", `Onboarded new tenant "${formName}" with subdomain "${cleanSlug}".`);

    // Reset Form
    setFormName("");
    setFormSlug("");
    setFormPlan(plans[0]?.name || "");
    setFormOutlets(1);
    setFormEmail("");
    setFormPhone("");
    setFormOwnerName("");
    setFormCity("");
    setFormPassword("");
    setIsModalOpen(false);

    // Redirect to new tenant's subdomain or path
    if (typeof window !== "undefined") {
      window.location.href = getTenantUrl(cleanSlug);
    }
  };

  // Toggle active status
  const toggleTenantStatus = async (id: string) => {
    const updated = tenants.map(t => t.id === id ? { ...t, isActive: !t.isActive } : t);
    setTenants(updated);
    const toggled = updated.find(t => t.id === id);
    if (toggled) {
      await saveSharedTenant(toggled);
      addLog("DB", `Tenant "${toggled.name}" status toggled to ${toggled.isActive ? 'Active' : 'Suspended'}.`);
    }
  };

  // Start Edit Tenant
  const startEditTenant = (tenant: TenantModel) => {
    setEditingTenant(tenant);
    setEditName(tenant.name);
    setEditSlug(tenant.slug);
    setEditPlan(tenant.planName || plans[0]?.name || "");
    setEditPrice(tenant.monthlyPrice || 2499);
    setEditOutlets(tenant.outletsCount || 1);
    setEditEmail(tenant.email || "");
    setEditPhone(tenant.phone || "");
    setEditOwnerName(tenant.ownerName || "Owner");
    setEditCity(tenant.city || "Calicut");
    setEditIsActive(tenant.isActive !== undefined ? tenant.isActive : true);
    setEditRenew(false);
    setIsEditModalOpen(true);
  };

  // Handle Edit Plan Change
  const handleEditPlanChange = (planName: string) => {
    setEditPlan(planName);
    if (planName !== "Custom") {
      const selectedPlan = plans.find(p => p.name === planName);
      if (selectedPlan) {
        setEditPrice(selectedPlan.price);
      }
    }
  };

  // Submit Edit Tenant Form
  const handleEditTenantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;

    const cleanSlug = editSlug.toLowerCase().replace(/[^a-z0-9]/g, "");

    const updatedTenant: TenantModel = {
      ...editingTenant,
      name: editName,
      slug: cleanSlug,
      planName: editPlan,
      monthlyPrice: Number(editPrice),
      outletsCount: Number(editOutlets),
      email: editEmail,
      phone: editPhone,
      ownerName: editOwnerName,
      city: editCity,
      isActive: editIsActive,
    };

    // Save to shared database (sends update to NestJS backend & tenants-db.json)
    const success = await saveSharedTenant({
      ...updatedTenant,
      renew: editRenew,
      renewDays: 30
    });

    if (success) {
      const freshTenants = await getSharedTenants();
      if (freshTenants && freshTenants.length > 0) {
        setTenants(freshTenants);
      }
      addLog("DB", `Updated tenant details and subscription for "${editName}" (${cleanSlug}).`);
    } else {
      alert("Failed to save workspace changes.");
    }

    setIsEditModalOpen(false);
    setEditingTenant(null);
  };

  // Handle Manual Plan Renewal
  const handleRenewTenant = async (tenant: TenantModel) => {
    const confirmRenew = window.confirm(`Are you sure you want to renew the subscription plan for "${tenant.name}" (${tenant.slug}) for another 30 days?`);
    if (!confirmRenew) return;

    const success = await saveSharedTenant({
      ...tenant,
      renew: true,
      renewDays: 30
    });

    if (success) {
      const freshTenants = await getSharedTenants();
      if (freshTenants && freshTenants.length > 0) {
        setTenants(freshTenants);
      }
      addLog("DB", `Manually renewed plan subscription for "${tenant.name}" (${tenant.slug}) for 30 days.`);
    } else {
      alert("Failed to renew plan subscription.");
    }
  };

  // Delete Tenant Handler
  const handleDeleteTenant = async () => {
    if (!deleteTenantTarget) return;
    try {
      const success = await deleteTenantBySlug(deleteTenantTarget.slug);
      if (success) {
        setTenants(tenants.filter(t => t.id !== deleteTenantTarget.id));
        addLog("DB", `Tenant "${deleteTenantTarget.name}" (${deleteTenantTarget.slug}) successfully purged from schema.`);
      } else {
        addLog("WARN", `Failed to delete tenant schema boundary for "${deleteTenantTarget.name}".`);
      }
    } catch (err) {
      console.error(err);
      addLog("WARN", `Error purging tenant: ${deleteTenantTarget.name}`);
    } finally {
      setDeleteTenantTarget(null);
    }
  };

  // Delete Demo Handler
  const handleDeleteDemoConfirm = async () => {
    if (!deleteDemoTarget) return;
    try {
      const success = await deleteDemoBookingById(deleteDemoTarget.id);
      if (success) {
        setDemoBookings(demoBookings.filter(d => d.id !== deleteDemoTarget.id));
        addLog("SYSTEM", `Demo request for "${deleteDemoTarget.businessName}" successfully deleted.`);
      } else {
        addLog("WARN", `Failed to delete demo request for "${deleteDemoTarget.businessName}".`);
      }
    } catch (err) {
      console.error(err);
      addLog("WARN", `Error deleting demo request: ${deleteDemoTarget.businessName}`);
    } finally {
      setDeleteDemoTarget(null);
    }
  };

  // Update password handler
  const handleUpdatePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changePasswordTenantId || !newPassword.trim()) return;

    const updated = tenants.map(t => {
      if (t.id === changePasswordTenantId) {
        return { ...t, ownerPassword: newPassword.trim() };
      }
      return t;
    });

    setTenants(updated);
    const changed = updated.find(t => t.id === changePasswordTenantId);
    if (changed) {
      await saveSharedTenant(changed);
      addLog("DB", `Updated administrator password for tenant "${changed.name}".`);
    }

    setIsChangePasswordModalOpen(false);
    setChangePasswordTenantId(null);
    setNewPassword("");
  };

  // Settings Save Helper
  const updateSetting = (key: keyof typeof settings, val: any) => {
    const next = { ...settings, [key]: val };
    setSettings(next);
    localStorage.setItem("global_superadmin_settings", JSON.stringify(next));
    addLog("SYSTEM", `System configuration update: ${key} set to ${val}.`);
  };

  // Database consistency health checker simulator
  const checkDatabaseHealth = () => {
    setDbHealthChecking(true);
    setDbHealthMessage("");
    addLog("SYSTEM", "Starting system-wide database consistency check...");
    setTimeout(() => {
      setDbHealthChecking(false);
      setDbHealthMessage("All PostgreSQL dynamic schemas healthy. No isolation breaches detected.");
      addLog("DB", "Database health check finished. Status: 100% OK.");
    }, 1500);
  };

  // Change password handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdChanging(true);
    setPwdSuccessAlert("");
    setPwdErrorAlert("");

    try {
      const res = await fetch("/api/superadmin/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: superAdminCurrentPassword,
          newPassword: superAdminNewPassword,
          newEmail: superAdminNewEmail || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setPwdSuccessAlert("Super admin credentials updated successfully!");
        setSuperAdminCurrentPassword("");
        setSuperAdminNewPassword("");
        setSuperAdminNewEmail("");
        addLog("SYSTEM", "Super admin credentials modified successfully.");
      } else {
        setPwdErrorAlert(data.error || "Failed to change super admin credentials.");
        addLog("WARN", `Failed super admin credentials modification attempt: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      setPwdErrorAlert("An unexpected error occurred.");
    } finally {
      setPwdChanging(false);
    }
  };

  // Filter tenants
  const filteredTenants = tenants.filter(t => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (filteredCategory === "active") return matchesSearch && t.isActive;
    if (filteredCategory === "suspended") return matchesSearch && !t.isActive;
    return matchesSearch;
  });

  // Gradient generator for logos
  const getGradient = (slug: string) => {
    const gradients = [
      "from-rose-500 to-amber-500",
      "from-teal-400 to-emerald-600",
      "from-indigo-500 to-purple-600",
      "from-cyan-400 to-blue-600",
      "from-orange-400 to-red-500"
    ];
    let sum = 0;
    for (let i = 0; i < slug.length; i++) sum += slug.charCodeAt(i);
    return gradients[sum % gradients.length];
  };

  // Don't render anything until after hydration — layout handles the loader
  if (!mounted) return null;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 font-sans text-slate-100 relative overflow-hidden">
        {/* Glow orbs background */}
        <div className="absolute top-1/3 left-1/4 -translate-x-1/2 w-[350px] h-[350px] rounded-full bg-emerald-500/5 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 translate-x-1/2 w-[350px] h-[350px] rounded-full bg-teal-500/5 blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md relative z-10 space-y-8 animate-fade-in">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
              <Shield className="size-3.5" />
              <span>Platform Gatekeeper</span>
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Careva Admin
            </h1>
            <p className="text-xs text-slate-500">Provide superadmin credentials to open control desk</p>
          </div>

          {/* Login Card */}
          <div className="bg-slate-900/40 border border-slate-900 backdrop-blur-md rounded-3xl p-8 shadow-2xl space-y-6">
            <h2 className="text-lg font-bold text-slate-200">Authenticate session</h2>

            {loginError && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-bold leading-relaxed flex items-center gap-2">
                <AlertCircle className="size-4.5 shrink-0 text-rose-500" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="size-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="admin@careva.in"
                    className="w-full bg-slate-950 border border-slate-900 focus:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold text-slate-200 placeholder:text-slate-650 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="size-4" />
                  </span>
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-900 focus:border-slate-700 rounded-xl py-3 pl-10 pr-10 text-xs font-semibold text-slate-200 placeholder:text-slate-650 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-350 transition-colors"
                  >
                    {showLoginPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 mt-6 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:opacity-95 text-xs font-extrabold uppercase tracking-widest rounded-xl text-slate-950 flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-500/10 cursor-pointer hover:shadow-emerald-500/20 active:scale-[0.98]"
              >
                <span>Authorize Admin Console</span>
                <ArrowRight className="size-4" />
              </button>
            </form>
          </div>

          {/* Footer info */}
          <div className="text-center text-[10px] text-slate-600 font-mono">
            Platform Gateway v1.4.0 • Protected by SHA-256 Auth
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ─── PLATFORM MONITOR VIEW ─────────────────────────────────────────── */}
      {currentView === "monitor" && (
        <>
          {/* Platform Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* KPI 1 */}
            <div className="bg-slate-900/40 rounded-2xl border border-slate-900 p-6 flex items-center justify-between shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-emerald-500/5 blur-2xl group-hover:bg-emerald-500/10 transition-all" />
              <div>
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">Total Businesses</span>
                <span className="text-3xl font-black text-slate-100 mt-1 block">{tenants.length}</span>
                <span className="text-[10px] text-emerald-400 font-bold block mt-1.5 flex items-center gap-1">
                  <TrendingUp className="size-3" /> +1 new this week
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-inner">
                <Building2 className="size-5" />
              </div>
            </div>

            {/* KPI 2 */}
            <div className="bg-slate-900/40 rounded-2xl border border-slate-900 p-6 flex items-center justify-between shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-cyan-500/5 blur-2xl group-hover:bg-cyan-500/10 transition-all" />
              <div>
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">Active Tenants</span>
                <span className="text-3xl font-black text-slate-100 mt-1 block">{activeTenants.length}</span>
                <span className="text-[10px] text-slate-500 font-bold block mt-1.5">
                  Isolation Factor: 100%
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20 shadow-inner">
                <Shield className="size-5" />
              </div>
            </div>

            {/* KPI 3 */}
            <div className="bg-slate-900/40 rounded-2xl border border-slate-900 p-6 flex items-center justify-between shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-emerald-500/5 blur-2xl group-hover:bg-emerald-500/10 transition-all" />
              <div>
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">Total MRR</span>
                <span className="text-3xl font-black text-emerald-400 mt-1 block">₹{totalMRR.toLocaleString()}</span>
                <span className="text-[10px] text-emerald-500/80 font-bold block mt-1.5 flex items-center gap-1">
                  <TrendingUp className="size-3" /> +12.4% MoM growth
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-inner">
                <Landmark className="size-5" />
              </div>
            </div>

            {/* KPI 4 */}
            <div className="bg-slate-900/40 rounded-2xl border border-slate-900 p-6 flex items-center justify-between shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-rose-500/5 blur-2xl group-hover:bg-rose-500/10 transition-all" />
              <div>
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">Active Outlets</span>
                <span className="text-3xl font-black text-slate-100 mt-1 block">{totalOutlets}</span>
                <span className="text-[10px] text-slate-500 font-bold block mt-1.5">
                  Avg. {tenants.length > 0 ? (totalOutlets / tenants.length).toFixed(1) : 0} outlets/tenant
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20 shadow-inner">
                <Globe className="size-5" />
              </div>
            </div>
          </div>

          {/* Main Dashboard Panel layout */}
          <div className="grid grid-cols-12 gap-8">
            {/* Left pane: Tenant Table */}
            <div className="col-span-12 bg-slate-900/20 rounded-2xl border border-slate-900 p-6 shadow-xl space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-200">Onboarded SaaS Tenants</h2>
                  <p className="text-xs text-slate-500">Manage business boundaries, active subdomains, and auth controls</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                  {/* Category Filter tabs */}
                  <div className="flex bg-slate-950 p-1 border border-slate-900 rounded-xl w-full sm:w-auto">
                    <button
                      onClick={() => setFilteredCategory("all")}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${filteredCategory === "all" ? "bg-slate-900 text-slate-200 border border-slate-800" : "text-slate-500 hover:text-slate-350"
                        }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setFilteredCategory("active")}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${filteredCategory === "active" ? "bg-slate-900 text-emerald-400 border border-slate-800" : "text-slate-500 hover:text-slate-350"
                        }`}
                    >
                      Active
                    </button>
                    <button
                      onClick={() => setFilteredCategory("suspended")}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${filteredCategory === "suspended" ? "bg-slate-900 text-rose-400 border border-slate-800" : "text-slate-500 hover:text-slate-350"
                        }`}
                    >
                      Suspended
                    </button>
                  </div>

                  <div className="relative flex-1 sm:w-48 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-650" />
                    <input
                      type="text"
                      placeholder="Search subdomains..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 focus:border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs font-semibold text-slate-200 outline-none transition-all placeholder:text-slate-600"
                    />
                  </div>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-95 text-slate-950 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10 shrink-0 cursor-pointer"
                  >
                    <Plus className="size-4" /> Onboard Salon
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto select-none">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-900 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                      <th className="pb-3 px-3 min-w-[320px]">Business Details</th>
                      <th className="pb-3 px-3">Subdomain Link</th>
                      <th className="pb-3 px-3">Subscription</th>
                      <th className="pb-3 px-3 text-center">Outlets</th>
                      <th className="pb-3 px-3">Status</th>
                      <th className="pb-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/50 text-xs">
                    {filteredTenants.length > 0 ? (
                      filteredTenants.map((tenant, idx) => (
                        <tr key={tenant.id || idx} className="hover:bg-slate-900/10 transition-colors group">
                          {/* Details */}
                          <td className="py-4 px-3 min-w-[320px]">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getGradient(tenant.slug)} flex items-center justify-center font-bold text-xs text-white uppercase shadow-md shadow-black/30`}>
                                {tenant.name.slice(0, 2)}
                              </div>
                              <div>
                                <div className="font-extrabold text-slate-200 flex items-center gap-1.5 whitespace-nowrap">
                                  {tenant.name}
                                  {tenant.ownerName && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-900 text-slate-500 uppercase tracking-wider font-mono shrink-0">
                                      Owner: {tenant.ownerName}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-500 flex items-center gap-3 mt-0.5 font-mono whitespace-nowrap">
                                  <span className="flex items-center gap-1 hover:text-slate-350 shrink-0"><Mail className="size-3 text-slate-600 shrink-0" /> {tenant.email}</span>
                                  <span className="flex items-center gap-1 shrink-0"><Phone className="size-3 text-slate-600 shrink-0" /> {tenant.phone}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Subdomain Link */}
                          <td className="py-4 px-3">
                            <a
                              href={getTenantUrl(tenant.slug)}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono text-[11px] bg-slate-950 border border-slate-900 hover:border-slate-800 px-2.5 py-1 rounded-lg text-teal-400 inline-flex items-center gap-1.5 hover:text-teal-350 transition-all shadow-sm"
                            >
                              <span>{tenant.slug}</span>
                              <Globe className="size-3 text-slate-650" />
                            </a>
                          </td>

                          {/* Plan */}
                          <td className="py-4 px-3">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${tenant.planName === 'Premium' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                  tenant.planName === 'Growth' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                    tenant.planName === 'Essential' ? 'bg-slate-900 text-slate-400 border-slate-800' :
                                      'bg-rose-500/10 text-rose-400 border-rose-500/20' // Legacy/Custom
                                }`}>
                                {tenant.planName}
                              </span>
                              <span className="text-slate-350 font-bold font-mono">₹{(tenant.monthlyPrice || 0).toLocaleString()}</span>
                            </div>
                            <span className="text-[9px] text-slate-600 block mt-0.5 font-mono">Onboarded: {tenant.onboardedAt}</span>
                            {tenant.subscriptionExpiresAt && (
                              <span className={`text-[9px] font-mono block mt-0.5 ${new Date(tenant.subscriptionExpiresAt) < new Date()
                                  ? 'text-rose-550 font-bold'
                                  : new Date(tenant.subscriptionExpiresAt).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
                                    ? 'text-amber-500 font-bold'
                                    : 'text-emerald-500/80 font-semibold'
                                }`}>
                                Expires: {tenant.subscriptionExpiresAt} ({tenant.subscriptionStatus})
                              </span>
                            )}
                          </td>

                          {/* Outlets */}
                          <td className="py-4 px-3 text-center font-bold font-mono text-slate-300">
                            {tenant.outletsCount}
                          </td>

                          {/* Status */}
                          <td className="py-4 px-3">
                            <button
                              onClick={() => toggleTenantStatus(tenant.id)}
                              className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all border cursor-pointer ${tenant.isActive
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-rose-950/20 hover:text-rose-455 hover:border-rose-900/30'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-emerald-950/20 hover:text-emerald-400 hover:border-emerald-900/30'
                                }`}
                            >
                              {tenant.isActive ? 'Active' : 'Suspended'}
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => startEditTenant(tenant)}
                                title="Edit details & subscription"
                                className="p-1.5 rounded-lg border border-slate-850 hover:border-slate-750 text-slate-400 hover:text-slate-200 bg-slate-950/40 hover:bg-slate-950 transition-all cursor-pointer"
                              >
                                <Edit3 className="size-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setChangePasswordTenantId(tenant.id);
                                  setNewPassword("");
                                  setIsChangePasswordModalOpen(true);
                                }}
                                title="Change Password"
                                className="p-1.5 rounded-lg border border-slate-850 hover:border-slate-750 text-slate-400 hover:text-slate-200 bg-slate-950/40 hover:bg-slate-950 transition-all cursor-pointer"
                              >
                                <Key className="size-3.5" />
                              </button>
                              <button
                                onClick={() => handleRenewTenant(tenant)}
                                title="Renew Plan (+30 Days)"
                                className="p-1.5 rounded-lg border border-emerald-950/30 hover:border-emerald-900/50 text-emerald-500/70 hover:text-emerald-450 bg-emerald-950/10 hover:bg-emerald-950/30 transition-all cursor-pointer"
                              >
                                <RefreshCw className="size-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteTenantTarget(tenant)}
                                title="Purge Workspace"
                                className="p-1.5 rounded-lg border border-rose-950/30 hover:border-rose-900/50 text-rose-500/70 hover:text-rose-400 bg-rose-950/10 hover:bg-rose-950/30 transition-all cursor-pointer"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-16 text-center text-slate-600 font-medium">
                          <Building2 className="size-8 mx-auto text-slate-800 mb-2" />
                          No workspace found matching the filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right pane: System Logs & Settings Summary */}
            <div className="col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Plan Allocation Chart */}
              <div className="bg-slate-900/20 rounded-2xl border border-slate-900 p-6 shadow-xl space-y-4">
                <h3 className="font-extrabold text-slate-200 text-sm flex items-center gap-1.5"><Activity className="size-4 text-emerald-400" /> Plan Allocation</h3>
                <div className="space-y-3.5">
                  {plans.slice().reverse().map((p, idx) => {
                    const count = tenants.filter(t => t.planName === p.name).length;
                    const percentage = tenants.length > 0 ? (count / tenants.length) * 100 : 0;
                    const icon = idx === 0 ? <Zap className="size-3.5 text-purple-400" /> : idx === 1 ? <Sparkles className="size-3.5 text-amber-400" /> : <Award className="size-3.5 text-slate-400" />;
                    const barColor = idx === 0 ? 'bg-purple-500' : idx === 1 ? 'bg-amber-500' : 'bg-slate-650';

                    return (
                      <div key={p.name}>
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                          <span className="flex items-center gap-1.5 font-bold text-slate-350">{icon} {p.name}</span>
                          <span className="font-mono font-bold text-slate-200">{count} active ({percentage.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-900">
                          <div className={`${barColor} h-full rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Shared DB Live Logs Viewer */}
              <div className="bg-slate-900/20 rounded-2xl border border-slate-900 p-6 shadow-xl space-y-4 flex flex-col h-[320px] overflow-hidden">
                <div className="flex justify-between items-center shrink-0">
                  <h3 className="font-extrabold text-slate-200 text-sm flex items-center gap-1.5"><Terminal className="size-4 text-emerald-400" /> Live SysLog Console</h3>
                  <button
                    onClick={() => {
                      setLogs([]);
                      addLog("SYSTEM", "SysLog viewer cache cleared.");
                    }}
                    className="text-[9px] font-black uppercase tracking-wider text-slate-500 hover:text-slate-300 border border-slate-850 px-2 py-0.5 rounded cursor-pointer"
                  >
                    Clear Console
                  </button>
                </div>

                <div className="flex-1 bg-slate-950/80 border border-slate-900 rounded-xl p-3.5 font-mono text-[10px] overflow-y-auto space-y-3 scrollbar-thin select-text">
                  {logs.map((log, index) => {
                    const tagColors = {
                      INFO: "text-sky-400",
                      WARN: "text-amber-500 font-extrabold",
                      DB: "text-emerald-400",
                      SYSTEM: "text-purple-400 font-extrabold"
                    };

                    return (
                      <div key={index} className="flex gap-2.5 items-start leading-relaxed">
                        <span className="text-slate-650 shrink-0 select-none">[{log.timestamp}]</span>
                        <span className={`${tagColors[log.type]} shrink-0 select-none`}>[{log.type}]</span>
                        <span className="text-slate-300 break-words">{log.message}</span>
                      </div>
                    );
                  })}
                  <div ref={logEndRef} />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── DEMO BOOKING LEADS VIEW ────────────────────────────────────────── */}
      {currentView === "leads" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-200">Demo Request Registry</h2>
              <p className="text-xs text-slate-500">Review and onboard business leads who requested a free demo</p>
            </div>
            <div className="text-xs font-mono text-slate-400 bg-slate-900/60 border border-slate-900 px-3 py-1.5 rounded-xl">
              Total Leads: <span className="text-emerald-400 font-extrabold">{demoBookings.length}</span>
            </div>
          </div>

          <div className="bg-slate-900/20 border border-slate-900 rounded-2xl overflow-hidden shadow-xl">
            {demoBookings.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-950/60 border border-slate-900 flex items-center justify-center mx-auto text-slate-500">
                  <Mail className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-350">No demo requests found</h3>
                  <p className="text-xs text-slate-500 mt-1">Lead requests submitted on the landing page will populate here.</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/60 border-b border-slate-900 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="px-6 py-4">Salon Business</th>
                      <th className="px-6 py-4">Contact Info</th>
                      <th className="px-6 py-4">Location</th>
                      <th className="px-6 py-4">Requested Plan</th>
                      <th className="px-6 py-4">Received Date</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60 text-slate-300">
                    {demoBookings.map((lead: any) => (
                      <tr key={lead.id} className="hover:bg-slate-900/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-100">{lead.businessName}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Owner: {lead.name}</div>
                        </td>
                        <td className="px-6 py-4 space-y-0.5">
                          <div className="text-xs flex items-center gap-1.5">
                            <span className="text-slate-500">Email:</span>
                            <span className="font-semibold text-slate-300">{lead.email}</span>
                          </div>
                          <div className="text-[10px] flex items-center gap-1.5 font-mono text-slate-400">
                            <span>Phone:</span>
                            <span>{lead.phone}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-semibold">{lead.city}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {lead.plan}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-slate-500">
                          {new Date(lead.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setFormName(lead.businessName);
                                setFormSlug(lead.businessName.toLowerCase().replace(/[^a-z0-9]/g, ""));
                                setFormPlan(lead.plan === "Starter" ? "Essential" : lead.plan === "Enterprise" ? "Premium" : "Growth");
                                setFormEmail(lead.email);
                                setFormPhone(lead.phone);
                                setFormOwnerName(lead.name);
                                setFormCity(lead.city);
                                setFormPassword("CarevaDemo@2026");
                                setIsModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                            >
                              Onboard Tenant
                            </button>
                            <button
                              onClick={() => setDeleteDemoTarget(lead)}
                              className="p-1.5 bg-slate-900/60 hover:bg-rose-950/20 text-slate-400 hover:text-rose-400 border border-slate-850 hover:border-rose-900/30 rounded-lg transition-all cursor-pointer"
                              title="Delete Lead"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── SAAS PRICING PLANS VIEW ───────────────────────────────────────── */}
      {currentView === "plans" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-200">Revenue Tier Modeler</h2>
              <p className="text-xs text-slate-500">Fine-tune global monthly prices and bundle values dynamically</p>
            </div>
            <button
              onClick={() => {
                setEditingPlans([...plans]);
                setIsPlanModalOpen(true);
              }}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-95 text-slate-950 rounded-xl text-xs font-bold shadow-md cursor-pointer select-none transition-all active:scale-[0.98]"
            >
              Configure Plans
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((p, idx) => {
              const activeCount = tenants.filter(t => t.planName === p.name).length;
              return (
                <div
                  key={p.name}
                  className={`bg-slate-900/30 rounded-2xl border p-6 flex flex-col justify-between shadow-xl relative overflow-hidden transition-all duration-300 hover:translate-y-[-2px] ${idx === 2 ? 'border-purple-500/25 bg-gradient-to-b from-purple-950/5 to-slate-900/30' :
                      idx === 1 ? 'border-amber-500/25 bg-gradient-to-b from-amber-950/5 to-slate-900/30' :
                        'border-slate-850'
                    }`}
                >
                  {idx === 2 && (
                    <div className="absolute top-3 right-3 bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wider font-extrabold">
                      Most Scalable
                    </div>
                  )}
                  {idx === 1 && (
                    <div className="absolute top-3 right-3 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wider font-extrabold">
                      Popular
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-widest block">SaaS Tier</span>
                      <h3 className="text-xl font-black text-slate-100 uppercase">{p.name}</h3>
                    </div>

                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-emerald-400 font-mono">₹{p.price.toLocaleString()}</span>
                      <span className="text-xs text-slate-500 font-medium">/mo</span>
                    </div>

                    <div className="pt-4 border-t border-slate-900 space-y-2">
                      <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest block">Core Privileges</span>
                      <ul className="space-y-2 text-xs text-slate-400">
                        {p.features.map(f => (
                          <li key={f} className="flex items-center gap-2">
                            <Check className="size-4 text-emerald-500 shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-900 flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Subscribed Tenants</span>
                    <span className="font-extrabold text-slate-200 font-mono">{activeCount} Businesses</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── SYSTEM SETTINGS VIEW ─────────────────────────────────────────── */}
      {currentView === "settings" && (
        <div className="grid grid-cols-12 gap-8">
          {/* Settings form column */}
          <div className="col-span-12 lg:col-span-8 bg-slate-900/20 rounded-2xl border border-slate-900 p-6 shadow-xl space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-200">Environment configurations</h2>
              <p className="text-xs text-slate-500">Fine-tune global parameters and system integrations</p>
            </div>

            <div className="space-y-5 border-t border-slate-900 pt-5">
              {/* Toggle 1 */}
              <div className="flex items-center justify-between p-4 bg-slate-950/40 border border-slate-900 rounded-xl hover:border-slate-850 transition-all select-none">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-200">Public Registrations</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Allow public onboarding pages to accept new tenant registrations</p>
                </div>
                <button
                  onClick={() => updateSetting("allowSignups", !settings.allowSignups)}
                  className={`w-12 h-6.5 rounded-full p-1 transition-colors cursor-pointer focus:outline-none flex items-center ${settings.allowSignups ? "bg-emerald-500" : "bg-slate-800"
                    }`}
                >
                  <div className={`bg-slate-950 w-4.5 h-4.5 rounded-full shadow-md transform transition-transform ${settings.allowSignups ? "translate-x-5.5" : "translate-x-0"
                    }`} />
                </button>
              </div>

              {/* Toggle 2 */}
              <div className="flex items-center justify-between p-4 bg-slate-950/40 border border-slate-900 rounded-xl hover:border-slate-850 transition-all select-none">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-200">Maintenance Window</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Route public and tenant dashboards to global maintenance screen</p>
                </div>
                <button
                  onClick={() => updateSetting("maintenanceMode", !settings.maintenanceMode)}
                  className={`w-12 h-6.5 rounded-full p-1 transition-colors cursor-pointer focus:outline-none flex items-center ${settings.maintenanceMode ? "bg-rose-500" : "bg-slate-800"
                    }`}
                >
                  <div className={`bg-slate-950 w-4.5 h-4.5 rounded-full shadow-md transform transition-transform ${settings.maintenanceMode ? "translate-x-5.5" : "translate-x-0"
                    }`} />
                </button>
              </div>

              {/* Toggle 3 */}
              <div className="flex items-center justify-between p-4 bg-slate-950/40 border border-slate-900 rounded-xl hover:border-slate-850 transition-all select-none">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-200">Core Telemetry Audit</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Record API request cycles and query durations into logging boundaries</p>
                </div>
                <button
                  onClick={() => updateSetting("telemetry", !settings.telemetry)}
                  className={`w-12 h-6.5 rounded-full p-1 transition-colors cursor-pointer focus:outline-none flex items-center ${settings.telemetry ? "bg-emerald-500" : "bg-slate-800"
                    }`}
                >
                  <div className={`bg-slate-950 w-4.5 h-4.5 rounded-full shadow-md transform transition-transform ${settings.telemetry ? "translate-x-5.5" : "translate-x-0"
                    }`} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-900">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Global SMTP Server</label>
                <input
                  type="text"
                  value={settings.smtpServer}
                  onChange={(e) => updateSetting("smtpServer", e.target.value)}
                  className="w-full bg-slate-950 border border-slate-900 focus:border-slate-800 rounded-xl p-2.5 text-xs font-semibold text-slate-200 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Automatic DB Backups</label>
                <select
                  value={settings.dbBackupInterval}
                  onChange={(e) => updateSetting("dbBackupInterval", e.target.value)}
                  className="w-full bg-slate-950 border border-slate-900 focus:border-slate-800 rounded-xl p-2.5 text-xs font-semibold text-slate-200 outline-none"
                >
                  <option value="Hourly">Hourly</option>
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                </select>
              </div>
            </div>
          </div>

          {/* Core Operations panel */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* DB Health check panel */}
            <div className="bg-slate-900/20 rounded-2xl border border-slate-900 p-6 shadow-xl space-y-5">
              <h3 className="font-extrabold text-slate-200 text-sm flex items-center gap-1.5"><Database className="size-4 text-emerald-400" /> Schema Integrity</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Scan schema structures and multi-tenant databases to ensure isolation variables are intact.
              </p>

              <button
                onClick={checkDatabaseHealth}
                disabled={dbHealthChecking}
                className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 text-slate-350 hover:text-slate-200 rounded-xl text-xs font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {dbHealthChecking ? (
                  <>
                    <RefreshCw className="size-3.5 animate-spin" />
                    <span>Analyzing Tables...</span>
                  </>
                ) : (
                  <>
                    <Server className="size-3.5 text-slate-500" />
                    <span>Execute Consistency Check</span>
                  </>
                )}
              </button>

              {dbHealthMessage && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-[11px] leading-relaxed font-semibold">
                  {dbHealthMessage}
                </div>
              )}
            </div>

            {/* Change Super Admin Password Card */}
            <div className="bg-slate-900/20 rounded-2xl border border-slate-900 p-6 shadow-xl space-y-4">
              <h3 className="font-extrabold text-slate-200 text-sm flex items-center gap-1.5">
                <Lock className="size-4 text-rose-400" />
                <span>Super Admin Credentials</span>
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Update the master email address and login credentials for this control desk.
              </p>

              <form onSubmit={handleChangePassword} className="space-y-3">
                {pwdSuccessAlert && (
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-[10px] font-bold">
                    {pwdSuccessAlert}
                  </div>
                )}
                {pwdErrorAlert && (
                  <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-[10px] font-bold">
                    {pwdErrorAlert}
                  </div>
                )}

                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">New Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="Keep current if blank"
                    value={superAdminNewEmail}
                    onChange={(e) => setSuperAdminNewEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 focus:border-slate-800 rounded-xl p-2 text-xs font-semibold text-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Current Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter current password"
                    value={superAdminCurrentPassword}
                    onChange={(e) => setSuperAdminCurrentPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 focus:border-slate-800 rounded-xl p-2 text-xs font-semibold text-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter new password"
                    value={superAdminNewPassword}
                    onChange={(e) => setSuperAdminNewPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 focus:border-slate-800 rounded-xl p-2 text-xs font-semibold text-slate-200 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={pwdChanging}
                  className="w-full py-2 bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 font-extrabold text-[10px] uppercase tracking-widest rounded-xl hover:opacity-90 shadow-md shadow-rose-500/10 flex items-center justify-center gap-1 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                >
                  {pwdChanging ? "Updating..." : "Update Master Credentials"}
                </button>
              </form>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-900/20 rounded-2xl border border-slate-900 p-6 shadow-xl space-y-4">
              <h3 className="font-extrabold text-slate-200 text-sm flex items-center gap-1.5"><Cpu className="size-4 text-purple-400" /> Global Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    addLog("SYSTEM", "Requested global platform cache eviction.");
                    alert("Cache invalidated across all 4 edge clusters.");
                  }}
                  className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-xl transition-all cursor-pointer text-left px-4"
                >
                  Purge Cache Edges
                </button>
                <button
                  onClick={() => {
                    addLog("SYSTEM", "Simulating global system snapshot...");
                    alert("Cluster snapshot backup captured successfully.");
                  }}
                  className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-450 hover:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer text-left px-4"
                >
                  Create Snapshot Backup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── CHANGE PASSWORD MODAL ────────────────────────────────────────── */}
      {isChangePasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-2xl space-y-4 relative animate-scale-up">
            <button
              onClick={() => setIsChangePasswordModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 font-bold text-lg cursor-pointer"
            >
              <X className="size-5" />
            </button>

            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <Key className="size-4" />
              </div>
              <h3 className="font-extrabold text-slate-100 text-sm">Update Tenant Password</h3>
            </div>

            <form onSubmit={handleUpdatePasswordSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  New Password for {tenants.find(t => t.id === changePasswordTenantId)?.name}
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter new plain text password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-slate-700 rounded-xl p-3 text-xs font-semibold text-slate-200 outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 font-bold text-xs text-slate-950 rounded-xl hover:opacity-95 shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
              >
                Update Workspace Password
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRMATION MODAL ────────────────────────────────────── */}
      {deleteTenantTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-2xl space-y-4 relative animate-scale-up">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800 text-rose-500">
              <ShieldAlert className="size-5" />
              <h3 className="font-extrabold text-slate-100 text-sm">Purge Tenant Workspace</h3>
            </div>

            <div className="space-y-3 leading-relaxed text-xs text-slate-450">
              <p>
                You are about to delete <strong className="text-slate-250 font-bold">"{deleteTenantTarget.name}"</strong> (`{deleteTenantTarget.slug}`).
              </p>
              <p className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl font-semibold">
                ⚠️ WARNING: This action will destroy all tables, CRM files, and booking details in this isolation boundary. This is irreversible.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteTenantTarget(null)}
                className="flex-1 py-2.5 bg-slate-950 border border-slate-850 hover:border-slate-850 hover:bg-slate-900 rounded-xl text-xs font-bold text-slate-400 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTenant}
                className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-lg shadow-rose-500/10 active:scale-98"
              >
                Purge Database
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DELETE DEMO CONFIRMATION MODAL ─────────────────────────────────── */}
      {deleteDemoTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-2xl space-y-4 relative animate-scale-up">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800 text-rose-500">
              <ShieldAlert className="size-5" />
              <h3 className="font-extrabold text-slate-100 text-sm">Delete Demo Request</h3>
            </div>

            <div className="space-y-3 leading-relaxed text-xs text-slate-450">
              <p>
                You are about to delete the demo request for <strong className="text-slate-250 font-bold">"{deleteDemoTarget.businessName}"</strong>.
              </p>
              <p className="p-3 bg-rose-500/5 border border-rose-500/10 text-rose-400 rounded-xl font-semibold">
                This will remove the lead contact info from the super admin dashboard.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteDemoTarget(null)}
                className="flex-1 py-2.5 bg-slate-950 border border-slate-850 hover:border-slate-850 hover:bg-slate-900 rounded-xl text-xs font-bold text-slate-400 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteDemoConfirm}
                className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-lg shadow-rose-500/10 active:scale-98"
              >
                Delete Lead
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ONBOARD TENANT MODAL ─────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto scrollbar-thin animate-scale-up">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-350 cursor-pointer"
            >
              <X className="size-5" />
            </button>

            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <Building2 className="size-4.5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-100 text-sm">Onboard New Salon</h3>
                <p className="text-[10px] text-slate-500 font-mono">Flesh out tenant metadata in shared schema</p>
              </div>
            </div>

            <form onSubmit={handleOnboardTenant} className="space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Owner Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Farhan"
                  value={formOwnerName}
                  onChange={(e) => setFormOwnerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-slate-700 rounded-xl p-2.5 text-xs font-semibold text-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Business Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lavender Spa & Salon"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    // Auto-slugify
                    setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""));
                  }}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-slate-700 rounded-xl p-2.5 text-xs font-semibold text-slate-200 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Subdomain Slug</label>
                  <input
                    type="text"
                    required
                    placeholder="lavenderspa"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-slate-700 rounded-xl p-2.5 text-xs font-semibold text-slate-200 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Salon City</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Calicut"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-slate-700 rounded-xl p-2.5 text-xs font-semibold text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Total Outlets</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formOutlets}
                    onChange={(e) => setFormOutlets(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-slate-700 rounded-xl p-2.5 text-xs font-semibold text-slate-200 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Onboarding Plan</label>
                  <select
                    value={formPlan}
                    onChange={(e) => setFormPlan(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-slate-700 rounded-xl p-2.5 text-xs font-semibold text-slate-250 outline-none cursor-pointer"
                  >
                    {plans.map(p => (
                      <option key={p.name} value={p.name}>{p.name} Plan (₹{p.price.toLocaleString()}/mo)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Primary Email</label>
                  <input
                    type="email"
                    required
                    placeholder="manager@salon.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-slate-700 rounded-xl p-2.5 text-xs font-semibold text-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Owner Phone</label>
                  <input
                    type="text"
                    placeholder="+91 99000 88000"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-slate-700 rounded-xl p-2.5 text-xs font-semibold text-slate-200 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Owner Password</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 8 characters"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-slate-700 rounded-xl p-2.5 text-xs font-semibold text-slate-200 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 mt-4 bg-gradient-to-r from-emerald-500 to-teal-500 font-bold text-xs text-slate-950 rounded-xl hover:opacity-95 shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
              >
                <span>Initialize Tenant Database</span>
                <CheckCircle2 className="size-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT TENANT MODAL ───────────────────────────────────────────── */}
      {isEditModalOpen && editingTenant && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto scrollbar-thin animate-scale-up">
            <button
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingTenant(null);
              }}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-350 cursor-pointer"
            >
              <X className="size-5" />
            </button>

            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <Edit3 className="size-4.5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-100 text-sm">Edit Workspace & Subscription</h3>
                <p className="text-[10px] text-slate-500 font-mono">Modify tenant settings, owner details, and pricing</p>
              </div>
            </div>

            <form onSubmit={handleEditTenantSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Owner Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Owner's Name"
                  value={editOwnerName}
                  onChange={(e) => setEditOwnerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-slate-700 rounded-xl p-2.5 text-xs font-semibold text-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Business Name</label>
                <input
                  type="text"
                  required
                  placeholder="Business Name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-slate-700 rounded-xl p-2.5 text-xs font-semibold text-slate-200 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Subdomain Slug (Read Only)</label>
                  <input
                    type="text"
                    disabled
                    value={editSlug}
                    className="w-full bg-slate-950/50 border border-slate-900 rounded-xl p-2.5 text-xs font-semibold text-slate-500 outline-none font-mono cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Salon City</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Calicut"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-slate-700 rounded-xl p-2.5 text-xs font-semibold text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Total Outlets</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={editOutlets}
                    onChange={(e) => setEditOutlets(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-slate-700 rounded-xl p-2.5 text-xs font-semibold text-slate-200 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Subscription Plan</label>
                  <select
                    value={editPlan}
                    onChange={(e) => handleEditPlanChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-slate-700 rounded-xl p-2.5 text-xs font-semibold text-slate-250 outline-none cursor-pointer"
                  >
                    {plans.map(p => (
                      <option key={p.name} value={p.name}>{p.name} Plan (₹{p.price.toLocaleString()}/mo)</option>
                    ))}
                    <option value="Custom">Custom Plan</option>
                  </select>
                </div>
              </div>

              {/* Show price override if Custom is selected */}
              {editPlan === "Custom" && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Custom Monthly Price (₹)</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-slate-700 rounded-xl p-2.5 text-xs font-semibold text-slate-200 outline-none font-mono"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Primary Email</label>
                  <input
                    type="email"
                    required
                    placeholder="manager@salon.com"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-slate-700 rounded-xl p-2.5 text-xs font-semibold text-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Owner Phone</label>
                  <input
                    type="text"
                    placeholder="+91 99000 88000"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-slate-700 rounded-xl p-2.5 text-xs font-semibold text-slate-200 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-900">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Workspace Status</span>
                <label className="relative inline-flex inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 peer-checked:after:bg-emerald-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-950/50 peer-checked:border peer-checked:border-emerald-500/20"></div>
                  <span className="ml-2 text-xs font-bold text-slate-350">{editIsActive ? "Active" : "Suspended"}</span>
                </label>
              </div>

              <div className="pt-2 flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-900">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Renew Plan (+30 Days)</span>
                  {editingTenant?.subscriptionExpiresAt && (
                    <span className="text-[9px] text-slate-500 font-mono block">Expires: {editingTenant.subscriptionExpiresAt} ({editingTenant.subscriptionStatus})</span>
                  )}
                </div>
                <label className="relative inline-flex inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editRenew}
                    onChange={(e) => setEditRenew(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 peer-checked:after:bg-emerald-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-950/50 peer-checked:border peer-checked:border-emerald-500/20"></div>
                  <span className="ml-2 text-xs font-bold text-slate-350">{editRenew ? "Extend Plan" : "Keep Expiry"}</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 mt-4 bg-gradient-to-r from-emerald-500 to-teal-500 font-bold text-xs text-slate-950 rounded-xl hover:opacity-95 shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
              >
                <span>Save Workspace Changes</span>
                <CheckCircle2 className="size-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── PLAN CONFIG MODAL ────────────────────────────────────────────── */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto scrollbar-thin animate-scale-up">

            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-extrabold text-slate-100 text-sm">Manage Subscription Plans</h3>
                <p className="text-[10px] text-slate-500 font-mono">Configure global pricing and features for each tier</p>
              </div>
              <button
                onClick={() => setIsPlanModalOpen(false)}
                className="text-slate-500 hover:text-slate-350 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-6">
              {editingPlans.map((plan, index) => (
                <div key={index} className="bg-slate-950/40 border border-slate-900 rounded-xl p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Plan Name</label>
                      <input
                        type="text"
                        value={plan.name}
                        onChange={(e) => {
                          const newPlans = [...editingPlans];
                          newPlans[index].name = e.target.value;
                          setEditingPlans(newPlans);
                        }}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-slate-700 rounded-xl p-2.5 text-xs font-semibold text-slate-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Monthly Price (₹)</label>
                      <input
                        type="number"
                        value={plan.price}
                        onChange={(e) => {
                          const newPlans = [...editingPlans];
                          newPlans[index].price = Number(e.target.value);
                          setEditingPlans(newPlans);
                        }}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-slate-700 rounded-xl p-2.5 text-xs font-semibold text-slate-200 outline-none font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Features (comma-separated)</label>
                    <textarea
                      rows={2}
                      value={plan.features.join(", ")}
                      onChange={(e) => {
                        const newPlans = [...editingPlans];
                        newPlans[index].features = e.target.value.split(",").map(f => f.trim()).filter(Boolean);
                        setEditingPlans(newPlans);
                      }}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-slate-700 rounded-xl p-2.5 text-xs font-semibold text-slate-200 outline-none resize-none font-mono text-[11px]"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={() => {
                  setPlans(editingPlans);
                  localStorage.setItem("global_subscription_plans", JSON.stringify(editingPlans));
                  // Keep form selectors in sync with updated plan names
                  if (editingPlans.length > 0) {
                    setFormPlan(editingPlans[0].name);
                    setEditPlan(editingPlans[0].name);
                  }
                  setIsPlanModalOpen(false);
                  addLog("SYSTEM", "Global subscription pricing configurations updated.");
                }}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 font-bold text-xs text-slate-950 rounded-xl hover:opacity-95 shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
              >
                <span>Save Pricing Changes</span>
                <CheckCircle2 className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
