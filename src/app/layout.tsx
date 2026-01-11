import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Providers } from '@/components/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'RMS - Referral Management System',
  description: 'Multi-Company Partner Referral Management System',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'RMS',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#6366f1',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// Check if Clerk is configured
const hasClerkKey = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const content = (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );

  // Only wrap with ClerkProvider if keys are configured
  if (hasClerkKey) {
    return (
      <ClerkProvider>
        {content}
      </ClerkProvider>
    );
  }

  return content;
}
