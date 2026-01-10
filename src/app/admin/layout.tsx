/**
 * Admin Layout
 * Shared layout for all admin pages with sidebar navigation
 */

import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import { AdminSidebar } from './components/AdminSidebar';
import { AdminHeader } from './components/AdminHeader';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps): Promise<React.ReactElement> {
  // Get authenticated user
  const { authenticated, user } = await getAuthUser();

  // Redirect to sign-in if not authenticated
  if (!authenticated || !user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    redirect('/sign-in' as any);
  }

  // Check admin role
  if (user.role !== 'ADMIN') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    redirect('/dashboard' as any);
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Header */}
        <AdminHeader user={user} />

        {/* Page Content */}
        <main className="py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
