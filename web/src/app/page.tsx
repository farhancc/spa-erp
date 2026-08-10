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
  Play,
  Scissors,
  Receipt,
  Mail,
  Building,
  MapPin
} from "lucide-react";
import { getSharedTenants, saveDemoBooking } from "../shared/utils/utils";

// Clean Lotus Icon Logo matching reference image
function CarevaSpaLogo() {
  return (
    <Link href="/" className="flex items-center gap-3 group">
      <div className="w-9 h-9 rounded-full bg-[#1E3A2B] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 3C10.5 6 7 8 4 8C7 11 10.5 13 12 16C13.5 13 17 11 20 8C17 8 13.5 6 12 3Z" fill="currentColor" opacity="0.9" />
          <path d="M12 8C11 10 8.5 11.5 6 11.5C8.5 13.5 11 15 12 17C13 15 15.5 13.5 18 11.5C15.5 11.5 13 10 12 8Z" fill="#88B04B" />
          <path d="M12 21V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <div className="flex flex-col">
        <span className="font-luxury font-bold text-xl tracking-tight text-[#1F2923] leading-none">
          Careva
        </span>
        <span className="text-[9px] font-sans font-semibold tracking-[0.25em] text-[#6E7A72] uppercase -mt-0.5">
          SPA ERP
        </span>
      </div>
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
  const [selectedPlan, setSelectedPlan] = useState("Growth Spa");
  const [demoSuccess, setDemoSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Solutions dropdown state
  const [isSolutionsOpen, setIsSolutionsOpen] = useState(false);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);

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
                  <a href={`/tenant/${activeSlug}`} className="block p-2.5 rounded-xl hover:bg-[#FAF8F5] transition-colors">
                    <p className="font-bold text-[#1F2923] text-xs">Day Spas & Wellness Centers</p>
                    <p className="text-[10px] text-slate-500">Appointments, treatment consents & billing</p>
                  </a>
                  <a href={`/tenant/${activeSlug}`} className="block p-2.5 rounded-xl hover:bg-[#FAF8F5] transition-colors">
                    <p className="font-bold text-[#1F2923] text-xs">Hair & Beauty Salons</p>
                    <p className="text-[10px] text-slate-500">Stylist scheduling & POS checkout</p>
                  </a>
                  <a href={`/tenant/${activeSlug}`} className="block p-2.5 rounded-xl hover:bg-[#FAF8F5] transition-colors">
                    <p className="font-bold text-[#1F2923] text-xs">Multi-Chain Outlets</p>
                    <p className="text-[10px] text-slate-500">Centralized analytics & staff payroll</p>
                  </a>
                </div>
              )}
            </div>

            <a href="#pricing" className="hover:text-[#1E3A2B] transition-colors">
              Pricing
            </a>

            <a href="#about" className="hover:text-[#1E3A2B] transition-colors">
              About Us
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
                    Online Booking Portal
                  </a>
                  <a href="/superadmin" className="block p-2 rounded-xl hover:bg-[#FAF8F5] text-xs font-semibold text-[#1F2923]">
                    Super Admin Console
                  </a>
                  <a href={`/tenant/${activeSlug}/admin`} className="block p-2 rounded-xl hover:bg-[#FAF8F5] text-xs font-semibold text-[#1F2923]">
                    Outlet Manager Desk
                  </a>
                </div>
              )}
            </div>
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
            <a href="#dashboard" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-[#1F2923]">
              Dashboard
            </a>
            <a href="#testimonials" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-[#1F2923]">
              Testimonials
            </a>
            <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-[#1F2923]">
              Pricing
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

      {/* ─── HERO SECTION ─── */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Text & CTAs */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Main Headline */}
            <div className="space-y-4">
              <h1 className="font-luxury text-4xl sm:text-5xl lg:text-6xl text-[#1F2923] tracking-tight leading-[1.12]">
                All-in-One <span className="inline-block text-[#88B04B] font-sans text-3xl md:text-4xl align-top">🌿</span>
                <br />
                Spa Management
                <br />
                Software
              </h1>

              <p className="text-[#5A685D] text-base sm:text-lg max-w-xl leading-relaxed font-normal">
                Careva Spa ERP helps you manage appointments, clients, staff, inventory and more — all in one beautifully simple platform.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => openDemoModal()}
                className="bg-[#1E3A2B] hover:bg-[#15291E] text-white px-7 py-3.5 rounded-2xl text-sm font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2.5 group cursor-pointer active:scale-98"
              >
                <span>Book a Demo</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <a
                href="#features"
                className="bg-[#FAF8F5] hover:bg-white border border-[#DDD7CC] text-[#1E3A2B] px-7 py-3.5 rounded-2xl text-sm font-semibold transition-all shadow-xs hover:shadow-sm"
              >
                Explore Features
              </a>
            </div>

            {/* Social Proof Rating */}
            <div className="flex items-center gap-4 pt-4 border-t border-[#EDE8E0]/80">
              {/* Avatar stack */}
              <div className="flex -space-x-2.5">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                  alt="Spa Manager"
                  className="w-10 h-10 rounded-full border-2 border-[#FAF8F5] object-cover"
                />
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
                  alt="Spa Owner"
                  className="w-10 h-10 rounded-full border-2 border-[#FAF8F5] object-cover"
                />
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80"
                  alt="Wellness Specialist"
                  className="w-10 h-10 rounded-full border-2 border-[#FAF8F5] object-cover"
                />
                <img
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80"
                  alt="Salon Owner"
                  className="w-10 h-10 rounded-full border-2 border-[#FAF8F5] object-cover"
                />
              </div>

              {/* Stars and score */}
              <div>
                <div className="flex items-center gap-1 text-[#E5A93C]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-xs font-semibold text-[#4A574E] mt-0.5">
                  <span className="font-bold text-[#1F2923]">4.9/5</span> from 200+ spa owners
                </p>
              </div>
            </div>

          </div>

          {/* Right Column: Hero Spa Image Frame */}
          <div className="lg:col-span-5 relative flex justify-center">
            
            {/* Arch Mask Container matching reference image */}
            <div className="relative w-full max-w-md aspect-[4/5] rounded-t-[140px] rounded-b-[40px] overflow-hidden shadow-2xl border-4 border-white/60">
              <img
                src="/hero_spa_massage.png"
                alt="Serene Spa Massage Session"
                className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
              />
              
              {/* Soft warm gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1E3A2B]/20 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Decorative Floating Pill Badge */}
            <div className="absolute bottom-6 left-2 bg-white/90 backdrop-blur-md border border-[#EDE8E0] px-4 py-2.5 rounded-2xl shadow-lg flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#EFF5F0] flex items-center justify-center text-[#1E3A2B]">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-[#1F2923]">Serene Experience</p>
                <p className="text-[9px] text-[#6E7A72]">Automated 24/7 Client Bookings</p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ─── SECTION 2: EVERYTHING YOU NEED TO RUN A SUCCESSFUL SPA ─── */}
      <section id="features" className="py-16 md:py-24 bg-white border-y border-[#EDE8E0]">
        <div className="max-w-7xl mx-auto px-6 space-y-14">
          
          {/* Section Header */}
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="font-luxury text-3xl md:text-4xl text-[#1F2923] tracking-tight">
              Everything You Need to Run a Successful Spa
            </h2>
          </div>

          {/* 5 Feature Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            
            {/* Card 1: Online Booking */}
            <div className="bg-[#FAF8F5] border border-[#EFEBE4] rounded-2xl p-6 flex flex-col items-center text-center hover:bg-white hover:border-[#DDD7CC] hover:shadow-lg transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-white border border-[#E5E0D5] flex items-center justify-center text-[#1E3A2B] mb-5 shadow-xs group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6 stroke-[1.75]" />
              </div>
              <h3 className="font-bold text-base text-[#1F2923] mb-2">Online Booking</h3>
              <p className="text-xs text-[#6E7A72] leading-relaxed">
                Easy scheduling and appointment management
              </p>
            </div>

            {/* Card 2: Client Management */}
            <div className="bg-[#FAF8F5] border border-[#EFEBE4] rounded-2xl p-6 flex flex-col items-center text-center hover:bg-white hover:border-[#DDD7CC] hover:shadow-lg transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-white border border-[#E5E0D5] flex items-center justify-center text-[#1E3A2B] mb-5 shadow-xs group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 stroke-[1.75]" />
              </div>
              <h3 className="font-bold text-base text-[#1F2923] mb-2">Client Management</h3>
              <p className="text-xs text-[#6E7A72] leading-relaxed">
                Keep client data, history and preferences at hand
              </p>
            </div>

            {/* Card 3: Inventory Control */}
            <div className="bg-[#FAF8F5] border border-[#EFEBE4] rounded-2xl p-6 flex flex-col items-center text-center hover:bg-white hover:border-[#DDD7CC] hover:shadow-lg transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-white border border-[#E5E0D5] flex items-center justify-center text-[#1E3A2B] mb-5 shadow-xs group-hover:scale-110 transition-transform">
                <Box className="w-6 h-6 stroke-[1.75]" />
              </div>
              <h3 className="font-bold text-base text-[#1F2923] mb-2">Inventory Control</h3>
              <p className="text-xs text-[#6E7A72] leading-relaxed">
                Track products, stock and supplies in real-time
              </p>
            </div>

            {/* Card 4: Staff Management */}
            <div className="bg-[#FAF8F5] border border-[#EFEBE4] rounded-2xl p-6 flex flex-col items-center text-center hover:bg-white hover:border-[#DDD7CC] hover:shadow-lg transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-white border border-[#E5E0D5] flex items-center justify-center text-[#1E3A2B] mb-5 shadow-xs group-hover:scale-110 transition-transform">
                <HeartHandshake className="w-6 h-6 stroke-[1.75]" />
              </div>
              <h3 className="font-bold text-base text-[#1F2923] mb-2">Staff Management</h3>
              <p className="text-xs text-[#6E7A72] leading-relaxed">
                Manage staff, shifts, commissions & performance
              </p>
            </div>

            {/* Card 5: Reports & Analytics */}
            <div className="bg-[#FAF8F5] border border-[#EFEBE4] rounded-2xl p-6 flex flex-col items-center text-center hover:bg-white hover:border-[#DDD7CC] hover:shadow-lg transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-white border border-[#E5E0D5] flex items-center justify-center text-[#1E3A2B] mb-5 shadow-xs group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6 stroke-[1.75]" />
              </div>
              <h3 className="font-bold text-base text-[#1F2923] mb-2">Reports & Analytics</h3>
              <p className="text-xs text-[#6E7A72] leading-relaxed">
                Powerful insights to grow your spa business
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ─── SECTION 3: SMARTER OPERATIONS & DASHBOARD PREVIEW ─── */}
      <section id="dashboard" className="py-20 md:py-28 bg-[#FAF8F5]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Feature Highlights */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Tag label */}
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-[#1E3A2B]">
              <span>SMARTER OPERATIONS</span>
              <span className="text-[#88B04B]">🌿</span>
            </div>

            {/* Headline */}
            <h2 className="font-luxury text-3xl sm:text-4xl text-[#1F2923] leading-snug">
              A Powerful Dashboard for Better Decisions
            </h2>

            {/* Description */}
            <p className="text-[#5A685D] text-sm md:text-base leading-relaxed">
              Get a real-time overview of your spa's performance and make data-driven decisions with ease.
            </p>

            {/* Checkmark List */}
            <div className="space-y-3.5 pt-2">
              {[
                "Daily overview & key metrics",
                "Revenue & appointment analytics",
                "Top services & product performance",
                "Staff performance tracking"
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#1E3A2B] flex items-center justify-center text-white shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <span className="text-xs md:text-sm font-semibold text-[#2B352E]">{item}</span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <div className="pt-4">
              <a
                href={`/tenant/${activeSlug}/admin`}
                className="inline-flex items-center gap-2 bg-[#1E3A2B] hover:bg-[#15291E] text-white px-6 py-3.5 rounded-2xl text-xs font-semibold uppercase tracking-wider transition-all shadow-sm hover:shadow-md group"
              >
                <span>See It in Action</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

          </div>

          {/* Right Column: Realistic Dashboard Mockup Card */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl border border-[#EDE8E0] shadow-2xl p-6 md:p-7 space-y-6 text-[#1F2923] font-sans">
              
              {/* Mockup Top Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#F0EBE1]">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#1E3A2B] flex items-center justify-center text-white text-xs font-bold">
                    C
                  </div>
                  <span className="font-bold text-sm text-[#1F2923]">Careva <span className="text-[10px] text-slate-400 uppercase font-mono font-medium">Spa ERP</span></span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 relative">
                    <Bell className="w-3.5 h-3.5" />
                    <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <img
                    src="/testimonial_avatar.png"
                    alt="Admin Avatar"
                    className="w-8 h-8 rounded-full object-cover border border-slate-200"
                  />
                </div>
              </div>

              {/* Welcome & Date Picker */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-base text-[#1F2923]">Welcome back, Admin 👋</h3>
                  <p className="text-[11px] text-slate-400">Here's what's happening at your spa today.</p>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#EDE8E0] text-[11px] font-medium text-slate-600 bg-[#FAF8F5]">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>May 12 - May 18, 2024</span>
                  <ChevronDown className="w-3 h-3 text-slate-400 ml-1" />
                </div>
              </div>

              {/* 4 Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                
                {/* Stat 1 */}
                <div className="bg-[#FAF8F5] border border-[#F0EBE1] rounded-2xl p-3.5">
                  <span className="text-[10px] text-slate-500 font-semibold block mb-1">Total Revenue</span>
                  <p className="text-base sm:text-lg font-black text-[#1F2923]">₹ 2,45,000</p>
                  <span className="text-[10px] font-semibold text-emerald-600 mt-0.5 block">+12.5% from last week</span>
                </div>

                {/* Stat 2 */}
                <div className="bg-[#FAF8F5] border border-[#F0EBE1] rounded-2xl p-3.5">
                  <span className="text-[10px] text-slate-500 font-semibold block mb-1">Appointments</span>
                  <p className="text-base sm:text-lg font-black text-[#1F2923]">128</p>
                  <span className="text-[10px] font-semibold text-emerald-600 mt-0.5 block">+8.2% from last week</span>
                </div>

                {/* Stat 3 */}
                <div className="bg-[#FAF8F5] border border-[#F0EBE1] rounded-2xl p-3.5">
                  <span className="text-[10px] text-slate-500 font-semibold block mb-1">New Clients</span>
                  <p className="text-base sm:text-lg font-black text-[#1F2923]">32</p>
                  <span className="text-[10px] font-semibold text-emerald-600 mt-0.5 block">+11.3% from last week</span>
                </div>

                {/* Stat 4 */}
                <div className="bg-[#FAF8F5] border border-[#F0EBE1] rounded-2xl p-3.5">
                  <span className="text-[10px] text-slate-500 font-semibold block mb-1">Products Sold</span>
                  <p className="text-base sm:text-lg font-black text-[#1F2923]">356</p>
                  <span className="text-[10px] font-semibold text-emerald-600 mt-0.5 block">+9.4% from last week</span>
                </div>

              </div>

              {/* Chart & Top Services Side-by-Side */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 pt-2">
                
                {/* Revenue Overview Graph */}
                <div className="sm:col-span-7 bg-[#FAF8F5] border border-[#F0EBE1] rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-[#1F2923]">Revenue Overview</span>
                    <span className="text-[10px] bg-white border border-[#E5E0D5] px-2 py-0.5 rounded-lg text-slate-500 font-medium">This Week ˅</span>
                  </div>

                  {/* SVG Wave Line */}
                  <div className="h-28 w-full pt-2">
                    <svg className="w-full h-full" viewBox="0 0 300 90" fill="none">
                      <path
                        d="M 0 70 Q 50 30, 100 55 T 200 35 T 300 20"
                        stroke="#1E3A2B"
                        strokeWidth="3"
                        fill="none"
                      />
                      <path
                        d="M 0 70 Q 50 30, 100 55 T 200 35 T 300 20 L 300 90 L 0 90 Z"
                        fill="url(#greenGradient)"
                        opacity="0.15"
                      />
                      <defs>
                        <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#1E3A2B" />
                          <stop offset="100%" stopColor="#FAF8F5" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>

                  <div className="flex justify-between text-[9px] text-slate-400 font-medium pt-1 border-t border-slate-200/60">
                    <span>May 12</span>
                    <span>May 13</span>
                    <span>May 14</span>
                    <span>May 15</span>
                    <span>May 16</span>
                    <span>May 17</span>
                    <span>May 18</span>
                  </div>
                </div>

                {/* Top Services Table */}
                <div className="sm:col-span-5 bg-[#FAF8F5] border border-[#F0EBE1] rounded-2xl p-4 space-y-2.5">
                  <span className="text-xs font-bold text-[#1F2923] block mb-1">Top Services</span>
                  
                  {[
                    { name: "Aroma Massage", revenue: "₹ 78,500", pct: "85%" },
                    { name: "Deep Tissue Massage", revenue: "₹ 56,000", pct: "65%" },
                    { name: "Facial Treatment", revenue: "₹ 43,200", pct: "50%" },
                    { name: "Body Spa", revenue: "₹ 32,100", pct: "38%" },
                    { name: "Hair Spa", revenue: "₹ 21,300", pct: "25%" },
                  ].map((service, idx) => (
                    <div key={idx} className="space-y-1 text-[10px]">
                      <div className="flex justify-between font-semibold text-slate-700">
                        <span>{service.name}</span>
                        <span className="font-bold text-[#1F2923]">{service.revenue}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                        <div className="h-full bg-[#1E3A2B] rounded-full" style={{ width: service.pct }} />
                      </div>
                    </div>
                  ))}
                </div>

              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ─── SECTION 4: TESTIMONIAL & READY TO ELEVATE CTA ─── */}
      <section id="testimonials" className="py-20 md:py-24 bg-white border-t border-[#EDE8E0]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          
          {/* Left Column: Loved by Spa Professionals Testimonial */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-8 pr-0 lg:pr-6">
            
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-[#1E3A2B]">
                <span>TRUSTED BY SPA OWNERS</span>
                <span className="text-[#88B04B]">🌿</span>
              </div>

              <h2 className="font-luxury text-3xl sm:text-4xl text-[#1F2923] leading-snug">
                Loved by Spa Professionals Across the Country
              </h2>
            </div>

            {/* Quote block */}
            <div className="space-y-6 pt-2">
              <span className="font-serif text-5xl text-[#C9D6CC] leading-none block -mb-4">“</span>
              <p className="text-[#4A574E] text-base md:text-lg leading-relaxed font-normal italic">
                Careva has transformed the way we manage our spa. It's easy to use, saves us time and helps us focus on what truly matters — our clients.
              </p>

              {/* Author Profile */}
              <div className="flex items-center gap-3.5 pt-2">
                <img
                  src="/testimonial_avatar.png"
                  alt="Priya Mehta"
                  className="w-12 h-12 rounded-full object-cover border border-[#EDE8E0]"
                />
                <div>
                  <h4 className="font-bold text-sm text-[#1F2923]">Priya Mehta</h4>
                  <p className="text-xs text-[#6E7A72]">Serenity Spa, Mumbai</p>
                </div>
              </div>
            </div>

            {/* Pagination dots */}
            <div className="flex items-center gap-2 pt-4">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1E3A2B]" />
              <span className="w-2 h-2 rounded-full bg-[#D5DDD7]" />
              <span className="w-2 h-2 rounded-full bg-[#D5DDD7]" />
            </div>

          </div>

          {/* Right Column: High-Converting CTA Box with Zen Stones */}
          <div className="lg:col-span-6 bg-[#EFF4EE] border border-[#DFE8DC] rounded-3xl p-8 md:p-10 relative overflow-hidden flex flex-col justify-between min-h-[340px]">
            
            {/* Lotus graphic top left */}
            <div className="w-10 h-10 rounded-full bg-white/80 border border-[#D0DFC9] flex items-center justify-center text-[#1E3A2B] shadow-xs mb-6">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3C10.5 6 7 8 4 8C7 11 10.5 13 12 16C13.5 13 17 11 20 8C17 8 13.5 6 12 3Z" fill="currentColor" opacity="0.9" />
                <path d="M12 8C11 10 8.5 11.5 6 11.5C8.5 13.5 11 15 12 17C13 15 15.5 13.5 18 11.5C15.5 11.5 13 10 12 8Z" fill="#88B04B" />
              </svg>
            </div>

            <div className="space-y-3 z-10 max-w-sm">
              <h3 className="font-luxury text-2xl md:text-3xl text-[#1E3A2B] leading-tight">
                Ready to Elevate Your Spa Business?
              </h3>
              <p className="text-xs md:text-sm text-[#3E5244] leading-relaxed">
                Join hundreds of spa owners who are growing their business with Careva Spa ERP.
              </p>
            </div>

            {/* CTA Button */}
            <div className="pt-6 z-10">
              <button
                onClick={() => openDemoModal()}
                className="bg-[#1E3A2B] hover:bg-[#15291E] text-white px-6 py-3.5 rounded-2xl text-xs font-semibold uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center gap-2 group cursor-pointer active:scale-98"
              >
                <span>Book a Demo Now</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Zen Stones Graphic Bottom Right matching reference image */}
            <div className="absolute right-0 bottom-0 w-44 md:w-56 pointer-events-none opacity-90">
              <img
                src="/zen_spa_stones.png"
                alt="Balanced Spa Stones"
                className="w-full h-auto object-contain"
              />
            </div>

          </div>

        </div>
      </section>

      {/* ─── SECTION 5: BOTTOM TRUST SIGNAL BAR ─── */}
      <footer className="py-10 bg-[#FAF8F5] border-t border-[#EDE8E0]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          
          {/* Trust item 1 */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white border border-[#E5E0D5] flex items-center justify-center text-[#1E3A2B] shrink-0 shadow-xs">
              <ShieldCheck className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h5 className="font-bold text-xs text-[#1F2923]">Secure & Reliable</h5>
              <p className="text-[10px] text-[#6E7A72]">Your data is safe with us</p>
            </div>
          </div>

          {/* Trust item 2 */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white border border-[#E5E0D5] flex items-center justify-center text-[#1E3A2B] shrink-0 shadow-xs">
              <Sparkles className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h5 className="font-bold text-xs text-[#1F2923]">Easy to Use</h5>
              <p className="text-[10px] text-[#6E7A72]">Simple. Intuitive. Efficient.</p>
            </div>
          </div>

          {/* Trust item 3 */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white border border-[#E5E0D5] flex items-center justify-center text-[#1E3A2B] shrink-0 shadow-xs">
              <Clock className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h5 className="font-bold text-xs text-[#1F2923]">24/7 Support</h5>
              <p className="text-[10px] text-[#6E7A72]">We're here when you need us</p>
            </div>
          </div>

          {/* Trust item 4 */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white border border-[#E5E0D5] flex items-center justify-center text-[#1E3A2B] shrink-0 shadow-xs">
              <TrendingUp className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h5 className="font-bold text-xs text-[#1F2923]">Scalable</h5>
              <p className="text-[10px] text-[#6E7A72]">Grow your spa, we'll grow with you</p>
            </div>
          </div>

        </div>

        {/* Copyright */}
        <div className="max-w-7xl mx-auto px-6 mt-8 pt-6 border-t border-[#EDE8E0]/60 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#8C988F]">
          <p>© {new Date().getFullYear()} Careva Spa ERP. All rights reserved.</p>
          <div className="flex items-center gap-6 mt-2 sm:mt-0">
            <a href="#" className="hover:text-[#1E3A2B] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#1E3A2B] transition-colors">Terms of Service</a>
            <a href="/superadmin" className="hover:text-[#1E3A2B] transition-colors font-bold text-[#1E3A2B]">Super Admin Portal</a>
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
                  Thank you <span className="font-bold">{ownerName}</span>! Our spa ERP product specialist will get in touch with you shortly to demonstrate <span className="font-bold">{businessName}</span>.
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
                  <h3 className="font-luxury text-2xl text-[#1F2923]">Book Your Spa Demo</h3>
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
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Spa / Business Name</label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Serenity Spa & Wellness"
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
