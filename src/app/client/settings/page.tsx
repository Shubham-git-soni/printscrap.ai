'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api-client';
import { showSuccess, showError } from '@/lib/toast';
import { Subscription, Plan } from '@/lib/types';
import { Settings as SettingsIcon, User as UserIcon, CreditCard, CheckCircle, Mail, Phone, AlertCircle } from 'lucide-react';
import { useSiteSettings } from '@/lib/site-settings';

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const { settings: siteSettings } = useSiteSettings();
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
  const [allPlans, setAllPlans] = useState<Plan[]>([]);

  // Plan request state
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestError, setRequestError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        setCompanyName(user.companyName || '');
        setEmail(user.email);
        setContactNumber(user.contactNumber || '');
        setAddress(user.address || '');

        // Load subscription
        if (user.subscriptionId) {
          try {
            const [sub, plans] = await Promise.all([
              apiClient.getSubscription(user.id),
              apiClient.getPlans(),
            ]) as [Subscription | null, Plan[]];

            setAllPlans(plans); // Store all plans

            if (sub && sub.id) {
              setSubscription(sub);
              const p = plans.find((pl) => pl.id === sub.planId);
              setPlan(p || null);
            }
          } catch (error) {
            console.error('Error loading subscription:', error);
          }
        } else {
          // Even if no subscription, load plans
          try {
            const plans = await apiClient.getPlans() as Plan[];
            setAllPlans(plans);
          } catch (error) {
            console.error('Error loading plans:', error);
          }
        }
      }
    };

    loadData();
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const updatedUser = await apiClient.updateUser(user.id, {
        companyName,
        email,
        contactNumber,
        address,
      });

      if (updatedUser) {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handlePlanRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPlanId) return;

    setRequestError('');

    try {
      await apiClient.createPlanRequest({
        userId: user.id,
        planId: selectedPlanId,
        requestMessage: requestMessage || undefined,
      });

      setRequestSuccess(true);
      setShowRequestForm(false);
      setSelectedPlanId(null);
      setRequestMessage('');

      setTimeout(() => setRequestSuccess(false), 5000);
    } catch (error: any) {
      console.error('Error submitting plan request:', error);
      setRequestError(error.message || 'Failed to submit plan request');
    }
  };

  const handleSelectPlan = (planId: number) => {
    setSelectedPlanId(planId);
    setShowRequestForm(true);
    setRequestError('');
  };

  return (
    <DashboardLayout requiredRole="client">
      <div className="p-3 md:p-6 lg:p-8">
        <div className="mb-4 md:mb-6">
          <h1 className="text-lg md:text-xl font-bold text-foreground">Settings</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 md:mb-6">
          <button
            className={`py-1.5 md:py-2 px-3 md:px-4 rounded-full font-medium flex items-center gap-1.5 md:gap-2 text-xs md:text-sm transition-all ${activeTab === 'profile'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            onClick={() => setActiveTab('profile')}
          >
            <UserIcon className="h-3.5 w-3.5 md:h-4 md:w-4" />
            Profile
          </button>
          <button
            className={`py-1.5 md:py-2 px-3 md:px-4 rounded-full font-medium flex items-center gap-1.5 md:gap-2 text-xs md:text-sm transition-all ${activeTab === 'subscription'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            onClick={() => setActiveTab('subscription')}
          >
            <CreditCard className="h-3.5 w-3.5 md:h-4 md:w-4" />
            Subscription
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl">
            {profileSuccess && (
              <Card className="mb-6 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
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
                    <Button type="submit">
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
                <div className="flex justify-between py-2 border-b dark:border-gray-700">
                  <span className="text-muted-foreground">User ID</span>
                  <span className="font-medium text-foreground">{user?.id}</span>
                </div>
                <div className="flex justify-between py-2 border-b dark:border-gray-700">
                  <span className="text-muted-foreground">Contact Number</span>
                  <span className="font-medium text-foreground">{user?.contactNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b dark:border-gray-700">
                  <span className="text-muted-foreground">Account Status</span>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${user?.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                    }`}>
                    {user?.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b dark:border-gray-700">
                  <span className="text-muted-foreground">Email Verified</span>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${user?.isVerified ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                    }`}>
                    {user?.isVerified ? 'Verified' : 'Not Verified'}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Member Since</span>
                  <span className="font-medium text-foreground">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Subscription Tab */}
        {activeTab === 'subscription' && (
          <div className="space-y-6">
            {/* Current Subscription Card */}
            <Card>
              <CardHeader>
                <CardTitle>Current Subscription</CardTitle>
              </CardHeader>
              <CardContent>
                {subscription && plan ? (
                  <div className="space-y-4">
                    <div className="bg-muted/50 p-6 rounded-lg border">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-2xl font-bold text-foreground">{plan.name}</h3>
                          <p className="text-muted-foreground mt-1">{plan.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-primary">₹{plan.price}</p>
                          <p className="text-sm text-muted-foreground">per {plan.billingCycle || 'month'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          <span className={`inline-flex px-3 py-1 mt-1 rounded-full text-sm font-medium ${subscription.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                            subscription.status === 'trial' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                              subscription.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                                'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                            }`}>
                            {subscription.status}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Start Date</p>
                          <p className="font-medium mt-1 text-foreground">{new Date(subscription.startDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">End Date</p>
                          <p className="font-medium mt-1 text-foreground">{new Date(subscription.endDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Auto Renew</p>
                          <p className="font-medium mt-1 text-foreground">{subscription.autoRenew ? 'Yes' : 'No'}</p>
                        </div>
                      </div>

                      {/* Trial Expiry Warning */}
                      {subscription.status === 'trial' && (
                        <div className="mt-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                          <div className="flex gap-3">
                            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-yellow-900 dark:text-yellow-200">Trial Period Active</p>
                              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                                Your trial ends on {new Date(subscription.endDate).toLocaleDateString()}.
                                Contact us to activate a paid plan and continue using all features.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-3 text-foreground">Plan Features:</h4>
                      <ul className="space-y-2">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CreditCard className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">No active subscription</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Contact your administrator to activate a subscription</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Available Plans */}
            <Card>
              <CardHeader>
                <CardTitle>Available Plans</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Choose a plan that fits your business needs</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allPlans.map((availablePlan) => (
                    <Card key={availablePlan.id} className="border hover:shadow-lg transition-shadow">
                      <CardHeader className="bg-muted/50">
                        <CardTitle className="text-xl text-foreground">{availablePlan.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{availablePlan.description}</p>
                        <div className="mt-4">
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-primary">₹{availablePlan.price}</span>
                            <span className="text-muted-foreground">/ {availablePlan.billingCycle || 'month'}</span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <ul className="space-y-2 mb-4">
                          {availablePlan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                              <span className="text-foreground">{feature}</span>
                            </li>
                          ))}
                        </ul>
                        {subscription?.planId === availablePlan.id ? (
                          <Button disabled className="w-full">
                            Current Plan
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => handleSelectPlan(availablePlan.id)}
                          >
                            Request This Plan
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Request Success Message */}
            {requestSuccess && (
              <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Plan activation request submitted successfully!</span>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                    Our admin will review your request and activate your plan within 24 hours.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Plan Request Form */}
            {showRequestForm && (
              <Card id="request-form">
                <CardHeader>
                  <CardTitle>Request Plan Activation</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Fill out this form to request activation for your selected plan
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePlanRequest} className="space-y-4">
                    {requestError && (
                      <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                          <AlertCircle className="h-5 w-5" />
                          <span className="font-medium">{requestError}</span>
                        </div>
                      </div>
                    )}

                    <div className="bg-muted/50 p-4 rounded-lg border">
                      <p className="text-sm text-foreground">
                        <strong>Selected Plan:</strong> {allPlans.find(p => p.id === selectedPlanId)?.name}
                      </p>
                      <p className="text-sm text-foreground mt-1">
                        <strong>Price:</strong> ₹{allPlans.find(p => p.id === selectedPlanId)?.price} / {allPlans.find(p => p.id === selectedPlanId)?.billingCycle}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="requestMessage">Additional Message (Optional)</Label>
                      <Textarea
                        id="requestMessage"
                        value={requestMessage}
                        onChange={(e) => setRequestMessage(e.target.value)}
                        placeholder="Any specific requirements or questions about the plan..."
                        rows={4}
                        className="mt-2"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setShowRequestForm(false);
                          setSelectedPlanId(null);
                          setRequestMessage('');
                          setRequestError('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1"
                      >
                        Submit Request
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Contact us if you have any questions about our plans
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg border">
                    <Mail className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-foreground">Email Us</p>
                      <a href={`mailto:${siteSettings.supportEmail}`} className="text-primary hover:underline mt-1 block">
                        {siteSettings.supportEmail}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg border">
                    <Phone className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-foreground">Call Us</p>
                      <a href={`tel:${siteSettings.supportPhone.replace(/\s/g, '')}`} className="text-primary hover:underline mt-1 block">
                        {siteSettings.supportPhone}
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
