'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plan } from '@/lib/types';
import { CheckCircle, Mail, Phone, X } from 'lucide-react';

interface TrialExpiredModalProps {
  plans: Plan[];
  onClose?: () => void;
}

export function TrialExpiredModal({ plans, onClose }: TrialExpiredModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-none">
          <CardHeader className="border-b">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Your Trial Period Has Ended
                </CardTitle>
                <p className="text-gray-600 mt-2">
                  Choose a plan to continue using PrintScrap.ai
                </p>
              </div>
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`border-2 ${
                    plan.name === 'Professional'
                      ? 'border-blue-500 shadow-lg'
                      : 'border-gray-200'
                  } hover:shadow-xl transition-shadow`}
                >
                  <CardHeader>
                    {plan.name === 'Professional' && (
                      <div className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full inline-block mb-2 w-fit">
                        RECOMMENDED
                      </div>
                    )}
                    <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-primary">Rs.{plan.price}</span>
                      <span className="text-gray-600 ml-2">/ {plan.billingCycle}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Contact Information */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Ready to Subscribe?
              </h3>
              <p className="text-gray-700 mb-4">
                Contact us to purchase a plan and continue enjoying PrintScrap.ai
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 bg-white p-4 rounded-lg border border-blue-200">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Email Us</p>
                    <a
                      href="mailto:wecare@indusanalytics.in"
                      className="text-blue-600 font-semibold hover:underline"
                    >
                      wecare@indusanalytics.in
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white p-4 rounded-lg border border-blue-200">
                  <div className="bg-green-100 p-3 rounded-full">
                    <Phone className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Call Us</p>
                    <a
                      href="tel:+919876543210"
                      className="text-green-600 font-semibold hover:underline"
                    >
                      +91 98765 43210
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Our team will help you choose the right plan and get you set up quickly.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 mt-6">
              <Button
                onClick={() => window.open('mailto:wecare@indusanalytics.in', '_blank')}
                className="px-8"
              >
                <Mail className="h-4 w-4 mr-2" />
                Email Us to Subscribe
              </Button>
              <Button
                onClick={() => window.open('tel:+919876543210')}
                variant="outline"
                className="px-8"
              >
                <Phone className="h-4 w-4 mr-2" />
                Call to Subscribe
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
