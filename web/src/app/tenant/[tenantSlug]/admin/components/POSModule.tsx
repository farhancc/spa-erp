import React from "react";
import { Receipt, Plus, CreditCard } from "lucide-react";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  type: "service" | "product";
  staffId?: string;
  staffName?: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  duration?: number;
  gender?: string;
  bodyPart?: string;
  outletId?: string | null;
  type: "service";
  images?: string[];
  tags?: string[];
}

export interface ProductItem {
  id: string;
  name: string;
  price: number;
  sku?: string;
  stockQty?: number;
  trackStock?: boolean;
  type: "product";
}

export interface CrmCustomer {
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

interface POSModuleProps {
  services: ServiceItem[];
  products: ProductItem[];
  addToCart: (item: { id: string; name: string; price: number; type: "service" | "product" }) => void;
}

export default function POSModule({
  services,
  products,
  addToCart,
}: POSModuleProps) {
  return (
    <div className="space-y-8 font-minimal text-left">
      <div>
        <h3 className="font-normal font-luxury text-3xl text-stone-900 tracking-normal text-left">Outlet Services & Products Menu</h3>
        <p className="text-sm text-stone-500 text-left mt-1 font-medium">Click items to append checkout invoice ticket</p>
      </div>

      {/* Services Grid */}
      <div className="space-y-5">
        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block text-left">Available Services</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {services.map(ser => (
            <div 
              key={ser.id}
              onClick={() => addToCart({ id: ser.id, name: ser.name, price: ser.price, type: "service" })}
              className="p-4 md:p-6 bg-stone-50/50 border border-stone-200/80 hover:border-stone-850 hover:bg-stone-50 rounded-2xl cursor-pointer transition-all flex justify-between items-center group active:scale-98 shadow-xs"
            >
              <div className="text-left space-y-1.5 min-w-0 flex-1 pr-3">
                <span className="text-[9px] bg-white border border-stone-200/80 text-stone-500 px-2.5 py-0.5 rounded font-semibold uppercase tracking-widest block w-max">Service</span>
                <h4 className="font-semibold text-stone-900 text-sm md:text-base group-hover:text-stone-950 transition-colors truncate">{ser.name}</h4>
              </div>
              <span className="font-semibold text-stone-900 text-xs md:text-sm bg-white border border-stone-200 px-3 py-1.5 rounded-xl group-hover:border-stone-850 transition-all shrink-0">₹{ser.price}</span>
            </div>
          ))}
          {services.length === 0 && (
            <p className="text-stone-400 text-sm italic col-span-2 text-left py-4">No services added. Go to the SERVICES tab to add some.</p>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <div className="space-y-5 pt-8 border-t border-stone-200">
        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block text-left">Retail Products Shelf</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {products.map(prod => (
            <div 
              key={prod.id}
              onClick={() => addToCart({ id: prod.id, name: prod.name, price: prod.price, type: "product" })}
              className="p-4 md:p-6 bg-stone-50/50 border border-stone-200/80 hover:border-stone-850 hover:bg-stone-50 rounded-2xl cursor-pointer transition-all flex justify-between items-center group active:scale-98 shadow-xs"
            >
              <div className="text-left space-y-1.5 min-w-0 flex-1 pr-3">
                <span className="text-[9px] bg-white border border-stone-200/80 text-stone-500 px-2.5 py-0.5 rounded font-semibold uppercase tracking-widest block w-max">Retail Item</span>
                <h4 className="font-semibold text-stone-900 text-sm md:text-base group-hover:text-stone-950 transition-colors truncate">{prod.name}</h4>
              </div>
              <span className="font-semibold text-stone-900 text-xs md:text-sm bg-white border border-stone-200 px-3 py-1.5 rounded-xl group-hover:border-stone-850 transition-all shrink-0">₹{prod.price}</span>
            </div>
          ))}
          {products.length === 0 && (
            <p className="text-stone-400 text-sm italic col-span-2 text-left py-4">No products added. Go to the PRODUCTS tab to add some.</p>
          )}
        </div>
      </div>
    </div>
  );
}

