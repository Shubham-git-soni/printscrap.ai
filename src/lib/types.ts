// User and Auth Types
export type UserRole = 'super_admin' | 'client';

export interface User {
  id: number;
  email: string;
  password: string;
  role: UserRole;
  companyName: string;
  contactNumber?: string;
  address?: string;
  logo?: string;
  isActive: boolean;
  isVerified: boolean;
  subscriptionId?: number;
  createdAt: string;
}

// Subscription Types
export interface Plan {
  id: number;
  name: string;
  description: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
}

export interface Subscription {
  id: number;
  userId: number;
  planId: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'trial' | 'expired' | 'cancelled';
  autoRenew: boolean;
}

// Master Data Types
export interface ScrapCategory {
  id: number;
  name: string;
  marketRate: number;
  unit: string;
  createdBy: number;
}

export interface ScrapSubCategory {
  id: number;
  categoryId: number;
  name: string;
  size?: string;
  dimensions?: string;
  unit: 'Kg' | 'Nos' | 'Tons';
  remarks?: string;
  attributes: Record<string, string>;
  createdBy: number;
}

export interface Unit {
  id: number;
  name: string;
  symbol: string;
  createdBy: number;
}

export interface Department {
  id: number;
  name: string;
  description?: string;
  createdBy: number;
}

export interface Machine {
  id: number;
  name: string;
  departmentId: number;
  model?: string;
  manufacturer?: string;
  createdBy: number;
}

// Scrap Entry Types
export type ScrapEntryType = 'job-based' | 'general';

export interface ScrapEntry {
  id: number;
  entryType: ScrapEntryType;
  categoryId: number;
  subCategoryId?: number;
  departmentId: number;
  machineId?: number;
  quantity: number;
  unit: string;
  rate: number;
  totalValue: number;
  jobNumber?: string;
  remarks?: string;
  createdBy: number;
  createdAt: string;
}

// Inventory Types
export interface StockItem {
  id: number;
  categoryId: number;
  categoryName?: string;
  subCategoryId?: number;
  subCategoryName?: string;
  specs?: string;
  totalInflow: number;
  totalOutflow: number;
  availableStock: number;
  unit: string;
  marketRate?: number;
  averageRate: number;
  totalValue: number;
}

// Sales Types
export interface SaleItem {
  categoryId: number;
  subCategoryId?: number;
  quantity: number;
  rate: number;
  totalValue: number;
}

export interface Sale {
  id: number;
  invoiceNumber: string;
  saleDate: string;
  buyerName: string;
  buyerContact?: string;
  saleItems: SaleItem[];
  totalAmount: number;
  remarks?: string;
  createdBy: number;
  createdAt: string;
}

// Settings Types
export interface EmailConfig {
  email: string;
  smtpHost: string;
  smtpPort: number;
  password: string;
  userId: number;
}

// Dashboard Analytics Types
export interface DashboardStats {
  totalScrapValue: number;
  totalRevenue: number;
  totalStockWeight: number;
  totalStockCount: number;
}

export interface CategoryData {
  category: string;
  value: number;
}

export interface WeeklyVolumeData {
  day: string;
  kg: number;
}
