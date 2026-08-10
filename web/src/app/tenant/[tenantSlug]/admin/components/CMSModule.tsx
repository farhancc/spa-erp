import React from "react";
import { Check, Upload, Plus, Edit2, Trash2, ArrowUp, ArrowDown, Save, Sparkles, Code2, Eye, AlertTriangle, Info, Image, Copy, X, Search, Grid } from "lucide-react";

interface CMSModuleProps {
  businessName: string;
  setBusinessName: (val: string) => void;
  logoUrl: string;
  setLogoUrl: (val: string) => void;
  tagline: string;
  setTagline: (val: string) => void;
  subtitle: string;
  setSubtitle: (val: string) => void;
  activeTemplate: "LUXURY" | "MINIMAL" | "SPA" | "BARBER" | "WELLNESS";
  setActiveTemplate: (val: "LUXURY" | "MINIMAL" | "SPA" | "BARBER" | "WELLNESS") => void;
  accentColor: "gold" | "rose" | "emerald" | "amber";
  setAccentColor: (val: "gold" | "rose" | "emerald" | "amber") => void;
  customTextColor: string;
  setCustomTextColor: (val: string) => void;
  customHeadingColor: string;
  setCustomHeadingColor: (val: string) => void;
  customButtonColor: string;
  setCustomButtonColor: (val: string) => void;
  campaignCouponCode: string;
  setCampaignCouponCode: (val: string) => void;
  campaignDiscountPercent: number;
  setCampaignDiscountPercent: (val: number) => void;
  selectedOutletId: string;
  cmsOutlets: any[];
  setCmsOutlets: (val: any[]) => void;
  newOutletName: string;
  setNewOutletName: (val: string) => void;
  newOutletAddress: string;
  setNewOutletAddress: (val: string) => void;
  newOutletPhone: string;
  setNewOutletPhone: (val: string) => void;
  newOutletTimings: string;
  setNewOutletTimings: (val: string) => void;
  activeCmsOutletId: string;
  handleSwitchOutlet: (val: string) => void;
  sections: any[];
  setSections: (val: any[]) => void;
  selectedSectionId: string | null;
  setSelectedSectionId: (val: string | null) => void;
  services: any[];
  activePreviewOutlet: any;
  previewDevice: "desktop" | "mobile";
  setPreviewDevice: (val: "desktop" | "mobile") => void;
  handleSaveCMSConfig: () => void;
  cmsSaveLoading: boolean;
  cmsSaveSuccess: boolean;
  cmsSubTab: "IDENTITY" | "STYLING" | "CAMPAIGNS" | "BUILDER" | "OUTLETS" | "CUSTOM CODE" | "MEDIA LIBRARY";
  setCmsSubTab: (tab: "IDENTITY" | "STYLING" | "CAMPAIGNS" | "BUILDER" | "OUTLETS" | "CUSTOM CODE" | "MEDIA LIBRARY") => void;
  tenantSlug: string;
  useCustomCode: boolean;
  setUseCustomCode: (val: boolean) => void;
  customHtml: string;
  setCustomHtml: (val: string) => void;
  customCss: string;
  setCustomCss: (val: string) => void;
  customJs: string;
  setCustomJs: (val: string) => void;
}

