"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getTenantBySlug, saveSharedTenant, getTenantHref } from "../../../../shared/utils/utils";
import { Calendar, Scissors, User, CheckCircle2, ChevronLeft, Star, Tag, Lock, Clock, ArrowRight } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

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
}
interface StylistModel { id: string; name: string; role: string; rating: number; totalReviews: number; avatar: string; specialty: string; workDays?: string[]; }

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

/** Convert "09:30 AM" → minutes since midnight */
function slotToMinutes(slot: string): number {
  const [time, period] = slot.split(" ");
  let [h, m] = time.split(":").map(Number);
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

const generateDynamicSlots = (timingsStr: string = "09:00 AM - 09:00 PM", serviceDurationMins: number = 30) => {
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
  const step = 15; 
  
  while (currMin + serviceDurationMins <= endLimit) {
    const h24 = Math.floor(currMin / 60);
    const m = currMin % 60;
    const period = h24 >= 12 ? "PM" : "AM";
    let h12 = h24 % 12;
    if (h12 === 0) h12 = 12;
    const timeStr = `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
    slots.push(timeStr);
    currMin += step;
  }
  return slots;
};

/** "HH:MM" → minutes since midnight */
function hhmToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** "YYYY-MM-DD" → day-of-week string (Mon, Tue …) */
function dateToDayLabel(dateStr: string): string {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const idx = new Date(y, mo - 1, d).getDay();
  return DAYS[idx];
}

export default function BookingPage() {
  const params = useParams();
  const tenantSlug = (params?.tenantSlug as string) || "luxcuts";

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Theme
  const [activeTemplate, setActiveTemplate] = useState<"LUXURY"|"MINIMAL"|"SPA"|"BARBER"|"WELLNESS">("LUXURY");
  const [accentColor, setAccentColor] = useState<"gold"|"rose"|"emerald"|"amber">("gold");
  const [customTextColor, setCustomTextColor] = useState("");
  const [customHeadingColor, setCustomHeadingColor] = useState("");
  const [customButtonColor, setCustomButtonColor] = useState("");
  const [businessName, setBusinessName] = useState("Salon");
  const [selectedOutletTimings, setSelectedOutletTimings] = useState("09:00 AM - 09:00 PM");
  const [logoUrl, setLogoUrl] = useState("");

  // Booking
  const [services, setServices] = useState<ServiceModel[]>([]);
  const [allStylists, setAllStylists] = useState<StylistModel[]>([]);
  const [outlets, setOutlets] = useState<any[]>([]);
  const [bookService, setBookService] = useState<ServiceModel | null>(null);
  const [bookStylist, setBookStylist] = useState<StylistModel | null>(null);
  const [bookDate, setBookDate] = useState(new Date().toISOString().split("T")[0]);
  const [bookTime, setBookTime] = useState("");
  const [bookCoupon, setBookCoupon] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [activeCouponCode, setActiveCouponCode] = useState("LUXFIRST");
  const [activeDiscountPercent, setActiveDiscountPercent] = useState(15);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [existingBookings, setExistingBookings] = useState<any[]>([]);
  const [bookingDone, setBookingDone] = useState(false);
  const [scheduleOverrides, setScheduleOverrides] = useState<Record<string, Record<string, { blocked: string[] }>>>({});
  const [selectedOutletId, setSelectedOutletId] = useState<string>("");
  const [pendingServiceId, setPendingServiceId] = useState<string>("");
  const [pendingStylistId, setPendingStylistId] = useState<string>("");
  const [lastSelectedOutletId, setLastSelectedOutletId] = useState<string>("");
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (pendingServiceId && services.length > 0) {
      const match = services.find(s => s.id === pendingServiceId);
      if (match) {
        setBookService(match);
        setPendingServiceId("");
      }
    }
  }, [services, pendingServiceId]);

  useEffect(() => {
    if (pendingStylistId && allStylists.length > 0) {
      const match = allStylists.find(s => s.id === pendingStylistId);
      if (match) {
        setBookStylist(match);
        setPendingStylistId("");
      }
    }
  }, [allStylists, pendingStylistId]);

  useEffect(() => {
    if (selectedOutletId && lastSelectedOutletId && selectedOutletId !== lastSelectedOutletId) {
      // Clear selections if outlet changes
      setBookService(null);
      setBookStylist(null);
      setBookTime("");
      setCouponDiscount(0);
    }
    setLastSelectedOutletId(selectedOutletId);
  }, [selectedOutletId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const searchParams = new URLSearchParams(window.location.search);
    const urlServiceId = searchParams.get("service");
    if (urlServiceId) {
      setPendingServiceId(urlServiceId);
    }

    // Fetch coupons from backend API
    fetch("/api/coupons", {
      headers: { "x-tenant-slug": tenantSlug }
    })
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.data || []);
        const mappedList = list.map((c: any) => ({
          ...c,
          discountPercent: c.discountPercent !== undefined ? c.discountPercent : (Number(c.value) || 0),
          minBill: c.minBill !== undefined ? c.minBill : (Number(c.minOrderValue) || 0),
          status: c.status ? c.status : (c.isActive ? "ACTIVE" : "INACTIVE"),
        }));
        setCoupons(mappedList.filter((c: any) => c.status === "ACTIVE" || c.status === "active"));
      })
      .catch(err => console.error("Failed to load coupons", err));

    getTenantBySlug(tenantSlug).then(match => {
      if (!match) return;
      setBusinessName(match.name || "Salon");
      if (match.activeTemplate) setActiveTemplate(match.activeTemplate);
      if (match.accentColor) setAccentColor(match.accentColor);
      if (match.customTextColor) setCustomTextColor(match.customTextColor);
      if (match.customHeadingColor) setCustomHeadingColor(match.customHeadingColor);
      if (match.customButtonColor) setCustomButtonColor(match.customButtonColor);
      if (match.logoUrl) setLogoUrl(match.logoUrl);
      if (match.scheduleOverrides) setScheduleOverrides(match.scheduleOverrides);
      
      const matchOutlets = match.outlets || [];
      
      // Fetch outlets dynamically
      fetch("/api/outlets", {
        headers: { "x-tenant-slug": tenantSlug }
      })
      .then(res => res.json())
      .then(outletsData => {
        const list = Array.isArray(outletsData) ? outletsData : (outletsData?.data || []);
        const mergedList = list.map((o: any) => {
          const localMatch = matchOutlets.find((lo: any) => lo.slug === o.slug || lo.id === o.id);
          return {
            ...o,
            heroTitle: localMatch?.heroTitle,
            heroSubtitle: localMatch?.heroSubtitle,
            couponCode: localMatch?.couponCode,
            couponDiscount: localMatch?.couponDiscount,
            logoUrl: localMatch?.logoUrl,
            sectionsJson: localMatch?.sectionsJson
          };
        });
        setOutlets(mergedList);

        // Resolve outlet ID (URL search param > draft > default/none)
        let resolvedOutletId = searchParams.get("outlet") || "";
        const draftStr = localStorage.getItem(`draft_booking_${tenantSlug}`);
        let draft: any = null;
        if (draftStr) {
          try {
            draft = JSON.parse(draftStr);
            if (draft.outletId) {
              resolvedOutletId = draft.outletId;
            }
          } catch (e) {
            console.warn("Failed to parse draft booking:", e);
          }
        }

        // Force user to pick outlet if multiple outlets exist and no outlet is pre-specified
        if (!resolvedOutletId && mergedList.length === 1) {
          resolvedOutletId = mergedList[0].id;
        }
        setSelectedOutletId(resolvedOutletId);

        if (resolvedOutletId) {
          const outletObj = mergedList.find((o: any) => o.id === resolvedOutletId);
          if (outletObj) {
            if (outletObj.couponCode) setActiveCouponCode(outletObj.couponCode);
            if (outletObj.couponDiscount !== undefined) setActiveDiscountPercent(outletObj.couponDiscount);
            if (outletObj.timings) setSelectedOutletTimings(outletObj.timings);
          } else {
            if (match.couponCode) setActiveCouponCode(match.couponCode);
            if (match.couponDiscount !== undefined) setActiveDiscountPercent(match.couponDiscount);
          }
        } else {
          if (match.couponCode) setActiveCouponCode(match.couponCode);
          if (match.couponDiscount !== undefined) setActiveDiscountPercent(match.couponDiscount);
        }

        // Restore draft fields if present
        if (draft) {
          if (draft.date) setBookDate(draft.date);
          if (draft.time) setBookTime(draft.time);
          if (draft.coupon) setBookCoupon(draft.coupon);
          if (draft.serviceId) setPendingServiceId(draft.serviceId);
          if (draft.stylistId) setPendingStylistId(draft.stylistId);
          localStorage.removeItem(`draft_booking_${tenantSlug}`);
        }
      })
      .catch(err => console.error("Failed to fetch outlets from DB", err));
    });

    const session = localStorage.getItem(`tenant_user_session_${tenantSlug}`);
    if (session) setLoggedInUser(JSON.parse(session));
  }, [tenantSlug]);

  // Load services and stylists dynamically when selectedOutletId changes
  useEffect(() => {
    if (!selectedOutletId) {
      setServices([]);
      setAllStylists([]);
      return;
    }

    // Fetch services for this specific outlet
    fetch(`/api/services?all=true&outletId=${selectedOutletId}`, {
      headers: { "x-tenant-slug": tenantSlug }
    })
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.data || []);
        const mappedList: ServiceModel[] = list.map((s: any) => ({
          id: s.id,
          name: s.name,
          category: (typeof s.category === 'object' ? s.category?.name : s.category) || "General",
          duration: s.duration || 45,
          price: Number(s.price),
          offerPrice: (s.offerPrice !== null && s.offerPrice !== undefined) ? Number(s.offerPrice) : null,
          isCombo: !!s.isCombo,
          comboServiceIds: s.comboServiceIds || [],
          desc: s.description || "",
          images: s.images || [],
          tags: s.tags || [],
          imageUrl: s.imageUrl || ""
        }));
        setServices(mappedList);
      })
      .catch(err => {
        console.warn("Failed to load services:", err);
        setServices([]);
      });

    // Fetch stylists for this specific outlet
    fetch(`/api/users?role=STYLIST&outletId=${selectedOutletId}`, {
      headers: { "x-tenant-slug": tenantSlug }
    })
      .then(res => res.json())
      .then(stylistsData => {
        const sList = Array.isArray(stylistsData) ? stylistsData : (stylistsData?.data || []);
        const rawStylists = sList.map((u: any) => {
          const apiWorkingDays = u.staffProfile?.workingDays;
          const workingDaysArray = Array.isArray(apiWorkingDays) && apiWorkingDays.length > 0
            ? apiWorkingDays
            : [1, 2, 3, 4, 5, 6]; // Default to Mon-Sat

          const workDays = workingDaysArray.map((d: number) => DAYS[d % 7]);

          return {
            id: u.id,
            name: u.name,
            role: u.role,
            rating: u.staffProfile?.rating || 5.0,
            totalReviews: u.staffProfile?.totalRatings || 0,
            specialty: u.staffProfile?.specializations || "Stylist",
            avatar: u.name.split(" ").map((n: string) => n[0]).join("").toUpperCase(),
            outletId: u.outletId,
            workDays: workDays
          };
        });
        setAllStylists(rawStylists);
      })
      .catch(err => {
        console.error("Failed to load stylists:", err);
        setAllStylists([]);
      });

    const outletObj = outlets.find((o: any) => o.id === selectedOutletId);
    if (outletObj) {
      if (outletObj.couponCode) setActiveCouponCode(outletObj.couponCode);
      if (outletObj.couponDiscount !== undefined) setActiveDiscountPercent(outletObj.couponDiscount);
      if (outletObj.timings) setSelectedOutletTimings(outletObj.timings);
    }
  }, [selectedOutletId, outlets, tenantSlug]);

  // Verify customer session cookie is still valid on mount
  useEffect(() => {
    if (typeof window === "undefined" || !tenantSlug) return;
    fetch("/api/customers/verify-session", {
      headers: { "x-tenant-slug": tenantSlug }
    })
      .then(res => res.json())
      .then(data => {
        if (data.ok && data.customer) {
          // Session is valid — sync localStorage with latest customer data
          const current = localStorage.getItem(`tenant_user_session_${tenantSlug}`);
          if (!current) {
            localStorage.setItem(`tenant_user_session_${tenantSlug}`, JSON.stringify(data.customer));
            setLoggedInUser(data.customer);
          }
        } else {
          // Cookie is gone/expired — clear stale localStorage and force re-login
          localStorage.removeItem(`tenant_user_session_${tenantSlug}`);
          setLoggedInUser(null);
        }
      })
      .catch(() => { /* backend offline — keep existing state */ });
  }, [tenantSlug]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.title = `Book Appointment | ${businessName}`;
    }
  }, [businessName]);

  useEffect(() => {
    if (!bookStylist || !bookDate || !selectedOutletId) {
      setExistingBookings([]);
      return;
    }

    fetch(`/api/bookings/slots?outletId=${selectedOutletId}&staffId=${bookStylist.id}&date=${bookDate}`, {
      headers: { "x-tenant-slug": tenantSlug }
    })
      .then(res => res.json())
      .then(data => {
        setExistingBookings(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.warn("Failed to load busy slots:", err);
        setExistingBookings([]);
      });
  }, [bookStylist, bookDate, selectedOutletId, tenantSlug]);

  // ─── Derived: available stylists for selected date ─────────────────
  const availableStylists = allStylists.filter(st => {
    const dayLabel = dateToDayLabel(bookDate);
    const workDays: string[] = (st as any).workDays || ["Mon","Tue","Wed","Thu","Fri"];
    return workDays.includes(dayLabel);
  });

  // ─── Derived: available time slots for selected date + stylist schedule ───
  const dynamicSlots = generateDynamicSlots(selectedOutletTimings, bookService?.duration || 30);
  const availableSlots = dynamicSlots.filter(slot => {
    if (bookDate < today) return false; // past date — no slots
    if (bookDate === today) {
      const now = new Date();
      const nowMins = now.getHours() * 60 + now.getMinutes();
      if (slotToMinutes(slot) <= nowMins + 30) return false; // past/near-now slots
    }
    
    // Parse time
    const [time, period] = slot.split(" ");
    let [h, m] = time.split(":").map(Number);
    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    
    const slotStart = new Date(`${bookDate}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
    const slotEnd = new Date(slotStart.getTime() + (bookService?.duration || 30) * 60 * 1000);

    // 1. Check database booking slot collisions
    if (existingBookings.length > 0) {
      const isOverlapping = existingBookings.some((b: any) => {
        const bStart = new Date(b.scheduledAt);
        const bEnd = new Date(b.endsAt);
        return slotStart < bEnd && slotEnd > bStart;
      });
      if (isOverlapping) return false;
    }

    // 2. Check local schedule overrides
    const key24 = `${String(h).padStart(2,"0")}:${m === 0 ? "00" : m}`;
    if (bookStylist) {
      const dayLabel = dateToDayLabel(bookDate);
      const blocked = scheduleOverrides[bookStylist.id]?.[dayLabel]?.blocked || [];
      if (blocked.includes(key24)) return false;
    }
    return true;
  });

  // If selected stylist is no longer available on new date, deselect
  useEffect(() => {
    if (bookStylist && !availableStylists.find(s => s.id === bookStylist.id)) {
      setBookStylist(null);
    }
  }, [bookDate, bookStylist, availableStylists]);

  // Validate selected time slot against availableSlots
  useEffect(() => {
    if (bookTime && !availableSlots.includes(bookTime)) {
      setBookTime("");
    }
  }, [availableSlots, bookTime]);

  // Theme config
  const theme = ({
    LUXURY: { bg:"bg-slate-950", text:"text-slate-100", card:"bg-slate-900 border-slate-800", input:"bg-slate-950 border-slate-850 text-slate-100", muted:"text-slate-500", divider:"border-slate-800", badge:"bg-amber-500/10 text-amber-400 border-amber-500/20", selectedCard:"border-rose-500 bg-rose-500/5", btn: customButtonColor ? "" : "bg-gradient-to-r from-rose-500 to-amber-500 text-white" },
    MINIMAL: { bg:"bg-neutral-50", text:"text-neutral-900", card:"bg-white border-neutral-200", input:"bg-white border-neutral-200 text-neutral-900", muted:"text-neutral-500", divider:"border-neutral-200", badge:"bg-stone-100 text-stone-700 border-stone-200", selectedCard:"border-stone-900 bg-stone-50", btn: customButtonColor ? "" : "bg-stone-900 text-white" },
    SPA: { bg:"bg-[#f4f7f6]", text:"text-[#2c3e35]", card:"bg-white border-teal-100", input:"bg-white border-teal-100 text-[#2c3e35]", muted:"text-teal-600/60", divider:"border-teal-100", badge:"bg-teal-50 text-teal-700 border-teal-100", selectedCard:"border-teal-600 bg-teal-50", btn: customButtonColor ? "" : "bg-teal-700 text-white" },
    BARBER: { bg:"bg-zinc-950", text:"text-zinc-100", card:"bg-zinc-900 border-zinc-800", input:"bg-zinc-950 border-zinc-800 text-zinc-100", muted:"text-zinc-500", divider:"border-zinc-800", badge:"bg-amber-500/10 text-amber-400 border-amber-500/20", selectedCard:"border-cyan-500 bg-cyan-500/5", btn: customButtonColor ? "" : "bg-cyan-500 text-black font-black" },
    WELLNESS: { bg:"bg-[#faf8f5]", text:"text-[#2c1d11]", card:"bg-white border-[#f0eae1]", input:"bg-white border-[#f0eae1] text-[#2c1d11]", muted:"text-[#8c6d53]/60", divider:"border-[#f0eae1]", badge:"bg-amber-50 text-amber-800 border-amber-805/20", selectedCard:"border-[#8c6239] bg-amber-50/20", btn: customButtonColor ? "" : "bg-[#8c6239] text-white" },
  } as Record<string, { bg: string; text: string; card: string; input: string; muted: string; divider: string; badge: string; selectedCard: string; btn: string }>)[activeTemplate] || { bg:"bg-slate-950", text:"text-slate-100", card:"bg-slate-900 border-slate-800", input:"bg-slate-950 border-slate-850 text-slate-100", muted:"text-slate-500", divider:"border-slate-800", badge:"bg-amber-500/10 text-amber-400 border-amber-500/20", selectedCard:"border-rose-500 bg-rose-500/5", btn: "" };

  const btnStyle = customButtonColor ? { backgroundColor: customButtonColor, color: "#fff" } : {};
  const headingStyle = customHeadingColor ? { color: customHeadingColor } : {};
  const textStyle = customTextColor ? { color: customTextColor } : {};

  const baseServicePrice = (bookService?.offerPrice !== null && bookService?.offerPrice !== undefined) ? Number(bookService.offerPrice) : (bookService?.price || 0);
  const grandTotal = baseServicePrice - couponDiscount;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookService) return;
    const entered = bookCoupon.trim().toUpperCase();
    const matched = coupons.find(c => c.code === entered && c.status === "ACTIVE");

    if (matched) {
      if (baseServicePrice < matched.minBill) {
        toast.error(`Minimum bill amount required to apply this coupon is ₹${matched.minBill}`);
        setCouponDiscount(0);
        return;
      }
      const rawDiscount = Math.round(baseServicePrice * matched.discountPercent / 100);
      const discount = matched.maxDiscount ? Math.min(rawDiscount, matched.maxDiscount) : rawDiscount;
      setCouponDiscount(discount);
      toast.success(`Coupon applied! Saved ₹${discount}`);
    } else {
      if (entered === activeCouponCode.toUpperCase()) {
        const discount = Math.round(baseServicePrice * activeDiscountPercent / 100);
        setCouponDiscount(discount);
        toast.success(`Campaign coupon applied! Saved ₹${discount}`);
      } else {
        setCouponDiscount(0);
        toast.error(`Invalid coupon code. Please try again.`);
      }
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInUser) {
      toast.error("Please log in to confirm your booking.");
      window.location.href = getTenantHref(tenantSlug, "/login?redirect=booking");
      return;
    }

    // Build the scheduledAt date object
    // bookDate is "YYYY-MM-DD"
    // bookTime is e.g. "09:30 AM" or "10:00 PM"
    let scheduledAt = new Date();
    try {
      const [time, period] = bookTime.split(" ");
      let [h, m] = time.split(":").map(Number);
      if (period === "PM" && h !== 12) h += 12;
      if (period === "AM" && h === 12) h = 0;
      scheduledAt = new Date(`${bookDate}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
    } catch (err) {
      scheduledAt = new Date(bookDate);
    }

    const payload = {
      outletId: selectedOutletId,
      customerId: loggedInUser.id,
      staffId: bookStylist ? bookStylist.id : undefined,
      scheduledAt: scheduledAt.toISOString(),
      items: [
        {
          serviceId: bookService?.id || "",
          staffId: bookStylist ? bookStylist.id : undefined,
        }
      ],
      notes: `Booked online. Total price: ₹${grandTotal}`,
      couponCode: couponDiscount > 0 ? (bookCoupon.trim().toUpperCase() || activeCouponCode) : undefined,
      couponDiscount: couponDiscount > 0 ? couponDiscount : undefined
    };

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-slug": tenantSlug
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.error || "Failed to confirm booking on the server.");
        return;
      }

      // Send mock WhatsApp confirmation message
      const isWhatsAppConnected = localStorage.getItem(`tenant_whatsapp_connected_${tenantSlug}`) === "true";
      if (isWhatsAppConnected) {
        const templatesKey = `tenant_whatsapp_templates_${tenantSlug}`;
        const defaultTemplates = [
          { id: "tmpl_3", type: "booking_confirmation", name: "Confirmation Formal", text: "Dear {{name}}, your appointment for {{service}} with {{stylist}} on {{date}} at {{time}} is confirmed at {{brand}} ({{outlet}}). Thank you for choosing us!" },
          { id: "tmpl_4", type: "booking_confirmation", name: "Confirmation Casual", text: "Yay! Your booking is locked in, {{name}}. 📅 {{service}} with {{stylist}} | ⏰ {{time}}, {{date}} at {{brand}} ({{outlet}}). See you soon!" }
        ];
        const templates = JSON.parse(localStorage.getItem(templatesKey) || JSON.stringify(defaultTemplates));
        const confirmTemplates = templates.filter((t: any) => t.type === "booking_confirmation");
        const randomTemplate = confirmTemplates[Math.floor(Math.random() * confirmTemplates.length)] || defaultTemplates[0];

        let messageText = randomTemplate.text;
        const vars: { [key: string]: string } = {
          name: loggedInUser.name,
          service: bookService?.name || "",
          stylist: bookStylist?.name || "",
          date: bookDate,
          time: bookTime,
          brand: tenantSlug.toUpperCase(),
          outlet: outlets.find((o: any) => o.id === selectedOutletId)?.name || "Main Outlet"
        };

        Object.entries(vars).forEach(([key, val]) => {
          messageText = messageText.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), val);
        });

        const logsKey = `tenant_whatsapp_logs_${tenantSlug}`;
        const existingLogs = JSON.parse(localStorage.getItem(logsKey) || "[]");
        const newLog = {
          id: `log_${Date.now()}`,
          recipientName: loggedInUser.name,
          phone: loggedInUser.phone,
          type: "booking_confirmation",
          templateName: randomTemplate.name,
          messageText,
          timestamp: new Date().toLocaleString(),
          status: "Sent"
        };
        existingLogs.unshift(newLog);
        localStorage.setItem(logsKey, JSON.stringify(existingLogs));

        // Simulate delivery/read status updates
        setTimeout(() => {
          const currentLogs = JSON.parse(localStorage.getItem(logsKey) || "[]");
          const updated = currentLogs.map((l: any) => l.id === newLog.id ? { ...l, status: "Delivered" } : l);
          localStorage.setItem(logsKey, JSON.stringify(updated));
        }, 1500);

        setTimeout(() => {
          const currentLogs = JSON.parse(localStorage.getItem(logsKey) || "[]");
          const updated = currentLogs.map((l: any) => l.id === newLog.id ? { ...l, status: "Read" } : l);
          localStorage.setItem(logsKey, JSON.stringify(updated));
        }, 3000);
      }

      toast.success("Booking confirmed successfully!");
      setBookingDone(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to connect to the backend server. Please try again.");
    }
  };

  const ready = bookService && bookStylist && bookDate && bookTime;

  if (bookingDone) return (
    <div className={`min-h-screen flex items-center justify-center ${theme.bg} ${theme.text}`}>
      <div className="text-center space-y-6 p-8 max-w-md">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
          <CheckCircle2 className="size-10 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={headingStyle}>Booking Confirmed!</h1>
          <p className="mt-2 opacity-60 text-sm" style={textStyle}>{bookService?.name} with {bookStylist?.name} on {bookDate} @ {bookTime}</p>
          <p className="font-black text-xl mt-3" style={headingStyle}>Total: ₹{grandTotal.toLocaleString()}</p>
        </div>
        <a href={isMounted ? getTenantHref(tenantSlug, "/") : "/"} className={`inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm ${theme.btn}`} style={btnStyle}>
          Back to Home <ArrowRight className="size-4" />
        </a>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} font-sans`}>
      {/* Header */}
      <nav className={`sticky top-0 z-30 border-b ${theme.divider} backdrop-blur-md bg-inherit/80 px-4 py-3.5 flex items-center justify-between`}>
        <a href={isMounted ? getTenantHref(tenantSlug, "/") : "/"} className={`flex items-center gap-2 text-xs font-bold ${theme.muted} hover:opacity-80 transition-opacity`}>
          <ChevronLeft className="size-4" />Back to Storefront
        </a>
        <div className="flex items-center gap-3">
          {logoUrl ? <img src={logoUrl} alt={businessName} className="h-7 w-auto object-contain" /> : (
            <span className="font-black text-base tracking-tight uppercase" style={headingStyle}>{businessName}</span>
          )}
        </div>
        {loggedInUser ? (
          <span className={`text-xs font-bold ${theme.muted}`}>Hi, {loggedInUser.name.split(" ")[0]}</span>
        ) : (
          <a href={isMounted ? getTenantHref(tenantSlug, "/login?redirect=booking") : "/login?redirect=booking"}
             onClick={() => {
               const draftBooking = {
                 outletId: selectedOutletId,
                 serviceId: bookService?.id,
                 stylistId: bookStylist?.id,
                 date: bookDate,
                 time: bookTime,
                 coupon: bookCoupon,
               };
               localStorage.setItem(`draft_booking_${tenantSlug}`, JSON.stringify(draftBooking));
             }}
             className={`text-xs font-bold ${theme.muted} underline`}>Sign In</a>
        )}
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        {/* Title */}
        <div className="mb-10 text-center space-y-2">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest ${theme.badge}`}>
            <Calendar className="size-3" /> Book Your Appointment
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mt-3" style={headingStyle}>Reserve Your Slot</h1>
          <p className="opacity-60 text-sm" style={textStyle}>Select an outlet, service, specialist, and time — all in one view.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT — Selections */}
          <div className="lg:col-span-2 space-y-6">

            {/* SECTION 1: Outlets */}
            <div className={`rounded-2xl border p-5 space-y-4 ${theme.card}`}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                  <Calendar className="size-3.5 text-rose-400" />
                </div>
                <span className="font-extrabold text-sm tracking-tight" style={headingStyle}>1. Choose Outlet</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {outlets.map(o => (
                  <button key={o.id} type="button" onClick={() => setSelectedOutletId(o.id)}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${selectedOutletId === o.id ? theme.selectedCard : theme.card} hover:opacity-90`}>
                    <div>
                      <p className="font-bold text-sm" style={selectedOutletId === o.id ? headingStyle : textStyle}>{o.name}</p>
                      <p className={`text-[10px] mt-0.5 ${theme.muted}`}>{o.address}, {o.city}</p>
                      {o.phone && <p className={`text-[9px] mt-1 ${theme.muted}`}>{o.phone}</p>}
                    </div>
                    {selectedOutletId === o.id && <div className="mt-2 flex items-center gap-1 text-emerald-500 text-[10px] font-bold"><CheckCircle2 className="size-3" />Selected</div>}
                  </button>
                ))}
              </div>
            </div>

            {/* SECTION 2: Services */}
            <div className={`rounded-2xl border p-5 space-y-4 ${theme.card} ${!selectedOutletId ? "opacity-45 pointer-events-none" : ""}`}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                  <Scissors className="size-3.5 text-rose-400" />
                </div>
                <span className="font-extrabold text-sm tracking-tight" style={headingStyle}>2. Choose Service</span>
              </div>
              {!selectedOutletId ? (
                <p className={`text-xs ${theme.muted}`}>Please select an outlet first.</p>
              ) : services.length === 0 ? (
                <p className={`text-xs ${theme.muted}`}>No services available for this outlet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {services.map(s => {
                    const hasOffer = s.offerPrice !== null && s.offerPrice !== undefined;
                    const effectivePrice = hasOffer ? Number(s.offerPrice) : s.price;
                    return (
                      <button key={s.id} type="button" onClick={() => setBookService(s)}
                        className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${bookService?.id === s.id ? theme.selectedCard : theme.card} hover:opacity-90`}>
                        <div className="flex justify-between items-start gap-2">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <p className="font-bold text-sm" style={bookService?.id === s.id ? headingStyle : textStyle}>{s.name}</p>
                              {s.isCombo && (
                                <span className="px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-450 text-[8px] font-bold uppercase tracking-wider">Combo</span>
                              )}
                              {!s.isCombo && hasOffer && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-bold uppercase tracking-wider">Offer</span>
                              )}
                            </div>
                            <p className={`text-[10px] ${theme.muted}`}><Clock className="size-2.5 inline mr-1" />{s.duration} Mins · {s.category}</p>
                            {s.desc && <p className={`text-[10px] leading-relaxed ${theme.muted}`}>{s.desc}</p>}
                          </div>
                          <div className="flex flex-col items-end shrink-0">
                            <span className="font-black text-base" style={headingStyle}>₹{effectivePrice.toLocaleString()}</span>
                            {hasOffer && (
                              <span className="text-[10px] text-slate-500 line-through">₹{s.price.toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                        {bookService?.id === s.id && <div className="mt-2 flex items-center gap-1 text-emerald-500 text-[10px] font-bold"><CheckCircle2 className="size-3" />Selected</div>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SECTION 3: Choose Date & Specialist */}
            <div className={`rounded-2xl border p-5 space-y-4 ${theme.card} ${!bookService ? "opacity-45 pointer-events-none" : ""}`}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                  <User className="size-3.5 text-rose-400" />
                </div>
                <span className="font-extrabold text-sm tracking-tight" style={headingStyle}>3. Choose Date & Specialist</span>
              </div>
              {!bookService ? (
                <p className={`text-xs ${theme.muted}`}>Please select a service first.</p>
              ) : (
                <div className="space-y-4">
                  {/* Date Input */}
                  <div className={`border-b pb-4 ${theme.divider}`}>
                    <label className={`block text-[10px] font-bold uppercase tracking-widest mb-1.5 ${theme.muted}`}>Date</label>
                    <input 
                      type="date" 
                      value={bookDate} 
                      min={today} 
                      onChange={e => setBookDate(e.target.value)}
                      onClick={(e) => {
                        try {
                          e.currentTarget.showPicker();
                        } catch (err) {}
                      }}
                      className={`w-full border rounded-xl py-2.5 px-4 text-sm font-semibold outline-none transition-all cursor-pointer ${theme.input}`} 
                    />
                  </div>

                  {/* Specialist Grid */}
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-widest mb-3 ${theme.muted}`}>Select Specialist</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {availableStylists.length === 0 ? (
                        <div className={`col-span-3 rounded-xl border p-6 text-center ${theme.card}`}>
                          <User className={`size-8 mx-auto mb-2 ${theme.muted} opacity-40`} />
                          <p className={`text-xs font-bold ${theme.muted}`}>No specialists available on {new Date(bookDate + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
                          <p className={`text-[10px] mt-1 ${theme.muted} opacity-60`}>Try a different date — stylists have set their working days.</p>
                        </div>
                      ) : availableStylists.map(st => (
                        <button key={st.id} type="button" onClick={() => setBookStylist(st)}
                          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${bookStylist?.id === st.id ? theme.selectedCard : theme.card} hover:opacity-90`}>
                          <div className="w-12 h-12 rounded-full border-2 flex items-center justify-center font-black text-sm text-rose-400 mb-3 mx-auto"
                            style={{ borderColor: bookStylist?.id === st.id ? customButtonColor || "#f43f5e" : "transparent", background: "rgba(244,63,94,0.08)" }}>
                            {st.avatar}
                          </div>
                          <p className="font-bold text-xs text-center" style={bookStylist?.id === st.id ? headingStyle : textStyle}>{st.name}</p>
                          <p className={`text-[9px] text-center mt-0.5 ${theme.muted}`}>{st.role}</p>
                          <p className={`text-[9px] text-center mt-0.5 ${theme.muted}`}>{st.specialty}</p>
                          <div className="flex items-center justify-center gap-1 mt-2 text-amber-400 text-[10px] font-bold">
                            <Star className="size-3 fill-amber-400" />{st.rating}
                          </div>
                          {(st as any).startTime && (
                            <p className={`text-[8px] text-center mt-1.5 ${theme.muted} opacity-70`}>
                              {(st as any).startTime} – {(st as any).endTime}
                            </p>
                          )}
                          {bookStylist?.id === st.id && <div className="mt-2 flex items-center justify-center gap-1 text-emerald-500 text-[10px] font-bold"><CheckCircle2 className="size-3" />Selected</div>}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 4: Pick Time Slot */}
            <div className={`rounded-2xl border p-5 space-y-4 ${theme.card} ${!bookStylist ? "opacity-45 pointer-events-none" : ""}`}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                  <Calendar className="size-3.5 text-rose-400" />
                </div>
                <span className="font-extrabold text-sm tracking-tight" style={headingStyle}>4. Pick Time Slot</span>
              </div>
              {!bookStylist ? (
                <p className={`text-xs ${theme.muted}`}>Please select a specialist first.</p>
              ) : (
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${theme.muted}`}>
                    Available Slots
                    {bookDate === today && <span className={`ml-2 text-[9px] normal-case font-medium ${theme.muted} opacity-60`}>— past slots hidden</span>}
                    {bookDate < today && <span className="ml-2 text-[9px] normal-case font-medium text-rose-400">— past date selected</span>}
                  </label>
                  {availableSlots.length === 0 ? (
                    <div className={`rounded-xl border p-4 text-center ${theme.card}`}>
                      <Clock className={`size-6 mx-auto mb-1.5 ${theme.muted} opacity-40`} />
                      <p className={`text-xs font-bold ${theme.muted}`}>
                        {bookDate < today ? "Cannot book past dates" : "No slots available for today"}
                      </p>
                      <p className={`text-[10px] mt-0.5 ${theme.muted} opacity-60`}>Please select a future date or different stylist to see available slots.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {availableSlots.map(t => (
                        <button key={t} type="button" onClick={() => setBookTime(t)}
                          className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${bookTime === t ? `${theme.selectedCard} border-current` : `${theme.card} ${theme.muted}`}`}
                          style={bookTime === t ? headingStyle : {}}>
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — Summary & Confirm */}
          <div className="space-y-4">
            <div className={`rounded-2xl border p-5 space-y-4 sticky top-24 ${theme.card}`}>
              <h3 className="font-extrabold text-sm tracking-tight" style={headingStyle}>Booking Summary</h3>
              <div className={`space-y-2.5 text-xs border-b pb-4 ${theme.divider}`}>
                <div className="flex justify-between">
                  <span className={theme.muted}>Outlet</span>
                  <span className="font-bold" style={textStyle}>
                    {outlets.find(o => o.id === selectedOutletId)?.name || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={theme.muted}>Service</span>
                  <span className="font-bold" style={textStyle}>{bookService?.name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className={theme.muted}>Specialist</span>
                  <span className="font-bold" style={textStyle}>{bookStylist?.name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className={theme.muted}>Date</span>
                  <span className="font-bold" style={textStyle}>{bookDate || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className={theme.muted}>Time</span>
                  <span className="font-bold" style={textStyle}>{bookTime || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className={theme.muted}>Duration</span>
                  <span className="font-bold" style={textStyle}>{bookService?.duration ? `${bookService.duration} mins` : "—"}</span>
                </div>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className={theme.muted}>Price</span>
                  <div className="flex items-center gap-1.5 font-bold" style={textStyle}>
                    {bookService?.offerPrice && (
                      <span className="text-[10px] text-slate-500 line-through">₹{bookService.price.toLocaleString()}</span>
                    )}
                    <span>₹{baseServicePrice.toLocaleString()}</span>
                  </div>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-500">
                    <span>Coupon ({bookCoupon.toUpperCase()})</span>
                    <span className="font-bold">−₹{couponDiscount}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black border-t pt-2" style={{ ...headingStyle, borderColor: "currentColor", opacity: 1 }}>
                  <span>Total</span>
                  <span>₹{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Coupon */}
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className={`absolute left-3 top-1/2 -translate-y-1/2 size-3 ${theme.muted}`} />
                  <input type="text" value={bookCoupon} onChange={e => setBookCoupon(e.target.value)}
                    placeholder="Coupon code"
                    className={`w-full border rounded-lg py-2 pl-8 pr-3 text-xs font-semibold outline-none ${theme.input}`} />
                </div>
                <button type="submit" className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${theme.muted} ${theme.card}`}>Apply</button>
              </form>

              {/* Auth gate or confirm */}
              {!loggedInUser ? (
                <div className={`rounded-xl border p-4 text-center space-y-3 ${theme.card}`}>
                  <Lock className={`size-5 mx-auto ${theme.muted}`} />
                  <p className={`text-xs font-bold ${theme.muted}`}>Sign in to confirm your booking</p>
                  <div className="flex gap-2">
                    <a href={isMounted ? getTenantHref(tenantSlug, "/login?redirect=booking") : "/login?redirect=booking"}
                       onClick={() => {
                         const draftBooking = {
                           outletId: selectedOutletId,
                           serviceId: bookService?.id,
                           stylistId: bookStylist?.id,
                           date: bookDate,
                           time: bookTime,
                           coupon: bookCoupon,
                         };
                         localStorage.setItem(`draft_booking_${tenantSlug}`, JSON.stringify(draftBooking));
                       }}
                       className={`flex-1 py-2.5 rounded-lg text-xs font-bold border text-center ${theme.card} ${theme.muted}`}>Sign In</a>
                    <a href={isMounted ? getTenantHref(tenantSlug, "/signup?redirect=booking") : "/signup?redirect=booking"}
                       onClick={() => {
                         const draftBooking = {
                           outletId: selectedOutletId,
                           serviceId: bookService?.id,
                           stylistId: bookStylist?.id,
                           date: bookDate,
                           time: bookTime,
                           coupon: bookCoupon,
                         };
                         localStorage.setItem(`draft_booking_${tenantSlug}`, JSON.stringify(draftBooking));
                       }}
                       className={`flex-1 py-2.5 rounded-lg text-xs font-bold text-center ${theme.btn}`} style={btnStyle}>Sign Up</a>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleConfirm} className="space-y-3">
                  <div className={`rounded-xl border p-3 flex items-center gap-3 ${theme.card}`}>
                    <div className="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center font-black text-xs text-rose-400">
                      {loggedInUser.name.slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-xs" style={textStyle}>{loggedInUser.name}</p>
                      <p className={`text-[10px] ${theme.muted}`}>{loggedInUser.phone}</p>
                    </div>
                  </div>
                  <button type="submit" disabled={!ready}
                    className={`w-full py-3.5 rounded-xl text-sm font-extrabold tracking-widest uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${!ready ? "opacity-40 cursor-not-allowed" : ""} ${theme.btn}`}
                    style={ready ? btnStyle : {}}>
                    Confirm Booking <CheckCircle2 className="size-4" />
                  </button>
                  {!ready && <p className={`text-[10px] text-center ${theme.muted}`}>Select service, specialist & time to proceed</p>}
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
      <Toaster position="top-center" reverseOrder={false} />
    </div>
  );
}
