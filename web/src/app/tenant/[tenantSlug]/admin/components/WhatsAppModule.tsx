import React from "react";
import {
  Smartphone, Activity, CheckCircle, MessageSquare, Plus, Trash2, Sliders, Edit2, Ban, Lock
} from "lucide-react";

interface WhatsAppModuleProps {
  whatsAppConnected: boolean;
  whatsAppQr: string | null;
  whatsAppPhoneNumber: string | null;
  isWaSyncing: boolean;
  disconnectWhatsApp: () => void;
  waConnectionType: "OFFICIAL" | "SESSION";
  setWaConnectionType: (val: "OFFICIAL" | "SESSION") => void;
  metaAccessToken: string;
  setMetaAccessToken: (val: string) => void;
  metaPhoneNumberId: string;
  setMetaPhoneNumberId: (val: string) => void;
  metaBusinessAccountId: string;
  setMetaBusinessAccountId: (val: string) => void;
  metaVerifyToken: string;
  setMetaVerifyToken: (val: string) => void;
  isSessionConfigSaving: boolean;
  saveSessionConfig: () => void;
  isAddingRule: boolean;
  setIsAddingRule: React.Dispatch<React.SetStateAction<boolean>>;
  newRuleTrigger: "KEYWORD" | "WELCOME" | "OFFICE_HOURS_OUTSIDE";
  setNewRuleTrigger: (val: "KEYWORD" | "WELCOME" | "OFFICE_HOURS_OUTSIDE") => void;
  newRuleKeywords: string;
  setNewRuleKeywords: (val: string) => void;
  newRuleReply: string;
  setNewRuleReply: (val: string) => void;
  isSavingRule: boolean;
  saveAutoReplyRule: () => void;
  autoReplyRules: any[];
  deleteAutoReplyRule: (id: string) => void;
  stealthHumanTyping: boolean;
  setStealthHumanTyping: (val: boolean) => void;
  stealthRandomJitter: boolean;
  setStealthRandomJitter: (val: boolean) => void;
  stealthSpintaxSuffix: boolean;
  setStealthSpintaxSuffix: (val: boolean) => void;
  stealthNaturalHours: boolean;
  setStealthNaturalHours: (val: boolean) => void;
  whatsAppTemplates: any[];
  handleResetTemplates: () => void;
  openAddOtpTemplateModal: () => void;
  openAddTemplateModal: () => void;
  openEditTemplateModal: (tmpl: any) => void;
  handleDeleteTemplate: (id: string) => void;
  formatTemplatePreview: (text: string) => any;
  simulationSuccess: string | null;
  simulatedName: string;
  setSimulatedName: (val: string) => void;
  simulatedPhone: string;
  setSimulatedPhone: (val: string) => void;
  simulatedCampaignType: "signup_otp" | "booking_confirmation" | "reminder_24h" | "reminder_1h" | "birthday_offer" | "inactive_winback";
  setSimulatedCampaignType: (val: "signup_otp" | "booking_confirmation" | "reminder_24h" | "reminder_1h" | "birthday_offer" | "inactive_winback") => void;
  handleSimulateCampaign: (e: React.FormEvent) => void;
  whatsAppLogs: any[];
  tenantSlug: string;
  birthdayWishTemplate: string;
  setBirthdayWishTemplate: (val: string) => void;
  birthdayCouponCode: string;
  setBirthdayCouponCode: (val: string) => void;
  isSavingBirthdaySettings: boolean;
  saveBirthdaySettings: () => void;
}

