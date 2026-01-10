# Payment System Setup (Stripe Connect)

This guide covers partner payment setup using Stripe Connect for the Inner Circle Partners Portal.

## Quick Start (Demo Mode)

The payment system works without configuration in demo mode:
- All Stripe operations return mock data
- Payouts are simulated with realistic statuses
- No actual money transfers occur

This is perfect for development and demos.

## Production Setup (Stripe Connect)

### 1. Create Stripe Account

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com) and sign up
2. Complete identity verification
3. Enable Connect (Settings → Connect)
4. Get your API keys

### 2. Configure Environment Variables

```bash
# .env.local
STRIPE_SECRET_KEY="sk_test_xxx"  # or sk_live_xxx for production
STRIPE_WEBHOOK_SECRET="whsec_xxx"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_xxx"  # or pk_live_xxx
```

### 3. Set Up Webhook Endpoint

In Stripe Dashboard → Developers → Webhooks:

1. Add endpoint: `https://yourdomain.com/api/payments/webhook`
2. Select events:
   - `payout.paid`
   - `payout.failed`
   - `payout.canceled`
   - `transfer.created`
   - `transfer.reversed`
   - `account.updated`
   - `account.application.deauthorized`
   - `balance.available`

3. Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

## Architecture Overview

```
Partner Dashboard
       │
       ▼
┌─────────────────────────────────────────────┐
│                 API Layer                    │
│  /api/payments/connect    - Onboarding      │
│  /api/payments/payout     - Request payout  │
│  /api/payments/dashboard  - Express link    │
│  /api/payments/webhook    - Stripe events   │
└─────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│              Payment Service                 │
│  - Connect account management               │
│  - Fee calculation                          │
│  - Payout processing                        │
│  - Email notifications                      │
└─────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│                Stripe API                    │
│  - Express Connect accounts                 │
│  - Transfers & Payouts                      │
│  - Balance management                       │
└─────────────────────────────────────────────┘
```

## API Endpoints

### POST /api/payments/connect

Start Stripe Connect onboarding for a partner.

**Request:**
```json
{
  "partnerId": "partner-demo-123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "onboardingUrl": "https://connect.stripe.com/express/..."
  }
}
```

### GET /api/payments/connect

Get partner payment status.

**Query Parameters:**
- `partnerId` (required) - Partner ID
- `stripeAccountId` (optional) - Stripe account ID
- `status=true` - Get service status only

**Response:**
```json
{
  "success": true,
  "data": {
    "hasStripeAccount": true,
    "stripeAccountId": "acct_xxx",
    "onboardingComplete": true,
    "payoutsEnabled": true,
    "availableBalance": 50000,
    "pendingBalance": 10000,
    "canRequestPayout": true,
    "minPayoutAmount": 1000
  }
}
```

### POST /api/payments/payout

Request a payout for earned commissions.

**Request:**
```json
{
  "partnerId": "partner-demo-123",
  "amountCents": 10000,
  "method": "stripe"  // or "manual"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "payout": {
      "id": "payout-xxx",
      "amountCents": 10000,
      "feeCents": 125,
      "netCents": 9875,
      "status": "PROCESSING",
      "estimatedArrival": "2024-01-15T00:00:00Z"
    }
  }
}
```

### GET /api/payments/payout

Get partner payout statistics.

**Query Parameters:**
- `partnerId` (required)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalPaid": 50000,
    "totalPending": 10000,
    "totalProcessing": 5000,
    "payoutCount": 5,
    "lastPayoutDate": "2024-01-10T00:00:00Z"
  }
}
```

### GET /api/payments/dashboard

Get Stripe Express dashboard link.

**Query Parameters:**
- `accountId` (required) - Stripe account ID

**Response:**
```json
{
  "success": true,
  "data": {
    "dashboardUrl": "https://connect.stripe.com/express/..."
  }
}
```

### POST /api/payments/webhook

Handles Stripe webhook events (internal use).

## Fee Structure

| Fee Type | Amount | Description |
|----------|--------|-------------|
| Platform Fee | 1% | Inner Circle platform fee |
| Stripe Fee | $0.25 | Per-payout processing fee |

**Example:**
- Payout request: $100.00
- Platform fee: $1.00 (1%)
- Stripe fee: $0.25
- Net to partner: $98.75

## Payout Flow

1. **Partner Requests Payout**
   - Validates minimum amount ($10)
   - Calculates fees
   - Creates payout record (PENDING)

2. **Processing**
   - Transfer to Connect account (if using Stripe)
   - Status updated to PROCESSING
   - Partner notified via email

3. **Completion**
   - Webhook received from Stripe
   - Status updated to COMPLETED
   - Partner notified via email

4. **Failure Handling**
   - Webhook received from Stripe
   - Status updated to FAILED
   - Partner notified with reason
   - Funds returned to balance

## Partner Onboarding Flow

```
1. Partner clicks "Set Up Payments"
         │
         ▼
