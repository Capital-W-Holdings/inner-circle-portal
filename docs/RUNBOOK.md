# Inner Circle Partners Portal - Operations Runbook

## Quick Reference

| Service | Status Page | Dashboard |
|---------|-------------|-----------|
| Vercel | status.vercel.com | vercel.com/dashboard |
| PlanetScale | status.planetscale.com | app.planetscale.com |
| Upstash | status.upstash.com | console.upstash.com |
| Stripe | status.stripe.com | dashboard.stripe.com |
| Resend | resend.com/status | resend.com/emails |

---

## Health Check Endpoints

```bash
# Liveness probe (for load balancers)
curl -I https://your-domain.com/api/health

# Full health status
curl https://your-domain.com/api/health | jq
```

Expected healthy response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-10T12:00:00.000Z",
  "version": "1.0.0",
  "environment": "production",
  "uptime": 86400,
  "checks": {
    "database": { "status": "pass", "latency": 15 },
    "redis": { "status": "pass", "latency": 5 },
    "auth": { "status": "pass" },
    "email": { "status": "pass" }
  }
}
```

---

## Incident Response

### Severity Levels

| Level | Description | Response Time | Escalation |
|-------|-------------|---------------|------------|
| P0 | Complete outage | 15 min | Immediate |
| P1 | Major feature broken | 1 hour | Engineering lead |
| P2 | Minor feature broken | 4 hours | On-call |
| P3 | Non-urgent issue | Next business day | Backlog |

### Common Incidents

#### 1. Database Connection Errors

**Symptoms:**
- Health check shows `database: fail`
- API returns 500 errors
- Logs show "Connection refused" or "Too many connections"

**Diagnosis:**
```bash
# Check PlanetScale status
curl -s https://status.planetscale.com/api/v2/status.json | jq .status

# Check connection pool in Vercel logs
vercel logs --filter "prisma"
```

**Resolution:**
1. Check PlanetScale dashboard for connection limit
2. If at limit, scale up connection pool
3. If PlanetScale incident, enable circuit breaker mode

**Circuit Breaker (Emergency):**
```typescript
// Set in Vercel environment
ENABLE_MOCK_DATA=true
```

#### 2. Rate Limit Exhaustion

**Symptoms:**
- Users getting 429 Too Many Requests
- Health check shows normal
- Redis memory high

**Diagnosis:**
```bash
# Check Upstash stats
curl -H "Authorization: Bearer $UPSTASH_TOKEN" \
  "https://api.upstash.com/v2/redis/database/$DB_ID"
```

**Resolution:**
1. Check for abuse patterns in logs
2. If legitimate traffic spike:
   - Increase rate limits temporarily
   - Scale Upstash plan if needed
3. If attack, enable IP blocking

#### 3. Authentication Failures

**Symptoms:**
- Users can't log in
- 401 errors in API calls
- Auth provider showing errors

**Diagnosis:**
```bash
# Test auth endpoint
curl -I https://your-domain.com/api/auth/session

# Check Clerk/Auth0 status
```

**Resolution:**
1. Check auth provider status page
2. Verify API keys haven't rotated
3. If provider down, enable maintenance mode

#### 4. Payment Webhook Failures

**Symptoms:**
- Payouts not processing
- Stripe dashboard shows failed webhooks
- `payout.completed` events backing up

**Diagnosis:**
```bash
# Check Stripe webhook logs
stripe webhooks list --limit 10

# Verify webhook secret
echo $STRIPE_WEBHOOK_SECRET | head -c 10
```

**Resolution:**
1. Check webhook endpoint is responding
2. Verify webhook secret matches
3. Replay failed events:
   ```bash
   stripe events resend evt_xxx
   ```

---

## Deployment Procedures

### Standard Deployment

```bash
# 1. Create PR with changes
git checkout -b feature/xxx
git push origin feature/xxx

# 2. Wait for CI checks to pass
# - TypeScript compilation
# - Unit tests (207 tests)
# - Build verification

