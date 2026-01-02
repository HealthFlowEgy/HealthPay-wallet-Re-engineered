/**
 * Registration Form - Integration Example
 * 
 * This example shows how to use:
 * - Input validation (@healthpay/validation)
 * - Toast notifications (@healthpay/ui)
 * - i18n translations (@healthpay/i18n)
 */

'use client';

import { useState } from 'react';
import { validateInput, registrationSchema } from '@healthpay/validation';
import { toast } from '@healthpay/ui/components/toast';
import { t } from '@healthpay/i18n';

export default function RegistrationFormExample() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    nationalId: '',
    password: '',
    confirmPassword: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ✅ STEP 1: Validate input using Zod schemas
    const validation = validateInput(registrationSchema, formData);
    
    if (!validation.success) {
      // ❌ Show validation error using toast (NOT alert!)
      toast.error(validation.errors[0]);
      return;
    }

    setIsSubmitting(true);

    try {
      // ✅ STEP 2: Submit validated data to API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(validation.data)
      });

      const result = await response.json();

      if (!response.ok) {
        // ❌ Show API error using toast
        toast.error(result.error || t('registration.failed'));
        return;
      }

      // ✅ Show success message using toast with i18n
      toast.success(t('registration.success'));
      
      // Redirect to login or dashboard
      window.location.href = '/auth/login';
      
    } catch (error) {
      console.error('Registration error:', error);
      // ❌ Show network error using toast
      toast.error(t('network.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        {t('registration.title')}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            {t('form.name.label')}
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder={t('form.name.placeholder')}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Phone Field */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-2">
            {t('form.phone.label')}
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+201012345678"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            {t('form.phone.hint')}
          </p>
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            {t('form.email.label')}
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="user@example.com"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* National ID Field */}
        <div>
          <label htmlFor="nationalId" className="block text-sm font-medium mb-2">
            {t('form.nationalId.label')}
          </label>
          <input
            type="text"
            id="nationalId"
            name="nationalId"
            value={formData.nationalId}
            onChange={handleChange}
            placeholder="12345678901234"
            maxLength={14}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            {t('form.nationalId.hint')}
          </p>
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2">
            {t('form.password.label')}
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            {t('form.password.hint')}
          </p>
        </div>

        {/* Confirm Password Field */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
            {t('form.confirmPassword.label')}
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="••••••••"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? t('form.submitting') : t('form.submit')}
        </button>
      </form>

      {/* Additional Examples */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium mb-2">Toast Examples:</h3>
        <div className="space-y-2">
          <button
            onClick={() => toast.success(t('toast.success.example'))}
            className="px-4 py-2 bg-green-600 text-white rounded mr-2"
          >
            Success Toast
          </button>
          <button
            onClick={() => toast.error(t('toast.error.example'))}
            className="px-4 py-2 bg-red-600 text-white rounded mr-2"
          >
            Error Toast
          </button>
          <button
            onClick={() => toast.warning(t('toast.warning.example'))}
            className="px-4 py-2 bg-yellow-600 text-white rounded mr-2"
          >
            Warning Toast
          </button>
          <button
            onClick={() => toast.info(t('toast.info.example'))}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Info Toast
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * MIGRATION GUIDE: Replacing alert() with toast
 * 
 * ❌ OLD WAY (Don't use):
 * alert('تم حفظ الملف الشخصي بنجاح');
 * 
 * ✅ NEW WAY (Use this):
 * import { toast } from '@healthpay/ui/components/toast';
 * toast.success('تم حفظ الملف الشخصي بنجاح');
 * 
 * Toast Types:
 * - toast.success() - For successful operations
 * - toast.error() - For errors
 * - toast.warning() - For warnings
 * - toast.info() - For informational messages
 * 
 * Benefits:
 * - Professional UI
 * - Arabic RTL support
 * - Auto-dismiss
 * - Non-blocking
 * - Stackable notifications
 */
