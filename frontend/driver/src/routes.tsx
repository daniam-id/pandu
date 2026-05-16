// Tujuan    : React Router v6 route configuration for the driver app
// Caller    : App.tsx (RouterProvider)
// Dependensi: react-router-dom (createBrowserRouter, Navigate), AppShell, all page components
// Main Func : Maps URL paths to page components with AppShell layout wrapper
// Side Effects: None (client-side routing only)

import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppShell from '@/components/AppShell';
import OrdersPage from '@/pages/OrdersPage';
import OrderDetailPage from '@/pages/OrderDetailPage';
import RoutePage from '@/pages/RoutePage';
import ReportObstaclePage from '@/pages/ReportObstaclePage';
import ProfilePage from '@/pages/ProfilePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <OrdersPage /> },
      { path: 'orders', element: <OrdersPage /> },
      { path: 'orders/:orderId', element: <OrderDetailPage /> },
      { path: 'route/:orderId?', element: <RoutePage /> },
      { path: 'report', element: <ReportObstaclePage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
