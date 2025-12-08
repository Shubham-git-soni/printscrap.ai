'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api-client';
import { User, Subscription, Plan } from '@/lib/types';
import { Users, CreditCard, TrendingUp, IndianRupee, CheckCircle, XCircle } from 'lucide-react';

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
  });
  const [recentClients, setRecentClients] = useState<User[]>([]);
  const [recentSubscriptions, setRecentSubscriptions] = useState<(Subscription & { user?: User; plan?: Plan })[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersData, plans] = await Promise.all([
        apiClient.getUsers(),
        apiClient.getPlans(),
      ]);

      // Filter only clients
      const clients = (usersData as any[]).filter((u: any) => u.role === 'client');
      const activeClients = clients.filter((u: any) => u.isActive);

      // Active subscriptions (from user data which includes subscription info)
      const activeSubs = clients.filter((u: any) => u.subscriptionStatus === 'active');

      // Calculate total revenue (sum of all active subscriptions)
      const totalRevenue = activeSubs.reduce((sum: number, user: any) => {
        const plan = (plans as any[]).find((p: any) => p.name === user.planName);
        return sum + (plan?.price || 0);
      }, 0);

      setStats({
        totalClients: clients.length,
        activeClients: activeClients.length,
        totalRevenue,
        activeSubscriptions: activeSubs.length,
      });

      // Recent clients (last 5)
      const recent = clients
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      setRecentClients(recent);

      // Recent subscriptions with user and plan info (from users data)
      // Show clients who have either subscriptionId or subscriptionStatus
      const recentSubs = clients
        .filter((u: any) => u.subscriptionId || u.subscriptionStatus || u.planName)
        .sort((a: any, b: any) => {
          // Sort by subscription start date or creation date
          const dateA = new Date(a.subscriptionStartDate || a.createdAt).getTime();
          const dateB = new Date(b.subscriptionStartDate || b.createdAt).getTime();
          return dateB - dateA;
        })
        .slice(0, 5)
        .map((user: any) => ({
          id: user.subscriptionId || user.id,
          userId: user.id,
          planId: 0,
          status: user.subscriptionStatus || 'trial',
          startDate: user.subscriptionStartDate || user.createdAt,
          endDate: user.subscriptionEndDate || null,
          autoRenew: false,
          user: user,
          plan: (plans as any[]).find((p: any) => p.name === user.planName),
        }));

      console.log('Recent Subscriptions:', recentSubs);
      setRecentSubscriptions(recentSubs);
    } catch (error) {
      console.error('Error loading super admin dashboard data:', error);
    }
  };

  return (
    <DashboardLayout requiredRole="super_admin">
      <div className="p-4 md:p-8">
        <div className="mb-4 md:mb-6">
          <h1 className="text-lg md:text-xl font-bold text-foreground">Super Admin Dashboard</h1>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-6 mb-4 md:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 p-2 md:p-6">
              <CardTitle className="text-[10px] md:text-sm font-medium text-muted-foreground">
                Clients
              </CardTitle>
              <Users className="h-3 w-3 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent className="p-2 md:p-6 pt-0">
              <div className="text-sm md:text-2xl font-bold text-foreground">{stats.totalClients}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 p-2 md:p-6">
              <CardTitle className="text-[10px] md:text-sm font-medium text-muted-foreground">
                Active Subs
              </CardTitle>
              <CreditCard className="h-3 w-3 md:h-5 md:w-5 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent className="p-2 md:p-6 pt-0">
              <div className="text-sm md:text-2xl font-bold text-foreground">{stats.activeSubscriptions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 p-2 md:p-6">
              <CardTitle className="text-[10px] md:text-sm font-medium text-muted-foreground">
                Revenue
              </CardTitle>
              <IndianRupee className="h-3 w-3 md:h-5 md:w-5 text-purple-600 dark:text-purple-400" />
            </CardHeader>
            <CardContent className="p-2 md:p-6 pt-0">
              <div className="text-sm md:text-2xl font-bold text-foreground">₹{stats.totalRevenue.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 p-2 md:p-6">
              <CardTitle className="text-[10px] md:text-sm font-medium text-muted-foreground">
                Conversion
              </CardTitle>
              <TrendingUp className="h-3 w-3 md:h-5 md:w-5 text-orange-600 dark:text-orange-400" />
            </CardHeader>
            <CardContent className="p-2 md:p-6 pt-0">
              <div className="text-sm md:text-2xl font-bold text-foreground">
                {stats.totalClients > 0
                  ? ((stats.activeSubscriptions / stats.totalClients) * 100).toFixed(1)
                  : 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Clients */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Recent Clients</CardTitle>
            </CardHeader>
            <CardContent>
              {recentClients.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No clients yet</p>
              ) : (
                <div className="space-y-4">
                  {recentClients.map(client => (
                    <div key={client.id} className="flex items-center justify-between gap-3 border-b pb-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{client.companyName}</p>
                        <p className="text-sm text-muted-foreground truncate">{client.email}</p>
                      </div>
                      <div className="flex-shrink-0">
                        {client.isActive ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 whitespace-nowrap">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 whitespace-nowrap">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Subscriptions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Recent Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              {recentSubscriptions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No subscriptions yet</p>
              ) : (
                <div className="space-y-4">
                  {recentSubscriptions.map(sub => (
                    <div key={sub.id} className="flex items-center justify-between border-b pb-3">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{sub.user?.companyName || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">{sub.plan?.name || 'N/A'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600 dark:text-green-400">₹{sub.plan?.price || 0}</p>
                        <span className={`inline-flex px-2 py-1 mt-1 rounded-full text-xs font-medium ${sub.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                          sub.status === 'trial' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                            sub.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                              'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                          }`}>
                          {sub.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
