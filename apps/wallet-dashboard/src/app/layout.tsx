import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HealthPay Wallet',
  description: 'HealthPay Digital Wallet - Secure payments and transfers',
  manifest: '/manifest.json',
  themeColor: '#14B8A6',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
