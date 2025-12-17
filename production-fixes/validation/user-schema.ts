// ✅ FIXED: Comprehensive Input Validation with Zod
// Location: packages/validation/src/schemas/user.schema.ts

import { z } from 'zod'

// Egyptian phone number regex (starts with 01, followed by specific patterns)
const egyptianPhoneRegex = /^01[0-2,5]{1}[0-9]{8}$/

// Egyptian National ID regex (14 digits)
const egyptianNationalIdRegex = /^[0-9]{14}$/

// ✅ Phone Validation Schema
export const phoneSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(egyptianPhoneRegex, {
      message: 'رقم الهاتف يجب أن يكون رقم مصري صحيح (مثال: 01012345678)'
    })
    .transform(phone => {
      // Ensure it starts with +20
      return phone.startsWith('+20') ? phone : `+20${phone}`
    })
})

// ✅ OTP Validation Schema
export const otpSchema = z.object({
  otp: z
    .string()
    .length(6, 'رمز التحقق يجب أن يكون 6 أرقام')
    .regex(/^[0-9]{6}$/, 'رمز التحقق يجب أن يحتوي على أرقام فقط')
})

// ✅ Registration Schema
export const registrationSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, 'الاسم الكامل يجب أن يكون 3 أحرف على الأقل')
    .max(100, 'الاسم الكامل يجب أن لا يتجاوز 100 حرف')
    .regex(/^[\u0600-\u06FFa-zA-Z\s]+$/, 'الاسم يجب أن يحتوي على حروف عربية أو إنجليزية فقط'),
  
  email: z
    .string()
    .trim()
    .email('البريد الإلكتروني غير صحيح')
    .toLowerCase(),
  
  phone: z
    .string()
    .trim()
    .regex(egyptianPhoneRegex, 'رقم الهاتف يجب أن يكون رقم مصري صحيح'),
  
  nationalId: z
    .string()
    .trim()
    .regex(egyptianNationalIdRegex, 'الرقم القومي يجب أن يكون 14 رقم')
    .refine((val) => {
      // Validate birth date from national ID (first 7 digits: century, year, month, day)
      const century = val.charAt(0)
      const year = parseInt(val.substring(1, 3))
      const month = parseInt(val.substring(3, 5))
      const day = parseInt(val.substring(5, 7))
      
      // Check valid month (1-12)
      if (month < 1 || month > 12) return false
      
      // Check valid day (1-31)
      if (day < 1 || day > 31) return false
      
      // Check age (must be at least 18 years old)
      const fullYear = century === '2' ? 1900 + year : 2000 + year
      const birthDate = new Date(fullYear, month - 1, day)
      const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      
      return age >= 18
    }, 'يجب أن تكون 18 سنة أو أكثر'),
  
  password: z
    .string()
    .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .max(100, 'كلمة المرور يجب أن لا تتجاوز 100 حرف')
    .regex(/[a-z]/, 'كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل')
    .regex(/[A-Z]/, 'كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل')
    .regex(/[0-9]/, 'كلمة المرور يجب أن تحتوي على رقم واحد على الأقل')
    .regex(/[^a-zA-Z0-9]/, 'كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل'),
  
  confirmPassword: z.string(),
  
  termsAccepted: z
    .boolean()
    .refine((val) => val === true, 'يجب الموافقة على الشروط والأحكام')
}).refine((data) => data.password === data.confirmPassword, {
  message: 'كلمات المرور غير متطابقة',
  path: ['confirmPassword']
})

// ✅ Profile Update Schema
export const profileUpdateSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, 'الاسم الكامل يجب أن يكون 3 أحرف على الأقل')
    .max(100, 'الاسم الكامل يجب أن لا يتجاوز 100 حرف')
    .regex(/^[\u0600-\u06FFa-zA-Z\s]+$/, 'الاسم يجب أن يحتوي على حروف عربية أو إنجليزية فقط'),
  
  email: z
    .string()
    .trim()
    .email('البريد الإلكتروني غير صحيح')
    .toLowerCase(),
  
  phone: z
    .string()
    .trim()
    .regex(egyptianPhoneRegex, 'رقم الهاتف يجب أن يكون رقم مصري صحيح'),
  
  nationalId: z
    .string()
    .trim()
    .regex(egyptianNationalIdRegex, 'الرقم القومي يجب أن يكون 14 رقم')
})

