import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '@/app/layout/AppLayout';

// Modern loading fallback component - 100% visual, no text
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
    <div className="flex items-center justify-center gap-3">
      <div className="w-5 h-5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-5 h-5 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-5 h-5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
  </div>
);

// Lazy load all pages for better performance
const Dashboard = lazy(() => import('@/features/dashboard/Dashboard'));
const AssetsListPage = lazy(() => import('@/features/assets/pages/AssetsListPage'));
const AssetDetailsPage = lazy(() => import('@/features/assets/pages/AssetDetailsPage'));
const TicketsListPage = lazy(() => import('@/features/tickets/pages/TicketsListPage'));
const TicketDetailsPage = lazy(() => import('@/features/tickets/pages/TicketDetailsPage'));
const NewTicketPage = lazy(() => import('@/features/tickets/pages/NewTicketPage'));
const MyAssetsPage = lazy(() => import('@/features/assets/pages/MyAssetsPage'));
const MyTicketsPage = lazy(() => import('@/features/tickets/pages/MyTicketsPage'));
const MyTasksPage = lazy(() => import('@/features/tickets/pages/MyTasksPage'));
const MyClientsPage = lazy(() => import('@/features/users/pages/MyClientsPage'));
const MyPEGPage = lazy(() => import('@/features/peg/MyPEGPage'));
const ProvinceDetailsPage = lazy(() => import('@/features/peg/ProvinceDetailsPage'));
const TravelPlanPage = lazy(() => import('@/features/travel/TravelPlanPage'));
const MyProfilePage = lazy(() => import('@/features/users/pages/MyProfilePage'));
const GeneralSettingsPage = lazy(() => import('@/features/users/pages/GeneralSettingsPage'));
const TwoFactorManagementPage = lazy(() => import('@/features/users/pages/TwoFactorManagementPage'));
const WhatsAppSetup = lazy(() => import('@/features/whatsapp/WhatsAppSetup'));
const AuditLogsPage = lazy(() => import('@/features/auditLogs/AuditLogsPage'));
const LoginPage = lazy(() => import('@/features/auth/LoginPage'));
const SignUpPage = lazy(() => import('@/features/auth/SignUpPage'));
const ForgotPasswordPage = lazy(() => import('@/features/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/features/auth/ResetPasswordPage'));
const VerifyOTPPage = lazy(() => import('@/features/auth/VerifyOTPPage'));
const TwoFactorSetupPage = lazy(() => import('@/features/auth/TwoFactorSetupPage'));
const PrivacyDashboard = lazy(() => import('@/features/privacy/PrivacyDashboard'));
const AnalyticsPage = lazy(() => import('@/features/reports/AnalyticsPage'));
const WorkflowsPage = lazy(() => import('@/features/workflows/pages/WorkflowsPage'));
const SLAPoliciesPage = lazy(() => import('@/features/workflows/pages/SLAPoliciesPage'));
const AssignmentRulesPage = lazy(() => import('@/features/workflows/pages/AssignmentRulesPage'));
const WorkflowHistoryPage = lazy(() => import('@/features/workflows/pages/WorkflowHistoryPage'));
const MaintenancePage = lazy(() => import('@/features/maintenance/MaintenancePage'));
const MaintenanceFormPage = lazy(() => import('@/features/maintenance/MaintenanceFormPage'));
const MaintenanceDetailPage = lazy(() => import('@/features/maintenance/MaintenanceDetailPage'));
const CheckoutPage = lazy(() => import('@/features/checkout/CheckoutPage'));
const CheckoutFormPage = lazy(() => import('@/features/checkout/CheckoutFormPage'));
const CheckoutDetailPage = lazy(() => import('@/features/checkout/CheckoutDetailPage'));
const QRScannerPage = lazy(() => import('@/features/checkout/QRScannerPage'));
const QRGeneratorPage = lazy(() => import('@/features/checkout/QRGeneratorPage'));
const InventoryPage = lazy(() => import('@/features/inventory/InventoryPage'));
const InventoryFormPage = lazy(() => import('@/features/inventory/InventoryFormPage'));
const InventoryDetailPage = lazy(() => import('@/features/inventory/InventoryDetailPage'));
const DownloadMobileApp = lazy(() => import('@/pages/DownloadMobileApp'));
const HelpAndResources = lazy(() => import('@/pages/HelpAndResources'));

