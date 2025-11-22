import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing Command Palette state
 *
 * Handles:
 * - Global keyboard shortcut (⌘K / Ctrl+K)
 * - Open/close state
 * - Additional shortcuts (G H, G T, etc.)
 *
 * @example
 * function App() {
 *   const { isOpen, open, close } = useCommandPalette();
 *
 *   return (
 *     <>
 *       <button onClick={open}>Open Palette</button>
 *       <CommandPalette isOpen={isOpen} onClose={close} />
 *     </>
 *   );
 * }
 */
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }

      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        close();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggle, close]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}

export default useCommandPalette;
