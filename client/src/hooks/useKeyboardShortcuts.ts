/**
 * Keyboard Shortcuts Hook
 * Provides global keyboard shortcuts for power users
 */

import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  description: string;
  action: () => void;
}

const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

/**
 * Global keyboard shortcuts
 */
export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  const shortcuts: KeyboardShortcut[] = [
    // Navigation shortcuts
    {
      key: 'd',
      alt: true,
      description: 'Go to Dashboard',
      action: () => navigate('/'),
    },
    {
      key: 'a',
      alt: true,
      description: 'Go to Assets',
      action: () => navigate('/assets'),
    },
    {
      key: 't',
      alt: true,
      description: 'Go to Tickets',
      action: () => navigate('/tickets'),
    },
    {
      key: 'm',
      alt: true,
      description: 'Go to My Assets',
      action: () => navigate('/my-assets'),
    },
    {
      key: 'k',
      alt: true,
      description: 'Go to My Tickets',
      action: () => navigate('/my-tickets'),
    },
    {
      key: 'u',
      alt: true,
      description: 'Go to User Management',
      action: () => navigate('/my-clients'),
    },
    {
      key: 'p',
      alt: true,
      description: 'Go to Profile',
      action: () => navigate('/my-profile'),
    },

    // Action shortcuts
    {
      key: 'n',
      ctrl: true,
      alt: true,
      description: 'Create New (context-aware)',
      action: () => {
        const path = window.location.pathname;
        if (path.includes('asset')) {
          navigate('/assets/new');
        } else if (path.includes('ticket')) {
          navigate('/tickets/new');
        }
      },
    },

    // Search shortcut
    {
      key: 'f',
      ctrl: true,
      description: 'Focus Search',
      action: () => {
        const searchInput = document.querySelector<HTMLInputElement>('input[type="search"], input[placeholder*="Search"]');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      },
    },

    // Refresh shortcut
    {
      key: 'r',
      ctrl: true,
      shift: true,
      description: 'Refresh Data',
      action: () => {
        window.location.reload();
      },
    },
  ];

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Ctrl+F even in inputs
        if (!(event.ctrlKey && event.key.toLowerCase() === 'f')) {
          return;
        }
      }

      const matchedShortcut = shortcuts.find((shortcut) => {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;

        return keyMatch && ctrlMatch && altMatch && shiftMatch;
      });

      if (matchedShortcut) {
        event.preventDefault();
        matchedShortcut.action();
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return { shortcuts };
}

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.ctrl) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (shortcut.alt) {
    parts.push(isMac ? '⌥' : 'Alt');
  }
  if (shortcut.shift) {
    parts.push(isMac ? '⇧' : 'Shift');
  }

  parts.push(shortcut.key.toUpperCase());

  return parts.join(isMac ? '' : '+');
}

/**
 * Keyboard Shortcuts Help Modal Content
 */
export function getShortcutsHelp(): Array<{ category: string; shortcuts: KeyboardShortcut[] }> {
  const navigate = () => {}; // Placeholder for help display

  return [
    {
      category: 'Navigation',
      shortcuts: [
        { key: 'd', alt: true, description: 'Go to Dashboard', action: navigate },
        { key: 'a', alt: true, description: 'Go to Assets', action: navigate },
        { key: 't', alt: true, description: 'Go to Tickets', action: navigate },
        { key: 'm', alt: true, description: 'Go to My Assets', action: navigate },
        { key: 'k', alt: true, description: 'Go to My Tickets', action: navigate },
        { key: 'u', alt: true, description: 'Go to User Management', action: navigate },
        { key: 'p', alt: true, description: 'Go to Profile', action: navigate },
      ],
    },
    {
      category: 'Actions',
      shortcuts: [
        { key: 'n', ctrl: true, alt: true, description: 'Create New', action: navigate },
        { key: 'f', ctrl: true, description: 'Focus Search', action: navigate },
        { key: 'r', ctrl: true, shift: true, description: 'Refresh Data', action: navigate },
        { key: '?', shift: true, description: 'Show Keyboard Shortcuts', action: navigate },
      ],
    },
  ];
}
