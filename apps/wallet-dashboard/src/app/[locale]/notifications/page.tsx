'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layouts';
import { Card, Badge, EmptyState, Skeleton } from '@/components/ui';
import { GET_NOTIFICATIONS, MARK_ALL_NOTIFICATIONS_READ } from '@/lib/graphql/queries';
import { formatRelativeTime } from '@/lib/utils';
import { Notification } from '@/types';

export default function NotificationsPage({ params }: { params: { locale: 'ar' | 'en' } }) {
  const { locale } = params;
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const t = locale === 'ar' ? {
    title: 'الإشعارات', markAllRead: 'تحديد الكل كمقروء', noNotifications: 'لا توجد إشعارات',
    today: 'اليوم', yesterday: 'أمس', earlier: 'سابقاً',
  } : {
    title: 'Notifications', markAllRead: 'Mark all as read', noNotifications: 'No notifications',
    today: 'Today', yesterday: 'Yesterday', earlier: 'Earlier',
  };

  useEffect(() => { if (!authLoading && !isAuthenticated) router.replace(`/${locale}/auth/login`); }, [authLoading, isAuthenticated, locale, router]);

  const { data, loading } = useQuery(GET_NOTIFICATIONS, { variables: { userId: user?.id, limit: 50 }, skip: !user?.id });
  const [markAllRead] = useMutation(MARK_ALL_NOTIFICATIONS_READ);

  const notifications: Notification[] = data?.notifications || [];
  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    const icons: Record<string, string> = { TRANSACTION: '💳', PAYMENT: '✅', TRANSFER: '↔️', BILL: '📄', SECURITY: '🔐', PROMO: '🎁', SYSTEM: '⚙️' };
    return icons[type] || '📬';
  };

  if (authLoading) return <div className="min-h-screen bg-gray-50"><Header title={t.title} showBack locale={locale} /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={t.title} showBack backHref={`/${locale}/dashboard`} locale={locale} rightAction={unreadCount > 0 ? <button onClick={() => markAllRead({ variables: { userId: user?.id } })} className="text-sm text-primary-600">{t.markAllRead}</button> : undefined} />
      <div className="px-4 py-4">
        {loading ? <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
        : notifications.length === 0 ? <EmptyState icon="🔔" title={t.noNotifications} />
        : <div className="space-y-2">{notifications.map((notif) => (
          <Card key={notif.id} className={notif.read ? 'opacity-60' : ''}>
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-xl">{getIcon(notif.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800">{locale === 'ar' ? notif.titleAr : notif.title}</p>
                <p className="text-sm text-gray-500 truncate">{locale === 'ar' ? notif.bodyAr : notif.body}</p>
                <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(notif.createdAt, locale)}</p>
              </div>
              {!notif.read && <div className="w-2 h-2 bg-primary-500 rounded-full mt-2" />}
            </div>
          </Card>
        ))}</div>}
      </div>
    </div>
  );
}
