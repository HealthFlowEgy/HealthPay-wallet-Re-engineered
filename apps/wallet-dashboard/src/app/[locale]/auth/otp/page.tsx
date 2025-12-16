'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ArrowRight, Wallet, Phone, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function OTPPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations()
  
  const phone = searchParams.get('phone') || ''
  const type = searchParams.get('type') || 'login' // 'login' or 'register'
  
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(60)
  const [canResend, setCanResend] = useState(false)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [resendTimer])

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setError('')

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all 6 digits are entered
    if (index === 5 && value) {
      const fullOtp = [...newOtp.slice(0, 5), value].join('')
      if (fullOtp.length === 6) {
        handleVerify(fullOtp)
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    
    // Handle paste
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      navigator.clipboard.readText().then(text => {
        const digits = text.replace(/\D/g, '').slice(0, 6)
        const newOtp = [...otp]
        digits.split('').forEach((digit, i) => {
          if (i < 6) newOtp[i] = digit
        })
        setOtp(newOtp)
        
        // Focus last filled input
        const lastIndex = Math.min(digits.length - 1, 5)
        inputRefs.current[lastIndex]?.focus()
        
        // Auto-submit if complete
        if (digits.length === 6) {
          handleVerify(digits)
        }
      })
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text')
    const digits = pastedData.replace(/\D/g, '').slice(0, 6)
    
    const newOtp = [...otp]
    digits.split('').forEach((digit, i) => {
      if (i < 6) newOtp[i] = digit
    })
    setOtp(newOtp)
    
    // Focus last filled input
    const lastIndex = Math.min(digits.length - 1, 5)
    inputRefs.current[lastIndex]?.focus()
    
    // Auto-submit if complete
    if (digits.length === 6) {
      handleVerify(digits)
    }
  }

  const handleVerify = async (otpCode?: string) => {
    const code = otpCode || otp.join('')
    
    if (code.length !== 6) {
      setError('يرجى إدخال الرمز المكون من 6 أرقام')
      return
    }

    setLoading(true)
    setError('')

    try {
      // TODO: API call to verify OTP
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Mock verification - accept any 6-digit code
      // In production, validate against backend
      
      if (type === 'register') {
        // Complete registration
        router.push('/ar/auth/register?step=3')
      } else {
        // Login successful, redirect to dashboard
        router.push('/ar/dashboard')
      }
    } catch (err) {
      setError('رمز التحقق غير صحيح، يرجى المحاولة مرة أخرى')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResendLoading(true)
    setError('')

    try {
      // TODO: API call to resend OTP
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Reset timer and OTP
      setResendTimer(60)
      setCanResend(false)
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
      
      // Show success message (you could use a toast here)
      alert('تم إرسال رمز جديد إلى ' + phone)
    } catch (err) {
      setError(t('errors.generic'))
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0">
          <CardHeader className="space-y-3 text-center">
            {/* Logo */}
            <div className="flex items-center gap-3 justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Wallet className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">HealthPay</h1>
              </div>
            </div>

            <CardTitle className="text-2xl">تأكيد رقم الهاتف</CardTitle>
            <CardDescription className="text-base">
              أدخل الرمز المرسل إلى
              <br />
              <span className="text-teal-600 font-semibold text-lg">{phone}</span>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* OTP Input */}
            <div>
              <div className="flex justify-center gap-2 mb-4" dir="ltr">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                    disabled={loading}
                  />
                ))}
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm text-center">{error}</p>
                </div>
              )}

              <p className="text-sm text-gray-500 text-center">
                لم تستلم الرمز؟
              </p>
            </div>

            {/* Resend Button */}
            <div className="text-center">
              {canResend ? (
                <Button
                  variant="outline"
                  onClick={handleResend}
                  loading={resendLoading}
                  className="w-full"
                >
                  <RotateCw className="w-4 h-4 ml-2" />
                  إعادة إرسال الرمز
                </Button>
              ) : (
                <p className="text-sm text-gray-600">
                  يمكنك إعادة الإرسال بعد{' '}
                  <span className="font-bold text-teal-600">{resendTimer}</span>
                  {' '}ثانية
                </p>
              )}
            </div>

            {/* Verify Button */}
            <Button
              onClick={() => handleVerify()}
              loading={loading}
              disabled={otp.join('').length !== 6}
              className="w-full py-6 text-lg"
              size="lg"
            >
              {loading ? 'جاري التحقق...' : 'تأكيد'}
              {!loading && <ArrowRight className="w-5 h-5 mr-2" />}
            </Button>

            {/* Back Button */}
            <div className="text-center">
              <Link
                href="/ar/auth/login"
                className="text-sm text-gray-600 hover:text-gray-900 inline-flex items-center gap-2"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                العودة لتسجيل الدخول
              </Link>
            </div>

            {/* Tips */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                نصائح:
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• قد تستغرق الرسالة من 1-2 دقيقة</li>
                <li>• تأكد من تغطية الشبكة</li>
                <li>• تحقق من صندوق الرسائل المحظورة</li>
                <li>• الرمز صالح لمدة 10 دقائق فقط</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
