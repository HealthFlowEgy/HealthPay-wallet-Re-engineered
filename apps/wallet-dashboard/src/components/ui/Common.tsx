'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// ============================================
// Badge Component
// ============================================

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'gray';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({
  children,
  variant = 'primary',
  size = 'sm',
  className,
}: BadgeProps) {
  const variants = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
    danger: 'bg-danger-50 text-danger-600',
    gray: 'bg-gray-100 text-gray-600',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}

// ============================================
// Skeleton Components
// ============================================

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-gray-200 rounded animate-pulse',
        className
      )}
    />
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}

export function SkeletonTransaction() {
  return (
    <div className="flex items-center gap-3 p-3">
      <Skeleton className="w-10 h-10 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-4 w-32 mb-1" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-5 w-16" />
    </div>
  );
}

export function SkeletonWalletCard() {
  return (
    <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 text-white">
      <Skeleton className="h-4 w-24 bg-white/20 mb-2" />
      <Skeleton className="h-8 w-36 bg-white/20 mb-4" />
      <div className="flex gap-4">
        <Skeleton className="h-3 w-20 bg-white/20" />
        <Skeleton className="h-3 w-20 bg-white/20" />
      </div>
    </div>
  );
}

// ============================================
// Empty State Component
// ============================================

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <span className="text-6xl mb-4 block">{icon}</span>
      <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
      {description && <p className="text-gray-500 mb-4">{description}</p>}
      {action}
    </div>
  );
}

// ============================================
// Loading Spinner Component
// ============================================

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3',
  };

  return (
    <div
      className={cn(
        'rounded-full border-primary-500 border-t-transparent animate-spin',
        sizes[size]
      )}
    />
  );
}

export function LoadingOverlay({ message = 'جاري التحميل...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">{message}</p>
      </div>
    </div>
  );
}

// ============================================
// Avatar Component
// ============================================

interface AvatarProps {
  name?: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
  };

  const initial = name ? name.charAt(0).toUpperCase() : '?';

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={cn(
          'rounded-full object-cover',
          sizes[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold',
        sizes[size],
        className
      )}
    >
      {initial}
    </div>
  );
}

// ============================================
// Divider Component
// ============================================

export function Divider({ text }: { text?: string }) {
  if (text) {
    return (
      <div className="flex items-center gap-4 my-4">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-sm text-gray-400">{text}</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
    );
  }
  return <div className="h-px bg-gray-200 my-4" />;
}

// ============================================
// Progress Bar Component
// ============================================

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
  label?: string;
}

export function ProgressBar({
  value,
  max = 100,
  color = 'primary',
  showLabel = false,
  label,
}: ProgressBarProps) {
  const percentage = Math.min(100, (value / max) * 100);

  const colors = {
    primary: 'bg-primary-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    danger: 'bg-danger-500',
  };

  // Auto-color based on percentage
  const autoColor = percentage >= 90 ? 'danger' : percentage >= 70 ? 'warning' : 'success';

  return (
    <div>
      {(showLabel || label) && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">{label}</span>
          <span className="text-gray-500">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            color === 'primary' ? colors[autoColor] : colors[color]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
