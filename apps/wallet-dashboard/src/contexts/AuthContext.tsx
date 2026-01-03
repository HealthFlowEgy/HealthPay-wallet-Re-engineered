'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useLazyQuery } from '@apollo/client';
import Cookies from 'js-cookie';
import { User, AuthState, SendOTPResult, VerifyOTPResult } from '@/types';
import { SEND_OTP, VERIFY_OTP, GET_ME, SET_PIN } from '@/lib/graphql/queries';
import { clearApolloCache } from '@/lib/graphql/client';

interface AuthContextType extends AuthState {
  sendOTP: (phoneNumber: string) => Promise<SendOTPResult>;
  verifyOTP: (phoneNumber: string, otp: string) => Promise<VerifyOTPResult>;
  setUserPin: (phoneNumber: string, pin: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    loading: true,
  });

  // GraphQL mutations
  const [sendOTPMutation] = useMutation(SEND_OTP);
  const [verifyOTPMutation] = useMutation(VERIFY_OTP);
  const [setPinMutation] = useMutation(SET_PIN);
  const [fetchMe] = useLazyQuery(GET_ME);

  // Initialize auth state from storage
  useEffect(() => {
    const initAuth = async () => {
      const token = Cookies.get('healthpay_token') || localStorage.getItem('healthpay_token');
      const userStr = localStorage.getItem('healthpay_user');

      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          setAuthState({
            isAuthenticated: true,
            user,
            token,
            loading: false,
          });

          // Refresh user data in background
          const { data } = await fetchMe();
          if (data?.me) {
            localStorage.setItem('healthpay_user', JSON.stringify(data.me));
            setAuthState((prev) => ({
              ...prev,
              user: data.me,
            }));
          }
        } catch (error) {
          console.error('Auth init error:', error);
          logout();
        }
      } else {
        setAuthState((prev) => ({ ...prev, loading: false }));
      }
    };

    initAuth();
  }, []);

  // Send OTP
  const sendOTP = useCallback(async (phoneNumber: string): Promise<SendOTPResult> => {
    try {
      const { data } = await sendOTPMutation({
        variables: { input: { phoneNumber } },
      });
      return data.sendOTP;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'حدث خطأ في إرسال رمز التحقق',
      };
    }
  }, [sendOTPMutation]);

  // Verify OTP
  const verifyOTP = useCallback(async (phoneNumber: string, otp: string): Promise<VerifyOTPResult> => {
    try {
      const { data } = await verifyOTPMutation({
        variables: { input: { phoneNumber, code: otp } },
      });

      const result = data.verifyOTP;

      if (result.success && result.token && result.user) {
        // Store auth data
        Cookies.set('healthpay_token', result.token, { expires: 7 });
        localStorage.setItem('healthpay_token', result.token);
        localStorage.setItem('healthpay_user', JSON.stringify(result.user));

        setAuthState({
          isAuthenticated: true,
          user: result.user,
          token: result.token,
          loading: false,
        });
      }

      return result;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'حدث خطأ في التحقق من الرمز',
      };
    }
  }, [verifyOTPMutation]);

  // Set PIN
  const setUserPin = useCallback(async (phoneNumber: string, pin: string): Promise<boolean> => {
    try {
      const { data } = await setPinMutation({
        variables: { phoneNumber, pin },
      });
      return data.setPin.success;
    } catch (error) {
      console.error('Set PIN error:', error);
      return false;
    }
  }, [setPinMutation]);

  // Logout
  const logout = useCallback(() => {
    Cookies.remove('healthpay_token');
    localStorage.removeItem('healthpay_token');
    localStorage.removeItem('healthpay_user');
    clearApolloCache();

    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false,
    });

    // Redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/ar/auth/login';
    }
  }, []);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    try {
      const { data } = await fetchMe();
      if (data?.me) {
        localStorage.setItem('healthpay_user', JSON.stringify(data.me));
        setAuthState((prev) => ({
          ...prev,
          user: data.me,
        }));
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  }, [fetchMe]);

  const value: AuthContextType = {
    ...authState,
    sendOTP,
    verifyOTP,
    setUserPin,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