interface CheckoutTicketProps {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  isMobileCartOpen: boolean;
  setIsMobileCartOpen: (open: boolean) => void;
  posCustomerSearch: string;
  setPosCustomerSearch: (val: string) => void;
  activeCrmIndex: number;
  setActiveCrmIndex: (idx: number) => void;
  customers: CrmCustomer[];
  setIsCustomerModalOpen: (open: boolean) => void;
  cmsStylists: any[];
  selectedOutletId: string | null;
  getStylistOutletId: (stylist: any) => string | null;
  couponCode: string;
  setCouponCode: (val: string) => void;
  applyPosCoupon: (e: React.FormEvent) => void;
  redeemedPoints: number;
  setRedeemedPoints: (points: number) => void;
  handleAddLoyaltyPoints: (custId: string, amount: number) => void;
  selectedPayment: "UPI" | "CARD" | "CASH" | "WALLET";
  setSelectedPayment: (mode: "UPI" | "CARD" | "CASH" | "WALLET") => void;
  subtotal: number;
  discountAmount: number;
  gstInclusiveAmount: number;
  netSubtotal: number;
  handleCheckoutSubmit: () => void;
  subscriptions: any[];
  handleSelectWalkIn: () => void;
}

export function CheckoutTicket({
  cart,
  setCart,
  removeFromCart,
  clearCart,
  isMobileCartOpen,
  setIsMobileCartOpen,
  posCustomerSearch,
  setPosCustomerSearch,
  activeCrmIndex,
  setActiveCrmIndex,
  customers,
  setIsCustomerModalOpen,
  cmsStylists,
  selectedOutletId,
  getStylistOutletId,
  couponCode,
  setCouponCode,
  applyPosCoupon,
  redeemedPoints,
  setRedeemedPoints,
  handleAddLoyaltyPoints,
  selectedPayment,
  setSelectedPayment,
  subtotal,
  discountAmount,
  gstInclusiveAmount,
  netSubtotal,
  handleCheckoutSubmit,
  handleSelectWalkIn,
}: CheckoutTicketProps) {
  return (
    <>
      <div className={`
        ${isMobileCartOpen 
          ? 'fixed inset-0 z-50 bg-stone-50 p-6 overflow-y-auto block' 
          : 'hidden lg:block lg:col-span-4 bg-[#FAF9F5]/80 border-2 border-stone-200/80 rounded-3xl p-6 text-left space-y-5 font-minimal shadow-[0_8px_30px_rgb(0,0,0,0.02)]'
        }
      `}>
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="size-4.5 text-stone-850" />
            <h4 className="font-semibold text-stone-900 text-sm">Checkout Ticket</h4>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={clearCart}
              className="text-[9px] text-stone-400 hover:text-stone-850 transition-colors uppercase font-bold tracking-wider cursor-pointer"
            >
              Clear Itemized
            </button>
            <button
              onClick={() => setIsMobileCartOpen(false)}
              className="lg:hidden text-stone-500 hover:text-stone-850 text-lg font-bold px-2 cursor-pointer"
              title="Close Cart"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Billed Customer Selector (CRM) */}
        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 text-xs space-y-2.5 shadow-xs">
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-stone-400 uppercase font-bold tracking-wider">Billed Customer (CRM)</span>
            <button
              type="button"
              onClick={() => setIsCustomerModalOpen(true)}
              className="text-[9px] text-stone-900 hover:text-stone-700 font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer bg-stone-100 hover:bg-stone-200/80 px-2.5 py-1 rounded-xl transition-all"
            >
              <Plus className="size-2.5" /> Register New
            </button>
          </div>
          
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="🔍 Search registered customer..."
                value={posCustomerSearch}
                onChange={(e) => setPosCustomerSearch(e.target.value)}
                className="flex-1 bg-stone-50 border border-stone-200 focus:border-stone-850 rounded-xl py-2 px-3 text-xs font-semibold text-stone-750 outline-none transition-all"
              />
              <button
                type="button"
                onClick={handleSelectWalkIn}
                className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-900 border border-stone-250 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap"
              >
                👤 Walk-in
              </button>
            </div>
            <div className="relative">
              <select
                value={activeCrmIndex}
                onChange={(e) => {
                  const idx = parseInt(e.target.value);
                  setActiveCrmIndex(idx);
                }}
                className="w-full bg-stone-50 border border-stone-200 focus:border-stone-850 rounded-xl py-2 px-3 text-xs font-semibold text-stone-800 outline-none appearance-none cursor-pointer pr-8"
              >
                {customers
                  .map((c, originalIdx) => ({ ...c, originalIdx }))
                  .filter(c => 
                    !posCustomerSearch || 
                    c.name.toLowerCase().includes(posCustomerSearch.toLowerCase()) || 
                    c.phone.includes(posCustomerSearch)
                  )
                  .map((c) => (
                    <option key={c.id} value={c.originalIdx}>
                      👤 {c.name} ({c.phone})
                    </option>
                  ))}
                {customers.length === 0 && (
                  <option value={0}>No Customers Registered</option>
                )}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400 font-bold text-[9px]">
                ▼
              </div>
            </div>
            {customers[activeCrmIndex] && (
              <div className="flex justify-between items-center text-[10px] text-stone-500 font-semibold px-1 mt-1">
                <span>Available: <strong className="text-amber-600">{customers[activeCrmIndex].loyaltyPoints || 0} pts</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    const customAmt = parseInt(prompt(`Enter points to add to ${customers[activeCrmIndex].name}'s account (or negative to deduct):`) || "0");
                    if (customAmt) handleAddLoyaltyPoints(customers[activeCrmIndex].id, customAmt);
                  }}
                  className="text-[9px] text-stone-900 hover:text-stone-700 font-bold uppercase tracking-wider bg-stone-100 hover:bg-stone-200/80 px-1.5 py-0.5 rounded transition-all cursor-pointer"
                >
                  + Add Points
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Cart Items list */}
        <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
          {cart.map(item => (
            <div key={item.id} className="flex justify-between items-start gap-4 text-xs font-minimal p-2 bg-stone-50 border border-stone-200/60 rounded-xl">
              <div className="flex-1 min-w-0">
                <h5 className="font-semibold text-stone-800 truncate">{item.name}</h5>
                
                {/* Price and Quantity Editing Controls */}
                <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px] text-stone-500">
                  {/* Quantity Control */}
                  <div className="flex items-center gap-1 bg-stone-100 border border-stone-200 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setCart(cart.map(c => c.id === item.id ? { ...c, qty: Math.max(1, c.qty - 1) } : c));
                      }}
                      className="w-4 h-4 flex items-center justify-center font-bold hover:bg-stone-200 rounded cursor-pointer transition-colors text-stone-600 border-none"
                    >
                      -
                    </button>
                    <span className="w-5 text-center font-semibold text-stone-800">{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCart(cart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c));
                      }}
                      className="w-4 h-4 flex items-center justify-center font-bold hover:bg-stone-200 rounded cursor-pointer transition-colors text-stone-600 border-none"
                    >
                      +
                    </button>
                  </div>

                  {/* Price Editor */}
                  <div className="flex items-center gap-1">
                    <span className="text-stone-400">Price: ₹</span>
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => {
                        const val = Math.max(0, parseFloat(e.target.value) || 0);
                        setCart(cart.map(c => c.id === item.id ? { ...c, price: val } : c));
                      }}
                      className="w-14 bg-white border border-stone-200 focus:border-stone-450 rounded px-1 py-0.5 text-[10px] font-semibold text-stone-850 outline-none"
                    />
                  </div>
                </div>
                
                {item.type === 'service' && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider">Stylist:</span>
                    <select
                      value={item.staffId || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        const stylist = cmsStylists.find(s => s.id === val);
                        setCart(cart.map(c => c.id === item.id ? { 
                          ...c, 
                          staffId: val || undefined, 
                          staffName: stylist?.name || undefined 
                        } : c));
                      }}
                      className="bg-stone-100 hover:bg-stone-200/80 border border-stone-200/50 rounded-lg px-2 py-0.5 text-[9px] font-bold text-stone-700 outline-none cursor-pointer transition-all"
                    >
                      <option value="">Select Stylist...</option>
                      {cmsStylists
                        .filter(s => getStylistOutletId(s) === selectedOutletId)
                        .map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2.5">
                <span className="font-semibold text-stone-900">₹{item.price * item.qty}</span>
                <button 
                  onClick={() => removeFromCart(item.id)}
                  className="px-2 py-1 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded text-rose-600 hover:text-rose-800 transition-all cursor-pointer font-bold text-[10px]"
                  title="Remove item"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="py-12 px-4 text-center text-stone-400 text-xs italic font-minimal border border-dashed border-stone-250 rounded-2xl bg-white/40 my-2">
              Cart ticket is empty. Select services or products from menu grid.
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-stone-200">
            {/* Coupon inputs */}
            <form onSubmit={applyPosCoupon} className="flex gap-2">
              <input 
                type="text"
                placeholder="Promo (Try LUXPOS)"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="flex-1 bg-white border border-stone-200 focus:border-stone-850 rounded-lg py-1.5 px-2.5 text-xs font-semibold text-stone-750 outline-none"
              />
              <button 
                type="submit"
                className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold transition-all"
              >
                Apply
              </button>
            </form>

            {/* Loyalty simulation */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500">Redeem Points (Max 100):</span>
              <input 
                type="number"
                max="100"
                min="0"
                value={redeemedPoints}
                onChange={(e) => setRedeemedPoints(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                className="w-16 bg-white border border-stone-200 focus:border-stone-850 rounded-lg py-1 px-2 text-xs font-semibold text-center text-stone-700 outline-none"
              />
            </div>

            {/* Payment selector */}
            <div className="space-y-1.5">
              <span className="text-[8px] font-bold text-stone-400 uppercase tracking-widest block">Payment Mode Gateway</span>
              <div className="grid grid-cols-4 gap-1">
                {(["UPI", "CARD", "CASH", "WALLET"] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setSelectedPayment(mode)}
                    className={`py-1 rounded text-[9px] font-semibold transition-all border ${
                      selectedPayment === mode 
                        ? 'bg-stone-900 border-stone-900 text-white' 
                        : 'border-stone-200 bg-white text-stone-600 hover:text-stone-850 hover:border-stone-300'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Total calculations */}
            <div className="space-y-1.5 text-xs pt-2 border-t border-stone-200 text-stone-500 font-minimal">
              <div className="flex justify-between">
                <span>Gross Total:</span>
                <span>₹{subtotal}.00</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Invoice Discounts:</span>
                  <span>-₹{discountAmount}.00</span>
                </div>
              )}
              <div className="flex justify-between text-[10px] text-stone-400">
                <span>GST inclusive tax (18%):</span>
                <span>₹{gstInclusiveAmount}.00</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-stone-900 pt-1.5 border-t border-stone-200">
                <span>Total Amount Paid:</span>
                <span className="text-stone-950 font-bold">₹{netSubtotal}.00</span>
              </div>
            </div>

            <button
              onClick={handleCheckoutSubmit}
              className="w-full mt-3 py-3 bg-stone-900 text-white font-semibold text-xs uppercase tracking-widest rounded-xl hover:bg-stone-850 shadow-xs flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer"
            >
              <CreditCard className="size-4" /> Emit Checkout invoice
            </button>
          </div>
        )}
      </div>

      {/* MOBILE FLOATING CART ACTION BAR */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-md">
          <button
            onClick={() => setIsMobileCartOpen(true)}
            className="w-full bg-stone-900 text-white font-semibold py-4 px-6 rounded-2xl shadow-xl flex items-center justify-between text-xs uppercase tracking-wider cursor-pointer hover:bg-stone-850 active:scale-98 transition-all"
          >
            <span className="flex items-center gap-2">
              <Receipt className="size-4" />
              View Checkout Ticket
            </span>
            <span className="bg-white text-stone-900 px-3 py-1 rounded-full text-[10px] font-bold">
              {cart.reduce((sum, item) => sum + item.qty, 0)} items
            </span>
          </button>
        </div>
      )}
    </>
  );
}
