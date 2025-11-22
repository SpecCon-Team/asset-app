import React, { useState, useEffect } from 'react';
import { MessageSquare, Search, Star, Clock, X, Plus } from 'lucide-react';

interface ReplyTemplate {
  id: string;
  name: string;
  content: string;
  category?: string;
  usageCount: number;
  createdAt: Date | string;
}

interface QuickReplyPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (content: string) => void;
  onInsertVariable?: (variable: string) => void;
}

/**
 * Quick Reply Picker Component
 *
 * Allows users to quickly insert pre-written reply templates into comments.
 * Supports variable substitution like {{userName}}, {{ticketNumber}}, etc.
 *
 * Features:
 * - Search templates by name or content
 * - Category filtering
 * - Recent/frequently used
 * - Variable insertion
 * - Preview before insert
 * - Keyboard navigation
 *
 * @example
 * const [isOpen, setIsOpen] = useState(false);
 *
 * <QuickReplyPicker
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onSelect={(content) => setCommentText(content)}
 * />
 */
export function QuickReplyPicker({
  isOpen,
  onClose,
  onSelect,
  onInsertVariable,
}: QuickReplyPickerProps) {
  const [templates, setTemplates] = useState<ReplyTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Available variables for substitution
  const variables = [
    { key: '{{userName}}', label: 'User Name', example: 'John Doe' },
    { key: '{{userEmail}}', label: 'User Email', example: 'john@example.com' },
    { key: '{{ticketNumber}}', label: 'Ticket Number', example: 'TKT-12345' },
    { key: '{{ticketTitle}}', label: 'Ticket Title', example: 'Password Reset' },
    { key: '{{currentDate}}', label: 'Current Date', example: 'Nov 21, 2025' },
    { key: '{{currentTime}}', label: 'Current Time', example: '2:30 PM' },
    { key: '{{technicianName}}', label: 'Technician Name', example: 'Jane Smith' },
  ];

  // Mock templates (in production, fetch from API)
  const mockTemplates: ReplyTemplate[] = [
    {
      id: '1',
      name: 'Password Reset Instructions',
      content: `Hi {{userName}},

I've reset your password. Here are the steps to set a new one:

1. Click the reset link sent to {{userEmail}}
2. Choose a strong password (8+ characters, mix of letters/numbers)
3. Confirm your new password

If you have any issues, please let me know!

Best regards,
{{technicianName}}`,
      category: 'password',
      usageCount: 45,
      createdAt: new Date('2025-01-15'),
    },
    {
      id: '2',
      name: 'Ticket Received Confirmation',
      content: `Hi {{userName}},

Thank you for submitting ticket {{ticketNumber}}.

We've received your request about "{{ticketTitle}}" and our team is reviewing it. We'll get back to you within 24 hours.

Best regards,
Support Team`,
      category: 'confirmation',
      usageCount: 120,
      createdAt: new Date('2025-01-10'),
    },
    {
      id: '3',
      name: 'Request More Information',
      content: `Hi {{userName}},

Thank you for your ticket. To help us resolve this faster, could you please provide:

1. What were you trying to do?
2. What happened instead?
3. Any error messages you saw?
4. When did this start happening?

The more details you can share, the better we can help!

Thanks,
{{technicianName}}`,
      category: 'follow-up',
      usageCount: 78,
      createdAt: new Date('2025-01-20'),
    },
    {
      id: '4',
      name: 'Issue Resolved',
      content: `Hi {{userName}},

Great news! We've resolved the issue with {{ticketTitle}}.

Everything should be working normally now. Please test it out and let us know if you experience any further problems.

We're marking this ticket as resolved, but feel free to reopen it if needed.

Best regards,
{{technicianName}}`,
      category: 'resolution',
      usageCount: 95,
      createdAt: new Date('2025-01-18'),
    },
    {
      id: '5',
      name: 'Escalation Notice',
      content: `Hi {{userName}},

Your ticket {{ticketNumber}} has been escalated to our senior technical team for further investigation.

They will reach out to you within the next 4 business hours with an update.

We appreciate your patience!

Best regards,
Support Team`,
      category: 'escalation',
      usageCount: 12,
      createdAt: new Date('2025-01-25'),
    },
  ];

  // Load templates
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      // In production: fetch from API
      // For now, use mock data
      setTimeout(() => {
        setTemplates(mockTemplates);
        setIsLoading(false);
      }, 300);
    }
  }, [isOpen]);

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch =
      searchQuery === '' ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || template.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(templates.map(t => t.category).filter(Boolean)))];

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev < filteredTemplates.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev > 0 ? prev - 1 : filteredTemplates.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredTemplates[selectedIndex]) {
            handleSelect(filteredTemplates[selectedIndex]);
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
  }, [isOpen, filteredTemplates, selectedIndex]);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedCategory('all');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleSelect = (template: ReplyTemplate) => {
    // Replace variables with example values (in production, use real data)
    let content = template.content;

    variables.forEach(variable => {
      content = content.replace(new RegExp(variable.key, 'g'), variable.example);
    });

    onSelect(content);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Picker */}
      <div className="relative w-full max-w-3xl bg-white dark:bg-gray-800 rounded-lg shadow-2xl animate-scale-in max-h-[70vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Quick Reply Templates
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Search templates..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Categories */}
          <div className="flex gap-2 mt-3 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Templates List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="sr-only">Loading templates</span>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No templates found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTemplates.map((template, index) => (
                <button
                  key={template.id}
                  onClick={() => handleSelect(template)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    index === selectedIndex
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {template.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{template.usageCount} uses</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {template.content}
                  </p>
                  {template.category && (
                    <span className="inline-block mt-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-400 rounded">
                      {template.category}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Variables */}
        {onInsertVariable && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Insert Variable:
            </h4>
            <div className="flex flex-wrap gap-2">
              {variables.slice(0, 4).map((variable) => (
                <button
                  key={variable.key}
                  onClick={() => {
                    onInsertVariable(variable.key);
                    onClose();
                  }}
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-mono"
                >
                  {variable.key}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer - Keyboard hints */}
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded font-mono">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded font-mono">Enter</kbd>
              Insert
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded font-mono">Esc</kbd>
              Close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuickReplyPicker;
