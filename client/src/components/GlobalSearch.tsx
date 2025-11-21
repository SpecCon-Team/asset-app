import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Package, Ticket, User, Clock, TrendingUp, Plane } from 'lucide-react';
import { listAssets } from '@/features/assets/api';
import { listUsers } from '@/features/users/api';
import { useTicketsStore } from '@/features/tickets/store';
import { getApiClient } from '@/features/assets/lib/apiClient';

interface SearchResult {
  id: string;
  type: 'asset' | 'ticket' | 'user' | 'trip';
  title: string;
  subtitle: string;
  link: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load recent searches', e);
      }
    }
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Perform search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        // Search all endpoints in parallel using proper API functions
        const [assets, tickets, users, trips] = await Promise.all([
          listAssets().catch(() => []),
          getApiClient().get('/tickets').then(res => Array.isArray(res.data) ? res.data : []).catch(() => []),
          listUsers().catch(() => []),
          getApiClient().get('/travel').then(res => Array.isArray(res.data) ? res.data : []).catch(() => []),
        ]);

        // Filter assets by query
        const filteredAssets = assets.filter((asset: any) =>
          asset.name?.toLowerCase().includes(query.toLowerCase()) ||
          asset.asset_code?.toLowerCase().includes(query.toLowerCase()) ||
          asset.description?.toLowerCase().includes(query.toLowerCase())
        );

        // Filter tickets by query
        const filteredTickets = tickets.filter((ticket: any) =>
          ticket.title?.toLowerCase().includes(query.toLowerCase()) ||
          ticket.number?.toLowerCase().includes(query.toLowerCase()) ||
          ticket.description?.toLowerCase().includes(query.toLowerCase())
        );

        // Filter users by query
        const filteredUsers = users.filter((user: any) =>
          user.name?.toLowerCase().includes(query.toLowerCase()) ||
          user.email?.toLowerCase().includes(query.toLowerCase())
        );

        // Filter trips by query
        const filteredTrips = trips.filter((trip: any) =>
          trip.destination?.toLowerCase().includes(query.toLowerCase()) ||
          trip.country?.toLowerCase().includes(query.toLowerCase()) ||
          trip.category?.toLowerCase().includes(query.toLowerCase())
        );

        const searchResults: SearchResult[] = [
          // Assets - show more results (filtered)
          ...filteredAssets.slice(0, 10).map((asset: any) => ({
            id: asset.id,
            type: 'asset' as const,
            title: asset.name,
            subtitle: `Code: ${asset.asset_code} • Status: ${asset.status}`,
            link: `/assets/${asset.id}`,
            icon: Package,
          })),
          // Tickets - show more results (filtered)
          ...filteredTickets.slice(0, 10).map((ticket: any) => ({
            id: ticket.id,
            type: 'ticket' as const,
            title: ticket.title,
            subtitle: `${ticket.number} • ${ticket.status} • ${ticket.priority}`,
            link: `/tickets/${ticket.id}`,
            icon: Ticket,
          })),
          // Trips - show more results (filtered)
          ...filteredTrips.slice(0, 10).map((trip: any) => ({
            id: trip.id,
            type: 'trip' as const,
            title: trip.destination,
            subtitle: `${trip.country} • ${trip.category} • ${trip.status}`,
            link: `/travel-plan`,
            icon: Plane,
          })),
          // Users - show more results (filtered)
          ...filteredUsers.slice(0, 10).map((user: any) => ({
            id: user.id,
            type: 'user' as const,
            title: user.name || user.email,
            subtitle: `${user.email} • ${user.role}`,
            link: `/my-clients`,
            icon: User,
          })),
        ];

        setResults(searchResults);
        setSelectedIndex(0);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(searchTimeout);
  }, [query]);

  // Note: Keyboard navigation is now handled directly in the input's onKeyDown handler
  // to prevent conflicts with other global keyboard listeners

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const handleSelectResult = (result: SearchResult) => {
    // Save to recent searches
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));

    // Navigate
    navigate(result.link);
    onClose();
  };

  const handleRecentSearch = (search: string) => {
    setQuery(search);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[10vh] px-4"
      onMouseDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Search Modal */}
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-200 dark:border-gray-700">
          <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              // Stop propagation to prevent other handlers from interfering
              e.stopPropagation();

              // Allow typing in input, only prevent default for navigation keys
              if (['ArrowDown', 'ArrowUp'].includes(e.key)) {
                e.preventDefault();
                // Navigate results
                if (e.key === 'ArrowDown') {
                  setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
                } else {
                  setSelectedIndex((prev) => Math.max(prev - 1, 0));
                }
              } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
              } else if (e.key === 'Enter' && results[selectedIndex]) {
                e.preventDefault();
                handleSelectResult(results[selectedIndex]);
              }
              // Let other keys work normally in the input for typing
            }}
            placeholder="Search assets, tickets, trips, users..."
            className="flex-1 bg-transparent text-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
            autoFocus
            autoComplete="off"
            data-global-search-input="true"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <X className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            </button>
          )}
          <kbd className="hidden sm:block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded border border-gray-300 dark:border-gray-600">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {isSearching && (
            <div className="p-12 flex items-center justify-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}

          {!isSearching && query && results.length === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No results found for "{query}"
            </div>
          )}

          {!isSearching && query && results.length > 0 && (
            <div ref={resultsRef} className="py-2">
              {results.map((result, index) => {
                const Icon = result.icon;
                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelectResult(result)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                    style={
                      index === selectedIndex
                        ? {
                            backgroundColor: 'rgba(var(--color-primary-rgb), 0.1)',
                          }
                        : undefined
                    }
                  >
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{
                        backgroundColor:
                          result.type === 'asset'
                            ? 'rgba(34, 197, 94, 0.1)'
                            : result.type === 'ticket'
                            ? 'rgba(var(--color-primary-rgb), 0.1)'
                            : result.type === 'trip'
                            ? 'rgba(249, 115, 22, 0.1)'
                            : 'rgba(168, 85, 247, 0.1)',
                      }}
                    >
                      <Icon
                        className="w-5 h-5"
                        style={{
                          color:
                            result.type === 'asset'
                              ? '#22c55e'
                              : result.type === 'ticket'
                              ? 'var(--color-primary)'
                              : result.type === 'trip'
                              ? '#f97316'
                              : '#a855f7',
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white truncate">
                        {result.title}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {result.subtitle}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <span
                        className="px-2 py-1 text-xs font-medium rounded"
                        style={{
                          backgroundColor:
                            result.type === 'asset'
                              ? 'rgba(34, 197, 94, 0.1)'
                              : result.type === 'ticket'
                              ? 'rgba(var(--color-primary-rgb), 0.1)'
                              : result.type === 'trip'
                              ? 'rgba(249, 115, 22, 0.1)'
                              : 'rgba(168, 85, 247, 0.1)',
                          color:
                            result.type === 'asset'
                              ? '#22c55e'
                              : result.type === 'ticket'
                              ? 'var(--color-primary)'
                              : result.type === 'trip'
                              ? '#f97316'
                              : '#a855f7',
                        }}
                      >
                        {result.type}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {!query && recentSearches.length > 0 && (
            <div className="py-2">
              <div className="flex items-center justify-between px-4 py-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>Recent Searches</span>
                </div>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Clear
                </button>
              </div>
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentSearch(search)}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <TrendingUp className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">{search}</span>
                </button>
              ))}
            </div>
          )}

          {!query && recentSearches.length === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Start typing to search across assets, tickets, trips, and users</p>
            </div>
          )}
        </div>

        {/* Footer Tips */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Enter</kbd>
              Select
            </span>
          </div>
          <span>Press Ctrl+K to search anytime</span>
        </div>
      </div>
    </div>
  );
}
