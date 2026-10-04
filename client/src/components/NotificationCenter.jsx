import React, { useState, useEffect, useRef } from 'react';
import { HiBell, HiCheck, HiTrash, HiExternalLink, HiExclamation } from 'react-icons/hi';
import { useSocket } from '../context/SocketContext';
import { notificationsAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function NotificationCenter() {
  const { notifications: liveNotifications } = useSocket() || { notifications: [] };
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch initial notifications
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationsAPI.getAll();
      if (res.data?.success) {
        setNotifications(res.data.data || []);
        const unread = (res.data.data || []).filter((n) => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  // Update when new live socket notification arrives
  useEffect(() => {
    if (liveNotifications && liveNotifications.length > 0) {
      const latest = liveNotifications[0];
      setNotifications((prev) => [latest, ...prev]);
      setUnreadCount((count) => count + 1);
    }
  }, [liveNotifications]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark notifications');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors focus:outline-none"
        aria-label="View notifications"
      >
        <HiBell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-gray-100 py-2 z-50 animate-scale-up origin-top-right">
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-gray-900 text-sm">Notifications</h4>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-emerald-600 hover:text-emerald-800 font-medium hover:underline flex items-center gap-1"
              >
                <HiCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {loading && notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                <HiBell className="w-8 h-8 mx-auto mb-1 text-gray-300" />
                <p className="text-xs">No notifications yet</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item._id || Math.random()}
                  onClick={() => !item.isRead && markAsRead(item._id)}
                  className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 hover:bg-gray-50 ${
                    !item.isRead ? 'bg-emerald-50/40 border-l-4 border-emerald-500' : ''
                  }`}
                >
                  <div
                    className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white ${
                      item.type === 'queue_alert'
                        ? 'bg-amber-500'
                        : item.type === 'token_assigned'
                        ? 'bg-blue-500'
                        : item.type === 'weighment_done'
                        ? 'bg-teal-500'
                        : item.type === 'payment'
                        ? 'bg-emerald-600'
                        : 'bg-emerald-600'
                    }`}
                  >
                    <HiExclamation className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">
                      {item.message}
                    </p>
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                    </span>
                  </div>
                  {!item.isRead && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 self-center" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
