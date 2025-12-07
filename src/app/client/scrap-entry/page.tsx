'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiClient } from '@/lib/api-client';
import { ScrapCategory, ScrapSubCategory, ScrapEntry, Department, Machine, Unit } from '@/lib/types';
import { Plus, FileText, Package, Calendar } from 'lucide-react';

export default function ScrapEntryPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'job-based' | 'general'>('job-based');

  // Master data
  const [categories, setCategories] = useState<ScrapCategory[]>([]);
  const [subCategories, setSubCategories] = useState<ScrapSubCategory[]>([]);
  const [filteredSubCategories, setFilteredSubCategories] = useState<ScrapSubCategory[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [filteredMachines, setFilteredMachines] = useState<Machine[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  // Job-Based Entry State
  const [jobEntry, setJobEntry] = useState({
    jobNumber: '',
    categoryId: '',
    subCategoryId: '',
    departmentId: '',
    machineId: '',
    quantity: '',
    unit: '',
    rate: '',
    remarks: '',
  });

  // General Entry State
  const [generalEntry, setGeneralEntry] = useState({
    categoryId: '',
    subCategoryId: '',
    departmentId: '',
    machineId: '',
    quantity: '',
    unit: '',
    rate: '',
    remarks: '',
  });

  // Recent Entries
  const [recentEntries, setRecentEntries] = useState<ScrapEntry[]>([]);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [cats, subs, entries, depts, machs, unitsData] = await Promise.all([
        apiClient.getCategories(),
        apiClient.getSubCategories(),
        apiClient.getScrapEntries(),
        apiClient.getDepartments(),
        apiClient.getMachines(),
        apiClient.getUnits(),
      ]);

      setCategories(cats as ScrapCategory[]);
      setSubCategories(subs as ScrapSubCategory[]);
      setDepartments(depts as Department[]);
      setMachines(machs as Machine[]);
      setUnits(unitsData as Unit[]);

      // Filter entries for current user and get recent 10
      if (user) {
        const userEntries = (entries as ScrapEntry[])
          .filter((e: any) => e.createdBy === user.id)
          .slice(0, 10);
        setRecentEntries(userEntries);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Handle category change - filter sub-categories
  const handleJobCategoryChange = (categoryId: string) => {
    setJobEntry({ ...jobEntry, categoryId, subCategoryId: '' });
    const filtered = subCategories.filter(sub => sub.categoryId === parseInt(categoryId));
    setFilteredSubCategories(filtered);

    // Auto-populate rate from category
    const cat = categories.find(c => c.id === parseInt(categoryId));
    if (cat) {
      setJobEntry(prev => ({ ...prev, rate: cat.marketRate.toString(), unit: cat.unit as any }));
    }
  };

  const handleGeneralCategoryChange = (categoryId: string) => {
    setGeneralEntry({ ...generalEntry, categoryId, subCategoryId: '' });
    const filtered = subCategories.filter(sub => sub.categoryId === parseInt(categoryId));
    setFilteredSubCategories(filtered);

    // Auto-populate rate from category
    const cat = categories.find(c => c.id === parseInt(categoryId));
    if (cat) {
      setGeneralEntry(prev => ({ ...prev, rate: cat.marketRate.toString(), unit: cat.unit as any }));
    }
  };

  // Handle department change - filter machines
  const handleJobDepartmentChange = (departmentId: string) => {
    setJobEntry({ ...jobEntry, departmentId, machineId: '' });
    const filtered = machines.filter(m => m.departmentId === parseInt(departmentId));
    setFilteredMachines(filtered);
  };

  const handleGeneralDepartmentChange = (departmentId: string) => {
    setGeneralEntry({ ...generalEntry, departmentId, machineId: '' });
    const filtered = machines.filter(m => m.departmentId === parseInt(departmentId));
    setFilteredMachines(filtered);
  };

  const handleJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const totalValue = parseFloat(jobEntry.quantity) * parseFloat(jobEntry.rate);

      await apiClient.createScrapEntry({
        categoryId: parseInt(jobEntry.categoryId),
        subCategoryId: jobEntry.subCategoryId ? parseInt(jobEntry.subCategoryId) : undefined,
        departmentId: parseInt(jobEntry.departmentId),
        machineId: jobEntry.machineId ? parseInt(jobEntry.machineId) : undefined,
        quantity: parseFloat(jobEntry.quantity),
        unit: jobEntry.unit,
        rate: parseFloat(jobEntry.rate),
        totalValue,
        entryType: 'job-based',
        jobNumber: jobEntry.jobNumber,
        remarks: jobEntry.remarks,
        createdBy: user.id,
      });

      // Update stock
      await apiClient.updateStock({
        categoryId: parseInt(jobEntry.categoryId),
        subCategoryId: jobEntry.subCategoryId ? parseInt(jobEntry.subCategoryId) : undefined,
        userId: user.id,
        quantity: parseFloat(jobEntry.quantity),
        unit: jobEntry.unit,
        rate: parseFloat(jobEntry.rate),
      });

      // Reset form
      setJobEntry({
        jobNumber: '',
        categoryId: '',
        subCategoryId: '',
        departmentId: '',
        machineId: '',
        quantity: '',
        unit: '',
        rate: '',
        remarks: '',
      });
      setFilteredSubCategories([]);
      setFilteredMachines([]);

      // Reload data to show new entry
      await loadData();
    } catch (error) {
      console.error('Error creating scrap entry:', error);
    }
  };

  const handleGeneralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const totalValue = parseFloat(generalEntry.quantity) * parseFloat(generalEntry.rate);

      await apiClient.createScrapEntry({
        categoryId: parseInt(generalEntry.categoryId),
        subCategoryId: generalEntry.subCategoryId ? parseInt(generalEntry.subCategoryId) : undefined,
        departmentId: parseInt(generalEntry.departmentId),
        machineId: generalEntry.machineId ? parseInt(generalEntry.machineId) : undefined,
        quantity: parseFloat(generalEntry.quantity),
        unit: generalEntry.unit,
        rate: parseFloat(generalEntry.rate),
        totalValue,
        entryType: 'general',
        remarks: generalEntry.remarks,
        createdBy: user.id,
      });

      // Update stock
      await apiClient.updateStock({
        categoryId: parseInt(generalEntry.categoryId),
        subCategoryId: generalEntry.subCategoryId ? parseInt(generalEntry.subCategoryId) : undefined,
        userId: user.id,
        quantity: parseFloat(generalEntry.quantity),
        unit: generalEntry.unit,
        rate: parseFloat(generalEntry.rate),
      });

      // Reset form
      setGeneralEntry({
        categoryId: '',
        subCategoryId: '',
        departmentId: '',
        machineId: '',
        quantity: '',
        unit: '',
        rate: '',
        remarks: '',
      });
      setFilteredSubCategories([]);
      setFilteredMachines([]);

      // Reload data to show new entry
      await loadData();
    } catch (error) {
      console.error('Error creating scrap entry:', error);
    }
  };

  const getCategoryName = (catId: number) => {
    return categories.find(c => c.id === catId)?.name || 'N/A';
  };

  const getSubCategoryName = (subId?: number) => {
    if (!subId) return '-';
    return subCategories.find(s => s.id === subId)?.name || '-';
  };

  const getDepartmentName = (deptId: number) => {
    return departments.find(d => d.id === deptId)?.name || 'N/A';
  };

  const getMachineName = (machId?: number) => {
    if (!machId) return '-';
    return machines.find(m => m.id === machId)?.name || '-';
  };

  return (
    <DashboardLayout requiredRole="client">
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Scrap Entry</h1>
          <p className="text-gray-600 mt-1">Add scrap inflow to inventory</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b">
          <button
            className={`pb-3 px-4 font-medium flex items-center gap-2 ${activeTab === 'job-based'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-500 hover:text-gray-700'
              }`}
            onClick={() => setActiveTab('job-based')}
          >
            <FileText className="h-4 w-4" />
            Job-Based Entry
          </button>
          <button
            className={`pb-3 px-4 font-medium flex items-center gap-2 ${activeTab === 'general'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-500 hover:text-gray-700'
              }`}
            onClick={() => setActiveTab('general')}
          >
            <Package className="h-4 w-4" />
            General Entry
          </button>
        </div>

        {/* Job-Based Entry Tab */}
        {activeTab === 'job-based' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Add Job-Based Scrap Entry
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleJobSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="jobNumber">Job Number *</Label>
                      <Input
                        id="jobNumber"
                        value={jobEntry.jobNumber}
                        onChange={(e) => setJobEntry({ ...jobEntry, jobNumber: e.target.value })}
                        required
                        placeholder="e.g., JOB-2024-001"
                      />
                    </div>

                    <div>
                      <Label htmlFor="jobCategory">Category *</Label>
                      <Select
                        id="jobCategory"
                        value={jobEntry.categoryId}
                        onChange={(e) => handleJobCategoryChange(e.target.value)}
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name} (Rs.{cat.marketRate}/{cat.unit})
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="jobSubCategory">Sub-Category</Label>
                      <Select
                        id="jobSubCategory"
                        value={jobEntry.subCategoryId}
                        onChange={(e) => setJobEntry({ ...jobEntry, subCategoryId: e.target.value })}
                        disabled={!jobEntry.categoryId}
                      >
                        <option value="">Select Sub-Category (Optional)</option>
                        {filteredSubCategories.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.name} {sub.size ? `- ${sub.size}` : ''}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="jobDepartment">Department *</Label>
                      <Select
                        id="jobDepartment"
                        value={jobEntry.departmentId}
                        onChange={(e) => handleJobDepartmentChange(e.target.value)}
                        required
                      >
                        <option value="">Select Department</option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="jobMachine">Machine</Label>
                      <Select
                        id="jobMachine"
                        value={jobEntry.machineId}
                        onChange={(e) => setJobEntry({ ...jobEntry, machineId: e.target.value })}
                        disabled={!jobEntry.departmentId}
                      >
                        <option value="">Select Machine (Optional)</option>
                        {filteredMachines.map((machine) => (
                          <option key={machine.id} value={machine.id}>
                            {machine.name} {machine.model ? `- ${machine.model}` : ''}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="jobQuantity">Quantity *</Label>
                      <Input
                        id="jobQuantity"
                        type="number"
                        step="0.01"
                        value={jobEntry.quantity}
                        onChange={(e) => setJobEntry({ ...jobEntry, quantity: e.target.value })}
                        required
                        placeholder="e.g., 50"
                      />
                    </div>

                    <div>
                      <Label htmlFor="jobUnit">Unit *</Label>
                      <Select
                        id="jobUnit"
                        value={jobEntry.unit}
                        onChange={(e) => setJobEntry({ ...jobEntry, unit: e.target.value as any })}
                        required
                      >
                        <option value="">Select Unit</option>
                        {units.map((unit) => (
                          <option key={unit.id} value={unit.symbol}>
                            {unit.name} ({unit.symbol})
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="jobRate">Rate (Rs. per unit) *</Label>
                      <Input
                        id="jobRate"
                        type="number"
                        step="0.01"
                        value={jobEntry.rate}
                        onChange={(e) => setJobEntry({ ...jobEntry, rate: e.target.value })}
                        required
                        disabled
                        placeholder="Auto-filled from category"
                        className="bg-gray-100 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="jobRemarks">Remarks</Label>
                    <Textarea
                      id="jobRemarks"
                      value={jobEntry.remarks}
                      onChange={(e) => setJobEntry({ ...jobEntry, remarks: e.target.value })}
                      placeholder="Optional notes about this entry"
                      rows={2}
                    />
                  </div>

                  {jobEntry.quantity && jobEntry.rate && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                      <p className="text-sm font-medium text-blue-900">
                        Total Value: Rs.{(parseFloat(jobEntry.quantity) * parseFloat(jobEntry.rate)).toFixed(2)}
                      </p>
                    </div>
                  )}

                  <Button type="submit" className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Job-Based Entry
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* General Entry Tab */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Add General Scrap Entry
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleGeneralSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="generalCategory">Category *</Label>
                      <Select
                        id="generalCategory"
                        value={generalEntry.categoryId}
                        onChange={(e) => handleGeneralCategoryChange(e.target.value)}
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name} (Rs.{cat.marketRate}/{cat.unit})
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="generalSubCategory">Sub-Category</Label>
                      <Select
                        id="generalSubCategory"
                        value={generalEntry.subCategoryId}
                        onChange={(e) => setGeneralEntry({ ...generalEntry, subCategoryId: e.target.value })}
                        disabled={!generalEntry.categoryId}
                      >
                        <option value="">Select Sub-Category (Optional)</option>
                        {filteredSubCategories.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.name} {sub.size ? `- ${sub.size}` : ''}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="generalDepartment">Department *</Label>
                      <Select
                        id="generalDepartment"
                        value={generalEntry.departmentId}
                        onChange={(e) => handleGeneralDepartmentChange(e.target.value)}
                        required
                      >
                        <option value="">Select Department</option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="generalMachine">Machine</Label>
                      <Select
                        id="generalMachine"
                        value={generalEntry.machineId}
                        onChange={(e) => setGeneralEntry({ ...generalEntry, machineId: e.target.value })}
                        disabled={!generalEntry.departmentId}
                      >
                        <option value="">Select Machine (Optional)</option>
                        {filteredMachines.map((machine) => (
                          <option key={machine.id} value={machine.id}>
                            {machine.name} {machine.model ? `- ${machine.model}` : ''}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="generalQuantity">Quantity *</Label>
                      <Input
                        id="generalQuantity"
                        type="number"
                        step="0.01"
                        value={generalEntry.quantity}
                        onChange={(e) => setGeneralEntry({ ...generalEntry, quantity: e.target.value })}
                        required
                        placeholder="e.g., 50"
                      />
                    </div>

                    <div>
                      <Label htmlFor="generalUnit">Unit *</Label>
                      <Select
                        id="generalUnit"
                        value={generalEntry.unit}
                        onChange={(e) => setGeneralEntry({ ...generalEntry, unit: e.target.value as any })}
                        required
                      >
                        <option value="">Select Unit</option>
                        {units.map((unit) => (
                          <option key={unit.id} value={unit.symbol}>
                            {unit.name} ({unit.symbol})
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="generalRate">Rate (Rs. per unit) *</Label>
                      <Input
                        id="generalRate"
                        type="number"
                        step="0.01"
                        value={generalEntry.rate}
                        onChange={(e) => setGeneralEntry({ ...generalEntry, rate: e.target.value })}
                        required
                        disabled
                        placeholder="Auto-filled from category"
                        className="bg-gray-100 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="generalRemarks">Remarks</Label>
                    <Textarea
                      id="generalRemarks"
                      value={generalEntry.remarks}
                      onChange={(e) => setGeneralEntry({ ...generalEntry, remarks: e.target.value })}
                      placeholder="Optional notes about this entry"
                      rows={2}
                    />
                  </div>

                  {generalEntry.quantity && generalEntry.rate && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                      <p className="text-sm font-medium text-blue-900">
                        Total Value: Rs.{(parseFloat(generalEntry.quantity) * parseFloat(generalEntry.rate)).toFixed(2)}
                      </p>
                    </div>
                  )}

                  <Button type="submit" className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add General Entry
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Entries */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Entries ({recentEntries.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentEntries.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No entries yet. Add your first scrap entry above.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Job Number</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Sub-Category</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Machine</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Total Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{new Date(entry.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${entry.entryType === 'job-based'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                          }`}>
                          {entry.entryType}
                        </span>
                      </TableCell>
                      <TableCell>{entry.jobNumber || '-'}</TableCell>
                      <TableCell className="font-medium">{getCategoryName(entry.categoryId)}</TableCell>
                      <TableCell>{getSubCategoryName(entry.subCategoryId)}</TableCell>
                      <TableCell>{getDepartmentName(entry.departmentId)}</TableCell>
                      <TableCell>{getMachineName(entry.machineId)}</TableCell>
                      <TableCell>{entry.quantity} {entry.unit}</TableCell>
                      <TableCell>Rs.{entry.rate}</TableCell>
                      <TableCell className="font-semibold">Rs.{(entry.totalValue || 0).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
