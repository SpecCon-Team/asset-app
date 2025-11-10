import React from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';

export default function AppLayout() {
  const linkBase =
    'px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors';
  const active =
    'bg-gray-200';

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold">AssetTrack Pro</Link>
          <nav className="flex gap-2">
            <NavLink to="/" end className={({ isActive }) => `${linkBase} ${isActive ? active : ''}`}>Dashboard</NavLink>
            <NavLink to="/assets" className={({ isActive }) => `${linkBase} ${isActive ? active : ''}`}>Assets</NavLink>
            <NavLink to="/tickets" className={({ isActive }) => `${linkBase} ${isActive ? active : ''}`}>Tickets</NavLink>
            <NavLink to="/my/assets" className={({ isActive }) => `${linkBase} ${isActive ? active : ''}`}>My Assets</NavLink>
            <NavLink to="/my/tickets" className={({ isActive }) => `${linkBase} ${isActive ? active : ''}`}>My Tickets</NavLink>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <div className="max-w-7xl mx-auto p-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
}