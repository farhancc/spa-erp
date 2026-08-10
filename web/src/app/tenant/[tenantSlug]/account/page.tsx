"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Calendar, Clock, Award, Shield, User, Smartphone, LogOut, Receipt, Ticket, CheckCircle2, ChevronRight, XCircle, Lock, ShieldAlert, Coins, Gift } from "lucide-react";
import { getTenantBySlug } from "../../../../shared/utils/utils";

interface AppointmentModel {
  id: string;
  serviceName: string;
  stylistName: string;
  date: string;
  time: string;
  price: number;
  status: "CONFIRMED" | "CANCELLED";
}

interface InvoiceHistoryModel {
  id: string;
  date: string;
  items: string;
  paymentMode: string;
  amountPaid: number;
}

export default function TenantCustomerAccount({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const resolvedParams = React.use(params);
  const tenantSlug = resolvedParams.tenantSlug || "luxcuts";

  // Active user session
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<"bookings" | "loyalty" | "rewards">("bookings");

  // Auth form states for fallback login
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authError, setAuthError] = useState("");

  // Profile Form States
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custBirthdate, setCustBirthdate] = useState("");
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [isSavedAlertVisible, setIsSavedAlertVisible] = useState(false);

  // Dynamic Customer Portal Dashboard Data
  const [realInvoices, setRealInvoices] = useState<any[]>([]);
  const [giftCards, setGiftCards] = useState<any[]>([]);
  const [consents, setConsents] = useState<any[]>([]);
  const [loyaltyTransactions, setLoyaltyTransactions] = useState<any[]>([]);
  const [referralCount, setReferralCount] = useState(0);
  const [referralCode, setReferralCode] = useState("");

  // Active Appointments
  const [appointments, setAppointments] = useState<AppointmentModel[]>([]);

  // Invoice History
  const invoiceHistory: InvoiceHistoryModel[] = [];

  useEffect(() => {
    if (typeof window !== "undefined") {
      const sessionKey = `tenant_user_session_${tenantSlug}`;
      const session = localStorage.getItem(sessionKey);
      
      if (session) {
        const user = JSON.parse(session);
        setLoggedInUser(user);
        setCustName(user.name);
        setCustPhone(user.phone);
        setCustEmail(user.email);
        setCustBirthdate(user.birthdate || "1998-10-12");
        setLoyaltyPoints(user.loyaltyPoints !== undefined ? user.loyaltyPoints : 0);

        // Fetch dynamic customer portal dashboard data
        fetch(`/api/customers/${user.id}/portal-dashboard`, {
          headers: { "x-tenant-slug": tenantSlug }
        })
        .then((r) => r.json())
        .then((data) => {
          if (data && !data.error) {
            setRealInvoices(data.invoices || []);
            setGiftCards(data.giftCards || []);
            setConsents(data.consents || []);
            setLoyaltyTransactions(data.loyaltyTransactions || []);
            setReferralCount(data.profile?.referredCount || 0);
            setReferralCode(data.profile?.referralCode || "");
            if (data.profile?.loyaltyPoints !== undefined) {
              setLoyaltyPoints(data.profile.loyaltyPoints);
            }
          }
        })
        .catch((err) => console.error("Failed to load customer portal dashboard:", err));

        // Load dynamically matched bookings from NestJS backend API
        fetch(`/api/bookings?customerId=${user.id}`, {
          headers: { "x-tenant-slug": tenantSlug }
        })
        .then((r) => r.json())
        .then((data) => {
          const list = Array.isArray(data) ? data : (data?.data || []);
          const mapped = list.map((b: any) => ({
            id: b.id,
            serviceName: b.items?.[0]?.service?.name || b.serviceName || "Salon Service",
            stylistName: b.staff?.name || b.stylistName || "Any Stylist",
            date: b.scheduledAt ? b.scheduledAt.split("T")[0] : new Date().toISOString().split("T")[0],
            time: b.scheduledAt ? new Date(b.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "12:00 PM",
            price: b.totalPrice !== undefined && b.totalPrice !== null ? Number(b.totalPrice) : (b.items?.[0]?.service?.price || b.service?.price || 850),
            status: b.status || "CONFIRMED"
          }));
          setAppointments(mapped);
        })
        .catch((err) => {
          console.error("Failed to load customer bookings", err);
          setAppointments([]);
        });
      }
      setIsLoaded(true);
    }
  }, [tenantSlug]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.title = `Membership | ${custName || tenantSlug.toUpperCase()}`;
    }
  }, [custName, tenantSlug]);

  // Download printable/PDF invoice in a new print-optimized window
  const handleDownloadInvoice = (inv: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to download/print the invoice.");
      return;
    }

    const itemsHtml = inv.items?.map((item: any) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px 8px; font-weight: 500; color: #1f2937;">${item.service?.name || item.product?.name || item.name || "Salon Treatment"}</td>
        <td style="padding: 12px 8px; text-align: center; color: #4b5563;">${item.quantity || 1}</td>
        <td style="padding: 12px 8px; text-align: right; color: #1f2937;">₹${item.unitPrice || item.price || 0}.00</td>
        <td style="padding: 12px 8px; text-align: right; font-weight: 600; color: #1f2937;">₹${(item.quantity || 1) * (item.unitPrice || item.price || 0)}.00</td>
      </tr>
    `).join("") || `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px 8px; font-weight: 500; color: #1f2937;">Salon Services</td>
        <td style="padding: 12px 8px; text-align: center; color: #4b5563;">1</td>
        <td style="padding: 12px 8px; text-align: right; color: #1f2937;">₹${inv.totalAmount || inv.amountPaid || 0}.00</td>
        <td style="padding: 12px 8px; text-align: right; font-weight: 600; color: #1f2937;">₹${inv.totalAmount || inv.amountPaid || 0}.00</td>
      </tr>
    `;

    const subtotal = inv.subtotal || inv.totalAmount || inv.amountPaid || 0;
    const discountAmount = inv.discountAmount || 0;
    const gstAmount = inv.gstAmount || 0;
    const totalAmount = inv.totalAmount || inv.amountPaid || 0;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice #${inv.invoiceNumber || inv.id.slice(0, 12)}</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: #ffffff;
            color: #111827;
            margin: 0;
            padding: 40px;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid #e5e7eb;
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #f3f4f6;
            padding-bottom: 30px;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: 800;
            color: #000000;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .invoice-title {
            font-size: 28px;
            font-weight: 900;
            color: #111827;
            text-align: right;
          }
          .invoice-meta {
            text-align: right;
            margin-top: 8px;
            font-size: 13px;
            color: #4b5563;
          }
          .details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
            font-size: 14px;
          }
          .details-section h3 {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #9ca3af;
            margin: 0 0 8px 0;
          }
          .details-section p {
            margin: 0 0 4px 0;
            color: #374151;
            font-weight: 500;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            font-size: 14px;
          }
          th {
            background-color: #f9fafb;
            color: #4b5563;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.05em;
            padding: 12px 8px;
            border-bottom: 2px solid #e5e7eb;
          }
          .totals {
            margin-left: auto;
            width: 300px;
            font-size: 14px;
            border-top: 2px solid #f3f4f6;
            padding-top: 15px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            color: #4b5563;
          }
          .grand-total {
            display: flex;
            justify-content: space-between;
            font-size: 18px;
            font-weight: 800;
            color: #111827;
            padding-top: 10px;
            border-top: 1px solid #e5e7eb;
            margin-top: 10px;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 12px;
            color: #9ca3af;
            border-top: 1px solid #f3f4f6;
            padding-top: 20px;
          }
          @media print {
            body { padding: 0; }
            .container { border: none; box-shadow: none; padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div>
              <div class="logo">${tenantSlug.toUpperCase()}</div>
              <p style="font-size: 13px; color: #4b5563; margin: 4px 0 0 0;">Premium Salon Experience</p>
            </div>
            <div>
              <div class="invoice-title">INVOICE</div>
              <div class="invoice-meta">
                <strong>Invoice #:</strong> ${inv.invoiceNumber || inv.id.slice(0, 12)}<br>
                <strong>Date:</strong> ${inv.createdAt ? inv.createdAt.split("T")[0] : new Date().toISOString().split("T")[0]}
              </div>
            </div>
          </div>

          <div class="details">
            <div class="details-section">
              <h3>Billed To</h3>
              <p>${loggedInUser?.name || "Premium Client"}</p>
              <p>${loggedInUser?.phone || ""}</p>
              <p>${loggedInUser?.email || ""}</p>
            </div>
            <div class="details-section" style="text-align: right;">
              <h3>Payment Method</h3>
              <p>${inv.paymentMethod || "UPI"}</p>
              <p>Status: <span style="color: #059669; font-weight: 700;">PAID</span></p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="text-align: left;">Item Description</th>
                <th style="text-align: center; width: 80px;">Qty</th>
                <th style="text-align: right; width: 120px;">Unit Price</th>
                <th style="text-align: right; width: 120px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>₹${subtotal}.00</span>
            </div>
            ${discountAmount > 0 ? `
            <div class="total-row" style="color: #dc2626;">
              <span>Discounts:</span>
              <span>-₹${discountAmount}.00</span>
            </div>
            ` : ''}
            ${gstAmount > 0 ? `
            <div class="total-row">
              <span>Tax (GST 18%):</span>
              <span>₹${gstAmount}.00</span>
            </div>
            ` : ''}
            <div class="grand-total">
              <span>Grand Total:</span>
              <span>₹${totalAmount}.00</span>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for visiting ${tenantSlug.toUpperCase()}!</p>
            <p>If you have any questions about this invoice, please reach out to our front desk.</p>
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `);

    printWindow.document.close();
  };

  // Cancel dynamic appointment
  const handleCancelAppointment = async (id: string) => {
    if (confirm("Are you sure you want to cancel this appointment?")) {
      try {
        const res = await fetch(`/api/bookings/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-tenant-slug": tenantSlug
          },
          body: JSON.stringify({ action: "cancel", reason: "Cancelled by Customer from Portal" })
        });
        if (res.ok) {
          const updated = appointments.map(a => a.id === id ? { ...a, status: "CANCELLED" as const } : a);
          setAppointments(updated);
        } else {
          const errData = await res.json().catch(() => ({}));
          alert(errData.error || "Failed to cancel booking on the server.");
        }
      } catch (err) {
        console.error("Failed to sync customer cancellation to backend:", err);
        alert("Network error. Backend database offline.");
      }
    }
  };

  // Submit personal info changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined" && loggedInUser?.id) {
      try {
        const res = await fetch(`/api/customers?id=${loggedInUser.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-tenant-slug": tenantSlug
          },
          body: JSON.stringify({
            name: custName,
            phone: custPhone,
            dob: custBirthdate
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && !data.fallback) {
            const updatedSessionData = {
              ...data,
              birthdate: data.dob ? data.dob.split("T")[0] : custBirthdate,
              loyaltyPoints: data.loyaltyPoints || loyaltyPoints
            };
            localStorage.setItem(`tenant_user_session_${tenantSlug}`, JSON.stringify(updatedSessionData));
            setLoggedInUser(updatedSessionData);
            setIsSavedAlertVisible(true);
            setTimeout(() => setIsSavedAlertVisible(false), 3000);
          } else {
            alert("Failed to update profile. Server returned fallback response.");
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          alert(errData.error || "Failed to update profile details.");
        }
      } catch (err) {
        console.error("Failed to sync customer profile changes to backend:", err);
        alert("Network error. Backend database offline.");
      }
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (typeof window !== "undefined") {
      const sessionKey = `tenant_user_session_${tenantSlug}`;

      if (authMode === "signin") {
        try {
          const response = await fetch("/api/customers/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              slug: tenantSlug,
              email: authEmail,
              password: authPassword,
            }),
          });

          const data = await response.json();

          if (response.ok && data.ok && data.customer) {
            const customerData = {
              ...data.customer,
              birthdate: data.customer.dob ? data.customer.dob.split("T")[0] : "1998-10-12",
              loyaltyPoints: data.customer.loyaltyPoints !== undefined ? data.customer.loyaltyPoints : 0,
            };
            localStorage.setItem(sessionKey, JSON.stringify(customerData));
            setLoggedInUser(customerData);
            setCustName(customerData.name);
            setCustPhone(customerData.phone);
            setCustEmail(customerData.email);
            setCustBirthdate(customerData.birthdate);
            setLoyaltyPoints(customerData.loyaltyPoints);

            // Fetch dynamic customer portal dashboard data
            fetch(`/api/customers/${customerData.id}/portal-dashboard`, {
              headers: { "x-tenant-slug": tenantSlug }
            })
            .then((r) => r.json())
            .then((data) => {
              if (data && !data.error) {
                setRealInvoices(data.invoices || []);
                setGiftCards(data.giftCards || []);
                setConsents(data.consents || []);
                setLoyaltyTransactions(data.loyaltyTransactions || []);
                setReferralCount(data.profile?.referredCount || 0);
                setReferralCode(data.profile?.referralCode || "");
                if (data.profile?.loyaltyPoints !== undefined) {
                  setLoyaltyPoints(data.profile.loyaltyPoints);
                }
              }
            })
            .catch((err) => console.error("Failed to load customer portal dashboard:", err));

            // Fetch bookings
            fetch(`/api/bookings?customerId=${customerData.id}`, {
              headers: { "x-tenant-slug": tenantSlug }
            })
            .then((r) => r.json())
            .then((bData) => {
              const list = Array.isArray(bData) ? bData : (bData?.data || []);
              const mapped = list.map((b: any) => ({
                id: b.id,
                serviceName: b.items?.[0]?.service?.name || b.serviceName || "Salon Service",
                stylistName: b.staff?.name || b.stylistName || "Any Stylist",
                date: b.scheduledAt ? b.scheduledAt.split("T")[0] : new Date().toISOString().split("T")[0],
                time: b.scheduledAt ? new Date(b.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "12:00 PM",
                price: b.totalPrice !== undefined && b.totalPrice !== null ? Number(b.totalPrice) : (b.items?.[0]?.service?.price || b.service?.price || 850),
                status: b.status || "CONFIRMED"
              }));
              setAppointments(mapped);
            })
            .catch(() => setAppointments([]));
          } else {
            setAuthError(data.error || "Authentication failed. Incorrect email or password.");
          }
        } catch (err) {
          setAuthError("Failed to connect to authentication server.");
          console.error("Auth error:", err);
        }
      } else {
        // Sign Up
        try {
          const response = await fetch("/api/customers", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-tenant-slug": tenantSlug,
            },
            body: JSON.stringify({
              name: authName,
              phone: authPhone,
              email: authEmail,
              password: authPassword,
              dob: "1998-10-12",
            }),
          });

          const data = await response.json();

          if (response.ok && data && !data.fallback) {
            // Auto-login to set token cookie
            const loginRes = await fetch("/api/customers/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                slug: tenantSlug,
                email: authEmail,
                password: authPassword,
              }),
            });

            if (loginRes.ok) {
              const loginData = await loginRes.json();
              const customerData = {
                ...loginData.customer,
                birthdate: loginData.customer.dob ? loginData.customer.dob.split("T")[0] : "1998-10-12",
                loyaltyPoints: loginData.customer.loyaltyPoints !== undefined ? loginData.customer.loyaltyPoints : 0,
              };
              localStorage.setItem(sessionKey, JSON.stringify(customerData));
              setLoggedInUser(customerData);
              setCustName(customerData.name);
              setCustPhone(customerData.phone);
              setCustEmail(customerData.email);
              setCustBirthdate(customerData.birthdate);
              setLoyaltyPoints(customerData.loyaltyPoints);
              setAppointments([]);
            } else {
              setAuthError("Account created successfully but login failed. Please sign in.");
              setAuthMode("signin");
            }
          } else {
            setAuthError(data.error || "Failed to create account. Check your details.");
          }
        } catch (err) {
          setAuthError("Failed to connect to registration server.");
          console.error("Signup error:", err);
        }
      }
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

  // Periodic customer session verification check (every 5 minutes)
  useEffect(() => {
    if (!loggedInUser) return;

    const verifyCustomerSession = () => {
      fetch("/api/customers/verify-session", {
        headers: { "x-tenant-slug": tenantSlug }
      })
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok) {
          console.warn("Customer session verification failed, logging out.");
          handleLogout();
        }
      })
      .catch((err) => {
        console.warn("Failed to verify customer session:", err);
      });
    };

    const interval = setInterval(verifyCustomerSession, 1000 * 60 * 5);
    return () => clearInterval(interval);
  }, [loggedInUser, tenantSlug]);

  // Customer inactivity auto-logout (15 minutes)
  useEffect(() => {
    if (!loggedInUser) return;

    let timeoutId: NodeJS.Timeout;
    const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.warn("Customer session expired due to inactivity.");
        handleLogout();
      }, INACTIVITY_TIMEOUT);
    };

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    events.forEach((name) => {
      window.addEventListener(name, resetTimer);
    });

    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach((name) => {
        window.removeEventListener(name, resetTimer);
      });
    };
  }, [loggedInUser]);

  if (!isLoaded) {
    return <div className="bg-slate-950 min-h-screen text-slate-500 flex items-center justify-center text-xs font-bold font-mono">Loading Membership Context...</div>;
  }

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen font-sans antialiased selection:bg-rose-500 selection:text-white">
      
      {/* Branded Header */}
      <header className="sticky top-0 z-30 backdrop-blur-md border-b border-slate-900 bg-slate-950/80">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center text-slate-950 font-extrabold">
              {tenantSlug.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight uppercase text-slate-100">
                {tenantSlug.toUpperCase()} MEMBERSHIP
              </span>
              <span className="text-[9px] block text-slate-500 font-bold -mt-0.5 tracking-widest uppercase">Client Control Area</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              href={`/tenant/${tenantSlug}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 text-slate-400 hover:text-slate-300 text-xs font-bold transition-all active:scale-95"
            >
              <span>Storefront</span>
            </Link>
            {loggedInUser && (
              <button 
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/10 hover:bg-rose-950/20 border border-rose-900/10 hover:border-rose-900/20 text-rose-400 text-xs font-bold transition-all active:scale-95 cursor-pointer"
              >
                <LogOut className="size-3.5" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Body Grid */}
      {/* Main Body Grid */}
      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8 text-left">
        {!loggedInUser ? (
          <div className="max-w-md mx-auto bg-slate-900 border border-slate-850 rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden text-slate-100">
            {/* Ambient glows */}
            <div className="absolute top-[-30%] right-[-30%] w-60 h-60 rounded-full bg-rose-500/5 blur-[85px] pointer-events-none" />
            <div className="absolute bottom-[-30%] left-[-30%] w-60 h-60 rounded-full bg-amber-500/5 blur-[85px] pointer-events-none" />

            <div className="space-y-1">
              <span className="text-[9px] bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                {authMode === "signin" ? "Member Access" : "Create Account"}
              </span>
              <h3 className="text-xl font-extrabold text-slate-100 tracking-tight">
                {authMode === "signin" ? "Sign In to Membership" : "Join Outlet Members"}
              </h3>
              <p className="text-[11px] text-slate-500">
                {authMode === "signin" ? `Enter your credentials to access ${tenantSlug.toUpperCase()}` : `Register with ${tenantSlug.toUpperCase()} to schedule slots`}
              </p>
            </div>

            {authError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-455 rounded-xl p-3 text-xs font-bold flex items-center gap-2">
                <ShieldAlert className="size-4 shrink-0 text-rose-500" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs">
              {authMode === "signup" && (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Farhan"
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 focus:border-rose-500/50 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold text-slate-200 outline-none transition-all placeholder:text-slate-700"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">WhatsApp Mobile</label>
                    <div className="relative">
                      <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                      <input
                        type="tel"
                        required
                        placeholder="e.g. +91 99000 88000"
                        value={authPhone}
                        onChange={(e) => setAuthPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 focus:border-rose-500/50 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold text-slate-200 outline-none transition-all placeholder:text-slate-700"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. member@careva.in"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-rose-500/50 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold text-slate-200 outline-none transition-all placeholder:text-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Secure Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-rose-500/50 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold text-slate-200 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-amber-500 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl hover:opacity-95 shadow-lg shadow-rose-500/10 transition-all active:scale-[0.98] cursor-pointer mt-2"
              >
                {authMode === "signin" ? "Verify Credentials" : "Create Brand Account"}
              </button>
            </form>

            <div className="pt-4 border-t border-slate-850 flex justify-between items-center text-[10px]">
              <span className="text-slate-500">
                {authMode === "signin" ? "New to this brand?" : "Already registered?"}
              </span>
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === "signin" ? "signup" : "signin");
                  setAuthError("");
                }}
                className="text-rose-400 hover:text-rose-350 font-bold uppercase tracking-wider bg-transparent border-0 cursor-pointer"
              >
                {authMode === "signin" ? "Create Account" : "Sign In"}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Welcome Section */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/20 border border-slate-900 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-[-30%] right-[-10%] w-48 h-48 rounded-full bg-rose-500/5 blur-[55px] pointer-events-none" />
              <div>
                <h1 className="text-xl md:text-2xl font-extrabold text-slate-100 tracking-tight">Welcome Back, {custName}!</h1>
                <p className="text-xs text-slate-500 mt-1">Manage scheduled slots, loyalty wallet credits, and profile parameters</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Sparkles className="size-3.5 animate-spin duration-3000" />
                Loyalty Tier: VVIP Premium
              </div>
            </div>

            {/* Dashboard Navigation Tabs */}
            <div className="flex border-b border-slate-900 gap-6 text-xs uppercase font-extrabold tracking-wider">
              <button
                onClick={() => setActiveTab("bookings")}
                className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "bookings"
                    ? "border-rose-500 text-rose-400"
                    : "border-transparent text-slate-500 hover:text-slate-350"
                }`}
              >
                <Calendar className="size-3.5" /> Schedules & Invoices
              </button>
              <button
                onClick={() => setActiveTab("loyalty")}
                className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "loyalty"
                    ? "border-rose-500 text-rose-400"
                    : "border-transparent text-slate-500 hover:text-slate-350"
                }`}
              >
                <Coins className="size-3.5" /> Loyalty Wallet
              </button>
              <button
                onClick={() => setActiveTab("rewards")}
                className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "rewards"
                    ? "border-rose-500 text-rose-400"
                    : "border-transparent text-slate-500 hover:text-slate-350"
                }`}
              >
                <Gift className="size-3.5" /> Vouchers & Referrals
              </button>
            </div>

            {/* Dynamic profile columns */}
            <div className="grid grid-cols-12 gap-8">
              
              {/* Left panel: Selected Tab Content */}
              <div className="col-span-12 lg:col-span-8 space-y-8">
                
                {activeTab === "bookings" && (
                  <>
                    {/* Active Bookings Slot Board */}
                    <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-6 shadow-xl space-y-5">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <h2 className="text-base font-bold text-slate-200 flex items-center gap-2">
                          <Calendar className="size-4.5 text-rose-400" />
                          <span>Upcoming Appointment Schedules</span>
                        </h2>
                        <Link
                          href={`/tenant/${tenantSlug}`}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 rounded-lg text-xs font-black hover:opacity-95 transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                        >
                          Book Another Service
                        </Link>
                      </div>

                      <div className="space-y-4">
                        {appointments.length === 0 ? (
                          <div className="text-center py-6 text-slate-500 text-xs italic">
                            No upcoming appointments scheduled yet.
                          </div>
                        ) : (
                          appointments.map(app => (
                            <div 
                              key={app.id}
                              className="p-4 bg-slate-950 border border-slate-850 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-800 transition-all text-xs"
                            >
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-250 text-sm">{app.serviceName}</span>
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider ${
                                    app.status === 'CONFIRMED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  }`}>
                                    {app.status}
                                  </span>
                                </div>
                                <p className="text-slate-500">Stylist: <strong className="text-rose-450">{app.stylistName}</strong> | Value: <strong className="text-slate-350">₹{app.price}</strong></p>
                                
                                <div className="flex items-center gap-3 pt-1 text-[10px] text-slate-650">
                                  <span className="flex items-center gap-1"><Calendar className="size-3" /> {app.date}</span>
                                  <span className="flex items-center gap-1"><Clock className="size-3" /> {app.time}</span>
                                </div>
                              </div>

                              {app.status === "CONFIRMED" && (
                                <button
                                  onClick={() => handleCancelAppointment(app.id)}
                                  className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 hover:border-rose-500/30 text-rose-400 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                                >
                                  <XCircle className="size-3.5" /> Cancel Appointment
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Past Invoices and visit timelines */}
                    <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-6 shadow-xl space-y-5">
                      <h2 className="text-base font-bold text-slate-200 flex items-center gap-2">
                        <Receipt className="size-4.5 text-rose-400" />
                        <span>Past Visit Invoice Ingress</span>
                      </h2>

                      <div className="overflow-x-auto text-xs">
                        {realInvoices.length === 0 ? (
                          <div className="text-center py-6 text-slate-500 text-xs italic">
                            No billing history generated under this customer account.
                          </div>
                        ) : (
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-slate-900 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                                <th className="pb-3 px-2">Invoice Code</th>
                                <th className="pb-3 px-2">Visit Date</th>
                                <th className="pb-3 px-2">Items billed</th>
                                <th className="pb-3 px-2">Payment Mode</th>
                                <th className="pb-3 px-2 text-right">Sum Charged</th>
                                <th className="pb-3 px-2 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-900/60 font-sans">
                              {realInvoices.map((inv: any) => (
                                <tr key={inv.id} className="hover:bg-slate-900/10 transition-colors">
                                  <td className="py-3 px-2 font-mono font-bold text-rose-400">{inv.invoiceNumber || inv.id.slice(0, 12)}</td>
                                  <td className="py-3 px-2 text-slate-400">{inv.createdAt ? inv.createdAt.split("T")[0] : "N/A"}</td>
                                  <td className="py-3 px-2 text-slate-200 font-medium">
                                    {inv.items?.map((item: any) => item.service?.name || item.product?.name).join(", ") || "Salon Treatments"}
                                  </td>
                                  <td className="py-3 px-2">
                                    <span className="px-2 py-0.5 bg-slate-950 border border-slate-900 text-slate-500 rounded text-[9px] uppercase font-bold tracking-wide">
                                      {inv.paymentMethod || "UPI"}
                                    </span>
                                  </td>
                                  <td className="py-3 px-2 text-right font-bold text-slate-200">₹{inv.totalAmount || inv.amountPaid || 0}.00</td>
                                  <td className="py-3 px-2 text-right">
                                    <button
                                      onClick={() => handleDownloadInvoice(inv)}
                                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-850 text-rose-400 hover:text-rose-350 border border-slate-800 hover:border-slate-750 text-[10px] font-bold rounded-lg transition-all active:scale-95 cursor-pointer inline-flex items-center gap-1"
                                    >
                                      <Receipt className="size-3" /> Download
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {activeTab === "loyalty" && (
                  <>
                    {/* Loyalty Wallet Credit Panel */}
                    <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-6 shadow-xl space-y-5">
                      <h3 className="font-bold text-slate-200 flex items-center gap-1.5 text-base">
                        <Award className="size-5 text-rose-400" />
                        <span>Loyalty Points Reward Wallet</span>
                      </h3>

                      <div className="bg-slate-950 p-6 border border-slate-850 rounded-xl space-y-4 font-sans text-center relative overflow-hidden">
                        <div className="absolute top-[-30%] left-[-10%] w-40 h-40 rounded-full bg-emerald-500/5 blur-[45px] pointer-events-none" />
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Available Credits</span>
                          <span className="text-4xl font-black text-emerald-400 mt-1 block">{loyaltyPoints} pts</span>
                        </div>
                        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-850">
                          <div className="bg-rose-500 h-full rounded-full" style={{ width: loyaltyPoints > 0 ? `${Math.min(100, (loyaltyPoints / 1000) * 100)}%` : "0%" }} />
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-550 border-t border-slate-900 pt-3">
                          <span>Redeemable Discount Value:</span>
                          <strong className="text-slate-300">₹{Math.round(loyaltyPoints * 0.5)} discount coupon</strong>
                        </div>
                      </div>
                    </div>

                    {/* Loyalty Point Transactions Ledger */}
                    <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-6 shadow-xl space-y-5">
                      <h3 className="font-bold text-slate-200 flex items-center gap-1.5 text-base">
                        <Award className="size-5 text-rose-400" />
                        <span>Loyalty Points Transactions Ledger</span>
                      </h3>

                      <div className="overflow-x-auto text-xs">
                        {loyaltyTransactions.length === 0 ? (
                          <div className="text-center py-6 text-slate-500 text-xs italic">
                            No point transaction activities recorded.
                          </div>
                        ) : (
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-slate-900 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                                <th className="pb-3 px-2">Date</th>
                                <th className="pb-3 px-2">Type</th>
                                <th className="pb-3 px-2">Points</th>
                                <th className="pb-3 px-2">Description</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-900/60 font-sans">
                              {loyaltyTransactions.map((tx: any) => (
                                <tr key={tx.id} className="hover:bg-slate-900/10 transition-colors">
                                  <td className="py-3 px-2 text-slate-400">{tx.createdAt ? tx.createdAt.split("T")[0] : "N/A"}</td>
                                  <td className="py-3 px-2">
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide ${
                                      tx.type === 'EARN' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    }`}>
                                      {tx.type}
                                    </span>
                                  </td>
                                  <td className={`py-3 px-2 font-bold ${tx.type === 'EARN' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {tx.type === 'EARN' ? '+' : '-'}{tx.points} pts
                                  </td>
                                  <td className="py-3 px-2 text-slate-350">{tx.description || "Point Reward Adjustment"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {activeTab === "rewards" && (
                  <>
                    {/* Referrals copy code widget */}
                    <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-6 shadow-xl space-y-4">
                      <h3 className="font-bold text-slate-200 flex items-center gap-1.5 text-base">
                        <Ticket className="size-5 text-rose-400" />
                        <span>Outlet Referral & Rewards Hub</span>
                      </h3>

                      <div className="bg-slate-950 p-5 border border-slate-850 rounded-xl space-y-4 font-sans">
                        <p className="text-slate-400 text-xs leading-relaxed">
                          Share your referral link with friends! They get an instant discount on their first checkout, and you earn <strong className="text-emerald-450">50 loyalty reward points</strong> once they complete their booking.
                        </p>

                        <div className="flex gap-2 items-center flex-wrap sm:flex-nowrap">
                          <input
                            type="text"
                            readOnly
                            value={referralCode ? `${window.location.origin}/tenant/${tenantSlug}?ref=${referralCode}` : `Ref Code: ${referralCode}`}
                            className="bg-slate-900 border border-slate-850 text-rose-400 font-mono text-[11px] rounded-lg p-2.5 outline-none flex-grow"
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/tenant/${tenantSlug}?ref=${referralCode}`);
                              alert("Referral link copied to clipboard!");
                            }}
                            className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 text-rose-400 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                          >
                            Copy Link
                          </button>
                        </div>

                        <div className="flex gap-6 text-xs text-slate-500 pt-2 border-t border-slate-900">
                          <div>
                            Referred Friends: <strong className="text-slate-350 font-bold">{referralCount}</strong>
                          </div>
                          <div>
                            Credits Earned: <strong className="text-emerald-400 font-bold">{referralCount * 50} pts</strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Active Gift Cards Grid */}
                    <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-6 shadow-xl space-y-5">
                      <h3 className="font-bold text-slate-200 flex items-center gap-1.5 text-base">
                        <Ticket className="size-5 text-rose-400" />
                        <span>Active Gift Card Vouchers</span>
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {giftCards.length === 0 ? (
                          <div className="col-span-2 text-center py-6 text-slate-500 text-xs italic">
                            No gift cards purchased or received.
                          </div>
                        ) : (
                          giftCards.map((gc: any) => (
                            <div
                              key={gc.id}
                              className="p-4 bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-850 rounded-xl relative overflow-hidden space-y-3 font-sans"
                            >
                              <div className="absolute top-[-30%] right-[-10%] w-24 h-24 rounded-full bg-rose-500/5 blur-[25px] pointer-events-none" />
                              <div className="flex justify-between items-center">
                                <span className="font-mono text-xs font-bold text-rose-400 tracking-wider uppercase">{gc.code}</span>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold tracking-wider ${
                                  gc.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                }`}>
                                  {gc.status}
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 block">Active Value Balance</span>
                                <span className="text-xl font-extrabold text-slate-200">₹{gc.balance || gc.initialValue}</span>
                              </div>
                              <div className="text-[10px] text-slate-550 pt-2 border-t border-slate-900 flex justify-between">
                                <span>Initial Worth: ₹{gc.initialValue}</span>
                                <span>Valid till: {gc.validUntil ? gc.validUntil.split("T")[0] : "Never Expires"}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Signed Treatment Consent Forms */}
                    <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-6 shadow-xl space-y-5">
                      <h3 className="font-bold text-slate-200 flex items-center gap-1.5 text-base">
                        <Shield className="size-5 text-rose-400" />
                        <span>Signed Treatment Consent Forms</span>
                      </h3>

                      <div className="overflow-x-auto text-xs">
                        {consents.length === 0 ? (
                          <div className="text-center py-6 text-slate-500 text-xs italic">
                            No dynamic treatment consents signed yet.
                          </div>
                        ) : (
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-slate-900 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                                <th className="pb-3 px-2">Category Form</th>
                                <th className="pb-3 px-2">Signed Date</th>
                                <th className="pb-3 px-2">IP Verified</th>
                                <th className="pb-3 px-2 text-right">Consent ID</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-900/60 font-sans">
                              {consents.map((c: any) => (
                                <tr key={c.id} className="hover:bg-slate-900/10 transition-colors">
                                  <td className="py-3 px-2 text-slate-200 font-bold">{c.template?.category || "Chemical Treatment"}</td>
                                  <td className="py-3 px-2 text-slate-400">{c.signedAt ? c.signedAt.split("T")[0] : "N/A"}</td>
                                  <td className="py-3 px-2 font-mono text-slate-500">{c.ipAddress || "Verified"}</td>
                                  <td className="py-3 px-2 text-right font-mono text-rose-400">{c.id.slice(0, 10)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  </>
                )}

              </div>

              {/* Right panel: Profile Settings Form */}
              <div className="col-span-12 lg:col-span-4 space-y-8">
                
                {/* Profile parameters settings form */}
                <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-6 shadow-xl space-y-5">
                  <h3 className="font-bold text-slate-200 flex items-center gap-1.5">
                    <User className="size-5 text-rose-400" />
                    <span>Profile Parameters</span>
                  </h3>

                  <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                    {isSavedAlertVisible && (
                      <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="size-4" /> Parameters saved successfully!
                      </div>
                    )}

                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Your Full Name</label>
                      <input 
                        type="text"
                        required
                        value={custName || ""}
                        onChange={(e) => setCustName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 focus:border-slate-700 rounded-lg p-2.5 text-xs font-semibold text-slate-200 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">WhatsApp Mobile</label>
                      <input 
                        type="text"
                        required
                        value={custPhone || ""}
                        onChange={(e) => setCustPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 focus:border-slate-700 rounded-lg p-2.5 text-xs font-semibold text-slate-200 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Active Email</label>
                      <input 
                        type="email"
                        required
                        value={custEmail || ""}
                        onChange={(e) => setCustEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 focus:border-slate-700 rounded-lg p-2.5 text-xs font-semibold text-slate-200 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Birthday (For Retainer Auto-coupons)</label>
                      <input 
                        type="date"
                        required
                        value={custBirthdate || ""}
                        onChange={(e) => setCustBirthdate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 focus:border-slate-700 rounded-lg p-2.5 text-xs font-semibold text-slate-200 outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 font-extrabold text-xs uppercase tracking-widest rounded-lg hover:opacity-95 shadow-md shadow-rose-500/10 flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                    >
                      Update Parameters
                    </button>
                  </form>
                </div>

              </div>
            </div>
          </>
        )}
      </main>

    </div>
  );
}
