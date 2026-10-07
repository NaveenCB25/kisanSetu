import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { centersAPI, queueAPI } from '../services/api';
import {
  HiOutlineClock,
  HiArrowRight,
  HiCheck,
  HiLightningBolt,
  HiUser,
  HiBadgeCheck,
  HiChartBar,
  HiCheckCircle,
} from 'react-icons/hi';

// Feature Images
import heroBannerImg from '../assets/hero_banner.png';
import slotBookingImg from '../assets/slot_booking.png';
import liveQueueImg from '../assets/live_queue.png';
import weighmentImg from '../assets/weighment.png';
import notificationsImg from '../assets/notifications.png';

export default function LandingPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [centers, setCenters] = useState([]);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [queueData, setQueueData] = useState(null);

  useEffect(() => {
    centersAPI
      .getAll()
      .then((res) => {
        if (res.data?.success && res.data.data.length > 0) {
          setCenters(res.data.data);
          setSelectedCenter(res.data.data[0]);
        }
      })
      .catch((err) => console.log('Notice: centers load deferred', err));
  }, []);

  useEffect(() => {
    if (selectedCenter?._id) {
      queueAPI
        .getCenterQueue(selectedCenter._id)
        .then((res) => {
          if (res.data?.success) {
            setQueueData(res.data.data);
          }
        })
        .catch(console.error);
    }
  }, [selectedCenter]);

  // Demo one-click logins for hackathon evaluation
  const handleQuickDemo = async (role) => {
    let credentials = {
      farmer: { mobile: '9811111111', password: 'farmer123' },
      operator: { mobile: '9111111111', password: 'operator123' },
      admin: { mobile: '9999999999', password: 'admin123' },
    }[role];

    try {
      await login(credentials);
      if (role === 'farmer') navigate('/farmer/dashboard');
      else if (role === 'operator') navigate('/operator/dashboard');
      else if (role === 'admin') navigate('/admin/dashboard');
    } catch (err) {
      navigate('/login?role=' + role);
    }
  };

  return (
    <div className="min-h-screen space-y-12 pb-16 bg-slate-50 text-slate-800">
      {/* ── 1. HERO SECTION ───────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-emerald-50 via-white to-slate-50 pt-10 pb-14 border-b border-slate-200">
        <div className="ks-container">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                Government of India Procurement Automation
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Predictable, Transparent & <br className="hidden sm:inline" />
                <span className="text-emerald-700">Dignified Mandi Procurement</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Eliminate long overnight waiting lines. Book guaranteed procurement time slots, track live tractor queue status in your regional language, and receive instant digital weighment slips.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                <Link to="/farmer/book" className="ks-btn-primary text-sm">
                  <span>Book Procurement Slot</span>
                  <HiArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/queue" className="ks-btn-secondary text-sm">
                  <HiOutlineClock className="w-4 h-4" />
                  <span>View Live Queue</span>
                </Link>
              </div>

              {/* Quick highlights */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200 max-w-lg mx-auto lg:mx-0 text-left">
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase">Average Wait</div>
                  <div className="text-base font-extrabold text-slate-900 mt-0.5">38 Mins</div>
                  <div className="text-[10px] text-emerald-700 font-semibold">(Down from 14+ hrs)</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase">Official MSP</div>
                  <div className="text-base font-extrabold text-slate-900 mt-0.5">₹2,275 / Qtl</div>
                  <div className="text-[10px] text-slate-500 font-semibold">Direct Bank Payout</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase">Supported Languages</div>
                  <div className="text-base font-extrabold text-slate-900 mt-0.5">9 Languages</div>
                  <div className="text-[10px] text-slate-500 font-semibold">SMS & Web Alerts</div>
                </div>
              </div>
            </div>

            {/* Right Hero Image */}
            <div className="lg:col-span-5">
              <div className="ks-card overflow-hidden relative shadow-sm">
                <img
                  src={heroBannerImg}
                  alt="KisanSetu Smart Mandi Procurement"
                  className="w-full h-[340px] object-cover"
                />
                <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Indore Central Mandi</div>
                    <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                      <HiCheckCircle className="w-3.5 h-3.5" /> Mandi Operations Active
                    </div>
                  </div>
                  <span className="ks-badge ks-badge-green font-bold">MSP Wheat</span>
                </div>
              </div>
            </div>
          </div>

          {/* SIH Hackathon Evaluator Quick Role Access */}
          <div className="mt-10 ks-card p-5 bg-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <HiLightningBolt className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  SIH 2026 Evaluation Presets (1-Click Test Access)
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                Click any role to test dashboard functionality
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => handleQuickDemo('farmer')}
                className="p-3.5 rounded-xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 transition-all text-left cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs text-emerald-700 font-bold mb-1">
                  <span className="flex items-center gap-1.5">
                    <HiUser className="w-4 h-4" /> Farmer Portal
                  </span>
                  <span className="ks-badge ks-badge-green">1-Click</span>
                </div>
                <div className="font-bold text-slate-900 text-sm">Ramesh Kumar</div>
                <div className="text-xs text-slate-500 mt-0.5">Wheat (45 Qtl) • Indore Mandi</div>
              </button>

              <button
                onClick={() => handleQuickDemo('operator')}
                className="p-3.5 rounded-xl bg-slate-50 hover:bg-teal-50/70 border border-slate-200 hover:border-teal-300 transition-all text-left cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs text-teal-700 font-bold mb-1">
                  <span className="flex items-center gap-1.5">
                    <HiBadgeCheck className="w-4 h-4" /> Mandi Staff Console
                  </span>
                  <span className="ks-badge ks-badge-blue">1-Click</span>
                </div>
                <div className="font-bold text-slate-900 text-sm">Suresh Patel</div>
                <div className="text-xs text-slate-500 mt-0.5">Weighbridge & Token Scanner</div>
              </button>

              <button
                onClick={() => handleQuickDemo('admin')}
                className="p-3.5 rounded-xl bg-slate-50 hover:bg-amber-50/70 border border-slate-200 hover:border-amber-300 transition-all text-left cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs text-amber-800 font-bold mb-1">
                  <span className="flex items-center gap-1.5">
                    <HiChartBar className="w-4 h-4" /> District Command Tower
                  </span>
                  <span className="ks-badge ks-badge-amber">1-Click</span>
                </div>
                <div className="font-bold text-slate-900 text-sm">Priya Sharma (IAS)</div>
                <div className="text-xs text-slate-500 mt-0.5">District Officer Analytics</div>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. LIVE MANDI QUEUE TELEMETRY ──────────────────────────── */}
      <section className="ks-container">
        <div className="ks-card p-6 sm:p-8 bg-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <span className="ks-badge ks-badge-green mb-2">Live Mandi Status</span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Real-Time Procurement Center Telemetry
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Farmers can check mandi wait times before leaving home
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {(centers.length > 0
                ? centers
                : [
                    { _id: '1', name: 'Indore Central Mandi' },
                    { _id: '2', name: 'Dewas Krishikunj Mandi' },
                    { _id: '3', name: 'Ujjain Grain Mandi' },
                  ]
              ).map((c) => (
                <button
                  key={c._id}
                  onClick={() => setSelectedCenter(c)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedCenter?._id === c._id || (!selectedCenter && c._id === '1')
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase">
                  Currently Being Weighed
                </span>
                <div className="text-3xl font-extrabold text-emerald-600 mt-2">
                  #{queueData?.currentlyServing?.tokenNumber || 'TK-108'}
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  At Weighbridge Bay 1 • Wheat (FAQ Grade)
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500">Bay Staff</span>
                <span className="font-bold text-slate-900">Mahesh Kumar</span>
              </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase">
                  Next In Line (Gate Called)
                </span>
                <div className="text-3xl font-extrabold text-blue-600 mt-2">
                  #{queueData?.nextInLine?.tokenNumber || 'TK-109'}
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Tractor MP-09-EA-4210 • Reporting Bay 2
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500">Estimated Gate Entry</span>
                <span className="font-bold text-emerald-700">In ~8 mins</span>
              </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase">
                  Mandi Yard Traffic
                </span>
                <div className="mt-2">
                  <span className="ks-badge ks-badge-green font-bold">
                    🟢 Normal Traffic (Low Congestion)
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  Active Queue: <strong className="text-slate-900">{queueData?.queueLength || '4'} tractors</strong>
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200">
                <Link
                  to="/queue"
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  <span>Open Full Mandi Queue Display</span>
                  <HiArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. CORE SYSTEM MODULES (4 PILLARS) ────────────────────── */}
      <section className="ks-container">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-1">
          <span className="ks-badge ks-badge-green">Problem Statement 26032 Architecture</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Core Technological Solution Modules
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm">
            End-to-end automation designed for mandi procurement officers, farmers, and district administrators.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1 */}
          <div className="ks-card overflow-hidden bg-white">
            <div className="h-40 overflow-hidden relative border-b border-slate-100">
              <img
                src={slotBookingImg}
                alt="Smart Slot Allocation"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-5 space-y-2">
              <h3 className="font-bold text-sm text-slate-900">1. Smart Slot Allocation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hourly quota balancing prevents yard overflows. Farmers choose 1-hour reporting windows with digital QR passes.
              </p>
              <ul className="pt-2 text-[11px] text-slate-700 space-y-1 font-semibold">
                <li className="flex items-center gap-1.5 text-emerald-700"><HiCheck className="w-3.5 h-3.5" /> 1-Hour Time Slots</li>
                <li className="flex items-center gap-1.5 text-emerald-700"><HiCheck className="w-3.5 h-3.5" /> Digital QR Passes</li>
              </ul>
            </div>
          </div>

          {/* Card 2 */}
          <div className="ks-card overflow-hidden bg-white">
            <div className="h-40 overflow-hidden relative border-b border-slate-100">
              <img
                src={liveQueueImg}
                alt="Live Queue Telemetry"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-5 space-y-2">
              <h3 className="font-bold text-sm text-slate-900">2. Live Queue Telemetry</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Real-time WebSocket broadcasting updates tractor queue position, wait times, and gate announcements automatically.
              </p>
              <ul className="pt-2 text-[11px] text-slate-700 space-y-1 font-semibold">
                <li className="flex items-center gap-1.5 text-emerald-700"><HiCheck className="w-3.5 h-3.5" /> Live WebSocket Feed</li>
                <li className="flex items-center gap-1.5 text-emerald-700"><HiCheck className="w-3.5 h-3.5" /> Estimated Wait Calculator</li>
              </ul>
            </div>
          </div>

          {/* Card 3 */}
          <div className="ks-card overflow-hidden bg-white">
            <div className="h-40 overflow-hidden relative border-b border-slate-100">
              <img
                src={weighmentImg}
                alt="Transparent Weighment"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-5 space-y-2">
              <h3 className="font-bold text-sm text-slate-900">3. Transparent Weighment</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Electronic gross & tare weight logging with official MSP price auto-calculation. Zero middleman deductions.
              </p>
              <ul className="pt-2 text-[11px] text-slate-700 space-y-1 font-semibold">
                <li className="flex items-center gap-1.5 text-emerald-700"><HiCheck className="w-3.5 h-3.5" /> MSP Auto-Calculation</li>
                <li className="flex items-center gap-1.5 text-emerald-700"><HiCheck className="w-3.5 h-3.5" /> Digital Weight Receipt</li>
              </ul>
            </div>
          </div>

          {/* Card 4 */}
          <div className="ks-card overflow-hidden bg-white">
            <div className="h-40 overflow-hidden relative border-b border-slate-100">
              <img
                src={notificationsImg}
                alt="Inclusive Regional SMS"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-5 space-y-2">
              <h3 className="font-bold text-sm text-slate-900">4. Inclusive Regional SMS</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dual notification delivery via Web Push for smartphones and SMS Gateway stubs for feature phones in regional languages.
              </p>
              <ul className="pt-2 text-[11px] text-slate-700 space-y-1 font-semibold">
                <li className="flex items-center gap-1.5 text-emerald-700"><HiCheck className="w-3.5 h-3.5" /> Multi-language SMS</li>
                <li className="flex items-center gap-1.5 text-emerald-700"><HiCheck className="w-3.5 h-3.5" /> Feature Phone Support</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. FARMER PROCUREMENT WORKFLOW ──────────────────────────── */}
      <section className="ks-container">
        <div className="ks-card p-6 sm:p-8 bg-white">
          <div className="text-center max-w-xl mx-auto mb-8 space-y-1">
            <span className="ks-badge ks-badge-green">Simple 5-Step Process</span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Farmer Procurement Journey
            </h2>
            <p className="text-slate-500 text-xs">
              From harvesting to direct bank payout in 5 scheduled steps
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center space-y-1.5">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center mx-auto text-xs">
                1
              </div>
              <h4 className="font-bold text-xs text-slate-900">Register ID</h4>
              <p className="text-[11px] text-slate-500">Link Aadhaar & harvest details</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center space-y-1.5">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center mx-auto text-xs">
                2
              </div>
              <h4 className="font-bold text-xs text-slate-900">Select Slot</h4>
              <p className="text-[11px] text-slate-500">Pick 1-hour reporting window</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center space-y-1.5">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center mx-auto text-xs">
                3
              </div>
              <h4 className="font-bold text-xs text-slate-900">Scan QR Pass</h4>
              <p className="text-[11px] text-slate-500">Scan at mandi gate upon arrival</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center space-y-1.5">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center mx-auto text-xs">
                4
              </div>
              <h4 className="font-bold text-xs text-slate-900">Digital Weighbridge</h4>
              <p className="text-[11px] text-slate-500">Gross & tare weight calculation</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center space-y-1.5">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center mx-auto text-xs">
                5
              </div>
              <h4 className="font-bold text-xs text-slate-900">Instant Receipt</h4>
              <p className="text-[11px] text-slate-500">Digital receipt & SMS confirmation</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. BOTTOM CTA BANNER ───────────────────────────────────── */}
      <section className="ks-container">
        <div className="bg-emerald-900 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-xl sm:text-2xl font-bold">
              Ready to schedule your mandi procurement?
            </h3>
            <p className="text-emerald-100 text-xs sm:text-sm max-w-xl">
              Experience zero-wait mandi reporting across Madhya Pradesh, Maharashtra, and Punjab.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/register" className="ks-btn-primary">
              Register Farmer ID
            </Link>
            <Link to="/login" className="ks-btn-secondary">
              Staff Sign In
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
