import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { bookingsAPI, queueAPI, centersAPI } from '../../services/api';
import {
  HiOutlineScale,
  HiCheckCircle,
  HiPrinter,
  HiInformationCircle,
  HiCurrencyRupee,
  HiArrowRight,
} from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function WeighmentForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingIdParam = searchParams.get('bookingId');

  const [activeBookings, setActiveBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [grossWeight, setGrossWeight] = useState(85.5);
  const [tareWeight, setTareWeight] = useState(40.2);
  const [moisture, setMoisture] = useState(11.8);
  const [qualityGrade, setQualityGrade] = useState('FAQ');
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState(null);

  // Crop MSP lookup
  const cropMspMap = {
    Wheat: 2275,
    Paddy: 2320,
    Gram: 5440,
    Mustard: 5650,
    Soybean: 4892,
    Maize: 2090,
  };

  const netWeight = Math.max(0, Number(grossWeight || 0) - Number(tareWeight || 0));
  const mspRate = cropMspMap[selectedBooking?.cropType] || 2275;
  const totalAmount = Math.round(netWeight * mspRate);

  useEffect(() => {
    // Load bookings ready for weighment
    bookingsAPI.getAll({ status: 'inside_mandi' })
      .then((res) => {
        if (res.data?.success && res.data.data.length > 0) {
          setActiveBookings(res.data.data);
          if (bookingIdParam) {
            const found = res.data.data.find((b) => b._id === bookingIdParam);
            if (found) setSelectedBooking(found);
            else setSelectedBooking(res.data.data[0]);
          } else {
            setSelectedBooking(res.data.data[0]);
          }
        }
      })
      .catch(console.error);
  }, [bookingIdParam]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBooking) {
      toast.error('Please select an active farmer token');
      return;
    }
    if (netWeight <= 0) {
      toast.error('Net weight must be greater than 0');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        bookingId: selectedBooking._id,
        grossWeight: Number(grossWeight),
        tareWeight: Number(tareWeight),
        netWeight: Number(netWeight.toFixed(2)),
        moisturePercentage: Number(moisture),
        qualityGrade,
        mspRate,
        totalAmount,
      };

      const res = await bookingsAPI.recordWeighment(payload);
      if (res.data?.success) {
        toast.success(`Weighment recorded! Generated digital slip #${res.data.data.slipNumber || 'SLIP-9921'}`);
        setReceipt({
          ...res.data.data,
          farmer: selectedBooking.farmerName || selectedBooking.farmer?.name,
          crop: selectedBooking.cropType,
          vehicle: selectedBooking.vehicleNumber,
          netWeight,
          totalAmount,
          mspRate,
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit weighment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-teal-700 uppercase tracking-wider mb-1">
          <span>⚖️ Mandi Weighbridge Console</span>
          <span>•</span>
          <span>Certified Scale 01</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Record Digital Weighment Slip
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Electronic gross & tare logging with automatic MSP calculation and instant farmer receipt dispatch.
        </p>
      </div>

      {!receipt ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Select Token Vehicle */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-gray-900">
              1. Select Vehicle Admitted to Weighbridge Bay
            </h3>

            {activeBookings.length === 0 ? (
              <div className="p-6 text-center bg-gray-50 rounded-2xl text-sm text-gray-500">
                No vehicles currently marked as "Inside Mandi". Please admit a vehicle from the Queue Console first.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {activeBookings.map((b) => {
                  const isSelected = selectedBooking?._id === b._id;
                  return (
                    <div
                      key={b._id}
                      onClick={() => setSelectedBooking(b)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50/50 shadow-sm'
                          : 'border-gray-100 hover:border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 font-semibold">Token</span>
                        <span className="text-base font-black text-teal-800">
                          #{b.tokenNumber}
                        </span>
                      </div>
                      <div className="font-bold text-sm text-gray-900 mt-1">
                        {b.farmerName || b.farmer?.name || 'Farmer'}
                      </div>
                      <div className="text-xs text-teal-700 mt-1">
                        {b.cropType} • Est. {b.estimatedQuantity} Qtl
                      </div>
                      <div className="text-[11px] font-mono text-gray-500 mt-1">
                        {b.vehicleNumber || 'Registered'}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 2: Weight Readings */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-gray-900">
              2. Electronic Scale Readings (Quintals)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Gross Weight (Tractor + Harvest Loaded)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={grossWeight}
                    onChange={(e) => setGrossWeight(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                  <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-semibold text-gray-400">
                    Quintals
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Tare Weight (Empty Tractor After Unloading)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={tareWeight}
                    onChange={(e) => setTareWeight(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                  <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-semibold text-gray-400">
                    Quintals
                  </span>
                </div>
              </div>
            </div>

            {/* Calculated Net Weight Display */}
            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-teal-800 font-bold uppercase tracking-wider">
                  Computed Net Harvest Weight
                </span>
                <p className="text-xs text-teal-700 mt-0.5">
                  Gross ({grossWeight} Qtl) - Tare ({tareWeight} Qtl)
                </p>
              </div>
              <div className="text-2xl font-black text-teal-800">
                {netWeight.toFixed(2)} Qtl
              </div>
            </div>
          </div>

          {/* Step 3: Quality Assessment & Auto-MSP */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-gray-900">
              3. Quality Inspection & Government MSP Rates
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Moisture Content (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={moisture}
                  onChange={(e) => setMoisture(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">FAQ limit: ≤ 12.0%</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Quality Grade
                </label>
                <select
                  value={qualityGrade}
                  onChange={(e) => setQualityGrade(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white font-medium"
                >
                  <option value="FAQ">FAQ (Fair Average Quality) - Standard</option>
                  <option value="Grade-A">Grade A (Premium)</option>
                  <option value="Below-FAQ">Below FAQ (Subject to deduction)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Official MSP Rate
                </label>
                <div className="w-full px-3.5 py-2.5 rounded-xl bg-gray-100 text-sm font-bold text-gray-900">
                  ₹{mspRate} / Quintal
                </div>
              </div>
            </div>

            {/* Total Payout Summary */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between shadow-md">
              <div>
                <span className="text-xs text-emerald-200 uppercase font-bold tracking-wider">
                  Total Farmer Payment Disbursal
                </span>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Direct Bank Transfer (DBT) to Farmer's Aadhaar linked account
                </p>
              </div>
              <div className="text-3xl font-black">
                ₹{totalAmount.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !selectedBooking}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-700 hover:from-teal-700 hover:to-emerald-800 text-white font-extrabold text-base shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <HiCheckCircle className="w-5 h-5" />
                <span>Confirm Weighment & Dispatch SMS Receipt</span>
              </>
            )}
          </button>
        </form>
      ) : (
        /* Printable Digital Weighment Receipt */
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🌾</span>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Official Procurement Weighment Slip</h3>
                <p className="text-xs text-gray-500">Government of Madhya Pradesh • KisanSetu</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              PAYMENT AUTHORIZED
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm bg-gray-50 p-4 rounded-2xl">
            <div>
              <span className="text-xs text-gray-400 block">Farmer Name:</span>
              <span className="font-bold text-gray-900">{receipt.farmer}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block">Crop Type:</span>
              <span className="font-bold text-gray-900">{receipt.crop}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block">Vehicle Reg:</span>
              <span className="font-mono font-bold text-gray-900">{receipt.vehicle}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block">Net Weight:</span>
              <span className="font-bold text-emerald-700">{receipt.netWeight} Quintals</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex justify-between items-center">
            <div>
              <span className="text-xs text-emerald-800 font-bold uppercase">Authorized Amount</span>
              <p className="text-xs text-emerald-600">Calculated at MSP rate of ₹{receipt.mspRate}/Qtl</p>
            </div>
            <div className="text-2xl font-black text-emerald-800">
              ₹{receipt.totalAmount.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => window.print()}
              className="flex-1 py-3 rounded-xl bg-teal-600 text-white font-bold text-sm hover:bg-teal-700 flex items-center justify-center gap-2"
            >
              <HiPrinter className="w-4 h-4" />
              Print Official Slip
            </button>
            <button
              onClick={() => {
                setReceipt(null);
                navigate('/operator/dashboard');
              }}
              className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-100"
            >
              Back to Queue Console
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
