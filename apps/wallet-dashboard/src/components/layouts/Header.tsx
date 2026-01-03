'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  backHref?: string;
  rightAction?: React.ReactNode;
  transparent?: boolean;
  locale: 'ar' | 'en';
}

export default function Header({
  title,
  showBack = false,
  backHref,
  rightAction,
  transparent = false,
  locale,
}: HeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-40 px-4 py-3',
        transparent
          ? 'bg-transparent'
          : 'bg-white border-b border-gray-100'
      )}
    >
      <div className="flex items-center justify-between">
        {/* Left Side - Back Button */}
        <div className="w-10">
          {showBack && (
            <button
              onClick={handleBack}
              className="p-2 -m-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg
                className={cn('w-6 h-6', locale === 'ar' && 'rotate-180')}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Center - Title */}
        {title && (
          <h1 className="text-lg font-bold text-gray-800 flex-1 text-center">
            {title}
          </h1>
        )}

        {/* Right Side - Action */}
        <div className="w-10 flex justify-end">
          {rightAction}
        </div>
      </div>
    </header>
  );
}

// Dashboard Header with greeting
export function DashboardHeader({
  userName,
  locale,
  onNotificationClick,
  notificationCount = 0,
}: {
  userName?: string;
  locale: 'ar' | 'en';
  onNotificationClick?: () => void;
  notificationCount?: number;
}) {
  const greeting = locale === 'ar' ? 'مرحباً' : 'Hello';
  const name = userName || (locale === 'ar' ? 'عزيزي العميل' : 'Dear Customer');

  return (
    <header className="bg-gradient-to-br from-primary-500 to-primary-600 text-white px-4 py-6 pt-safe">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-primary-100 text-sm">{greeting} 👋</p>
          <h1 className="text-xl font-bold">{name}</h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <button
            onClick={onNotificationClick}
            className="relative p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
          >
            <span className="text-xl">🔔</span>
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>
          {/* Profile */}
          <Link
            href={`/${locale}/profile`}
            className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
          >
            <span className="text-xl">👤</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
