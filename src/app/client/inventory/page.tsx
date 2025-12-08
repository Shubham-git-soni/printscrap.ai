'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiClient } from '@/lib/api-client';
import { showError } from '@/lib/toast';
import { StockItem, ScrapCategory, ScrapSubCategory } from '@/lib/types';
import { Package, Search, TrendingUp, TrendingDown, IndianRupee } from 'lucide-react';

export default function InventoryPage() {
  const { user } = useAuth();
  const [stock, setStock] = useState<StockItem[]>([]);
  const [categories, setCategories] = useState<ScrapCategory[]>([]);
  const [subCategories, setSubCategories] = useState<ScrapSubCategory[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSubCategory, setFilterSubCategory] = useState('');
  const [filteredSubCategories, setFilteredSubCategories] = useState<ScrapSubCategory[]>([]);

  // Summary stats
  const [totalValue, setTotalValue] = useState(0);
  const [totalWeight, setTotalWeight] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      const [stockData, cats, subs] = await Promise.all([
        apiClient.getStock(user.id),
        apiClient.getCategories(user.id),
        apiClient.getSubCategories(user.id),
      ]) as [StockItem[], ScrapCategory[], ScrapSubCategory[]];

      setStock(stockData);
      setCategories(cats);
      setSubCategories(subs);

      // Calculate totals
      const value = stockData.reduce((sum, item) => sum + item.totalValue, 0);
      const weight = stockData.reduce((sum, item) => sum + item.availableStock, 0);

      setTotalValue(value);
      setTotalWeight(weight);
      setTotalItems(stockData.length);
    } catch (error) {
      console.error('Error loading inventory data:', error);
      // Set empty arrays on error
      setStock([]);
      setCategories([]);
      setSubCategories([]);
    }
  };

  const getCategoryName = (catId: number) => {
    return categories.find(c => c.id === catId)?.name || 'N/A';
  };

  const getSubCategoryName = (subId?: number) => {
    if (!subId) return '-';
    return subCategories.find(s => s.id === subId)?.name || '-';
  };

  const handleCategoryFilterChange = (categoryId: string) => {
    setFilterCategory(categoryId);
    setFilterSubCategory('');
    if (categoryId) {
      const subs = subCategories.filter(s => s.categoryId === parseInt(categoryId));
      setFilteredSubCategories(subs);
    } else {
      setFilteredSubCategories([]);
    }
  };

  // Calculate category-wise weight summary
  const getCategoryWiseWeight = () => {
    const categoryMap = new Map<number, { name: string; weight: number; value: number }>();

    stock.forEach(item => {
      const existing = categoryMap.get(item.categoryId);
      if (existing) {
        existing.weight += item.availableStock;
        existing.value += item.totalValue;
      } else {
        categoryMap.set(item.categoryId, {
          name: getCategoryName(item.categoryId),
          weight: item.availableStock,
          value: item.totalValue,
        });
      }
    });

    return Array.from(categoryMap.values()).sort((a, b) => b.weight - a.weight);
  };

  // Filter stock based on search and category
  const filteredStock = stock.filter(item => {
    const categoryName = getCategoryName(item.categoryId).toLowerCase();
    const subCategoryName = getSubCategoryName(item.subCategoryId).toLowerCase();
    const matchesSearch = categoryName.includes(searchTerm.toLowerCase()) ||
      subCategoryName.includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || item.categoryId === parseInt(filterCategory);
    const matchesSubCategory = !filterSubCategory || item.subCategoryId === parseInt(filterSubCategory);

    return matchesSearch && matchesCategory && matchesSubCategory;
  });

  const categoryWiseWeight = getCategoryWiseWeight();

  return (
    <DashboardLayout requiredRole="client">
      <div className="p-4 md:p-8">
        <div className="mb-4 md:mb-6">
          <h1 className="text-lg md:text-xl font-bold text-foreground">Inventory & Stock Ledger</h1>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-2 md:gap-6 mb-4 md:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 p-2 md:p-6">
              <CardTitle className="text-[10px] md:text-sm font-medium text-gray-600 dark:text-gray-400">
                Stock Value
              </CardTitle>
              <IndianRupee className="h-3 w-3 md:h-5 md:w-5 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent className="p-2 md:p-6 pt-0">
              <div className="text-sm md:text-2xl font-bold text-foreground">Rs.{totalValue.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 p-2 md:p-6">
              <CardTitle className="text-[10px] md:text-sm font-medium text-gray-600 dark:text-gray-400">
                Weight
              </CardTitle>
              <Package className="h-3 w-3 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent className="p-2 md:p-6 pt-0">
              <div className="text-sm md:text-2xl font-bold text-foreground">{totalWeight.toFixed(1)} Kg</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 p-2 md:p-6">
              <CardTitle className="text-[10px] md:text-sm font-medium text-gray-600 dark:text-gray-400">
                Items
              </CardTitle>
              <Package className="h-3 w-3 md:h-5 md:w-5 text-purple-600 dark:text-purple-400" />
            </CardHeader>
            <CardContent className="p-2 md:p-6 pt-0">
              <div className="text-sm md:text-2xl font-bold text-foreground">{totalItems}</div>
            </CardContent>
          </Card>
        </div>

        {/* Category-wise Weight Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Package className="h-5 w-5" />
              Category-wise Weight Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryWiseWeight.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">No stock available</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryWiseWeight.map((cat, idx) => (
                  <Card key={idx} className="border bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 dark:border-gray-700">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-foreground text-sm">{cat.name}</h3>
                        <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600 dark:text-gray-400">Weight:</span>
                          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{cat.weight.toFixed(2)} Kg</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600 dark:text-gray-400">Value:</span>
                          <span className="text-sm font-semibold text-green-600 dark:text-green-400">Rs.{cat.value.toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search">Search Stock</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <Input
                    id="search"
                    className="pl-10"
                    placeholder="Search by category or sub-category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="categoryFilter">Filter by Category</Label>
                <Select
                  id="categoryFilter"
                  value={filterCategory}
                  onChange={(e) => handleCategoryFilterChange(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="subCategoryFilter">Filter by Sub-Category</Label>
                <Select
                  id="subCategoryFilter"
                  value={filterSubCategory}
                  onChange={(e) => setFilterSubCategory(e.target.value)}
                  disabled={!filterCategory}
                >
                  <option value="">All Sub-Categories</option>
                  {filteredSubCategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stock Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Package className="h-5 w-5" />
              Stock Ledger ({filteredStock.length} items)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredStock.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm || filterCategory ? 'No stock items match your filters' : 'No stock available. Add scrap entries to build your inventory.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Sub-Category</TableHead>
                      <TableHead>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                          Total Inflow
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-1">
                          <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                          Total Outflow
                        </div>
                      </TableHead>
                      <TableHead>Available Stock</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Avg Rate</TableHead>
                      <TableHead className="text-right">Total Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStock.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{getCategoryName(item.categoryId)}</TableCell>
                        <TableCell>{getSubCategoryName(item.subCategoryId)}</TableCell>
                        <TableCell>
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            +{item.totalInflow.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-red-600 dark:text-red-400 font-medium">
                            -{item.totalOutflow.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`font-semibold ${item.availableStock > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                            }`}>
                            {item.availableStock.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell>Rs.{(item.averageRate || 0).toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <span className="font-bold text-green-600 dark:text-green-400">
                            Rs.{(item.totalValue || 0).toFixed(2)}
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

        {/* Stock Status Legend */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-gray-600 dark:text-gray-400">Inflow: Scrap entries added to inventory</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-gray-600 dark:text-gray-400">Outflow: Sales deducted from inventory</span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-gray-600 dark:text-gray-400">Available Stock: Inflow - Outflow</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