// ✅ Password Change Schema
export const passwordChangeSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'كلمة المرور الحالية مطلوبة'),
  
  newPassword: z
    .string()
    .min(8, 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل')
    .max(100, 'كلمة المرور يجب أن لا تتجاوز 100 حرف')
    .regex(/[a-z]/, 'كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل')
    .regex(/[A-Z]/, 'كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل')
    .regex(/[0-9]/, 'كلمة المرور يجب أن تحتوي على رقم واحد على الأقل')
    .regex(/[^a-zA-Z0-9]/, 'كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل'),
  
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'كلمات المرور غير متطابقة',
  path: ['confirmPassword']
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: 'كلمة المرور الجديدة يجب أن تكون مختلفة عن كلمة المرور الحالية',
  path: ['newPassword']
})

// ✅ Transaction Schema
export const transactionSchema = z.object({
  amount: z
    .number()
    .positive('المبلغ يجب أن يكون أكبر من صفر')
    .max(100000, 'الحد الأقصى للمعاملة الواحدة 100,000 جنيه')
    .multipleOf(0.01, 'المبلغ يجب أن يكون بالقروش'),
  
  recipientPhone: z
    .string()
    .trim()
    .regex(egyptianPhoneRegex, 'رقم هاتف المستلم غير صحيح')
    .optional(),
  
  description: z
    .string()
    .trim()
    .max(500, 'الوصف يجب أن لا يتجاوز 500 حرف')
    .optional(),
  
  pin: z
    .string()
    .length(4, 'رمز PIN يجب أن يكون 4 أرقام')
    .regex(/^[0-9]{4}$/, 'رمز PIN يجب أن يحتوي على أرقام فقط')
})

// ✅ Merchant Registration Schema
export const merchantRegistrationSchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(3, 'اسم المتجر يجب أن يكون 3 أحرف على الأقل')
    .max(200, 'اسم المتجر يجب أن لا يتجاوز 200 حرف'),
  
  category: z.enum(['pharmacy', 'clinic', 'hospital', 'lab', 'optical'], {
    errorMap: () => ({ message: 'فئة المتجر غير صحيحة' })
  }),
  
  taxId: z
    .string()
    .trim()
    .min(9, 'الرقم الضريبي يجب أن يكون 9 أرقام على الأقل')
    .max(20, 'الرقم الضريبي غير صحيح'),
  
  commercialRegister: z
    .string()
    .trim()
    .min(5, 'السجل التجاري يجب أن يكون 5 أحرف على الأقل'),
  
  address: z
    .string()
    .trim()
    .min(10, 'العنوان يجب أن يكون 10 أحرف على الأقل')
    .max(500, 'العنوان يجب أن لا يتجاوز 500 حرف'),
  
  city: z
    .string()
    .trim()
    .min(2, 'المدينة مطلوبة'),
  
  ownerName: z
    .string()
    .trim()
    .min(3, 'اسم المالك يجب أن يكون 3 أحرف على الأقل'),
  
  ownerPhone: z
    .string()
    .trim()
    .regex(egyptianPhoneRegex, 'رقم هاتف المالك غير صحيح'),
  
  ownerEmail: z
    .string()
    .trim()
    .email('البريد الإلكتروني للمالك غير صحيح'),
  
  bankAccountNumber: z
    .string()
    .trim()
    .min(10, 'رقم الحساب البنكي غير صحيح')
    .max(30, 'رقم الحساب البنكي غير صحيح'),
  
  iban: z
    .string()
    .trim()
    .regex(/^EG\d{27}$/, 'رقم IBAN غير صحيح (يجب أن يبدأ بـ EG متبوعاً بـ 27 رقم)')
    .optional()
})

// Export types
export type PhoneInput = z.infer<typeof phoneSchema>
export type OTPInput = z.infer<typeof otpSchema>
export type RegistrationInput = z.infer<typeof registrationSchema>
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>
export type TransactionInput = z.infer<typeof transactionSchema>
export type MerchantRegistrationInput = z.infer<typeof merchantRegistrationSchema>

// Helper function for validation
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean
  data?: T
  errors?: string[]
} {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return {
      success: true,
      data: result.data
    }
  }
  
  return {
    success: false,
    errors: result.error.errors.map(err => err.message)
  }
}
