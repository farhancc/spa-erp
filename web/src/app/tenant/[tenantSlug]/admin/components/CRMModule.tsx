import React, { useState, useEffect } from "react";
import { Search, Award, Plus, Trash2, Download } from "lucide-react";

interface CrmCustomer {
  id: string;
  name: string;
  phone: string;
  email: string;
  totalVisits: number;
  totalSpend: number;
  tags?: string[] | string | null;
  notes: Array<{ addedBy: string; date: string; content: string }>;
  loyaltyPoints?: number;
  activeSubscriptionId?: string;
  subscriptionExpiry?: string;
}

interface CRMModuleProps {
  customers: CrmCustomer[];
  activeCrmIndex: number;
  setActiveCrmIndex: (idx: number) => void;
  crmSubTab: "CLIENTS" | "SEGMENTS";
  setCrmSubTab: (tab: "CLIENTS" | "SEGMENTS") => void;
  crmSearch: string;
  setCrmSearch: (val: string) => void;
  showOnlySubscribers: boolean;
  setShowOnlySubscribers: (val: boolean) => void;
  setIsCustomerModalOpen: (open: boolean) => void;
  handleDeleteCustomer: (id: string) => void;
  handleUpdateCustomerTags: (id: string, tagsStr: string) => void;
  handleAddLoyaltyPoints: (id: string, points: number) => void;
  subscriptions: any[];
  handleRevokeSubscription: (id: string) => void;
  handleAssignSubscription: (id: string, subscriptionId: string) => void;
  customerPasswordInput: string;
  setCustomerPasswordInput: (val: string) => void;
  handleUpdateCustomerPassword: () => void;
  newCrmNote: string;
  setNewCrmNote: (val: string) => void;
  handleAddCrmNote: (e: React.FormEvent) => void;
  customerSegments: any[];
  setIsSegmentModalOpen: (open: boolean) => void;
  selectedSegmentId: string | null;
  fetchSegmentMembers: (segmentId: string) => void;
  handleDeleteSegment: (segmentId: string) => void;
  segmentMembers: any[];
  handleSendWhatsAppDetails: (customerId: string, newPassword?: string) => void;
}

