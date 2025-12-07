'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { TrialExpiredModal } from '@/components/TrialExpiredModal';
import { apiClient } from '@/lib/api-client';
import { Plan } from '@/lib/types';

interface DashboardLayoutProps {
  children: React.ReactNode;
  requiredRole?: 'super_admin' | 'client';
}

export function DashboardLayout({ children, requiredRole }: DashboardLayoutProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showTrialExpired, setShowTrialExpired] = useState(false);
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      if (!isLoading && !user) {
        router.push('/login');
        return;
      }

      if (!isLoading && user && requiredRole && user.role !== requiredRole) {
        if (user.role === 'super_admin') {
          router.push('/super-admin/dashboard');
        } else {
          router.push('/client/dashboard');
        }
        return;
      }

      // Check trial expiration for clients
      if (!isLoading && user && user.role === 'client') {
        try {
          const trialStatus = await apiClient.checkTrialExpired(user.id);
          if (trialStatus.isExpired) {
            setIsTrialExpired(true);
            const allPlans = await apiClient.getPlans();
            setPlans(allPlans);

            // Only redirect to dashboard/settings if trial expired
            // Allow dashboard and settings page access
            const allowedPages = ['/client/dashboard', '/client/settings'];
            if (!allowedPages.includes(pathname || '')) {
              router.push('/client/dashboard');
            }

            setShowTrialExpired(true);
          } else {
            setIsTrialExpired(false);
          }
        } catch (error) {
          console.error('Error checking trial status:', error);
        }
      }
    };

    checkAuth();
  }, [user, isLoading, router, requiredRole, pathname]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if current page is restricted during trial expiration
  const isRestrictedPage = pathname && !['/client/dashboard', '/client/settings'].includes(pathname);
  const shouldBlockAccess = isTrialExpired && isRestrictedPage && user?.role === 'client';

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {shouldBlockAccess ? (
          <div className="p-8">
            <div className="max-w-2xl mx-auto">
              <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-8 text-center">
                <div className="mb-4">
                  <svg
                    className="mx-auto h-16 w-16 text-yellow-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Trial Period Expired
                </h2>
                <p className="text-gray-700 mb-6">
                  Your trial period has ended. To continue using all features, please activate a paid plan.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => router.push('/client/settings')}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    View Plans & Request Activation
                  </button>
                  <button
                    onClick={() => router.push('/client/dashboard')}
                    className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          children
        )}
      </main>

      {/* Trial Expired Modal */}
      {showTrialExpired && (
        <TrialExpiredModal
          plans={plans}
          onClose={() => setShowTrialExpired(false)}
        />
      )}
    </div>
  );
}
