# Database Setup Guide

This guide walks you through setting up the database for the Inner Circle Partners Portal.

## Quick Start (Demo Mode)

The portal works out of the box without a database. It uses an in-memory data store with pre-seeded demo data:

- 4 demo partners (Alex, Sarah, Marcus, Jordan)
- 5 campaigns with realistic stats
- Referrals, payouts, milestones, and notifications
- Full leaderboard functionality

Demo mode is perfect for testing and demos. Data persists for the duration of the server session but resets on restart.

## Production Setup (PlanetScale)

For production, we recommend PlanetScale - a serverless MySQL platform that works great with Vercel.

### 1. Create PlanetScale Account

1. Go to [planetscale.com](https://planetscale.com) and sign up
2. Create a new database (e.g., `inner-circle-prod`)
3. Choose your region (closest to your Vercel deployment)

### 2. Get Connection String

1. In PlanetScale dashboard, go to your database
2. Click "Connect" → "Connect with Prisma"
3. Copy the connection string (looks like: `mysql://...`)

### 3. Configure Environment Variables

Add to your `.env.local` or Vercel environment:

```bash
DATABASE_URL="mysql://username:password@host/database?sslaccept=strict"
```

### 4. Run Migrations

Once Prisma binaries are available:

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (development)
npx prisma db push

# Or create migration (production)
npx prisma migrate dev --name init
```

### 5. Seed Initial Data (Optional)

```bash
npx prisma db seed
```

## Schema Overview

The database has 8 main tables:

| Table | Purpose |
|-------|---------|
| `Partner` | User accounts with tier, status, commission rates |
| `Campaign` | Tracking links with source, clicks, conversions |
| `Referral` | Individual referral events and commissions |
| `ClickEvent` | Raw click tracking data (for analytics) |
| `Payout` | Payment history and pending payouts |
| `Milestone` | Achievement tracking for gamification |
| `Notification` | In-app notification queue |
| `Experiment` | A/B test configuration and results |

## Architecture Notes

### Connection Pooling

For serverless environments like Vercel, we use Prisma's connection pooling:

```typescript
// Already configured in src/lib/db.ts
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
```

PlanetScale handles connection pooling automatically.

### Fallback Behavior

The app gracefully handles missing database:

1. **No DATABASE_URL** → Uses in-memory store with demo data
2. **Connection error** → Logs warning, continues with fallback
3. **Health check** → Reports database status in `/api/health`

### Repository Pattern

All database access goes through repositories:

```typescript
import { getPartnerRepository } from '@/lib/repositories';

const repo = getPartnerRepository();
const partner = await repo.findById('partner-123');
```

This allows swapping between in-memory and Prisma implementations.

## Troubleshooting

### "Database not configured" warnings

Expected when DATABASE_URL is not set. The app works fine with in-memory data.

### Connection timeout

Check your PlanetScale connection string and ensure SSL is enabled.

### Prisma generate fails

Network restrictions may block Prisma binary downloads. The app continues to work with in-memory storage.

## Next Steps

1. Set up PlanetScale and add DATABASE_URL
2. Run `npx prisma generate` to create client
3. Run `npx prisma db push` to create tables
4. (Optional) Run seed script to import demo data
