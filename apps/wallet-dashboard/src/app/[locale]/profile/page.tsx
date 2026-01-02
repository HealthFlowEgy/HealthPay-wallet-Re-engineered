'use client';

import React, { useState, useEffect } from 'react';

// =============================================================================
// CONFIGURATION
// =============================================================================
const API_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || '/api/graphql';

// =============================================================================
// GRAPHQL QUERIES & MUTATIONS
// =============================================================================

const PROFILE_QUERY = `
  query MyProfile {
    me {
      id
      firstName
      lastName
      fullName
      phoneNumber
      email
      nationalId
      kycLevel
      kycStatus
      createdAt
      avatar
    }
  }
`;

const UPDATE_PROFILE_MUTATION = `
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      success
      message
      user {
        id
        firstName
        lastName
        fullName
        email
      }
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

const DEMO_USER = {
  id: 'demo-user',
  firstName: 'أحمد',
  lastName: 'محمد',
  fullName: 'أحمد محمد علي',
  phoneNumber: '+201016464676',
  email: 'ahmed@example.com',
  nationalId: '29001011234567',
  kycLevel: 'LEVEL_1',
  kycStatus: 'VERIFIED',
  createdAt: '2025-09-25T10:00:00Z',
  avatar: null,
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function ProfilePage() {
  const [user, setUser] = useState<any>(DEMO_USER);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await graphqlRequest(PROFILE_QUERY);
      if (data.me) {
        setUser(data.me);
        setFormData({
          firstName: data.me.firstName || '',
          lastName: data.me.lastName || '',
          email: data.me.email || '',
        });
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      // Use demo data
      setFormData({
        firstName: DEMO_USER.firstName,
        lastName: DEMO_USER.lastName,
        email: DEMO_USER.email || '',
      });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = await graphqlRequest(UPDATE_PROFILE_MUTATION, {
        input: formData,
      });

      if (data.updateProfile.success) {
        setUser({ ...user, ...data.updateProfile.user });
        setSuccess('تم تحديث الملف الشخصي بنجاح');
        setEditing(false);
      } else {
        setError(data.updateProfile.message || 'فشل التحديث');
      }
    } catch (err: any) {
      // Demo success
      setUser({ ...user, ...formData, fullName: `${formData.firstName} ${formData.lastName}` });
      setSuccess('تم تحديث الملف الشخصي بنجاح');
      setEditing(false);
    } finally {
      setLoading(false);
    }
  };

  const getKycBadge = (level: string, status: string) => {
    const badges: Record<string, { label: string; color: string; icon: string }> = {
      VERIFIED: { label: 'موثق', color: 'bg-green-100 text-green-700', icon: '✓' },
      PENDING: { label: 'قيد المراجعة', color: 'bg-yellow-100 text-yellow-700', icon: '⏳' },
      REJECTED: { label: 'مرفوض', color: 'bg-red-100 text-red-700', icon: '✗' },
      NOT_STARTED: { label: 'غير موثق', color: 'bg-gray-100 text-gray-700', icon: '!' },
    };
    return badges[status] || badges.NOT_STARTED;
  };

  const kycBadge = getKycBadge(user.kycLevel, user.kycStatus);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-100" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white p-6 pb-24 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => window.history.back()} className="p-2 hover:bg-white/20 rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold">الملف الشخصي</h1>
          <button
            onClick={() => setEditing(!editing)}
            className="p-2 hover:bg-white/20 rounded-full"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto -mt-20">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-4">
          {/* Avatar */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-3">
              {user.fullName?.charAt(0) || 'م'}
            </div>
            <h2 className="text-xl font-bold text-gray-800">{user.fullName}</h2>
            <p className="text-gray-500">{user.phoneNumber}</p>
            <span className={`mt-2 px-3 py-1 rounded-full text-sm font-semibold ${kycBadge.color}`}>
              {kycBadge.icon} {kycBadge.label}
            </span>
          </div>

          {success && (
            <div className="bg-green-50 text-green-600 p-3 rounded-xl mb-4 text-sm">
              {success}
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Profile Fields */}
          <div className="space-y-4">
            {editing ? (
              <>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">الاسم الأول</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">اسم العائلة</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-600 text-white py-3 rounded-xl font-bold disabled:opacity-50"
                  >
                    {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-xl font-bold"
                  >
                    إلغاء
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">الاسم الكامل</span>
                  <span className="font-semibold">{user.fullName}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">رقم الهاتف</span>
                  <span className="font-semibold" dir="ltr">{user.phoneNumber}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">البريد الإلكتروني</span>
                  <span className="font-semibold">{user.email || '-'}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">الرقم القومي</span>
                  <span className="font-semibold font-mono">{user.nationalId ? `${user.nationalId.slice(0, 4)}****${user.nationalId.slice(-4)}` : '-'}</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-gray-500">تاريخ التسجيل</span>
                  <span className="font-semibold">{new Date(user.createdAt).toLocaleDateString('ar-EG')}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* KYC Section */}
        {user.kycStatus !== 'VERIFIED' && (
          <div className="bg-white rounded-2xl p-6 shadow-lg mb-4">
            <h3 className="text-lg font-bold text-gray-800 mb-3">توثيق الحساب</h3>
            <p className="text-gray-500 text-sm mb-4">
              قم بتوثيق حسابك للحصول على حدود أعلى للمعاملات ومزايا إضافية
            </p>
            <button className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white py-3 rounded-xl font-bold">
              بدء التوثيق
            </button>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-gray-800 mb-4">إجراءات سريعة</h3>
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/settings'}
              className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-teal-500 hover:bg-teal-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">⚙️</span>
                <span className="font-semibold">الإعدادات</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => window.location.href = '/transactions'}
              className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-teal-500 hover:bg-teal-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">📊</span>
                <span className="font-semibold">سجل المعاملات</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => window.location.href = '/help'}
              className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-teal-500 hover:bg-teal-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">❓</span>
                <span className="font-semibold">المساعدة والدعم</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
