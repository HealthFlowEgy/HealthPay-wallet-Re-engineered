'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import {
  CreditCard,
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  AlertCircle,
  Calendar,
  User,
  Shield,
  TrendingUp,
  DollarSign
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import QRCode from 'qrcode.react'

interface MedCard {
  id: string
  cardNumber: string
  holderName: string
  nationalId: string
  validFrom: string
  validUntil: string
  status: 'active' | 'inactive' | 'expired' | 'suspended'
  coverage: {
    type: string
    limit: number
    used: number
    remaining: number
  }
  beneficiaries: {
    id: string
    name: string
    relation: string
    nationalId: string
  }[]
}

export default function MedCardPage() {
  const t = useTranslations()
  const { user, wallet } = useAuth()
  const [loading, setLoading] = useState(true)
  const [medCards, setMedCards] = useState<MedCard[]>([])
  const [selectedCard, setSelectedCard] = useState<MedCard | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showQRCode, setShowQRCode] = useState(false)

  useEffect(() => {
    fetchMedCards()
  }, [user?.id])

  const fetchMedCards = async () => {
    setLoading(true)
    try {
      // TODO: Replace with actual API call
      const mockData: MedCard[] = [
        {
          id: 'MC-001',
          cardNumber: '1234 5678 9012 3456',
          holderName: user?.fullName || 'عمرو محمد',
          nationalId: '29501011234567',
          validFrom: '2024-01-01',
          validUntil: '2025-12-31',
          status: 'active',
          coverage: {
            type: 'Premium',
            limit: 50000,
            used: 15000,
            remaining: 35000
          },
          beneficiaries: [
            {
              id: 'B-001',
              name: 'سارة عمرو',
              relation: 'ابنة',
              nationalId: '31201011234567'
            },
            {
              id: 'B-002',
              name: 'منة عمرو',
              relation: 'زوجة',
              nationalId: '29001011234567'
            }
          ]
        }
      ]

      setMedCards(mockData)
      if (mockData.length > 0) {
        setSelectedCard(mockData[0])
      }
    } catch (error) {
      console.error('Failed to fetch MedCards:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      active: { color: 'bg-green-100 text-green-800', text: 'نشط' },
      inactive: { color: 'bg-gray-100 text-gray-800', text: 'غير نشط' },
      expired: { color: 'bg-red-100 text-red-800', text: 'منتهي' },
      suspended: { color: 'bg-amber-100 text-amber-800', text: 'معلق' }
    }
    const badge = badges[status as keyof typeof badges] || badges.active
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        {badge.text}
      </span>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return Check
      case 'inactive': return X
      case 'expired': return Calendar
      case 'suspended': return AlertCircle
      default: return Check
    }
  }

  const activateCard = async (cardId: string) => {
    try {
      // TODO: API call
      setMedCards(cards => 
        cards.map(card => 
          card.id === cardId ? { ...card, status: 'active' as const } : card
        )
      )
    } catch (error) {
      console.error('Failed to activate card:', error)
    }
  }

  const deactivateCard = async (cardId: string) => {
    try {
      // TODO: API call
      setMedCards(cards => 
        cards.map(card => 
          card.id === cardId ? { ...card, status: 'inactive' as const } : card
        )
      )
    } catch (error) {
      console.error('Failed to deactivate card:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('nav.medcard')}</h1>
          <p className="text-gray-500 mt-1">
            إدارة بطاقاتك الطبية والمستفيدين
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          إضافة بطاقة جديدة
        </Button>
      </div>

      {medCards.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                لا توجد بطاقات طبية
              </h3>
              <p className="text-gray-500 mb-6">
                قم بإضافة بطاقتك الطبية الأولى للبدء
              </p>
              <Button onClick={() => setShowAddModal(true)}>
                إضافة بطاقة جديدة
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card List */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">بطاقاتي</h2>
            {medCards.map((card) => {
              const StatusIcon = getStatusIcon(card.status)
              return (
                <Card
                  key={card.id}
                  className={`cursor-pointer transition-all ${
                    selectedCard?.id === card.id
                      ? 'ring-2 ring-teal-500 shadow-lg'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedCard(card)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="font-medium text-gray-900">{card.holderName}</p>
                        <p className="text-sm text-gray-500 font-mono mt-1">
                          {card.cardNumber.replace(/(\d{4})/g, '$1 ').trim()}
                        </p>
                      </div>
                      {getStatusBadge(card.status)}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <p className="text-gray-500">التغطية</p>
                        <p className="font-medium text-gray-900">{card.coverage.type}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-gray-500">المتبقي</p>
                        <p className="font-medium text-teal-600">
                          {formatCurrency(card.coverage.remaining)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Card Details */}
          {selectedCard && (
            <div className="lg:col-span-2 space-y-6">
              {/* Card Visual */}
              <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white border-0 shadow-xl">
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <CreditCard className="w-12 h-12" />
                      <div className="text-left">
                        <p className="text-xs opacity-80">HealthPay</p>
                        <p className="text-sm font-medium">Medical Card</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-2xl font-mono tracking-wider">
                        {selectedCard.cardNumber.replace(/(\d{4})/g, '$1  ').trim()}
                      </p>
                    </div>

                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xs opacity-80 mb-1">حامل البطاقة</p>
                        <p className="text-lg font-medium">{selectedCard.holderName}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-xs opacity-80 mb-1">صالحة حتى</p>
                        <p className="text-lg font-medium">
                          {new Date(selectedCard.validUntil).toLocaleDateString('ar-EG', { month: '2-digit', year: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Coverage Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    تفاصيل التغطية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <DollarSign className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">الحد الأقصى</p>
                        <p className="text-lg font-bold text-gray-900">
                          {formatCurrency(selectedCard.coverage.limit)}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-amber-50 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">المستخدم</p>
                        <p className="text-lg font-bold text-amber-600">
                          {formatCurrency(selectedCard.coverage.used)}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <Check className="w-6 h-6 text-green-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">المتبقي</p>
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(selectedCard.coverage.remaining)}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">نسبة الاستخدام</span>
                        <span className="font-medium">
                          {Math.round((selectedCard.coverage.used / selectedCard.coverage.limit) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-teal-600 h-3 rounded-full transition-all"
                          style={{ width: `${(selectedCard.coverage.used / selectedCard.coverage.limit) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card Info */}
              <Card>
                <CardHeader>
                  <CardTitle>معلومات البطاقة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">رقم البطاقة</p>
                      <p className="font-medium text-gray-900 font-mono">{selectedCard.cardNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">الرقم القومي</p>
                      <p className="font-medium text-gray-900">{selectedCard.nationalId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">تاريخ البدء</p>
                      <p className="font-medium text-gray-900">{formatDate(selectedCard.validFrom)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">تاريخ الانتهاء</p>
                      <p className="font-medium text-gray-900">{formatDate(selectedCard.validUntil)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">نوع التغطية</p>
                      <p className="font-medium text-gray-900">{selectedCard.coverage.type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">الحالة</p>
                      {getStatusBadge(selectedCard.status)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Beneficiaries */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      المستفيدون ({selectedCard.beneficiaries.length})
                    </CardTitle>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 ml-2" />
                      إضافة مستفيد
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedCard.beneficiaries.map((beneficiary) => (
                      <div
                        key={beneficiary.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-teal-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{beneficiary.name}</p>
                            <p className="text-sm text-gray-500">{beneficiary.relation}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>إجراءات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedCard.status === 'active' ? (
                      <Button
                        variant="outline"
                        onClick={() => deactivateCard(selectedCard.id)}
                        className="w-full"
                      >
                        <X className="w-4 h-4 ml-2" />
                        إيقاف البطاقة
                      </Button>
                    ) : (
                      <Button
                        onClick={() => activateCard(selectedCard.id)}
                        className="w-full"
                      >
                        <Check className="w-4 h-4 ml-2" />
                        تفعيل البطاقة
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      onClick={() => setShowQRCode(true)}
                      className="w-full"
                    >
                      <CreditCard className="w-4 h-4 ml-2" />
                      عرض QR Code
                    </Button>
                    
                    <Button variant="outline" className="w-full">
                      <Edit className="w-4 h-4 ml-2" />
                      تعديل البيانات
                    </Button>
                    
                    <Button variant="outline" className="w-full text-teal-600">
                      <Calendar className="w-4 h-4 ml-2" />
                      تجديد البطاقة
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* QR Code Modal */}
              {showQRCode && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <Card className="w-full max-w-md">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>QR Code البطاقة</CardTitle>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowQRCode(false)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col items-center">
                        <div className="bg-white p-6 rounded-lg shadow-inner">
                          <QRCode
                            value={JSON.stringify({
                              cardId: selectedCard.id,
                              cardNumber: selectedCard.cardNumber,
                              holderName: selectedCard.holderName,
                              nationalId: selectedCard.nationalId
                            })}
                            size={200}
                            level="H"
                          />
                        </div>
                        <p className="text-sm text-gray-600 mt-4 text-center">
                          استخدم هذا الرمز في الصيدليات والمستشفيات
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
