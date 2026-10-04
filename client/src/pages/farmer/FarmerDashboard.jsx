import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { bookingsAPI } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import QRCodeModal from '../../components/QRCodeModal';
import {
  HiTicket,
  HiClock,
  HiOutlineCalendar,
  HiOutlineCheckCircle,
  HiPlusCircle,
  HiQrcode,
  HiInformationCircle,
  HiArrowRight,
  HiTrendingUp,
} from 'react-icons/hi';

export default function FarmerDashboard() {
  const { user } = useAuth();
  const { queueUpdates } = useSocket() || {};
  const [activeBooking, setActiveBooking] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBookingForQR, setSelectedBookingForQR] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await bookingsAPI.getMyBookings();
      if (res.data?.success) {
        const bookings = res.data.data || [];
        // Active booking is one that is booked, confirmed, waiting, called, or inside_mandi
        const active = bookings.find((b) =>
          ['booked', 'confirmed', 'waiting', 'called', 'inside_mandi'].includes(b.status)
        );
        setActiveBooking(active || null);
        setRecentBookings(bookings.slice(0, 5));
      }
    } catch (err) {
      console.error('Failed to load farmer bookings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-1">
              <span>🌾 Kisan Dashboard</span>
              <span>•</span>
              <span>{user?.district || 'Indore'}, {user?.state || 'Madhya Pradesh'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Namaste, {user?.name || 'Farmer'}!
            </h1>
            <p className="text-emerald-100 text-sm mt-1 max-w-xl">
              Govt Procurement Portal active. Rabi Season 2026 MSP for Wheat: ₹2,275/Qtl • Gram: ₹5,440/Qtl.
            </p>
          </div>
          <Link
            to="/farmer/book"
            className="self-start sm:self-auto inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-emerald-900 font-bold hover:bg-emerald-50 transition-all shadow-md text-sm shrink-0"
          >
            <HiPlusCircle className="w-5 h-5 text-emerald-600" />
            <span>Book Procurement Slot</span>
          </Link>
        </div>
      </div>

      {/* Active Token Callout if Farmer has upcoming/active booking */}
      {activeBooking && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-white rounded-3xl p-6 border-2 border-emerald-500/30 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white animate-pulse">
                  ACTIVE BOOKING
                </span>
                <StatusBadge status={activeBooking.status} size="md" />
              </div>
              <div>
                <span className="text-xs text-gray-500 font-semibold uppercase">Token Number</span>
                <div className="text-3xl sm:text-4xl font-extrabold text-emerald-800 tracking-wider">
                  #{activeBooking.tokenNumber || 'TK-PENDING'}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-1">
                <div>
                  <span className="text-gray-400 block">Center:</span>
                  <span className="font-bold text-gray-800">
                    {activeBooking.procurementCenter?.name || activeBooking.centerName}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block">Crop & Qty:</span>
                  <span className="font-bold text-gray-800">
                    {activeBooking.cropType} ({activeBooking.estimatedQuantity} Qtl)
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block">Date & Window:</span>
                  <span className="font-bold text-gray-800">
                    {activeBooking.slotDate ? new Date(activeBooking.slotDate).toLocaleDateString() : ''} ({activeBooking.timeSlot})
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block">Vehicle:</span>
                  <span className="font-bold text-gray-800 font-mono">
                    {activeBooking.vehicleNumber || 'Registered'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setSelectedBookingForQR(activeBooking)}
                className="px-5 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <HiQrcode className="w-5 h-5" />
                <span>View Digital Gate Pass</span>
              </button>
              <Link
                to="/queue"
                className="px-4 py-3 rounded-2xl border border-emerald-300 hover:bg-emerald-100/50 text-emerald-800 font-semibold text-sm transition-all flex items-center justify-center gap-2"
              >
                <HiClock className="w-5 h-5" />
                <span>Track Live Bay Queue</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Quick Access Action Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/farmer/book"
          className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <HiTicket className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
            Book Procurement Slot
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Reserve guaranteed unloading time at your nearest mandi.
          </p>
        </Link>

        <Link
          to="/queue"
          className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <HiClock className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-gray-900 group-hover:text-teal-700 transition-colors">
            Live Mandi Queue
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            View live tokens being weighed across all weighbridge bays.
          </p>
        </Link>

        <Link
          to="/farmer/bookings"
          className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <HiOutlineCalendar className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
            Procurement History
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            View past weighment slips, MSP payments, and receipts.
          </p>
        </Link>

        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
            <HiTrendingUp className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-gray-900">
            Govt MSP Rates (2026)
          </h3>
          <div className="text-xs text-gray-600 mt-2 space-y-1">
            <div className="flex justify-between">
              <span>Wheat:</span>
              <strong className="text-emerald-700">₹2,275 / Qtl</strong>
            </div>
            <div className="flex justify-between">
              <span>Chana (Gram):</span>
              <strong className="text-emerald-700">₹5,440 / Qtl</strong>
            </div>
            <div className="flex justify-between">
              <span>Mustard:</span>
              <strong className="text-emerald-700">₹5,650 / Qtl</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-gray-900">Recent Mandi Bookings</h3>
          <Link
            to="/farmer/bookings"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            <span>View All</span>
            <HiArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading bookings...</div>
        ) : recentBookings.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-sm text-gray-500">You haven't booked any mandi slots yet.</p>
            <Link
              to="/farmer/book"
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
            >
              <HiPlusCircle className="w-4 h-4" />
              Book First Slot
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-gray-400 border-b border-gray-100">
                <tr>
                  <th className="py-3 px-3">Token #</th>
                  <th className="py-3 px-3">Center</th>
                  <th className="py-3 px-3">Crop & Quantity</th>
                  <th className="py-3 px-3">Slot Date & Time</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Gate Pass</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentBookings.map((b) => (
                  <tr key={b._id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-3 font-bold text-emerald-800">
                      #{b.tokenNumber || 'TK-PENDING'}
                    </td>
                    <td className="py-3 px-3 font-medium text-gray-800">
                      {b.procurementCenter?.name || b.centerName || 'Mandi Center'}
                    </td>
                    <td className="py-3 px-3 text-gray-600">
                      {b.cropType} • {b.estimatedQuantity} Qtl
                    </td>
                    <td className="py-3 px-3 text-gray-600">
                      {b.slotDate ? new Date(b.slotDate).toLocaleDateString() : ''} ({b.timeSlot})
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={b.status} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setSelectedBookingForQR(b)}
                        className="p-1.5 rounded-lg bg-gray-100 hover:bg-emerald-100 text-gray-700 hover:text-emerald-800 transition-colors"
                        title="View QR Gate Pass"
                      >
                        <HiQrcode className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QR Code Pass Modal */}
      {selectedBookingForQR && (
        <QRCodeModal
          booking={selectedBookingForQR}
          onClose={() => setSelectedBookingForQR(null)}
        />
      )}
    </div>
  );
}
