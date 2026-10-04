import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { queueAPI, bookingsAPI, centersAPI } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import {
  HiQrcode,
  HiSearch,
  HiCheckCircle,
  HiVolumeUp,
  HiOutlineScale,
  HiTruck,
  HiArrowRight,
  HiUserGroup,
  HiClock,
} from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function OperatorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { queueUpdates } = useSocket() || {};

  const [centers, setCenters] = useState([]);
  const [selectedCenterId, setSelectedCenterId] = useState('');
  const [queueData, setQueueData] = useState(null);
  const [searchToken, setSearchToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [callingNext, setCallingNext] = useState(false);

  // Load operator's center or all centers
  useEffect(() => {
    centersAPI.getAll()
      .then((res) => {
        if (res.data?.success && res.data.data.length > 0) {
          setCenters(res.data.data);
          const initial = user?.assignedCenter || res.data.data[0]._id;
          setSelectedCenterId(initial);
        }
      })
      .catch(console.error);
  }, [user]);

  const loadQueue = async (centerId) => {
    if (!centerId) return;
    try {
      setLoading(true);
      const res = await queueAPI.getCenterQueue(centerId);
      if (res.data?.success) {
        setQueueData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCenterId) {
      loadQueue(selectedCenterId);
    }
  }, [selectedCenterId]);

  // Update on socket event
  useEffect(() => {
    if (queueUpdates && queueUpdates.centerId === selectedCenterId) {
      setQueueData(queueUpdates);
    }
  }, [queueUpdates, selectedCenterId]);

  // Call Next Token in Queue
  const handleCallNext = async () => {
    try {
      setCallingNext(true);
      const res = await queueAPI.callNext(selectedCenterId);
      if (res.data?.success) {
        toast.success(`Token #${res.data.data.tokenNumber} called to gate! Notification dispatched.`);
        loadQueue(selectedCenterId);
      } else {
        toast.error('No waiting tokens in queue');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to call next token');
    } finally {
      setCallingNext(false);
    }
  };

  // Update single token status
  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      const res = await bookingsAPI.updateStatus(bookingId, { status: newStatus });
      if (res.data?.success) {
        toast.success(`Status updated to ${newStatus}`);
        loadQueue(selectedCenterId);
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  // Handle Token Quick Search Verification
  const handleVerifySearch = async (e) => {
    e.preventDefault();
    if (!searchToken) return;
    try {
      const res = await bookingsAPI.verifyToken(searchToken.trim().replace('#', ''));
      if (res.data?.success) {
        const b = res.data.data;
        toast.success(`Verified: Farmer ${b.farmerName || b.farmer?.name}, Token #${b.tokenNumber}`);
        // If status is booked, advance to waiting / inside_mandi
        if (['booked', 'confirmed'].includes(b.status)) {
          await handleStatusUpdate(b._id, 'waiting');
        }
      }
    } catch (err) {
      toast.error('Token not found or invalid');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Console Bar */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              Mandi Operations Console
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Gate & Weighbridge Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Logged in as Operator: <strong>{user?.name || 'Mandi Incharge'}</strong>
          </p>
        </div>

        {/* Center Selector & Quick Call Next Button */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedCenterId}
            onChange={(e) => setSelectedCenterId(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm font-semibold focus:outline-none"
          >
            {centers.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleCallNext}
            disabled={callingNext}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <HiVolumeUp className="w-5 h-5 text-slate-950" />
            <span>{callingNext ? 'Calling...' : 'Call Next Token'}</span>
          </button>
        </div>
      </div>

      {/* Verification Scanner & Search Bar */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleVerifySearch} className="flex-1 flex gap-2 w-full">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <HiSearch className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchToken}
              onChange={(e) => setSearchToken(e.target.value)}
              placeholder="Verify Farmer Token (e.g. TK-108) or Scan Gate QR"
              className="w-full pl-10 pr-3.5 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm transition-all"
          >
            Verify Entry
          </button>
        </form>

        <Link
          to="/operator/weighment"
          className="px-5 py-3 rounded-2xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-sm font-bold border border-teal-200 transition-all flex items-center gap-2 shrink-0"
        >
          <HiOutlineScale className="w-5 h-5 text-teal-600" />
          <span>Record Weighment Slip</span>
        </Link>
      </div>

      {/* Queue Controller Table */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-gray-900">
            Active Vehicles in Mandi Yard ({queueData?.waitingList?.length || 0})
          </h3>
          <span className="text-xs text-gray-500 font-medium">
            Live updates via WebSocket
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading queue...</div>
        ) : (!queueData?.waitingList || queueData.waitingList.length === 0) ? (
          <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-2xl">
            No active tokens in yard. Click "Call Next Token" when vehicles arrive.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-gray-400 border-b border-gray-100">
                <tr>
                  <th className="py-3 px-3">Token #</th>
                  <th className="py-3 px-3">Farmer</th>
                  <th className="py-3 px-3">Crop & Qty</th>
                  <th className="py-3 px-3">Vehicle</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Gate Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {queueData.waitingList.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50/80 transition-colors">
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
                      {item.vehicleNumber || 'Registered'}
                    </td>
                    <td className="py-3.5 px-3">
                      <StatusBadge status={item.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-3 text-right space-x-2">
                      {item.status === 'booked' && (
                        <button
                          onClick={() => handleStatusUpdate(item._id, 'waiting')}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100"
                        >
                          Mark Arrived
                        </button>
                      )}
                      {item.status === 'waiting' && (
                        <button
                          onClick={() => handleStatusUpdate(item._id, 'called')}
                          className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-semibold hover:bg-purple-100"
                        >
                          Call to Gate
                        </button>
                      )}
                      {item.status === 'called' && (
                        <button
                          onClick={() => handleStatusUpdate(item._id, 'inside_mandi')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100"
                        >
                          Admit Inside
                        </button>
                      )}
                      {item.status === 'inside_mandi' && (
                        <Link
                          to={`/operator/weighment?bookingId=${item._id}`}
                          className="inline-block px-2.5 py-1 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 shadow-xs"
                        >
                          Weigh Now
                        </Link>
                      )}
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
