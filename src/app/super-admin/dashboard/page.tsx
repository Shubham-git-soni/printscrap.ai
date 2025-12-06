'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockApi } from '@/lib/mock-api';
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

  const loadData = () => {
    const users = mockApi.getUsers();
    const subscriptions = mockApi.getSubscriptions();
    const plans = mockApi.getPlans();

    // Filter only clients
    const clients = users.filter(u => u.role === 'client');
    const activeClients = clients.filter(u => u.isActive);

    // Active subscriptions
    const activeSubs = subscriptions.filter(s => s.status === 'active');

    // Calculate total revenue (sum of all active subscriptions)
    const totalRevenue = activeSubs.reduce((sum, sub) => {
      const plan = plans.find(p => p.id === sub.planId);
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
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    setRecentClients(recent);

    // Recent subscriptions with user and plan info
    const recentSubs = subscriptions
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      .slice(0, 5)
      .map(sub => ({
        ...sub,
        user: users.find(u => u.subscriptionId === sub.id),
        plan: plans.find(p => p.id === sub.planId),
      }));
    setRecentSubscriptions(recentSubs);
  };

  return (
    <DashboardLayout requiredRole="super_admin">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.companyName}!</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Clients
              </CardTitle>
              <Users className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClients}</div>
              <p className="text-xs text-gray-500 mt-1">{stats.activeClients} active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Active Subscriptions
              </CardTitle>
              <CreditCard className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
              <p className="text-xs text-gray-500 mt-1">Current active plans</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Monthly Revenue
              </CardTitle>
              <IndianRupee className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">From active subscriptions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Conversion Rate
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalClients > 0
                  ? ((stats.activeSubscriptions / stats.totalClients) * 100).toFixed(1)
                  : 0}%
              </div>
              <p className="text-xs text-gray-500 mt-1">Clients with subscriptions</p>
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
