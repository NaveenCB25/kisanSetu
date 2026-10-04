import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { centersAPI, bookingsAPI } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import {
  HiOfficeBuilding,
  HiTrendingUp,
  HiUsers,
  HiScale,
  HiCurrencyRupee,
  HiClock,
  HiExclamationCircle,
  HiArrowRight,
} from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);

  // Analytics mock data modeled after SIH procurement telemetry
  const cropProcurementData = [
    { crop: 'Wheat', tonnage: 4250, target: 5000 },
    { crop: 'Gram (Chana)', tonnage: 1840, target: 2200 },
    { crop: 'Mustard', tonnage: 920, target: 1200 },
    { crop: 'Soybean', tonnage: 650, target: 800 },
    { crop: 'Paddy', tonnage: 3100, target: 3500 },
  ];

  const waitTimeTrends = [
    { hour: '08:00', waitMinutes: 18 },
    { hour: '10:00', waitMinutes: 42 },
    { hour: '12:00', waitMinutes: 38 },
    { hour: '14:00', waitMinutes: 24 },
    { hour: '16:00', waitMinutes: 15 },
  ];

  const yardUtilizationData = [
    { name: 'Completed & Dispatched', value: 65, color: '#10b981' },
    { name: 'Under Weighment', value: 15, color: '#06b6d4' },
    { name: 'Waiting in Yard', value: 12, color: '#f59e0b' },
    { name: 'Delayed / No-Show', value: 8, color: '#f43f5e' },
  ];

  useEffect(() => {
    centersAPI.getAll()
      .then((res) => {
        if (res.data?.success) {
          setCenters(res.data.data || []);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleBroadcastAlert = () => {
    toast.success('Mandi load-balancing SMS advisory dispatched to registered farmers!');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              State Agricultural Procurement Command Tower
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            District Monitoring & Quota Balancing
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time analytics across all district procurement centers and weighbridge bays.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleBroadcastAlert}
            className="px-4 py-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 font-semibold text-xs transition-all flex items-center gap-1.5"
          >
            <HiExclamationCircle className="w-4 h-4" />
            <span>Broadcast SMS Advisory</span>
          </button>
          <Link
            to="/admin/centers"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
          >
            <HiOfficeBuilding className="w-4 h-4" />
            <span>Manage Mandis</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase">Tonnage Procured</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <HiScale className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900 mt-2">10,760 Qtl</div>
          <div className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <HiTrendingUp className="w-3.5 h-3.5" />
            <span>+14.8% vs last season</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase">Farmers Served</span>
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <HiUsers className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900 mt-2">3,420</div>
          <div className="text-xs text-blue-600 font-semibold mt-1">98.4% on scheduled slot</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase">DBT Disbursal</span>
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <HiCurrencyRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-2">₹24.47 Cr</div>
          <div className="text-xs text-gray-500 font-medium mt-1">Zero commission leakage</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase">Avg Wait Time</span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <HiClock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900 mt-2">32 mins</div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">Down from 14 hrs in 2025</div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Daily Procurement by Crop */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-gray-900">
              Procurement Volume by Crop (Quintals)
            </h3>
            <span className="text-xs text-gray-400 font-medium">MSP Verified</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cropProcurementData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="crop" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="tonnage" fill="#10b981" radius={[6, 6, 0, 0]} name="Actual Qtl" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Yard Hourly Wait Time Curve */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-gray-900">
              Average Yard Wait Time by Hour (Minutes)
            </h3>
            <span className="text-xs text-emerald-600 font-semibold">Peak controlled at 10:00 AM</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={waitTimeTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Line
                  type="monotone"
                  dataKey="waitMinutes"
                  stroke="#06b6d4"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#06b6d4' }}
                  name="Wait Time (min)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Mandi Centers Real-time Status Table */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-gray-900">
            Procurement Centers Under Surveillance ({centers.length})
          </h3>
          <Link
            to="/admin/centers"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            <span>Manage All Mandis</span>
            <HiArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-gray-400 border-b border-gray-100">
              <tr>
                <th className="py-3 px-3">Mandi Center</th>
                <th className="py-3 px-3">District</th>
                <th className="py-3 px-3">Hourly Quota</th>
                <th className="py-3 px-3">Operating Hours</th>
                <th className="py-3 px-3">Yard Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {centers.map((c) => (
                <tr key={c._id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-3.5 px-3 font-bold text-gray-900">
                    {c.name}
                  </td>
                  <td className="py-3.5 px-3 text-gray-600">
                    {c.district}, {c.state}
                  </td>
                  <td className="py-3.5 px-3 font-medium text-gray-700">
                    {c.capacityPerHour || 15} trolleys/hr
                  </td>
                  <td className="py-3.5 px-3 text-gray-600 font-mono text-xs">
                    {c.operatingHours?.open || '08:00'} - {c.operatingHours?.close || '18:00'}
                  </td>
                  <td className="py-3.5 px-3">
                    <StatusBadge status={c.crowdStatus || 'low'} size="sm" />
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <Link
                      to="/admin/centers"
                      className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-emerald-100 text-gray-700 hover:text-emerald-800 text-xs font-semibold"
                    >
                      Throttle Quota
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
