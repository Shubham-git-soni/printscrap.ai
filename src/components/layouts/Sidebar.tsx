'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  FileText,
  Box,
  ShoppingCart,
  Settings,
  Users,
  CreditCard,
  CalendarDays,
  LogOut,
  X
} from 'lucide-react';

const clientLinks = [
  { href: '/client/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/client/masters', label: 'Masters', icon: Package },
  { href: '/client/scrap-entry', label: 'Scrap Entry', icon: FileText },
  { href: '/client/inventory', label: 'Inventory', icon: Box },
  { href: '/client/sales', label: 'Sales', icon: ShoppingCart },
  { href: '/client/settings', label: 'Settings', icon: Settings },
];

const superAdminLinks = [
  { href: '/super-admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/super-admin/clients', label: 'Clients', icon: Users },
  { href: '/super-admin/subscriptions', label: 'Subscriptions', icon: CalendarDays },
  { href: '/super-admin/plans', label: 'Plans', icon: CreditCard },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const links = user?.role === 'super_admin' ? superAdminLinks : clientLinks;

  return (
    <>
      {/* Sidebar */}
      <div className={cn(
        "flex flex-col h-full bg-gray-900 text-white w-64 fixed lg:static inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Package className="h-8 w-8 text-blue-400" />
            <div>
              <div className="font-bold text-lg">PrintScrap.ai</div>
              <div className="text-xs text-gray-400">{user?.role === 'super_admin' ? 'Admin Panel' : user?.companyName}</div>
            </div>
          </Link>
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => onClose()}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-gray-800">
          <div className="mb-3 px-4 py-2 bg-gray-800 rounded-lg">
            <div className="text-sm font-medium text-white truncate" title={user?.email}>
              {user?.email}
            </div>
            <div className="text-xs text-gray-400 capitalize mt-1">
              {user?.role?.replace('_', ' ')}
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}
