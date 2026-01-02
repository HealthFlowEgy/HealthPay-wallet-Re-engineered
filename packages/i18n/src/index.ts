/**
 * @healthpay/i18n
 * Internationalization support for HealthPay
 */

import arTranslations from './translations/translations-ar.json';

export const translations = {
  ar: arTranslations,
  en: {} // English translations to be added
};

export type TranslationKey = keyof typeof arTranslations;

export function t(key: TranslationKey, locale: 'ar' | 'en' = 'ar'): string {
  return translations[locale][key] || key;
}
