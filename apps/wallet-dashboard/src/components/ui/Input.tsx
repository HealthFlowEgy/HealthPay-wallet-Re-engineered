'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, iconPosition = 'right', type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    const inputType = type === 'password' && showPassword ? 'text' : type;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && iconPosition === 'left' && (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            type={inputType}
            className={cn(
              'w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all',
              error ? 'border-danger-500' : 'border-gray-200',
              icon && iconPosition === 'left' ? 'pl-12' : '',
              icon && iconPosition === 'right' ? 'pr-12' : '',
              type === 'password' ? 'pr-12' : '',
              className
            )}
            {...props}
          />
          {icon && iconPosition === 'right' && type !== 'password' && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </span>
          )}
          {type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-danger-500">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1 text-sm text-gray-500">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

// Phone Input Component
export function PhoneInput({
  value,
  onChange,
  error,
  label = 'رقم الهاتف',
  ...props
}: Omit<InputProps, 'type'>) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-gray-500">
          <span>🇪🇬</span>
          <span className="text-sm">+20</span>
        </div>
        <input
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={11}
          value={value}
          onChange={onChange}
          className={cn(
            'w-full pl-24 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all',
            error ? 'border-danger-500' : 'border-gray-200'
          )}
          placeholder="01xxxxxxxxx"
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-danger-500">{error}</p>
      )}
    </div>
  );
}

// OTP Input Component
export function OTPInput({
  length = 6,
  value,
  onChange,
  error,
}: {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, digit: string) => {
    if (!/^\d*$/.test(digit)) return;

    const newValue = value.split('');
    newValue[index] = digit;
    const updatedValue = newValue.join('').slice(0, length);
    onChange(updatedValue);

    // Auto-focus next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pastedData);
  };

  return (
    <div>
      <div className="flex gap-2 justify-center" dir="ltr">
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value[index] || ''}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className={cn(
              'otp-input',
              error && 'border-danger-500'
            )}
          />
        ))}
      </div>
      {error && (
        <p className="mt-2 text-sm text-danger-500 text-center">{error}</p>
      )}
    </div>
  );
}

// Amount Input Component
export function AmountInput({
  value,
  onChange,
  currency = 'EGP',
  error,
  max,
}: {
  value: string;
  onChange: (value: string) => void;
  currency?: string;
  error?: string;
  max?: number;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d.]/g, '');
    // Prevent multiple decimals
    const parts = val.split('.');
    if (parts.length > 2) return;
    if (parts[1]?.length > 2) return;
    // Check max
    if (max && parseFloat(val) > max) return;
    onChange(val);
  };

  return (
    <div className="text-center">
      <div className="relative inline-block">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleChange}
          placeholder="0.00"
          className={cn(
            'amount-input text-gray-800',
            error && 'text-danger-500'
          )}
        />
      </div>
      <p className="text-gray-500 mt-1">{currency === 'EGP' ? 'جنيه مصري' : currency}</p>
      {error && (
        <p className="mt-2 text-sm text-danger-500">{error}</p>
      )}
    </div>
  );
}

// PIN Input Component
export function PINInput({
  value,
  onChange,
  error,
  label = 'رمز PIN',
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
}) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
          {label}
        </label>
      )}
      <OTPInput
        length={4}
        value={value}
        onChange={onChange}
        error={error}
      />
    </div>
  );
}
