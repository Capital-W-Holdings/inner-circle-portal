'use client';

/**
 * Admin Header Component
 * Top header bar for admin portal
 */

import React, { useState, useCallback } from 'react';
import type { UserRole } from '@/types';

// ============================================
// Types
// ============================================

interface AdminUser {
  id: string;
  name?: string | null;
  email: string;
  imageUrl?: string;
  role: UserRole;
}

interface AdminHeaderProps {
  user: AdminUser;
}

// ============================================
// Admin Header Component
// ============================================

export function AdminHeader({ user }: AdminHeaderProps): React.ReactElement {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSignOut = useCallback(() => {
    window.location.href = '/';
  }, []);

  const displayName = user.name || user.email;

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Mobile menu button */}
        <button
          type="button"
          className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Page title placeholder */}
        <div className="flex-1 lg:flex-none">
          <h1 className="text-lg font-semibold text-gray-900 lg:hidden">
            Admin Portal
          </h1>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button
            type="button"
            className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 relative"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {/* Notification badge */}
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* User dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {user.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt={displayName}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-600 font-medium text-sm">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900">{displayName}</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown menu */}
            {showDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{displayName}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <a
                    href="/admin/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Settings
                  </a>
                  <a
                    href="/dashboard"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Partner Portal
                  </a>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;