# 3. Merge to main
# - Vercel automatically deploys preview
# - Review preview deployment

# 4. Production deployment
# - Merge PR triggers production deploy
# - Monitor health endpoint
```

### Emergency Rollback

```bash
# Via Vercel CLI
vercel rollback

# Or via dashboard
# 1. Go to vercel.com/dashboard
# 2. Select project
# 3. Click "Deployments"
# 4. Click "..." on previous deployment
# 5. Select "Promote to Production"
```

### Database Migrations

```bash
# 1. Create migration
npx prisma migrate dev --name add_xxx

# 2. Test locally
npm run dev

# 3. Deploy migration (staging)
npx prisma migrate deploy

# 4. Verify staging
curl https://staging.your-domain.com/api/health

# 5. Deploy to production
# PlanetScale: Create deploy request in dashboard
```

---

## Monitoring & Alerts

### Key Metrics to Watch

| Metric | Normal | Warning | Critical |
|--------|--------|---------|----------|
| Error rate | <0.1% | 0.1-1% | >1% |
| p95 latency | <200ms | 200-500ms | >500ms |
| DB connections | <50% | 50-80% | >80% |
| Memory usage | <70% | 70-85% | >85% |
| Rate limit hits | <5% | 5-15% | >15% |

### Alert Channels

Configure in your monitoring service:

```yaml
# Sentry alert rules
- name: High Error Rate
  conditions:
    - event.count > 100 in 5 minutes
  actions:
    - notify: #alerts-critical (Slack)
    - page: on-call (PagerDuty)

- name: Slow Responses
  conditions:
    - p95.latency > 500ms for 5 minutes
  actions:
    - notify: #alerts-warning (Slack)
```

---

## Maintenance Procedures

### Scheduled Maintenance

1. **24 hours before:**
   - Announce in app: "Scheduled maintenance on [date]"
   - Email partners with high activity

2. **1 hour before:**
   - Enable maintenance mode
   - Stop processing payouts

3. **During maintenance:**
   - Display maintenance page
   - Perform required updates
   - Run health checks

4. **After maintenance:**
   - Disable maintenance mode
   - Verify all services
   - Monitor for 30 minutes

### Enable Maintenance Mode

```bash
# Set in Vercel environment
vercel env add MAINTENANCE_MODE production
# Value: true

# Redeploy
vercel --prod
```

---

## Scaling Procedures

### Vertical Scaling

| Component | Current | Scale Up To |
|-----------|---------|-------------|
| Vercel | Pro | Enterprise |
| PlanetScale | Scaler | Scaler Pro |
| Upstash | Pay-as-you-go | Pro |

### Horizontal Scaling

For high traffic events:

1. **Pre-event (1 week):**
   - Increase PlanetScale read replicas
   - Warm up CDN cache
   - Review rate limits

2. **During event:**
   - Monitor real-time dashboards
   - Have rollback ready
   - Scale on demand

3. **Post-event:**
   - Review metrics
   - Scale back resources
   - Document learnings

---

## Contact Information

| Role | Contact | Escalation |
|------|---------|------------|
| On-Call Engineer | PagerDuty | 15 min |
| Engineering Lead | Slack @eng-lead | 1 hour |
| CTO | Phone (emergency) | Critical only |

### Vendor Support

| Vendor | Support | SLA |
|--------|---------|-----|
| Vercel | vercel.com/support | Enterprise: 1 hour |
| PlanetScale | support@planetscale.com | Scaler: 4 hours |
| Stripe | support.stripe.com | 24 hours |

---

## Appendix: Useful Commands

```bash
# Check deployment status
vercel ls

# View recent logs
vercel logs --since 1h

# Check environment variables
vercel env ls production

# Run database query (read-only)
npx prisma studio

# Test webhook locally
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Check rate limiter status
redis-cli -u $UPSTASH_REDIS_REST_URL KEYS "ratelimit:*"
```
