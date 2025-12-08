'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plan } from '@/lib/types';
import { CheckCircle, Mail, Phone, X, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';

interface TrialExpiredModalProps {
  plans: Plan[];
  onClose?: () => void;
}

export function TrialExpiredModal({ plans, onClose }: TrialExpiredModalProps) {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestPlan = async () => {
    if (!selectedPlan || !user) return;

    setLoading(true);
    try {
      await apiClient.createPlanRequest({
        userId: user.id,
        planId: selectedPlan.id,
        requestMessage: requestMessage || undefined,
      });

      alert('Plan request submitted successfully! Admin will review and activate your plan shortly.');
      setSelectedPlan(null);
      setRequestMessage('');
      onClose?.();
    } catch (error: any) {
      console.error('Error requesting plan:', error);
      alert(error.message || 'Failed to submit plan request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // If a plan is selected, show the request form modal
  if (selectedPlan) {
    return (
      <div className="fixed inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
        <Card className="max-w-lg w-full shadow-2xl border animate-in fade-in zoom-in duration-200">
          <CardHeader className="border-b p-5">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-xl font-bold mb-1 truncate">
                  Request {selectedPlan.name} Plan
                </CardTitle>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-primary">
                    Rs.{selectedPlan.price}
                  </span>
                  <span className="text-sm text-muted-foreground">/ {selectedPlan.billingCycle}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedPlan(null)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-accent rounded-full flex-shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <div className="space-y-4">
              <div>
                <Label htmlFor="requestMessage" className="text-sm font-semibold mb-2 block">
                  Message to Admin (Optional)
                </Label>
                <Textarea
                  id="requestMessage"
                  placeholder="Add any special requirements or questions..."
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  rows={3}
                  className="resize-none text-sm"
                />
              </div>

              <div className="bg-primary/10 p-3 rounded-lg border border-primary">
                <div className="flex gap-2">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                      <Mail className="h-3 w-3 text-primary" />
                    </div>
                  </div>
                  <p className="text-xs text-foreground leading-relaxed">
                    Your request will be sent to the admin. You'll receive an email once activated.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <Button
                  variant="outline"
                  className="flex-1 border-2 hover:bg-gray-50 h-10"
                  onClick={() => {
                    setSelectedPlan(null);
                    setRequestMessage('');
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 h-10"
                  onClick={handleRequestPlan}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Request
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main modal with plans
  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl max-w-5xl w-full my-4 shadow-2xl border animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-hidden flex flex-col">
        <Card className="border-0 shadow-none flex-1 flex flex-col overflow-hidden">
          <CardHeader className="border-b p-6 flex-shrink-0">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="inline-block px-3 py-1 bg-primary/20 text-primary text-xs font-semibold rounded-full mb-2">
                  Trial Expired
                </div>
                <CardTitle className="text-3xl font-bold mb-1">
                  Choose Your Perfect Plan
                </CardTitle>
                <p className="text-muted-foreground text-sm">
                  Continue enjoying PrintScrap.ai with unlimited access
                </p>
              </div>
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1.5 hover:bg-accent rounded-full flex-shrink-0"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-6 overflow-y-auto flex-1">
            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {plans.map((plan) => {
                const isRecommended = plan.name === 'Professional';

                return (
                  <Card
                    key={plan.id}
                    className={`relative border ${isRecommended
                      ? 'border-primary shadow-lg'
                      : 'shadow-md'
                      } hover:shadow-xl transition-all duration-300 overflow-hidden`}
                  >
                    {isRecommended && (
                      <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                        ⭐ BEST VALUE
                      </div>
                    )}
                    <CardHeader className="bg-muted/50 p-4 relative overflow-hidden">
                      <CardTitle className="text-lg font-bold text-foreground mb-2 relative z-10">
                        {plan.name}
                      </CardTitle>
                      <div className="mb-2 relative z-10">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-primary">
                            Rs.{plan.price}
                          </span>
                        </div>
                        <span className="text-muted-foreground text-xs">per {plan.billingCycle}</span>
                      </div>
                      <p className="text-xs text-muted-foreground relative z-10 leading-relaxed line-clamp-2">
                        {plan.description}
                      </p>
                    </CardHeader>
                    <CardContent className="p-4">
                      <ul className="space-y-2 mb-4">
                        {plan.features.slice(0, 3).map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <div className="flex-shrink-0 w-4 h-4 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mt-0.5">
                              <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                            </div>
                            <span className="text-xs text-foreground leading-relaxed line-clamp-1">{feature}</span>
                          </li>
                        ))}
                        {plan.features.length > 3 && (
                          <li className="text-xs text-muted-foreground pl-6">+{plan.features.length - 3} more features</li>
                        )}
                      </ul>
                      <Button
                        onClick={() => setSelectedPlan(plan)}
                        className={`w-full h-10 font-semibold text-sm shadow-md transition-all duration-300 ${isRecommended
                          ? 'bg-primary hover:bg-primary/90'
                          : ''
                          }`}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Request This Plan
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Contact Information */}
            <div className="bg-muted rounded-xl p-5 border">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold mb-1">
                  Need Help Choosing?
                </h3>
                <p className="text-xs text-muted-foreground">
                  Our team is here to help you select the perfect plan
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <a
                  href="mailto:wecare@indusanalytics.in"
                  className="flex items-center gap-3 bg-background p-3 rounded-lg border-2 border-primary hover:shadow-md hover:border-primary/80 transition-all duration-300 group"
                >
                  <div className="bg-primary p-2.5 rounded-lg shadow-md group-hover:scale-110 transition-transform">
                    <Mail className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground font-medium">Email Us</p>
                    <p className="text-primary font-bold text-sm hover:underline truncate">
                      wecare@indusanalytics.in
                    </p>
                  </div>
                </a>

                <a
                  href="tel:+918269598608"
                  className="flex items-center gap-3 bg-background p-3 rounded-lg border-2 border-primary hover:shadow-md hover:border-primary/80 transition-all duration-300 group"
                >
                  <div className="bg-primary p-2.5 rounded-lg shadow-md group-hover:scale-110 transition-transform">
                    <Phone className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground font-medium">Call Us</p>
                    <p className="text-primary font-bold text-sm hover:underline truncate">
                      +91 82695 98608
                    </p>
                  </div>
                </a>
              </div>

              <div className="text-center mt-3">
                <p className="text-xs text-muted-foreground">
                  ⚡ Quick activation • 💼 Dedicated support • 🎯 Tailored solutions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
