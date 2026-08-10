"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Plus, Search, Calendar, CalendarDays, Users, BarChart3, Receipt, Sparkles,
  CreditCard, ChevronRight, CheckCircle, Tag, Clock, User,
  Phone, Mail, Award, Trash2, Edit2, ShoppingBag, Scissors, Save, X, TrendingUp, Sliders, Check, Upload, ArrowUp, ArrowDown, ChevronDown, ToggleLeft, Ban, MessageSquare, Smartphone, Lock, Activity, Download,
  Coins, FileText, Bell
} from "lucide-react";
import { getTenantBySlug, saveSharedTenant } from "../../../../shared/utils/utils";
import {
  productSchema,
  serviceSchema,
  customerSchema,
  userSchema,
  couponSchema,
  bookingSchema
} from "../../../../shared/validation";
import dynamic from "next/dynamic";

const AppointmentCalendar = dynamic(() => import("./AppointmentCalendar"), { ssr: false });
const POSModule = dynamic(() => import("./components/POSModule"), { ssr: false });
const CheckoutTicket = dynamic(() => import("./components/POSModule").then(mod => mod.CheckoutTicket), { ssr: false });
const CRMModule = dynamic(() => import("./components/CRMModule"), { ssr: false });
const WhatsAppModule = dynamic(() => import("./components/WhatsAppModule"), { ssr: false });
const ReportsModule = dynamic(() => import("./components/ReportsModule"), { ssr: false });
const CMSModule = dynamic(() => import("./components/CMSModule"), { ssr: false });
const LoyaltyModule = dynamic(() => import("./components/LoyaltyModule"), { ssr: false });

// Types
interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  type: "service" | "product";
  staffId?: string;
  staffName?: string;
}

interface CrmCustomer {
  id: string;
  name: string;
  phone: string;
  email: string;
  totalVisits: number;
  totalSpend: number;
  tags: string[];
  notes: Array<{ addedBy: string; date: string; content: string }>;
  loyaltyPoints?: number;
  activeSubscriptionId?: string;
  subscriptionExpiry?: string;
}

interface BookingSlot {
  id: string;
  customerName: string;
  phone: string;
  serviceName: string;
  stylistName: string;
  time: string;
  status: "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  scheduledAt?: string;
  date?: string;
  totalPrice?: number;
}

interface ServiceItem {
  id: string;
  name: string;
  price: number;
  offerPrice?: number | null;
  isCombo?: boolean;
  comboServiceIds?: string[];
  category: string;
  description?: string;
  duration?: number;
  gender?: string;    // MEN, WOMEN, UNISEX
  bodyPart?: string;  // FACE, HEAD, HAIR, BODY, LEGS, HANDS, NAILS, FULL_BODY, OTHER
  outletId?: string | null;
  type: "service";
  images?: string[];
  tags?: string[];
  loyaltyPoints?: number;
}

interface ProductItem {
  id: string;
  name: string;
  price: number;
  sku?: string;
  stockQty?: number;
  trackStock?: boolean;
  type: "product";
  costPrice?: number;
  lowStockThreshold?: number;
  supplierId?: string | null;
  imageUrl?: string | null;
  description?: string | null;
}

interface SubscriptionPackage {
  id: string;
  name: string;
  price: number;
  duration: string;
  description: string;
  status: "ACTIVE" | "INACTIVE";
}

interface CouponItem {
  id: string;
  code: string;
  discountPercent: number;
  maxDiscount: number;
  minBill: number;
  expiryDate: string;
  status: "ACTIVE" | "INACTIVE";
}

