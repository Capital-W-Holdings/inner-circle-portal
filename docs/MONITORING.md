# Monitoring & Analytics Setup

This guide covers error monitoring (Sentry) and product analytics (PostHog) for the Inner Circle Partners Portal.

## Quick Start (No Configuration Required)

The monitoring system works gracefully without any configuration:
- Errors are logged to the console
- Analytics events are logged locally
- No external services are called

## Sentry Setup (Error Monitoring)

### 1. Create Sentry Account

1. Go to [sentry.io](https://sentry.io) and sign up
2. Create a new project (Platform: Next.js)
3. Copy your DSN

### 2. Configure Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"
SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"

# Optional: For source maps upload
SENTRY_AUTH_TOKEN="sntrys_xxx"
```

### 3. What Gets Tracked

**Automatic Capture:**
- Unhandled JavaScript errors
- React error boundaries
- API route errors
- Performance metrics (page loads, API calls)

**Filtered Out:**
- Browser extension errors
- Network failures (user's connection issues)
- ResizeObserver warnings
- Expected auth errors (401, 403)

**Sanitized:**
- Email addresses are redacted
- Tokens are removed from URLs
- Sensitive headers (Authorization, Cookie) are stripped

### 4. Using the Monitoring API

```typescript
import { reportError, logger, trackMetric } from '@/lib/monitoring';

// Log with structured context
logger.info('Partner signed up', { partnerId: 'partner-123', tier: 'GOLD' });
logger.warn('High traffic detected', { clicksPerMinute: 1000 });

// Report errors with context
try {
  await processPayment(amount);
} catch (error) {
  reportError(error, {
    user: { id: 'user-123', partnerId: 'partner-456' },
    tags: { flow: 'payout' },
    extra: { amount, method: 'bank_transfer' },
  });
}

// Track custom metrics
trackMetric('payout.processing_time', 1234, 'millisecond');
```

## PostHog Setup (Product Analytics)

### 1. Create PostHog Account

1. Go to [posthog.com](https://posthog.com) and sign up
2. Create a new project
3. Copy your API key

### 2. Configure Environment Variables

```bash
# .env.local
NEXT_PUBLIC_POSTHOG_KEY="phc_xxx"
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"  # or your self-hosted instance
```

### 3. What Gets Tracked

**Automatic:**
- Page views
- Page leaves
- Clicks on buttons, links, forms
- Session duration

**Custom Events:**
```typescript
import { trackEvent, PartnerAnalytics } from '@/components/providers/PostHogProvider';

// Track custom event
trackEvent('custom_event', { property: 'value' });

// Use pre-built partner events
PartnerAnalytics.linkShared('partner-123', 'linkedin', 'campaign-456');
PartnerAnalytics.campaignCreated('partner-123', 'EMAIL');
PartnerAnalytics.payoutRequested('partner-123', 50000);
PartnerAnalytics.milestoneAchieved('partner-123', 'FIRST_CONVERSION');
```

### 4. User Identification

```typescript
import { identifyUser, resetUser } from '@/components/providers/PostHogProvider';

// On login
identifyUser('user-123', {
  email: 'partner@example.com',
  tier: 'GOLD',
  partnerId: 'partner-456',
});

// On logout
resetUser();
```

### 5. Feature Flags

```typescript
import { isFeatureEnabled, getFeatureFlag } from '@/components/providers/PostHogProvider';

// Boolean flag
if (isFeatureEnabled('new_dashboard')) {
  // Show new dashboard
}

// Flag with value
const maxCampaigns = getFeatureFlag('max_campaigns', 5);
```

## Error Boundary

The app includes an error boundary that:
- Catches React errors
- Reports them to Sentry
- Shows a user-friendly error UI
- Provides "Try Again" and "Report Feedback" options

```tsx
import { ErrorBoundary, withErrorBoundary } from '@/components/providers/ErrorBoundary';

// Wrap a section
<ErrorBoundary fallback={<CustomFallback />}>
  <RiskyComponent />
</ErrorBoundary>

// Or use HOC
const SafeComponent = withErrorBoundary(RiskyComponent);
```

## Error Pages

**`app/error.tsx`** - Handles page-level errors
- Shows error UI with retry option
- Reports to Sentry with component stack
- Shows error details in development

**`app/global-error.tsx`** - Handles root layout errors
- Minimal inline styles (no external dependencies)
- Critical error recovery

## Privacy Considerations

Both Sentry and PostHog are configured to:
- Respect Do Not Track (DNT) headers
- Redact email addresses from logs
- Strip sensitive headers
- Not capture passwords or tokens

## Troubleshooting

### No Events in Sentry/PostHog

1. Check environment variables are set
2. Verify DSN/API key is correct
3. Check browser console for errors
4. Ensure ad blockers aren't blocking requests

### Too Many Events

1. Adjust sample rates in config files
2. Add more ignore patterns
3. Consider upgrading your plan

### Performance Impact

Both SDKs are lightweight:
- Sentry: ~20KB gzipped
- PostHog: ~10KB gzipped

They load asynchronously and won't block page render.

## Files Reference

| File | Purpose |
|------|---------|
| `sentry.client.config.ts` | Browser-side Sentry config |
| `sentry.server.config.ts` | Server-side Sentry config |
| `sentry.edge.config.ts` | Edge runtime Sentry config |
| `src/lib/monitoring.ts` | Logging and error reporting utilities |
| `src/components/providers/PostHogProvider.tsx` | Analytics provider and hooks |
| `src/components/providers/ErrorBoundary.tsx` | Error boundary component |
| `src/app/error.tsx` | Page error UI |
| `src/app/global-error.tsx` | Global error UI |
