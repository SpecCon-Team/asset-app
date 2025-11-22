import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Ticket,
  Users,
  Package,
  Settings,
  BarChart3,
  FileText,
  Clock,
  Bell,
  LogOut,
  Home,
  PlusCircle,
  Filter,
  Download,
  Upload,
  Workflow,
  Shield,
  Plane,
  MessageSquare,
  Zap,
  X,
} from 'lucide-react';

interface Command {
  id: string;
  label: string;
  icon: React.ReactNode;
  keywords: string[];
  action: () => void;
  category: 'navigation' | 'actions' | 'settings' | 'other';
  shortcut?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Command Palette Component
 *
 * Keyboard-driven command interface for ultra-fast navigation and actions.
 * Activated with ⌘K (Mac) or Ctrl+K (Windows/Linux).
 *
 * Features:
 * - Fuzzy search across all commands
 * - Keyboard navigation (↑↓ arrows, Enter, Esc)
 * - Recent commands tracking
 * - Category organization
 * - Context-aware suggestions
 * - Responsive design
 *
 * @example
 * const [isOpen, setIsOpen] = useState(false);
 *
 * // Listen for keyboard shortcut
 * useEffect(() => {
 *   const handleKeyDown = (e: KeyboardEvent) => {
 *     if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
 *       e.preventDefault();
 *       setIsOpen(true);
 *     }
 *   };
 *   window.addEventListener('keydown', handleKeyDown);
 *   return () => window.removeEventListener('keydown', handleKeyDown);
 * }, []);
 *
 * return <CommandPalette isOpen={isOpen} onClose={() => setIsOpen(false)} />;
 */
