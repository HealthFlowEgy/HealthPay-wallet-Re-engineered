'use client';

import { ApolloProvider } from '@apollo/client';
import { apolloClient } from '@/lib/graphql/client';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { BottomNav } from '@/components/layouts';
import { usePathname } from 'next/navigation';

// Pages that should hide the bottom navigation
const noNavPages = ['/auth/login', '/auth/otp', '/auth/register'];

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: {
    locale: 'ar' | 'en';
  };
}

export default function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = params;
  const pathname = usePathname();
  
  // Check if current page should hide nav
  const showNav = !noNavPages.some(page => pathname.includes(page));
  
  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`font-sans antialiased bg-gray-50 ${showNav ? 'pb-20' : ''}`}>
        <ApolloProvider client={apolloClient}>
          <AuthProvider>
            <ToastProvider>
              <main className="min-h-screen">
                {children}
              </main>
              {showNav && <BottomNav locale={locale} />}
            </ToastProvider>
          </AuthProvider>
        </ApolloProvider>
      </body>
    </html>
  );
}
