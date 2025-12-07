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
          apiClient.getSales(user.id),
          apiClient.getCategories(user.id),
        ]) as [any[], any[], any[]];

        console.log('📊 Dashboard Data:', { stock, sales });

        // Calculate total scrap value (from stock totalValue)
        const totalValue = stock.reduce((sum: number, item: any) => {
          const value = parseFloat(item.totalValue) || 0;
          return sum + value;
        }, 0);

        // Calculate total revenue
        const totalRevenue = sales.reduce((sum: number, sale: any) => {
          const amount = parseFloat(sale.totalAmount) || 0;
          return sum + amount;
        }, 0);

        // Calculate total stock weight
        const totalWeight = stock.reduce((sum: number, item: any) => {
          const weight = parseFloat(item.availableStock) || 0;
          return sum + weight;
        }, 0);

        // Count unique stock items
        const stockCount = stock.length;

        console.log('📈 Stats:', { totalValue, totalRevenue, totalWeight, stockCount });

        setStats({
          totalScrapValue: totalValue,
          totalRevenue,
          totalStockWeight: totalWeight,
          totalStockCount: stockCount,
        });

        // Prepare category data for pie chart (only items with value > 0)
        const catData = stock
          .filter((item: any) => parseFloat(item.totalValue) > 0)
          .map((item: any) => ({
            name: item.categoryName || 'Unknown',
            value: Math.round(parseFloat(item.totalValue) || 0),
          }));

        console.log('🥧 Category Data:', catData);
        setCategoryData(catData);

        // Prepare weekly volume data from recent scrap entries
        const scrapEntries = await apiClient.getScrapEntries(user.id) as any[];
        const userEntries = scrapEntries.filter((e: any) => e.createdBy === user.id);
        const last7Days = userEntries.slice(0, 7).reverse();

        const weekData = last7Days.map((entry: any, index: number) => ({
          day: `Day ${index + 1}`,
          kg: parseFloat(entry.quantity) || 0,
        }));

        console.log('📅 Week Data:', weekData);
        setWeeklyData(weekData.length > 0 ? weekData : []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, [user]);

  return (
    <DashboardLayout requiredRole="client">
      <div className="p-4 md:p-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">Welcome back, {user?.companyName}!</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600">
                Total Estimated Scrap
              </CardTitle>
              <IndianRupee className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold">₹{stats.totalScrapValue.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1 hidden md:block">Current inventory value</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600">
                Total Revenue
              </CardTitle>
              <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold">Rs.{stats.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1 hidden md:block">From sales</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600">
                Total Stock Weight
              </CardTitle>
              <Weight className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold">{stats.totalStockWeight.toFixed(1)} Kg</div>
              <p className="text-xs text-gray-500 mt-1 hidden md:block">Available stock</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600">
                Stock Items
              </CardTitle>
              <Package className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold">{stats.totalStockCount}</div>
              <p className="text-xs text-gray-500 mt-1 hidden md:block">Different categories</p>
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
              {categoryData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No category data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(300, categoryData.length * 50)}>
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
                    <Tooltip formatter={(value) => `₹${value}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Weekly Volume */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Volume (Kg/Day)</CardTitle>
            </CardHeader>
            <CardContent>
              {weeklyData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No weekly data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(300, weeklyData.length * 40)}>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => `${value} Kg`} />
                    <Legend />
                    <Bar dataKey="kg" fill="#3b82f6" name="Weight (Kg)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
