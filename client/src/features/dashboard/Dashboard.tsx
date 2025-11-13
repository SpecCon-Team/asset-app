import React, { useEffect, useState } from 'react';
import AdminDashboard from './AdminDashboard';
import TechnicianDashboard from './TechnicianDashboard';

export default function Dashboard() {
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserRole(user.role);
    }
  }, []);

  // Show admin dashboard for admins, technician dashboard for technicians and users
  if (userRole === 'ADMIN') {
    return <AdminDashboard />;
  }

  return <TechnicianDashboard />;
}
