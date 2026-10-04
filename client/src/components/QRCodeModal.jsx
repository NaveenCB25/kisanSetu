import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { HiX, HiPrinter, HiDownload, HiCheckCircle } from 'react-icons/hi';
import StatusBadge from './StatusBadge';

export default function QRCodeModal({ booking, onClose }) {
  if (!booking) return null;

  const qrData = JSON.stringify({
    tokenId: booking.tokenNumber || booking._id,
    bookingId: booking._id,
    farmer: booking.farmerName || booking.farmer?.name,
    crop: booking.cropType,
    quantity: booking.estimatedQuantity,
    center: booking.centerName || booking.procurementCenter?.name,
    date: booking.slotDate,
    time: booking.timeSlot,
    vehicle: booking.vehicleNumber,
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-emerald-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-800 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🌾</span>
            <div>
              <h3 className="font-bold text-lg leading-tight">Digital Gate Pass</h3>
              <p className="text-xs text-emerald-200">KisanSetu • SIH 2026</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
            title="Close"
          >
            <HiX className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Pass Body */}
        <div className="p-6 overflow-y-auto space-y-5 print:p-0">
          {/* Token Hero */}
          <div className="text-center p-4 rounded-xl bg-emerald-50/80 border border-emerald-200">
            <p className="text-xs font-semibold tracking-wider text-emerald-800 uppercase">
              Assigned Token Number
            </p>
            <div className="text-3xl font-extrabold text-emerald-700 tracking-wider mt-1">
              #{booking.tokenNumber || 'TK-PENDING'}
            </div>
            <div className="mt-2 flex items-center justify-center gap-2">
              <StatusBadge status={booking.status} size="md" />
            </div>
          </div>

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center py-2">
            <div className="p-4 bg-white rounded-2xl shadow-md border-2 border-emerald-500/20 inline-block">
              <QRCodeSVG
                value={qrData}
                size={180}
                level="H"
                includeMargin={true}
                fgColor="#064e3b"
              />
            </div>
            <p className="text-[11px] text-gray-500 text-center mt-2.5 max-w-xs">
              Present this QR code at Mandi entry gate for instant contactless verification.
            </p>
          </div>

          {/* Details Table */}
          <div className="border border-gray-100 rounded-xl divide-y divide-gray-100 text-sm bg-gray-50/50">
            <div className="px-4 py-2.5 flex justify-between">
              <span className="text-gray-500">Farmer Name</span>
              <span className="font-semibold text-gray-900">{booking.farmerName || booking.farmer?.name || 'Farmer'}</span>
            </div>
            <div className="px-4 py-2.5 flex justify-between">
              <span className="text-gray-500">Procurement Center</span>
              <span className="font-semibold text-gray-900">{booking.centerName || booking.procurementCenter?.name}</span>
            </div>
            <div className="px-4 py-2.5 flex justify-between">
              <span className="text-gray-500">Crop & Qty</span>
              <span className="font-semibold text-emerald-700">
                {booking.cropType} • {booking.estimatedQuantity} Qtl
              </span>
            </div>
            <div className="px-4 py-2.5 flex justify-between">
              <span className="text-gray-500">Reporting Slot</span>
              <span className="font-semibold text-gray-900">
                {booking.slotDate ? new Date(booking.slotDate).toLocaleDateString() : ''} ({booking.timeSlot})
              </span>
            </div>
            {booking.vehicleNumber && (
              <div className="px-4 py-2.5 flex justify-between">
                <span className="text-gray-500">Vehicle / Type</span>
                <span className="font-semibold text-gray-900">
                  {booking.vehicleNumber} ({booking.vehicleType || 'Tractor'})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition-all text-sm"
          >
            <HiPrinter className="w-4 h-4" />
            Print Pass
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium transition-all text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
