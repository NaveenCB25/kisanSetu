import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import NotificationCenter from './NotificationCenter';
import {
  HiMenu,
  HiX,
  HiGlobeAlt,
  HiLogout,
  HiViewGrid,
  HiTicket,
  HiClock,
  HiChartBar,
  HiOfficeBuilding,
} from 'react-icons/hi';

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('kisansetu_lang', lang);
    setLangMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const languages = [
    { code: 'en', label: 'English (India)', native: 'English', state: 'Pan-India' },
    { code: 'kn', label: 'Kannada (ಕರ್ನಾಟಕ)', native: 'ಕನ್ನಡ', state: 'Karnataka' },
    { code: 'hi', label: 'Hindi (हिन्दी)', native: 'हिन्दी', state: 'North / MP' },
    { code: 'mr', label: 'Marathi (महाराष्ट्र)', native: 'मराठी', state: 'Maharashtra' },
    { code: 'te', label: 'Telugu (తెలుగు)', native: 'తెలుగు', state: 'AP / TS' },
    { code: 'ta', label: 'Tamil (தமிழ்)', native: 'தமிழ்', state: 'Tamil Nadu' },
    { code: 'pa', label: 'Punjabi (ਪੰਜਾਬੀ)', native: 'ਪੰਜਾਬੀ', state: 'Punjab' },
    { code: 'gu', label: 'Gujarati (ગુજરાતી)', native: 'ગુજરાતી', state: 'Gujarat' },
    { code: 'bn', label: 'Bengali (বাংলা)', native: 'বাংলা', state: 'West Bengal' },
  ];

  // Role based navigation links
  const getNavLinks = () => {
    if (!user) {
      return [
        { to: '/', label: t('nav.home') || 'Home' },
        { to: '/queue', label: t('nav.queue') || 'Live Queue' },
      ];
    }

    if (user.role === 'farmer') {
      return [
        { to: '/farmer/dashboard', label: t('nav.dashboard') || 'Dashboard', icon: HiViewGrid },
        { to: '/farmer/book', label: t('nav.book_slot') || 'Book Slot', icon: HiTicket },
        { to: '/farmer/bookings', label: t('nav.bookings') || 'My Bookings', icon: HiClock },
        { to: '/queue', label: t('nav.queue') || 'Live Queue', icon: HiClock },
      ];
    }

    if (user.role === 'operator') {
      return [
        { to: '/operator/dashboard', label: 'Queue Console', icon: HiViewGrid },
        { to: '/operator/weighment', label: 'Weighment Entry', icon: HiTicket },
        { to: '/queue', label: 'Public Display', icon: HiClock },
      ];
    }

    if (user.role === 'admin') {
      return [
        { to: '/admin/dashboard', label: 'Control Tower', icon: HiChartBar },
        { to: '/admin/centers', label: 'Mandi Management', icon: HiOfficeBuilding },
        { to: '/queue', label: 'Live Queue Monitor', icon: HiClock },
      ];
    }

    return [{ to: '/', label: 'Home' }];
  };

  const navLinks = getNavLinks();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs">
      {/* Top Gov Announcement Bar */}
      <div className="bg-emerald-800 text-white text-[11px] py-1 px-4 text-center font-medium flex items-center justify-between">
        <div className="ks-container flex items-center justify-between w-full">
          <span>Smart India Hackathon 2026 • Problem Statement ID: 26032</span>
          <span className="hidden sm:inline-block">Toll Free Kisan Helpline: 1800-180-1551</span>
        </div>
      </div>

      <div className="ks-container">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white text-lg shadow-xs font-bold">
              🌾
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  Kisan<span className="text-emerald-600">Setu</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  SIH 2026
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 font-extrabold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right utility buttons: Language, Notifications, Auth */}
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors cursor-pointer"
                title="Select Language"
              >
                <HiGlobeAlt className="w-4 h-4 text-emerald-600" />
                <span className="uppercase">{i18n.language || 'en'}</span>
              </button>

              {langMenuOpen && (
                <div className="absolute right-0 mt-2 w-60 max-h-80 overflow-y-auto rounded-xl bg-white shadow-xl border border-slate-200 py-2 z-50 divide-y divide-slate-100">
                  <div className="px-3.5 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Select Language / State
                  </div>
                  <div className="py-1">
                    {languages.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => handleLanguageChange(l.code)}
                        className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          i18n.language === l.code
                            ? 'font-bold text-emerald-700 bg-emerald-50 border-l-4 border-emerald-600'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-slate-900">{l.native}</div>
                          <div className="text-[10px] text-slate-400">{l.label}</div>
                        </div>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {l.state}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Notification Bell (Logged In) */}
            {user && <NotificationCenter />}

            {/* User Profile or Login CTA */}
            {user ? (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[120px]">
                    {user.name}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-emerald-600">
                    {user.role}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Logout"
                >
                  <HiLogout className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-emerald-700 transition-colors"
                >
                  {t('auth.login') || 'Sign In'}
                </Link>
                <Link
                  to="/register"
                  className="hidden sm:inline-flex px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-all"
                >
                  {t('auth.register') || 'Register'}
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3.5 py-2.5 rounded-lg text-sm font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
            >
              {link.label}
            </Link>
          ))}
          {!user && (
            <div className="pt-3 border-t border-slate-200 flex gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2.5 text-xs font-bold rounded-lg border border-slate-300 text-slate-700"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2.5 text-xs font-bold rounded-lg bg-emerald-600 text-white"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
