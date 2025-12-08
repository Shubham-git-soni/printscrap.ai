'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ViewToggle } from '@/components/ui/view-toggle';
import { apiClient } from '@/lib/api-client';
import { Subscription, User, Plan } from '@/lib/types';
import { CreditCard, Search, Bell, CheckCircle, XCircle } from 'lucide-react';

interface PlanRequest {
  id: number;
  userId: number;
  planId: number;
  status: 'pending' | 'approved' | 'rejected';
  requestMessage: string;
  requestedAt: string;
  approvedBy: number | null;
  approvalNotes: string | null;
  approvedAt: string | null;
  clientName: string;
  clientEmail: string;
  clientContact: string;
  planName: string;
  planPrice: number;
  billingCycle: string;
  approvedByName: string | null;
}

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<(Subscription & { user?: User; plan?: Plan })[]>([]);
  const [planRequests, setPlanRequests] = useState<PlanRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'requests' | 'subscriptions'>('requests');
  const [viewMode, setViewMode] = useState<'grid' | 'card'>('grid');

  // Modals state
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PlanRequest | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [users, allPlans, requests] = await Promise.all([
        apiClient.getUsers(),
        apiClient.getPlans(),
        apiClient.getPlanRequests({ status: 'pending' }),
      ]);

      const clientUsers = (users as any[]).filter((u: any) => u.role === 'client');
      setPlanRequests(requests as PlanRequest[]);

      // Build subscriptions from user data
      const enhancedSubs = clientUsers.map((user: any) => {
        let status = user.subscriptionStatus || 'trial';

        // Check if subscription is expired
        if (user.subscriptionEndDate) {
          const endDate = new Date(user.subscriptionEndDate);
          const currentDate = new Date();
          endDate.setHours(0, 0, 0, 0);
          currentDate.setHours(0, 0, 0, 0);

          if (endDate <= currentDate && (status === 'active' || status === 'trial')) {
            status = 'expired';
          }
        } else if (!user.subscriptionId) {
          const createdDate = new Date(user.createdAt);
          const currentDate = new Date();
          const oneDayLater = new Date(createdDate);
          oneDayLater.setDate(oneDayLater.getDate() + 1);

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
      console.error('Error loading data:', error);
    }
  };

  const handleApprove = (request: PlanRequest) => {
    setSelectedRequest(request);
    setApprovalNotes('');

    // Auto-calculate start and end dates based on billing cycle
    const currentDate = new Date();
    const start = new Date(currentDate);
    let end = new Date(currentDate);

    switch (request.billingCycle) {
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
    setShowApproveModal(true);
  };

  const handleReject = (request: PlanRequest) => {
    setSelectedRequest(request);
    setApprovalNotes('');
    setShowRejectModal(true);
  };

  const handleStartDateChange = (date: string) => {
    setStartDate(date);

    // Recalculate end date if request is selected
    if (selectedRequest) {
      const start = new Date(date);
      let end = new Date(start);

      switch (selectedRequest.billingCycle) {
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
  };

  const confirmApprove = async () => {
    if (!selectedRequest || !user) return;

    if (!startDate || !endDate) {
      alert('Please select start and end dates');
      return;
    }

    setLoading(true);
    try {
      await apiClient.approvePlanRequest(selectedRequest.id, {
        approvedBy: user.id,
        approvalNotes: approvalNotes || undefined,
        startDate: startDate,
        endDate: endDate,
      });

      setShowApproveModal(false);
      setSelectedRequest(null);
      setApprovalNotes('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
      await loadData();
      alert('Plan activated successfully!');
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const confirmReject = async () => {
    if (!selectedRequest || !user) return;

    setLoading(true);
    try {
      await apiClient.rejectPlanRequest(selectedRequest.id, {
        approvedBy: user.id,
        approvalNotes: approvalNotes || 'Request rejected by admin',
      });

      setShowRejectModal(false);
      setSelectedRequest(null);
      setApprovalNotes('');
      await loadData();
      alert('Request rejected successfully!');
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request. Please try again.');
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

  const filteredRequests = planRequests.filter(req => {
    const searchLower = searchTerm.toLowerCase();
    return (
      req.clientName.toLowerCase().includes(searchLower) ||
      req.clientEmail.toLowerCase().includes(searchLower) ||
      req.planName.toLowerCase().includes(searchLower)
    );
  });

  const pendingCount = planRequests.length;
  const activeCount = subscriptions.filter(s => s.status === 'active').length;
  const trialCount = subscriptions.filter(s => s.status === 'trial').length;
  const expiredCount = subscriptions.filter(s => s.status === 'expired').length;

  return (
    <DashboardLayout requiredRole="super_admin">
      <div className="p-4 md:p-8">
        <div className="mb-4 md:mb-6">
          <h1 className="text-lg md:text-xl font-bold text-foreground">Subscription Management</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-6 mb-4 md:mb-6">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('requests')}>
            <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 p-2 md:p-6">
              <CardTitle className="text-[10px] md:text-sm font-medium text-muted-foreground">Pending</CardTitle>
              <Bell className="h-3 w-3 md:h-5 md:w-5 text-yellow-600" />
            </CardHeader>
            <CardContent className="p-2 md:p-6 pt-0">
              <div className="text-sm md:text-2xl font-bold text-yellow-600">{pendingCount}</div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('subscriptions')}>
            <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 p-2 md:p-6">
              <CardTitle className="text-[10px] md:text-sm font-medium text-muted-foreground">Active</CardTitle>
            </CardHeader>
            <CardContent className="p-2 md:p-6 pt-0">
              <div className="text-sm md:text-2xl font-bold text-green-600">{activeCount}</div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('subscriptions')}>
            <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 p-2 md:p-6">
              <CardTitle className="text-[10px] md:text-sm font-medium text-muted-foreground">Trial</CardTitle>
            </CardHeader>
            <CardContent className="p-2 md:p-6 pt-0">
              <div className="text-sm md:text-2xl font-bold text-blue-600">{trialCount}</div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('subscriptions')}>
            <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 p-2 md:p-6">
              <CardTitle className="text-[10px] md:text-sm font-medium text-muted-foreground">Expired</CardTitle>
            </CardHeader>
            <CardContent className="p-2 md:p-6 pt-0">
              <div className="text-sm md:text-2xl font-bold text-red-600">{expiredCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="mb-4 md:mb-6 flex gap-2">
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-1.5 md:py-2 px-3 md:px-4 rounded-full font-medium text-xs md:text-sm flex items-center gap-1.5 md:gap-2 transition-all ${activeTab === 'requests'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
          >
            <Bell className="h-3.5 w-3.5 md:h-4 md:w-4" />
            Requests
            {pendingCount > 0 && (
              <span className="bg-yellow-400 text-yellow-900 text-[10px] md:text-xs font-semibold px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`py-1.5 md:py-2 px-3 md:px-4 rounded-full font-medium text-xs md:text-sm flex items-center gap-1.5 md:gap-2 transition-all ${activeTab === 'subscriptions'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
          >
            <CreditCard className="h-3.5 w-3.5 md:h-4 md:w-4" />
            All Subs
          </button>
        </div>

        {/* Plan Requests Tab */}
        {activeTab === 'requests' && (
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Plan Requests ({filteredRequests.length})
                  </CardTitle>
                  <ViewToggle view={viewMode} onViewChange={setViewMode} />
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    className="pl-10"
                    placeholder="Search plan requests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No pending plan requests</p>
                </div>
              ) : (
                <>
                  {/* Grid/Table View */}
                  <div className={`${viewMode === 'grid' ? 'block' : 'hidden'}`}>
                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto border rounded-lg">
                      <Table>
                        <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
                          <TableRow>
                            <TableHead className="bg-muted">Client</TableHead>
                            <TableHead className="bg-muted">Contact</TableHead>
                            <TableHead className="bg-muted">Plan</TableHead>
                            <TableHead className="bg-muted">Price</TableHead>
                            <TableHead className="bg-muted">Message</TableHead>
                            <TableHead className="bg-muted">Requested</TableHead>
                            <TableHead className="text-right bg-muted">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredRequests.map((request) => (
                            <TableRow key={request.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{request.clientName}</p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">{request.clientEmail}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <p className="text-sm">{request.clientContact || 'N/A'}</p>
                              </TableCell>
                              <TableCell>
                                <p className="font-medium">{request.planName}</p>
                              </TableCell>
                              <TableCell>
                                <p className="font-medium">₹{request.planPrice}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">/{request.billingCycle}</p>
                              </TableCell>
                              <TableCell>
                                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate" title={request.requestMessage}>
                                  {request.requestMessage || 'No message'}
                                </p>
                              </TableCell>
                              <TableCell>
                                {new Date(request.requestedAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    size="sm"
                                    className=""
                                    onClick={() => handleApprove(request)}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                    onClick={() => handleReject(request)}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Card View */}
                  <div className={`${viewMode === 'card' ? 'block' : 'hidden'} space-y-4 max-h-[500px] overflow-y-auto border rounded-lg p-4`}>
                    {filteredRequests.map((request) => (
                      <Card key={request.id}>
                        <CardContent className="pt-6">
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Client</p>
                              <p className="font-semibold text-foreground">{request.clientName}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{request.clientEmail}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Contact</p>
                                <p className="text-sm">{request.clientContact || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Requested</p>
                                <p className="text-sm">{new Date(request.requestedAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Plan</p>
                              <p className="font-medium">{request.planName}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">₹{request.planPrice}/{request.billingCycle}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Message</p>
                              <p className="text-sm">{request.requestMessage || 'No message'}</p>
                            </div>
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                className="flex-1"
                                onClick={() => handleApprove(request)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                onClick={() => handleReject(request)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Subscriptions Tab */}
        {activeTab === 'subscriptions' && (
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    All Subscriptions ({filteredSubscriptions.length})
                  </CardTitle>
                  <ViewToggle view={viewMode} onViewChange={setViewMode} />
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    className="pl-10"
                    placeholder="Search subscriptions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredSubscriptions.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'No subscriptions match your search' : 'No subscriptions yet'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Grid/Table View */}
                  <div className={`${viewMode === 'grid' ? 'block' : 'hidden'}`}>
                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto border rounded-lg">
                      <Table>
                        <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
                          <TableRow>
                            <TableHead className="bg-muted">Client</TableHead>
                            <TableHead className="bg-muted">Plan</TableHead>
                            <TableHead className="bg-muted">Price</TableHead>
                            <TableHead className="bg-muted">Start Date</TableHead>
                            <TableHead className="bg-muted">End Date</TableHead>
                            <TableHead className="bg-muted">Status</TableHead>
                            <TableHead className="bg-muted">Auto Renew</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredSubscriptions.map(sub => (
                            <TableRow key={sub.id || sub.userId}>
                              <TableCell className="font-medium">
                                <div>
                                  <p>{sub.user?.companyName || 'Unknown'}</p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">{sub.user?.email || ''}</p>
                                </div>
                              </TableCell>
                              <TableCell>{sub.plan?.name || 'No Plan'}</TableCell>
                              <TableCell className="font-semibold">
                                {sub.plan ? `₹${sub.plan.price}` : 'N/A'}
                              </TableCell>
                              <TableCell>{new Date(sub.startDate).toLocaleDateString()}</TableCell>
                              <TableCell>{new Date(sub.endDate).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${sub.status === 'active' ? 'bg-green-100 text-green-700' :
                                  sub.status === 'trial' ? 'bg-blue-100 text-blue-700' :
                                    sub.status === 'expired' ? 'bg-red-100 text-red-700' :
                                      sub.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                        'bg-yellow-100 text-yellow-700'
                                  }`}>
                                  {sub.status}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${sub.autoRenew ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                  }`}>
                                  {sub.autoRenew ? 'Yes' : 'No'}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Card View */}
                  <div className={`${viewMode === 'card' ? 'block' : 'hidden'} space-y-4 max-h-[500px] overflow-y-auto border rounded-lg p-4`}>
                    {filteredSubscriptions.map(sub => (
                      <Card key={sub.id || sub.userId}>
                        <CardContent className="pt-6">
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Client</p>
                              <p className="font-semibold text-foreground">{sub.user?.companyName || 'Unknown'}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{sub.user?.email || ''}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Plan</p>
                              <p className="font-medium">{sub.plan?.name || 'No Plan'}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {sub.plan ? `₹${sub.plan.price}` : 'N/A'}
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Start Date</p>
                                <p className="text-sm">{new Date(sub.startDate).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">End Date</p>
                                <p className="text-sm">{new Date(sub.endDate).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${sub.status === 'active' ? 'bg-green-100 text-green-700' :
                                  sub.status === 'trial' ? 'bg-blue-100 text-blue-700' :
                                    sub.status === 'expired' ? 'bg-red-100 text-red-700' :
                                      sub.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                        'bg-yellow-100 text-yellow-700'
                                  }`}>
                                  {sub.status}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Auto Renew</p>
                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${sub.autoRenew ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                  }`}>
                                  {sub.autoRenew ? 'Yes' : 'No'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Approve Modal */}
        {showApproveModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md bg-card shadow-xl">
              <CardHeader className="border-b">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  Approve Plan Request
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div>
                    <span className="text-sm font-semibold text-foreground">Client:</span>
                    <span className="text-sm">{selectedRequest.clientName}</span>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-foreground">Email:</span>
                    <span className="text-sm">{selectedRequest.clientEmail}</span>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-foreground">Plan:</span>
                    <span className="text-sm">
                      {selectedRequest.planName} - ₹{selectedRequest.planPrice}/{selectedRequest.billingCycle}
                    </span>
                  </div>
                  {selectedRequest.requestMessage && (
                    <div>
                      <span className="text-sm font-semibold text-foreground">Message:</span>
                      <p className="text-sm mt-1 italic">{selectedRequest.requestMessage}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate" className="text-sm font-semibold">
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
                    <Label htmlFor="endDate" className="text-sm font-semibold">
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

                {startDate && endDate && (
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-900 font-medium">
                      Duration: {startDate} to {endDate}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Billing Cycle: {selectedRequest.billingCycle}
                    </p>
                  </div>
                )}

                <div>
                  <Label htmlFor="approvalNotes" className="text-sm font-semibold">
                    Approval Notes (Optional)
                  </Label>
                  <Textarea
                    id="approvalNotes"
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    placeholder="Add any notes about this approval..."
                    rows={3}
                    className="mt-2"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowApproveModal(false);
                      setSelectedRequest(null);
                      setApprovalNotes('');
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={confirmApprove}
                    disabled={loading || !startDate || !endDate}
                  >
                    {loading ? 'Approving...' : 'Approve & Activate'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md bg-card shadow-xl">
              <CardHeader className="border-b">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <XCircle className="h-6 w-6 text-red-600" />
                  Reject Plan Request
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <div>
                    <span className="text-sm font-semibold text-foreground">Client:</span>
                    <span className="text-sm ml-2">{selectedRequest.clientName}</span>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-foreground">Plan:</span>
                    <span className="text-sm ml-2">
                      {selectedRequest.planName} - ₹{selectedRequest.planPrice}/{selectedRequest.billingCycle}
                    </span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="rejectionNotes" className="text-sm font-semibold">
                    Rejection Reason <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="rejectionNotes"
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    placeholder="Please provide a reason for rejection..."
                    rows={3}
                    className="mt-2"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowRejectModal(false);
                      setSelectedRequest(null);
                      setApprovalNotes('');
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    onClick={confirmReject}
                    disabled={loading || !approvalNotes}
                  >
                    {loading ? 'Rejecting...' : 'Reject Request'}
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
