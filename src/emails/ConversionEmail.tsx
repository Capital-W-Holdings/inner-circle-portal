/**
 * Conversion Notification Email
 * Sent when a referral converts to a paying customer
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

interface ConversionEmailProps {
  partnerName: string;
  campaignName?: string;
  commissionAmount: number; // in cents
  totalEarnings: number; // in cents
  totalConversions: number;
  referralDate: Date;
}

// ============================================
// Helpers
// ============================================

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

// ============================================
// Component
// ============================================

export function ConversionEmail({
  partnerName,
  campaignName,
  commissionAmount,
  totalEarnings,
  totalConversions,
  referralDate,
}: ConversionEmailProps): React.ReactElement {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://innercircle.co';
  
  return (
    <BaseEmailLayout 
      preview={`You earned ${formatCurrency(commissionAmount)} from a new conversion!`}
    >
      {/* Celebration Header */}
      <Section style={{ textAlign: 'center' as const, marginBottom: '24px' }}>
        <Text style={{
          fontSize: '48px',
          margin: '0',
        }}>
          🎉
        </Text>
        <Text style={emailStyles.heading}>
          New Conversion!
        </Text>
      </Section>
      
      {/* Commission Earned */}
      <Section style={{
        backgroundColor: '#ecfdf5',
        borderRadius: '12px',
        padding: '24px',
        textAlign: 'center' as const,
        marginBottom: '24px',
      }}>
        <Text style={{
          color: '#065f46',
          fontSize: '14px',
          fontWeight: '600',
          textTransform: 'uppercase' as const,
          letterSpacing: '1px',
          margin: '0 0 8px',
        }}>
          Commission Earned
        </Text>
        <Text style={{
          color: '#065f46',
          fontSize: '36px',
          fontWeight: '700',
          margin: '0',
        }}>
          {formatCurrency(commissionAmount)}
        </Text>
      </Section>
      
      {/* Details */}
      <Text style={emailStyles.paragraph}>
        Hey {partnerName},
      </Text>
      
      <Text style={emailStyles.paragraph}>
        Great news! A referral just converted to a paying customer
        {campaignName && <> through your <strong>{campaignName}</strong> campaign</>}.
      </Text>
      
      <Text style={emailStyles.smallText}>
        Conversion date: {formatDate(referralDate)}
      </Text>
      
      {/* Stats */}
      <Row style={{ marginTop: '24px' }}>
        <Column style={{ width: '50%' }}>
          <Section style={emailStyles.statBox}>
            <Text style={emailStyles.statValue}>{formatCurrency(totalEarnings)}</Text>
            <Text style={emailStyles.statLabel}>Total Earnings</Text>
          </Section>
        </Column>
        <Column style={{ width: '50%' }}>
          <Section style={emailStyles.statBox}>
            <Text style={emailStyles.statValue}>{totalConversions}</Text>
            <Text style={emailStyles.statLabel}>Total Conversions</Text>
          </Section>
        </Column>
      </Row>
      
      {/* CTA */}
      <Section style={{ textAlign: 'center' as const, margin: '32px 0' }}>
        <Button href={`${appUrl}/dashboard`} style={emailStyles.button}>
          View Dashboard
        </Button>
      </Section>
      
      {/* Tips */}
      <Section style={{
        borderTop: '1px solid #e5e7eb',
        paddingTop: '24px',
        marginTop: '24px',
      }}>
        <Text style={emailStyles.subheading}>
          Keep the momentum going
        </Text>
        <Text style={emailStyles.paragraph}>
          Share your referral link on more channels to maximize your earnings:
        </Text>
        <Text style={emailStyles.smallText}>
          • Post on LinkedIn with a personal recommendation<br />
          • Share in relevant Slack or Discord communities<br />
          • Include it in your email signature
        </Text>
      </Section>
    </BaseEmailLayout>
  );
}

// ============================================
// Default Export
// ============================================

export default ConversionEmail;
