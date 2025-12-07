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

  // Activation modal state
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<User | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

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
      // Show ALL clients, even those without active subscriptions
      const enhancedSubs = clientUsers.map((user: any) => {
        let status = user.subscriptionStatus || 'trial'; // Default to trial for new registrations

        // Check if subscription is expired
        if (user.subscriptionEndDate) {
          const endDate = new Date(user.subscriptionEndDate);
          const currentDate = new Date();

          // Set time to start of day for accurate comparison
          endDate.setHours(0, 0, 0, 0);
          currentDate.setHours(0, 0, 0, 0);

          // If end date has passed or is today, and status is trial or active, mark as expired
          if (endDate <= currentDate && (status === 'active' || status === 'trial')) {
            status = 'expired';
          }
        } else if (!user.subscriptionId) {
          // No subscription at all - treat as trial that needs to be checked
          const createdDate = new Date(user.createdAt);
          const currentDate = new Date();
          const oneDayLater = new Date(createdDate);
          oneDayLater.setDate(oneDayLater.getDate() + 1);

          // If more than 1 day since registration, mark as expired
          if (currentDate > oneDayLater) {
            status = 'expired';
          } else {
            status = 'trial';
          }
        }

        return {
          id: user.subscriptionId || 0,
          userId: user.id,
          planId: 0,
          status: status,
          startDate: user.startDate || user.createdAt,
          endDate: user.endDate || new Date(new Date(user.createdAt).setDate(new Date(user.createdAt).getDate() + 1)).toISOString(),
          autoRenew: false,
          user: user,
          plan: user.planName ? (allPlans as any[]).find((p: any) => p.name === user.planName) : null,
        };
      });

      setSubscriptions(enhancedSubs);
    } catch (error) {
      console.error('Error loading subscriptions data:', error);
    }
  };

  const handleActivatePlan = (client: User) => {
    setSelectedClient(client);
    setSelectedPlanId('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setShowActivationModal(true);
  };

  const handlePlanSelection = (planId: string) => {
    setSelectedPlanId(planId);

    // Auto-fill start date with current date and calculate end date based on billing cycle
    const plan = plans.find(p => p.id === parseInt(planId));
    if (plan) {
      const currentDate = new Date();
      const start = new Date(currentDate);
      let end = new Date(currentDate);

      switch (plan.billingCycle) {
        case 'daily':
          end.setDate(end.getDate() + 1);
          break;
        case 'monthly':
          end.setMonth(end.getMonth() + 1);
          break;
        case 'yearly':
          end.setFullYear(end.getFullYear() + 1);
          break;
        default:
          end.setMonth(end.getMonth() + 1);
      }

      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    }
  };

  const handleStartDateChange = (date: string) => {
    setStartDate(date);

    // Recalculate end date if plan is selected
    if (selectedPlanId) {
      const plan = plans.find(p => p.id === parseInt(selectedPlanId));
      if (plan) {
        const start = new Date(date);
        let end = new Date(start);

        switch (plan.billingCycle) {
          case 'daily':
            end.setDate(end.getDate() + 1);
            break;
          case 'monthly':
            end.setMonth(end.getMonth() + 1);
            break;
          case 'yearly':
            end.setFullYear(end.getFullYear() + 1);
            break;
          default:
            end.setMonth(end.getMonth() + 1);
        }

        setEndDate(end.toISOString().split('T')[0]);
      }
    }
  };

  const handleSubmitActivation = async () => {
    if (!selectedClient || !selectedPlanId) {
      alert('Please select a plan');
      return;
    }

    setLoading(true);
    try {
      await apiClient.activateSubscription({
        userId: selectedClient.id,
        planId: parseInt(selectedPlanId),
      });

      alert('Plan activated successfully!');
      setShowActivationModal(false);
      setSelectedClient(null);
      setSelectedPlanId('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');

      // Reload data
      await loadData();
    } catch (error: any) {
      console.error('Error activating subscription:', error);
      alert('Failed to activate plan: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
          <p className="text-gray-600 mt-1">View all client subscriptions and activate plans</p>
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
                            sub.status === 'expired' ? 'bg-red-100 text-red-700' :
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
                          {sub.user && (
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => handleActivatePlan(sub.user as User)}
                            >
                              Activate Plan
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activation Modal */}
        {showActivationModal && selectedClient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg bg-white shadow-xl">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-xl font-bold text-gray-900">
                  Activate Plan - {selectedClient.companyName}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div>
                    <span className="text-sm font-semibold text-gray-700">Client:</span>
                    <span className="text-sm text-gray-900 ml-2">{selectedClient.companyName}</span>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-700">Email:</span>
                    <span className="text-sm text-gray-900 ml-2">{selectedClient.email}</span>
                  </div>
                  {selectedClient.contactNumber && (
                    <div>
                      <span className="text-sm font-semibold text-gray-700">Contact:</span>
                      <span className="text-sm text-gray-900 ml-2">{selectedClient.contactNumber}</span>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="planSelect" className="text-sm font-semibold text-gray-900">
                    Select Plan <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="planSelect"
                    value={selectedPlanId}
                    onChange={(e) => handlePlanSelection(e.target.value)}
                    className="w-full mt-2 px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-sm"
                  >
                    <option value="">Choose a plan...</option>
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} - Rs.{plan.price}/{plan.billingCycle}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate" className="text-sm font-semibold text-gray-900">
                      Start Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="endDate" className="text-sm font-semibold text-gray-900">
                      End Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>

                {selectedPlanId && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-900 font-medium">
                      Selected Plan: {plans.find(p => p.id === parseInt(selectedPlanId))?.name}
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      Duration: {startDate} to {endDate}
                    </p>
                    <p className="text-xs text-blue-600 mt-2">
                      Billing Cycle: {plans.find(p => p.id === parseInt(selectedPlanId))?.billingCycle}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                    onClick={() => {
                      setShowActivationModal(false);
                      setSelectedClient(null);
                      setSelectedPlanId('');
                      setStartDate(new Date().toISOString().split('T')[0]);
                      setEndDate('');
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleSubmitActivation}
                    disabled={!selectedPlanId || loading}
                  >
                    {loading ? 'Activating...' : 'Activate Plan'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}