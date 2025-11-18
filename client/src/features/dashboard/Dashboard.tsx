import React, { useMemo } from 'react';
import AdminDashboard from './AdminDashboard';
import TechnicianDashboard from './TechnicianDashboard';
import UserDashboard from './UserDashboard';

export default function Dashboard() {
  // Get user role immediately from localStorage to prevent multiple renders
  const userRole = useMemo(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.role || 'USER';
      } catch (error) {
        console.error('Error parsing user data:', error);
        return 'USER';
      }
    }
    return 'USER';
  }, []);

  // Show role-specific dashboards - each dashboard loads independently
  if (userRole === 'ADMIN') {
    return <AdminDashboard />;
  }

  if (userRole === 'TECHNICIAN') {
    return <TechnicianDashboard />;
  }

  return <UserDashboard />;
}
