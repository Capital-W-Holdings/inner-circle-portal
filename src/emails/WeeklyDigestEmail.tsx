/**
 * Weekly Digest Email
 * Sent weekly to partners with their performance summary
 */

import {
  Button,
  Column,
  Hr,
  Row,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import { BaseEmailLayout, emailStyles } from './BaseEmailLayout';

// ============================================
// Types
// ============================================

interface CampaignStats {
  name: string;
  clicks: number;
  conversions: number;
  earnings: number; // in cents
}

interface WeeklyDigestEmailProps {
  partnerName: string;
  weekStartDate: Date;
  weekEndDate: Date;
  // This week's stats
  clicksThisWeek: number;
  conversionsThisWeek: number;
  earningsThisWeek: number; // in cents
  // Comparison to last week
  clicksLastWeek: number;
  conversionsLastWeek: number;
  earningsLastWeek: number; // in cents
  // Totals
  totalEarnings: number; // in cents
  pendingPayout: number; // in cents
  // Top campaigns
  topCampaigns: CampaignStats[];
  // Leaderboard position
  leaderboardPosition?: number;
  leaderboardTotal?: number;
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

function formatDateRange(start: Date, end: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
  };
  const startStr = new Intl.DateTimeFormat('en-US', options).format(start);
  const endStr = new Intl.DateTimeFormat('en-US', { ...options, year: 'numeric' }).format(end);
  return `${startStr} - ${endStr}`;
}

function calculateChange(current: number, previous: number): {
  value: number;
  direction: 'up' | 'down' | 'same';
  percentage: string;
} {
  if (previous === 0) {
    return {
      value: current,
      direction: current > 0 ? 'up' : 'same',
      percentage: current > 0 ? '+100%' : '0%',
    };
  }
  
  const change = ((current - previous) / previous) * 100;
  
  return {
    value: current - previous,
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'same',
    percentage: `${change > 0 ? '+' : ''}${change.toFixed(0)}%`,
  };
}

function getChangeStyle(direction: 'up' | 'down' | 'same'): React.CSSProperties {
  switch (direction) {
    case 'up':
      return { color: '#059669', fontWeight: '600' };
    case 'down':
      return { color: '#dc2626', fontWeight: '600' };
    default:
      return { color: '#6b7280' };
  }
}

// ============================================
// Component
// ============================================

export function WeeklyDigestEmail({
  partnerName,
  weekStartDate,
  weekEndDate,
  clicksThisWeek,
  conversionsThisWeek,
  earningsThisWeek,
  clicksLastWeek,
  conversionsLastWeek,
  earningsLastWeek,
  totalEarnings,
  pendingPayout,
  topCampaigns,
  leaderboardPosition,
  leaderboardTotal,
}: WeeklyDigestEmailProps): React.ReactElement {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://innercircle.co';
  
  const clicksChange = calculateChange(clicksThisWeek, clicksLastWeek);
  const conversionsChange = calculateChange(conversionsThisWeek, conversionsLastWeek);
  const earningsChange = calculateChange(earningsThisWeek, earningsLastWeek);
  
  return (
    <BaseEmailLayout 
      preview={`Your week: ${formatCurrency(earningsThisWeek)} earned, ${conversionsThisWeek} conversions`}
      footerText="You're receiving this weekly digest because you opted in to partner updates."
    >
      {/* Header */}
      <Text style={emailStyles.heading}>
        Weekly Performance Digest
      </Text>
      
      <Text style={emailStyles.smallText}>
        {formatDateRange(weekStartDate, weekEndDate)}
      </Text>
      
      <Text style={emailStyles.paragraph}>
        Hey {partnerName}, here&apos;s your performance summary for the week:
      </Text>
      
      {/* This Week's Stats */}
      <Section style={{
        backgroundColor: '#f9fafb',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
      }}>
        <Row>
          <Column style={{ width: '33%', textAlign: 'center' as const }}>
            <Text style={{ ...emailStyles.statValue, fontSize: '24px' }}>
              {formatCurrency(earningsThisWeek)}
            </Text>
            <Text style={emailStyles.statLabel}>Earned</Text>
            <Text style={{
              ...emailStyles.smallText,
              ...getChangeStyle(earningsChange.direction),
              margin: '4px 0 0',
            }}>
              {earningsChange.percentage}
            </Text>
          </Column>
          
          <Column style={{ width: '33%', textAlign: 'center' as const }}>
            <Text style={{ ...emailStyles.statValue, fontSize: '24px' }}>
              {conversionsThisWeek}
            </Text>
            <Text style={emailStyles.statLabel}>Conversions</Text>
            <Text style={{
              ...emailStyles.smallText,
              ...getChangeStyle(conversionsChange.direction),
              margin: '4px 0 0',
            }}>
              {conversionsChange.percentage}
            </Text>
          </Column>
          
          <Column style={{ width: '33%', textAlign: 'center' as const }}>
            <Text style={{ ...emailStyles.statValue, fontSize: '24px' }}>
              {clicksThisWeek}
            </Text>
            <Text style={emailStyles.statLabel}>Clicks</Text>
            <Text style={{
              ...emailStyles.smallText,
              ...getChangeStyle(clicksChange.direction),
              margin: '4px 0 0',
            }}>
              {clicksChange.percentage}
            </Text>
          </Column>
        </Row>
      </Section>
      
      {/* Total & Pending */}
      <Row>
        <Column style={{ width: '50%', paddingRight: '8px' }}>
          <Section style={{
            ...emailStyles.statBox,
            backgroundColor: '#ecfdf5',
          }}>
            <Text style={{ ...emailStyles.statValue, color: '#065f46', fontSize: '20px' }}>
              {formatCurrency(totalEarnings)}
            </Text>
            <Text style={{ ...emailStyles.statLabel, color: '#065f46' }}>
              Total Earned
            </Text>
          </Section>
        </Column>
        <Column style={{ width: '50%', paddingLeft: '8px' }}>
          <Section style={{
            ...emailStyles.statBox,
            backgroundColor: '#fef3c7',
          }}>
            <Text style={{ ...emailStyles.statValue, color: '#92400e', fontSize: '20px' }}>
              {formatCurrency(pendingPayout)}
            </Text>
            <Text style={{ ...emailStyles.statLabel, color: '#92400e' }}>
              Pending Payout
            </Text>
          </Section>
        </Column>
      </Row>
      
      {/* Top Campaigns */}
      {topCampaigns.length > 0 && (
        <>
          <Hr style={emailStyles.divider} />
          
          <Text style={emailStyles.subheading}>
            Top Performing Campaigns
          </Text>
          
          {topCampaigns.map((campaign, index) => (
            <Section 
              key={campaign.name}
              style={{
                backgroundColor: index === 0 ? '#fef3c7' : '#f9fafb',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '8px',
              }}
            >
              <Row>
                <Column style={{ width: '50%' }}>
                  <Text style={{
                    ...emailStyles.paragraph,
                    margin: '0',
                    fontWeight: index === 0 ? '600' : '400',
                  }}>
                    {index === 0 && '🏆 '}{campaign.name}
                  </Text>
                </Column>
                <Column style={{ width: '50%', textAlign: 'right' as const }}>
                  <Text style={{ ...emailStyles.smallText, margin: '0' }}>
                    {campaign.conversions} conv · {formatCurrency(campaign.earnings)}
                  </Text>
                </Column>
              </Row>
            </Section>
          ))}
        </>
      )}
      
      {/* Leaderboard Position */}
      {leaderboardPosition && leaderboardTotal && (
        <>
          <Hr style={emailStyles.divider} />
          
          <Section style={{
            backgroundColor: '#eef2ff',
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center' as const,
          }}>
            <Text style={{ ...emailStyles.paragraph, margin: '0 0 4px', color: '#4338ca' }}>
              You&apos;re ranked <strong>#{leaderboardPosition}</strong> out of {leaderboardTotal} partners
            </Text>
            <Text style={{ ...emailStyles.smallText, margin: '0', color: '#6366f1' }}>
              {leaderboardPosition <= 10 ? '🌟 Top 10! Keep up the great work!' : 
               leaderboardPosition <= 50 ? '📈 Moving up! You\'re doing great!' :
               '💪 Keep sharing to climb the ranks!'}
            </Text>
          </Section>
        </>
      )}
      
      {/* CTA */}
      <Section style={{ textAlign: 'center' as const, margin: '32px 0 16px' }}>
        <Button href={`${appUrl}/dashboard`} style={emailStyles.button}>
          View Full Dashboard
        </Button>
      </Section>
      
      <Section style={{ textAlign: 'center' as const }}>
        <Button href={`${appUrl}/dashboard/campaigns`} style={emailStyles.buttonSecondary}>
          Manage Campaigns
        </Button>
      </Section>
    </BaseEmailLayout>
  );
}

// ============================================
// Default Export
// ============================================

export default WeeklyDigestEmail;
