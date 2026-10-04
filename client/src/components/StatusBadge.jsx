import React from 'react';

const statusConfig = {
  // Booking Statuses
  booked: { label: 'Booked', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  confirmed: { label: 'Confirmed', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  waiting: { label: 'In Queue', bg: 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' },
  called: { label: 'Called to Gate', bg: 'bg-purple-50 text-purple-700 border-purple-200 animate-bounce' },
  inside_mandi: { label: 'Inside Mandi', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  weighment_done: { label: 'Weighment Done', bg: 'bg-teal-50 text-teal-700 border-teal-200' },
  quality_inspected: { label: 'Quality Verified', bg: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  payment_pending: { label: 'Payment Pending', bg: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  completed: { label: 'Completed', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  cancelled: { label: 'Cancelled', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
  delayed: { label: 'Delayed', bg: 'bg-orange-50 text-orange-700 border-orange-200' },

  // Center Statuses
  open: { label: 'Open', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  closed: { label: 'Closed', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
  at_capacity: { label: 'At Capacity', bg: 'bg-amber-50 text-amber-700 border-amber-200' },

  // Crowd status
  low: { label: 'Normal Traffic', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  medium: { label: 'Moderate Queue', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  high: { label: 'Heavy Queue', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export default function StatusBadge({ status, size = 'md', className = '' }) {
  const normKey = (status || '').toLowerCase().replace(/[\s-]/g, '_');
  const config = statusConfig[normKey] || { label: status || 'Unknown', bg: 'bg-gray-100 text-gray-700 border-gray-200' };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1 font-medium',
    lg: 'text-sm px-3 py-1.5 font-semibold',
  }[size] || 'text-xs px-2.5 py-1 font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${sizeClasses} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {config.label}
    </span>
  );
}
