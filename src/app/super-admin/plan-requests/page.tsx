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
import { Bell, CheckCircle, XCircle, Clock, Search, Filter } from 'lucide-react';

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

export default function PlanRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<PlanRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<PlanRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PlanRequest | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRequests();
  }, [statusFilter]);

  useEffect(() => {
    filterRequests();
  }, [requests, searchTerm, statusFilter]);

  const loadRequests = async () => {
    try {
      const filters: any = {};
      if (statusFilter) {
        filters.status = statusFilter;
      }
      const data = await apiClient.getPlanRequests(filters) as PlanRequest[];
      setRequests(data);
    } catch (error) {
      console.error('Error loading plan requests:', error);
    }
  };

  const filterRequests = () => {
    let filtered = requests;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(req =>
        req.clientName.toLowerCase().includes(searchLower) ||
        req.clientEmail.toLowerCase().includes(searchLower) ||
        req.planName.toLowerCase().includes(searchLower)
      );
    }

    setFilteredRequests(filtered);
  };

  const handleApprove = (request: PlanRequest) => {
    setSelectedRequest(request);
    setApprovalNotes('');
    setShowApproveModal(true);
  };

  const handleReject = (request: PlanRequest) => {
    setSelectedRequest(request);
    setApprovalNotes('');
    setShowRejectModal(true);
  };

  const confirmApprove = async () => {
    if (!selectedRequest || !user) return;

    setLoading(true);
    try {
      await apiClient.approvePlanRequest(selectedRequest.id, {
        approvedBy: user.id,
        approvalNotes: approvalNotes || undefined,
      });

      setShowApproveModal(false);
      setSelectedRequest(null);
      setApprovalNotes('');
      await loadRequests();
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
      await loadRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  return (
    <DashboardLayout requiredRole="super_admin">
      <div className="p-4 md:p-8">
        <div className="mb-6 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Plan Activation Requests</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">Review and manage client plan activation requests</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600">
                Pending Requests
              </CardTitle>
              <Clock className="h-4 w-4 md:h-5 md:w-5 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold">{pendingCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600">
                Approved
              </CardTitle>
              <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold">{approvedCount}</div>
            </CardContent>
          </Card>

          <Card className="col-span-2 md:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600">
                Rejected
              </CardTitle>
              <XCircle className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold">{rejectedCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  className="pl-10"
                  placeholder="Search by client name, email, or plan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requests Table */}
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
                <p className="text-gray-500">
                  {searchTerm || statusFilter ? 'No requests match your filters' : 'No plan requests yet'}
                </p>
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
                      <TableHead>Requested</TableHead>
                      <TableHead>Status</TableHead>
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
                          {new Date(request.requestedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              request.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : request.status === 'approved'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {request.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                            {request.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {request.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                            {request.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {request.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleApprove(request)}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(request)}
                              >
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">
                              {request.status === 'approved' ? 'Activated' : 'Declined'}
                            </span>
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

        {/* Approve Modal */}
        {showApproveModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md bg-white shadow-xl">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-xl font-bold text-gray-900">
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
                    <span className="text-sm font-semibold text-gray-700">Plan:</span>
                    <span className="text-sm text-gray-900 ml-2">
                      {selectedRequest.planName} - ₹{selectedRequest.planPrice}/{selectedRequest.billingCycle}
                    </span>
                  </div>
                  {selectedRequest.requestMessage && (
                    <div>
                      <span className="text-sm font-semibold text-gray-700">Message:</span>
                      <p className="text-sm text-gray-900 mt-1">{selectedRequest.requestMessage}</p>
                    </div>
                  )}
                </div>

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
                    disabled={loading}
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
                <CardTitle className="text-xl font-bold text-gray-900">
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
