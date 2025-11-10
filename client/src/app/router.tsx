import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '@/app/layout/AppLayout';
import AdminDashboard from '@/features/dashboard/AdminDashboard';
import AssetsListPage from '@/features/assets/pages/AssetsListPage';
import AssetDetailsPage from '@/features/assets/pages/AssetDetailsPage';
import TicketsListPage from '@/features/tickets/pages/TicketsListPage';
import TicketDetailsPage from '@/features/tickets/pages/TicketDetailsPage';
import MyAssetsPage from '@/features/assets/pages/MyAssetsPage';
import MyTicketsPage from '@/features/tickets/pages/MyTicketsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'assets', element: <AssetsListPage /> },
      { path: 'assets/new', element: <AssetDetailsPage /> },
      { path: 'assets/:id', element: <AssetDetailsPage /> },
      { path: 'tickets', element: <TicketsListPage /> },
      { path: 'tickets/:id', element: <TicketDetailsPage /> },
      { path: 'my/assets', element: <MyAssetsPage /> },
      { path: 'my/tickets', element: <MyTicketsPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);