'use client'

import { useState } from 'react'
import {
  Users,
  Search,
  Filter,
  Download,
  UserPlus,
  Edit,
  Trash2,
  Lock,
  Unlock,
  Mail,
  Phone,
  Eye,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'pending'>('all')
  const [kycFilter, setKycFilter] = useState<'all' | 'verified' | 'pending' | 'rejected'>('all')

  // Mock data - replace with real API
  const users = [
    {
      id: '1',
      fullName: 'أحمد محمد علي',
      phone: '01234567890',
      email: 'ahmed@example.com',
      nationalId: '12345678901234',
      balance: 3250.00,
      status: 'active',
      kycStatus: 'verified',
      registeredAt: '2024-01-15',
      lastActive: '2024-02-10',
      totalTransactions: 145,
      transactionVolume: 45678
    },
    {
      id: '2',
      fullName: 'سارة أحمد حسن',
      phone: '01123456789',
      email: 'sarah@example.com',
      nationalId: '23456789012345',
      balance: 1500.00,
      status: 'active',
      kycStatus: 'verified',
      registeredAt: '2024-01-20',
      lastActive: '2024-02-11',
      totalTransactions: 89,
      transactionVolume: 23456
    },
    {
      id: '3',
      fullName: 'محمد حسن علي',
      phone: '01234567899',
      email: 'mohamed@example.com',
      nationalId: '34567890123456',
      balance: 750.00,
      status: 'suspended',
      kycStatus: 'verified',
      registeredAt: '2024-02-01',
      lastActive: '2024-02-05',
      totalTransactions: 34,
      transactionVolume: 12345
    },
    {
      id: '4',
      fullName: 'فاطمة محمود',
      phone: '01198765432',
      email: 'fatma@example.com',
      nationalId: '45678901234567',
      balance: 0.00,
      status: 'pending',
      kycStatus: 'pending',
      registeredAt: '2024-02-11',
      lastActive: '2024-02-11',
      totalTransactions: 0,
      transactionVolume: 0
    }
  ]

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.nationalId.includes(searchTerm)

    const matchesStatus = statusFilter === 'all' || user.status === statusFilter
    const matchesKyc = kycFilter === 'all' || user.kycStatus === kycFilter

    return matchesSearch && matchesStatus && matchesKyc
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            نشط
          </span>
        )
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
            <XCircle className="w-3 h-3" />
            موقوف
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
            <AlertCircle className="w-3 h-3" />
            قيد المراجعة
          </span>
        )
      default:
        return null
    }
  }

  const getKycBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            موثق
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
            <AlertCircle className="w-3 h-3" />
            قيد المراجعة
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
            <XCircle className="w-3 h-3" />
            مرفوض
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة المستخدمين</h1>
          <p className="text-gray-500 mt-1">{filteredUsers.length} مستخدم</p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 ml-2" />
            تصدير CSV
          </Button>
          <Button>
            <UserPlus className="w-4 h-4 ml-2" />
            إضافة مستخدم
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">إجمالي المستخدمين</p>
                <p className="text-3xl font-bold">{users.length}</p>
              </div>
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">مستخدمون نشطون</p>
                <p className="text-3xl font-bold">{users.filter(u => u.status === 'active').length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">قيد المراجعة</p>
                <p className="text-3xl font-bold">{users.filter(u => u.status === 'pending').length}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">موقوفون</p>
                <p className="text-3xl font-bold">{users.filter(u => u.status === 'suspended').length}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="بحث بالاسم، الهاتف، البريد، أو الرقم القومي..."
                  className="w-full pr-10 pl-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="all">جميع الحالات</option>
                <option value="active">نشط</option>
                <option value="suspended">موقوف</option>
                <option value="pending">قيد المراجعة</option>
              </select>
            </div>

            {/* KYC Filter */}
            <div>
              <select
                value={kycFilter}
                onChange={(e) => setKycFilter(e.target.value as any)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="all">جميع حالات التوثيق</option>
                <option value="verified">موثق</option>
                <option value="pending">قيد المراجعة</option>
                <option value="rejected">مرفوض</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-right p-4 font-medium text-gray-700">المستخدم</th>
                  <th className="text-right p-4 font-medium text-gray-700">معلومات الاتصال</th>
                  <th className="text-right p-4 font-medium text-gray-700">الرصيد</th>
                  <th className="text-right p-4 font-medium text-gray-700">الحالة</th>
                  <th className="text-right p-4 font-medium text-gray-700">التوثيق</th>
                  <th className="text-right p-4 font-medium text-gray-700">المعاملات</th>
                  <th className="text-right p-4 font-medium text-gray-700">آخر نشاط</th>
                  <th className="text-center p-4 font-medium text-gray-700">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                          {user.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{user.fullName}</p>
                          <p className="text-sm text-gray-500">{user.nationalId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{user.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span>{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-bold">{user.balance.toLocaleString()} EGP</p>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="p-4">
                      {getKycBadge(user.kycStatus)}
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        <p className="font-medium">{user.totalTransactions}</p>
                        <p className="text-gray-500">{user.transactionVolume.toLocaleString()} EGP</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-gray-500">{user.lastActive}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          {user.status === 'active' ? (
                            <Lock className="w-4 h-4 text-red-600" />
                          ) : (
                            <Unlock className="w-4 h-4 text-green-600" />
                          )}
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          عرض 1-{filteredUsers.length} من {filteredUsers.length} مستخدم
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            السابق
          </Button>
          <Button variant="outline" size="sm">
            1
          </Button>
          <Button variant="outline" size="sm" disabled>
            التالي
          </Button>
        </div>
      </div>
    </div>
  )
}
