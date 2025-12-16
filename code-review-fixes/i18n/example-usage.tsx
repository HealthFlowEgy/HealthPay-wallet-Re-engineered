// ✅ FIXED: Proper i18n Usage in Components
// Location: Example usage in settings page

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from '@/components/toast/toast-provider'
import { validateInput, passwordChangeSchema, profileUpdateSchema } from '@healthpay/validation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function SettingsPageExample() {
  const t = useTranslations()
  
  const [profileData, setProfileData] = useState({
    fullName: 'أحمد محمد',
    email: 'ahmed@example.com',
    phone: '01012345678',
    nationalId: '29501011234567'
  })
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // ✅ PROPER: Profile update with validation and toast
  const handleSaveProfile = async () => {
    // Validate input
    const validation = validateInput(profileUpdateSchema, profileData)
    
    if (!validation.success) {
      toast.error(t('errors.generic'), {
        description: validation.errors?.[0]
      })
      return
    }

    try {
      // Show loading toast
      const loadingToast = toast.loading(t('common.loading'))
      
      // Make API call
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data)
      })

      // Dismiss loading toast
      toast.dismiss(loadingToast)

      if (!response.ok) {
        const error = await response.json()
        toast.error(t('errors.generic'), {
          description: error.message
        })
        return
      }

      // Success!
      toast.success(t('success.profileUpdated'), {
        description: t('profile.fullName') + ': ' + validation.data.fullName
      })
      
    } catch (error) {
      toast.error(t('errors.networkError'), {
        description: t('errors.generic')
      })
    }
  }

  // ✅ PROPER: Password change with validation and toast
  const handleChangePassword = async () => {
    // Validate passwords
    const validation = validateInput(passwordChangeSchema, passwordData)
    
    if (!validation.success) {
      toast.error(validation.errors?.[0] || t('errors.generic'))
      return
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data)
      })

      if (!response.ok) {
        const error = await response.json()
        
        // Handle specific error cases
        if (error.code === 'INVALID_CURRENT_PASSWORD') {
          toast.error(t('errors.invalidCredentials'))
        } else {
          toast.error(t('errors.generic'))
        }
        return
      }

      // Success!
      toast.success(t('success.passwordChanged'), {
        description: t('settings.security')
      })
      
      // Clear password fields
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      
    } catch (error) {
      toast.error(t('errors.networkError'))
    }
  }

  // ✅ PROPER: Delete account with confirmation
  const handleDeleteAccount = () => {
    // Custom confirmation toast with action
    toast.warning(t('settings.deleteAccount'), {
      description: t('settings.deleteAccountWarning'),
      duration: 10000,
      action: {
        label: t('actions.delete'),
        onClick: async () => {
          try {
            await fetch('/api/account', { method: 'DELETE' })
            toast.success(t('success.accountDeleted'))
            // Redirect to login
            window.location.href = '/auth/login'
          } catch (error) {
            toast.error(t('errors.generic'))
          }
        }
      },
      cancel: {
        label: t('actions.cancel'),
        onClick: () => toast.dismiss()
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('profile.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('profile.fullName')}
              </label>
              <input
                type="text"
                value={profileData.fullName}
                onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t('profile.email')}
              </label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <Button onClick={handleSaveProfile}>
              {t('actions.save')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password Change Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('profile.changePassword')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('profile.currentPassword')}
              </label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t('profile.newPassword')}
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t('auth.confirmPassword')}
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <Button onClick={handleChangePassword}>
              {t('profile.changePassword')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">
            {t('settings.dangerZone')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleDeleteAccount}>
            {t('settings.deleteAccount')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// ✅ MIGRATION GUIDE: Replace all hardcoded strings

/*
BEFORE (❌ BAD):
alert('كلمات المرور غير متطابقة')
alert('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
alert('تم حفظ الملف الشخصي بنجاح')

AFTER (✅ GOOD):
toast.error(t('errors.passwordMismatch'))
toast.error(t('errors.passwordTooShort'))
toast.success(t('success.profileUpdated'))
*/
