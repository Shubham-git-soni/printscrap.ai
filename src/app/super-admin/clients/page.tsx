'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ViewToggle } from '@/components/ui/view-toggle';
import { apiClient } from '@/lib/api-client';
import { showSuccess, showError } from '@/lib/toast';
import { User } from '@/lib/types';
import { Users, Search, CheckCircle, XCircle, Mail } from 'lucide-react';

export default function ClientsPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'card'>('grid');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const users = await apiClient.getUsers() as any[];
      const clientUsers = users.filter(u => u.role === 'client');
      setClients(clientUsers);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const handleToggleActive = async (clientId: number, currentStatus: boolean) => {
    try {
      await apiClient.updateUser(clientId, { isActive: !currentStatus });
      await loadClients();
      showSuccess(currentStatus ? 'Client deactivated successfully' : 'Client activated successfully');
    } catch (error) {
      console.error('Error toggling active status:', error);
      showError('Failed to update client status');
    }
  };

  const handleToggleVerified = async (clientId: number, currentStatus: boolean) => {
    try {
      await apiClient.updateUser(clientId, { isVerified: !currentStatus });
      await loadClients();
      showSuccess(currentStatus ? 'Client unverified' : 'Client verified successfully');
    } catch (error) {
      console.error('Error toggling verified status:', error);
      showError('Failed to update verified status');
    }
  };

  const filteredClients = clients.filter(client => {
    const searchLower = searchTerm.toLowerCase();
    return (
      client.companyName.toLowerCase().includes(searchLower) ||
      client.email.toLowerCase().includes(searchLower)
    );
  });

  return (
    <DashboardLayout requiredRole="super_admin">
      <div className="p-4 md:p-8">
        <div className="mb-6 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Client Management</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">Manage all registered clients</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600">
                Total Clients
              </CardTitle>
              <Users className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold">{clients.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600">
                Active Clients
              </CardTitle>
              <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold">
                {clients.filter(c => c.isActive).length}
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2 md:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600">
                Verified Clients
              </CardTitle>
              <Mail className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold">
                {clients.filter(c => c.isVerified).length}
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
                placeholder="Search by company name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Clients Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                All Clients ({filteredClients.length})
              </CardTitle>
              <ViewToggle view={viewMode} onViewChange={setViewMode} />
            </div>
          </CardHeader>
          <CardContent>
            {filteredClients.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm ? 'No clients match your search' : 'No clients registered yet'}
                </p>
              </div>
            ) : (
              <>
                {/* Grid/Table View */}
                <div className={`${viewMode === 'grid' ? 'block' : 'hidden'}`}>
                  <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-white z-10">
                        <TableRow>
                          <TableHead>Company Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Registered</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Email Verified</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredClients.map(client => (
                          <TableRow key={client.id}>
                            <TableCell className="font-medium">{client.companyName}</TableCell>
                            <TableCell>{client.email}</TableCell>
                            <TableCell>
                              {new Date(client.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${client.isActive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                                }`}>
                                {client.isActive ? (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Active
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Inactive
                                  </>
                                )}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${client.isVerified
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                {client.isVerified ? (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Verified
                                  </>
                                ) : (
                                  <>
                                    <Mail className="h-3 w-3 mr-1" />
                                    Pending
                                  </>
                                )}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant={client.isActive ? 'destructive' : 'default'}
                                  size="sm"
                                  onClick={() => handleToggleActive(client.id, client.isActive)}
                                >
                                  {client.isActive ? 'Deactivate' : 'Activate'}
                                </Button>
                                <Button
                                  variant={client.isVerified ? 'outline' : 'default'}
                                  size="sm"
                                  onClick={() => handleToggleVerified(client.id, client.isVerified)}
                                >
                                  {client.isVerified ? 'Unverify' : 'Verify'}
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
                <div className={`${viewMode === 'card' ? 'block' : 'hidden'} space-y-4 max-h-[600px] overflow-y-auto`}>
                  {filteredClients.map(client => (
                    <Card key={client.id}>
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-600">Company</p>
                            <p className="font-semibold">{client.companyName}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Email</p>
                            <p className="text-sm">{client.email}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Status</p>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${client.isActive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                                }`}>
                                {client.isActive ? (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Active
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Inactive
                                  </>
                                )}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Email</p>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${client.isVerified
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                {client.isVerified ? (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Verified
                                  </>
                                ) : (
                                  <>
                                    <Mail className="h-3 w-3 mr-1" />
                                    Pending
                                  </>
                                )}
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-2">Registered</p>
                            <p className="text-sm">{new Date(client.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button
                              variant={client.isActive ? 'destructive' : 'default'}
                              size="sm"
                              className="flex-1"
                              onClick={() => handleToggleActive(client.id, client.isActive)}
                            >
                              {client.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button
                              variant={client.isVerified ? 'outline' : 'default'}
                              size="sm"
                              className="flex-1"
                              onClick={() => handleToggleVerified(client.id, client.isVerified)}
                            >
                              {client.isVerified ? 'Unverify' : 'Verify'}
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
      </div>
    </DashboardLayout>
  );
}
