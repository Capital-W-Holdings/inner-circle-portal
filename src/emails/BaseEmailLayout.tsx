/**
 * Base Email Layout
 * Shared layout for all email templates
 */

import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

// ============================================
// Types
// ============================================

interface BaseEmailLayoutProps {
  preview: string;
  children: React.ReactNode;
  footerText?: string;
}

// ============================================
// Styles
// ============================================

const styles = {
  body: {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
  },
  container: {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '20px 0 48px',
    marginBottom: '64px',
  },
  header: {
    padding: '32px 48px 24px',
    borderBottom: '1px solid #e6ebf1',
  },
  logo: {
    margin: '0 auto',
  },
  content: {
    padding: '24px 48px',
  },
  footer: {
    padding: '24px 48px',
    borderTop: '1px solid #e6ebf1',
  },
  footerText: {
    color: '#8898aa',
    fontSize: '12px',
    lineHeight: '16px',
    textAlign: 'center' as const,
  },
  footerLink: {
    color: '#6366f1',
    textDecoration: 'underline',
  },
};

// ============================================
// Component
// ============================================

export function BaseEmailLayout({
  preview,
  children,
  footerText,
}: BaseEmailLayoutProps): React.ReactElement {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://innercircle.co';
  
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header with Logo */}
          <Section style={styles.header}>
            <Img
              src={`${appUrl}/logo.png`}
              width="150"
              height="40"
              alt="Inner Circle"
              style={styles.logo}
            />
          </Section>
          
          {/* Main Content */}
          <Section style={styles.content}>
            {children}
          </Section>
          
          {/* Footer */}
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              {footerText || 'You are receiving this email because you are a partner with Inner Circle.'}
            </Text>
            <Text style={styles.footerText}>
              <Link href={`${appUrl}/dashboard`} style={styles.footerLink}>
                Dashboard
              </Link>
              {' • '}
              <Link href={`${appUrl}/settings`} style={styles.footerLink}>
                Email Preferences
              </Link>
              {' • '}
              <Link href={`${appUrl}/unsubscribe`} style={styles.footerLink}>
                Unsubscribe
              </Link>
            </Text>
            <Text style={styles.footerText}>
              © {new Date().getFullYear()} Inner Circle Partners. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ============================================
// Shared Styles Export
// ============================================

export const emailStyles = {
  heading: {
    color: '#1f2937',
    fontSize: '24px',
    fontWeight: '600',
    lineHeight: '32px',
    margin: '0 0 16px',
  },
  subheading: {
    color: '#1f2937',
    fontSize: '18px',
    fontWeight: '600',
    lineHeight: '24px',
    margin: '24px 0 12px',
  },
  paragraph: {
    color: '#4b5563',
    fontSize: '16px',
    lineHeight: '24px',
    margin: '0 0 16px',
  },
  smallText: {
    color: '#6b7280',
    fontSize: '14px',
    lineHeight: '20px',
    margin: '0 0 8px',
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: '8px',
    color: '#ffffff',
    display: 'inline-block',
    fontSize: '16px',
    fontWeight: '600',
    padding: '12px 24px',
    textDecoration: 'none',
    textAlign: 'center' as const,
  },
  buttonSecondary: {
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    color: '#374151',
    display: 'inline-block',
    fontSize: '16px',
    fontWeight: '600',
    padding: '12px 24px',
    textDecoration: 'none',
    textAlign: 'center' as const,
  },
  statBox: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '16px',
    textAlign: 'center' as const,
    margin: '8px',
  },
  statValue: {
    color: '#1f2937',
    fontSize: '28px',
    fontWeight: '700',
    lineHeight: '36px',
    margin: '0',
  },
  statLabel: {
    color: '#6b7280',
    fontSize: '14px',
    lineHeight: '20px',
    margin: '4px 0 0',
  },
  divider: {
    borderTop: '1px solid #e5e7eb',
    margin: '24px 0',
  },
  highlight: {
    backgroundColor: '#fef3c7',
    borderRadius: '4px',
    padding: '2px 6px',
    color: '#92400e',
  },
  success: {
    backgroundColor: '#d1fae5',
    borderRadius: '4px',
    padding: '2px 6px',
    color: '#065f46',
  },
};

export default BaseEmailLayout;
