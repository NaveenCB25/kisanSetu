import axios from 'axios';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Add JWT token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('profile');
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────
export const authAPI = {
  registerFarmer: (data) => api.post('/auth/register/farmer', data),
  registerCenter: (data) => api.post('/auth/register/center', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateFcmToken: (fcmToken) => api.put('/auth/fcm-token', { fcmToken }),
};

// ── Bookings ──────────────────────────────────
export const bookingAPI = {
  create: (data) => api.post('/bookings', data),
  getMy: (params) => api.get('/bookings/my', { params }),
  getOne: (id) => api.get(`/bookings/${id}`),
  cancel: (id) => api.put(`/bookings/${id}/cancel`),
  reschedule: (id, data) => api.put(`/bookings/${id}/reschedule`, data),
  getRecommendation: (centerId, date) => api.get(`/bookings/recommend/${centerId}/${date}`),
};

// Frontend friendly bookings wrapper
export const bookingsAPI = {
  create: async (data) => {
    // Look up or auto-resolve slot if needed
    try {
      const slotsRes = await api.get(`/slots/${data.procurementCenterId}/${data.slotDate}`);
      const availableSlot = slotsRes.data?.data?.[0];
      const slotId = availableSlot?._id;

      return await api.post('/bookings', {
        center: data.procurementCenterId,
        date: data.slotDate,
        slot: slotId,
        cropCategory: 'Cereals',
        cropName: data.cropType,
        declaredQuantity: data.estimatedQuantity,
        vehicleType: data.vehicleType,
        vehicleNumber: data.vehicleNumber,
      });
    } catch {
      return await api.post('/bookings', {
        center: data.procurementCenterId,
        date: data.slotDate,
        cropCategory: 'Cereals',
        cropName: data.cropType,
        declaredQuantity: data.estimatedQuantity,
        vehicleType: data.vehicleType,
        vehicleNumber: data.vehicleNumber,
      });
    }
  },
  getMyBookings: async () => {
    const res = await api.get('/bookings/my');
    if (res.data?.success && Array.isArray(res.data.data)) {
      res.data.data = res.data.data.map((b) => ({
        ...b,
        cropType: b.cropName,
        estimatedQuantity: b.declaredQuantity,
        centerName: b.center?.centerName || 'Mandi Center',
        slotDate: b.date,
        timeSlot: b.slot?.timeSlot ? `${b.slot.timeSlot.start} - ${b.slot.timeSlot.end}` : '10:00 - 11:00',
      }));
    }
    return res;
  },
  getAll: (params) => api.get('/centers/appointments', { params }),
  getAvailableSlots: async (centerId, date) => {
    const res = await api.get(`/slots/${centerId}/${date}`);
    if (res.data?.success && Array.isArray(res.data.data)) {
      res.data.data = res.data.data.map((s) => ({
        slot: `${s.timeSlot?.start || '10:00'} - ${s.timeSlot?.end || '12:00'}`,
        totalCapacity: s.maxCapacity || 15,
        bookedCount: s.currentBookings || 0,
      }));
    }
    return res;
  },
  updateStatus: async (bookingId, { status }) => {
    if (status === 'waiting') return api.put(`/centers/checkin/${bookingId}`);
    if (status === 'called') return api.put('/centers/call-next');
    if (status === 'inside_mandi') return api.put(`/centers/checkin/${bookingId}`);
    return api.put(`/bookings/${bookingId}`, { status });
  },
  recordWeighment: (payload) =>
    api.post(`/centers/weighing/${payload.bookingId}`, {
      grossWeight: payload.grossWeight,
      tareWeight: payload.tareWeight,
      moisturePercentage: payload.moisturePercentage,
      qualityGrade: payload.qualityGrade,
      qualityScore: payload.qualityGrade === 'FAQ' ? 85 : 70,
      moisture: payload.moisturePercentage,
    }),
  verifyToken: (token) => api.get(`/bookings/${token}`),
  cancel: (id) => api.put(`/bookings/${id}/cancel`),
};

// ── Slots ─────────────────────────────────────
export const slotAPI = {
  getCenters: () => api.get('/slots/centers'),
  getSlots: (centerId, date) => api.get(`/slots/${centerId}/${date}`),
};

// ── Queue ─────────────────────────────────────
export const queueAPI = {
  getInfo: (centerId) => api.get(`/queue/${centerId}`),
  getPosition: (bookingId) => api.get(`/queue/position/${bookingId}`),
  getCenterQueue: async (centerId) => {
    try {
      const res = await api.get(`/queue/${centerId}`);
      if (res.data?.success) {
        const q = res.data.data;
        return {
          data: {
            success: true,
            data: {
              queueLength: q.totalWaiting || (q.queue ? q.queue.length : 0),
              avgWaitMinutes: q.estimatedWaitTime || 25,
              currentlyServing: q.currentlyServing || (q.queue?.[0] ? {
                tokenNumber: q.queue[0].tokenNumber,
                farmerName: q.queue[0].farmer?.user?.name || 'Farmer',
                cropType: q.queue[0].cropName,
                estimatedQuantity: q.queue[0].declaredQuantity,
                vehicleNumber: 'MP-09-EA-4210',
              } : null),
              nextInLine: q.nextInLine || (q.queue?.[1] ? {
                tokenNumber: q.queue[1].tokenNumber,
                farmerName: q.queue[1].farmer?.user?.name || 'Farmer',
                cropType: q.queue[1].cropName,
                estimatedQuantity: q.queue[1].declaredQuantity,
                vehicleNumber: 'MP-09-ZK-8821',
              } : null),
              waitingList: (q.queue || []).map((item) => ({
                _id: item._id,
                tokenNumber: item.tokenNumber,
                farmerName: item.farmer?.user?.name || 'Farmer',
                cropType: item.cropName,
                estimatedQuantity: item.declaredQuantity,
                vehicleNumber: 'MP-09-TR-1024',
                vehicleType: 'Tractor',
                timeSlot: item.slot?.timeSlot ? `${item.slot.timeSlot.start} - ${item.slot.timeSlot.end}` : 'Active',
                status: item.status,
              })),
            },
          },
        };
      }
    } catch {
      // Mock fallback for graceful offline demo
    }
    return {
      data: {
        success: true,
        data: {
          queueLength: 4,
          avgWaitMinutes: 28,
          currentlyServing: {
            tokenNumber: 'TK-108',
            farmerName: 'Ramesh Kumar Patel',
            cropType: 'Wheat',
            estimatedQuantity: 45,
            vehicleNumber: 'MP-09-EA-4210',
          },
          nextInLine: {
            tokenNumber: 'TK-109',
            farmerName: 'Devendra Singh',
            cropType: 'Chana (Gram)',
            estimatedQuantity: 35,
            vehicleNumber: 'MP-09-ZK-8821',
          },
          waitingList: [
            { _id: '1', tokenNumber: 'TK-110', farmerName: 'Harish Verma', cropType: 'Wheat', estimatedQuantity: 50, vehicleNumber: 'MP-09-GH-9912', vehicleType: 'Tractor', timeSlot: '11:00 - 12:00', status: 'waiting' },
            { _id: '2', tokenNumber: 'TK-111', farmerName: 'Sunil Chouhan', cropType: 'Mustard', estimatedQuantity: 28, vehicleNumber: 'MP-09-BA-3321', vehicleType: 'Pickup', timeSlot: '11:00 - 12:00', status: 'waiting' },
            { _id: '3', tokenNumber: 'TK-112', farmerName: 'Rajesh Solanki', cropType: 'Gram', estimatedQuantity: 40, vehicleNumber: 'MP-09-JK-5431', vehicleType: 'Tractor', timeSlot: '12:00 - 13:00', status: 'booked' },
          ],
        },
      },
    };
  },
  callNext: (centerId) => api.put('/centers/call-next'),
};

// ── Centers ───────────────────────────────────
export const centerAPI = {
  getDashboard: () => api.get('/centers/dashboard'),
  getAppointments: (params) => api.get('/centers/appointments', { params }),
  checkIn: (bookingId) => api.put(`/centers/checkin/${bookingId}`),
  markNoShow: (bookingId) => api.put(`/centers/noshow/${bookingId}`),
  callNext: () => api.put('/centers/call-next'),
  submitWeighing: (bookingId, data) => api.post(`/centers/weighing/${bookingId}`, data),
  processPayment: (bookingId) => api.put(`/centers/payment/${bookingId}`),
  complete: (bookingId) => api.put(`/centers/complete/${bookingId}`),
  getPayments: (params) => api.get('/centers/payments', { params }),
  getBottleneck: () => api.get('/centers/bottleneck'),
};

export const centersAPI = {
  getAll: async () => {
    try {
      const res = await api.get('/slots/centers');
      if (res.data?.success && Array.isArray(res.data.data)) {
        return {
          data: {
            success: true,
            data: res.data.data.map((c) => ({
              _id: c._id,
              name: c.centerName,
              code: c.centerCode,
              district: c.district,
              state: 'Madhya Pradesh',
              address: c.address,
              capacityPerHour: 15,
              dailyCapacity: c.dailyCapacity || 120,
              crowdStatus: 'low',
              acceptedCrops: c.cropsHandled || ['Wheat', 'Gram', 'Mustard'],
            })),
          },
        };
      }
    } catch {
      // Offline fallback
    }
    return {
      data: {
        success: true,
        data: [
          { _id: '67001a111111111111111111', name: 'Indore Central Krishi Upaj Mandi', district: 'Indore', state: 'Madhya Pradesh', capacityPerHour: 15, dailyCapacity: 120, crowdStatus: 'low', acceptedCrops: ['Wheat', 'Gram', 'Mustard'] },
          { _id: '67001a222222222222222222', name: 'Dewas Krishikunj Grain Mandi', district: 'Dewas', state: 'Madhya Pradesh', capacityPerHour: 12, dailyCapacity: 90, crowdStatus: 'medium', acceptedCrops: ['Wheat', 'Soybean'] },
          { _id: '67001a333333333333333333', name: 'Ujjain Shri Mahakal Mandi', district: 'Ujjain', state: 'Madhya Pradesh', capacityPerHour: 20, dailyCapacity: 160, crowdStatus: 'low', acceptedCrops: ['Wheat', 'Gram', 'Paddy'] },
        ],
      },
    };
  },
  getDashboard: () => api.get('/centers/dashboard'),
  update: (id, updates) => api.put(`/admin/centers/${id}/status`, updates),
  create: (data) => api.post('/admin/centers', data),
};

// ── Admin ─────────────────────────────────────
export const adminAPI = {
  getOverview: () => api.get('/admin/overview'),
  getCenters: (params) => api.get('/admin/centers', { params }),
  addCenter: (data) => api.post('/admin/centers', data),
  updateCenterStatus: (id, status) => api.put(`/admin/centers/${id}/status`, { status }),
  toggleCenter: (id) => api.put(`/admin/centers/${id}/toggle`),
  getDailyTrend: () => api.get('/admin/analytics/daily-trend'),
  getCropWise: () => api.get('/admin/analytics/crop-wise'),
  getCenterLoad: () => api.get('/admin/analytics/center-load'),
  getWaitingTime: () => api.get('/admin/analytics/waiting-time'),
  getBottleneck: () => api.get('/admin/bottleneck'),
  getCropRates: () => api.get('/admin/crop-rates'),
  upsertCropRate: (data) => api.post('/admin/crop-rates', data),
  deleteCropRate: (id) => api.delete(`/admin/crop-rates/${id}`),
};

// ── Notifications ─────────────────────────────
export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

export const notificationsAPI = notificationAPI;

// ── Procurements ──────────────────────────────
export const procurementAPI = {
  getReceipt: (bookingId) => api.get(`/procurements/receipt/${bookingId}`),
  downloadPDF: (bookingId) =>
    api.get(`/procurements/receipt/${bookingId}/pdf`, { responseType: 'blob' }),
};

export default api;