export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentCommands, setRecentCommands] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Define all available commands
  const allCommands: Command[] = useMemo(() => {
    const user = localStorage.getItem('user');
    const userData = user ? JSON.parse(user) : null;
    const isAdmin = userData?.role === 'ADMIN';
    const isTechnician = userData?.role === 'TECHNICIAN';

    return [
      // Navigation
      {
        id: 'nav-home',
        label: 'Go to Dashboard',
        icon: <Home className="w-4 h-4" />,
        keywords: ['home', 'dashboard', 'main'],
        action: () => navigate('/'),
        category: 'navigation',
        shortcut: 'G H',
      },
      {
        id: 'nav-tickets',
        label: 'Go to Tickets',
        icon: <Ticket className="w-4 h-4" />,
        keywords: ['tickets', 'issues', 'support'],
        action: () => navigate(isAdmin || isTechnician ? '/tickets' : '/my-tickets'),
        category: 'navigation',
        shortcut: 'G T',
      },
      {
        id: 'nav-assets',
        label: 'Go to Assets',
        icon: <Package className="w-4 h-4" />,
        keywords: ['assets', 'inventory', 'equipment'],
        action: () => navigate('/assets'),
        category: 'navigation',
        shortcut: 'G A',
      },
      {
        id: 'nav-users',
        label: 'Go to Users',
        icon: <Users className="w-4 h-4" />,
        keywords: ['users', 'team', 'people'],
        action: () => navigate('/users'),
        category: 'navigation',
        shortcut: 'G U',
      },
      {
        id: 'nav-analytics',
        label: 'Go to Analytics',
        icon: <BarChart3 className="w-4 h-4" />,
        keywords: ['analytics', 'reports', 'stats', 'metrics'],
        action: () => navigate('/analytics'),
        category: 'navigation',
      },
      {
        id: 'nav-workflows',
        label: 'Go to Workflows',
        icon: <Workflow className="w-4 h-4" />,
        keywords: ['workflows', 'automation', 'rules'],
        action: () => navigate('/workflows'),
        category: 'navigation',
      },
      {
        id: 'nav-audit',
        label: 'Go to Audit Logs',
        icon: <Shield className="w-4 h-4" />,
        keywords: ['audit', 'logs', 'security', 'history'],
        action: () => navigate('/audit-logs'),
        category: 'navigation',
      },
      {
        id: 'nav-peg',
        label: 'Go to PEG Clients',
        icon: <Users className="w-4 h-4" />,
        keywords: ['peg', 'clients', 'customers'],
        action: () => navigate('/my-peg'),
        category: 'navigation',
      },
      {
        id: 'nav-travel',
        label: 'Go to Travel Planner',
        icon: <Plane className="w-4 h-4" />,
        keywords: ['travel', 'trips', 'planner'],
        action: () => navigate('/travel-plan'),
        category: 'navigation',
      },

      // Actions
      {
        id: 'action-new-ticket',
        label: 'Create New Ticket',
        icon: <PlusCircle className="w-4 h-4" />,
        keywords: ['new', 'create', 'ticket', 'issue'],
        action: () => navigate('/tickets/new'),
        category: 'actions',
        shortcut: 'C T',
      },
      {
        id: 'action-new-asset',
        label: 'Add New Asset',
        icon: <PlusCircle className="w-4 h-4" />,
        keywords: ['new', 'add', 'asset', 'inventory'],
        action: () => navigate('/assets/new'),
        category: 'actions',
        shortcut: 'C A',
      },
      {
        id: 'action-notifications',
        label: 'View Notifications',
        icon: <Bell className="w-4 h-4" />,
        keywords: ['notifications', 'alerts', 'updates'],
        action: () => navigate('/notifications'),
        category: 'actions',
        shortcut: 'N',
      },
      {
        id: 'action-search',
        label: 'Search Everything',
        icon: <Search className="w-4 h-4" />,
        keywords: ['search', 'find', 'lookup'],
        action: () => {
          // Focus on search if available
          const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
          if (searchInput) searchInput.focus();
        },
        category: 'actions',
        shortcut: '/',
      },

      // Settings
      {
        id: 'settings-profile',
        label: 'Edit Profile',
        icon: <Settings className="w-4 h-4" />,
        keywords: ['profile', 'settings', 'account', 'preferences'],
        action: () => navigate('/profile'),
        category: 'settings',
      },
      {
        id: 'settings-logout',
        label: 'Log Out',
        icon: <LogOut className="w-4 h-4" />,
        keywords: ['logout', 'signout', 'exit'],
        action: () => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        },
        category: 'settings',
      },
    ];
  }, [navigate]);

  // Fuzzy search implementation
  const fuzzyMatch = (str: string, query: string): number => {
    const lowerStr = str.toLowerCase();
    const lowerQuery = query.toLowerCase();

    // Exact match gets highest score
    if (lowerStr === lowerQuery) return 1000;

    // Starts with gets high score
    if (lowerStr.startsWith(lowerQuery)) return 500;

    // Contains gets medium score
    if (lowerStr.includes(lowerQuery)) return 100;

    // Fuzzy match
    let score = 0;
    let queryIndex = 0;

    for (let i = 0; i < lowerStr.length && queryIndex < lowerQuery.length; i++) {
      if (lowerStr[i] === lowerQuery[queryIndex]) {
        score += 10;
        queryIndex++;
      }
    }

    return queryIndex === lowerQuery.length ? score : 0;
  };

  // Filter and rank commands
  const filteredCommands = useMemo(() => {
    if (!searchQuery.trim()) {
      // Show recent commands when no search
      const recent = recentCommands
        .map(id => allCommands.find(cmd => cmd.id === id))
        .filter((cmd): cmd is Command => cmd !== undefined)
        .slice(0, 5);

      return recent.length > 0 ? recent : allCommands.slice(0, 8);
    }

    const results = allCommands
      .map(command => {
        const labelScore = fuzzyMatch(command.label, searchQuery);
        const keywordsScore = Math.max(
          ...command.keywords.map(kw => fuzzyMatch(kw, searchQuery))
        );
        const score = Math.max(labelScore, keywordsScore);

        return { command, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ command }) => command);

    return results;
  }, [searchQuery, allCommands, recentCommands]);

  // Reset state when opened/closed
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);

      // Load recent commands from localStorage
      const recent = localStorage.getItem('recentCommands');
      if (recent) {
        setRecentCommands(JSON.parse(recent));
      }
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            executeCommand(filteredCommands[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Auto-scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const executeCommand = (command: Command) => {
    // Save to recent commands
    const updated = [
      command.id,
      ...recentCommands.filter(id => id !== command.id)
    ].slice(0, 10);

    setRecentCommands(updated);
    localStorage.setItem('recentCommands', JSON.stringify(updated));

    // Execute and close
    command.action();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Command Palette */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-2xl animate-scale-in">
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 text-lg"
          />
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          className="max-h-[400px] overflow-y-auto py-2"
        >
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              No commands found
            </div>
          ) : (
            <>
              {!searchQuery && recentCommands.length > 0 && (
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Recent
                </div>
              )}
              {filteredCommands.map((command, index) => (
                <button
                  key={command.id}
                  onClick={() => executeCommand(command)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    index === selectedIndex
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className={`flex-shrink-0 ${
                    index === selectedIndex ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
                  }`}>
                    {command.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{command.label}</div>
                  </div>
                  {command.shortcut && (
                    <div className="flex-shrink-0 text-xs text-gray-400 dark:text-gray-500 font-mono">
                      {command.shortcut}
                    </div>
                  )}
                </button>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">Enter</kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">Esc</kbd>
              Close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
