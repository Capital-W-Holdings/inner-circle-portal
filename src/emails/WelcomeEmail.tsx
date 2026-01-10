/**
 * Welcome Email Template
 * Sent when a new partner signs up
 */

import {
  Button,
  Column,
  Row,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import { BaseEmailLayout, emailStyles } from './BaseEmailLayout';

// ============================================
// Types
// ============================================

interface WelcomeEmailProps {
  partnerName: string;
  referralCode: string;
  referralLink: string;
  tier: string;
  commissionRate: number;
}

// ============================================
// Component
// ============================================

export function WelcomeEmail({
  partnerName,
  referralCode,
  referralLink,
  tier,
  commissionRate,
}: WelcomeEmailProps): React.ReactElement {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://innercircle.co';
  
  return (
    <BaseEmailLayout preview={`Welcome to Inner Circle, ${partnerName}! Your partner account is ready.`}>
      {/* Greeting */}
      <Text style={emailStyles.heading}>
        Welcome to Inner Circle, {partnerName}! 🎉
      </Text>
      
      <Text style={emailStyles.paragraph}>
        We&apos;re thrilled to have you join our partner program. Your account is now active 
        and you&apos;re ready to start earning commissions by referring new customers.
      </Text>
      
      {/* Account Details */}
      <Text style={emailStyles.subheading}>
        Your Account Details
      </Text>
      
      <Row>
        <Column style={{ width: '50%' }}>
          <Section style={emailStyles.statBox}>
            <Text style={emailStyles.statValue}>{tier}</Text>
            <Text style={emailStyles.statLabel}>Partner Tier</Text>
          </Section>
        </Column>
        <Column style={{ width: '50%' }}>
          <Section style={emailStyles.statBox}>
            <Text style={emailStyles.statValue}>{commissionRate}%</Text>
            <Text style={emailStyles.statLabel}>Commission Rate</Text>
          </Section>
        </Column>
      </Row>
      
      {/* Referral Info */}
      <Text style={emailStyles.subheading}>
        Your Referral Code
      </Text>
      
      <Section style={{
        backgroundColor: '#f3f4f6',
        borderRadius: '8px',
        padding: '16px 24px',
        marginBottom: '16px',
      }}>
        <Text style={{
          fontFamily: 'monospace',
          fontSize: '24px',
          fontWeight: '700',
          color: '#6366f1',
          textAlign: 'center' as const,
          margin: '0',
          letterSpacing: '2px',
        }}>
          {referralCode}
        </Text>
      </Section>
      
      <Text style={emailStyles.paragraph}>
        Share this code with your network. When someone signs up using your code, 
        you&apos;ll earn {commissionRate}% commission on their subscription.
      </Text>
      
      {/* CTA */}
      <Section style={{ textAlign: 'center' as const, margin: '32px 0' }}>
        <Button href={`${appUrl}/dashboard`} style={emailStyles.button}>
          Go to Your Dashboard
        </Button>
      </Section>
      
      {/* Quick Links */}
      <Text style={emailStyles.subheading}>
        Quick Start Guide
      </Text>
      
      <Text style={emailStyles.paragraph}>
        Here&apos;s how to get started:
      </Text>
      
      <Text style={emailStyles.paragraph}>
        <strong>1. Share your referral link</strong><br />
        Copy your unique link: {referralLink}
      </Text>
      
      <Text style={emailStyles.paragraph}>
        <strong>2. Create campaigns</strong><br />
        Track which channels perform best by creating separate campaigns for LinkedIn, 
        Twitter, email newsletters, and more.
      </Text>
      
      <Text style={emailStyles.paragraph}>
        <strong>3. Monitor your earnings</strong><br />
        Watch your conversions and earnings grow in real-time on your dashboard.
      </Text>
      
      {/* Support */}
      <Section style={{
        backgroundColor: '#fef3c7',
        borderRadius: '8px',
        padding: '16px',
        marginTop: '24px',
      }}>
        <Text style={{
          ...emailStyles.smallText,
          color: '#92400e',
          margin: '0',
        }}>
          <strong>Need help?</strong> Reply to this email or visit our{' '}
          <a href={`${appUrl}/help`} style={{ color: '#92400e' }}>Help Center</a>{' '}
          for guides and FAQs.
        </Text>
      </Section>
    </BaseEmailLayout>
  );
}

// ============================================
// Default Export
// ============================================

export default WelcomeEmail;
