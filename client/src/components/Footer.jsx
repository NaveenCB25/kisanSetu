import React from 'react';
import { Link } from 'react-router-dom';
import { HiPhone, HiMail, HiShieldCheck } from 'react-icons/hi';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Problem Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🌾</span>
              <span className="font-bold text-xl text-white tracking-tight">KisanSetu</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                SIH 2026
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-md">
              Smart Farmer Procurement & Queue Management System. Transforming traditional mandi waiting lines into scheduled, transparent, and dignified procurement.
            </p>
            <div className="flex flex-wrap gap-2 pt-1 text-xs">
              <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                Problem Statement ID: <strong>26032</strong>
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                Theme: <strong>Smart Automation</strong>
              </span>
              <span className="px-2.5 py-1 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800">
                Team: <strong>Krishicoders</strong>
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
              Portals & Services
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link to="/farmer/book" className="hover:text-emerald-400 transition-colors">
                  Slot Booking
                </Link>
              </li>
              <li>
                <Link to="/queue" className="hover:text-emerald-400 transition-colors">
                  Live Mandi Queue
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-emerald-400 transition-colors">
                  Operator Login
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-emerald-400 transition-colors">
                  Admin Analytics
                </Link>
              </li>
            </ul>
          </div>

          {/* Farmer Helpline & Support */}
          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
              Support & Helpline
            </h4>
            <div className="space-y-2.5 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <HiPhone className="w-4 h-4 text-emerald-400" />
                <span>Kisan Toll-Free: <strong>1800-180-1551</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <HiMail className="w-4 h-4 text-emerald-400" />
                <span>support@kisansetu.gov.in</span>
              </div>
              <div className="flex items-center gap-2">
                <HiShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Verified MSP Procurement</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>© 2026 KisanSetu. Developed by Team Krishicoders for Smart India Hackathon.</p>
          <p className="flex items-center gap-3">
            <span>Real-time WebSocket Active</span>
            <span>•</span>
            <span>SMS Gateway Ready</span>
            <span>•</span>
            <span>Multi-Language Ready</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
