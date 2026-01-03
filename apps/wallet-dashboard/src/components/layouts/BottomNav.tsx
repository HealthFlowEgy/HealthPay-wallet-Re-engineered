'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  icon: string;
  activeIcon: string;
  label: string;
  labelEn: string;
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    icon: '🏠',
    activeIcon: '🏠',
    label: 'الرئيسية',
    labelEn: 'Home',
  },
  {
    href: '/transactions',
    icon: '📊',
    activeIcon: '📊',
    label: 'المعاملات',
    labelEn: 'History',
  },
  {
    href: '/bills',
    icon: '📄',
    activeIcon: '📄',
    label: 'الفواتير',
    labelEn: 'Bills',
  },
  {
    href: '/medcard',
    icon: '💳',
    activeIcon: '💳',
    label: 'البطاقة',
    labelEn: 'Card',
  },
  {
    href: '/settings',
    icon: '⚙️',
    activeIcon: '⚙️',
    label: 'الإعدادات',
    labelEn: 'Settings',
  },
];

interface BottomNavProps {
  locale: 'ar' | 'en';
}

export default function BottomNav({ locale }: BottomNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    const currentPath = pathname.replace(`/${locale}`, '');
    return currentPath === href || currentPath.startsWith(href + '/');
  };

  return (
    <nav className="bottom-nav">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={`/${locale}${item.href}`}
              className={cn(
                'bottom-nav-item flex-1',
                active && 'active'
              )}
            >
              <span className="text-xl mb-1">
                {active ? item.activeIcon : item.icon}
              </span>
              <span className="text-xs">
                {locale === 'ar' ? item.label : item.labelEn}
              </span>
              {active && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary-500 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
