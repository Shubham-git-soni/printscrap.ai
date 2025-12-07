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
import { apiClient } from '@/lib/api-client';
import { Plan } from '@/lib/types';
import { CreditCard, Plus, Trash2, CheckCircle } from 'lucide-react';
import { confirmDelete } from '@/lib/toast';

export default function PlansPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlan, setNewPlan] = useState({
    name: '',
    description: '',
    price: '',
    billingCycle: 'monthly' as 'monthly' | 'yearly',
    features: '',
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const allPlans = await apiClient.getPlans() as Plan[];
      setPlans(allPlans);
    } catch (error) {
      console.error('Error loading plans:', error);
    }
  };

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const featuresArray = newPlan.features
        .split('\n')
        .filter(f => f.trim() !== '')
        .map(f => f.trim());

      await apiClient.createPlan({
        name: newPlan.name,
        description: newPlan.description,
        price: parseFloat(newPlan.price),
        billingCycle: newPlan.billingCycle,
        features: featuresArray,
      });

      // Reset form
      setNewPlan({
        name: '',
        description: '',
        price: '',
        billingCycle: 'monthly',
        features: '',
      });
      setShowAddForm(false);
      await loadPlans();
    } catch (error) {
      console.error('Error creating plan:', error);
    }
  };

  const handleDelete = async (id: number) => {
    confirmDelete('Are you sure you want to delete this plan?', async () => {
      try {
        await apiClient.deletePlan(id);
        await loadPlans();
      } catch (error) {
        console.error('Error deleting plan:', error);
      }
    });
  };

  return (
    <DashboardLayout requiredRole="super_admin">
      <div className="p-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Plan Management</h1>
            <p className="text-gray-600 mt-1">Create and manage subscription plans</p>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="h-4 w-4 mr-2" />
            {showAddForm ? 'Cancel' : 'Add New Plan'}
          </Button>
        </div>

        {/* Add Plan Form */}
        {showAddForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddPlan} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="planName">Plan Name *</Label>
                    <Input
                      id="planName"
                      value={newPlan.name}
                      onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                      required
                      placeholder="e.g., Professional Plan"
                    />
                  </div>

                  <div>
                    <Label htmlFor="price">Price (Rs.) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={newPlan.price}
                      onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })}
                      required
                      placeholder="e.g., 2999"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="description">Description *</Label>
                    <Input
                      id="description"
                      value={newPlan.description}
                      onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                      required
                      placeholder="Brief description of the plan"
                    />
                  </div>

                  <div>
                    <Label htmlFor="billingCycle">Billing Cycle *</Label>
                    <Select
                      id="billingCycle"
                      value={newPlan.billingCycle}
                      onChange={(e) => setNewPlan({ ...newPlan, billingCycle: e.target.value as any })}
                      required
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </Select>
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="features">Features (one per line) *</Label>
                    <Textarea
                      id="features"
                      value={newPlan.features}
                      onChange={(e) => setNewPlan({ ...newPlan, features: e.target.value })}
                      required
                      placeholder="Unlimited scrap entries&#10;Advanced analytics&#10;Email support&#10;Custom reports"
                      rows={5}
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <Button type="submit">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Plan
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No plans created yet. Add your first plan above.</p>
            </div>
          ) : (
            plans.map(plan => (
              <Card key={plan.id} className="border-2 hover:shadow-lg transition-shadow">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(plan.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-primary">Rs.{plan.price}</span>
                      <span className="text-gray-600">/ {plan.billingCycle}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-gray-700">Features:</p>
                    <ul className="space-y-2">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}