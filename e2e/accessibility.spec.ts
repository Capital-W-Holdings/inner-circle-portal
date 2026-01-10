import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility Tests (WCAG 2.1 AA)
 * Uses axe-core for automated accessibility testing
 */

test.describe('Accessibility - Public Pages', () => {
  test('API docs page has no accessibility violations', async ({ page }) => {
    await page.goto('/api-docs');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('sign-in page has no critical accessibility violations', async ({ page }) => {
    await page.goto('/sign-in');
    
    // Wait for Clerk to load
    await page.waitForLoadState('networkidle');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      // Exclude Clerk's iframe as we don't control it
      .exclude('iframe')
      .analyze();
    
    // Filter out critical violations only
    const criticalViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );
    
    expect(criticalViolations).toEqual([]);
  });
});

test.describe('Keyboard Navigation', () => {
  test('API docs page is keyboard navigable', async ({ page }) => {
    await page.goto('/api-docs');
    
    // Tab through elements
    await page.keyboard.press('Tab');
    
    // Search input should be focusable
    const searchInput = page.getByPlaceholder('Search endpoints...');
    await expect(searchInput).toBeFocused();
    
    // Continue tabbing
    await page.keyboard.press('Tab');
    
    // Category buttons should be focusable
    const categoryButton = page.getByRole('button', { name: /All Endpoints/ });
    await expect(categoryButton).toBeFocused();
  });

  test('endpoint cards are keyboard accessible', async ({ page }) => {
    await page.goto('/api-docs');
    
    // Tab to first endpoint
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('Tab');
    }
    
    // Press Enter to expand
    await page.keyboard.press('Enter');
    
    // Should show expanded content
    await expect(page.getByText('Returns the current health status')).toBeVisible();
  });
});

test.describe('Focus Management', () => {
  test('focus is visible on interactive elements', async ({ page }) => {
    await page.goto('/api-docs');
    
    // Tab to search input
    await page.keyboard.press('Tab');
    
    const searchInput = page.getByPlaceholder('Search endpoints...');
    
    // Check that focus ring is visible
    const hasFocusRing = await searchInput.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return (
        styles.outlineStyle !== 'none' ||
        styles.boxShadow.includes('ring') ||
        el.classList.contains('focus:ring')
      );
    });
    
    // Focus should be visible (either via outline or ring class)
    expect(hasFocusRing).toBeTruthy();
  });
});

test.describe('Color Contrast', () => {
  test('text has sufficient color contrast', async ({ page }) => {
    await page.goto('/api-docs');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['color-contrast'])
      .analyze();
    
    // Log any contrast issues for review
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Color contrast issues:', 
        accessibilityScanResults.violations.map(v => ({
          description: v.description,
          nodes: v.nodes.map(n => n.html),
        }))
      );
    }
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

test.describe('Screen Reader Support', () => {
  test('page has proper heading structure', async ({ page }) => {
    await page.goto('/api-docs');
    
    // Check for h1
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    
    // Check for h2s
    const h2s = page.locator('h2');
    expect(await h2s.count()).toBeGreaterThan(0);
  });

  test('images have alt text', async ({ page }) => {
    await page.goto('/api-docs');
    
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      
      // Image should have alt text or be marked decorative
      expect(alt !== null || role === 'presentation').toBeTruthy();
    }
  });

  test('form inputs have labels', async ({ page }) => {
    await page.goto('/api-docs');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a'])
      .withRules(['label'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

test.describe('Motion and Animation', () => {
  test('respects prefers-reduced-motion', async ({ page }) => {
    // Emulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' as const });
    
    await page.goto('/api-docs');
    
    // Click to expand an endpoint
    const healthEndpoint = page.locator('button').filter({ hasText: '/api/health' });
    await healthEndpoint.click();
    
    // Page should still function (no animation-dependent behavior)
    await expect(page.getByText('Returns the current health status')).toBeVisible();
  });
});
