/**
 * Partner Dashboard Page
 * Protected route - requires authentication
 * Displays partner stats, campaigns, and activity
 */

import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import { DashboardClient } from './dashboard-client';

export default async function DashboardPage(): Promise<React.ReactElement> {
  // Get authenticated user (server-side)
  const { authenticated, user } = await getAuthUser();

  // Redirect to sign-in if not authenticated
  if (!authenticated || !user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    redirect('/sign-in' as any);
  }

  return (
    <DashboardClient 
      user={{
        id: user.id,
        name: user.name ?? user.email,
        email: user.email,
        imageUrl: user.imageUrl,
        role: user.role,
        partnerId: user.partnerId,
      }}
    />
  );
}
