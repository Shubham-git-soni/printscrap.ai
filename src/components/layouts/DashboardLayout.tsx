'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { TrialExpiredModal } from '@/components/TrialExpiredModal';
import { mockApi } from '@/lib/mock-api';
import { Plan } from '@/lib/types';

interface DashboardLayoutProps {
  children: React.ReactNode;
  requiredRole?: 'super_admin' | 'client';
}

export function DashboardLayout({ children, requiredRole }: DashboardLayoutProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [showTrialExpired, setShowTrialExpired] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }

    if (!isLoading && user && requiredRole && user.role !== requiredRole) {
      if (user.role === 'super_admin') {
        router.push('/super-admin/dashboard');
      } else {
        router.push('/client/dashboard');
      }
    }

    // Check trial expiration for clients
    if (!isLoading && user && user.role === 'client') {
      const isExpired = mockApi.checkTrialExpired(user.id);
      if (isExpired) {
        const allPlans = mockApi.getPlans();
        setPlans(allPlans);
        setShowTrialExpired(true);
      }
    }
  }, [user, isLoading, router, requiredRole]);

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

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {children}
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
