import React from 'react';
import { Link } from 'react-router-dom';
import { HiPhone, HiMail, HiShieldCheck } from 'react-icons/hi';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-auto">
      <div className="ks-container py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Problem Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🌾</span>
              <span className="font-extrabold text-xl text-white tracking-tight">
                Kisan<span className="text-emerald-400">Setu</span>
              </span>
              <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                SIH 2026
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              Smart Farmer Procurement & Queue Management System. Transforming traditional mandi waiting lines into scheduled, transparent, and dignified procurement.
            </p>
            <div className="flex flex-wrap gap-2 text-[11px] pt-1">
              <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Problem Statement ID: <strong className="text-emerald-400">26032</strong>
              </span>
              <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Theme: <strong className="text-emerald-400">Smart Automation</strong>
              </span>
              <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                Team Krishicoders
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Portals & Services
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link to="/farmer/book" className="hover:text-emerald-400 transition-colors">
                  Slot Booking Portal
                </Link>
              </li>
              <li>
                <Link to="/queue" className="hover:text-emerald-400 transition-colors">
                  Live Mandi Queue Monitor
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-emerald-400 transition-colors">
                  Mandi Staff Console
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-emerald-400 transition-colors">
                  District Command Tower
                </Link>
              </li>
            </ul>
          </div>

          {/* Farmer Helpline & Support */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Support & Helpline
            </h4>
            <div className="space-y-2.5 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <HiPhone className="w-4 h-4 text-emerald-400" />
                <span>Kisan Toll-Free: <strong className="text-white">1800-180-1551</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <HiMail className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300">support@kisansetu.gov.in</span>
              </div>
              <div className="flex items-center gap-2">
                <HiShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300">Verified MSP Procurement</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          <p>© 2026 KisanSetu. Developed by Team Krishicoders for Smart India Hackathon.</p>
          <div className="flex flex-wrap items-center gap-3 text-emerald-400 font-mono text-[11px]">
            <span>• WebSocket Live</span>
            <span>• SMS Gateway Ready</span>
            <span>• Multi-Language Engine</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
