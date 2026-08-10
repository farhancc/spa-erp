"use client";
import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus, X, Clock, User, Loader2, RefreshCw } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
interface StaffMember { id: string; name: string; role: string; workingDays?: number[]; }
interface BookingItem { serviceId?: string; }
interface CalBooking {
  id: string; customerId: string; staffId?: string; outletId: string;
  scheduledAt: string; endsAt: string; status: string; totalDuration: number;
  notes?: string;
  customer?: { name: string; phone: string };
  items?: BookingItem[];
  services?: string; // derived label
}

interface StaffBlock {
  id: string;
  staffId: string;
  outletId: string;
  scheduledAt: string;
  endsAt: string;
  reason?: string;
}

interface StaffLeaveItem {
  id: string;
  staffId: string;
  startDate: string;
  endDate: string;
  status: string;
  reason?: string;
}

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED:   "bg-blue-100 border-blue-400 text-blue-900",
  IN_PROGRESS: "bg-amber-100 border-amber-400 text-amber-900",
  COMPLETED:   "bg-emerald-100 border-emerald-400 text-emerald-900",
  CANCELLED:   "bg-stone-100 border-stone-300 text-stone-500 opacity-60",
  PENDING:     "bg-purple-100 border-purple-400 text-purple-900",
};
const STATUS_DOT: Record<string, string> = {
  CONFIRMED:"bg-blue-500", IN_PROGRESS:"bg-amber-500",
  COMPLETED:"bg-emerald-500", CANCELLED:"bg-stone-400", PENDING:"bg-purple-500",
};

const HOUR_START = 8;
const HOUR_END   = 21;
const SLOT_MIN   = 15; // 15-minute slot grid
const TOTAL_SLOTS = ((HOUR_END - HOUR_START) * 60) / SLOT_MIN;
const CELL_H     = 40; // compact but readable height per 15-min slot