2. POST /api/payments/connect
   - Creates Express account
   - Returns onboarding URL
         │
         ▼
3. Partner redirected to Stripe
   - Enters business info
   - Adds bank account
   - Verifies identity
         │
         ▼
4. Stripe redirects back
   - account.updated webhook
   - Update partner status
         │
         ▼
5. Partner can now request payouts
```

## Service Functions

### Payment Service (`src/lib/payment-service.ts`)

```typescript
// Setup onboarding
await setupPartnerPayments(partnerId);

// Get payment status
await getPartnerPaymentStatus(partnerId, stripeAccountId);

// Request payout
await requestPayout({
  partnerId: 'partner-123',
  amountCents: 10000,
  method: 'stripe',
});

// Calculate fees
const fees = calculatePayoutFees(10000);
// { grossAmount: 10000, platformFee: 100, stripeFee: 25, netAmount: 9875 }

// Get payout stats
await getPartnerPayoutStats(partnerId);

// Complete payout (from webhook)
await completePayout(payoutId, stripeTransactionId);

// Fail payout (from webhook)
await failPayout(payoutId, 'Insufficient funds');
```

### Stripe Client (`src/lib/stripe.ts`)

```typescript
// Create Connect account
await createConnectAccount(email, country, metadata);

// Create onboarding link
await createAccountLink(accountId, refreshUrl, returnUrl);

// Create login link to Express dashboard
await createLoginLink(accountId);

// Get account details
await getConnectAccount(accountId);

// Create transfer to Connect account
await createTransfer(accountId, amountCents);

// Create payout from Connect account
await createPayout(accountId, amountCents);

// Get balances
await getPlatformBalance();
await getAccountBalance(accountId);
```

## Testing

### Unit Tests
```bash
npm test -- src/__tests__/payments.test.ts
```

### Manual Testing (Demo Mode)

1. Start dev server: `npm run dev`
2. Call endpoints with demo partner IDs
3. All operations return mock data

### Testing with Stripe Test Mode

1. Use `sk_test_xxx` keys
2. Use Stripe test bank accounts
3. Simulate webhook events:
   ```bash
   stripe trigger payout.paid
   stripe trigger payout.failed
   ```

## Security Considerations

1. **Webhook Signature Verification**
   - All webhooks verified before processing
   - Invalid signatures rejected

2. **Authentication Required**
   - All payout endpoints require authentication
   - Partners can only access own data

3. **Minimum Payout Amount**
   - Prevents micro-transaction abuse
   - Currently set to $10

4. **Sensitive Data Handling**
   - API keys stored in environment variables
   - Bank details never stored (handled by Stripe)

## Troubleshooting

### Onboarding Link Expired
- Links expire after 24 hours
- Generate new link via POST /api/payments/connect

### Payout Stuck in Processing
- Check webhook endpoint is configured
- Verify webhook signature secret
- Check Stripe dashboard for events

### Account Restricted
- Partner may need to complete additional verification
- Check Stripe dashboard for requirements

## Files Reference

| File | Purpose |
|------|---------|
| `src/lib/stripe.ts` | Stripe API client wrapper |
| `src/lib/payment-service.ts` | Business logic for payments |
| `src/app/api/payments/connect/route.ts` | Connect onboarding endpoint |
| `src/app/api/payments/payout/route.ts` | Payout request endpoint |
| `src/app/api/payments/dashboard/route.ts` | Express dashboard link |
| `src/app/api/payments/webhook/route.ts` | Webhook handler |
