import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import AppShell from './components/layout/AppShell';
import ErrorBoundary from './components/common/ErrorBoundary';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

import BookAppointmentPage from './pages/patient/BookAppointmentPage';
import MyAppointmentsPage from './pages/patient/MyAppointmentsPage';
import MyPrescriptionsPage from './pages/patient/MyPrescriptionsPage';

import ReceptionQueuePage from './pages/receptionist/ReceptionQueuePage';
import RegisterWalkInPage from './pages/receptionist/RegisterWalkInPage';

import DoctorQueuePage from './pages/doctor/DoctorQueuePage';
import ConsultationPage from './pages/doctor/ConsultationPage';
import AIClinicalDashboard from './pages/doctor/AIClinicalDashboard';

import VerifyPrescriptionPage from './pages/pharmacist/VerifyPrescriptionPage';
import InventoryPage from './pages/pharmacist/InventoryPage';
import AdminOverviewPage from './pages/admin/AdminOverviewPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import FollowUpsPage from './pages/shared/FollowUpsPage';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                fontSize: 14,
                borderRadius: 8,
                background: 'var(--surface)',
                color: 'var(--ink)',
                border: '1px solid var(--border)',
              },
              success: { iconTheme: { primary: '#0e6e5c', secondary: '#fff' } },
              error: { iconTheme: { primary: '#9c3b3b', secondary: '#fff' } },
            }}
          />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route
              element={
                <ProtectedRoute allowedRoles={['patient', 'receptionist', 'doctor', 'pharmacist', 'admin']}>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route path="/patient/book" element={<BookAppointmentPage />} />
              <Route path="/patient/appointments" element={<MyAppointmentsPage />} />
              <Route path="/patient/prescriptions" element={<MyPrescriptionsPage />} />

              <Route path="/receptionist/queue" element={<ReceptionQueuePage />} />
              <Route path="/receptionist/book" element={<RegisterWalkInPage />} />
              <Route path="/receptionist/followups" element={<FollowUpsPage />} />

              <Route path="/doctor/queue" element={<DoctorQueuePage />} />
              <Route path="/doctor/consultations" element={<ConsultationPage />} />
              <Route path="/doctor/ai-clinical" element={<AIClinicalDashboard />} />
              <Route path="/doctor/followups" element={<FollowUpsPage />} />

              <Route path="/pharmacist/prescriptions" element={<VerifyPrescriptionPage />} />
              <Route path="/pharmacist/inventory" element={<InventoryPage />} />

              <Route path="/admin/overview" element={<AdminOverviewPage />} />
              <Route path="/admin/reports" element={<AdminReportsPage />} />
              <Route path="/admin/followups" element={<FollowUpsPage />} />
            </Route>

            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}