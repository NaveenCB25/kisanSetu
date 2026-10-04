import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { centersAPI, bookingsAPI } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import QRCodeModal from '../../components/QRCodeModal';
import {
  HiLocationMarker,
  HiCalendar,
  HiClock,
  HiTruck,
  HiCheckCircle,
  HiInformationCircle,
  HiCurrencyRupee,
  HiArrowRight,
} from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function BookSlot() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [centers, setCenters] = useState([]);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [selectedCrop, setSelectedCrop] = useState('Wheat');
  const [quantity, setQuantity] = useState(40);
  const [slotDate, setSlotDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('10:00 - 11:00');
  const [vehicleType, setVehicleType] = useState('Tractor-Trolley');
  const [vehicleNumber, setVehicleNumber] = useState('MP-09-EA-5521');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingCenters, setLoadingCenters] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // MSP rates per Quintal
  const mspRates = {
    Wheat: 2275,
    Paddy: 2320,
    Gram: 5440,
    Mustard: 5650,
    Soybean: 4892,
    Maize: 2090,
  };

  const estimatedPayout = (mspRates[selectedCrop] || 2275) * Number(quantity || 0);

  // Available standard hourly slots
  const standardTimeSlots = [
    { slot: '08:00 - 09:00', totalCapacity: 15, bookedCount: 4 },
    { slot: '09:00 - 10:00', totalCapacity: 15, bookedCount: 12 },
    { slot: '10:00 - 11:00', totalCapacity: 15, bookedCount: 9 },
    { slot: '11:00 - 12:00', totalCapacity: 15, bookedCount: 6 },
    { slot: '12:00 - 13:00', totalCapacity: 15, bookedCount: 14 },
    { slot: '14:00 - 15:00', totalCapacity: 15, bookedCount: 5 },
    { slot: '15:00 - 16:00', totalCapacity: 15, bookedCount: 7 },
    { slot: '16:00 - 17:00', totalCapacity: 15, bookedCount: 3 },
  ];

  useEffect(() => {
    centersAPI.getAll()
      .then((res) => {
        if (res.data?.success && res.data.data.length > 0) {
          setCenters(res.data.data);
          setSelectedCenter(res.data.data[0]);
        }
      })
      .catch((err) => {
        console.error('Failed to load centers', err);
      })
      .finally(() => setLoadingCenters(false));
  }, []);

  // Fetch slot availability when center or date changes
  useEffect(() => {
    if (selectedCenter?._id && slotDate) {
      bookingsAPI.getAvailableSlots(selectedCenter._id, slotDate)
        .then((res) => {
          if (res.data?.success && res.data.data) {
            setAvailableSlots(res.data.data);
          } else {
            setAvailableSlots(standardTimeSlots);
          }
        })
        .catch(() => {
          setAvailableSlots(standardTimeSlots);
        });
    } else {
      setAvailableSlots(standardTimeSlots);
    }
  }, [selectedCenter, slotDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCenter) {
      toast.error('Please select a procurement center');
      return;
    }
    if (!quantity || Number(quantity) <= 0) {
      toast.error('Please enter a valid harvest quantity');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        procurementCenterId: selectedCenter._id,
        cropType: selectedCrop,
        estimatedQuantity: Number(quantity),
        slotDate,
        timeSlot: selectedTimeSlot,
        vehicleType,
        vehicleNumber,
      };

      const res = await bookingsAPI.create(payload);
      if (res.data?.success) {
        toast.success(`Slot booked successfully! Assigned Token #${res.data.data.tokenNumber}`);
        setConfirmedBooking({
          ...res.data.data,
          centerName: selectedCenter.name,
          farmerName: user?.name,
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to book slot');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
          <span>🌾 Procurement Booking</span>
          <span>•</span>
          <span>Rabi / Kharif 2026</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Book Guaranteed Mandi Slot
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Pick your preferred date and 1-hour reporting window to avoid queue delays.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Mandi Procurement Center Selection */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold flex items-center justify-center">
                1
              </span>
              Select Procurement Center (Mandi)
            </h3>
            <span className="text-xs text-gray-500">
              Showing centers in {user?.district || 'Madhya Pradesh'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {centers.map((c) => {
              const isSelected = selectedCenter?._id === c._id;
              return (
                <div
                  key={c._id}
                  onClick={() => setSelectedCenter(c)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                      : 'border-gray-100 hover:border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="font-bold text-sm text-gray-900 leading-snug">
                      {c.name}
                    </span>
                    <StatusBadge status={c.crowdStatus || 'low'} size="sm" />
                  </div>
                  <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <HiLocationMarker className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{c.district}, {c.state}</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 font-medium mt-2">
                    Hourly capacity: {c.capacityPerHour || 15} trolleys/hr
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 2: Crop, Quantity & MSP Calculation */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold flex items-center justify-center">
              2
            </span>
            Crop Details & Harvest Quantity
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Crop Type
              </label>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
              >
                <option value="Wheat">Wheat (गेहूँ) - MSP ₹2,275/Qtl</option>
                <option value="Gram">Chana / Gram (चना) - MSP ₹5,440/Qtl</option>
                <option value="Mustard">Mustard (सरसों) - MSP ₹5,650/Qtl</option>
                <option value="Paddy">Paddy / Rice (धान) - MSP ₹2,320/Qtl</option>
                <option value="Soybean">Soybean (सोयाबीन) - MSP ₹4,892/Qtl</option>
                <option value="Maize">Maize (मक्का) - MSP ₹2,090/Qtl</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Estimated Quantity (Quintals)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="1000"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 45"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-semibold text-gray-400">
                  Quintals (Qtl)
                </span>
              </div>
            </div>
          </div>

          {/* MSP Payout Estimator Box */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs text-emerald-800 font-bold uppercase tracking-wider">
                Official Govt MSP Estimate
              </span>
              <p className="text-xs text-emerald-700 mt-0.5">
                {quantity || 0} Qtl × ₹{mspRates[selectedCrop] || 2275} per Quintal
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs text-gray-500 block">Estimated Bank Transfer</span>
              <span className="text-2xl font-extrabold text-emerald-800">
                ₹{estimatedPayout.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Step 3: Date & Slot Allocation */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold flex items-center justify-center">
                3
              </span>
              Select Date & 1-Hour Time Window
            </h3>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-600">Date:</label>
              <input
                type="date"
                required
                value={slotDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSlotDate(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {availableSlots.map((item) => {
              const booked = item.bookedCount || 0;
              const total = item.totalCapacity || 15;
              const remaining = Math.max(0, total - booked);
              const isFull = remaining === 0;
              const isSelected = selectedTimeSlot === item.slot;

              return (
                <button
                  type="button"
                  key={item.slot}
                  disabled={isFull}
                  onClick={() => setSelectedTimeSlot(item.slot)}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all relative ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm'
                      : isFull
                      ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'border-gray-200 hover:border-emerald-300 bg-white text-gray-800'
                  }`}
                >
                  <div className="font-bold text-xs">{item.slot}</div>
                  <div className="text-[11px] mt-1 flex items-center justify-between">
                    <span className={isFull ? 'text-rose-500 font-semibold' : 'text-gray-500'}>
                      {isFull ? 'Full' : `${remaining} slots left`}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isFull
                          ? 'bg-rose-500'
                          : remaining <= 3
                          ? 'bg-amber-400'
                          : 'bg-emerald-500'
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 4: Vehicle & Transport details */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold flex items-center justify-center">
              4
            </span>
            Transport & Vehicle Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Vehicle Type
              </label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
              >
                <option value="Tractor-Trolley">Tractor-Trolley (ट्रैक्टर-ट्रॉली)</option>
                <option value="Pickup / Mini Truck">Pickup / Mini Truck (पिकअप)</option>
                <option value="Truck (6 Wheeler)">Truck 6-Wheeler (बड़ा ट्रक)</option>
                <option value="Bullock Cart">Bullock Cart / Other (बैलगाड़ी)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Vehicle Registration Number
              </label>
              <input
                type="text"
                required
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                placeholder="e.g. MP-09-AB-1234"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm uppercase font-mono tracking-wider focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-base shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Confirm Slot & Generate QR Gate Pass</span>
                <HiArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* QR Confirmation Modal */}
      {confirmedBooking && (
        <QRCodeModal
          booking={confirmedBooking}
          onClose={() => {
            setConfirmedBooking(null);
            navigate('/farmer/bookings');
          }}
        />
      )}
    </div>
  );
}
