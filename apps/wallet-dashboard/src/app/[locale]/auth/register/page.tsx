'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { 
  Phone, 
  ArrowRight, 
  Wallet, 
  User, 
  Mail, 
  CreditCard,
  Eye,
  EyeOff,
  Check,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function RegisterPage() {
  const router = useRouter()
  const t = useTranslations()
  const [step, setStep] = useState(1) // 1: Personal Info, 2: Verification, 3: Password
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    nationalId: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  })

  // Password validation states
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  })

  // Validate password in real-time
  const validatePassword = (password: string) => {
    setPasswordValidation({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    })
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData({ ...formData, [field]: value })
    if (field === 'password') {
      validatePassword(value as string)
    }
  }

  const validateStep1 = () => {
    if (!formData.fullName || formData.fullName.length < 3) {
      setError('الاسم يجب أن يكون 3 أحرف على الأقل')
      return false
    }
    if (!formData.phone || formData.phone.length < 11) {
      setError('رقم الهاتف غير صحيح')
      return false
    }
    if (!formData.email || !formData.email.includes('@')) {
      setError('البريد الإلكتروني غير صحيح')
      return false
    }
    if (!formData.nationalId || formData.nationalId.length !== 14) {
      setError('الرقم القومي يجب أن يكون 14 رقم')
      return false
    }
    return true
  }

  const validateStep3 = () => {
    if (!Object.values(passwordValidation).every(v => v)) {
      setError('كلمة المرور لا تستوفي جميع الشروط')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError('كلمات المرور غير متطابقة')
      return false
    }
    if (!formData.acceptTerms) {
      setError('يجب الموافقة على الشروط والأحكام')
      return false
    }
    return true
  }

  const handleNextStep = async () => {
    setError('')

    if (step === 1) {
      if (!validateStep1()) return
      setStep(2)
    } else if (step === 2) {
      // Send OTP
      setLoading(true)
      try {
        await new Promise(resolve => setTimeout(resolve, 1500))
        router.push(`/ar/auth/otp?phone=${encodeURIComponent(formData.phone)}&type=register`)
      } catch (err) {
        setError(t('errors.generic'))
      } finally {
        setLoading(false)
      }
    }
  }

  const handleRegister = async () => {
    setError('')
    if (!validateStep3()) return

    setLoading(true)
    try {
      // TODO: API call to register
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Redirect to success page or dashboard
      router.push('/ar/auth/register-success')
    } catch (err) {
      setError(t('errors.generic'))
    } finally {
      setLoading(false)
    }
  }

  const ValidationItem = ({ isValid, text }: { isValid: boolean; text: string }) => (
    <div className="flex items-center gap-2 text-sm">
      {isValid ? (
        <Check className="w-4 h-4 text-green-600" />
      ) : (
        <X className="w-4 h-4 text-gray-400" />
      )}
      <span className={isValid ? 'text-green-600' : 'text-gray-500'}>{text}</span>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
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

            <CardTitle className="text-2xl">إنشاء حساب جديد</CardTitle>
            <CardDescription className="text-base">
              {step === 1 && 'أدخل بياناتك الشخصية'}
              {step === 2 && 'سنرسل رمز التحقق إلى هاتفك'}
              {step === 3 && 'قم بإنشاء كلمة مرور قوية'}
            </CardDescription>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2 pt-4">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= s
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}>
                    {s}
                  </div>
                  {s < 3 && (
                    <div className={`w-12 h-1 ${
                      step > s ? 'bg-teal-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </CardHeader>

          <CardContent>
            {/* Step 1: Personal Information */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الاسم الكامل *
                  </label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      placeholder="أحمد محمد علي"
                      className="w-full pr-10 pl-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    رقم الهاتف *
                  </label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="01XX XXX XXXX"
                      className="w-full pr-10 pl-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      maxLength={11}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    البريد الإلكتروني *
                  </label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="ahmed@example.com"
                      className="w-full pr-10 pl-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الرقم القومي *
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={formData.nationalId}
                      onChange={(e) => handleInputChange('nationalId', e.target.value.replace(/\D/g, ''))}
                      placeholder="12345678901234"
                      className="w-full pr-10 pl-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      maxLength={14}
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    14 رقم - سيتم التحقق من الرقم القومي
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <Button
                  onClick={handleNextStep}
                  className="w-full py-6 text-lg"
                  size="lg"
                >
                  متابعة
                  <ArrowRight className="w-5 h-5 mr-2" />
                </Button>
              </div>
            )}

            {/* Step 2: Phone Verification */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Phone className="w-10 h-10 text-teal-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">تأكيد رقم الهاتف</h3>
                  <p className="text-gray-600 mb-6">
                    سنرسل رمز التحقق إلى رقم الهاتف:
                  </p>
                  <p className="text-2xl font-bold text-teal-600 mb-6">
                    {formData.phone}
                  </p>
                  
                  <div className="flex justify-center gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setStep(1)}
                    >
                      تعديل الرقم
                    </Button>
                    <Button
                      onClick={handleNextStep}
                      loading={loading}
                    >
                      إرسال رمز التحقق
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Password Creation */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    كلمة المرور *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    تأكيد كلمة المرور *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Password Requirements */}
                <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                  <p className="text-sm font-medium text-gray-700 mb-2">شروط كلمة المرور:</p>
                  <ValidationItem isValid={passwordValidation.length} text="8 أحرف على الأقل" />
                  <ValidationItem isValid={passwordValidation.uppercase} text="حرف كبير واحد على الأقل (A-Z)" />
                  <ValidationItem isValid={passwordValidation.lowercase} text="حرف صغير واحد على الأقل (a-z)" />
                  <ValidationItem isValid={passwordValidation.number} text="رقم واحد على الأقل (0-9)" />
                  <ValidationItem isValid={passwordValidation.special} text="رمز خاص واحد على الأقل (!@#$%)" />
                </div>

                {/* Terms & Conditions */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                    className="mt-1"
                  />
                  <label htmlFor="acceptTerms" className="text-sm text-gray-600">
                    أوافق على{' '}
                    <Link href="/terms" className="text-teal-600 hover:underline">
                      الشروط والأحكام
                    </Link>
                    {' '}و{' '}
                    <Link href="/privacy" className="text-teal-600 hover:underline">
                      سياسة الخصوصية
                    </Link>
                  </label>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <Button
                  onClick={handleRegister}
                  loading={loading}
                  className="w-full py-6 text-lg"
                  size="lg"
                >
                  {loading ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
                </Button>
              </div>
            )}

            {/* Login Link */}
            <div className="text-center pt-4">
              <p className="text-sm text-gray-600">
                لديك حساب بالفعل؟{' '}
                <Link href="/ar/auth/login" className="text-teal-600 hover:text-teal-700 font-medium">
                  تسجيل الدخول
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
