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
import MyProfilePage from '@/features/users/pages/MyProfilePage';
import GeneralSettingsPage from '@/features/users/pages/GeneralSettingsPage';
import WhatsAppSetup from '@/features/whatsapp/WhatsAppSetup';
import LoginPage from '@/features/auth/LoginPage';
import SignUpPage from '@/features/auth/SignUpPage';

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
      { path: 'my/assets', element: <MyAssetsPage /> },
      { path: 'my/tickets', element: <MyTicketsPage /> },
      { path: 'my/profile', element: <MyProfilePage /> },
      { path: 'settings', element: <GeneralSettingsPage /> },
      { path: 'whatsapp-setup', element: <WhatsAppSetup /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);