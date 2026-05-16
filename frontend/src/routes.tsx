import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AppShell from '@/components/AppShell';
import DashboardPage from '@/pages/DashboardPage';
import SimulatorPage from '@/pages/SimulatorPage';
import NotFoundPage from '@/pages/NotFoundPage';

/**
 * Application route tree.
 * Wrapped by AppShell (Navbar + layout) for every matched route.
 *
 * Co-located with the `Routes` component below so HMR fast-refresh is disabled here intentionally.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <AppShell />,
      children: [
        { index: true, element: <DashboardPage /> },
        { path: 'simulator', element: <SimulatorPage /> },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ],
  {
    // Future flags per React Router v7 migration guide.
    future: {
      v7_relativeSplatPath: true,
    },
  },
);

export function Routes() {
  return <RouterProvider router={router} />;
}
