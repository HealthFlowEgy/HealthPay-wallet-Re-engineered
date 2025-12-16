'use client'

import { useState } from 'react'
import {
  Store,
  Search,
  Download,
  Plus,
  Edit,
  Check,
  X,
  Eye,
  MoreVertical,
  MapPin,
  Phone,
  Mail,
  Building,
  DollarSign,
  CheckCircle,
  Clock
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function AdminMerchantsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'suspended'>('all')

  const merchants = [
    {
      id: 'MER-001',
      businessName: 'صيدلية العافية',
      ownerName: 'أحمد محمد',
      category: 'صيدلية',
      phone: '+201234567890',
      email: 'alafya@pharmacy.com',
      location: 'المعادي، القاهرة',
      status: 'active',
      joinDate: '2024-01-15',
      totalRevenue: 345678,
      transactionCount: 1247,
      avgTransaction: 277,
      commissionRate: 2.5
    },
    {
      id: 'MER-002',
      businessName: 'عيادة د. سارة',
      ownerName: 'سارة أحمد',
      category: 'عيادة',
      phone: '+201123456789',
      email: 'sarah.clinic@health.com',
      location: 'مدينة نصر، القاهرة',
      status: 'active',
      joinDate: '2024-01-20',
      totalRevenue: 567890,
      transactionCount: 2341,
      avgTransaction: 242,
      commissionRate: 2.5
    },
    {
      id: 'MER-003',
      businessName: 'مستشفى النور',
      ownerName: 'محمد حسن',
      category: 'مستشفى',
      phone: '+201234567899',
      email: 'alnoor@hospital.com',
      location: 'الزمالك، القاهرة',
      status: 'pending',
      joinDate: '2024-02-10',
      totalRevenue: 0,
      transactionCount: 0,
      avgTransaction: 0,
      commissionRate: 2.0
    }
  ]

  const filteredMerchants = merchants.filter(merchant => {
    const matchesSearch = 
      merchant.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      merchant.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || merchant.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium"><CheckCircle className="w-3 h-3" />نشط</span>
    }
    if (status === 'pending') {
      return <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium"><Clock className="w-3 h-3" />قيد المراجعة</span>
    }
    return <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium"><X className="w-3 h-3" />موقوف</span>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة التجار</h1>
          <p className="text-gray-500 mt-1">{filteredMerchants.length} تاجر</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline"><Download className="w-4 h-4 ml-2" />تصدير</Button>
          <Button><Plus className="w-4 h-4 ml-2" />إضافة تاجر</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'إجمالي التجار', value: merchants.length, icon: Store, color: 'teal' },
          { label: 'تجار نشطون', value: merchants.filter(m => m.status === 'active').length, icon: CheckCircle, color: 'green' },
          { label: 'قيد المراجعة', value: merchants.filter(m => m.status === 'pending').length, icon: Clock, color: 'yellow' },
          { label: 'الإيرادات', value: merchants.reduce((s, m) => s + m.totalRevenue, 0).toLocaleString() + ' EGP', icon: DollarSign, color: 'blue' }
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 bg-${stat.color}-100 rounded-full flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث بالاسم أو رقم التاجر..."
                className="w-full pr-10 pl-4 py-2 border rounded-lg"
              />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="px-4 py-2 border rounded-lg">
              <option value="all">جميع الحالات</option>
              <option value="active">نشط</option>
              <option value="pending">قيد المراجعة</option>
              <option value="suspended">موقوف</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredMerchants.map((merchant) => (
          <Card key={merchant.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-teal-100 rounded-lg flex items-center justify-center">
                    <Store className="w-8 h-8 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{merchant.businessName}</h3>
                    <p className="text-sm text-gray-500">{merchant.id}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {getStatusBadge(merchant.status)}
                      <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">{merchant.category}</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building className="w-4 h-4" /><span>{merchant.ownerName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" /><span>{merchant.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" /><span>{merchant.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" /><span>{merchant.location}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 py-4 border-t border-b">
                <div>
                  <p className="text-xs text-gray-500">إجمالي الإيرادات</p>
                  <p className="text-lg font-bold">{merchant.totalRevenue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">المعاملات</p>
                  <p className="text-lg font-bold">{merchant.transactionCount}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">المتوسط</p>
                  <p className="text-lg font-bold">{merchant.avgTransaction}</p>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                {merchant.status === 'pending' ? (
                  <>
                    <Button className="flex-1" size="sm"><Check className="w-4 h-4 ml-1" />موافقة</Button>
                    <Button variant="destructive" className="flex-1" size="sm"><X className="w-4 h-4 ml-1" />رفض</Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" className="flex-1"><Eye className="w-4 h-4 ml-1" />عرض</Button>
                    <Button variant="outline" size="sm" className="flex-1"><Edit className="w-4 h-4 ml-1" />تعديل</Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
