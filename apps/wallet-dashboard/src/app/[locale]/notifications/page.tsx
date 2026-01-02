'use client';

import React, { useState, useEffect } from 'react';

// =============================================================================
// CONFIGURATION
// =============================================================================
const API_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || '/api/graphql';

// =============================================================================
// GRAPHQL QUERIES & MUTATIONS
// =============================================================================

const NOTIFICATIONS_QUERY = `
  query MyNotifications($pagination: PaginationInput) {
    myNotifications(pagination: $pagination) {
      items {
        id
        type
        title
        message
        read
        createdAt
        data
      }
      total
      hasMore
    }
  }
`;

const MARK_READ_MUTATION = `
  mutation MarkNotificationRead($id: ID!) {
    markNotificationRead(id: $id) {
      success
    }
  }
`;

const MARK_ALL_READ_MUTATION = `
  mutation MarkAllNotificationsRead {
    markAllNotificationsRead {
      success
      count
    }
  }
`;

// =============================================================================
// API HELPER
// =============================================================================

async function graphqlRequest(query: string, variables?: any) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('healthpay_token') : null;
  
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(result.errors[0]?.message || 'GraphQL error');
  }
  
  return result.data;
}

// =============================================================================
// DEMO DATA
// =============================================================================

const DEMO_NOTIFICATIONS = [
  {
    id: '1',
    type: 'TRANSACTION',
    title: 'تم استلام تحويل',
    message: 'استلمت 500.00 ج.م من محمد أحمد',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins ago
  },
  {
    id: '2',
    type: 'PROMO',
    title: 'عرض خاص! 🎉',
    message: 'احصل على 10% كاش باك على أول شحن هذا الشهر',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
  {
    id: '3',
    type: 'SECURITY',
    title: 'تسجيل دخول جديد',
    message: 'تم تسجيل الدخول من جهاز جديد في القاهرة',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  },
  {
    id: '4',
    type: 'BILL',
    title: 'تذكير بفاتورة',
    message: 'فاتورة الكهرباء مستحقة خلال 3 أيام',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
  },
  {
    id: '5',
    type: 'TRANSACTION',
    title: 'تم الشحن بنجاح',
    message: 'تم شحن محفظتك بمبلغ 1,000.00 ج.م',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
  },
];

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

const getNotificationIcon = (type: string): string => {
  const icons: Record<string, string> = {
    TRANSACTION: '💰',
    PROMO: '🎁',
    SECURITY: '🔐',
    BILL: '📄',
    SYSTEM: '⚙️',
    KYC: '✅',
  };
  return icons[type] || '🔔';
};

const getNotificationColor = (type: string): string => {
  const colors: Record<string, string> = {
    TRANSACTION: 'bg-green-100',
    PROMO: 'bg-purple-100',
    SECURITY: 'bg-red-100',
    BILL: 'bg-yellow-100',
    SYSTEM: 'bg-gray-100',
    KYC: 'bg-blue-100',
  };
  return colors[type] || 'bg-gray-100';
};

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'الآن';
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays < 7) return `منذ ${diffDays} يوم`;
  return date.toLocaleDateString('ar-EG');
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>(DEMO_NOTIFICATIONS);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await graphqlRequest(NOTIFICATIONS_QUERY, {
        pagination: { limit: 50 },
      });
      if (data.myNotifications?.items?.length > 0) {
        setNotifications(data.myNotifications.items);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
      // Use demo data
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await graphqlRequest(MARK_READ_MUTATION, { id });
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
    } catch (err) {
      // Demo update
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
    }
  };

  const handleMarkAllRead = async () => {
    setLoading(true);
    try {
      await graphqlRequest(MARK_ALL_READ_MUTATION);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {
      // Demo update
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } finally {
      setLoading(false);
    }
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-100" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => window.history.back()} className="p-2 hover:bg-white/20 rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold">الإشعارات</h1>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={loading}
              className="text-sm hover:underline"
            >
              قراءة الكل
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-white/20 rounded-xl p-1">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
              filter === 'all' ? 'bg-white text-teal-600' : 'text-white'
            }`}
          >
            الكل
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`flex-1 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              filter === 'unread' ? 'bg-white text-teal-600' : 'text-white'
            }`}
          >
            غير مقروءة
            {unreadCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                filter === 'unread' ? 'bg-teal-100 text-teal-600' : 'bg-white/30'
              }`}>
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
            <span className="text-6xl mb-4 block">🔔</span>
            <h2 className="text-lg font-bold text-gray-800 mb-2">لا توجد إشعارات</h2>
            <p className="text-gray-500">
              {filter === 'unread' ? 'لا توجد إشعارات غير مقروءة' : 'ستظهر الإشعارات هنا'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => !notification.read && handleMarkRead(notification.id)}
                className={`bg-white rounded-2xl p-4 shadow-lg cursor-pointer transition-all hover:shadow-xl ${
                  !notification.read ? 'border-r-4 border-teal-500' : ''
                }`}
              >
                <div className="flex gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${getNotificationColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className={`font-bold ${!notification.read ? 'text-gray-800' : 'text-gray-600'}`}>
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                      )}
                    </div>
                    <p className="text-gray-500 text-sm mb-2">{notification.message}</p>
                    <p className="text-gray-400 text-xs">{formatTimeAgo(notification.createdAt)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
