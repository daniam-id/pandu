// Tujuan    : Layout wrapper providing scrollable content area with bottom nav clearance
// Caller    : App.tsx (top-level layout)
// Dependensi: react-router-dom (Outlet), Navbar
// Main Func : Wraps page content with bottom padding for fixed navbar
// Side Effects: None

import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function AppShell() {
  return (
    <div className="flex flex-col h-full">
      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>
      <Navbar />
    </div>
  );
}