const generateAdminSlots = (timingsStr: string = "09:00 AM - 09:00 PM") => {
  let startHour = 9;
  let startMin = 0;
  let endHour = 21;
  let endMin = 0;

  try {
    const parts = timingsStr.split("-").map(p => p.trim());
    if (parts.length === 2) {
      const parseTimePart = (tStr: string) => {
        const partsSplit = tStr.split(" ");
        const time = partsSplit[0];
        const period = partsSplit[1];
        let [h, m] = time.split(":").map(Number);
        if (period?.toUpperCase() === "PM" && h !== 12) h += 12;
        if (period?.toUpperCase() === "AM" && h === 12) h = 0;
        return [h, m || 0];
      };
      const [sh, sm] = parseTimePart(parts[0]);
      const [eh, em] = parseTimePart(parts[1]);
      startHour = sh;
      startMin = sm;
      endHour = eh;
      endMin = em;
    }
  } catch (e) {
    // Fallback
  }

  const slots = [];
  let currMin = startHour * 60 + startMin;
  const endLimit = endHour * 60 + endMin;

  while (currMin < endLimit) {
    const h24 = Math.floor(currMin / 60);
    const m = currMin % 60;
    const timeStr = `${String(h24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    slots.push(timeStr);
    currMin += 30; // 30 min intervals
  }
  return slots;
};

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
      return true; // always unlocked — available on all plans
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

function getRequiredPlan(tabId: string): string {
  let plans: PlanModel[] = [];
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("global_subscription_plans");
    if (stored) {
      try {
        plans = JSON.parse(stored);
      } catch (e) {
        console.error(e);
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

  const sortedPlans = [...plans].sort((a, b) => a.price - b.price);
  for (const plan of sortedPlans) {
    if (hasFeature(plan.features, tabId)) {
      return plan.name;
    }
  }
  return "Premium";
}

function getAllowedOutlets(plan: string, outlets: any[]): any[] {
  let normPlan = plan.toLowerCase();
  let plans: PlanModel[] = [];
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("global_subscription_plans");
    if (stored) {
      try {
        plans = JSON.parse(stored);
      } catch (e) {
        console.error(e);
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

  const match = plans.find(p => p.name.toLowerCase() === normPlan);
  if (match) {
    const features = match.features.map(f => f.toLowerCase().trim());
    if (normPlan.includes("premium")) {
      return outlets;
    }
    if (normPlan.includes("growth")) {
      return outlets.slice(0, 3);
    }
  }

  return outlets.slice(0, 1);
}

function isTabAllowedForRole(role: string, tabId: string): boolean {
  if (role === "OWNER") return true;
  if (role === "MANAGER") {
    return !["SUBSCRIPTIONS", "WHATSAPP", "CMS"].includes(tabId);
  }
  if (role === "RECEPTIONIST") {
    return ["POS", "CRM", "BOOKINGS", "SERVICES", "SCHEDULE"].includes(tabId);
  }
  if (role === "STYLIST") {
    return ["SCHEDULE", "SERVICES", "PAYROLL", "BOOKINGS"].includes(tabId);
  }
  return false;
}

function getDefaultTabForRole(role: string): string {
  if (role === "STYLIST") return "SCHEDULE";
  return "POS";
}

function TenantAdminConsoleInner({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const resolvedParams = React.use(params);
  const tenantSlug = resolvedParams.tenantSlug || "luxcuts";
  const searchParams = useSearchParams();
  const router = useRouter();

  // ─── ADMIN AUTH GUARD ───
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminAuthChecked, setAdminAuthChecked] = useState(false);
  const [adminLoginEmail, setAdminLoginEmail] = useState("");
  const [adminLoginPassword, setAdminLoginPassword] = useState("");
  const [adminLoginError, setAdminLoginError] = useState("");
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);
  const [adminShowPassword, setAdminShowPassword] = useState(false);
  const [userRole, setUserRole] = useState<string>("OWNER");
  const [userOutletId, setUserOutletId] = useState<string | null>(null);

  // ─── Team Management States ───
  const [teamUsers, setTeamUsers] = useState<any[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamRefreshCounter, setTeamRefreshCounter] = useState(0);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [teamName, setTeamName] = useState("");
  const [teamEmail, setTeamEmail] = useState("");
  const [teamPhone, setTeamPhone] = useState("");
  const [teamPassword, setTeamPassword] = useState("");
  const [teamRole, setTeamRole] = useState("STYLIST");
  const [teamOutletId, setTeamOutletId] = useState("");
  const [teamSpecialization, setTeamSpecialization] = useState("");
  const [teamIsActive, setTeamIsActive] = useState(true);
  // workingDays: array of day numbers 0=Sun…6=Sat
  const [teamWorkingDays, setTeamWorkingDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);

  const [businessName, setBusinessName] = useState("LuxCuts Salon");
  const [tenantPlan, setTenantPlan] = useState<string>("Essential");

  // ─── CMS THEME STATE ───
  const [activeTemplate, setActiveTemplate] = useState<"LUXURY" | "MINIMAL" | "SPA" | "BARBER" | "WELLNESS">("LUXURY");
  const [accentColor, setAccentColor] = useState<"gold" | "rose" | "emerald" | "amber">("gold");
  const [customTextColor, setCustomTextColor] = useState("");
  const [customHeadingColor, setCustomHeadingColor] = useState("");
  const [customButtonColor, setCustomButtonColor] = useState("");
  const [cmsSaveLoading, setCmsSaveLoading] = useState(false);
  const [cmsSaveSuccess, setCmsSaveSuccess] = useState(false);
  // Custom Code Storefront
  const [useCustomCode, setUseCustomCode] = useState(false);
  const [customHtml, setCustomHtml] = useState("");
  const [customCss, setCustomCss] = useState("");
  const [customJs, setCustomJs] = useState("");

  const [tagline, setTagline] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [campaignCouponCode, setCampaignCouponCode] = useState("LUXFIRST");
  const [campaignDiscountPercent, setCampaignDiscountPercent] = useState(15);

  const [cmsOutlets, setCmsOutlets] = useState<any[]>([]);
  const [cmsStylists, setCmsStylists] = useState<any[]>([]);

  // ─── PAYROLL & ATTENDANCE STATES ───
  const [payrollSummary, setPayrollSummary] = useState<any[]>([]);
  const [payrollPeriods, setPayrollPeriods] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [payrollLoading, setPayrollLoading] = useState(false);
  const [payrollPeriodsFilterStatus, setPayrollPeriodsFilterStatus] = useState<string>("All");
  const [selectedStaffForPayroll, setSelectedStaffForPayroll] = useState<string>("");
  const [commissionRules, setCommissionRules] = useState<any[]>([]);
  const [payrollSubTab, setPayrollSubTab] = useState<"attendance" | "commissions" | "calculator">("attendance");
  const [clockInNotes, setClockInNotes] = useState("");
  const [clockOutNotes, setClockOutNotes] = useState("");
  const [clockingAction, setClockingAction] = useState(false);

  // Commission Form state
  const [commServiceId, setCommServiceId] = useState("");
  const [commType, setCommType] = useState<"PERCENTAGE" | "FLAT">("PERCENTAGE");
  const [commRate, setCommRate] = useState<number>(10);
  const [commActionLoading, setCommActionLoading] = useState(false);

  // Generate Period Form state
  const [genPeriodStart, setGenPeriodStart] = useState("");
  const [genPeriodEnd, setGenPeriodEnd] = useState("");
  const [genNotes, setGenNotes] = useState("");

  // ─── CONSENT FORMS STATES ───
  const [consentTemplates, setConsentTemplates] = useState<any[]>([]);
  const [consentTemplatesLoading, setConsentTemplatesLoading] = useState(false);
  const [consentSubTab, setConsentSubTab] = useState<"templates" | "sign" | "logs">("templates");

  // Create Consent Form
  const [newConsentTitle, setNewConsentTitle] = useState("");
  const [newConsentContent, setNewConsentContent] = useState("");
  const [newConsentCategory, setNewConsentCategory] = useState("");
  const [creatingTemplateLoading, setCreatingTemplateLoading] = useState(false);

  // Sign Consent Form
  const [signConsentTemplateId, setSignConsentTemplateId] = useState("");
  const [signConsentCustomerId, setSignConsentCustomerId] = useState("");
  const [signConsentSignatureText, setSignConsentSignatureText] = useState("");
  const [signConsentSignatureUrl, setSignConsentSignatureUrl] = useState("");
  const [signConsentLoading, setSignConsentLoading] = useState(false);
  const [selectedCustomerConsentHistory, setSelectedCustomerConsentHistory] = useState<any[]>([]);
  const [logsCustomerId, setLogsCustomerId] = useState("");

  // ─── DYNAMIC STOREFRONT BUILDER STATES & BRAND LEVEL DEFAULTS ───
  const [logoUrl, setLogoUrl] = useState("");
  const [sections, setSections] = useState<any[]>([]);

  // Brand Level Shared Globally Defaults
  const [activeCmsOutletId, setActiveCmsOutletId] = useState<string>("brand_global");
  const [brandTagline, setBrandTagline] = useState("");
  const [brandSubtitle, setBrandSubtitle] = useState("");
  const [brandCouponCode, setBrandCouponCode] = useState("LUXFIRST");
  const [brandDiscountPercent, setBrandDiscountPercent] = useState(15);
  const [brandLogoUrl, setBrandLogoUrl] = useState("");
  const [brandSections, setBrandSections] = useState<any[]>([]);

  // Helper to save active editor states to local memory variables (either brand defaults or active branch)
  const saveActiveOutletDataToMemory = (outletId: string, currentOutlets = cmsOutlets) => {
    if (outletId === "brand_global") {
      setBrandTagline(tagline);
      setBrandSubtitle(subtitle);
      setBrandCouponCode(campaignCouponCode);
      setBrandDiscountPercent(Number(campaignDiscountPercent));
      setBrandLogoUrl(logoUrl);
      setBrandSections(sections);
    } else {
      const updated = currentOutlets.map(o => {
        if (o.id === outletId) {
          return {
            ...o,
            heroTitle: tagline,
            heroSubtitle: subtitle,
            couponCode: campaignCouponCode,
            couponDiscount: Number(campaignDiscountPercent),
            logoUrl: logoUrl,
            sectionsJson: JSON.stringify(sections)
          };
        }
        return o;
      });
      setCmsOutlets(updated);
      return updated;
    }
    return currentOutlets;
  };

  // Helper to load selected outlet's state into active editor states
  const loadOutletDataIntoState = (outletId: string, currentOutlets = cmsOutlets) => {
    if (outletId === "brand_global") {
      setTagline(brandTagline);
      setSubtitle(brandSubtitle);
      setCampaignCouponCode(brandCouponCode);
      setCampaignDiscountPercent(brandDiscountPercent);
      setLogoUrl(brandLogoUrl);
      setSections(brandSections);
    } else {
      const outlet = currentOutlets.find(o => o.id === outletId);
      if (outlet) {
        setTagline(outlet.heroTitle || "");
        setSubtitle(outlet.heroSubtitle || "");
        setCampaignCouponCode(outlet.couponCode || "");
        setCampaignDiscountPercent(outlet.couponDiscount || 0);
        setLogoUrl(outlet.logoUrl || "");
        if (outlet.sectionsJson) {
          setSections(JSON.parse(outlet.sectionsJson));
        } else {
          // Fallback to brand global sections structure
          setSections(brandSections);
        }
      }
    }
  };

  const handleSwitchOutlet = (nextOutletId: string) => {
    const currentOutletsSaved = saveActiveOutletDataToMemory(activeCmsOutletId);
    setActiveCmsOutletId(nextOutletId);
    loadOutletDataIntoState(nextOutletId, currentOutletsSaved);
    setSelectedSectionId(null);
  };

  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const activePreviewOutlet = cmsOutlets.find(o => o.id === activeCmsOutletId) || cmsOutlets[0];

  // ─── CMS Internal Sub-tab navigation ───
  const [cmsSubTab, setCmsSubTab] = useState<"IDENTITY" | "STYLING" | "CAMPAIGNS" | "OUTLETS" | "BUILDER" | "CUSTOM CODE" | "MEDIA LIBRARY">("IDENTITY");

  // New Stylist Form State
  const [newStylistName, setNewStylistName] = useState("");
  const [newStylistRole, setNewStylistRole] = useState("Junior Stylist");
  const [newStylistSpecialty, setNewStylistSpecialty] = useState("Haircuts & Fades");
  const [newStylistRating, setNewStylistRating] = useState(4.8);
  const [newStylistWorkDays, setNewStylistWorkDays] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const [newStylistStartTime, setNewStylistStartTime] = useState("09:00");
  const [newStylistEndTime, setNewStylistEndTime] = useState("20:00");

  // New Outlet Form State
  const [newOutletName, setNewOutletName] = useState("");
  const [newOutletAddress, setNewOutletAddress] = useState("");
  const [newOutletPhone, setNewOutletPhone] = useState("");
  const [newOutletTimings, setNewOutletTimings] = useState("09:00 AM - 09:00 PM (Mon-Sun)");

  const handleSaveCMSConfig = async () => {
    setCmsSaveLoading(true);
    setCmsSaveSuccess(false);
    try {
      const match = await getTenantBySlug(tenantSlug);
      if (match) {
        // Flush active editor state to the active scope memory first
        let currentBrandLogoUrl = brandLogoUrl;
        let currentBrandTagline = brandTagline;
        let currentBrandSubtitle = brandSubtitle;
        let currentBrandCouponCode = brandCouponCode;
        let currentBrandDiscountPercent = brandDiscountPercent;
        let currentBrandSections = brandSections;
        let currentOutlets = [...cmsOutlets];

        if (activeCmsOutletId === "brand_global") {
          currentBrandLogoUrl = logoUrl;
          currentBrandTagline = tagline;
          currentBrandSubtitle = subtitle;
          currentBrandCouponCode = campaignCouponCode;
          currentBrandDiscountPercent = Number(campaignDiscountPercent);
          currentBrandSections = sections;

          setBrandLogoUrl(logoUrl);
          setBrandTagline(tagline);
          setBrandSubtitle(subtitle);
          setBrandCouponCode(campaignCouponCode);
          setBrandDiscountPercent(Number(campaignDiscountPercent));
          setBrandSections(sections);
        } else {
          currentOutlets = cmsOutlets.map(o => {
            if (o.id === activeCmsOutletId) {
              return {
                ...o,
                heroTitle: tagline,
                heroSubtitle: subtitle,
                couponCode: campaignCouponCode,
                couponDiscount: Number(campaignDiscountPercent),
                logoUrl: logoUrl,
                sectionsJson: JSON.stringify(sections)
              };
            }
            return o;
          });
          setCmsOutlets(currentOutlets);
        }

        // Save theme settings
        match.activeTemplate = activeTemplate;
        match.accentColor = accentColor;
        match.customTextColor = customTextColor;
        match.customHeadingColor = customHeadingColor;
        match.customButtonColor = customButtonColor;
        match.name = businessName;

        // Save global brand fields
        match.logoUrl = currentBrandLogoUrl;
        match.tagline = currentBrandTagline;
        match.subtitle = currentBrandSubtitle;
        match.couponCode = currentBrandCouponCode;
        match.couponDiscount = Number(currentBrandDiscountPercent);
        match.sectionsJson = JSON.stringify(currentBrandSections);

        // Save outlets (including localized overrides) and stylists
        match.outlets = currentOutlets;
        match.stylists = cmsStylists;

        // Save custom code config to backend DB
        await fetch("/api/cms", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-tenant-slug": tenantSlug },
          body: JSON.stringify({ template: activeTemplate, primaryColor: accentColor, useCustomCode, customHtml, customCss, customJs }),
        });

        const saveOk = await saveSharedTenant(match);
        if (saveOk) {
          const refreshed = await getTenantBySlug(tenantSlug);
          if (refreshed) {
            setCmsOutlets(refreshed.outlets || []);
            if (refreshed.stylists) setCmsStylists(refreshed.stylists);
          }
        }
        setCmsSaveSuccess(true);
        setTimeout(() => setCmsSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error("Failed to save CMS config", e);
    } finally {
      setCmsSaveLoading(false);
    }
  };

  // ─── WORKSPACE DATA STATES (DYNAMIC & STORAGE PERSISTED) ───
  const [selectedOutletId, setSelectedOutletId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(`active_outlet_id_${tenantSlug}`);
      if (stored) {
        setSelectedOutletId(stored);
      }
    }
  }, [tenantSlug]);

  // Load custom code config from backend on mount
  useEffect(() => {
    if (tenantSlug) {
      fetch("/api/cms", { headers: { "x-tenant-slug": tenantSlug } })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) {
            if (data.useCustomCode !== undefined) setUseCustomCode(data.useCustomCode);
            if (data.customHtml) setCustomHtml(data.customHtml);
            if (data.customCss) setCustomCss(data.customCss);
            if (data.customJs) setCustomJs(data.customJs);
          }
        })
        .catch(() => { });
    }
  }, [tenantSlug]);

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [customers, setCustomers] = useState<CrmCustomer[]>([]);
  const [bookings, setBookings] = useState<BookingSlot[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionPackage[]>([]);
  const [coupons, setCoupons] = useState<CouponItem[]>([]);

  // Inventory & CRM sub-tabs and management state
  const [productSubTab, setProductSubTab] = useState<"SHELF" | "SUPPLIERS" | "ORDERS">("SHELF");
  const [scheduleSubTab, setScheduleSubTab] = useState<"CALENDAR" | "TEAM">("CALENDAR");
  const [crmSubTab, setCrmSubTab] = useState<"CLIENTS" | "SEGMENTS">("CLIENTS");
  const [productCostPrice, setProductCostPrice] = useState(0);
  const [productLowStockThreshold, setProductLowStockThreshold] = useState(5);
  const [productSupplierId, setProductSupplierId] = useState("");
  const [productImageUrl, setProductImageUrl] = useState("");
  const [isUploadingProductImage, setIsUploadingProductImage] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);

  const [customerSegments, setCustomerSegments] = useState<any[]>([]);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>("");
  const [segmentMembers, setSegmentMembers] = useState<any[]>([]);
  const [isSegmentModalOpen, setIsSegmentModalOpen] = useState(false);
  const [newSegmentName, setNewSegmentName] = useState("");
  const [newSegmentDesc, setNewSegmentDesc] = useState("");
  const [newSegmentType, setNewSegmentType] = useState("LAST_VISIT");
  const [newSegmentValue, setNewSegmentValue] = useState("60");

  const [reportsData, setReportsData] = useState<any>(null);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [dailyRevenue, setDailyRevenue] = useState<any>(null);
  const [outletPerformance, setOutletPerformance] = useState<any>(null);
  const [staffPerformance, setStaffPerformance] = useState<any>(null);
  const [servicePopularity, setServicePopularity] = useState<any>(null);
  const [retentionStats, setRetentionStats] = useState<any>(null);
  const [bookingAnalytics, setBookingAnalytics] = useState<any>(null);
  const [revenueForecast, setRevenueForecast] = useState<any>(null);
  const [gstrReport, setGstrReport] = useState<any>(null);
  const [activeReportSubTab, setActiveReportSubTab] = useState<"OVERVIEW" | "SALES" | "STAFF" | "SERVICES" | "FORECAST">("OVERVIEW");
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [salesRangeDays, setSalesRangeDays] = useState<7 | 14 | 30>(30);
  const [bookingDateFilter, setBookingDateFilter] = useState<"all" | "today" | "tomorrow">("all");
  const [bookingSort, setBookingSort] = useState<"time-asc" | "time-desc" | "name-asc" | "status">("time-asc");

  const handleExportCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvRows = [];
    // Header row
    csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));
    // Data rows
    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header];
        const stringVal = val === null || val === undefined ? '' : typeof val === 'object' ? JSON.stringify(val) : String(val);
        return `"${stringVal.replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const saveCustomersState = async (updatedCustomers: CrmCustomer[]) => {
    setCustomers(updatedCustomers);
    if (typeof window !== "undefined") {
      localStorage.setItem(`tenant_customers_${tenantSlug}`, JSON.stringify(updatedCustomers));
    }
    // Async background sync to NestJS backend database
    for (const cust of updatedCustomers) {
      try {
        await fetch("/api/customers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-tenant-slug": tenantSlug,
          },
          body: JSON.stringify({
            name: cust.name,
            phone: cust.phone,
            email: cust.email || undefined,
            totalVisits: cust.totalVisits || 0,
            totalSpend: cust.totalSpend || 0,
          }),
        });
      } catch (e) {
        console.warn("Failed to sync customer to backend db", e);
      }
    }
  };

  const saveServicesState = async (updatedServices: ServiceItem[]) => {
    setServices(updatedServices);
    if (typeof window !== "undefined" && selectedOutletId) {
      localStorage.setItem(`tenant_services_${tenantSlug}_${selectedOutletId}`, JSON.stringify(updatedServices));
    }
    // Async background sync to NestJS backend database
    for (const s of updatedServices) {
      try {
        await fetch("/api/services", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-tenant-slug": tenantSlug,
          },
          body: JSON.stringify({
            name: s.name,
            category: s.category || "General",
            price: Number(s.price) || 0,
            duration: Number(s.duration) || 30,
            isActive: true,
          }),
        });
      } catch (e) {
        console.warn("Failed to sync service to backend db", e);
      }
    }
  };

  // ─── Tab State ───
  const activeTab = (searchParams.get("tab") || "POS") as "POS" | "CRM" | "BOOKINGS" | "SERVICES" | "PRODUCTS" | "PAYROLL" | "CONSENTS" | "CMS" | "REPORTS" | "SCHEDULE" | "SUBSCRIPTIONS" | "COUPONS" | "WHATSAPP" | "AUDIT" | "LOYALTY";
  const setActiveTab = (tab: string) => {
    router.push(`/tenant/${tenantSlug}/admin?tab=${tab}`);
  };



  // ─── Audit Logs States ───
  const [auditType, setAuditType] = useState<"bookings" | "invoices">("bookings");
  const [auditBookings, setAuditBookings] = useState<any[]>([]);
  const [auditBookingsTotal, setAuditBookingsTotal] = useState(0);
  const [auditBookingsPage, setAuditBookingsPage] = useState(1);
  const [auditBookingsSearch, setAuditBookingsSearch] = useState("");
  const [auditBookingsStatus, setAuditBookingsStatus] = useState("");
  const [auditBookingsFromDate, setAuditBookingsFromDate] = useState("");
  const [auditInvoices, setAuditInvoices] = useState<any[]>([]);
  const [auditInvoicesTotal, setAuditInvoicesTotal] = useState(0);
  const [auditInvoicesPage, setAuditInvoicesPage] = useState(1);
  const [auditInvoicesSearch, setAuditInvoicesSearch] = useState("");
  const [auditInvoicesStatus, setAuditInvoicesStatus] = useState("");
  const [auditInvoicesFromDate, setAuditInvoicesFromDate] = useState("");
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditRefreshCounter, setAuditRefreshCounter] = useState(0);
  const [processingInvoiceId, setProcessingInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === "REPORTS" && tenantSlug) {
      setReportsLoading(true);
      Promise.all([
        fetch("/api/reports?type=summary", { credentials: "include", headers: { "x-tenant-slug": tenantSlug } }).then(r => r.json()),
        fetch("/api/reports?type=daily-revenue&days=30", { credentials: "include", headers: { "x-tenant-slug": tenantSlug } }).then(r => r.json()),
        fetch("/api/reports?type=outlets", { credentials: "include", headers: { "x-tenant-slug": tenantSlug } }).then(r => r.json()),
        fetch("/api/reports?type=staff", { credentials: "include", headers: { "x-tenant-slug": tenantSlug } }).then(r => r.json()),
        fetch("/api/reports?type=services", { credentials: "include", headers: { "x-tenant-slug": tenantSlug } }).then(r => r.json()),
        fetch("/api/reports?type=retention", { credentials: "include", headers: { "x-tenant-slug": tenantSlug } }).then(r => r.json()),
        fetch("/api/reports?type=bookings", { credentials: "include", headers: { "x-tenant-slug": tenantSlug } }).then(r => r.json()),
        fetch("/api/reports?type=forecast", { credentials: "include", headers: { "x-tenant-slug": tenantSlug } }).then(r => r.json()),
        fetch("/api/reports?type=gstr", { credentials: "include", headers: { "x-tenant-slug": tenantSlug } }).then(r => r.json())
      ])
        .then(([summary, daily, outlets, staff, services, retention, bookings, forecast, gstr]) => {
          setReportsData(summary && !summary.error && !summary.fallback ? summary : null);
          setDailyRevenue(Array.isArray(daily) ? daily : null);
          setOutletPerformance(Array.isArray(outlets) ? outlets : null);
          setStaffPerformance(Array.isArray(staff) ? staff : null);
          setServicePopularity(Array.isArray(services) ? services : null);
          setRetentionStats(retention && !retention.error ? retention : null);
          setBookingAnalytics(bookings && !bookings.error ? bookings : null);
          setRevenueForecast(forecast && !forecast.error ? forecast : null);
          setGstrReport(gstr && !gstr.error ? gstr : null);
        })
        .catch(console.error)
        .finally(() => setReportsLoading(false));
    }
  }, [activeTab, tenantSlug]);

  // ─── AUDIT LOGS FETCH EFFECT ───
  useEffect(() => {
    if (activeTab === "AUDIT" && tenantSlug) {
      setAuditLoading(true);
      if (auditType === "bookings") {
        const queryParams = new URLSearchParams({
          page: auditBookingsPage.toString(),
          limit: "10",
          ...(selectedOutletId && { outletId: selectedOutletId }),
          ...(auditBookingsSearch && { search: auditBookingsSearch }),
          ...(auditBookingsStatus && { status: auditBookingsStatus }),
          ...(auditBookingsFromDate && { from: new Date(auditBookingsFromDate).toISOString() }),
        });

        fetch(`/api/bookings?${queryParams.toString()}`, {
          headers: { "x-tenant-slug": tenantSlug }
        })
          .then(res => res.json())
          .then(data => {
            if (data && !data.fallback && data.data) {
              setAuditBookings(data.data);
              setAuditBookingsTotal(data.meta?.total || 0);
            } else if (Array.isArray(data)) {
              // Local fallback logic
              setAuditBookings(data);
              setAuditBookingsTotal(data.length);
            } else {
              setAuditBookings([]);
              setAuditBookingsTotal(0);
            }
          })
          .catch(err => {
            console.error("Failed to load audit bookings:", err);
            setAuditBookings([]);
            setAuditBookingsTotal(0);
          })
          .finally(() => setAuditLoading(false));
      } else {
        const queryParams = new URLSearchParams({
          page: auditInvoicesPage.toString(),
          limit: "10",
          ...(selectedOutletId && { outletId: selectedOutletId }),
          ...(auditInvoicesSearch && { search: auditInvoicesSearch }),
          ...(auditInvoicesStatus && { status: auditInvoicesStatus }),
          ...(auditInvoicesFromDate && { from: new Date(auditInvoicesFromDate).toISOString() }),
        });

        fetch(`/api/pos/invoices?${queryParams.toString()}`, {
          headers: { "x-tenant-slug": tenantSlug }
        })
          .then(res => res.json())
          .then(data => {
            if (data && !data.fallback && data.data) {
              setAuditInvoices(data.data);
              setAuditInvoicesTotal(data.meta?.total || 0);
            } else if (Array.isArray(data)) {
              setAuditInvoices(data);
              setAuditInvoicesTotal(data.length);
            } else {
              setAuditInvoices([]);
              setAuditInvoicesTotal(0);
            }
          })
          .catch(err => {
            console.error("Failed to load audit invoices:", err);
            setAuditInvoices([]);
            setAuditInvoicesTotal(0);
          })
          .finally(() => setAuditLoading(false));
      }
    }
  }, [
    activeTab,
    tenantSlug,
    auditType,
    selectedOutletId,
    auditBookingsPage,
    auditBookingsSearch,
    auditBookingsStatus,
    auditBookingsFromDate,
    auditInvoicesPage,
    auditInvoicesSearch,
    auditInvoicesStatus,
    auditInvoicesFromDate,
    auditRefreshCounter
  ]);

  // ─── PAYROLL & ATTENDANCE DATA FETCHERS ───
  const fetchPayrollPeriods = () => {
    if (!tenantSlug) return;
    const query = new URLSearchParams({
      ...(selectedOutletId && { outletId: selectedOutletId }),
      ...(selectedStaffForPayroll && { staffId: selectedStaffForPayroll }),
      ...(payrollPeriodsFilterStatus !== "All" && { status: payrollPeriodsFilterStatus }),
    });
    fetch(`/api/payroll/periods?${query.toString()}`, {
      headers: { "x-tenant-slug": tenantSlug }
    })
      .then(res => res.json())
      .then(data => {
        setPayrollPeriods(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error("Failed to load payroll periods", err));
  };

  const fetchPayrollSummary = () => {
    if (!tenantSlug) return;
    const query = new URLSearchParams({
      ...(selectedOutletId && { outletId: selectedOutletId }),
    });
    fetch(`/api/payroll/summary?${query.toString()}`, {
      headers: { "x-tenant-slug": tenantSlug }
    })
      .then(res => res.json())
      .then(data => {
        setPayrollSummary(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error("Failed to load payroll summary", err));
  };

  const fetchAttendanceRecords = () => {
    if (!tenantSlug) return;
    const query = new URLSearchParams({
      ...(selectedOutletId && { outletId: selectedOutletId }),
      ...(selectedStaffForPayroll && { staffId: selectedStaffForPayroll }),
    });
    fetch(`/api/payroll/attendance?${query.toString()}`, {
      headers: { "x-tenant-slug": tenantSlug }
    })
      .then(res => res.json())
      .then(data => {
        setAttendanceRecords(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error("Failed to load attendance", err));
  };

  const fetchCommissionsForStaff = (staffId: string) => {
    if (!tenantSlug || !staffId) return;
    fetch(`/api/payroll/commissions/${staffId}`, {
      headers: { "x-tenant-slug": tenantSlug }
    })
      .then(res => res.json())
      .then(data => {
        setCommissionRules(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error("Failed to load commissions for staff", err));
  };

  useEffect(() => {
    if (activeTab === "PAYROLL" && tenantSlug) {
      setPayrollLoading(true);
      Promise.all([
        fetchPayrollPeriods(),
        fetchPayrollSummary(),
        fetchAttendanceRecords(),
      ]).finally(() => setPayrollLoading(false));
    }
  }, [activeTab, tenantSlug, selectedOutletId, selectedStaffForPayroll, payrollPeriodsFilterStatus]);

  useEffect(() => {
    if (selectedStaffForPayroll && payrollSubTab === "commissions") {
      fetchCommissionsForStaff(selectedStaffForPayroll);
    }
  }, [selectedStaffForPayroll, payrollSubTab]);

  // ─── CONSENT TEMPLATES FETCHERS ───
  const fetchConsentTemplates = () => {
    if (!tenantSlug) return;
    setConsentTemplatesLoading(true);
    fetch("/api/consent/templates", {
      headers: { "x-tenant-slug": tenantSlug }
    })
      .then(res => res.json())
      .then(data => {
        setConsentTemplates(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error("Failed to load consent templates", err))
      .finally(() => setConsentTemplatesLoading(false));
  };

  const fetchCustomerConsentHistory = (customerId: string) => {
    if (!tenantSlug || !customerId) return;
    fetch(`/api/consent/history/${customerId}`, {
      headers: { "x-tenant-slug": tenantSlug }
    })
      .then(res => res.json())
      .then(data => {
        setSelectedCustomerConsentHistory(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error("Failed to load customer consent history", err));
  };

  useEffect(() => {
    if (activeTab === "CONSENTS" && tenantSlug) {
      fetchConsentTemplates();
    }
  }, [activeTab, tenantSlug]);

  useEffect(() => {
    if (logsCustomerId) {
      fetchCustomerConsentHistory(logsCustomerId);
    }
  }, [logsCustomerId]);

  // ─── PAYROLL & ATTENDANCE ACTIONS ───
  const handleClockIn = async (staffId: string) => {
    if (!tenantSlug || !staffId) return;
    const outletId = selectedOutletId || (teamUsers.find((u: any) => u.id === staffId)?.outletId) || null;
    if (!outletId) {
      alert("Please select an outlet first (use the outlet dropdown at the top of the page).");
      return;
    }
    setClockingAction(true);
    try {
      const res = await fetch("/api/payroll/attendance/clock-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-slug": tenantSlug
        },
        body: JSON.stringify({
          staffId,
          outletId,
          notes: clockInNotes || undefined,
        }),
      });
      if (res.ok) {
        alert("Clock-in recorded successfully!");
        setClockInNotes("");
        fetchAttendanceRecords();
      } else {
        const err = await res.json();
        alert(`Failed to clock in: ${err.error || "Unknown error"}`);
      }
    } catch (e) {
      console.error(e);
      alert("Network error occurred during clock-in.");
    } finally {
      setClockingAction(false);
    }
  };

  const handleClockOut = async (recordId: string) => {
    if (!tenantSlug || !recordId) return;
    setClockingAction(true);
    try {
      const res = await fetch(`/api/payroll/attendance/${recordId}/clock-out`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-slug": tenantSlug
        },
        body: JSON.stringify({
          notes: clockOutNotes || undefined,
        }),
      });
      if (res.ok) {
        alert("Clock-out recorded successfully!");
        setClockOutNotes("");
        fetchAttendanceRecords();
      } else {
        const err = await res.json();
        alert(`Failed to clock out: ${err.error || "Unknown error"}`);
      }
    } catch (e) {
      console.error(e);
      alert("Network error occurred during clock-out.");
    } finally {
      setClockingAction(false);
    }
  };

  const handleUpsertCommission = async () => {
    if (!tenantSlug || !selectedStaffForPayroll) return;
    setCommActionLoading(true);
    try {
      const res = await fetch("/api/payroll/commissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-slug": tenantSlug
        },
        body: JSON.stringify({
          staffId: selectedStaffForPayroll,
          serviceId: commServiceId || undefined,
          type: commType,
          rate: Number(commRate) || 0,
        }),
      });
      if (res.ok) {
        alert("Commission rule updated!");
        setCommServiceId("");
        fetchCommissionsForStaff(selectedStaffForPayroll);
      } else {
        const err = await res.json();
        alert(`Failed to save commission rule: ${err.error || "Unknown error"}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCommActionLoading(false);
    }
  };

  const handleDeleteCommission = async (ruleId: string) => {
    if (!tenantSlug || !ruleId || !confirm("Are you sure you want to delete this rule?")) return;
    try {
      const res = await fetch(`/api/payroll/commissions/${ruleId}`, {
        method: "DELETE",
        headers: { "x-tenant-slug": tenantSlug }
      });
      if (res.ok) {
        alert("Commission rule deleted.");
        fetchCommissionsForStaff(selectedStaffForPayroll);
      } else {
        const err = await res.json();
        alert(`Failed: ${err.error || "Unknown error"}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGeneratePayrollPeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantSlug || !selectedStaffForPayroll || !genPeriodStart || !genPeriodEnd) {
      alert("Please fill in all fields.");
      return;
    }
    setPayrollLoading(true);
    try {
      const res = await fetch("/api/payroll/periods/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-slug": tenantSlug
        },
        body: JSON.stringify({
          staffId: selectedStaffForPayroll,
          periodStart: genPeriodStart,
          periodEnd: genPeriodEnd,
          outletId: selectedOutletId || undefined,
          notes: genNotes || undefined,
        }),
      });
      if (res.ok) {
        alert("Payroll period generated/refreshed successfully!");
        setGenNotes("");
        fetchPayrollPeriods();
        fetchPayrollSummary();
      } else {
        const err = await res.json();
        alert(`Failed to generate payroll: ${err.error || "Unknown error"}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPayrollLoading(false);
    }
  };

  const handleApprovePayrollPeriod = async (periodId: string, status: "APPROVED" | "PAID") => {
    if (!tenantSlug || !periodId || !confirm(`Mark this payroll period as ${status}?`)) return;
    try {
      const res = await fetch(`/api/payroll/periods/${periodId}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-slug": tenantSlug
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        alert(`Payroll period marked as ${status}!`);
        fetchPayrollPeriods();
        fetchPayrollSummary();
      } else {
        const err = await res.json();
        alert(`Failed: ${err.error || "Unknown error"}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ─── CONSENT FORMS ACTIONS ───
  const handleCreateConsentTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantSlug || !newConsentTitle || !newConsentContent) {
      alert("Please enter title and content.");
      return;
    }
    setCreatingTemplateLoading(true);
    try {
      const res = await fetch("/api/consent/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-slug": tenantSlug
        },
        body: JSON.stringify({
          title: newConsentTitle,
          content: newConsentContent,
          serviceCategoryId: newConsentCategory || undefined,
        }),
      });
      if (res.ok) {
        alert("Consent template created successfully!");
        setNewConsentTitle("");
        setNewConsentContent("");
        setNewConsentCategory("");
        fetchConsentTemplates();
      } else {
        const err = await res.json();
        alert(`Failed to create template: ${err.error || "Unknown error"}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreatingTemplateLoading(false);
    }
  };

  const handleSignConsent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantSlug || !signConsentCustomerId || !signConsentTemplateId) {
      alert("Please select customer and template.");
      return;
    }
    setSignConsentLoading(true);
    try {
      const res = await fetch("/api/consent/sign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-slug": tenantSlug
        },
        body: JSON.stringify({
          customerId: signConsentCustomerId,
          templateId: signConsentTemplateId,
          signatureText: signConsentSignatureText || undefined,
          signatureUrl: signConsentSignatureUrl || undefined,
        }),
      });
      if (res.ok) {
        alert("Client consent signature recorded successfully!");
        setSignConsentSignatureText("");
        setSignConsentSignatureUrl("");
        // If the signature log customer matches, refresh log history
        if (logsCustomerId === signConsentCustomerId) {
          fetchCustomerConsentHistory(logsCustomerId);
        }
        setConsentSubTab("logs");
        setLogsCustomerId(signConsentCustomerId);
      } else {
        const err = await res.json();
        alert(`Failed to sign consent: ${err.error || "Unknown error"}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSignConsentLoading(false);
    }
  };

  // ─── TEAM USERS FETCH EFFECT ───
  useEffect(() => {
    if (tenantSlug) {
      setTeamLoading(true);
      fetch("/api/users?all=true", {
        headers: { "x-tenant-slug": tenantSlug }
      })
        .then(res => res.json())
        .then(data => {
          let usersList: any[] = [];
          if (data && data.data && Array.isArray(data.data)) {
            usersList = data.data;
          } else if (Array.isArray(data)) {
            usersList = data;
          }
          setTeamUsers(usersList);

          // Sync to cmsStylists so calendar/scheduler/dropdowns reflect backend database
          const stylists = usersList
            .filter((u: any) => u.role === "STYLIST")
            .map((u: any) => {
              const profile = u.staffProfile || {};
              const specialty = profile.specializations || "Stylist";
              const dayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
              const workDays = Array.isArray(profile.workingDays)
                ? profile.workingDays.map((d: number) => dayMap[d % 7])
                : ["Mon", "Tue", "Wed", "Thu", "Fri"];

              return {
                id: u.id,
                name: u.name,
                role: u.staffProfile?.bio || "Stylist",
                rating: profile.rating || 5.0,
                totalReviews: profile.totalRatings || 0,
                specialty: specialty,
                avatar: u.name.split(" ").map((w: any) => w[0]).join("").toUpperCase().slice(0, 2),
                workDays: workDays,
                startTime: profile.breakStart || "09:00",
                endTime: profile.breakEnd || "20:00",
                outletId: u.outletId || undefined,
              };
            });

          if (stylists.length > 0) {
            setCmsStylists(stylists);
          }
        })
        .catch(err => {
          console.error("Failed to load team users:", err);
          setTeamUsers([]);
        })
        .finally(() => setTeamLoading(false));
    }
  }, [tenantSlug, teamRefreshCounter]);

  // ─── SCHEDULE STATE ───
  const activeOutletObj = cmsOutlets.find(o => o.id === selectedOutletId);
  const currentOutletTimings = activeOutletObj?.timings || "09:00 AM - 09:00 PM";
  const ALL_SLOTS = generateAdminSlots(currentOutletTimings);
  const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  // scheduleOverrides: { [stylistId]: { [day]: { blocked: string[] } } }
  const [scheduleOverrides, setScheduleOverrides] = useState<Record<string, Record<string, { blocked: string[] }>>>({});
  const [schedActiveDay, setSchedActiveDay] = useState("Mon");
  const [schedActiveStylist, setSchedActiveStylist] = useState<string | null>(null);
  const [schedSaved, setSchedSaved] = useState(false);

  const toggleSlotBlock = (stylistId: string, day: string, slot: string) => {
    setScheduleOverrides(prev => {
      const styData = prev[stylistId] || {};
      const dayData = styData[day] || { blocked: [] };
      const blocked = dayData.blocked.includes(slot)
        ? dayData.blocked.filter(s => s !== slot)
        : [...dayData.blocked, slot];
      return { ...prev, [stylistId]: { ...styData, [day]: { blocked } } };
    });
  };

  const blockAllSlots = (stylistId: string, day: string) => {
    setScheduleOverrides(prev => {
      const workDays: string[] = (cmsStylists.find(s => s.id === stylistId) as any)?.workDays || WEEK_DAYS;
      const isWorkDay = workDays.includes(day);
      const styData = prev[stylistId] || {};
      return { ...prev, [stylistId]: { ...styData, [day]: { blocked: isWorkDay ? ALL_SLOTS : [] } } };
    });
  };

  const clearDayBlocks = (stylistId: string, day: string) => {
    setScheduleOverrides(prev => {
      const styData = prev[stylistId] || {};
      return { ...prev, [stylistId]: { ...styData, [day]: { blocked: [] } } };
    });
  };

  const saveSchedule = async () => {
    const match = await getTenantBySlug(tenantSlug);
    if (match) {
      match.scheduleOverrides = scheduleOverrides;
      await saveSharedTenant(match);
      setSchedSaved(true);
      setTimeout(() => setSchedSaved(false), 2500);
    }
  };

  // ─── CRUD Modal States ───
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [serviceName, setServiceName] = useState("");
  const [servicePrice, setServicePrice] = useState(0);
  const [serviceOfferPrice, setServiceOfferPrice] = useState<number | "">("");
  const [serviceIsCombo, setServiceIsCombo] = useState(false);
  const [serviceComboServiceIds, setServiceComboServiceIds] = useState<string[]>([]);
  const [serviceCategory, setServiceCategory] = useState("Grooming");
  const [serviceDuration, setServiceDuration] = useState(30);
  const [serviceGender, setServiceGender] = useState("UNISEX");
  const [serviceBodyPart, setServiceBodyPart] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [serviceLoyaltyPoints, setServiceLoyaltyPoints] = useState(0);
  const [serviceImages, setServiceImages] = useState<string[]>([]);
  const [isUploadingServiceImage, setIsUploadingServiceImage] = useState(false);
  const [serviceTags, setServiceTags] = useState<string[]>([]);
  const [serviceTagInput, setServiceTagInput] = useState("");
  const [serviceViewTab, setServiceViewTab] = useState<"ALL" | "OFFERS" | "COMBOS">("ALL");

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState(0);
  const [productSku, setProductSku] = useState("");
  const [productStock, setProductStock] = useState(0);
  const [productTrackStock, setProductTrackStock] = useState(true);

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPassword, setCustomerPassword] = useState("");
  const [customerTags, setCustomerTags] = useState("");
  const [customerLoyaltyPoints, setCustomerLoyaltyPoints] = useState<number>(0);
  const [posCustomerSearch, setPosCustomerSearch] = useState("");
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);





  const [bookingToCancel, setBookingToCancel] = useState<BookingSlot | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingCustName, setBookingCustName] = useState("");
  const [bookingCustPhone, setBookingCustPhone] = useState("");
  const [bookingServiceName, setBookingServiceName] = useState("");
  const [bookingStylist, setBookingStylist] = useState("");
  const [bookingTime, setBookingTime] = useState("11:30 AM");
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split("T")[0]);
  const [editingBooking, setEditingBooking] = useState<BookingSlot | null>(null);
  const [bookingError, setBookingError] = useState("");

  // ─── Subscription Modal States ───
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<SubscriptionPackage | null>(null);
  const [subName, setSubName] = useState("");
  const [subPrice, setSubPrice] = useState(0);
  const [subDuration, setSubDuration] = useState("Monthly");
  const [subDesc, setSubDesc] = useState("");

  // ─── Coupon Modal States ───
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);
  const [couponValCode, setCouponValCode] = useState("");
  const [couponDiscountPercent, setCouponDiscountPercent] = useState(0);
  const [couponMaxDiscount, setCouponMaxDiscount] = useState(0);
  const [couponMinBill, setCouponMinBill] = useState(0);
  const [couponExpiry, setCouponExpiry] = useState("2026-12-31");

  // ─── POS state ───
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<"CASH" | "CARD" | "UPI" | "WALLET">("UPI");
  const [couponCode, setCouponCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [redeemedPoints, setRedeemedPoints] = useState(0);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [generatedInvoiceNum, setGeneratedInvoiceNum] = useState("");

  // ─── CRM state ───
  const [activeCrmIndex, setActiveCrmIndex] = useState(0);
  const [crmSearch, setCrmSearch] = useState("");
  const [showOnlySubscribers, setShowOnlySubscribers] = useState(false);
  const [newCrmNote, setNewCrmNote] = useState("");
  const [customerPasswordInput, setCustomerPasswordInput] = useState("");

  // ─── WhatsApp Integration States ───
  const [whatsAppConnected, setWhatsAppConnected] = useState(false);
  const [whatsAppDeviceNumber, setWhatsAppDeviceNumber] = useState("");
  const [connectingPhoneNumber, setConnectingPhoneNumber] = useState("");
  const [whatsAppLogs, setWhatsAppLogs] = useState<any[]>([]);
  const [whatsAppTemplates, setWhatsAppTemplates] = useState<any[]>([]);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [whatsAppSessionQr, setWhatsAppSessionQr] = useState<string | null>(null);

  // Reset portal password input on customer change
  useEffect(() => {
    setCustomerPasswordInput("");
  }, [activeCrmIndex]);

  // Poll WhatsApp session state when QR setup is open
  useEffect(() => {
    if (!showQRCode) {
      setWhatsAppSessionQr(null);
      return;
    }

    const intervalId = setInterval(() => {
      fetch("/api/whatsapp/session", {
        headers: { "x-tenant-slug": tenantSlug }
      })
        .then(res => res.json())
        .then(data => {
          if (data) {
            setWhatsAppConnected(data.isConnected);
            setWhatsAppDeviceNumber(data.phoneNumber || "");
            if (data.isConnected) {
              setShowQRCode(false);
              setWhatsAppSessionQr(null);
            } else if (data.qrCode) {
              const qrUrl = data.qrCode.startsWith("data:")
                ? data.qrCode
                : `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data.qrCode)}`;
              setWhatsAppSessionQr(qrUrl);
              setIsGeneratingQR(false);
            }
          }
        })
        .catch(console.error);
    }, 2000);

    return () => clearInterval(intervalId);
  }, [showQRCode, tenantSlug]);

  // Template Modal states
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateText, setTemplateText] = useState("");
  const [templateType, setTemplateType] = useState<string>("signup_otp");

  // Simulation controls
  const [simulatedName, setSimulatedName] = useState("");
  const [simulatedPhone, setSimulatedPhone] = useState("");
  const [simulatedCampaignType, setSimulatedCampaignType] = useState<"signup_otp" | "booking_confirmation" | "reminder_24h" | "reminder_1h" | "birthday_offer" | "inactive_winback">("signup_otp");
  const [simulationSuccess, setSimulationSuccess] = useState("");

  // Stealth configuration states
  const [stealthHumanTyping, setStealthHumanTyping] = useState(true);
  const [stealthRandomJitter, setStealthRandomJitter] = useState(true);
  const [stealthSpintaxSuffix, setStealthSpintaxSuffix] = useState(true);
  const [stealthNaturalHours, setStealthNaturalHours] = useState(false);

  // Connection type toggle (UNOFFICIAL = Baileys QR, OFFICIAL = Meta Cloud API)
  const [waConnectionType, setWaConnectionType] = useState<"UNOFFICIAL" | "OFFICIAL">("UNOFFICIAL");
  const [metaAccessToken, setMetaAccessToken] = useState("");
  const [metaPhoneNumberId, setMetaPhoneNumberId] = useState("");
  const [metaBusinessAccountId, setMetaBusinessAccountId] = useState("");
  const [metaVerifyToken, setMetaVerifyToken] = useState("");
  const [isSessionConfigSaving, setIsSessionConfigSaving] = useState(false);
  const [sessionConfigSaved, setSessionConfigSaved] = useState(false);

  // Birthday settings
  const [birthdayWishTemplate, setBirthdayWishTemplate] = useState("Happy Birthday {{name}}! 🎉 Here is a special treat for you: Use code {{coupon}} to get 20% off on your next visit!");
  const [birthdayCouponCode, setBirthdayCouponCode] = useState("BDAY20");
  const [isSavingBirthdaySettings, setIsSavingBirthdaySettings] = useState(false);

  // Auto-reply rules
  const [autoReplyRules, setAutoReplyRules] = useState<any[]>([]);
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [newRuleTrigger, setNewRuleTrigger] = useState<"KEYWORD" | "WELCOME" | "OFFICE_HOURS_OUTSIDE">("KEYWORD");
  const [newRuleKeywords, setNewRuleKeywords] = useState("");
  const [newRuleReply, setNewRuleReply] = useState("");
  const [isSavingRule, setIsSavingRule] = useState(false);

  // ─── Admin Auth Check on Mount ───
  useEffect(() => {
    if (typeof window !== "undefined") {
      fetch(`/api/tenants/verify-session?slug=${encodeURIComponent(tenantSlug)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.ok && data.user) {
            setIsAdminAuthenticated(true);
            const role = data.user.role || "OWNER";
            setUserRole(role);
            setUserOutletId(data.user.outletId || null);
            if (data.user.outletId) {
              setSelectedOutletId(data.user.outletId);
              localStorage.setItem(`active_outlet_id_${tenantSlug}`, data.user.outletId);
            }
            localStorage.setItem(`owner_admin_session_${tenantSlug}`, "authenticated");

            // Redirect if current activeTab is not allowed for role
            const tabParam = searchParams.get("tab") || "POS";
            if (!isTabAllowedForRole(role, tabParam)) {
              setActiveTab(getDefaultTabForRole(role));
            }
          } else {
            setIsAdminAuthenticated(false);
            localStorage.removeItem(`owner_admin_session_${tenantSlug}`);
          }
          setAdminAuthChecked(true);
        })
        .catch(() => {
          const session = localStorage.getItem(`owner_admin_session_${tenantSlug}`);
          if (session === "authenticated") {
            setIsAdminAuthenticated(true);
          }
          setAdminAuthChecked(true);
        });
    }
  }, [tenantSlug]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError("");
    setAdminLoginLoading(true);
    try {
      const res = await fetch("/api/tenants/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: tenantSlug,
          email: adminLoginEmail,
          password: adminLoginPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        localStorage.setItem(`owner_admin_session_${tenantSlug}`, "authenticated");
        setIsAdminAuthenticated(true);
        const role = data.user?.role || "OWNER";
        setUserRole(role);
        setUserOutletId(data.user?.outletId || null);
        if (data.user?.outletId) {
          setSelectedOutletId(data.user.outletId);
          localStorage.setItem(`active_outlet_id_${tenantSlug}`, data.user.outletId);
        }
        setAdminLoginError("");

        // Redirect if current activeTab is not allowed for role
        const tabParam = searchParams.get("tab") || "POS";
        if (!isTabAllowedForRole(role, tabParam)) {
          setActiveTab(getDefaultTabForRole(role));
        }
      } else {
        setAdminLoginError(data.error || "Invalid credentials. Please check your email and password.");
      }
    } catch (err) {
      setAdminLoginError("Something went wrong. Please try again.");
    } finally {
      setAdminLoginLoading(false);
    }
  };

  const handleAdminLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(`owner_admin_session_${tenantSlug}`);
      localStorage.removeItem(`tenant_admin_${tenantSlug}`);
      fetch("/api/tenants/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: tenantSlug }),
      })
        .then(() => {
          window.location.href = window.location.pathname;
        })
        .catch(() => {
          window.location.href = window.location.pathname;
        });
    }
    setIsAdminAuthenticated(false);
  };

  // Initialize data on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const typingVal = localStorage.getItem(`tenant_whatsapp_stealth_typing_${tenantSlug}`);
      if (typingVal !== null) setStealthHumanTyping(typingVal === "true");
      const jitterVal = localStorage.getItem(`tenant_whatsapp_stealth_jitter_${tenantSlug}`);
      if (jitterVal !== null) setStealthRandomJitter(jitterVal === "true");
      const spintaxVal = localStorage.getItem(`tenant_whatsapp_stealth_spintax_${tenantSlug}`);
      if (spintaxVal !== null) setStealthSpintaxSuffix(spintaxVal === "true");
      const naturalVal = localStorage.getItem(`tenant_whatsapp_stealth_natural_${tenantSlug}`);
      if (naturalVal !== null) setStealthNaturalHours(naturalVal === "true");

      getTenantBySlug(tenantSlug).then((match) => {
        if (match) {
          setBusinessName(match.name);
          setTenantPlan(match.planName || "Essential");
          if (match.activeTemplate) setActiveTemplate(match.activeTemplate);
          if (match.accentColor) setAccentColor(match.accentColor);
          if (match.customTextColor) setCustomTextColor(match.customTextColor);
          if (match.customHeadingColor) setCustomHeadingColor(match.customHeadingColor);
          if (match.customButtonColor) setCustomButtonColor(match.customButtonColor);
          if (match.accentColor) setAccentColor(match.accentColor);

          setLogoUrl(match.logoUrl || "");
          setTagline(match.tagline || "");
          setSubtitle(match.subtitle || "");
          setCampaignCouponCode(match.couponCode || "LUXFIRST");
          setCampaignDiscountPercent(match.couponDiscount !== undefined ? match.couponDiscount : 15);

          setBrandLogoUrl(match.logoUrl || "");
          setBrandTagline(match.tagline || "");
          setBrandSubtitle(match.subtitle || "");
          setBrandCouponCode(match.couponCode || "LUXFIRST");
          setBrandDiscountPercent(match.couponDiscount !== undefined ? match.couponDiscount : 15);

          let initialSecs = [];
          if (match.sectionsJson) {
            try {
              initialSecs = JSON.parse(match.sectionsJson);
            } catch (e) {
              console.error("Failed to parse sectionsJson", e);
            }
          }

          if (!initialSecs || initialSecs.length === 0) {
            initialSecs = [
              { id: "hero-1", category: "hero", type: "hero_v2", title: match.tagline || "Premium Grooming & Beauty Rituals", subtitle: match.subtitle || "Experience signature scissor cuts, French balayage highlights, and nourishing Moroccan hair spas.", emoji: "🧖‍♀️", banners: [] },
              { id: "about-1", category: "about", type: "about_v1", title: "Our Philosophy & Story", subtitle: "We believe grooming is an art form. Every cut, style, and spa session is curated by internationally certified experts using 100% organic wellness formulas." },
              { id: "features-1", category: "features", type: "features_grid", title: "Why Choose Elite?", subtitle: "Our standards set us apart in modern luxury service delivery." },
              { id: "services-1", category: "services", type: "services_grid", title: "Signature Menus", subtitle: "Explore our premium handpicked grooming and therapy menus." },
              { id: "offers-1", category: "offers", type: "offers_classic", title: "Exclusive Promotions", subtitle: "Special limited-time offers and combinations configured just for you." }
            ];
          }

          setBrandSections(initialSecs);
          setSections(initialSecs);
          setCmsOutlets(match.outlets || [
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
              address: "Level 4, Mall of Travancore, Trivandrum, Kerala — 695024",
              phone: "+91 95400 22108",
              timings: "09:30 AM - 09:30 PM (Mon-Sun)",
              slug: "trivandrum"
            }
          ]);
          setCmsStylists(match.stylists || [
            { id: "sty_1", name: "Elena Rostova", role: "Artistic Director", rating: 4.9, totalReviews: 340, specialty: "Balayage & Color", avatar: "ER" },
            { id: "sty_2", name: "Ryan Reynolds", role: "Master Barber", rating: 4.8, totalReviews: 290, specialty: "Beard Sculpting & Fades", avatar: "RR" },
            { id: "sty_3", name: "Sophia Loren", role: "Therapy Specialist", rating: 4.9, totalReviews: 180, specialty: "Moroccan Hair Spas", avatar: "SL" }
          ]);
          if (match.scheduleOverrides) setScheduleOverrides(match.scheduleOverrides);
          // Set first stylist as active in scheduler
          const firstSty = (match.stylists || [])[0];
          if (firstSty) setSchedActiveStylist(firstSty.id);

          // Auto-select and enforce outlet limits based on subscription plan
          const plan = match.planName || "Essential";
          const outlets = match.outlets || [
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
              address: "Level 4, Mall of Travancore, Trivandrum, Kerala — 695024",
              phone: "+91 95400 22108",
              timings: "09:30 AM - 09:30 PM (Mon-Sun)",
              slug: "trivandrum"
            }
          ];

          const allowedOutlets = getAllowedOutlets(plan, outlets);
          const stored = localStorage.getItem(`active_outlet_id_${tenantSlug}`);

          if (allowedOutlets.length === 1) {
            // Essential: strict 1 outlet, auto select it and bypass picker
            const targetId = allowedOutlets[0].id;
            setSelectedOutletId(targetId);
            localStorage.setItem(`active_outlet_id_${tenantSlug}`, targetId);
          } else {
            // Professional or Premium
            // If stored exists and is in allowed, keep it; otherwise default to first allowed
            if (stored && allowedOutlets.some(o => o.id === stored)) {
              setSelectedOutletId(stored);
            } else if (allowedOutlets.length > 0) {
              const targetId = allowedOutlets[0].id;
              setSelectedOutletId(targetId);
              localStorage.setItem(`active_outlet_id_${tenantSlug}`, targetId);
            }
          }
        }
      });
    }
  }, [tenantSlug]);

  useEffect(() => {
    if (typeof window !== "undefined" && selectedOutletId) {
      // Load Services — API is source of truth
      fetch(`/api/services?outletId=${selectedOutletId}`, {
        headers: { "x-tenant-slug": tenantSlug }
      })
        .then(res => res.json())
        .then(data => {
          if (data && !data.fallback && Array.isArray(data)) {
            setServices(data);
          } else {
            setServices([]);
          }
        })
        .catch(() => setServices([]));

      // Load Products — API is source of truth
      fetch(`/api/products?outletId=${selectedOutletId}`, {
        headers: { "x-tenant-slug": tenantSlug }
      })
        .then(res => res.json())
        .then(data => {
          if (data && !data.fallback && Array.isArray(data)) {
            setProducts(data);
          } else {
            setProducts([]);
          }
        })
        .catch(() => setProducts([]));

      // Load Bookings — API is source of truth
      fetch(`/api/bookings?outletId=${selectedOutletId}&limit=100`, {
        headers: { "x-tenant-slug": tenantSlug }
      })
        .then(r => r.json())
        .then(data => {
          // Backend returns { data: [...], meta: {...} } (paginated) or plain array
          const list: any[] = Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
              ? data.data
              : [];
          if (list.length > 0) {
            const mapped = list.map((b: any) => ({
              id: b.id,
              customerName: b.customer?.name || "Walk-in Customer",
              phone: b.customer?.phone || "",
              serviceName: b.items?.[0]?.service?.name || "Salon Service",
              stylistName: b.staff?.name || "Any Stylist",
              scheduledAt: b.scheduledAt,
              date: b.scheduledAt ? new Date(b.scheduledAt).toLocaleDateString([], { month: "short", day: "numeric" }) : "",
              time: b.scheduledAt ? new Date(b.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—",
              status: b.status || "CONFIRMED",
              totalPrice: b.totalPrice || 0,
            }));
            // Sort by scheduledAt descending
            mapped.sort((a: any, b: any) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
            setBookings(mapped);
          } else {
            setBookings([]);
          }
        })
        .catch(() => setBookings([]));

      // Load Coupons — API is source of truth
      fetch(`/api/coupons?outletId=${selectedOutletId}`, {
        headers: { "x-tenant-slug": tenantSlug }
      })
        .then(res => res.json())
        .then(data => {
          if (data && !data.fallback && Array.isArray(data)) {
            const mapped = data.map((c: any) => ({
              id: c.id,
              code: c.code,
              discountPercent: Number(c.value) || 0,
              maxDiscount: Number(c.maxDiscount) || 0,
              minBill: Number(c.minOrderValue) || 0,
              expiryDate: c.validUntil ? new Date(c.validUntil).toISOString().split('T')[0] : "",
              status: (c.isActive ? "ACTIVE" : "INACTIVE") as "ACTIVE" | "INACTIVE"
            }));
            setCoupons(mapped);
          } else {
            setCoupons([]);
          }
        })
        .catch(() => setCoupons([]));

      // Load Customers — API is source of truth
      fetch(`/api/customers?outletId=${selectedOutletId}`, {
        headers: { "x-tenant-slug": tenantSlug }
      })
        .then(res => res.json())
        .then(data => {
          if (data && !data.fallback && Array.isArray(data)) {
            setCustomers(data);
          } else {
            setCustomers([]);
          }
        })
        .catch(() => setCustomers([]));

      // Hydrate Inventory & CRM sub-systems
      fetchSuppliers();
      fetchPurchaseOrders();
      fetchSegments();

      // Load subscription packages from backend
      fetchSubscriptions();
    }
  }, [selectedOutletId, tenantSlug, auditRefreshCounter]);

  const getStylistOutletId = (s: any) => {
    if (s.outletId) return s.outletId;
    const cochinId = cmsOutlets[0]?.id || "out_cochin";
    const calicutId = cmsOutlets[1]?.id || cochinId;
    return s.id === "sty_3" ? calicutId : cochinId;
  };

  // POS operations
  const addToCart = (item: { id: string; name: string; price: number; type: string }) => {
    const existing = cart.find(i => i.id === item.id);
    if (existing) {
      setCart(cart.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setCart([...cart, { id: item.id, name: item.name, price: item.price, qty: 1, type: item.type as "service" | "product" }]);
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(i => i.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountPercent(0);
    setRedeemedPoints(0);
    setCouponCode("");
  };

  const subtotal = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
  const discountAmount = Math.round(subtotal * (discountPercent / 100)) + (redeemedPoints * 0.5);
  const netSubtotal = Math.max(0, subtotal - discountAmount);
  const gstInclusiveAmount = Math.round(netSubtotal * 0.18);

  const applyPosCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const entered = couponCode.trim().toUpperCase();
    const matched = coupons.find(c => c.code === entered && c.status === "ACTIVE");

    if (matched) {
      if (subtotal < matched.minBill) {
        alert(`Minimum bill amount required to apply this coupon is ₹${matched.minBill}`);
        return;
      }
      setDiscountPercent(matched.discountPercent);
    } else {
      const activeOutlet = cmsOutlets.find(o => o.id === selectedOutletId);
      const validCoupon = (activeOutlet?.couponCode || "LUXPOS").toUpperCase();
      const discountVal = activeOutlet?.couponDiscount !== undefined ? activeOutlet.couponDiscount : 20;

      if (entered === validCoupon) {
        setDiscountPercent(discountVal);
      } else if (entered === "LUXPOS") {
        setDiscountPercent(20);
      } else {
        alert(`Invalid Code. Coupon not found in registry!`);
      }
    }
  };

  const handleCheckoutSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (cart.length === 0) return;
    setGeneratedInvoiceNum(`INV-2026-${Math.floor(1000 + Math.random() * 9000)}`);
    setIsInvoiceOpen(true);
    setIsMobileCartOpen(false);
  };

  const completeCheckout = async () => {
    // Deduct stock or update loyalty profile if customer active
    const activeCustomer = customers[activeCrmIndex];
    if (activeCustomer) {
      // Map items for the backend invoice
      const invoiceItems = cart.map(item => ({
        serviceId: item.type === 'service' ? item.id : undefined,
        productId: item.type === 'product' ? item.id : undefined,
        name: item.name,
        quantity: item.qty,
        unitPrice: item.price,
        discount: 0,
        gstRate: 18,
        gstAmount: Math.round(item.price * item.qty * 0.18),
        total: item.price * item.qty,
      }));

      // Call NestJS backend POS invoices endpoint
      try {
        await fetch('/api/pos/invoices', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-slug': tenantSlug,
          },
          body: JSON.stringify({
            customerId: activeCustomer.id,
            outletId: selectedOutletId,
            status: 'PAID',
            subtotal,
            discountAmount,
            gstAmount: gstInclusiveAmount,
            loyaltyDiscount: redeemedPoints * 5,
            totalAmount: netSubtotal,
            paidAmount: netSubtotal,
            paymentMethod: selectedPayment,
            items: invoiceItems,
          }),
        });
      } catch (err) {
        console.error('Failed to post invoice to backend:', err);
      }

      // Automatically block the schedule by creating completed bookings for service items with stylists assigned
      const serviceItemsWithStylists = cart.filter(item => item.type === 'service' && item.staffId);
      for (const item of serviceItemsWithStylists) {
        try {
          const nowISO = new Date().toISOString();
          await fetch('/api/bookings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-tenant-slug': tenantSlug,
            },
            body: JSON.stringify({
              customerId: activeCustomer.id,
              outletId: selectedOutletId,
              scheduledAt: nowISO,
              status: 'COMPLETED',
              staffId: item.staffId,
              serviceIds: [item.id],
            }),
          });
        } catch (err) {
          console.error('Failed to auto-create completed booking for POS service item:', err);
        }
      }

      // Update UI optimistically after POS checkout
      setCustomers(prev => prev.map(c =>
        c.id === activeCustomer.id
          ? { ...c, totalVisits: c.totalVisits + 1, totalSpend: c.totalSpend + netSubtotal }
          : c
      ));

      // Trigger WhatsApp booking/checkout confirmation (fallback)
      if (whatsAppConnected && activeCustomer.phone !== "0000000000") {
        const assignedStylists = cart
          .filter(i => i.type === "service" && i.staffName)
          .map(i => i.staffName);
        const stylistDisplay = assignedStylists.length > 0
          ? Array.from(new Set(assignedStylists)).join(', ')
          : "POS Counter Specialist";

        sendWhatsAppMessage(
          "booking_confirmation",
          activeCustomer.name,
          activeCustomer.phone,
          {
            service: cart.filter(i => i.type === "service").map(i => i.name).join(", ") || "Retail Purchase",
            stylist: stylistDisplay,
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            outlet: cmsOutlets.find(o => o.id === selectedOutletId)?.name || "Main Outlet"
          }
        );
      }
    }

    setIsInvoiceOpen(false);
    clearCart();
    setAuditRefreshCounter(prev => prev + 1);
  };

  const handleUpdateInvoiceStatus = async (invoiceId: string, newStatus: string) => {
    const confirmation = window.confirm(`Are you sure you want to mark this invoice as ${newStatus}?`);
    if (!confirmation) return;

    setProcessingInvoiceId(invoiceId);
    try {
      const res = await fetch(`/api/pos/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-slug": tenantSlug,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const updated = await res.json().catch(() => null);
        if (updated) {
          setAuditInvoices(prev => prev.map(inv => inv.id === invoiceId ? updated : inv));
        } else {
          setAuditInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...inv, status: newStatus } : inv));
        }
        setAuditRefreshCounter(prev => prev + 1);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`Error updating invoice: ${err.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Failed to update invoice status:", err);
      alert("Failed to update invoice status. Backend connection issue.");
    } finally {
      setProcessingInvoiceId(null);
    }
  };

  // ─── WhatsApp Integration Operations ───
  useEffect(() => {
    if (typeof window !== "undefined") {
      const connectedKey = `tenant_whatsapp_connected_${tenantSlug}`;
      const deviceNumKey = `tenant_whatsapp_device_${tenantSlug}`;
      const logsKey = `tenant_whatsapp_logs_${tenantSlug}`;
      const templatesKey = `tenant_whatsapp_templates_${tenantSlug}`;

      fetch("/api/whatsapp/session", {
        headers: { "x-tenant-slug": tenantSlug }
      })
        .then(res => res.json())
        .then(data => {
          if (data && !data.fallback) {
            setWhatsAppConnected(data.isConnected);
            setWhatsAppDeviceNumber(data.phoneNumber || "");
          } else {
            setWhatsAppConnected(localStorage.getItem(connectedKey) === "true");
            setWhatsAppDeviceNumber(localStorage.getItem(deviceNumKey) || "");
          }
        })
        .catch(() => {
          setWhatsAppConnected(localStorage.getItem(connectedKey) === "true");
          setWhatsAppDeviceNumber(localStorage.getItem(deviceNumKey) || "");
        });

      const storedLogs = localStorage.getItem(logsKey);
      fetch("/api/whatsapp/messages", {
        headers: { "x-tenant-slug": tenantSlug }
      })
        .then(res => res.json())
        .then(data => {
          if (data && !data.fallback && Array.isArray(data)) {
            const mappedLogs = data.map((msg: any) => ({
              id: msg.id,
              recipientName: msg.customer?.name || "Customer",
              phone: msg.to,
              type: msg.direction === "OUTBOUND" ? "Outbound" : "Inbound",
              templateName: "Standard",
              messageText: msg.body,
              timestamp: new Date(msg.sentAt).toLocaleString(),
              status: msg.isRead ? "Read" : "Sent"
            }));
            setWhatsAppLogs(mappedLogs);
            localStorage.setItem(logsKey, JSON.stringify(mappedLogs));
          } else {
            if (storedLogs) {
              setWhatsAppLogs(JSON.parse(storedLogs));
            } else {
              const defaultLogs = [
                {
                  id: "log_1",
                  recipientName: "Farhan",
                  phone: "+91 99000 88000",
                  type: "signup_otp",
                  templateName: "OTP Standard",
                  messageText: "Hello Farhan! Your verification code for LuxCuts is 849302. This code is valid for 5 minutes. Do not share it with anyone.",
                  timestamp: "2026-05-26 10:14 AM",
                  status: "Read"
                },
                {
                  id: "log_2",
                  recipientName: "Priya Sharma",
                  phone: "+91 98450 11204",
                  type: "booking_confirmation",
                  templateName: "Confirmation Casual",
                  messageText: "Yay! Your booking is locked in, Priya Sharma. 📅 Moroccan Hair Spa with Sophia Loren | ⏰ 02:30 PM, 2026-05-27 at LuxCuts (LuxCuts Calicut Central). See you soon!",
                  timestamp: "2026-05-26 11:32 AM",
                  status: "Delivered"
                }
              ];
              localStorage.setItem(logsKey, JSON.stringify(defaultLogs));
              setWhatsAppLogs(defaultLogs);
            }
          }
        })
        .catch(() => {
          if (storedLogs) {
            setWhatsAppLogs(JSON.parse(storedLogs));
          }
        });

      const storedTemplates = localStorage.getItem(templatesKey);
      if (storedTemplates) {
        setWhatsAppTemplates(JSON.parse(storedTemplates));
      } else {
        const defaultTemplates = [
          // signup_otp
          { id: "tmpl_1", type: "signup_otp", name: "OTP Standard", text: "hey {{name}}! here's your verification code for {{brand}}: {{otp}} (valid for 5 mins)" },
          { id: "tmpl_2", type: "signup_otp", name: "OTP Welcome", text: "hey there {{name}}! welcome to {{brand}} :) your verification code is {{otp}}" },
          { id: "tmpl_3", type: "signup_otp", name: "OTP Casual Yo", text: "yo {{name}}, use {{otp}} to verify your phone number at {{brand}}." },
          { id: "tmpl_4", type: "signup_otp", name: "OTP Quick", text: "hey, code for {{brand}} is {{otp}} - expires in 5 mins!" },

          // booking_confirmation
          { id: "tmpl_5", type: "booking_confirmation", name: "Confirmation Warm", text: "hey {{name}}, just wanted to let you know we've got you down for {{service}} with {{stylist}} on {{date}} at {{time}} at {{brand}} ({{outlet}}). see you then!" },
          { id: "tmpl_6", type: "booking_confirmation", name: "Confirmation Casual", text: "hey {{name}}! your booking for {{service}} with {{stylist}} is all set. see you on {{date}} at {{time}} at {{brand}}!" },
          { id: "tmpl_7", type: "booking_confirmation", name: "Confirmation Friendly", text: "just confirmed your appointment for {{service}} with {{stylist}} on {{date}} at {{time}} at {{brand}}. let us know if anything changes!" },
          { id: "tmpl_8", type: "booking_confirmation", name: "Confirmation Direct", text: "got your booking locked in for {{service}} with {{stylist}} ({{date}} @ {{time}}). see you soon at {{brand}} :)" },

          // reminder_24h
          { id: "tmpl_9", type: "reminder_24h", name: "24h Reminder Standard", text: "hey {{name}}! quick heads-up about your {{service}} tomorrow ({{date}}) at {{time}} with {{stylist}} at {{brand}}. let us know if you need to change anything!" },
          { id: "tmpl_10", type: "reminder_24h", name: "24h Reminder Friendly", text: "hey {{name}}, just reminding you about your appointment tomorrow at {{time}} for {{service}} at {{brand}}. looking forward to seeing you!" },
          { id: "tmpl_11", type: "reminder_24h", name: "24h Reminder Clean", text: "friendly reminder that we'll see you tomorrow ({{date}}) at {{time}} for your {{service}} at {{brand}}!" },
          { id: "tmpl_12", type: "reminder_24h", name: "24h Reminder Direct", text: "hey {{name}}! got you scheduled for {{service}} tomorrow at {{time}} with {{stylist}} at {{brand}}. see you then!" },

          // reminder_1h
          { id: "tmpl_13", type: "reminder_1h", name: "1h Reminder Standard", text: "hey {{name}}! see you in about an hour (at {{time}}) for your {{service}} at {{brand}} :)" },
          { id: "tmpl_14", type: "reminder_1h", name: "1h Reminder Friendly", text: "hey {{name}}, we're all set for you! see you at {{time}} for your {{service}} at {{brand}}." },
          { id: "tmpl_15", type: "reminder_1h", name: "1h Reminder Quick", text: "hey {{name}} - just a quick reminder that your {{service}} starts in an hour (at {{time}}). see you soon!" },
          { id: "tmpl_16", type: "reminder_1h", name: "1h Reminder Ready", text: "we're ready! see you in an hour ({{time}}) for your session at {{brand}}." },

          // birthday_offer
          { id: "tmpl_17", type: "birthday_offer", name: "Birthday Coupon", text: "happy birthday {{name}}! 🎉 hope you're having a great day. here's a little gift from us: 20% off your next visit with code {{coupon}}. hope to see you soon!" },
          { id: "tmpl_18", type: "birthday_offer", name: "Birthday Treat", text: "happy birthday {{name}}! 🎂 hope you have an amazing day. here's a little treat: ₹250 off any service at {{brand}} using code {{coupon}}. treat yourself!" },
          { id: "tmpl_19", type: "birthday_offer", name: "Birthday Gift Spa", text: "hey {{name}}, happy birthday! 🎁 wishing you the best. enjoy a free hair spa on us for your next booking with code {{coupon}}!" },
          { id: "tmpl_20", type: "birthday_offer", name: "Birthday Coupon Month", text: "happy birthday {{name}}! 🎂 to celebrate, take 15% off any salon service at {{brand}} with code {{coupon}}. valid all month!" },

          // inactive_winback
          { id: "tmpl_21", type: "inactive_winback", name: "Winback Discount", text: "hey {{name}}, haven't seen you in a while! hope you're doing well. we'd love to have you back, so here's 15% off your next session with code {{coupon}}. you can book here: {{url}}" },
          { id: "tmpl_22", type: "inactive_winback", name: "Winback Free Spa", text: "hey {{name}}, we miss you! we'd love to catch up soon. next time you book, use code {{coupon}} for a free hair spa on us :)" },
          { id: "tmpl_23", type: "inactive_winback", name: "Winback Catchup", text: "hey {{name}}, it's been a bit since we last styled your hair! hope you're good. take ₹300 off your next service at {{brand}} with code {{coupon}}. book a slot: {{url}}" },
          { id: "tmpl_24", type: "inactive_winback", name: "Winback Miss You", text: "we miss you {{name}}! 🥺 here's a special 20% off your next salon visit with code {{coupon}}. book your appointment here: {{url}}" }
        ];
        localStorage.setItem(templatesKey, JSON.stringify(defaultTemplates));
        setWhatsAppTemplates(defaultTemplates);
      }
    }
  }, [tenantSlug]);

  // Fetch WhatsApp session config + auto-reply rules on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    fetch("/api/whatsapp/session", {
      headers: { "x-tenant-slug": tenantSlug }
    })
      .then(res => res.json())
      .then(data => {
        if (data && !data.fallback && !data.error) {
          if (data.connectionType) setWaConnectionType(data.connectionType);
          if (data.metaAccessToken) setMetaAccessToken(data.metaAccessToken);
          if (data.metaPhoneNumberId) setMetaPhoneNumberId(data.metaPhoneNumberId);
          if (data.metaBusinessAccountId) setMetaBusinessAccountId(data.metaBusinessAccountId);
          if (data.metaVerifyToken) setMetaVerifyToken(data.metaVerifyToken);
        }
      })
      .catch(() => { });

    fetch("/api/whatsapp/rules", {
      headers: { "x-tenant-slug": tenantSlug }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAutoReplyRules(data);
      })
      .catch(() => { });

    fetch("/api/whatsapp/birthday-settings", {
      headers: { "x-tenant-slug": tenantSlug }
    })
      .then(res => res.json())
      .then(data => {
        if (data) {
          if (data.birthdayWishTemplate) setBirthdayWishTemplate(data.birthdayWishTemplate);
          if (data.birthdayCouponCode) setBirthdayCouponCode(data.birthdayCouponCode);
        }
      })
      .catch(() => { });
  }, [tenantSlug]);



  const sendWhatsAppMessage = (
    type: "signup_otp" | "booking_confirmation" | "reminder_24h" | "reminder_1h" | "birthday_offer" | "inactive_winback",
    recipientName: string,
    phone: string,
    variables: { [key: string]: string }
  ) => {
    const templatesKey = `tenant_whatsapp_templates_${tenantSlug}`;
    const localTemplates = typeof window !== "undefined" ? (localStorage.getItem(templatesKey) ? JSON.parse(localStorage.getItem(templatesKey)!) : whatsAppTemplates) : whatsAppTemplates;
    const typeTemplates = localTemplates.filter((t: any) => t.type === type);
    if (typeTemplates.length === 0) return null;

    const randomTemplate = typeTemplates[Math.floor(Math.random() * typeTemplates.length)];

    const allVars = {
      name: recipientName,
      brand: businessName,
      url: `${typeof window !== "undefined" ? window.location.origin : ""}`,
      ...variables
    };

    let messageText = randomTemplate.text;
    Object.entries(allVars).forEach(([key, val]) => {
      messageText = messageText.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), val);
    });

    // Apply Stealth spintax variation
    let suffixText = "";
    if (stealthSpintaxSuffix) {
      const suffixes = [
        "",
        " ✨",
        " 🌟",
        "\nHave a wonderful day!",
        "\nBest regards,",
        "\nWarmly,",
        "\nSincerely,"
      ];
      suffixText = suffixes[Math.floor(Math.random() * suffixes.length)];
      // Append random number of zero-width spaces for cryptographic message randomization
      const invisibleJitter = "\u200B".repeat(Math.floor(Math.random() * 5));
      suffixText = suffixText + invisibleJitter;
    }
    const finalMessageText = messageText + suffixText;

    const currentHour = new Date().getHours();
    const isNightTime = currentHour < 9 || currentHour >= 21;
    const holdForDaybreak = stealthNaturalHours && isNightTime;

    const logId = `log_${Date.now()}`;
    const newLog = {
      id: logId,
      recipientName,
      phone,
      type,
      templateName: randomTemplate.name,
      messageText: finalMessageText,
      timestamp: new Date().toLocaleString(),
      status: holdForDaybreak ? "Queued (Daybreak Hold)" : (stealthHumanTyping ? "Typing..." : "Sent"),
      stealthActive: stealthHumanTyping || stealthRandomJitter || stealthSpintaxSuffix || stealthNaturalHours
    };

    setWhatsAppLogs(prev => {
      const updated = [newLog, ...prev];
      localStorage.setItem(`tenant_whatsapp_logs_${tenantSlug}`, JSON.stringify(updated));
      return updated;
    });

    // Sync to NestJS backend database
    fetch("/api/whatsapp/campaign", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-slug": tenantSlug,
      },
      body: JSON.stringify({
        type,
        recipientName,
        phone,
        variables: {
          ...allVars,
          messageText: finalMessageText
        }
      }),
    })
      .catch(err => console.error("Failed to sync campaign log to backend database:", err));

    if (holdForDaybreak) {
      return finalMessageText;
    }

    // Determine stealth typing and jitter delay
    let baseDelay = 100;
    if (stealthHumanTyping) {
      baseDelay += Math.min(3000, 200 + finalMessageText.length * 8); // 8ms per char, max 3s
    }
    if (stealthRandomJitter) {
      baseDelay += Math.floor(Math.random() * 1500) + 300; // 300-1800ms jitter
    }

    // Transition from Typing to Sent
    setTimeout(() => {
      setWhatsAppLogs(prev => {
        const logs = prev.map(l => l.id === logId ? { ...l, status: "Sent" } : l);
        localStorage.setItem(`tenant_whatsapp_logs_${tenantSlug}`, JSON.stringify(logs));
        return logs;
      });
    }, baseDelay);

    // Transition to Delivered
    setTimeout(() => {
      setWhatsAppLogs(prev => {
        const logs = prev.map(l => l.id === logId && l.status === "Sent" ? { ...l, status: "Delivered" } : l);
        localStorage.setItem(`tenant_whatsapp_logs_${tenantSlug}`, JSON.stringify(logs));
        return logs;
      });
    }, baseDelay + 1200);

    // Transition to Read
    setTimeout(() => {
      setWhatsAppLogs(prev => {
        const logs = prev.map(l => l.id === logId && l.status === "Delivered" ? { ...l, status: "Read" } : l);
        localStorage.setItem(`tenant_whatsapp_logs_${tenantSlug}`, JSON.stringify(logs));
        return logs;
      });
    }, baseDelay + 2500);

    return finalMessageText;
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim() || !templateText.trim()) return;

    let updatedTemplates;
    if (editingTemplate) {
      updatedTemplates = whatsAppTemplates.map(t =>
        t.id === editingTemplate.id ? { ...t, name: templateName, text: templateText, type: templateType } : t
      );
    } else {
      const newTmpl = {
        id: `tmpl_${Date.now()}`,
        name: templateName,
        text: templateText,
        type: templateType
      };
      updatedTemplates = [...whatsAppTemplates, newTmpl];
    }

    setWhatsAppTemplates(updatedTemplates);
    localStorage.setItem(`tenant_whatsapp_templates_${tenantSlug}`, JSON.stringify(updatedTemplates));
    setIsTemplateModalOpen(false);
    setEditingTemplate(null);
    setTemplateName("");
    setTemplateText("");
  };

  const handleDeleteTemplate = (id: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
      const updatedTemplates = whatsAppTemplates.filter(t => t.id !== id);
      setWhatsAppTemplates(updatedTemplates);
      localStorage.setItem(`tenant_whatsapp_templates_${tenantSlug}`, JSON.stringify(updatedTemplates));
    }
  };

  const handleResetTemplates = () => {
    if (confirm("Are you sure you want to reset all templates to default human-like casual templates? Any custom templates will be overwritten.")) {
      const defaultTemplates = [
        // signup_otp
        { id: "tmpl_1", type: "signup_otp", name: "OTP Standard", text: "hey {{name}}! here's your verification code for {{brand}}: {{otp}} (valid for 5 mins)" },
        { id: "tmpl_2", type: "signup_otp", name: "OTP Welcome", text: "hey there {{name}}! welcome to {{brand}} :) your verification code is {{otp}}" },
        { id: "tmpl_3", type: "signup_otp", name: "OTP Casual Yo", text: "yo {{name}}, use {{otp}} to verify your phone number at {{brand}}." },
        { id: "tmpl_4", type: "signup_otp", name: "OTP Quick", text: "hey, code for {{brand}} is {{otp}} - expires in 5 mins!" },

        // booking_confirmation
        { id: "tmpl_5", type: "booking_confirmation", name: "Confirmation Warm", text: "hey {{name}}, just wanted to let you know we've got you down for {{service}} with {{stylist}} on {{date}} at {{time}} at {{brand}} ({{outlet}}). see you then!" },
        { id: "tmpl_6", type: "booking_confirmation", name: "Confirmation Casual", text: "hey {{name}}! your booking for {{service}} with {{stylist}} is all set. see you on {{date}} at {{time}} at {{brand}}!" },
        { id: "tmpl_7", type: "booking_confirmation", name: "Confirmation Friendly", text: "just confirmed your appointment for {{service}} with {{stylist}} on {{date}} at {{time}} at {{brand}}. let us know if anything changes!" },
        { id: "tmpl_8", type: "booking_confirmation", name: "Confirmation Direct", text: "got your booking locked in for {{service}} with {{stylist}} ({{date}} @ {{time}}). see you soon at {{brand}} :)" },

        // reminder_24h
        { id: "tmpl_9", type: "reminder_24h", name: "24h Reminder Standard", text: "hey {{name}}! quick heads-up about your {{service}} tomorrow ({{date}}) at {{time}} with {{stylist}} at {{brand}}. let us know if you need to change anything!" },
        { id: "tmpl_10", type: "reminder_24h", name: "24h Reminder Friendly", text: "hey {{name}}, just reminding you about your appointment tomorrow at {{time}} for {{service}} at {{brand}}. looking forward to seeing you!" },
        { id: "tmpl_11", type: "reminder_24h", name: "24h Reminder Clean", text: "friendly reminder that we'll see you tomorrow ({{date}}) at {{time}} for your {{service}} at {{brand}}!" },
        { id: "tmpl_12", type: "reminder_24h", name: "24h Reminder Direct", text: "hey {{name}}! got you scheduled for {{service}} tomorrow at {{time}} with {{stylist}} at {{brand}}. see you then!" },

        // reminder_1h
        { id: "tmpl_13", type: "reminder_1h", name: "1h Reminder Standard", text: "hey {{name}}! see you in about an hour (at {{time}}) for your {{service}} at {{brand}} :)" },
        { id: "tmpl_14", type: "reminder_1h", name: "1h Reminder Friendly", text: "hey {{name}}, we're all set for you! see you at {{time}} for your {{service}} at {{brand}}." },
        { id: "tmpl_15", type: "reminder_1h", name: "1h Reminder Quick", text: "hey {{name}} - just a quick reminder that your {{service}} starts in an hour (at {{time}}). see you soon!" },
        { id: "tmpl_16", type: "reminder_1h", name: "1h Reminder Ready", text: "we're ready! see you in an hour ({{time}}) for your session at {{brand}}." },

        // birthday_offer
        { id: "tmpl_17", type: "birthday_offer", name: "Birthday Coupon", text: "happy birthday {{name}}! 🎉 hope you're having a great day. here's a little gift from us: 20% off your next visit with code {{coupon}}. hope to see you soon!" },
        { id: "tmpl_18", type: "birthday_offer", name: "Birthday Treat", text: "happy birthday {{name}}! 🎂 hope you have an amazing day. here's a little treat: ₹250 off any service at {{brand}} using code {{coupon}}. treat yourself!" },
        { id: "tmpl_19", type: "birthday_offer", name: "Birthday Gift Spa", text: "hey {{name}}, happy birthday! 🎁 wishing you the best. enjoy a free hair spa on us for your next booking with code {{coupon}}!" },
        { id: "tmpl_20", type: "birthday_offer", name: "Birthday Coupon Month", text: "happy birthday {{name}}! 🎂 to celebrate, take 15% off any salon service at {{brand}} with code {{coupon}}. valid all month!" },

        // inactive_winback
        { id: "tmpl_21", type: "inactive_winback", name: "Winback Discount", text: "hey {{name}}, haven't seen you in a while! hope you're doing well. we'd love to have you back, so here's 15% off your next session with code {{coupon}}. you can book here: {{url}}" },
        { id: "tmpl_22", type: "inactive_winback", name: "Winback Free Spa", text: "hey {{name}}, we miss you! we'd love to catch up soon. next time you book, use code {{coupon}} for a free hair spa on us :)" },
        { id: "tmpl_23", type: "inactive_winback", name: "Winback Catchup", text: "hey {{name}}, it's been a bit since we last styled your hair! hope you're good. take ₹300 off your next service at {{brand}} with code {{coupon}}. book a slot: {{url}}" },
        { id: "tmpl_24", type: "inactive_winback", name: "Winback Miss You", text: "we miss you {{name}}! 🥺 here's a special 20% off your next salon visit with code {{coupon}}. book your appointment here: {{url}}" }
      ];
      setWhatsAppTemplates(defaultTemplates);
      localStorage.setItem(`tenant_whatsapp_templates_${tenantSlug}`, JSON.stringify(defaultTemplates));
    }
  };

  const openAddTemplateModal = () => {
    setEditingTemplate(null);
    setTemplateName("");
    setTemplateText("");
    setTemplateType("signup_otp");
    setIsTemplateModalOpen(true);
  };

  const openAddOtpTemplateModal = () => {
    setEditingTemplate(null);
    setTemplateName("Standard OTP Verification Code");
    setTemplateText("hey! your verification code for {{brand}} is {{otp}} (valid for 5 mins)");
    setTemplateType("signup_otp");
    setIsTemplateModalOpen(true);
  };

  const openEditTemplateModal = (tmpl: any) => {
    setEditingTemplate(tmpl);
    setTemplateName(tmpl.name);
    setTemplateText(tmpl.text);
    setTemplateType(tmpl.type);
    setIsTemplateModalOpen(true);
  };

  const formatTemplatePreview = (text: string) => {
    const parts = text.split(/(\{\{[^}]+\}\})/g);
    return parts.map((part, i) => {
      if (part.startsWith("{{") && part.endsWith("}}")) {
        return (
          <span key={i} className="px-1.5 py-0.5 bg-rose-500/10 border border-rose-500/25 rounded text-rose-400 font-mono text-[10px] inline-block font-bold">
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const startQrGeneration = async () => {
    setIsGeneratingQR(true);
    setShowQRCode(false);

    try {
      await fetch("/api/whatsapp/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-slug": tenantSlug,
        },
        body: JSON.stringify({ action: "qr" }),
      });
    } catch (err) {
      console.error("Failed to generate backend QR code:", err);
    }

    setTimeout(() => {
      setIsGeneratingQR(false);
      setShowQRCode(true);
    }, 1500);
  };

  const simulateDeviceScan = async () => {
    setIsConnecting(true);
    const cleaned = connectingPhoneNumber.replace(/\D/g, '');
    const randomNum = cleaned ? `+91 ${cleaned.slice(-10)}` : `+91 ${Math.floor(7000000000 + Math.random() * 2900000000)}`;

    try {
      await fetch("/api/whatsapp/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-slug": tenantSlug,
        },
        body: JSON.stringify({ action: "connect", phoneNumber: randomNum }),
      });
    } catch (err) {
      console.error("Failed to connect backend session:", err);
    }

    setTimeout(() => {
      setIsConnecting(false);
      setWhatsAppConnected(true);
      setWhatsAppDeviceNumber(randomNum);
      localStorage.setItem(`tenant_whatsapp_connected_${tenantSlug}`, "true");
      localStorage.setItem(`tenant_whatsapp_device_${tenantSlug}`, randomNum);
      setShowQRCode(false);
    }, 2000);
  };

  const disconnectWhatsApp = async () => {
    if (confirm("Disconnect your WhatsApp device? Automated messages will be paused.")) {
      try {
        await fetch("/api/whatsapp/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-tenant-slug": tenantSlug,
          },
          body: JSON.stringify({ action: "disconnect" }),
        });
      } catch (err) {
        console.error("Failed to disconnect backend session:", err);
      }

      setWhatsAppConnected(false);
      setWhatsAppDeviceNumber("");
      localStorage.removeItem(`tenant_whatsapp_connected_${tenantSlug}`);
      localStorage.removeItem(`tenant_whatsapp_device_${tenantSlug}`);
    }
  };

  const saveSessionConfig = async () => {
    setIsSessionConfigSaving(true);
    setSessionConfigSaved(false);
    try {
      const res = await fetch("/api/whatsapp/session/config", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tenant-slug": tenantSlug },
        body: JSON.stringify({
          connectionType: waConnectionType,
          metaAccessToken: metaAccessToken || undefined,
          metaPhoneNumberId: metaPhoneNumberId || undefined,
          metaBusinessAccountId: metaBusinessAccountId || undefined,
          metaVerifyToken: metaVerifyToken || undefined,
        }),
      });
      if (res.ok) {
        setSessionConfigSaved(true);
        setTimeout(() => setSessionConfigSaved(false), 3000);
        if (waConnectionType === "UNOFFICIAL") {
          startQrGeneration();
        }
      }
    } catch (err) {
      console.error("Failed to save session config:", err);
    } finally {
      setIsSessionConfigSaving(false);
    }
  };

  const saveBirthdaySettings = async () => {
    setIsSavingBirthdaySettings(true);
    try {
      const res = await fetch("/api/whatsapp/birthday-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tenant-slug": tenantSlug },
        body: JSON.stringify({
          birthdayWishTemplate,
          birthdayCouponCode,
        }),
      });
      if (res.ok) {
        alert("Birthday settings saved successfully!");
      } else {
        alert("Failed to save birthday settings.");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving birthday settings.");
    } finally {
      setIsSavingBirthdaySettings(false);
    }
  };

  const saveAutoReplyRule = async () => {
    if (!newRuleReply.trim()) {
      alert("Reply text cannot be empty.");
      return;
    }
    if (newRuleTrigger === "KEYWORD" && !newRuleKeywords.trim()) {
      alert("Please enter at least one keyword.");
      return;
    }
    setIsSavingRule(true);
    try {
      const res = await fetch("/api/whatsapp/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tenant-slug": tenantSlug },
        body: JSON.stringify({
          triggerType: newRuleTrigger,
          keywords: newRuleTrigger === "KEYWORD" ? newRuleKeywords.trim() : undefined,
          replyText: newRuleReply.trim(),
          isActive: true,
        }),
      });
      if (res.ok) {
        const saved = await res.json();
        setAutoReplyRules(prev => [saved, ...prev]);
        setNewRuleKeywords("");
        setNewRuleReply("");
        setIsAddingRule(false);
      }
    } catch (err) {
      console.error("Failed to save rule:", err);
    } finally {
      setIsSavingRule(false);
    }
  };

  const deleteAutoReplyRule = async (id: string) => {
    if (!confirm("Delete this auto-reply rule?")) return;
    try {
      const res = await fetch(`/api/whatsapp/rules/${id}`, {
        method: "DELETE",
        headers: { "x-tenant-slug": tenantSlug },
      });
      if (res.ok) {
        setAutoReplyRules(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete rule:", err);
    }
  };

  const handleSimulateCampaign = (e: React.FormEvent) => {

    e.preventDefault();
    if (!whatsAppConnected) {
      alert("Please connect your WhatsApp device first!");
      return;
    }
    const nameToUse = simulatedName.trim() || "Farhan";
    const phoneToUse = simulatedPhone.trim() || "+91 99000 88000";

    // Prepare variables depending on campaign type
    let variables: { [key: string]: string } = {};
    if (simulatedCampaignType === "signup_otp") {
      variables = { otp: Math.floor(100000 + Math.random() * 900000).toString() };
    } else if (simulatedCampaignType === "booking_confirmation") {
      variables = {
        service: "French Balayage Spa",
        stylist: "Elena Rostova",
        date: new Date().toLocaleDateString(),
        time: "03:45 PM",
        outlet: "LuxCuts Calicut Central"
      };
    } else if (simulatedCampaignType === "reminder_24h" || simulatedCampaignType === "reminder_1h") {
      variables = {
        service: "Organic Beard Sculpting",
        stylist: "Ryan Reynolds",
        date: new Date().toLocaleDateString(),
        time: "11:00 AM",
        outlet: "LuxCuts Cochin Waterfront"
      };
    } else if (simulatedCampaignType === "birthday_offer") {
      variables = { coupon: "BDAY20" };
    } else if (simulatedCampaignType === "inactive_winback") {
      variables = { coupon: "MISSYOU15" };
    }

    const textSent = sendWhatsAppMessage(
      simulatedCampaignType,
      nameToUse,
      phoneToUse,
      variables
    );

    if (textSent !== null) {
      setSimulationSuccess(`Successfully triggered dynamic "${simulatedCampaignType}" campaign to ${nameToUse} (${phoneToUse})! Check logs on the right.`);
      setTimeout(() => setSimulationSuccess(""), 5000);
      setSimulatedName("");
      setSimulatedPhone("");
    }
  };

  // CRM Visit Notes
  const handleAddCrmNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCrmNote.trim() || !customers[activeCrmIndex]) return;

    const updated = [...customers];
    updated[activeCrmIndex].notes.unshift({
      addedBy: "Elena (Manager)",
      date: new Date().toISOString().split("T")[0],
      content: newCrmNote
    });

    setCustomers([...updated]);
    setNewCrmNote("");
  };

  const handleSendWhatsAppDetails = async (customerId: string, newPassword?: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    const tenantName = tenantSlug
      ? tenantSlug
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/-/g, " ")
        .replace(/\b\w/g, c => c.toUpperCase())
      : "Salon";

    const loginUrl = `${window.location.origin}/tenant/${tenantSlug}/login`;

    // Find active subscription name for this customer
    const activeSubId = customer.activeSubscriptionId;
    const activeSub = activeSubId
      ? subscriptions.find(s => s.id === activeSubId || s.id === `sub_${activeSubId}` || activeSubId?.includes(s.id))
      : null;

    const loyaltyPts = customer.loyaltyPoints || 0;

    // Build the WhatsApp message
    let message = `Hi ${customer.name}! 👋\n\n`;
    message += `Here are your *${tenantName}* portal login details:\n\n`;
    message += `🔗 *Login URL:* ${loginUrl}\n`;
    message += `📱 *Username / Phone:* ${customer.phone}\n`;

    if (newPassword) {
      message += `🔑 *Password:* ${newPassword}\n`;
    } else {
      message += `🔑 *Password:* (use the password set for your account)\n`;
    }

    message += `\n🌟 *Loyalty Points Balance:* ${loyaltyPts} pts\n`;

    if (activeSub) {
      const expiry = customer.subscriptionExpiry
        ? ` (expires ${customer.subscriptionExpiry})`
        : "";
      message += `💎 *Active Membership:* ${activeSub.name}${expiry}\n`;
    } else {
      message += `💎 *Membership:* No active membership\n`;
    }

    message += `\nThank you for choosing *${tenantName}*! ✨`;

    // Sanitize phone — strip spaces, dashes, leading 0; ensure +91 or similar prefix
    const rawPhone = customer.phone.replace(/[\s\-().]/g, "");
    const phone = rawPhone.startsWith("+") ? rawPhone.slice(1) : rawPhone;

    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  const handleUpdateCustomerPassword = async () => {
    if (!customerPasswordInput.trim()) {
      alert("Please enter a valid password.");
      return;
    }
    const customer = customers[activeCrmIndex];
    if (!customer) return;

    try {
      const res = await fetch(`/api/customers?id=${customer.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-slug": tenantSlug,
        },
        body: JSON.stringify({ password: customerPasswordInput }),
      });

      if (res.ok) {
        alert(`Successfully updated portal password for "${customer.name}".`);
        const sendWa = window.confirm("Would you like to send these credentials to the client via WhatsApp?");
        if (sendWa) {
          await handleSendWhatsAppDetails(customer.id, customerPasswordInput);
        }
        setCustomerPasswordInput("");
      } else {
        alert("Failed to update portal password.");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating portal password.");
    }
  };

  const filteredCrm = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(crmSearch.toLowerCase()) || c.phone.includes(crmSearch);
    if (showOnlySubscribers) {
      return matchesSearch && !!c.activeSubscriptionId;
    }
    return matchesSearch;
  });

  const changeBookingStatus = async (id: string, newStatus: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "IN_PROGRESS") => {
    const bookingSlot = bookings.find(b => b.id === id);

    // Optimistic UI update
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));

    // Send WhatsApp message if cancelled
    if (
      newStatus === "CANCELLED" && 
      bookingSlot && 
      bookingSlot.phone && 
      bookingSlot.phone.trim() !== "" && 
      bookingSlot.phone !== "null" && 
      bookingSlot.phone !== "undefined"
    ) {
      const customerName = bookingSlot.customerName || "Customer";
      const serviceName = bookingSlot.serviceName || "service";
      const time = bookingSlot.time || "";
      const date = bookingSlot.date || "today";
      const cancelMsg = `Dear ${customerName},\n\nWe would like to inform you that your booking for *${serviceName}* on ${date} at ${time} has been *CANCELLED*.\n\nThank you,\n${businessName || "Lavender Spa Retreat"}`;
      
      fetch("/api/whatsapp/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-slug": tenantSlug,
        },
        body: JSON.stringify({
          to: bookingSlot.phone,
          body: cancelMsg
        })
      }).catch(err => console.error("Failed to send WhatsApp message:", err));
    }

    // Sync to backend for real DB IDs
    if (id && !id.startsWith("bkg_")) {
      try {
        let action = "";
        if (newStatus === "CANCELLED") action = "cancel";
        else if (newStatus === "COMPLETED") action = "complete";

        if (action) {
          await fetch(`/api/bookings/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", "x-tenant-slug": tenantSlug },
            body: JSON.stringify({ action, reason: "Status changed via Admin Console" })
          });
        }
      } catch (err) {
        console.warn("Failed to sync booking status to backend:", err);
      }
    }
  };

  const loadBookingToPos = (b: BookingSlot) => {
    clearCart();
    const service = services.find(s => s.name === b.serviceName);
    if (service) {
      addToCart({ id: service.id, name: service.name, price: service.price, type: "service" });
    }
    const targetCrmIndex = customers.findIndex(c => c.name === b.customerName);
    if (targetCrmIndex !== -1) {
      setActiveCrmIndex(targetCrmIndex);
    }
    changeBookingStatus(b.id, "COMPLETED");
    setActiveTab("POS");
  };

  // ─── SERVICES CRUD ACTIONS ───
  const openAddServiceModal = (preset?: { isCombo?: boolean; hasOffer?: boolean }) => {
    setEditingService(null);
    setServiceName("");
    setServicePrice(0);
    setServiceOfferPrice(preset?.hasOffer ? 0 : "");
    setServiceIsCombo(preset?.isCombo || false);
    setServiceComboServiceIds([]);
    setServiceCategory("Grooming");
    setServiceDuration(30);
    setServiceGender("UNISEX");
    setServiceBodyPart("");
    setServiceDescription("");
    setServiceLoyaltyPoints(0);
    setServiceImages([]);
    setServiceTags([]);
    setServiceTagInput("");
    setIsServiceModalOpen(true);
  };

  const openEditServiceModal = (ser: ServiceItem) => {
    setEditingService(ser);
    setServiceName(ser.name);
    setServicePrice(ser.price);
    setServiceOfferPrice(ser.offerPrice !== undefined && ser.offerPrice !== null ? ser.offerPrice : "");
    setServiceIsCombo(!!ser.isCombo);
    setServiceComboServiceIds(ser.comboServiceIds || []);
    setServiceCategory(ser.category);
    setServiceDuration(ser.duration || 30);
    setServiceGender(ser.gender || "UNISEX");
    setServiceBodyPart(ser.bodyPart || "");
    setServiceDescription(ser.description || "");
    setServiceLoyaltyPoints(ser.loyaltyPoints || 0);
    setServiceImages(ser.images || []);
    setServiceTags(ser.tags || []);
    setServiceTagInput("");
    setIsServiceModalOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();

    // For combo offers: auto-compute price and duration from selected included services
    let finalPrice = servicePrice;
    let finalDuration = serviceDuration;
    if (serviceIsCombo && serviceComboServiceIds.length > 0) {
      const included = services.filter(s => serviceComboServiceIds.includes(s.id));
      finalPrice = included.reduce((sum, s) => sum + Number(s.price), 0);
      finalDuration = included.reduce((sum, s) => sum + Number(s.duration || 30), 0);
    }

    const payload = {
      name: serviceName,
      price: finalPrice,
      offerPrice: serviceOfferPrice !== "" ? Number(serviceOfferPrice) : null,
      isCombo: serviceIsCombo,
      comboServiceIds: serviceIsCombo ? serviceComboServiceIds : [],
      category: serviceCategory,
      duration: finalDuration,
      gender: serviceGender,
      bodyPart: serviceBodyPart || undefined,
      description: serviceDescription || undefined,
      loyaltyPoints: serviceLoyaltyPoints,
      images: serviceImages,
      tags: serviceTags,
      outletId: selectedOutletId,
    };

    const validation = serviceSchema.safeParse(payload);
    if (!validation.success) {
      alert("Validation Failed:\n" + validation.error.issues.map(err => `• ${err.path.join(".")}: ${err.message}`).join("\n"));
      return;
    }

    try {
      if (editingService) {
        await fetch(`/api/services`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "x-tenant-slug": tenantSlug },
          body: JSON.stringify({ id: editingService.id, ...payload }),
        });
      } else {
        await fetch("/api/services", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-tenant-slug": tenantSlug },
          body: JSON.stringify(payload),
        });
      }
    } catch (err) {
      console.error("Failed to save service:", err);
    }
    // Re-fetch to sync state from DB
    fetch(`/api/services?outletId=${selectedOutletId}`, { headers: { "x-tenant-slug": tenantSlug } })
      .then(r => r.json()).then(data => { if (Array.isArray(data)) setServices(data); });
    setIsServiceModalOpen(false);
  };

  const handleDeleteService = async (id: string) => {
    if (confirm("Are you sure you want to delete this service?")) {
      try {
        await fetch(`/api/services?id=${id}`, {
          method: "DELETE",
          headers: { "x-tenant-slug": tenantSlug },
        });
      } catch (err) {
        console.error("Failed to delete service:", err);
      }
      setServices(prev => prev.filter(s => s.id !== id));
    }
  };

  // ─── TEAM/USER CRUD ACTIONS ───
  const openAddUserModal = () => {
    setEditingUser(null);
    setTeamName("");
    setTeamEmail("");
    setTeamPhone("");
    setTeamPassword("");
    setTeamRole("STYLIST");
    setTeamOutletId(selectedOutletId || "");
    setTeamSpecialization("Stylist");
    setTeamIsActive(true);
    setTeamWorkingDays([1, 2, 3, 4, 5, 6]);
    setIsUserModalOpen(true);
  };

  const openEditUserModal = (user: any) => {
    setEditingUser(user);
    setTeamName(user.name || "");
    setTeamEmail(user.email || "");
    setTeamPhone(user.phone || "");
    setTeamPassword("");
    setTeamRole(user.role || "STYLIST");
    setTeamOutletId(user.outletId || "");
    setTeamSpecialization(user.staffProfile?.specializations || "");
    setTeamIsActive(user.isActive !== false);
    // Restore workingDays from staffProfile, default Mon-Sat
    const wdays = user.staffProfile?.workingDays;
    setTeamWorkingDays(Array.isArray(wdays) && wdays.length > 0 ? wdays : [1, 2, 3, 4, 5, 6]);
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName || !teamPhone || !teamEmail) {
      alert("Name, Email, and Phone are required.");
      return;
    }

    const payload: any = {
      name: teamName,
      email: teamEmail,
      phone: teamPhone,
      role: teamRole,
      outletId: teamOutletId || null,
      isActive: teamIsActive,
    };

    if (teamRole === "STYLIST") {
      payload.specialization = teamSpecialization || "Stylist";
      payload.workingDays = teamWorkingDays;
    }

    if (teamPassword) {
      payload.password = teamPassword;
    }

    const validation = userSchema.safeParse(payload);
    if (!validation.success) {
      alert("Validation Failed:\n" + validation.error.issues.map(err => `• ${err.path.join(".")}: ${err.message}`).join("\n"));
      return;
    }

    try {
      let res;
      if (editingUser) {
        res = await fetch(`/api/users?id=${editingUser.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-tenant-slug": tenantSlug,
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-tenant-slug": tenantSlug,
          },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        setIsUserModalOpen(false);
        setTeamRefreshCounter(prev => prev + 1);
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to save user");
      }
    } catch (err) {
      console.error("Error saving user:", err);
      alert("An unexpected error occurred.");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const res = await fetch(`/api/users?id=${userId}`, {
        method: "DELETE",
        headers: {
          "x-tenant-slug": tenantSlug,
        },
      });

      if (res.ok) {
        setTeamRefreshCounter(prev => prev + 1);
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to delete user");
      }
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("An unexpected error occurred.");
    }
  };

  // ─── PRODUCTS CRUD ACTIONS ───
  const openAddProductModal = () => {
    setEditingProduct(null);
    setProductName("");
    setProductPrice(0);
    setProductSku("");
    setProductStock(0);
    setProductTrackStock(true);
    setProductCostPrice(0);
    setProductLowStockThreshold(5);
    setProductSupplierId("");
    setProductImageUrl("");
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (prod: ProductItem) => {
    setEditingProduct(prod);
    setProductName(prod.name);
    setProductPrice(prod.price);
    setProductSku(prod.sku || "");
    setProductStock(prod.stockQty || 0);
    setProductTrackStock(prod.trackStock ?? true);
    setProductCostPrice(prod.costPrice || 0);
    setProductLowStockThreshold(prod.lowStockThreshold || 5);
    setProductSupplierId(prod.supplierId || "");
    setProductImageUrl(prod.imageUrl || "");
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: productName,
      price: productPrice,
      sku: productSku || null,
      stockQty: productStock,
      trackStock: productTrackStock,
      costPrice: productCostPrice,
      lowStockThreshold: productLowStockThreshold,
      supplierId: productSupplierId || null,
      outletId: selectedOutletId,
      imageUrl: productImageUrl || null
    };

    const validation = productSchema.safeParse(payload);
    if (!validation.success) {
      alert("Validation Failed:\n" + validation.error.issues.map(err => `• ${err.path.join(".")}: ${err.message}`).join("\n"));
      return;
    }

    try {
      if (editingProduct) {
        await fetch(`/api/products?id=${editingProduct.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "x-tenant-slug": tenantSlug },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-tenant-slug": tenantSlug },
          body: JSON.stringify(payload),
        });
      }
    } catch (err) {
      console.error("Failed to save product:", err);
    }
    // Re-fetch to sync state from DB
    fetch(`/api/products?outletId=${selectedOutletId}`, { headers: { "x-tenant-slug": tenantSlug } })
      .then(r => r.json()).then(data => { if (Array.isArray(data)) setProducts(data); });
    setIsProductModalOpen(false);
  };

  // ─── SUPPLIER & PO HELPERS ───
  const fetchSuppliers = () => {
    fetch("/api/products/suppliers", { headers: { "x-tenant-slug": tenantSlug } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setSuppliers(data); })
      .catch(console.error);
  };

  const fetchPurchaseOrders = () => {
    fetch("/api/products/purchase-orders", { headers: { "x-tenant-slug": tenantSlug } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setPurchaseOrders(data); })
      .catch(console.error);
  };

  const handleCreateSupplier = async (name: string, contactName: string, email: string, phone: string) => {
    try {
      await fetch("/api/products/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tenant-slug": tenantSlug },
        body: JSON.stringify({ name, contactName, email, phone }),
      });
      fetchSuppliers();
    } catch (err) {
      console.error("Failed to create supplier:", err);
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (confirm("Are you sure you want to delete this supplier?")) {
      try {
        await fetch(`/api/products/suppliers?id=${id}`, {
          method: "DELETE",
          headers: { "x-tenant-slug": tenantSlug },
        });
        fetchSuppliers();
      } catch (err) {
        console.error("Failed to delete supplier:", err);
      }
    }
  };

  const handleCreatePurchaseOrder = async (supplierId: string, notes: string, items: any[]) => {
    try {
      await fetch("/api/products/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tenant-slug": tenantSlug },
        body: JSON.stringify({ supplierId, notes, items }),
      });
      fetchPurchaseOrders();
      // Re-fetch products as stock levels or cost prices might change
      fetch(`/api/products?outletId=${selectedOutletId}`, { headers: { "x-tenant-slug": tenantSlug } })
        .then(r => r.json()).then(data => { if (Array.isArray(data)) setProducts(data); });
    } catch (err) {
      console.error("Failed to create purchase order:", err);
    }
  };

  const handleUpdatePurchaseOrderStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/products/purchase-orders?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-tenant-slug": tenantSlug },
        body: JSON.stringify({ status }),
      });
      fetchPurchaseOrders();
      // Re-fetch products to reflect updated stock levels if RECEIVED
      fetch(`/api/products?outletId=${selectedOutletId}`, { headers: { "x-tenant-slug": tenantSlug } })
        .then(r => r.json()).then(data => { if (Array.isArray(data)) setProducts(data); });
    } catch (err) {
      console.error("Failed to update purchase order status:", err);
    }
  };

  // ─── CRM SEGMENTS HELPERS ───
  const fetchSegments = () => {
    fetch("/api/customers/segments", {
      credentials: "include",
      headers: { "x-tenant-slug": tenantSlug }
    })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setCustomerSegments(data); })
      .catch(console.error);
  };

  const handleCreateSegment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/customers/segments", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "x-tenant-slug": tenantSlug },
        body: JSON.stringify({
          name: newSegmentName,
          description: newSegmentDesc,
          criteriaType: newSegmentType,
          criteriaValue: newSegmentValue,
        }),
      });
      setNewSegmentName("");
      setNewSegmentDesc("");
      setNewSegmentType("LAST_VISIT");
      setNewSegmentValue("60");
      setIsSegmentModalOpen(false);
      fetchSegments();
    } catch (err) {
      console.error("Failed to create segment:", err);
    }
  };

  const handleDeleteSegment = async (id: string) => {
    if (confirm("Are you sure you want to delete this segment?")) {
      try {
        await fetch(`/api/customers/segments?id=${id}`, {
          method: "DELETE",
          credentials: "include",
          headers: { "x-tenant-slug": tenantSlug },
        });
        if (selectedSegmentId === id) {
          setSelectedSegmentId("");
          setSegmentMembers([]);
        }
        fetchSegments();
      } catch (err) {
        console.error("Failed to delete segment:", err);
      }
    }
  };

  const fetchSegmentMembers = (id: string) => {
    setSelectedSegmentId(id);
    fetch(`/api/customers/segments?id=${id}&action=members`, {
      credentials: "include",
      headers: { "x-tenant-slug": tenantSlug }
    })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setSegmentMembers(data); })
      .catch(console.error);
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await fetch(`/api/products?id=${id}`, {
          method: "DELETE",
          headers: { "x-tenant-slug": tenantSlug },
        });
      } catch (err) {
        console.error("Failed to delete product:", err);
      }
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleQuickRestock = async (prodId: string, amount: number) => {
    // Optimistic UI update
    setProducts(prev => prev.map(p => {
      if (p.id === prodId) {
        const newQty = Math.max(0, (p.stockQty || 0) + amount);
        return { ...p, stockQty: newQty };
      }
      return p;
    }));

    try {
      const prod = products.find(p => p.id === prodId);
      if (prod) {
        const targetQty = Math.max(0, (prod.stockQty || 0) + amount);
        await fetch(`/api/products?id=${prodId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "x-tenant-slug": tenantSlug },
          body: JSON.stringify({ stockQty: targetQty }),
        });
      }
    } catch (err) {
      console.error("Failed to update stock quantity on backend:", err);
    }
  };

  // ─── SUBSCRIPTION CRUD ACTIONS ───
  const fetchSubscriptions = async () => {
    try {
      const res = await fetch("/api/memberships/plans", {
        headers: { "x-tenant-slug": tenantSlug },
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        const plans = Array.isArray(data) ? data : (data?.data ?? []);
        setSubscriptions(plans.map((p: any) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          duration: p.duration,
          description: p.description || "",
          status: p.isActive ? "ACTIVE" : "INACTIVE",
        })));
      }
    } catch (e) {
      console.error("Failed to load membership plans", e);
    }
  };

  const openAddSubModal = () => {
    setEditingSub(null);
    setSubName("");
    setSubPrice(0);
    setSubDuration("Monthly");
    setSubDesc("");
    setIsSubModalOpen(true);
  };

  const openEditSubModal = (sub: SubscriptionPackage) => {
    setEditingSub(sub);
    setSubName(sub.name);
    setSubPrice(sub.price);
    setSubDuration(sub.duration);
    setSubDesc(sub.description);
    setIsSubModalOpen(true);
  };

  const handleSaveSub = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSub) {
        await fetch(`/api/memberships/plans/${editingSub.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "x-tenant-slug": tenantSlug },
          credentials: "include",
          body: JSON.stringify({ name: subName, price: subPrice, duration: subDuration, description: subDesc }),
        });
      } else {
        await fetch("/api/memberships/plans", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-tenant-slug": tenantSlug },
          credentials: "include",
          body: JSON.stringify({ name: subName, price: subPrice, duration: subDuration, description: subDesc }),
        });
      }
      await fetchSubscriptions();
    } catch (e) {
      console.error("Failed to save membership plan", e);
    }
    setIsSubModalOpen(false);
  };

  const handleDeleteSub = async (id: string) => {
    if (confirm("Are you sure you want to delete this membership pass?")) {
      try {
        await fetch(`/api/memberships/plans/${id}`, {
          method: "DELETE",
          headers: { "x-tenant-slug": tenantSlug },
          credentials: "include",
        });
        await fetchSubscriptions();
      } catch (e) {
        console.error("Failed to delete membership plan", e);
      }
    }
  };

  // ─── COUPON CRUD ACTIONS ───
  const openAddCouponModal = () => {
    setEditingCoupon(null);
    setCouponValCode("");
    setCouponDiscountPercent(0);
    setCouponMaxDiscount(0);
    setCouponMinBill(0);
    setCouponExpiry("2026-12-31");
    setIsCouponModalOpen(true);
  };

  const openEditCouponModal = (cpn: CouponItem) => {
    setEditingCoupon(cpn);
    setCouponValCode(cpn.code);
    setCouponDiscountPercent(cpn.discountPercent);
    setCouponMaxDiscount(cpn.maxDiscount);
    setCouponMinBill(cpn.minBill);
    setCouponExpiry(cpn.expiryDate);
    setIsCouponModalOpen(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const codeUpper = couponValCode.trim().toUpperCase();
    const validation = couponSchema.safeParse({
      code: codeUpper,
      discountPercent: couponDiscountPercent,
      minBill: couponMinBill,
      maxDiscount: couponMaxDiscount,
      expiryDate: couponExpiry,
    });
    if (!validation.success) {
      alert("Validation Failed:\n" + validation.error.issues.map(err => `• ${err.path.join(".")}: ${err.message}`).join("\n"));
      return;
    }

    const couponPayload = {
      code: codeUpper,
      type: "PERCENTAGE",
      value: couponDiscountPercent,
      minOrderValue: couponMinBill || null,
      maxDiscount: couponMaxDiscount || null,
      validFrom: new Date().toISOString(),
      validUntil: couponExpiry ? new Date(couponExpiry).toISOString() : null,
      outletId: selectedOutletId || null,
    };
    try {
      if (editingCoupon) {
        await fetch(`/api/coupons?id=${editingCoupon.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "x-tenant-slug": tenantSlug },
          body: JSON.stringify(couponPayload),
        });
      } else {
        await fetch("/api/coupons", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-tenant-slug": tenantSlug },
          body: JSON.stringify(couponPayload),
        });
      }
    } catch (err) {
      console.error("Failed to save coupon:", err);
    }
    // Re-fetch to sync state from DB
    fetch(`/api/coupons?outletId=${selectedOutletId}`, { headers: { "x-tenant-slug": tenantSlug } })
      .then(r => r.json())
      .then(data => {
        if (data && !data.fallback && Array.isArray(data)) {
          const mapped = data.map((c: any) => ({
            id: c.id,
            code: c.code,
            discountPercent: Number(c.value) || 0,
            maxDiscount: Number(c.maxDiscount) || 0,
            minBill: Number(c.minOrderValue) || 0,
            expiryDate: c.validUntil ? new Date(c.validUntil).toISOString().split('T')[0] : "",
            status: (c.isActive ? "ACTIVE" : "INACTIVE") as "ACTIVE" | "INACTIVE"
          }));
          setCoupons(mapped);
        }
      });
    setIsCouponModalOpen(false);
  };

  const handleDeleteCoupon = async (id: string) => {
    if (confirm("Are you sure you want to delete this coupon?")) {
      try {
        await fetch(`/api/coupons?id=${id}`, {
          method: "DELETE",
          headers: { "x-tenant-slug": tenantSlug },
        });
      } catch (err) {
        console.error("Failed to delete coupon:", err);
      }
      setCoupons(prev => prev.filter(c => c.id !== id));
    }
  };

  // ─── CUSTOMER CRUD ACTIONS ───
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: customerName,
      phone: customerPhone,
      email: customerEmail || undefined,
      password: customerPassword || undefined,
      tags: customerTags || undefined,
      loyaltyPoints: customerLoyaltyPoints || undefined,
    };

    const validation = customerSchema.safeParse(payload);
    if (!validation.success) {
      alert("Validation Failed:\n" + validation.error.issues.map(err => `• ${err.path.join(".")}: ${err.message}`).join("\n"));
      return;
    }

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "x-tenant-slug": tenantSlug },
        body: JSON.stringify({
          ...payload,
          outletId: selectedOutletId
        }),
      });
      if (res.ok) {
        const newCust = await res.json();

        // If initial loyalty points are provided, adjust them on the backend
        if (customerLoyaltyPoints > 0) {
          try {
            await fetch(`/api/loyalty/adjust?customerId=${newCust.id}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-tenant-slug": tenantSlug,
              },
              body: JSON.stringify({ points: customerLoyaltyPoints, description: "Initial CRM sign-up points" }),
            });
          } catch (err) {
            console.error("Failed to add initial loyalty points:", err);
          }
        }

        // Re-fetch to sync
        const listRes = await fetch(`/api/customers?outletId=${selectedOutletId}`, {
          credentials: "include",
          headers: { "x-tenant-slug": tenantSlug }
        });
        const data = await listRes.json();
        if (Array.isArray(data)) {
          setCustomers(data);
          const newIdx = data.findIndex(c => c.id === newCust.id || c.phone === customerPhone);
          if (newIdx !== -1) {
            setActiveCrmIndex(newIdx);
          }
        }
      }
    } catch (err) {
      console.error("Failed to create customer:", err);
    }
    setIsCustomerModalOpen(false);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setCustomerPassword("");
    setCustomerTags("");
    setCustomerLoyaltyPoints(0);
  };

  const handleSelectWalkIn = async () => {
    // 1. Search the customers array for phone === "0000000000"
    const walkInIdx = customers.findIndex(c => c.phone === "0000000000");
    if (walkInIdx !== -1) {
      setActiveCrmIndex(walkInIdx);
      setPosCustomerSearch("");
      return;
    }

    // 2. If not found in the array, let's try to create it
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "x-tenant-slug": tenantSlug },
        body: JSON.stringify({
          name: "Walk-in Customer",
          phone: "0000000000",
          email: "walkin@guest.com",
          outletId: selectedOutletId
        }),
      });

      if (res.ok) {
        const newCust = await res.json();
        // Add to state and set index
        setCustomers(prev => {
          const updated = [...prev, newCust];
          const newIdx = updated.findIndex(c => c.id === newCust.id);
          setActiveCrmIndex(newIdx !== -1 ? newIdx : 0);
          return updated;
        });
        setPosCustomerSearch("");
      } else if (res.status === 409) {
        // If conflict (409), let's refetch customers list to sync
        const listRes = await fetch(`/api/customers?outletId=${selectedOutletId}`, {
          credentials: "include",
          headers: { "x-tenant-slug": tenantSlug }
        });
        if (listRes.ok) {
          const data = await listRes.json();
          if (Array.isArray(data)) {
            setCustomers(data);
            const foundIdx = data.findIndex(c => c.phone === "0000000000");
            if (foundIdx !== -1) {
              setActiveCrmIndex(foundIdx);
            }
          }
        }
        setPosCustomerSearch("");
      }
    } catch (err) {
      console.error("Failed to select/create walk-in customer:", err);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (confirm("Are you sure you want to delete this customer? This will clear their member session.")) {
      try {
        await fetch(`/api/customers?id=${id}`, {
          method: "DELETE",
          credentials: "include",
          headers: { "x-tenant-slug": tenantSlug },
        });
      } catch (err) {
        console.error("Failed to delete customer:", err);
      }
      setCustomers(prev => prev.filter(c => c.id !== id));
      setActiveCrmIndex(0);
    }
  };

  const handleUpdateCustomerTags = async (id: string, newTags: string) => {
    try {
      const res = await fetch(`/api/customers?id=${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", "x-tenant-slug": tenantSlug },
        body: JSON.stringify({ tags: newTags }),
      });
      if (res.ok) {
        // Re-fetch to sync
        const listRes = await fetch(`/api/customers?outletId=${selectedOutletId}`, {
          credentials: "include",
          headers: { "x-tenant-slug": tenantSlug }
        });
        const data = await listRes.json();
        if (Array.isArray(data)) setCustomers(data);
      } else {
        alert("Failed to update tags");
      }
    } catch (err) {
      console.error("Failed to update tags:", err);
    }
  };

  const handleAddLoyaltyPoints = async (custId: string, amount: number) => {
    // Optimistic UI update
    setCustomers(prev => prev.map(c =>
      c.id === custId ? { ...c, loyaltyPoints: Math.max(0, (c.loyaltyPoints || 0) + amount) } : c
    ));

    try {
      await fetch(`/api/loyalty/adjust?customerId=${custId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-slug": tenantSlug,
        },
        body: JSON.stringify({ points: amount, description: "Manual adjustment via CRM console" }),
      });
    } catch (err) {
      console.error("Failed to update loyalty points on backend:", err);
    }
  };

  const handleAssignSubscription = async (custId: string, subId: string) => {
    try {
      const res = await fetch("/api/memberships/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tenant-slug": tenantSlug },
        credentials: "include",
        body: JSON.stringify({ customerId: custId, planId: subId }),
      });
      if (res.ok) {
        const enrollment = await res.json();
        const endDate = enrollment?.endDate || enrollment?.data?.endDate;
        setCustomers(prev => prev.map(c =>
          c.id === custId
            ? { ...c, activeSubscriptionId: subId, subscriptionExpiry: endDate ? endDate.split("T")[0] : "" }
            : c
        ));
      }
    } catch (e) {
      console.error("Failed to enroll customer in membership", e);
    }
  };

  const handleRevokeSubscription = async (custId: string) => {
    try {
      // Find enrollment for this customer
      const res = await fetch(`/api/memberships/enrollments?customerId=${custId}`, {
        headers: { "x-tenant-slug": tenantSlug },
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        const enrollments = Array.isArray(data) ? data : (data?.data ?? []);
        const active = enrollments.find((e: any) => e.status === "ACTIVE");
        if (active) {
          await fetch(`/api/memberships/enrollments/${active.id}`, {
            method: "DELETE",
            headers: { "x-tenant-slug": tenantSlug },
            credentials: "include",
          });
        }
      }
    } catch (e) {
      console.error("Failed to revoke enrollment", e);
    }
    setCustomers(prev => prev.map(c => {
      if (c.id === custId) {
        const { activeSubscriptionId, subscriptionExpiry, ...rest } = c;
        return rest as CrmCustomer;
      }
      return c;
    }));
  };

  const handleEditBookingClick = (slot: BookingSlot) => {
    setEditingBooking(slot);
    setBookingCustName(slot.customerName);
    setBookingCustPhone(slot.phone || "");
    setBookingServiceName(slot.serviceName);
    setBookingStylist(slot.stylistName);
    setBookingTime(slot.time);
    const dateObj = slot.scheduledAt ? new Date(slot.scheduledAt) : new Date();
    setBookingDate(dateObj.toISOString().split("T")[0]);
    setBookingError("");
    setIsBookingModalOpen(true);
  };

  // ─── BOOKINGS CRUD ACTIONS ───
  const handleSaveBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError("");

    const outletStys = cmsStylists.filter(s => getStylistOutletId(s) === selectedOutletId);
    const chosenStylist = bookingStylist || (outletStys[0]?.name || "");
    const chosenService = bookingServiceName || (services[0]?.name || "");

    // 1. Validate slot conflict (stylist + date + time)
    const targetDateStr = new Date(bookingDate).toDateString();
    const isConflict = bookings.some(b => {
      if (b.status === "CANCELLED") return false;
      // If editing, ignore the booking itself
      if (editingBooking && b.id === editingBooking.id) return false;

      const bDateStr = b.scheduledAt ? new Date(b.scheduledAt).toDateString() : "";
      const matchDate = bDateStr === targetDateStr;
      const matchTime = b.time.trim() === bookingTime.trim();
      const matchStylist = b.stylistName.trim().toLowerCase() === chosenStylist.trim().toLowerCase();

      return matchDate && matchTime && matchStylist;
    });

    const validation = bookingSchema.safeParse({
      customerName: bookingCustName,
      customerPhone: bookingCustPhone,
      serviceName: chosenService,
      stylistName: chosenStylist,
      timeSlot: bookingTime,
      date: bookingDate,
    });
    if (!validation.success) {
      setBookingError("Validation Failed:\n" + validation.error.issues.map(err => `• ${err.path.join(".")}: ${err.message}`).join("\n"));
      return;
    }

    if (isConflict) {
      setBookingError(`Stylist "${chosenStylist}" is already booked at ${bookingTime} on this date. Please choose a different slot.`);
      return;
    }

    const localBkgId = editingBooking?.id || `bkg_${Date.now()}`;
    const newBkg: BookingSlot = {
      id: localBkgId,
      customerName: bookingCustName,
      phone: bookingCustPhone,
      serviceName: chosenService,
      stylistName: chosenStylist,
      time: bookingTime,
      status: editingBooking?.status || "CONFIRMED"
    };

    // Attempt backend sync
    let syncSuccess = false;
    try {
      // Find or auto-provision the customer in PostgreSQL
      let customerId = "";
      const matchedCust = customers.find(c => c.phone === bookingCustPhone || c.name.toLowerCase() === bookingCustName.toLowerCase());
      if (matchedCust && matchedCust.id && !matchedCust.id.startsWith("c_")) {
        customerId = matchedCust.id;
      } else {
        // Create customer in PostgreSQL first
        const custRes = await fetch("/api/customers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-tenant-slug": tenantSlug
          },
          body: JSON.stringify({
            name: bookingCustName,
            phone: bookingCustPhone,
            email: matchedCust?.email || `${bookingCustName.toLowerCase().replace(/[^a-z0-9]/g, "")}_${Date.now()}@careva.in`,
            passwordHash: "careva-staff-created",
            dob: "1998-10-12",
            outletId: selectedOutletId
          })
        });
        if (custRes.ok) {
          const newCust = await custRes.json();
          if (newCust && newCust.id && !newCust.fallback) {
            customerId = newCust.id;
            setCustomers(prev => [newCust, ...prev]);
          }
        }
      }

      // Resolve Service ID
      let serviceId = "";
      const matchedService = services.find(s => s.name === chosenService);
      if (matchedService && matchedService.id && !matchedService.id.startsWith("s")) {
        serviceId = matchedService.id;
      } else if (services.length > 0) {
        const backendService = services.find(s => s.id && !s.id.startsWith("s"));
        if (backendService) serviceId = backendService.id;
      }

      // Resolve Staff ID
      const matchedStylist = cmsStylists.find(s => s.name === chosenStylist);
      const staffId = matchedStylist && matchedStylist.id && !matchedStylist.id.startsWith("staff_") ? matchedStylist.id : undefined;

      // Resolve Scheduled Time
      const [timePart, ampm] = bookingTime.split(" ");
      let [hoursStr, minutesStr] = timePart.split(":");
      let hours = parseInt(hoursStr, 10);
      const minutes = parseInt(minutesStr, 10);
      if (ampm === "PM" && hours < 12) hours += 12;
      if (ampm === "AM" && hours === 12) hours = 0;

      const scheduledDate = new Date(bookingDate);
      scheduledDate.setHours(hours, minutes, 0, 0);

      if (customerId && serviceId) {
        let bkgRes;
        if (editingBooking) {
          // Update booking in PostgreSQL backend
          bkgRes = await fetch(`/api/bookings/${editingBooking.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "x-tenant-slug": tenantSlug
            },
            body: JSON.stringify({
              outletId: selectedOutletId,
              customerId: customerId,
              staffId: staffId || null,
              scheduledAt: scheduledDate.toISOString(),
              items: [
                {
                  serviceId: serviceId,
                  staffId: staffId || null
                }
              ],
              notes: `Updated via CRM Dashboard. Time selected: ${bookingTime}`
            })
          });
        } else {
          // Create booking in PostgreSQL backend
          bkgRes = await fetch("/api/bookings", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-tenant-slug": tenantSlug
            },
            body: JSON.stringify({
              outletId: selectedOutletId,
              customerId: customerId,
              staffId: staffId || null,
              scheduledAt: scheduledDate.toISOString(),
              items: [
                {
                  serviceId: serviceId,
                  staffId: staffId || null
                }
              ],
              notes: `Booked via CRM Dashboard. Time selected: ${bookingTime}`
            })
          });
        }

        if (bkgRes.ok) {
          const syncedBkg = await bkgRes.json();
          if (syncedBkg && syncedBkg.id && !syncedBkg.fallback) {
            const mappedBkg: BookingSlot = {
              id: syncedBkg.id,
              customerName: bookingCustName,
              phone: bookingCustPhone,
              serviceName: chosenService,
              stylistName: chosenStylist,
              time: bookingTime,
              status: syncedBkg.status || "CONFIRMED",
              scheduledAt: syncedBkg.scheduledAt,
              date: syncedBkg.scheduledAt ? new Date(syncedBkg.scheduledAt).toLocaleDateString([], { month: "short", day: "numeric" }) : "",
              totalPrice: syncedBkg.totalPrice || 0
            };
            if (editingBooking) {
              setBookings(prev => prev.map(b => b.id === editingBooking.id ? mappedBkg : b));
            } else {
              setBookings(prev => [mappedBkg, ...prev]);
            }
            syncSuccess = true;
          }
        } else {
          const errData = await bkgRes.json().catch(() => ({}));
          if (errData?.message) {
            setBookingError(errData.message);
            return;
          }
        }
      }
    } catch (e) {
      console.warn("Backend booking action failed. Using local storage fallback:", e);
    }

    if (!syncSuccess) {
      // Offline fallback
      const scheduledDate = new Date(bookingDate);
      const [timePart, ampm] = bookingTime.split(" ");
      let [hoursStr, minutesStr] = timePart.split(":");
      let hours = parseInt(hoursStr, 10);
      const minutes = parseInt(minutesStr, 10);
      if (ampm === "PM" && hours < 12) hours += 12;
      if (ampm === "AM" && hours === 12) hours = 0;
      scheduledDate.setHours(hours, minutes, 0, 0);

      const mappedBkgFallback: BookingSlot = {
        ...newBkg,
        scheduledAt: scheduledDate.toISOString(),
        date: scheduledDate.toLocaleDateString([], { month: "short", day: "numeric" })
      };

      let updated;
      if (editingBooking) {
        updated = bookings.map(b => b.id === editingBooking.id ? mappedBkgFallback : b);
      } else {
        updated = [mappedBkgFallback, ...bookings];
      }
      setBookings(updated);
      if (selectedOutletId) {
        localStorage.setItem(`tenant_bookings_${tenantSlug}_${selectedOutletId}`, JSON.stringify(updated));
      }
    }

    // Trigger WhatsApp booking confirmation
    if (whatsAppConnected && !editingBooking) {
      sendWhatsAppMessage(
        "booking_confirmation",
        bookingCustName,
        bookingCustPhone,
        {
          service: chosenService,
          stylist: chosenStylist,
          date: new Date().toLocaleDateString(),
          time: bookingTime,
          outlet: cmsOutlets.find(o => o.id === selectedOutletId)?.name || "Main Outlet"
        }
      );
    }

    setIsBookingModalOpen(false);
    setBookingCustName("");
    setBookingCustPhone("");
    setBookingServiceName("");
    setBookingStylist("");
    setEditingBooking(null);
    setBookingDate(new Date().toISOString().split("T")[0]);
    setAuditRefreshCounter(prev => prev + 1);
  };

  const handleDeleteBooking = async (id: string) => {
    if (confirm("Are you sure you want to cancel and remove this booking record?")) {
      const updated = bookings.filter(b => b.id !== id);
      setBookings(updated);
      if (selectedOutletId) {
        localStorage.setItem(`tenant_bookings_${tenantSlug}_${selectedOutletId}`, JSON.stringify(updated));
      }

      if (id && !id.startsWith("bkg_")) {
        try {
          await fetch(`/api/bookings/${id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "x-tenant-slug": tenantSlug
            },
            body: JSON.stringify({ action: "cancel", reason: "Deleted from Admin CRM Dashboard" })
          });
        } catch (err) {
          console.warn("Failed to delete/cancel booking on backend:", err);
        }
      }
      setAuditRefreshCounter(prev => prev + 1);
    }
  };

  // ─── AUTH GATE: Block unauthenticated access ───
  if (!adminAuthChecked) {
    return (
      <div className="min-h-[500px] flex items-center justify-center bg-[#090d16] rounded-[2rem]">
        <Sparkles className="size-8 text-rose-400 animate-spin" />
      </div>
    );
  }

  if (!isAdminAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center p-6" style={{ background: "radial-gradient(ellipse at top, #0f1729 0%, #030508 100%)" }}>
        {/* Glows */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-rose-500/6 blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/3 w-72 h-72 rounded-full bg-amber-500/5 blur-[100px] pointer-events-none" />

        <div className="relative w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-black uppercase tracking-widest">
              <Sliders className="size-3" /> Admin Console
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">{businessName}</h1>
            <p className="text-sm text-slate-400">Authorized personnel only</p>
          </div>

          {/* Login Card */}
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-800/60 p-8 shadow-2xl space-y-6">
            <h2 className="text-lg font-extrabold text-white">Owner Sign In</h2>

            {adminLoginError && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-bold flex items-center gap-2">
                <Ban className="size-4 shrink-0" />
                {adminLoginError}
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Email or Phone</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                  <input
                    id="admin-email"
                    type="text"
                    required
                    value={adminLoginEmail}
                    onChange={(e) => setAdminLoginEmail(e.target.value)}
                    placeholder="owner@salon.com or +91..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500/40 rounded-xl py-3 pl-10 pr-4 text-xs text-slate-200 font-semibold outline-none transition-all focus:ring-1 focus:ring-rose-500/20"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                  <input
                    id="admin-password"
                    type={adminShowPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={adminLoginPassword}
                    onChange={(e) => setAdminLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500/40 rounded-xl py-3 pl-10 pr-10 text-xs text-slate-200 font-semibold outline-none transition-all focus:ring-1 focus:ring-rose-500/20"
                  />
                  <button type="button" onClick={() => setAdminShowPassword(!adminShowPassword)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300">
                    {adminShowPassword ? <User className="size-4" /> : <User className="size-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={adminLoginLoading}
                className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-amber-500 hover:opacity-90 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-500/10 disabled:opacity-60 cursor-pointer"
              >
                {adminLoginLoading ? <Sparkles className="size-4 animate-spin" /> : <Sliders className="size-4" />}
                {adminLoginLoading ? "Verifying..." : "Access Admin Console"}
              </button>
            </form>
          </div>

          <p className="text-center text-[10px] text-slate-600 mt-6 font-mono tracking-wider">Secured by Careva SaaS Core · {tenantSlug}.careva.in</p>
        </div>
      </div>
    );
  }

  if (!selectedOutletId) {
    return (
      <div className="fixed inset-0 z-50 bg-[#FBFAF7] flex flex-col items-center justify-center p-6 text-center select-none font-minimal animate-fadeIn">
        {/* Soft natural backdrops */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#E5DFD5]/40 blur-[130px] pointer-events-none" />

        <div className="relative max-w-2xl w-full bg-white border border-stone-200/80 rounded-3xl p-10 md:p-14 shadow-[0_8px_30px_rgb(28,25,23,0.02)] flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-stone-900 flex items-center justify-center shadow-xs mb-6">
            <Sliders className="size-6 text-[#FAF9F6]" />
          </div>

          <h1 className="text-3xl md:text-4xl font-normal font-luxury text-stone-900 tracking-normal mb-3">
            Select Operating Outlet
          </h1>
          <p className="text-stone-500 text-sm max-w-md mb-10 font-medium">
            Please choose an outlet location to initialize your administrative POS and salon console session.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full text-left">
            {getAllowedOutlets(tenantPlan, cmsOutlets).map((outlet) => (
              <button
                key={outlet.id}
                onClick={() => {
                  setSelectedOutletId(outlet.id);
                  localStorage.setItem(`active_outlet_id_${tenantSlug}`, outlet.id);
                }}
                className="group relative p-6 rounded-2xl bg-stone-50/50 border border-stone-200/80 hover:border-stone-800 hover:bg-stone-50 text-stone-600 transition-all duration-200 shadow-xs cursor-pointer"
              >
                <div className="font-semibold text-stone-950 text-base mb-1 group-hover:text-stone-900 transition-colors">
                  {outlet.name}
                </div>
                <div className="text-xs text-stone-500 font-medium leading-relaxed">
                  {outlet.address}
                </div>
                <div className="mt-3 flex items-center justify-between text-[9px] text-stone-400 font-bold uppercase tracking-wider">
                  <span>{outlet.timings}</span>
                  <span className="text-stone-400 group-hover:text-stone-900 transition-all">
                    Select &rarr;
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 font-sans text-slate-250 animate-fadeIn">

      {/* ─── ACTIVE OUTLET HEADER SWITCHER ─── */}
      <div className="p-4 bg-stone-50 border border-stone-200/80 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-stone-900 flex items-center justify-center shadow-xs">
            <Sliders className="size-4.5 text-[#FAF9F6]" />
          </div>
          <div className="text-left font-minimal">
            <span className="text-[8px] uppercase font-bold tracking-widest text-stone-400 block">Active Operating Location</span>
            <span className="text-sm font-semibold text-stone-900">{cmsOutlets.find(o => o.id === selectedOutletId)?.name || "Select Outlet..."}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto font-minimal justify-end sm:justify-start">
          {userRole === "MANAGER" && userOutletId ? (
            <span className="px-4 py-2 bg-stone-100 border border-stone-200 text-stone-500 rounded-xl text-xs font-semibold uppercase tracking-wider">
              Scoped Outlet Panel
            </span>
          ) : (
            <>
              {getAllowedOutlets(tenantPlan, cmsOutlets).length > 2 ? (
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto justify-end sm:justify-start">
                  <select
                    value={selectedOutletId || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedOutletId(val);
                      localStorage.setItem(`active_outlet_id_${tenantSlug}`, val);
                    }}
                    className="flex-1 sm:flex-none bg-white border border-stone-200 focus:border-stone-850 rounded-xl px-4 py-2 text-xs font-semibold text-stone-700 outline-none cursor-pointer hover:bg-stone-50 transition-colors"
                  >
                    {cmsOutlets.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      setSelectedOutletId(null);
                      localStorage.removeItem(`active_outlet_id_${tenantSlug}`);
                    }}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-all cursor-pointer border border-stone-200 active:scale-95 whitespace-nowrap"
                  >
                    Switch
                  </button>
                  <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider bg-emerald-50 border border-emerald-200/50 px-2 py-1 rounded-lg">
                    Premium Multi-Outlet
                  </span>
                </div>
              ) : getAllowedOutlets(tenantPlan, cmsOutlets).length === 2 ? (
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto justify-end sm:justify-start">
                  <select
                    value={selectedOutletId || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedOutletId(val);
                      localStorage.setItem(`active_outlet_id_${tenantSlug}`, val);
                    }}
                    className="flex-1 sm:flex-none bg-white border border-stone-200 focus:border-stone-850 rounded-xl px-4 py-2 text-xs font-semibold text-stone-700 outline-none cursor-pointer hover:bg-stone-50 transition-colors"
                  >
                    {cmsOutlets.slice(0, 2).map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      setSelectedOutletId(null);
                      localStorage.removeItem(`active_outlet_id_${tenantSlug}`);
                    }}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-all cursor-pointer border border-stone-200 active:scale-95 whitespace-nowrap"
                  >
                    Switch
                  </button>
                  <span className="text-[10px] text-stone-600 font-bold uppercase tracking-wider bg-stone-100 border border-stone-200 px-2 py-1 rounded-lg">
                    Pro Max 2 Outlets
                  </span>
                </div>
              ) : (
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto justify-end sm:justify-start">
                  <div className="relative flex items-center">
                    <select
                      disabled
                      value={selectedOutletId || ""}
                      className="flex-1 sm:flex-none bg-stone-100 border border-stone-200 rounded-xl px-4 py-2 text-xs font-semibold text-stone-400 outline-none cursor-not-allowed"
                    >
                      {cmsOutlets.map(o => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </select>
                    <div className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white rounded-full p-0.5 shadow-md" title="Multiple branches requires Growth or Premium Plan">
                      <Lock className="size-2.5" />
                    </div>
                  </div>
                  <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider bg-amber-50 border border-amber-200/50 px-2 py-1 rounded-lg flex items-center gap-1">
                    <Lock className="size-3" /> Essential Single Outlet
                  </span>
                </div>
              )}
            </>
          )}


          <button
            onClick={handleAdminLogout}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-95 whitespace-nowrap"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Mobile tabs selector removed in favor of layout sidebar drawer navigation */}

      {/* ─── TAB CONTENT PANES ─── */}
      <div className="grid grid-cols-12 gap-8 items-start">

        {/* LEFT WORKSPACE PANELS */}
        <div className={`col-span-12 ${activeTab === 'POS' ? 'lg:col-span-8' : 'lg:col-span-12'} bg-transparent md:bg-white md:border md:border-stone-200/80 rounded-3xl p-0 md:p-10 md:shadow-xs min-h-[550px] transition-all duration-300`}>
          {!isTabAllowedForRole(userRole, activeTab) ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-500/5 border border-rose-500/10 flex items-center justify-center text-rose-700">
                <Lock className="size-8" />
              </div>
              <h3 className="text-xl font-semibold text-stone-900 uppercase tracking-wider">Access Denied</h3>
              <p className="text-sm text-stone-500 max-w-md font-medium leading-relaxed">
                You do not have administrative privileges to access this operational module.
              </p>
            </div>
          ) : !isTabAllowed(tenantPlan, activeTab) ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 animate-fadeIn">
              <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-600 shadow-lg shadow-amber-500/5">
                <Lock className="size-10" />
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-bold tracking-widest text-amber-500 block uppercase">Premium Operational Tool</span>
                <h3 className="font-normal font-luxury text-3xl text-stone-900 tracking-normal uppercase">{activeTab} Section is Locked</h3>
                <p className="text-sm text-stone-500 max-w-md font-medium leading-relaxed">
                  Your salon is currently subscribed to the <strong className="text-stone-850 font-bold uppercase tracking-wider">{tenantPlan} Plan</strong>. Access to this feature requires a <strong className="text-amber-600 font-bold uppercase tracking-wider">{getRequiredPlan(activeTab)} Plan</strong> or higher.
                </p>
              </div>

              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 max-w-md w-full text-left space-y-3">
                <h4 className="text-xs font-bold text-stone-850 uppercase tracking-widest">Included in {getRequiredPlan(activeTab)} Plan:</h4>
                <ul className="space-y-2 text-xs text-stone-500 font-medium">
                  {getRequiredPlan(activeTab) === "Growth" && (
                    <>
                      <li className="flex items-center gap-2 text-stone-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        <span>Workforce scheduling, payroll manager & clock</span>
                      </li>
                      <li className="flex items-center gap-2 text-stone-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        <span>Interactive coupon registry, deals & subscriptions</span>
                      </li>
                      <li className="flex items-center gap-2 text-stone-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        <span>Official & Unofficial multi-agent WhatsApp CRM</span>
                      </li>
                    </>
                  )}
                  {getRequiredPlan(activeTab) === "Premium" && (
                    <>
                      <li className="flex items-center gap-2 text-stone-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        <span>Multi-outlet/branch operational scope switching</span>
                      </li>
                      <li className="flex items-center gap-2 text-stone-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        <span>Digital treatment consents & HIPAA compliance</span>
                      </li>
                      <li className="flex items-center gap-2 text-stone-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        <span>Comprehensive security logs & platform audit logs</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    alert(`To upgrade to ${getRequiredPlan(activeTab)} Plan, please request the platform administrator.`);
                  }}
                  className="px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-stone-950/10 cursor-pointer"
                >
                  Upgrade Subscriptions
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* TAB: POS CHECKOUT */}
              {activeTab === "POS" && (
                <POSModule
                  services={services}
                  products={products}
                  addToCart={addToCart}
                />
              )}

              {/* TAB: CRM MANAGEMENT */}
              {activeTab === "CRM" && (
                <CRMModule
                  crmSubTab={crmSubTab}
                  setCrmSubTab={setCrmSubTab}
                  crmSearch={crmSearch}
                  setCrmSearch={setCrmSearch}
                  showOnlySubscribers={showOnlySubscribers}
                  setShowOnlySubscribers={setShowOnlySubscribers}
                  setIsCustomerModalOpen={setIsCustomerModalOpen}
                  customers={customers}
                  activeCrmIndex={activeCrmIndex}
                  setActiveCrmIndex={setActiveCrmIndex}
                  handleDeleteCustomer={handleDeleteCustomer}
                  handleUpdateCustomerTags={handleUpdateCustomerTags}
                  customerPasswordInput={customerPasswordInput}
                  setCustomerPasswordInput={setCustomerPasswordInput}
                  handleUpdateCustomerPassword={handleUpdateCustomerPassword}
                  newCrmNote={newCrmNote}
                  setNewCrmNote={setNewCrmNote}
                  handleAddCrmNote={handleAddCrmNote}
                  handleAddLoyaltyPoints={handleAddLoyaltyPoints}
                  subscriptions={subscriptions}
                  handleRevokeSubscription={handleRevokeSubscription}
                  handleAssignSubscription={handleAssignSubscription}
                  customerSegments={customerSegments}
                  setIsSegmentModalOpen={setIsSegmentModalOpen}
                  selectedSegmentId={selectedSegmentId}
                  fetchSegmentMembers={fetchSegmentMembers}
                  segmentMembers={segmentMembers}
                  handleDeleteSegment={handleDeleteSegment}
                  handleSendWhatsAppDetails={handleSendWhatsAppDetails}
                />
              )}


              {activeTab === "BOOKINGS" && (() => {
                const filteredAndSortedBookings = (() => {
                  const now = new Date();
                  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                  const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
                  const startOfDayAfterTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);

                  let list = bookings.filter(b => {
                    if (!b.scheduledAt) return false;
                    const bDate = new Date(b.scheduledAt);
                    if (bookingDateFilter === "today") {
                      return bDate >= startOfToday && bDate < startOfTomorrow;
                    } else if (bookingDateFilter === "tomorrow") {
                      return bDate >= startOfTomorrow && bDate < startOfDayAfterTomorrow;
                    } else {
                      // "all" -> today and tomorrow only
                      return bDate >= startOfToday && bDate < startOfDayAfterTomorrow;
                    }
                  });

                  list = [...list].sort((a, b) => {
                    if (bookingSort === "time-asc") {
                      return new Date(a.scheduledAt || 0).getTime() - new Date(b.scheduledAt || 0).getTime();
                    } else if (bookingSort === "time-desc") {
                      return new Date(b.scheduledAt || 0).getTime() - new Date(a.scheduledAt || 0).getTime();
                    } else if (bookingSort === "name-asc") {
                      return a.customerName.localeCompare(b.customerName);
                    } else if (bookingSort === "status") {
                      return a.status.localeCompare(b.status);
                    }
                    return 0;
                  });

                  return list;
                })();

                return (
                  <div className="space-y-8 font-minimal text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                      <div className="text-left w-full">
                        <h3 className="font-normal font-luxury text-3xl text-stone-900 tracking-normal">Daily Appointment Registry</h3>
                        <p className="text-sm text-stone-500 mt-1">Manage active slots, stylist bookings, and launch immediate POS sessions</p>
                      </div>
                      <button
                        onClick={() => {
                          setEditingBooking(null);
                          setBookingCustName("");
                          setBookingCustPhone("");
                          setBookingServiceName("");
                          setBookingStylist("");
                          setBookingTime("11:30 AM");
                          setBookingDate(new Date().toISOString().split("T")[0]);
                          setBookingError("");
                          setIsBookingModalOpen(true);
                        }}
                        className="px-6 py-3 bg-stone-900 text-white rounded-xl text-xs font-semibold uppercase tracking-widest hover:bg-stone-850 transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <Plus className="size-4" /> Add Booking
                      </button>
                    </div>

                    {/* Filters & Sorting */}
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white border border-stone-200 p-4 rounded-2xl shadow-xs">
                      {/* Date Filters Toggle */}
                      <div className="flex gap-1 bg-stone-105 p-1 rounded-xl border border-stone-200/60">
                        <button
                          onClick={() => setBookingDateFilter("all")}
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${bookingDateFilter === "all"
                              ? "bg-white text-stone-900 shadow-xs border border-stone-200/30"
                              : "text-stone-550 hover:text-stone-850"
                            }`}
                        >
                          Today & Tomorrow
                        </button>
                        <button
                          onClick={() => setBookingDateFilter("today")}
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${bookingDateFilter === "today"
                              ? "bg-white text-stone-900 shadow-xs border border-stone-200/30"
                              : "text-stone-550 hover:text-stone-850"
                            }`}
                        >
                          Today
                        </button>
                        <button
                          onClick={() => setBookingDateFilter("tomorrow")}
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${bookingDateFilter === "tomorrow"
                              ? "bg-white text-stone-900 shadow-xs border border-stone-200/30"
                              : "text-stone-550 hover:text-stone-850"
                            }`}
                        >
                          Tomorrow
                        </button>
                      </div>

                      {/* Sorting Select */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-450 uppercase tracking-wider">Sort by</span>
                        <select
                          value={bookingSort}
                          onChange={(e) => setBookingSort(e.target.value as "time-asc" | "time-desc" | "name-asc" | "status")}
                          className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-stone-800 outline-none focus:border-stone-450 transition-colors cursor-pointer"
                        >
                          <option value="time-asc">Time (Earliest first)</option>
                          <option value="time-desc">Time (Latest first)</option>
                          <option value="name-asc">Customer Name (A-Z)</option>
                          <option value="status">Status</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-5">
                      {filteredAndSortedBookings.map(slot => (
                        <div key={slot.id} className="p-6 bg-stone-50/50 border border-stone-200 hover:border-stone-400 hover:bg-stone-55 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-5 text-left transition-all shadow-xs">
                          <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-white border border-stone-200 flex flex-col items-center justify-center text-stone-700 font-semibold shrink-0">
                              <Clock className="size-4 shrink-0 text-stone-500" />
                              <span className="text-[10px] font-sans mt-0.5 tracking-tighter font-semibold leading-tight text-center">{slot.date || ""}</span>
                              <span className="text-[9px] font-sans tracking-tighter text-stone-500">{slot.time}</span>
                            </div>

                            <div className="space-y-1.5">
                              <div className="flex items-center gap-3 flex-wrap">
                                <h4 className="font-semibold text-stone-900 text-base leading-tight">{slot.customerName}</h4>
                                <span className={`px-3 py-1 rounded-xl text-[9px] font-semibold uppercase tracking-wider border ${slot.status === 'COMPLETED' ? 'bg-stone-105 border-stone-200 text-stone-500' :
                                    slot.status === 'IN_PROGRESS' ? 'bg-cyan-55 text-cyan-800 border-cyan-200' :
                                      slot.status === 'CONFIRMED' ? 'bg-emerald-55 text-emerald-800 border-emerald-200' :
                                        slot.status === 'CANCELLED' ? 'bg-red-55 text-red-700 border-red-200' :
                                          'bg-amber-55 text-amber-800 border-amber-200'
                                  }`}>
                                  {slot.status}
                                </span>
                              </div>
                              <p className="text-xs text-stone-500">Service: <strong className="text-stone-850">{slot.serviceName}</strong> | Stylist: <strong className="text-stone-700">{slot.stylistName}</strong></p>
                              {slot.phone && <p className="text-xs text-stone-400">📞 {slot.phone}{slot.totalPrice !== undefined && slot.totalPrice !== null ? ` · ₹${slot.totalPrice}` : ""}</p>}
                            </div>
                          </div>

                          <div className="flex items-center gap-3.5 justify-end flex-wrap">
                            {slot.status !== "COMPLETED" && slot.status !== "CANCELLED" && (
                              <>
                                {slot.status === "CONFIRMED" && (
                                  <button
                                    onClick={() => changeBookingStatus(slot.id, "IN_PROGRESS")}
                                    className="px-4 py-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer border border-cyan-200"
                                  >
                                    Start Service
                                  </button>
                                )}

                                {slot.status === "IN_PROGRESS" && (
                                  <button
                                    onClick={() => loadBookingToPos(slot)}
                                    className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer border border-emerald-200"
                                  >
                                    Checkout Bill
                                  </button>
                                )}

                                <button
                                  onClick={() => handleEditBookingClick(slot)}
                                  className="px-4 py-2 bg-stone-900 hover:bg-stone-850 text-white rounded-xl text-xs font-semibold uppercase tracking-wider cursor-pointer transition-all shadow-xs"
                                >
                                  Edit
                                </button>

                                <button
                                  onClick={() => setBookingToCancel(slot)}
                                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl text-xs font-semibold uppercase tracking-wider border border-stone-200 cursor-pointer transition-colors"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleDeleteBooking(slot.id)}
                              className="p-2 text-stone-400 hover:text-stone-900 rounded-xl hover:bg-stone-100 transition-colors"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {bookings.length > 0 && filteredAndSortedBookings.length === 0 && (
                        <div className="p-12 border border-dashed border-stone-200/80 rounded-2xl bg-stone-50/20 text-center max-w-lg mx-auto my-8 space-y-4">
                          <div className="mx-auto w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 border border-stone-200 shadow-xs">
                            <Clock className="size-5 shrink-0" />
                          </div>
                          <div className="space-y-1.5">
                            <h4 className="text-stone-900 font-bold text-base">No appointments in this view</h4>
                            <p className="text-stone-500 text-xs leading-relaxed max-w-sm mx-auto">
                              There are no bookings matching the selected date filter ({bookingDateFilter === "all" ? "Today & Tomorrow" : bookingDateFilter === "today" ? "Today" : "Tomorrow"}).
                            </p>
                          </div>
                        </div>
                      )}

                      {bookings.length === 0 && (
                        <div className="p-12 border border-dashed border-stone-200/80 rounded-2xl bg-stone-50/20 text-center max-w-lg mx-auto my-8 space-y-4">
                          <div className="mx-auto w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 border border-stone-200 shadow-xs">
                            <Clock className="size-5 shrink-0" />
                          </div>
                          <div className="space-y-1.5">
                            <h4 className="text-stone-900 font-bold text-base">No appointments registered yet</h4>
                            <p className="text-stone-500 text-xs leading-relaxed max-w-sm mx-auto">
                              Create client bookings, manage active slots, and launch instant checkout POS tickets. Get started by adding a new appointment.
                            </p>
                          </div>
                          <div>
                            <button
                              onClick={() => setIsBookingModalOpen(true)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-850 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                            >
                              <Plus className="size-3.5" /> Book Client
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* TAB: SERVICES CRUD */}
              {activeTab === "SERVICES" && (() => {
                // Compute filtered services based on sub-tab
                const filteredServices = serviceViewTab === "OFFERS"
                  ? services.filter(s => !s.isCombo && s.offerPrice !== null && s.offerPrice !== undefined && Number(s.offerPrice) < s.price)
                  : serviceViewTab === "COMBOS"
                  ? services.filter(s => !!s.isCombo)
                  : services;

                return (
                  <div className="space-y-6 font-minimal text-left">
                    {/* Header row */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div>
                        <h3 className="font-normal font-luxury text-3xl text-stone-900 tracking-normal">Outlet Services Catalogue</h3>
                        <p className="text-sm text-stone-500 mt-1">Configure salon services, special offers, and combo packages</p>
                      </div>
                      <div className="flex flex-wrap gap-2 shrink-0">
                        <button
                          onClick={() => openAddServiceModal()}
                          className="px-4 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-semibold uppercase tracking-widest hover:bg-stone-700 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="size-3.5" /> Add Service
                        </button>
                        <button
                          onClick={() => { setServiceViewTab("OFFERS"); openAddServiceModal({ hasOffer: true }); }}
                          className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Tag className="size-3.5" /> Add Special Offer
                        </button>
                        <button
                          onClick={() => { setServiceViewTab("COMBOS"); openAddServiceModal({ isCombo: true }); }}
                          className="px-4 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-semibold uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles className="size-3.5" /> Add Combo Offer
                        </button>
                      </div>
                    </div>

                    {/* Sub-tabs: All / Special Offers / Combo Offers */}
                    <div className="flex gap-1 bg-stone-100/60 border border-stone-200 rounded-2xl p-1 w-fit">
                      {([
                        { id: "ALL", label: "All Services", count: services.length },
                        { id: "OFFERS", label: "Special Offers", count: services.filter(s => !s.isCombo && s.offerPrice !== null && s.offerPrice !== undefined && Number(s.offerPrice) < s.price).length },
                        { id: "COMBOS", label: "Combo Packages", count: services.filter(s => !!s.isCombo).length },
                      ] as const).map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setServiceViewTab(tab.id)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-1.5 cursor-pointer ${
                            serviceViewTab === tab.id
                              ? tab.id === "OFFERS" ? "bg-emerald-600 text-white shadow-sm"
                              : tab.id === "COMBOS" ? "bg-rose-600 text-white shadow-sm"
                              : "bg-stone-900 text-white shadow-sm"
                              : "text-stone-500 hover:text-stone-900"
                          }`}
                        >
                          {tab.label}
                          <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold ${
                            serviceViewTab === tab.id ? "bg-white/20 text-white" : "bg-stone-200 text-stone-600"
                          }`}>{tab.count}</span>
                        </button>
                      ))}
                    </div>

                    {/* Context tip for each sub-tab */}
                    {serviceViewTab === "OFFERS" && (
                      <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800">
                        <Tag className="size-4 shrink-0 mt-0.5 text-emerald-600" />
                        <div>
                          <p className="font-bold text-emerald-900">Special Offers</p>
                          <p className="mt-0.5 text-emerald-700">Services with a discounted Offer Price set. The storefront will show a strikethrough on the original price and highlight the deal badge. Configure via Add Service → Offer Price field.</p>
                        </div>
                      </div>
                    )}
                    {serviceViewTab === "COMBOS" && (
                      <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800">
                        <Sparkles className="size-4 shrink-0 mt-0.5 text-rose-600" />
                        <div>
                          <p className="font-bold text-rose-900">Combo Packages</p>
                          <p className="mt-0.5 text-rose-700">Bundle multiple services together. Add an image, set a discounted combo price, and select which individual services are included. The storefront will display an "Included Treatments" badge list.</p>
                        </div>
                      </div>
                    )}

                    {/* Services table */}
                    <div className="overflow-x-auto border border-stone-200 rounded-2xl shadow-xs">
                      <table className="w-full text-left border-collapse text-sm font-minimal">
                        <thead>
                          <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-widest text-[10px]">
                            <th className="px-5 py-4">Name</th>
                            <th className="px-5 py-4">Category</th>
                            <th className="px-5 py-4">For</th>
                            <th className="px-5 py-4">Area</th>
                            <th className="px-5 py-4">Time</th>
                            <th className="px-5 py-4">Price</th>
                            <th className="px-5 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 bg-transparent">
                          {filteredServices.map(ser => (
                            <tr key={ser.id} className="hover:bg-stone-50/60 transition-colors text-stone-600">
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  {ser.images && ser.images.length > 0 ? (
                                    <img src={ser.images[0]} alt={ser.name} className="w-10 h-10 rounded-xl object-cover border border-stone-200/80 bg-stone-50" />
                                  ) : (
                                    <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200/60 flex items-center justify-center text-[10px] text-stone-400 font-bold uppercase tracking-wider select-none">
                                      No Img
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-semibold text-stone-900 text-sm flex items-center gap-1.5">
                                      {ser.name}
                                      {ser.isCombo && (
                                        <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded text-[9px] font-bold uppercase tracking-wider">Combo</span>
                                      )}
                                      {ser.offerPrice !== null && ser.offerPrice !== undefined && (
                                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[9px] font-bold uppercase tracking-wider">Offer</span>
                                      )}
                                    </div>
                                    {ser.description && <div className="text-stone-400 text-xs mt-0.5 truncate max-w-[180px]">{ser.description}</div>}
                                    {ser.isCombo && ser.comboServiceIds && ser.comboServiceIds.length > 0 && (
                                      <div className="text-[10px] text-rose-500 mt-0.5">{ser.comboServiceIds.length} services bundled</div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-4">
                                <span className="px-2.5 py-1 bg-stone-100 text-stone-600 border border-stone-200/80 rounded-lg font-semibold uppercase tracking-wider text-[10px]">
                                  {ser.category}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <span className={`px-2.5 py-1 rounded-lg font-semibold uppercase tracking-wider text-[10px] border ${ser.gender === "MEN" ? "bg-blue-50 text-blue-600 border-blue-100" :
                                    ser.gender === "WOMEN" ? "bg-pink-50 text-pink-600 border-pink-100" :
                                      "bg-stone-50 text-stone-500 border-stone-200"
                                  }`}>
                                  {ser.gender === "MEN" ? "Men" : ser.gender === "WOMEN" ? "Women" : "Unisex"}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                {ser.bodyPart ? (
                                  <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg font-semibold uppercase tracking-wider text-[10px]">
                                    {ser.bodyPart.replace("_", " ")}
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 bg-stone-50 text-stone-400 border border-stone-200 rounded-lg font-semibold uppercase tracking-wider text-[9px]">
                                    General
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-4 text-stone-500 font-medium text-xs">{ser.duration || 30} min</td>
                              <td className="px-5 py-4">
                                {ser.offerPrice !== null && ser.offerPrice !== undefined ? (
                                  <div className="flex flex-col">
                                    <span className="font-bold text-stone-900">₹{ser.offerPrice}</span>
                                    <span className="text-[10px] text-stone-400 line-through">₹{ser.price}</span>
                                  </div>
                                ) : (
                                  <span className="font-bold text-stone-900">₹{ser.price}</span>
                                )}
                              </td>
                              <td className="px-5 py-4 text-right space-x-1">
                                <button
                                  onClick={() => openEditServiceModal(ser)}
                                  className="p-2 text-stone-400 hover:text-stone-900 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
                                >
                                  <Edit2 className="size-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteService(ser.id)}
                                  className="p-2 text-stone-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {filteredServices.length === 0 && (
                        <div className="py-14 text-center bg-stone-50/50">
                          <p className="text-stone-400 text-sm italic">
                            {serviceViewTab === "OFFERS" ? "No special offers configured. Click \"Add Special Offer\" above to create one." :
                             serviceViewTab === "COMBOS" ? "No combo packages configured. Click \"Add Combo Offer\" above to create one." :
                             "No services configured yet. Click \"Add Service\" to get started."}
                          </p>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })()}

              {/* TAB: PRODUCTS CRUD */}
              {activeTab === "PRODUCTS" && (
                <div className="space-y-8 font-minimal text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="text-left w-full">
                      <h3 className="font-normal font-luxury text-3xl text-stone-900 tracking-normal">Retail Inventory</h3>
                      <p className="text-sm text-stone-500 mt-1">Manage shelf stock, suppliers, and purchase orders</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (productSubTab === "SHELF") openAddProductModal();
                          else if (productSubTab === "SUPPLIERS") {
                            const name = prompt("Enter supplier name:");
                            if (name) {
                              const contact = prompt("Enter contact person name (optional):") || "";
                              const email = prompt("Enter email (optional):") || "";
                              const phone = prompt("Enter phone (optional):") || "";
                              handleCreateSupplier(name, contact, email, phone);
                            }
                          } else if (productSubTab === "ORDERS") {
                            const supplierId = prompt("Enter Supplier ID (or copy from the Suppliers tab):") || "";
                            if (supplierId) {
                              const notes = prompt("Enter notes (optional):") || "";
                              const pId = prompt("Enter Product ID:") || "";
                              const qty = parseInt(prompt("Enter quantity:") || "0") || 0;
                              const cost = parseFloat(prompt("Enter unit cost price:") || "0") || 0;
                              if (pId && qty > 0) {
                                handleCreatePurchaseOrder(supplierId, notes, [{ productId: pId, quantity: qty, costPrice: cost }]);
                              }
                            }
                          }
                        }}
                        className="px-6 py-3 bg-stone-900 text-white rounded-xl text-xs font-semibold uppercase tracking-widest hover:bg-stone-850 transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer text-center justify-center animate-fade-in"
                      >
                        <Plus className="size-4" /> Add {productSubTab === "SHELF" ? "Product" : productSubTab === "SUPPLIERS" ? "Supplier" : "Purchase Order"}
                      </button>
                    </div>
                  </div>

                  {/* Sub-tab Selection */}
                  <div className="flex border-b border-stone-200 gap-6 text-sm font-semibold mb-6">
                    <button
                      onClick={() => setProductSubTab("SHELF")}
                      className={`pb-3 transition-colors cursor-pointer border-b-2 px-1 ${productSubTab === "SHELF"
                          ? "border-stone-900 text-stone-900 font-bold"
                          : "border-transparent text-stone-400 hover:text-stone-700"
                        }`}
                    >
                      Product Shelf
                    </button>
                    <button
                      onClick={() => setProductSubTab("SUPPLIERS")}
                      className={`pb-3 transition-colors cursor-pointer border-b-2 px-1 ${productSubTab === "SUPPLIERS"
                          ? "border-stone-900 text-stone-900 font-bold"
                          : "border-transparent text-stone-400 hover:text-stone-700"
                        }`}
                    >
                      Supplier Directory
                    </button>
                    <button
                      onClick={() => setProductSubTab("ORDERS")}
                      className={`pb-3 transition-colors cursor-pointer border-b-2 px-1 ${productSubTab === "ORDERS"
                          ? "border-stone-900 text-stone-900 font-bold"
                          : "border-transparent text-stone-400 hover:text-stone-700"
                        }`}
                    >
                      Purchase Orders
                    </button>
                  </div>

                  {/* RENDER SUB-TAB: SHELF */}
                  {productSubTab === "SHELF" && (
                    <div className="overflow-x-auto border border-stone-200 rounded-2xl shadow-xs bg-white">
                      <table className="w-full text-left border-collapse text-sm font-minimal">
                        <thead>
                          <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-widest text-[10px]">
                            <th className="p-6">Product Details</th>
                            <th className="p-6">Supplier</th>
                            <th className="p-6">SKU / Code</th>
                            <th className="p-6">Cost / Price</th>
                            <th className="p-6">Stock Status</th>
                            <th className="p-6">Quick Adjust</th>
                            <th className="p-6 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-200 bg-transparent">
                          {products.map(prod => {
                            const limit = prod.lowStockThreshold ?? 5;
                            const isLowStock = prod.trackStock && (prod.stockQty ?? 0) < limit && (prod.stockQty ?? 0) > 0;
                            const isOutOfStock = prod.trackStock && (prod.stockQty ?? 0) === 0;
                            const supplierName = suppliers.find(s => s.id === prod.supplierId)?.name || "—";

                            return (
                              <tr key={prod.id} className="hover:bg-stone-50/50 transition-colors text-stone-600">
                                <td className="p-6">
                                  <div className="flex items-center gap-3">
                                    {prod.imageUrl ? (
                                      <img src={prod.imageUrl} alt={prod.name} className="w-10 h-10 rounded-lg object-cover border border-stone-200" />
                                    ) : (
                                      <div className="w-10 h-10 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400 font-bold text-xs uppercase">
                                        {prod.name.slice(0, 2)}
                                      </div>
                                    )}
                                    <div>
                                      <div className="font-semibold text-stone-900">{prod.name}</div>
                                      {prod.description && <div className="text-stone-400 text-[10px] mt-0.5">{prod.description}</div>}
                                    </div>
                                  </div>
                                </td>
                                <td className="p-6 text-xs text-stone-500">
                                  {supplierName}
                                </td>
                                <td className="p-6 font-mono text-xs text-stone-500">
                                  {prod.sku || "—"}
                                </td>
                                <td className="p-6 font-semibold text-stone-900">
                                  <div className="text-xs text-stone-400">Cost: ₹{prod.costPrice || 0}</div>
                                  <div>Price: ₹{prod.price}</div>
                                </td>
                                <td className="p-6">
                                  {!prod.trackStock ? (
                                    <span className="px-2.5 py-1 text-[10px] font-semibold bg-stone-100 text-stone-500 rounded-full border border-stone-200/50">
                                      Not Tracked
                                    </span>
                                  ) : isOutOfStock ? (
                                    <span className="px-2.5 py-1 text-[10px] font-semibold bg-rose-50 text-rose-600 rounded-full border border-rose-100 animate-pulse">
                                      Out of Stock (0)
                                    </span>
                                  ) : isLowStock ? (
                                    <span className="px-2.5 py-1 text-[10px] font-semibold bg-rose-50 text-rose-600 rounded-full border border-rose-100">
                                      Low Stock ({prod.stockQty}) <span className="text-[8px] opacity-75">Limit: {limit}</span>
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-1 text-[10px] font-semibold bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                                      In Stock ({prod.stockQty})
                                    </span>
                                  )}
                                </td>
                                <td className="p-6">
                                  {prod.trackStock && (
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => handleQuickRestock(prod.id, 10)}
                                        className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                                        title="Add 10 items to stock"
                                      >
                                        +10
                                      </button>
                                      <button
                                        onClick={() => handleQuickRestock(prod.id, 1)}
                                        className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                                        title="Add 1 item to stock"
                                      >
                                        +1
                                      </button>
                                      <button
                                        onClick={() => handleQuickRestock(prod.id, -1)}
                                        className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                                        title="Remove 1 item from stock"
                                        disabled={(prod.stockQty ?? 0) <= 0}
                                      >
                                        -1
                                      </button>
                                    </div>
                                  )}
                                </td>
                                <td className="p-6 text-right space-x-2">
                                  <button
                                    onClick={() => openEditProductModal(prod)}
                                    className="p-2.5 text-stone-400 hover:text-stone-900 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
                                  >
                                    <Edit2 className="size-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(prod.id)}
                                    className="p-2.5 text-stone-400 hover:text-stone-900 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="size-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {products.length === 0 && (
                        <p className="text-stone-400 text-sm italic py-12 text-center bg-stone-50/50">No products configured yet.</p>
                      )}
                    </div>
                  )}

                  {/* RENDER SUB-TAB: SUPPLIERS */}
                  {productSubTab === "SUPPLIERS" && (
                    <div className="overflow-x-auto border border-stone-200 rounded-2xl shadow-xs bg-white">
                      <table className="w-full text-left border-collapse text-sm font-minimal">
                        <thead>
                          <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-widest text-[10px]">
                            <th className="p-6">Supplier ID</th>
                            <th className="p-6">Supplier Name</th>
                            <th className="p-6">Contact Representative</th>
                            <th className="p-6">Email / Phone</th>
                            <th className="p-6 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-200 bg-transparent">
                          {suppliers.map(sup => (
                            <tr key={sup.id} className="hover:bg-stone-50/50 transition-colors text-stone-600">
                              <td className="p-6 font-mono text-xs text-stone-400">
                                {sup.id}
                              </td>
                              <td className="p-6 font-semibold text-stone-900">
                                {sup.name}
                              </td>
                              <td className="p-6 font-medium">
                                {sup.contactName || "—"}
                              </td>
                              <td className="p-6 text-stone-500">
                                <div>{sup.email || "—"}</div>
                                <div className="text-xs">{sup.phone || "—"}</div>
                              </td>
                              <td className="p-6 text-right">
                                <button
                                  onClick={() => {
                                    const newName = prompt("Update name:", sup.name);
                                    if (newName) {
                                      const contact = prompt("Update contact person:", sup.contactName || "") || "";
                                      const email = prompt("Update email:", sup.email || "") || "";
                                      const phone = prompt("Update phone:", sup.phone || "") || "";
                                      fetch(`/api/products/suppliers?id=${sup.id}`, {
                                        method: "PATCH",
                                        headers: { "Content-Type": "application/json", "x-tenant-slug": tenantSlug },
                                        body: JSON.stringify({ name: newName, contactName: contact, email, phone }),
                                      }).then(() => fetchSuppliers());
                                    }
                                  }}
                                  className="p-2 text-stone-400 hover:text-stone-900 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer mr-2 inline-block"
                                >
                                  <Edit2 className="size-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteSupplier(sup.id)}
                                  className="p-2 text-stone-400 hover:text-stone-900 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer inline-block"
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {suppliers.length === 0 && (
                        <p className="text-stone-400 text-sm italic py-12 text-center bg-stone-50/50">No suppliers added yet. Click "Add Supplier" above.</p>
                      )}
                    </div>
                  )}

                  {/* RENDER SUB-TAB: ORDERS */}
                  {productSubTab === "ORDERS" && (
                    <div className="overflow-x-auto border border-stone-200 rounded-2xl shadow-xs bg-white">
                      <table className="w-full text-left border-collapse text-sm font-minimal">
                        <thead>
                          <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-widest text-[10px]">
                            <th className="p-6">Order ID</th>
                            <th className="p-6">Supplier</th>
                            <th className="p-6">Total Cost</th>
                            <th className="p-6">Status</th>
                            <th className="p-6">Items Requested</th>
                            <th className="p-6 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-200 bg-transparent">
                          {purchaseOrders.map(po => (
                            <tr key={po.id} className="hover:bg-stone-50/50 transition-colors text-stone-600">
                              <td className="p-6 font-mono text-xs text-stone-400">
                                {po.id}
                                <div className="text-[10px] text-stone-300 font-sans mt-0.5">{new Date(po.createdAt).toLocaleDateString()}</div>
                              </td>
                              <td className="p-6 font-semibold text-stone-900">
                                {po.supplier?.name || "—"}
                              </td>
                              <td className="p-6 font-bold text-stone-900">
                                ₹{po.totalAmount}
                              </td>
                              <td className="p-6">
                                <span className={`px-2.5 py-1 text-[10px] font-semibold rounded-full border ${po.status === "RECEIVED" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                    po.status === "ORDERED" ? "bg-cyan-50 text-cyan-600 border-cyan-100" :
                                      po.status === "CANCELLED" ? "bg-rose-50 text-rose-600 border-rose-100" :
                                        "bg-stone-100 text-stone-500 border-stone-200"
                                  }`}>
                                  {po.status}
                                </span>
                              </td>
                              <td className="p-6 text-xs font-semibold text-stone-700">
                                {po.items?.map((item: any, idx: number) => (
                                  <div key={idx}>
                                    • {item.product?.name || "Product"} (x{item.quantity}) @ ₹{item.costPrice}
                                  </div>
                                ))}
                              </td>
                              <td className="p-6 text-right space-x-2">
                                {po.status === "DRAFT" && (
                                  <button
                                    onClick={() => handleUpdatePurchaseOrderStatus(po.id, "ORDERED")}
                                    className="px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 text-[10px] font-semibold uppercase tracking-wider rounded-lg border border-cyan-200 transition-colors cursor-pointer"
                                  >
                                    Mark Ordered
                                  </button>
                                )}
                                {po.status === "ORDERED" && (
                                  <button
                                    onClick={() => handleUpdatePurchaseOrderStatus(po.id, "RECEIVED")}
                                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-semibold uppercase tracking-wider rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                                  >
                                    Receive Inventory
                                  </button>
                                )}
                                {po.status !== "RECEIVED" && po.status !== "CANCELLED" && (
                                  <button
                                    onClick={() => handleUpdatePurchaseOrderStatus(po.id, "CANCELLED")}
                                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 text-[10px] font-semibold uppercase tracking-wider rounded-lg border border-rose-200 transition-colors cursor-pointer"
                                  >
                                    Cancel PO
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {purchaseOrders.length === 0 && (
                        <p className="text-stone-400 text-sm italic py-12 text-center bg-stone-50/50">No purchase orders drafted. Enter a supplier ID above to draft an order.</p>
                      )}
                    </div>
                  )}
                </div>
              )}            {/* TAB: SUBSCRIPTIONS */}
              {activeTab === "SUBSCRIPTIONS" && (
                <div className="space-y-8 font-minimal text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="text-left w-full">
                      <h3 className="font-normal font-luxury text-3xl text-stone-900 tracking-normal">VIP Membership Packages</h3>
                      <p className="text-sm text-stone-500 mt-1">Manage prepaid passes, VIP memberships, and special bundles</p>
                    </div>
                    <button
                      onClick={openAddSubModal}
                      className="px-6 py-3 bg-stone-900 text-white rounded-xl text-xs font-semibold uppercase tracking-widest hover:bg-stone-850 transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <Plus className="size-4" /> Add Package
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {subscriptions.map(sub => (
                      <div key={sub.id} className="p-6 bg-stone-50/50 border border-stone-200 rounded-2xl flex flex-col justify-between gap-5 text-left hover:border-stone-400 transition-all shadow-xs">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] font-semibold text-stone-700 uppercase tracking-widest px-2.5 py-1 bg-stone-100 rounded-full border border-stone-200/80">{sub.duration}</span>
                              <h4 className="font-semibold text-lg text-stone-900 tracking-tight mt-2">{sub.name}</h4>
                            </div>
                            <span className="text-xl font-bold text-stone-950">₹{sub.price}</span>
                          </div>
                          <p className="text-xs text-stone-500 leading-relaxed font-minimal">{sub.description}</p>
                        </div>
                        <div className="flex justify-end gap-2 border-t border-stone-200 pt-4">
                          <button
                            onClick={() => openEditSubModal(sub)}
                            className="p-2.5 text-stone-400 hover:text-stone-900 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
                          >
                            <Edit2 className="size-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSub(sub.id)}
                            className="p-2.5 text-stone-400 hover:text-stone-900 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {subscriptions.length === 0 && (
                      <p className="col-span-full text-stone-450 text-xs italic py-12 text-center bg-stone-50/50 border border-dashed border-stone-200 rounded-2xl">No subscriptions or passes configured yet.</p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: COUPONS */}
              {activeTab === "COUPONS" && (
                <div className="space-y-8 font-minimal text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="text-left w-full">
                      <h3 className="font-normal font-luxury text-3xl text-stone-900 tracking-normal">Active Coupon Registry</h3>
                      <p className="text-sm text-stone-500 mt-1">Configure discounts, minimum bill criteria, and promotional campaigns</p>
                    </div>
                    <button
                      onClick={openAddCouponModal}
                      className="px-6 py-3 bg-stone-900 text-white rounded-xl text-xs font-semibold uppercase tracking-widest hover:bg-stone-850 transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <Plus className="size-4" /> Add Coupon
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-stone-200 rounded-2xl shadow-xs">
                    <table className="w-full text-left border-collapse text-sm font-minimal">
                      <thead>
                        <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-widest text-[10px]">
                          <th className="p-6">Code</th>
                          <th className="p-6">Discount %</th>
                          <th className="p-6">Min Bill / Max Cap</th>
                          <th className="p-6">Expiry</th>
                          <th className="p-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200 bg-transparent">
                        {coupons.map(cpn => (
                          <tr key={cpn.id} className="hover:bg-stone-50/50 transition-colors text-stone-600">
                            <td className="p-6">
                              <span className="font-semibold text-stone-900 bg-stone-100 border border-stone-200 px-3 py-1.5 rounded-lg font-mono text-[10px] uppercase tracking-wider">{cpn.code}</span>
                            </td>
                            <td className="p-6 font-semibold text-emerald-800 text-base">{cpn.discountPercent}% OFF</td>
                            <td className="p-6 text-xs font-minimal">
                              Min. Bill: <span className="font-semibold text-stone-900">₹{cpn.minBill}</span><br />
                              Max. Cap: <span className="font-semibold text-stone-900">₹{cpn.maxDiscount}</span>
                            </td>
                            <td className="p-6 text-xs text-stone-500 font-medium">{cpn.expiryDate}</td>
                            <td className="p-6 text-right space-x-2">
                              <button
                                onClick={() => openEditCouponModal(cpn)}
                                className="p-2.5 text-stone-400 hover:text-stone-900 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
                              >
                                <Edit2 className="size-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCoupon(cpn.id)}
                                className="p-2.5 text-stone-400 hover:text-stone-900 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {coupons.length === 0 && (
                      <p className="text-slate-450 text-base italic py-12 text-center bg-slate-950/10">No dynamic coupons configured yet.</p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: WHATSAPP INTEGRATION */}
              {activeTab === "WHATSAPP" && (
                <WhatsAppModule
                  whatsAppConnected={whatsAppConnected}
                  whatsAppQr={whatsAppSessionQr}
                  whatsAppPhoneNumber={whatsAppDeviceNumber}
                  isWaSyncing={isGeneratingQR || isConnecting}
                  disconnectWhatsApp={disconnectWhatsApp}
                  waConnectionType={waConnectionType === "UNOFFICIAL" ? "SESSION" : "OFFICIAL"}
                  setWaConnectionType={(val) => setWaConnectionType(val === "SESSION" ? "UNOFFICIAL" : "OFFICIAL")}
                  metaAccessToken={metaAccessToken}
                  setMetaAccessToken={setMetaAccessToken}
                  metaPhoneNumberId={metaPhoneNumberId}
                  setMetaPhoneNumberId={setMetaPhoneNumberId}
                  metaBusinessAccountId={metaBusinessAccountId}
                  setMetaBusinessAccountId={setMetaBusinessAccountId}
                  metaVerifyToken={metaVerifyToken}
                  setMetaVerifyToken={setMetaVerifyToken}
                  isSessionConfigSaving={isSessionConfigSaving}
                  saveSessionConfig={saveSessionConfig}
                  isAddingRule={isAddingRule}
                  setIsAddingRule={setIsAddingRule}
                  newRuleTrigger={newRuleTrigger}
                  setNewRuleTrigger={setNewRuleTrigger}
                  newRuleKeywords={newRuleKeywords}
                  setNewRuleKeywords={setNewRuleKeywords}
                  newRuleReply={newRuleReply}
                  setNewRuleReply={setNewRuleReply}
                  isSavingRule={isSavingRule}
                  saveAutoReplyRule={saveAutoReplyRule}
                  autoReplyRules={autoReplyRules}
                  deleteAutoReplyRule={deleteAutoReplyRule}
                  stealthHumanTyping={stealthHumanTyping}
                  setStealthHumanTyping={setStealthHumanTyping}
                  stealthRandomJitter={stealthRandomJitter}
                  setStealthRandomJitter={setStealthRandomJitter}
                  stealthSpintaxSuffix={stealthSpintaxSuffix}
                  setStealthSpintaxSuffix={setStealthSpintaxSuffix}
                  stealthNaturalHours={stealthNaturalHours}
                  setStealthNaturalHours={setStealthNaturalHours}
                  whatsAppTemplates={whatsAppTemplates}
                  handleResetTemplates={handleResetTemplates}
                  openAddOtpTemplateModal={openAddOtpTemplateModal}
                  openAddTemplateModal={openAddTemplateModal}
                  openEditTemplateModal={openEditTemplateModal}
                  handleDeleteTemplate={handleDeleteTemplate}
                  formatTemplatePreview={formatTemplatePreview}
                  simulationSuccess={simulationSuccess}
                  simulatedName={simulatedName}
                  setSimulatedName={setSimulatedName}
                  simulatedPhone={simulatedPhone}
                  setSimulatedPhone={setSimulatedPhone}
                  simulatedCampaignType={simulatedCampaignType}
                  setSimulatedCampaignType={setSimulatedCampaignType}
                  handleSimulateCampaign={handleSimulateCampaign}
                  whatsAppLogs={whatsAppLogs}
                  tenantSlug={tenantSlug}
                  birthdayWishTemplate={birthdayWishTemplate}
                  setBirthdayWishTemplate={setBirthdayWishTemplate}
                  birthdayCouponCode={birthdayCouponCode}
                  setBirthdayCouponCode={setBirthdayCouponCode}
                  isSavingBirthdaySettings={isSavingBirthdaySettings}
                  saveBirthdaySettings={saveBirthdaySettings}
                />
              )}


              {/* TAB: DAILY SUMMARY REPORTS */}
              {activeTab === "REPORTS" && (
                <ReportsModule
                  reportsData={reportsData}
                  reportsLoading={reportsLoading}
                  dailyRevenue={dailyRevenue}
                  outletPerformance={outletPerformance}
                  staffPerformance={staffPerformance}
                  servicePopularity={servicePopularity}
                  retentionStats={retentionStats}
                  bookingAnalytics={bookingAnalytics}
                  revenueForecast={revenueForecast}
                  gstrReport={gstrReport}
                  activeReportSubTab={activeReportSubTab}
                  setActiveReportSubTab={setActiveReportSubTab}
                  hoveredBarIndex={hoveredBarIndex}
                  setHoveredBarIndex={setHoveredBarIndex}
                  salesRangeDays={salesRangeDays}
                  setSalesRangeDays={setSalesRangeDays}
                  handleExportCSV={handleExportCSV}
                  tenantSlug={tenantSlug}
                />
              )}


              {activeTab === "SCHEDULE" && (
                <div className="space-y-6 text-left animate-fadeIn">
                  <div>
                    <h3 className="font-normal font-luxury text-3xl text-stone-900 tracking-normal">Staff & Schedule Center</h3>
                    <p className="text-sm text-stone-500 mt-1">Manage appointment calendar bookings, staff schedules, and configure stylists team details</p>
                  </div>

                  {/* Sub-tab Selection */}
                  <div className="flex border-b border-stone-200 gap-6 text-sm font-semibold mb-6">
                    <button
                      onClick={() => setScheduleSubTab("CALENDAR")}
                      className={`pb-3 transition-colors cursor-pointer border-b-2 px-1 ${
                        scheduleSubTab === "CALENDAR"
                          ? "border-stone-900 text-stone-900 font-bold"
                          : "border-transparent text-stone-400 hover:text-stone-700"
                      }`}
                    >
                      Shift Calendar
                    </button>
                    <button
                      onClick={() => setScheduleSubTab("TEAM")}
                      className={`pb-3 transition-colors cursor-pointer border-b-2 px-1 ${
                        scheduleSubTab === "TEAM"
                          ? "border-stone-900 text-stone-900 font-bold"
                          : "border-transparent text-stone-400 hover:text-stone-700"
                      }`}
                    >
                      Team Members
                    </button>
                  </div>

                  {scheduleSubTab === "CALENDAR" && (
                    <AppointmentCalendar tenantSlug={tenantSlug} outletId={selectedOutletId} />
                  )}

                  {scheduleSubTab === "TEAM" && (
                    <div className="space-y-6 animate-fadeIn">
                      {/* Header */}
                      <div className="flex justify-between items-center bg-stone-50 border border-stone-200 p-4.5 rounded-2xl">
                        <div>
                          <h4 className="font-semibold text-sm text-stone-900">Staff & Team Management</h4>
                          <p className="text-[11px] text-stone-500 font-medium">Configure roles, permissions, outlet assignments, and stylist specializations</p>
                        </div>
                        <button
                          type="button"
                          onClick={openAddUserModal}
                          className="py-2 px-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        >
                          <Plus className="size-4" /> Add Team Member
                        </button>
                      </div>

                      {/* Team Members List */}
                      <div className="space-y-2">
                        <span className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Active Team Members & Accounts</span>
                        <div className="grid grid-cols-1 gap-2.5">
                          {teamLoading ? (
                            <div className="text-center py-10">
                              <Sparkles className="size-6 text-stone-400 animate-spin mx-auto mb-2" />
                              <p className="text-xs text-stone-400 italic">Syncing with backend team database...</p>
                            </div>
                          ) : teamUsers.length === 0 ? (
                            <div className="p-8 text-center bg-white border border-stone-200 border-dashed rounded-2xl">
                              <p className="text-xs text-stone-400 italic">No backend users registered. Create your first team member using the button above!</p>
                            </div>
                          ) : (
                            teamUsers
                              .filter(u => !u.outletId || u.outletId === selectedOutletId)
                              .map((user) => (
                                <div key={user.id} className="p-3.5 bg-white border border-stone-205 rounded-xl flex items-center justify-between gap-4 hover:shadow-xs transition-all">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-stone-100 border border-stone-200 text-[11px] font-extrabold flex items-center justify-center text-stone-700 shrink-0">
                                      {user.name.split(" ").map((w: any) => w[0]).join("").toUpperCase().slice(0, 2)}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-extrabold text-sm text-stone-850 block">{user.name}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                          user.role === 'STYLIST'
                                            ? 'bg-purple-50 text-purple-700 border border-purple-200/50'
                                            : user.role === 'MANAGER'
                                            ? 'bg-blue-50 text-blue-700 border border-blue-200/50'
                                            : 'bg-stone-100 text-stone-750 border border-stone-200/50'
                                        }`}>
                                          {user.role}
                                        </span>
                                        {!user.isActive && (
                                          <span className="bg-rose-50 text-rose-700 border border-rose-200/50 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                                            Inactive
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-[10px] text-stone-400 font-semibold block mt-0.5">{user.email} • {user.phone}</span>
                                      {user.role === "STYLIST" && user.staffProfile && (
                                        <div className="flex items-center gap-1.5 mt-1">
                                          <span className="text-[9px] text-stone-450 font-medium">Specialty: {user.staffProfile.specializations || "General Stylist"}</span>
                                          <span className="text-stone-300">•</span>
                                          <span className="text-[9px] text-amber-600 font-semibold flex items-center gap-0.5">★ {user.staffProfile.rating || 5.0}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => openEditUserModal(user)}
                                      className="p-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-600 rounded-lg transition-all cursor-pointer"
                                      title="Edit User Profile"
                                    >
                                      <Edit2 className="size-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteUser(user.id)}
                                      className="p-1.5 bg-stone-50 hover:bg-rose-50 border border-stone-200 hover:border-rose-200 text-stone-650 hover:text-rose-650 rounded-lg transition-all cursor-pointer"
                                      title="Delete User"
                                    >
                                      <Trash2 className="size-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "LOYALTY" && (
                <LoyaltyModule tenantSlug={tenantSlug} />
              )}

              {/* TAB: WEBSITE CMS CUSTOMIZATION */}
              {activeTab === "CMS" && (
                <CMSModule
                  businessName={businessName}
                  setBusinessName={setBusinessName}
                  logoUrl={logoUrl}
                  setLogoUrl={setLogoUrl}
                  tagline={tagline}
                  setTagline={setTagline}
                  subtitle={subtitle}
                  setSubtitle={setSubtitle}
                  activeTemplate={activeTemplate}
                  setActiveTemplate={setActiveTemplate}
                  accentColor={accentColor}
                  setAccentColor={setAccentColor}
                  customTextColor={customTextColor}
                  setCustomTextColor={setCustomTextColor}
                  customHeadingColor={customHeadingColor}
                  setCustomHeadingColor={setCustomHeadingColor}
                  customButtonColor={customButtonColor}
                  setCustomButtonColor={setCustomButtonColor}
                  campaignCouponCode={campaignCouponCode}
                  setCampaignCouponCode={setCampaignCouponCode}
                  campaignDiscountPercent={campaignDiscountPercent}
                  setCampaignDiscountPercent={setCampaignDiscountPercent}
                  selectedOutletId={selectedOutletId}
                  cmsOutlets={cmsOutlets}
                  setCmsOutlets={setCmsOutlets}
                  newOutletName={newOutletName}
                  setNewOutletName={setNewOutletName}
                  newOutletAddress={newOutletAddress}
                  setNewOutletAddress={setNewOutletAddress}
                  newOutletPhone={newOutletPhone}
                  setNewOutletPhone={setNewOutletPhone}
                  newOutletTimings={newOutletTimings}
                  setNewOutletTimings={setNewOutletTimings}
                  activeCmsOutletId={activeCmsOutletId}
                  handleSwitchOutlet={handleSwitchOutlet}
                  sections={sections}
                  setSections={setSections}
                  selectedSectionId={selectedSectionId}
                  setSelectedSectionId={setSelectedSectionId}
                  services={services}
                  activePreviewOutlet={activePreviewOutlet}
                  previewDevice={previewDevice}
                  setPreviewDevice={setPreviewDevice}
                  handleSaveCMSConfig={handleSaveCMSConfig}
                  cmsSaveLoading={cmsSaveLoading}
                  cmsSaveSuccess={cmsSaveSuccess}
                  cmsSubTab={cmsSubTab}
                  setCmsSubTab={setCmsSubTab}
                  tenantSlug={tenantSlug}
                  useCustomCode={useCustomCode}
                  setUseCustomCode={setUseCustomCode}
                  customHtml={customHtml}
                  setCustomHtml={setCustomHtml}
                  customCss={customCss}
                  setCustomCss={setCustomCss}
                  customJs={customJs}
                  setCustomJs={setCustomJs}
                />
              )}


              {/* TAB: AUDIT LOGS & ARCHIVE */}
              {activeTab === "AUDIT" && (
                <div className="space-y-8 font-minimal text-left">
                  <div className="text-left w-full">
                    <h3 className="font-normal font-luxury text-3xl text-stone-900 tracking-normal">Audit Logs & Archives</h3>
                    <p className="text-sm text-stone-500 mt-1">Review historical invoices generated and customer bookings with multi-tier filters</p>
                  </div>

                  {/* Segmented Controller (Tabs switch) */}
                  <div className="flex gap-2.5 p-1 bg-stone-100 rounded-xl w-max border border-stone-250/50">
                    <button
                      type="button"
                      onClick={() => {
                        setAuditType("bookings");
                        setAuditLoading(true);
                      }}
                      className={`px-5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer border-none ${auditType === "bookings"
                          ? "bg-white text-stone-900 shadow-xs border border-stone-200/80"
                          : "text-stone-500 hover:text-stone-800 bg-transparent"
                        }`}
                    >
                      📋 Bookings Log
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuditType("invoices");
                        setAuditLoading(true);
                      }}
                      className={`px-5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer border-none ${auditType === "invoices"
                          ? "bg-white text-stone-900 shadow-xs border border-stone-200/80"
                          : "text-stone-500 hover:text-stone-800 bg-transparent"
                        }`}
                    >
                      🧾 Invoices Log
                    </button>
                  </div>

                  {/* Filters Block */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-5 bg-stone-50 border border-stone-200/80 rounded-2xl">
                    {/* Search */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="block text-[9px] font-bold text-stone-400 uppercase tracking-widest">Search Query</label>
                      <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400" />
                        <input
                          type="text"
                          placeholder={auditType === "bookings" ? "Search by customer or stylist..." : "Search by invoice #, customer name/phone..."}
                          value={auditType === "bookings" ? auditBookingsSearch : auditInvoicesSearch}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (auditType === "bookings") {
                              setAuditBookingsSearch(val);
                              setAuditBookingsPage(1);
                            } else {
                              setAuditInvoicesSearch(val);
                              setAuditInvoicesPage(1);
                            }
                          }}
                          className="w-full bg-white border border-stone-200 focus:border-stone-805 rounded-xl py-2.5 pl-9 pr-4 text-xs text-stone-900 outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Status Filter */}
                    <div className="space-y-1.5">
                      <label className="block text-[9px] font-bold text-stone-400 uppercase tracking-widest">Filter Status</label>
                      <select
                        value={auditType === "bookings" ? auditBookingsStatus : auditInvoicesStatus}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (auditType === "bookings") {
                            setAuditBookingsStatus(val);
                            setAuditBookingsPage(1);
                          } else {
                            setAuditInvoicesStatus(val);
                            setAuditInvoicesPage(1);
                          }
                        }}
                        className="w-full bg-white border border-stone-200 focus:border-stone-850 rounded-xl p-2.5 text-xs font-semibold text-stone-700 outline-none cursor-pointer hover:bg-stone-50 transition-colors"
                      >
                        <option value="">All Statuses</option>
                        {auditType === "bookings" ? (
                          <>
                            <option value="PENDING">PENDING</option>
                            <option value="CONFIRMED">CONFIRMED</option>
                            <option value="COMPLETED">COMPLETED</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </>
                        ) : (
                          <>
                            <option value="DRAFT">DRAFT</option>
                            <option value="PAID">PAID</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </>
                        )}
                      </select>
                    </div>

                    {/* Date Picker (From Date) */}
                    <div className="space-y-1.5">
                      <label className="block text-[9px] font-bold text-stone-400 uppercase tracking-widest">Fixed From Date</label>
                      <input
                        type="date"
                        value={auditType === "bookings" ? auditBookingsFromDate : auditInvoicesFromDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (auditType === "bookings") {
                            setAuditBookingsFromDate(val);
                            setAuditBookingsPage(1);
                          } else {
                            setAuditInvoicesFromDate(val);
                            setAuditInvoicesPage(1);
                          }
                        }}
                        className="w-full bg-white border border-stone-200 focus:border-stone-850 rounded-xl p-2 text-xs font-semibold text-stone-700 outline-none cursor-pointer hover:bg-stone-50 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Data Content */}
                  {auditLoading ? (
                    <div className="space-y-4 py-8">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-stone-50 border border-stone-200/80 rounded-2xl animate-pulse" />
                      ))}
                    </div>
                  ) : auditType === "bookings" ? (
                    // BOOKINGS LOG TAB VIEW
                    <div className="space-y-4">
                      {auditBookings.length === 0 ? (
                        <div className="py-16 text-center border border-dashed border-stone-200 rounded-2xl space-y-2">
                          <p className="text-stone-400 text-xs italic font-minimal">No bookings logged matching selection criteria.</p>
                        </div>
                      ) : (
                        <div className="border border-stone-200/80 rounded-2xl overflow-x-auto bg-white shadow-xs">
                          <table className="min-w-full divide-y divide-stone-200">
                            <thead className="bg-stone-50">
                              <tr>
                                <th className="px-6 py-4.5 text-left text-[9px] font-extrabold text-stone-450 uppercase tracking-widest">Scheduled Date</th>
                                <th className="px-6 py-4.5 text-left text-[9px] font-extrabold text-stone-450 uppercase tracking-widest">Customer Details</th>
                                <th className="px-6 py-4.5 text-left text-[9px] font-extrabold text-stone-450 uppercase tracking-widest">Assigned Stylist</th>
                                <th className="px-6 py-4.5 text-left text-[9px] font-extrabold text-stone-450 uppercase tracking-widest">Service Name</th>
                                <th className="px-6 py-4.5 text-left text-[9px] font-extrabold text-stone-450 uppercase tracking-widest">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-150 text-xs text-stone-750">
                              {auditBookings.map((b: any) => (
                                <tr key={b.id} className="hover:bg-stone-50/50 transition-colors">
                                  <td className="px-6 py-4 whitespace-nowrap font-medium text-stone-900">
                                    {new Date(b.scheduledAt).toLocaleString()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="font-semibold text-stone-900">{b.customer?.name || b.customerName || "Walk-in Customer"}</div>
                                    <div className="text-[10px] text-stone-400">{b.customer?.phone || b.phone || ""}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap font-medium text-stone-600">
                                    {b.staff?.name || b.stylistName || "Any Stylist"}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap font-medium text-stone-850">
                                    {b.items?.[0]?.service?.name || b.serviceName || "Salon Service"}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${b.status === "COMPLETED" ? "bg-emerald-50 text-emerald-800 border-emerald-250" :
                                        b.status === "CONFIRMED" ? "bg-blue-50 text-blue-800 border-blue-250" :
                                          b.status === "CANCELLED" ? "bg-rose-50 text-rose-800 border-rose-250" :
                                            "bg-amber-50 text-amber-800 border-amber-250"
                                      }`}>
                                      {b.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Pagination control */}
                      {auditBookingsTotal > 0 && (
                        <div className="flex justify-between items-center text-xs text-stone-500 pt-3">
                          <span>Showing page {auditBookingsPage} of {Math.ceil(auditBookingsTotal / 10)} ({auditBookingsTotal} records total)</span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={auditBookingsPage <= 1}
                              onClick={() => setAuditBookingsPage(prev => prev - 1)}
                              className="px-3 py-1.5 border border-stone-200 rounded-lg hover:bg-stone-50 text-stone-700 disabled:opacity-50 transition-all cursor-pointer font-semibold bg-white"
                            >
                              Previous
                            </button>
                            <button
                              type="button"
                              disabled={auditBookingsPage >= Math.ceil(auditBookingsTotal / 10)}
                              onClick={() => setAuditBookingsPage(prev => prev + 1)}
                              className="px-3 py-1.5 border border-stone-200 rounded-lg hover:bg-stone-50 text-stone-700 disabled:opacity-50 transition-all cursor-pointer font-semibold bg-white"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    // INVOICES LOG TAB VIEW
                    <div className="space-y-4">
                      {auditInvoices.length === 0 ? (
                        <div className="py-16 text-center border border-dashed border-stone-200 rounded-2xl space-y-2">
                          <p className="text-stone-400 text-xs italic font-minimal">No invoices generated matching selection criteria.</p>
                        </div>
                      ) : (
                        <div className="border border-stone-200/80 rounded-2xl overflow-x-auto bg-white shadow-xs">
                          <table className="min-w-full divide-y divide-stone-200">
                            <thead className="bg-stone-50">
                              <tr>
                                <th className="px-6 py-4.5 text-left text-[9px] font-extrabold text-stone-450 uppercase tracking-widest">Invoice Number</th>
                                <th className="px-6 py-4.5 text-left text-[9px] font-extrabold text-stone-450 uppercase tracking-widest">Billing Date</th>
                                <th className="px-6 py-4.5 text-left text-[9px] font-extrabold text-stone-450 uppercase tracking-widest">Customer Details</th>
                                <th className="px-6 py-4.5 text-left text-[9px] font-extrabold text-stone-450 uppercase tracking-widest">Payment Mode</th>
                                <th className="px-6 py-4.5 text-right text-[9px] font-extrabold text-stone-450 uppercase tracking-widest">Total Bill</th>
                                <th className="px-6 py-4.5 text-left text-[9px] font-extrabold text-stone-450 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4.5 text-left text-[9px] font-extrabold text-stone-450 uppercase tracking-widest">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-150 text-xs text-stone-750">
                              {auditInvoices.map((inv: any) => (
                                <tr key={inv.id} className="hover:bg-stone-50/50 transition-colors">
                                  <td className="px-6 py-4 whitespace-nowrap font-mono text-stone-900 font-bold">
                                    {inv.invoiceNumber}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-stone-600">
                                    {new Date(inv.createdAt).toLocaleString()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="font-semibold text-stone-900">{inv.customer?.name || "Walk-in Customer"}</div>
                                    <div className="text-[10px] text-stone-400">{inv.customer?.phone || ""}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="bg-stone-100 border border-stone-200 text-stone-600 font-bold px-2 py-0.5 rounded text-[10px]">
                                      {inv.payments?.[0]?.method || "CASH"}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right font-extrabold text-stone-950">
                                    ₹{Number(inv.totalAmount || 0).toFixed(2)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${inv.status === "PAID" ? "bg-emerald-50 text-emerald-800 border-emerald-250" :
                                        inv.status === "CANCELLED" ? "bg-rose-50 text-rose-800 border-rose-250" :
                                          inv.status === "REFUNDED" ? "bg-purple-50 text-purple-800 border-purple-250" :
                                            "bg-amber-50 text-amber-800 border-amber-250"
                                      }`}>
                                      {inv.status}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                                    {processingInvoiceId === inv.id ? (
                                      <span className="flex items-center gap-1.5 text-[10px] text-stone-500 font-bold">
                                        <span className="animate-spin rounded-full h-3 w-3 border-2 border-stone-400 border-t-transparent"></span>
                                        Updating...
                                      </span>
                                    ) : inv.status !== "CANCELLED" && inv.status !== "REFUNDED" ? (
                                      <>
                                        <button
                                          onClick={() => handleUpdateInvoiceStatus(inv.id, "CANCELLED")}
                                          className="px-2.5 py-1 bg-white border border-rose-200 text-rose-600 hover:text-rose-800 rounded hover:bg-rose-50 text-[10px] font-bold transition-all cursor-pointer"
                                          title="Cancel Invoice and restore inventory stock"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          onClick={() => handleUpdateInvoiceStatus(inv.id, "REFUNDED")}
                                          className="px-2.5 py-1 bg-white border border-purple-200 text-purple-600 hover:text-purple-850 rounded hover:bg-purple-50 text-[10px] font-bold transition-all cursor-pointer"
                                          title="Refund Invoice and restore inventory stock"
                                        >
                                          Refund
                                        </button>
                                      </>
                                    ) : (
                                      <span className="text-[10px] text-stone-400 italic font-semibold">No Actions</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Pagination control */}
                      {auditInvoicesTotal > 0 && (
                        <div className="flex justify-between items-center text-xs text-stone-500 pt-3">
                          <span>Showing page {auditInvoicesPage} of {Math.ceil(auditInvoicesTotal / 10)} ({auditInvoicesTotal} records total)</span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={auditInvoicesPage <= 1}
                              onClick={() => setAuditInvoicesPage(prev => prev - 1)}
                              className="px-3 py-1.5 border border-stone-200 rounded-lg hover:bg-stone-50 text-stone-700 disabled:opacity-50 transition-all cursor-pointer font-semibold bg-white"
                            >
                              Previous
                            </button>
                            <button
                              type="button"
                              disabled={auditInvoicesPage >= Math.ceil(auditInvoicesTotal / 10)}
                              onClick={() => setAuditInvoicesPage(prev => prev + 1)}
                              className="px-3 py-1.5 border border-stone-200 rounded-lg hover:bg-stone-50 text-stone-700 disabled:opacity-50 transition-all cursor-pointer font-semibold bg-white"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB: PAYROLL & ATTENDANCE */}
              {activeTab === "PAYROLL" && (
                <div className="space-y-8 font-minimal text-left">
                  <div>
                    <h3 className="font-normal font-luxury text-3xl text-stone-900 tracking-normal">Staff Attendance & Payroll Console</h3>
                    <p className="text-sm text-stone-500 mt-1">Manage stylist check-ins, custom service commission structures, tips, and calculate payroll periods</p>
                  </div>

                  {/* Sub-tabs selector */}
                  <div className="flex border-b border-stone-200 gap-6">
                    {(["attendance", "commissions", "calculator"] as const).map(subTab => (
                      <button
                        key={subTab}
                        onClick={() => setPayrollSubTab(subTab)}
                        className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${payrollSubTab === subTab
                            ? "border-b-2 border-stone-850 text-stone-900"
                            : "text-stone-400 hover:text-stone-600"
                          }`}
                      >
                        {subTab === "attendance" ? "Attendance & Clock-In" : subTab === "commissions" ? "Commission Setup" : "Payroll Periods"}
                      </button>
                    ))}
                  </div>

                  {/* SUBTAB: ATTENDANCE & CLOCK-IN */}
                  {payrollSubTab === "attendance" && (
                    <div className="space-y-6">
                      {/* Clock In / Out action cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Clock-In Card */}
                        <div className="p-6 bg-stone-50/50 border border-stone-200/80 rounded-2xl space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/50 flex items-center justify-center text-amber-600">
                              <Clock className="size-5" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-stone-950 text-sm">Shift Clock-In</h4>
                              <p className="text-[10px] text-stone-400">Record check-in time for active team members</p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="space-y-1">
                              <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest">Select Stylist / Staff</label>
                              <select
                                value={selectedStaffForPayroll}
                                onChange={(e) => setSelectedStaffForPayroll(e.target.value)}
                                className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs font-semibold text-stone-700 outline-none"
                              >
                                <option value="">-- Choose Staff --</option>
                                {teamUsers.map((u: any) => (
                                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest">Shift Notes (Optional)</label>
                              <input
                                type="text"
                                placeholder="e.g. morning shift, weekend cover"
                                value={clockInNotes}
                                onChange={(e) => setClockInNotes(e.target.value)}
                                className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs text-stone-900 outline-none placeholder:text-stone-400"
                              />
                            </div>

                            <button
                              onClick={() => handleClockIn(selectedStaffForPayroll)}
                              disabled={clockingAction || !selectedStaffForPayroll}
                              className="w-full py-3 bg-stone-900 hover:bg-stone-850 text-white font-semibold text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer animate-fadeIn"
                            >
                              <Clock className="size-3.5" />
                              <span>Clock In Staff Shift</span>
                            </button>
                          </div>
                        </div>

                        {/* Clock-Out / Active Shifts Card */}
                        <div className="p-6 bg-stone-50/50 border border-stone-200/80 rounded-2xl space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200/50 flex items-center justify-center text-rose-600">
                              <Clock className="size-5" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-stone-950 text-sm">Active Shifts (Clock Out)</h4>
                              <p className="text-[10px] text-stone-400">Current clocked-in stylists awaiting checkout</p>
                            </div>
                          </div>

                          <div className="space-y-3 overflow-y-auto max-h-[220px] no-scrollbar">
                            {attendanceRecords.filter(r => !r.clockOut).length === 0 ? (
                              <div className="text-center py-8 text-stone-400 text-xs italic">
                                No active clocked-in staff at the moment.
                              </div>
                            ) : (
                              attendanceRecords.filter(r => !r.clockOut).map(r => (
                                <div key={r.id} className="p-4 bg-white border border-stone-200 rounded-xl flex flex-col justify-between gap-3">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h5 className="font-semibold text-stone-900 text-xs">{r.staff?.name}</h5>
                                      <p className="text-[9px] text-stone-400">In: {new Date(r.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                    <span className="text-[8px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded border border-amber-200/50">On Duty</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      placeholder="Notes..."
                                      value={clockOutNotes}
                                      onChange={(e) => setClockOutNotes(e.target.value)}
                                      className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-[11px] text-stone-850 outline-none"
                                    />
                                    <button
                                      onClick={() => handleClockOut(r.id)}
                                      disabled={clockingAction}
                                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[9px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                                    >
                                      Clock Out
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Attendance Log Table */}
                      <div className="space-y-3 bg-white border border-stone-200 rounded-2xl p-6">
                        <h4 className="font-semibold text-stone-900 text-sm">Historical Attendance Records</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-stone-150 text-stone-400 font-bold uppercase tracking-wider">
                                <th className="py-3 font-semibold text-[9px]">Staff Member</th>
                                <th className="py-3 font-semibold text-[9px]">Clock In</th>
                                <th className="py-3 font-semibold text-[9px]">Clock Out</th>
                                <th className="py-3 font-semibold text-[9px]">Hours Worked</th>
                                <th className="py-3 font-semibold text-[9px]">Notes</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                              {attendanceRecords.filter(r => r.clockOut).map(r => {
                                const hours = r.durationMin ? (Number(r.durationMin) / 60).toFixed(2) : "-";
                                return (
                                  <tr key={r.id} className="hover:bg-stone-50/50">
                                    <td className="py-3.5 font-semibold text-stone-900">{r.staff?.name}</td>
                                    <td className="py-3.5 text-stone-500">{new Date(r.clockIn).toLocaleString()}</td>
                                    <td className="py-3.5 text-stone-500">{r.clockOut ? new Date(r.clockOut).toLocaleString() : "-"}</td>
                                    <td className="py-3.5 font-bold text-stone-900">{hours} hrs</td>
                                    <td className="py-3.5 text-stone-450 italic text-[11px] max-w-[200px] truncate">{r.notes || "-"}</td>
                                  </tr>
                                );
                              })}
                              {attendanceRecords.filter(r => r.clockOut).length === 0 && (
                                <tr>
                                  <td colSpan={5} className="text-center py-6 text-stone-400 italic">No attendance logs found.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUBTAB: COMMISSION SETUP */}
                  {payrollSubTab === "commissions" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Setup form */}
                        <div className="md:col-span-1 p-6 bg-stone-50/50 border border-stone-200/80 rounded-2xl space-y-4">
                          <h4 className="font-semibold text-stone-950 text-sm">Add Commission Rule</h4>
                          <p className="text-[10px] text-stone-400 font-medium">Establish custom stylist reward splits. Leave service empty for a default rate split.</p>

                          <div className="space-y-4">
                            <div className="space-y-1">
                              <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest">Stylist / Staff</label>
                              <select
                                value={selectedStaffForPayroll}
                                onChange={(e) => setSelectedStaffForPayroll(e.target.value)}
                                className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs font-semibold text-stone-700 outline-none"
                              >
                                <option value="">-- Select Staff --</option>
                                {teamUsers.map((u: any) => (
                                  <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest">Service Catalog Item</label>
                              <select
                                value={commServiceId}
                                onChange={(e) => setCommServiceId(e.target.value)}
                                className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs font-semibold text-stone-700 outline-none"
                              >
                                <option value="">-- Default Rule (All Services) --</option>
                                {services.map((s: any) => (
                                  <option key={s.id} value={s.id}>{s.name} (₹{s.price})</option>
                                ))}
                              </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest">Reward Model</label>
                                <select
                                  value={commType}
                                  onChange={(e: any) => setCommType(e.target.value)}
                                  className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs font-semibold text-stone-700 outline-none"
                                >
                                  <option value="PERCENTAGE">Percentage (%)</option>
                                  <option value="FLAT">Flat Fee (₹)</option>
                                </select>
                              </div>

                              <div className="space-y-1">
                                <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest">Split Rate</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={commRate}
                                  onChange={(e) => setCommRate(Number(e.target.value))}
                                  className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs text-stone-900 outline-none"
                                />
                              </div>
                            </div>

                            <button
                              onClick={handleUpsertCommission}
                              disabled={commActionLoading || !selectedStaffForPayroll}
                              className="w-full py-3 bg-stone-900 hover:bg-stone-850 text-white font-semibold text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
                            >
                              <Plus className="size-3.5" />
                              <span>Configure Commission Rule</span>
                            </button>
                          </div>
                        </div>

                        {/* Active Rules List */}
                        <div className="md:col-span-2 bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
                          <h4 className="font-semibold text-stone-900 text-sm">Active Stylist Commission Rates</h4>
                          {selectedStaffForPayroll ? (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="border-b border-stone-150 text-stone-400 font-bold uppercase tracking-wider">
                                    <th className="py-3 font-semibold text-[9px]">Service Item</th>
                                    <th className="py-3 font-semibold text-[9px]">Rate Structure</th>
                                    <th className="py-3 font-semibold text-[9px] text-right">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                  {commissionRules.map((rule: any) => {
                                    const svcName = rule.service?.name || "Default (General Fallback)";
                                    const rateDisplay = rule.type === "PERCENTAGE" ? `${rule.rate}%` : `₹${rule.rate}`;
                                    return (
                                      <tr key={rule.id} className="hover:bg-stone-50/50">
                                        <td className="py-3.5 font-semibold text-stone-900">{svcName}</td>
                                        <td className="py-3.5 text-stone-600 font-bold">{rateDisplay}</td>
                                        <td className="py-3.5 text-right">
                                          <button
                                            onClick={() => handleDeleteCommission(rule.id)}
                                            className="text-rose-600 hover:text-rose-800 font-bold uppercase tracking-wider text-[9px] cursor-pointer"
                                          >
                                            Delete
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                  {commissionRules.length === 0 && (
                                    <tr>
                                      <td colSpan={3} className="text-center py-6 text-stone-400 italic">No rules defined for this stylist. Default calculation coefficient applies.</td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="text-center py-12 text-stone-400 text-xs italic">
                              Please select a staff member to view and manage their commission rates.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUBTAB: PAYROLL PERIODS */}
                  {payrollSubTab === "calculator" && (
                    <div className="space-y-6">
                      {/* Period generation drawer / form */}
                      <form onSubmit={handleGeneratePayrollPeriod} className="p-6 bg-stone-50/50 border border-stone-200/80 rounded-2xl space-y-4">
                        <h4 className="font-semibold text-stone-950 text-sm">Generate / Refresh Payroll Period</h4>
                        <p className="text-[10px] text-stone-400">Scrapes clock-in records, stylist commissions, and recorded gratuity tips to form a paid period ledger</p>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="space-y-1">
                            <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest">Select Stylist</label>
                            <select
                              required
                              value={selectedStaffForPayroll}
                              onChange={(e) => setSelectedStaffForPayroll(e.target.value)}
                              className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs font-semibold text-stone-700 outline-none"
                            >
                              <option value="">-- Choose Staff --</option>
                              {teamUsers.map((u: any) => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest">Cycle From Date</label>
                            <input
                              required
                              type="date"
                              value={genPeriodStart}
                              onChange={(e) => setGenPeriodStart(e.target.value)}
                              className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs text-stone-900 outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest">Cycle To Date</label>
                            <input
                              required
                              type="date"
                              value={genPeriodEnd}
                              onChange={(e) => setGenPeriodEnd(e.target.value)}
                              className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs text-stone-900 outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest">Generate</label>
                            <button
                              type="submit"
                              disabled={payrollLoading}
                              className="w-full py-3 bg-stone-900 hover:bg-stone-850 text-white font-semibold text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer h-[46px]"
                            >
                              <Sparkles className="size-3.5" />
                              <span>Generate Period</span>
                            </button>
                          </div>
                        </div>
                      </form>

                      {/* Summary group overview cards */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-stone-900 text-sm">Active Cycles & Summary</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {payrollSummary.map((sum: any) => (
                            <div key={sum.staffId} className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4 hover:border-stone-400 transition-colors">
                              <div className="flex justify-between items-center border-b border-stone-100 pb-3">
                                <span className="font-bold text-stone-900 text-sm">{sum.staffName}</span>
                                <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Salary summary</span>
                              </div>
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="space-y-0.5">
                                  <span className="text-stone-400 block text-[9px] font-bold uppercase tracking-wider">Base Salary</span>
                                  <span className="font-semibold text-stone-850">₹{sum.baseSalary}</span>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-stone-400 block text-[9px] font-bold uppercase tracking-wider">Commissions</span>
                                  <span className="font-semibold text-emerald-600">+₹{sum.totalCommission}</span>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-stone-400 block text-[9px] font-bold uppercase tracking-wider">Tips / Gratuity</span>
                                  <span className="font-semibold text-indigo-600">+₹{sum.totalTips}</span>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-stone-400 block text-[9px] font-bold uppercase tracking-wider">Net Payable</span>
                                  <span className="font-extrabold text-stone-950">₹{sum.netSalary}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Periods List Table */}
                      <div className="space-y-3 bg-white border border-stone-200 rounded-2xl p-6">
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold text-stone-900 text-sm">Generated Period Invoices</h4>
                          <div className="flex gap-2">
                            {["All", "DRAFT", "APPROVED", "PAID"].map(st => (
                              <button
                                key={st}
                                type="button"
                                onClick={() => setPayrollPeriodsFilterStatus(st)}
                                className={`px-3 py-1 text-[9px] font-bold uppercase tracking-wider rounded-lg border transition-all cursor-pointer ${payrollPeriodsFilterStatus === st
                                    ? "bg-stone-900 text-white border-stone-900"
                                    : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
                                  }`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-stone-150 text-stone-400 font-bold uppercase tracking-wider">
                                <th className="py-3 font-semibold text-[9px]">Staff</th>
                                <th className="py-3 font-semibold text-[9px]">Cycle Period</th>
                                <th className="py-3 font-semibold text-[9px]">Earnings Breakdown</th>
                                <th className="py-3 font-semibold text-[9px]">Total Payable</th>
                                <th className="py-3 font-semibold text-[9px]">Status</th>
                                <th className="py-3 font-semibold text-[9px] text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                              {payrollPeriods.map((p: any) => {
                                const dateRange = `${new Date(p.periodStart).toLocaleDateString()} - ${new Date(p.periodEnd).toLocaleDateString()}`;
                                const breakdown = `Base: ₹${p.baseSalary} | Comm: ₹${p.commissionEarned} | Tips: ₹${p.tipsEarned}`;
                                const net = p.netSalary || (p.baseSalary + p.commissionEarned + p.tipsEarned);
                                const statusColor = p.status === "PAID" ? "bg-emerald-50 text-emerald-700 border-emerald-250" : p.status === "APPROVED" ? "bg-indigo-50 text-indigo-700 border-indigo-250" : "bg-stone-100 text-stone-600 border-stone-250";
                                return (
                                  <tr key={p.id} className="hover:bg-stone-50/50">
                                    <td className="py-4 font-semibold text-stone-900">{p.staff?.name}</td>
                                    <td className="py-4 text-stone-500">{dateRange}</td>
                                    <td className="py-4 text-stone-450">{breakdown}</td>
                                    <td className="py-4 font-extrabold text-stone-900">₹{net}</td>
                                    <td className="py-4">
                                      <span className={`text-[8px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${statusColor}`}>{p.status}</span>
                                    </td>
                                    <td className="py-4 text-right">
                                      {p.status === "DRAFT" && (
                                        <button
                                          onClick={() => handleApprovePayrollPeriod(p.id, "APPROVED")}
                                          className="text-stone-900 hover:text-stone-950 font-bold uppercase tracking-wider text-[9px] cursor-pointer mr-3"
                                        >
                                          Approve
                                        </button>
                                      )}
                                      {p.status !== "PAID" && (
                                        <button
                                          onClick={() => handleApprovePayrollPeriod(p.id, "PAID")}
                                          className="text-emerald-600 hover:text-emerald-700 font-bold uppercase tracking-wider text-[9px] cursor-pointer"
                                        >
                                          Mark Paid
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                              {payrollPeriods.length === 0 && (
                                <tr>
                                  <td colSpan={6} className="text-center py-6 text-stone-400 italic">No payroll cycles generated.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: CLIENT CONSENTS & CHEMICAL TREATMENT WAIVERS */}
              {activeTab === "CONSENTS" && (
                <div className="space-y-8 font-minimal text-left">
                  <div>
                    <h3 className="font-normal font-luxury text-3xl text-stone-900 tracking-normal">Treatment Consent Forms & Signatures</h3>
                    <p className="text-sm text-stone-500 mt-1">Design chemical care waivers and capture client digital signatures during consultations</p>
                  </div>

                  {/* Sub-tabs selector */}
                  <div className="flex border-b border-stone-200 gap-6">
                    {(["templates", "sign", "logs"] as const).map(subTab => (
                      <button
                        key={subTab}
                        onClick={() => setConsentSubTab(subTab)}
                        className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${consentSubTab === subTab
                            ? "border-b-2 border-stone-850 text-stone-900"
                            : "text-stone-400 hover:text-stone-600"
                          }`}
                      >
                        {subTab === "templates" ? "Template Builder" : subTab === "sign" ? "Capture Signatures" : "Signed History Log"}
                      </button>
                    ))}
                  </div>

                  {/* SUBTAB: TEMPLATES BUILDER */}
                  {consentSubTab === "templates" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Create Form */}
                        <form onSubmit={handleCreateConsentTemplate} className="md:col-span-1 p-6 bg-stone-50/50 border border-stone-200/80 rounded-2xl space-y-4">
                          <h4 className="font-semibold text-stone-950 text-sm">Design Consent Form</h4>
                          <p className="text-[10px] text-stone-400 font-medium">Standard legal statement and chemical release waiver clauses for client approval</p>

                          <div className="space-y-3">
                            <div className="space-y-1">
                              <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest">Template Title</label>
                              <input
                                required
                                type="text"
                                placeholder="e.g. Keratin Hair Chemical Release"
                                value={newConsentTitle}
                                onChange={(e) => setNewConsentTitle(e.target.value)}
                                className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs text-stone-900 outline-none"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest">Service Category (Optional)</label>
                              <input
                                type="text"
                                placeholder="e.g. Hair Coloring, Bleach"
                                value={newConsentCategory}
                                onChange={(e) => setNewConsentCategory(e.target.value)}
                                className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs text-stone-900 outline-none"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest">Terms & Waiver Clauses</label>
                              <textarea
                                required
                                rows={6}
                                placeholder="Waiver terms... 'I agree that chemical bleach may damage...'"
                                value={newConsentContent}
                                onChange={(e) => setNewConsentContent(e.target.value)}
                                className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs text-stone-900 outline-none font-sans leading-relaxed"
                              />
                            </div>

                            <button
                              type="submit"
                              disabled={creatingTemplateLoading}
                              className="w-full py-3 bg-stone-900 hover:bg-stone-850 text-white font-semibold text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
                            >
                              <Plus className="size-3.5" />
                              <span>Publish Template</span>
                            </button>
                          </div>
                        </form>

                        {/* Active Templates List */}
                        <div className="md:col-span-2 bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
                          <h4 className="font-semibold text-stone-900 text-sm">Active Consent Form Layouts</h4>
                          {consentTemplatesLoading ? (
                            <div className="text-center py-12 text-stone-400 text-xs italic animate-pulse">Loading templates...</div>
                          ) : consentTemplates.length === 0 ? (
                            <div className="text-center py-12 text-stone-400 text-xs italic">No templates created. Build your first consent template above.</div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {consentTemplates.map((t: any) => (
                                <div key={t.id} className="p-5 border border-stone-200 rounded-2xl hover:border-stone-850 transition-all flex flex-col justify-between gap-4">
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-start gap-2">
                                      <h5 className="font-bold text-stone-900 text-sm leading-tight">{t.title}</h5>
                                      {t.serviceCategoryId && (
                                        <span className="text-[8px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0">{t.serviceCategoryId}</span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-stone-500 leading-relaxed font-sans line-clamp-3">{t.content}</p>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setSignConsentTemplateId(t.id);
                                      setConsentSubTab("sign");
                                    }}
                                    className="w-full py-2 bg-stone-50 border border-stone-200 hover:border-stone-850 rounded-xl text-[9px] font-bold uppercase tracking-widest text-stone-755 hover:text-stone-900 transition-all cursor-pointer"
                                  >
                                    Sign Waiver
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUBTAB: SIGN CONSENT */}
                  {consentSubTab === "sign" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                        {/* Sign waiver form */}
                        <form onSubmit={handleSignConsent} className="col-span-12 md:col-span-8 p-8 bg-stone-50/50 border border-stone-200/80 rounded-3xl space-y-6">
                          <h4 className="font-semibold text-stone-955 text-sm">Capture Client Signature</h4>
                          <p className="text-[10px] text-stone-400">Pass this tablet to the client to read and sign the waiver.</p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="space-y-1">
                              <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest">Select Client</label>
                              <select
                                required
                                value={signConsentCustomerId}
                                onChange={(e) => setSignConsentCustomerId(e.target.value)}
                                className="w-full bg-white border border-stone-200 rounded-xl p-3.5 text-xs font-semibold text-stone-700 outline-none"
                              >
                                <option value="">-- Search Customer --</option>
                                {customers.map((c: any) => (
                                  <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest">Choose Consent Template</label>
                              <select
                                required
                                value={signConsentTemplateId}
                                onChange={(e) => setSignConsentTemplateId(e.target.value)}
                                className="w-full bg-white border border-stone-200 rounded-xl p-3.5 text-xs font-semibold text-stone-700 outline-none"
                              >
                                <option value="">-- Choose Template --</option>
                                {consentTemplates.map((t: any) => (
                                  <option key={t.id} value={t.id}>{t.title}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Display Template content */}
                          {signConsentTemplateId && (
                            <div className="p-5 bg-white border border-stone-200 rounded-2xl space-y-3 font-sans leading-relaxed text-xs text-stone-600 max-h-[220px] overflow-y-auto shadow-inner">
                              <h5 className="font-semibold text-stone-900 text-sm">{consentTemplates.find(t => t.id === signConsentTemplateId)?.title}</h5>
                              <p className="whitespace-pre-wrap">{consentTemplates.find(t => t.id === signConsentTemplateId)?.content}</p>
                            </div>
                          )}

                          {/* Interactive Canvas Drawing Signature */}
                          <div className="space-y-2">
                            <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest">Digital Signature Pad</label>
                            <div className="p-3 bg-white border border-stone-200 rounded-2xl relative shadow-inner w-full flex flex-col gap-2 items-center">
                              <canvas
                                id="sig-canvas"
                                width="500"
                                height="180"
                                className="border border-dashed border-stone-300 rounded-xl cursor-crosshair max-w-full bg-stone-50/20"
                                onMouseDown={(e) => {
                                  const canvas = e.currentTarget;
                                  const ctx = canvas.getContext("2d");
                                  if (!ctx) return;
                                  ctx.lineWidth = 2.5;
                                  ctx.lineCap = "round";
                                  ctx.strokeStyle = "#1c1917";
                                  const rect = canvas.getBoundingClientRect();
                                  ctx.beginPath();
                                  ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
                                  (canvas as any).isDrawing = true;
                                }}
                                onMouseMove={(e) => {
                                  const canvas = e.currentTarget;
                                  if (!(canvas as any).isDrawing) return;
                                  const ctx = canvas.getContext("2d");
                                  if (!ctx) return;
                                  const rect = canvas.getBoundingClientRect();
                                  ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
                                  ctx.stroke();
                                }}
                                onMouseUp={(e) => {
                                  const canvas = e.currentTarget;
                                  (canvas as any).isDrawing = false;
                                  setSignConsentSignatureUrl(canvas.toDataURL());
                                }}
                                onTouchStart={(e) => {
                                  const canvas = e.currentTarget;
                                  const ctx = canvas.getContext("2d");
                                  if (!ctx) return;
                                  ctx.lineWidth = 2.5;
                                  ctx.lineCap = "round";
                                  ctx.strokeStyle = "#1c1917";
                                  const rect = canvas.getBoundingClientRect();
                                  const touch = e.touches[0];
                                  ctx.beginPath();
                                  ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
                                  (canvas as any).isDrawing = true;
                                }}
                                onTouchMove={(e) => {
                                  const canvas = e.currentTarget;
                                  if (!(canvas as any).isDrawing) return;
                                  const ctx = canvas.getContext("2d");
                                  if (!ctx) return;
                                  const rect = canvas.getBoundingClientRect();
                                  const touch = e.touches[0];
                                  ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
                                  ctx.stroke();
                                  e.preventDefault();
                                }}
                                onTouchEnd={(e) => {
                                  const canvas = e.currentTarget;
                                  (canvas as any).isDrawing = false;
                                  setSignConsentSignatureUrl(canvas.toDataURL());
                                }}
                              />
                              <div className="flex gap-3 justify-end w-full max-w-[500px]">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const canvas = document.getElementById("sig-canvas") as HTMLCanvasElement;
                                    if (canvas) {
                                      const ctx = canvas.getContext("2d");
                                      ctx?.clearRect(0, 0, canvas.width, canvas.height);
                                      setSignConsentSignatureUrl("");
                                    }
                                  }}
                                  className="px-3.5 py-1.5 border border-stone-200 hover:bg-stone-50 rounded-lg text-[9px] font-bold uppercase tracking-wider text-stone-600 transition-all cursor-pointer"
                                >
                                  Clear Canvas
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest">Client Text Confirmation (Full Legal Name)</label>
                            <input
                              required
                              type="text"
                              placeholder="e.g. John Doe, confirms details"
                              value={signConsentSignatureText}
                              onChange={(e) => setSignConsentSignatureText(e.target.value)}
                              className="w-full bg-white border border-stone-200 rounded-xl p-3.5 text-xs text-stone-900 outline-none"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={signConsentLoading || !signConsentSignatureUrl}
                            className="w-full py-4.5 bg-stone-900 hover:bg-stone-850 text-white font-semibold text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
                          >
                            <Save className="size-4" />
                            <span>Accept & File Consent Signature</span>
                          </button>
                        </form>

                        {/* Quick client selector reference */}
                        <div className="col-span-12 md:col-span-4 p-6 bg-white border border-stone-200 rounded-3xl space-y-4">
                          <h4 className="font-semibold text-stone-955 text-sm">Consultation Checklist</h4>
                          <ul className="text-xs text-stone-500 space-y-3 font-sans list-disc pl-4 leading-relaxed">
                            <li>Ensure client completes a patch skin test before major chemical bleach coloring.</li>
                            <li>Ask clients about previous chemical treatments, bleach processes, and keratin care timings.</li>
                            <li>Client signature must be clearly drawn on the signature pad.</li>
                            <li>Recorded consents are linked permanently under the customer's ledger for legal records.</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUBTAB: SIGNATURE LOGS */}
                  {consentSubTab === "logs" && (
                    <div className="space-y-6">
                      {/* Select Customer */}
                      <div className="p-6 bg-stone-50/50 border border-stone-200/80 rounded-2xl flex flex-col md:flex-row items-center gap-4">
                        <div className="flex-1 space-y-1 w-full">
                          <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest">Filter by Client Ledger</label>
                          <select
                            value={logsCustomerId}
                            onChange={(e) => setLogsCustomerId(e.target.value)}
                            className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs font-semibold text-stone-750 outline-none"
                          >
                            <option value="">-- Choose Client to Load History --</option>
                            {customers.map((c: any) => (
                              <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* History Logs Table */}
                      <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
                        <h4 className="font-semibold text-stone-900 text-sm">Historical Signed Consents</h4>
                        {logsCustomerId ? (
                          selectedCustomerConsentHistory.length === 0 ? (
                            <div className="text-center py-12 text-stone-400 text-xs italic">No signed consents found for this client.</div>
                          ) : (
                            <div className="space-y-6">
                              {selectedCustomerConsentHistory.map((log: any) => (
                                <div key={log.id} className="p-5 border border-stone-200 rounded-2xl space-y-4 hover:border-stone-400 transition-colors">
                                  <div className="flex justify-between items-start border-b border-stone-100 pb-3">
                                    <div>
                                      <h5 className="font-bold text-stone-900 text-sm">{log.template?.title || "Waiver Release Form"}</h5>
                                      <p className="text-[10px] text-stone-400 mt-0.5">Signed on: {new Date(log.createdAt).toLocaleString()} | IP: {log.ipAddress || "Salon Tablet"}</p>
                                    </div>
                                    <span className="text-[8px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded border border-emerald-200/50 uppercase tracking-wider">Valid Signed</span>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div className="md:col-span-2 space-y-1">
                                      <span className="text-stone-400 block text-[9px] font-bold uppercase tracking-wider">Consent Statement Clauses</span>
                                      <p className="text-[11px] text-stone-500 leading-relaxed font-sans max-h-[120px] overflow-y-auto whitespace-pre-wrap">{log.template?.content}</p>
                                    </div>

                                    <div className="md:col-span-1 space-y-3 bg-stone-50/50 border border-stone-200 rounded-xl p-3 flex flex-col justify-between items-center text-center">
                                      <div className="space-y-1">
                                        <span className="text-stone-400 block text-[9px] font-bold uppercase tracking-wider">Client Digital Signature</span>
                                        {log.signatureUrl ? (
                                          <img
                                            src={log.signatureUrl}
                                            alt="Client Signature"
                                            className="h-16 object-contain border border-stone-150 rounded bg-white p-1"
                                          />
                                        ) : (
                                          <span className="text-xs text-stone-400 italic">No drawing captured</span>
                                        )}
                                      </div>
                                      <div className="text-[10px] text-stone-600 font-semibold uppercase tracking-wider">
                                        Approved by: {log.signatureText || "Client"}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )
                        ) : (
                          <div className="text-center py-12 text-stone-400 text-xs italic">Select a client above to preview their chemical treatment consent history records.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* RIGHT CHECKOUT TICKET PANEL (POS CONSOLE VIEW) */}
        {activeTab === "POS" && (
          <CheckoutTicket
            cart={cart}
            setCart={setCart}
            removeFromCart={removeFromCart}
            clearCart={clearCart}
            isMobileCartOpen={isMobileCartOpen}
            setIsMobileCartOpen={setIsMobileCartOpen}
            posCustomerSearch={posCustomerSearch}
            setPosCustomerSearch={setPosCustomerSearch}
            activeCrmIndex={activeCrmIndex}
            setActiveCrmIndex={setActiveCrmIndex}
            customers={customers}
            setIsCustomerModalOpen={setIsCustomerModalOpen}
            cmsStylists={cmsStylists}
            selectedOutletId={selectedOutletId}
            getStylistOutletId={getStylistOutletId}
            couponCode={couponCode}
            setCouponCode={setCouponCode}
            applyPosCoupon={applyPosCoupon}
            redeemedPoints={redeemedPoints}
            setRedeemedPoints={setRedeemedPoints}
            handleAddLoyaltyPoints={handleAddLoyaltyPoints}
            selectedPayment={selectedPayment}
            setSelectedPayment={setSelectedPayment}
            subscriptions={subscriptions}
            subtotal={subtotal}
            discountAmount={discountAmount}
            gstInclusiveAmount={gstInclusiveAmount}
            netSubtotal={netSubtotal}
            handleCheckoutSubmit={() => handleCheckoutSubmit()}
            handleSelectWalkIn={handleSelectWalkIn}
          />
        )}


        {/* MOBILE FLOATING CART ACTION BAR */}
        {activeTab === "POS" && cart.length > 0 && (
          <div className="lg:hidden fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-md">
            <button
              onClick={() => setIsMobileCartOpen(true)}
              className="w-full bg-stone-900 text-white font-semibold py-4 px-6 rounded-2xl shadow-xl flex items-center justify-between text-xs uppercase tracking-wider cursor-pointer hover:bg-stone-850 active:scale-98 transition-all"
            >
              <span className="flex items-center gap-2 min-w-0">
                <Receipt className="size-4 shrink-0" />
                <span className="truncate">View Checkout Ticket</span>
              </span>
              <span className="bg-white text-stone-900 px-2.5 py-1 rounded-full text-[9px] font-black shrink-0">
                {cart.reduce((sum, item) => sum + item.qty, 0)} ITEMS
              </span>
            </button>
          </div>
        )}

      </div>

      {/* ─── MODAL: ADD/EDIT SERVICE ─── */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-md flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setIsServiceModalOpen(false)}>
          <div className="w-full max-w-xl bg-white border border-stone-200 rounded-3xl shadow-2xl text-left flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-stone-100 px-8 py-5 shrink-0">
              <div>
                <h3 className="font-semibold text-base text-stone-900">
                  {editingService ? "Edit Service" : "Add New Service"}
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">{editingService ? "Update service details below" : `Adding to ${cmsOutlets.find(o => o.id === selectedOutletId)?.name || "this outlet"}`}</p>
              </div>
              <button onClick={() => setIsServiceModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-xl text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-all cursor-pointer text-lg font-light">
                ×
              </button>
            </div>

            {/* Scrollable body */}
            <form onSubmit={handleSaveService} className="overflow-y-auto p-8 space-y-5 text-sm flex-1">

              {/* Service Name */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Service Name <span className="text-rose-400">*</span></label>
                <input
                  type="text"
                  required
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="e.g. Signature Keratin Smoothing"
                  className="w-full bg-stone-50 border border-stone-200 focus:border-stone-800 focus:bg-white rounded-xl px-4 py-3 text-sm text-stone-900 outline-none transition-all placeholder:text-stone-300 font-medium"
                />
              </div>

              {/* ─── COMBO MODE: Service selector FIRST, then auto-summary ─── */}
              {serviceIsCombo && (
                <>
                  {/* Included Services Picker */}
                  <div className="space-y-2 border border-rose-200 bg-rose-50/40 p-4 rounded-2xl">
                    <label className="block text-[10px] font-bold text-rose-600 uppercase tracking-widest">Select Services to Bundle <span className="text-rose-400">*</span></label>
                    <div className="max-h-44 overflow-y-auto space-y-2 pr-2">
                      {services
                        .filter(s => s.id !== editingService?.id && !s.isCombo)
                        .map(s => {
                          const isSelected = serviceComboServiceIds.includes(s.id);
                          return (
                            <label key={s.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-stone-200/60 hover:border-rose-300 cursor-pointer select-none transition-colors">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setServiceComboServiceIds([...serviceComboServiceIds, s.id]);
                                    } else {
                                      setServiceComboServiceIds(serviceComboServiceIds.filter(id => id !== s.id));
                                    }
                                  }}
                                  className="w-3.5 h-3.5 rounded text-rose-600 border-stone-300"
                                />
                                <span className="text-xs font-medium text-stone-800">{s.name}</span>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-xs text-stone-700 font-semibold">₹{s.price}</span>
                                <span className="text-[10px] text-stone-400 ml-1">{s.duration || 30}m</span>
                              </div>
                            </label>
                          );
                        })}
                      {services.filter(s => s.id !== editingService?.id && !s.isCombo).length === 0 && (
                        <p className="text-xs text-stone-400 italic">No individual services available to bundle. Add base services first.</p>
                      )}
                    </div>
                  </div>

                  {/* Auto-Computed Price + Duration Summary */}
                  {serviceComboServiceIds.length > 0 && (() => {
                    const included = services.filter(s => serviceComboServiceIds.includes(s.id));
                    const totalPrice = included.reduce((sum, s) => sum + Number(s.price), 0);
                    const totalDuration = included.reduce((sum, s) => sum + Number(s.duration || 30), 0);
                    return (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Combined Price (auto)</label>
                          <div className="w-full bg-stone-100 border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-500 font-semibold flex items-center gap-2">
                            <span className="text-stone-900">₹{totalPrice}</span>
                            <span className="text-[10px] text-stone-400">(from {included.length} services)</span>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Total Duration (auto)</label>
                          <div className="w-full bg-stone-100 border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-500 font-semibold flex items-center gap-2">
                            <span className="text-stone-900">{totalDuration} min</span>
                            <span className="text-[10px] text-stone-400">{totalDuration >= 60 ? `(${(totalDuration/60).toFixed(1)}h)` : ""}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Combo Deal Price (Discounted) - ONLY user-entered field */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-rose-600 uppercase tracking-widest">Combo Deal Price (₹) <span className="text-rose-400">*</span></label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={serviceOfferPrice}
                      onChange={(e) => setServiceOfferPrice(e.target.value !== "" ? parseFloat(e.target.value) || 0 : "")}
                      placeholder="e.g. 799 (discounted combo price)"
                      className="w-full bg-white border-2 border-rose-300 focus:border-rose-500 rounded-xl px-4 py-3 text-sm text-stone-900 outline-none transition-all font-semibold placeholder:text-stone-300"
                    />
                    <p className="text-[10px] text-stone-400">Enter the final discounted price customers pay for the full combo. The original combined price is auto-calculated above.</p>
                  </div>
                </>
              )}

              {/* ─── STANDARD MODE: Manual Price + Duration + Optional Offer Price ─── */}
              {!serviceIsCombo && (
                <>
                  {/* Price + Duration */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Price (₹) <span className="text-rose-400">*</span></label>
                      <input
                        type="number"
                        required
                        min={0}
                        value={servicePrice}
                        onChange={(e) => setServicePrice(parseFloat(e.target.value) || 0)}
                        placeholder="500"
                        className="w-full bg-stone-50 border border-stone-200 focus:border-stone-800 focus:bg-white rounded-xl px-4 py-3 text-sm text-stone-900 outline-none transition-all font-semibold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Duration (mins) <span className="text-rose-400">*</span></label>
                      <select
                        value={serviceDuration}
                        onChange={(e) => setServiceDuration(parseInt(e.target.value))}
                        className="w-full bg-stone-50 border border-stone-200 focus:border-stone-800 focus:bg-white rounded-xl px-4 py-3 text-sm text-stone-900 outline-none transition-all font-medium"
                      >
                        {[10, 15, 20, 30, 45, 60, 75, 90, 105, 120, 150, 180, 210, 240].map(d => (
                          <option key={d} value={d}>{d} mins{d >= 60 ? ` (${d / 60}h)` : ""}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Offer Price (Special Offer) */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Special Offer Price (₹) <span className="text-stone-400 font-normal">(Optional — leave blank for no discount)</span></label>
                    <input
                      type="number"
                      min={0}
                      value={serviceOfferPrice}
                      onChange={(e) => setServiceOfferPrice(e.target.value !== "" ? parseFloat(e.target.value) || 0 : "")}
                      placeholder="e.g. 399 — customers see this as a discounted price"
                      className="w-full bg-stone-50 border border-stone-200 focus:border-stone-800 focus:bg-white rounded-xl px-4 py-3 text-sm text-stone-900 outline-none transition-all font-semibold"
                    />
                  </div>
                </>
              )}

              {/* Category */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Category <span className="text-rose-400">*</span></label>
                <div className="grid grid-cols-4 gap-2">
                  {["Grooming", "Color", "Treatment", "Therapy", "Waxing", "Skincare", "Nail", "Massage"].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setServiceCategory(cat)}
                      className={`py-2 px-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${serviceCategory === cat
                          ? "bg-stone-900 text-white border-stone-900 shadow-sm"
                          : "bg-stone-50 text-stone-500 border-stone-200 hover:border-stone-400 hover:text-stone-700"
                        }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gender */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Service For</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { val: "UNISEX", label: "Unisex", icon: "⚥" },
                    { val: "MEN", label: "Men", icon: "♂" },
                    { val: "WOMEN", label: "Women", icon: "♀" },
                  ].map(g => (
                    <button
                      key={g.val}
                      type="button"
                      onClick={() => setServiceGender(g.val)}
                      className={`py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${serviceGender === g.val
                          ? "bg-stone-900 text-white border-stone-900"
                          : "bg-stone-50 text-stone-500 border-stone-200 hover:border-stone-400"
                        }`}
                    >
                      <span className="text-base leading-none">{g.icon}</span> {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Body Part */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Body Area</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { val: "HAIR", label: "Hair", icon: "💇" },
                    { val: "FACE", label: "Face", icon: "😊" },
                    { val: "HEAD", label: "Head", icon: "🧠" },
                    { val: "BODY", label: "Body", icon: "🧴" },
                    { val: "LEGS", label: "Legs", icon: "🦵" },
                    { val: "HANDS", label: "Hands", icon: "🖐" },
                    { val: "NAILS", label: "Nails", icon: "💅" },
                    { val: "FULL_BODY", label: "Full Body", icon: "🧖" },
                  ].map(bp => (
                    <button
                      key={bp.val}
                      type="button"
                      onClick={() => setServiceBodyPart(serviceBodyPart === bp.val ? "" : bp.val)}
                      className={`py-2 px-1 rounded-xl text-[10px] font-bold border transition-all cursor-pointer flex flex-col items-center gap-1 ${serviceBodyPart === bp.val
                          ? "bg-stone-900 text-white border-stone-900"
                          : "bg-stone-50 text-stone-500 border-stone-200 hover:border-stone-400"
                        }`}
                    >
                      <span className="text-base">{bp.icon}</span>
                      {bp.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Loyalty Points Earning */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Loyalty Points <span className="text-stone-300">(awarded on payment)</span></label>
                <input
                  type="number"
                  min={0}
                  value={serviceLoyaltyPoints}
                  onChange={(e) => setServiceLoyaltyPoints(parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full bg-stone-50 border border-stone-200 focus:border-stone-800 focus:bg-white rounded-xl px-4 py-3 text-sm text-stone-900 outline-none transition-all font-semibold"
                />
              </div>

              {/* Description (optional) */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Description <span className="text-stone-300">(optional)</span></label>
                <textarea
                  value={serviceDescription}
                  onChange={(e) => setServiceDescription(e.target.value)}
                  placeholder="Brief description for booking page and customer portal..."
                  rows={2}
                  className="w-full bg-stone-50 border border-stone-200 focus:border-stone-800 focus:bg-white rounded-xl px-4 py-3 text-xs text-stone-900 outline-none transition-all resize-none placeholder:text-stone-300"
                />
              </div>

              {/* Images (max 2) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Service Images <span className="text-stone-300">(max 2)</span></label>
                  <span className="text-[9px] text-stone-400">{serviceImages.length}/2 uploaded</span>
                </div>
                <div className="flex gap-3 flex-wrap">
                  {serviceImages.map((img, idx) => (
                    <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border border-stone-200 shadow-sm group">
                      <img src={img} alt={`Service image ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setServiceImages(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 w-5 h-5 bg-stone-900/80 hover:bg-rose-600 text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                      >×</button>
                    </div>
                  ))}
                  {serviceImages.length < 2 && !isUploadingServiceImage && (
                    <label className="w-24 h-24 rounded-xl border-2 border-dashed border-stone-300 hover:border-stone-800 flex flex-col items-center justify-center gap-1 cursor-pointer text-stone-400 hover:text-stone-700 transition-all bg-stone-50 hover:bg-stone-100">
                      <span className="text-2xl leading-none">+</span>
                      <span className="text-[9px] font-bold uppercase tracking-wide">Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (serviceImages.length >= 2) return;
                          setIsUploadingServiceImage(true);
                          const reader = new FileReader();
                          reader.onload = async (ev) => {
                            const dataUrl = ev.target?.result as string;
                            try {
                              const response = await fetch("/api/media", {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                  "x-tenant-slug": tenantSlug,
                                },
                                body: JSON.stringify({
                                  file: dataUrl,
                                  folder: "services"
                                })
                              });
                              if (response.ok) {
                                const data = await response.json();
                                setServiceImages(prev => [...prev, data.url]);
                              } else {
                                const err = await response.json();
                                alert(`Upload failed: ${err.error || "Unknown error"}`);
                              }
                            } catch (uploadErr) {
                              console.error("Upload error", uploadErr);
                              alert("Failed to upload image to server.");
                            } finally {
                              setIsUploadingServiceImage(false);
                            }
                          };
                          reader.readAsDataURL(file);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  )}
                  {isUploadingServiceImage && (
                    <div className="w-24 h-24 rounded-xl border border-stone-200 shadow-sm flex flex-col items-center justify-center bg-stone-50 gap-1.5">
                      <svg className="animate-spin h-5 w-5 text-stone-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-[9px] font-bold text-stone-500 animate-pulse">Uploading...</span>
                    </div>
                  )}
                </div>
                <p className="text-[9px] text-stone-400">Images are uploaded and stored securely on Cloudinary.</p>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Service Tags <span className="text-stone-300">(optional)</span></label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {serviceTags.map((tag, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-900 text-white text-[10px] font-bold rounded-full">
                      {tag}
                      <button
                        type="button"
                        onClick={() => setServiceTags(prev => prev.filter((_, i) => i !== idx))}
                        className="text-stone-400 hover:text-white leading-none cursor-pointer ml-0.5"
                      >×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={serviceTagInput}
                    onChange={(e) => setServiceTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.key === "Enter" || e.key === ",") && serviceTagInput.trim()) {
                        e.preventDefault();
                        const newTag = serviceTagInput.trim().replace(/,$/, "");
                        if (newTag && !serviceTags.includes(newTag)) {
                          setServiceTags(prev => [...prev, newTag]);
                        }
                        setServiceTagInput("");
                      }
                    }}
                    placeholder="Type a tag and press Enter..."
                    className="flex-1 bg-stone-50 border border-stone-200 focus:border-stone-800 focus:bg-white rounded-xl px-4 py-2.5 text-xs text-stone-900 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newTag = serviceTagInput.trim();
                      if (newTag && !serviceTags.includes(newTag)) {
                        setServiceTags(prev => [...prev, newTag]);
                      }
                      setServiceTagInput("");
                    }}
                    className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-[10px] font-bold uppercase rounded-xl transition-all cursor-pointer"
                  >Add</button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm mt-2"
              >
                <Save className="size-4" /> {editingService ? "Update Service" : "Add Service"}
              </button>
            </form>
          </div>
        </div>
      )}


      {/* ─── MODAL: ADD/EDIT PRODUCT ─── */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-stone-200 rounded-3xl p-8 shadow-xl text-left space-y-6">
            <div className="flex justify-between items-center border-b border-stone-200 pb-3.5">
              <h3 className="font-semibold text-lg text-stone-900">
                {editingProduct ? "Edit Product Parameters" : "Add Product to Shelf"}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} className="text-stone-400 hover:text-stone-900 text-xl font-bold cursor-pointer transition-colors">
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveProduct} className="space-y-6 text-sm">
              {/* Product Image */}
              <div className="space-y-2">
                <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Product Image</label>
                {productImageUrl ? (
                  <div className="flex items-center gap-3 p-3 bg-white border border-stone-200 rounded-xl">
                    <img src={productImageUrl} alt="Product Image" className="w-16 h-16 object-cover bg-stone-50 border border-stone-200 rounded-lg" />
                    <button
                      type="button"
                      onClick={() => setProductImageUrl("")}
                      className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                    >
                      Remove Image
                    </button>
                  </div>
                ) : isUploadingProductImage ? (
                  <div className="flex items-center justify-center w-full border-2 border-dashed border-stone-200 rounded-xl p-6 bg-stone-50">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-stone-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-[10px] font-bold text-stone-500">Uploading to Cloudinary...</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-full border-2 border-dashed border-stone-200 rounded-xl p-4 bg-stone-50 hover:bg-stone-100 transition-colors">
                    <label className="cursor-pointer flex flex-col items-center gap-1 w-full text-center">
                      <Upload className="size-4 text-stone-400" />
                      <span className="text-[10px] font-bold text-stone-500">Upload Product Image</span>
                      <span className="text-[8px] text-stone-400 font-sans">PNG, JPG, WebP up to 1MB</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 1024 * 1024) {
                            alert("Please upload an image smaller than 1MB to optimize performance.");
                            return;
                          }
                          setIsUploadingProductImage(true);
                          const reader = new FileReader();
                          reader.onloadend = async () => {
                            if (typeof reader.result === "string") {
                              try {
                                const response = await fetch("/api/media", {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                    "x-tenant-slug": tenantSlug,
                                  },
                                  body: JSON.stringify({
                                    file: reader.result,
                                    folder: "products"
                                  })
                                });
                                if (response.ok) {
                                  const data = await response.json();
                                  setProductImageUrl(data.url);
                                } else {
                                  const err = await response.json();
                                  alert(`Upload failed: ${err.error || "Unknown error"}`);
                                }
                              } catch (uploadErr) {
                                console.error("Upload error", uploadErr);
                                alert("Failed to upload image to server.");
                              } finally {
                                setIsUploadingProductImage(false);
                              }
                            }
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Product Name</label>
                <input
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Smoothing Shampoo (200ml)"
                  className="w-full bg-white border border-stone-200 focus:border-stone-850 rounded-xl p-3.5 text-xs text-stone-900 outline-none transition-all font-semibold"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider">SKU / Barcode</label>
                  <input
                    type="text"
                    value={productSku}
                    onChange={(e) => setProductSku(e.target.value)}
                    placeholder="e.g. SHAMP-200"
                    className="w-full bg-white border border-stone-200 focus:border-stone-850 rounded-xl p-3 text-xs text-stone-900 outline-none transition-all font-semibold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Cost Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={productCostPrice}
                    onChange={(e) => setProductCostPrice(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-stone-200 focus:border-stone-850 rounded-xl p-3 text-xs text-stone-900 outline-none transition-all font-semibold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Selling Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={productPrice}
                    onChange={(e) => setProductPrice(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-stone-200 focus:border-stone-850 rounded-xl p-3 text-xs text-stone-900 outline-none transition-all font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Assigned Supplier</label>
                <select
                  value={productSupplierId}
                  onChange={(e) => setProductSupplierId(e.target.value)}
                  className="w-full bg-white border border-stone-200 focus:border-stone-850 rounded-xl p-3 text-xs text-stone-900 outline-none transition-all font-semibold cursor-pointer"
                >
                  <option value="">-- No Supplier --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.contactName || "No rep"})</option>
                  ))}
                </select>
              </div>

              <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-semibold text-stone-800">Track Stock Level</h4>
                    <p className="text-[10px] text-stone-500">Monitor stock levels and show low stock warning</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={productTrackStock}
                    onChange={(e) => setProductTrackStock(e.target.checked)}
                    className="size-4.5 accent-stone-900 rounded cursor-pointer"
                  />
                </div>

                {productTrackStock && (
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-stone-200">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Current Stock Qty</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={productStock}
                        onChange={(e) => setProductStock(parseInt(e.target.value) || 0)}
                        className="w-full bg-white border border-stone-200 focus:border-stone-850 rounded-xl p-3 text-xs text-stone-900 outline-none transition-all font-semibold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Low Stock Threshold</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={productLowStockThreshold}
                        onChange={(e) => setProductLowStockThreshold(parseInt(e.target.value) || 0)}
                        className="w-full bg-white border border-stone-200 focus:border-stone-850 rounded-xl p-3 text-xs text-stone-900 outline-none transition-all font-semibold"
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-stone-900 hover:bg-stone-850 text-white font-semibold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Save className="size-4.5" /> Save Product
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: CREATE CUSTOMER SEGMENT ─── */}
      {isSegmentModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-stone-200 rounded-3xl p-8 shadow-xl text-left space-y-6 animate-fade-in">
            <div className="flex justify-between items-center border-b border-stone-200 pb-3.5">
              <h3 className="font-semibold text-lg text-stone-900">
                Create Smart Segment
              </h3>
              <button
                onClick={() => setIsSegmentModalOpen(false)}
                className="text-stone-400 hover:text-stone-900 text-xl font-bold cursor-pointer transition-colors"
              >
                &times;
              </button>
            </div>
            <form
              onSubmit={handleCreateSegment}
              className="space-y-6 text-sm"
            >
              <div className="space-y-2">
                <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Segment Name</label>
                <input
                  type="text"
                  required
                  value={newSegmentName}
                  onChange={(e) => setNewSegmentName(e.target.value)}
                  placeholder="e.g. Lost Clients (60+ Days)"
                  className="w-full bg-white border border-stone-200 focus:border-stone-850 rounded-xl p-3.5 text-xs text-stone-900 outline-none transition-all font-semibold"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Description</label>
                <textarea
                  value={newSegmentDesc}
                  onChange={(e) => setNewSegmentDesc(e.target.value)}
                  placeholder="Describe who this segment targets..."
                  className="w-full bg-white border border-stone-200 focus:border-stone-850 rounded-xl p-3.5 text-xs text-stone-900 outline-none transition-all font-semibold h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Criteria Type</label>
                  <select
                    value={newSegmentType}
                    onChange={(e) => setNewSegmentType(e.target.value)}
                    className="w-full bg-white border border-stone-200 focus:border-stone-850 rounded-xl p-3.5 text-xs text-stone-900 outline-none transition-all font-semibold cursor-pointer"
                  >
                    <option value="LAST_VISIT">Days Since Last Visit</option>
                    <option value="MIN_SPEND">Minimum Spend (₹)</option>
                    <option value="MIN_VISITS">Minimum Visit Count</option>
                    <option value="TAG">Has Specific Tag</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Criteria Value</label>
                  <input
                    type="text"
                    required
                    value={newSegmentValue}
                    onChange={(e) => setNewSegmentValue(e.target.value)}
                    placeholder={newSegmentType === "TAG" ? "e.g. vip" : "e.g. 60"}
                    className="w-full bg-white border border-stone-200 focus:border-stone-850 rounded-xl p-3.5 text-xs text-stone-900 outline-none transition-all font-semibold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-stone-900 hover:bg-stone-850 text-white font-semibold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Save className="size-4.5" /> Save Segment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: ADD/EDIT SUBSCRIPTION ─── */}
      {isSubModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-stone-200 rounded-3xl p-8 shadow-xl text-left space-y-6">
            <div className="flex justify-between items-center border-b border-stone-200 pb-3.5">
              <h3 className="font-semibold text-lg text-stone-900">
                {editingSub ? "Edit Subscription Details" : "Create Subscription Package"}
              </h3>
              <button onClick={() => setIsSubModalOpen(false)} className="text-stone-400 hover:text-stone-900 text-xl font-bold cursor-pointer transition-colors">
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveSub} className="space-y-6 text-sm">
              <div className="space-y-2">
                <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Package Name</label>
                <input
                  type="text"
                  required
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  placeholder="e.g. Gold Prestige VIP Pass"
                  className="w-full bg-white border border-stone-200 focus:border-stone-850 rounded-xl p-3.5 text-xs text-stone-900 outline-none transition-all font-semibold"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={subPrice}
                    onChange={(e) => setSubPrice(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-stone-200 focus:border-stone-850 rounded-xl p-3.5 text-xs text-stone-900 outline-none transition-all font-semibold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Billing Duration</label>
                  <select
                    value={subDuration}
                    onChange={(e) => setSubDuration(e.target.value)}
                    className="w-full bg-white border border-stone-200 focus:border-stone-850 rounded-xl p-3.5 text-xs text-stone-900 outline-none transition-all font-semibold"
                  >
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Yearly">Yearly</option>
                    <option value="Prepaid Pass">Prepaid Pass</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Description & Benefits</label>
                <textarea
                  required
                  value={subDesc}
                  onChange={(e) => setSubDesc(e.target.value)}
                  placeholder="Describe benefits, session counts, limits, etc."
                  className="w-full bg-white border border-stone-200 focus:border-stone-850 rounded-xl p-3.5 text-xs text-stone-900 outline-none transition-all font-semibold h-24 resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-stone-900 hover:bg-stone-850 text-white font-semibold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Save className="size-4.5" /> Save Package
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: ADD/EDIT COUPON ─── */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-stone-200 rounded-3xl p-8 shadow-xl text-left space-y-6">
            <div className="flex justify-between items-center border-b border-stone-200 pb-3.5">
              <h3 className="font-semibold text-lg text-stone-900">
                {editingCoupon ? "Edit Coupon Parameters" : "Create Promo Discount Coupon"}
              </h3>
              <button onClick={() => setIsCouponModalOpen(false)} className="text-stone-400 hover:text-stone-900 text-xl font-bold cursor-pointer transition-colors">
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveCoupon} className="space-y-6 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Coupon Code</label>
                  <input
                    type="text"
                    required
                    value={couponValCode}
                    onChange={(e) => setCouponValCode(e.target.value)}
                    placeholder="e.g. WELCOME50"
                    className="w-full bg-white border border-stone-200 focus:border-stone-850 rounded-xl p-3.5 text-xs text-stone-900 outline-none transition-all font-semibold uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Discount (%)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="100"
                    value={couponDiscountPercent}
                    onChange={(e) => setCouponDiscountPercent(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-stone-200 focus:border-stone-850 rounded-xl p-3.5 text-xs text-stone-900 outline-none transition-all font-semibold"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Min. Bill Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={couponMinBill}
                    onChange={(e) => setCouponMinBill(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-stone-200 focus:border-stone-850 rounded-xl p-3.5 text-xs text-stone-900 outline-none transition-all font-semibold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Max. Cap Discount (₹)</label>
                  <input
                    type="number"
                    required
                    value={couponMaxDiscount}
                    onChange={(e) => setCouponMaxDiscount(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-stone-200 focus:border-stone-850 rounded-xl p-3.5 text-xs text-stone-900 outline-none transition-all font-semibold"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Expiry Date</label>
                <input
                  type="date"
                  required
                  value={couponExpiry}
                  onChange={(e) => setCouponExpiry(e.target.value)}
                  className="w-full bg-white border border-stone-200 focus:border-stone-850 rounded-xl p-3.5 text-xs text-stone-900 outline-none transition-all font-semibold"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-stone-900 hover:bg-stone-850 text-white font-semibold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Save className="size-4.5" /> Save Coupon
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: ADD/EDIT WHATSAPP TEMPLATE ─── */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-stone-200 rounded-3xl p-8 shadow-xl text-left space-y-6">
            <div className="flex justify-between items-center border-b border-stone-200 pb-3.5">
              <h3 className="font-semibold text-lg text-stone-900">
                {editingTemplate ? "Edit Message Template" : "Create New Message Template"}
              </h3>
              <button onClick={() => { setIsTemplateModalOpen(false); setEditingTemplate(null); }} className="text-stone-400 hover:text-stone-900 text-xl font-bold cursor-pointer transition-colors">
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-6 text-sm">
              <div className="space-y-2">
                <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Template Category</label>
                <select
                  value={templateType}
                  onChange={(e) => setTemplateType(e.target.value)}
                  className="w-full bg-white border border-stone-200 focus:border-stone-850 rounded-xl p-3.5 text-xs text-stone-900 outline-none transition-all font-semibold cursor-pointer"
                >
                  <option value="signup_otp">OTP Registration Verification</option>
                  <option value="booking_confirmation">Booking Confirmation Alert</option>
                  <option value="reminder_24h">24-Hour Event Reminder</option>
                  <option value="reminder_1h">1-Hour Event Reminder</option>
                  <option value="birthday_offer">Birthday Wish with Coupon</option>
                  <option value="inactive_winback">Inactive Winback Campaign</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Template Name</label>
                <input
                  type="text"
                  required
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g. Booking confirmation - Friendly style"
                  className="w-full bg-white border border-stone-200 focus:border-stone-850 rounded-xl p-3.5 text-xs text-stone-900 outline-none transition-all font-semibold"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Message Body Text</label>
                <textarea
                  required
                  rows={4}
                  value={templateText}
                  onChange={(e) => setTemplateText(e.target.value)}
                  placeholder="Hello {{name}}, your appointment for {{service}} with {{stylist}} on {{date}} at {{time}} is confirmed!"
                  className="w-full bg-white border border-stone-200 focus:border-stone-850 rounded-xl p-3.5 text-xs text-stone-900 outline-none transition-all font-semibold resize-none leading-relaxed"
                />
                <span className="text-[9px] text-stone-400 block leading-normal font-minimal">
                  Make sure to include appropriate variable placeholders like {"{{name}}"}, {"{{brand}}"}, {"{{service}}"}, etc.
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-stone-900 hover:bg-stone-850 text-white font-semibold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Save className="size-4.5" /> Save Message Template
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: ADD CUSTOMER ─── */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-stone-200 rounded-3xl p-8 shadow-xl text-left space-y-6">
            <div className="flex justify-between items-center border-b border-stone-200 pb-3.5">
              <h3 className="font-semibold text-lg text-stone-900">Register Customer CRM Profile</h3>
              <button onClick={() => setIsCustomerModalOpen(false)} className="text-stone-400 hover:text-stone-900 text-xl font-bold cursor-pointer transition-colors">
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveCustomer} className="space-y-6 text-sm">
              <div className="space-y-2">
                <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Customer Name</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-white border border-stone-200 focus:border-stone-850 rounded-xl p-3.5 text-xs text-stone-900 outline-none transition-all font-semibold"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider">WhatsApp Mobile</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. +91 99888 77777"
                  className="w-full bg-white border border-stone-200 focus:border-stone-850 rounded-xl p-3.5 text-xs text-stone-900 outline-none transition-all font-semibold"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Email Address (Optional)</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="e.g. customer@example.com"
                  className="w-full bg-white border border-stone-200 focus:border-stone-850 rounded-xl p-3.5 text-xs text-stone-900 outline-none transition-all font-semibold"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Customer Tags (Optional)</label>
                <input
                  type="text"
                  value={customerTags}
                  onChange={(e) => setCustomerTags(e.target.value)}
                  placeholder="e.g. VIP, Bridal, Regular (comma-separated)"
                  className="w-full bg-white border border-stone-200 focus:border-stone-850 rounded-xl p-3.5 text-xs text-stone-900 outline-none transition-all font-semibold"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Initial Loyalty Points (Optional)</label>
                <input
                  type="number"
                  value={customerLoyaltyPoints || ""}
                  onChange={(e) => setCustomerLoyaltyPoints(parseInt(e.target.value) || 0)}
                  placeholder="e.g. 100"
                  className="w-full bg-white border border-stone-200 focus:border-stone-850 rounded-xl p-3.5 text-xs text-stone-900 outline-none transition-all font-semibold"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Portal Password (Optional)</label>
                <input
                  type="text"
                  value={customerPassword}
                  onChange={(e) => setCustomerPassword(e.target.value)}
                  placeholder="Set login password for member portal"
                  className="w-full bg-white border border-stone-200 focus:border-stone-850 rounded-xl p-3.5 text-xs text-stone-900 outline-none transition-all font-semibold"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-stone-900 hover:bg-stone-850 text-white font-semibold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Plus className="size-4.5" /> Register Customer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: ADD BOOKING ─── */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-stone-200 rounded-3xl p-8 shadow-xl text-left space-y-6">
            <div className="flex justify-between items-center border-b border-stone-200 pb-3.5">
              <h3 className="font-semibold text-lg text-stone-900">
                {editingBooking ? "Edit Booking Details" : "Schedule Slot Entry"}
              </h3>
              <button 
                onClick={() => {
                  setIsBookingModalOpen(false);
                  setEditingBooking(null);
                  setBookingError("");
                }} 
                className="text-stone-400 hover:text-stone-900 text-xl font-bold cursor-pointer transition-colors"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveBooking} className="space-y-6 text-sm">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={bookingCustName}
                    onChange={(e) => setBookingCustName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full bg-white border border-stone-200 focus:border-stone-850 rounded-xl p-3.5 text-xs text-stone-900 outline-none transition-all font-semibold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider">WhatsApp Mobile</label>
                  <input
                    type="tel"
                    required
                    value={bookingCustPhone}
                    onChange={(e) => setBookingCustPhone(e.target.value)}
                    placeholder="e.g. +91 98450 11204"
                    className="w-full bg-white border border-stone-200 focus:border-stone-850 rounded-xl p-3.5 text-xs text-stone-900 outline-none transition-all font-semibold"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Billed Service</label>
                <select
                  value={bookingServiceName}
                  onChange={(e) => setBookingServiceName(e.target.value)}
                  className="w-full bg-white border border-stone-200 focus:border-stone-850 rounded-xl p-3.5 text-xs text-stone-900 outline-none transition-all font-semibold"
                >
                  {services.map(s => (
                    <option key={s.id} value={s.name}>{s.name} (₹{s.price})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Assigned Stylist</label>
                <select
                  value={bookingStylist}
                  onChange={(e) => setBookingStylist(e.target.value)}
                  className="w-full bg-white border border-stone-200 focus:border-stone-850 rounded-xl p-3.5 text-xs text-stone-900 outline-none transition-all font-semibold"
                >
                  {cmsStylists.filter(s => getStylistOutletId(s) === selectedOutletId).map(s => (
                    <option key={s.id} value={s.name}>{s.name} ({s.role})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Scheduled Date</label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full bg-white border border-stone-200 focus:border-stone-850 rounded-xl p-3.5 text-xs text-stone-900 outline-none transition-all font-semibold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Scheduled Time</label>
                  <select
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full bg-white border border-stone-200 focus:border-stone-850 rounded-xl p-3.5 text-xs text-stone-900 outline-none transition-all font-semibold"
                  >
                    <option value="09:30 AM">09:30 AM</option>
                    <option value="10:45 AM">10:45 AM</option>
                    <option value="11:30 AM">11:30 AM</option>
                    <option value="01:00 PM">01:00 PM</option>
                    <option value="02:30 PM">02:30 PM</option>
                    <option value="04:00 PM">04:00 PM</option>
                  </select>
                </div>
              </div>

              {bookingError && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl leading-relaxed">
                  ⚠️ {bookingError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-stone-900 hover:bg-stone-850 text-white font-semibold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Calendar className="size-4.5" /> {editingBooking ? "Save Changes" : "Schedule Slot"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── POS INVOICE MODAL (BILL RECEIPT GENERATED) ─── */}
      {isInvoiceOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl text-slate-900 border border-slate-100 flex flex-col gap-4 text-left font-mono">

            {/* Logo and store title */}
            <div className="text-center space-y-1 border-b border-dashed border-slate-200 pb-4">
              <span className="text-xs text-slate-400 font-extrabold uppercase tracking-widest">Invoice Generated</span>
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">{businessName}</h2>
              <span className="text-[10px] text-slate-500 block">Queue ticket: {generatedInvoiceNum}</span>
            </div>

            {/* Billed info */}
            <div className="space-y-1.5 text-xs text-slate-500 border-b border-dashed border-slate-200 pb-4">
              <div className="flex justify-between">
                <span>Tenant Isolation ID:</span>
                <span className="font-bold text-slate-800">ten_{tenantSlug}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer Member:</span>
                <span className="font-bold text-slate-800">{customers[activeCrmIndex]?.name || "Anonymous Walkin"}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Mode:</span>
                <span className="font-bold text-slate-800 uppercase">{selectedPayment} Gateway</span>
              </div>
              <div className="flex justify-between">
                <span>Checkout Date:</span>
                <span className="font-bold text-slate-800">{new Date().toISOString().split("T")[0]}</span>
              </div>
            </div>

            {/* Itemized list */}
            <div className="space-y-2 border-b border-dashed border-slate-200 pb-4 text-xs">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Itemized Rows</span>
              {cart.map(item => (
                <div key={item.id} className="flex justify-between">
                  <span className="text-slate-600 pr-4">{item.name} ×{item.qty}</span>
                  <span className="font-bold text-slate-800">₹{item.price * item.qty}.00</span>
                </div>
              ))}
            </div>

            {/* Sum breakdown */}
            <div className="space-y-1.5 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>Gross Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>SaaS Coupon Discount:</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-[10px] text-slate-450">
                <span>GST (18% inclusive tax):</span>
                <span>₹{gstInclusiveAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-slate-800 border-t border-slate-100 pt-2">
                <span>Invoice Total:</span>
                <span>₹{netSubtotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout receipt footer */}
            <div className="pt-4 flex justify-between gap-3">
              <button
                onClick={completeCheckout}
                className="flex-1 py-2 bg-[#075e54] text-white rounded-lg text-xs font-bold shadow-md hover:bg-[#128c7e] transition-all cursor-pointer text-center"
              >
                Close Ticket & Print
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─── MODAL: ADD/EDIT USER ─── */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-md flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setIsUserModalOpen(false)}>
          <div className="w-full max-w-lg bg-white border border-stone-200 rounded-3xl shadow-2xl text-left flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-stone-100 px-8 py-5 shrink-0">
              <div>
                <h3 className="font-semibold text-base text-stone-900">
                  {editingUser ? "Edit User / Staff" : "Add User / Staff"}
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">{editingUser ? "Update staff role and permissions" : "Create a new user account or staff profile"}</p>
              </div>
              <button onClick={() => setIsUserModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-xl text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-all cursor-pointer text-lg font-light">
                ×
              </button>
            </div>

            {/* Scrollable body */}
            <form onSubmit={handleSaveUser} className="overflow-y-auto p-8 space-y-5 text-sm flex-1">

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Full Name <span className="text-rose-400">*</span></label>
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. Elena Rostova"
                  className="w-full bg-stone-50 border border-stone-200 focus:border-stone-800 focus:bg-white rounded-xl px-4 py-3 text-sm text-stone-900 outline-none transition-all placeholder:text-stone-300 font-medium"
                />
              </div>

              {/* Email + Phone */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Email Address <span className="text-rose-400">*</span></label>
                  <input
                    type="email"
                    required
                    value={teamEmail}
                    onChange={(e) => setTeamEmail(e.target.value)}
                    placeholder="elena@example.com"
                    className="w-full bg-stone-50 border border-stone-200 focus:border-stone-800 focus:bg-white rounded-xl px-4 py-3 text-sm text-stone-900 outline-none transition-all placeholder:text-stone-300 font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Mobile Phone <span className="text-rose-400">*</span></label>
                  <input
                    type="tel"
                    required
                    value={teamPhone}
                    onChange={(e) => setTeamPhone(e.target.value)}
                    placeholder="+91 99888 77777"
                    className="w-full bg-stone-50 border border-stone-200 focus:border-stone-800 focus:bg-white rounded-xl px-4 py-3 text-sm text-stone-900 outline-none transition-all placeholder:text-stone-300 font-medium"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                  Password {editingUser ? <span className="text-stone-300">(leave blank to keep current)</span> : <span className="text-rose-400">*</span>}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={teamPassword}
                  onChange={(e) => setTeamPassword(e.target.value)}
                  placeholder={editingUser ? "••••••••" : "Min. 6 characters"}
                  className="w-full bg-stone-50 border border-stone-200 focus:border-stone-800 focus:bg-white rounded-xl px-4 py-3 text-sm text-stone-900 outline-none transition-all placeholder:text-stone-300 font-medium"
                />
              </div>

              {/* Role + Outlet */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">User Role <span className="text-rose-400">*</span></label>
                  <select
                    value={teamRole}
                    onChange={(e) => setTeamRole(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 focus:border-stone-800 focus:bg-white rounded-xl px-4 py-3 text-sm text-stone-900 outline-none transition-all font-medium cursor-pointer"
                  >
                    <option value="STYLIST">Stylist / Therapist</option>
                    <option value="MANAGER">Outlet Manager</option>
                    <option value="RECEPTIONIST">Receptionist</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Assign Outlet</label>
                  <select
                    value={teamOutletId}
                    onChange={(e) => setTeamOutletId(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 focus:border-stone-800 focus:bg-white rounded-xl px-4 py-3 text-sm text-stone-900 outline-none transition-all font-medium cursor-pointer"
                  >
                    <option value="">All Outlets (Global)</option>
                    {cmsOutlets.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Specialization (if Stylist) */}
              {teamRole === "STYLIST" && (
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Specialization <span className="text-rose-400">*</span></label>
                  <input
                    type="text"
                    required
                    value={teamSpecialization}
                    onChange={(e) => setTeamSpecialization(e.target.value)}
                    placeholder="e.g. Haircuts, Fades & Balayage"
                    className="w-full bg-stone-50 border border-stone-200 focus:border-stone-800 focus:bg-white rounded-xl px-4 py-3 text-sm text-stone-900 outline-none transition-all placeholder:text-stone-300 font-medium"
                  />
                </div>
              )}

              {/* Working Days (if Stylist) */}
              {teamRole === "STYLIST" && (
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                    Working Days
                    <span className="ml-2 text-stone-300 font-medium normal-case tracking-normal">
                      (unchecked = weekly off)
                    </span>
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { label: "Sun", value: 0 },
                      { label: "Mon", value: 1 },
                      { label: "Tue", value: 2 },
                      { label: "Wed", value: 3 },
                      { label: "Thu", value: 4 },
                      { label: "Fri", value: 5 },
                      { label: "Sat", value: 6 },
                    ].map(({ label, value }) => {
                      const isWorking = teamWorkingDays.includes(value);
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            setTeamWorkingDays(prev =>
                              prev.includes(value)
                                ? prev.filter(d => d !== value)
                                : [...prev, value].sort((a, b) => a - b)
                            )
                          }
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider border transition-all cursor-pointer select-none ${isWorking
                              ? "bg-stone-900 text-white border-stone-900"
                              : "bg-rose-50 text-rose-400 border-rose-200 line-through"
                            }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-stone-400">
                    {teamWorkingDays.length === 0
                      ? "⚠️ No working days selected — staff won't appear on calendar."
                      : `Working ${teamWorkingDays.length} day${teamWorkingDays.length !== 1 ? "s" : ""} per week`}
                  </p>
                </div>
              )}

              {/* Status Toggle */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="teamIsActive"
                  checked={teamIsActive}
                  onChange={(e) => setTeamIsActive(e.target.checked)}
                  className="rounded border-stone-300 text-stone-900 focus:ring-stone-900 size-4 cursor-pointer"
                />
                <label htmlFor="teamIsActive" className="text-xs text-stone-700 font-semibold select-none cursor-pointer">
                  Account is Active (enable login &amp; assignment)
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm mt-2"
              >
                <Save className="size-4" /> {editingUser ? "Update User" : "Create User"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: CANCEL BOOKING CONFIRMATION ─── */}
      {bookingToCancel && (
        <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setBookingToCancel(null)}>
          <div className="w-full max-w-md bg-white border border-stone-200 rounded-3xl shadow-2xl text-left flex flex-col p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center border border-rose-200">
                <Ban className="size-5 text-rose-600" />
              </div>
              <h3 className="font-bold text-base text-stone-900">Cancel Appointment</h3>
            </div>
            
            <div className="space-y-2 text-stone-600 text-xs leading-relaxed">
              <p>Are you sure you want to cancel the booking for <strong className="text-stone-900">{bookingToCancel.customerName}</strong>?</p>
              <div className="bg-stone-50 border border-stone-150 p-3.5 rounded-xl space-y-1">
                <p><strong>Service:</strong> {bookingToCancel.serviceName}</p>
                <p><strong>Stylist:</strong> {bookingToCancel.stylistName}</p>
                <p><strong>Date & Time:</strong> {bookingToCancel.date || "Today"} at {bookingToCancel.time}</p>
                {bookingToCancel.totalPrice !== undefined && (
                  <p><strong>Amount:</strong> ₹{bookingToCancel.totalPrice}</p>
                )}
              </div>
              <p className="text-stone-400">This action will mark the appointment status as <span className="text-rose-650 font-bold uppercase text-[9px]">Cancelled</span> in the system.</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBookingToCancel(null)}
                className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer border border-stone-200 text-center"
              >
                No, Keep it
              </button>
              <button
                type="button"
                onClick={() => {
                  changeBookingStatus(bookingToCancel.id, "CANCELLED");
                  setBookingToCancel(null);
                }}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer text-center shadow-sm"
              >
                Yes, Cancel Booking
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function TenantAdminConsole({ params }: { params: Promise<{ tenantSlug: string }> }) {
  return (
    <Suspense fallback={
      <div className="min-h-[500px] flex items-center justify-center bg-white rounded-[2rem] border border-stone-200">
        <Sparkles className="size-8 text-stone-800 animate-spin" />
      </div>
    }>
      <TenantAdminConsoleInner params={params} />
    </Suspense>
  );
}
