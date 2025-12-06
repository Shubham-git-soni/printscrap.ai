import type {
  User, Plan, Subscription, ScrapCategory, ScrapSubCategory,
  ScrapEntry, Sale, EmailConfig, StockItem, Unit, Department, Machine
} from './types';

const STORAGE_KEYS = {
  USERS: 'printscrap_users',
  PLANS: 'printscrap_plans',
  SUBSCRIPTIONS: 'printscrap_subscriptions',
  CATEGORIES: 'printscrap_categories',
  SUB_CATEGORIES: 'printscrap_sub_categories',
  SCRAP_ENTRIES: 'printscrap_scrap_entries',
  SALES: 'printscrap_sales',
  EMAIL_CONFIGS: 'printscrap_email_configs',
  UNITS: 'printscrap_units',
  DEPARTMENTS: 'printscrap_departments',
  MACHINES: 'printscrap_machines',
};

const initializeMockData = () => {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    const initialUsers: User[] = [
      {
        id: 1, email: 'admin@printscrap.ai', password: 'admin123',
        role: 'super_admin', companyName: 'PrintScrap.ai',
        isActive: true, isVerified: true, createdAt: new Date().toISOString(),
      },
      {
        id: 2, email: 'demo@company.com', password: 'demo123',
        role: 'client', companyName: 'Demo Printing Co.',
        address: '123 Print Street, City', isActive: true, isVerified: true,
        subscriptionId: 1, createdAt: new Date().toISOString(),
      },
    ];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(initialUsers));
  }

  if (!localStorage.getItem(STORAGE_KEYS.PLANS)) {
    const initialPlans: Plan[] = [
      {
        id: 1,
        name: 'Starter',
        description: 'Perfect for small businesses',
        price: 999,
        billingCycle: 'monthly',
        features: ['Up to 100 entries', 'Basic analytics', 'Email support']
      },
      {
        id: 2,
        name: 'Professional',
        description: 'For growing businesses',
        price: 2499,
        billingCycle: 'monthly',
        features: ['Unlimited entries', 'Advanced analytics', 'Priority support', 'Custom reports']
      },
    ];
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(initialPlans));
  }

  if (!localStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS)) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    const initialSubscriptions: Subscription[] = [
      {
        id: 1,
        userId: 2,
        planId: 2,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status: 'active',
        autoRenew: true
      },
    ];
    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(initialSubscriptions));
  }

  if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
    const initialCategories: ScrapCategory[] = [
      { id: 1, name: 'Paper Sheets', marketRate: 25, unit: 'Kg', createdBy: 2 },
      { id: 2, name: 'Plastic', marketRate: 30, unit: 'Kg', createdBy: 2 },
      { id: 3, name: 'Aluminum', marketRate: 150, unit: 'Kg', createdBy: 2 },
    ];
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(initialCategories));
  }

  if (!localStorage.getItem(STORAGE_KEYS.SUB_CATEGORIES)) {
    const initialSubCategories: ScrapSubCategory[] = [
      {
        id: 1, categoryId: 1, name: 'A4 White Paper', size: '210x297mm',
        unit: 'Kg', attributes: { size: '210x297mm' }, createdBy: 2
      },
      {
        id: 2, categoryId: 2, name: 'PET Bottles', unit: 'Kg',
        attributes: { type: 'PET' }, createdBy: 2
      },
    ];
    localStorage.setItem(STORAGE_KEYS.SUB_CATEGORIES, JSON.stringify(initialSubCategories));
  }

  if (!localStorage.getItem(STORAGE_KEYS.SCRAP_ENTRIES)) {
    const initialEntries: ScrapEntry[] = [
      {
        id: 1,
        entryType: 'job-based',
        categoryId: 1,
        subCategoryId: 1,
        departmentId: 1,
        machineId: 1,
        quantity: 50,
        unit: 'Kg',
        rate: 25,
        totalValue: 1250,
        jobNumber: 'JOB001',
        remarks: 'Initial sample entry',
        createdBy: 2,
        createdAt: new Date().toISOString()
      },
    ];
    localStorage.setItem(STORAGE_KEYS.SCRAP_ENTRIES, JSON.stringify(initialEntries));
  }

  if (!localStorage.getItem(STORAGE_KEYS.UNITS)) {
    const initialUnits: Unit[] = [
      { id: 1, name: 'Kilogram', symbol: 'Kg', createdBy: 2 },
      { id: 2, name: 'Numbers', symbol: 'Nos', createdBy: 2 },
      { id: 3, name: 'Tons', symbol: 'Tons', createdBy: 2 },
      { id: 4, name: 'Meters', symbol: 'm', createdBy: 2 },
    ];
    localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(initialUnits));
  }

  if (!localStorage.getItem(STORAGE_KEYS.DEPARTMENTS)) {
    const initialDepartments: Department[] = [
      { id: 1, name: 'Printing', description: 'Main printing operations', createdBy: 2 },
      { id: 2, name: 'Binding', description: 'Book binding and finishing', createdBy: 2 },
      { id: 3, name: 'Cutting', description: 'Paper cutting and trimming', createdBy: 2 },
    ];
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(initialDepartments));
  }

  if (!localStorage.getItem(STORAGE_KEYS.MACHINES)) {
    const initialMachines: Machine[] = [
      { id: 1, name: 'Offset Printer 1', departmentId: 1, model: 'HP-5000', manufacturer: 'Heidelberg', createdBy: 2 },
      { id: 2, name: 'Digital Printer', departmentId: 1, model: 'DP-300', manufacturer: 'Xerox', createdBy: 2 },
      { id: 3, name: 'Binding Machine', departmentId: 2, model: 'BM-200', manufacturer: 'Muller Martini', createdBy: 2 },
    ];
    localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(initialMachines));
  }

  [STORAGE_KEYS.SALES, STORAGE_KEYS.EMAIL_CONFIGS].forEach(key => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify([]));
  });
};

