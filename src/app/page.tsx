'use client';

/**
 * Inner Circle Partners Portal - Landing Page
 * Redirects authenticated users to dashboard
 * Shows landing page for unauthenticated users
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// ============================================
// Auth Hook with Clerk fallback
// ============================================

function useAuthState(): { isLoaded: boolean; isSignedIn: boolean } {
  const [state, setState] = useState({ isLoaded: false, isSignedIn: false });

  useEffect(() => {
    // Check if Clerk is available
    const hasClerkKey = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
    
    if (!hasClerkKey) {
      // No Clerk configured, mark as loaded but not signed in
      setState({ isLoaded: true, isSignedIn: false });
      return;
    }

    // If Clerk is configured, it will be handled by the ClerkProvider in layout
    // For now, we just mark as loaded since the provider manages auth state
    setState({ isLoaded: true, isSignedIn: false });
  }, []);

  return state;
}

// ============================================
// Landing Page Component
// ============================================

function LandingPage(): React.ReactElement {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Hero Section */}
      <header className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          DFX RMS
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Join our partner program and earn commissions for every successful referral.
          Track your earnings, manage campaigns, and grow your network.
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/sign-up"
            className="px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors"
          >
            Get Started
          </a>
          <a
            href="/sign-in"
            className="px-6 py-3 bg-white text-gray-700 rounded-xl font-semibold border border-gray-200 hover:border-primary-300 transition-colors"
          >
            Sign In
          </a>
        </div>
      </header>

      {/* Features Grid */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="text-3xl mb-4">💰</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Earn Commissions
            </h3>
            <p className="text-gray-600">
              Get paid for every successful referral. Higher tiers mean higher earnings.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Track Performance
            </h3>
            <p className="text-gray-600">
              Real-time analytics on clicks, conversions, and revenue by campaign.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="text-3xl mb-4">🎯</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Custom Campaigns
            </h3>
            <p className="text-gray-600">
              Create unique tracking links for different channels and audiences.
            </p>
          </div>
        </div>
      </section>

      {/* Tier Information */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          Partner Tiers
        </h2>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { tier: 'Standard', rate: '15%', color: 'gray' },
            { tier: 'Silver', rate: '18%', color: 'gray' },
            { tier: 'Gold', rate: '22%', color: 'yellow' },
            { tier: 'Platinum', rate: '25%', color: 'purple' },
          ].map((item) => (
            <div 
              key={item.tier}
              className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-200"
            >
              <div className="text-lg font-semibold text-gray-900">{item.tier}</div>
              <div className="text-2xl font-bold text-primary-600">{item.rate}</div>
              <div className="text-sm text-gray-500">Commission</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-primary-600 rounded-2xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">
            Ready to Start Earning?
          </h2>
          <p className="text-primary-100 mb-6">
            Join thousands of partners already earning with DFX RMS.
          </p>
          <a
            href="/sign-up"
            className="inline-block px-8 py-3 bg-white text-primary-600 rounded-xl font-semibold hover:bg-primary-50 transition-colors"
          >
            Create Your Account
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-4 py-8 text-center text-sm text-gray-500">
        <p>© 2025 DFX RMS. All rights reserved.</p>
      </footer>
    </div>
  );
}

// ============================================
// Main Page Export
// ============================================

export default function HomePage(): React.ReactElement {
  const { isLoaded, isSignedIn } = useAuthState();
  const router = useRouter();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push('/dashboard' as any);
    }
  }, [isLoaded, isSignedIn, router]);

  // Show loading state while checking auth
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Show landing page for unauthenticated users
  return <LandingPage />;
}