export default function CRMModule({
  customers,
  activeCrmIndex,
  setActiveCrmIndex,
  crmSubTab,
  setCrmSubTab,
  crmSearch,
  setCrmSearch,
  showOnlySubscribers,
  setShowOnlySubscribers,
  setIsCustomerModalOpen,
  handleDeleteCustomer,
  handleUpdateCustomerTags,
  handleAddLoyaltyPoints,
  subscriptions,
  handleRevokeSubscription,
  handleAssignSubscription,
  customerPasswordInput,
  setCustomerPasswordInput,
  handleUpdateCustomerPassword,
  newCrmNote,
  setNewCrmNote,
  handleAddCrmNote,
  customerSegments,
  setIsSegmentModalOpen,
  selectedSegmentId,
  fetchSegmentMembers,
  handleDeleteSegment,
  segmentMembers,
  handleSendWhatsAppDetails,
}: CRMModuleProps) {
  
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [tagsInput, setTagsInput] = useState("");
  const [mobileShowDetails, setMobileShowDetails] = useState(false);
  const [mobileShowSegmentMembers, setMobileShowSegmentMembers] = useState(false);

  const downloadExcel = () => {
    if (!segmentMembers || segmentMembers.length === 0) return;

    // Define CSV headers
    const headers = ["Customer Name", "Phone", "Total Visits", "Total Spend (INR)", "Last Visited"];
    
    // Format rows
    const rows = segmentMembers.map(member => [
      `"${member.name.replace(/"/g, '""')}"`,
      `"${member.phone.replace(/"/g, '""')}"`,
      member.totalVisits || 0,
      member.totalSpend || 0,
      member.lastVisitAt ? new Date(member.lastVisitAt).toLocaleDateString("en-IN") : "Never"
    ]);

    // Combine headers and rows with UTF-8 BOM to ensure proper character encoding in Excel
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

    // Create Blob and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `segment_members_${selectedSegmentId || "export"}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeCustomer = customers[activeCrmIndex];

  useEffect(() => {
    setIsEditingTags(false);
    if (activeCustomer) {
      const rawTags = activeCustomer.tags;
      const tagsStr = Array.isArray(rawTags) ? rawTags.join(", ") : (rawTags || "");
      setTagsInput(tagsStr);
    }
  }, [activeCrmIndex, activeCustomer]);

  const filteredCrm = customers.filter(c => {
    const searchLower = crmSearch.toLowerCase();
    const matchesNameOrPhone = c.name.toLowerCase().includes(searchLower) || c.phone.includes(crmSearch);
    
    // Tag checking
    const tagsArray = Array.isArray(c.tags) 
      ? c.tags 
      : (c.tags ? (c.tags as string).split(",").map(t => t.trim().toLowerCase()) : []);
    const matchesTag = tagsArray.some(tag => tag.includes(searchLower));

    const matchesSearch = matchesNameOrPhone || matchesTag;

    if (showOnlySubscribers) {
      return matchesSearch && !!c.activeSubscriptionId;
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-8 font-minimal text-left">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="text-left w-full">
          <h3 className="font-normal font-luxury text-3xl text-stone-900 tracking-normal">CRM & Client Segmentation</h3>
          <p className="text-sm text-stone-500 mt-1">Manage client profiles, custom tags, and dynamic segments</p>
        </div>
      </div>

      {/* Sub-tab Selection */}
      <div className="flex border-b border-stone-200 gap-6 text-sm font-semibold mb-6">
        <button
          onClick={() => setCrmSubTab("CLIENTS")}
          className={`pb-3 transition-colors cursor-pointer border-b-2 px-1 ${
            crmSubTab === "CLIENTS" 
              ? "border-stone-900 text-stone-900 font-bold" 
              : "border-transparent text-stone-400 hover:text-stone-700"
          }`}
        >
          Client Directory
        </button>
        <button
          onClick={() => setCrmSubTab("SEGMENTS")}
          className={`pb-3 transition-colors cursor-pointer border-b-2 px-1 ${
            crmSubTab === "SEGMENTS" 
              ? "border-stone-900 text-stone-900 font-bold" 
              : "border-transparent text-stone-400 hover:text-stone-700"
          }`}
        >
          Smart Segments
        </button>
      </div>

      {/* CLIENT DIRECTORY VIEW */}
      {crmSubTab === "CLIENTS" && (
        <>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 w-full justify-end flex-wrap sm:flex-nowrap">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-stone-400" />
                <input 
                  type="text"
                  placeholder="Search CRM..."
                  value={crmSearch}
                  onChange={(e) => setCrmSearch(e.target.value)}
                  className="w-full bg-white border border-stone-200 focus:border-stone-850 rounded-xl py-3.5 pl-12 pr-4 text-sm font-semibold text-stone-755 outline-none transition-all"
                />
              </div>
              <button 
                onClick={() => setShowOnlySubscribers(!showOnlySubscribers)}
                className={`px-4 py-3.5 border rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  showOnlySubscribers 
                    ? "bg-stone-900 border-stone-900 text-white" 
                    : "bg-white border-stone-200 text-stone-600 hover:text-stone-800"
                }`}
              >
                <Award className="size-4" /> 
                {showOnlySubscribers ? "Active Subscribers" : "All Customers"}
              </button>
              <button 
                onClick={() => setIsCustomerModalOpen(true)}
                className="px-6 py-3.5 bg-stone-900 hover:bg-stone-850 text-white rounded-xl text-xs font-semibold uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <Plus className="size-4" /> Add Profile
              </button>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-8 pt-6 border-t border-stone-200 items-start">
            {/* Left Crm list */}
            <div className={`col-span-12 sm:col-span-5 space-y-4 max-h-[460px] overflow-y-auto pr-1 ${mobileShowDetails ? "hidden sm:block" : "block"}`}>
              {filteredCrm.map((cust) => (
                <div 
                  key={cust.id} 
                  onClick={() => {
                    setActiveCrmIndex(customers.findIndex(c => c.id === cust.id));
                    setMobileShowDetails(true);
                  }}
                  className={`p-5 rounded-2xl border text-left cursor-pointer transition-all flex items-center justify-between gap-3 ${
                    customers[activeCrmIndex]?.id === cust.id 
                      ? 'border-stone-900 bg-stone-100/50' 
                      : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/50'
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center font-semibold text-stone-700 text-sm shrink-0">
                      {cust.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      {cust.tags && (
                        <div className="flex flex-wrap gap-1 mb-1.5">
                          {(Array.isArray(cust.tags) 
                            ? cust.tags 
                            : (cust.tags as string).split(",").map((t: string) => t.trim()).filter(Boolean)
                          ).slice(0, 3).map((t: string) => (
                            <span key={t} className="px-1.5 py-0.5 bg-stone-200/60 text-stone-700 text-[8px] font-bold rounded uppercase tracking-wider border border-stone-300/30">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                      <h4 className="font-semibold text-stone-900 text-base truncate">{cust.name}</h4>
                      <span className="text-xs text-stone-450 block truncate mt-0.5">{cust.phone}</span>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCustomer(cust.id);
                    }}
                    className="p-2 text-stone-400 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors shrink-0"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
              {filteredCrm.length === 0 && (
                <p className="text-stone-400 text-sm italic text-left py-4">No matching customer profiles.</p>
              )}
            </div>

            {/* Right Crm detail */}
            <div className={`col-span-12 sm:col-span-7 bg-stone-50/50 border border-stone-200 rounded-2xl p-4 sm:p-8 text-left space-y-6 ${!mobileShowDetails ? "hidden sm:block" : "block"}`}>
              {customers[activeCrmIndex] ? (
                <>
                  {/* Back button on mobile */}
                  <button
                    onClick={() => setMobileShowDetails(false)}
                    className="sm:hidden flex items-center gap-1.5 text-stone-550 hover:text-stone-900 text-[10px] font-bold uppercase tracking-widest mb-4 pb-2 border-b border-stone-200 w-full"
                  >
                    ← Back to Customer List
                  </button>
                  <div className="flex justify-between items-start pb-5 border-b border-stone-200">
                    <div>
                      <h4 className="font-normal font-luxury text-2xl text-stone-900 tracking-normal">{customers[activeCrmIndex].name}</h4>
                      <span className="text-sm text-stone-500 font-medium block mt-2">{customers[activeCrmIndex].phone} | {customers[activeCrmIndex].email}</span>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end items-center">
                      {isEditingTags ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={tagsInput}
                            onChange={(e) => setTagsInput(e.target.value)}
                            placeholder="VIP, Regular"
                            className="bg-white border border-stone-200 focus:border-stone-850 rounded-lg px-2.5 py-1 text-xs font-semibold text-stone-850 outline-none w-40"
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              await handleUpdateCustomerTags(customers[activeCrmIndex].id, tagsInput);
                              setIsEditingTags(false);
                            }}
                            className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingTags(false);
                              const rawTags = customers[activeCrmIndex].tags;
                              const tagsStr = Array.isArray(rawTags) ? rawTags.join(", ") : (rawTags || "");
                              setTagsInput(tagsStr);
                            }}
                            className="px-2 py-1 bg-white hover:bg-stone-50 text-[10px] font-semibold text-stone-650 rounded-lg border border-stone-200 cursor-pointer transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          {(customers[activeCrmIndex].tags 
                            ? (Array.isArray(customers[activeCrmIndex].tags) 
                                ? customers[activeCrmIndex].tags 
                                : (customers[activeCrmIndex].tags as string).split(",").map((t: string) => t.trim()).filter(Boolean))
                            : []
                          ).map((t: string) => (
                            <span key={t} className="px-2.5 py-1 bg-stone-100 text-stone-700 border border-stone-200/80 text-[10px] font-semibold rounded-lg uppercase tracking-wider">{t}</span>
                          ))}
                          <button 
                            type="button"
                            onClick={() => {
                              const rawTags = customers[activeCrmIndex].tags;
                              const tagsStr = Array.isArray(rawTags) ? rawTags.join(", ") : (rawTags || "");
                              setTagsInput(tagsStr);
                              setIsEditingTags(true);
                            }}
                            className="px-2 py-1 bg-white hover:bg-stone-50 text-[10px] font-semibold text-stone-650 rounded-lg border border-stone-200 cursor-pointer transition-all active:scale-95 flex items-center gap-1 shadow-xs"
                          >
                            ✏️ Edit Tags
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* CRM Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="bg-white p-5 rounded-xl border border-stone-200 flex flex-col justify-center shadow-xs">
                      <span className="text-[10px] font-semibold text-stone-450 uppercase tracking-widest block">Total Visits</span>
                      <span className="text-base font-semibold text-stone-900 mt-2 block">{customers[activeCrmIndex].totalVisits} visits</span>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-stone-200 flex flex-col justify-center shadow-xs">
                      <span className="text-[10px] font-semibold text-stone-455 uppercase tracking-widest block">Total Spend</span>
                      <span className="text-base font-semibold text-emerald-800 mt-2 block">₹{customers[activeCrmIndex].totalSpend.toLocaleString()}</span>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-stone-200 relative group flex flex-col justify-between min-h-[110px] shadow-xs">
                      <div>
                        <span className="text-[10px] font-semibold text-stone-455 uppercase tracking-widest block">Loyalty Points</span>
                        <span className="text-base font-semibold text-stone-850 mt-1 block">{customers[activeCrmIndex].loyaltyPoints || 0} pts</span>
                      </div>
                      <div className="flex gap-1 justify-center mt-2">
                        <button 
                          type="button"
                          onClick={() => handleAddLoyaltyPoints(customers[activeCrmIndex].id, 50)}
                          className="px-2 py-0.5 bg-white hover:bg-stone-50 text-[9px] font-semibold text-stone-650 rounded border border-stone-200 cursor-pointer transition-all active:scale-90"
                        >
                          +50
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleAddLoyaltyPoints(customers[activeCrmIndex].id, 100)}
                          className="px-2 py-0.5 bg-white hover:bg-stone-50 text-[9px] font-semibold text-stone-650 rounded border border-stone-200 cursor-pointer transition-all active:scale-90"
                        >
                          +100
                        </button>
                        <button 
                          type="button"
                          onClick={() => {
                            const customAmt = parseInt(prompt("Enter points to add (or negative to deduct):") || "0");
                            if (customAmt) handleAddLoyaltyPoints(customers[activeCrmIndex].id, customAmt);
                          }}
                          className="px-2 py-0.5 bg-white hover:bg-stone-50 text-[9px] font-semibold text-stone-750 rounded border border-stone-200 cursor-pointer transition-all active:scale-90"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Member Subscription Management Panel */}
                  <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4 shadow-xs">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-stone-450 uppercase tracking-widest block">Active Member Subscription</span>
                        {(() => {
                          const activeSubId = customers[activeCrmIndex].activeSubscriptionId;
                          const activeSub = subscriptions.find(s => s.id === activeSubId || s.id === `sub_${activeSubId}` || activeSubId?.includes(s.id));
                          if (activeSub) {
                            return (
                              <div className="flex flex-col gap-1 text-left">
                                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold rounded-lg uppercase tracking-wider w-max flex items-center gap-1">
                                  ✨ {activeSub.name} ({activeSub.duration})
                                </span>
                                <span className="text-xs text-stone-500 font-medium">
                                  Expiration date: <strong className="text-stone-700">{customers[activeCrmIndex].subscriptionExpiry}</strong>
                                </span>
                              </div>
                            );
                          }
                          return (
                            <span className="text-sm font-semibold text-stone-450 italic block">No active membership pass assigned.</span>
                          );
                        })()}
                      </div>

                      {customers[activeCrmIndex].activeSubscriptionId ? (
                        <button 
                          type="button"
                          onClick={() => handleRevokeSubscription(customers[activeCrmIndex].id)}
                          className="px-3.5 py-2 border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer active:scale-95"
                        >
                          Revoke Pass
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <select 
                            className="bg-white border border-stone-200 rounded-xl p-2 text-xs font-semibold text-stone-650 outline-none focus:border-stone-850 cursor-pointer"
                            defaultValue=""
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val) {
                                handleAssignSubscription(customers[activeCrmIndex].id, val);
                                e.target.value = ""; // reset dropdown
                              }
                            }}
                          >
                            <option value="" disabled>-- Assign Pass --</option>
                            {subscriptions.map(s => (
                              <option key={s.id} value={s.id}>
                                {s.name} (₹{s.price})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Portal Credentials Access */}
                  <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4 shadow-xs">
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold text-stone-450 uppercase tracking-widest block">Client Portal Access Credentials</span>
                      <p className="text-xs text-stone-500">Provide login access so the customer can check their portal details, booking history, and active memberships.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-stone-450 uppercase tracking-wider">Sign-in Username / Phone</label>
                        <input
                          type="text"
                          disabled
                          value={customers[activeCrmIndex].phone || customers[activeCrmIndex].email || ""}
                          className="w-full bg-stone-50 border border-stone-150 rounded-xl px-3.5 py-2.5 text-xs text-stone-500 outline-none font-mono cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-stone-550 uppercase tracking-wider">Set Portal Password</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Enter new password"
                            value={customerPasswordInput}
                            onChange={(e) => setCustomerPasswordInput(e.target.value)}
                            className="flex-1 bg-white border border-stone-200 focus:border-stone-850 rounded-xl px-3.5 py-2.5 text-xs text-stone-855 outline-none font-mono"
                          />
                          <button
                            type="button"
                            onClick={handleUpdateCustomerPassword}
                            className="px-4 py-2.5 bg-stone-900 hover:bg-stone-850 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer active:scale-95 shrink-0"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleSendWhatsAppDetails(customers[activeCrmIndex].id, customerPasswordInput || undefined)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 shadow-xs"
                      >
                        <svg className="size-4 fill-current" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.458L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.852.002-2.632-1.023-5.105-2.887-6.97C16.585 1.968 14.1 1.94 11.99 1.94c-5.438 0-9.863 4.42-9.866 9.854-.001 1.761.464 3.478 1.347 4.985L2.474 20.4l3.7-.97c1.464.79 3.09 1.206 4.79 1.21h.003-.003c.002 0 0 0 0 0zm11.353-7.53c-.305-.152-1.802-.89-2.08-.99-.279-.1-.482-.152-.683.15-.201.3-.778 1.002-.953 1.2-.176.2-.352.226-.657.075-.305-.152-1.287-.475-2.45-1.514-.904-.807-1.513-1.802-1.69-2.103-.176-.3-.02-.463.13-.613.137-.134.305-.353.457-.53.15-.177.2-.3.3-.5.1-.2.05-.378-.025-.53-.075-.152-.683-1.65-.935-2.257-.247-.59-.5-.51-.683-.52-.178-.008-.38-.01-.582-.01-.2 0-.528.075-.804.378-.276.3-1.057 1.033-1.057 2.52 0 1.485 1.078 2.92 1.228 3.122.15.2 2.122 3.24 5.14 4.544.717.31 1.277.494 1.713.633.72.23 1.376.197 1.894.12.577-.085 1.802-.738 2.055-1.452.253-.715.253-1.326.177-1.452-.076-.127-.279-.203-.584-.354z" />
                        </svg>
                        Send Login via WhatsApp
                      </button>
                    </div>
                  </div>

                  {/* Add CRM notes form */}
                  <form onSubmit={handleAddCrmNote} className="space-y-3.5">
                    <label className="block text-[10px] font-semibold text-stone-455 uppercase tracking-widest">Append Stylist Visit Note</label>
                    <div className="flex gap-3">
                      <input 
                        type="text"
                        required
                        placeholder="Add stylist guidelines or skin details..."
                        value={newCrmNote}
                        onChange={(e) => setNewCrmNote(e.target.value)}
                        className="flex-1 bg-white border border-stone-200 focus:border-stone-850 rounded-xl py-3.5 px-4 text-sm font-semibold text-stone-750 outline-none transition-all"
                      />
                      <button 
                        type="submit"
                        className="px-6 py-3.5 bg-stone-900 hover:bg-stone-850 text-white rounded-xl text-xs font-semibold uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <Plus className="size-4" /> Save Note
                      </button>
                    </div>
                  </form>

                  {/* Visit Notes Timeline */}
                  <div className="space-y-5 pt-5 border-t border-stone-200">
                    <span className="text-[10px] font-semibold text-stone-455 uppercase tracking-widest block">Stylist Timeline (Prisma model CrmNote)</span>
                    <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                      {customers[activeCrmIndex].notes?.length > 0 ? (
                        customers[activeCrmIndex].notes.map((note, nIdx) => (
                          <div key={nIdx} className="bg-white p-5 rounded-xl border border-stone-200 text-sm space-y-2.5 shadow-xs">
                            <div className="flex justify-between text-xs text-stone-400">
                              <span className="font-semibold text-stone-700">{note.addedBy}</span>
                              <span>{note.date}</span>
                            </div>
                            <p className="text-stone-600 font-medium leading-relaxed text-sm">{note.content}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-stone-450 italic">No stylist visit notes posted yet.</p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-20 text-center text-stone-400 text-sm italic">Select a customer profile to view timeline records.</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* CRM SEGMENTS VIEW */}
      {crmSubTab === "SEGMENTS" && (
        <div className="grid grid-cols-12 gap-8 items-start animate-fade-in">
          {/* Left Column: Segments List */}
          <div className={`col-span-12 sm:col-span-5 space-y-4 ${mobileShowSegmentMembers ? "hidden sm:block" : "block"}`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-stone-450 uppercase tracking-widest">Active Client Segments</span>
              <button
                onClick={() => setIsSegmentModalOpen(true)}
                className="px-4 py-2 bg-stone-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-stone-850 transition-all cursor-pointer"
              >
                + Create Segment
              </button>
            </div>

            <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
              {customerSegments.map(seg => (
                <div 
                  key={seg.id} 
                  onClick={() => {
                    fetchSegmentMembers(seg.id);
                    setMobileShowSegmentMembers(true);
                  }}
                  className={`p-5 rounded-2xl border text-left cursor-pointer transition-all shadow-xs ${
                    seg.id === selectedSegmentId 
                      ? "bg-stone-900 border-stone-900 text-white" 
                      : "bg-white border-stone-200 hover:border-stone-400 text-stone-600"
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <h4 className={`font-semibold text-base leading-snug ${seg.id === selectedSegmentId ? "text-white" : "text-stone-900"}`}>{seg.name}</h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSegment(seg.id);
                      }}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        seg.id === selectedSegmentId ? "text-stone-400 hover:text-white" : "text-stone-450 hover:text-rose-600"
                      }`}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                  {seg.description && (
                    <p className={`text-xs mt-1.5 ${seg.id === selectedSegmentId ? "text-stone-300" : "text-stone-505"}`}>{seg.description}</p>
                  )}
                  <div className="mt-3.5 flex items-center gap-1.5 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-semibold tracking-wider uppercase border ${
                      seg.id === selectedSegmentId 
                        ? "bg-stone-800 border-stone-705 text-stone-200" 
                        : "bg-stone-50 border-stone-200 text-stone-500"
                    }`}>
                      Filter: {seg.criteriaType}
                    </span>
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold tracking-wider uppercase border ${
                      seg.id === selectedSegmentId 
                        ? "bg-stone-800 border-stone-705 text-stone-100" 
                        : "bg-emerald-50 border-emerald-100 text-emerald-800"
                    }`}>
                      Value: {seg.criteriaValue}
                    </span>
                  </div>
                </div>
              ))}
              {customerSegments.length === 0 && (
                <p className="text-stone-450 text-sm italic py-8">No marketing segments created yet.</p>
              )}
            </div>
          </div>

          {/* Right Column: Segment Members List */}
          <div className={`col-span-12 sm:col-span-7 bg-stone-50/50 border border-stone-200 rounded-3xl p-4 sm:p-8 space-y-6 text-left shadow-xs ${!mobileShowSegmentMembers ? "hidden sm:block" : "block"}`}>
            {selectedSegmentId ? (
              <>
                {/* Back button on mobile */}
                <button
                  onClick={() => setMobileShowSegmentMembers(false)}
                  className="sm:hidden flex items-center gap-1.5 text-stone-550 hover:text-stone-900 text-[10px] font-bold uppercase tracking-widest mb-4 pb-2 border-b border-stone-200 w-full"
                >
                  ← Back to Segments
                </button>
                <div className="border-b border-stone-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-normal font-luxury text-2xl text-stone-900">
                      Qualifying Customers ({segmentMembers.length})
                    </h3>
                  </div>
                  {segmentMembers.length > 0 && (
                    <button
                      onClick={downloadExcel}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 shadow-xs self-start sm:self-auto"
                    >
                      <Download className="size-3.5" />
                      Export to Excel
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto border border-stone-200 rounded-2xl bg-white shadow-xs">
                  <table className="w-full text-left border-collapse text-xs font-minimal">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-widest text-[9px]">
                        <th className="p-4">Customer Details</th>
                        <th className="p-4">Visit History</th>
                        <th className="p-4">Total Spend</th>
                        <th className="p-4">Last Visited</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 bg-transparent text-stone-600">
                      {segmentMembers.map(member => (
                        <tr key={member.id} className="hover:bg-stone-50/50 transition-colors">
                          <td className="p-4">
                            <div className="font-semibold text-stone-900">{member.name}</div>
                            <div className="text-stone-400 text-[10px]">{member.phone}</div>
                          </td>
                          <td className="p-4 font-semibold text-stone-850">
                            {member.totalVisits || 0} visits
                          </td>
                          <td className="p-4 font-bold text-stone-900">
                            ₹{member.totalSpend || 0}
                          </td>
                          <td className="p-4 font-mono text-[10px]">
                            {member.lastVisitAt ? new Date(member.lastVisitAt).toLocaleDateString() : "Never"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {segmentMembers.length === 0 && (
                    <p className="text-stone-450 text-sm italic py-8 text-center bg-stone-50/50">No customers match this segment's criteria.</p>
                  )}
                </div>
              </>
            ) : (
              <div className="py-20 text-center text-stone-455 text-sm italic">Select a segment on the left to resolve and target customers.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
