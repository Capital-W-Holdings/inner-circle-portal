# Email System Setup

This guide covers transactional email setup using Resend for the Inner Circle Partners Portal.

## Quick Start (Demo Mode)

The email system works without configuration in demo mode:
- All emails are logged to console
- Mock IDs are returned for testing
- No emails are actually sent

This is perfect for development and demos.

## Production Setup (Resend)

### 1. Create Resend Account

1. Go to [resend.com](https://resend.com) and sign up
2. Verify your domain (required for production)
3. Get your API key

### 2. Configure Environment Variables

```bash
# .env.local
RESEND_API_KEY="re_xxx"
EMAIL_FROM="Inner Circle <notifications@yourdomain.com>"
EMAIL_REPLY_TO="support@yourdomain.com"
```

### 3. Domain Verification

For production, verify your sending domain in Resend:
1. Add DNS records (SPF, DKIM, DMARC)
2. Wait for verification (usually <5 minutes)
3. Test with a real email address

## Email Templates

The portal includes 4 professionally designed email templates:

### Welcome Email
Sent when a partner signs up.

**Includes:**
- Personalized greeting
- Partner tier and commission rate
- Referral code display
- Quick start guide

**Trigger:**
```typescript
import { sendWelcomeEmail } from '@/lib/email-service';

await sendWelcomeEmail({
  partner: {
    email: 'partner@example.com',
    name: 'John Doe',
    referralCode: 'JOHN2024',
    tier: 'GOLD',
  },
});
```

### Conversion Notification
Sent when a referral converts to a paying customer.

**Includes:**
- Commission earned (prominent display)
- Campaign attribution (if available)
- Running totals
- Tips for more conversions

**Trigger:**
```typescript
import { sendConversionEmail } from '@/lib/email-service';

await sendConversionEmail({
  partner: { email: 'partner@example.com', name: 'John Doe' },
  campaignName: 'LinkedIn Q1',
  commissionAmount: 5000, // cents
  totalEarnings: 50000,
  totalConversions: 10,
});
```

### Payout Notification
Sent when a payout is processing, completed, or failed.

**Includes:**
- Status indicator (processing/completed/failed)
- Amount breakdown (gross, fees, net)
- Transaction ID (when completed)
- Troubleshooting (when failed)

**Trigger:**
```typescript
import { sendPayoutEmail } from '@/lib/email-service';

await sendPayoutEmail({
  partner: { email: 'partner@example.com', name: 'John Doe' },
  payoutAmount: 10000,
  payoutFee: 100,
  netAmount: 9900,
  status: 'completed', // 'processing' | 'completed' | 'failed'
  payoutMethod: 'bank_transfer',
  transactionId: 'txn_123',
});
```

### Weekly Digest
Sent weekly with performance summary.

**Includes:**
- Week-over-week comparisons
- Earnings, conversions, clicks
- Top performing campaigns
- Leaderboard position
- Total and pending payout amounts

**Trigger:**
```typescript
import { sendWeeklyDigest } from '@/lib/email-service';

await sendWeeklyDigest({
  partner: { email: 'partner@example.com', name: 'John Doe' },
  weekStartDate: new Date('2024-01-01'),
  weekEndDate: new Date('2024-01-07'),
  clicksThisWeek: 100,
  conversionsThisWeek: 5,
  earningsThisWeek: 25000,
  clicksLastWeek: 80,
  conversionsLastWeek: 4,
  earningsLastWeek: 20000,
  totalEarnings: 100000,
  pendingPayout: 25000,
  topCampaigns: [
    { name: 'LinkedIn', clicks: 50, conversions: 3, earnings: 15000 },
  ],
  leaderboardPosition: 5,
  leaderboardTotal: 100,
});
```

## API Endpoint

### POST /api/email/send

Send emails programmatically.

**Request:**
```json
{
  "type": "welcome",
  "partnerId": "partner-demo-123"
}
```

**Email Types:**
- `welcome` - Welcome email
- `conversion` - Requires additional fields
- `payout` - Requires additional fields
- `digest` - Requires additional fields
- `test` - Sends a test welcome email

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "emailId": "abc123"
  }
}
```

### GET /api/email/send

Check email service status.

**Response:**
```json
{
  "success": true,
  "data": {
    "configured": true,
    "provider": "Resend"
  }
}
```

## Bulk Sending

For weekly digests, use the bulk sending function:

```typescript
import { sendBulkWeeklyDigests } from '@/lib/email-service';

const result = await sendBulkWeeklyDigests(recipients);
// result: { success: boolean, sent: number, failed: number, errors: [] }
```

Resend supports up to 100 emails per batch. The function automatically handles batching.

## Email Templates Location

Templates are React components using React Email:

```
src/emails/
├── BaseEmailLayout.tsx   # Shared layout and styles
├── WelcomeEmail.tsx      # Welcome template
├── ConversionEmail.tsx   # Conversion notification
├── PayoutEmail.tsx       # Payout notification
└── WeeklyDigestEmail.tsx # Weekly digest
```

## Customizing Templates

Templates use React Email components:

```tsx
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Button,
  Link,
  Img,
} from '@react-email/components';
```

All templates share styles from `BaseEmailLayout.tsx`:
- `emailStyles.heading`
- `emailStyles.paragraph`
- `emailStyles.button`
- `emailStyles.statBox`
- etc.

## Testing Emails

### 1. Console Preview (Dev Mode)

Emails are logged to console when Resend isn't configured:
```
[INFO] [Email] Simulated send { to: 'partner@example.com', subject: 'Welcome...' }
```

### 2. React Email Preview

Start the React Email dev server:
```bash
npx react-email dev
```

### 3. API Testing

Use the test endpoint:
```bash
curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{"type":"test","partnerId":"partner-demo-123"}'
```

## Webhook Integration

When implementing in production, trigger emails from webhooks:

**Stripe Webhooks:**
```typescript
// On checkout.session.completed
if (session.metadata.referralCode) {
  await sendConversionEmail({...});
}

// On payout.paid
await sendPayoutEmail({ status: 'completed', ... });
```

**Clerk Webhooks:**
```typescript
// On user.created
await sendWelcomeEmail({...});
```

## Email Health Check

The `/api/health` endpoint includes email status:

```json
{
  "checks": {
    "email": {
      "status": "pass",
      "message": null
    }
  }
}
```

## Files Reference

| File | Purpose |
|------|---------|
| `src/lib/email.ts` | Resend client wrapper |
| `src/lib/email-service.ts` | High-level email functions |
| `src/emails/*.tsx` | Email templates |
| `src/app/api/email/send/route.ts` | Email API endpoint |
