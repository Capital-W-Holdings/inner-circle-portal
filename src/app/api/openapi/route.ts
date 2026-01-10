/**
 * OpenAPI Specification Endpoint
 * GET /api/openapi
 * 
 * Returns the OpenAPI 3.0 specification as JSON
 */

import { NextResponse } from 'next/server';
import { openApiSpec } from '@/lib/openapi';

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(openApiSpec, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
