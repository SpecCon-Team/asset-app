import { useState, useEffect } from 'react';

export interface CurrentUser {
  email: string;
  role: 'ADMIN' | 'USER' | 'TECHNICIAN';
  id?: string;
  name?: string;
}

export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
        setCurrentUser(null);
      }
    }
  }, []);

  return currentUser;
}

export function getCurrentUserEmail(): string | null {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.email || null;
    }
  } catch (error) {
    console.error('Error getting user email:', error);
  }
  return null;
}

export function getCurrentUserId(): string | null {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.id || null;
    }
  } catch (error) {
    console.error('Error getting user ID:', error);
  }
  return null;
}

export function getCurrentUserRole(): string | null {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.role || null;
    }
  } catch (error) {
    console.error('Error getting user role:', error);
  }
  return null;
}

export function isAdmin(): boolean {
  const role = getCurrentUserRole();
  return role === 'ADMIN';
}

export function isTechnician(): boolean {
  const role = getCurrentUserRole();
  return role === 'TECHNICIAN' || role === 'ADMIN';
}
