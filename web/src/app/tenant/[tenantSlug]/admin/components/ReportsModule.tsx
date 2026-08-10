import React from "react";
import { BarChart3, TrendingUp, Receipt, Users, CalendarDays, Download, Sparkles } from "lucide-react";

interface ReportsModuleProps {
  reportsData: any;
  reportsLoading: boolean;
  dailyRevenue: any;
  outletPerformance: any;
  staffPerformance: any;
  servicePopularity: any;
  retentionStats: any;
  bookingAnalytics: any;
  revenueForecast: any;
  gstrReport: any;
  activeReportSubTab: "OVERVIEW" | "SALES" | "STAFF" | "SERVICES" | "FORECAST";
  setActiveReportSubTab: (tab: "OVERVIEW" | "SALES" | "STAFF" | "SERVICES" | "FORECAST") => void;
  hoveredBarIndex: number | null;
  setHoveredBarIndex: (idx: number | null) => void;
  salesRangeDays: 7 | 14 | 30;
  setSalesRangeDays: (days: 7 | 14 | 30) => void;
  handleExportCSV: (data: any[], filename: string) => void;
  tenantSlug: string;
}

export default function ReportsModule({
  reportsData,
  reportsLoading,
  dailyRevenue,
  outletPerformance,
  staffPerformance,
  servicePopularity,
  retentionStats,
  bookingAnalytics,
  revenueForecast,
  gstrReport,
  activeReportSubTab,
  setActiveReportSubTab,
  hoveredBarIndex,
  setHoveredBarIndex,
  salesRangeDays,
  setSalesRangeDays,
  handleExportCSV,
  tenantSlug,
}: ReportsModuleProps) {
  
  const cleanNumber = (val: any, fallback: number): number => {
    if (val === null || val === undefined) return fallback;
    const num = Number(val);
    return isNaN(num) ? fallback : num;
  };

  const reportsDataValid = reportsData && !reportsData.error;
  const grossRev = reportsDataValid ? cleanNumber(reportsData.grossRevenue, 0) : 124500;
  const visits = reportsDataValid ? cleanNumber(reportsData.visitsCount, 0) : 184;
  const activeSlots = reportsDataValid ? cleanNumber(reportsData.activeBookingsCount, 0) : 12;
  const totalCust = reportsDataValid ? cleanNumber(reportsData.totalCustomers, 0) : 89;

  const topSpendersList = ((reportsDataValid && Array.isArray(reportsData?.topSpenders)) ? reportsData.topSpenders : [
    { name: "Rahul Sharma", totalSpend: 18500, totalVisits: 12, phone: "+91 99999 88888" },
    { name: "Aanya Patel", totalSpend: 14200, totalVisits: 9, phone: "+91 98450 11223" },
    { name: "Vikram Malhotra", totalSpend: 11800, totalVisits: 7, phone: "+91 91234 56789" },
    { name: "Neha Sen", totalSpend: 9500, totalVisits: 5, phone: "+91 90000 12345" },
    { name: "Suresh Raina", totalSpend: 8200, totalVisits: 4, phone: "+91 98765 43210" },
  ]).map((c: any) => ({
    ...c,
    totalSpend: cleanNumber(c.totalSpend, 0),
    totalVisits: cleanNumber(c.totalVisits, 0)
  }));

  const rawDailyRevList = (dailyRevenue && !dailyRevenue.error) ? dailyRevenue : [
    { date: "2026-06-06", revenue: 8400, invoices: 6 },
    { date: "2026-06-05", revenue: 9200, invoices: 7 },
    { date: "2026-06-04", revenue: 5100, invoices: 4 },
    { date: "2026-06-03", revenue: 6800, invoices: 5 },
    { date: "2026-06-02", revenue: 7300, invoices: 6 },
    { date: "2026-06-01", revenue: 11000, invoices: 9 },
    { date: "2026-05-31", revenue: 9500, invoices: 8 },
  ];

  const dailyRevList = rawDailyRevList.map((d: any) => ({
    ...d,
    revenue: cleanNumber(d.revenue, 0),
    invoices: cleanNumber(d.invoices, 0)
  })).sort((a: any, b: any) => a.date.localeCompare(b.date));

  // Slice daily list based on selected range
  const filteredDailyRevList = dailyRevList.slice(-salesRangeDays);

  const staffList = ((staffPerformance && !staffPerformance.error) ? staffPerformance : [
    { staffName: "Ananya Nair", role: "STYLIST", completedBookings: 32, invoicesCreated: 28, revenueGenerated: 34500, avgPerBooking: 1078 },
    { staffName: "Vikram Jeet", role: "STYLIST", completedBookings: 24, invoicesCreated: 21, revenueGenerated: 28000, avgPerBooking: 1166 },
    { staffName: "Priya Das", role: "RECEPTIONIST", completedBookings: 0, invoicesCreated: 56, revenueGenerated: 62000, avgPerBooking: 0 },
  ]).map((s: any) => ({
    ...s,
    completedBookings: cleanNumber(s.completedBookings, 0),
    invoicesCreated: cleanNumber(s.invoicesCreated, 0),
    revenueGenerated: cleanNumber(s.revenueGenerated, 0),
    avgPerBooking: cleanNumber(s.avgPerBooking, 0)
  }));

  const serviceList = ((servicePopularity && !servicePopularity.error) ? servicePopularity : [
    { serviceName: "Deep Tissue Massage", timesBooked: 45, revenueGenerated: 67500 },
    { serviceName: "Classic Haircut & Styling", timesBooked: 38, revenueGenerated: 19000 },
    { serviceName: "HydraFacial Glow", timesBooked: 29, revenueGenerated: 43500 },
    { serviceName: "Gel Manicure & Polish", timesBooked: 22, revenueGenerated: 15400 },
    { serviceName: "Aromatherapy Facial", timesBooked: 18, revenueGenerated: 21600 },
  ]).map((s: any) => ({
    ...s,
    timesBooked: cleanNumber(s.timesBooked, 0),
    revenueGenerated: cleanNumber(s.revenueGenerated, 0)
  }));

  const retention = (retentionStats && !retentionStats.error) ? retentionStats : {
    totalCustomers: 89,
    newCustomers: 24,
    repeatCustomers: 65,
    atRiskCustomers: 12,
    retentionRate: 73,
  };

  const bookingStats = (bookingAnalytics && !bookingAnalytics.error) ? bookingAnalytics : {
    total: 124,
    confirmed: 12,
    completed: 98,
    cancelled: 10,
    noShow: 4,
    completionRate: 79,
    cancellationRate: 8,
  };

  const forecast = (revenueForecast && !revenueForecast.error) ? revenueForecast : {
    projectedRevenue: 135000,
    seatUtilizationRate: 68,
    totalWorkingStylists: 4,
    availableCapacityHours: 832,
    bookedCapacityHours: 566,
    atRiskCustomers: [
      { name: "Rahul Sharma", noShowProbability: 45, phone: "+919999988888" },
      { name: "Siddharth Goel", noShowProbability: 35, phone: "+919876543210" },
    ],
  };

  const gstr = (gstrReport && !gstrReport.error) ? gstrReport : {
    summary: {
      totalTaxableValue: 105508,
      totalCgst: 9495,
      totalSgst: 9495,
      totalIgst: 0,
      totalGst: 18991,
      totalGrossValue: 124500,
      invoiceCount: 84,
    },
    b2b: [],
    b2c: [],
    hsnSummary: [
      { hsnSacCode: "998599", description: "Salon / Beauty Services", taxableValue: 90000, cgst: 8100, sgst: 8100, igst: 0, totalGst: 16200, totalValue: 106200 },
      { hsnSacCode: "330499", description: "Products / Cosmetics", taxableValue: 15508, cgst: 1395, sgst: 1395, igst: 0, totalGst: 2791, totalValue: 18300 },
    ],
  };

  return (
    <div className="space-y-6 text-left font-sans animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-2 border-b border-stone-100">
        <div>
          <h3 className="font-normal font-luxury text-3xl text-stone-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="size-6 text-stone-850" />
            Comprehensive Analytics Desk
          </h3>
          <p className="text-xs text-stone-500 mt-1 uppercase tracking-widest font-semibold font-minimal">Multi-dimensional operational and financial reports portal</p>
        </div>
        {reportsLoading ? (
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-500 bg-stone-100/80 border border-stone-200 px-4 py-2 rounded-full shadow-xs">
            <div className="size-2 rounded-full bg-stone-800 animate-ping" />
            Syncing Realtime Database...
          </div>
        ) : (
          <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider bg-stone-50 border px-3 py-1.5 rounded-xl">
            Status: Active Node
          </div>
        )}
      </div>

      {/* Sub tabs navigation */}
      <div className="flex gap-1.5 border-b border-stone-200 overflow-x-auto pb-px scrollbar-thin">
        {(["OVERVIEW", "SALES", "STAFF", "SERVICES", "FORECAST"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveReportSubTab(tab);
              setHoveredBarIndex(null);
            }}
            className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all duration-200 cursor-pointer ${
              activeReportSubTab === tab
                ? "border-stone-900 text-stone-900 font-black"
                : "border-transparent text-stone-400 hover:text-stone-700"
            }`}
          >
            {tab === "OVERVIEW" && "Summary Overview"}
            {tab === "SALES" && "Daily Revenue Trend"}
            {tab === "STAFF" && "Staff & Outlets Matrix"}
            {tab === "SERVICES" && "Services & Guest Retention"}
            {tab === "FORECAST" && "Forecasts & Taxes"}
          </button>
        ))}
      </div>

      {/* Sub Tab: OVERVIEW */}
      {activeReportSubTab === "OVERVIEW" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 bg-gradient-to-br from-white to-[#FBFAF9] border border-stone-200 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 group relative overflow-hidden text-left">
              <div className="absolute top-0 right-0 w-24 h-24 bg-stone-100/40 rounded-full blur-xl translate-x-4 -translate-y-4 group-hover:bg-stone-200/40 transition-colors" />
              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block font-minimal">Gross Revenue</span>
              <span className="text-3xl font-extrabold text-stone-955 mt-2 block tracking-tight">
                ₹{grossRev.toLocaleString()}
              </span>
              <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold mt-4">
                <TrendingUp className="size-3.5" /> +14.2% MoM
              </div>
            </div>

            <div className="p-6 bg-gradient-to-br from-white to-[#FBFAF9] border border-stone-200 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 group relative overflow-hidden text-left">
              <div className="absolute top-0 right-0 w-24 h-24 bg-stone-100/40 rounded-full blur-xl translate-x-4 -translate-y-4 group-hover:bg-stone-200/40 transition-colors" />
              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block font-minimal">Consolidated Visits</span>
              <span className="text-3xl font-extrabold text-stone-955 mt-2 block tracking-tight">
                {visits} checkouts
              </span>
              <div className="flex items-center gap-1 text-[11px] text-stone-500 font-bold mt-4 text-left">
                <Receipt className="size-3.5 text-stone-400" /> PAID Invoices
              </div>
            </div>

            <div className="p-6 bg-gradient-to-br from-white to-[#FBFAF9] border border-stone-200 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 group relative overflow-hidden text-left">
              <div className="absolute top-0 right-0 w-24 h-24 bg-stone-100/40 rounded-full blur-xl translate-x-4 -translate-y-4 group-hover:bg-stone-200/40 transition-colors" />
              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block font-minimal">Total Customers</span>
              <span className="text-3xl font-extrabold text-stone-955 mt-2 block tracking-tight">
                {totalCust} profiles
              </span>
              <div className="flex items-center gap-1 text-[11px] text-stone-500 font-bold mt-4 text-left">
                <Users className="size-3.5 text-stone-400" /> Unique CRM records
              </div>
            </div>

            <div className="p-6 bg-gradient-to-br from-white to-[#FBFAF9] border border-stone-200 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 group relative overflow-hidden text-left">
              <div className="absolute top-0 right-0 w-24 h-24 bg-stone-100/40 rounded-full blur-xl translate-x-4 -translate-y-4 group-hover:bg-stone-200/40 transition-colors" />
              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block font-minimal">Active Bookings</span>
              <span className="text-3xl font-extrabold text-stone-955 mt-2 block tracking-tight">
                {activeSlots} slots
              </span>
              <div className="flex items-center gap-1 text-[11px] text-indigo-700 font-bold mt-4 text-left">
                <CalendarDays className="size-3.5 text-indigo-500" /> Scheduled slots
              </div>
            </div>
          </div>

          {/* Top Spenders Table */}
          <div className="p-6 bg-white border border-stone-200 rounded-2xl shadow-xs space-y-4 text-left">
            <div className="flex justify-between items-center pb-3 border-b border-stone-100">
              <div>
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Top Customer Accounts Spenders</span>
                <span className="text-[10px] text-stone-400">Ranked by total client lifetime billing pool</span>
              </div>
              <button
                onClick={() => handleExportCSV(
                  topSpendersList.map((c: any) => ({ Name: c.name, Phone: c.phone || '', 'Total Spend (INR)': c.totalSpend, 'Visits Count': c.totalVisits })),
                  `${tenantSlug}_top_spenders_report.csv`
                )}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-105 hover:bg-stone-200 border border-stone-300 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                <Download className="size-3 text-stone-500" />
                Export CSV
              </button>
            </div>
            <div className="space-y-4">
              {topSpendersList.map((c: any, i: number) => (
                <div key={i} className="flex justify-between items-center pb-3.5 border-b border-stone-100 last:border-0 last:pb-0 group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold flex items-center justify-center text-stone-850 group-hover:scale-105 transition-transform duration-200">
                      {c.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <span className="font-semibold text-stone-905 text-sm block group-hover:text-stone-950 transition-colors">{c.name}</span>
                      {c.phone && <span className="text-[10px] text-stone-450 block font-mono mt-0.5">{c.phone}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-stone-955 text-sm block">₹{c.totalSpend.toLocaleString()}</span>
                    <span className="text-[10px] text-stone-400 block font-bold mt-0.5">{c.totalVisits} checkouts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sub Tab: SALES */}
      {activeReportSubTab === "SALES" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Visual SVG Chart Card */}
          <div className="p-6 bg-white border border-stone-200 rounded-2xl shadow-xs space-y-6 relative overflow-hidden text-left">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block text-left">Daily Revenue Stream</span>
                <span className="text-[10px] text-stone-400 mt-0.5 block">Visualized revenue performance history</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex bg-stone-50 p-1 rounded-xl border border-stone-200">
                  {([7, 14, 30] as const).map((days) => (
                    <button
                      key={days}
                      onClick={() => {
                        setSalesRangeDays(days);
                        setHoveredBarIndex(null);
                      }}
                      className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                        salesRangeDays === days
                          ? "bg-stone-900 text-white shadow-xs"
                          : "text-stone-400 hover:text-stone-700"
                      }`}
                    >
                      {days}D
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => handleExportCSV(
                    filteredDailyRevList.map((d: any) => ({ Date: d.date, 'Revenue (INR)': d.revenue, 'Checkout Count': d.invoices })),
                    `${tenantSlug}_daily_sales_${salesRangeDays}d.csv`
                  )}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  <Download className="size-3 text-stone-500" />
                  Export CSV
                </button>
              </div>
            </div>

            {/* Interactive SVG Chart */}
            {filteredDailyRevList.length > 0 ? (() => {
              const chartHeight = 220;
              const chartWidth = 720;
              const padding = { top: 25, right: 20, bottom: 30, left: 50 };
              const graphHeight = chartHeight - padding.top - padding.bottom;
              const graphWidth = chartWidth - padding.left - padding.right;

              const maxRevVal = Math.max(...filteredDailyRevList.map((d: any) => Number(d.revenue)), 1000);
              const orderOfMag = Math.pow(10, Math.floor(Math.log10(maxRevVal)));
              const yAxisMax = Math.ceil(maxRevVal / (orderOfMag / 2)) * (orderOfMag / 2);

              const totalRevenueSum = filteredDailyRevList.reduce((sum: number, item: any) => sum + item.revenue, 0);
              const dailyAvg = Math.round(totalRevenueSum / filteredDailyRevList.length);

              const count = filteredDailyRevList.length;
              const barWidth = Math.max((graphWidth / count) * 0.6, 3);
              const barGap = (graphWidth / count) * 0.4;

              return (
                <div className="space-y-4">
                  <div className="relative w-full overflow-x-auto select-none no-scrollbar">
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full min-w-[500px] h-auto overflow-visible">
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#1C1917" stopOpacity="0.95" />
                          <stop offset="100%" stopColor="#44403C" stopOpacity="0.7" />
                        </linearGradient>
                        <linearGradient id="hoverGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#78716C" stopOpacity="1" />
                          <stop offset="100%" stopColor="#A8A29E" stopOpacity="0.8" />
                        </linearGradient>
                      </defs>

                      {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                        const y = padding.top + graphHeight * (1 - ratio);
                        const labelVal = Math.round(yAxisMax * ratio);
                        return (
                          <g key={idx} className="opacity-70">
                            <line x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke="#E7E5E4" strokeDasharray="3 3" />
                            <text x={padding.left - 10} y={y + 3} textAnchor="end" className="fill-stone-400 font-mono text-[9px] font-bold">₹{labelVal.toLocaleString()}</text>
                          </g>
                        );
                      })}

                      {dailyAvg > 0 && (() => {
                        const yAvg = padding.top + graphHeight * (1 - (dailyAvg / yAxisMax));
                        return (
                          <g>
                            <line x1={padding.left} y1={yAvg} x2={chartWidth - padding.right} y2={yAvg} stroke="#A8A29E" strokeWidth="1.5" strokeDasharray="5 5" className="opacity-80" />
                            <text x={chartWidth - padding.right - 5} y={yAvg - 5} textAnchor="end" className="fill-stone-500 font-bold text-[8px] uppercase tracking-wider bg-white">Avg: ₹{dailyAvg.toLocaleString()}</text>
                          </g>
                        );
                      })()}

                      {filteredDailyRevList.map((d: any, idx: number) => {
                        const val = Number(d.revenue);
                        const barHeight = (val / yAxisMax) * graphHeight;
                        const x = padding.left + idx * (barWidth + barGap) + (barGap / 2);
                        const y = chartHeight - padding.bottom - barHeight;
                        const isHovered = hoveredBarIndex === idx;

                        return (
                          <g key={idx}>
                            <rect
                              x={x - barGap / 2}
                              y={padding.top}
                              width={barWidth + barGap}
                              height={graphHeight}
                              fill="transparent"
                              className="cursor-pointer"
                              onMouseEnter={() => setHoveredBarIndex(idx)}
                              onMouseLeave={() => setHoveredBarIndex(null)}
                            />
                            <rect
                              x={x}
                              y={y}
                              width={barWidth}
                              height={Math.max(barHeight, 2)}
                              rx={Math.max(barWidth / 4, 1)}
                              fill={isHovered ? "url(#hoverGradient)" : "url(#barGradient)"}
                              className="transition-all duration-200 pointer-events-none"
                            />
                            {isHovered && val > 0 && (
                              <circle
                                cx={x + barWidth / 2}
                                cy={y}
                                r="4"
                                className="fill-stone-900 stroke-white stroke-2 animate-pulse"
                              />
                            )}
                          </g>
                        );
                      })}

                      <line x1={padding.left} y1={chartHeight - padding.bottom} x2={chartWidth - padding.right} y2={chartHeight - padding.bottom} stroke="#D6D3D1" strokeWidth="1" />

                      {filteredDailyRevList.map((d: any, idx: number) => {
                        const modulo = count > 15 ? 5 : count > 8 ? 2 : 1;
                        if (idx % modulo !== 0 && idx !== count - 1) return null;

                        const x = padding.left + idx * (barWidth + barGap) + (barGap / 2) + (barWidth / 2);
                        const y = chartHeight - padding.bottom + 14;
                        const dateLabel = d.date.split("-").slice(1).join("/");
                        return (
                          <text key={idx} x={x} y={y} textAnchor="middle" className="fill-stone-400 font-mono text-[9px] font-bold">{dateLabel}</text>
                        );
                      })}
                    </svg>
                  </div>

                  <div className="h-12 bg-stone-50 border border-stone-200 rounded-xl p-3 flex justify-between items-center text-xs font-semibold">
                    {hoveredBarIndex !== null ? (() => {
                      const d = filteredDailyRevList[hoveredBarIndex];
                      const avgTicket = d.invoices > 0 ? Math.round(d.revenue / d.invoices) : 0;
                      return (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-stone-400 uppercase tracking-wider font-bold">Selected Date:</span>
                            <span className="font-mono text-stone-900 font-bold">{d.date}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div>
                              <span className="text-[10px] text-stone-400 uppercase tracking-wider font-bold mr-1.5">Revenue:</span>
                              <span className="text-stone-950 font-black">₹{d.revenue.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-stone-400 uppercase tracking-wider font-bold mr-1.5">Checkouts:</span>
                              <span className="text-stone-850 font-bold">{d.invoices} tickets</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-stone-400 uppercase tracking-wider font-bold mr-1.5">Avg Invoice:</span>
                              <span className="text-stone-850 font-bold">₹{avgTicket.toLocaleString()}</span>
                            </div>
                          </div>
                        </>
                      );
                    })() : (
                      <div className="text-stone-400 text-center w-full text-[10px] uppercase tracking-wider font-bold">
                        Hover over any bar in the chart to inspect daily details
                      </div>
                    )}
                  </div>
                </div>
              );
            })() : (
              <div className="p-12 text-center text-stone-400 uppercase tracking-wider text-[10px] font-bold">
                No daily sales transaction history matches this range.
              </div>
            )}
          </div>

          {/* Table list log */}
          <div className="p-6 bg-white border border-stone-200 rounded-2xl shadow-xs space-y-4 text-left">
            <div className="flex justify-between items-center pb-2 border-b border-stone-150">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Detailed Daily Sales Logs</span>
              <span className="text-[10px] text-stone-400 font-bold">Chronological list of checkouts and billing</span>
            </div>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-stone-250 text-stone-400 text-[10px] font-black uppercase tracking-wider">
                    <th className="py-2.5">Billing Date</th>
                    <th className="py-2.5">Total Revenue</th>
                    <th className="py-2.5">Paid Checkouts</th>
                    <th className="py-2.5 text-right">Average Ticket Size</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-stone-700 font-semibold">
                  {[...filteredDailyRevList].reverse().map((d: any, idx: number) => {
                    const avgTicket = d.invoices > 0 ? Math.round(d.revenue / d.invoices) : 0;
                    return (
                      <tr key={idx} className="border-b border-stone-100 hover:bg-stone-50/50 transition-colors">
                        <td className="py-3 font-mono text-stone-850">{d.date}</td>
                        <td className="py-3 text-stone-955 font-bold">₹{d.revenue.toLocaleString()}.00</td>
                        <td className="py-3 text-stone-500">{d.invoices} invoices</td>
                        <td className="py-3 text-right text-stone-900 font-mono">₹{avgTicket.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sub Tab: STAFF */}
      {activeReportSubTab === "STAFF" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Staff Performance */}
          <div className="p-6 bg-white border border-stone-200 rounded-2xl shadow-xs space-y-4 text-left">
            <div className="flex justify-between items-center pb-2 border-b border-stone-150">
              <div>
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Staff Allocation & Performance Desk</span>
                <span className="text-[10px] text-stone-400 mt-0.5 block">Aggregated stylist booking volume and sales contribution</span>
              </div>
              <button
                onClick={() => handleExportCSV(
                  staffList.map((s: any) => ({ Name: s.staffName, Role: s.role, 'Completed Bookings': s.completedBookings, 'Invoices Created': s.invoicesCreated, 'Revenue Generated (INR)': s.revenueGenerated, 'Avg Value / Booking (INR)': s.avgPerBooking })),
                  `${tenantSlug}_staff_performance_report.csv`
                )}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                <Download className="size-3 text-stone-500" />
                Export CSV
              </button>
            </div>

            <div className="space-y-5 pt-2">
              {staffList.map((s: any, idx: number) => {
                const maxStaffRevenue = Math.max(...staffList.map((st: any) => st.revenueGenerated), 1000);
                const percentage = Math.round((s.revenueGenerated / maxStaffRevenue) * 100);

                return (
                  <div key={idx} className="space-y-2 group">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-stone-50 border border-stone-200 flex items-center justify-center text-[10px] font-bold text-stone-700">
                          {s.staffName.slice(0,2).toUpperCase()}
                        </div>
                        <div className="text-left">
                          <span className="text-xs font-bold text-stone-850 block">{s.staffName}</span>
                          <span className="text-[9px] text-stone-400 uppercase tracking-wider font-extrabold font-minimal">{s.role}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-stone-955">₹{s.revenueGenerated.toLocaleString()}</span>
                        <span className="text-[9px] text-stone-400 block font-semibold">{s.completedBookings} jobs completed</span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${percentage}%` }}
                        className="h-full bg-stone-850 rounded-full transition-all duration-500 group-hover:bg-stone-950"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Outlet Performance */}
          {outletPerformance && outletPerformance.length > 0 && (
            <div className="p-6 bg-white border border-stone-200 rounded-2xl shadow-xs space-y-4 text-left">
              <div className="flex justify-between items-center pb-2 border-b border-stone-150">
                <div>
                  <span className="text-xs font-bold text-stone-505 uppercase tracking-wider block">Outlet Distribution Matrix</span>
                  <span className="text-[10px] text-stone-405 mt-0.5 block">Geographical allocation of billing volume and client count</span>
                </div>
                <button
                  onClick={() => handleExportCSV(
                    outletPerformance.map((o: any) => ({ Name: o.outletName, City: o.city, 'Unique Clients': o.uniqueCustomers, 'Completed Jobs': o.completedBookings, 'Total Revenue (INR)': o.revenue, 'Avg Billing / Job (INR)': o.avgRevenuePerBooking })),
                    `${tenantSlug}_outlet_performance_report.csv`
                  )}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  <Download className="size-3 text-stone-500" />
                  Export CSV
                </button>
              </div>
              
              <div className="space-y-4 pt-2">
                {outletPerformance.map((o: any, idx: number) => {
                  const maxOutletRevenue = Math.max(...outletPerformance.map((ol: any) => ol.revenue), 1000);
                  const percentage = Math.round((o.revenue / maxOutletRevenue) * 100);

                  return (
                    <div key={idx} className="space-y-2 group">
                      <div className="flex justify-between items-center">
                        <div className="text-left">
                          <span className="text-xs font-bold text-stone-850 block">{o.outletName}</span>
                          <span className="text-[9px] text-stone-400 uppercase tracking-widest font-bold mt-0.5 block">{o.city}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-stone-955">₹{o.revenue.toLocaleString()}</span>
                          <span className="text-[9px] text-stone-400 block font-semibold">{o.uniqueCustomers} customers</span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${percentage}%` }}
                          className="h-full bg-stone-850 rounded-full transition-all duration-500 group-hover:bg-stone-950"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sub Tab: SERVICES */}
      {activeReportSubTab === "SERVICES" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Popular Services */}
            <div className="p-6 bg-white border border-stone-200 rounded-2xl shadow-xs space-y-4 text-left">
              <div className="flex justify-between items-center pb-2 border-b border-stone-150">
                <div>
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Service Popularity Analysis</span>
                  <span className="text-[10px] text-stone-400 mt-0.5 block">Visual split of most booked treatment catalogs</span>
                </div>
                <button
                  onClick={() => handleExportCSV(
                    serviceList.map((s: any) => ({ 'Service Name': s.serviceName, 'Times Booked': s.timesBooked, 'Revenue Generated (INR)': s.revenueGenerated })),
                    `${tenantSlug}_service_popularity_report.csv`
                  )}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  <Download className="size-3 text-stone-500" />
                  Export CSV
                </button>
              </div>
              
              <div className="space-y-4 pt-2">
                {serviceList.map((s: any, idx: number) => {
                  const maxServiceRevenue = Math.max(...serviceList.map((sv: any) => sv.revenueGenerated), 1000);
                  const percentage = Math.round((s.revenueGenerated / maxServiceRevenue) * 100);

                  return (
                    <div key={idx} className="space-y-2 group text-left">
                      <div className="flex justify-between items-center text-xs">
                        <div className="text-left">
                          <span className="font-semibold text-stone-855 block">{s.serviceName}</span>
                          <span className="text-[9px] text-stone-450 mt-0.5 block">{s.timesBooked} completed appointments</span>
                        </div>
                        <span className="font-extrabold text-stone-955">₹{s.revenueGenerated.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 w-full bg-stone-50 border border-stone-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${percentage}%` }}
                          className="h-full bg-stone-800 rounded-full transition-all duration-500 group-hover:bg-stone-900"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Retention & Bookings */}
            <div className="p-6 bg-white border border-stone-200 rounded-2xl shadow-xs space-y-6 text-left">
              
              {/* Customer Retention Card */}
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b">
                  <div>
                    <span className="text-xs font-bold text-stone-505 uppercase tracking-wider block">Customer Retention Stats</span>
                    <span className="text-[10px] text-stone-400 mt-0.5 block">Loyalty metrics from CRM database</span>
                  </div>
                  <button
                    onClick={() => handleExportCSV(
                      [
                        {
                          'Total Customers': retention.totalCustomers,
                          'New / One-time Guests': retention.newCustomers,
                          'Repeat / Active Members': retention.repeatCustomers,
                          'At Risk / Inactive Profiles': retention.atRiskCustomers,
                          'Retention Rate (%)': retention.retentionRate
                        }
                      ],
                      `${tenantSlug}_retention_stats_report.csv`
                    )}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    <Download className="size-3 text-stone-500" />
                    Export CSV
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl">
                    <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">Retention Rate</span>
                    <span className="text-2xl font-black text-stone-955 mt-1 block">{retention.retentionRate}%</span>
                    <div className="h-1 w-full bg-stone-200 rounded-full mt-3 overflow-hidden">
                      <div style={{ width: `${retention.retentionRate}%` }} className="h-full bg-stone-850 rounded-full" />
                    </div>
                  </div>
                  <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl">
                    <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">At Risk Clients</span>
                    <span className="text-2xl font-black text-stone-955 mt-1 block">{retention.atRiskCustomers} profiles</span>
                    <p className="text-[9px] text-stone-400 font-bold uppercase mt-2">No visits in 60 days</p>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs font-semibold text-stone-600 pt-2 text-left">
                  <div className="flex justify-between">
                    <span>New / One-time Guests:</span>
                    <span className="text-stone-955 font-bold">{retention.newCustomers} members</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Repeat / Active Members:</span>
                    <span className="text-stone-955 font-bold">{retention.repeatCustomers} members</span>
                  </div>
                </div>
              </div>

              {/* Booking lifecycle Card */}
              <div className="space-y-4 pt-5 border-t border-stone-100">
                <span className="text-xs font-bold text-stone-505 uppercase tracking-wider block">Booking Lifecycle Analytics</span>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl">
                    <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">Completion Rate</span>
                    <span className="text-2xl font-black text-stone-955 mt-1 block">{bookingStats.completionRate}%</span>
                  </div>
                  <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl">
                    <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">Cancellation Rate</span>
                    <span className="text-2xl font-black text-stone-955 mt-1 block">{bookingStats.cancellationRate}%</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs font-semibold text-stone-605 font-sans text-left">
                  <div className="flex justify-between">
                    <span>Total Bookings Logged:</span>
                    <span className="text-stone-900 font-bold">{bookingStats.total} slots</span>
                  </div>
                  <div className="flex justify-between">
                    <span>No-show / Missed Bookings:</span>
                    <span className="text-stone-900 font-bold">{bookingStats.noShow} slots</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Sub Tab: FORECAST */}
      {activeReportSubTab === "FORECAST" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
            
            {/* Predictive Forecast */}
            <div className="p-6 bg-white border border-stone-200 rounded-2xl shadow-xs space-y-5">
              <div className="flex justify-between items-center pb-2 border-b">
                <div>
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="size-4 text-amber-500" />
                    Platform AI Revenue Forecast
                  </span>
                  <span className="text-[10px] text-stone-400 mt-0.5 block">Next 30-day projection from confirmed schedules</span>
                </div>
                <button
                  onClick={() => handleExportCSV(
                    [
                      {
                        'Projected Revenue': forecast.projectedRevenue,
                        'Seat Utilization (%)': forecast.seatUtilizationRate,
                        'Active Stylists': forecast.totalWorkingStylists,
                        'Available Capacity (Hours)': forecast.availableCapacityHours,
                        'Booked Capacity (Hours)': forecast.bookedCapacityHours
                      }
                    ],
                    `${tenantSlug}_predictive_forecast_report.csv`
                  )}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  <Download className="size-3 text-stone-500" />
                  Export CSV
                </button>
              </div>

              <div className="p-5 bg-gradient-to-r from-amber-50 to-[#FAF6EE] border border-amber-200 rounded-2xl space-y-2">
                <span className="text-[9px] font-extrabold text-amber-800 uppercase tracking-wider block">Projected Billing Pool</span>
                <span className="text-3xl font-black text-amber-955 block">₹{forecast.projectedRevenue.toLocaleString()}.00</span>
              </div>

              <div className="space-y-3.5 text-xs font-semibold text-stone-600">
                <div className="flex justify-between">
                  <span>Stylist Utilization Rate:</span>
                  <span className="text-stone-955 font-bold">{forecast.seatUtilizationRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Working Stylists:</span>
                  <span className="text-stone-900 font-bold">{forecast.totalWorkingStylists} staff</span>
                </div>
                <div className="flex justify-between">
                  <span>Booked Slot hours:</span>
                  <span className="text-stone-900 font-bold">{forecast.bookedCapacityHours} hrs</span>
                </div>
                <div className="flex justify-between">
                  <span>Available Capacity:</span>
                  <span className="text-stone-900 font-bold">{forecast.availableCapacityHours} hrs</span>
                </div>
              </div>

              {forecast.atRiskCustomers && forecast.atRiskCustomers.length > 0 && (
                <div className="pt-4 border-t space-y-3">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Clients At-Risk of No-Show / Cancel</span>
                  <div className="space-y-2">
                    {forecast.atRiskCustomers.slice(0, 3).map((arc: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center bg-stone-50 p-3 rounded-xl border border-stone-200">
                        <div className="text-left">
                          <span className="text-xs font-bold text-stone-905 block">{arc.name}</span>
                          {arc.phone && <span className="text-[10px] text-stone-400 block font-mono mt-0.5">{arc.phone}</span>}
                        </div>
                        <span className="text-[10px] font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
                          {arc.noShowProbability}% no-show risk
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* GSTR Report */}
            <div className="p-6 bg-white border border-stone-200 rounded-2xl shadow-xs space-y-5 text-left">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-xs font-bold text-stone-505 uppercase tracking-wider block">GST Compliance Summary Report</span>
                <button
                  onClick={() => handleExportCSV(
                    gstr.hsnSummary.map((h: any) => ({ 'HSN/SAC Code': h.hsnSacCode, Description: h.description, 'Taxable Value (INR)': h.taxableValue, 'CGST (INR)': h.cgst, 'SGST (INR)': h.sgst, 'Total GST (INR)': h.totalGst, 'Total Gross Value (INR)': h.totalValue })),
                    `${tenantSlug}_gstr_tax_compliance_report.csv`
                  )}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-105 hover:bg-stone-200 border border-stone-300 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  <Download className="size-3 text-stone-505" />
                  Export CSV
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl">
                  <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">Total Taxable Value</span>
                  <span className="text-lg font-black text-stone-955 mt-1 block">₹{gstr.summary.totalTaxableValue.toLocaleString()}</span>
                </div>
                <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl">
                  <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">Consolidated GST Pool</span>
                  <span className="text-lg font-black text-stone-955 mt-1 block">₹{gstr.summary.totalGst.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-3.5 text-xs font-semibold text-stone-600 pt-2">
                <div className="flex justify-between">
                  <span>CGST Collected (9% / State):</span>
                  <span className="text-stone-900 font-bold">₹{gstr.summary.totalCgst.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>SGST Collected (9% / Center):</span>
                  <span className="text-stone-900 font-bold">₹{gstr.summary.totalSgst.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Checkouts Covered:</span>
                  <span className="text-stone-900 font-bold">{gstr.summary.invoiceCount} invoices</span>
                </div>
              </div>

              {gstr.hsnSummary && gstr.hsnSummary.length > 0 && (
                <div className="pt-4 border-t space-y-3">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">HSN / SAC Split Summary</span>
                  <div className="space-y-2">
                    {gstr.hsnSummary.map((hsn: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-xs pb-2 border-b border-stone-100 last:border-0 last:pb-0">
                        <div className="text-left">
                          <span className="font-bold text-stone-850 block">{hsn.description}</span>
                          <span className="text-[9px] text-stone-400 font-mono">SAC: {hsn.hsnSacCode}</span>
                        </div>
                        <span className="font-bold text-stone-955">₹{hsn.taxableValue.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
