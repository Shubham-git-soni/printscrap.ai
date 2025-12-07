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
      const recentSubs = clients
        .filter((u: any) => u.subscriptionEndDate)
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
      .map((user: any) => ({
        id: user.subscriptionId,
        userId: user.id,
        planId: 0,
        status: user.subscriptionStatus,
        startDate: user.createdAt,
        endDate: user.subscriptionEndDate,
        autoRenew: false,
        user: user,
        plan: (plans as any[]).find((p: any) => p.name === user.planName),
      }));
      setRecentSubscriptions(recentSubs);
    } catch (error) {
      console.error('Error loading super admin dashboard data:', error);
    }
  };

  return (
    <DashboardLayout requiredRole="super_admin">
      <div className="p-4 md:p-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">Welcome back, {user?.companyName}!</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600">
                Total Clients
              </CardTitle>
              <Users className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold">{stats.totalClients}</div>
              <p className="text-xs text-gray-500 mt-1 hidden md:block">{stats.activeClients} active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600">
                Active Subscriptions
              </CardTitle>
              <CreditCard className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold">{stats.activeSubscriptions}</div>
              <p className="text-xs text-gray-500 mt-1 hidden md:block">Current active plans</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600">
                Monthly Revenue
              </CardTitle>
              <IndianRupee className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1 hidden md:block">From active subscriptions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600">
                Conversion Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold">
                {stats.totalClients > 0
                  ? ((stats.activeSubscriptions / stats.totalClients) * 100).toFixed(1)
                  : 0}%
              </div>
              <p className="text-xs text-gray-500 mt-1 hidden md:block">Clients with subscriptions</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Clients */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Clients</CardTitle>
            </CardHeader>
            <CardContent>
              {recentClients.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No clients yet</p>
              ) : (
                <div className="space-y-4">
                  {recentClients.map(client => (
                    <div key={client.id} className="flex items-center justify-between border-b pb-3">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{client.companyName}</p>
                        <p className="text-sm text-gray-500">{client.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {client.isActive ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
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
              <CardTitle>Recent Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              {recentSubscriptions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No subscriptions yet</p>
              ) : (
                <div className="space-y-4">
                  {recentSubscriptions.map(sub => (
                    <div key={sub.id} className="flex items-center justify-between border-b pb-3">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{sub.user?.companyName || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">{sub.plan?.name || 'N/A'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">₹{sub.plan?.price || 0}</p>
                        <span className={`inline-flex px-2 py-1 mt-1 rounded-full text-xs font-medium ${sub.status === 'active' ? 'bg-green-100 text-green-700' :
                            sub.status === 'trial' ? 'bg-blue-100 text-blue-700' :
                              sub.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
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
