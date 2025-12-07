'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api-client';
import { IndianRupee, Package, TrendingUp, Weight } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function ClientDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalScrapValue: 0,
    totalRevenue: 0,
    totalStockWeight: 0,
    totalStockCount: 0,
  });
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        // Get data from API
        const [stock, sales, categories] = await Promise.all([
          apiClient.getStock(user.id),
          apiClient.getSales(),
          apiClient.getCategories(),
        ]);

        // Calculate total scrap value
        const totalValue = stock.reduce((sum: number, item: any) => sum + (item.availableWeight * item.marketRate || 0), 0);

        // Calculate total revenue
        const totalRevenue = sales.reduce((sum: number, sale: any) => sum + sale.totalAmount, 0);

        // Calculate total stock weight
        const totalWeight = stock.reduce((sum: number, item: any) => sum + item.availableWeight, 0);

        // Count unique stock items
        const stockCount = stock.length;

        setStats({
          totalScrapValue: totalValue,
          totalRevenue,
          totalStockWeight: totalWeight,
          totalStockCount: stockCount,
        });

        // Prepare category data for pie chart
        const catData = stock.map((item: any) => ({
          name: item.categoryName || 'Unknown',
          value: Math.round(item.availableWeight * item.marketRate || 0),
        }));
        setCategoryData(catData);

        // Prepare weekly volume data from recent scrap entries
        const scrapEntries = await apiClient.getScrapEntries();
        const last7Days = scrapEntries.slice(0, 7).reverse();
        const weekData = last7Days.map((entry: any) => ({
          day: new Date(entry.entryDate).toLocaleDateString('en-US', { weekday: 'short' }),
          kg: entry.weight,
        }));
        setWeeklyData(weekData.length > 0 ? weekData : []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, [user]);

  return (
    <DashboardLayout requiredRole="client">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.companyName}!</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Estimated Scrap Value
              </CardTitle>
              <IndianRupee className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalScrapValue.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">Current inventory value</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Revenue
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rs.{stats.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">From sales</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Stock Weight
              </CardTitle>
              <Weight className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStockWeight.toFixed(1)} Kg</div>
              <p className="text-xs text-gray-500 mt-1">Available stock</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Stock Items
              </CardTitle>
              <Package className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStockCount}</div>
              <p className="text-xs text-gray-500 mt-1">Different categories</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Scrap by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `Rs.${value}`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Weekly Volume */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Volume (Kg/Day)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="kg" fill="#3b82f6" name="Weight (Kg)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
