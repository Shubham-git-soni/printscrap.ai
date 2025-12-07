// API Client for Backend Integration
// Replaces mock-api.ts

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Helper to get auth header from localStorage
function getAuthHeader(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authHeader');
}

// Generic fetch helper
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const authHeader = getAuthHeader();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data.data;
}

export const apiClient = {
  // Authentication
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    // Store auth header
    localStorage.setItem('authHeader', data.data.authHeader);
    localStorage.setItem('user', JSON.stringify(data.data.user));

    return data.data.user;
  },

  register: async (userData: {
    email: string;
    password: string;
    companyName: string;
    contactNumber?: string;
    address?: string;
  }) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    // Store auth header
    localStorage.setItem('authHeader', data.data.authHeader);
    localStorage.setItem('user', JSON.stringify(data.data.user));

    return data.data.user;
  },

  logout: () => {
    localStorage.removeItem('authHeader');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Categories
  getCategories: (userId?: number) => {
    if (userId) {
      return apiFetch(`/categories?userId=${userId}`);
    }
    return apiFetch('/categories');
  },
  createCategory: (category: { name: string; marketRate: number; unit: string; createdBy?: number }) =>
    apiFetch('/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    }),
  updateCategory: (id: number, category: { name: string; marketRate: number; unit: string }) =>
    apiFetch(`/categories?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    }),
  deleteCategory: (id: number) =>
    apiFetch(`/categories?id=${id}`, { method: 'DELETE' }),

  // Sub-Categories
  getSubCategories: (userId?: number) => {
    if (userId) {
      return apiFetch(`/subcategories?userId=${userId}`);
    }
    return apiFetch('/subcategories');
  },
  createSubCategory: (subCategory: { categoryId: number; name: string; size?: string; unit?: string; remarks?: string; createdBy?: number }) =>
    apiFetch('/subcategories', {
      method: 'POST',
      body: JSON.stringify(subCategory),
    }),
  updateSubCategory: (id: number, subCategory: { categoryId: number; name: string; size?: string; unit?: string; remarks?: string }) =>
    apiFetch(`/subcategories?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(subCategory),
    }),
  deleteSubCategory: (id: number) =>
    apiFetch(`/subcategories?id=${id}`, { method: 'DELETE' }),

  // Units
  getUnits: (userId?: number) => {
    if (userId) {
      return apiFetch(`/units?userId=${userId}`);
    }
    return apiFetch('/units');
  },
  createUnit: (unit: { name: string; symbol: string; createdBy?: number }) =>
    apiFetch('/units', {
      method: 'POST',
      body: JSON.stringify(unit),
    }),
  updateUnit: (id: number, unit: { name: string; symbol: string }) =>
    apiFetch(`/units?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(unit),
    }),
  deleteUnit: (id: number) =>
    apiFetch(`/units?id=${id}`, { method: 'DELETE' }),

  // Departments
  getDepartments: (userId?: number) => {
    if (userId) {
      return apiFetch(`/departments?userId=${userId}`);
    }
    return apiFetch('/departments');
  },
  createDepartment: (department: { name: string; description?: string; createdBy?: number }) =>
    apiFetch('/departments', {
      method: 'POST',
      body: JSON.stringify(department),
    }),
  updateDepartment: (id: number, department: { name: string; description?: string }) =>
    apiFetch(`/departments?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(department),
    }),
  deleteDepartment: (id: number) =>
    apiFetch(`/departments?id=${id}`, { method: 'DELETE' }),

  // Machines
  getMachines: (userId?: number) => {
    if (userId) {
      return apiFetch(`/machines?userId=${userId}`);
    }
    return apiFetch('/machines');
  },
  createMachine: (machine: {
    name: string;
    departmentId: number;
    model?: string;
    manufacturer?: string;
    createdBy?: number;
  }) =>
    apiFetch('/machines', {
      method: 'POST',
      body: JSON.stringify(machine),
    }),
  updateMachine: (id: number, machine: {
    name: string;
    departmentId: number;
    model?: string;
    manufacturer?: string;
  }) =>
    apiFetch(`/machines?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(machine),
    }),
  deleteMachine: (id: number) =>
    apiFetch(`/machines?id=${id}`, { method: 'DELETE' }),

  // Scrap Entries
  getScrapEntries: (userId?: number) => {
    if (userId) {
      return apiFetch(`/scrap-entries?userId=${userId}`);
    }
    // For backward compatibility, though should always pass userId
    return apiFetch('/scrap-entries');
  },
  createScrapEntry: (entry: any) =>
    apiFetch('/scrap-entries', {
      method: 'POST',
      body: JSON.stringify(entry),
    }),

  // Stock
  getStock: (userId: number) => apiFetch(`/stock?userId=${userId}`),
  updateStock: (stock: { categoryId: number; subCategoryId?: number; userId: number; quantity: number; unit: string; rate: number }) =>
    apiFetch('/stock', {
      method: 'POST',
      body: JSON.stringify(stock),
    }),

  // Sales
  getSales: (userId?: number) => {
    if (userId) {
      return apiFetch(`/sales?userId=${userId}`);
    }
    // For backward compatibility
    return apiFetch('/sales');
  },
  createSale: (sale: any) =>
    apiFetch('/sales', {
      method: 'POST',
      body: JSON.stringify(sale),
    }),

  // Plans
  getPlans: () => apiFetch('/plans'),
  createPlan: (planData: any) =>
    apiFetch('/plans', {
      method: 'POST',
      body: JSON.stringify(planData),
    }),
  deletePlan: (planId: number) =>
    apiFetch(`/plans?id=${planId}`, {
      method: 'DELETE',
    }),

  // Subscriptions
  getSubscription: (userId: number) => apiFetch(`/subscriptions?userId=${userId}`),
  checkTrialExpired: (userId: number) => apiFetch(`/check-trial?userId=${userId}`),

  // Users (Super Admin)
  getUsers: () => apiFetch('/users'),
  updateUser: async (userId: number, updates: any) => {
    const response = await fetch(`${API_URL}/users`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(getAuthHeader() && { 'Authorization': getAuthHeader()! })
      },
      body: JSON.stringify({ id: userId, ...updates }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Update failed');
    }

    return data.data;
  },
  deleteUser: (userId: number) =>
    apiFetch(`/users?id=${userId}`, { method: 'DELETE' }),
};