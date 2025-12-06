'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { mockApi } from '@/lib/mock-api';
import { Subscription, Plan } from '@/lib/types';
import { Settings as SettingsIcon, User as UserIcon, CreditCard, CheckCircle } from 'lucide-react';

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'subscription'>('profile');

  // Profile state
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Subscription state
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);

  useEffect(() => {
    if (user) {
      setCompanyName(user.companyName || '');
      setEmail(user.email);
      setContactNumber(user.contactNumber || '');
      setAddress(user.address || '');

      // Load subscription
      if (user.subscriptionId) {
        const sub = mockApi.getSubscriptions().find(s => s.id === user.subscriptionId);
        if (sub) {
          setSubscription(sub);
          const p = mockApi.getPlans().find(pl => pl.id === sub.planId);
          setPlan(p || null);
        }
      }
    }
  }, [user]);

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const updatedUser = mockApi.updateUser(user.id, {
      companyName,
      email,
      contactNumber,
      address,
    });

    if (updatedUser) {
      setUser(updatedUser);
      localStorage.setItem('current_user', JSON.stringify(updatedUser));
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    }
  };

  return (
    <DashboardLayout requiredRole="client">
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b">
          <button
            className={`pb-3 px-4 font-medium flex items-center gap-2 ${activeTab === 'profile'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-500 hover:text-gray-700'
              }`}
            onClick={() => setActiveTab('profile')}
          >
            <UserIcon className="h-4 w-4" />
            Profile
          </button>
          <button
            className={`pb-3 px-4 font-medium flex items-center gap-2 ${activeTab === 'subscription'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-500 hover:text-gray-700'
              }`}
            onClick={() => setActiveTab('subscription')}
          >
            <CreditCard className="h-4 w-4" />
            Subscription
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl">
            {profileSuccess && (
              <Card className="mb-6 border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    <span>Profile updated successfully!</span>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div>
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                      placeholder="Your company name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactNumber">Contact Number *</Label>
                    <Input
                      id="contactNumber"
                      type="tel"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      required
                      placeholder="+91 9876543210"
                    />
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Company address"
                      rows={3}
                    />
                  </div>

                  <div className="pt-4">
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                      <SettingsIcon className="h-4 w-4 mr-2" />
                      Update Profile
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">User ID</span>
                  <span className="font-medium">{user?.id}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Contact Number</span>
                  <span className="font-medium">{user?.contactNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Account Status</span>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${user?.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                    {user?.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Email Verified</span>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${user?.isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                    {user?.isVerified ? 'Verified' : 'Not Verified'}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Member Since</span>
                  <span className="font-medium">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Subscription Tab */}
        {activeTab === 'subscription' && (
          <div className="max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>Current Subscription</CardTitle>
              </CardHeader>
              <CardContent>
                {subscription && plan ? (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                          <p className="text-gray-600 mt-1">{plan.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-primary">Rs.{plan.price}</p>
                          <p className="text-sm text-gray-600">per {plan.billingCycle}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <span className={`inline-flex px-3 py-1 mt-1 rounded-full text-sm font-medium ${subscription.status === 'active' ? 'bg-green-100 text-green-700' :
                              subscription.status === 'trial' ? 'bg-blue-100 text-blue-700' :
                                subscription.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                  'bg-yellow-100 text-yellow-700'
                            }`}>
                            {subscription.status}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Start Date</p>
                          <p className="font-medium mt-1">{new Date(subscription.startDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">End Date</p>
                          <p className="font-medium mt-1">{new Date(subscription.endDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Auto Renew</p>
                          <p className="font-medium mt-1">{subscription.autoRenew ? 'Yes' : 'No'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-3">Plan Features:</h4>
                      <ul className="space-y-2">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No active subscription</p>
                    <p className="text-sm text-gray-500">Contact your administrator to activate a subscription</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
