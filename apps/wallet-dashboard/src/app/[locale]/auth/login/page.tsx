'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Phone, ArrowRight, Wallet, Shield, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function LoginPage() {
  const router = useRouter()
  const t = useTranslations()
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate phone number
    if (!phone || phone.length < 11) {
      setError('رقم الهاتف غير صحيح')
      return
    }

    setLoading(true)
    try {
      // TODO: API call to send OTP
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Redirect to OTP page
      router.push(`/ar/auth/otp?phone=${encodeURIComponent(phone)}`)
    } catch (err) {
      setError(t('errors.generic'))
    } finally {
      setLoading(false)
    }
  }

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    
    // Format as: 01XX XXX XXXX
    if (digits.length <= 4) return digits
    if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 11)}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left side - Branding */}
        <div className="hidden lg:flex flex-col justify-center text-gray-900">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl">
                <Wallet className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">HealthPay</h1>
                <p className="text-teal-600">محفظتك الصحية الرقمية</p>
              </div>
            </div>

            <div className="space-y-4 mt-12">
              <div className="flex items-start gap-4 p-4 bg-white/50 rounded-lg backdrop-blur">
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">آمن ومضمون</h3>
                  <p className="text-gray-600">
                    نحمي بياناتك بأحدث معايير الأمان والتشفير
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-white/50 rounded-lg backdrop-blur">
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">سريع وسهل</h3>
                  <p className="text-gray-600">
                    إتمام المعاملات في ثوانٍ مع واجهة بسيطة
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-white/50 rounded-lg backdrop-blur">
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Wallet className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">لجميع احتياجاتك</h3>
                  <p className="text-gray-600">
                    ادفع للأطباء والصيدليات والمستشفيات من مكان واحد
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                انضم لأكثر من <span className="font-bold text-teal-600">100,000</span> مستخدم يثقون في HealthPay
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="flex items-center">
          <Card className="w-full shadow-2xl border-0">
            <CardHeader className="space-y-3">
              <div className="lg:hidden flex items-center gap-3 justify-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <Wallet className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">HealthPay</h1>
                </div>
              </div>
              
              <CardTitle className="text-2xl">{t('auth.login')}</CardTitle>
              <CardDescription className="text-base">
                أدخل رقم هاتفك للدخول إلى حسابك
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSendOTP} className="space-y-6">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('auth.phone')}
                  </label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01XX XXX XXXX"
                      className="w-full pr-10 pl-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-lg"
                      maxLength={13}
                      required
                    />
                  </div>
                  {error && (
                    <p className="text-red-600 text-sm mt-2">{error}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    سنرسل لك رمز التحقق عبر SMS
                  </p>
                </div>

                <Button
                  type="submit"
                  loading={loading}
                  className="w-full py-6 text-lg"
                  size="lg"
                >
                  {loading ? t('common.loading') : 'إرسال رمز التحقق'}
                  {!loading && <ArrowRight className="w-5 h-5 mr-2" />}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    ليس لديك حساب؟{' '}
                    <Link href="/ar/auth/register" className="text-teal-600 hover:text-teal-700 font-medium">
                      سجل الآن
                    </Link>
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">أو</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button type="button" variant="outline" className="w-full py-6" size="lg">
                    <svg className="w-5 h-5 ml-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    تسجيل الدخول بحساب Google
                  </Button>

                  <Button type="button" variant="outline" className="w-full py-6" size="lg">
                    <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
                    </svg>
                    تسجيل الدخول بحساب Facebook
                  </Button>
                </div>

                <div className="text-center pt-4">
                  <p className="text-xs text-gray-500">
                    بتسجيل الدخول، أنت توافق على{' '}
                    <Link href="/terms" className="text-teal-600 hover:underline">
                      الشروط والأحكام
                    </Link>
                    {' '}و{' '}
                    <Link href="/privacy" className="text-teal-600 hover:underline">
                      سياسة الخصوصية
                    </Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
