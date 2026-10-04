import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LiveQueue from './pages/farmer/LiveQueue';
import FarmerDashboard from './pages/farmer/FarmerDashboard';
import BookSlot from './pages/farmer/BookSlot';
import MyBookings from './pages/farmer/MyBookings';
import OperatorDashboard from './pages/operator/OperatorDashboard';
import WeighmentForm from './pages/operator/WeighmentForm';
import AdminDashboard from './pages/admin/AdminDashboard';
import CenterManagement from './pages/admin/CenterManagement';

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-emerald-500 selection:text-white">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/queue" element={<LiveQueue />} />

                {/* Farmer Routes */}
                <Route
                  path="/farmer/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['farmer']}>
                      <FarmerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/farmer/book"
                  element={
                    <ProtectedRoute allowedRoles={['farmer']}>
                      <BookSlot />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/farmer/bookings"
                  element={
                    <ProtectedRoute allowedRoles={['farmer']}>
                      <MyBookings />
                    </ProtectedRoute>
                  }
                />

                {/* Mandi Operator Routes */}
                <Route
                  path="/operator/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['operator']}>
                      <OperatorDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/operator/weighment"
                  element={
                    <ProtectedRoute allowedRoles={['operator']}>
                      <WeighmentForm />
                    </ProtectedRoute>
                  }
                />

                {/* Admin / District Official Routes */}
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/centers"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <CenterManagement />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
            <Toaster position="top-right" />
          </div>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}
