"use client";

import React, { useState, useEffect } from "react";
import LocaleMap from "@/components/LocaleMap";
import { supabase } from "@/lib/supabase";
import { MapPin, ShieldCheck, Footprints, AlertTriangle, CheckCircle2, Navigation, FileSearch, Droplets, Wind, Truck, Search, LogOut, LayoutDashboard, RefreshCw, Clock, LocateFixed, ShieldAlert, Building2 } from "lucide-react";
import { submitPhone } from "@/app/actions/onboarding";

export default function HomePage() {
  const [coords, setCoords] = useState({ lat: 12.9784, lng: 77.6408 });
  const [activeTab, setActiveTab] = useState<"commute" | "audit" | "dashboard">("commute");

  // Auth & Search
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [authTermsAccepted, setAuthTermsAccepted] = useState(false);
  const [paywallTermsAccepted, setPaywallTermsAccepted] = useState(false);

  const [isLocating, setIsLocating] = useState(false);
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  // Phone Onboarding State
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const handlePhoneSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPhoneLoading(true);
    setPhoneError("");
    
    const formData = new FormData(e.currentTarget);
    
    // Grab the 10 digits and force the country code so Supabase accepts it
    const rawPhone = formData.get("phone") as string;
    formData.set("phone", "+91" + rawPhone); 
    
    formData.append("token", session.access_token); 
    
    try {
      const res = await submitPhone(formData);
      if (res?.error) {
        setPhoneError(res.error);
      } else {
        const { data } = await supabase.auth.refreshSession();
        if (data.session) setSession(data.session);
      }
    } catch (err) {
      setPhoneError("An unexpected error occurred.");
    }
    setPhoneLoading(false);
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        handleLocationSelect(position.coords.latitude, position.coords.longitude);
        setIsLocating(false);
      },
      (error) => {
        console.error(error);
        alert("Unable to retrieve your location. Please check your browser permissions.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true } // Forces GPS over IP-based location for accuracy
    );
  };

  // Dashboard State
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  // Paywall State
  const [paywall, setPaywall] = useState<{feature: 'commute' | 'audit', retry: () => void} | null>(null);

  // Tools State
  const [category, setCategory] = useState("transit");
  const [claimedMins, setClaimedMins] = useState(5);
  const [commuteResult, setCommuteResult] = useState<any>(null);
  const [loadingCommute, setLoadingCommute] = useState(false);
  const [commuteError, setCommuteError] = useState<string | null>(null);

  const [auditResult, setAuditResult] = useState<any>(null);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  const fetchDashboardData = async () => {
    if (!session?.user?.id) return;
    setDashboardLoading(true);
    try {
      const res = await fetch(`/api/user-history?userId=${session.user.id}`);
      const data = await res.json();
      setDashboardData(data);
    } catch (err) {
      console.error("Failed to load dashboard data");
    } finally {
      setDashboardLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "dashboard" && session && session.user?.phone?.trim() !== "") {
      fetchDashboardData();
    }
  }, [activeTab, session]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      alert(error.message);
    } else {
      setAuthTermsAccepted(false);
    }
    setAuthLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    setAuthLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
    if (error) alert(error.message);
    setAuthLoading(false);
  };

  const handleSignOut = async () => await supabase.auth.signOut();

  const handleLocationSelect = (lat: number, lng: number) => {
    setCoords({ lat, lng });
    setCommuteResult(null);
    setCommuteError(null);
    setAuditResult(null);
    setAuditError(null);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) handleLocationSelect(parseFloat(data[0].lat), parseFloat(data[0].lon));
      else alert("Location not found.");
    } catch (err) {
      alert("Search failed.");
    }
  };

  const saveToHistory = async (type: string, data: any) => {
    if (!session) return;
    await supabase.from('user_history').insert([
      { user_id: session.user.id, search_type: type, lat: coords.lat, lng: coords.lng, report_data: data }
    ]);
    if (activeTab === 'dashboard') fetchDashboardData();
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (bundle: 'single' | 'shortlist') => {
    if (!paywall || !session) return;
    const res = await loadRazorpayScript();
    if (!res) return alert("Razorpay SDK failed to load.");

    const orderRes = await fetch('/api/create-order', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bundle })
    });
    const order = await orderRes.json();

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: "LocaleProof",
      description: bundle === 'shortlist' ? "5x Shortlist Bundle" : "Premium Credits",
      order_id: order.id,
      handler: async function (response: any) {
        setPaywall(null);
        setPaywallTermsAccepted(false);
        if (paywall.feature === 'audit') setLoadingAudit(true);
        if (paywall.feature === 'commute') setLoadingCommute(true);
        
        try {
          const verifyRes = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...response, featureType: paywall.feature, userId: session.user.id, bundle })
          });
          const data = await verifyRes.json();
          if (data.error) throw new Error(data.error);
          
          paywall.retry(); 
        } catch (err: any) {
          alert("Payment verification failed.");
          setLoadingAudit(false);
          setLoadingCommute(false);
        }
      },
      prefill: { email: session.user.email },
      theme: { color: "#2563eb" },
    };

    const paymentObject = new (window as any).Razorpay(options);
    paymentObject.open();
  };

  const verifyCommute = async (forceRefresh = false) => {
    if (!session?.user?.id) return alert("Session expired.");
    setLoadingCommute(true);
    setCommuteError(null);
    try {
      const url = `/api/commute-verify?startLat=${coords.lat}&startLng=${coords.lng}&category=${category}&claimedMinutes=${claimedMins}&userId=${session.user.id}&forceRefresh=${forceRefresh}`;
      const res = await fetch(url);
      const json = await res.json();
      
      if (json.paymentRequired) {
        setLoadingCommute(false);
        setPaywall({ feature: 'commute', retry: () => verifyCommute(forceRefresh) });
        return;
      }
      
      if (!res.ok) throw new Error(json.error || "Verification failed");
      setCommuteResult(json);
      
      if (forceRefresh || !json.source) {
        await saveToHistory('commute', { ...json, category }); 
      }
    } catch (err: any) {
      setCommuteError(err.message);
    } finally {
      setLoadingCommute(false);
    }
  };

  const generateAudit = async (forceRefresh = false) => {
    if (!session?.user?.id) return alert("Session expired.");
    setLoadingAudit(true);
    setAuditError(null);
    try {
      const url = `/api/neighborhood-score?lat=${coords.lat}&lng=${coords.lng}&userId=${session.user.id}&forceRefresh=${forceRefresh}`;
      const res = await fetch(url);
      const json = await res.json();
      
      if (json.paymentRequired) {
        setLoadingAudit(false);
        setPaywall({ feature: 'audit', retry: () => generateAudit(forceRefresh) });
        return;
      }
      
      if (!res.ok) throw new Error(json.error || "Audit generation failed");
      setAuditResult(json.report);
      
      if (forceRefresh || json.source !== 'history') {
        await saveToHistory('audit', json.report);
      }
    } catch (err: any) {
      setAuditError(err.message);
    } finally {
      setLoadingAudit(false);
    }
  };

  const timeAgo = (dateStr: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    let interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "Just now";
  };

  const handleDashboardAction = (item: any, action: 'view' | 'update') => {
    setCoords({ lat: item.lat, lng: item.lng });
    
    if (item.search_type === 'audit') {
      setActiveTab('audit');
      if (action === 'view') {
        setAuditResult(item.report_data);
      } else {
        setAuditResult(null);
        generateAudit(true);
      }
    } else {
      setActiveTab('commute');
      setCategory(item.report_data.category || 'transit');
      if (action === 'view') {
        setCommuteResult(item.report_data);
      } else {
        setCommuteResult(null);
        verifyCommute(true);
      }
    }
  };

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const hasVerifiedPhone = session?.user?.phone && session.user.phone.trim() !== "";

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg"><ShieldCheck className="w-6 h-6 text-white" /></div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">LocaleProof</h1>
              <p className="text-xs text-slate-400">Neighborhood Quality Engine</p>
            </div>
          </div>
          <form onSubmit={handleSearch} className="hidden md:flex items-center relative w-80">
            <input type="text" placeholder="Search global location..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition" />
            <Search className="w-4 h-4 text-slate-500 absolute left-3" />
            <button type="submit" className="hidden">Search</button>
          </form>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button 
              onClick={handleLocateMe} 
              disabled={isLocating}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 p-1.5 rounded-lg text-slate-300 transition disabled:opacity-50 disabled:animate-pulse"
              title="Use Current Location"
            >
              <LocateFixed className="w-4 h-4 text-blue-400" />
            </button>
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300">
              <MapPin className="w-4 h-4 text-blue-400" />
              <span>{coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</span>
            </div>
          </div>
          
          {session && (
            <button onClick={handleSignOut} className="text-slate-400 hover:text-slate-200 transition" title="Sign Out">
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
        <div className="lg:col-span-7 flex flex-col h-[525px]">
          <LocaleMap
            lat={coords.lat}
            lng={coords.lng}
            onLocationSelect={handleLocationSelect}
            routeGeoJson={activeTab === "commute" ? commuteResult?.routeGeoJson : null}
            destinationCoords={activeTab === "commute" ? commuteResult?.destinationCoords : null}
            destinationName={activeTab === "commute" ? commuteResult?.nearestName : null}
          />
        </div>

        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden h-[525px]">
          {!session ? (
            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
              <ShieldCheck className="w-12 h-12 text-blue-500" />
              <h2 className="text-2xl font-bold text-slate-100">Sign in to LocaleProof</h2>
              <p className="text-sm text-slate-400 mt-2 mb-8">Access the Commute Verifier and Neighborhood Quality Audits.</p>
              
              <div className="w-full max-w-sm space-y-4">
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500" required />
                  <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500" required />

                  <div className="flex items-start gap-2">
                    <input type="checkbox" id="auth-terms" checked={authTermsAccepted} onChange={(e) => setAuthTermsAccepted(e.target.checked)} className="shrink-0" />
                    <label htmlFor="auth-terms" className="text-xs text-slate-400 leading-tight">
                      I agree to the <a href="/terms" className="text-blue-400 hover:underline" target="_blank">Terms of Service</a> and <a href="/privacy" className="text-blue-400 hover:underline" target="_blank">Privacy Policy</a>.
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={handleSignIn} disabled={authLoading || !authTermsAccepted} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg text-sm disabled:opacity-50">Sign In</button>
                    <button onClick={handleSignUp} disabled={authLoading || !authTermsAccepted} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 rounded-lg text-sm disabled:opacity-50 border border-slate-700">Create Account</button>
                  </div>
                </form>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-slate-800"></div>
                  <span className="flex-shrink-0 mx-4 text-xs text-slate-500 uppercase tracking-wider">Or</span>
                  <div className="flex-grow border-t border-slate-800"></div>
                </div>

                <button onClick={handleGoogleSignIn} disabled={authLoading || !authTermsAccepted} className="w-full bg-slate-100 hover:bg-white text-slate-900 font-semibold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition disabled:opacity-50">
                  Continue with Google
                </button>
              </div>
            </div>
          ) : !hasVerifiedPhone ? (
            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
              <ShieldAlert className="w-12 h-12 text-blue-500 mb-4" />
              <h2 className="text-2xl font-bold text-slate-100">Claim Your 2 Free Credits</h2>
              <p className="text-sm text-slate-400 mt-2 mb-8">
                To prevent spam, please verify your unique mobile number to unlock the dashboard.
              </p>
              
              <form onSubmit={handlePhoneSubmit} className="w-full max-w-sm space-y-4">
              <input 
                    type="tel" 
                    name="phone" 
                    required 
                    minLength={10}
                    maxLength={10}
                    pattern="[0-9]{10}"
                    title="Please enter exactly 10 digits"
                    placeholder="9876543210"
                    onInput={(e) => {
                      // Instantly strip any non-numbers and enforce max 10 chars
                      e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '').slice(0, 10);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 pl-10 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                {phoneError && <p className="text-red-400 text-xs">{phoneError}</p>}
                <button 
                  type="submit" 
                  disabled={phoneLoading} 
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg text-sm transition disabled:opacity-50"
                >
                  {phoneLoading ? "Verifying & Unlocking..." : "Unlock Dashboard"}
                </button>
              </form>
            </div>
          ) : (
            <>
              <div className="flex border-b border-slate-800 shrink-0">
                <button onClick={() => setActiveTab("commute")} className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition ${activeTab === "commute" ? "bg-slate-800 text-blue-400 border-b-2 border-blue-500" : "text-slate-400 hover:text-slate-200"}`}><Footprints className="w-4 h-4" /> Commute</button>
                <button onClick={() => setActiveTab("audit")} className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition ${activeTab === "audit" ? "bg-slate-800 text-emerald-400 border-b-2 border-emerald-500" : "text-slate-400 hover:text-slate-200"}`}><FileSearch className="w-4 h-4" /> Audit</button>
                <button onClick={() => setActiveTab("dashboard")} className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition ${activeTab === "dashboard" ? "bg-slate-800 text-purple-400 border-b-2 border-purple-500" : "text-slate-400 hover:text-slate-200"}`}><LayoutDashboard className="w-4 h-4" /> History</button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                {activeTab === "dashboard" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-semibold">Your Analytics Dashboard</h2>
                      <p className="text-sm text-slate-400 mt-1">Review your past data. View past reports for free, or force an update using a credit.</p>
                    </div>

                    {dashboardLoading ? (
                      <div className="text-sm text-slate-500 animate-pulse text-center py-10">Loading your history...</div>
                    ) : dashboardData ? (
                      <>
                        <div className="mb-6">
                          <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 flex flex-col items-center relative overflow-hidden">
                            <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-500"></div>
                            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Available Credit Balance</span>
                            <span className="text-5xl font-black text-white mt-3 mb-1">{dashboardData.quotas.remaining}</span>
                            <span className="text-xs text-slate-500">Spend on either Audits or Commutes</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {dashboardData.reports.map((item: any) => (
                            <div key={item.id} className="bg-slate-950 border border-slate-800 p-4 rounded-lg flex flex-col gap-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${item.search_type === 'audit' ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/50' : 'bg-blue-950/50 text-blue-400 border border-blue-800/50'}`}>
                                    {item.search_type === 'audit' ? 'Neighborhood Audit' : 'Commute Verification'}
                                  </span>
                                  <p className="text-sm font-semibold text-slate-200 mt-2">
                                    {item.search_type === 'audit' ? item.report_data.neighborhoodName : `Claimed: ${item.report_data.claimedMinutes} mins to ${item.report_data.category}`}
                                  </p>
                                </div>
                                <div className="flex items-center text-[10px] text-slate-500 gap-1">
                                  <Clock className="w-3 h-3" /> {timeAgo(item.created_at)}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => handleDashboardAction(item, 'view')} className="flex-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs py-2 rounded transition">
                                  View Free
                                </button>
                              </div>
                            </div>
                          ))}
                          {dashboardData.reports.length === 0 && (
                            <div className="text-center text-sm text-slate-500 py-10">No history found yet.</div>
                          )}
                        </div>
                      </>
                    ) : null}
                  </div>
                )}
                
                {activeTab === "commute" && (
                   <div className="space-y-6">
                   <div>
                     <h2 className="text-lg font-semibold">Expose Ad Claims vs. Actual Walking</h2>
                     <p className="text-sm text-slate-400 mt-1">Test builder marketing claims against true pedestrian routing.</p>
                   </div>

                   <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-4">
                     <div>
                       <label className="block text-xs font-medium text-slate-400 mb-1">Service Category to Locate</label>
                       <select value={category} onChange={(e) => { setCategory(e.target.value); setCommuteResult(null); }} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200">
                        <optgroup label="Civic & Transit">
                          <option value="transit">Nearest Metro / Train Station</option>
                          <option value="bus">Nearest Bus Stop</option>
                          <option value="school">Nearest School / College</option>
                          <option value="hospital">Nearest Hospital / Clinic / Doctor</option>
                          <option value="park">Nearest Park / Playground</option>
                          <option value="worship">Nearest Place of Worship</option>
                        </optgroup>
                        <optgroup label="Daily Essentials">
                          <option value="grocery">Nearest Grocery / Supermarket</option>
                          <option value="pharmacy">Nearest Pharmacy</option>
                          <option value="gym">Nearest Gym / Fitness Center</option>
                          <option value="bank">Nearest Bank / ATM</option>
                          <option value="restaurant">Nearest Restaurant / Cafe</option>
                        </optgroup>
                      </select>
                     </div>

                     <div>
                       <label className="block text-xs font-medium text-slate-400 mb-1">Claimed Walk Time (Minutes)</label>
                       <input type="number" value={claimedMins} onChange={(e) => setClaimedMins(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200" min="1" max="60" />
                     </div>

                     <button onClick={() => verifyCommute(false)} disabled={loadingCommute} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                       {loadingCommute ? "Routing..." : "Locate & Verify Claim"}
                     </button>
                   </div>

                   {commuteError && <div className="p-3 bg-red-950/40 border border-red-800 rounded-lg text-xs text-red-300">{commuteError}</div>}

                   {commuteResult && (
                     <div className={`p-4 rounded-lg border space-y-3 ${commuteResult.isExaggerated ? "bg-red-950/30 border-red-900/50" : "bg-emerald-950/30 border-emerald-900/50"}`}>
                       <div className="flex items-center justify-between">
                         <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Audit Verdict</span>
                         {commuteResult.isExaggerated ? (
                           <span className="flex items-center gap-1.5 text-xs font-medium text-red-400 bg-red-950 px-2.5 py-1 rounded-full border border-red-800"><AlertTriangle className="w-3.5 h-3.5" /> Exaggerated Claim</span>
                         ) : (
                           <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-800"><CheckCircle2 className="w-3.5 h-3.5" /> Accurate Claim</span>
                         )}
                       </div>
                       <div className="bg-slate-950/90 p-3 rounded border border-slate-800 flex items-start gap-2.5">
                         <Navigation className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                         <div>
                           <span className="text-[11px] uppercase tracking-wider text-slate-500 block">Closest Discovered Facility</span>
                           <span className="text-sm font-semibold text-slate-100">{commuteResult.nearestName}</span>
                         </div>
                       </div>
                       <div className="grid grid-cols-2 gap-3">
                         <div className="bg-slate-950 p-3 rounded border border-slate-800/80">
                           <span className="text-xs text-slate-500 block">Builder Claim</span>
                           <span className="text-lg font-bold text-slate-200">{commuteResult.claimedMinutes} mins</span>
                         </div>
                         <div className="bg-slate-950 p-3 rounded border border-slate-800/80">
                           <span className="text-xs text-slate-500 block">Actual Peak Walk</span>
                           <span className={`text-lg font-bold ${commuteResult.isExaggerated ? "text-red-400" : "text-emerald-400"}`}>{commuteResult.realisticPeakMinutes} mins</span>
                         </div>
                       </div>
                     </div>
                   )}
                 </div>
                )}
                
                {activeTab === "audit" && (
                  <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold">Deep-Dive Quality Dossier</h2>
                    <p className="text-sm text-slate-400 mt-1">Generate an AI-powered diagnostic covering utilities, climate risk, and serviceability.</p>
                  </div>

                  {!auditResult && (
                    <button onClick={() => generateAudit(false)} disabled={loadingAudit} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                      <FileSearch className="w-5 h-5" />
                      {loadingAudit ? "Synthesizing Neighborhood Data..." : "Generate Neighborhood Audit"}
                    </button>
                  )}

                  {auditError && <div className="p-3 bg-red-950/40 border border-red-800 rounded-lg text-xs text-red-300">{auditError}</div>}

                  {auditResult && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="flex items-center justify-between bg-slate-950 p-4 rounded-lg border border-slate-800">
                        <div>
                          <span className="text-xs text-slate-500 uppercase tracking-wider block">Location</span>
                          <span className="text-lg font-bold text-blue-400">{auditResult.neighborhoodName}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-500 uppercase tracking-wider block">Livability Score</span>
                          <span className="text-2xl font-black text-emerald-400">{auditResult.overallScore}/100</span>
                        </div>
                      </div>
                      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-sm text-slate-300 leading-relaxed italic border-l-4 border-l-blue-500">
                        "{auditResult.executiveSummary}"
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                          <div className="flex items-center gap-2 text-blue-400 mb-1"><Droplets className="w-4 h-4"/> <span className="font-semibold text-sm">Utilities</span></div>
                          <p className="text-xs text-slate-400"><strong className="text-slate-200">Water:</strong> {auditResult.utilities.waterAvailability}</p>
                          <p className="text-xs text-slate-400"><strong className="text-slate-200">Power:</strong> {auditResult.utilities.powerOutageFrequency}</p>
                        </div>
 
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                          <div className="flex items-center gap-2 text-emerald-400 mb-1"><Wind className="w-4 h-4"/> <span className="font-semibold text-sm">Environment</span></div>
                          <p className="text-xs text-slate-400"><strong className="text-slate-200">Live AQI:</strong> {auditResult.environment.aqiAverage}</p>
                          <p className="text-xs text-slate-400"><strong className="text-slate-200">Monsoon:</strong> {auditResult.environment.monsoonVulnerability}</p>
                        </div>

                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                          <div className="flex items-center gap-2 text-rose-400 mb-1"><ShieldAlert className="w-4 h-4"/> <span className="font-semibold text-sm">Security</span></div>
                          <p className="text-xs text-slate-400 leading-relaxed">{auditResult.security?.crimeIndex || "Data unavailable"}</p>
                        </div>

                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                          <div className="flex items-center gap-2 text-purple-400 mb-1"><Building2 className="w-4 h-4"/> <span className="font-semibold text-sm">Development</span></div>
                          <p className="text-xs text-slate-400 leading-relaxed">{auditResult.development?.futureInfrastructure || "Data unavailable"}</p>
                        </div>
                      </div>

                      <button onClick={() => setAuditResult(null)} className="w-full py-2 text-xs text-slate-500 hover:text-slate-300">Clear Report</button>
                    </div>
                  )}
                </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Paywall Overlay */}
      {paywall && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-2">Free Limit Reached</h2>
            <p className="text-slate-400 text-sm mb-4">Upgrade to unlock deeper insights and bypass builder marketing claims.</p>
            
            <div className="flex items-start gap-2 mb-6 bg-slate-950 p-3 rounded-lg border border-slate-800">
              <input type="checkbox" id="paywall-terms" checked={paywallTermsAccepted} onChange={(e) => setPaywallTermsAccepted(e.target.checked)} className="mt-0.5 shrink-0" />
              <label htmlFor="paywall-terms" className="text-xs text-slate-400 leading-tight">
                I accept the <a href="/terms" className="text-blue-400 hover:underline" target="_blank">Terms of Service</a> and <a href="/refund" className="text-blue-400 hover:underline" target="_blank">Cancellation & Refund Policy</a> (No refunds for used credits).
              </label>
            </div>
            
            <div className="space-y-4">
              <button onClick={() => handlePayment('single')} disabled={!paywallTermsAccepted} className="w-full flex items-center justify-between p-4 rounded-lg border border-slate-700 bg-slate-800 hover:border-blue-500 hover:bg-slate-800/80 transition text-left disabled:opacity-50 disabled:cursor-not-allowed">
                <div>
                  <span className="block font-semibold text-slate-200">Single Report</span>
                  <span className="text-xs text-slate-400">Unlock this exact location</span>
                </div>
                <span className="font-bold text-blue-400">₹49</span>
              </button>
              
              <button onClick={() => handlePayment('shortlist')} disabled={!paywallTermsAccepted} className="w-full flex items-center justify-between p-4 rounded-lg border border-emerald-700 bg-emerald-900/20 hover:border-emerald-500 hover:bg-emerald-900/40 transition text-left relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed">
                <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">POPULAR</div>
                <div>
                  <span className="block font-semibold text-emerald-400">Shortlist Bundle</span>
                  <span className="text-xs text-emerald-500/70">5 Premium Reports (Save 40%)</span>
                </div>
                <span className="font-bold text-emerald-400">₹149</span>
              </button>
            </div>
            <button onClick={() => setPaywall(null)} className="w-full mt-6 text-sm text-slate-500 hover:text-slate-300">Cancel</button>
          </div>
        </div>
      )}

      <footer className="mt-0 py-2 border-t border-slate-800 text-center text-xs text-slate-500">
        <div className="flex flex-wrap justify-center gap-4">
          <a href="/terms" className="hover:text-blue-400 transition">Terms of Service</a>
          <a href="/privacy" className="hover:text-blue-400 transition">Privacy Policy</a>
          <a href="/refund" className="hover:text-blue-400 transition">Cancellation & Refunds</a>
          <a href="mailto:support@localeproof.com" className="hover:text-blue-400 transition">Contact Us</a>
        </div>
        <p>© {currentYear || 2026} LocaleProof. All rights reserved.</p>
        <p className="mt-0">
        Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline">OpenStreetMap</a> contributors. 
        Routing by <a href="https://openrouteservice.org/" target="_blank" rel="noreferrer" className="underline">OpenRouteService</a>.
        </p>
      </footer>
    </main>
  );
}