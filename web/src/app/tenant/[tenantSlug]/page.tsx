"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Calendar, Heart, MapPin, Clock, Star, Scissors, Users, Ticket, Check, ChevronRight, CheckCircle2, Sliders, Smartphone, X, User, Lock, LogOut, ShieldAlert, Search, MessageSquare, Phone, Mail } from "lucide-react";
import { getTenantBySlug, saveSharedTenant, getTenantHref } from "../../../shared/utils/utils";

// Interfaces
interface ServiceModel {
  id: string;
  name: string;
  category: string;
  duration: number;
  price: number;
  offerPrice?: number | null;
  isCombo?: boolean;
  comboServiceIds?: string[];
  desc: string;
  images?: string[];
  tags?: string[];
  imageUrl?: string;
  gender?: string;
  bodyPart?: string | null;
  loyaltyPoints?: number;
}

interface StylistModel {
  id: string;
  name: string;
  role: string;
  rating: number;
  totalReviews: number;
  avatar: string;
  specialty: string;
}

interface OutletModel {
  id: string;
  name: string;
  address: string;
  phone: string;
  timings: string;
  slug: string;
  heroTitle?: string;
  heroSubtitle?: string;
  couponCode?: string;
  couponDiscount?: number;
  logoUrl?: string;
  sectionsJson?: string;
}

interface SubscriptionModel {
  id: string;
  name: string;
  price: number;
  duration: string;
  description: string;
  status: "ACTIVE" | "INACTIVE";
}

export default function TenantWebsite({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const resolvedParams = React.use(params);
  const tenantSlug = resolvedParams.tenantSlug || "luxcuts";
  const localOutletsRef = React.useRef<any[]>([]);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [businessName, setBusinessName] = useState("LuxCuts Salon");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [isNewlyOnboarded, setIsNewlyOnboarded] = useState(false);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);

  // User Authentication States
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authError, setAuthError] = useState("");



  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check if logged-in user is admin
      const adminSessionKey = `tenant_admin_${tenantSlug}`;
      setIsAdmin(localStorage.getItem(adminSessionKey) === "true");

      getTenantBySlug(tenantSlug).then((match) => {
        if (match) {
          setBusinessName(match.name);
          setOwnerEmail(match.email || "");
          setLogoUrl(match.logoUrl || "");
          if (match.sectionsJson) {
            try {
              setSections(JSON.parse(match.sectionsJson));
            } catch (e) {
              console.error("Failed to parse sectionsJson on storefront", e);
            }
          }
          if (match.activeTemplate) setActiveTemplate(match.activeTemplate);
          if (match.accentColor) setAccentColor(match.accentColor);
          if (match.customTextColor) setCustomTextColor(match.customTextColor);
          if (match.customHeadingColor) setCustomHeadingColor(match.customHeadingColor);
          if (match.customButtonColor) setCustomButtonColor(match.customButtonColor);
          if (match.tagline) {
            setTagline(match.tagline);
          }
          if (match.subtitle) {
            setSubtitle(match.subtitle);
          }
          if (match.couponCode) {
            setCampaignCouponCode(match.couponCode);
          }
          if (match.couponDiscount !== undefined) {
            setCampaignDiscountPercent(match.couponDiscount);
          }
          if (match.stylists && match.stylists.length > 0) {
            setStylists(match.stylists);
          }
          if (match.outlets && match.outlets.length > 0) {
            localOutletsRef.current = match.outlets;
            setOutlets(match.outlets);
            setSelectedOutlet(match.outlets[0]);
          }
          // Show welcome banner if signed up in the last 5 minutes
          const onboardedAt = match.onboardedAt;
          const tenantId = match.id;
          const dismissedKey = `welcome_dismissed_${tenantId}`;
          if (!localStorage.getItem(dismissedKey)) {
            const createdTs = parseInt(tenantId.replace("ten_", ""));
            if (Date.now() - createdTs < 5 * 60 * 1000) {
              setIsNewlyOnboarded(true);
              setShowWelcomeBanner(true);
            }
          }
        }
      });

      // Check user session
      const sessionKey = `tenant_user_session_${tenantSlug}`;
      const session = localStorage.getItem(sessionKey);
      if (session) {
        const u = JSON.parse(session);
        setLoggedInUser(u);
        setLoyaltyPoints(u.loyaltyPoints || 0);
      }

      // Redirect to booking page if ?booking=true param is present
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get("booking") === "true") {
        goToBooking();
      }
    }
  }, [tenantSlug]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.title = `${businessName} | Book Premium Salon & Spa Services Online`;
    }
  }, [businessName]);

  const dismissWelcomeBanner = () => {
    setShowWelcomeBanner(false);
    if (typeof window !== "undefined") {
      getTenantBySlug(tenantSlug).then((match) => {
        if (match) localStorage.setItem(`welcome_dismissed_${match.id}`, "true");
      });
    }
  };

  const handleLogout = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(`tenant_user_session_${tenantSlug}`);
      setLoggedInUser(null);

      try {
        await fetch("/api/tenants/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ slug: tenantSlug }),
        });
      } catch (err) {
        console.error("Error clearing session on logout:", err);
      }
    }
  };

  const handleAuthRedirect = (mode: "login" | "signup") => {
    if (typeof window !== "undefined") {
      window.location.href = `/${mode}?redirect=booking`;
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "SALONY_LOGOUT") {
        handleLogout();
      }
    };
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [handleLogout]);

  // ─── 1. CORE THEMING & CMS CONFIG STATE ───────────────────
  const [activeTemplate, setActiveTemplate] = useState<"LUXURY" | "MINIMAL" | "SPA" | "BARBER" | "WELLNESS">("WELLNESS");
  const [accentColor, setAccentColor] = useState<"gold" | "rose" | "emerald" | "amber">("gold");
  const [customTextColor, setCustomTextColor] = useState("");
  const [customHeadingColor, setCustomHeadingColor] = useState("");
  const [customButtonColor, setCustomButtonColor] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [sections, setSections] = useState<any[]>([]);

  const [tagline, setTagline] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [campaignCouponCode, setCampaignCouponCode] = useState("LUXFIRST");
  const [campaignDiscountPercent, setCampaignDiscountPercent] = useState(15);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [genderFilter, setGenderFilter] = useState<"ALL" | "MEN" | "WOMEN">("ALL");

  // Custom Code Storefront
  const [useCustomCode, setUseCustomCode] = useState(false);
  const [customHtml, setCustomHtml] = useState("");
  const [customCss, setCustomCss] = useState("");
  const [customJs, setCustomJs] = useState("");
  const [customCodeLoaded, setCustomCodeLoaded] = useState(false);

  const [isLoaded, setIsLoaded] = useState(false);
  const [outlets, setOutlets] = useState<OutletModel[]>([]);
  const [selectedOutlet, setSelectedOutlet] = useState<OutletModel | null>(null);
  const [stylists, setStylists] = useState<StylistModel[]>([]);
  const [services, setServices] = useState<ServiceModel[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionModel[]>([]);

  // Load public website config to check custom code toggle
  useEffect(() => {
    if (tenantSlug) {
      fetch(`/api/cms/public/${encodeURIComponent(tenantSlug)}/config`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          const d = data?.data ?? data;
          if (d) {
            setUseCustomCode(!!d.useCustomCode);
            setCustomHtml(d.customHtml || "");
            setCustomCss(d.customCss || "");
            setCustomJs(d.customJs || "");
            if (d.template) setActiveTemplate(d.template);
            if (d.primaryColor) setAccentColor(d.primaryColor);
          }
          setCustomCodeLoaded(true);
        })
        .catch(() => setCustomCodeLoaded(true));
    }
  }, [tenantSlug]);

  useEffect(() => {
    if (typeof window !== "undefined" && tenantSlug) {
      // 1. Fetch Outlets from NestJS Backend Database
      fetch("/api/outlets", {
        headers: { "x-tenant-slug": tenantSlug }
      })
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.data || []);
        if (list.length > 0) {
          const mapped: OutletModel[] = list.map((o: any) => {
            const localMatch = localOutletsRef.current.find((lo: any) => lo.slug === o.slug || lo.id === o.id);
            return {
              id: o.id,
              name: o.name,
              address: o.address,
              phone: o.phone || "",
              timings: "09:00 AM - 09:00 PM (Mon-Sun)",
              slug: o.slug,
              heroTitle: localMatch?.heroTitle,
              heroSubtitle: localMatch?.heroSubtitle,
              couponCode: localMatch?.couponCode,
              couponDiscount: localMatch?.couponDiscount,
              logoUrl: localMatch?.logoUrl,
              sectionsJson: localMatch?.sectionsJson
            };
          });
          setOutlets(mapped);
          setSelectedOutlet(prev => {
            const found = mapped.find(m => m.id === prev?.id);
            return found || mapped[0];
          });
        }
        setIsLoaded(true);
      })
      .catch(err => {
        console.error("Failed to fetch outlets from DB", err);
        setIsLoaded(true);
      });

      // 2. Fetch Stylists (Staff) from NestJS Backend Database
      fetch("/api/users?role=STYLIST", {
        headers: { "x-tenant-slug": tenantSlug }
      })
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.data || []);
        if (list.length > 0) {
          const mapped: StylistModel[] = list.map((u: any) => ({
            id: u.id,
            name: u.name,
            role: u.role,
            rating: u.staffProfile?.rating || 5.0,
            totalReviews: u.staffProfile?.totalRatings || 0,
            specialty: u.staffProfile?.specializations || "Stylist",
            avatar: u.name.split(" ").map((n: string) => n[0]).join("").toUpperCase(),
            outletId: u.outletId
          }));
          setStylists(mapped);
        }
      })
      .catch(err => console.error("Failed to fetch stylists from DB", err));

      // 3. Fetch Coupons (Offers) from NestJS Backend Database
      fetch("/api/coupons", {
        headers: { "x-tenant-slug": tenantSlug }
      })
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.data || []);
        const active = list.find((c: any) => c.isActive && c.code === "LUXFIRST") || list[0];
        if (active) {
          setCampaignCouponCode(active.code);
          setCampaignDiscountPercent(active.value);
        }
      })
      .catch(err => console.error("Failed to fetch coupons from DB", err));

      // 5. Fetch Subscriptions (Membership Plans) from NestJS Backend Database
      fetch("/api/memberships/plans", {
        headers: { "x-tenant-slug": tenantSlug }
      })
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.data || []);
        const mapped: SubscriptionModel[] = list.map((p: any) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          duration: p.duration || "Monthly",
          description: p.description || "",
          status: p.isActive ? "ACTIVE" : "INACTIVE",
        }));
        setSubscriptions(mapped.filter(s => s.status === "ACTIVE"));
      })
      .catch(err => console.error("Failed to fetch subscriptions from DB", err));
    }
  }, [tenantSlug]);

  useEffect(() => {
    if (typeof window !== "undefined" && selectedOutlet?.id) {
      // 4. Fetch Services from NestJS backend API
      fetch("/api/services?all=true", {
        headers: { "x-tenant-slug": tenantSlug }
      })
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.data || []);
        if (list.length > 0) {
          const mapped: ServiceModel[] = list.map((s: any) => ({
            id: s.id,
            name: s.name,
            category: (typeof s.category === 'object' ? s.category?.name : s.category) || "General",
            duration: s.duration || 45,
            price: Number(s.price),
            offerPrice: s.offerPrice ? Number(s.offerPrice) : null,
            isCombo: !!s.isCombo,
            comboServiceIds: s.comboServiceIds || [],
            desc: s.description || "",
            images: s.images || [],
            tags: s.tags || [],
            imageUrl: s.imageUrl || "",
            gender: s.gender || "UNISEX",
            bodyPart: s.bodyPart || "",
            loyaltyPoints: s.loyaltyPoints !== undefined ? Number(s.loyaltyPoints) : 0,
          }));
          setServices(mapped);
        } else {
          setServices([]);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch services", err);
        setServices([]);
      });
    }
  }, [selectedOutlet?.id, tenantSlug]);


  const handleUpdateTemplate = async (template: "LUXURY" | "MINIMAL" | "SPA" | "BARBER" | "WELLNESS") => {
    setActiveTemplate(template);
    const match = await getTenantBySlug(tenantSlug);
    if (match) {
      match.activeTemplate = template;
      await saveSharedTenant(match);
    }
  };

  const handleUpdateAccentColor = async (color: "gold" | "rose" | "emerald" | "amber") => {
    setAccentColor(color);
    const match = await getTenantBySlug(tenantSlug);
    if (match) {
      match.accentColor = color;
      await saveSharedTenant(match);
    }
  };

  // ─── 4. BOOKING STATE ─────────────────────────────
  const [isAdminPanelCollapsed, setIsAdminPanelCollapsed] = useState(true);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);

  const goToBooking = () => {
    const targetPath = `/booking?outlet=${selectedOutlet?.id || "out_calicut"}`;
    window.location.href = getTenantHref(tenantSlug, targetPath);
  };

  // ─── 5. LOCALIZED OUTLET-SPECIFIC OVERRIDES ───────────────────
  const activeCouponCode = selectedOutlet?.couponCode || campaignCouponCode;
  const activeDiscountPercent = (selectedOutlet?.couponDiscount !== undefined && selectedOutlet?.couponDiscount > 0)
    ? selectedOutlet.couponDiscount
    : campaignDiscountPercent;
  const activeLogoUrl = selectedOutlet?.logoUrl || logoUrl;
  
  let activeSections = sections;
  if (selectedOutlet?.sectionsJson) {
    try {
      activeSections = JSON.parse(selectedOutlet.sectionsJson);
    } catch (e) {
      console.error("Failed to parse localized activeSections", e);
    }
  }

  const activeStylists = stylists.filter(s => {
    const rawStylist = s as any;
    const sOutletId = rawStylist.outletId || (rawStylist.id === "sty_3" ? "out_cochin" : "out_calicut");
    return sOutletId === selectedOutlet?.id;
  });

  // Theming definitions based on templates
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
        gold: "text-stone-900 border-stone-250 bg-stone-100",
        rose: "text-stone-900 border-stone-250 bg-stone-100",
        emerald: "text-stone-900 border-stone-250 bg-stone-100",
        amber: "text-stone-900 border-stone-250 bg-stone-100"
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
        gold: "text-teal-700 border-teal-650/20 bg-teal-50",
        rose: "text-rose-700 border-rose-650/20 bg-rose-50",
        emerald: "text-emerald-700 border-emerald-650/20 bg-emerald-50",
        amber: "text-[#6b7c6c] border-[#6b7c6c]/20 bg-[#f0f4f1]"
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
        gold: "text-amber-500 border-amber-500/20 bg-amber-500/10",
        rose: "text-red-500 border-red-500/20 bg-red-500/10",
        emerald: "text-cyan-500 border-cyan-500/20 bg-cyan-500/10",
        amber: "text-blue-500 border-blue-500/20 bg-blue-500/10"
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
        amber: "text-[#6b5847] border-[#6b5847]/20 bg-[#fbf9f6] focus:ring-amber-600"
      },
      gradientAccent: {
        gold: "from-amber-700 to-amber-500",
        rose: "from-rose-700 to-rose-500",
        emerald: "from-emerald-700 to-emerald-500",
        amber: "from-[#8c6d53] to-[#6b5847]"
      },
      buttonAccent: {
        gold: "bg-amber-800 hover:bg-amber-900 text-white shadow-none",
        rose: "bg-rose-750 hover:bg-rose-850 text-white shadow-none",
        emerald: "bg-emerald-750 hover:bg-emerald-800 text-white shadow-none",
        amber: "bg-[#8c6d53] hover:bg-[#735942] text-white shadow-none"
      },
      font: "font-sans tracking-tight",
      card: "bg-white border-[#f0eae1] shadow-sm",
      nav: "border-b border-[#f0eae1] bg-[#faf8f5]/90"
    }
  };

  const currentTheme = themeClasses[activeTemplate as keyof typeof themeClasses] || themeClasses.LUXURY;

  // Helper colors - static compiled strings for Tailwind CSS compiler compatibility
  const textAccentClass = 
    activeTemplate === "MINIMAL" ? "text-stone-900" : 
    activeTemplate === "SPA" ? "text-teal-700" : 
    activeTemplate === "WELLNESS" ? (
      accentColor === "gold" ? "text-amber-800" :
      accentColor === "rose" ? "text-rose-700" :
      accentColor === "emerald" ? "text-emerald-700" :
      "text-[#8c6d53]"
    ) :
    accentColor === "gold" ? "text-amber-400" :
    accentColor === "rose" ? "text-rose-400" :
    accentColor === "emerald" ? "text-emerald-400" :
    "text-orange-400"; // amber

  const bgAccentClass = 
    activeTemplate === "MINIMAL" ? "bg-stone-900" : 
    activeTemplate === "SPA" ? "bg-teal-750" : 
    activeTemplate === "WELLNESS" ? (
      accentColor === "gold" ? "bg-amber-800" :
      accentColor === "rose" ? "bg-rose-750" :
      accentColor === "emerald" ? "bg-emerald-750" :
      "bg-[#8c6d53]"
    ) :
    accentColor === "gold" ? "bg-amber-500" :
    accentColor === "rose" ? "bg-rose-500" :
    accentColor === "emerald" ? "bg-emerald-500" :
    "bg-orange-500"; // amber


  // ─── CUSTOM CODE STOREFRONT RENDER ───────────────
  // If the tenant has enabled custom code mode and the config has loaded,
  // render their HTML/CSS/JS inside a secure sandboxed iframe.
  if (customCodeLoaded && useCustomCode) {
    // If no HTML has been pasted yet, show a friendly setup screen
    if (!customHtml) {
      return (
        <div style={{ minHeight: "100vh", background: "#09090f", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "1rem", fontFamily: "Inter, sans-serif", color: "#c9a84c", padding: "2rem", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem" }}>✦</div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", marginBottom: ".25rem" }}>{businessName}</h1>
          <p style={{ color: "rgba(255,255,255,.4)", fontSize: ".9rem", maxWidth: "400px" }}>
            Custom storefront mode is active. Go to <strong style={{ color: "#c9a84c" }}>Admin → CMS → CUSTOM CODE</strong> and paste your HTML, CSS, and JS, then click <em>Publish</em>.
          </p>
        </div>
      );
    }

    const categoriesList = Array.from(new Set(services.map(s => s.category)));
    const tagsList = Array.from(new Set(services.flatMap(s => s.tags || [])));
    const servicesByCategory = categoriesList.reduce((acc: any, cat) => {
      acc[cat] = services.filter(s => s.category === cat);
      return acc;
    }, {});
    const servicesByTag = tagsList.reduce((acc: any, tag) => {
      acc[tag] = services.filter(s => s.tags?.includes(tag));
      return acc;
    }, {});

    // Build full HTML document. window.careva is injected so it's
    // available synchronously before any user JS runs.
    const sandboxDoc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${businessName}</title>
  <script>
    window.careva = {
      tenant: { 
        slug: '${tenantSlug}', 
        name: '${businessName.replace(/'/g, "\\'")}',
        logoUrl: '${activeLogoUrl || logoUrl || ""}',
        tagline: '${tagline.replace(/'/g, "\\'")}',
        subtitle: '${subtitle.replace(/'/g, "\\'")}'
      },
      user: ${loggedInUser ? JSON.stringify({
        name: loggedInUser.name,
        email: loggedInUser.email,
        role: loggedInUser.role,
        loyaltyPoints: loggedInUser.loyaltyPoints || 0
      }) : "null"},
      auth: {
        login: function() {
          window.top.location.href = '/tenant/${tenantSlug}/login';
        },
        signup: function() {
          window.top.location.href = '/tenant/${tenantSlug}/signup';
        },
        profile: function() {
          window.top.location.href = '/tenant/${tenantSlug}/account';
        },
        dashboard: function() {
          window.top.location.href = '/tenant/${tenantSlug}/admin';
        },
        logout: function() {
          window.top.postMessage({ type: 'SALONY_LOGOUT' }, '*');
        }
      },
      offers: {
        couponCode: '${activeCouponCode || ""}',
        discountPercent: ${activeDiscountPercent || 0}
      },
      comboOffers: ${JSON.stringify(services.filter(s => s.isCombo))},
      subscriptions: ${JSON.stringify(subscriptions)},
      categories: ${JSON.stringify(categoriesList)},
      tags: ${JSON.stringify(tagsList)},
      servicesByCategory: ${JSON.stringify(servicesByCategory)},
      servicesByTag: ${JSON.stringify(servicesByTag)},
      services: ${JSON.stringify(services)},
      stylists: ${JSON.stringify(stylists)},
      outlets: ${JSON.stringify(outlets)},
      booking: {
        open: function(outletId) {
          window.top.location.href = '/tenant/${tenantSlug}/booking' + (outletId ? '?outlet=' + outletId : '');
        }
      }
    };
  <\/script>
  <style>${customCss || ""}<\/style>
