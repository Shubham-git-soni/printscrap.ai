'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiClient } from '@/lib/api-client';
import { Subscription, User, Plan } from '@/lib/types';
import { CreditCard, Plus, Search } from 'lucide-react';

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<(Subscription & { user?: User; plan?: Plan })[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const [newSubscription, setNewSubscription] = useState({
    userId: '',
    planId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    status: 'active' as 'active' | 'trial' | 'expired' | 'cancelled',
    autoRenew: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [users, allPlans] = await Promise.all([
        apiClient.getUsers(),
        apiClient.getPlans(),
      ]);

      const clientUsers = (users as any[]).filter((u: any) => u.role === 'client');
      setClients(clientUsers as User[]);
      setPlans(allPlans as Plan[]);

      // Build subscriptions from user data (users already include subscription info)
      const enhancedSubs = clientUsers
        .filter((u: any) => u.subscriptionId)
        .map((user: any) => ({
          id: user.subscriptionId,
          userId: user.id,
          planId: 0,
          status: user.subscriptionStatus || 'active',
          startDate: user.createdAt,
          endDate: user.subscriptionEndDate,
          autoRenew: false,
          user: user,
          plan: (allPlans as any[]).find((p: any) => p.name === user.planName),
        }));

      setSubscriptions(enhancedSubs);
    } catch (error) {
      console.error('Error loading subscriptions data:', error);
    }
  };

  const handleAddSubscription = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedPlan = plans.find(p => p.id === parseInt(newSubscription.planId));
    if (!selectedPlan) return;

    // Create subscription API not implemented yet
    console.warn('Create subscription API not implemented');
    alert('Subscription management features are not yet implemented in the backend.');

    setShowAddForm(false);
  };

  const handleUpdateStatus = (_subId: number, _newStatus: 'active' | 'trial' | 'expired' | 'cancelled') => {
    // Update subscription API not implemented yet
    console.warn('Update subscription API not implemented');
    alert('Subscription status update is not yet implemented in the backend.');
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const searchLower = searchTerm.toLowerCase();
    return (
      sub.user?.companyName.toLowerCase().includes(searchLower) ||
      sub.user?.email.toLowerCase().includes(searchLower) ||
      sub.plan?.name.toLowerCase().includes(searchLower)
    );
  });

  return (
    <DashboardLayout requiredRole="super_admin">
      <div className="p-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
            <p className="text-gray-600 mt-1">Manage client subscriptions</p>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="h-4 w-4 mr-2" />
            {showAddForm ? 'Cancel' : 'Add Subscription'}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subscriptions.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {subscriptions.filter(s => s.status === 'active').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Trial</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {subscriptions.filter(s => s.status === 'trial').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Expired</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {subscriptions.filter(s => s.status === 'expired').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Subscription Form */}
        {showAddForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Subscription</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddSubscription} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="userId">Client *</Label>
                    <Select
                      id="userId"
                      value={newSubscription.userId}
                      onChange={(e) => setNewSubscription({ ...newSubscription, userId: e.target.value })}
                      required
                    >
                      <option value="">Select Client</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>
                          {client.companyName} ({client.email})
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="planId">Plan *</Label>
                    <Select
                      id="planId"
                      value={newSubscription.planId}
                      onChange={(e) => setNewSubscription({ ...newSubscription, planId: e.target.value })}
                      required
                    >
                      <option value="">Select Plan</option>
                      {plans.map(plan => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name} - Rs.{plan.price}/{plan.billingCycle}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={newSubscription.startDate}
                      onChange={(e) => setNewSubscription({ ...newSubscription, startDate: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="endDate">End Date *</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={newSubscription.endDate}
                      onChange={(e) => setNewSubscription({ ...newSubscription, endDate: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      id="status"
                      value={newSubscription.status}
                      onChange={(e) => setNewSubscription({ ...newSubscription, status: e.target.value as any })}
                      required
                    >
                      <option value="active">Active</option>
                      <option value="trial">Trial</option>
                      <option value="expired">Expired</option>
                      <option value="cancelled">Cancelled</option>
                    </Select>
                  </div>

                  <div className="flex items-center pt-6">
                    <input
                      type="checkbox"
                      id="autoRenew"
                      checked={newSubscription.autoRenew}
                      onChange={(e) => setNewSubscription({ ...newSubscription, autoRenew: e.target.checked })}
                      className="mr-2"
                    />
                    <Label htmlFor="autoRenew" className="mb-0">Auto Renew</Label>
                  </div>
                </div>

                <div className="pt-4">
                  <Button type="submit">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Subscription
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                className="pl-10"
                placeholder="Search by client or plan name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Subscriptions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              All Subscriptions ({filteredSubscriptions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredSubscriptions.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm ? 'No subscriptions match your search' : 'No subscriptions yet'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Auto Renew</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubscriptions.map(sub => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium">
                          <div>
                            <p>{sub.user?.companyName || 'Unknown'}</p>
                            <p className="text-sm text-gray-500">{sub.user?.email || ''}</p>
                          </div>
                        </TableCell>
                        <TableCell>{sub.plan?.name || 'N/A'}</TableCell>
                        <TableCell className="font-semibold">Rs.{sub.plan?.price || 0}</TableCell>
                        <TableCell>{new Date(sub.startDate).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(sub.endDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            sub.status === 'active' ? 'bg-green-100 text-green-700' :
                            sub.status === 'trial' ? 'bg-blue-100 text-blue-700' :
                            sub.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {sub.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            sub.autoRenew ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {sub.autoRenew ? 'Yes' : 'No'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Select
                            value={sub.status}
                            onChange={(e) => handleUpdateStatus(sub.id, e.target.value as any)}
                            className="w-32"
                          >
                            <option value="active">Active</option>
                            <option value="trial">Trial</option>
                            <option value="expired">Expired</option>
                            <option value="cancelled">Cancelled</option>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}