// Wrapper component to add Suspense boundary
const LazyPage = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LazyPage><LoginPage /></LazyPage>,
  },
  {
    path: '/signup',
    element: <LazyPage><SignUpPage /></LazyPage>,
  },
  {
    path: '/forgot-password',
    element: <LazyPage><ForgotPasswordPage /></LazyPage>,
  },
  {
    path: '/reset-password/:token',
    element: <LazyPage><ResetPasswordPage /></LazyPage>,
  },
  {
    path: '/verify-otp',
    element: <LazyPage><VerifyOTPPage /></LazyPage>,
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <LazyPage><Dashboard /></LazyPage> },
      { path: 'assets', element: <LazyPage><AssetsListPage /></LazyPage> },
      { path: 'assets/new', element: <LazyPage><AssetDetailsPage /></LazyPage> },
      { path: 'assets/:id', element: <LazyPage><AssetDetailsPage /></LazyPage> },
      { path: 'tickets', element: <LazyPage><TicketsListPage /></LazyPage> },
      { path: 'tickets/new', element: <LazyPage><NewTicketPage /></LazyPage> },
      { path: 'tickets/:id', element: <LazyPage><TicketDetailsPage /></LazyPage> },
      { path: 'my-tasks', element: <LazyPage><MyTasksPage /></LazyPage> },
      { path: 'my-clients', element: <LazyPage><MyClientsPage /></LazyPage> },
      { path: 'my-assets', element: <LazyPage><MyAssetsPage /></LazyPage> },
      { path: 'my-tickets', element: <LazyPage><MyTicketsPage /></LazyPage> },
      { path: 'my-peg', element: <LazyPage><MyPEGPage /></LazyPage> },
      { path: 'my-peg/:provinceId', element: <LazyPage><ProvinceDetailsPage /></LazyPage> },
      { path: 'travel-plan', element: <LazyPage><TravelPlanPage /></LazyPage> },
      { path: 'my-profile', element: <LazyPage><MyProfilePage /></LazyPage> },
      { path: 'settings', element: <LazyPage><GeneralSettingsPage /></LazyPage> },
      { path: '2fa-setup', element: <LazyPage><TwoFactorSetupPage /></LazyPage> },
      { path: '2fa-management', element: <LazyPage><TwoFactorManagementPage /></LazyPage> },
      { path: 'privacy', element: <LazyPage><PrivacyDashboard /></LazyPage> },
      { path: 'analytics', element: <LazyPage><AnalyticsPage /></LazyPage> },
      { path: 'audit-logs', element: <LazyPage><AuditLogsPage /></LazyPage> },
      { path: 'workflows', element: <LazyPage><WorkflowsPage /></LazyPage> },
      { path: 'sla-policies', element: <LazyPage><SLAPoliciesPage /></LazyPage> },
      { path: 'assignment-rules', element: <LazyPage><AssignmentRulesPage /></LazyPage> },
      { path: 'workflow-history', element: <LazyPage><WorkflowHistoryPage /></LazyPage> },
      { path: 'maintenance', element: <LazyPage><MaintenancePage /></LazyPage> },
      { path: 'maintenance/new', element: <LazyPage><MaintenanceFormPage /></LazyPage> },
      { path: 'maintenance/:id', element: <LazyPage><MaintenanceDetailPage /></LazyPage> },
      { path: 'maintenance/:id/edit', element: <LazyPage><MaintenanceFormPage /></LazyPage> },
      { path: 'checkout', element: <LazyPage><CheckoutPage /></LazyPage> },
      { path: 'checkout/new', element: <LazyPage><CheckoutFormPage /></LazyPage> },
      { path: 'checkout/scan', element: <LazyPage><QRScannerPage /></LazyPage> },
      { path: 'checkout/qr/generate', element: <LazyPage><QRGeneratorPage /></LazyPage> },
      { path: 'checkout/:id', element: <LazyPage><CheckoutDetailPage /></LazyPage> },
      { path: 'checkout/:id/edit', element: <LazyPage><CheckoutFormPage /></LazyPage> },
      { path: 'inventory', element: <LazyPage><InventoryPage /></LazyPage> },
      { path: 'inventory/new', element: <LazyPage><InventoryFormPage /></LazyPage> },
      { path: 'inventory/:id', element: <LazyPage><InventoryDetailPage /></LazyPage> },
      { path: 'inventory/:id/edit', element: <LazyPage><InventoryFormPage /></LazyPage> },
      { path: 'whatsapp-setup', element: <LazyPage><WhatsAppSetup /></LazyPage> },
      { path: 'download-mobile-app', element: <LazyPage><DownloadMobileApp /></LazyPage> },
      { path: 'help', element: <LazyPage><HelpAndResources /></LazyPage> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);