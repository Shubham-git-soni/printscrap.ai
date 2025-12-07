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
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900/95 via-indigo-900/95 to-purple-900/95 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
        <Card className="max-w-lg w-full bg-white shadow-2xl border-0 animate-in fade-in zoom-in duration-200">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-5">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-xl font-bold text-gray-900 mb-1 truncate">
                  Request {selectedPlan.name} Plan
                </CardTitle>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Rs.{selectedPlan.price}
                  </span>
                  <span className="text-sm text-gray-600">/ {selectedPlan.billingCycle}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedPlan(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full flex-shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <div className="space-y-4">
              <div>
                <Label htmlFor="requestMessage" className="text-sm font-semibold text-gray-900 mb-2 block">
                  Message to Admin (Optional)
                </Label>
                <Textarea
                  id="requestMessage"
                  placeholder="Add any special requirements or questions..."
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  rows={3}
                  className="bg-white border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none text-sm"
                />
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200">
                <div className="flex gap-2">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <Mail className="h-3 w-3 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-xs text-blue-900 leading-relaxed">
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
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30 h-10"
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
    <div className="fixed inset-0 bg-gradient-to-br from-blue-900/95 via-indigo-900/95 to-purple-900/95 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-5xl w-full my-4 shadow-2xl border-0 animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-hidden flex flex-col">
        <Card className="border-0 shadow-none flex-1 flex flex-col overflow-hidden">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-6 flex-shrink-0">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full mb-2">
                  Trial Expired
                </div>
                <CardTitle className="text-3xl font-bold text-gray-900 mb-1">
                  Choose Your Perfect Plan
                </CardTitle>
                <p className="text-gray-600 text-sm">
                  Continue enjoying PrintScrap.ai with unlimited access
                </p>
              </div>
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-full flex-shrink-0"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-6 overflow-y-auto flex-1">
            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {plans.map((plan, index) => {
                const isRecommended = plan.name === 'Professional';
                const colors = [
                  { border: 'border-blue-300', gradient: 'from-blue-50 to-blue-100/50', button: 'from-blue-600 to-blue-700' },
                  { border: 'border-indigo-300', gradient: 'from-indigo-50 to-indigo-100/50', button: 'from-indigo-600 to-indigo-700' },
                  { border: 'border-purple-300', gradient: 'from-purple-50 to-purple-100/50', button: 'from-purple-600 to-purple-700' },
                ];
                const color = colors[index % colors.length];

                return (
                  <Card
                    key={plan.id}
                    className={`relative border-2 ${isRecommended
                      ? 'border-indigo-400 shadow-lg shadow-indigo-500/20 scale-[1.02]'
                      : `${color.border} shadow-md`
                      } hover:shadow-xl transition-all duration-300 bg-white overflow-hidden`}
                  >
                    {isRecommended && (
                      <div className="absolute top-0 right-0 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                        ⭐ BEST VALUE
                      </div>
                    )}
                    <CardHeader className={`bg-gradient-to-br ${color.gradient} p-4 relative overflow-hidden`}>
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full -mr-12 -mt-12"></div>
                      <CardTitle className="text-lg font-bold text-gray-900 mb-2 relative z-10">
                        {plan.name}
                      </CardTitle>
                      <div className="mb-2 relative z-10">
                        <div className="flex items-baseline gap-1">
                          <span className={`text-3xl font-bold bg-gradient-to-r ${color.button} bg-clip-text text-transparent`}>
                            Rs.{plan.price}
                          </span>
                        </div>
                        <span className="text-gray-600 text-xs">per {plan.billingCycle}</span>
                      </div>
                      <p className="text-xs text-gray-700 relative z-10 leading-relaxed line-clamp-2">
                        {plan.description}
                      </p>
                    </CardHeader>
                    <CardContent className="p-4">
                      <ul className="space-y-2 mb-4">
                        {plan.features.slice(0, 3).map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <div className="flex-shrink-0 w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            </div>
                            <span className="text-xs text-gray-700 leading-relaxed line-clamp-1">{feature}</span>
                          </li>
                        ))}
                        {plan.features.length > 3 && (
                          <li className="text-xs text-gray-500 pl-6">+{plan.features.length - 3} more features</li>
                        )}
                      </ul>
                      <Button
                        onClick={() => setSelectedPlan(plan)}
                        className={`w-full h-10 font-semibold text-sm shadow-md transition-all duration-300 ${isRecommended
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
                          : `bg-gradient-to-r ${color.button} hover:opacity-90 text-white`
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
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-5 border-2 border-indigo-200">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  Need Help Choosing?
                </h3>
                <p className="text-xs text-gray-700">
                  Our team is here to help you select the perfect plan
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <a
                  href="mailto:wecare@indusanalytics.in"
                  className="flex items-center gap-3 bg-white p-3 rounded-lg border-2 border-blue-200 hover:shadow-md hover:border-blue-400 transition-all duration-300 group"
                >
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2.5 rounded-lg shadow-md group-hover:scale-110 transition-transform">
                    <Mail className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 font-medium">Email Us</p>
                    <p className="text-blue-600 font-bold text-sm hover:underline truncate">
                      wecare@indusanalytics.in
                    </p>
                  </div>
                </a>

                <a
                  href="tel:+918269598608"
                  className="flex items-center gap-3 bg-white p-3 rounded-lg border-2 border-green-200 hover:shadow-md hover:border-green-400 transition-all duration-300 group"
                >
                  <div className="bg-gradient-to-br from-green-500 to-green-600 p-2.5 rounded-lg shadow-md group-hover:scale-110 transition-transform">
                    <Phone className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 font-medium">Call Us</p>
                    <p className="text-green-600 font-bold text-sm hover:underline truncate">
                      +91 82695 98608
                    </p>
                  </div>
                </a>
              </div>

              <div className="text-center mt-3">
                <p className="text-xs text-gray-600">
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
