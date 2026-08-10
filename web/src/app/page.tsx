"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Receipt,
  Users,
  Smartphone,
  BarChart3,
  Shield,
  ArrowRight,
  CheckCircle,
  Plus,
  Lock,
  User,
  Menu,
  X,
  ArrowUpRight,
  HelpCircle,
  Percent,
  Clock,
  Briefcase,
  Mail,
  Building,
  Check,
  TrendingUp,
  MapPin,
  FileText,
  Bell,
  Package,
  Layers,
  ArrowLeftRight,
  Play,
  CheckSquare
} from "lucide-react";
import { getSharedTenants, saveSharedTenant, saveDemoBooking } from "../shared/utils/utils";

// Clean inline logo symbol and text
function CarevaLogo() {
  return (
    <div className="flex items-center gap-2">
      <svg className="w-6 h-6 text-[#0F8B8D]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span className="font-extrabold text-xl tracking-tight text-[#0F172A]">
        Careva
      </span>
    </div>
  );
}

export default function MarketingLandingPage() {
  // Navigation & Drawer
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Modal & Interactive tour states
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  // Demo Booking / Sandbox Creation Form states
  const [ownerName, setOwnerName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [cityLocation, setCityLocation] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("Professional");
  const [demoSuccess, setDemoSuccess] = useState(false);
  const [createdSlug, setCreatedSlug] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Tabs for interactive Product Showcase
  const [activeShowcaseTab, setActiveShowcaseTab] = useState<"appointments" | "billing" | "crm" | "reports">("appointments");

  // FAQ Accordion State
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Active Sandbox Tenant State (to display live link if any exist)
  const [activeSlug, setActiveSlug] = useState("luxcuts");

  useEffect(() => {
    if (typeof window !== "undefined") {
      getSharedTenants().then((parsed) => {
        if (parsed && parsed.length > 0) {
          setActiveSlug(parsed[0].slug);
        }
      });
    }
  }, []);

  // Handler to open booking modal with preferred plan selected
  const openDemoModal = (plan?: string) => {
    if (plan) {
      setSelectedPlan(plan);
    }
    setDemoSuccess(false);
    setErrorMsg("");
    setOwnerName("");
    setBusinessName("");
    setEmailAddress("");
    setPhoneNumber("");
    setCityLocation("");
    setIsDemoModalOpen(true);
  };

  // Process free demo booking and save to super admin
  const handleBookDemo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerName || !businessName || !emailAddress || !phoneNumber || !cityLocation) {
      setErrorMsg("Please fill out all fields.");
      return;
    }

    try {
      const success = await saveDemoBooking({
        name: ownerName,
        businessName: businessName,
        email: emailAddress,
        phone: phoneNumber,
        city: cityLocation,
        plan: selectedPlan
      });
      
      if (success) {
        setErrorMsg("");
        setDemoSuccess(true);
      } else {
        setErrorMsg("Failed to book demo. Please try again later.");
      }
    } catch (err) {
      setErrorMsg("An error occurred while booking your demo.");
    }
  };

  // Launch pre-configured demo redirects
  const handleLaunchDemoLink = (path: string) => {
    setIsDemoModalOpen(false);
    const disableSubdomainRedirect = process.env.NEXT_PUBLIC_DISABLE_SUBDOMAIN_REDIRECT === 'true';
    if (disableSubdomainRedirect) {
      window.location.href = `/tenant/${createdSlug}${path}`;
    } else {
      const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || "lvh.me";
      const port = window.location.port ? `:${window.location.port}` : "";
      window.location.href = `http://${createdSlug}.${domain}${port}${path}`;
    }
  };

  const productTourSteps = [
    {
      title: "Interactive Booking Grid",
      desc: "Assign slots, block timings, select stylists, and visualize rosters in real-time. Avoid overlapping bookings.",
      mockup: (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 text-xs font-sans text-[#0F172A] space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-[#E2E8F0]">
            <span className="font-bold text-[#0F172A]">Roster Timeline</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-medium">Live Grid</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div className="text-slate-400 font-mono text-[9px]">Stylist</div>
            <div className="text-slate-400 font-mono text-[9px]">10:00 AM</div>
            <div className="text-slate-400 font-mono text-[9px]">11:00 AM</div>
            <div className="text-slate-400 font-mono text-[9px]">12:00 PM</div>
            
            <div className="font-bold py-1">Alex</div>
            <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded p-1 text-[10px] font-medium truncate">Haircut</div>
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded p-1 text-[10px] text-slate-400 text-center">-</div>
            <div className="bg-[#0F8B8D]/5 text-[#0F8B8D] border border-[#0F8B8D]/20 rounded p-1 text-[10px] font-medium truncate">Facial</div>

            <div className="font-bold py-1">Sarah</div>
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded p-1 text-[10px] text-slate-400 text-center">-</div>
            <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded p-1 text-[10px] font-medium truncate">Nails</div>
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded p-1 text-[10px] text-slate-400 text-center">-</div>
          </div>
        </div>
      )
    },
    {
      title: "Fast POS Checkout",
      desc: "Process billing in seconds. Add tax, apply codes, redeem points, and record multiple payment channels.",
      mockup: (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 text-xs font-sans text-[#0F172A] space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-[#E2E8F0]">
            <span className="font-bold text-[#0F172A]">Ticket Summary</span>
            <span className="font-mono text-[10px] text-slate-500">INV-9201</span>
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span>Signature Haircut (Alex)</span>
              <span className="font-semibold">₹850.00</span>
            </div>
            <div className="flex justify-between">
              <span>Spa Manicure (Sarah)</span>
              <span className="font-semibold">₹1,200.00</span>
            </div>
            <div className="flex justify-between text-emerald-600 font-medium">
              <span>Coupon Code CAREVA20 (20%)</span>
              <span>-₹410.00</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-100 font-bold text-sm text-[#0f8b8d]">
              <span>Amount Due</span>
              <span>₹1,640.00</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Automated WhatsApp Delivery",
      desc: "Instantly sends booking confirmations, 24h reminders, and digital bills. Reduce missed slots without lifting a finger.",
      mockup: (
        <div className="bg-slate-50 rounded-xl border border-[#E2E8F0] p-4 text-xs font-sans text-[#0F172A] space-y-3 max-w-sm mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">WhatsApp Message Queue</span>
          </div>
          <div className="bg-white p-3 rounded-lg border border-[#E2E8F0] text-[11px] text-slate-700 relative">
            <p className="font-bold text-[#0F172A] mb-1">Careva Auto-Reminder</p>
            <p>Hello Priyanka! Your appointment for Nail Art at **Lavender Spa** is confirmed for tomorrow at **11:00 AM** with Sarah.</p>
            <div className="mt-2 flex justify-between items-center text-[9px] text-slate-400">
              <span>Delivery Status: Sent</span>
              <span>10:04 AM</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Real-time Metrics & Insights",
      desc: "Analyze revenues, staff performances, low stock items, and retention stats across branches seamlessly.",
      mockup: (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 text-xs font-sans text-[#0F172A] space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-[#E2E8F0]">
            <span className="font-bold text-[#0F172A]">Real-time Performance</span>
            <span className="text-[10px] text-slate-500">Live Dashboard</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Daily Gross</span>
              <span className="text-sm font-extrabold text-[#0F172A]">₹28,450</span>
            </div>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">No-Shows</span>
              <span className="text-sm font-extrabold text-emerald-600">1.2%</span>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="bg-[#F8FAFC] text-[#0F172A] min-h-screen font-sans antialiased selection:bg-[#0F8B8D]/20 selection:text-[#0F8B8D]">
      
      {/* 1. STICKY NAVIGATION */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E2E8F0] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="focus:outline-none">
            <CarevaLogo />
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#64748B]">
            <a href="#features" className="hover:text-[#0f8b8d] transition-colors">Features</a>
            <a href="#pricing" className="hover:text-[#0f8b8d] transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-[#0f8b8d] transition-colors">FAQ</a>
            <a href="#contact" className="hover:text-[#0f8b8d] transition-colors">Contact</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="hidden sm:inline-block text-sm font-medium text-[#64748B] hover:text-[#0F172A] transition-colors"
            >
              Sign In
            </Link>
            <button
              onClick={() => openDemoModal()}
              className="hidden sm:inline-block px-4 py-2 text-sm font-bold text-white bg-[#0F8B8D] hover:bg-[#0c7476] rounded-lg transition-colors shadow-sm shadow-[#0F8B8D]/10 cursor-pointer"
            >
              Book Demo
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 md:hidden text-[#64748B] hover:text-[#0F172A] transition-colors"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE DRAWER */}
      {isMobileMenuOpen && (
        <div className="fixed inset-x-0 top-16 z-30 bg-white border-b border-[#E2E8F0] shadow-lg md:hidden p-6 space-y-6">
          <nav className="flex flex-col gap-4 text-base font-medium text-[#64748B]">
            <a 
              href="#features" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="hover:text-[#0f8b8d] transition-colors"
            >
              Features
            </a>
            <a 
              href="#pricing" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="hover:text-[#0f8b8d] transition-colors"
            >
              Pricing
            </a>
            <a 
              href="#faq" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="hover:text-[#0f8b8d] transition-colors"
            >
              FAQ
            </a>
            <a 
              href="#contact" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="hover:text-[#0f8b8d] transition-colors"
            >
              Contact
            </a>
            <Link 
              href="/login" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="hover:text-[#0f8b8d] transition-colors pt-2 border-t border-slate-100"
            >
              Sign In
            </Link>
          </nav>
          <button
            onClick={() => { setIsMobileMenuOpen(false); openDemoModal(); }}
            className="w-full text-center py-3 bg-[#0F8B8D] hover:bg-[#0c7476] text-sm font-bold text-white rounded-xl transition-all cursor-pointer"
          >
            Book Free Demo
          </button>
        </div>
      )}

      {/* 2. HERO SECTION */}
      <section className="relative py-16 md:py-28 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-6 space-y-8 text-left">
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-[#0F172A] leading-[1.1] font-sans">
              Run Your Salon, <br />
              <span className="text-[#0F8B8D]">Not Your Spreadsheet.</span>
            </h1>

            <p className="text-[#64748B] text-base md:text-lg max-w-xl leading-relaxed">
              Manage appointments, staff, customers, billing, inventory, and automated WhatsApp reminders from one clean, unified platform designed for modern outlets.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={() => openDemoModal()}
                className="w-full sm:w-auto px-8 py-4 bg-[#0F8B8D] hover:bg-[#0c7476] text-white font-bold text-sm rounded-xl transition-colors shadow-lg shadow-[#0F8B8D]/10 flex items-center justify-center gap-2 cursor-pointer"
              >
                Book Free Demo <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsTourOpen(true)}
                className="w-full sm:w-auto px-8 py-4 border border-[#E2E8F0] bg-white hover:border-[#64748B]/30 text-[#0F172A] font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current text-[#0f8b8d]" /> Watch Product Tour
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="pt-6 border-t border-[#E2E8F0] grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-6 text-xs font-bold text-[#64748B]">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#0F8B8D]" /> Appointment Management
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#0F8B8D]" /> Billing & POS
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#0F8B8D]" /> WhatsApp Automation
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#0F8B8D]" /> Staff Management
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#0F8B8D]" /> Inventory Tracking
              </div>
            </div>
          </div>

          {/* Right side: Large product dashboard mockup */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xl overflow-hidden flex flex-col">
              {/* Window bar */}
              <div className="px-4 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
                <div className="text-[10px] font-mono text-slate-400 bg-white px-6 py-0.5 rounded border border-[#E2E8F0]">
                  dashboard.careva.in
                </div>
                <div className="w-10" />
              </div>

              {/* Mockup Body Layout */}
              <div className="grid grid-cols-12 min-h-[360px] text-xs">
                {/* Mock Sidebar */}
                <div className="hidden sm:block col-span-3 bg-[#F8FAFC] border-r border-[#E2E8F0] p-3 space-y-4">
                  <div className="h-4 w-12 bg-slate-200 rounded animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-6 bg-[#0F8B8D]/10 rounded flex items-center px-2 text-[#0F8B8D] font-bold">
                      Calendar
                    </div>
                    <div className="h-6 rounded flex items-center px-2 text-slate-400">
                      POS Billing
                    </div>
                    <div className="h-6 rounded flex items-center px-2 text-slate-400">
                      Clients CRM
                    </div>
                    <div className="h-6 rounded flex items-center px-2 text-slate-400">
                      Staff
                    </div>
                    <div className="h-6 rounded flex items-center px-2 text-slate-400">
                      Reports
                    </div>
                  </div>
                </div>

                {/* Mock Workspace */}
                <div className="col-span-12 sm:col-span-9 p-4 space-y-4 text-left">
                  {/* Top line metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-white border border-[#E2E8F0] rounded-xl p-3">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Revenue</span>
                      <span className="text-sm font-extrabold text-[#0F172A]">₹1,42,850</span>
                    </div>
                    <div className="bg-white border border-[#E2E8F0] rounded-xl p-3">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">No-Show Rate</span>
                      <span className="text-sm font-extrabold text-emerald-600">1.8%</span>
                    </div>
                    <div className="bg-white border border-[#E2E8F0] rounded-xl p-3">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Reminders Sent</span>
                      <span className="text-sm font-extrabold text-[#0F8B8D]">1,280</span>
                    </div>
                  </div>

                  {/* Layout inner content columns */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    {/* Left: Schedule grid */}
                    <div className="col-span-12 sm:col-span-7 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 space-y-2.5">
                      <span className="text-[10px] font-bold text-[#0F172A] block border-b border-slate-200 pb-1.5">Today's Appointments</span>
                      <div className="space-y-2">
                        <div className="bg-white border border-slate-100 rounded-lg p-2 flex justify-between items-center shadow-xs">
                          <div>
                            <span className="font-bold block text-[11px]">Rohan Sharma</span>
                            <span className="text-[9px] text-[#64748B]">09:00 AM • Signature Cut</span>
                          </div>
                          <span className="text-[8px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold uppercase">Confirmed</span>
                        </div>
                        <div className="bg-white border border-slate-100 rounded-lg p-2 flex justify-between items-center shadow-xs">
                          <div>
                            <span className="font-bold block text-[11px]">Priyanka Nair</span>
                            <span className="text-[9px] text-[#64748B]">10:30 AM • Nails Spa</span>
                          </div>
                          <span className="text-[8px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-bold uppercase">In-Progress</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: SVG chart mockup */}
                    <div className="col-span-12 sm:col-span-5 bg-white border border-[#E2E8F0] rounded-xl p-3 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-[#0F172A] block mb-1">Weekly Trends</span>
                      <div className="flex items-end justify-between h-20 px-2 pt-2">
                        <div className="w-3.5 bg-slate-200 rounded-t h-8" />
                        <div className="w-3.5 bg-slate-200 rounded-t h-12" />
                        <div className="w-3.5 bg-[#0F8B8D] rounded-t h-16" />
                        <div className="w-3.5 bg-slate-200 rounded-t h-10" />
                        <div className="w-3.5 bg-[#0F8B8D]/50 rounded-t h-14" />
                      </div>
                      <span className="text-[8px] text-slate-400 text-center block mt-1">Mon - Fri Revenue</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PROBLEM SECTION */}
      <section className="py-20 bg-white border-y border-[#E2E8F0] px-6">
        <div className="max-w-7xl mx-auto text-center space-y-12">
          <div className="space-y-4">
            <span className="text-xs font-bold text-[#0F8B8D] uppercase tracking-widest block">The Cost of Disorganization</span>
            <h2 className="text-3xl md:text-5xl font-black text-[#0F172A] tracking-tight leading-tight">
              Running a Salon Shouldn't Feel Like Chaos
            </h2>
            <p className="text-[#64748B] max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
              Traditional salons lose up to 20% of their revenue to missed appointments, manual billing errors, and unorganized staff rosters. Careva consolidates your operations into a single system of record.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-6 text-left space-y-4">
              <div className="w-10 h-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center font-bold">
                ✕
              </div>
              <h3 className="font-bold text-[#0F172A] text-lg">Missed Appointments</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                No-shows eat your profit margins when clients forget their slots. Manual confirmation calls take hours and yield low responses.
              </p>
            </div>

            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-6 text-left space-y-4">
              <div className="w-10 h-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center font-bold">
                ✕
              </div>
              <h3 className="font-bold text-[#0F172A] text-lg">Manual Billing & Errors</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Slow, pen-and-paper billing causes logjams at checkout, incorrect tax calculations, and messy accounts.
              </p>
            </div>

            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-6 text-left space-y-4">
              <div className="w-10 h-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center font-bold">
                ✕
              </div>
              <h3 className="font-bold text-[#0F172A] text-lg">Inventory Confusion</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Running out of premium retail products or over-purchasing surplus supplies eats up working capital.
              </p>
            </div>

            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-6 text-left space-y-4">
              <div className="w-10 h-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center font-bold">
                ✕
              </div>
              <h3 className="font-bold text-[#0F172A] text-lg">Forgotten Follow-Ups</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Zero history records mean you have no automated way to offer birthdate discounts or reach out to inactive clients.
              </p>
            </div>

            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-6 text-left space-y-4">
              <div className="w-10 h-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center font-bold">
                ✕
              </div>
              <h3 className="font-bold text-[#0F172A] text-lg">Staff Coordination Issues</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Disorganized shift schedules lead to double-booked slots, stylist payout calculation mistakes, and general operational drag.
              </p>
            </div>

            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-6 text-left space-y-4">
              <div className="w-10 h-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center font-bold">
                ✕
              </div>
              <h3 className="font-bold text-[#0F172A] text-lg">Zero Business Visibility</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Running multiple outlets without unified sales graphs leaves you completely blind on true margins and margins growth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURES SECTION */}
      <section id="features" className="scroll-mt-20 py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <span className="text-xs font-bold text-[#0F8B8D] uppercase tracking-widest block">Complete Capability Suite</span>
          <h2 className="text-3xl md:text-5xl font-black text-[#0F172A] tracking-tight">
            Everything You Need To Run Your Salon
          </h2>
          <p className="text-[#64748B] max-w-xl mx-auto text-sm md:text-base">
            Careva consolidates complex workflows into single clicks, replacing separate software integrations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature Cards */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 space-y-4 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-[#0F8B8D]/5 text-[#0F8B8D] rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-[#0F172A]">Appointments</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Drag-and-drop bookings, real-time slot optimization, buffer allocations, and individual stylist schedules.
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 space-y-4 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-[#0F8B8D]/5 text-[#0F8B8D] rounded-lg flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-[#0F172A]">Billing & POS</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Accept digital payments, calculate split-bills, redeem membership points, and apply coupon codes instantly.
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 space-y-4 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-[#0F8B8D]/5 text-[#0F8B8D] rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-[#0F172A]">Customer CRM</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Track full profile histories, preferred services, birthday triggers, segmentation lists, and loyalty logs.
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 space-y-4 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-[#0F8B8D]/5 text-[#0F8B8D] rounded-lg flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-[#0F172A]">WhatsApp Reminders</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Automated template notifications, OTP verification, receipts, and 24-hour appointment alerts.
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 space-y-4 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-[#0F8B8D]/5 text-[#0F8B8D] rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-[#0F172A]">Inventory Management</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Monitor retail stocks, generate automated purchase orders, check supplier sheets, and get low-stock notifications.
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 space-y-4 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-[#0F8B8D]/5 text-[#0F8B8D] rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-[#0F172A]">Staff Management</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Define working shifts, log leave calendars, adjust hourly pay scales, and calculate stylist commission metrics.
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 space-y-4 hover:shadow-md transition-shadow md:col-span-2 lg:col-span-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-2 max-w-xl text-left">
                <div className="w-10 h-10 bg-[#0F8B8D]/5 text-[#0F8B8D] rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg text-[#0F172A]">Analytics & Reports</h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Real-time multi-branch reporting dashboards. Graph monthly earnings, active clients, peak slot hours, and stylist performance breakdowns.
                </p>
              </div>
              <button
                onClick={() => openDemoModal()}
                className="px-6 py-3 bg-[#0F8B8D]/10 hover:bg-[#0F8B8D]/15 text-[#0F8B8D] text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PRODUCT SHOWCASE */}
      <section className="py-20 bg-white border-y border-[#E2E8F0] px-6">
        <div className="max-w-7xl mx-auto space-y-12 text-center">
          <div className="space-y-4">
            <span className="text-xs font-bold text-[#0F8B8D] uppercase tracking-widest block">Platform Preview</span>
            <h2 className="text-3xl md:text-5xl font-black text-[#0F172A] tracking-tight">
              See Careva In Action
            </h2>
            <p className="text-[#64748B] max-w-xl mx-auto text-sm md:text-base">
              Step through our high-performance modules designed for zero layout shifts and seamless administration.
            </p>
          </div>

          {/* Tabs Navigation */}
          <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto pb-4 border-b border-[#E2E8F0]">
            <button
              onClick={() => setActiveShowcaseTab("appointments")}
              className={`px-5 py-2.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeShowcaseTab === "appointments"
                  ? "bg-[#0F8B8D] text-white"
                  : "bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] border border-[#E2E8F0]"
              }`}
            >
              Appointment Dashboard
            </button>
            <button
              onClick={() => setActiveShowcaseTab("billing")}
              className={`px-5 py-2.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeShowcaseTab === "billing"
                  ? "bg-[#0F8B8D] text-white"
                  : "bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] border border-[#E2E8F0]"
              }`}
            >
              Billing Screen
            </button>
            <button
              onClick={() => setActiveShowcaseTab("crm")}
              className={`px-5 py-2.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeShowcaseTab === "crm"
                  ? "bg-[#0F8B8D] text-white"
                  : "bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] border border-[#E2E8F0]"
              }`}
            >
              Customer Management
            </button>
            <button
              onClick={() => setActiveShowcaseTab("reports")}
              className={`px-5 py-2.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeShowcaseTab === "reports"
                  ? "bg-[#0F8B8D] text-white"
                  : "bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] border border-[#E2E8F0]"
              }`}
            >
              Reports & Analytics
            </button>
          </div>

          {/* Active tab content block */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center max-w-6xl mx-auto pt-6 text-left">
            {/* Left/Right swapping text block */}
            <div className="lg:col-span-5 space-y-6">
              {activeShowcaseTab === "appointments" && (
                <>
                  <h3 className="text-2xl font-black text-[#0F172A] tracking-tight">Optimize Slot Yield & Rosters</h3>
                  <p className="text-xs md:text-sm text-[#64748B] leading-relaxed">
                    Careva's calendar handles double-bookings instantly. Rearrange stylists' hours, assign specialized treatment booths, and lock buffer periods automatically.
                  </p>
                  <ul className="space-y-3.5 text-xs font-semibold text-[#0F172A]">
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#0F8B8D]" /> Drag-and-drop rescheduling
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#0F8B8D]" /> Booth assignment matrices
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#0F8B8D]" /> Automatic buffer timing insert
                    </li>
                  </ul>
                </>
              )}

              {activeShowcaseTab === "billing" && (
                <>
                  <h3 className="text-2xl font-black text-[#0F172A] tracking-tight">Low-latency POS Checkout</h3>
                  <p className="text-xs md:text-sm text-[#64748B] leading-relaxed">
                    Process payments via integrated wallets, cash, or credit. Validate dynamic discount coupons, allocate retail products, and calculate local GST components instantly.
                  </p>
                  <ul className="space-y-3.5 text-xs font-semibold text-[#0F172A]">
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#0F8B8D]" /> Split payments across card & UPI
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#0F8B8D]" /> Dynamic coupon registration
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#0F8B8D]" /> Auto-calculated GST invoice templates
                    </li>
                  </ul>
                </>
              )}

              {activeShowcaseTab === "crm" && (
                <>
                  <h3 className="text-2xl font-black text-[#0F172A] tracking-tight">Structured Customer History</h3>
                  <p className="text-xs md:text-sm text-[#64748B] leading-relaxed">
                    Capture comprehensive client portfolios. Track stylist notes, allergies, preferred colors, average visit values, and loyalty program point logs automatically.
                  </p>
                  <ul className="space-y-3.5 text-xs font-semibold text-[#0F172A]">
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#0F8B8D]" /> Individual profile histories & notes
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#0F8B8D]" /> Loyalty points earn-and-burn configs
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#0F8B8D]" /> Automatic client segment tags
                    </li>
                  </ul>
                </>
              )}

              {activeShowcaseTab === "reports" && (
                <>
                  <h3 className="text-2xl font-black text-[#0F172A] tracking-tight">Unified Revenue Intelligence</h3>
                  <p className="text-xs md:text-sm text-[#64748B] leading-relaxed">
                    Stop guessing your profit margins. View consolidated, multi-branch reports tracking gross bookings, tax collections, item sales, and staff productivity.
                  </p>
                  <ul className="space-y-3.5 text-xs font-semibold text-[#0F172A]">
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#0F8B8D]" /> Unified multi-outlet performance graphs
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#0F8B8D]" /> Stylist commission automatic tracking
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#0F8B8D]" /> Instant XLS/PDF spreadsheet export
                    </li>
                  </ul>
                </>
              )}

              <div className="pt-2">
                <button
                  onClick={() => openDemoModal()}
                  className="px-6 py-3.5 bg-[#0F8B8D] hover:bg-[#0c7476] text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-colors flex items-center gap-2"
                >
                  Request Live Demo Account <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right: Mockup screens */}
            <div className="lg:col-span-7">
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 shadow-sm">
                
                {/* 1. APPOINTMENTS MOCKUP */}
                {activeShowcaseTab === "appointments" && (
                  <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 text-xs text-[#0F172A] space-y-4 overflow-x-auto">
                    <div className="min-w-[450px] space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <div>
                        <span className="font-bold text-[13px] block">Roster Scheduling</span>
                        <span className="text-[10px] text-[#64748B]">Friday, June 19, 2026</span>
                      </div>
                      <span className="text-[9px] bg-[#0F8B8D]/10 text-[#0F8B8D] px-2.5 py-0.5 rounded font-bold uppercase">Grid View</span>
                    </div>

                    <div className="grid grid-cols-12 gap-2 text-left">
                      <div className="col-span-2 text-[#64748B] font-bold py-2">Time</div>
                      <div className="col-span-5 text-[#64748B] font-bold py-2 border-l border-slate-150 pl-3">Alex (Hair)</div>
                      <div className="col-span-5 text-[#64748B] font-bold py-2 border-l border-slate-150 pl-3">Sarah (Nails)</div>

                      <div className="col-span-2 font-mono text-[10px] py-3">09:00 AM</div>
                      <div className="col-span-5 bg-[#0f8b8d]/5 border border-[#0f8b8d]/20 rounded-lg p-2.5 ml-2">
                        <span className="font-bold block text-[#0F8B8D]">Rohan Sharma</span>
                        <span className="text-[9px] text-[#64748B] block">Signature Cut (45m)</span>
                      </div>
                      <div className="col-span-5 bg-slate-50 border border-dashed border-slate-200 rounded-lg p-2.5 ml-2 text-slate-400 italic flex items-center justify-center text-[10px]">
                        Available Slot
                      </div>

                      <div className="col-span-2 font-mono text-[10px] py-3">10:30 AM</div>
                      <div className="col-span-5 bg-slate-50 border border-dashed border-slate-200 rounded-lg p-2.5 ml-2 text-slate-400 italic flex items-center justify-center text-[10px]">
                        Available Slot
                      </div>
                      <div className="col-span-5 bg-[#0f8b8d]/5 border border-[#0f8b8d]/20 rounded-lg p-2.5 ml-2">
                        <span className="font-bold block text-[#0f8b8d]">Priyanka Nair</span>
                        <span className="text-[9px] text-[#64748B] block">Nail Spa Care (60m)</span>
                      </div>
                    </div>
                    </div>
                  </div>
                )}

                {/* 2. BILLING MOCKUP */}
                {activeShowcaseTab === "billing" && (
                  <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 text-xs text-[#0F172A] space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <div>
                        <span className="font-bold text-[13px] block">POS Terminal</span>
                        <span className="text-[10px] text-[#64748B]">Terminal 01</span>
                      </div>
                      <span className="text-[9px] bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded font-bold uppercase">Ready</span>
                    </div>

                    <div className="space-y-2 text-left">
                      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 space-y-2">
                        <div className="flex justify-between font-semibold">
                          <span>1x Balayage Touch-Up</span>
                          <span>₹2,400.00</span>
                        </div>
                        <div className="flex justify-between text-[#64748B] text-[10px]">
                          <span>Stylist: Alex</span>
                          <span>GST (18% inclusive)</span>
                        </div>
                      </div>
                      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 space-y-2">
                        <div className="flex justify-between font-semibold">
                          <span>1x Deep Conditioning Mask</span>
                          <span>₹800.00</span>
                        </div>
                        <div className="flex justify-between text-[#64748B] text-[10px]">
                          <span>Product Code: P-102</span>
                          <span>No Tax adjustment</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 pt-3 space-y-2 text-left">
                      <div className="flex justify-between text-[#64748B]">
                        <span>Subtotal</span>
                        <span>₹3,200.00</span>
                      </div>
                      <div className="flex justify-between text-emerald-600 font-bold">
                        <span>Discount Coupon CAREVA20 (20%)</span>
                        <span>-₹640.00</span>
                      </div>
                      <div className="flex justify-between font-black text-sm text-[#0F172A] pt-1.5 border-t border-slate-100">
                        <span>Grand Total</span>
                        <span>₹2,560.00</span>
                      </div>
                    </div>

                    <button className="w-full bg-[#0F8B8D] hover:bg-[#0c7476] text-white py-3 rounded-lg font-bold text-xs transition-colors">
                      Charge Ticket & Send WhatsApp Invoice
                    </button>
                  </div>
                )}

                {/* 3. CRM MOCKUP */}
                {activeShowcaseTab === "crm" && (
                  <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 text-xs text-[#0F172A] space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <div>
                        <span className="font-bold text-[13px] block">Client Database</span>
                        <span className="text-[10px] text-[#64748B]">Active Profiles</span>
                      </div>
                      <span className="text-[9px] bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded font-bold uppercase">Filtered: VIP</span>
                    </div>

                    <div className="space-y-2.5 text-left">
                      <div className="border border-[#E2E8F0] rounded-xl p-3 flex justify-between items-center bg-[#F8FAFC]">
                        <div>
                          <span className="font-extrabold text-[12px] block text-[#0F172A]">Anil Kapoor</span>
                          <span className="text-[10px] text-[#64748B] block mt-0.5">anil@gmail.com • +91 98950 20111</span>
                          <div className="flex gap-1.5 mt-2">
                            <span className="text-[9px] bg-[#0F8B8D]/10 text-[#0F8B8D] px-2 py-0.5 rounded font-bold">VIP</span>
                            <span className="text-[9px] bg-[#0F8B8D]/10 text-[#0F8B8D] px-2 py-0.5 rounded font-bold">Regular</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-[#64748B] block">Total Spent</span>
                          <span className="font-black text-[#0f8b8d] text-sm">₹42,800</span>
                        </div>
                      </div>

                      <div className="border border-[#E2E8F0] rounded-xl p-3 flex justify-between items-center bg-white">
                        <div>
                          <span className="font-extrabold text-[12px] block text-[#0F172A]">Meera Nair</span>
                          <span className="text-[10px] text-[#64748B] block mt-0.5">meera@outlook.com • +91 99611 88000</span>
                          <div className="flex gap-1.5 mt-2">
                            <span className="text-[9px] bg-[#0F8B8D]/10 text-[#0F8B8D] px-2 py-0.5 rounded font-bold">VIP</span>
                            <span className="text-[9px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-bold">Loyalty Level 2</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-[#64748B] block">Total Spent</span>
                          <span className="font-black text-[#0f8b8d] text-sm">₹38,200</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. REPORTS MOCKUP */}
                {activeShowcaseTab === "reports" && (
                  <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 text-xs text-[#0F172A] space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <div>
                        <span className="font-bold text-[13px] block">Revenue breakdown</span>
                        <span className="text-[10px] text-[#64748B]">Multi-outlet consolidated</span>
                      </div>
                      <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded font-bold uppercase">+18% YoY</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3">
                        <span className="text-[9px] text-slate-400 block font-bold">Gross Sales</span>
                        <span className="text-sm font-black text-[#0F172A]">₹8,42,000</span>
                      </div>
                      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3">
                        <span className="text-[9px] text-slate-400 block font-bold">Taxes (GST)</span>
                        <span className="text-sm font-black text-[#0F172A]">₹1,51,560</span>
                      </div>
                      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3">
                        <span className="text-[9px] text-slate-400 block font-bold">Net Earnings</span>
                        <span className="text-sm font-black text-[#0F8B8D]">₹6,90,440</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-left pt-2">
                      <span className="text-[10px] font-bold text-[#64748B] block uppercase tracking-wider">Top Services Contribution</span>
                      <div className="space-y-1.5">
                        <div>
                          <div className="flex justify-between text-[10px] font-semibold text-slate-600 mb-0.5">
                            <span>Hair Styling & Colors</span>
                            <span>55%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-[#0F8B8D] h-full" style={{ width: "55%" }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-[10px] font-semibold text-slate-600 mb-0.5">
                            <span>Spa & Facials</span>
                            <span>30%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-[#0F8B8D] h-full opacity-80" style={{ width: "30%" }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. BENEFITS SECTION */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <span className="text-xs font-bold text-[#0F8B8D] uppercase tracking-widest block">Executive Value</span>
          <h2 className="text-3xl md:text-5xl font-black text-[#0F172A] tracking-tight">
            Why Salon Owners Choose Careva
          </h2>
          <p className="text-[#64748B] max-w-xl mx-auto text-sm md:text-base">
            Careva delivers tangible bottom-line growth. Spend less time in spreadsheets and more time scaling your retail footprint.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 space-y-3">
            <h3 className="font-extrabold text-lg text-[#0F172A]">Save 15+ Hours Weekly</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Ditch manual bookings, text chains, and log adjustments. Automated rosters and calendars give managers their time back.
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 space-y-3">
            <h3 className="font-extrabold text-lg text-[#0F172A]">Increase Revenue by 15%</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Automated reminders prompt lapsed clients to return before their typical 30-day window expires.
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 space-y-3">
            <h3 className="font-extrabold text-lg text-[#0F172A]">Eliminate No-Shows</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Transactional WhatsApp cards check client attendance. 24h & 1h reminders reduce missed appointments up to 90%.
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 space-y-3">
            <h3 className="font-extrabold text-lg text-[#0F172A]">Improve Client Retention</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Personalized birthday offers, loyalty points reminders, and stylist history notes make clients feel valued and regular.
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 space-y-3">
            <h3 className="font-extrabold text-lg text-[#0F172A]">Manage Staff Better</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Assign commissions automatically based on service sales. Track leaves, schedule rosters, and check stylist outputs.
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 space-y-3">
            <h3 className="font-extrabold text-lg text-[#0F172A]">Track Business Performance</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Get clean financial reporting daily. Know your top products, gross tax collections, and net revenues instantly.
            </p>
          </div>
        </div>
      </section>

      {/* 7. PRICING SECTION */}
      <section id="pricing" className="scroll-mt-20 py-20 bg-white border-y border-[#E2E8F0] px-6">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <span className="text-xs font-bold text-[#0F8B8D] uppercase tracking-widest block">Subscription Plans</span>
            <h2 className="text-3xl md:text-5xl font-black text-[#0F172A] tracking-tight">
              Simple, Transparent Pricing
            </h2>
            <p className="text-[#64748B] max-w-xl mx-auto text-sm md:text-base">
              No hidden fees, no complicated add-ons. Choose the plan that fits your salon size.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter Plan */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-8 flex flex-col justify-between">
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-[#0F172A] text-lg">Starter</h3>
                  <p className="text-xs text-[#64748B] mt-1">For independent, single-chair operators.</p>
                </div>
                <div className="flex items-baseline text-[#0F172A]">
                  <span className="text-4xl font-extrabold">₹999</span>
                  <span className="text-xs text-[#64748B] ml-1">/ month</span>
                </div>
                <ul className="space-y-3 text-xs text-[#64748B] pt-6 border-t border-slate-200">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#0F8B8D] shrink-0" /> 1 Outlet</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#0F8B8D] shrink-0" /> Standard Booking Calendar</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#0F8B8D] shrink-0" /> POS Billing Terminal</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#0F8B8D] shrink-0" /> Email Invoices</li>
                </ul>
              </div>
              <button
                onClick={() => openDemoModal("Starter")}
                className="mt-8 w-full py-3 bg-white border border-[#E2E8F0] hover:border-[#64748B]/30 text-xs font-bold text-[#0F172A] rounded-xl transition-colors cursor-pointer"
              >
                Book Free Demo
              </button>
            </div>

            {/* Professional Plan (Highlighted) */}
            <div className="bg-white border-2 border-[#0F8B8D] rounded-2xl p-8 flex flex-col justify-between relative shadow-lg">
              <span className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-[#0F8B8D] text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                Most Popular
              </span>
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-[#0F172A] text-lg">Professional</h3>
                  <p className="text-xs text-[#64748B] mt-1">Best for expanding salons & multi-outlets.</p>
                </div>
                <div className="flex items-baseline text-[#0F172A]">
                  <span className="text-4xl font-extrabold">₹2,499</span>
                  <span className="text-xs text-[#64748B] ml-1">/ month</span>
                </div>
                <ul className="space-y-3 text-xs text-[#64748B] pt-6 border-t border-slate-200">
                  <li className="flex items-center gap-2 font-bold text-[#0F172A]">
                    <Check className="w-4 h-4 text-[#0F8B8D] shrink-0" /> Up to 3 Outlets
                  </li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#0F8B8D] shrink-0" /> Full Customer CRM & Notes</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#0F8B8D] shrink-0" /> Automated WhatsApp Reminders</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#0F8B8D] shrink-0" /> Inventory Low-stock Alerts</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#0F8B8D] shrink-0" /> Staff Rosters & Commission Tracking</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#0F8B8D] shrink-0" /> Multi-branch Revenue Reports</li>
                </ul>
              </div>
              <button
                onClick={() => openDemoModal("Professional")}
                className="mt-8 w-full py-3 bg-[#0F8B8D] hover:bg-[#0c7476] text-white text-xs font-black rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                Book Free Demo
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-8 flex flex-col justify-between">
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-[#0F172A] text-lg">Enterprise</h3>
                  <p className="text-xs text-[#64748B] mt-1">For national salon chains & franchises.</p>
                </div>
                <div className="flex items-baseline text-[#0F172A]">
                  <span className="text-4xl font-extrabold">₹4,999</span>
                  <span className="text-xs text-[#64748B] ml-1">/ month</span>
                </div>
                <ul className="space-y-3 text-xs text-[#64748B] pt-6 border-t border-slate-200">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#0F8B8D] shrink-0" /> Unlimited Outlets</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#0F8B8D] shrink-0" /> Custom Domain Mapping</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#0F8B8D] shrink-0" /> Dedicated WhatsApp API Gateway</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#0F8B8D] shrink-0" /> Custom Integrations & priority SLA</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#0F8B8D] shrink-0" /> 24/7 Dedicated Support</li>
                </ul>
              </div>
              <button
                onClick={() => openDemoModal("Enterprise")}
                className="mt-8 w-full py-3 bg-white border border-[#E2E8F0] hover:border-[#64748B]/30 text-xs font-bold text-[#0F172A] rounded-xl transition-colors cursor-pointer"
              >
                Book Free Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 8. TESTIMONIALS SECTION */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <span className="text-xs font-bold text-[#0F8B8D] uppercase tracking-widest block">Trusted Reviews</span>
          <h2 className="text-3xl md:text-5xl font-black text-[#0F172A] tracking-tight">
            What Salon Owners Say
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Testimonial cards */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-4">
            <div className="flex gap-1 text-[#0f8b8d] font-bold">★★★★★</div>
            <p className="text-xs text-[#64748B] leading-relaxed italic">
              "We migrated all 3 of our outlets to Careva last month. The WhatsApp reminder system has already saved us thousands in potential no-shows. Checking clients out has never been this simple."
            </p>
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[#0F172A] text-xs">
                RS
              </div>
              <div>
                <span className="font-bold text-xs block text-[#0F172A]">Rohan Sharma</span>
                <span className="text-[10px] text-[#64748B] block">Owner, Lavender Spa Retreat</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-4">
            <div className="flex gap-1 text-[#0f8b8d] font-bold">★★★★★</div>
            <p className="text-xs text-[#64748B] leading-relaxed italic">
              "GST invoice calculations used to take up hours at the end of our shifts. Careva does everything in the background during billing. The multi-outlet roster reports are highly reliable."
            </p>
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[#0F172A] text-xs">
                MN
              </div>
              <div>
                <span className="font-bold text-xs block text-[#0F172A]">Meera Nair</span>
                <span className="text-[10px] text-[#64748B] block">Director, Aura Wellness Centers</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-4">
            <div className="flex gap-1 text-[#0f8b8d] font-bold">★★★★★</div>
            <p className="text-xs text-[#64748B] leading-relaxed italic">
              "My stylists love using the calendar schedule. They can track their individual service metrics and leaves directly. This has made employee coordination a breeze."
            </p>
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[#0F172A] text-xs">
                AK
              </div>
              <div>
                <span className="font-bold text-xs block text-[#0F172A]">Anoop Kumar</span>
                <span className="text-[10px] text-[#64748B] block">Founder, Classic Scissors Group</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FAQ SECTION */}
      <section id="faq" className="scroll-mt-20 py-20 bg-white border-t border-[#E2E8F0] px-6">
        <div className="max-w-4xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <span className="text-xs font-bold text-[#0F8B8D] uppercase tracking-widest block">Help Desk</span>
            <h2 className="text-3xl md:text-5xl font-black text-[#0F172A] tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {/* Accordion Questions */}
            {[
              {
                q: "Is training included?",
                a: "Yes! Every Careva plan comes with complimentary onboarding assistance, digital training videos, and live team walkthrough sessions to ensure your staff get up to speed in under a day."
              },
              {
                q: "Can I migrate existing data?",
                a: "Absolutely. Our engineering team assists with full data migrations. You can import client directories, product inventories, and past stylist rosters from XLS or CSV files easily."
              },
              {
                q: "Does Careva support GST billing?",
                a: "Yes. Careva fully supports Indian GST billing. It automatically handles SGST/CGST split calculations, dynamic HSN/SAC codes, and lets you generate compliant PDF receipts directly."
              },
              {
                q: "Can I use it on mobile?",
                a: "Yes. The entire platform is built with modern web standards and is fully responsive. You can manage scheduling, billing POS, and check reports from any smartphone, tablet, or laptop."
              },
              {
                q: "Does it support WhatsApp reminders?",
                a: "Yes. Careva features a built-in low-latency WhatsApp delivery engine that automatically messages customers for OTPs, confirmations, invoices, and 24h/1h booking prompts."
              }
            ].map((item, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div key={idx} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl overflow-hidden">
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full px-6 py-5 text-left flex justify-between items-center hover:bg-slate-100/50 cursor-pointer font-bold text-sm md:text-base text-[#0F172A]"
                  >
                    <span>{item.q}</span>
                    <span className="text-[#64748B] text-lg font-bold ml-4">{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-xs md:text-sm text-[#64748B] leading-relaxed border-t border-[#E2E8F0] pt-4 bg-white">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 10. FINAL CTA SECTION (BOOK A DEMO FORM INLINE FOR HIGH CONVERSION) */}
      <section id="contact" className="scroll-mt-20 py-20 px-6 max-w-7xl mx-auto border-t border-[#E2E8F0] relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6 text-left">
            <span className="text-xs font-bold text-[#0F8B8D] uppercase tracking-widest block">Get Started Today</span>
            <h2 className="text-3xl md:text-5xl font-black text-[#0F172A] tracking-tight leading-tight">
              Ready To Simplify Your Salon Operations?
            </h2>
            <p className="text-[#64748B] leading-relaxed text-sm md:text-base">
              Book a free demo and see how Careva helps salons save time, reduce no-shows, and grow revenue. Our setup is instant.
            </p>
            <div className="space-y-3.5 text-xs text-[#64748B]">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-[#0F8B8D]" /> Instant sandbox sandbox generation
              </div>
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-[#0F8B8D]" /> Complimentary customer import support
              </div>
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-[#0F8B8D]" /> No credit card required to explore
              </div>
            </div>
          </div>

          {/* Inline demo booking form */}
          <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-2xl p-6 md:p-8 shadow-sm">
            <h3 className="font-extrabold text-lg text-[#0F172A] mb-6 text-left">Request Your Free Demo Workspace</h3>
            
            {demoSuccess ? (
              <div className="text-center space-y-6 py-6 animate-fadeIn">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-black text-xl text-[#0F172A]">Demo Request Received!</h4>
                  <p className="text-xs text-[#64748B] max-w-md mx-auto mt-2 leading-relaxed">
                    Thank you for booking a free demo! Your request has been registered in our Super Admin desk. 
                    Our executive will reach out to you within 24 hours to schedule a personalized live walkthrough.
                  </p>
                </div>

                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 text-left space-y-3.5 max-w-md mx-auto">
                  <div className="text-xs font-bold text-[#0F172A] border-b border-slate-200 pb-2">Registered Details</div>
                  <div className="grid grid-cols-2 gap-y-2.5 text-[11px]">
                    <span className="text-[#64748B]">Business Name:</span>
                    <span className="font-bold text-[#0F172A] text-right">{businessName}</span>

                    <span className="text-[#64748B]">Contact Email:</span>
                    <span className="font-bold text-[#0F172A] text-right truncate">{emailAddress}</span>

                    <span className="text-[#64748B]">Phone Number:</span>
                    <span className="font-bold text-[#0F172A] text-right">{phoneNumber}</span>

                    <span className="text-[#64748B]">Location / City:</span>
                    <span className="font-bold text-[#0F172A] text-right">{cityLocation}</span>

                    <span className="text-[#64748B]">Requested Plan:</span>
                    <span className="font-bold text-[#0F8B8D] text-right uppercase tracking-wider">{selectedPlan}</span>
                  </div>
                </div>

                <button
                  onClick={() => setDemoSuccess(false)}
                  className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#0F172A] text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Request Another Demo
                </button>
              </div>
            ) : (
              <form onSubmit={handleBookDemo} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Owner Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Farhan"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0F8B8D] rounded-xl py-3 px-4 text-xs font-semibold text-[#0F172A] outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Salon Business Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lavender Spa"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0F8B8D] rounded-xl py-3 px-4 text-xs font-semibold text-[#0F172A] outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. owner@lavenderspa.com"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0F8B8D] rounded-xl py-3 px-4 text-xs font-semibold text-[#0F172A] outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Contact Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +91 99999 55555"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0F8B8D] rounded-xl py-3 px-4 text-xs font-semibold text-[#0F172A] outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Salon City</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Calicut"
                    value={cityLocation}
                    onChange={(e) => setCityLocation(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0F8B8D] rounded-xl py-3 px-4 text-xs font-semibold text-[#0F172A] outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Onboarding Plan</label>
                  <select
                    value={selectedPlan}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0F8B8D] rounded-xl py-3 px-4 text-xs font-semibold text-[#64748B] outline-none transition-colors cursor-pointer"
                  >
                    <option value="Starter">Starter Plan</option>
                    <option value="Professional">Professional Plan</option>
                    <option value="Enterprise">Enterprise Plan</option>
                  </select>
                </div>

                {errorMsg && (
                  <p className="col-span-1 sm:col-span-2 text-xs font-bold text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  className="col-span-1 sm:col-span-2 mt-2 w-full py-4 bg-[#0F8B8D] hover:bg-[#0c7476] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-colors shadow-md shadow-[#0F8B8D]/10 cursor-pointer"
                >
                  Deploy Free Demo Workspace
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 11. FOOTER */}
      <footer className="bg-white border-t border-[#E2E8F0] py-16 px-6 text-xs text-[#64748B]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          <div className="md:col-span-4 space-y-4">
            <CarevaLogo />
            <p className="max-w-xs text-xs text-[#64748B] leading-relaxed">
              Enterprise operations and customer engagement platform for high-growth salons, spas, and wellness chains.
            </p>
          </div>

          <div className="md:col-span-2 space-y-3">
            <span className="font-extrabold text-[11px] uppercase tracking-wider text-[#0F172A] block">Product</span>
            <ul className="space-y-2">
              <li><a href="#features" className="hover:text-[#0F172A] transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-[#0F172A] transition-colors">Pricing</a></li>
              <li><a href="#faq" className="hover:text-[#0F172A] transition-colors">FAQ</a></li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-3">
            <span className="font-extrabold text-[11px] uppercase tracking-wider text-[#0F172A] block">Legal</span>
            <ul className="space-y-2">
              <li><span className="cursor-default">Privacy Policy</span></li>
              <li><span className="cursor-default">Terms of Service</span></li>
              <li><span className="cursor-default">Security Standard</span></li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-3 text-left">
            <span className="font-extrabold text-[11px] uppercase tracking-wider text-[#0F172A] block">Central Support</span>
            <p>Email: sales@careva.in</p>
            <p>Hours: Mon - Fri, 09:00 AM - 06:00 PM IST</p>
          </div>

        </div>

        <div className="max-w-7xl mx-auto border-t border-[#E2E8F0] mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Careva SaaS. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="hover:text-[#0F172A] cursor-pointer">Twitter</span>
            <span className="hover:text-[#0F172A] cursor-pointer">LinkedIn</span>
            <span className="hover:text-[#0F172A] cursor-pointer">GitHub</span>
          </div>
        </div>
      </footer>

      {/* ─── DEMO BOOKING MODAL OVERLAY ─── */}
      {isDemoModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-[#E2E8F0] rounded-2xl p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Close */}
            <button
              onClick={() => setIsDemoModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-650 transition-colors cursor-pointer border border-[#E2E8F0] bg-[#F8FAFC] rounded-full text-xs font-bold"
            >
              ✕
            </button>

            <h3 className="font-extrabold text-xl text-[#0F172A] mb-4 text-left">Book a Free Demo</h3>
            <p className="text-xs text-[#64748B] mb-6 text-left leading-relaxed">
              Provision an instant sandbox database space. Experience real-time POS checkouts, customer logs, and automatic WhatsApp templates instantly.
            </p>

            {demoSuccess ? (
              <div className="text-center space-y-6 py-6 animate-fadeIn">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-black text-xl text-[#0F172A]">Demo Request Received!</h4>
                  <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                    Thank you for booking a free demo! Your request has been registered in our Super Admin desk. 
                    Our executive will reach out to you within 24 hours to schedule a personalized live walkthrough.
                  </p>
                </div>

                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 text-left space-y-3.5">
                  <div className="text-xs font-bold text-[#0F172A] border-b border-slate-200 pb-2">Registered Details</div>
                  <div className="grid grid-cols-2 gap-y-2.5 text-[11px]">
                    <span className="text-[#64748B]">Business Name:</span>
                    <span className="font-bold text-[#0F172A] text-right">{businessName}</span>

                    <span className="text-[#64748B]">Contact Email:</span>
                    <span className="font-bold text-[#0F172A] text-right truncate">{emailAddress}</span>

                    <span className="text-[#64748B]">Phone Number:</span>
                    <span className="font-bold text-[#0F172A] text-right">{phoneNumber}</span>

                    <span className="text-[#64748B]">Location / City:</span>
                    <span className="font-bold text-[#0F172A] text-right">{cityLocation}</span>

                    <span className="text-[#64748B]">Requested Plan:</span>
                    <span className="font-bold text-[#0F8B8D] text-right uppercase tracking-wider">{selectedPlan}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsDemoModalOpen(false)}
                    className="flex-1 py-3 bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#F1F5F9] text-[#0F172A] text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBookDemo} className="space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Farhan"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0F8B8D] rounded-xl py-2.5 px-3.5 text-xs font-semibold text-[#0F172A] outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Salon Business Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lavender Spa"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0F8B8D] rounded-xl py-2.5 px-3.5 text-xs font-semibold text-[#0F172A] outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. owner@lavenderspa.com"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0F8B8D] rounded-xl py-2.5 px-3.5 text-xs font-semibold text-[#0F172A] outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +91 99999 55555"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0F8B8D] rounded-xl py-2.5 px-3.5 text-xs font-semibold text-[#0F172A] outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">City</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Calicut"
                      value={cityLocation}
                      onChange={(e) => setCityLocation(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0F8B8D] rounded-xl py-2.5 px-3.5 text-xs font-semibold text-[#0F172A] outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Preferred Plan</label>
                    <select
                      value={selectedPlan}
                      onChange={(e) => setSelectedPlan(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0F8B8D] rounded-xl py-2.5 px-3 text-xs font-semibold text-[#64748B] outline-none transition-colors cursor-pointer"
                    >
                      <option value="Starter">Starter Plan</option>
                      <option value="Professional">Professional Plan</option>
                      <option value="Enterprise">Enterprise Plan</option>
                    </select>
                  </div>
                </div>

                {errorMsg && (
                  <p className="text-xs font-bold text-red-650 bg-red-50 p-3 rounded-lg border border-red-200">
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#0F8B8D] hover:bg-[#0c7476] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-colors shadow-md cursor-pointer"
                >
                  Confirm Free Demo Booking
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ─── PRODUCT TOUR MODAL OVERLAY ─── */}
      {isTourOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white border border-[#E2E8F0] rounded-2xl p-6 md:p-8 shadow-2xl relative">
            {/* Close */}
            <button
              onClick={() => setIsTourOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-650 transition-colors cursor-pointer border border-[#E2E8F0] bg-[#F8FAFC] rounded-full text-xs font-bold"
            >
              ✕
            </button>

            <div className="space-y-4">
              <span className="text-[10px] font-bold text-[#0F8B8D] uppercase tracking-wider">
                Product Tour (Step {tourStep + 1} of {productTourSteps.length})
              </span>
              <h3 className="text-2xl font-black text-[#0F172A] tracking-tight">
                {productTourSteps[tourStep].title}
              </h3>
              <p className="text-xs md:text-sm text-[#64748B] leading-relaxed">
                {productTourSteps[tourStep].desc}
              </p>
            </div>

            {/* Visual Mockup inside tour */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-6 my-6 min-h-[160px] flex items-center justify-center">
              <div className="w-full max-w-md">
                {productTourSteps[tourStep].mockup}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex gap-1">
                {productTourSteps.map((_, idx) => (
                  <span
                    key={idx}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      idx === tourStep ? "bg-[#0F8B8D]" : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  disabled={tourStep === 0}
                  onClick={() => setTourStep(tourStep - 1)}
                  className="px-4 py-2 border border-[#E2E8F0] text-xs font-bold text-[#0F172A] hover:bg-[#F8FAFC] rounded-lg disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                >
                  Previous
                </button>
                {tourStep < productTourSteps.length - 1 ? (
                  <button
                    onClick={() => setTourStep(tourStep + 1)}
                    className="px-4 py-2 bg-[#0F8B8D] hover:bg-[#0c7476] text-white text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={() => { setIsTourOpen(false); openDemoModal(); }}
                    className="px-4 py-2 bg-[#0F8B8D] hover:bg-[#0c7476] text-white text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Book Demo Now
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
