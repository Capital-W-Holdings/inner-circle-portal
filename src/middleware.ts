/**
 * Clerk Middleware
 * Protects routes and handles authentication
 * 
 * Public routes: /, /sign-in, /sign-up, /api/health, /api/partners/interest
 * Protected routes: Everything else
 * 
 * NOTE: This middleware only activates when Clerk keys are configured.
 * Without keys, all routes are public (for development/demo).
 */

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Check if Clerk is configured
const hasClerkConfig = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
  process.env.CLERK_SECRET_KEY
);

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/health',
  '/api/partners/interest',
  '/r/(.*)', // Referral tracking links
]);

// Clerk middleware (only used when configured)
const clerkMiddlewareHandler = clerkMiddleware(async (auth, request) => {
  // Allow public routes
  if (isPublicRoute(request)) {
    return;
  }
  
  // Protect all other routes
  await auth.protect();
});

// Main middleware export
export default function middleware(request: NextRequest) {
  // If Clerk is not configured, allow all requests
  if (!hasClerkConfig) {
    return NextResponse.next();
  }
  
  // Otherwise, use Clerk middleware
  return clerkMiddlewareHandler(request, {} as any);
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