const toMinutes = (iso: string) => {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
};
const fmtTime = (h: number, m: number) => {
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2,"0")} ${ampm}`;
};
const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short" });
// Use local date string YYYY-MM-DD to avoid UTC shift issues (e.g. IST +5:30)
const isoDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Extract local date portion from an ISO string (avoids UTC→local shift)
const localDateOf = (iso: string) => {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Days for a week starting from given date
const weekDays = (anchor: Date): Date[] =>
  Array.from({length:7}, (_,i) => { const d=new Date(anchor); d.setDate(anchor.getDate()-anchor.getDay()+i); return d; });

// ── Main Component ─────────────────────────────────────────────────────────
export default function AppointmentCalendar({
  tenantSlug, outletId,
}: { tenantSlug: string; outletId: string }) {
  const [view, setView] = useState<"day"|"week">("day");
  const [anchor, setAnchor] = useState(() => { const d=new Date(); d.setHours(0,0,0,0); return d; });
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [bookings, setBookings] = useState<CalBooking[]>([]);
  const [leaves, setLeaves] = useState<StaffLeaveItem[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<StaffBlock[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [selected, setSelected] = useState<CalBooking | null>(null);
  const [selectedBlockedSlot, setSelectedBlockedSlot] = useState<StaffBlock | null>(null);
  const [quickBook, setQuickBook] = useState<{staffId:string;date:Date;minuteStart:number}|null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch staff (STYLIST / MANAGER) — scoped to the selected outlet
  useEffect(() => {
    if (!outletId) return;
    fetch(`/api/users?role=STYLIST&limit=50&outletId=${outletId}`, {
      credentials: "include",
      headers: { "x-tenant-slug": tenantSlug },
    })
      .then(r => r.json()).then(d => {
        const list = Array.isArray(d) ? d : (d.data ?? []);
        setStaff(
          list
            .filter((u: any) =>
              (u.role === "STYLIST" || u.role === "MANAGER") &&
              // client-side guard: only include staff whose outletId matches (or is null for OWNER/unassigned)
              (!u.outletId || u.outletId === outletId)
            )
            .map((u: any) => ({
              id: u.id,
              name: u.name,
              role: u.role,
              workingDays: Array.isArray(u.staffProfile?.workingDays) && u.staffProfile.workingDays.length > 0
                ? u.staffProfile.workingDays
                : [1,2,3,4,5,6],
            }))
        );
      }).catch(() => {});
  }, [tenantSlug, outletId]);

  // Fetch bookings, leaves, and blocked slots for visible date range
  const fetchCalendarData = useCallback(() => {
    if (!outletId) return;
    setLoading(true);
    const dates = view === "week" ? weekDays(anchor) : [anchor];
    const from = isoDate(dates[0]);
    // Extend `to` to end-of-day so same-day datetime entries aren't filtered out
    const toDate = new Date(dates[dates.length-1]);
    toDate.setHours(23, 59, 59, 999);
    const to = toDate.toISOString();

    const pBookings = fetch(`/api/bookings?outletId=${outletId}&from=${from}&to=${to}&limit=200`, {
      credentials: "include",
      headers: { "x-tenant-slug": tenantSlug },
    }).then(r => r.json());

    const pLeaves = fetch(`/api/users/leaves?from=${from}&to=${to}`, {
      credentials: "include",
      headers: { "x-tenant-slug": tenantSlug },
    }).then(r => r.json());

    const pBlocked = fetch(`/api/users/blocked-slots?outletId=${outletId}&from=${from}&to=${to}`, {
      credentials: "include",
      headers: { "x-tenant-slug": tenantSlug },
    }).then(r => r.json());

    Promise.all([pBookings, pLeaves, pBlocked])
      .then(([bData, lData, sData]) => {
        // Backend wraps all responses in { success: true, data: [...] }
        // Unwrap correctly for each endpoint
        const bookingsList = Array.isArray(bData) ? bData : (bData?.data ?? []);
        const leavesList   = Array.isArray(lData) ? lData : (lData?.data ?? []);
        const slotsList    = Array.isArray(sData) ? sData : (sData?.data ?? []);
        setBookings(bookingsList);
        setLeaves(leavesList);
        setBlockedSlots(slotsList);
        console.debug("[Calendar] bookings:", bookingsList.length, "leaves:", leavesList.length, "blocked:", slotsList.length);
      })
      .catch((err) => console.error("[Calendar] fetch error:", err))
      .finally(() => setLoading(false));
  }, [anchor, view, outletId, tenantSlug, refreshKey]);

  useEffect(() => { fetchCalendarData(); }, [fetchCalendarData]);

  const days = view === "week" ? weekDays(anchor) : [anchor];
  const today = new Date(); today.setHours(0,0,0,0);

  const navigate = (dir: number) => {
    setAnchor(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + (view === "week" ? 7 : 1) * dir);
      return d;
    });
  };

  // Position a booking/blocked slot on the grid
  const bookingStyle = (b: { scheduledAt: string; endsAt: string }) => {
    const startMin = toMinutes(b.scheduledAt);
    const endMin   = toMinutes(b.endsAt);
    const gridStart = HOUR_START * 60;
    const top  = Math.max(0, ((startMin - gridStart) / SLOT_MIN)) * CELL_H;
    const height = Math.max(CELL_H, ((endMin - startMin) / SLOT_MIN) * CELL_H) - 4;
    return { top, height };
  };

  // Group bookings by staffId then by date
  const bookingsFor = (staffId: string, date: Date) => {
    const dateStr = isoDate(date);
    return bookings.filter(b => {
      const bDate = localDateOf(b.scheduledAt);
      return bDate === dateStr && (b.staffId === staffId || (!b.staffId && staff.length > 0 && staff[0].id === staffId));
    });
  };

  // Check if stylist is on leave
  const isStaffOnLeave = (staffId: string, date: Date) => {
    const dateStr = isoDate(date);
    return leaves.find(l => {
      if (l.staffId !== staffId) return false;
      const start = l.startDate.slice(0, 10);
      const end = l.endDate.slice(0, 10);
      return dateStr >= start && dateStr <= end;
    });
  };

  const handleDeleteLeave = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this leave?")) return;
    try {
      const res = await fetch(`/api/users/leaves?id=${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "x-tenant-slug": tenantSlug },
      });
      if (res.ok) {
        setRefreshKey(k => k + 1);
      } else {
        alert("Failed to cancel leave");
      }
    } catch {
      alert("Network error");
    }
  };

  const handleDeleteBlockedSlot = async (id: string) => {
    if (!confirm("Are you sure you want to unblock this slot?")) return;
    try {
      const res = await fetch(`/api/users/blocked-slots?id=${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "x-tenant-slug": tenantSlug },
      });
      if (res.ok) {
        setSelectedBlockedSlot(null);
        setRefreshKey(k => k + 1);
      } else {
        alert("Failed to unblock slot");
      }
    } catch {
      alert("Network error");
    }
  };

  // Current time indicator position
  const nowMin = new Date().getHours()*60 + new Date().getMinutes();
  const nowTop = ((nowMin - HOUR_START*60) / SLOT_MIN) * CELL_H;
  const showNow = nowMin >= HOUR_START*60 && nowMin <= HOUR_END*60;

  const timeLabels = Array.from({length: TOTAL_SLOTS}, (_,i) => {
    const totalMin = HOUR_START*60 + i*SLOT_MIN;
    return { h: Math.floor(totalMin/60), m: totalMin%60 };
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full min-h-0 font-minimal">

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-luxury font-normal text-2xl text-stone-900 tracking-tight">Appointment Calendar</h3>
          <p className="text-xs text-stone-500 mt-0.5">Live view of all bookings, leaves & blocked times. Click any slot to manage.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* View toggle */}
          <div className="flex rounded-xl overflow-hidden border border-stone-200 text-[10px] font-bold uppercase tracking-wider">
            {(["day","week"] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-4 py-2 transition-all cursor-pointer ${view===v ? "bg-stone-900 text-white" : "bg-white text-stone-500 hover:bg-stone-50"}`}>
                {v}
              </button>
            ))}
          </div>
          {/* Nav */}
          <div className="flex items-center gap-1">
            <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-stone-100 border border-stone-200 text-stone-600 transition-all cursor-pointer"><ChevronLeft className="size-4"/></button>
            <button onClick={() => { const d=new Date(); d.setHours(0,0,0,0); setAnchor(d); }}
              className="px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-stone-200 hover:bg-stone-100 text-stone-700 transition-all cursor-pointer">Today</button>
            <button onClick={() => navigate(1)} className="p-2 rounded-xl hover:bg-stone-100 border border-stone-200 text-stone-600 transition-all cursor-pointer"><ChevronRight className="size-4"/></button>
          </div>
          {/* Date label */}
          <span className="text-sm font-semibold text-stone-700">
            {view==="week"
              ? `${fmtDate(days[0])} – ${fmtDate(days[6])}`
              : fmtDate(anchor)}
          </span>
          {/* Refresh */}
          <button onClick={() => setRefreshKey(k=>k+1)} className="p-2 rounded-xl hover:bg-stone-100 border border-stone-200 text-stone-500 transition-all cursor-pointer">
            {loading ? <Loader2 className="size-4 animate-spin"/> : <RefreshCw className="size-4"/>}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-3 flex-wrap items-center">
        {Object.entries(STATUS_DOT).map(([s,cls]) => (
          <div key={s} className="flex items-center gap-1.5 text-[10px] text-stone-500 font-medium">
            <span className={`w-2 h-2 rounded-full ${cls}`}/>
            {s.replace("_"," ")}
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-[10px] text-stone-500 font-medium">
          <span className="w-2.5 h-2.5 rounded bg-stone-200 border border-stone-400 inline-block"/>
          Blocked/Break
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-stone-500 font-medium">
          <span className="w-2.5 h-2.5 rounded bg-rose-50 border border-rose-200 inline-block"/>
          Approved Leave
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-stone-500 font-medium">
          <span className="w-2.5 h-2.5 rounded bg-stone-100 border border-stone-300 inline-block" style={{backgroundImage:"repeating-linear-gradient(45deg,transparent,transparent 3px,rgba(0,0,0,0.07) 3px,rgba(0,0,0,0.07) 4px)"}}/>
          Weekly Off
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="flex-1 overflow-auto border border-stone-200 rounded-2xl bg-white">
        {staff.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-stone-400 gap-3">
            <User className="size-10"/>
            <p className="text-sm font-medium">No staff found. Add stylists first.</p>
          </div>
        ) : (
          <div className="flex flex-col min-w-max">

            {/* Column headers */}
            <div className="sticky top-0 z-20 bg-white border-b border-stone-200 flex">
              <div className="w-16 shrink-0 border-r border-stone-100"/>
              {days.map(day => (
                <div key={isoDate(day)} className="flex-1 min-w-0">
                  {view==="week" && (
                    <div className={`text-center py-2 border-b border-stone-100 text-[10px] font-bold uppercase tracking-wider ${isoDate(day)===isoDate(today) ? "text-blue-600" : "text-stone-500"}`}>
                      {fmtDate(day)}
                    </div>
                  )}
                  <div className="flex divide-x divide-stone-100">
                    {staff.map(s => (
                      <div key={s.id} className="flex-1 min-w-[140px] py-2.5 px-2 text-center">
                        <div className="w-7 h-7 rounded-full bg-stone-900 text-white text-[10px] font-bold flex items-center justify-center mx-auto mb-1">
                          {s.name.slice(0,2).toUpperCase()}
                        </div>
                        <div className="text-[10px] font-semibold text-stone-700 truncate">{s.name}</div>
                        <div className="text-[9px] text-stone-400 uppercase tracking-wide">{s.role}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Time rows + booking cells */}
            <div className="flex relative">

              {/* Time labels column */}
              <div className="w-16 shrink-0 border-r border-stone-100 select-none bg-stone-50/50">
                {timeLabels.map(({h,m}, i) => (
                  <div key={i} style={{height:CELL_H}} className="border-b border-stone-100/50 flex items-start justify-end pr-2 pt-0.5">
                    {m===0 || m===30 ? (
                      <span className="text-[9px] text-stone-600 font-extrabold">{fmtTime(h,m)}</span>
                    ) : (
                      <span className="text-[8px] text-stone-300 font-medium">{m}m</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {days.map(day => (
                <div key={isoDate(day)} className="flex flex-1 divide-x divide-stone-100">
                  {staff.map(st => {
                    const colBookings = bookingsFor(st.id, day);
                    const onLeave = isStaffOnLeave(st.id, day);
                    // Use localDateOf to compare ISO timestamps in local timezone (avoid UTC shift)
                    const colBlocked = blockedSlots.filter(b => b.staffId === st.id && localDateOf(b.scheduledAt) === isoDate(day));
                    // Weekly off: day.getDay() gives 0=Sun…6=Sat
                    const dayOfWeek = day.getDay();
                    const isWeeklyOff = Array.isArray(st.workingDays) && st.workingDays.length > 0
                      ? !st.workingDays.includes(dayOfWeek)
                      : false;

                    return (
                      <div key={st.id} className="flex-1 min-w-[140px] relative"
                        style={{height: TOTAL_SLOTS * CELL_H}}>

                        {onLeave ? (
                          /* ── Leave overlay ── */
                          <div className="absolute inset-0 bg-rose-50/60 backdrop-blur-[0.5px] flex flex-col items-center justify-center p-3 text-center z-10 select-none pointer-events-auto border-r border-b border-rose-250">
                            <span className="text-[10px] font-extrabold text-rose-700 uppercase tracking-widest bg-white border border-rose-200 px-2.5 py-1 rounded-lg shadow-sm">
                              On Leave
                            </span>
                            <span className="text-[10px] text-rose-500 mt-1.5 italic font-medium max-w-[120px] truncate">
                              {onLeave.reason || "Vacation/Off-duty"}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteLeave(onLeave.id);
                              }}
                              className="mt-3 text-[9px] text-rose-600 hover:text-rose-800 font-extrabold uppercase tracking-widest hover:underline cursor-pointer bg-white px-2 py-1 rounded border border-rose-100 shadow-xs transition-all"
                            >
                              Cancel Leave
                            </button>
                          </div>
                        ) : isWeeklyOff ? (
                          /* ── Weekly Off overlay ── */
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center z-10 select-none pointer-events-none"
                            style={{
                              background: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.025) 10px, rgba(0,0,0,0.025) 20px)",
                              backgroundColor: "rgba(245,245,244,0.7)",
                            }}>
                            <span className="text-[9px] font-extrabold text-stone-400 uppercase tracking-widest bg-white/80 border border-stone-200 px-2 py-0.5 rounded-md shadow-xs">
                              Weekly Off
                            </span>
                          </div>
                        ) : (
                          <>
                            {/* Time slot cells (clickable background) — z-index 1 so events sit on top */}
                            {timeLabels.map(({h,m}, i) => (
                              <div key={i}
                                style={{height:CELL_H, top: i*CELL_H, zIndex: 1}}
                                className={`absolute left-0 right-0 border-b border-stone-100/50 group cursor-pointer hover:bg-blue-50/40 transition-colors ${m===0 ? "border-stone-200/80" : ""}`}
                                onClick={() => setQuickBook({staffId:st.id, date:day, minuteStart:h*60+m})}>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute inset-0 flex items-center justify-center">
                                  <Plus className="size-3 text-blue-400"/>
                                </div>
                              </div>
                            ))}

                            {/* Bookings */}
                            {colBookings.map(b => {
                              const {top, height} = bookingStyle(b);
                              const colorClass = STATUS_COLORS[b.status] ?? STATUS_COLORS.PENDING;
                              return (
                                <div key={b.id}
                                  style={{top, height, left:2, right:2, position:"absolute", zIndex:10}}
                                  className={`rounded-lg border-l-4 px-2 py-1 overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-shadow ${colorClass}`}
                                  onClick={e => { e.stopPropagation(); setSelected(b); }}>
                                  <div className="text-[10px] font-bold truncate leading-tight">
                                    {b.customer?.name ?? "Customer"}
                                  </div>
                                  {height > 26 && (
                                    <div className="text-[9px] opacity-75 flex items-center gap-1 mt-0.5">
                                      <Clock className="size-2.5 shrink-0"/>
                                      <span className="truncate">
                                        {new Date(b.scheduledAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})} - {new Date(b.endsAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}
                                      </span>
                                    </div>
                                  )}
                                  {height > 50 && (
                                    <div className="text-[9px] mt-0.5 font-medium opacity-80 truncate">{b.status}</div>
                                  )}
                                </div>
                              );
                            })}

                            {/* Blocked Slots */}
                            {colBlocked.map(b => {
                              const {top, height} = bookingStyle(b);
                              return (
                                <div key={b.id}
                                  style={{top, height, left:2, right:2, position:"absolute", zIndex:10}}
                                  className="rounded-lg border-l-4 border-stone-400 px-2 py-1 overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-shadow bg-stone-100 text-stone-700 hover:bg-stone-150"
                                  onClick={e => { e.stopPropagation(); setSelectedBlockedSlot(b); }}>
                                  <div className="text-[10px] font-bold truncate leading-tight flex items-center gap-1 text-stone-800">
                                    <span className="w-1.5 h-1.5 rounded-full bg-stone-500 shrink-0"/>
                                    Blocked
                                  </div>
                                  {height > 26 && (
                                    <div className="text-[9px] opacity-75 truncate mt-0.5">
                                      {b.reason || "Unavailable"}
                                    </div>
                                  )}
                                  {height > 50 && (
                                    <div className="text-[9px] mt-0.5 font-semibold text-stone-500 flex items-center gap-1">
                                      <Clock className="size-2.5 shrink-0"/>
                                      {new Date(b.scheduledAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {/* Current time line */}
                            {isoDate(day)===isoDate(today) && showNow && (
                              <div style={{top:nowTop, position:"absolute", left:0, right:0, zIndex:15}} className="flex items-center pointer-events-none">
                                <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 -ml-1"/>
                                <div className="flex-1 h-px bg-red-400"/>
                              </div>
                            )}
                          </>
                        )}

                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Booking Detail Drawer ── */}
      {selected && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-luxury text-xl text-stone-900">{selected.customer?.name ?? "Booking"}</h4>
                <p className="text-xs text-stone-500 mt-0.5">{selected.customer?.phone}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-xl hover:bg-stone-100 text-stone-400 transition-all cursor-pointer"><X className="size-4"/></button>
            </div>
            <div className="space-y-3 text-xs">
              <InfoRow label="Status">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_COLORS[selected.status]}`}>{selected.status}</span>
              </InfoRow>
              <InfoRow label="Start Time">
                {new Date(selected.scheduledAt).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} at {new Date(selected.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </InfoRow>
              <InfoRow label="End Time">
                {new Date(selected.endsAt).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} at {new Date(selected.endsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </InfoRow>
              <InfoRow label="Duration">
                {selected.totalDuration} minutes
              </InfoRow>
              {selected.notes && <InfoRow label="Notes">{selected.notes}</InfoRow>}
            </div>
            {selected.status !== "CANCELLED" && selected.status !== "COMPLETED" && (
              <button
                onClick={async () => {
                  if (confirm("Are you sure you want to cancel this appointment? This will notify the client via WhatsApp.")) {
                    try {
                      const res = await fetch(`/api/bookings/${selected.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json", "x-tenant-slug": tenantSlug },
                        body: JSON.stringify({ action: "cancel", reason: "Cancelled via Calendar Dashboard" })
                      });
                      if (res.ok) {
                        setSelected(null);
                        setRefreshKey(k => k + 1);
                      } else {
                        alert("Failed to cancel booking");
                      }
                    } catch (err) {
                      console.error("Cancel booking error:", err);
                      alert("Network error");
                    }
                  }
                }}
                className="w-full mt-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-widest transition-all cursor-pointer text-center border-none shadow-sm hover:shadow-md"
              >
                Cancel Appointment
              </button>
            )}
            <div className="mt-4 flex gap-2">
              <button onClick={() => { setSelected(null); setRefreshKey(k=>k+1); }}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-all cursor-pointer bg-white">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Blocked Slot Detail Modal ── */}
      {selectedBlockedSlot && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedBlockedSlot(null)}>
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-luxury text-xl text-stone-900">Blocked Time Slot</h4>
                <p className="text-xs text-stone-500 mt-0.5">Stylist: {staff.find(s=>s.id === selectedBlockedSlot.staffId)?.name || "Staff"}</p>
              </div>
              <button onClick={() => setSelectedBlockedSlot(null)} className="p-2 rounded-xl hover:bg-stone-100 text-stone-400 transition-all cursor-pointer"><X className="size-4"/></button>
            </div>
            <div className="space-y-3 text-xs">
              <InfoRow label="Reason">{selectedBlockedSlot.reason || "Unavailable"}</InfoRow>
              <InfoRow label="Start Time">{new Date(selectedBlockedSlot.scheduledAt).toLocaleString("en-IN")}</InfoRow>
              <InfoRow label="End Time">{new Date(selectedBlockedSlot.endsAt).toLocaleString("en-IN")}</InfoRow>
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={() => handleDeleteBlockedSlot(selectedBlockedSlot.id)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-rose-700 transition-all cursor-pointer">Unblock Slot</button>
              <button onClick={() => setSelectedBlockedSlot(null)}
                className="py-2.5 px-4 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-all cursor-pointer">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Unified Slot Management Modal ── */}
      {quickBook && (
        <ManageSlotModal
          tenantSlug={tenantSlug} outletId={outletId}
          staffId={quickBook.staffId} date={quickBook.date} minuteStart={quickBook.minuteStart}
          staffName={staff.find(s=>s.id === quickBook.staffId)?.name || "Staff"}
          onClose={() => setQuickBook(null)}
          onCreated={() => { setQuickBook(null); setRefreshKey(k=>k+1); }}
        />
      )}
    </div>
  );
}

// ── Info Row Helper ────────────────────────────────────────────────────────
function InfoRow({label, children}: {label:string; children:React.ReactNode}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-stone-400 font-medium">{label}</span>
      <span className="text-stone-800 font-semibold">{children}</span>
    </div>
  );
}

// ── Unified Slot Management Modal ──────────────────────────────────────────
function ManageSlotModal({
  tenantSlug, outletId, staffId, date, minuteStart, staffName, onClose, onCreated
}: {
  tenantSlug: string; outletId: string; staffId: string; date: Date;
  minuteStart: number; staffName: string; onClose: () => void; onCreated: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"book" | "block" | "leave">("book");
  const [customers, setCustomers] = useState<{id:string;name:string;phone:string}[]>([]);
  const [services, setServices] = useState<{id:string;name:string;duration:number;price:number}[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Tab 1: Book Appointment states
  const [customerId, setCustomerId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [notes, setNotes] = useState("");

  // Tab 2: Block Slot states
  const [blockDuration, setBlockDuration] = useState(15);
  const [blockReason, setBlockReason] = useState("");

  // Tab 3: Mark Leave states
  const [leaveStartDate, setLeaveStartDate] = useState(() => isoDate(date));
  const [leaveEndDate, setLeaveEndDate] = useState(() => isoDate(date));
  const [leaveReason, setLeaveReason] = useState("");

  useEffect(() => {
    fetch("/api/customers?limit=100", { credentials: "include", headers:{"x-tenant-slug":tenantSlug}})
      .then(r=>r.json()).then(d=>setCustomers(Array.isArray(d)?d:(d.data??[]))).catch(()=>{});
    fetch(`/api/services?outletId=${outletId}&limit=100`, { credentials: "include", headers:{"x-tenant-slug":tenantSlug}})
      .then(r=>r.json()).then(d=>setServices(Array.isArray(d)?d:(d.data??[]))).catch(()=>{});
  }, [tenantSlug, outletId]);

  const scheduledAt = new Date(date);
  scheduledAt.setHours(Math.floor(minuteStart/60), minuteStart%60, 0, 0);

  // Submits Book Appointment
  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !serviceId) { setError("Select a customer and service."); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/bookings", {
        method:"POST",
        credentials: "include",
        headers:{"Content-Type":"application/json","x-tenant-slug":tenantSlug},
        body: JSON.stringify({
          outletId, customerId, staffId,
          scheduledAt: scheduledAt.toISOString(),
          items:[{serviceId}], notes,
        }),
      });
      const data = await res.json();
      if (res.ok) { onCreated(); }
      else { setError(data.error ?? "Booking failed"); }
    } catch { setError("Network error"); }
    finally { setSaving(false); }
  };

  // Submits Block Slot
  const handleBlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const endsAt = new Date(scheduledAt.getTime() + blockDuration * 60000);
      const res = await fetch("/api/users/blocked-slots", {
        method:"POST",
        credentials: "include",
        headers:{"Content-Type":"application/json","x-tenant-slug":tenantSlug},
        body: JSON.stringify({
          staffId, outletId,
          scheduledAt: scheduledAt.toISOString(),
          endsAt: endsAt.toISOString(),
          reason: blockReason || "Blocked",
        }),
      });
      const data = await res.json();
      if (res.ok) { onCreated(); }
      else { setError(data.error ?? "Blocking failed"); }
    } catch { setError("Network error"); }
    finally { setSaving(false); }
  };

  // Submits Mark Leave
  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const start = new Date(leaveStartDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(leaveEndDate);
      end.setHours(23, 59, 59, 999);

      const res = await fetch("/api/users/leaves", {
        method:"POST",
        credentials: "include",
        headers:{"Content-Type":"application/json","x-tenant-slug":tenantSlug},
        body: JSON.stringify({
          staffId,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          reason: leaveReason || "Vacation",
        }),
      });
      const data = await res.json();
      if (res.ok) { onCreated(); }
      else { setError(data.error ?? "Marking leave failed"); }
    } catch { setError("Network error"); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl w-full max-w-sm p-6" onClick={e=>e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="font-luxury text-xl text-stone-900">Manage Schedule</h4>
            <p className="text-[11px] text-stone-400 font-medium mt-0.5">Stylist: {staffName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-stone-100 text-stone-400 cursor-pointer"><X className="size-4"/></button>
        </div>

        <p className="text-[11px] text-stone-500 mb-4 bg-stone-50 px-3 py-1.5 rounded-lg inline-block border border-stone-100 font-medium">
          {scheduledAt.toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"})} · {scheduledAt.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}
        </p>

        {error && <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 mb-3">{error}</div>}

        {/* Tab Selection */}
        <div className="flex border-b border-stone-200 mb-4 text-[10px] font-bold uppercase tracking-wider">
          <button type="button" onClick={() => { setActiveTab("book"); setError(""); }} 
            className={`flex-1 pb-2 border-b-2 text-center cursor-pointer transition-all ${activeTab === "book" ? "border-stone-900 text-stone-900" : "border-transparent text-stone-400 hover:text-stone-700"}`}>
            Book Appt
          </button>
          <button type="button" onClick={() => { setActiveTab("block"); setError(""); }} 
            className={`flex-1 pb-2 border-b-2 text-center cursor-pointer transition-all ${activeTab === "block" ? "border-stone-900 text-stone-900" : "border-transparent text-stone-400 hover:text-stone-700"}`}>
            Block Slot
          </button>
          <button type="button" onClick={() => { setActiveTab("leave"); setError(""); }} 
            className={`flex-1 pb-2 border-b-2 text-center cursor-pointer transition-all ${activeTab === "leave" ? "border-stone-900 text-stone-900" : "border-transparent text-stone-400 hover:text-stone-700"}`}>
            Mark Leave
          </button>
        </div>

        {/* Tab 1: Book Appointment Form */}
        {activeTab === "book" && (
          <form onSubmit={handleBookSubmit} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Customer</label>
              <select value={customerId} onChange={e=>setCustomerId(e.target.value)} required
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-800 bg-stone-50 focus:outline-none focus:border-stone-800">
                <option value="">Select customer…</option>
                {customers.map(c=><option key={c.id} value={c.id}>{c.name} · {c.phone}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Service</label>
              <select value={serviceId} onChange={e=>setServiceId(e.target.value)} required
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-800 bg-stone-50 focus:outline-none focus:border-stone-800">
                <option value="">Select service…</option>
                {services.map(s=><option key={s.id} value={s.id}>{s.name} · {s.duration}m</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Notes</label>
              <input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Optional note…"
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-800 bg-stone-50 focus:outline-none focus:border-stone-800"/>
            </div>
            <button type="submit" disabled={saving}
              className="w-full py-3 bg-stone-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-stone-800 transition-all disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2 mt-4 shadow-sm">
              {saving ? <><Loader2 className="size-3.5 animate-spin"/>Booking…</> : "Confirm Appointment"}
            </button>
          </form>
        )}

        {/* Tab 2: Block Slot Form */}
        {activeTab === "block" && (
          <form onSubmit={handleBlockSubmit} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Duration</label>
              <select value={blockDuration} onChange={e=>setBlockDuration(Number(e.target.value))} required
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-800 bg-stone-50 focus:outline-none focus:border-stone-800">
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>1 Hour</option>
                <option value={90}>1.5 Hours</option>
                <option value={120}>2 Hours</option>
                <option value={180}>3 Hours</option>
                <option value={240}>4 Hours</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Reason / Description</label>
              <input value={blockReason} onChange={e=>setBlockReason(e.target.value)} required placeholder="e.g. Lunch break, Personal work…"
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-800 bg-stone-50 focus:outline-none focus:border-stone-800"/>
            </div>
            <button type="submit" disabled={saving}
              className="w-full py-3 bg-stone-950 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-stone-850 transition-all disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2 mt-4 shadow-sm">
              {saving ? <><Loader2 className="size-3.5 animate-spin"/>Blocking…</> : "Block Selected Slot"}
            </button>
          </form>
        )}

        {/* Tab 3: Mark Leave Form */}
        {activeTab === "leave" && (
          <form onSubmit={handleLeaveSubmit} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Start Date</label>
              <input type="date" value={leaveStartDate} onChange={e=>setLeaveStartDate(e.target.value)} required
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-800 bg-stone-50 focus:outline-none focus:border-stone-800"/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">End Date</label>
              <input type="date" value={leaveEndDate} onChange={e=>setLeaveEndDate(e.target.value)} required
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-800 bg-stone-50 focus:outline-none focus:border-stone-800"/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Reason</label>
              <input value={leaveReason} onChange={e=>setLeaveReason(e.target.value)} required placeholder="e.g. Sick Leave, Annual Vacation…"
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-800 bg-stone-50 focus:outline-none focus:border-stone-800"/>
            </div>
            <button type="submit" disabled={saving}
              className="w-full py-3 bg-rose-650 hover:bg-rose-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2 mt-4 shadow-sm">
              {saving ? <><Loader2 className="size-3.5 animate-spin"/>Marking…</> : "Mark Approved Leave"}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
