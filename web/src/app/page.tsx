"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Users,
  Box,
  BarChart3,
  ShieldCheck,
  Clock,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  Star,
  Layers,
  Search,
  Bell,
  User,
  HeartHandshake,
  Check,
  X,
  Menu,
  Play,
  Scissors,
  Receipt,
  Mail,
  Building,
  MapPin,
  PenTool,
  RefreshCw,
  Smartphone,
  Headphones,
  Send,
  Flower2,
  Droplets,
  Sparkle,
  UserCheck,
  PieChart
} from "lucide-react";
import { getSharedTenants, saveDemoBooking } from "../shared/utils/utils";

// New Careva Salon ERP Brand Logo
function CarevaSpaLogo({ darkBg = false }: { darkBg?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2 group">
      <img
        src="/careva-logo.png"
        alt="Careva Salon ERP"
        className={`h-10 w-auto object-contain rounded-xl transition-transform group-hover:scale-105 ${
          darkBg ? "bg-white p-1 shadow-sm" : ""
        }`}
      />
    </Link>
  );
}

export default function CarevaLandingPage() {
  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Demo Modal state
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [ownerName, setOwnerName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [cityLocation, setCityLocation] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("Professional");
  const [demoSuccess, setDemoSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Dropdown states
  const [isSolutionsOpen, setIsSolutionsOpen] = useState(false);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);

  // Newsletter Email state
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSent, setNewsletterSent] = useState(false);

  // Active Sandbox Tenant State
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

  const openDemoModal = (plan?: string) => {
    if (plan) setSelectedPlan(plan);
    setDemoSuccess(false);
    setErrorMsg("");
    setOwnerName("");
    setBusinessName("");
    setEmailAddress("");
    setPhoneNumber("");
    setCityLocation("");
    setIsDemoModalOpen(true);
  };

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
        setErrorMsg("Failed to book demo. Please try again.");
      }
    } catch (err) {
      setErrorMsg("An error occurred while booking your demo.");
    }
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      setNewsletterSent(true);
      setNewsletterEmail("");
      setTimeout(() => setNewsletterSent(false), 4000);
    }
  };

  return (
    <div className="bg-[#FAF8F5] text-[#2B352E] font-minimal min-h-screen selection:bg-[#1E3A2B] selection:text-white relative">
      
      {/* ─── NAVIGATION BAR ─── */}
      <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#EDE8E0]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          
          {/* Brand Logo */}
          <CarevaSpaLogo />

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-[#4A574E]">
            <a href="#features" className="hover:text-[#1E3A2B] transition-colors">
              Features
            </a>
            
            {/* Solutions Dropdown */}
            <div className="relative" onMouseEnter={() => setIsSolutionsOpen(true)} onMouseLeave={() => setIsSolutionsOpen(false)}>
              <button className="flex items-center gap-1 hover:text-[#1E3A2B] transition-colors py-1 cursor-pointer">
                <span>Solutions</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>
              {isSolutionsOpen && (
                <div className="absolute top-full left-0 w-64 bg-white rounded-2xl shadow-xl border border-[#EDE8E0] p-3 space-y-1 z-50">
                  <a href="#solutions" className="block p-2.5 rounded-xl hover:bg-[#FAF8F5] transition-colors">
                    <p className="font-bold text-[#1F2923] text-xs">Day Spas & Wellness Retreats</p>
                    <p className="text-[10px] text-slate-500">Therapist rosters, treatment consents & billing</p>
                  </a>
                  <a href="#solutions" className="block p-2.5 rounded-xl hover:bg-[#FAF8F5] transition-colors">
                    <p className="font-bold text-[#1F2923] text-xs">Hair & Beauty Salons</p>
                    <p className="text-[10px] text-slate-500">Stylist scheduling, chair booking & fast POS</p>
                  </a>
                  <a href="#solutions" className="block p-2.5 rounded-xl hover:bg-[#FAF8F5] transition-colors">
                    <p className="font-bold text-[#1F2923] text-xs">Multi-Chain Spa & Salon Outlets</p>
                    <p className="text-[10px] text-slate-500">Centralized reports, inventory & staff payroll</p>
                  </a>
                </div>
              )}
            </div>

            <a href="#pricing" className="hover:text-[#1E3A2B] transition-colors">
              Pricing
            </a>

            {/* Resources Dropdown */}
            <div className="relative" onMouseEnter={() => setIsResourcesOpen(true)} onMouseLeave={() => setIsResourcesOpen(false)}>
              <button className="flex items-center gap-1 hover:text-[#1E3A2B] transition-colors py-1 cursor-pointer">
                <span>Resources</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>
              {isResourcesOpen && (
                <div className="absolute top-full left-0 w-56 bg-white rounded-2xl shadow-xl border border-[#EDE8E0] p-3 space-y-1 z-50">
                  <a href={`/tenant/${activeSlug}/booking`} className="block p-2 rounded-xl hover:bg-[#FAF8F5] text-xs font-semibold text-[#1F2923]">
                    Online Client Booking Portal
                  </a>
                  <a href="/superadmin" className="block p-2 rounded-xl hover:bg-[#FAF8F5] text-xs font-semibold text-[#1F2923]">
                    Super Admin Console
                  </a>
                  <a href={`/tenant/${activeSlug}/admin`} className="block p-2 rounded-xl hover:bg-[#FAF8F5] text-xs font-semibold text-[#1F2923]">
                    Outlet Operations Desk
                  </a>
                </div>
              )}
            </div>

            <a href="#footer" className="hover:text-[#1E3A2B] transition-colors">
              About Us
            </a>
          </nav>

          {/* Desktop Right Action Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href={`/tenant/${activeSlug}/login`}
              className="text-xs font-bold text-[#1E3A2B] hover:text-[#15291E] transition-colors px-2 py-1"
            >
              Log in
            </Link>

            <button
              onClick={() => openDemoModal()}
              className="bg-[#1E3A2B] hover:bg-[#15291E] text-white px-5 py-2.5 rounded-full text-xs font-semibold transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-98"
            >
              Book a Demo
            </button>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-[#1E3A2B] focus:outline-none"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-[#EDE8E0] px-6 py-4 space-y-3">
            <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-[#1F2923]">
              Features
            </a>
            <a href="#solutions" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-[#1F2923]">
              Solutions
            </a>
            <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-[#1F2923]">
              Pricing
            </a>
            <a href="#testimonials" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-[#1F2923]">
              Testimonials
            </a>
            <div className="pt-3 border-t border-[#EDE8E0] flex flex-col gap-2">
              <Link
                href={`/tenant/${activeSlug}/login`}
                className="w-full text-center py-2.5 rounded-xl border border-[#EDE8E0] text-xs font-bold text-[#1E3A2B]"
              >
                Log in
              </Link>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  openDemoModal();
                }}
                className="w-full py-2.5 rounded-xl bg-[#1E3A2B] text-white text-xs font-bold"
              >
                Book a Demo
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ─── HERO SECTION 1: ALL-IN-ONE SPA MANAGEMENT SOFTWARE (ARCH PHOTO) ─── */}
      <section className="pt-12 pb-20 md:pt-16 md:pb-28 overflow-hidden bg-[#FAF8F5]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-6 space-y-8 pr-0 lg:pr-6">
            <div className="space-y-4">
              <h1 className="font-luxury text-4xl sm:text-5xl lg:text-6xl text-[#1F2923] tracking-tight leading-[1.12]">
                All-in-One Spa Management Software
              </h1>
              <p className="text-[#5A685D] text-base sm:text-lg leading-relaxed max-w-lg font-normal">
                Careva Spa ERP helps you manage appointments, clients, staff, inventory and more — all in one beautifully simple platform.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => openDemoModal()}
                className="bg-[#1E3A2B] hover:bg-[#15291E] text-white px-7 py-3.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2 group cursor-pointer active:scale-98"
              >
                <span>Book a Demo</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <a
                href="#features"
                className="bg-white hover:bg-slate-50 border border-[#DDD7CC] text-[#1E3A2B] px-7 py-3.5 rounded-full font-bold text-xs tracking-wider transition-all shadow-xs"
              >
                Explore Features
              </a>
            </div>

            {/* Rating & Social Proof */}
            <div className="pt-4 flex items-center gap-4">
              <div className="flex -space-x-2">
                <img src="/testimonial_avatar.png" alt="User 1" className="w-9 h-9 rounded-full border-2 border-white object-cover shadow-xs" />
                <div className="w-9 h-9 rounded-full bg-[#1E3A2B] text-white font-bold text-xs flex items-center justify-center border-2 border-white">PS</div>
                <div className="w-9 h-9 rounded-full bg-[#E5E0D5] text-[#1F2923] font-bold text-xs flex items-center justify-center border-2 border-white">AM</div>
                <div className="w-9 h-9 rounded-full bg-[#88B04B] text-white font-bold text-xs flex items-center justify-center border-2 border-white">SK</div>
              </div>
              <div>
                <div className="flex items-center gap-1 text-[#E5A93C]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <p className="text-xs font-semibold text-[#1F2923] mt-0.5">
                  <span className="font-bold">4.9/5</span> from 200+ spa & salon owners
                </p>
              </div>
            </div>

          </div>

          {/* Right Hero Image: Arched Spa Photo Mask */}
          <div className="lg:col-span-6 relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-lg aspect-[4/5] rounded-t-[180px] rounded-b-[40px] overflow-hidden shadow-2xl border-4 border-white">
              <img
                src="/hero_spa_massage.png"
                alt="Spa Facial Massage Therapy"
                className="w-full h-full object-cover object-center scale-105 hover:scale-100 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>
          </div>

        </div>
      </section>

      {/* ─── SECTION 2: EVERYTHING YOU NEED TO RUN A SUCCESSFUL SPA (5 ICON BOXES) ─── */}
      <section className="py-16 md:py-20 bg-white border-y border-[#EDE8E0]">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="font-luxury text-3xl sm:text-4xl text-[#1F2923] tracking-tight">
              Everything You Need to Run a Successful Spa & Salon
            </h2>
          </div>

          {/* 5 Feature Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            
            {/* Card 1: Online Booking */}
            <div className="bg-[#FAF8F5] border border-[#EDE8E0] rounded-2xl p-6 text-center space-y-3 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-white border border-[#E5E0D5] text-[#1E3A2B] flex items-center justify-center mx-auto shadow-xs">
                <Calendar className="w-6 h-6 stroke-[1.75]" />
              </div>
              <h3 className="font-bold text-base text-[#1F2923]">Online Booking</h3>
              <p className="text-xs text-[#6E7A72] leading-relaxed">
                Easy scheduling and appointment management
              </p>
            </div>

            {/* Card 2: Client Management */}
            <div className="bg-[#FAF8F5] border border-[#EDE8E0] rounded-2xl p-6 text-center space-y-3 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-white border border-[#E5E0D5] text-[#1E3A2B] flex items-center justify-center mx-auto shadow-xs">
                <Users className="w-6 h-6 stroke-[1.75]" />
              </div>
              <h3 className="font-bold text-base text-[#1F2923]">Client Management</h3>
              <p className="text-xs text-[#6E7A72] leading-relaxed">
                Keep client data, history and preferences at hand
              </p>
            </div>

            {/* Card 3: Inventory Control */}
            <div className="bg-[#FAF8F5] border border-[#EDE8E0] rounded-2xl p-6 text-center space-y-3 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-white border border-[#E5E0D5] text-[#1E3A2B] flex items-center justify-center mx-auto shadow-xs">
                <Box className="w-6 h-6 stroke-[1.75]" />
              </div>
              <h3 className="font-bold text-base text-[#1F2923]">Inventory Control</h3>
              <p className="text-xs text-[#6E7A72] leading-relaxed">
                Track products, stock and supplies in real-time
              </p>
            </div>

            {/* Card 4: Staff Management */}
            <div className="bg-[#FAF8F5] border border-[#EDE8E0] rounded-2xl p-6 text-center space-y-3 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-white border border-[#E5E0D5] text-[#1E3A2B] flex items-center justify-center mx-auto shadow-xs">
                <UserCheck className="w-6 h-6 stroke-[1.75]" />
              </div>
              <h3 className="font-bold text-base text-[#1F2923]">Staff Management</h3>
              <p className="text-xs text-[#6E7A72] leading-relaxed">
                Manage staff, shifts, commissions & performance
              </p>
            </div>

            {/* Card 5: Reports & Analytics */}
            <div className="bg-[#FAF8F5] border border-[#EDE8E0] rounded-2xl p-6 text-center space-y-3 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-white border border-[#E5E0D5] text-[#1E3A2B] flex items-center justify-center mx-auto shadow-xs">
                <PieChart className="w-6 h-6 stroke-[1.75]" />
              </div>
              <h3 className="font-bold text-base text-[#1F2923]">Reports & Analytics</h3>
              <p className="text-xs text-[#6E7A72] leading-relaxed">
                Powerful insights to grow your spa & salon business
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ─── SECTION 3: SMARTER OPERATIONS (A POWERFUL DASHBOARD FOR BETTER DECISIONS) ─── */}
      <section className="py-20 md:py-24 bg-[#FAF8F5]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column */}
          <div className="lg:col-span-5 space-y-7">
            <div className="space-y-3">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#5A685D] block">
                SMARTER OPERATIONS
              </span>
              <h2 className="font-luxury text-3xl sm:text-4xl text-[#1F2923] tracking-tight leading-tight">
                A Powerful Dashboard for Better Decisions
              </h2>
              <p className="text-[#5A685D] text-sm md:text-base leading-relaxed">
                Get a real-time overview of your spa's performance and make data-driven decisions with ease.
              </p>
            </div>

            {/* 4 Checklist bullets */}
            <div className="space-y-3 pt-1">
              {[
                "Daily overview & key metrics",
                "Revenue & appointment analytics",
                "Top services & product performance",
                "Staff performance tracking"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#1E3A2B] text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <span className="text-xs md:text-sm font-semibold text-[#1F2923]">{item}</span>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                onClick={() => openDemoModal()}
                className="bg-[#1E3A2B] hover:bg-[#15291E] text-white px-7 py-3 rounded-full font-bold text-xs uppercase tracking-wider transition-all shadow-md inline-flex items-center gap-2 group cursor-pointer"
              >
                <span>See It in Action</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Right Column: Dashboard Mockup */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl border border-[#EDE8E0] shadow-2xl p-6 space-y-5 text-[#1F2923] font-sans">
              
              <div className="flex items-center justify-between border-b border-[#F0EBE1] pb-3">
                <div className="flex items-center gap-2">
                  <CarevaSpaLogo />
                </div>
                <div className="flex items-center gap-3">
                  <Search className="w-4 h-4 text-slate-400" />
                  <Bell className="w-4 h-4 text-slate-400" />
                  <img src="/testimonial_avatar.png" alt="Admin" className="w-7 h-7 rounded-full object-cover border border-slate-200" />
                </div>
              </div>

              <div>
                <h3 className="font-bold text-sm text-[#1F2923]">Welcome back, Admin</h3>
                <p className="text-[10px] text-slate-400">Here's what's happening at your spa today.</p>
              </div>

              {/* 4 Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#FAF8F5] border border-[#F0EBE1] rounded-xl p-3">
                  <span className="text-[9px] text-slate-500 font-semibold block">Total Revenue</span>
                  <p className="text-base font-black text-[#1F2923] mt-0.5">₹ 2,45,000</p>
                  <span className="text-[9px] font-semibold text-emerald-600">+12.5% from last week</span>
                </div>
                <div className="bg-[#FAF8F5] border border-[#F0EBE1] rounded-xl p-3">
                  <span className="text-[9px] text-slate-500 font-semibold block">Appointments</span>
                  <p className="text-base font-black text-[#1F2923] mt-0.5">128</p>
                  <span className="text-[9px] font-semibold text-emerald-600">+8.2% from last week</span>
                </div>
                <div className="bg-[#FAF8F5] border border-[#F0EBE1] rounded-xl p-3">
                  <span className="text-[9px] text-slate-500 font-semibold block">New Clients</span>
                  <p className="text-base font-black text-[#1F2923] mt-0.5">32</p>
                  <span className="text-[9px] font-semibold text-emerald-600">+11.3% from last week</span>
                </div>
                <div className="bg-[#FAF8F5] border border-[#F0EBE1] rounded-xl p-3">
                  <span className="text-[9px] text-slate-500 font-semibold block">Products Sold</span>
                  <p className="text-base font-black text-[#1F2923] mt-0.5">356</p>
                  <span className="text-[9px] font-semibold text-emerald-600">+9.4% from last week</span>
                </div>
              </div>

              {/* Revenue & Services Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
                <div className="sm:col-span-7 bg-[#FAF8F5] border border-[#F0EBE1] rounded-xl p-3 space-y-2">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-[#1F2923]">Revenue Overview</span>
                    <span className="text-[9px] text-slate-400">This Week ˅</span>
                  </div>
                  <div className="h-20 w-full">
                    <svg className="w-full h-full" viewBox="0 0 300 70" fill="none">
                      <path d="M 0 55 Q 50 25, 100 45 T 200 25 T 300 15" stroke="#1E3A2B" strokeWidth="2.5" fill="none" />
                      <path d="M 0 55 Q 50 25, 100 45 T 200 25 T 300 15 L 300 70 L 0 70 Z" fill="#1E3A2B" opacity="0.1" />
                    </svg>
                  </div>
                </div>

                <div className="sm:col-span-5 bg-[#FAF8F5] border border-[#F0EBE1] rounded-xl p-3 space-y-2">
                  <span className="text-[11px] font-bold text-[#1F2923] block">Top Services</span>
                  {[
                    { name: "Aroma Massage", rev: "₹ 78,500" },
                    { name: "Deep Tissue Massage", rev: "₹ 56,000" },
                    { name: "Facial Treatment", rev: "₹ 43,200" },
                    { name: "Body Spa", rev: "₹ 32,100" },
                    { name: "Hair Spa", rev: "₹ 21,300" }
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-[9px] font-medium text-slate-700">
                      <span>{item.name}</span>
                      <span className="font-bold text-[#1F2923]">{item.rev}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ─── SECTION 4: EVERYTHING AT YOUR FINGERTIPS (FULL FEATURE BREAKDOWN) ─── */}
      <section id="features" className="py-20 md:py-24 bg-white border-y border-[#EDE8E0]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column */}
          <div className="lg:col-span-5 space-y-7">
            <div className="space-y-3">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#5A685D] block">
                COMPLETE CONTROL, ALL IN ONE PLACE
              </span>
              <h2 className="font-luxury text-3xl sm:text-4xl text-[#1F2923] tracking-tight leading-[1.15]">
                Everything at Your Fingertips
              </h2>
              <p className="text-[#5A685D] text-sm md:text-base leading-relaxed font-normal pt-1">
                Careva Spa & Salon ERP brings your entire spa and salon operations together in one beautiful, easy-to-use platform.
              </p>
            </div>

            <div className="space-y-3.5 pt-1">
              {[
                "Real-time dashboard & insights",
                "Manage bookings, staff & services",
                "Track inventory & sales performance",
                "Delight clients & grow revenue"
              ].map((point, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#1E3A2B] flex items-center justify-center text-white shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <span className="text-xs md:text-sm font-semibold text-[#1F2923]">{point}</span>
                </div>
              ))}
            </div>

            <div className="pt-3">
              <button
                onClick={() => openDemoModal()}
                className="inline-flex items-center gap-2.5 bg-white hover:bg-[#FAF8F5] border border-[#DDD7CC] text-[#1E3A2B] px-6 py-3 rounded-2xl text-xs font-bold shadow-xs hover:shadow-sm transition-all group cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-[#EFF4EE] flex items-center justify-center text-[#1E3A2B] group-hover:scale-110 transition-transform">
                  <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                </div>
                <span>See How It Works</span>
              </button>
            </div>
          </div>

          {/* Right Column: Interactive Mockup Card */}
          <div className="lg:col-span-7">
            <div className="bg-[#FAF8F5] rounded-3xl border border-[#EDE8E0] shadow-2xl p-6 md:p-7 space-y-5 text-[#1F2923] font-sans">
              
              <div className="flex gap-6">
                
                {/* Left Mini Sidebar */}
                <div className="hidden sm:flex flex-col w-36 border-r border-[#F0EBE1] pr-4 space-y-4 shrink-0">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#F0EBE1]">
                    <div className="w-6 h-6 rounded-md bg-[#1E3A2B] flex items-center justify-center text-white text-[10px] font-bold">
                      C
                    </div>
                    <span className="font-bold text-xs text-[#1F2923]">Careva</span>
                  </div>

                  <div className="space-y-1 text-[11px] font-medium text-slate-500">
                    <div className="px-2.5 py-1.5 rounded-lg bg-[#EFF4EE] text-[#1E3A2B] font-bold flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Dashboard</span>
                    </div>
                    <div className="px-2.5 py-1.5 rounded-lg hover:bg-slate-50 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Appointments</span>
                    </div>
                    <div className="px-2.5 py-1.5 rounded-lg hover:bg-slate-50 flex items-center gap-2">
                      <Users className="w-3.5 h-3.5" />
                      <span>Clients</span>
                    </div>
                    <div className="px-2.5 py-1.5 rounded-lg hover:bg-slate-50 flex items-center gap-2">
                      <HeartHandshake className="w-3.5 h-3.5" />
                      <span>Staff</span>
                    </div>
                    <div className="px-2.5 py-1.5 rounded-lg hover:bg-slate-50 flex items-center gap-2">
                      <Scissors className="w-3.5 h-3.5" />
                      <span>Services</span>
                    </div>
                    <div className="px-2.5 py-1.5 rounded-lg hover:bg-slate-50 flex items-center gap-2">
                      <Box className="w-3.5 h-3.5" />
                      <span>Inventory</span>
                    </div>
                  </div>
                </div>

                {/* Main Content Pane */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-[#1F2923]">Dashboard</h3>
                      <p className="text-[10px] text-slate-400">Here's what's happening at your spa & salon today.</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#EDE8E0] text-[10px] font-medium text-slate-600 bg-white">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>May 12 - May 18, 2024</span>
                        <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
                      </div>
                      <img src="/testimonial_avatar.png" alt="Avatar" className="w-7 h-7 rounded-full object-cover border border-slate-200" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="bg-white border border-[#F0EBE1] rounded-xl p-2.5">
                      <span className="text-[9px] text-slate-500 font-semibold block">Today's Revenue</span>
                      <p className="text-sm font-black text-[#1F2923] mt-0.5">₹ 24,560</p>
                      <span className="text-[9px] font-semibold text-emerald-600">+12.5% vs yesterday</span>
                    </div>
                    <div className="bg-white border border-[#F0EBE1] rounded-xl p-2.5">
                      <span className="text-[9px] text-slate-500 font-semibold block">Appointments</span>
                      <p className="text-sm font-black text-[#1F2923] mt-0.5">28</p>
                      <span className="text-[9px] font-semibold text-emerald-600">+16.7% vs yesterday</span>
                    </div>
                    <div className="bg-white border border-[#F0EBE1] rounded-xl p-2.5">
                      <span className="text-[9px] text-slate-500 font-semibold block">New Clients</span>
                      <p className="text-sm font-black text-[#1F2923] mt-0.5">14</p>
                      <span className="text-[9px] font-semibold text-emerald-600">+7.7% vs yesterday</span>
                    </div>
                    <div className="bg-white border border-[#F0EBE1] rounded-xl p-2.5">
                      <span className="text-[9px] text-slate-500 font-semibold block">Products Sold</span>
                      <p className="text-sm font-black text-[#1F2923] mt-0.5">42</p>
                      <span className="text-[9px] font-semibold text-emerald-600">+9.5% vs yesterday</span>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ─── SECTION 5: TAILORED SOLUTIONS FOR EVERY SPA & SALON (PHOTO CARDS) ─── */}
      <section id="solutions" className="py-20 md:py-28 bg-[#FAF8F5]">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#5A685D] block">
              TAILORED SOLUTIONS FOR EVERY SPA & SALON
            </span>
            <h2 className="font-luxury text-3xl sm:text-4xl text-[#1F2923] tracking-tight">
              Built for Every Type of Wellness Business
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 items-stretch">
            
            {/* Card 1: Day Spas */}
            <div className="bg-white border border-[#EDE8E0] rounded-2xl p-5 flex flex-col justify-between text-center relative group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-11 h-11 rounded-full bg-[#1E3A2B] text-white flex items-center justify-center -mt-9 mb-4 mx-auto shadow-md border-2 border-white">
                <Flower2 className="w-5 h-5" />
              </div>
              <div className="space-y-3">
                <div className="aspect-[4/3] rounded-xl overflow-hidden mb-3 border border-[#E5E0D5]">
                  <img
                    src="/day_spas_treatment_room.png"
                    alt="Day Spas"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <h3 className="font-bold text-base text-[#1F2923]">Day Spas</h3>
                <p className="text-xs text-[#6E7A72] leading-relaxed">
                  Manage appointments, therapists, inventory & client experience effortlessly.
                </p>
              </div>
            </div>

            {/* Card 2: Resort Spas */}
            <div className="bg-white border border-[#EDE8E0] rounded-2xl p-5 flex flex-col justify-between text-center relative group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-11 h-11 rounded-full bg-[#1E3A2B] text-white flex items-center justify-center -mt-9 mb-4 mx-auto shadow-md border-2 border-white">
                <Sparkle className="w-5 h-5" />
              </div>
              <div className="space-y-3">
                <div className="aspect-[4/3] rounded-xl overflow-hidden mb-3 border border-[#E5E0D5]">
                  <img
                    src="/resort_spa_pool.png"
                    alt="Resort Spas"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <h3 className="font-bold text-base text-[#1F2923]">Resort Spas</h3>
                <p className="text-xs text-[#6E7A72] leading-relaxed">
                  Streamline operations across multiple locations & teams seamlessly.
                </p>
              </div>
            </div>

            {/* Card 3: Salons & Beauty Centers */}
            <div className="bg-white border border-[#EDE8E0] rounded-2xl p-5 flex flex-col justify-between text-center relative group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-11 h-11 rounded-full bg-[#1E3A2B] text-white flex items-center justify-center -mt-9 mb-4 mx-auto shadow-md border-2 border-white">
                <Droplets className="w-5 h-5" />
              </div>
              <div className="space-y-3">
                <div className="aspect-[4/3] rounded-xl overflow-hidden mb-3 border border-[#E5E0D5]">
                  <img
                    src="/salon_beauty_center.png"
                    alt="Salons & Beauty Centers"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <h3 className="font-bold text-base text-[#1F2923]">Salons & Beauty Centers</h3>
                <p className="text-xs text-[#6E7A72] leading-relaxed">
                  Handle services, staff, products & loyalty programs in one place.
                </p>
              </div>
            </div>

            {/* Card 4: Wellness Centers */}
            <div className="bg-white border border-[#EDE8E0] rounded-2xl p-5 flex flex-col justify-between text-center relative group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-11 h-11 rounded-full bg-[#1E3A2B] text-white flex items-center justify-center -mt-9 mb-4 mx-auto shadow-md border-2 border-white">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-3">
                <div className="aspect-[4/3] rounded-xl overflow-hidden mb-3 border border-[#E5E0D5]">
                  <img
                    src="/wellness_center_meditation.png"
                    alt="Wellness Centers"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <h3 className="font-bold text-base text-[#1F2923]">Wellness Centers</h3>
                <p className="text-xs text-[#6E7A72] leading-relaxed">
                  Manage therapies, memberships & sessions with ease.
                </p>
              </div>
            </div>

            {/* Card 5: Medical Spas */}
            <div className="bg-white border border-[#EDE8E0] rounded-2xl p-5 flex flex-col justify-between text-center relative group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-11 h-11 rounded-full bg-[#1E3A2B] text-white flex items-center justify-center -mt-9 mb-4 mx-auto shadow-md border-2 border-white">
                <Box className="w-5 h-5" />
              </div>
              <div className="space-y-3">
                <div className="aspect-[4/3] rounded-xl overflow-hidden mb-3 border border-[#E5E0D5]">
                  <img
                    src="/medical_spa_skincare.png"
                    alt="Medical Spas"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <h3 className="font-bold text-base text-[#1F2923]">Medical Spas</h3>
                <p className="text-xs text-[#6E7A72] leading-relaxed">
                  Stay compliant, manage treatments & deliver exceptional care.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ─── SECTION 6: PRICING ─── */}
      <section id="pricing" className="py-20 md:py-28 bg-white border-y border-[#EDE8E0]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          <div className="lg:col-span-4 space-y-6">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#5A685D] block">
              SIMPLE PRICING, POWERFUL VALUE
            </span>

            <h2 className="font-luxury text-3xl sm:text-4xl text-[#1F2923] tracking-tight leading-snug">
              Choose the Plan That Fits Your Spa
            </h2>

            <p className="text-[#5A685D] text-sm md:text-base leading-relaxed">
              No hidden fees. No surprises. Just everything you need to run & grow your spa or salon.
            </p>

            <div className="pt-2">
              <svg className="w-8 h-8 text-[#88B04B]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 3C10.5 6 7 8 4 8C7 11 10.5 13 12 16C13.5 13 17 11 20 8C17 8 13.5 6 12 3Z" fill="currentColor" opacity="0.3" />
                <path d="M12 21V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            
            {/* Starter Plan */}
            <div className="bg-[#FAF8F5] border border-[#EDE8E0] rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-md transition-all">
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-lg text-[#1F2923]">Starter</h3>
                  <p className="text-xs text-[#6E7A72] mt-1">Perfect for small spas & salons getting started.</p>
                </div>

                <div className="pt-2 border-t border-[#F0EBE1]">
                  <span className="font-luxury text-3xl font-bold text-[#1F2923]">₹2,999</span>
                  <span className="text-xs text-[#6E7A72]"> /month</span>
                  <p className="text-[10px] text-slate-400 font-medium">Billed annually</p>
                </div>

                <div className="space-y-2.5 pt-2 text-xs text-[#2B352E]">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#1E3A2B] shrink-0" />
                    <span>Up to 2 Staff Users</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#1E3A2B] shrink-0" />
                    <span>Online Booking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#1E3A2B] shrink-0" />
                    <span>Client Management</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#1E3A2B] shrink-0" />
                    <span>Basic Reports</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#1E3A2B] shrink-0" />
                    <span>Email Support</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => openDemoModal("Starter")}
                className="w-full py-3 rounded-2xl border border-[#EDE8E0] text-[#1E3A2B] font-bold text-xs bg-white hover:bg-[#FAF8F5] transition-colors cursor-pointer"
              >
                Get Started
              </button>
            </div>

            {/* Professional Plan (MOST POPULAR) */}
            <div className="bg-white border-2 border-[#1E3A2B] rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-xl relative scale-105 z-10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#1E3A2B] text-white px-3.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest shadow-sm">
                MOST POPULAR
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-lg text-[#1F2923]">Professional</h3>
                  <p className="text-xs text-[#6E7A72] mt-1">For growing spas, salons & wellness centers.</p>
                </div>

                <div className="pt-2 border-t border-[#F0EBE1]">
                  <span className="font-luxury text-3xl font-bold text-[#1F2923]">₹5,999</span>
                  <span className="text-xs text-[#6E7A72]"> /month</span>
                  <p className="text-[10px] text-slate-400 font-medium">Billed annually</p>
                </div>

                <div className="space-y-2.5 pt-2 text-xs text-[#2B352E]">
                  <div className="flex items-center gap-2 font-semibold">
                    <Check className="w-4 h-4 text-[#1E3A2B] shrink-0" />
                    <span>Up to 10 Staff Users</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#1E3A2B] shrink-0" />
                    <span>Everything in Starter</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#1E3A2B] shrink-0" />
                    <span>Inventory Management</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#1E3A2B] shrink-0" />
                    <span>Advanced Reports</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#1E3A2B] shrink-0" />
                    <span>SMS & Email Marketing</span>
                  </div>
                  <div className="flex items-center gap-2 font-semibold">
                    <Check className="w-4 h-4 text-[#1E3A2B] shrink-0" />
                    <span>Priority Support</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => openDemoModal("Professional")}
                className="w-full py-3.5 rounded-2xl bg-[#1E3A2B] hover:bg-[#15291E] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
              >
                Get Started
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-[#FAF8F5] border border-[#EDE8E0] rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-md transition-all">
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-lg text-[#1F2923]">Enterprise</h3>
                  <p className="text-xs text-[#6E7A72] mt-1">For large spa chains, resorts & multi-outlets.</p>
                </div>

                <div className="pt-2 border-t border-[#F0EBE1]">
                  <span className="font-luxury text-3xl font-bold text-[#1F2923]">₹11,999</span>
                  <span className="text-xs text-[#6E7A72]"> /month</span>
                  <p className="text-[10px] text-slate-400 font-medium">Billed annually</p>
                </div>

                <div className="space-y-2.5 pt-2 text-xs text-[#2B352E]">
                  <div className="flex items-center gap-2 font-semibold">
                    <Check className="w-4 h-4 text-[#1E3A2B] shrink-0" />
                    <span>Unlimited Staff Users</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#1E3A2B] shrink-0" />
                    <span>Everything in Professional</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#1E3A2B] shrink-0" />
                    <span>Multi-location Management</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#1E3A2B] shrink-0" />
                    <span>Custom Integrations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#1E3A2B] shrink-0" />
                    <span>Dedicated Account Manager</span>
                  </div>
                  <div className="flex items-center gap-2 font-semibold">
                    <Check className="w-4 h-4 text-[#1E3A2B] shrink-0" />
                    <span>24/7 Phone Support</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => openDemoModal("Enterprise")}
                className="w-full py-3 rounded-2xl border border-[#EDE8E0] text-[#1E3A2B] font-bold text-xs bg-white hover:bg-[#FAF8F5] transition-colors cursor-pointer"
              >
                Get Started
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* ─── SECTION 7: TESTIMONIAL & SPA STONES CTA CARD ─── */}
      <section id="testimonials" className="py-20 md:py-24 bg-[#FAF8F5]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          
          {/* Left Column: Testimonial */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-8 pr-0 lg:pr-4">
            <div className="space-y-4">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#5A685D] block">
                TRUSTED BY SPA OWNERS
              </span>
              <h2 className="font-luxury text-3xl sm:text-4xl text-[#1F2923] leading-snug">
                Loved by Spa Professionals Across the Country
              </h2>
            </div>

            <div className="space-y-5 pt-1">
              <span className="font-serif text-5xl text-[#C9D6CC] leading-none block -mb-4">“</span>
              <p className="text-[#4A574E] text-base leading-relaxed font-normal italic">
                Careva has transformed the way we manage our spa. It's easy to use, saves us time and helps us focus on what truly matters — our clients.
              </p>

              <div className="flex items-center gap-3.5 pt-2">
                <img
                  src="/testimonial_avatar.png"
                  alt="Priya Mehta"
                  className="w-11 h-11 rounded-full object-cover border border-[#EDE8E0]"
                />
                <div>
                  <h4 className="font-bold text-sm text-[#1F2923]">Priya Mehta</h4>
                  <p className="text-xs text-[#6E7A72]">Serenity Spa, Mumbai</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <span className="w-2 h-2 rounded-full border border-[#1E3A2B]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#1E3A2B]" />
              <span className="w-2 h-2 rounded-full border border-[#1E3A2B]" />
            </div>
          </div>

          {/* Right Column: Zen Spa Stones CTA Card */}
          <div className="lg:col-span-7 bg-[#EFEBE4] border border-[#E5E0D5] rounded-3xl p-8 sm:p-12 relative overflow-hidden flex flex-col sm:flex-row justify-between items-center shadow-lg gap-8">
            <div className="space-y-4 z-10 max-w-sm">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#1E3A2B] shadow-xs">
                <Flower2 className="w-4 h-4" />
              </div>
              <h3 className="font-luxury text-2xl sm:text-3xl text-[#1F2923] leading-snug">
                Ready to Elevate Your Spa Business?
              </h3>
              <p className="text-[#6E7A72] text-xs sm:text-sm leading-relaxed">
                Join hundreds of spa owners who are growing their business with Careva Spa ERP.
              </p>
              
              <div className="pt-2">
                <button
                  onClick={() => openDemoModal()}
                  className="bg-[#1E3A2B] hover:bg-[#15291E] text-white px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2 group cursor-pointer"
                >
                  <span>Book a Demo Now</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Zen Spa Stones Image */}
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 shrink-0 z-10">
              <img
                src="/zen_spa_stones.png"
                alt="Zen Spa Stones"
                className="w-full h-full object-contain drop-shadow-xl"
              />
            </div>
          </div>

        </div>
      </section>

      {/* ─── SECTION 8: TRUST BADGES ROW ─── */}
      <section className="py-10 bg-white border-t border-[#EDE8E0]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#FAF8F5] border border-[#E5E0D5] flex items-center justify-center text-[#1E3A2B] shrink-0 shadow-xs">
              <ShieldCheck className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h5 className="font-bold text-xs text-[#1F2923]">Secure & Reliable</h5>
              <p className="text-[10px] text-[#6E7A72]">Your data is safe with us</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#FAF8F5] border border-[#E5E0D5] flex items-center justify-center text-[#1E3A2B] shrink-0 shadow-xs">
              <Sparkles className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h5 className="font-bold text-xs text-[#1F2923]">Easy to Use</h5>
              <p className="text-[10px] text-[#6E7A72]">Simple. Intuitive. Efficient.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#FAF8F5] border border-[#E5E0D5] flex items-center justify-center text-[#1E3A2B] shrink-0 shadow-xs">
              <Headphones className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h5 className="font-bold text-xs text-[#1F2923]">24/7 Support</h5>
              <p className="text-[10px] text-[#6E7A72]">We're here when you need us</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#FAF8F5] border border-[#E5E0D5] flex items-center justify-center text-[#1E3A2B] shrink-0 shadow-xs">
              <TrendingUp className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h5 className="font-bold text-xs text-[#1F2923]">Scalable</h5>
              <p className="text-[10px] text-[#6E7A72]">Grow your spa, we'll grow with you</p>
            </div>
          </div>

        </div>
      </section>

      {/* ─── SECTION 9: DEEP FOREST GREEN FOOTER ─── */}
      <footer id="footer" className="bg-[#15271D] text-[#C0CCC3] pt-16 pb-8 border-t border-[#1E3A2B]">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            
            <div className="md:col-span-4 space-y-4">
              <CarevaSpaLogo darkBg={true} />
              <p className="text-xs text-[#9EB0A3] leading-relaxed max-w-sm">
                The all-in-one ERP software designed exclusively for spa & wellness businesses.
              </p>

              <div className="flex items-center gap-3 pt-2">
                <a href="#" className="w-8 h-8 rounded-full bg-[#1E3A2B] flex items-center justify-center text-[#C0CCC3] hover:text-white transition-colors">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-[#1E3A2B] flex items-center justify-center text-[#C0CCC3] hover:text-white transition-colors">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-[#1E3A2B] flex items-center justify-center text-[#C0CCC3] hover:text-white transition-colors">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.762-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-[#1E3A2B] flex items-center justify-center text-[#C0CCC3] hover:text-white transition-colors">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
              </div>
            </div>

            <div className="md:col-span-2 space-y-3">
              <h5 className="font-bold text-xs text-white uppercase tracking-wider">Product</h5>
              <ul className="space-y-2 text-xs">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#solutions" className="hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Changelog</a></li>
              </ul>
            </div>

            <div className="md:col-span-2 space-y-3">
              <h5 className="font-bold text-xs text-white uppercase tracking-wider">Company</h5>
              <ul className="space-y-2 text-xs">
                <li><a href="#footer" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#footer" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#footer" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#footer" className="hover:text-white transition-colors">Contact Us</a></li>
              </ul>
            </div>

            <div className="md:col-span-2 space-y-3">
              <h5 className="font-bold text-xs text-white uppercase tracking-wider">Resources</h5>
              <ul className="space-y-2 text-xs">
                <li><a href={`/tenant/${activeSlug}/booking`} className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="/superadmin" className="hover:text-white transition-colors">Guides</a></li>
                <li><a href={`/tenant/${activeSlug}/admin`} className="hover:text-white transition-colors">Webinars</a></li>
                <li><a href="#footer" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>

            <div className="md:col-span-2 space-y-3">
              <h5 className="font-bold text-xs text-white uppercase tracking-wider">Newsletter</h5>
              <p className="text-[11px] text-[#9EB0A3]">Get tips, updates & resources straight to your inbox.</p>
              
              <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="w-full bg-[#1E3A2B] border border-[#2D4D3A] rounded-xl px-3 py-2 pr-9 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-[#88B04B]"
                  />
                  <button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-slate-300 hover:text-white">
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
                {newsletterSent && (
                  <p className="text-[10px] text-emerald-400">Subscribed successfully!</p>
                )}
              </form>
            </div>

          </div>

          <div className="pt-6 border-t border-[#1E3A2B] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#809486]">
            <p>© 2026 Careva Spa ERP. All rights reserved.</p>
            <div className="flex items-center gap-6 mt-2 sm:mt-0">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </div>

        </div>
      </footer>

      {/* ─── BOOK A DEMO MODAL ─── */}
      {isDemoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-[#EDE8E0] rounded-3xl p-8 max-w-md w-full shadow-2xl relative space-y-5">
            <button
              onClick={() => setIsDemoModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>

            {demoSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-luxury text-2xl text-[#1F2923]">Demo Request Received!</h3>
                <p className="text-xs text-[#5A685D] leading-relaxed">
                  Thank you <span className="font-bold">{ownerName}</span>! Our Spa & Salon ERP specialist will get in touch with you shortly to demonstrate <span className="font-bold">{businessName}</span>.
                </p>
                <button
                  onClick={() => setIsDemoModalOpen(false)}
                  className="w-full py-3 rounded-2xl bg-[#1E3A2B] text-white text-xs font-bold uppercase tracking-wider"
                >
                  Return to Website
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-[#1E3A2B]">
                    <Sparkles className="w-3 h-3" />
                    <span>Free Live Demo</span>
                  </div>
                  <h3 className="font-luxury text-2xl text-[#1F2923]">Book Your Spa & Salon Demo</h3>
                  <p className="text-xs text-slate-500">Experience how Careva Spa ERP simplifies your operations.</p>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleBookDemo} className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Your Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Priya Sharma"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 border border-[#EDE8E0] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1E3A2B]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Spa / Salon Business Name</label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Serenity Spa & Hair Studio"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 border border-[#EDE8E0] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1E3A2B]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Email</label>
                      <input
                        type="email"
                        required
                        placeholder="name@example.com"
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                        className="w-full px-3 py-2.5 border border-[#EDE8E0] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1E3A2B]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Phone Number</label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 9988776655"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full px-3 py-2.5 border border-[#EDE8E0] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1E3A2B]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">City / Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Mumbai, Maharashtra"
                        value={cityLocation}
                        onChange={(e) => setCityLocation(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 border border-[#EDE8E0] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1E3A2B]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-2xl bg-[#1E3A2B] hover:bg-[#15291E] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md mt-2 cursor-pointer"
                  >
                    Submit Demo Request
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
