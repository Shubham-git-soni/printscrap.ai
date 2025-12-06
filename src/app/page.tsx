'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart3, TrendingUp, Package, DollarSign, X } from 'lucide-react';

export default function LandingPage() {
  const [showSuperAdminLogin, setShowSuperAdminLogin] = useState(false);
  const [superAdminEmail, setSuperAdminEmail] = useState('');
  const [superAdminPassword, setSuperAdminPassword] = useState('');

  const handleSuperAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = '/login?role=super_admin';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Package className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-primary">PrintScrap.ai</h1>
          </div>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Register</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold mb-6 text-gray-900">
          PrintScrap.ai
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Professional Scrap Management System for the Printing Industry.
          Track, manage, and optimize your scrap inventory with real-time analytics and insights.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/register">
            <Button size="lg">Get Started Free</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">Sign In</Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <BarChart3 className="h-12 w-12 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">Real-time Analytics</h3>
              <p className="text-gray-600">Track scrap volumes, categories, and trends with live dashboards</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <Package className="h-12 w-12 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">Inventory Management</h3>
              <p className="text-gray-600">Comprehensive stock tracking with automatic calculations</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <DollarSign className="h-12 w-12 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">Revenue Tracking</h3>
              <p className="text-gray-600">Monitor sales and revenue from scrap materials</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <TrendingUp className="h-12 w-12 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">ROI Optimization</h3>
              <p className="text-gray-600">Maximize returns on scrap materials with insights</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Benefits</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="font-semibold mb-2">Reduce Waste</h3>
              <p className="text-gray-600">Better tracking means less material waste</p>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="font-semibold mb-2">Increase Revenue</h3>
              <p className="text-gray-600">Optimize scrap sales for maximum profit</p>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="font-semibold mb-2">Save Time</h3>
              <p className="text-gray-600">Automated tracking and reporting</p>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">ROI Calculator</h2>
          <Card>
            <CardContent className="p-8">
              <p className="text-center text-gray-600 mb-4">
                Our customers typically see a <span className="font-bold text-primary">30-50% increase</span> in scrap revenue
                within the first 3 months of using PrintScrap.ai
              </p>
              <div className="grid md:grid-cols-3 gap-4 mt-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">30%</div>
                  <div className="text-sm text-gray-600">More Revenue</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">50%</div>
                  <div className="text-sm text-gray-600">Less Waste</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">10hrs</div>
                  <div className="text-sm text-gray-600">Time Saved/Week</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-6 w-6" />
                <span className="font-bold text-lg">PrintScrap.ai</span>
              </div>
              <p className="text-gray-400 text-sm">
                Professional scrap management for the printing industry
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Features</li>
                <li>Pricing</li>
                <li>Security</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>About Us</li>
                <li>Contact</li>
                <li>Careers</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Help Center</li>
                <li>Documentation</li>
                <li>Contact Support</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 flex justify-between items-center">
            <p className="text-sm text-gray-400">© 2024 PrintScrap.ai. All rights reserved.</p>
            <button
              onClick={() => setShowSuperAdminLogin(true)}
              className="text-xs text-gray-600 hover:text-gray-400"
            >
              Super Admin Login
            </button>
          </div>
        </div>
      </footer>

      {/* Super Admin Login Modal */}
      {showSuperAdminLogin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Super Admin Login</h2>
                <button onClick={() => setShowSuperAdminLogin(false)}>
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSuperAdminLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={superAdminEmail}
                    onChange={(e) => setSuperAdminEmail(e.target.value)}
                    placeholder="admin@printscrap.ai"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={superAdminPassword}
                    onChange={(e) => setSuperAdminPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Login as Super Admin
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
