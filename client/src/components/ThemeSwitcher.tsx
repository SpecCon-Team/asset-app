import React, { useState } from 'react';
import { Palette, Check, X } from 'lucide-react';
import { useTheme, themeColors, ThemeColor } from '../contexts/ThemeContext';

export default function ThemeSwitcher() {
  const { themeColor, setThemeColor } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const handleColorChange = (color: ThemeColor) => {
    setThemeColor(color);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title="Change Theme Color"
      >
        <Palette className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Theme Selector Popup */}
          <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Theme Color
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="space-y-2">
              {Object.entries(themeColors).map(([key, theme]) => {
                const colorKey = key as ThemeColor;
                const isActive = themeColor === colorKey;

                return (
                  <button
                    key={key}
                    onClick={() => handleColorChange(colorKey)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-gray-100 dark:bg-gray-700 ring-2 ring-offset-2'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                    style={
                      isActive
                        ? {
                            '--tw-ring-color': theme.primary,
                          } as React.CSSProperties
                        : undefined
                    }
                  >
                    {/* Color Preview */}
                    <div
                      className="w-10 h-10 rounded-lg shadow-sm flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)`,
                      }}
                    >
                      {isActive && <Check className="w-5 h-5 text-white" />}
                    </div>

                    {/* Theme Name */}
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {theme.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {theme.primary}
                      </div>
                    </div>

                    {/* Active Indicator */}
                    {isActive && (
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.primary }} />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Theme preference is saved automatically
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