export default function WhatsAppModule({
  whatsAppConnected,
  whatsAppQr,
  whatsAppPhoneNumber,
  isWaSyncing,
  disconnectWhatsApp,
  waConnectionType,
  setWaConnectionType,
  metaAccessToken,
  setMetaAccessToken,
  metaPhoneNumberId,
  setMetaPhoneNumberId,
  metaBusinessAccountId,
  setMetaBusinessAccountId,
  metaVerifyToken,
  setMetaVerifyToken,
  isSessionConfigSaving,
  saveSessionConfig,
  isAddingRule,
  setIsAddingRule,
  newRuleTrigger,
  setNewRuleTrigger,
  newRuleKeywords,
  setNewRuleKeywords,
  newRuleReply,
  setNewRuleReply,
  isSavingRule,
  saveAutoReplyRule,
  autoReplyRules,
  deleteAutoReplyRule,
  stealthHumanTyping,
  setStealthHumanTyping,
  stealthRandomJitter,
  setStealthRandomJitter,
  stealthSpintaxSuffix,
  setStealthSpintaxSuffix,
  stealthNaturalHours,
  setStealthNaturalHours,
  whatsAppTemplates,
  handleResetTemplates,
  openAddOtpTemplateModal,
  openAddTemplateModal,
  openEditTemplateModal,
  handleDeleteTemplate,
  formatTemplatePreview,
  simulationSuccess,
  simulatedName,
  setSimulatedName,
  simulatedPhone,
  setSimulatedPhone,
  simulatedCampaignType,
  setSimulatedCampaignType,
  handleSimulateCampaign,
  whatsAppLogs,
  tenantSlug,
  birthdayWishTemplate,
  setBirthdayWishTemplate,
  birthdayCouponCode,
  setBirthdayCouponCode,
  isSavingBirthdaySettings,
  saveBirthdaySettings,
}: WhatsAppModuleProps) {
  return (
    <div className="space-y-6 text-left font-sans animate-fadeIn">
      {/* Header */}
      <div>
        <h3 className="font-normal font-luxury text-3xl text-stone-900 tracking-normal text-left">WhatsApp CRM & Automation Engine</h3>
        <p className="text-sm text-stone-505 text-left mt-1">Configure automated notifications, OTP flows, and custom winback campaign sequences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Configurations */}
        <div className="lg:col-span-7 space-y-8">

          {/* CARD: Connection Gateway Status */}
          <div className="p-8 bg-stone-50/50 border border-stone-200 rounded-3xl space-y-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3.5 bg-white border border-stone-200 rounded-2xl text-stone-750 shadow-xs">
                  <Smartphone className="size-5" />
                </div>
                <div className="text-left font-minimal">
                  <h4 className="font-semibold text-base text-stone-900">Communication Gateway</h4>
                  <p className="text-xs text-stone-500">Configure how notifications are routed out of the Careva engine</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`size-2.5 rounded-full ${whatsAppConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-400"}`} />
                <span className="text-xs font-bold text-stone-550 uppercase tracking-widest">
                  {whatsAppConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
            </div>

            {/* Connection mode options tab list */}
            <div className="grid grid-cols-2 gap-3.5 text-xs">
              <button
                type="button"
                onClick={() => setWaConnectionType("SESSION")}
                className={`p-4 rounded-2xl text-left border flex flex-col justify-between min-h-[9rem] cursor-pointer shadow-xs transition-all ${waConnectionType === "SESSION"
                    ? "bg-stone-900 border-stone-900 text-white"
                    : "bg-white border-stone-200 text-stone-605 hover:bg-stone-50"
                  }`}
              >
                <div className="space-y-1">
                  <span className="font-bold text-sm">QR Code Device Pair</span>
                  <span className={`block text-[11px] leading-relaxed font-minimal ${waConnectionType === "SESSION" ? 'text-stone-300' : 'text-stone-500'}`}>
                    Scan a QR code to link your own phone number directly. Best for local businesses.
                  </span>
                </div>
                <div className="flex justify-between items-center w-full mt-2 pt-2 border-t border-stone-200/20">
                  <span className={`text-[10px] uppercase font-semibold tracking-wider ${waConnectionType === "SESSION" ? 'text-stone-400' : 'text-stone-450'}`}>Status</span>
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md ${waConnectionType === "SESSION" ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'}`}>
                    {waConnectionType === "SESSION" ? "Active" : "Scan QR"}
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setWaConnectionType("OFFICIAL")}
                className={`p-4 rounded-2xl text-left border flex flex-col justify-between min-h-[9rem] cursor-pointer shadow-xs transition-all ${waConnectionType === "OFFICIAL"
                    ? "bg-stone-900 border-stone-900 text-white"
                    : "bg-white border-stone-200 text-stone-605 hover:bg-stone-50"
                  }`}
              >
                <div className="space-y-1">
                  <span className="font-bold text-sm">Meta Cloud API</span>
                  <span className={`block text-[11px] leading-relaxed font-minimal ${waConnectionType === "OFFICIAL" ? 'text-stone-300' : 'text-stone-500'}`}>
                    Meta official developer API routing. Best for corporate or high volume sending.
                  </span>
                </div>
                <div className="flex justify-between items-center w-full mt-2 pt-2 border-t border-stone-200/20">
                  <span className={`text-[10px] uppercase font-semibold tracking-wider ${waConnectionType === "OFFICIAL" ? 'text-stone-400' : 'text-stone-450'}`}>Security</span>
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md ${waConnectionType === "OFFICIAL" ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'}`}>
                    {waConnectionType === "OFFICIAL" ? "Active" : "Zero ban risk"}
                  </span>
                </div>
              </button>
            </div>

            {/* Official credentials form */}
            {waConnectionType === "OFFICIAL" && (
              <div className="space-y-4 pt-2">
                <p className="text-[11px] text-stone-500 font-minimal leading-relaxed">
                  Enter your Meta Cloud API credentials from the <strong>Facebook Business Manager → WhatsApp → API Setup</strong> page.
                </p>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { label: "Access Token", value: metaAccessToken, setter: setMetaAccessToken, placeholder: "EAAxxxxxxxxxx..." },
                    { label: "Phone Number ID", value: metaPhoneNumberId, setter: setMetaPhoneNumberId, placeholder: "1234567890" },
                    { label: "Business Account ID (WABA)", value: metaBusinessAccountId, setter: setMetaBusinessAccountId, placeholder: "98765432100" },
                    { label: "Webhook Verify Token", value: metaVerifyToken, setter: setMetaVerifyToken, placeholder: "careva_verify_token" },
                  ].map(field => (
                    <div key={field.label} className="space-y-1.5 text-left">
                      <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-widest">{field.label}</label>
                      <input
                        type="text"
                        value={field.value}
                        onChange={e => field.setter(e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full bg-white border border-stone-200 focus:border-stone-850 rounded-xl px-4 py-3 text-xs text-stone-850 outline-none transition-all font-mono"
                      />
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-stone-100 rounded-xl text-[11px] text-stone-600 font-minimal space-y-1">
                  <p className="font-semibold text-stone-800">Webhook URL to set in Meta:</p>
                  <code className="text-[10px] break-all font-mono text-stone-700">
                    https://api.careva.in/api/v1/whatsapp/webhook
                  </code>
                </div>
              </div>
            )}

            {waConnectionType === "SESSION" && (
              <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4 shadow-xs text-xs text-stone-600 font-minimal">
                {whatsAppConnected ? (
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
                    <div className="space-y-1">
                      <span className="font-semibold text-stone-900 block">Pair Active: {whatsAppPhoneNumber || "Linked Device"}</span>
                      <span className="text-[10px] text-stone-400 block leading-relaxed">System is executing active sync via Baileys Multi-device WebSocket node.</span>
                    </div>
                    <button
                      onClick={disconnectWhatsApp}
                      className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border border-rose-200/50"
                    >
                      <Ban className="size-3.5" /> Disconnect Session
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-4 text-center space-y-4">
                    {isWaSyncing ? (
                      <div className="space-y-3">
                        <div className="size-8 rounded-full border-2 border-stone-200 border-t-stone-800 animate-spin mx-auto" />
                        <p className="text-xs text-stone-450 italic">Syncing WhatsApp credentials & generating session QR...</p>
                      </div>
                    ) : whatsAppQr ? (
                      <div className="space-y-4">
                        <p className="text-[11.5px] leading-relaxed text-stone-500">
                          Scan the QR code below from your phone using <strong>Linked Devices → Link a Device</strong> inside WhatsApp to link your salon's account.
                        </p>
                        <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-xs inline-block">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={whatsAppQr}
                            alt="WhatsApp Session QR"
                            className="size-48 object-contain mx-auto"
                          />
                        </div>
                        <p className="text-[10px] text-stone-400 animate-pulse">QR updates dynamically every 20s</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs text-stone-400 italic">Failed to initialize session. Click Save Settings below to retry connection.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={saveSessionConfig}
              disabled={isSessionConfigSaving}
              className="w-full py-3 bg-stone-900 hover:bg-stone-850 text-white rounded-xl text-xs font-semibold uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-60"
            >
              {isSessionConfigSaving ? (
                <><div className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Saving...</>
              ) : "Save Connection Settings"}
            </button>
          </div>

          {/* CARD: Auto-Reply Rules */}
          <div className="p-8 bg-stone-50/50 border border-stone-200 rounded-3xl space-y-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3.5 bg-white border border-stone-200 rounded-2xl text-stone-750 shadow-xs">
                  <MessageSquare className="size-5" />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-base text-stone-900">Auto-Reply Rules</h4>
                  <p className="text-xs text-stone-500 font-minimal">Respond instantly to inbound WhatsApp messages.</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddingRule(v => !v)}
                className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs hover:bg-stone-850 transition-all"
              >
                <Plus className="size-3.5" /> Add Rule
              </button>
            </div>

            {/* Trigger types legend */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Keyword Match", desc: "Triggered by specific keywords in a message" },
                { label: "Welcome Message", desc: "Sent to new contacts who message for the first time" },
                { label: "Outside Office Hours", desc: "Auto-replies when salon is closed based on outlet timings" },
              ].map(t => (
                <span key={t.label} title={t.desc} className="text-[10px] font-semibold text-stone-600 bg-white border border-stone-200 px-2.5 py-1 rounded-lg cursor-help">
                  {t.label}
                </span>
              ))}
            </div>

            {/* Add rule form */}
            {isAddingRule && (
              <div className="p-5 bg-white border border-stone-200 rounded-2xl space-y-4 shadow-xs">
                <div className="space-y-2 text-left">
                  <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-widest">Trigger Type</label>
                  <select
                    value={newRuleTrigger}
                    onChange={e => setNewRuleTrigger(e.target.value as typeof newRuleTrigger)}
                    className="w-full bg-stone-50 border border-stone-200 focus:border-stone-850 rounded-xl px-4 py-3 text-xs text-stone-850 outline-none transition-all font-semibold cursor-pointer"
                  >
                    <option value="KEYWORD">Keyword Match</option>
                    <option value="WELCOME">Welcome Message (first contact)</option>
                    <option value="OFFICE_HOURS_OUTSIDE">Outside Office Hours</option>
                  </select>
                </div>

                {newRuleTrigger === "KEYWORD" && (
                  <div className="space-y-2 text-left">
                    <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-widest">Keywords (comma-separated)</label>
                    <input
                      type="text"
                      value={newRuleKeywords}
                      onChange={e => setNewRuleKeywords(e.target.value)}
                      placeholder="e.g. appointment, book, price"
                      className="w-full bg-stone-50 border border-stone-200 focus:border-stone-850 rounded-xl px-4 py-3 text-xs text-stone-850 outline-none transition-all"
                    />
                  </div>
                )}

                <div className="space-y-2 text-left">
                  <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-widest">Reply Message</label>
                  <textarea
                    value={newRuleReply}
                    onChange={e => setNewRuleReply(e.target.value)}
                    rows={3}
                    placeholder="e.g. Hi! Thanks for reaching out. We'll get back to you shortly."
                    className="w-full bg-stone-50 border border-stone-200 focus:border-stone-850 rounded-xl px-4 py-3 text-xs text-stone-850 outline-none transition-all resize-none font-minimal"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={saveAutoReplyRule}
                    disabled={isSavingRule}
                    className="flex-1 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-stone-850 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {isSavingRule ? <div className="size-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : null}
                    Save Rule
                  </button>
                  <button
                    onClick={() => { setIsAddingRule(false); setNewRuleKeywords(""); setNewRuleReply(""); }}
                    className="px-4 py-2.5 bg-stone-100 text-stone-700 rounded-xl text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-stone-200 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Rules list */}
            <div className="space-y-3">
              {autoReplyRules.length === 0 && !isAddingRule && (
                <div className="flex flex-col items-center justify-center py-10 text-stone-400 text-xs italic space-y-2">
                  <MessageSquare className="size-7 opacity-20" />
                  <span className="font-semibold">No auto-reply rules configured yet.</span>
                </div>
              )}
              {autoReplyRules.map((rule: any) => (
                <div key={rule.id} className="p-4 bg-white border border-stone-200 rounded-xl space-y-2 shadow-xs hover:border-stone-300 transition-all text-left">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${rule.triggerType === "KEYWORD" ? "bg-blue-50 text-blue-700 border-blue-200" :
                            rule.triggerType === "WELCOME" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                              "bg-amber-50 text-amber-700 border-amber-205"
                          }`}>
                          {rule.triggerType === "KEYWORD" ? "Keyword" :
                            rule.triggerType === "WELCOME" ? "Welcome" : "Outside Hours"}
                        </span>
                        {rule.keywords && (
                          <span className="text-[10px] font-mono text-stone-500 bg-stone-50 border border-stone-200 px-2 py-0.5 rounded">
                            {rule.keywords}
                          </span>
                        )}
                        <span className={`text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${rule.isActive ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"}`}>
                          {rule.isActive ? "Active" : "Disabled"}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed font-minimal italic">"{rule.replyText}"</p>
                    </div>
                    <button
                      onClick={() => deleteAutoReplyRule(rule.id)}
                      className="p-1 text-stone-405 hover:text-rose-500 transition-colors cursor-pointer border-none bg-transparent shrink-0"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CARD: Automated Birthday Offers */}
          <div className="p-8 bg-stone-50/50 border border-stone-200 rounded-3xl space-y-6 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-3.5 bg-white border border-stone-200 rounded-2xl text-stone-750 shadow-xs text-lg">
                🎂
              </div>
              <div className="text-left font-minimal">
                <h4 className="font-semibold text-base text-stone-900">Automated Birthday Wish & Offer</h4>
                <p className="text-xs text-stone-500">Configure automated greeting messages and special discount coupon codes dispatched on customer birthdays</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-widest">Birthday Offer Coupon Code</label>
                <input
                  type="text"
                  value={birthdayCouponCode}
                  onChange={e => setBirthdayCouponCode(e.target.value)}
                  placeholder="e.g. BDAY20"
                  className="w-full bg-white border border-stone-200 focus:border-stone-850 rounded-xl px-4 py-3 text-xs text-stone-850 outline-none transition-all font-mono"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-widest">Birthday Greeting WhatsApp Message Template</label>
                <textarea
                  value={birthdayWishTemplate}
                  onChange={e => setBirthdayWishTemplate(e.target.value)}
                  rows={4}
                  placeholder="e.g. Happy Birthday {{name}}! 🎉 Here is a special treat: Use code {{coupon}} to get 20% off your next visit!"
                  className="w-full bg-white border border-stone-200 focus:border-stone-850 rounded-xl px-4 py-3 text-xs text-stone-850 outline-none transition-all resize-none font-minimal leading-relaxed"
                />
                <p className="text-[10px] text-stone-400 mt-1">
                  Use placeholders: <code className="font-mono text-stone-605">{"{{name}}"}</code> for customer's name, <code className="font-mono text-stone-605">{"{{coupon}}"}</code> for the code above, and <code className="font-mono text-stone-605">{"{{brand}}"}</code> for the salon name.
                </p>
              </div>
            </div>

            <button
              onClick={saveBirthdaySettings}
              disabled={isSavingBirthdaySettings}
              className="w-full py-3 bg-stone-900 hover:bg-stone-850 text-white rounded-xl text-xs font-semibold uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-60"
            >
              {isSavingBirthdaySettings ? (
                <><div className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Saving...</>
              ) : "Save Birthday Offer Settings"}
            </button>
          </div>

          {/* Stealth Safeguards config console */}
          <div className="p-8 bg-stone-50/50 border border-stone-200 rounded-3xl space-y-6 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-3.5 bg-white border border-stone-200 rounded-2xl text-stone-750 shadow-xs">
                <Sliders className="size-5" />
              </div>
              <div className="text-left">
                <h4 className="font-semibold text-base text-stone-900">Stealth & Anti-Ban Safeguards</h4>
                <p className="text-xs text-stone-500 font-minimal">Configure safety mechanisms to emulate organic human dispatches</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Toggle 1: Humanized Typing */}
              <button
                type="button"
                onClick={() => {
                  const nextVal = !stealthHumanTyping;
                  setStealthHumanTyping(nextVal);
                  localStorage.setItem(`tenant_whatsapp_stealth_typing_${tenantSlug}`, String(nextVal));
                }}
                className={`p-5 rounded-2xl text-left transition-all cursor-pointer flex flex-col justify-between gap-5 border shadow-xs ${stealthHumanTyping
                    ? "bg-stone-900 border-stone-900 text-white"
                    : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                  }`}
              >
                <div className="space-y-1">
                  <span className={`font-semibold text-sm flex items-center gap-2 ${stealthHumanTyping ? 'text-white' : 'text-stone-900'}`}>
                    <span>✍️</span> Human typing simulation
                  </span>
                  <span className={`block text-[11px] leading-relaxed font-minimal ${stealthHumanTyping ? 'text-stone-350' : 'text-stone-500'}`}>
                    Simulate active typing (8ms/char) before dispatching to mimic real keyboard interaction.
                  </span>
                </div>
                <div className="flex justify-between items-center w-full mt-2 pt-2 border-t border-stone-200/20">
                  <span className={`text-[10px] uppercase font-semibold tracking-wider ${stealthHumanTyping ? 'text-stone-400' : 'text-stone-450'}`}>Status</span>
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md ${stealthHumanTyping ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'}`}>
                    {stealthHumanTyping ? 'Active' : 'Disabled'}
                  </span>
                </div>
              </button>

              {/* Toggle 2: Random Jitter */}
              <button
                type="button"
                onClick={() => {
                  const nextVal = !stealthRandomJitter;
                  setStealthRandomJitter(nextVal);
                  localStorage.setItem(`tenant_whatsapp_stealth_jitter_${tenantSlug}`, String(nextVal));
                }}
                className={`p-5 rounded-2xl text-left transition-all cursor-pointer flex flex-col justify-between gap-5 border shadow-xs ${stealthRandomJitter
                    ? "bg-stone-900 border-stone-900 text-white"
                    : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                  }`}
              >
                <div className="space-y-1">
                  <span className={`font-semibold text-sm flex items-center gap-2 ${stealthRandomJitter ? 'text-white' : 'text-stone-900'}`}>
                    <span>⏱️</span> Random Jitter Delays
                  </span>
                  <span className={`block text-[11px] leading-relaxed font-minimal ${stealthRandomJitter ? 'text-stone-350' : 'text-stone-505'}`}>
                    Throttles successive dispatches by adding 300-1800ms delays to evade spam filters.
                  </span>
                </div>
                <div className="flex justify-between items-center w-full mt-2 pt-2 border-t border-stone-200/20">
                  <span className={`text-[10px] uppercase font-semibold tracking-wider ${stealthRandomJitter ? 'text-stone-400' : 'text-stone-450'}`}>Status</span>
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md ${stealthRandomJitter ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'}`}>
                    {stealthRandomJitter ? 'Active' : 'Disabled'}
                  </span>
                </div>
              </button>

              {/* Toggle 3: Spintax Cryptographic Variation */}
              <button
                type="button"
                onClick={() => {
                  const nextVal = !stealthSpintaxSuffix;
                  setStealthSpintaxSuffix(nextVal);
                  localStorage.setItem(`tenant_whatsapp_stealth_spintax_${tenantSlug}`, String(nextVal));
                }}
                className={`p-5 rounded-2xl text-left transition-all cursor-pointer flex flex-col justify-between gap-5 border shadow-xs ${stealthSpintaxSuffix
                    ? "bg-stone-900 border-stone-900 text-white"
                    : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                  }`}
              >
                <div className="space-y-1">
                  <span className={`font-semibold text-sm flex items-center gap-2 ${stealthSpintaxSuffix ? 'text-white' : 'text-stone-900'}`}>
                    <span>🔑</span> Cryptographic variations
                  </span>
                  <span className={`block text-[11px] leading-relaxed font-minimal ${stealthSpintaxSuffix ? 'text-stone-350' : 'text-stone-505'}`}>
                    Appends random suffix signatures & zero-width spaces to vary message hash fingerprints.
                  </span>
                </div>
                <div className="flex justify-between items-center w-full mt-2 pt-2 border-t border-stone-200/20">
                  <span className={`text-[10px] uppercase font-semibold tracking-wider ${stealthSpintaxSuffix ? 'text-stone-400' : 'text-stone-450'}`}>Status</span>
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md ${stealthSpintaxSuffix ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'}`}>
                    {stealthSpintaxSuffix ? 'Active' : 'Disabled'}
                  </span>
                </div>
              </button>

              {/* Toggle 4: Daybreak Quiet Hours */}
              <button
                type="button"
                onClick={() => {
                  const nextVal = !stealthNaturalHours;
                  setStealthNaturalHours(nextVal);
                  localStorage.setItem(`tenant_whatsapp_stealth_natural_${tenantSlug}`, String(nextVal));
                }}
                className={`p-5 rounded-2xl text-left transition-all cursor-pointer flex flex-col justify-between gap-5 border shadow-xs ${stealthNaturalHours
                    ? "bg-stone-900 border-stone-900 text-white"
                    : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                  }`}
              >
                <div className="space-y-1">
                  <span className={`font-semibold text-sm flex items-center gap-2 ${stealthNaturalHours ? 'text-white' : 'text-stone-900'}`}>
                    <span>🌙</span> Quiet Hours Guard
                  </span>
                  <span className={`block text-[11px] leading-relaxed font-minimal ${stealthNaturalHours ? 'text-stone-300' : 'text-stone-500'}`}>
                    Hold reminders & winbacks during sleep hours (9 PM - 9 AM) to queue them for daybreak.
                  </span>
                </div>
                <div className="flex justify-between items-center w-full mt-2 pt-2 border-t border-stone-200/20">
                  <span className={`text-[10px] uppercase font-semibold tracking-wider ${stealthNaturalHours ? 'text-stone-400' : 'text-stone-450'}`}>Status</span>
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md ${stealthNaturalHours ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'}`}>
                    {stealthNaturalHours ? 'Active' : 'Disabled'}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* CARD 2: Template configuration registry */}
          <div className="p-8 bg-stone-50/50 border border-stone-200 rounded-3xl space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-left font-minimal">
              <div>
                <h4 className="font-semibold text-base text-stone-900">Dynamic Message Templates</h4>
                <p className="text-xs text-stone-500">Configure multiple templates per campaign for automated rotation.</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={handleResetTemplates}
                  className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border border-rose-200/50"
                >
                  Reset Defaults
                </button>
                <button
                  onClick={openAddOtpTemplateModal}
                  className="px-4 py-2 bg-stone-900 text-white hover:bg-stone-850 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="size-3.5" /> Add OTP
                </button>
                <button
                  onClick={openAddTemplateModal}
                  className="px-4 py-2 bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="size-3.5" /> Add Custom
                </button>
              </div>
            </div>

            {/* Quick variables helper badge pool */}
            <div className="p-5 bg-white border border-stone-200 rounded-2xl text-left space-y-3 shadow-xs">
              <span className="text-[9px] font-semibold text-stone-500 uppercase tracking-wider block">Available Dynamic Variable Placeholders</span>
              <div className="flex flex-wrap gap-2">
                {["name", "brand", "otp", "service", "stylist", "date", "time", "outlet", "coupon", "url"].map(v => (
                  <code key={v} className="px-2.5 py-1 bg-stone-100 border border-stone-200/60 rounded-lg text-[10px] font-semibold text-stone-700 select-all font-mono">
                    {"{{"}{v}{"}}"}
                  </code>
                ))}
              </div>
              <p className="text-[10px] text-stone-500 leading-relaxed font-minimal">
                Placeholders will be automatically filled with live context (e.g. customer name, booking stylist, coupon code) at the moment of dispatch.
              </p>
            </div>

            <div className="space-y-4">
              {["signup_otp", "booking_confirmation", "reminder_24h", "reminder_1h", "birthday_offer", "inactive_winback"].map(cat => {
                const catTemplates = whatsAppTemplates.filter(t => t.type === cat);
                const catNames = {
                  signup_otp: "OTP Registrations",
                  booking_confirmation: "Booking Confirmations",
                  reminder_24h: "24h Appointment Reminders",
                  reminder_1h: "1h Appointment Reminders",
                  birthday_offer: "Birthday Wishes & Offers",
                  inactive_winback: "Inactive Customer Winbacks"
                };
                return (
                  <div key={cat} className="rounded-2xl overflow-hidden bg-white border border-stone-200 text-left shadow-xs">
                    <div className="px-5 py-4 bg-stone-50 border-b border-stone-200 flex justify-between items-center text-left">
                      <div>
                        <span className="font-semibold text-xs text-stone-900 block">{catNames[cat as keyof typeof catNames]}</span>
                        <span className="text-[10px] text-stone-500 block mt-0.5 font-minimal">
                          {catTemplates.length} templates configured — {catTemplates.length > 1 ? "randomized selection active" : "single pattern"}
                        </span>
                      </div>
                      <span className="text-[9px] font-semibold text-stone-600 bg-stone-100 border border-stone-200 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                        {cat.replace("_", " ")}
                      </span>
                    </div>

                    <div className="p-4 space-y-3 bg-stone-50/20">
                      {catTemplates.map(tmpl => (
                        <div key={tmpl.id} className="p-4 bg-white border border-stone-200/80 rounded-xl space-y-2.5 shadow-xs text-left">
                          <div className="flex justify-between items-start">
                            <span className="font-semibold text-xs text-stone-850">{tmpl.name}</span>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => openEditTemplateModal(tmpl)}
                                className="p-1 text-stone-400 hover:text-stone-900 transition-colors cursor-pointer border-none bg-transparent"
                              >
                                <Edit2 className="size-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteTemplate(tmpl.id)}
                                className="p-1 text-stone-400 hover:text-stone-900 transition-colors cursor-pointer border-none bg-transparent"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-stone-500 leading-relaxed text-left whitespace-pre-wrap italic font-minimal">
                            {formatTemplatePreview(tmpl.text)}
                          </p>
                        </div>
                      ))}
                      {catTemplates.length === 0 && (
                        <p className="text-xs text-stone-450 italic py-2 text-center font-minimal">No templates added for this category.</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CARD 3: Simulated manual campaign dispatcher */}
          <div className="p-8 bg-stone-50/50 border border-stone-200 rounded-3xl space-y-6 shadow-xs font-minimal">
            <div className="text-left">
              <h4 className="font-semibold text-base text-stone-900">Manual Simulation Console</h4>
              <p className="text-xs text-stone-500">Test template variables rendering and dynamic selection.</p>
            </div>

            {simulationSuccess && (
              <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-250 rounded-xl text-xs font-semibold flex items-center gap-2 leading-relaxed shadow-xs">
                <CheckCircle className="size-4 shrink-0" />
                <span>{simulationSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSimulateCampaign} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 text-left">
                  <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-widest">Recipient Name</label>
                  <input
                    type="text"
                    value={simulatedName}
                    onChange={(e) => setSimulatedName(e.target.value)}
                    placeholder="e.g. Farhan"
                    className="w-full bg-white border border-stone-200 focus:border-stone-850 rounded-xl p-3.5 text-xs text-stone-850 outline-none transition-all font-medium"
                  />
                </div>
                <div className="space-y-2 text-left">
                  <label className="block text-[10px] font-semibold text-stone-550 uppercase tracking-widest">Recipient Mobile</label>
                  <input
                    type="text"
                    value={simulatedPhone}
                    onChange={(e) => setSimulatedPhone(e.target.value)}
                    placeholder="e.g. +91 99000 88000"
                    className="w-full bg-white border border-stone-200 focus:border-stone-850 rounded-xl p-3.5 text-xs text-stone-850 outline-none transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2 text-left">
                <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-widest">Campaign Flow Type</label>
                <select
                  value={simulatedCampaignType}
                  onChange={(e) => setSimulatedCampaignType(e.target.value as typeof simulatedCampaignType)}
                  className="w-full bg-white border border-stone-200 focus:border-stone-850 rounded-xl p-3.5 text-xs text-stone-850 outline-none transition-all cursor-pointer font-semibold"
                >
                  <option value="signup_otp">OTP Authentication Check</option>
                  <option value="booking_confirmation">Booking Confirmation Message</option>
                  <option value="reminder_24h">24-Hour Before Appointment Reminder</option>
                  <option value="reminder_1h">1-Hour Before Appointment Reminder</option>
                  <option value="birthday_offer">Birthday Wish & Dynamic Promo Offer</option>
                  <option value="inactive_winback">Inactive Customer Winback Campaigns</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={!whatsAppConnected}
                className={`w-full py-3.5 uppercase tracking-widest font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 border shadow-xs ${whatsAppConnected
                    ? 'bg-stone-900 border-stone-900 hover:bg-stone-850 text-white'
                    : 'bg-stone-100 border-stone-200 text-stone-400 cursor-not-allowed'
                  }`}
              >
                Send Simulated Notification
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: WhatsApp Sent Message Logs */}
        <div className="lg:col-span-5 space-y-8">
          <div className="p-8 bg-stone-50/50 border border-stone-200 rounded-3xl space-y-6 shadow-xs lg:sticky lg:top-8 max-h-[85vh] flex flex-col font-minimal text-left">
            <div className="text-left font-minimal">
              <h4 className="font-semibold text-base text-stone-900 flex items-center justify-between">
                <span>Live Dispatched Messages</span>
                {whatsAppLogs.some(l => l.status === "Typing...") && (
                  <span className="text-[9px] text-amber-800 bg-amber-50 border border-amber-250 px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1 font-semibold shadow-xs">
                    <span className="size-1.5 rounded-full bg-amber-500 animate-ping" />
                    Typing...
                  </span>
                )}
              </h4>
              <p className="text-xs text-stone-505 mt-0.5">Real-time status updates of communications flowing through your account.</p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 no-scrollbar min-h-[300px]">
              {whatsAppLogs.map(log => (
                <div key={log.id} className="p-5 bg-white border border-stone-200 rounded-2xl text-left space-y-3.5 shadow-xs hover:border-stone-305 hover:bg-stone-50/50 transition-all">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="font-semibold text-xs text-stone-800 block">{log.recipientName}</span>
                      <span className="text-[10px] text-stone-400 block font-mono mt-0.5">{log.phone}</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-semibold uppercase tracking-wider border shadow-xs ${log.status === "Read" ? "bg-emerald-50 text-emerald-800 border-emerald-250" :
                        log.status === "Delivered" ? "bg-blue-50 text-blue-805 border-blue-200" :
                          log.status === "Typing..." ? "bg-amber-50 text-amber-805 border-amber-200 animate-pulse" :
                            log.status.startsWith("Queued") ? "bg-stone-105 text-stone-600 border-stone-200" :
                              "bg-stone-50 border border-stone-200 text-stone-500"
                      }`}>
                      {log.status}
                    </span>
                  </div>

                  <p className="text-xs text-stone-605 leading-relaxed bg-stone-50/50 border border-stone-200/80 p-4 rounded-xl italic font-minimal shadow-xs">
                    "{log.messageText}"
                  </p>

                  <div className="flex justify-between items-center text-[9px] text-stone-500 font-semibold pt-1 bg-transparent border-t border-stone-100">
                    <span className="uppercase tracking-wider text-stone-450">{log.type.replace("_", " ")}</span>
                    <div className="flex items-center gap-1.5">
                      {log.stealthActive && (
                        <span className="text-[8px] bg-stone-900 text-white px-1.5 py-0.5 rounded tracking-wider uppercase font-semibold">
                          Stealth Active 🔒
                        </span>
                      )}
                      <span className="font-mono text-stone-455">{log.timestamp}</span>
                    </div>
                  </div>
                </div>
              ))}
              {whatsAppLogs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-stone-400 text-xs italic space-y-3">
                  <MessageSquare className="size-8 opacity-25 text-stone-700" />
                  <span className="font-semibold">No messages logged yet.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
