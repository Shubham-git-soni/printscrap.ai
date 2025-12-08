'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Sidebar } from './Sidebar';
import { MobileFooter } from './MobileFooter';
import { TrialExpiredModal } from '@/components/TrialExpiredModal';
import { apiClient } from '@/lib/api-client';
import { Plan } from '@/lib/types';
import { cn } from '@/lib/utils';
import { User, LogOut, Moon, Sun } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  requiredRole?: 'super_admin' | 'client';
}

export function DashboardLayout({ children, requiredRole }: DashboardLayoutProps) {
  const { user, isLoading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [showTrialExpired, setShowTrialExpired] = useState(false);
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          const trialStatus = await apiClient.checkTrialExpired(user.id) as { isExpired: boolean };
          if (trialStatus.isExpired) {
            setIsTrialExpired(true);
            const allPlans = await apiClient.getPlans() as Plan[];
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
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isDesktopCollapsed={desktopSidebarCollapsed}
        onDesktopToggle={() => setDesktopSidebarCollapsed(!desktopSidebarCollapsed)}
      />
      <main className={cn(
        "flex-1 overflow-y-auto bg-background pb-20 lg:pb-0 transition-all duration-300",
        desktopSidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
      )}>
        {/* Desktop toggle button - shown when sidebar is collapsed */}
        {desktopSidebarCollapsed && (
          <button
            onClick={() => setDesktopSidebarCollapsed(false)}
            className="hidden lg:block fixed top-4 left-4 z-40 p-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors shadow-lg"
            title="Open sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        )}

        {/* Mobile header with profile icon */}
        <div className="lg:hidden sticky top-0 z-30 bg-card border-b px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">PrintScrap.ai</h1>

          {/* Profile Icon with Dropdown */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <User className="h-5 w-5" />
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 top-12 w-64 bg-card border rounded-lg shadow-lg py-2 z-50">
                <div className="px-4 py-3 border-b">
                  <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
                  <p className="text-xs text-muted-foreground capitalize mt-1">{user?.role?.replace('_', ' ')}</p>
                </div>

                {/* Theme Toggle for Mobile */}
                <button
                  onClick={() => {
                    toggleTheme();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-foreground hover:bg-muted transition-colors"
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="h-4 w-4" />
                      <span className="text-sm font-medium">Light Mode</span>
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4" />
                      <span className="text-sm font-medium">Dark Mode</span>
                    </>
                  )}
                </button>

                {/* Logout */}
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
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

      {/* Mobile Footer Navigation */}
      <MobileFooter onMenuClick={() => setSidebarOpen(true)} />

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
