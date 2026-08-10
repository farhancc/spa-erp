import React, { useState, useEffect } from "react";
import { Gift, Coins, Award, Users, Check, AlertCircle, Save } from "lucide-react";

export default function LoyaltyModule({ tenantSlug }: { tenantSlug: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"success" | "error" | null>(null);
  
  // Settings state
  const [isActive, setIsActive] = useState(true);
  const [pointsPerRupee, setPointsPerRupee] = useState(1);
  const [rupeePerPoint, setRupeePerPoint] = useState(0.5);
  const [minRedeemPoints, setMinRedeemPoints] = useState(100);
  const [maxRedeemPct, setMaxRedeemPct] = useState(0.2);
  const [signupPoints, setSignupPoints] = useState(0);
  const [bookingPoints, setBookingPoints] = useState(0);

  // Stats state
  const [totalAccounts, setTotalAccounts] = useState(0);
  const [totalPointsIssued, setTotalPointsIssued] = useState(0);
  const [totalPointsRedeemed, setTotalPointsRedeemed] = useState(0);

  useEffect(() => {
    fetchProgramSettings();
  }, []);

  const fetchProgramSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/loyalty/program", {
        headers: { "x-tenant-slug": tenantSlug }
      });
      const data = await res.json();
      if (data) {
        setIsActive(data.isActive ?? true);
        setPointsPerRupee(data.pointsPerRupee ?? 1);
        setRupeePerPoint(data.rupeePerPoint ?? 0.5);
        setMinRedeemPoints(data.minRedeemPoints ?? 100);
        setMaxRedeemPct(data.maxRedeemPct ?? 0.2);
        setSignupPoints(data.signupPoints ?? 0);
        setBookingPoints(data.bookingPoints ?? 0);
      }

      // Fetch statistics from the customers endpoint
      const statsRes = await fetch(`/api/customers?limit=250`, {
        headers: { "x-tenant-slug": tenantSlug }
      });
      const statsData = await statsRes.json();
      if (statsData && Array.isArray(statsData.data)) {
        const accounts = statsData.data.filter((c: any) => c.loyaltyAccount);
        setTotalAccounts(accounts.length);
        const earned = accounts.reduce((acc: number, c: any) => acc + (c.loyaltyAccount?.lifetimeEarned || 0), 0);
        const redeemed = accounts.reduce((acc: number, c: any) => acc + (c.loyaltyAccount?.lifetimeRedeemed || 0), 0);
        setTotalPointsIssued(earned);
        setTotalPointsRedeemed(redeemed);
      }
    } catch (err) {
      console.error("Failed to fetch loyalty program:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setSaveStatus(null);
      const res = await fetch("/api/loyalty/program", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-slug": tenantSlug
        },
        body: JSON.stringify({
          isActive,
          pointsPerRupee,
          rupeePerPoint,
          minRedeemPoints,
          maxRedeemPct,
          signupPoints,
          bookingPoints
        })
      });
      if (res.ok) {
        setSaveStatus("success");
      } else {
        setSaveStatus("error");
      }
    } catch (err) {
      console.error("Failed to save loyalty settings:", err);
      setSaveStatus("error");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-10 h-10 border-4 border-stone-900 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-stone-500 font-bold tracking-wider uppercase font-minimal">Loading Loyalty Console...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn font-minimal">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-stone-150 pb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900">Configure Loyalty Point Rules</h2>
          <p className="text-xs text-stone-500 mt-1">Set loyalty multipliers, reward triggers, and conversion values for customer actions.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Program Enabled</span>
          <button
            onClick={() => setIsActive(!isActive)}
            className={`w-12 h-7 rounded-full p-0.5 transition-all duration-300 ${isActive ? "bg-stone-900" : "bg-stone-200"}`}
          >
            <div className={`bg-white w-6 h-6 rounded-full shadow-sm transform transition-all duration-300 ${isActive ? "translate-x-5" : "translate-x-0"}`} />
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-stone-50/50 border border-stone-200/80 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block">Active Loyalty Accounts</span>
            <span className="text-3xl font-bold text-stone-900 block mt-1.5">{totalAccounts}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-stone-100/80 flex items-center justify-center text-stone-500">
            <Users className="size-5" />
          </div>
        </div>
        <div className="p-6 bg-stone-50/50 border border-stone-200/80 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block">Lifetime Points Issued</span>
            <span className="text-3xl font-bold text-stone-900 block mt-1.5">{totalPointsIssued} pts</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-stone-100/80 flex items-center justify-center text-stone-500">
            <Coins className="size-5" />
          </div>
        </div>
        <div className="p-6 bg-stone-50/50 border border-stone-200/80 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block">Lifetime Points Redeemed</span>
            <span className="text-3xl font-bold text-stone-900 block mt-1.5">{totalPointsRedeemed} pts</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-stone-100/80 flex items-center justify-center text-stone-500">
            <Award className="size-5" />
          </div>
        </div>
      </div>

      {/* Settings inputs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left column: Action-based Rewards */}
        <div className="space-y-6">
          <div className="p-6 bg-white border border-stone-200/80 rounded-3xl space-y-6 shadow-[0_4px_20px_rgba(28,25,23,0.01)]">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
              <Gift className="size-4.5 text-stone-500" />
              <h3 className="text-xs font-bold text-stone-950 uppercase tracking-wider">Action-Based Rewards</h3>
            </div>
            
            {/* Signup Points */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">Customer Signup Bonus</label>
                <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider">Flat Reward</span>
              </div>
              <input
                type="number"
                min={0}
                value={signupPoints}
                onChange={(e) => setSignupPoints(parseInt(e.target.value) || 0)}
                className="w-full bg-[#FAFAF9] border border-stone-200 focus:border-stone-850 rounded-xl px-4 py-3 text-sm text-stone-900 outline-none transition-all font-semibold"
              />
              <p className="text-[10px] text-stone-400">Awarded automatically to new customers when they first create an account or sign up.</p>
            </div>

            {/* Booking Points */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">Appointment Booking Reward</label>
                <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider">Flat Reward</span>
              </div>
              <input
                type="number"
                min={0}
                value={bookingPoints}
                onChange={(e) => setBookingPoints(parseInt(e.target.value) || 0)}
                className="w-full bg-[#FAFAF9] border border-stone-200 focus:border-stone-850 rounded-xl px-4 py-3 text-sm text-stone-900 outline-none transition-all font-semibold"
              />
              <p className="text-[10px] text-stone-400">Awarded when checking out an invoice that has been linked to a booking/appointment.</p>
            </div>
          </div>
        </div>

        {/* Right column: Transaction/Redemption Rules */}
        <div className="space-y-6">
          <div className="p-6 bg-white border border-stone-200/80 rounded-3xl space-y-6 shadow-[0_4px_20px_rgba(28,25,23,0.01)]">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
              <Coins className="size-4.5 text-stone-500" />
              <h3 className="text-xs font-bold text-stone-950 uppercase tracking-wider">Conversion & Redemption</h3>
            </div>

            {/* Points per Rupee */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">Earning Rate (Points per ₹1 Spent)</label>
                <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider">Spend Multiplier</span>
              </div>
              <input
                type="number"
                step="0.1"
                min={0}
                value={pointsPerRupee}
                onChange={(e) => setPointsPerRupee(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#FAFAF9] border border-stone-200 focus:border-stone-850 rounded-xl px-4 py-3 text-sm text-stone-900 outline-none transition-all font-semibold"
              />
              <p className="text-[10px] text-stone-400">For example, if set to 1.0, spending ₹100 earns 100 points.</p>
            </div>

            {/* Rupee per Point */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">Redemption Value (₹ Value per 1 Point)</label>
                <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider">Cash Value</span>
              </div>
              <input
                type="number"
                step="0.01"
                min={0}
                value={rupeePerPoint}
                onChange={(e) => setRupeePerPoint(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#FAFAF9] border border-stone-200 focus:border-stone-850 rounded-xl px-4 py-3 text-sm text-stone-900 outline-none transition-all font-semibold"
              />
              <p className="text-[10px] text-stone-400">For example, if set to 0.50, 100 points will deduct ₹50 from the customer's bill.</p>
            </div>

            {/* Min Redeem Points & Max Redeem Pct */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Min Redeem Points</label>
                <input
                  type="number"
                  min={0}
                  value={minRedeemPoints}
                  onChange={(e) => setMinRedeemPoints(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#FAFAF9] border border-stone-200 focus:border-stone-850 rounded-xl px-4 py-3 text-sm text-stone-900 outline-none transition-all font-semibold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Max Bill Discount %</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  max={1}
                  value={maxRedeemPct}
                  onChange={(e) => setMaxRedeemPct(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#FAFAF9] border border-stone-200 focus:border-stone-850 rounded-xl px-4 py-3 text-sm text-stone-900 outline-none transition-all font-semibold"
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Save action feedback & button */}
      <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-stone-150 gap-4">
        <div>
          {saveStatus === "success" && (
            <div className="flex items-center gap-2 text-emerald-600 font-semibold text-xs bg-emerald-50 border border-emerald-200/60 px-4 py-2.5 rounded-xl">
              <Check className="size-4" />
              <span>Loyalty configurations updated successfully!</span>
            </div>
          )}
          {saveStatus === "error" && (
            <div className="flex items-center gap-2 text-rose-600 font-semibold text-xs bg-rose-50 border border-rose-200/60 px-4 py-2.5 rounded-xl">
              <AlertCircle className="size-4" />
              <span>Failed to save loyalty configurations. Please try again.</span>
            </div>
          )}
        </div>
        
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="w-full sm:w-auto px-6 py-3.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
        >
          <Save className="size-4" />
          {saving ? "Saving Changes..." : "Save Loyalty Rules"}
        </button>
      </div>
    </div>
  );
}