</head>
<body>
${customHtml}
<script>${customJs || ""}<\/script>
</body>
</html>`;

    return (
      <div className="w-full min-h-screen bg-slate-950">
        <iframe
          srcDoc={sandboxDoc}
          sandbox="allow-scripts allow-top-navigation-by-user-activation allow-forms allow-popups"
          className="w-full border-0"
          style={{ height: "100vh", minHeight: "100vh" }}
          title={`${businessName} Storefront`}
        />
      </div>
    );
  }

  // Apply code logic
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center font-sans text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-t-2 border-emerald-500 rounded-full animate-spin" />
          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest font-bold">Loading Storefront...</p>
        </div>
      </div>
    );
  }

  if (outlets.length === 0 || !selectedOutlet) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-sans text-slate-100 p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-emerald-400">
          <MapPin className="size-8 animate-pulse" />
        </div>
        <h1 className="text-xl font-bold text-slate-100">Welcome to {businessName}</h1>
        <p className="text-sm text-slate-400 max-w-sm mt-2">
          No outlets have been created for this salon yet. Please head to the admin panel to configure your first outlet.
        </p>
        <Link
          href={`/tenant/${tenantSlug}/admin`}
          className="mt-6 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95"
        >
          Go to Admin Panel
        </Link>
      </div>
    );
  }

  if (activeTemplate === "WELLNESS") {
    // Unique categories mapping
    const uniqueCategories = Array.from(new Set(services.map(s => s.category)));
    
    // Category images to match mock
    const categoryImages: Record<string, string> = {
      Massage: "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=150&q=80",
      Facial: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=150&q=80",
      Pedicure: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=150&q=80",
      Manicure: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=150&q=80",
      Aromatherapy: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=150&q=80",
      Scrub: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=150&q=80",
      Waxing: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=150&q=80",
      Hair: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=150&q=80"
    };

    const getCategoryImage = (cat: string) => {
      const matched = Object.keys(categoryImages).find(k => cat.toLowerCase().includes(k.toLowerCase()));
      return matched ? categoryImages[matched] : "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=150&q=80";
    };

    // Gender Filter Helper
    const matchesGender = (ser: ServiceModel) => {
      if (genderFilter === "ALL") return true;
      const g = ser.gender?.toUpperCase() || "UNISEX";
      if (genderFilter === "MEN") {
        return g === "MEN" || g === "UNISEX" || g === "MALE" || g === "ALL";
      }
      if (genderFilter === "WOMEN") {
        return g === "WOMEN" || g === "UNISEX" || g === "FEMALE" || g === "ALL";
      }
      return true;
    };

    // Filtered services list
    const filtered = services.filter(ser => {
      const matchesSearch = ser.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            ser.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            ser.desc.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory ? ser.category === selectedCategory : true;
      return matchesSearch && matchesCategory && matchesGender(ser);
    });

    // Best Sellers / Daily Deals
    const bestSellers = services.filter(s => s.offerPrice !== null && s.offerPrice !== undefined || s.price < 1000);

    // Packages & Combos Section (Combo flag or tagged with 'package' or contains 'package' / 'combo' in name)
    const packages = services.filter(ser => {
      return ser.isCombo || 
             ser.tags?.some(t => t.toLowerCase().includes("package")) ||
             ser.name.toLowerCase().includes("package") ||
             ser.name.toLowerCase().includes("combo") ||
             ser.category.toLowerCase().includes("package") ||
             ser.category.toLowerCase().includes("combo");
    });

    // Bridal Specials (tags: 'bride' / 'bridal' or contains 'bride'/'bridal' in name)
    const bridalServices = services.filter(ser => {
      return ser.tags?.some(t => t.toLowerCase() === "bride" || t.toLowerCase() === "bridal") ||
             ser.name.toLowerCase().includes("bride") ||
             ser.name.toLowerCase().includes("bridal");
    });

    // Groom Specials (tags: 'groom' or contains 'groom' in name)
    const groomServices = services.filter(ser => {
      return ser.tags?.some(t => t.toLowerCase() === "groom") ||
             ser.name.toLowerCase().includes("groom");
    });

    // Clean Phone Number for WhatsApp Redirect
    const rawPhone = selectedOutlet?.phone || "9961155799";
    const cleanPhoneForWa = rawPhone.replace(/[^0-9]/g, "");

    return (
      <div className="bg-[#faf8f5] text-[#2c1d11] min-h-screen relative pb-24 font-sans antialiased">
        {/* Welcome Banner */}
        {showWelcomeBanner && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-emerald-900/95 to-teal-900/95 border-b border-emerald-500/30 backdrop-blur-md font-sans px-4 py-3">
            <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="size-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-emerald-300">🎉 Your salon is live! Welcome to Careva.</p>
                  <p className="text-xs text-emerald-400/80 mt-0.5">
                    Log in to your Admin Panel to manage bookings, POS, and CRM using your registered credentials.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-11 sm:ml-0 shrink-0">
                <Link
                  href={`/tenant/${tenantSlug}/admin`}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs rounded-lg transition-all active:scale-95 whitespace-nowrap"
                >
                  Go to Admin Panel →
                </Link>
                <button
                  onClick={dismissWelcomeBanner}
                  className="p-1.5 text-emerald-500 hover:text-emerald-300 transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* WELLNESS APP BAR & HEADER */}
        <header className="sticky top-0 z-30 bg-[#faf8f5]/90 backdrop-blur-md border-b border-[#f0eae1] py-4 px-4 max-w-5xl mx-auto rounded-b-2xl shadow-sm transition-all duration-300">
          <div className="flex items-center justify-between gap-4">
            {/* Business Logo / Name & Outlet Dropdown */}
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-full bg-[#8c6239] flex items-center justify-center text-white font-extrabold text-sm shadow-md shrink-0 overflow-hidden">
                {activeLogoUrl ? (
                  <img src={activeLogoUrl} alt={businessName} className="w-full h-full object-cover" />
                ) : (
                  (businessName || "Salon").charAt(0)
                )}
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight uppercase block text-[#2c1d11]" style={customHeadingColor ? { color: customHeadingColor } : {}}>
                  {businessName || "Salon"}
                </span>
                <div className="flex items-center gap-1 -mt-0.5">
                  <MapPin className="size-3 text-amber-700" />
                  <select
                    value={selectedOutlet?.id || ""}
                    onChange={(e) => setSelectedOutlet(outlets.find(o => o.id === e.target.value) || selectedOutlet || outlets[0])}
                    className="bg-transparent border-0 text-[10px] font-bold text-[#8c6239] outline-none cursor-pointer p-0"
                  >
                    {outlets.map(o => (
                      <option key={o.id} value={o.id} className="bg-[#faf8f5] text-[#2c1d11]">
                        {o.name.replace("LuxCuts ", "")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* User Account / Auth Actions */}
            <div className="flex items-center gap-2">
              {loggedInUser ? (
                <div className="flex items-center gap-2">
                  <Link
                    href={`/tenant/${tenantSlug}/account`}
                    className="px-3 py-1.5 rounded-full border border-amber-900/10 bg-amber-50 text-[10px] font-bold text-amber-900 transition-all active:scale-95 flex items-center gap-1.5 shadow-sm"
                  >
                    <User className="size-3 text-amber-800" />
                    <span>Hi, {loggedInUser.name.split(" ")[0]}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-1.5 text-stone-500 hover:text-[#8c6239] transition-colors"
                    title="Log Out"
                  >
                    <LogOut className="size-4" />
                  </button>
                </div>
              ) : (
                <Link
                  href={`/tenant/${tenantSlug}/login?redirect=booking`}
                  className="px-4 py-1.5 bg-[#8c6239] text-white text-[10px] font-bold rounded-full transition-all active:scale-95 hover:bg-[#704d2b] shadow-sm"
                  style={customButtonColor ? { backgroundColor: customButtonColor, color: '#fff' } : {}}
                >
                  Login
                </Link>
              )}
            </div>
          </div>

          {/* Dynamic Search Bar */}
          <div className="mt-4 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-amber-900 opacity-60" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Search for "Facial", "Massage", packages...'
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#f0eae1] rounded-2xl text-xs font-medium text-[#2c1d11] placeholder-[#a69688] outline-none focus:border-[#c5a880] transition-colors shadow-inner animate-fadeIn"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-[#8c6239] text-xs font-bold">
                Clear
              </button>
            )}
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 mt-6 space-y-8">
          
          {/* HERO BANNER */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#8c6d53] to-[#b07d50] text-white p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl border border-amber-900/10">
            <div className="space-y-3 max-w-md text-left z-10">
              <div className="inline-flex items-center gap-1.5 bg-white/20 border border-white/10 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider">
                <Sparkles className="size-3 text-amber-200" /> Signature Wellness Retreat
              </div>
              <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight leading-tight">
                Rejuvenation & Tranquility
              </h2>
              <p className="text-xs text-amber-50/80 leading-relaxed font-sans font-medium">
                Immerse yourself in therapeutic rituals designed to harmonize mind, body, and spirit. Book your slots for custom treatments today.
              </p>
              <div className="flex items-center gap-4 pt-2">
                <button
                  onClick={goToBooking}
                  className="px-6 py-3 bg-white text-[#8c6239] hover:bg-amber-50 text-[11px] font-extrabold rounded-full tracking-wider transition-all active:scale-95 shadow-md flex items-center gap-1.5"
                  style={customButtonColor ? { color: customButtonColor } : {}}
                >
                  <Calendar className="size-3.5" /> APPOINTMENT BOOKING
                </button>
              </div>
            </div>
            
            <div className="relative w-full md:w-1/2 h-48 md:h-64 rounded-2xl overflow-hidden shadow-lg border border-white/10 shrink-0">
              <img 
                src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80" 
                alt="Swedish Massage" 
                className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
          </div>

          {/* EXPLORE TREATMENTS CATEGORY SCROLLER */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#2c1d11] opacity-70 text-left">
              Explore Categories
            </h3>
            <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
              {/* "All" Category Pill */}
              <button
                onClick={() => setSelectedCategory(null)}
                className="flex flex-col items-center gap-1.5 shrink-0 snap-start cursor-pointer"
              >
                <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center shadow-sm transition-all duration-300 ${!selectedCategory ? 'border-[#8c6239] bg-amber-50' : 'border-[#f0eae1] bg-white'}`} style={(!selectedCategory && customButtonColor) ? { borderColor: customButtonColor } : {}}>
                  <Sparkles className={`size-6 ${!selectedCategory ? 'text-[#8c6239]' : 'text-stone-400'}`} style={(!selectedCategory && customButtonColor) ? { color: customButtonColor } : {}} />
                </div>
                <span className={`text-[10px] font-bold ${!selectedCategory ? 'text-[#8c6239]' : 'text-[#2c1d11] opacity-70'}`} style={(!selectedCategory && customButtonColor) ? { color: customButtonColor } : {}}>All</span>
              </button>
              
              {/* Dynamic Categories */}
              {uniqueCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className="flex flex-col items-center gap-1.5 shrink-0 snap-start cursor-pointer"
                >
                  <div className={`w-14 h-14 rounded-full border-2 overflow-hidden shadow-sm transition-all duration-300 ${selectedCategory === cat ? 'border-[#8c6239] scale-105' : 'border-[#f0eae1]'}`} style={(selectedCategory === cat && customButtonColor) ? { borderColor: customButtonColor } : {}}>
                    <img 
                      src={getCategoryImage(cat)} 
                      alt={cat} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className={`text-[10px] font-bold ${selectedCategory === cat ? 'text-[#8c6239]' : 'text-[#2c1d11] opacity-70'}`} style={(selectedCategory === cat && customButtonColor) ? { color: customButtonColor } : {}}>{cat}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ACTIVE PROMOTIONS / COUPONS BLOCK */}
          <div className="bg-[#8c6d53]/5 border border-[#8c6d53]/15 rounded-3xl p-6 text-left space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#8c6d53]" style={customButtonColor ? { color: customButtonColor } : {}}>Exclusive Rewards</h4>
                <h3 className="text-lg font-black text-[#2c1d11] mt-0.5">Special Offers & Promotions</h3>
              </div>
              <Ticket className="size-6 text-[#8c6d53]/80 animate-pulse" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Primary Campaign Coupon */}
              <div className="bg-white border border-[#f0eae1] p-4 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden group">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200/50 px-2 py-0.5 rounded">SAVE {campaignDiscountPercent}%</span>
                  <h4 className="font-bold text-xs text-[#2c1d11] pt-1">First Visit Discount</h4>
                  <p className="text-[10px] text-stone-500 font-medium">Get {campaignDiscountPercent}% off on any select spa treatment.</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0 pl-4 border-l border-[#f5efe6]">
                  <span className="font-mono text-xs font-black text-rose-500 bg-rose-50/50 border border-rose-100 px-2.5 py-1 rounded select-all cursor-pointer tracking-wider">{campaignCouponCode}</span>
                  <span className="text-[8px] text-stone-400 font-extrabold uppercase">Copy Code</span>
                </div>
              </div>

              {/* Package Combos Promotion */}
              <div className="bg-white border border-[#f0eae1] p-4 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden group">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#0f8b8d] bg-[#0f8b8d]/5 border border-[#0f8b8d]/20 px-2 py-0.5 rounded">Combo Special</span>
                  <h4 className="font-bold text-xs text-[#2c1d11] pt-1">Retreat Packages</h4>
                  <p className="text-[10px] text-stone-500 font-medium">Save up to 40% when booking wellness & beauty bundles.</p>
                </div>
                <div className="shrink-0 pl-4">
                  <a href="#packages" className="px-3.5 py-1.5 bg-[#8c6239] text-white text-[9px] font-extrabold rounded-full hover:bg-[#704d2b] transition-all" style={customButtonColor ? { backgroundColor: customButtonColor } : {}}>
                    VIEW BUNDLES
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* DYNAMIC COMBOS & PACKAGES SECTION */}
          {packages.length > 0 && (
            <div id="packages" className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-extrabold text-[#2c1d11]" style={customHeadingColor ? { color: customHeadingColor } : {}}>Retreat Packages & Combos</h3>
                  <p className="text-[10px] text-stone-500 mt-0.5">Carefully curated combinations for full cellular re-balancing</p>
                </div>
                <span className="text-[9px] font-bold bg-[#8c6239]/10 text-[#8c6239] px-2 py-1 rounded-full uppercase tracking-wider" style={customButtonColor ? { color: customButtonColor, backgroundColor: `${customButtonColor}15` } : {}}>Image Included</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {packages.map(pkg => {
                  const hasOffer = pkg.offerPrice !== null && pkg.offerPrice !== undefined;
                  const displayPrice = hasOffer ? pkg.offerPrice : pkg.price;
                  const pkgImage = pkg.imageUrl || pkg.images?.[0] || "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=350&q=80";

                  return (
                    <div 
                      key={pkg.id} 
                      className="bg-white border border-[#f0eae1] rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow duration-300"
                    >
                      <div className="relative h-40 w-full bg-stone-100">
                        <img 
                          src={pkgImage} 
                          alt={pkg.name} 
                          className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                        />
                        <span className="absolute top-2.5 left-2.5 bg-[#8c6239] text-white text-[8px] font-extrabold px-2 py-0.75 rounded-md uppercase tracking-wider" style={customButtonColor ? { backgroundColor: customButtonColor } : {}}>
                          Combo Package
                        </span>
                        <div className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                          <Clock className="size-3 text-amber-400" /> {pkg.duration} Mins
                        </div>
                      </div>
                      
                      <div className="p-4 space-y-2 flex-1 flex flex-col justify-between text-left">
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-sm text-[#2c1d11] line-clamp-1">{pkg.name}</h4>
                          <p className="text-[10px] text-stone-500 font-medium line-clamp-2 leading-relaxed" style={customTextColor ? { color: customTextColor } : {}}>{pkg.desc}</p>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-[#fbf9f6] mt-3">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-[#2c1d11]">₹{displayPrice}</span>
                            {hasOffer && (
                              <span className="text-[9px] text-stone-400 line-through">₹{pkg.price}</span>
                            )}
                          </div>
                          <button
                            onClick={goToBooking}
                            className="px-4 py-2 bg-[#8c6239] hover:bg-[#704d2b] text-white text-[10px] font-extrabold rounded-full transition-all active:scale-95 shadow-sm"
                            style={customButtonColor ? { backgroundColor: customButtonColor, color: '#fff' } : {}}
                          >
                            BOOK PACKAGE
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* BRIDAL & GROOM SPECIAL CATEGORIES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bridal Section */}
            <div className="bg-[#fcf8f2] border border-[#f0eae1] p-6 rounded-3xl text-left space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-[#2c1d11] tracking-wider uppercase flex items-center gap-2">
                  <span className="text-lg">👰</span> Bridal Specials
                </h3>
                <span className="text-[9px] font-bold bg-[#8c6239]/10 text-[#8c6239] px-2 py-0.5 rounded-full">Tag: Bride</span>
              </div>
              
              {bridalServices.length === 0 ? (
                <div className="bg-white border border-[#f5efe6] rounded-2xl p-4 text-center">
                  <p className="text-[10px] text-stone-400 font-bold">Bridal services arriving soon.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bridalServices.slice(0, 3).map(ser => (
                    <div key={ser.id} className="bg-white p-3 rounded-2xl flex items-center justify-between gap-3 shadow-xs border border-[#f5efe6]">
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-xs text-[#2c1d11]">{ser.name}</h4>
                        <span className="text-[9px] text-stone-400 font-medium">{ser.duration} Mins</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-black text-[#2c1d11]">₹{ser.offerPrice || ser.price}</span>
                        <button
                          onClick={goToBooking}
                          className="px-3 py-1 bg-[#8c6239] text-white text-[9px] font-bold rounded-full transition-all hover:bg-[#704d2b]"
                          style={customButtonColor ? { backgroundColor: customButtonColor } : {}}
                        >
                          Book
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Groom Section */}
            <div className="bg-[#f6f8f5] border border-[#e2eae1] p-6 rounded-3xl text-left space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-[#2c1d11] tracking-wider uppercase flex items-center gap-2">
                  <span className="text-lg">🤵</span> Groom Grooming
                </h3>
                <span className="text-[9px] font-bold bg-emerald-950/10 text-emerald-800 px-2 py-0.5 rounded-full">Tag: Groom</span>
              </div>
              
              {groomServices.length === 0 ? (
                <div className="bg-white border border-[#e2eae1] rounded-2xl p-4 text-center">
                  <p className="text-[10px] text-stone-400 font-bold">Groom services arriving soon.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {groomServices.slice(0, 3).map(ser => (
                    <div key={ser.id} className="bg-white p-3 rounded-2xl flex items-center justify-between gap-3 shadow-xs border border-[#e2eae1]">
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-xs text-[#2c1d11]">{ser.name}</h4>
                        <span className="text-[9px] text-stone-400 font-medium">{ser.duration} Mins</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-black text-[#2c1d11]">₹{ser.offerPrice || ser.price}</span>
                        <button
                          onClick={goToBooking}
                          className="px-3 py-1 bg-[#8c6239] text-white text-[9px] font-bold rounded-full transition-all hover:bg-[#704d2b]"
                          style={customButtonColor ? { backgroundColor: customButtonColor } : {}}
                        >
                          Book
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* GENDER FILTER BUTTONS (MALE/FEMALE CATEGORIZING) & SERVICES LIST */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-[#f0eae1]">
              <div>
                <h3 className="text-sm font-extrabold text-[#2c1d11]" style={customHeadingColor ? { color: customHeadingColor } : {}}>
                  {selectedCategory ? `${selectedCategory} Treatments` : "Our Retreat Treatments"}
                </h3>
                <span className="text-[10px] text-stone-500 font-bold mt-0.5 block">{filtered.length} Treatments available</span>
              </div>
              
              {/* Gender selector controls */}
              <div className="flex items-center gap-1.5 bg-[#f0eae1]/50 p-1 rounded-xl self-start sm:self-auto border border-[#e5dfd4]">
                <button
                  onClick={() => setGenderFilter("ALL")}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all ${genderFilter === "ALL" ? 'bg-white text-[#8c6239] shadow-xs' : 'text-stone-500 hover:text-stone-800'}`}
                  style={(genderFilter === "ALL" && customButtonColor) ? { color: customButtonColor } : {}}
                >
                  All
                </button>
                <button
                  onClick={() => setGenderFilter("WOMEN")}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all ${genderFilter === "WOMEN" ? 'bg-white text-[#8c6239] shadow-xs' : 'text-stone-500 hover:text-stone-800'}`}
                  style={(genderFilter === "WOMEN" && customButtonColor) ? { color: customButtonColor } : {}}
                >
                  For Her
                </button>
                <button
                  onClick={() => setGenderFilter("MEN")}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all ${genderFilter === "MEN" ? 'bg-white text-[#8c6239] shadow-xs' : 'text-stone-500 hover:text-stone-800'}`}
                  style={(genderFilter === "MEN" && customButtonColor) ? { color: customButtonColor } : {}}
                >
                  For Him
                </button>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="bg-white border border-[#f0eae1] rounded-3xl p-8 text-center space-y-2">
                <p className="text-xs font-bold text-stone-500">No treatments found.</p>
                <p className="text-[10px] text-[#2c1d11] opacity-60">Adjust your category selector or check your Him/Her filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filtered.map(ser => {
                  const hasOffer = ser.offerPrice !== null && ser.offerPrice !== undefined;
                  const displayPrice = hasOffer ? ser.offerPrice : ser.price;
                  const itemImg = ser.imageUrl || ser.images?.[0] || getCategoryImage(ser.category);
                  const isBridalTag = ser.tags?.some(t => t.toLowerCase() === "bride" || t.toLowerCase() === "bridal");
                  const isGroomTag = ser.tags?.some(t => t.toLowerCase() === "groom");

                  return (
                    <div 
                      key={ser.id} 
                      className="bg-white border border-[#f0eae1] rounded-3xl p-4 flex gap-4 hover:shadow-md transition-shadow relative text-left"
                    >
                      <div className="w-20 h-20 bg-stone-100 rounded-2xl overflow-hidden shrink-0 border border-[#f0eae1] relative">
                        <img 
                          src={itemImg} 
                          alt={ser.name} 
                          className="w-full h-full object-cover"
                        />
                        {/* Gender specific micro-badge */}
                        {ser.gender && ser.gender !== "UNISEX" && (
                          <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[7px] font-bold px-1 py-0.25 rounded uppercase">
                            {ser.gender === "WOMEN" ? "Women" : ser.gender === "MEN" ? "Men" : ser.gender}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[8px] font-extrabold text-[#8c6239] uppercase tracking-wider" style={customButtonColor ? { color: customButtonColor } : {}}>{ser.category}</span>
                              {isBridalTag && <span className="text-[7px] font-extrabold bg-rose-50 text-rose-500 border border-rose-200 px-1 py-0.25 rounded">Bridal</span>}
                              {isGroomTag && <span className="text-[7px] font-extrabold bg-emerald-50 text-emerald-600 border border-emerald-200 px-1 py-0.25 rounded">Groom</span>}
                            </div>
                            <span className="text-[9px] text-stone-500 font-medium flex items-center gap-1 shrink-0"><Clock className="size-2.5" /> {ser.duration} Min</span>
                          </div>
                          <h4 className="font-bold text-xs text-[#2c1d11]" style={customHeadingColor ? { color: customHeadingColor } : {}}>{ser.name}</h4>
                          <p className="text-[10px] text-stone-500 line-clamp-2 leading-relaxed font-sans" style={customTextColor ? { color: customTextColor } : {}}>{ser.desc}</p>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2 border-t border-[#fbf9f6] mt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-[#2c1d11]">₹{displayPrice}</span>
                            {hasOffer && (
                              <span className="text-[9px] text-stone-400 line-through">₹{ser.price}</span>
                            )}
                          </div>
                          <button
                            onClick={goToBooking}
                            className="px-3.5 py-1.5 bg-[#8c6239] hover:bg-[#704d2b] text-white text-[9px] font-extrabold rounded-full transition-all active:scale-95 shadow-sm"
                            style={customButtonColor ? { backgroundColor: customButtonColor, color: '#fff' } : {}}
                          >
                            BOOK NOW
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* DYNAMIC CMS / SECTIONS JSON rendering support */}
          {sections && sections.length > 0 && (
            <div className="space-y-6 pt-4 border-t border-[#f0eae1]">
              {sections.map((sec) => {
                const category = sec.category || "custom";
                return (
                  <div key={sec.id} className="relative animate-fadeIn text-left bg-white border border-[#f0eae1] p-6 rounded-3xl space-y-3">
                    <span className="text-[8px] font-black uppercase text-amber-800 tracking-widest bg-amber-50 px-2 py-0.5 rounded">{category} Section</span>
                    <h4 className="font-extrabold text-sm text-[#2c1d11]">{sec.title}</h4>
                    {sec.subtitle && <p className="text-xs text-stone-500 font-sans">{sec.subtitle}</p>}
                    {sec.content && <p className="text-xs text-stone-650 font-sans leading-relaxed pt-1" style={customTextColor ? { color: customTextColor } : {}}>{sec.content}</p>}
                  </div>
                );
              })}
            </div>
          )}

          {/* CUSTOMER REVIEWS / PHILOSOPHY CARD */}
          <div className="bg-[#8c6d53]/5 border border-[#8c6d53]/10 rounded-3xl p-6 text-center space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#8c6d53]" style={customHeadingColor ? { color: customHeadingColor } : {}}>Our Promise</h4>
            <h3 className="text-lg font-black text-[#2c1d11]" style={customHeadingColor ? { color: customHeadingColor } : {}}>Therapeutic Excellence</h3>
            <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed font-sans font-medium" style={customTextColor ? { color: customTextColor } : {}}>
              We utilize organically sourced extracts, custom herbal oil blends, and experienced practitioners to ensure deep relaxation and restoration of physical vitality.
            </p>
            <div className="grid grid-cols-3 gap-2.5 pt-2">
              <div className="bg-white border border-[#f0eae1] p-3 rounded-2xl space-y-1">
                <span className="text-xs">🌿</span>
                <p className="text-[9px] font-bold text-[#2c1d11]">100% Organic</p>
              </div>
              <div className="bg-white border border-[#f0eae1] p-3 rounded-2xl space-y-1">
                <span className="text-xs">🧘‍♀️</span>
                <p className="text-[9px] font-bold text-[#2c1d11]">Expert Staff</p>
              </div>
              <div className="bg-white border border-[#f0eae1] p-3 rounded-2xl space-y-1">
                <span className="text-xs">✨</span>
                <p className="text-[9px] font-bold text-[#2c1d11]">Pure Harmony</p>
              </div>
            </div>
          </div>

        </main>
        
        {/* ENHANCED FOOTER */}
        <footer className="max-w-5xl mx-auto px-4 mt-16 pt-8 pb-8 border-t border-[#f0eae1] text-left space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-xs font-extrabold text-[#2c1d11] uppercase tracking-wider">{businessName} Retreats</p>
              <p className="text-[10px] text-stone-500 font-sans leading-relaxed">
                Premium wellness retreats providing customized treatments, deep healing rituals, and botanical skin-care regimens.
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-xs font-extrabold text-[#2c1d11] uppercase tracking-wider">Contact & Location</p>
              {selectedOutlet ? (
                <div className="space-y-1 text-[10px] text-stone-500 font-sans">
                  <p className="flex items-center gap-1.5"><MapPin className="size-3 text-[#8c6239]" /> {selectedOutlet.address}</p>
                  <p className="flex items-center gap-1.5"><Phone className="size-3 text-[#8c6239]" /> {selectedOutlet.phone}</p>
                  <p className="flex items-center gap-1.5"><Clock className="size-3 text-[#8c6239]" /> {selectedOutlet.timings}</p>
                </div>
              ) : (
                <p className="text-[10px] text-stone-400">Loading branch information...</p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-extrabold text-[#2c1d11] uppercase tracking-wider">Social Links</p>
              <div className="flex items-center gap-3">
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full border border-[#f0eae1] flex items-center justify-center text-stone-500 hover:text-[#8c6239] transition-all bg-white shadow-xs">
                  <svg className="size-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
                <a href="https://facebook.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full border border-[#f0eae1] flex items-center justify-center text-stone-500 hover:text-[#8c6239] transition-all bg-white shadow-xs">
                  <svg className="size-3.5 fill-current" viewBox="0 0 24 24"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/></svg>
                </a>
                <a href={`mailto:${ownerEmail || "support@careva.in"}`} className="w-8 h-8 rounded-full border border-[#f0eae1] flex items-center justify-center text-stone-500 hover:text-[#8c6239] transition-all bg-white shadow-xs">
                  <Mail className="size-3.5" />
                </a>
              </div>
            </div>
          </div>
          
          <div className="pt-6 border-t border-[#faf5ed] text-center">
            <p className="text-[9px] text-stone-400 font-sans">© 2026 Powered by Careva. Protected under SaaS Tenant Isolation.</p>
          </div>
        </footer>

        {/* FLOATING WHATSAPP BUTTON */}
        <a
          href={`https://wa.me/${cleanPhoneForWa}?text=Hi%20there,%20I%20would%20like%20to%20book%20a%20wellness%20session%20at%20${encodeURIComponent(businessName)}`}
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-6 right-6 z-40 bg-[#25d366] hover:bg-[#20ba5a] text-white p-3.5 rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center group"
          title="Chat on WhatsApp"
        >
          <span className="absolute -left-28 bg-[#2c1d11] text-white text-[9px] font-bold px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
            Book on WhatsApp
          </span>
          <span className="absolute inset-0 rounded-full bg-[#25d366] opacity-40 animate-ping pointer-events-none" />
          <svg className="size-5 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.97-1.861-1.868-4.339-2.897-6.97-2.899-5.437 0-9.862 4.37-9.866 9.801-.001 1.762.463 3.484 1.345 5.012l-.974 3.557 3.646-.956zm11.238-6.853c-.3-.15-1.772-.875-2.046-.975-.276-.1-.476-.15-.676.15-.2.3-.775.975-.95 1.175-.175.2-.35.225-.65.075-3.512-1.747-4.697-3.056-5.17-3.874-.125-.218-.013-.336.097-.445.1-.1.2-.23.3-.35.1-.117.133-.2.2-.33.067-.137.034-.25-.017-.35-.05-.1-4.76-1.146-5.32-1.282-.556-.135-.75-.113-.933.09-.182.203-.75.733-.75 1.79s.77 2.08.877 2.227c.108.147 1.516 2.314 3.673 3.246.513.222.913.355 1.225.454.515.163.984.14 1.354.085.413-.062 1.772-.726 2.022-1.427.25-.7.25-1.3.175-1.427-.075-.125-.275-.2-.575-.35z"/></svg>
        </a>

      </div>
    );
  }

  return (
    <div className={`${currentTheme.bg} ${currentTheme.font} min-h-screen relative transition-colors duration-500`}>
      
      {/* ─── WELCOME BANNER (shown to new salon owners for first 5 min) ─── */}
      {showWelcomeBanner && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-emerald-900/95 to-teal-900/95 border-b border-emerald-500/30 backdrop-blur-md font-sans px-4 py-3">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="size-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-emerald-300">🎉 Your salon is live! Welcome to Careva.</p>
                <p className="text-xs text-emerald-400/80 mt-0.5">
                  Log in to your Admin Panel to manage bookings, POS, and CRM using your registered credentials.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-11 sm:ml-0 shrink-0">
              <Link
                href={`/tenant/${tenantSlug}/admin`}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs rounded-lg transition-all active:scale-95 whitespace-nowrap"
              >
                Go to Admin Panel →
              </Link>
              <button
                onClick={dismissWelcomeBanner}
                className="p-1.5 text-emerald-500 hover:text-emerald-300 transition-colors"
                aria-label="Dismiss"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── WEBSITE HEADER SECTION ─── */}
      <header className={`sticky top-0 z-30 backdrop-blur-md transition-colors ${currentTheme.nav}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-6">
          <div className="flex items-center gap-2.5">
            {activeLogoUrl ? (
              <img src={activeLogoUrl} alt={businessName || "Salon"} className="h-9 w-auto object-contain max-w-[140px] rounded" />
            ) : (
              <>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-extrabold ${activeTemplate === 'MINIMAL' ? 'bg-black' : activeTemplate === 'SPA' ? 'bg-teal-750' : activeTemplate === 'BARBER' ? 'bg-zinc-800' : 'bg-gradient-to-br from-amber-500 to-rose-500'}`}>
                  {(businessName || "Salon").charAt(0)}
                </div>
                <div>
                  <span className={`font-extrabold text-lg tracking-tight uppercase ${activeTemplate === 'MINIMAL' ? 'text-black' : 'text-slate-100'}`}>
                    {businessName || "Salon"}
                  </span>
                  <span className="text-[9px] block text-slate-500 font-bold -mt-1 tracking-widest uppercase">Outlet Booking</span>
                </div>
              </>
            )}
          </div>

          {/* Active Outlet Select */}
          <div className="flex items-center gap-4">
            {/* Active Outlet Select */}
            <div className="relative font-sans normal-case text-slate-550 hover:text-slate-200">
              <select
                value={selectedOutlet?.id || ""}
                onChange={(e) => setSelectedOutlet(outlets.find(o => o.id === e.target.value) || selectedOutlet || outlets[0])}
                className={`bg-transparent border-0 text-xs font-bold outline-none cursor-pointer py-1.5 rounded-lg pr-4 ${
                  activeTemplate === 'MINIMAL' ? 'text-stone-900 border border-stone-205 px-3 bg-white' : 'text-slate-350'
                }`}
              >
                {outlets.map(o => (
                  <option key={o.id} value={o.id} className="bg-slate-900 text-slate-300">{o.name.replace("LuxCuts ", "")}</option>
                ))}
              </select>
            </div>

            {/* Customer Authentication Options */}
            <div className="flex items-center gap-2 border-l border-slate-800/80 pl-4">
              {loggedInUser ? (
                <div className="flex items-center gap-3">
                  <Link
                    href={`/tenant/${tenantSlug}/account`}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 ${
                      activeTemplate === 'MINIMAL' 
                        ? 'border-stone-200 bg-white text-stone-900 hover:bg-stone-50' 
                        : 'border-slate-800 bg-slate-900/60 text-slate-350 hover:text-slate-100 hover:border-slate-700'
                    }`}
                  >
                    <User className="size-3.5 text-rose-450" />
                    <span>Hi, {loggedInUser.name.split(" ")[0]}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                      activeTemplate === 'MINIMAL'
                        ? 'text-stone-500 hover:text-stone-850'
                        : 'text-slate-400 hover:text-rose-400'
                    }`}
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href={isMounted ? getTenantHref(tenantSlug, "/login") : "/login"}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center ${
                      activeTemplate === 'MINIMAL'
                        ? 'text-stone-900 bg-transparent hover:bg-stone-100'
                        : 'text-slate-350 hover:text-white bg-transparent'
                    }`}
                  >
                    Sign In
                  </Link>
                  <Link
                    href={isMounted ? getTenantHref(tenantSlug, "/signup") : "/signup"}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center ${
                      activeTemplate === 'MINIMAL'
                        ? 'bg-black text-white hover:bg-stone-850'
                        : activeTemplate === 'SPA'
                          ? 'bg-teal-750 hover:bg-teal-800 text-white'
                          : activeTemplate === 'BARBER'
                            ? 'bg-cyan-500 text-zinc-950 font-black'
                            : 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-md'
                    }`}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {activeSections && activeSections.length > 0 ? (
        <div className="space-y-0">
          {activeSections.map((originalSec: any, idx: number) => {
            const category = originalSec.category || originalSec.id?.split('-')[0] || `sec-${idx}`;
            const sec = {
              ...originalSec,
              title: category === "hero" ? (selectedOutlet?.heroTitle || originalSec.title) : originalSec.title,
              subtitle: category === "hero" ? (selectedOutlet?.heroSubtitle || originalSec.subtitle) : originalSec.subtitle
            };
            const uniqueKey = sec.id || `${category}-${idx}`;
            return (
              <div key={uniqueKey} className="relative animate-fadeIn">
                {/* HERO SECTION */}
                {category === "hero" && (
                  <section className="relative py-24 md:py-36 px-6 text-center max-w-5xl mx-auto">
                    {sec.type === "hero_carousel" && sec.banners?.length > 0 ? (
                      <div className="relative h-64 md:h-96 w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-850 flex flex-col justify-end p-6 md:p-12 text-left">
                        {sec.banners[0].imageUrl && <img src={sec.banners[0].imageUrl} alt="banner" className="absolute inset-0 h-full w-full object-cover opacity-50" />}
                        <div className="relative z-10 max-w-xl">
                          <h1 className="font-extrabold text-2xl md:text-5xl leading-tight text-white">{sec.banners[0].title}</h1>
                          <p className="text-xs md:text-sm text-slate-300 mt-2 font-sans normal-case">{sec.banners[0].subtitle}</p>
                          <button
                            onClick={() => {
                              //removed
                              //removed
                              goToBooking();
                            }}
                            className={`mt-4 px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer inline-flex items-center gap-1.5 bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-md`}
                          >
                            <Calendar className="size-3.5" /> Book Offer
                          </button>
                        </div>
                      </div>
                    ) : sec.type === "hero_v3" ? (
                      <div className="py-12 px-6 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-850 rounded-2xl text-left relative overflow-hidden max-w-4xl mx-auto shadow-xl">
                        <div className="max-w-2xl relative z-10 space-y-4">
                          <span className="text-[10px] font-bold tracking-widest text-amber-500 block uppercase">★ ★ ★ ★ ★ EXQUISITE GROOMING RETREAT</span>
                          <h1 className="text-3xl md:text-6xl font-extrabold tracking-tight font-serif" style={{ color: sec.titleColor || "#fff" }}>{sec.title}</h1>
                          <p className="text-xs md:text-base text-slate-400 font-sans normal-case leading-relaxed" style={{ color: sec.subtitleColor || "#94a3b8" }}>{sec.subtitle}</p>
                          <button
                            onClick={() => {
                              //removed
                              //removed
                              goToBooking();
                            }}
                            className={`px-6 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer inline-flex items-center gap-1.5 ${
                              activeTemplate === 'MINIMAL' ? 'bg-black text-white hover:bg-stone-850' : activeTemplate === 'SPA' ? 'bg-teal-750 hover:bg-teal-800 text-white' : activeTemplate === 'BARBER' ? 'bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black' : currentTheme.buttonAccent[accentColor]
                            }`}
                          >
                            <Calendar className="size-4" /> Book Appointment
                          </button>
                        </div>
                        <span className="absolute right-6 bottom-6 text-9xl opacity-10 select-none pointer-events-none">{sec.emoji || "🧖‍♀️"}</span>
                      </div>
                    ) : sec.type === "hero_v1" ? (
                      <div className="py-12 space-y-6">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest ${activeTemplate === 'MINIMAL' ? 'text-stone-500' : textAccentClass}`}>
                          <Scissors className="size-3.5" /> Premium Styling & Grooming Retreat
                        </span>
                        <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight leading-[1.05]" style={{ color: sec.titleColor || (activeTemplate === 'MINIMAL' ? '#1c1917' : '#f1f5f9') }}>{sec.title}</h1>
                        <p className="text-xs md:text-lg max-w-2xl mx-auto leading-relaxed text-slate-400 normal-case" style={{ color: sec.subtitleColor || "#94a3b8" }}>{sec.subtitle}</p>
                        <div className="flex items-center justify-center gap-4 pt-2">
                          <button
                            onClick={() => {
                              //removed
                              //removed
                              goToBooking();
                            }}
                            className={`px-8 py-4 rounded-xl font-extrabold text-xs uppercase tracking-widest transition-all active:scale-97 cursor-pointer inline-flex items-center gap-1.5 ${
                              activeTemplate === 'MINIMAL' ? 'bg-black text-white hover:bg-stone-850' : activeTemplate === 'SPA' ? 'bg-teal-750 hover:bg-teal-800 text-white' : activeTemplate === 'BARBER' ? 'bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black' : currentTheme.buttonAccent[accentColor]
                            }`}
                          >
                            <Calendar className="size-4" /> Book Appointment
                          </button>
                          <a href="#services" className={`px-8 py-4 rounded-xl border text-xs font-extrabold uppercase tracking-widest transition-all active:scale-97 ${activeTemplate === 'MINIMAL' ? 'border-stone-300 text-stone-900 hover:bg-stone-50' : 'border-slate-800 bg-slate-900/30 hover:bg-slate-900 hover:border-slate-700'}`}>Explore Menu</a>
                        </div>
                        <p className="text-5xl animate-bounce pt-4">{sec.emoji || "🧖‍♀️"}</p>
                      </div>
                    ) : (
                      /* Default split screen v2 */
                      <div className="flex flex-col md:flex-row items-center justify-between gap-12 py-12 text-left">
                        <div className="flex-1 space-y-6">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest ${activeTemplate === 'MINIMAL' ? 'text-stone-500' : textAccentClass}`}>
                            <Scissors className="size-3.5" /> Premium Styling & Grooming Retreat
                          </span>
                          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.1]" style={{ color: sec.titleColor || (activeTemplate === 'MINIMAL' ? '#1c1917' : '#f1f5f9') }}>{sec.title}</h1>
                          <p className="text-sm md:text-base text-slate-400 font-sans normal-case leading-relaxed" style={{ color: sec.subtitleColor || "#94a3b8" }}>{sec.subtitle}</p>
                          <div className="flex items-center gap-4 pt-2">
                            <button
                              onClick={() => {
                                //removed
                                //removed
                                goToBooking();
                              }}
                              className={`px-8 py-4 rounded-xl font-extrabold text-xs uppercase tracking-widest transition-all active:scale-97 cursor-pointer inline-flex items-center gap-1.5 ${
                                activeTemplate === 'MINIMAL' ? 'bg-black text-white hover:bg-stone-850' : activeTemplate === 'SPA' ? 'bg-teal-750 hover:bg-teal-800 text-white' : activeTemplate === 'BARBER' ? 'bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black' : currentTheme.buttonAccent[accentColor]
                              }`}
                            >
                              <Calendar className="size-4" /> Book Appointment
                            </button>
                            <a href="#services" className={`px-8 py-4 rounded-xl border text-xs font-extrabold uppercase tracking-widest transition-all active:scale-97 ${activeTemplate === 'MINIMAL' ? 'border-stone-300 text-stone-900 hover:bg-stone-50' : 'border-slate-800 bg-slate-900/30 hover:bg-slate-900 hover:border-slate-700'}`}>Explore Menu</a>
                          </div>
                        </div>
                        <div className="flex-1 flex justify-center items-center">
                          <span className="text-9xl select-none animate-pulse">{sec.emoji || "🧖‍♀️"}</span>
                        </div>
                      </div>
                    )}
                  </section>
                )}

                {/* ABOUT SECTION */}
                {category === "about" && (
                  <section className="py-20 px-6 max-w-5xl mx-auto border-t border-slate-900 text-left">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                      <div className="space-y-4">
                        <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight" style={{ color: sec.titleColor || (activeTemplate === 'MINIMAL' ? '#1c1917' : '#f1f5f9') }}>{sec.title}</h2>
                        <p className="text-xs md:text-sm text-slate-450 leading-relaxed font-sans normal-case" style={{ color: sec.subtitleColor || "#94a3b8" }}>{sec.subtitle}</p>
                      </div>
                      {sec.type === "about_v2" ? (
                        <div className={`p-6 rounded-2xl border flex items-center gap-4 ${currentTheme.card}`}>
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-extrabold text-sm border shrink-0 ${
                            activeTemplate === 'MINIMAL' ? 'bg-stone-100 border-stone-300 text-stone-900 font-sans' : 'bg-slate-950 border-slate-900 text-rose-455 font-mono'
                          }`}>ER</div>
                          <div>
                            <p className={`font-extrabold text-sm ${activeTemplate === 'MINIMAL' ? 'text-stone-900' : 'text-slate-200'}`}>Elena Rostova</p>
                            <p className="text-[10px] text-slate-500 font-sans tracking-wide block">Founder & Artistic Director</p>
                          </div>
                        </div>
                      ) : (
                        <div className="h-48 w-full bg-slate-900/40 border border-slate-850 rounded-2xl flex items-center justify-center p-6 text-center select-none text-rose-400/20 font-black text-6xl">
                          BEAUTY
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* TEXT CONTENT SECTION */}
                {category === "text_block" && (
                  <section className="py-16 px-6 max-w-4xl mx-auto border-t border-slate-900 text-left">
                    <div className="bg-slate-900/30 border border-slate-850 border-l-4 border-l-rose-500 p-6 md:p-8 rounded-xl space-y-3">
                      <h3 className="text-lg md:text-xl font-bold" style={{ color: sec.titleColor || "#f8fafc" }}>{sec.title}</h3>
                      <p className="text-xs md:text-sm text-slate-400 font-sans normal-case leading-relaxed" style={{ color: sec.subtitleColor || "#94a3b8" }}>{sec.subtitle}</p>
                    </div>
                  </section>
                )}

                {/* FEATURES SECTION */}
                {category === "features" && (
                  <section className="py-20 px-6 max-w-5xl mx-auto border-t border-slate-900">
                    <div className="text-center mb-12">
                      <h2 className="text-2xl md:text-4xl font-extrabold" style={{ color: sec.titleColor || (activeTemplate === 'MINIMAL' ? '#1c1917' : '#f1f5f9') }}>{sec.title}</h2>
                      <p className="text-xs text-slate-550 max-w-md mx-auto mt-2 font-sans normal-case" style={{ color: sec.subtitleColor || "#94a3b8" }}>{sec.subtitle}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
                      {[
                        { title: "Artisan Styling Directors", desc: "Award-winning certified professionals trained globally.", icon: "🎓" },
                        { title: "Bespoke Comfort Cabins", desc: "Private styling capsules with custom acoustic configurations.", icon: "🤫" },
                        { title: "Pure Organic Chemistry", desc: "100% safe biological formulas without heavy sulphates.", icon: "🌱" }
                      ].map((feat, i) => (
                        <div key={i} className={`p-6 rounded-2xl border ${currentTheme.card} space-y-4`}>
                          <span className="text-3xl block select-none">{feat.icon}</span>
                          <h4 className={`font-bold text-sm md:text-base ${activeTemplate === 'MINIMAL' ? 'text-stone-900' : 'text-slate-200'}`}>{feat.title}</h4>
                          <p className="text-slate-500 text-xs leading-relaxed font-sans">{feat.desc}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* SERVICES MENU SECTION */}
                {category === "services" && (
                  <section id="services" className="py-20 px-6 max-w-5xl mx-auto border-t border-slate-900">
                    <div className="text-center mb-16">
                      <h2 className="text-2xl md:text-4xl font-extrabold" style={{ color: sec.titleColor || (activeTemplate === 'MINIMAL' ? '#1c1917' : '#f1f5f9') }}>{sec.title}</h2>
                      <p className="text-slate-550 text-xs max-w-md mx-auto mt-2 font-sans normal-case" style={{ color: sec.subtitleColor || "#94a3b8" }}>{sec.subtitle}</p>
                    </div>
                    {sec.type === "services_list" ? (
                      <div className="space-y-4">
                        {services.map(ser => (
                          <div key={ser.id} className={`p-5 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left ${currentTheme.card}`}>
                            <div className="flex items-start gap-4 flex-1">
                              {/* Service Image */}
                              {ser.imageUrl || (ser.images && ser.images.length > 0) ? (
                                <img 
                                  src={ser.imageUrl || ser.images?.[0]} 
                                  alt={ser.name} 
                                  className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg shrink-0 border border-slate-900/40"
                                />
                              ) : (
                                <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg shrink-0 bg-slate-900/60 border border-slate-900/40 flex items-center justify-center text-slate-500">
                                  <Scissors className="size-6" />
                                </div>
                              )}
                              
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-[8px] bg-slate-950 text-slate-400 border border-slate-900 px-2 py-0.5 rounded uppercase font-bold tracking-widest">{ser.category}</span>
                                  {ser.gender && (
                                    <span className="text-[8px] bg-indigo-950/60 text-indigo-400 border border-indigo-900/40 px-2 py-0.5 rounded uppercase font-bold tracking-widest">{ser.gender}</span>
                                  )}
                                  {ser.bodyPart && (
                                    <span className="text-[8px] bg-teal-950/60 text-teal-400 border border-teal-900/40 px-2 py-0.5 rounded uppercase font-bold tracking-widest">{ser.bodyPart}</span>
                                  )}
                                  {ser.loyaltyPoints && ser.loyaltyPoints > 0 ? (
                                    <span className="text-[8px] bg-amber-950/60 text-amber-400 border border-amber-900/40 px-2 py-0.5 rounded uppercase font-bold tracking-widest">+{ser.loyaltyPoints} Pts</span>
                                  ) : null}
                                </div>
                                <h4 className={`font-bold text-sm md:text-base mt-1 ${activeTemplate === 'MINIMAL' ? 'text-stone-900' : 'text-slate-200'}`}>{ser.name}</h4>
                                <p className="text-slate-550 text-xs line-clamp-2 leading-relaxed font-sans">{ser.desc}</p>
                                
                                {/* Tags */}
                                {ser.tags && ser.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {ser.tags.map(t => (
                                      <span key={t} className="text-[9px] text-slate-500 font-medium font-sans">#{t}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto gap-4 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-900/40">
                              <div className="flex flex-col items-end">
                                <span className="text-slate-500 text-[10px] font-semibold flex items-center gap-1"><Clock className="size-3" /> {ser.duration} Mins</span>
                                <div className="flex items-center gap-2 mt-1">
                                  {ser.offerPrice ? (
                                    <>
                                      <span className={`font-black text-sm md:text-base ${activeTemplate === 'MINIMAL' ? 'text-stone-900' : 'text-slate-100'}`}>₹{ser.offerPrice.toLocaleString()}</span>
                                      <span className="text-slate-500 line-through text-xs font-medium">₹{ser.price.toLocaleString()}</span>
                                    </>
                                  ) : (
                                    <span className={`font-black text-sm md:text-base ${activeTemplate === 'MINIMAL' ? 'text-stone-900' : 'text-slate-100'}`}>₹{ser.price.toLocaleString()}</span>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  goToBooking();
                                }}
                                className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider active:scale-95 transition-all cursor-pointer ${
                                  activeTemplate === 'MINIMAL' ? 'bg-black text-white hover:bg-stone-850' : activeTemplate === 'SPA' ? 'bg-teal-750 hover:bg-teal-800 text-white' : activeTemplate === 'BARBER' ? 'bg-cyan-500 hover:bg-cyan-600 text-slate-950' : currentTheme.buttonAccent[accentColor]
                                }`}
                              >
                                Book Slot
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* Grid Layout */
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {services.map(ser => (
                          <div key={ser.id} className={`p-6 rounded-2xl border transition-all flex flex-col justify-between gap-4 text-left group hover:border-slate-800 ${currentTheme.card}`}>
                            <div className="space-y-3">
                              {/* Service Image */}
                              {ser.imageUrl || (ser.images && ser.images.length > 0) ? (
                                <img 
                                  src={ser.imageUrl || ser.images?.[0]} 
                                  alt={ser.name} 
                                  className="w-full h-40 object-cover rounded-xl border border-slate-900/40"
                                />
                              ) : (
                                <div className="w-full h-40 rounded-xl bg-slate-900/60 border border-slate-900/40 flex items-center justify-center text-slate-500">
                                  <Scissors className="size-10" />
                                </div>
                              )}
                              
                              <div className="space-y-1.5">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${activeTemplate === 'MINIMAL' ? 'bg-stone-100 text-stone-900' : 'bg-slate-950 border border-slate-900 text-slate-500'}`}>{ser.category}</span>
                                  <span className="text-slate-500 text-[10px] font-semibold flex items-center gap-1"><Clock className="size-3" /> {ser.duration} Mins</span>
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-1">
                                  {ser.gender && (
                                    <span className="text-[8px] bg-indigo-950/60 text-indigo-400 border border-indigo-900/40 px-1.5 py-0.5 rounded uppercase font-bold">{ser.gender}</span>
                                  )}
                                  {ser.bodyPart && (
                                    <span className="text-[8px] bg-teal-950/60 text-teal-400 border border-teal-900/40 px-1.5 py-0.5 rounded uppercase font-bold">{ser.bodyPart}</span>
                                  )}
                                  {ser.loyaltyPoints && ser.loyaltyPoints > 0 ? (
                                    <span className="text-[8px] bg-amber-950/60 text-amber-400 border border-amber-900/40 px-1.5 py-0.5 rounded uppercase font-bold">+{ser.loyaltyPoints} Pts</span>
                                  ) : null}
                                </div>

                                <h3 className={`font-bold text-base md:text-lg ${activeTemplate === 'MINIMAL' ? 'text-stone-900' : 'text-slate-200'}`}>{ser.name}</h3>
                                <p className="text-slate-500 text-xs leading-relaxed font-sans line-clamp-3">{ser.desc}</p>
                                
                                {/* Tags */}
                                {ser.tags && ser.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {ser.tags.map(t => (
                                      <span key={t} className="text-[9px] text-slate-500 font-medium font-sans">#{t}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between border-t border-slate-900/60 pt-4 mt-2">
                              <div className="flex flex-col">
                                {ser.offerPrice ? (
                                  <>
                                    <span className={`font-black text-base md:text-lg ${activeTemplate === 'MINIMAL' ? 'text-stone-900' : 'text-slate-100'}`}>₹{ser.offerPrice.toLocaleString()}</span>
                                    <span className="text-slate-500 line-through text-xs font-medium">₹{ser.price.toLocaleString()}</span>
                                  </>
                                ) : (
                                  <span className={`font-black text-base md:text-lg ${activeTemplate === 'MINIMAL' ? 'text-stone-900' : 'text-slate-100'}`}>₹{ser.price.toLocaleString()}</span>
                                )}
                              </div>
                              <button
                                onClick={() => {
                                  goToBooking();
                                }}
                                className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest active:scale-95 transition-all cursor-pointer ${
                                  activeTemplate === 'MINIMAL' ? 'bg-black text-white hover:bg-stone-850' : activeTemplate === 'SPA' ? 'bg-teal-750 hover:bg-teal-800 text-white' : activeTemplate === 'BARBER' ? 'bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black' : currentTheme.buttonAccent[accentColor]
                                }`}
                              >
                                Book Slot
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {/* SUBSCRIPTIONS SECTION */}
                {category === "subscriptions" && (
                  <section className="py-20 px-6 max-w-5xl mx-auto border-t border-slate-900">
                    <div className="text-center mb-12">
                      <h2 className="text-2xl md:text-4xl font-extrabold" style={{ color: sec.titleColor || (activeTemplate === 'MINIMAL' ? '#1c1917' : '#f1f5f9') }}>{sec.title}</h2>
                      <p className="text-slate-550 text-xs max-w-md mx-auto mt-2 font-sans normal-case" style={{ color: sec.subtitleColor || "#94a3b8" }}>{sec.subtitle}</p>
                    </div>
                    {sec.type === "sub_glass" ? (
                      subscriptions[0] ? (
                        <div className="p-6 md:p-8 bg-white/5 border border-white/10 rounded-2xl text-left max-w-2xl mx-auto space-y-4 backdrop-blur-md">
                          <span className="font-extrabold text-sm text-emerald-450 uppercase tracking-widest flex items-center gap-1">⭐ {subscriptions[0].duration} Pass</span>
                          <h4 className="text-xl md:text-3xl font-black text-white leading-tight">{subscriptions[0].name}</h4>
                          <p className="text-xs md:text-sm text-slate-350 leading-relaxed font-sans normal-case">{subscriptions[0].description}</p>
                          <div className="flex justify-between items-center border-t border-white/10 pt-4 mt-2">
                            <span className="text-2xl font-black text-white">₹{subscriptions[0].price.toLocaleString()}</span>
                            <button
                              onClick={() => {
                                goToBooking();
                              }}
                              className={`px-5 py-3 rounded-lg text-xs font-bold uppercase tracking-wider active:scale-95 transition-all cursor-pointer ${
                                activeTemplate === 'MINIMAL' ? 'bg-black text-white hover:bg-stone-850' : activeTemplate === 'SPA' ? 'bg-teal-750 hover:bg-teal-800 text-white' : activeTemplate === 'BARBER' ? 'bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black' : currentTheme.buttonAccent[accentColor]
                              }`}
                            >
                              Buy Pass
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-400 text-sm italic text-center">No subscriptions configured yet.</p>
                      )
                    ) : (
                      /* Standard Vertical Cards */
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left max-w-3xl mx-auto">
                        {subscriptions.map((tier) => (
                          <div key={tier.id} className={`p-6 rounded-2xl border ${currentTheme.card} flex flex-col justify-between gap-6`}>
                            <div className="space-y-2">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{tier.duration}</span>
                              <h4 className={`font-extrabold text-lg ${activeTemplate === 'MINIMAL' ? 'text-stone-900' : 'text-slate-200'}`}>{tier.name}</h4>
                              <p className="text-[11px] text-slate-500 font-sans tracking-wide block">{tier.description}</p>
                            </div>
                            <div className="flex justify-between items-center border-t border-slate-900/60 pt-4">
                              <span className={`font-black text-xl ${activeTemplate === 'MINIMAL' ? 'text-stone-900' : 'text-slate-100'}`}>₹{tier.price.toLocaleString()}</span>
                              <button
                                onClick={() => {
                                  goToBooking();
                                }}
                                className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider active:scale-95 transition-all cursor-pointer ${
                                  activeTemplate === 'MINIMAL' ? 'bg-black text-white hover:bg-stone-850' : activeTemplate === 'SPA' ? 'bg-teal-750 hover:bg-teal-800 text-white' : activeTemplate === 'BARBER' ? 'bg-cyan-500 hover:bg-cyan-600 text-slate-950' : currentTheme.buttonAccent[accentColor]
                                }`}
                              >
                                Purchase Card
                              </button>
                            </div>
                          </div>
                        ))}
                        {subscriptions.length === 0 && (
                          <p className="col-span-full text-slate-400 text-sm italic text-center py-6">No subscriptions configured yet.</p>
                        )}
                      </div>
                    )}
                  </section>
                )}

                {/* OFFERS SECTION */}
                {category === "offers" && (
                  <section className="py-20 px-6 max-w-5xl mx-auto border-t border-slate-900 text-left">
                    <div className="text-center mb-12">
                      <h2 className="text-2xl md:text-4xl font-extrabold" style={{ color: sec.titleColor || (activeTemplate === 'MINIMAL' ? '#1c1917' : '#f1f5f9') }}>{sec.title}</h2>
                      <p className="text-xs text-slate-550 max-w-md mx-auto mt-2 font-sans normal-case" style={{ color: sec.subtitleColor || "#94a3b8" }}>{sec.subtitle}</p>
                    </div>
                    <div className="max-w-2xl mx-auto">
                      <div className="bg-slate-900/20 border-2 border-dashed border-rose-500/20 rounded-2xl p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="space-y-1">
                          <span className={`text-[10px] font-extrabold tracking-widest uppercase block ${activeTemplate === 'MINIMAL' ? 'text-stone-500' : 'text-rose-455'}`}>LIMITED RUN PROMO CODE</span>
                          <h4 className={`text-xl md:text-2xl font-black ${activeTemplate === 'MINIMAL' ? 'text-stone-900' : 'text-slate-100'}`}>Flat {activeDiscountPercent}% Off First Online Slot</h4>
                          <p className="text-xs text-slate-550 font-sans normal-case leading-relaxed">Book any scissor cut, massage, or balayage therapy online and use code on POS invoice.</p>
                        </div>
                        <div className="bg-slate-950 border border-slate-850 px-6 py-3 rounded-xl text-center shrink-0">
                          <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-widest">COUPON CODE</span>
                          <span className="text-lg font-black text-rose-450 tracking-wider font-mono">{activeCouponCode}</span>
                        </div>
                      </div>
                    </div>

                    {/* Dynamic Combo & Service Offers */}
                    {(() => {
                      const comboOffers = services.filter(s => s.isCombo);
                      const priceOffers = services.filter(s => s.offerPrice !== null && s.offerPrice !== undefined && !s.isCombo);
                      if (comboOffers.length === 0 && priceOffers.length === 0) return null;
                      return (
                        <div className="mt-16 space-y-12 max-w-4xl mx-auto">
                          {/* Combos */}
                          {comboOffers.length > 0 && (
                            <div className="space-y-6">
                              <h3 className={`text-lg font-bold uppercase tracking-widest ${activeTemplate === 'MINIMAL' ? 'text-stone-700' : 'text-slate-200'}`}>Special Combo Deals</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {comboOffers.map(combo => (
                                  <div key={combo.id} className={`p-6 rounded-3xl border transition-all flex flex-col justify-between hover:scale-[1.01] ${
                                    activeTemplate === 'MINIMAL' 
                                      ? 'bg-stone-50 border-stone-200 hover:border-stone-400' 
                                      : 'bg-slate-900/40 border-slate-800/80 hover:border-rose-500/20'
                                  }`}>
                                    <div className="space-y-3">
                                      <div className="flex justify-between items-start gap-4">
                                        <h4 className={`text-lg font-bold ${activeTemplate === 'MINIMAL' ? 'text-stone-900' : 'text-slate-150'}`}>{combo.name}</h4>
                                        <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[9px] font-bold uppercase tracking-wider">Combo Offer</span>
                                      </div>
                                      {combo.desc && <p className="text-xs text-slate-400 leading-relaxed font-sans normal-case">{combo.desc}</p>}
                                      {/* Included services lists */}
                                      {combo.comboServiceIds && combo.comboServiceIds.length > 0 && (
                                        <div className="space-y-1 mt-2">
                                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Included Services:</span>
                                          <div className="flex flex-wrap gap-1.5">
                                            {combo.comboServiceIds.map(csId => {
                                              const matchSer = services.find(s => s.id === csId);
                                              return matchSer ? (
                                                <span key={csId} className={`text-[10px] px-2 py-1 rounded-lg font-medium ${
                                                  activeTemplate === 'MINIMAL' 
                                                    ? 'bg-stone-200 text-stone-700' 
                                                    : 'bg-slate-950 text-slate-400 border border-slate-850'
                                                }`}>{matchSer.name}</span>
                                              ) : null;
                                            })}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-850">
                                      <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Special Price</span>
                                        <div className="flex items-baseline gap-2">
                                          <span className={`text-xl font-black ${activeTemplate === 'MINIMAL' ? 'text-stone-900' : 'text-slate-100'}`}>₹{combo.offerPrice || combo.price}</span>
                                          {combo.offerPrice && <span className="text-xs text-slate-500 line-through">₹{combo.price}</span>}
                                        </div>
                                      </div>
                                      <button 
                                        onClick={() => {
                                          const targetPath = `/booking?outlet=${selectedOutlet?.id || "out_calicut"}&service=${combo.id}`;
                                          window.location.href = getTenantHref(tenantSlug, targetPath);
                                        }}
                                        className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                          activeTemplate === 'MINIMAL'
                                            ? 'bg-stone-900 text-white hover:bg-stone-850'
                                            : 'bg-rose-500 text-white hover:bg-rose-600'
                                        }`}
                                      >
                                        Book Combo
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Service Offers */}
                          {priceOffers.length > 0 && (
                            <div className="space-y-6">
                              <h3 className={`text-lg font-bold uppercase tracking-widest ${activeTemplate === 'MINIMAL' ? 'text-stone-700' : 'text-slate-200'}`}>Limited-Time Service Offers</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {priceOffers.map(offer => (
                                  <div key={offer.id} className={`p-6 rounded-3xl border transition-all flex flex-col justify-between hover:scale-[1.01] ${
                                    activeTemplate === 'MINIMAL' 
                                      ? 'bg-stone-50 border-stone-200 hover:border-stone-400' 
                                      : 'bg-slate-900/40 border-slate-800/80 hover:border-rose-500/20'
                                  }`}>
                                    <div className="space-y-3">
                                      <div className="flex justify-between items-start gap-4">
                                        <h4 className={`text-lg font-bold ${activeTemplate === 'MINIMAL' ? 'text-stone-900' : 'text-slate-150'}`}>{offer.name}</h4>
                                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase tracking-wider">Price Cut</span>
                                      </div>
                                      {offer.desc && <p className="text-xs text-slate-400 leading-relaxed font-sans normal-case">{offer.desc}</p>}
                                      <span className="text-[10px] text-slate-500 font-semibold block">{offer.duration} mins duration</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-850">
                                      <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Offer Price</span>
                                        <div className="flex items-baseline gap-2">
                                          <span className={`text-xl font-black ${activeTemplate === 'MINIMAL' ? 'text-stone-900' : 'text-slate-100'}`}>₹{offer.offerPrice}</span>
                                          <span className="text-xs text-slate-550 line-through">₹{offer.price}</span>
                                        </div>
                                      </div>
                                      <button 
                                        onClick={() => {
                                          const targetPath = `/booking?outlet=${selectedOutlet?.id || "out_calicut"}&service=${offer.id}`;
                                          window.location.href = getTenantHref(tenantSlug, targetPath);
                                        }}
                                        className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                          activeTemplate === 'MINIMAL'
                                            ? 'bg-stone-900 text-white hover:bg-stone-850'
                                            : 'bg-rose-500 text-white hover:bg-rose-600'
                                        }`}
                                      >
                                        Book Now
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </section>
                )}

              </div>
            );
          })}
        </div>
      ) : (
        <>
          {/* ─── HERO SECTION ─── */}
          <section className="relative py-24 md:py-36 px-6 text-center max-w-5xl mx-auto">
        <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest mb-6 ${activeTemplate === 'MINIMAL' ? 'text-stone-500' : textAccentClass}`}>
          <Scissors className="size-3.5" /> Premium Styling & Grooming Retreat
        </span>
        
        <h1 className={`text-4xl md:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6 ${
          activeTemplate === 'MINIMAL' ? 'text-stone-900' : 'text-slate-100'
        }`}>
          {tagline ? tagline : (
            <>
              Artisan Grooming For <br className="hidden md:inline" />
              {activeTemplate === 'MINIMAL' ? (
                <span className="underline decoration-stone-400">The Modern Soul</span>
              ) : activeTemplate === 'SPA' ? (
                <span className="text-teal-800 italic">Total Wellness & Grace</span>
              ) : activeTemplate === 'BARBER' ? (
                <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Sharp Cuts & Fades</span>
              ) : (
                <span className={`bg-gradient-to-r bg-clip-text text-transparent ${accentColor === 'gold' ? 'from-amber-400 via-amber-200 to-amber-500' : accentColor === 'rose' ? 'from-rose-400 via-rose-300 to-rose-500' : accentColor === 'emerald' ? 'from-emerald-400 via-emerald-300 to-emerald-500' : 'from-orange-400 via-yellow-400 to-orange-500'}`}>
                  The Elite Class
                </span>
              )}
            </>
          )}
        </h1>

        <p className={`text-sm md:text-lg max-w-2xl mx-auto leading-relaxed mb-10 ${
          activeTemplate === 'MINIMAL' ? 'text-stone-550' : 'text-slate-400'
        }`}>
          {subtitle ? subtitle : `Experience bespoke signature haircuts, organic French balayage highlighting, and deep nourishing argan head spas in our curated private cabins at ${selectedOutlet.name}.`}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => {
              //removed
              //removed
              goToBooking();
            }}
            className={`w-full sm:w-auto px-8 py-4 rounded-xl font-extrabold text-sm uppercase tracking-widest transition-all active:scale-97 cursor-pointer flex items-center justify-center gap-2 ${
              activeTemplate === 'MINIMAL' ? 'bg-black text-white hover:bg-stone-850' : activeTemplate === 'SPA' ? 'bg-teal-750 hover:bg-teal-800 text-white' : activeTemplate === 'BARBER' ? 'bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black' : currentTheme.buttonAccent[accentColor]
            }`}
          >
            <Calendar className="size-4" /> Book Appointment Now
          </button>
          <a 
            href="#services"
            className={`w-full sm:w-auto px-8 py-4 rounded-xl border text-sm font-extrabold uppercase tracking-widest transition-all active:scale-97 ${
              activeTemplate === 'MINIMAL' ? 'border-stone-300 hover:bg-stone-50 text-stone-900' : 'border-slate-800 bg-slate-900/30 hover:bg-slate-900 hover:border-slate-700'
            }`}
          >
            Explore Menu
          </a>
        </div>
      </section>

      {/* ─── SERVICES MENU SECTION (CMS SECTION) ─── */}
      <section id="services" className="py-20 px-6 max-w-5xl mx-auto border-t border-slate-900">
        <div className="text-center mb-16">
          <span className={`text-xs font-bold uppercase tracking-widest ${activeTemplate === 'MINIMAL' ? 'text-stone-500' : textAccentClass}`}>CMS Section: SERVICES</span>
          <h2 className={`text-3xl md:text-5xl font-extrabold mt-2 tracking-tight ${activeTemplate === 'MINIMAL' ? 'text-stone-900' : 'text-slate-100'}`}>
            Signature Menu Packages
          </h2>
          <p className="text-slate-500 text-xs md:text-sm max-w-lg mx-auto mt-3">
            Handpicked premium styling and relaxation services, custom configured for {selectedOutlet.name}.
          </p>
        </div>

        <div className="space-y-4">
          {services.map(ser => (
            <div 
              key={ser.id} 
              className={`p-6 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 text-left group hover:border-slate-800 ${currentTheme.card}`}
            >
              <div className="flex flex-col sm:flex-row items-start gap-4 flex-1 pr-6">
                {/* Image */}
                {ser.imageUrl || (ser.images && ser.images.length > 0) ? (
                  <img 
                    src={ser.imageUrl || ser.images?.[0]} 
                    alt={ser.name} 
                    className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg shrink-0 border border-slate-900/40"
                  />
                ) : (
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg shrink-0 bg-slate-900/60 border border-slate-900/40 flex items-center justify-center text-slate-500">
                    <Scissors className="size-6" />
                  </div>
                )}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${
                      activeTemplate === 'MINIMAL' ? 'bg-stone-100 text-stone-900' : 'bg-slate-950 border border-slate-900 text-slate-500'
                    }`}>
                      {ser.category}
                    </span>
                    <span className="text-slate-500 text-[10px] font-semibold flex items-center gap-1"><Clock className="size-3" /> {ser.duration} Mins</span>
                    
                    {ser.gender && (
                      <span className="text-[8px] bg-indigo-950/60 text-indigo-400 border border-indigo-900/40 px-2 py-0.5 rounded uppercase font-bold tracking-widest">{ser.gender}</span>
                    )}
                    {ser.bodyPart && (
                      <span className="text-[8px] bg-teal-950/60 text-teal-400 border border-teal-900/40 px-2 py-0.5 rounded uppercase font-bold tracking-widest">{ser.bodyPart}</span>
                    )}
                    {ser.loyaltyPoints && ser.loyaltyPoints > 0 ? (
                      <span className="text-[8px] bg-amber-950/60 text-amber-400 border border-amber-900/40 px-2 py-0.5 rounded uppercase font-bold tracking-widest">+{ser.loyaltyPoints} Pts</span>
                    ) : null}
                  </div>
                  <h3 className={`font-bold text-base md:text-lg ${activeTemplate === 'MINIMAL' ? 'text-stone-900' : 'text-slate-200'}`}>{ser.name}</h3>
                  <p className="text-slate-550 text-xs leading-relaxed font-sans">{ser.desc}</p>
                  
                  {/* Tags */}
                  {ser.tags && ser.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {ser.tags.map(t => (
                        <span key={t} className="text-[9px] text-slate-500 font-medium font-sans">#{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-4 md:pt-0 border-slate-900/60 shrink-0">
                <div className="flex flex-col md:items-end">
                  {ser.offerPrice ? (
                    <>
                      <span className={`font-black text-lg md:text-xl ${activeTemplate === 'MINIMAL' ? 'text-stone-900' : 'text-slate-100'}`}>₹{ser.offerPrice.toLocaleString()}</span>
                      <span className="text-slate-500 line-through text-xs font-medium">₹{ser.price.toLocaleString()}</span>
                    </>
                  ) : (
                    <span className={`font-black text-lg md:text-xl ${activeTemplate === 'MINIMAL' ? 'text-stone-900' : 'text-slate-100'}`}>₹{ser.price.toLocaleString()}</span>
                  )}
                </div>
                <button 
                  onClick={() => {
                    goToBooking();
                  }}
                  className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest active:scale-95 transition-all cursor-pointer ${
                    activeTemplate === 'MINIMAL' ? 'bg-black text-white hover:bg-stone-850' : activeTemplate === 'SPA' ? 'bg-teal-750 hover:bg-teal-800 text-white' : activeTemplate === 'BARBER' ? 'bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black' : currentTheme.buttonAccent[accentColor]
                  }`}
                >
                  Book Slot
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── SUBSCRIPTIONS SECTION (FALLBACK) ─── */}
      <section id="subscriptions" className="py-20 px-6 max-w-5xl mx-auto border-t border-slate-900">
        <div className="text-center mb-16">
          <span className={`text-xs font-bold uppercase tracking-widest ${activeTemplate === 'MINIMAL' ? 'text-stone-500' : textAccentClass}`}>
            Membership Passes
          </span>
          <h2 className={`text-3xl md:text-5xl font-extrabold mt-2 tracking-tight ${activeTemplate === 'MINIMAL' ? 'text-stone-900' : 'text-slate-100'}`}>
            Exclusive Membership Packages
          </h2>
          <p className="text-slate-500 text-xs md:text-sm max-w-lg mx-auto mt-3">
            Unlock premium styling privileges, priority booking, and signature treatments with our membership plans.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left max-w-3xl mx-auto">
          {subscriptions.map((tier) => (
            <div 
              key={tier.id} 
              className={`p-6 rounded-2xl border transition-all flex flex-col justify-between gap-6 hover:border-slate-800 ${currentTheme.card}`}
            >
              <div className="space-y-2">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest ${
                  activeTemplate === 'MINIMAL' ? 'bg-stone-100 text-stone-900' : 'bg-slate-950 border border-slate-900 text-slate-500'
                }`}>
                  {tier.duration}
                </span>
                <h4 className={`font-extrabold text-lg ${activeTemplate === 'MINIMAL' ? 'text-stone-900' : 'text-slate-200'}`}>
                  {tier.name}
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed font-sans normal-case tracking-wide">
                  {tier.description}
                </p>
              </div>
              <div className="flex justify-between items-center border-t border-slate-900/60 pt-4">
                <span className={`font-black text-xl ${activeTemplate === 'MINIMAL' ? 'text-stone-900' : 'text-slate-100'}`}>
                  ₹{tier.price.toLocaleString()}
                </span>
                <button
                  onClick={() => {
                    goToBooking();
                  }}
                  className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider active:scale-95 transition-all cursor-pointer ${
                    activeTemplate === 'MINIMAL' ? 'bg-black text-white hover:bg-stone-850' : activeTemplate === 'SPA' ? 'bg-teal-750 hover:bg-teal-800 text-white' : activeTemplate === 'BARBER' ? 'bg-cyan-500 hover:bg-cyan-600 text-slate-950' : currentTheme.buttonAccent[accentColor]
                  }`}
                >
                  Purchase Card
                </button>
              </div>
            </div>
          ))}
          {subscriptions.length === 0 && (
            <p className="col-span-full text-slate-400 text-sm italic text-center py-6">No membership plans available.</p>
          )}
        </div>
      </section>

      {/* ─── TEAM SECTION (CMS SECTION) ─── */}
      <section className="py-20 px-6 max-w-5xl mx-auto border-t border-slate-900">
        <div className="text-center mb-16">
          <span className={`text-xs font-bold uppercase tracking-widest ${activeTemplate === 'MINIMAL' ? 'text-stone-500' : textAccentClass}`}>CMS Section: STYLIST TEAM</span>
          <h2 className={`text-3xl md:text-5xl font-extrabold mt-2 tracking-tight ${activeTemplate === 'MINIMAL' ? 'text-stone-900' : 'text-slate-100'}`}>
            Elite Design Directors
          </h2>
          <p className="text-slate-500 text-xs md:text-sm max-w-lg mx-auto mt-3">
            Our stylists hold global master certifications, delivering precise artistic haircuts and therapeutic scalp relaxation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {activeStylists.map(stylist => (
            <div key={stylist.id} className={`p-6 rounded-2xl border flex flex-col justify-between gap-6 ${currentTheme.card}`}>
              <div className="space-y-4">
                {/* Simulated Avatar */}
                <div className={`w-14 h-14 rounded-full flex items-center justify-center font-extrabold text-sm border ${
                  activeTemplate === 'MINIMAL' ? 'bg-stone-100 border-stone-300 text-stone-900 font-sans' : 'bg-slate-950 border-slate-900 text-rose-400 font-mono'
                }`}>
                  {stylist.avatar}
                </div>
                
                <div>
                  <h3 className={`font-extrabold text-base ${activeTemplate === 'MINIMAL' ? 'text-stone-900' : 'text-slate-200'}`}>{stylist.name}</h3>
                  <span className="text-[10px] text-slate-500 font-sans tracking-wide block">{stylist.role} — <strong className={textAccentClass}>{stylist.specialty}</strong></span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-900/60 pt-4 font-sans text-xs">
                <div className="flex items-center gap-1">
                  <Star className="size-3.5 text-amber-500 fill-amber-500" />
                  <span className={`font-bold ${activeTemplate === 'MINIMAL' ? 'text-stone-900' : 'text-slate-350'}`}>{stylist.rating}</span>
                  <span className="text-slate-650">({stylist.totalReviews} reviews)</span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold rounded uppercase tracking-wider">Available</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── SPECIAL OFFERS SECTION (CMS SECTION) ─── */}
      <section className="py-20 px-6 max-w-5xl mx-auto border-t border-slate-900">
        <div className="text-center mb-12">
          <span className={`text-xs font-bold uppercase tracking-widest ${activeTemplate === 'MINIMAL' ? 'text-stone-500' : textAccentClass}`}>CMS Section: OFFERS & COUPONS</span>
          <h2 className={`text-3xl md:text-5xl font-extrabold mt-2 tracking-tight ${activeTemplate === 'MINIMAL' ? 'text-stone-900' : 'text-slate-100'}`}>
            Exclusive Offers & Coupons
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left font-sans">
          
          {/* Coupon 1 */}
          <div className="bg-slate-900/20 border-2 border-dashed border-rose-500/20 rounded-2xl p-6 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 text-[9px] font-bold rounded uppercase tracking-widest border border-rose-500/20">First Onboard</span>
              <h3 className="font-extrabold text-base text-slate-200 mt-1">{activeDiscountPercent}% Flat Booking discount</h3>
              <p className="text-xs text-slate-550">Apply coupon {activeCouponCode} during checkouts.</p>
            </div>
            <div className="bg-slate-950 border border-slate-850 px-4 py-2.5 rounded-lg text-center">
              <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">CODE</span>
              <span className="font-mono text-sm font-extrabold text-rose-400">{activeCouponCode}</span>
            </div>
          </div>

          {/* Coupon 2 */}
          <div className="bg-slate-900/20 border-2 border-dashed border-slate-900 rounded-2xl p-6 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="px-2 py-0.5 bg-slate-950 text-slate-500 text-[9px] font-bold rounded uppercase tracking-widest border border-slate-900">Birthday Retainer</span>
              <h3 className="font-extrabold text-base text-slate-300 mt-1">₹500 Flat Outlet Voucher</h3>
              <p className="text-xs text-slate-650">Automatically triggered on member birthdays.</p>
            </div>
            <div className="bg-slate-950 border border-slate-900 px-4 py-2.5 rounded-lg text-center opacity-70">
              <span className="text-[10px] font-bold text-slate-600 block uppercase tracking-wider">TRIGGER</span>
              <span className="font-bold text-xs text-slate-400">BIRTHDAY</span>
            </div>
          </div>

        </div>

        {/* Dynamic Combo & Service Offers */}
        {(() => {
          const comboOffers = services.filter(s => s.isCombo);
          const priceOffers = services.filter(s => s.offerPrice !== null && s.offerPrice !== undefined && !s.isCombo);
          if (comboOffers.length === 0 && priceOffers.length === 0) return null;
          return (
            <div className="mt-16 space-y-12 text-left">
              {/* Combos */}
              {comboOffers.length > 0 && (
                <div className="space-y-6">
                  <h3 className={`text-lg font-bold uppercase tracking-widest ${activeTemplate === 'MINIMAL' ? 'text-stone-700' : 'text-slate-200'}`}>Special Combo Deals</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {comboOffers.map(combo => (
                      <div key={combo.id} className={`p-6 rounded-3xl border transition-all flex flex-col justify-between hover:scale-[1.01] ${
                        activeTemplate === 'MINIMAL' 
                          ? 'bg-stone-50 border-stone-200 hover:border-stone-400' 
                          : 'bg-slate-900/40 border-slate-800/80 hover:border-rose-500/20'
                      }`}>
                        <div className="space-y-3">
                          <div className="flex justify-between items-start gap-4">
                            <h4 className={`text-lg font-bold ${activeTemplate === 'MINIMAL' ? 'text-stone-900' : 'text-slate-150'}`}>{combo.name}</h4>
                            <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[9px] font-bold uppercase tracking-wider">Combo Offer</span>
                          </div>
                          {combo.desc && <p className="text-xs text-slate-400 leading-relaxed font-sans normal-case">{combo.desc}</p>}
                          {/* Included services lists */}
                          {combo.comboServiceIds && combo.comboServiceIds.length > 0 && (
                            <div className="space-y-1 mt-2">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Included Services:</span>
                              <div className="flex flex-wrap gap-1.5">
                                {combo.comboServiceIds.map(csId => {
                                  const matchSer = services.find(s => s.id === csId);
                                  return matchSer ? (
                                    <span key={csId} className={`text-[10px] px-2 py-1 rounded-lg font-medium ${
                                      activeTemplate === 'MINIMAL' 
                                        ? 'bg-stone-200 text-stone-700' 
                                        : 'bg-slate-950 text-slate-400 border border-slate-850'
                                    }`}>{matchSer.name}</span>
                                  ) : null;
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-850">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Special Price</span>
                            <div className="flex items-baseline gap-2">
                              <span className={`text-xl font-black ${activeTemplate === 'MINIMAL' ? 'text-stone-900' : 'text-slate-100'}`}>₹{combo.offerPrice || combo.price}</span>
                              {combo.offerPrice && <span className="text-xs text-slate-500 line-through">₹{combo.price}</span>}
                            </div>
                          </div>
                          <button 
                            onClick={() => {
                              const targetPath = `/booking?outlet=${selectedOutlet?.id || "out_calicut"}&service=${combo.id}`;
                              window.location.href = getTenantHref(tenantSlug, targetPath);
                            }}
                            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                              activeTemplate === 'MINIMAL'
                                ? 'bg-stone-900 text-white hover:bg-stone-850'
                                : 'bg-rose-50 text-white hover:bg-rose-600'
                            }`}
                          >
                            Book Combo
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Service Offers */}
              {priceOffers.length > 0 && (
                <div className="space-y-6">
                  <h3 className={`text-lg font-bold uppercase tracking-widest ${activeTemplate === 'MINIMAL' ? 'text-stone-700' : 'text-slate-200'}`}>Limited-Time Service Offers</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {priceOffers.map(offer => (
                      <div key={offer.id} className={`p-6 rounded-3xl border transition-all flex flex-col justify-between hover:scale-[1.01] ${
                        activeTemplate === 'MINIMAL' 
                          ? 'bg-stone-50 border-stone-200 hover:border-stone-400' 
                          : 'bg-slate-900/40 border-slate-800/80 hover:border-rose-500/20'
                      }`}>
                        <div className="space-y-3">
                          <div className="flex justify-between items-start gap-4">
                            <h4 className={`text-lg font-bold ${activeTemplate === 'MINIMAL' ? 'text-stone-900' : 'text-slate-150'}`}>{offer.name}</h4>
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase tracking-wider">Price Cut</span>
                          </div>
                          {offer.desc && <p className="text-xs text-slate-550 leading-relaxed font-sans normal-case">{offer.desc}</p>}
                          <span className="text-[10px] text-slate-500 font-semibold block">{offer.duration} mins duration</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-800/40">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Offer Price</span>
                            <div className="flex items-baseline gap-2">
                              <span className={`text-xl font-black ${activeTemplate === 'MINIMAL' ? 'text-stone-900' : 'text-slate-100'}`}>₹{offer.offerPrice}</span>
                              <span className="text-xs text-slate-550 line-through">₹{offer.price}</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => {
                              const targetPath = `/booking?outlet=${selectedOutlet?.id || "out_calicut"}&service=${offer.id}`;
                              window.location.href = getTenantHref(tenantSlug, targetPath);
                            }}
                            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                              activeTemplate === 'MINIMAL'
                                ? 'bg-stone-900 text-white hover:bg-stone-850'
                                : 'bg-rose-50 text-white hover:bg-rose-600'
                            }`}
                          >
                            Book Now
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </section>
      </>)}

      {/* ─── CONTACT FOOTER SECTION ─── */}
      <section className="py-20 px-6 max-w-5xl mx-auto border-t border-slate-900 text-left">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 font-sans">
          <div className="space-y-6">
            <div>
              <h3 className={`font-extrabold text-lg ${activeTemplate === 'MINIMAL' ? 'text-stone-900' : 'text-slate-200'}`}>Active Outlet Location</h3>
              <p className="text-xs text-slate-500 mt-1">Selected location is isolate-bound</p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex gap-3 text-slate-400">
                <MapPin className="size-4.5 text-slate-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-200 block">{selectedOutlet.name}</span>
                  <span className="text-slate-500 block mt-1">{selectedOutlet.address}</span>
                </div>
              </div>

              <div className="flex gap-3 text-slate-400">
                <Clock className="size-4.5 text-slate-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-200 block">Working Hours</span>
                  <span className="text-slate-500 block mt-1">{selectedOutlet.timings}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/10 rounded-2xl border border-slate-900/60 p-6 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-200">WhatsApp Alert Automations</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              Careva Multi-Tenant uses queue-based notifications powered by BullMQ. Every appointment booking generates reminders, receipts, and OTPs dynamically.
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Smartphone className="size-4" /> WhatsApp Gateway Connected
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

