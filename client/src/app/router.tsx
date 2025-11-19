import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '@/app/layout/AppLayout';
import Dashboard from '@/features/dashboard/Dashboard';
import AssetsListPage from '@/features/assets/pages/AssetsListPage';
import AssetDetailsPage from '@/features/assets/pages/AssetDetailsPage';
import TicketsListPage from '@/features/tickets/pages/TicketsListPage';
import TicketDetailsPage from '@/features/tickets/pages/TicketDetailsPage';
import NewTicketPage from '@/features/tickets/pages/NewTicketPage';
import MyAssetsPage from '@/features/assets/pages/MyAssetsPage';
import MyTicketsPage from '@/features/tickets/pages/MyTicketsPage';
import MyTasksPage from '@/features/tickets/pages/MyTasksPage';
import MyClientsPage from '@/features/users/pages/MyClientsPage';
import MyPEGPage from '@/features/peg/MyPEGPage';
import TravelPlanPage from '@/features/travel/TravelPlanPage';
import MyProfilePage from '@/features/users/pages/MyProfilePage';
import GeneralSettingsPage from '@/features/users/pages/GeneralSettingsPage';
import TwoFactorManagementPage from '@/features/users/pages/TwoFactorManagementPage';
import WhatsAppSetup from '@/features/whatsapp/WhatsAppSetup';
import AuditLogsPage from '@/features/auditLogs/AuditLogsPage';
import LoginPage from '@/features/auth/LoginPage';
import SignUpPage from '@/features/auth/SignUpPage';
import ForgotPasswordPage from '@/features/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/features/auth/ResetPasswordPage';
import VerifyOTPPage from '@/features/auth/VerifyOTPPage';
import TwoFactorSetupPage from '@/features/auth/TwoFactorSetupPage';
import PrivacyDashboard from '@/features/privacy/PrivacyDashboard';
import AnalyticsPage from '@/features/reports/AnalyticsPage';
import DownloadMobileApp from '@/pages/DownloadMobileApp';
import HelpAndResources from '@/pages/HelpAndResources';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignUpPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/reset-password/:token',
    element: <ResetPasswordPage />,
  },
  {
    path: '/verify-otp',
    element: <VerifyOTPPage />,
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'assets', element: <AssetsListPage /> },
      { path: 'assets/new', element: <AssetDetailsPage /> },
      { path: 'assets/:id', element: <AssetDetailsPage /> },
      { path: 'tickets', element: <TicketsListPage /> },
      { path: 'tickets/new', element: <NewTicketPage /> },
      { path: 'tickets/:id', element: <TicketDetailsPage /> },
      { path: 'my-tasks', element: <MyTasksPage /> },
      { path: 'my-clients', element: <MyClientsPage /> },
      { path: 'my-assets', element: <MyAssetsPage /> },
      { path: 'my-tickets', element: <MyTicketsPage /> },
      { path: 'my-peg', element: <MyPEGPage /> },
      { path: 'travel-plan', element: <TravelPlanPage /> },
      { path: 'my-profile', element: <MyProfilePage /> },
      { path: 'settings', element: <GeneralSettingsPage /> },
      { path: '2fa-setup', element: <TwoFactorSetupPage /> },
      { path: '2fa-management', element: <TwoFactorManagementPage /> },
      { path: 'privacy', element: <PrivacyDashboard /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'audit-logs', element: <AuditLogsPage /> },
      { path: 'whatsapp-setup', element: <WhatsAppSetup /> },
      { path: 'download-mobile-app', element: <DownloadMobileApp /> },
      { path: 'help', element: <HelpAndResources /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);