export default function CMSModule({
  businessName,
  setBusinessName,
  logoUrl,
  setLogoUrl,
  tagline,
  setTagline,
  subtitle,
  setSubtitle,
  activeTemplate,
  setActiveTemplate,
  accentColor,
  setAccentColor,
  customTextColor,
  setCustomTextColor,
  customHeadingColor,
  setCustomHeadingColor,
  customButtonColor,
  setCustomButtonColor,
  campaignCouponCode,
  setCampaignCouponCode,
  campaignDiscountPercent,
  setCampaignDiscountPercent,
  selectedOutletId,
  cmsOutlets,
  setCmsOutlets,
  newOutletName,
  setNewOutletName,
  newOutletAddress,
  setNewOutletAddress,
  newOutletPhone,
  setNewOutletPhone,
  newOutletTimings,
  setNewOutletTimings,
  activeCmsOutletId,
  handleSwitchOutlet,
  sections,
  setSections,
  selectedSectionId,
  setSelectedSectionId,
  services,
  activePreviewOutlet,
  previewDevice,
  setPreviewDevice,
  handleSaveCMSConfig,
  cmsSaveLoading,
  cmsSaveSuccess,
  cmsSubTab,
  setCmsSubTab,
  tenantSlug,
  useCustomCode,
  setUseCustomCode,
  customHtml,
  setCustomHtml,
  customCss,
  setCustomCss,
  customJs,
  setCustomJs,
}: CMSModuleProps) {
  const [customCodePreviewOpen, setCustomCodePreviewOpen] = React.useState(false);
  const [customCodeTab, setCustomCodeTab] = React.useState<"html" | "css" | "js">("html");

  // Build the srcdoc string for sandboxed preview (data injected as empty placeholder)
  const buildPreviewDoc = () => {
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${customCss || ""}</style><script>window.careva={tenant:{name:'Preview'},services:[{id:'s1',name:'Signature Cut',price:850,duration:45,category:'Grooming'},{id:'s2',name:'Hot Oil Spa',price:1800,duration:60,category:'Therapy'}],stylists:[{id:'t1',name:'Alex Carter',specialty:'Hair Sculpting',rating:4.9}],outlets:[{id:'o1',name:'Main Branch',address:'Calicut'}]};<\/script></head><body>${customHtml || ""}<script>${customJs || ""}<\/script></body></html>`;
  };
  const [editingOutletId, setEditingOutletId] = React.useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = React.useState(false);
  const [uploadingBannerIndex, setUploadingBannerIndex] = React.useState<number | null>(null);

  // ─── MEDIA LIBRARY STATE ───────────────────────────────────
  const [mediaAssets, setMediaAssets] = React.useState<any[]>([]);
  const [mediaLoading, setMediaLoading] = React.useState(false);
  const [mediaUploading, setMediaUploading] = React.useState(false);
  const [mediaUploadProgress, setMediaUploadProgress] = React.useState(0);
  const [mediaSearch, setMediaSearch] = React.useState("");
  const [mediaCopiedId, setMediaCopiedId] = React.useState<string | null>(null);
  const [mediaDeletingId, setMediaDeletingId] = React.useState<string | null>(null);
  const [mediaDragOver, setMediaDragOver] = React.useState(false);
  const mediaFileInputRef = React.useRef<HTMLInputElement>(null);

  // Load media when tab is opened
  React.useEffect(() => {
    if (cmsSubTab === "MEDIA LIBRARY") {
      fetchMediaLibrary();
    }
  }, [cmsSubTab]);

  const fetchMediaLibrary = async () => {
    setMediaLoading(true);
    try {
      const res = await fetch("/api/media", {
        headers: { "x-tenant-slug": tenantSlug },
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setMediaAssets(Array.isArray(data) ? data : (data?.data || []));
      }
    } catch (e) {
      console.error("Failed to load media library", e);
    } finally {
      setMediaLoading(false);
    }
  };

  /** Convert any image File to WebP using Canvas API (client-side) */
  const convertToWebP = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas not supported")); return; }
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(objectUrl);
        // Export as WebP (quality 0.88)
        resolve(canvas.toDataURL("image/webp", 0.88));
      };
      img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Failed to load image")); };
      img.src = objectUrl;
    });
  };

  const uploadMediaFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (fileArray.length === 0) { alert("Please select image files only."); return; }
    if (fileArray.some(f => f.size > 10 * 1024 * 1024)) {
      alert("Each file must be under 10MB.");
      return;
    }
    setMediaUploading(true);
    setMediaUploadProgress(0);
    let completed = 0;
    const results: any[] = [];
    for (const file of fileArray) {
      try {
        // Convert to WebP client-side first
        const webpBase64 = await convertToWebP(file);
        const res = await fetch("/api/media", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-tenant-slug": tenantSlug },
          body: JSON.stringify({ file: webpBase64, folder: "media-library" }),
        });
        if (res.ok) {
          const data = await res.json();
          results.push(data);
        }
      } catch (err) {
        console.error("Upload failed for", file.name, err);
      }
      completed++;
      setMediaUploadProgress(Math.round((completed / fileArray.length) * 100));
    }
    setMediaUploading(false);
    setMediaUploadProgress(0);
    // Refresh gallery
    await fetchMediaLibrary();
  };

  const handleDeleteMedia = async (assetId: string) => {
    if (!confirm("Delete this image from Cloudinary and your library? This cannot be undone.")) return;
    setMediaDeletingId(assetId);
    try {
      const res = await fetch("/api/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "x-tenant-slug": tenantSlug },
        body: JSON.stringify({ id: assetId }),
      });
      if (res.ok) {
        setMediaAssets(prev => prev.filter(a => a.id !== assetId));
      } else {
        const err = await res.json();
        alert(`Delete failed: ${err.error || "Unknown error"}`);
      }
    } catch (e) {
      alert("Failed to connect to server.");
    } finally {
      setMediaDeletingId(null);
    }
  };

  const handleCopyUrl = (asset: any) => {
    navigator.clipboard.writeText(asset.url).then(() => {
      setMediaCopiedId(asset.id);
      setTimeout(() => setMediaCopiedId(null), 2000);
    });
  };

  const filteredMedia = mediaAssets.filter(a =>
    !mediaSearch || a.url?.toLowerCase().includes(mediaSearch.toLowerCase()) ||
    a.folder?.toLowerCase().includes(mediaSearch.toLowerCase())
  );
  return (
    <div className="space-y-6 text-left animate-fadeIn">
      <div>
        <h3 className="font-normal font-luxury text-3xl text-stone-900 tracking-normal">Storefront CMS & Theme Desk</h3>
        <p className="text-sm text-stone-500 mt-1">Configure public layout styling, active branding colors, identity descriptors, and outlets</p>
      </div>

      {cmsSaveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-3.5 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <Check className="size-4 shrink-0" />
          <span>CMS Settings published successfully! Customers will see the new design immediately.</span>
        </div>
      )}

      {/* Internal Sub-navigation Tabs */}
      <div className="flex gap-1.5 border-b border-stone-200 pb-2 overflow-x-auto select-none scrollbar-thin">
        {(["IDENTITY", "STYLING", "CAMPAIGNS", "BUILDER", "OUTLETS", "CUSTOM CODE", "MEDIA LIBRARY"] as const).map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setCmsSubTab(tab)}
            className={`px-3.5 py-1.5 rounded-lg text-[10px] font-extrabold tracking-wider uppercase transition-all cursor-pointer shrink-0 ${
              cmsSubTab === tab 
                ? tab === "CUSTOM CODE" ? 'bg-violet-900 text-white border border-violet-500/30' : tab === "MEDIA LIBRARY" ? 'bg-blue-900 text-white border border-blue-500/30' : 'bg-stone-900 text-white border border-rose-500/30'
                : tab === "CUSTOM CODE" ? 'bg-violet-50 border border-violet-200 text-violet-600 hover:bg-violet-100' : tab === "MEDIA LIBRARY" ? 'bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100' : 'bg-white border border-stone-200/80 shadow-xs text-stone-400 hover:text-stone-800'
            }`}
          >
            {tab === "CUSTOM CODE" && <Code2 className="size-2.5 inline mr-1" />}
            {tab === "MEDIA LIBRARY" && <Image className="size-2.5 inline mr-1" />}
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-5">
        {/* SUBTAB: IDENTITY */}
        {cmsSubTab === "IDENTITY" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Storefront Business Name</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-white border border-stone-200/80 shadow-xs border border-stone-200 focus:border-stone-850 rounded-xl py-3 px-4 text-sm font-medium text-stone-900 outline-none transition-all placeholder:text-stone-300"
                placeholder="Enter brand name"
              />
            </div>

            {/* Brand Logo Upload option */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Storefront Brand Logo</label>
              {logoUrl ? (
                <div className="flex items-center gap-3 p-3 bg-white border border-stone-205 rounded-xl">
                  <img src={logoUrl} alt="Store Logo" className="h-10 w-auto object-contain max-w-[150px] bg-stone-50/50 border border-stone-200 p-1.5 rounded" />
                  <button
                    type="button"
                    onClick={() => setLogoUrl("")}
                    className="text-xs text-stone-850 hover:text-rose-455 font-bold hover:underline cursor-pointer"
                  >
                    Remove Logo
                  </button>
                </div>
              ) : isUploadingLogo ? (
                <div className="mt-1 flex items-center justify-center w-full border-2 border-dashed border-stone-200 rounded-xl p-6 hover:bg-white transition-colors">
                  <div className="flex flex-col items-center gap-2">
                    <Sparkles className="size-5 text-amber-500 animate-spin" />
                    <span className="text-xs font-bold text-stone-500 animate-pulse">Uploading to Cloudinary...</span>
                  </div>
                </div>
              ) : (
                <div className="mt-1 flex items-center justify-center w-full border-2 border-dashed border-stone-200 rounded-xl p-4 hover:bg-white transition-colors">
                  <label className="cursor-pointer flex flex-col items-center gap-1">
                    <Upload className="size-5 text-stone-400" />
                    <span className="text-xs font-bold text-stone-500">Upload Store Logo</span>
                    <span className="text-[10px] text-stone-300 font-sans">PNG, JPG, SVG up to 500KB</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 800 * 1024) {
                            alert("Please upload a logo smaller than 800KB to optimize performance.");
                            return;
                          }
                          setIsUploadingLogo(true);
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
                                    folder: "logos"
                                  })
                                });
                                if (response.ok) {
                                  const data = await response.json();
                                  setLogoUrl(data.url);
                                } else {
                                  const err = await response.json();
                                  alert(`Logo upload failed: ${err.error || "Unknown error"}`);
                                }
                              } catch (uploadErr) {
                                console.error("Upload error", uploadErr);
                                alert("Failed to upload logo to server.");
                              } finally {
                                setIsUploadingLogo(false);
                              }
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Hero Welcome Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full bg-white border border-stone-200/80 shadow-xs border border-stone-200 focus:border-stone-850 rounded-xl py-3 px-4 text-sm font-medium text-stone-900 outline-none transition-all placeholder:text-stone-300"
                placeholder="e.g. Premium Grooming & Beauty Rituals"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Hero Subtitle / Description</label>
              <textarea
                rows={3}
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full bg-white border border-stone-200/80 shadow-xs border border-stone-200 focus:border-stone-850 rounded-xl py-3 px-4 text-sm font-medium text-stone-900 outline-none transition-all placeholder:text-stone-300 resize-none"
                placeholder="Describe services, location highlight, or brand statement..."
              />
            </div>
          </div>
        )}

        {/* SUBTAB: STYLING */}
        {cmsSubTab === "STYLING" && (
          <div className="space-y-4">
            {/* Field: Styling Template */}
            <div className="space-y-3">
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Active Layout Template</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {([
                  { id: "LUXURY", name: "Luxury Sleek", desc: "Dark gold/amber theme, high-contrast, premium serif/sans hybrid alignment.", tags: ["Premium", "Vibrant"] },
                  { id: "MINIMAL", name: "Stark Minimal", desc: "Pure high-fashion editorial look, stark white/gray/black, monospaced lettering.", tags: ["Clean", "Modern"] },
                  { id: "SPA", name: "Zen Spa Rituals", desc: "Soft organic sage green & pure teal backdrops, fluid custom layout columns.", tags: ["Relaxing", "Soft"] },
                  { id: "BARBER", name: "Classic Barber & Grooming", desc: "Heavy industrial steel borders, sharp high-contrast neon accents, uppercase grids.", tags: ["Bold", "Masculine"] },
                  { id: "WELLNESS", name: "Wellness Retreat", desc: "Earthy, calming tones with a header layout, category filters, and daily deals.", tags: ["Serene", "Organic"] }
                ] as const).map(tpl => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setActiveTemplate(tpl.id)}
                    className={`p-4 rounded-xl border text-left transition-all hover:scale-[1.01] active:scale-[0.99] flex flex-col justify-between min-h-[9rem] sm:h-36 cursor-pointer ${
                      activeTemplate === tpl.id
                        ? 'bg-stone-100 border border-stone-200 text-stone-600 border-rose-500 font-semibold shadow-lg shadow-rose-500/5'
                        : 'bg-white border border-stone-200/80 shadow-xs border-stone-200 text-stone-500'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex justify-between items-center gap-2 mb-1">
                        <span className="font-extrabold text-sm">{tpl.name}</span>
                        {activeTemplate === tpl.id && <span className="bg-rose-600 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">Active</span>}
                      </div>
                      <p className="text-[10px] text-stone-400 leading-normal">{tpl.desc}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-stone-200/30">
                      {tpl.tags.map(tg => (
                        <span key={tg} className="text-[8px] bg-stone-50/50 border border-stone-200 px-1.5 py-0.5 rounded text-stone-500 font-medium">
                          {tg}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Field: Branding Accent Color */}
            {activeTemplate !== "MINIMAL" && (
              <div className="space-y-3">
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Brand Accent Accentuation</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {([
                    { id: "gold", name: "Royal Amber", color: "bg-amber-400" },
                    { id: "rose", name: "Velvet Rose", color: "bg-rose-500" },
                    { id: "emerald", name: "Pure Jade", color: "bg-emerald-500" },
                    { id: "amber", name: "Warm Mandarin", color: "bg-orange-500" }
                  ] as const).map(color => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setAccentColor(color.id)}
                      className={`p-2.5 sm:p-3.5 rounded-xl border flex flex-col sm:flex-row items-center text-center sm:text-left gap-1.5 sm:gap-3 transition-all cursor-pointer ${
                        accentColor === color.id
                          ? 'border-slate-100 bg-white font-bold text-stone-850'
                          : 'border-stone-200 bg-white text-stone-400'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full ${color.color} shrink-0`} />
                      <span className="text-[10px] sm:text-[11px] font-bold truncate w-full">{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CUSTOM COLOUR OVERRIDES */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Custom Colour Overrides</label>
                {(customTextColor || customHeadingColor || customButtonColor) && (
                  <button
                    type="button"
                    onClick={() => { setCustomTextColor(""); setCustomHeadingColor(""); setCustomButtonColor(""); }}
                    className="text-[9px] font-bold text-stone-700 hover:text-rose-300 uppercase tracking-widest cursor-pointer transition-colors"
                  >
                    Reset All
                  </button>
                )}
              </div>
              <p className="text-[10px] text-stone-400 leading-relaxed">
                Optionally override the template's default colours. Leave blank to use template defaults.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Text Colour */}
                <div className="space-y-2">
                  <label className="block text-[9px] font-bold text-stone-400 uppercase tracking-widest">Body Text</label>
                  <div className="flex items-center gap-2.5 p-3 bg-white border border-stone-205 rounded-xl">
                    <div className="relative shrink-0">
                      <input
                        type="color"
                        value={customTextColor || "#94a3b8"}
                        onChange={e => setCustomTextColor(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0 opacity-0 absolute inset-0"
                      />
                      <div
                        className="w-8 h-8 rounded-lg border border-stone-200 pointer-events-none"
                        style={{ backgroundColor: customTextColor || "#94a3b8" }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={customTextColor}
                        onChange={e => setCustomTextColor(e.target.value)}
                        placeholder="#94a3b8"
                        maxLength={7}
                        className="w-full bg-transparent text-xs font-mono text-stone-850 outline-none placeholder:text-stone-300"
                      />
                      {customTextColor && <span className="text-[8px] text-stone-400">Custom</span>}
                    </div>
                  </div>
                </div>

                {/* Heading Colour */}
                <div className="space-y-2">
                  <label className="block text-[9px] font-bold text-stone-400 uppercase tracking-widest">Headings</label>
                  <div className="flex items-center gap-2.5 p-3 bg-white border border-stone-205 rounded-xl">
                    <div className="relative shrink-0">
                      <input
                        type="color"
                        value={customHeadingColor || "#f1f5f9"}
                        onChange={e => setCustomHeadingColor(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0 opacity-0 absolute inset-0"
                      />
                      <div
                        className="w-8 h-8 rounded-lg border border-stone-200 pointer-events-none"
                        style={{ backgroundColor: customHeadingColor || "#f1f5f9" }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={customHeadingColor}
                        onChange={e => setCustomHeadingColor(e.target.value)}
                        placeholder="#f1f5f9"
                        maxLength={7}
                        className="w-full bg-transparent text-xs font-mono text-stone-855 outline-none placeholder:text-stone-300"
                      />
                      {customHeadingColor && <span className="text-[8px] text-stone-400">Custom</span>}
                    </div>
                  </div>
                </div>

                {/* Button Colour */}
                <div className="space-y-2">
                  <label className="block text-[9px] font-bold text-stone-400 uppercase tracking-widest">Buttons & CTA</label>
                  <div className="flex items-center gap-2.5 p-3 bg-white border border-stone-205 rounded-xl">
                    <div className="relative shrink-0">
                      <input
                        type="color"
                        value={customButtonColor || "#f43f5e"}
                        onChange={e => setCustomButtonColor(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0 opacity-0 absolute inset-0"
                      />
                      <div
                        className="w-8 h-8 rounded-lg border border-stone-200 pointer-events-none"
                        style={{ backgroundColor: customButtonColor || "#f43f5e" }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={customButtonColor}
                        onChange={e => setCustomButtonColor(e.target.value)}
                        placeholder="#f43f5e"
                        maxLength={7}
                        className="w-full bg-transparent text-xs font-mono text-stone-855 outline-none placeholder:text-stone-300"
                      />
                      {customButtonColor && <span className="text-[8px] text-stone-400">Custom</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Preview Mockup Box */}
            <div className="p-5 bg-white border border-stone-205 rounded-2xl space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Live Preview</span>
                <span className="text-[9px] text-stone-300 font-mono">Reflects your custom colours</span>
              </div>

              <div className={`border border-stone-200/10 rounded-xl p-4 overflow-hidden pointer-events-none transition-all ${
                activeTemplate === 'LUXURY' ? 'bg-white border border-stone-200/80 shadow-xs' :
                activeTemplate === 'MINIMAL' ? 'bg-neutral-50' :
                activeTemplate === 'SPA' ? 'bg-[#f4f7f6]' :
                activeTemplate === 'WELLNESS' ? 'bg-[#faf8f5]' :
                'bg-zinc-950'
              }`}>
                <div className="flex justify-between items-center pb-2 border-b border-stone-200/10 mb-3">
                  <span
                    className="font-extrabold text-xs tracking-tight uppercase"
                    style={customHeadingColor ? { color: customHeadingColor } : {}}
                  >
                    {businessName}
                  </span>
                  <div className="flex gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4
                    className="font-extrabold text-sm tracking-tight leading-tight"
                    style={customHeadingColor ? { color: customHeadingColor } : {}}
                  >
                    {tagline || "Premium Grooming & Beauty Rituals"}
                  </h4>
                  <p
                    className="text-[10px] opacity-70 leading-relaxed truncate"
                    style={customTextColor ? { color: customTextColor } : {}}
                  >
                    {subtitle || "Experience bespoke services handcrafted for you."}
                  </p>
                  <div className="pt-2">
                    <span
                      className="inline-block px-3 py-1 rounded text-[9px] font-bold text-white"
                      style={customButtonColor ? { backgroundColor: customButtonColor } : {
                        backgroundColor: activeTemplate === 'LUXURY' ? '#f59e0b' :
                          activeTemplate === 'MINIMAL' ? '#000' :
                          activeTemplate === 'SPA' ? '#0f766e' :
                          activeTemplate === 'WELLNESS' ? '#8c6239' : '#06b6d4'
                      }}
                    >
                      Book Service Now
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB: CAMPAIGNS */}
        {cmsSubTab === "CAMPAIGNS" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Active Coupon Code</label>
              <input
                type="text"
                required
                value={campaignCouponCode}
                onChange={(e) => setCampaignCouponCode(e.target.value.toUpperCase())}
                className="w-full bg-white border border-stone-200/80 shadow-xs border border-stone-200 focus:border-stone-850 rounded-xl py-3 px-4 text-sm font-medium text-stone-900 outline-none transition-all placeholder:text-stone-300"
                placeholder="e.g. LUXFIRST"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Campaign Booking Discount Percentage (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                required
                value={campaignDiscountPercent}
                onChange={(e) => setCampaignDiscountPercent(Number(e.target.value))}
                className="w-full bg-white border border-stone-200/80 shadow-xs border border-stone-200 focus:border-stone-850 rounded-xl py-3 px-4 text-sm font-medium text-stone-900 outline-none transition-all placeholder:text-stone-300"
                placeholder="e.g. 15"
              />
            </div>
          </div>
        )}

        {/* SUBTAB: OUTLETS */}
        {cmsSubTab === "OUTLETS" && (
          <div className="space-y-6">
            {/* Outlets List */}
            <div className="space-y-2">
              <span className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Active Outlet Locations</span>
              <div className="grid grid-cols-1 gap-2.5">
                {cmsOutlets.map((outlet, index) => (
                  <div key={outlet.id || index} className="p-3.5 bg-white border border-stone-205 rounded-xl flex items-center justify-between gap-4 text-xs">
                    <div>
                      <span className="font-extrabold text-sm text-stone-850 block">{outlet.name}</span>
                      <span className="text-[10px] text-stone-400 font-semibold block mt-1">{outlet.address}</span>
                      <span className="text-[10px] text-stone-400 font-semibold block mt-0.5">Phone: {outlet.phone} | Hours: {outlet.timings}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingOutletId(outlet.id);
                          setNewOutletName(outlet.name || "");
                          setNewOutletAddress(outlet.address || "");
                          setNewOutletPhone(outlet.phone || "");
                          setNewOutletTimings(outlet.timings || "09:00 AM - 09:00 PM (Mon-Sun)");
                        }}
                        className="p-2 bg-stone-105 border border-stone-200 text-stone-600 hover:bg-stone-200 rounded-lg transition-all cursor-pointer"
                        title="Edit Outlet"
                      >
                        <Edit2 className="size-4 text-stone-500" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCmsOutlets(cmsOutlets.filter(o => o.id !== outlet.id));
                          if (editingOutletId === outlet.id) {
                            setEditingOutletId(null);
                            setNewOutletName("");
                            setNewOutletAddress("");
                            setNewOutletPhone("");
                            setNewOutletTimings("09:00 AM - 09:00 PM (Mon-Sun)");
                          }
                        }}
                        className="p-2 bg-stone-100 border border-stone-200 text-stone-600 hover:bg-rose-500/20 rounded-lg transition-all cursor-pointer"
                        title="Delete Outlet"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {cmsOutlets.length === 0 && (
                  <p className="text-xs text-stone-300 italic py-6 text-center">No outlets configured. Add a branch location below!</p>
                )}
              </div>
            </div>

            {/* Add/Edit Outlet Form */}
            <div className="p-4 bg-white border border-stone-205 rounded-xl space-y-3 text-xs">
              <span className="block text-[10px] font-extrabold text-stone-700 uppercase tracking-wider">
                {editingOutletId ? "Edit Branch Location" : "Add New Branch Location"}
              </span>
              <div className="grid grid-cols-1 gap-2.5">
                <input
                  type="text"
                  value={newOutletName}
                  onChange={(e) => setNewOutletName(e.target.value)}
                  className="bg-white border border-stone-200 rounded-lg py-2 px-3 text-stone-900 outline-none w-full"
                  placeholder="Outlet Branch Name (e.g. Waterfront Branch)"
                />
                <input
                  type="text"
                  value={newOutletAddress}
                  onChange={(e) => setNewOutletAddress(e.target.value)}
                  className="bg-white border border-stone-200 rounded-lg py-2 px-3 text-stone-900 outline-none w-full"
                  placeholder="Complete Address"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    value={newOutletPhone}
                    onChange={(e) => setNewOutletPhone(e.target.value)}
                    className="bg-white border border-stone-200 rounded-lg py-2 px-3 text-stone-900 outline-none"
                    placeholder="Contact Phone Number"
                  />
                  <input
                    type="text"
                    value={newOutletTimings}
                    onChange={(e) => setNewOutletTimings(e.target.value)}
                    className="bg-white border border-stone-200 rounded-lg py-2 px-3 text-stone-900 outline-none"
                    placeholder="Hours (e.g. 09:00 AM - 09:00 PM)"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                {editingOutletId ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        if (!newOutletName.trim() || !newOutletAddress.trim()) return alert("Branch name and address are required!");
                        setCmsOutlets(cmsOutlets.map(o => {
                          if (o.id === editingOutletId) {
                            return {
                              ...o,
                              name: newOutletName,
                              address: newOutletAddress,
                              phone: newOutletPhone || "+91 99000 88000",
                              timings: newOutletTimings,
                              slug: newOutletName.toLowerCase().replace(/[^a-z0-9]/g, "-")
                            };
                          }
                          return o;
                        }));
                        setEditingOutletId(null);
                        setNewOutletName("");
                        setNewOutletAddress("");
                        setNewOutletPhone("");
                        setNewOutletTimings("09:00 AM - 09:00 PM (Mon-Sun)");
                      }}
                      className="flex-1 bg-stone-900 text-white text-[10px] font-extrabold uppercase py-2.5 rounded-lg hover:bg-stone-800 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Check className="size-3.5 text-emerald-400" /> Update Branch Outlet
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingOutletId(null);
                        setNewOutletName("");
                        setNewOutletAddress("");
                        setNewOutletPhone("");
                        setNewOutletTimings("09:00 AM - 09:00 PM (Mon-Sun)");
                      }}
                      className="px-4 bg-stone-100 border border-stone-200 text-[10px] font-extrabold uppercase py-2.5 rounded-lg text-stone-600 hover:bg-stone-200 transition-all cursor-pointer flex items-center justify-center"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (!newOutletName.trim() || !newOutletAddress.trim()) return alert("Branch name and address are required!");
                      const newBranch = {
                        id: `out_${Date.now()}`,
                        name: newOutletName,
                        address: newOutletAddress,
                        phone: newOutletPhone || "+91 99000 88000",
                        timings: newOutletTimings,
                        slug: newOutletName.toLowerCase().replace(/[^a-z0-9]/g, "-")
                      };
                      setCmsOutlets([...cmsOutlets, newBranch]);
                      setNewOutletName("");
                      setNewOutletAddress("");
                      setNewOutletPhone("");
                    }}
                    className="w-full bg-stone-50 border border-stone-200 text-[10px] font-extrabold uppercase py-2.5 rounded-lg text-stone-850 hover:bg-slate-850 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus className="size-3.5 text-rose-455" /> Add Branch Outlet
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB: BUILDER */}
        {cmsSubTab === "BUILDER" && (
          <div className="space-y-6">
            <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl space-y-2 text-left">
              <h4 className="text-xs font-black text-stone-850 uppercase tracking-widest flex items-center gap-1.5">
                <span>✨</span> Advanced Storefront CMS Page Builder
              </h4>
              <p className="text-[11px] text-stone-400 leading-relaxed font-sans normal-case">
                Add, delete, reorder, and completely customize frontpage sections below. These content and design updates will immediately reflect in the simulated preview frame on the right and push live on publish.
              </p>
            </div>

            {/* Content Scope Selector */}
            <div className="bg-white border border-stone-205 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left font-sans animate-fadeIn">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-stone-855 uppercase tracking-widest block">Branch Content Scope Selector</span>
                <h4 className="font-extrabold text-xs text-stone-850">
                  {activeCmsOutletId === "brand_global" ? "🌎 Editing Brand-Level Global Page Layout" : `📍 Localizing Branch Outlet Page: ${cmsOutlets.find(o => o.id === activeCmsOutletId)?.name}`}
                </h4>
                <p className="text-[9px] text-stone-400 font-sans normal-case leading-relaxed">
                  {activeCmsOutletId === "brand_global" 
                    ? "Global colors, general details, and sections. Individual branches inherit these unless overridden."
                    : "Configure specific hero tags, promo coupons, and custom galleries for this local outlet."}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-bold text-stone-505 uppercase tracking-wider">Scope:</span>
                <select
                  value={activeCmsOutletId}
                  onChange={(e) => handleSwitchOutlet(e.target.value)}
                  className="bg-stone-50 border border-stone-200 text-xs font-bold text-stone-850 py-1.5 px-3 rounded-lg outline-none cursor-pointer focus:border-stone-850"
                >
                  <option value="brand_global">🌎 Brand-Level Default (Shared)</option>
                  {cmsOutlets.map(o => (
                    <option key={o.id} value={o.id}>📍 {o.name.replace("LuxCuts ", "")}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Sections List & Editor */}
              <div className="lg:col-span-5 space-y-5 text-left">
                <div className="space-y-2">
                  <span className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Active Storefront Sections</span>
                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin">
                    {sections.map((sec, idx) => {
                      const isSelected = selectedSectionId === sec.id;
                      return (
                        <div
                          key={sec.id}
                          onClick={() => setSelectedSectionId(sec.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-xs ${
                            isSelected
                              ? "bg-stone-100 border border-stone-200 text-stone-600 border-rose-500 font-semibold shadow-md shadow-rose-500/5"
                              : "bg-stone-50/30 border-stone-200 text-stone-500 hover:border-stone-300"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm shrink-0">{sec.emoji || (sec.category === "services" ? "🛠️" : sec.category === "offers" ? "🎁" : sec.category === "features" ? "⚡" : "📝")}</span>
                            <div className="min-w-0">
                              <span className="font-extrabold text-stone-800 block text-[11px] truncate">{sec.title || `Untitled ${sec.category}`}</span>
                              <span className="text-[9px] text-stone-400 font-semibold block uppercase tracking-wider mt-0.5 truncate">{sec.category} ({sec.type || "default"})</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => {
                                const newSecs = [...sections];
                                const temp = newSecs[idx];
                                newSecs[idx] = newSecs[idx - 1];
                                newSecs[idx - 1] = temp;
                                setSections(newSecs);
                              }}
                              className="p-1 hover:bg-stone-50 border border-stone-200 rounded text-stone-400 hover:text-stone-700 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                              title="Move Up"
                            >
                              <ArrowUp className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === sections.length - 1}
                              onClick={() => {
                                const newSecs = [...sections];
                                const temp = newSecs[idx];
                                newSecs[idx] = newSecs[idx + 1];
                                newSecs[idx + 1] = temp;
                                setSections(newSecs);
                              }}
                              className="p-1 hover:bg-stone-50 border border-stone-200 rounded text-stone-400 hover:text-stone-700 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                              title="Move Down"
                            >
                              <ArrowDown className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSections(sections.filter(s => s.id !== sec.id));
                                if (selectedSectionId === sec.id) setSelectedSectionId(null);
                              }}
                              className="p-1 hover:bg-stone-100 border border-stone-200 text-stone-600 rounded hover:text-rose-455 cursor-pointer"
                              title="Delete Block"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {sections.length === 0 && (
                      <p className="text-xs text-stone-300 italic text-center py-6">All storefront sections removed. Add layouts below!</p>
                    )}
                  </div>
                </div>

                {/* Add Section dropdown panel */}
                <div className="pt-3 border-t border-stone-200">
                  <span className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Insert New Block Section</span>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-extrabold uppercase">
                    {[
                      { cat: "hero", icon: "✨", label: "Hero Block" },
                      { cat: "text_block", icon: "📝", label: "Text Block" },
                      { cat: "about", icon: "📖", label: "About Us" },
                      { cat: "features", icon: "⚡", label: "Features Block" },
                      { cat: "services", icon: "🛠️", label: "Services Block" },
                      { cat: "subscriptions", icon: "💎", label: "Packages" },
                      { cat: "offers", icon: "🎁", label: "Promo Offers" }
                    ].map(block => (
                      <button
                        key={block.cat}
                        type="button"
                        onClick={() => {
                          const presets: Record<string, any> = {
                            hero: { type: "hero_v2", title: tagline || "Premium Grooming & Beauty Rituals", subtitle: subtitle || "Experience signature scissor cuts and Moroccan hair spas.", emoji: "🧖‍♀️", banners: [] },
                            about: { type: "about_v1", title: "Our Legacy", subtitle: "We are committed to delivering elite artisan grooming and therapy sessions since 2018." },
                            text_block: { type: "text_v1", title: "Announcements", subtitle: "Walk-ins are welcomed, but booking online guarantees zero waiting times." },
                            features: { type: "features_grid", title: "The Salon Experience", subtitle: "Enjoy pure relaxation inside our premium grooming center." },
                            services: { type: "services_grid", title: "Signature Styling Menu", subtitle: "Configure and choose from our top grooming and therapy treatments." },
                            subscriptions: { type: "sub_comparison", title: "Special Passes & Combos", subtitle: "Select a membership tier or package built for regular clients." },
                            offers: { type: "offers_classic", title: "Seasonal Campaigns", subtitle: "Use first-time discount coupons on checkout slots." }
                          };
                          const newId = `${block.cat}-${Date.now()}`;
                          const newSec = {
                            id: newId,
                            category: block.cat,
                            ...presets[block.cat]
                          };
                          setSections([...sections, newSec]);
                          setSelectedSectionId(newId);
                        }}
                        className="p-2 bg-white border border-stone-205 rounded-lg hover:border-rose-500 hover:text-stone-850 transition-all text-left flex items-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <span>{block.icon}</span>
                        <span className="truncate">{block.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section Content & Presets Editor Form */}
                {(() => {
                  const selectedSection = sections.find(s => s.id === selectedSectionId);
                  if (!selectedSection) return null;
                  const category = selectedSection.category || selectedSection.id.split('-')[0];

                  const handleUpdateSection = (fields: any) => {
                    setSections(sections.map(s => s.id === selectedSectionId ? { ...s, ...fields } : s));
                  };

                  return (
                    <div className="p-4 bg-white border border-stone-205 rounded-xl space-y-4 text-xs select-none">
                      <div className="border-b border-stone-200 pb-2 flex items-center justify-between">
                        <span className="font-extrabold text-[10px] text-stone-750 uppercase tracking-widest">
                          ⚙️ Editing: {selectedSection.id}
                        </span>
                        <button type="button" onClick={() => setSelectedSectionId(null)} className="text-stone-400 hover:text-stone-750 font-bold cursor-pointer">&times; Close</button>
                      </div>

                      {/* Layout Presets */}
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Layout Style Preset</label>
                        <div className="grid grid-cols-1 gap-1.5">
                          {category === "hero" && [
                            { type: "hero_v1", label: "Classic Centered", desc: "Welcome header, centered tagline, big floating emoji graphic, primary button." },
                            { type: "hero_v2", label: "Modern Split-Screen", desc: "Two column alignment, text on left, giant interactive icon on right." },
                            { type: "hero_v3", label: "Luxury Dark Editorial", desc: "Full width dark cover background with ambient star rating header." },
                            { type: "hero_carousel", label: "Custom Banners Carousel", desc: "A premium sliding banner carousel showing beautiful custom uploaded backgrounds." }
                          ].map(p => (
                            <button
                              key={p.type}
                              type="button"
                              onClick={() => handleUpdateSection({ type: p.type })}
                              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                                selectedSection.type === p.type ? "border-rose-500 bg-rose-500/5 font-semibold text-stone-850" : "border-stone-200 hover:border-stone-305 text-stone-500"
                              }`}
                            >
                              <p className="font-extrabold text-[11px]">{p.label}</p>
                              <p className="text-[9px] text-stone-450 mt-0.5 normal-case">{p.desc}</p>
                            </button>
                          ))}

                          {category === "about" && [
                            { type: "about_v1", label: "Classic Brand Story", desc: "Horizontal alignment showing standard story tagline and block description." },
                            { type: "about_v2", label: "Founder Note & Signature", desc: "Includes founder headshot avatar and title description badge." }
                          ].map(p => (
                            <button
                              key={p.type}
                              type="button"
                              onClick={() => handleUpdateSection({ type: p.type })}
                              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                                selectedSection.type === p.type ? "border-rose-500 bg-rose-500/5 font-semibold text-stone-850" : "border-stone-200 hover:border-stone-305 text-stone-500"
                              }`}
                            >
                              <p className="font-extrabold text-[11px]">{p.label}</p>
                              <p className="text-[9px] text-stone-455 mt-0.5 normal-case">{p.desc}</p>
                            </button>
                          ))}

                          {category === "services" && [
                            { type: "services_grid", label: "Premium Services Grid", desc: "Displays items inside double column responsive square cards." },
                            { type: "services_list", label: "Compact Menu Row List", desc: "Clean menu row style list with inline price and instant checkout button." }
                          ].map(p => (
                            <button
                              key={p.type}
                              type="button"
                              onClick={() => handleUpdateSection({ type: p.type })}
                              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                                selectedSection.type === p.type ? "border-rose-500 bg-rose-500/5 font-semibold text-stone-850" : "border-stone-200 hover:border-stone-305 text-stone-500"
                              }`}
                            >
                              <p className="font-extrabold text-[11px]">{p.label}</p>
                              <p className="text-[9px] text-stone-455 mt-0.5 normal-case">{p.desc}</p>
                            </button>
                          ))}

                          {category === "subscriptions" && [
                            { type: "sub_comparison", label: "Standard Comparison Cards", desc: "Renders vertical comparison tiers with details." },
                            { type: "sub_glass", label: "Zen Glassmorphic Card", desc: "Horizontal clean membership ticket pass overlay." }
                          ].map(p => (
                            <button
                              key={p.type}
                              type="button"
                              onClick={() => handleUpdateSection({ type: p.type })}
                              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                                selectedSection.type === p.type ? "border-rose-500 bg-rose-500/5 font-semibold text-stone-850" : "border-stone-200 hover:border-stone-305 text-stone-500"
                              }`}
                            >
                              <p className="font-extrabold text-[11px]">{p.label}</p>
                              <p className="text-[9px] text-stone-455 mt-0.5 normal-case">{p.desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Title editing */}
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-stone-450 uppercase tracking-wider">Block Title Text</label>
                        <input
                          type="text"
                          value={selectedSection.title || ""}
                          onChange={e => handleUpdateSection({ title: e.target.value })}
                          className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-stone-900 outline-none focus:border-stone-300"
                        />
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-lg px-2 py-1">
                            <input
                              type="color"
                              value={selectedSection.titleColor || "#f1f5f9"}
                              onChange={e => handleUpdateSection({ titleColor: e.target.value })}
                              className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                              title="Title Color"
                            />
                            <span className="text-[9px] text-stone-400 font-mono">Hex Color</span>
                          </div>
                          <select
                            value={selectedSection.titleSize || ""}
                            onChange={e => handleUpdateSection({ titleSize: e.target.value })}
                            className="bg-white border border-stone-200 rounded-lg px-2 py-1 text-[10px] text-stone-500 outline-none"
                          >
                            <option value="">Default Font Size</option>
                            <option value="text-xl md:text-2xl">Small Title</option>
                            <option value="text-2xl md:text-3xl">Medium Title</option>
                            <option value="text-3xl md:text-4xl">Large Title</option>
                            <option value="text-4xl md:text-5xl">Extra Large Title</option>
                            <option value="text-5xl md:text-6xl">Giant Title</option>
                          </select>
                        </div>
                      </div>

                      {/* Subtitle editing */}
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-stone-450 uppercase tracking-wider">Block Subtitle / Content Text</label>
                        <textarea
                          rows={3}
                          value={selectedSection.subtitle || ""}
                          onChange={e => handleUpdateSection({ subtitle: e.target.value })}
                          className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-stone-900 outline-none resize-none focus:border-stone-300"
                        />
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-lg px-2 py-1">
                            <input
                              type="color"
                              value={selectedSection.subtitleColor || "#94a3b8"}
                              onChange={e => handleUpdateSection({ subtitleColor: e.target.value })}
                              className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                              title="Subtitle Color"
                            />
                            <span className="text-[9px] text-stone-400 font-mono">Hex Color</span>
                          </div>
                          <select
                            value={selectedSection.subtitleSize || ""}
                            onChange={e => handleUpdateSection({ subtitleSize: e.target.value })}
                            className="bg-white border border-stone-200 rounded-lg px-2 py-1 text-[10px] text-stone-500 outline-none"
                          >
                            <option value="">Default Font Size</option>
                            <option value="text-xs">Tiny Content</option>
                            <option value="text-sm">Small Content</option>
                            <option value="text-base">Medium Content</option>
                            <option value="text-lg">Large Content</option>
                          </select>
                        </div>
                      </div>

                      {/* Emoji input for Hero block */}
                      {category === "hero" && selectedSection.type !== "hero_carousel" && (
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-stone-450 uppercase tracking-wider">Floating Graphic Emoji</label>
                          <input
                            type="text"
                            value={selectedSection.emoji || "🧖‍♀️"}
                            onChange={e => handleUpdateSection({ emoji: e.target.value })}
                            className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-stone-900 outline-none focus:border-stone-300"
                            placeholder="Enter graphic emoji"
                          />
                        </div>
                      )}

                      {/* Banners Manager for Hero Carousel */}
                      {selectedSection.type === "hero_carousel" && (
                        <div className="border-t border-stone-200 pt-3 space-y-3">
                          <div className="flex justify-between items-center">
                            <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Sliding Carousel Banners</label>
                            <button
                              type="button"
                              onClick={() => {
                                const newBans = [...(selectedSection.banners || []), { id: Date.now().toString(), imageUrl: "", title: "New Banner Slide", subtitle: "Explore seasonal beauty packages" }];
                                handleUpdateSection({ banners: newBans });
                              }}
                              className="text-[9px] text-rose-450 hover:underline font-extrabold uppercase cursor-pointer"
                            >
                              + Add Slide
                            </button>
                          </div>
                          <div className="space-y-3 text-[10px]">
                            {(selectedSection.banners || []).map((banner: any, index: number) => (
                              <div key={banner.id || index} className="p-3 bg-white border border-stone-205 rounded-xl space-y-2 relative">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newBans = selectedSection.banners.filter((_: any, i: number) => i !== index);
                                    handleUpdateSection({ banners: newBans });
                                  }}
                                  className="absolute top-1.5 right-1.5 text-stone-400 hover:text-stone-850 font-extrabold text-xs cursor-pointer"
                                >
                                  &times;
                                </button>
                                <div>
                                  <span className="block text-[9px] font-bold text-stone-400 uppercase tracking-wider mb-1">Banner Slide Image</span>
                                  {banner.imageUrl ? (
                                    <div className="flex items-center gap-2">
                                      <img src={banner.imageUrl} alt="banner" className="h-8 w-12 object-cover rounded border border-stone-200 bg-stone-50/50" />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newBans = [...selectedSection.banners];
                                          newBans[index].imageUrl = "";
                                          handleUpdateSection({ banners: newBans });
                                        }}
                                        className="text-[9px] text-stone-850 hover:underline font-bold cursor-pointer"
                                      >
                                        Remove Image
                                      </button>
                                    </div>
                                  ) : uploadingBannerIndex === index ? (
                                    <div className="flex flex-col items-center justify-center border border-dashed border-stone-200 rounded-lg p-2.5 bg-stone-50">
                                      <Sparkles className="size-4 text-amber-500 animate-spin" />
                                      <span className="text-[8px] font-bold text-stone-500 animate-pulse mt-0.5">Uploading...</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center border border-dashed border-stone-200 rounded-lg p-2.5 hover:bg-stone-50 transition-colors">
                                      <label className="cursor-pointer flex flex-col items-center">
                                        <Upload className="size-4 text-stone-400 mb-0.5" />
                                        <span className="text-[9px] font-bold text-stone-500">Upload slide banner</span>
                                        <input
                                          type="file"
                                          className="hidden"
                                          accept="image/*"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              if (file.size > 800 * 1024) {
                                                alert("Please upload slide banner smaller than 800KB.");
                                                return;
                                              }
                                              setUploadingBannerIndex(index);
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
                                                        folder: "banners"
                                                      })
                                                    });
                                                    if (response.ok) {
                                                      const data = await response.json();
                                                      const newBans = [...selectedSection.banners];
                                                      newBans[index].imageUrl = data.url;
                                                      handleUpdateSection({ banners: newBans });
                                                    } else {
                                                      const err = await response.json();
                                                      alert(`Banner upload failed: ${err.error || "Unknown error"}`);
                                                    }
                                                  } catch (uploadErr) {
                                                    console.error("Upload error", uploadErr);
                                                    alert("Failed to upload slide banner to server.");
                                                  } finally {
                                                    setUploadingBannerIndex(null);
                                                  }
                                                }
                                              };
                                              reader.readAsDataURL(file);
                                            }
                                          }}
                                        />
                                      </label>
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <span className="block text-[9px] font-bold text-stone-400 uppercase tracking-wider">Slide Title</span>
                                  <input
                                    type="text"
                                    value={banner.title || ""}
                                    onChange={(e) => {
                                      const newBans = [...selectedSection.banners];
                                      newBans[index].title = e.target.value;
                                      handleUpdateSection({ banners: newBans });
                                    }}
                                    className="w-full bg-stone-50 border border-stone-200 rounded px-2 py-1 text-stone-900 font-semibold mt-1 outline-none focus:border-stone-300"
                                  />
                                </div>
                                <div>
                                  <span className="block text-[9px] font-bold text-stone-400 uppercase tracking-wider">Slide Subtitle / Description</span>
                                  <input
                                    type="text"
                                    value={banner.subtitle || ""}
                                    onChange={(e) => {
                                      const newBans = [...selectedSection.banners];
                                      newBans[index].subtitle = e.target.value;
                                      handleUpdateSection({ banners: newBans });
                                    }}
                                    className="w-full bg-stone-50 border border-stone-200 rounded px-2 py-1 text-stone-900 font-semibold mt-1 outline-none focus:border-stone-300"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Right Column: Simulated Preview Viewport */}
              <div className="lg:col-span-7 space-y-4 text-left">
                <div className="flex justify-between items-center bg-white border border-stone-205 p-2.5 rounded-xl text-[10px]">
                  <span className="font-extrabold uppercase text-stone-500 flex items-center gap-1.5">
                    <span className="animate-pulse text-stone-850">●</span> Simulated Live Device Preview Viewport
                  </span>
                  <div className="flex bg-stone-50 border border-stone-200 rounded p-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewDevice("desktop")}
                      className={`px-3 py-1 rounded text-[9px] font-extrabold uppercase transition-all cursor-pointer ${
                        previewDevice === "desktop" ? "bg-white border border-stone-205 text-stone-850" : "text-stone-400 hover:text-stone-700"
                      }`}
                    >
                      Desktop
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice("mobile")}
                      className={`px-3 py-1 rounded text-[9px] font-extrabold uppercase transition-all cursor-pointer ${
                        previewDevice === "mobile" ? "bg-white border border-stone-205 text-stone-850" : "text-stone-400 hover:text-stone-700"
                      }`}
                    >
                      Mobile
                    </button>
                  </div>
                </div>

                {/* Simulated view sandbox canvas */}
                <div className="flex justify-center w-full">
                  <div
                    className={`w-full bg-stone-50 border border-stone-200 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${
                      previewDevice === "mobile" ? "max-w-[320px] min-h-[580px] max-h-[580px] overflow-y-auto border-[10px] border-slate-950 rounded-[2.5rem]" : "max-w-full min-h-[600px] max-h-[600px] overflow-y-auto"
                    }`}
                  >
                    {/* Browser top-bar */}
                    {previewDevice === "desktop" && (
                      <div className="flex items-center gap-2 bg-white border border-stone-205 px-4 py-2.5 text-[10px]">
                        <div className="flex gap-1 shrink-0">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        </div>
                        <div className="flex-1 max-w-sm mx-auto bg-stone-50 border border-stone-200 text-stone-400 rounded py-0.5 px-3 truncate text-center font-mono">
                          https://{tenantSlug}.careva.in/
                        </div>
                      </div>
                    )}

                    {/* Simulated render document */}
                    <div className="p-4 text-left font-sans select-none space-y-6 bg-white text-stone-900">
                      {/* Header Nav */}
                      <header className="flex justify-between items-center p-3 bg-stone-50 border border-stone-200 rounded-xl">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {logoUrl ? (
                            <img src={logoUrl} alt="Store Logo" className="h-6 w-auto object-contain max-w-[90px]" />
                          ) : (
                            <span className="font-extrabold text-xs uppercase tracking-tight text-amber-500 truncate">{businessName}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[9px] font-extrabold text-stone-400 uppercase shrink-0">
                          <span>Home</span>
                          <span>Services</span>
                          <span>📍 {activePreviewOutlet?.name?.replace("LuxCuts ", "") || "HQ"}</span>
                        </div>
                      </header>

                      {/* Render sections array */}
                      {sections.map((sec) => {
                        const category = sec.category || sec.id.split('-')[0];
                        const isSelected = selectedSectionId === sec.id;
                        return (
                          <div
                            key={sec.id}
                            onClick={() => setSelectedSectionId(sec.id)}
                            className={`relative p-4 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? "border-rose-500 bg-rose-500/5 ring-1 ring-rose-500"
                                : "border-stone-200 hover:border-stone-300 bg-stone-50/20"
                            }`}
                          >
                            <span className="absolute -top-2.5 left-2 bg-white border border-stone-200 px-1.5 py-0.5 rounded text-[7px] font-bold text-stone-400 uppercase tracking-widest">
                              Section: {category}
                            </span>

                            {/* HERO SECTION TYPE */}
                            {category === "hero" && (
                              <div className="space-y-3 pt-1 text-center">
                                {sec.type === "hero_carousel" && sec.banners?.length > 0 ? (
                                  <div className="relative h-28 w-full bg-stone-50 border border-stone-200 rounded-lg overflow-hidden flex flex-col justify-end p-2.5 text-left">
                                    {sec.banners[0].imageUrl && <img src={sec.banners[0].imageUrl} alt="banner" className="absolute inset-0 h-full w-full object-cover opacity-40" />}
                                    <div className="relative z-10">
                                      <p className="font-extrabold text-[11px] leading-tight text-stone-900">{sec.banners[0].title}</p>
                                      <p className="text-[8px] text-stone-500 mt-0.5 line-clamp-1">{sec.banners[0].subtitle}</p>
                                    </div>
                                  </div>
                                ) : sec.type === "hero_v3" ? (
                                  <div className="p-3 bg-stone-900 border border-stone-800 rounded-lg text-left relative overflow-hidden">
                                    <span className="text-[7px] font-bold text-amber-500 block mb-0.5">★★★★★ LUXURY EXPERTISE</span>
                                    <h3 className="text-sm font-extrabold tracking-tight text-white" style={{ color: sec.titleColor || undefined }}>{sec.title}</h3>
                                    <p className="text-[9px] text-stone-400 mt-1 line-clamp-2 leading-relaxed normal-case" style={{ color: sec.subtitleColor || undefined }}>{sec.subtitle}</p>
                                    <span className="absolute right-2.5 top-2.5 text-4xl opacity-20">{sec.emoji || "🧖‍♀️"}</span>
                                  </div>
                                ) : sec.type === "hero_v1" ? (
                                  <div className="py-2.5 space-y-2">
                                    <span className="px-2 py-0.5 bg-stone-100 border border-stone-200 rounded-full text-[8px] font-bold text-stone-450 uppercase">OFFER ACTIVE</span>
                                    <h3 className="text-sm font-extrabold leading-snug" style={{ color: sec.titleColor || undefined }}>{sec.title}</h3>
                                    <p className="text-[9px] text-stone-500 leading-relaxed normal-case" style={{ color: sec.subtitleColor || undefined }}>{sec.subtitle}</p>
                                    <p className="text-3xl animate-bounce">{sec.emoji || "🧖‍♀️"}</p>
                                  </div>
                                ) : (
                                  /* Default modern split hero_v2 */
                                  <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-amber-500/10 to-rose-500/10 border border-stone-200 rounded-lg text-left gap-3">
                                    <div className="space-y-1 max-w-[70%]">
                                      <span className="bg-rose-500/25 text-rose-500 px-1 py-0.5 rounded text-[7px] font-extrabold uppercase">Launch Offer</span>
                                      <h3 className="text-[11px] font-black leading-tight" style={{ color: sec.titleColor || undefined }}>{sec.title}</h3>
                                      <p className="text-[8px] text-stone-500 line-clamp-2 leading-relaxed normal-case" style={{ color: sec.subtitleColor || undefined }}>{sec.subtitle}</p>
                                    </div>
                                    <span className="text-4xl shrink-0">{sec.emoji || "🧖‍♀️"}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* ABOUT SECTION TYPE */}
                            {category === "about" && (
                              <div className="space-y-2 pt-1 text-left">
                                <h3 className="text-[11px] font-extrabold" style={{ color: sec.titleColor || undefined }}>{sec.title}</h3>
                                <p className="text-[9px] text-stone-500 leading-relaxed font-sans normal-case" style={{ color: sec.subtitleColor || undefined }}>{sec.subtitle}</p>
                                {sec.type === "about_v2" && (
                                  <div className="flex items-center gap-2 p-2 bg-stone-50 border border-stone-200 rounded-lg max-w-[170px] mt-1.5">
                                    <div className="w-6 h-6 rounded-full bg-white border border-stone-200 text-[8px] font-bold flex items-center justify-center text-stone-700">ER</div>
                                    <div>
                                      <p className="font-extrabold text-[8px] text-stone-850">Elena Rostova</p>
                                      <p className="text-[7px] text-stone-400">Founder & Director</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* TEXT CONTENT SECTION TYPE */}
                            {category === "text_block" && (
                              <div className="space-y-2 pt-1 bg-stone-50 p-3 rounded-lg border border-stone-200 border-l-2 border-l-amber-500 text-left">
                                <h3 className="text-[11px] font-extrabold" style={{ color: sec.titleColor || undefined }}>{sec.title}</h3>
                                <p className="text-[9px] text-stone-500 font-sans normal-case leading-relaxed" style={{ color: sec.subtitleColor || undefined }}>{sec.subtitle}</p>
                              </div>
                            )}

                            {/* FEATURES SECTION TYPE */}
                            {category === "features" && (
                              <div className="space-y-2.5 pt-1">
                                <div className="text-center">
                                  <h3 className="text-[11px] font-extrabold" style={{ color: sec.titleColor || undefined }}>{sec.title}</h3>
                                  <p className="text-[8px] text-stone-400 normal-case" style={{ color: sec.subtitleColor || undefined }}>{sec.subtitle}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-center">
                                  {[
                                    { icon: "🎓", t: "Expert Styling" },
                                    { icon: "🛡️", t: "100% Hygiene" }
                                  ].map((item, i) => (
                                    <div key={i} className="p-2 bg-stone-50 border border-stone-200 rounded-lg">
                                      <span className="text-md block mb-0.5">{item.icon}</span>
                                      <span className="text-[8px] font-extrabold text-stone-700">{item.t}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* SERVICES SECTION TYPE */}
                            {category === "services" && (
                              <div className="space-y-2.5 pt-1">
                                <div className="text-center">
                                  <h3 className="text-[11px] font-extrabold" style={{ color: sec.titleColor || undefined }}>{sec.title}</h3>
                                  <p className="text-[8px] text-stone-400 normal-case" style={{ color: sec.subtitleColor || undefined }}>{sec.subtitle}</p>
                                </div>
                                {sec.type === "services_list" ? (
                                  <div className="space-y-1.5 text-left">
                                    {services.slice(0, 2).map(s => (
                                      <div key={s.id} className="flex justify-between items-center p-2 bg-stone-50 border border-stone-200 rounded-lg text-[9px]">
                                        <div>
                                          <span className="font-bold text-stone-850 block">{s.name}</span>
                                          <span className="text-[7px] text-stone-400">45 Mins</span>
                                        </div>
                                        <div className="text-right">
                                          <span className="font-extrabold text-amber-500 block">₹{s.price}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  /* Grid cards default services_grid */
                                  <div className="grid grid-cols-2 gap-2">
                                    {services.slice(0, 2).map(s => (
                                      <div key={s.id} className="p-2 bg-stone-50 border border-stone-200 rounded-lg space-y-1.5 text-center">
                                        <span className="text-sm block">💇‍♂️</span>
                                        <span className="text-[8px] font-bold text-stone-850 block truncate">{s.name}</span>
                                        <span className="text-[8px] text-amber-500 font-black block">₹{s.price}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* SUBSCRIPTIONS SECTION TYPE */}
                            {category === "subscriptions" && (
                              <div className="space-y-2.5 pt-1">
                                <div className="text-center">
                                  <h3 className="text-[11px] font-extrabold" style={{ color: sec.titleColor || undefined }}>{sec.title}</h3>
                                  <p className="text-[8px] text-stone-400 normal-case" style={{ color: sec.subtitleColor || undefined }}>{sec.subtitle}</p>
                                </div>
                                {sec.type === "sub_glass" ? (
                                  <div className="p-2.5 bg-stone-900 border border-stone-800 rounded-lg text-left space-y-1">
                                    <span className="font-extrabold text-[9px] text-emerald-500 block">⭐ Platinum VIP Wallet Pass</span>
                                    <span className="text-[7px] text-stone-400 block font-sans normal-case leading-normal">Prepay 6 groomings, get 2 custom massages absolute free. Unlimited expiration.</span>
                                    <span className="text-[10px] font-black text-white block mt-1">₹7,999</span>
                                  </div>
                                ) : (
                                  /* Comparison passes default sub_comparison */
                                  <div className="grid grid-cols-2 gap-2 text-center text-[9px]">
                                    {[
                                      { n: "Silver Pass", p: "₹3,999", d: "3 Signature Cuts" },
                                      { n: "Gold VIP", p: "₹6,999", d: "6 Cuts + 2 Spas" }
                                    ].map((tier, idx) => (
                                      <div key={idx} className="p-2 bg-stone-50 border border-stone-200 rounded-lg space-y-1">
                                        <span className="font-bold text-stone-500 uppercase tracking-widest text-[7px] block">{tier.n}</span>
                                        <span className="font-black text-stone-700 block">{tier.p}</span>
                                        <span className="text-[7px] text-stone-400 block truncate">{tier.d}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* OFFERS SECTION TYPE */}
                            {category === "offers" && (
                              <div className="space-y-2 pt-1 text-center">
                                <h3 className="text-[11px] font-extrabold" style={{ color: sec.titleColor || undefined }}>{sec.title}</h3>
                                <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-between text-left mt-1 gap-2">
                                  <div className="space-y-0.5">
                                    <span className="text-[7px] font-black text-amber-500 tracking-wider block">CODE: {campaignCouponCode}</span>
                                    <span className="text-[9px] font-bold text-stone-850 block normal-case">Flat {campaignDiscountPercent}% Off First Online Booking</span>
                                  </div>
                                  <span className="text-md shrink-0">🎁</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Footer Mock */}
                      <footer className="pt-4 border-t border-stone-205 text-center space-y-1 text-[8px] text-stone-400">
                        <p className="font-extrabold uppercase tracking-widest text-stone-500">{businessName} Brand Group</p>
                        <p className="font-sans normal-case">Contact: {activePreviewOutlet?.phone || "+91 99000 88000"} | {activePreviewOutlet?.address || "Calicut Central"}</p>
                        <p className="uppercase tracking-widest font-black text-stone-450 mt-1 font-sans">Powered by Careva SaaS Platform</p>
                      </footer>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB: CUSTOM CODE */}
        {cmsSubTab === "CUSTOM CODE" && (
          <div className="space-y-5">
            {/* Header + Toggle */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                  <Code2 className="size-4 text-violet-600" /> Custom Code Storefront
                </h4>
                <p className="text-xs text-stone-500 mt-0.5">Paste your own HTML, CSS and JS. Your storefront fetches live salon data automatically via <code className="bg-stone-100 px-1 rounded text-[10px] font-mono">window.careva</code>.</p>
              </div>
              {/* Toggle */}
              <button
                type="button"
                onClick={() => setUseCustomCode(!useCustomCode)}
                className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                  useCustomCode
                    ? 'bg-violet-900 text-white border-violet-900 shadow-lg shadow-violet-900/20'
                    : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400'
                }`}
              >
                <span className={`w-8 h-4 rounded-full relative transition-all ${useCustomCode ? 'bg-violet-400' : 'bg-stone-200'}`}>
                  <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${useCustomCode ? 'left-4' : 'left-0.5'}`} />
                </span>
                {useCustomCode ? 'Custom Code Active' : 'Using Built-in Template'}
              </button>
            </div>

            {/* Warning when active */}
            {useCustomCode && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                <AlertTriangle className="size-4 shrink-0 text-amber-500 mt-0.5" />
                <div>
                  <span className="font-bold block">Custom Code is ACTIVE</span>
                  Your storefront now shows your custom HTML instead of the built-in template. If the page appears blank, click the toggle above to revert safely.
                </div>
              </div>
            )}

            {/* Data Reference Card */}
            <div className="bg-stone-950 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-violet-400 font-bold text-[10px] uppercase tracking-widest">
                <Info className="size-3.5" /> Available via <code className="font-mono">window.careva</code>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[{key: 'careva.services', desc: 'id, name, price, duration, category, images, tags'}, {key: 'careva.stylists', desc: 'id, name, specialty, rating, avatar'}, {key: 'careva.outlets', desc: 'id, name, address, phone, slug'}, {key: 'careva.tenant', desc: 'id, name, slug'}].map(item => (
                  <div key={item.key} className="bg-stone-900 rounded-xl p-3">
                    <code className="text-[10px] font-mono text-emerald-400 block">{item.key}</code>
                    <span className="text-[9px] text-stone-500 mt-1 block leading-tight">{item.desc}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-stone-600 pt-1">Use <code className="text-stone-400 font-mono">fetch('/api/public/{tenantSlug}/data')</code> to reload data dynamically in your JS.</p>
            </div>

            {/* Code Editor Tabs */}
            <div className="space-y-3">
              <div className="flex gap-1.5">
                {(["html", "css", "js"] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setCustomCodeTab(t)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                      customCodeTab === t
                        ? t === 'html' ? 'bg-orange-100 text-orange-700 border border-orange-200' : t === 'css' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                        : 'bg-white border border-stone-200 text-stone-400 hover:text-stone-700'
                    }`}
                  >{t.toUpperCase()}</button>
                ))}
                <button
                  type="button"
                  onClick={() => setCustomCodePreviewOpen(!customCodePreviewOpen)}
                  className={`ml-auto px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                    customCodePreviewOpen ? 'bg-violet-900 text-white' : 'bg-white border border-stone-200 text-stone-500 hover:text-violet-700'
                  }`}
                >
                  <Eye className="size-3" /> {customCodePreviewOpen ? 'Hide Preview' : 'Live Preview'}
                </button>
              </div>

              {/* Code textarea */}
              <div className="relative">
                {customCodeTab === "html" && (
                  <textarea
                    value={customHtml}
                    onChange={e => setCustomHtml(e.target.value)}
                    rows={16}
                    spellCheck={false}
                    placeholder={`<!-- Your custom HTML storefront -->\n<div class="hero">\n  <h1 id="salon-name">My Salon</h1>\n  <ul id="services-list"></ul>\n</div>`}
                    className="w-full font-mono text-[11px] bg-stone-950 text-orange-300 border border-stone-800 rounded-xl px-4 py-3.5 outline-none resize-y placeholder:text-stone-700 leading-relaxed tracking-normal"
                  />
                )}
                {customCodeTab === "css" && (
                  <textarea
                    value={customCss}
                    onChange={e => setCustomCss(e.target.value)}
                    rows={16}
                    spellCheck={false}
                    placeholder={`/* Your styles */\nbody { font-family: 'Inter', sans-serif; margin: 0; }\n.hero { padding: 4rem 2rem; text-align: center; }`}
                    className="w-full font-mono text-[11px] bg-stone-950 text-blue-300 border border-stone-800 rounded-xl px-4 py-3.5 outline-none resize-y placeholder:text-stone-700 leading-relaxed"
                  />
                )}
                {customCodeTab === "js" && (
                  <textarea
                    value={customJs}
                    onChange={e => setCustomJs(e.target.value)}
                    rows={16}
                    spellCheck={false}
                    placeholder={`// window.careva is pre-loaded with your salon data\nconst { services, stylists, outlets, tenant } = window.careva;\n\n// Render services list\nconst list = document.getElementById('services-list');\nservices.forEach(s => {\n  const li = document.createElement('li');\n  li.textContent = s.name + ' — ₹' + s.price;\n  list.appendChild(li);\n});`}
                    className="w-full font-mono text-[11px] bg-stone-950 text-yellow-300 border border-stone-800 rounded-xl px-4 py-3.5 outline-none resize-y placeholder:text-stone-700 leading-relaxed"
                  />
                )}
              </div>
            </div>

            {/* Sandboxed Live Preview */}
            {customCodePreviewOpen && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest flex items-center gap-1.5"><Eye className="size-3" /> Sandboxed Live Preview</span>
                  <span className="text-[9px] text-stone-400 font-mono bg-stone-100 px-2 py-0.5 rounded">Sandbox — scripts isolated from admin panel</span>
                </div>
                <div className="rounded-2xl overflow-hidden border border-stone-800 bg-stone-950 shadow-2xl">
                  <iframe
                    key={customHtml + customCss + customJs}
                    srcDoc={buildPreviewDoc()}
                    sandbox="allow-scripts"
                    className="w-full h-[500px] border-0"
                    title="Custom Storefront Preview"
                  />
                </div>
                <p className="text-[9px] text-stone-400">Preview uses mock data. Live site fetches real data from your database.</p>
              </div>
            )}
          </div>
        )}

        {/* SUBTAB: MEDIA LIBRARY */}
        {cmsSubTab === "MEDIA LIBRARY" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="font-bold text-stone-900 text-sm">Media Library</h4>
                <p className="text-[10px] text-stone-400 mt-0.5">Upload images — auto-converted to WebP. Copy URLs to use anywhere in your storefront.</p>
              </div>
              <button
                type="button"
                onClick={() => mediaFileInputRef.current?.click()}
                disabled={mediaUploading}
                className="flex items-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-60 shadow-sm"
              >
                <Upload className="size-3.5" />
                {mediaUploading ? `Uploading… ${mediaUploadProgress}%` : "Upload Images"}
              </button>
              <input
                ref={mediaFileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => { if (e.target.files) uploadMediaFiles(e.target.files); e.target.value = ""; }}
              />
            </div>

            {/* Drag-and-drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setMediaDragOver(true); }}
              onDragLeave={() => setMediaDragOver(false)}
              onDrop={e => { e.preventDefault(); setMediaDragOver(false); if (e.dataTransfer.files) uploadMediaFiles(e.dataTransfer.files); }}
              onClick={() => !mediaUploading && mediaFileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                mediaDragOver ? "border-blue-400 bg-blue-50" : "border-stone-200 hover:border-stone-300 hover:bg-stone-50"
              } ${mediaUploading ? "pointer-events-none" : ""}`}
            >
              {mediaUploading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative w-14 h-14">
                    <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                      <circle cx="28" cy="28" r="24" fill="none" stroke="#e7e5e4" strokeWidth="4" />
                      <circle cx="28" cy="28" r="24" fill="none" stroke="#1c1917" strokeWidth="4"
                        strokeDasharray={`${2 * Math.PI * 24}`}
                        strokeDashoffset={`${2 * Math.PI * 24 * (1 - mediaUploadProgress / 100)}`}
                        strokeLinecap="round" className="transition-all duration-300" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-stone-900">{mediaUploadProgress}%</span>
                  </div>
                  <p className="text-xs font-bold text-stone-500 animate-pulse">Converting to WebP &amp; uploading to Cloudinary...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-stone-400">
                  <Image className="size-8" />
                  <p className="text-sm font-bold text-stone-600">Drag &amp; drop images here</p>
                  <p className="text-[10px] text-stone-300">PNG, JPG, WEBP, GIF, SVG — auto-converted to WebP · max 10MB each</p>
                </div>
              )}
            </div>

            {/* Search */}
            {mediaAssets.length > 0 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-stone-400" />
                <input
                  type="text"
                  value={mediaSearch}
                  onChange={e => setMediaSearch(e.target.value)}
                  placeholder="Search by folder or URL…"
                  className="w-full pl-8 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-xs font-medium text-stone-800 outline-none focus:border-stone-400 transition-all"
                />
                {mediaSearch && (
                  <button type="button" onClick={() => setMediaSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700">
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Gallery Grid */}
            {mediaLoading ? (
              <div className="flex items-center justify-center py-16 gap-2">
                <Sparkles className="size-5 text-blue-500 animate-spin" />
                <span className="text-xs font-bold text-stone-400">Loading media library...</span>
              </div>
            ) : filteredMedia.length === 0 ? (
              <div className="text-center py-16 space-y-2">
                <Grid className="size-8 mx-auto text-stone-200" />
                <p className="text-sm font-bold text-stone-400">{mediaSearch ? "No images match your search." : "No images uploaded yet."}</p>
                {!mediaSearch && <p className="text-[10px] text-stone-300">Upload your first image above to get started.</p>}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredMedia.map(asset => (
                  <div key={asset.id} className="group relative rounded-xl overflow-hidden border border-stone-200 bg-stone-50 aspect-square shadow-xs hover:shadow-md transition-all hover:border-stone-400">
                    {/* Image */}
                    <img
                      src={asset.url}
                      alt={asset.altText || "Media asset"}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />

                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-stone-950/70 opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-between p-2">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleDeleteMedia(asset.id)}
                          disabled={mediaDeletingId === asset.id}
                          className="w-6 h-6 rounded-lg bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center transition-all cursor-pointer disabled:opacity-60"
                          title="Delete from Cloudinary"
                        >
                          {mediaDeletingId === asset.id
                            ? <Sparkles className="size-3 animate-spin" />
                            : <Trash2 className="size-3" />}
                        </button>
                      </div>

                      <div className="space-y-1">
                        {/* File info */}
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] font-black uppercase text-blue-300 bg-blue-900/50 px-1.5 py-0.5 rounded">WebP</span>
                          {asset.width && <span className="text-[9px] text-stone-400">{asset.width}×{asset.height}</span>}
                          {asset.sizeBytes && <span className="text-[9px] text-stone-400">{(asset.sizeBytes / 1024).toFixed(0)}KB</span>}
                        </div>
                        {/* Copy URL button */}
                        <button
                          type="button"
                          onClick={() => handleCopyUrl(asset)}
                          className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            mediaCopiedId === asset.id
                              ? "bg-emerald-500 text-white"
                              : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                          }`}
                        >
                          {mediaCopiedId === asset.id ? <><Check className="size-3" /> Copied!</> : <><Copy className="size-3" /> Copy URL</>}
                        </button>
                      </div>
                    </div>

                    {/* Folder badge */}
                    {asset.folder && (
                      <div className="absolute top-1.5 left-1.5 bg-stone-950/60 text-[8px] font-black text-stone-300 px-1.5 py-0.5 rounded group-hover:opacity-0 transition-opacity">
                        {asset.folder}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Stats row */}
            {mediaAssets.length > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-[10px] text-stone-400">
                <span>{mediaAssets.length} image{mediaAssets.length !== 1 ? "s" : ""} in library</span>
                <span>All images stored as WebP on Cloudinary</span>
              </div>
            )}
          </div>
        )}

        {/* Publish/Save Button */}
        <div className="pt-3">
          <button
            type="button"
            onClick={handleSaveCMSConfig}
            disabled={cmsSaveLoading}
            className="px-6 py-3.5 bg-stone-900 hover:bg-stone-805 border border-stone-900 text-white font-semibold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer w-full sm:w-auto uppercase tracking-wider"
          >
            {cmsSaveLoading ? (
              <><Sparkles className="size-4 animate-spin" /> Saving Changes...</>
            ) : (
              <>
                <Save className="size-4" />
                <span>Publish Theme & Layout Configurations</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
