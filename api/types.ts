// API Types and Interfaces

export interface User {
  id: number;
  email: string;
  password?: string; // Only used internally, never sent to client
  role: 'super_admin' | 'client';
  companyName?: string;
  contactNumber?: string;
  address?: string;
  isActive: boolean;
  isVerified: boolean;
  subscriptionId?: number;
  createdAt: string;
}

export interface Plan {
  id: number;
  name: string;
  description: string;
  price: number;
  billingCycle: 'month' | 'year';
  features: string[];
}

export interface Subscription {
  id: number;
  userId: number;
  planId: number;
  status: 'trial' | 'active' | 'expired' | 'cancelled';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
}

export interface Category {
  id: number;
  name: string;
  marketRate: number;
  unit: string;
  createdBy: number;
}

export interface SubCategory {
  id: number;
  categoryId: number;
  name: string;
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

export interface ScrapEntry {
  id: number;
  entryType: 'job-based' | 'general';
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

export interface StockItem {
  id: number;
  categoryId: number;
  subCategoryId?: number;
  userId: number;
  totalInflow: number;
  totalOutflow: number;
  availableStock: number;
  unit: string;
  averageRate: number;
  totalValue: number;
}

export interface Sale {
  id: number;
  invoiceNumber: string;
  buyerName: string;
  buyerContact?: string;
  totalAmount: number;
  remarks?: string;
  saleDate: string;
  createdBy: number;
  saleItems: SaleItem[];
}

export interface SaleItem {
  id: number;
  saleId: number;
  categoryId: number;
  subCategoryId?: number;
  quantity: number;
  rate: number;
  totalValue: number;
}

// Request/Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  companyName: string;
  contactNumber?: string;
  address?: string;
}

export interface AuthResponse {
  user: User;
  authHeader: string;
}

// Vercel Request/Response Types
import { VercelRequest, VercelResponse } from '@vercel/node';

export type ApiHandler = (
  req: VercelRequest,
  res: VercelResponse
) => Promise<void | VercelResponse>;

export interface AuthenticatedRequest extends VercelRequest {
  user?: User;
}