const getFromStorage = <T>(key: string): T[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const saveToStorage = <T>(key: string, data: T[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
};

export const mockApi = {
  init: initializeMockData,

  login: (email: string, password: string): User | null => {
    const users = getFromStorage<User>(STORAGE_KEYS.USERS);
    const user = users.find(u => u.email === email && u.password === password);
    return user?.isActive ? user : null;
  },

  register: (userData: Omit<User, 'id' | 'createdAt' | 'isActive' | 'isVerified'>): User => {
    const users = getFromStorage<User>(STORAGE_KEYS.USERS);
    const subs = getFromStorage<Subscription>(STORAGE_KEYS.SUBSCRIPTIONS);

    const userId = users.length + 1;
    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 1); // 1 day trial

    // Create 1-day trial subscription
    const trialSubscription: Subscription = {
      id: subs.length + 1,
      userId: userId,
      planId: 0, // 0 for trial
      status: 'trial',
      startDate: now.toISOString(),
      endDate: trialEnd.toISOString(),
      autoRenew: false,
    };
    subs.push(trialSubscription);
    saveToStorage(STORAGE_KEYS.SUBSCRIPTIONS, subs);

    const newUser: User = {
      ...userData,
      id: userId,
      isActive: true, // Active during trial
      isVerified: false,
      createdAt: now.toISOString(),
      subscriptionId: trialSubscription.id,
    };
    users.push(newUser);
    saveToStorage(STORAGE_KEYS.USERS, users);
    return newUser;
  },

  getUsers: (): User[] => getFromStorage<User>(STORAGE_KEYS.USERS),

  updateUserStatus: (userId: number, isActive: boolean): void => {
    const users = getFromStorage<User>(STORAGE_KEYS.USERS);
    const user = users.find(u => u.id === userId);
    if (user) { user.isActive = isActive; saveToStorage(STORAGE_KEYS.USERS, users); }
  },

  updateUser: (userId: number, updates: Partial<User>): User | null => {
    const users = getFromStorage<User>(STORAGE_KEYS.USERS);
    const user = users.find(u => u.id === userId);
    if (user) {
      Object.assign(user, updates);
      saveToStorage(STORAGE_KEYS.USERS, users);
      return user;
    }
    return null;
  },

  getPlans: (): Plan[] => getFromStorage<Plan>(STORAGE_KEYS.PLANS),

  createPlan: (plan: Omit<Plan, 'id'>): Plan => {
    const plans = getFromStorage<Plan>(STORAGE_KEYS.PLANS);
    const newPlan: Plan = { ...plan, id: plans.length + 1 };
    plans.push(newPlan);
    saveToStorage(STORAGE_KEYS.PLANS, plans);
    return newPlan;
  },

  deletePlan: (id: number): void => {
    const plans = getFromStorage<Plan>(STORAGE_KEYS.PLANS);
    saveToStorage(STORAGE_KEYS.PLANS, plans.filter(p => p.id !== id));
  },

  getSubscriptions: (): Subscription[] => getFromStorage<Subscription>(STORAGE_KEYS.SUBSCRIPTIONS),

  createSubscription: (sub: Omit<Subscription, 'id'>): Subscription => {
    const subs = getFromStorage<Subscription>(STORAGE_KEYS.SUBSCRIPTIONS);
    const newSub: Subscription = { ...sub, id: subs.length + 1 };
    subs.push(newSub);
    saveToStorage(STORAGE_KEYS.SUBSCRIPTIONS, subs);
    return newSub;
  },

  updateSubscription: (subId: number, updates: Partial<Subscription>): Subscription | null => {
    const subs = getFromStorage<Subscription>(STORAGE_KEYS.SUBSCRIPTIONS);
    const sub = subs.find(s => s.id === subId);
    if (sub) {
      Object.assign(sub, updates);
      saveToStorage(STORAGE_KEYS.SUBSCRIPTIONS, subs);
      return sub;
    }
    return null;
  },

  checkTrialExpired: (userId: number): boolean => {
    const subs = getFromStorage<Subscription>(STORAGE_KEYS.SUBSCRIPTIONS);
    const userSub = subs.find(s => s.userId === userId);

    if (!userSub || userSub.status !== 'trial') return false;

    const now = new Date();
    const endDate = new Date(userSub.endDate);

    return now > endDate;
  },

  getCategories: (): ScrapCategory[] => getFromStorage<ScrapCategory>(STORAGE_KEYS.CATEGORIES),

  createCategory: (cat: Omit<ScrapCategory, 'id'>): ScrapCategory => {
    const cats = getFromStorage<ScrapCategory>(STORAGE_KEYS.CATEGORIES);
    const newCat: ScrapCategory = { ...cat, id: cats.length + 1 };
    cats.push(newCat);
    saveToStorage(STORAGE_KEYS.CATEGORIES, cats);
    return newCat;
  },

  deleteCategory: (id: number): void => {
    const cats = getFromStorage<ScrapCategory>(STORAGE_KEYS.CATEGORIES);
    saveToStorage(STORAGE_KEYS.CATEGORIES, cats.filter(c => c.id !== id));
  },

  updateCategory: (id: number, updates: Partial<ScrapCategory>): ScrapCategory | null => {
    const cats = getFromStorage<ScrapCategory>(STORAGE_KEYS.CATEGORIES);
    const cat = cats.find(c => c.id === id);
    if (cat) {
      Object.assign(cat, updates);
      saveToStorage(STORAGE_KEYS.CATEGORIES, cats);
      return cat;
    }
    return null;
  },

  getSubCategories: (): ScrapSubCategory[] => getFromStorage<ScrapSubCategory>(STORAGE_KEYS.SUB_CATEGORIES),

  createSubCategory: (sub: Omit<ScrapSubCategory, 'id'>): ScrapSubCategory => {
    const subs = getFromStorage<ScrapSubCategory>(STORAGE_KEYS.SUB_CATEGORIES);
    const newSub: ScrapSubCategory = { ...sub, id: subs.length + 1 };
    subs.push(newSub);
    saveToStorage(STORAGE_KEYS.SUB_CATEGORIES, subs);
    return newSub;
  },

  deleteSubCategory: (id: number): void => {
    const subs = getFromStorage<ScrapSubCategory>(STORAGE_KEYS.SUB_CATEGORIES);
    saveToStorage(STORAGE_KEYS.SUB_CATEGORIES, subs.filter(s => s.id !== id));
  },

  updateSubCategory: (id: number, updates: Partial<ScrapSubCategory>): ScrapSubCategory | null => {
    const subs = getFromStorage<ScrapSubCategory>(STORAGE_KEYS.SUB_CATEGORIES);
    const sub = subs.find(s => s.id === id);
    if (sub) {
      Object.assign(sub, updates);
      saveToStorage(STORAGE_KEYS.SUB_CATEGORIES, subs);
      return sub;
    }
    return null;
  },

  getScrapEntries: (): ScrapEntry[] => getFromStorage<ScrapEntry>(STORAGE_KEYS.SCRAP_ENTRIES),

  createScrapEntry: (entry: Omit<ScrapEntry, 'id' | 'createdAt'>): ScrapEntry => {
    const entries = getFromStorage<ScrapEntry>(STORAGE_KEYS.SCRAP_ENTRIES);
    const newEntry: ScrapEntry = { ...entry, id: entries.length + 1, createdAt: new Date().toISOString() };
    entries.push(newEntry);
    saveToStorage(STORAGE_KEYS.SCRAP_ENTRIES, entries);
    return newEntry;
  },

  getSales: (): Sale[] => getFromStorage<Sale>(STORAGE_KEYS.SALES),

  createSale: (sale: Omit<Sale, 'id' | 'createdAt' | 'invoiceNumber' | 'saleDate'>): Sale => {
    const sales = getFromStorage<Sale>(STORAGE_KEYS.SALES);
    const invoiceNumber = `INV-${Date.now()}-${sales.length + 1}`;
    const saleDate = new Date().toISOString();
    const newSale: Sale = {
      ...sale,
      id: sales.length + 1,
      invoiceNumber,
      saleDate,
      createdAt: new Date().toISOString()
    };
    sales.push(newSale);
    saveToStorage(STORAGE_KEYS.SALES, sales);
    return newSale;
  },

  getEmailConfigs: (): EmailConfig[] => getFromStorage<EmailConfig>(STORAGE_KEYS.EMAIL_CONFIGS),

  getEmailConfig: (userId: number): EmailConfig | null => {
    const configs = getFromStorage<EmailConfig>(STORAGE_KEYS.EMAIL_CONFIGS);
    return configs.find(c => c.userId === userId) || null;
  },

  createEmailConfig: (config: Omit<EmailConfig, ''>): void => {
    const configs = getFromStorage<EmailConfig>(STORAGE_KEYS.EMAIL_CONFIGS);
    const idx = configs.findIndex(c => c.userId === config.userId);
    if (idx !== -1) configs[idx] = config;
    else configs.push(config);
    saveToStorage(STORAGE_KEYS.EMAIL_CONFIGS, configs);
  },

  saveEmailConfig: (config: EmailConfig): void => {
    const configs = getFromStorage<EmailConfig>(STORAGE_KEYS.EMAIL_CONFIGS);
    const idx = configs.findIndex(c => c.userId === config.userId);
    if (idx !== -1) configs[idx] = config;
    else configs.push(config);
    saveToStorage(STORAGE_KEYS.EMAIL_CONFIGS, configs);
  },

  getStock: (userId: number): StockItem[] => {
    const entries = getFromStorage<ScrapEntry>(STORAGE_KEYS.SCRAP_ENTRIES).filter(e => e.createdBy === userId);
    const sales = getFromStorage<Sale>(STORAGE_KEYS.SALES).filter(s => s.createdBy === userId);
    const categories = getFromStorage<ScrapCategory>(STORAGE_KEYS.CATEGORIES);
    const subCategories = getFromStorage<ScrapSubCategory>(STORAGE_KEYS.SUB_CATEGORIES);

    const stockMap = new Map<string, {
      categoryId: number;
      subCategoryId?: number;
      totalInflow: number;
      totalOutflow: number;
      totalCost: number;
      unit: string;
      categoryName?: string;
      subCategoryName?: string;
      specs?: string;
      marketRate?: number;
    }>();

    // Accumulate entries
    entries.forEach(entry => {
      const cat = categories.find(c => c.id === entry.categoryId);
      const sub = entry.subCategoryId ? subCategories.find(s => s.id === entry.subCategoryId) : undefined;
      if (!cat) return;

      const key = `${entry.categoryId}-${entry.subCategoryId || 0}`;
      const existing = stockMap.get(key);

      if (existing) {
        existing.totalInflow += entry.quantity;
        existing.totalCost += (entry.rate || 0) * entry.quantity;
      } else {
        stockMap.set(key, {
          categoryId: entry.categoryId,
          subCategoryId: entry.subCategoryId,
          categoryName: cat.name,
          subCategoryName: sub?.name,
          specs: sub ? Object.values(sub.attributes || {}).join(', ') : '',
          totalInflow: entry.quantity,
          totalOutflow: 0,
          totalCost: (entry.rate || 0) * entry.quantity,
          unit: entry.unit,
          marketRate: cat.marketRate,
        });
      }
    });

    // Accumulate sales (outflow)
    sales.forEach(sale => {
      sale.saleItems.forEach(item => {
        const key = `${item.categoryId}-${item.subCategoryId || 0}`;
        const existing = stockMap.get(key);
        if (existing) {
          existing.totalOutflow += item.quantity;
        }
      });
    });

    // Convert to StockItem array with calculations
    let idCounter = 1;
    const stockItems: StockItem[] = Array.from(stockMap.values()).map(item => {
      const availableStock = item.totalInflow - item.totalOutflow;
      const averageRate = item.totalInflow > 0 ? item.totalCost / item.totalInflow : (item.marketRate || 0);
      const totalValue = availableStock * averageRate;

      return {
        id: idCounter++,
        categoryId: item.categoryId,
        subCategoryId: item.subCategoryId,
        categoryName: item.categoryName,
        subCategoryName: item.subCategoryName,
        specs: item.specs,
        totalInflow: item.totalInflow,
        totalOutflow: item.totalOutflow,
        availableStock,
        unit: item.unit,
        marketRate: item.marketRate,
        averageRate,
        totalValue,
      };
    });

    return stockItems;
  },

  // Unit CRUD
  getUnits: (): Unit[] => getFromStorage<Unit>(STORAGE_KEYS.UNITS),

  createUnit: (unit: Omit<Unit, 'id'>): Unit => {
    const units = getFromStorage<Unit>(STORAGE_KEYS.UNITS);
    const newUnit: Unit = { ...unit, id: units.length + 1 };
    units.push(newUnit);
    saveToStorage(STORAGE_KEYS.UNITS, units);
    return newUnit;
  },

  deleteUnit: (id: number): void => {
    const units = getFromStorage<Unit>(STORAGE_KEYS.UNITS);
    saveToStorage(STORAGE_KEYS.UNITS, units.filter(u => u.id !== id));
  },

  updateUnit: (id: number, updates: Partial<Unit>): Unit | null => {
    const units = getFromStorage<Unit>(STORAGE_KEYS.UNITS);
    const unit = units.find(u => u.id === id);
    if (unit) {
      Object.assign(unit, updates);
      saveToStorage(STORAGE_KEYS.UNITS, units);
      return unit;
    }
    return null;
  },

  // Department CRUD
  getDepartments: (): Department[] => getFromStorage<Department>(STORAGE_KEYS.DEPARTMENTS),

  createDepartment: (dept: Omit<Department, 'id'>): Department => {
    const depts = getFromStorage<Department>(STORAGE_KEYS.DEPARTMENTS);
    const newDept: Department = { ...dept, id: depts.length + 1 };
    depts.push(newDept);
    saveToStorage(STORAGE_KEYS.DEPARTMENTS, depts);
    return newDept;
  },

  deleteDepartment: (id: number): void => {
    const depts = getFromStorage<Department>(STORAGE_KEYS.DEPARTMENTS);
    saveToStorage(STORAGE_KEYS.DEPARTMENTS, depts.filter(d => d.id !== id));
  },

  updateDepartment: (id: number, updates: Partial<Department>): Department | null => {
    const depts = getFromStorage<Department>(STORAGE_KEYS.DEPARTMENTS);
    const dept = depts.find(d => d.id === id);
    if (dept) {
      Object.assign(dept, updates);
      saveToStorage(STORAGE_KEYS.DEPARTMENTS, depts);
      return dept;
    }
    return null;
  },

  // Machine CRUD
  getMachines: (): Machine[] => getFromStorage<Machine>(STORAGE_KEYS.MACHINES),

  createMachine: (machine: Omit<Machine, 'id'>): Machine => {
    const machines = getFromStorage<Machine>(STORAGE_KEYS.MACHINES);
    const newMachine: Machine = { ...machine, id: machines.length + 1 };
    machines.push(newMachine);
    saveToStorage(STORAGE_KEYS.MACHINES, machines);
    return newMachine;
  },

  deleteMachine: (id: number): void => {
    const machines = getFromStorage<Machine>(STORAGE_KEYS.MACHINES);
    saveToStorage(STORAGE_KEYS.MACHINES, machines.filter(m => m.id !== id));
  },

  updateMachine: (id: number, updates: Partial<Machine>): Machine | null => {
    const machines = getFromStorage<Machine>(STORAGE_KEYS.MACHINES);
    const machine = machines.find(m => m.id === id);
    if (machine) {
      Object.assign(machine, updates);
      saveToStorage(STORAGE_KEYS.MACHINES, machines);
      return machine;
    }
    return null;
  },
};