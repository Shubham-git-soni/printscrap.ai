'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
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
  X,
  ChevronLeft,
  BarChart3,
  Moon,
  Sun
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
  { href: '/super-admin/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isDesktopCollapsed?: boolean;
  onDesktopToggle?: () => void;
}

export function Sidebar({ isOpen, onClose, isDesktopCollapsed = false, onDesktopToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const links = user?.role === 'super_admin' ? superAdminLinks : clientLinks;

  return (
    <>
      {/* Backdrop overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "flex flex-col bg-sidebar text-sidebar-foreground fixed z-50 shadow-2xl lg:shadow-lg lg:border-r lg:border-sidebar-border transition-all duration-300 ease-in-out",
        // Desktop: collapsible sidebar with fixed positioning
        "lg:top-0 lg:left-0 lg:bottom-0 lg:h-screen",
        isDesktopCollapsed ? "lg:w-20" : "lg:w-64",
        // Mobile: bottom sheet style - dynamic height based on content
        "lg:translate-y-0",
        isOpen
          ? "inset-x-0 bottom-0 translate-y-0 rounded-t-3xl lg:rounded-none lg:h-screen"
          : "inset-x-0 bottom-0 translate-y-full rounded-t-3xl lg:rounded-none lg:h-screen"
      )}>
        {/* Handle bar for mobile */}
        <div className="lg:hidden flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-sidebar-accent rounded-full"></div>
        </div>

        {/* Logo */}
        <div className={cn(
          "border-b border-sidebar-border flex items-center",
          isDesktopCollapsed ? "lg:p-4 lg:justify-center p-6 justify-between" : "p-6 justify-between"
        )}>
          <Link href="/" className="flex items-center gap-2">
            <Package className="h-8 w-8 text-sidebar-primary flex-shrink-0" />
            <div className={cn(
              "transition-all duration-300",
              isDesktopCollapsed ? "lg:hidden" : ""
            )}>
              <div className="font-bold text-lg text-sidebar-foreground">PrintScrap.ai</div>
            </div>
          </Link>
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          {/* Collapse button for desktop */}
          {onDesktopToggle && (
            <button
              onClick={onDesktopToggle}
              className={cn(
                "hidden lg:block p-2 rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-300",
                isDesktopCollapsed ? "absolute top-4 right-2" : ""
              )}
              title={isDesktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <ChevronLeft className={cn(
                "h-5 w-5 text-sidebar-foreground transition-transform duration-300",
                isDesktopCollapsed ? "rotate-180" : ""
              )} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className={cn(
          "flex-1 space-y-2 overflow-y-auto",
          isDesktopCollapsed ? "lg:p-2 p-4" : "p-4"
        )}>
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => onClose()}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium',
                  isDesktopCollapsed ? 'lg:justify-center lg:px-2' : '',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                    : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
                title={isDesktopCollapsed ? link.label : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className={cn(
                  "transition-all duration-300",
                  isDesktopCollapsed ? "lg:hidden" : ""
                )}>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout - Desktop only */}
        <div className={cn(
          "border-t border-sidebar-border hidden lg:block",
          isDesktopCollapsed ? "lg:p-2" : "p-4"
        )}>
          <div className={cn(
            "mb-3 px-4 py-2 bg-sidebar-accent rounded-lg border border-sidebar-border/30",
            isDesktopCollapsed ? "lg:hidden" : ""
          )}>
            <div className="text-sm font-semibold text-sidebar-accent-foreground truncate" title={user?.email}>
              {user?.email}
            </div>
            <div className="text-xs text-sidebar-foreground/60 capitalize mt-1 font-medium">
              {user?.role?.replace('_', ' ')}
            </div>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg w-full text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors mb-2 font-medium",
              isDesktopCollapsed ? "lg:justify-center lg:px-2" : ""
            )}
            title={isDesktopCollapsed ? (theme === 'dark' ? 'Light Mode' : 'Dark Mode') : undefined}
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 flex-shrink-0" />
            ) : (
              <Moon className="h-5 w-5 flex-shrink-0" />
            )}
            <span className={cn(
              "transition-all duration-300",
              isDesktopCollapsed ? "lg:hidden" : ""
            )}>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg w-full text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors font-medium",
              isDesktopCollapsed ? "lg:justify-center lg:px-2" : ""
            )}
            title={isDesktopCollapsed ? "Logout" : undefined}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span className={cn(
              "transition-all duration-300",
              isDesktopCollapsed ? "lg:hidden" : ""
            )}>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}
