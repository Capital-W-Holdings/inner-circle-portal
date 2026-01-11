/**
 * Authentication Middleware
 * Integrates with Clerk for production authentication
 * Falls back to mock auth for development without Clerk
 */

import { auth, currentUser } from '@clerk/nextjs/server';
import { features } from './env';

// ============================================
// Types
// ============================================

export interface AuthUser {
  id: string;
  clerkId: string;
  email: string;
  name?: string;
  role: UserRole;
  partnerId?: string;
  imageUrl?: string;
}

export type UserRole = 'PARTNER' | 'ADMIN' | 'SUPER_ADMIN';

export interface AuthResult {
  authenticated: boolean;
  user: AuthUser | null;
  error?: string;
}

// ============================================
// Clerk Integration
// ============================================

/**
 * Get the current authenticated user from Clerk
 * For use in Server Components and Route Handlers
 */
export async function getAuthUser(): Promise<AuthResult> {
  try {
    // Check if Clerk is configured
    if (!features.hasAuth) {
      // Return mock user in development
      return getMockAuthUser();
    }

    const { userId } = await auth();
    
    if (!userId) {
      return {
        authenticated: false,
        user: null,
        error: 'Not authenticated',
      };
    }

    // Get full user details from Clerk
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      return {
        authenticated: false,
        user: null,
        error: 'User not found',
      };
    }

    // Extract role from Clerk metadata (set in Clerk dashboard or via API)
    const publicMetadata = clerkUser.publicMetadata as {
      role?: UserRole;
      partnerId?: string;
    } | undefined;

    const user: AuthUser = {
      id: clerkUser.id,
      clerkId: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress ?? '',
      name: `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim() || undefined,
      role: publicMetadata?.role ?? 'PARTNER',
      partnerId: publicMetadata?.partnerId,
      imageUrl: clerkUser.imageUrl,
    };

    return {
      authenticated: true,
      user,
    };
  } catch (error) {
    console.error('[Auth] Error getting auth user:', error);
    return {
      authenticated: false,
      user: null,
      error: 'Authentication error',
    };
  }
}

/**
 * Get auth for API routes (lightweight, just userId)
 */
export async function getApiAuth(): Promise<{ userId: string | null }> {
  if (!features.hasAuth) {
    const mock = getMockAuthUser();
    return { userId: mock.user?.id ?? null };
  }
  
  const { userId } = await auth();
  return { userId };
}

/**
 * Require authentication - throws if not authenticated
 * For use in API routes
 */
export async function requireAuth(): Promise<AuthUser> {
  const result = await getAuthUser();
  
  if (!result.authenticated || !result.user) {
    throw new AuthError('Authentication required', 401);
  }
  
  return result.user;
}

/**
 * Require admin role - throws if not admin
 */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth();
  
  if (!isAdmin(user)) {
    throw new AuthError('Admin access required', 403);
  }
  
  return user;
}

// ============================================
// Authorization Helpers
// ============================================

/**
 * Check if user can access partner data
 */
export function canAccessPartnerData(
  user: AuthUser | null,
  partnerId: string
): boolean {
  if (!user) return false;

  // Admins can access all partner data
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
    return true;
  }

  // Partners can access their own data via partnerId or user id
  // (user.id is used as fallback partnerId for new users without explicit partnerId)
  return user.partnerId === partnerId || user.id === partnerId;
}

/**
 * Check if user has admin privileges
 */
export function isAdmin(user: AuthUser | null): boolean {
  return user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(user: AuthUser | null): boolean {
  return user?.role === 'SUPER_ADMIN';
}

// ============================================
// Development Helpers
// ============================================

/**
 * Mock authenticated user for development/testing
 * Returns a demo user when Clerk is not configured
 */
export function getMockAuthUser(): AuthResult {
  // Only use mock in development without Clerk
  if (process.env.NODE_ENV === 'production') {
    return { authenticated: false, user: null };
  }
  
  // Check if mock auth is explicitly enabled
  if (process.env.ENABLE_MOCK_AUTH !== 'true') {
    return { authenticated: false, user: null };
  }
  
  return {
    authenticated: true,
    user: {
      id: 'dev-user-001',
      clerkId: 'dev-clerk-001',
      email: 'dev@innercircle.local',
      name: 'Development User',
      role: 'PARTNER',
      partnerId: 'partner-demo-123',
    },
  };
}

// ============================================
// Error Class
// ============================================

export class AuthError extends Error {
  public readonly statusCode: number;
  
  constructor(message: string, statusCode: number = 401) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

/**
 * Check if an error is an AuthError
 */
export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}

// ============================================
// Legacy compatibility (for existing code)
// ============================================

/**
 * @deprecated Use getAuthUser() instead
 * Kept for backward compatibility with existing API routes
 */
export async function authenticateRequest(): Promise<AuthResult> {
  return getAuthUser();
}
