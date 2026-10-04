import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookingsAPI } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import QRCodeModal from '../../components/QRCodeModal';
import {
  HiPlus,
  HiQrcode,
  HiTrash,
  HiClock,
  HiCheckCircle,
  HiLocationMarker,
  HiTruck,
  HiCurrencyRupee,
} from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedBookingForQR, setSelectedBookingForQR] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await bookingsAPI.getMyBookings();
      if (res.data?.success) {
        setBookings(res.data.data || []);
      }
    } catch (err) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this procurement slot?')) return;
    try {
      await bookingsAPI.cancel(id, 'Cancelled by farmer');
      toast.success('Slot cancelled successfully');
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel slot');
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') {
      return ['booked', 'confirmed', 'waiting', 'called', 'inside_mandi'].includes(b.status);
    }
    if (activeTab === 'completed') {
      return ['weighment_done', 'quality_inspected', 'completed'].includes(b.status);
    }
    if (activeTab === 'cancelled') {
      return b.status === 'cancelled';
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            My Procurement Slots
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track token status, view QR passes, and check payment receipts
          </p>
        </div>
        <Link
          to="/farmer/book"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md transition-all self-start sm:self-auto"
        >
          <HiPlus className="w-4 h-4" />
          <span>Book New Slot</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-gray-200 gap-6 text-sm font-semibold">
        {[
          { key: 'all', label: `All (${bookings.length})` },
          {
            key: 'active',
            label: `Active / Upcoming (${
              bookings.filter((b) =>
                ['booked', 'confirmed', 'waiting', 'called', 'inside_mandi'].includes(b.status)
              ).length
            })`,
          },
          {
            key: 'completed',
            label: `Completed (${
              bookings.filter((b) =>
                ['weighment_done', 'quality_inspected', 'completed'].includes(b.status)
              ).length
            })`,
          },
          {
            key: 'cancelled',
            label: `Cancelled (${bookings.filter((b) => b.status === 'cancelled').length})`,
          },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 transition-colors relative cursor-pointer ${
              activeTab === tab.key
                ? 'text-emerald-700 border-b-2 border-emerald-600'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bookings Card List */}
      {loading ? (
        <div className="p-12 text-center text-gray-400">Loading bookings...</div>
      ) : filteredBookings.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-gray-200">
          <HiClock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 font-medium">No bookings found in this category.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => {
            const isCompleted = ['completed', 'weighment_done', 'quality_inspected'].includes(b.status);
            const isCancellable = ['booked', 'confirmed'].includes(b.status);

            return (
              <div
                key={b._id}
                className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 font-semibold uppercase">Token</span>
                    <span className="text-2xl font-black text-emerald-800 tracking-wider">
                      #{b.tokenNumber || 'TK-PENDING'}
                    </span>
                    <StatusBadge status={b.status} size="md" />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedBookingForQR(b)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <HiQrcode className="w-4 h-4 text-emerald-600" />
                      <span>Gate Pass QR</span>
                    </button>
                    {isCancellable && (
                      <button
                        onClick={() => handleCancel(b._id)}
                        className="px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <HiTrash className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-gray-400 block">Center:</span>
                    <span className="font-bold text-gray-900">
                      {b.procurementCenter?.name || b.centerName || 'Mandi Center'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block">Crop & Quantity:</span>
                    <span className="font-bold text-emerald-700">
                      {b.cropType} • {b.estimatedQuantity} Qtl
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block">Scheduled Date & Time:</span>
                    <span className="font-bold text-gray-900">
                      {b.slotDate ? new Date(b.slotDate).toLocaleDateString() : ''} ({b.timeSlot})
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block">Vehicle Reg:</span>
                    <span className="font-mono font-bold text-gray-800">
                      {b.vehicleNumber || 'N/A'} ({b.vehicleType || 'Tractor'})
                    </span>
                  </div>
                </div>

                {/* Weighment Slip Summary if completed */}
                {b.weighment && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-bold text-emerald-900 block">
                        Official Weighment Verified:
                      </span>
                      <span className="text-emerald-800">
                        Net Weight: <strong>{b.weighment.netWeight} Qtl</strong> (Moisture: {b.weighment.moisturePercentage || 11.5}%)
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Disbursed MSP Amount:</span>
                      <span className="text-base font-extrabold text-emerald-800">
                        ₹{(b.weighment.totalAmount || b.weighment.netWeight * 2275).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

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
