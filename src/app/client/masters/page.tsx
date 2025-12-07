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
import { ScrapCategory, ScrapSubCategory, Unit, Department, Machine } from '@/lib/types';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { confirmDelete, showSuccess, showError } from '@/lib/toast';

export default function MastersPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'category' | 'subcategory' | 'unit' | 'department' | 'machine'>('unit');

  // Category state
  const [categories, setCategories] = useState<ScrapCategory[]>([]);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    marketRate: '',
    unit: '',
  });

  // Sub-category state
  const [subCategories, setSubCategories] = useState<ScrapSubCategory[]>([]);
  const [editingSubCategoryId, setEditingSubCategoryId] = useState<number | null>(null);
  const [newSubCategory, setNewSubCategory] = useState({
    categoryId: '',
    name: '',
    size: '',
    unit: '',
    remarks: '',
  });

  // Unit state
  const [units, setUnits] = useState<Unit[]>([]);
  const [editingUnitId, setEditingUnitId] = useState<number | null>(null);
  const [newUnit, setNewUnit] = useState({
    name: '',
    symbol: '',
  });

  // Department state
  const [departments, setDepartments] = useState<Department[]>([]);
  const [editingDepartmentId, setEditingDepartmentId] = useState<number | null>(null);
  const [newDepartment, setNewDepartment] = useState({
    name: '',
    description: '',
  });

  // Machine state
  const [machines, setMachines] = useState<Machine[]>([]);
  const [editingMachineId, setEditingMachineId] = useState<number | null>(null);
  const [newMachine, setNewMachine] = useState({
    name: '',
    departmentId: '',
    model: '',
    manufacturer: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user) return;

    try {
      const [cats, subCats, unitsData, depts, machs] = await Promise.all([
        apiClient.getCategories(user.id),
        apiClient.getSubCategories(user.id),
        apiClient.getUnits(user.id),
        apiClient.getDepartments(user.id),
        apiClient.getMachines(user.id),
      ]);
      setCategories(cats as ScrapCategory[]);
      setSubCategories(subCats as ScrapSubCategory[]);
      setUnits(unitsData as Unit[]);
      setDepartments(depts as Department[]);
      setMachines(machs as Machine[]);
    } catch (error) {
      console.error('Error loading master data:', error);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingCategoryId) {
        // Update existing category
        await apiClient.updateCategory(editingCategoryId, {
          name: newCategory.name,
          marketRate: parseFloat(newCategory.marketRate),
          unit: newCategory.unit,
        });
        setEditingCategoryId(null);
      } else {
        // Create new category
        await apiClient.createCategory({
          name: newCategory.name,
          marketRate: parseFloat(newCategory.marketRate),
          unit: newCategory.unit,
          createdBy: user!.id,
        });
      }

      setNewCategory({ name: '', marketRate: '', unit: '' });
      await loadData();
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleEditCategory = (category: ScrapCategory) => {
    setNewCategory({
      name: category.name,
      marketRate: category.marketRate.toString(),
      unit: category.unit,
    });
    setEditingCategoryId(category.id);
  };

  const handleCancelEditCategory = () => {
    setNewCategory({ name: '', marketRate: '', unit: '' });
    setEditingCategoryId(null);
  };

  const handleDeleteCategory = (id: number) => {
    confirmDelete('Are you sure you want to delete this category?', async () => {
      try {
        await apiClient.deleteCategory(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    });
  };

  const handleAddSubCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingSubCategoryId) {
        // Update existing sub-category
        await apiClient.updateSubCategory(editingSubCategoryId, {
          categoryId: parseInt(newSubCategory.categoryId),
          name: newSubCategory.name,
          size: newSubCategory.size,
          unit: newSubCategory.unit,
          remarks: newSubCategory.remarks,
        });
        setEditingSubCategoryId(null);
      } else {
        // Create new sub-category with all fields
        await apiClient.createSubCategory({
          categoryId: parseInt(newSubCategory.categoryId),
          name: newSubCategory.name,
          size: newSubCategory.size,
          unit: newSubCategory.unit,
          remarks: newSubCategory.remarks,
          createdBy: user!.id,
        });
      }

      setNewSubCategory({
        categoryId: '',
        name: '',
        size: '',
        unit: '',
        remarks: '',
      });
      await loadData();
    } catch (error) {
      console.error('Error saving subcategory:', error);
    }
  };

  const handleEditSubCategory = (subCategory: ScrapSubCategory) => {
    setNewSubCategory({
      categoryId: subCategory.categoryId.toString(),
      name: subCategory.name,
      size: subCategory.size || '',
      unit: subCategory.unit,
      remarks: subCategory.remarks || '',
    });
    setEditingSubCategoryId(subCategory.id);
  };

  const handleCancelEditSubCategory = () => {
    setNewSubCategory({
      categoryId: '',
      name: '',
      size: '',
      unit: '',
      remarks: '',
    });
    setEditingSubCategoryId(null);
  };

  const handleDeleteSubCategory = (id: number) => {
    confirmDelete('Are you sure you want to delete this sub-category?', async () => {
      try {
        await apiClient.deleteSubCategory(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting subcategory:', error);
      }
    });
  };

  // Unit handlers
  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingUnitId) {
        // Update existing unit
        await apiClient.updateUnit(editingUnitId, {
          name: newUnit.name,
          symbol: newUnit.symbol,
        });
        setEditingUnitId(null);
      } else {
        // Create new unit
        await apiClient.createUnit({
          name: newUnit.name,
          symbol: newUnit.symbol,
          createdBy: user!.id,
        });
      }

      setNewUnit({ name: '', symbol: '' });
      await loadData();
    } catch (error) {
      console.error('Error saving unit:', error);
    }
  };

  const handleEditUnit = (unit: Unit) => {
    setNewUnit({
      name: unit.name,
      symbol: unit.symbol,
    });
    setEditingUnitId(unit.id);
  };

  const handleCancelEditUnit = () => {
    setNewUnit({ name: '', symbol: '' });
    setEditingUnitId(null);
  };

  const handleDeleteUnit = (id: number) => {
    confirmDelete('Are you sure you want to delete this unit?', async () => {
      try {
        await apiClient.deleteUnit(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting unit:', error);
      }
    });
  };

  // Department handlers
  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingDepartmentId) {
        // Update existing department
        await apiClient.updateDepartment(editingDepartmentId, {
          name: newDepartment.name,
          description: newDepartment.description,
        });
        setEditingDepartmentId(null);
      } else {
        // Create new department
        await apiClient.createDepartment({
          name: newDepartment.name,
          description: newDepartment.description,
          createdBy: user!.id,
        });
      }

      setNewDepartment({ name: '', description: '' });
      await loadData();
    } catch (error) {
      console.error('Error saving department:', error);
    }
  };

  const handleEditDepartment = (dept: Department) => {
    setNewDepartment({
      name: dept.name,
      description: dept.description || '',
    });
    setEditingDepartmentId(dept.id);
  };

  const handleCancelEditDepartment = () => {
    setNewDepartment({ name: '', description: '' });
    setEditingDepartmentId(null);
  };

  const handleDeleteDepartment = (id: number) => {
    confirmDelete('Are you sure you want to delete this department?', async () => {
      try {
        await apiClient.deleteDepartment(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting department:', error);
      }
    });
  };

  // Machine handlers
  const handleAddMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingMachineId) {
        // Update existing machine
        await apiClient.updateMachine(editingMachineId, {
          name: newMachine.name,
          departmentId: parseInt(newMachine.departmentId),
          model: newMachine.model,
          manufacturer: newMachine.manufacturer,
        });
        setEditingMachineId(null);
      } else {
        // Create new machine
        await apiClient.createMachine({
          name: newMachine.name,
          departmentId: parseInt(newMachine.departmentId),
          model: newMachine.model,
          manufacturer: newMachine.manufacturer,
          createdBy: user!.id,
        });
      }

      setNewMachine({ name: '', departmentId: '', model: '', manufacturer: '' });
      await loadData();
    } catch (error) {
      console.error('Error saving machine:', error);
    }
  };

  const handleEditMachine = (machine: Machine) => {
    setNewMachine({
      name: machine.name,
      departmentId: machine.departmentId.toString(),
      model: machine.model || '',
      manufacturer: machine.manufacturer || '',
    });
    setEditingMachineId(machine.id);
  };

  const handleCancelEditMachine = () => {
    setNewMachine({ name: '', departmentId: '', model: '', manufacturer: '' });
    setEditingMachineId(null);
  };

  const handleDeleteMachine = (id: number) => {
    confirmDelete('Are you sure you want to delete this machine?', async () => {
      try {
        await apiClient.deleteMachine(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting machine:', error);
      }
    });
  };

  return (
    <DashboardLayout requiredRole="client">
      <div className="p-4 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6">Masters</h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b overflow-x-auto">
          <button
            className={`pb-3 px-4 font-medium whitespace-nowrap ${activeTab === 'unit'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-500 hover:text-gray-700'
              }`}
            onClick={() => setActiveTab('unit')}
          >
            Units
          </button>
          <button
            className={`pb-3 px-4 font-medium whitespace-nowrap ${activeTab === 'department'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-500 hover:text-gray-700'
              }`}
            onClick={() => setActiveTab('department')}
          >
            Departments
          </button>
          <button
            className={`pb-3 px-4 font-medium whitespace-nowrap ${activeTab === 'machine'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-500 hover:text-gray-700'
              }`}
            onClick={() => setActiveTab('machine')}
          >
            Machines
          </button>
          <button
            className={`pb-3 px-4 font-medium whitespace-nowrap ${activeTab === 'category'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-500 hover:text-gray-700'
              }`}
            onClick={() => setActiveTab('category')}
          >
            Categories
          </button>
          <button
            className={`pb-3 px-4 font-medium whitespace-nowrap ${activeTab === 'subcategory'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-500 hover:text-gray-700'
              }`}
            onClick={() => setActiveTab('subcategory')}
          >
            Sub-Categories
          </button>
        </div>

        {/* Category Tab */}
        {activeTab === 'category' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{editingCategoryId ? 'Edit Category' : 'Add New Category'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddCategory} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="catName">Category Name *</Label>
                    <Input
                      id="catName"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      required
                      placeholder="e.g., Paper Sheets"
                    />
                  </div>
                  <div>
                    <Label htmlFor="marketRate">Market Rate (Rs.) *</Label>
                    <Input
                      id="marketRate"
                      type="number"
                      step="0.01"
                      value={newCategory.marketRate}
                      onChange={(e) => setNewCategory({ ...newCategory, marketRate: e.target.value })}
                      required
                      placeholder="e.g., 25"
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit">Unit *</Label>
                    <Select
                      id="unit"
                      value={newCategory.unit}
                      onChange={(e) => setNewCategory({ ...newCategory, unit: e.target.value })}
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
                  <div className="flex items-end gap-2">
                    {editingCategoryId ? (
                      <>
                        <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                          Update Category
                        </Button>
                        <Button type="button" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50" onClick={handleCancelEditCategory}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                        <Plus className="h-4 w-4 mr-2" /> Add Category
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Categories List ({categories.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Market Rate</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((cat) => (
                      <TableRow key={cat.id}>
                        <TableCell className="font-medium">{cat.name}</TableCell>
                        <TableCell>Rs.{cat.marketRate}</TableCell>
                        <TableCell>{cat.unit}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditCategory(cat)}
                            >
                              <Pencil className="h-4 w-4 text-blue-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCategory(cat.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sub-Category Tab */}
        {activeTab === 'subcategory' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{editingSubCategoryId ? 'Edit Sub-Category' : 'Add New Sub-Category'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddSubCategory} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      id="category"
                      value={newSubCategory.categoryId}
                      onChange={(e) => setNewSubCategory({ ...newSubCategory, categoryId: e.target.value })}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="subName">Sub-Category Name *</Label>
                    <Input
                      id="subName"
                      value={newSubCategory.name}
                      onChange={(e) => setNewSubCategory({ ...newSubCategory, name: e.target.value })}
                      required
                      placeholder="e.g., A4 White Paper"
                    />
                  </div>
                  <div>
                    <Label htmlFor="size">Size/Dimensions</Label>
                    <Input
                      id="size"
                      value={newSubCategory.size}
                      onChange={(e) => setNewSubCategory({ ...newSubCategory, size: e.target.value })}
                      placeholder="e.g., 210x297mm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="subUnit">Unit *</Label>
                    <Select
                      id="subUnit"
                      value={newSubCategory.unit}
                      onChange={(e) => setNewSubCategory({ ...newSubCategory, unit: e.target.value as any })}
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
                    <Label htmlFor="remarks">Remarks</Label>
                    <Input
                      id="remarks"
                      value={newSubCategory.remarks}
                      onChange={(e) => setNewSubCategory({ ...newSubCategory, remarks: e.target.value })}
                      placeholder="Optional notes"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    {editingSubCategoryId ? (
                      <>
                        <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                          Update Sub-Category
                        </Button>
                        <Button type="button" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50" onClick={handleCancelEditSubCategory}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                        <Plus className="h-4 w-4 mr-2" /> Add Sub-Category
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sub-Categories List ({subCategories.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subCategories.map((sub) => {
                      const cat = categories.find(c => c.id === sub.categoryId);
                      return (
                        <TableRow key={sub.id}>
                          <TableCell className="font-medium">{cat?.name}</TableCell>
                          <TableCell>{sub.name}</TableCell>
                          <TableCell>{sub.size || '-'}</TableCell>
                          <TableCell>{sub.unit}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditSubCategory(sub)}
                              >
                                <Pencil className="h-4 w-4 text-blue-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSubCategory(sub.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Unit Tab */}
        {activeTab === 'unit' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{editingUnitId ? 'Edit Unit' : 'Add New Unit'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddUnit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="unitName">Unit Name *</Label>
                    <Input
                      id="unitName"
                      value={newUnit.name}
                      onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })}
                      required
                      placeholder="e.g., Kilogram"
                    />
                  </div>
                  <div>
                    <Label htmlFor="symbol">Symbol *</Label>
                    <Input
                      id="symbol"
                      value={newUnit.symbol}
                      onChange={(e) => setNewUnit({ ...newUnit, symbol: e.target.value })}
                      required
                      placeholder="e.g., Kg"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    {editingUnitId ? (
                      <>
                        <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                          Update Unit
                        </Button>
                        <Button type="button" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50" onClick={handleCancelEditUnit}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                        <Plus className="h-4 w-4 mr-2" /> Add Unit
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Units List ({units.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Symbol</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {units.map((unit) => (
                      <TableRow key={unit.id}>
                        <TableCell className="font-medium">{unit.name}</TableCell>
                        <TableCell>{unit.symbol}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditUnit(unit)}
                            >
                              <Pencil className="h-4 w-4 text-blue-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUnit(unit.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Department Tab */}
        {activeTab === 'department' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{editingDepartmentId ? 'Edit Department' : 'Add New Department'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddDepartment} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="deptName">Department Name *</Label>
                    <Input
                      id="deptName"
                      value={newDepartment.name}
                      onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                      required
                      placeholder="e.g., Printing"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={newDepartment.description}
                      onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })}
                      placeholder="Department description"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    {editingDepartmentId ? (
                      <>
                        <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                          Update Department
                        </Button>
                        <Button type="button" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50" onClick={handleCancelEditDepartment}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                        <Plus className="h-4 w-4 mr-2" /> Add Department
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Departments List ({departments.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departments.map((dept) => (
                      <TableRow key={dept.id}>
                        <TableCell className="font-medium">{dept.name}</TableCell>
                        <TableCell>{dept.description || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditDepartment(dept)}
                            >
                              <Pencil className="h-4 w-4 text-blue-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteDepartment(dept.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Machine Tab */}
        {activeTab === 'machine' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{editingMachineId ? 'Edit Machine' : 'Add New Machine'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddMachine} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="machineName">Machine Name *</Label>
                    <Input
                      id="machineName"
                      value={newMachine.name}
                      onChange={(e) => setNewMachine({ ...newMachine, name: e.target.value })}
                      required
                      placeholder="e.g., Offset Printer 1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="department">Department *</Label>
                    <Select
                      id="department"
                      value={newMachine.departmentId}
                      onChange={(e) => setNewMachine({ ...newMachine, departmentId: e.target.value })}
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
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      value={newMachine.model}
                      onChange={(e) => setNewMachine({ ...newMachine, model: e.target.value })}
                      placeholder="e.g., HP-5000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="manufacturer">Manufacturer</Label>
                    <Input
                      id="manufacturer"
                      value={newMachine.manufacturer}
                      onChange={(e) => setNewMachine({ ...newMachine, manufacturer: e.target.value })}
                      placeholder="e.g., Heidelberg"
                    />
                  </div>
                  <div className="flex items-end md:col-span-2 gap-2">
                    {editingMachineId ? (
                      <>
                        <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                          Update Machine
                        </Button>
                        <Button type="button" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50" onClick={handleCancelEditMachine}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                        <Plus className="h-4 w-4 mr-2" /> Add Machine
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Machines List ({machines.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Manufacturer</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {machines.map((machine) => {
                      const dept = departments.find(d => d.id === machine.departmentId);
                      return (
                        <TableRow key={machine.id}>
                          <TableCell className="font-medium">{machine.name}</TableCell>
                          <TableCell>{dept?.name}</TableCell>
                          <TableCell>{machine.model || '-'}</TableCell>
                          <TableCell>{machine.manufacturer || '-'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditMachine(machine)}
                              >
                                <Pencil className="h-4 w-4 text-blue-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteMachine(machine.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
