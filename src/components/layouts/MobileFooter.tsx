'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  Box,
  ShoppingCart,
  Users,
  CreditCard,
  CalendarDays,
  MoreHorizontal,
  BarChart3,
  Settings,
} from 'lucide-react';

const clientLinks = [
  { href: '/client/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/client/scrap-entry', label: 'Entry', icon: FileText },
  { href: '/client/inventory', label: 'Inventory', icon: Box },
  { href: '/client/sales', label: 'Sales', icon: ShoppingCart },
];

const superAdminLinks = [
  { href: '/super-admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/super-admin/clients', label: 'Clients', icon: Users },
  { href: '/super-admin/subscriptions', label: 'Subs', icon: CalendarDays },
  { href: '/super-admin/plans', label: 'Plans', icon: CreditCard },
];

interface MobileFooterProps {
  onMenuClick: () => void;
}

export function MobileFooter({ onMenuClick }: MobileFooterProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const links = user?.role === 'super_admin' ? superAdminLinks : clientLinks;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg safe-area-pb">
      <nav className="flex items-center justify-around px-1 py-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-lg transition-colors flex-1 max-w-[80px]',
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium truncate">{link.label}</span>
            </Link>
          );
        })}

        {/* More button */}
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-lg transition-colors text-gray-600 hover:bg-gray-50 flex-1 max-w-[80px]"
        >
          <MoreHorizontal className="h-5 w-5" />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </nav>
    </div>
  );
}
