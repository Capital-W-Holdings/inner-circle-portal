/**
 * Payout Notification Email
 * Sent when a payout is processed or completed
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

type PayoutStatus = 'processing' | 'completed' | 'failed';

interface PayoutEmailProps {
  partnerName: string;
  payoutAmount: number; // in cents
  payoutFee: number; // in cents
  netAmount: number; // in cents
  status: PayoutStatus;
  payoutMethod: string;
  transactionId?: string;
  estimatedArrival?: Date;
  failureReason?: string;
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

function getStatusConfig(status: PayoutStatus): {
  emoji: string;
  title: string;
  bgColor: string;
  textColor: string;
} {
  switch (status) {
    case 'processing':
      return {
        emoji: '⏳',
        title: 'Payout Processing',
        bgColor: '#fef3c7',
        textColor: '#92400e',
      };
    case 'completed':
      return {
        emoji: '✅',
        title: 'Payout Complete!',
        bgColor: '#d1fae5',
        textColor: '#065f46',
      };
    case 'failed':
      return {
        emoji: '❌',
        title: 'Payout Failed',
        bgColor: '#fee2e2',
        textColor: '#991b1b',
      };
  }
}

// ============================================
// Component
// ============================================

export function PayoutEmail({
  partnerName,
  payoutAmount,
  payoutFee,
  netAmount,
  status,
  payoutMethod,
  transactionId,
  estimatedArrival,
  failureReason,
}: PayoutEmailProps): React.ReactElement {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://innercircle.co';
  const statusConfig = getStatusConfig(status);
  
  return (
    <BaseEmailLayout 
      preview={`${statusConfig.title} - ${formatCurrency(netAmount)}`}
    >
      {/* Status Header */}
      <Section style={{ textAlign: 'center' as const, marginBottom: '24px' }}>
        <Text style={{
          fontSize: '48px',
          margin: '0',
        }}>
          {statusConfig.emoji}
        </Text>
        <Text style={emailStyles.heading}>
          {statusConfig.title}
        </Text>
      </Section>
      
      {/* Amount Box */}
      <Section style={{
        backgroundColor: statusConfig.bgColor,
        borderRadius: '12px',
        padding: '24px',
        textAlign: 'center' as const,
        marginBottom: '24px',
      }}>
        <Text style={{
          color: statusConfig.textColor,
          fontSize: '14px',
          fontWeight: '600',
          textTransform: 'uppercase' as const,
          letterSpacing: '1px',
          margin: '0 0 8px',
        }}>
          {status === 'completed' ? 'Amount Sent' : status === 'processing' ? 'Amount Being Processed' : 'Amount'}
        </Text>
        <Text style={{
          color: statusConfig.textColor,
          fontSize: '36px',
          fontWeight: '700',
          margin: '0',
        }}>
          {formatCurrency(netAmount)}
        </Text>
      </Section>
      
      {/* Greeting */}
      <Text style={emailStyles.paragraph}>
        Hey {partnerName},
      </Text>
      
      {/* Status-specific message */}
      {status === 'processing' && (
        <Text style={emailStyles.paragraph}>
          Your payout is being processed. The funds will be sent to your {payoutMethod} 
          {estimatedArrival && <> and should arrive by <strong>{formatDate(estimatedArrival)}</strong></>}.
        </Text>
      )}
      
      {status === 'completed' && (
        <Text style={emailStyles.paragraph}>
          Great news! Your payout has been completed and sent to your {payoutMethod}. 
          The funds should appear in your account within 1-3 business days.
        </Text>
      )}
      
      {status === 'failed' && (
        <>
          <Text style={emailStyles.paragraph}>
            Unfortunately, we weren&apos;t able to process your payout. 
            {failureReason && <> The reason was: <strong>{failureReason}</strong></>}
          </Text>
          <Text style={emailStyles.paragraph}>
            Please check your payment settings and try again. If you need assistance, 
            reply to this email and we&apos;ll help resolve the issue.
          </Text>
        </>
      )}
      
      {/* Breakdown */}
      <Text style={emailStyles.subheading}>
        Payout Details
      </Text>
      
      <Section style={{
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        padding: '16px',
      }}>
        <Row>
          <Column>
            <Text style={{ ...emailStyles.smallText, margin: '4px 0' }}>
              Gross Amount
            </Text>
          </Column>
          <Column style={{ textAlign: 'right' as const }}>
            <Text style={{ ...emailStyles.smallText, margin: '4px 0' }}>
              {formatCurrency(payoutAmount)}
            </Text>
          </Column>
        </Row>
        
        <Row>
          <Column>
            <Text style={{ ...emailStyles.smallText, margin: '4px 0' }}>
              Processing Fee
            </Text>
          </Column>
          <Column style={{ textAlign: 'right' as const }}>
            <Text style={{ ...emailStyles.smallText, margin: '4px 0' }}>
              -{formatCurrency(payoutFee)}
            </Text>
          </Column>
        </Row>
        
        <Row style={{ borderTop: '1px solid #e5e7eb', marginTop: '8px', paddingTop: '8px' }}>
          <Column>
            <Text style={{ ...emailStyles.paragraph, margin: '4px 0', fontWeight: '600' }}>
              Net Amount
            </Text>
          </Column>
          <Column style={{ textAlign: 'right' as const }}>
            <Text style={{ ...emailStyles.paragraph, margin: '4px 0', fontWeight: '600' }}>
              {formatCurrency(netAmount)}
            </Text>
          </Column>
        </Row>
        
        {transactionId && (
          <Row style={{ marginTop: '12px' }}>
            <Column>
              <Text style={{ ...emailStyles.smallText, margin: '0', color: '#9ca3af' }}>
                Transaction ID: {transactionId}
              </Text>
            </Column>
          </Row>
        )}
      </Section>
      
      {/* CTA */}
      <Section style={{ textAlign: 'center' as const, margin: '32px 0' }}>
        <Button href={`${appUrl}/dashboard/payouts`} style={emailStyles.button}>
          View Payout History
        </Button>
      </Section>
      
      {/* Help Section */}
      {status === 'failed' && (
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
            <strong>Need help?</strong> Common issues include expired payment methods 
            or incorrect bank details. Update your settings in the dashboard or 
            contact our support team.
          </Text>
        </Section>
      )}
    </BaseEmailLayout>
  );
}

// ============================================
// Default Export
// ============================================

export default PayoutEmail;
