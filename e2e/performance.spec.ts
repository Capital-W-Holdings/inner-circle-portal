import { test, expect } from '@playwright/test';

/**
 * Performance Tests
 * Measures page load times and Core Web Vitals
 */

test.describe('Performance - Page Load Times', () => {
  test('API docs page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/api-docs');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    
    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
    console.log(`API docs page loaded in ${loadTime}ms`);
  });

  test('health endpoint responds quickly', async ({ request }) => {
    const startTime = Date.now();
    
    const response = await request.get('/api/health');
    
    const responseTime = Date.now() - startTime;
    
    // API should respond within 200ms
    expect(responseTime).toBeLessThan(200);
    expect(response.ok()).toBeTruthy();
    console.log(`Health endpoint responded in ${responseTime}ms`);
  });

  test('OpenAPI endpoint responds quickly', async ({ request }) => {
    const startTime = Date.now();
    
    const response = await request.get('/api/openapi');
    
    const responseTime = Date.now() - startTime;
    
    // Should respond within 500ms (larger payload)
    expect(responseTime).toBeLessThan(500);
    expect(response.ok()).toBeTruthy();
    console.log(`OpenAPI endpoint responded in ${responseTime}ms`);
  });
});

test.describe('Performance - Core Web Vitals', () => {
  test('measures LCP for API docs page', async ({ page }) => {
    await page.goto('/api-docs');
    
    // Measure Largest Contentful Paint
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry?.startTime || 0);
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        
        // Fallback after 5 seconds
        setTimeout(() => resolve(0), 5000);
      });
    });
    
    console.log(`LCP: ${lcp}ms`);
    
    // LCP should be under 2.5 seconds for "good" rating
    expect(lcp).toBeLessThan(2500);
  });

  test('measures CLS for API docs page', async ({ page }) => {
    await page.goto('/api-docs');
    
    // Wait for page to stabilize
    await page.waitForTimeout(1000);
    
    // Measure Cumulative Layout Shift
    const cls = await page.evaluate(() => {
      return new Promise((resolve) => {
        let clsScore = 0;
        
        new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            // @ts-ignore - LayoutShift type
            if (!entry.hadRecentInput) {
              // @ts-ignore
              clsScore += entry.value;
            }
          }
        }).observe({ type: 'layout-shift', buffered: true });
        
        setTimeout(() => resolve(clsScore), 3000);
      });
    });
    
    console.log(`CLS: ${cls}`);
    
    // CLS should be under 0.1 for "good" rating
    expect(cls).toBeLessThan(0.1);
  });
});

test.describe('Performance - Resource Loading', () => {
  test('page has reasonable number of requests', async ({ page }) => {
    const requests: string[] = [];
    
    page.on('request', (request) => {
      requests.push(request.url());
    });
    
    await page.goto('/api-docs');
    await page.waitForLoadState('networkidle');
    
    console.log(`Total requests: ${requests.length}`);
    
    // Should make fewer than 50 requests
    expect(requests.length).toBeLessThan(50);
  });

  test('page size is reasonable', async ({ page }) => {
    let totalBytes = 0;
    
    page.on('response', async (response) => {
      const headers = response.headers();
      const contentLength = headers['content-length'];
      if (contentLength) {
        totalBytes += parseInt(contentLength, 10);
      }
    });
    
    await page.goto('/api-docs');
    await page.waitForLoadState('networkidle');
    
    const totalKB = totalBytes / 1024;
    const totalMB = totalKB / 1024;
    
    console.log(`Total page size: ${totalKB.toFixed(2)} KB (${totalMB.toFixed(2)} MB)`);
    
    // Page should be under 5MB total
    expect(totalMB).toBeLessThan(5);
  });
});

test.describe('Performance - API Response Times', () => {
  test('admin stats endpoint responds within limits', async ({ request }) => {
    const startTime = Date.now();
    
    await request.get('/api/admin/stats');
    
    const responseTime = Date.now() - startTime;
    
    // Should respond within 500ms
    expect(responseTime).toBeLessThan(500);
    console.log(`Admin stats endpoint responded in ${responseTime}ms`);
  });

  test('admin partners endpoint responds within limits', async ({ request }) => {
    const startTime = Date.now();
    
    await request.get('/api/admin/partners');
    
    const responseTime = Date.now() - startTime;
    
    // Should respond within 500ms
    expect(responseTime).toBeLessThan(500);
    console.log(`Admin partners endpoint responded in ${responseTime}ms`);
  });
});
