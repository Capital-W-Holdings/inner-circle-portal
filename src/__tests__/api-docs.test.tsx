/**
 * API Documentation Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/api-docs',
  useSearchParams: () => new URLSearchParams(),
}));

describe('OpenAPI Specification', () => {
  it('should have valid info section', async () => {
    const { openApiSpec } = await import('../lib/openapi');
    
    expect(openApiSpec.openapi).toBe('3.0.3');
    expect(openApiSpec.info.title).toBe('Inner Circle Partners Portal API');
    expect(openApiSpec.info.version).toBe('1.0.0');
  });

  it('should have all required tags', async () => {
    const { openApiSpec } = await import('../lib/openapi');
    
    const tagNames = openApiSpec.tags?.map(t => t.name) || [];
    expect(tagNames).toContain('Health');
    expect(tagNames).toContain('Partners');
    expect(tagNames).toContain('Campaigns');
    expect(tagNames).toContain('Payouts');
    expect(tagNames).toContain('Analytics');
    expect(tagNames).toContain('Payments');
    expect(tagNames).toContain('Admin');
  });

  it('should have health endpoint', async () => {
    const { openApiSpec } = await import('../lib/openapi');
    
    expect(openApiSpec.paths['/api/health']).toBeDefined();
    expect(openApiSpec.paths['/api/health']?.get).toBeDefined();
  });

  it('should have partner stats endpoint', async () => {
    const { openApiSpec } = await import('../lib/openapi');
    
    expect(openApiSpec.paths['/api/partners/{id}/stats']).toBeDefined();
    expect(openApiSpec.paths['/api/partners/{id}/stats']?.get).toBeDefined();
  });

  it('should have admin endpoints', async () => {
    const { openApiSpec } = await import('../lib/openapi');
    
    expect(openApiSpec.paths['/api/admin/stats']).toBeDefined();
    expect(openApiSpec.paths['/api/admin/partners']).toBeDefined();
    expect(openApiSpec.paths['/api/admin/payouts']).toBeDefined();
    expect(openApiSpec.paths['/api/admin/bulk']).toBeDefined();
    expect(openApiSpec.paths['/api/admin/export']).toBeDefined();
  });

  it('should have payment endpoints', async () => {
    const { openApiSpec } = await import('../lib/openapi');
    
    expect(openApiSpec.paths['/api/payments/connect']).toBeDefined();
    expect(openApiSpec.paths['/api/payments/payout']).toBeDefined();
    expect(openApiSpec.paths['/api/payments/webhook']).toBeDefined();
  });

  it('should have security scheme defined', async () => {
    const { openApiSpec } = await import('../lib/openapi');
    
    expect(openApiSpec.components?.securitySchemes?.bearerAuth).toBeDefined();
    const bearerAuth = openApiSpec.components?.securitySchemes?.bearerAuth as { type: string; scheme: string };
    expect(bearerAuth?.type).toBe('http');
    expect(bearerAuth?.scheme).toBe('bearer');
  });

  it('should have common response schemas', async () => {
    const { openApiSpec } = await import('../lib/openapi');
    
    expect(openApiSpec.components?.responses?.BadRequest).toBeDefined();
    expect(openApiSpec.components?.responses?.Unauthorized).toBeDefined();
    expect(openApiSpec.components?.responses?.Forbidden).toBeDefined();
    expect(openApiSpec.components?.responses?.NotFound).toBeDefined();
  });

  it('should have data schemas', async () => {
    const { openApiSpec } = await import('../lib/openapi');
    
    expect(openApiSpec.components?.schemas?.HealthResponse).toBeDefined();
    expect(openApiSpec.components?.schemas?.PartnerStatsResponse).toBeDefined();
    expect(openApiSpec.components?.schemas?.Campaign).toBeDefined();
    expect(openApiSpec.components?.schemas?.Payout).toBeDefined();
    expect(openApiSpec.components?.schemas?.Notification).toBeDefined();
  });
});

describe('ApiDocsClient Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render API docs header', async () => {
    const { ApiDocsClient } = await import('../app/api-docs/ApiDocsClient');
    render(<ApiDocsClient />);
    
    await waitFor(() => {
      expect(screen.getByText('Inner Circle Partners Portal API')).toBeInTheDocument();
    });
  });

  it('should show version number', async () => {
    const { ApiDocsClient } = await import('../app/api-docs/ApiDocsClient');
    render(<ApiDocsClient />);
    
    await waitFor(() => {
      expect(screen.getByText('Version 1.0.0')).toBeInTheDocument();
    });
  });

  it('should show overview section', async () => {
    const { ApiDocsClient } = await import('../app/api-docs/ApiDocsClient');
    render(<ApiDocsClient />);
    
    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });
  });

  it('should show endpoints section', async () => {
    const { ApiDocsClient } = await import('../app/api-docs/ApiDocsClient');
    render(<ApiDocsClient />);
    
    await waitFor(() => {
      expect(screen.getByText('Endpoints')).toBeInTheDocument();
    });
  });

  it('should show schemas section', async () => {
    const { ApiDocsClient } = await import('../app/api-docs/ApiDocsClient');
    render(<ApiDocsClient />);
    
    await waitFor(() => {
      expect(screen.getByText('Schemas')).toBeInTheDocument();
    });
  });

  it('should show category filters', async () => {
    const { ApiDocsClient } = await import('../app/api-docs/ApiDocsClient');
    render(<ApiDocsClient />);
    
    await waitFor(() => {
      expect(screen.getByText('Categories')).toBeInTheDocument();
      expect(screen.getByText(/All Endpoints/)).toBeInTheDocument();
    });
  });

  it('should have search input', async () => {
    const { ApiDocsClient } = await import('../app/api-docs/ApiDocsClient');
    render(<ApiDocsClient />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search endpoints...')).toBeInTheDocument();
    });
  });

  it('should show server info', async () => {
    const { ApiDocsClient } = await import('../app/api-docs/ApiDocsClient');
    render(<ApiDocsClient />);
    
    await waitFor(() => {
      expect(screen.getByText('Servers')).toBeInTheDocument();
    });
  });
});
