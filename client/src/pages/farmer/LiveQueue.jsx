import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { centersAPI, queueAPI } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import {
  HiClock,
  HiLocationMarker,
  HiRefresh,
  HiOutlineUserGroup,
  HiSparkles,
  HiShieldCheck,
  HiVolumeUp,
} from 'react-icons/hi';

export default function LiveQueue() {
  const { queueUpdates } = useSocket() || {};
  const [centers, setCenters] = useState([]);
  const [selectedCenterId, setSelectedCenterId] = useState('');
  const [queueState, setQueueState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Load all centers
  useEffect(() => {
    centersAPI.getAll()
      .then((res) => {
        if (res.data?.success && res.data.data.length > 0) {
          setCenters(res.data.data);
          setSelectedCenterId(res.data.data[0]._id);
        }
      })
      .catch(console.error);
  }, []);

  const fetchQueue = async (centerId) => {
    if (!centerId) return;
    try {
      setLoading(true);
      const res = await queueAPI.getCenterQueue(centerId);
      if (res.data?.success) {
        setQueueState(res.data.data);
        setLastRefreshed(new Date());
      }
    } catch (err) {
      console.error('Failed to load live queue', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCenterId) {
      fetchQueue(selectedCenterId);
    }
  }, [selectedCenterId]);

  // Listen to live socket updates for this center
  useEffect(() => {
    if (queueUpdates && queueUpdates.centerId === selectedCenterId) {
      setQueueState(queueUpdates);
      setLastRefreshed(new Date());
    }
  }, [queueUpdates, selectedCenterId]);

  const currentCenter = centers.find((c) => c._id === selectedCenterId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Center Switcher */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              Live Mandi Telemetry Board
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Procurement Yard & Weighbridge Queue
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time automated queue broadcast. Updates instantly via WebSocket.
          </p>
        </div>

        {/* Center Selector Dropdown & Refresh */}
        <div className="flex items-center gap-3">
          <select
            value={selectedCenterId}
            onChange={(e) => setSelectedCenterId(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {centers.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} ({c.district})
              </option>
            ))}
          </select>
          <button
            onClick={() => fetchQueue(selectedCenterId)}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Refresh Queue"
          >
            <HiRefresh className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Electronic Queue Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Currently at Weighbridge */}
        <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white p-6 rounded-3xl border border-emerald-700/50 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <HiShieldCheck className="w-32 h-32" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold tracking-wider text-emerald-300 uppercase">
                Currently Being Weighed
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                BAY #1 ACTIVE
              </span>
            </div>
            <div className="text-5xl font-black text-emerald-400 tracking-wider">
              #{queueState?.currentlyServing?.tokenNumber || 'TK-108'}
            </div>
            <div className="mt-4 space-y-1 text-sm text-emerald-100">
              <div className="font-semibold text-white">
                {queueState?.currentlyServing?.farmerName || 'Ramesh Kumar Patel'}
              </div>
              <div className="text-xs text-emerald-300">
                {queueState?.currentlyServing?.cropType || 'Wheat'} • {queueState?.currentlyServing?.estimatedQuantity || 45} Qtl
              </div>
              <div className="text-xs text-emerald-300 font-mono">
                Vehicle: {queueState?.currentlyServing?.vehicleNumber || 'MP-09-EA-4210'}
              </div>
            </div>
          </div>
          <div className="mt-6 pt-3 border-t border-emerald-800/60 flex items-center justify-between text-xs text-emerald-300">
            <span>Status: Gross Weight In Progress</span>
            <span className="animate-pulse">● Live</span>
          </div>
        </div>

        {/* Card 2: Next In Line (Reporting to Gate) */}
        <div className="bg-gradient-to-br from-teal-900 to-teal-950 text-white p-6 rounded-3xl border border-teal-700/50 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold tracking-wider text-teal-300 uppercase">
                Next In Line (Called to Gate)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                GATE ENTRY
              </span>
            </div>
            <div className="text-5xl font-black text-teal-300 tracking-wider">
              #{queueState?.nextInLine?.tokenNumber || 'TK-109'}
            </div>
            <div className="mt-4 space-y-1 text-sm text-teal-100">
              <div className="font-semibold text-white">
                {queueState?.nextInLine?.farmerName || 'Devendra Singh'}
              </div>
              <div className="text-xs text-teal-300">
                {queueState?.nextInLine?.cropType || 'Chana (Gram)'} • {queueState?.nextInLine?.estimatedQuantity || 35} Qtl
              </div>
              <div className="text-xs text-teal-300 font-mono">
                Vehicle: {queueState?.nextInLine?.vehicleNumber || 'MP-09-ZK-8821'}
              </div>
            </div>
          </div>
          <div className="mt-6 pt-3 border-t border-teal-800/60 flex items-center justify-between text-xs text-teal-300">
            <span>Estimated Gate Arrival: ~5 mins</span>
            <span className="text-amber-300 font-medium flex items-center gap-1">
              <HiVolumeUp className="w-3.5 h-3.5" /> Announced
            </span>
          </div>
        </div>

        {/* Card 3: Mandi Yard Statistics */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-md flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold tracking-wider text-gray-400 uppercase">
              Yard Congestion & Throughput
            </span>
            <div className="mt-3 flex items-center gap-2">
              <StatusBadge status={currentCenter?.crowdStatus || 'low'} size="lg" />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100">
                <span className="text-xs text-gray-500 block">Vehicles in Queue</span>
                <span className="text-2xl font-black text-gray-900">
                  {queueState?.queueLength || '4'}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100">
                <span className="text-xs text-gray-500 block">Avg Wait Time</span>
                <span className="text-2xl font-black text-emerald-600">
                  {queueState?.avgWaitMinutes || '25'}m
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500 flex justify-between">
            <span>Center: {currentCenter?.name || 'Indore Mandi'}</span>
            <span>Refreshed: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>

      {/* Full Queue Vehicles Table */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
        <h3 className="font-bold text-lg text-gray-900 mb-4">
          Upcoming Queue Vehicles (Ordered by Token Sequence)
        </h3>

        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading live queue...</div>
        ) : (!queueState?.waitingList || queueState.waitingList.length === 0) ? (
          <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            No pending vehicles currently waiting in yard queue.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-gray-400 border-b border-gray-100">
                <tr>
                  <th className="py-3 px-3">Position</th>
                  <th className="py-3 px-3">Token #</th>
                  <th className="py-3 px-3">Farmer</th>
                  <th className="py-3 px-3">Crop & Qty</th>
                  <th className="py-3 px-3">Vehicle</th>
                  <th className="py-3 px-3">Slot Window</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {queueState.waitingList.map((item, index) => (
                  <tr key={item._id || index} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3.5 px-3 font-bold text-gray-400">
                      #{index + 1}
                    </td>
                    <td className="py-3.5 px-3 font-black text-emerald-800 text-base">
                      #{item.tokenNumber}
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-gray-900">
                      {item.farmerName || item.farmer?.name || 'Farmer'}
                    </td>
                    <td className="py-3.5 px-3 text-gray-600">
                      {item.cropType} • {item.estimatedQuantity} Qtl
                    </td>
                    <td className="py-3.5 px-3 font-mono text-xs text-gray-700">
                      {item.vehicleNumber || 'Registered'} ({item.vehicleType || 'Tractor'})
                    </td>
                    <td className="py-3.5 px-3 text-gray-600">
                      {item.timeSlot}
                    </td>
                    <td className="py-3.5 px-3">
                      <StatusBadge status={item.status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
