import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Public Pages
 * Tests pages that don't require authentication
 */

test.describe('Health Check', () => {
  test('API health endpoint returns healthy status', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('healthy');
    expect(data.data.version).toBe('1.0.0');
  });
});

test.describe('OpenAPI Specification', () => {
  test('OpenAPI endpoint returns valid spec', async ({ request }) => {
    const response = await request.get('/api/openapi');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.openapi).toBe('3.0.3');
    expect(data.info.title).toBe('Inner Circle Partners Portal API');
    expect(data.paths).toBeDefined();
  });
});

test.describe('API Documentation Page', () => {
  test('loads API documentation page', async ({ page }) => {
    await page.goto('/api-docs');
    
    // Check header
    await expect(page.getByText('Inner Circle Partners Portal API')).toBeVisible();
    await expect(page.getByText('Version 1.0.0')).toBeVisible();
  });

  test('has search functionality', async ({ page }) => {
    await page.goto('/api-docs');
    
    const searchInput = page.getByPlaceholder('Search endpoints...');
    await expect(searchInput).toBeVisible();
    
    // Type in search
    await searchInput.fill('health');
    
    // Should show health endpoint
    await expect(page.getByText('/api/health')).toBeVisible();
  });

  test('can filter by category', async ({ page }) => {
    await page.goto('/api-docs');
    
    // Click on Admin category
    await page.getByRole('button', { name: /Admin/ }).click();
    
    // Should show admin endpoints
    await expect(page.getByText('/api/admin/stats')).toBeVisible();
  });

  test('can expand endpoint details', async ({ page }) => {
    await page.goto('/api-docs');
    
    // Find and click on health endpoint
    const healthEndpoint = page.locator('button').filter({ hasText: '/api/health' });
    await healthEndpoint.click();
    
    // Should show description
    await expect(page.getByText('Returns the current health status')).toBeVisible();
  });
});

test.describe('Sign In Page', () => {
  test('shows sign in page', async ({ page }) => {
    await page.goto('/sign-in');
    
    // Should show sign in form (Clerk handles the actual form)
    await expect(page).toHaveURL(/sign-in/);
  });
});

test.describe('Sign Up Page', () => {
  test('shows sign up page', async ({ page }) => {
    await page.goto('/sign-up');
    
    // Should show sign up form (Clerk handles the actual form)
    await expect(page).toHaveURL(/sign-up/);
  });
});

test.describe('Dashboard Redirect', () => {
  test('redirects unauthenticated users from dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to sign-in
    await expect(page).toHaveURL(/sign-in/);
  });
});

test.describe('Admin Redirect', () => {
  test('redirects unauthenticated users from admin', async ({ page }) => {
    await page.goto('/admin');
    
    // Should redirect to sign-in
    await expect(page).toHaveURL(/sign-in/);
  });
});
