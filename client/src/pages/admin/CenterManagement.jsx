import React, { useState, useEffect } from 'react';
import { centersAPI } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiLocationMarker,
  HiOutlineAdjustments,
  HiCheck,
} from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function CenterManagement() {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCenter, setEditingCenter] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    district: 'Indore',
    state: 'Madhya Pradesh',
    capacityPerHour: 15,
    dailyCapacity: 120,
    acceptedCrops: ['Wheat', 'Gram', 'Mustard'],
    crowdStatus: 'low',
    status: 'open',
  });

  const loadCenters = async () => {
    try {
      setLoading(true);
      const res = await centersAPI.getAll();
      if (res.data?.success) {
        setCenters(res.data.data || []);
      }
    } catch (err) {
      toast.error('Failed to load procurement centers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCenters();
  }, []);

  const handleUpdateCenter = async (id, updates) => {
    try {
      const res = await centersAPI.update(id, updates);
      if (res.data?.success) {
        toast.success('Procurement center updated successfully');
        loadCenters();
        setEditingCenter(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update center');
    }
  };

  const handleCreateCenter = async (e) => {
    e.preventDefault();
    try {
      const res = await centersAPI.create(formData);
      if (res.data?.success) {
        toast.success('New procurement center established!');
        setShowAddModal(false);
        loadCenters();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create center');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Procurement Centers & Quotas
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure hourly yard capacity, accepted crops, and crowd alerts
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md transition-all self-start sm:self-auto"
        >
          <HiPlus className="w-4 h-4" />
          <span>Add New Mandi Center</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {centers.map((c) => (
          <div
            key={c._id}
            className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">{c.name}</h3>
                  <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <HiLocationMarker className="w-3.5 h-3.5 text-gray-400" />
                    <span>{c.district}, {c.state}</span>
                  </div>
                </div>
                <StatusBadge status={c.crowdStatus || 'low'} size="sm" />
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-400 block">Hourly Limit:</span>
                  <span className="font-bold text-gray-800">{c.capacityPerHour || 15} trolleys/hr</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Daily Cap:</span>
                  <span className="font-bold text-gray-800">{c.dailyCapacity || 120} trolleys</span>
                </div>
              </div>

              <div className="mt-3">
                <span className="text-[11px] text-gray-400 block mb-1">Accepted Crops:</span>
                <div className="flex flex-wrap gap-1">
                  {(c.acceptedCrops || ['Wheat', 'Gram']).map((crop) => (
                    <span
                      key={crop}
                      className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-semibold"
                    >
                      {crop}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Adjustment Controls */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-gray-500 font-medium">Quick Congestion:</span>
              <div className="flex gap-1">
                {['low', 'medium', 'high'].map((status) => (
                  <button
                    key={status}
                    onClick={() => handleUpdateCenter(c._id, { crowdStatus: status })}
                    className={`px-2 py-1 rounded text-[10px] uppercase font-bold transition-all ${
                      c.crowdStatus === status
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Mandi Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-gray-900">Add Procurement Center</h3>
            <form onSubmit={handleCreateCenter} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Center Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Sehore Krishi Upaj Mandi"
                  className="w-full px-3 py-2 text-sm border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">District</label>
                  <input
                    type="text"
                    required
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Hourly Quota</label>
                  <input
                    type="number"
                    required
                    value={formData.capacityPerHour}
                    onChange={(e) => setFormData({ ...formData, capacityPerHour: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border rounded-xl"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700"
                >
                  Create Center
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border text-sm font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
