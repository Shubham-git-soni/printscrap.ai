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
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
          <p className="text-gray-600 mt-1">Manage plan requests and view all client subscriptions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('requests')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Requests</CardTitle>
              <Bell className="h-5 w-5 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('subscriptions')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeCount}</div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('subscriptions')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Trial</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{trialCount}</div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('subscriptions')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Expired</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{expiredCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('requests')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'requests'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Plan Requests
                {pendingCount > 0 && (
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {pendingCount}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'subscriptions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                All Subscriptions
              </div>
            </button>
          </nav>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                className="pl-10"
                placeholder={activeTab === 'requests' ? 'Search plan requests...' : 'Search subscriptions...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Plan Requests Tab */}
        {activeTab === 'requests' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Plan Requests ({filteredRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No pending plan requests</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Requested</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{request.clientName}</p>
                              <p className="text-sm text-gray-500">{request.clientEmail}</p>
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
                            <p className="text-xs text-gray-500">/{request.billingCycle}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm text-gray-600 max-w-xs truncate" title={request.requestMessage}>
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
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleApprove(request)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
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
              )}
            </CardContent>
          </Card>
        )}

        {/* Subscriptions Tab */}
        {activeTab === 'subscriptions' && (
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubscriptions.map(sub => (
                        <TableRow key={sub.id || sub.userId}>
                          <TableCell className="font-medium">
                            <div>
                              <p>{sub.user?.companyName || 'Unknown'}</p>
                              <p className="text-sm text-gray-500">{sub.user?.email || ''}</p>
                            </div>
                          </TableCell>
                          <TableCell>{sub.plan?.name || 'No Plan'}</TableCell>
                          <TableCell className="font-semibold">
                            {sub.plan ? `₹${sub.plan.price}` : 'N/A'}
                          </TableCell>
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
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Approve Modal */}
        {showApproveModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md bg-white shadow-xl">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  Approve Plan Request
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div>
                    <span className="text-sm font-semibold text-gray-700">Client:</span>
                    <span className="text-sm text-gray-900 ml-2">{selectedRequest.clientName}</span>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-700">Email:</span>
                    <span className="text-sm text-gray-900 ml-2">{selectedRequest.clientEmail}</span>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-700">Plan:</span>
                    <span className="text-sm text-gray-900 ml-2">
                      {selectedRequest.planName} - ₹{selectedRequest.planPrice}/{selectedRequest.billingCycle}
                    </span>
                  </div>
                  {selectedRequest.requestMessage && (
                    <div>
                      <span className="text-sm font-semibold text-gray-700">Message:</span>
                      <p className="text-sm text-gray-900 mt-1 italic">{selectedRequest.requestMessage}</p>
                    </div>
                  )}
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
                  <Label htmlFor="approvalNotes" className="text-sm font-semibold text-gray-900">
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
                    className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
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
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
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
            <Card className="w-full max-w-md bg-white shadow-xl">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <XCircle className="h-6 w-6 text-red-600" />
                  Reject Plan Request
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div>
                    <span className="text-sm font-semibold text-gray-700">Client:</span>
                    <span className="text-sm text-gray-900 ml-2">{selectedRequest.clientName}</span>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-700">Plan:</span>
                    <span className="text-sm text-gray-900 ml-2">
                      {selectedRequest.planName} - ₹{selectedRequest.planPrice}/{selectedRequest.billingCycle}
                    </span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="rejectionNotes" className="text-sm font-semibold text-gray-900">
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
                    className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
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
