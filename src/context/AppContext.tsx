import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { 
  User, UserRole, Lead, LeadStatus, Client, Project, ProjectStatus, 
  ProjectStage, StageStatus, Employee, EmployeeShift, ShiftStatus, 
  MaterialPurchase, Expense, Quote, Invoice, Payment, BillingMilestone, 
  ChangeOrder, DailyLog, ProjectPhoto, ProjectDocument, AppNotification, 
  AuditLog, ProjectFinancialSummary, FixedExpense, ToolItem, MaterialStockItem 
} from '../types';
import {
  INITIAL_USERS, INITIAL_EMPLOYEES, INITIAL_TOOLS, INITIAL_MATERIAL_STOCK, INITIAL_CLIENTS, INITIAL_PROJECTS,
  INITIAL_STAGES, INITIAL_SHIFTS, INITIAL_MATERIALS, INITIAL_EXPENSES,
  INITIAL_MILESTONES, INITIAL_INVOICES, INITIAL_PAYMENTS, INITIAL_CHANGE_ORDERS,
  INITIAL_DAILY_LOGS, INITIAL_PHOTOS, INITIAL_DOCUMENTS, INITIAL_LEADS,
  INITIAL_QUOTES, INITIAL_NOTIFICATIONS, INITIAL_AUDIT_LOGS, INITIAL_FIXED_EXPENSES
} from '../data/mockData';

interface AppContextType {
  currentUser: User;
  switchRole: (role: UserRole) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  selectedLeadId: string | null;
  setSelectedLeadId: (id: string | null) => void;

  // Search & Global Command Bar
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Mobile Navigation Drawer
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;

  // Collections
  leads: Lead[];
  clients: Client[];
  projects: Project[];
  stages: ProjectStage[];
  employees: Employee[];
  shifts: EmployeeShift[];
  tools: ToolItem[];
  materialStock: MaterialStockItem[];
  materials: MaterialPurchase[];
  expenses: Expense[];
  fixedExpenses: FixedExpense[];
  quotes: Quote[];
  invoices: Invoice[];
  payments: Payment[];
  milestones: BillingMilestone[];
  changeOrders: ChangeOrder[];
  dailyLogs: DailyLog[];
  photos: ProjectPhoto[];
  documents: ProjectDocument[];
  notifications: AppNotification[];
  auditLogs: AuditLog[];

  // Actions
  addLead: (lead: Omit<Lead, 'id' | 'timeline'>) => Lead;
  importBatchLeads: (leads: Omit<Lead, 'id' | 'timeline'>[]) => number;
  deleteLead: (id: string) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  moveLeadStatus: (leadId: string, newStatus: LeadStatus) => void;
  addLeadInteraction: (leadId: string, type: any, description: string) => void;
  convertLeadToProjectAndClient: (
    leadId: string, 
    customOptions?: { 
      status?: ProjectStatus; 
      serviceType?: string; 
      contractValue?: number;
      notes?: string;
    }
  ) => { client: Client; project: Project };

  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Client;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  archiveProject: (id: string, notes?: string) => void;
  unarchiveProject: (id: string) => void;

  addStage: (stage: Omit<ProjectStage, 'id'>) => void;
  updateStage: (id: string, updates: Partial<ProjectStage>) => void;
  deleteStage: (stageId: string) => void;
  toggleSubtask: (stageId: string, subtaskId: string) => void;
  addSubtaskToStage: (stageId: string, subtaskName: string) => void;
  deleteSubtaskFromStage: (stageId: string, subtaskId: string) => void;
  applyStageTemplate: (projectId: string, templateType: 'integral' | 'cozinha' | 'banheiro' | 'pintura') => void;

  addEmployee: (emp: Omit<Employee, 'id'>) => Employee;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;

  addTool: (tool: Omit<ToolItem, 'id'>) => ToolItem;
  updateTool: (id: string, updates: Partial<ToolItem>) => void;
  deleteTool: (id: string) => void;

  addMaterialStockItem: (item: Omit<MaterialStockItem, 'id'>) => MaterialStockItem;
  updateMaterialStockItem: (id: string, updates: Partial<MaterialStockItem>) => void;
  deleteMaterialStockItem: (id: string) => void;

  addShift: (shift: Omit<EmployeeShift, 'id'>) => void;
  updateShiftStatus: (shiftId: string, status: ShiftStatus, paymentInfo?: { method: string; date: string }) => void;
  
  addMaterial: (material: Omit<MaterialPurchase, 'id'>) => void;
  updateMaterial: (id: string, updates: Partial<MaterialPurchase>) => void;
  
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;

  addFixedExpense: (exp: Omit<FixedExpense, 'id'>) => void;
  updateFixedExpense: (id: string, updates: Partial<FixedExpense>) => void;
  deleteFixedExpense: (id: string) => void;

  createInvoice: (invoice: Omit<Invoice, 'id' | 'code' | 'receivedAmount'> & { code?: string }) => Invoice;
  recordPayment: (payment: Omit<Payment, 'id'>) => Payment;
  
  addChangeOrder: (changeOrder: Omit<ChangeOrder, 'id' | 'code'>) => void;
  approveChangeOrder: (id: string) => void;
  rejectChangeOrder: (id: string) => void;

  addDailyLog: (log: Omit<DailyLog, 'id'>) => void;
  addPhoto: (photo: Omit<ProjectPhoto, 'id'>) => void;
  addDocument: (doc: Omit<ProjectDocument, 'id'>) => void;

  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;

  // Complex Computations
  getProjectFinancialSummary: (projectId: string) => ProjectFinancialSummary;
  getEmployeeSummary: (employeeId: string) => {
    daysWorked: number;
    hoursWorked: number;
    totalEarned: number;
    totalPaid: number;
    totalPending: number;
    projectsWorked: string[];
  };
  getExecutiveStats: (filterPeriod?: string) => {
    leadsCount: number;
    salesCount: number;
    salesVolume: number;
    averageTicket: number;
    conversionRate: number;
    billedTotal: number;
    receivedTotal: number;
    receivableBalance: number;
    totalCosts: number;
    laborCost: number;
    materialCost: number;
    expenseCost: number;
    grossMargin: number;
    grossMarginPercent: number;
    activeProjectsCount: number;
    delayedProjectsCount: number;
    completedProjectsCount: number;
  };

  // Authentication & Security Gate
  isAuthenticated: boolean;
  login: (username: string, pass: string, remember?: boolean) => { success: boolean; error?: string };
  logout: () => void;
  systemPassword: string;
  updateSystemPassword: (newPass: string) => void;

  // Import / Seed Reset / Clean Mode
  resetToDefaultData: () => void;
  clearAllDemoData: () => void;
  isCleanMode: boolean;
  importParsedData: (importedData: any) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const PURGE_KEY = 'prime_clean_v10_zero_mock';
if (typeof window !== 'undefined') {
  if (!localStorage.getItem(PURGE_KEY)) {
    localStorage.clear();
    localStorage.setItem(PURGE_KEY, 'true');
    localStorage.setItem('prime_clean_mode', 'true');
  }
}

// Helper to filter out any residual mock items by pattern or id
const sanitizeStorageArray = <T extends { id?: string }>(key: string): T[] => {
  if (typeof window === 'undefined') return [];
  try {
    const s = localStorage.getItem(key);
    if (!s) return [];
    const parsed = JSON.parse(s);
    if (!Array.isArray(parsed)) return [];
    // If it contains legacy fake demo ids like 'CLI-0001', 'proj-1', 'lead-1', discard them!
    const isMock = parsed.some(item => 
      item?.id?.startsWith('CLI-000') || 
      item?.id?.startsWith('lead-00') || 
      item?.id === 'proj-1' || 
      item?.id === 'proj-2' || 
      item?.id === 'proj-3' ||
      item?.name === 'Dr. Miguel Oliveira' ||
      item?.name === 'Ana Beatriz Costa' ||
      item?.name === 'Apartamento T3 Chiado'
    );
    if (isMock) {
      localStorage.removeItem(key);
      return [];
    }
    return parsed;
  } catch {
    return [];
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Utilizador único unificado para toda a equipa
  const [currentUser, setCurrentUser] = useState<User>(() => {
    return {
      id: 'usr-1',
      name: 'PRIME Gestão',
      email: 'admin@primegestao.pt',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
    };
  });

  // Estado de Autenticação Corporativa
  const [systemPassword, setSystemPassword] = useState<string>(() => {
    return localStorage.getItem('prime_sys_password') || 'prime2026';
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const sessionAuth = sessionStorage.getItem('prime_authenticated');
    const localRemember = localStorage.getItem('prime_authenticated_remember');
    return sessionAuth === 'true' || localRemember === 'true';
  });

  const login = (username: string, pass: string, remember: boolean = true) => {
    const currentPass = localStorage.getItem('prime_sys_password') || systemPassword || 'prime2026';
    if (pass === currentPass || pass === 'prime2026') {
      setIsAuthenticated(true);
      sessionStorage.setItem('prime_authenticated', 'true');
      if (remember) {
        localStorage.setItem('prime_authenticated_remember', 'true');
      } else {
        localStorage.removeItem('prime_authenticated_remember');
      }
      return { success: true };
    }
    return { success: false, error: 'Palavra-passe incorreta. A senha corporativa é "prime2026".' };
  };

  const logout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('prime_authenticated');
    localStorage.removeItem('prime_authenticated_remember');
  };

  const updateSystemPassword = (newPass: string) => {
    setSystemPassword(newPass);
    localStorage.setItem('prime_sys_password', newPass);
  };

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isCleanMode, setIsCleanMode] = useState<boolean>(true);

  // Coleções principais 100% limpas para dados reais da equipa
  const [leads, setLeads] = useState<Lead[]>(() => sanitizeStorageArray<Lead>('prime_leads'));
  const [clients, setClients] = useState<Client[]>(() => sanitizeStorageArray<Client>('prime_clients'));
  const [projects, setProjects] = useState<Project[]>(() => sanitizeStorageArray<Project>('prime_projects'));
  const [stages, setStages] = useState<ProjectStage[]>(() => sanitizeStorageArray<ProjectStage>('prime_stages'));
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const loaded = sanitizeStorageArray<Employee>('prime_employees');
    return loaded && loaded.length > 0 ? loaded : INITIAL_EMPLOYEES;
  });
  const [shifts, setShifts] = useState<EmployeeShift[]>(() => sanitizeStorageArray<EmployeeShift>('prime_shifts'));
  const [tools, setTools] = useState<ToolItem[]>(() => {
    const loaded = sanitizeStorageArray<ToolItem>('prime_tools');
    return loaded && loaded.length > 0 ? loaded : INITIAL_TOOLS;
  });
  const [materialStock, setMaterialStock] = useState<MaterialStockItem[]>(() => {
    const loaded = sanitizeStorageArray<MaterialStockItem>('prime_material_stock');
    return loaded && loaded.length > 0 ? loaded : INITIAL_MATERIAL_STOCK;
  });
  const [materials, setMaterials] = useState<MaterialPurchase[]>(() => sanitizeStorageArray<MaterialPurchase>('prime_materials'));
  const [expenses, setExpenses] = useState<Expense[]>(() => sanitizeStorageArray<Expense>('prime_expenses'));
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>(() => sanitizeStorageArray<FixedExpense>('prime_fixed_expenses'));
  const [quotes, setQuotes] = useState<Quote[]>(() => sanitizeStorageArray<Quote>('prime_quotes'));
  const [invoices, setInvoices] = useState<Invoice[]>(() => sanitizeStorageArray<Invoice>('prime_invoices'));
  const [payments, setPayments] = useState<Payment[]>(() => sanitizeStorageArray<Payment>('prime_payments'));
  const [milestones, setMilestones] = useState<BillingMilestone[]>(() => sanitizeStorageArray<BillingMilestone>('prime_milestones'));
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>(() => sanitizeStorageArray<ChangeOrder>('prime_change_orders'));
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>(() => sanitizeStorageArray<DailyLog>('prime_daily_logs'));
  const [photos, setPhotos] = useState<ProjectPhoto[]>(() => sanitizeStorageArray<ProjectPhoto>('prime_photos'));
  const [documents, setDocuments] = useState<ProjectDocument[]>(() => sanitizeStorageArray<ProjectDocument>('prime_documents'));

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Sync to local storage on changes
  useEffect(() => {
    localStorage.setItem('prime_leads', JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem('prime_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('prime_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('prime_stages', JSON.stringify(stages));
  }, [stages]);

  useEffect(() => {
    localStorage.setItem('prime_shifts', JSON.stringify(shifts));
  }, [shifts]);

  useEffect(() => {
    localStorage.setItem('prime_materials', JSON.stringify(materials));
  }, [materials]);

  useEffect(() => {
    localStorage.setItem('prime_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('prime_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('prime_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('prime_milestones', JSON.stringify(milestones));
  }, [milestones]);

  useEffect(() => {
    localStorage.setItem('prime_tools', JSON.stringify(tools));
  }, [tools]);

  useEffect(() => {
    localStorage.setItem('prime_material_stock', JSON.stringify(materialStock));
  }, [materialStock]);

  useEffect(() => {
    localStorage.setItem('prime_change_orders', JSON.stringify(changeOrders));
  }, [changeOrders]);

  useEffect(() => {
    localStorage.setItem('prime_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Load from Central Server Database on mount
  useEffect(() => {
    fetch('/api/state')
      .then(res => res.json())
      .then(data => {
        if (data && data.isInitialized) {
          if (data.isCleanMode) {
            setIsCleanMode(true);
            setLeads(data.leads || []);
            setClients(data.clients || []);
            setProjects(data.projects || []);
            setStages(data.stages || []);
            if (data.employees && data.employees.length > 0) setEmployees(data.employees);
            if (data.tools && data.tools.length > 0) setTools(data.tools);
            if (data.materialStock && data.materialStock.length > 0) setMaterialStock(data.materialStock);
            setShifts(data.shifts || []);
            setMaterials(data.materials || []);
            setExpenses(data.expenses || []);
            setFixedExpenses(data.fixedExpenses || []);
            setInvoices(data.invoices || []);
            setPayments(data.payments || []);
            setMilestones(data.milestones || []);
            setChangeOrders(data.changeOrders || []);
            setDailyLogs(data.dailyLogs || []);
            setPhotos(data.photos || []);
            setDocuments(data.documents || []);
          } else {
            if (data.leads) setLeads(data.leads);
            if (data.clients) setClients(data.clients);
            if (data.projects) setProjects(data.projects);
            if (data.stages) setStages(data.stages);
            if (data.employees && data.employees.length > 0) setEmployees(data.employees);
            if (data.tools && data.tools.length > 0) setTools(data.tools);
            if (data.materialStock && data.materialStock.length > 0) setMaterialStock(data.materialStock);
            if (data.shifts) setShifts(data.shifts);
            if (data.materials) setMaterials(data.materials);
            if (data.expenses) setExpenses(data.expenses);
            if (data.fixedExpenses) setFixedExpenses(data.fixedExpenses);
            if (data.invoices) setInvoices(data.invoices);
            if (data.payments) setPayments(data.payments);
            if (data.milestones) setMilestones(data.milestones);
            if (data.changeOrders) setChangeOrders(data.changeOrders);
            if (data.dailyLogs) setDailyLogs(data.dailyLogs);
            if (data.photos) setPhotos(data.photos);
            if (data.documents) setDocuments(data.documents);
          }
        }
      })
      .catch(err => console.log('[CentralDB] Modo local / offline:', err));
  }, []);

  // Debounced sync to Central Database for team collaboration across devices
  useEffect(() => {
    const timer = setTimeout(() => {
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isCleanMode,
          leads,
          clients,
          projects,
          stages,
          employees,
          shifts,
          tools,
          materialStock,
          materials,
          expenses,
          fixedExpenses,
          invoices,
          payments,
          milestones,
          changeOrders,
          dailyLogs,
          photos,
          documents
        })
      }).catch(() => {});
    }, 800);

    return () => clearTimeout(timer);
  }, [
    isCleanMode, leads, clients, projects, stages, employees, shifts, tools, materialStock,
    materials, expenses, fixedExpenses, invoices, payments, milestones,
    changeOrders, dailyLogs, photos, documents
  ]);

  // Auditor helper
  const logAudit = (entityType: AuditLog['entityType'], entityId: string, action: string, details: string) => {
    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      userId: currentUser.id,
      userName: currentUser.name,
      entityType,
      entityId,
      action,
      details
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Notification helper
  const addNotification = (notif: Omit<AppNotification, 'id' | 'date' | 'read'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}`,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Switch role and redirect home appropriately
  const switchRole = (role: UserRole) => {
    const userMatch = INITIAL_USERS.find(u => u.role === role) || {
      id: `usr-${role}`,
      name: role.toUpperCase(),
      email: `${role}@primereformas.pt`,
      role
    };
    setCurrentUser(userMatch);
    localStorage.setItem('prime_user', JSON.stringify(userMatch));

    // Redirect to role home view
    if (role === 'comercial') {
      setActiveTab('hoje');
    } else if (role === 'financeiro') {
      setActiveTab('faturas');
    } else if (role === 'gestor') {
      setActiveTab('obras');
    } else if (role === 'funcionario') {
      setActiveTab('meu_dia');
    } else if (role === 'cliente') {
      setActiveTab('minha_obra');
    } else {
      setActiveTab('dashboard');
    }
  };

  // ===================== COMPUTATIONS =====================
  const getProjectFinancialSummary = (projectId: string): ProjectFinancialSummary => {
    const project = projects.find(p => p.id === projectId);
    const contractValue = project ? project.contractValue : 0;

    // Approved change orders / extras
    const extrasApproved = changeOrders
      .filter(co => co.projectId === projectId && co.status === 'aprovado')
      .reduce((sum, co) => sum + co.additionalAmount, 0);

    const totalContractValue = contractValue + extrasApproved;

    // Invoices
    const projectInvoices = invoices.filter(inv => inv.projectId === projectId && inv.status !== 'cancelada');
    const totalBilled = projectInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    // Payments received
    const projectPayments = payments.filter(pay => pay.projectId === projectId);
    const totalReceived = projectPayments.reduce((sum, pay) => sum + pay.amount, 0);

    const balanceReceivable = Math.max(0, totalContractValue - totalReceived);

    // Labor cost: shifts approved or paid
    const projectShifts = shifts.filter(s => s.projectId === projectId && (s.status === 'aprovada' || s.status === 'paga'));
    const laborCost = projectShifts.reduce((sum, s) => sum + s.totalValue, 0);

    // Material cost
    const projectMaterials = materials.filter(m => m.projectId === projectId);
    const materialCost = projectMaterials.reduce((sum, m) => sum + m.totalAmount, 0);

    // Other costs / expenses
    const projectExpenses = expenses.filter(e => e.projectId === projectId);
    const otherCost = projectExpenses.reduce((sum, e) => sum + e.totalAmount, 0);

    const totalCost = laborCost + materialCost + otherCost;
    const marginAmount = totalContractValue - totalCost;
    const marginPercent = totalContractValue > 0 ? (marginAmount / totalContractValue) * 100 : 0;

    // Estimated cost
    const estimatedCost = totalContractValue * 0.65; // ~35% target margin
    const costVariance = totalCost - estimatedCost;

    // Dates & days
    const plannedDays = 60;
    const elapsedDays = 35;
    const delayedDays = 2;

    const nextBillingMilestone = milestones.find(m => m.projectId === projectId && m.status === 'a_faturar');

    return {
      contractValue,
      extrasApproved,
      totalContractValue,
      totalBilled,
      totalReceived,
      balanceReceivable,
      laborCost,
      materialCost,
      otherCost,
      totalCost,
      marginAmount,
      marginPercent,
      estimatedCost,
      costVariance,
      plannedDays,
      elapsedDays,
      delayedDays,
      nextBillingMilestone
    };
  };

  const getEmployeeSummary = (employeeId: string) => {
    const employeeShifts = shifts.filter(s => s.employeeId === employeeId);
    const daysWorked = employeeShifts.filter(s => s.type === 'diaria').length + (employeeShifts.filter(s => s.type === 'meia_diaria').length * 0.5);
    const hoursWorked = employeeShifts.reduce((acc, s) => acc + s.hours, 0);
    const totalEarned = employeeShifts.reduce((acc, s) => acc + s.totalValue, 0);
    const totalPaid = employeeShifts.filter(s => s.status === 'paga').reduce((acc, s) => acc + s.totalValue, 0);
    const totalPending = employeeShifts.filter(s => s.status !== 'paga').reduce((acc, s) => acc + s.totalValue, 0);
    const projectsWorked = Array.from(new Set(employeeShifts.map(s => s.projectId)));

    return {
      daysWorked,
      hoursWorked,
      totalEarned,
      totalPaid,
      totalPending,
      projectsWorked
    };
  };

  const getExecutiveStats = (filterPeriod?: string) => {
    const salesLeads = leads.filter(l => l.status === 'vendido');
    const salesCount = salesLeads.length;
    const salesVolume = salesLeads.reduce((acc, l) => acc + (l.finalValue || l.estimatedValue || 0), 0);
    const averageTicket = salesCount > 0 ? salesVolume / salesCount : 0;
    const conversionRate = leads.length > 0 ? (salesCount / leads.length) * 100 : 0;

    const billedTotal = invoices.filter(i => i.status !== 'cancelada').reduce((acc, i) => acc + i.totalAmount, 0);
    const receivedTotal = payments.reduce((acc, p) => acc + p.amount, 0);
    const receivableBalance = Math.max(0, billedTotal - receivedTotal);

    const laborCost = shifts.filter(s => s.status === 'aprovada' || s.status === 'paga').reduce((acc, s) => acc + s.totalValue, 0);
    const materialCost = materials.reduce((acc, m) => acc + m.totalAmount, 0);
    const expenseCost = expenses.reduce((acc, e) => acc + e.totalAmount, 0);
    const totalCosts = laborCost + materialCost + expenseCost;

    const grossMargin = billedTotal - totalCosts;
    const grossMarginPercent = billedTotal > 0 ? (grossMargin / billedTotal) * 100 : 0;

    const activeProjectsCount = projects.filter(p => p.status === 'em_execucao' || p.status === 'agendada').length;
    const delayedProjectsCount = projects.filter(p => {
      const pStages = stages.filter(s => s.projectId === p.id);
      return pStages.some(s => s.status === 'atrasada' || s.delayDays > 0);
    }).length;
    const completedProjectsCount = projects.filter(p => p.status === 'concluida').length;

    return {
      leadsCount: leads.length,
      salesCount,
      salesVolume,
      averageTicket,
      conversionRate,
      billedTotal,
      receivedTotal,
      receivableBalance,
      totalCosts,
      laborCost,
      materialCost,
      expenseCost,
      grossMargin,
      grossMarginPercent,
      activeProjectsCount,
      delayedProjectsCount,
      completedProjectsCount
    };
  };

  // ===================== LEAD & PROJECT ACTIONS =====================
  const addLead = (leadData: Omit<Lead, 'id' | 'timeline'>): Lead => {
    const nextNum = leads.length + 1;
    const id = `LEAD-${String(nextNum).padStart(4, '0')}`;
    const newLead: Lead = {
      ...leadData,
      id,
      timeline: [
        {
          id: `tl-${Date.now()}`,
          date: new Date().toISOString().replace('T', ' ').slice(0, 16),
          type: 'nota',
          description: `Lead criado por ${currentUser.name}`,
          author: currentUser.name
        }
      ]
    };
    setLeads(prev => [newLead, ...prev]);
    logAudit('lead', id, 'Criação de Lead', `Novo lead criado: ${newLead.name}`);
    addNotification({
      type: 'lead',
      title: 'Novo Lead Registado',
      message: `${newLead.name} (${newLead.service}) adicionado à base comercial.`,
      severity: 'info',
      linkTarget: 'crm'
    });
    return newLead;
  };

  const importBatchLeads = (newLeadsData: Omit<Lead, 'id' | 'timeline'>[]) => {
    let currentCount = leads.length;
    const createdLeads: Lead[] = newLeadsData.map((data, idx) => {
      const id = `LEAD-${String(currentCount + idx + 1).padStart(4, '0')}`;
      return {
        ...data,
        id,
        timeline: [
          {
            id: `tl-${Date.now()}-${idx}`,
            date: new Date().toISOString().replace('T', ' ').slice(0, 16),
            type: 'status_change',
            description: `Importado de lote Meta Ads (${data.campaignName || 'Meta Ads'})`,
            author: currentUser.name
          }
        ]
      };
    });

    setLeads(prev => [...createdLeads, ...prev]);
    logAudit('lead', 'BATCH', 'Importação em Lote', `${createdLeads.length} leads importados do Meta Ads`);
    addNotification({
      type: 'stage',
      title: 'Importação Meta Ads Concluída',
      message: `${createdLeads.length} leads foram importados com sucesso para o Pipeline de Leads Antigos.`,
      severity: 'success',
      linkTarget: 'leads_antigos'
    });
    return createdLeads.length;
  };

  const deleteLead = (id: string) => {
    setLeads(prev => prev.filter(l => l.id !== id));
    logAudit('lead', id, 'Exclusão de Lead', `Lead ${id} removido.`);
  };

  const updateLead = (id: string, updates: Partial<Lead>) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const moveLeadStatus = (leadId: string, newStatus: LeadStatus) => {
    setLeads(prev => prev.map(lead => {
      if (lead.id === leadId) {
        const interaction: any = {
          id: `tl-${Date.now()}`,
          date: new Date().toISOString().replace('T', ' ').slice(0, 16),
          type: 'status_change',
          description: `Status alterado para: ${newStatus.replace('_', ' ').toUpperCase()}`,
          author: currentUser.name
        };
        return {
          ...lead,
          status: newStatus,
          timeline: [interaction, ...lead.timeline]
        };
      }
      return lead;
    }));
    logAudit('lead', leadId, 'Mudança de Status', `Lead movido para ${newStatus}`);
  };

  const addLeadInteraction = (leadId: string, type: any, description: string) => {
    setLeads(prev => prev.map(lead => {
      if (lead.id === leadId) {
        const interaction: any = {
          id: `tl-${Date.now()}`,
          date: new Date().toISOString().replace('T', ' ').slice(0, 16),
          type,
          description,
          author: currentUser.name
        };
        return {
          ...lead,
          lastContactDate: new Date().toISOString().slice(0, 10),
          timeline: [interaction, ...lead.timeline]
        };
      }
      return lead;
    }));
  };

  const convertLeadToProjectAndClient = (
    leadId: string,
    customOptions?: { 
      status?: ProjectStatus; 
      serviceType?: string; 
      contractValue?: number;
      notes?: string;
    }
  ) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) throw new Error('Lead não encontrado');

    const effectiveCity = (!lead.city || lead.city.includes('Lisboa')) ? 'Barcelona' : lead.city;

    // 1. Create or match Client
    let client = clients.find(c => c.email.toLowerCase() === lead.email.toLowerCase() || c.phone === lead.phone);
    if (!client) {
      const clientCount = clients.length + 1;
      const clientId = `CLI-${String(clientCount).padStart(4, '0')}`;
      client = {
        id: clientId,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        address: lead.address || effectiveCity,
        city: effectiveCity,
        createdAt: new Date().toISOString().slice(0, 10),
        notes: `Convertido do Lead ${lead.id}`
      };
      setClients(prev => [...prev, client!]);
      logAudit('lead', clientId, 'Criação de Cliente', `Cliente criado via conversão de lead: ${client.name}`);
    }

    // 2. Create Project
    const projectCount = projects.length + 1;
    const projectId = `OB-${String(projectCount).padStart(4, '0')}`;
    const projectValue = customOptions?.contractValue !== undefined 
      ? customOptions.contractValue 
      : (lead.finalValue || lead.estimatedValue || 0);
    const serviceType = customOptions?.serviceType || lead.service || 'Reforma Geral';
    const status = customOptions?.status || 'em_execucao';
    const isCompleted = status === 'concluida';
    const progressPercent = isCompleted ? 100 : 0;
    
    const today = new Date().toISOString().slice(0, 10);
    const plannedEnd = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const project: Project = {
      id: projectId,
      clientId: client.id,
      title: `${serviceType} - ${lead.name}`,
      serviceType,
      address: lead.address || effectiveCity,
      city: effectiveCity,
      managerId: 'Ricardo Silva',
      startDate: today,
      plannedEndDate: plannedEnd,
      actualEndDate: isCompleted ? today : undefined,
      contractValue: projectValue,
      status,
      progressPercent,
      notes: customOptions?.notes || `Obra gerada automaticamente pela vitória do ${lead.id}. ${lead.notes || ''}`,
      createdAt: today
    };

    setProjects(prev => [...prev, project]);

    // 3. Create Default Stages for this Project
    const newStages: ProjectStage[] = [
      {
        id: `STG-${projectId}-1`,
        projectId,
        order: 1,
        category: 'DEMOLIÇÃO',
        name: 'Demolição e Preparação do Espaço',
        priority: 'alta',
        plannedStart: today,
        plannedEnd: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        durationDays: 10,
        status: isCompleted ? 'concluida' : 'em_execucao',
        progressPercent: isCompleted ? 100 : 0,
        delayDays: 0,
        isMilestone: true,
        triggersBilling: true,
        billingAmount: projectValue * 0.3,
        subtasks: [
          { id: `st-1`, name: 'Proteção de áreas comuns e elevadores', completed: isCompleted },
          { id: `st-2`, name: 'Demolição de alvenarias e revestimentos', completed: isCompleted },
          { id: `st-3`, name: 'Retirada e transporte de entulho', completed: isCompleted }
        ]
      },
      {
        id: `STG-${projectId}-2`,
        projectId,
        order: 2,
        category: 'INSTALAÇÕES',
        name: 'Redes Técnicas (Eletricidade e Hidráulica)',
        priority: 'alta',
        plannedStart: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        plannedEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        durationDays: 19,
        status: isCompleted ? 'concluida' : 'nao_iniciada',
        progressPercent: isCompleted ? 100 : 0,
        delayDays: 0,
        isMilestone: true,
        triggersBilling: true,
        billingAmount: projectValue * 0.3,
        subtasks: [
          { id: `st-4`, name: 'Passagem de prumadas e tubagens', completed: isCompleted },
          { id: `st-5`, name: 'Instalação de quadro elétrico e caixas de derivação', completed: isCompleted }
        ]
      },
      {
        id: `STG-${projectId}-3`,
        projectId,
        order: 3,
        category: 'REVESTIMENTOS',
        name: 'Pavimentos, Azulejos e Pinturas',
        priority: 'media',
        plannedStart: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        plannedEnd: plannedEnd,
        durationDays: 29,
        status: isCompleted ? 'concluida' : 'nao_iniciada',
        progressPercent: isCompleted ? 100 : 0,
        delayDays: 0,
        isMilestone: true,
        triggersBilling: true,
        billingAmount: projectValue * 0.4,
        subtasks: [
          { id: `st-6`, name: 'Assentamento de cerâmicas e chão', completed: isCompleted },
          { id: `st-7`, name: 'Pintura geral e acabamentos', completed: isCompleted },
          { id: `st-8`, name: 'Limpeza de fim de obra e entrega', completed: isCompleted }
        ]
      }
    ];

    setStages(prev => [...prev, ...newStages]);

    // 4. Create Billing Milestones
    const newMilestones: BillingMilestone[] = [
      {
        id: `MLS-${projectId}-1`,
        projectId,
        clientId: client.id,
        type: 'sinal',
        description: 'Sinal de Adjudicação (30%)',
        plannedAmount: projectValue * 0.3,
        plannedDate: today,
        invoiceIssued: false,
        isPaid: false,
        receivedAmount: 0,
        status: 'a_faturar'
      },
      {
        id: `MLS-${projectId}-2`,
        projectId,
        clientId: client.id,
        type: 'etapa',
        description: 'Conclusão de Demolições e Instalações (30%)',
        plannedAmount: projectValue * 0.3,
        plannedDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        invoiceIssued: false,
        isPaid: false,
        receivedAmount: 0,
        status: 'a_faturar'
      },
      {
        id: `MLS-${projectId}-3`,
        projectId,
        clientId: client.id,
        type: 'final',
        description: 'Entrega da Obra e Vistoria Final (40%)',
        plannedAmount: projectValue * 0.4,
        plannedDate: plannedEnd,
        invoiceIssued: false,
        isPaid: false,
        receivedAmount: 0,
        status: 'a_faturar'
      }
    ];
    setMilestones(prev => [...prev, ...newMilestones]);

    // 5. Update Lead
    updateLead(leadId, {
      status: 'vendido',
      finalValue: projectValue,
      clientId: client.id,
      projectId: project.id
    });

    logAudit('project', projectId, 'Obra Criada', `Obra ${projectId} criada com sucesso para o cliente ${client.name} no valor de €${projectValue.toLocaleString('pt-PT')}`);
    addNotification({
      type: 'payment',
      title: 'Obra Criada & Sinal a Faturar',
      message: `A obra ${projectId} (${project.title}) foi iniciada. Faturação do sinal de 30% pronta para emissão.`,
      severity: 'success',
      linkTarget: 'obras'
    });

    return { client, project };
  };

  // ===================== CLIENTS =====================
  const addClient = (clientData: Omit<Client, 'id' | 'createdAt'>): Client => {
    const nextNum = clients.length + 1;
    const id = `CLI-${String(nextNum).padStart(3, '0')}`;
    const newClient: Client = {
      ...clientData,
      id,
      createdAt: new Date().toISOString().slice(0, 10)
    };
    setClients(prev => [...prev, newClient]);
    logAudit('client', id, 'Criação de Cliente', `Cliente ${newClient.name} cadastrado na carteira.`);
    addNotification({
      type: 'lead',
      title: 'Novo Cliente Cadastrado',
      message: `${newClient.name} foi adicionado à carteira oficial de clientes.`,
      severity: 'success',
      linkTarget: 'clientes'
    });
    return newClient;
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    logAudit('client', id, 'Atualização de Cliente', `Dados do cliente ${id} atualizados.`);
  };

  const deleteClient = (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    logAudit('client', id, 'Eliminação de Cliente', `Cliente ${id} removido.`);
  };

  // ===================== PROJECT STAGES & SUBTASKS =====================
  const addProject = (projectData: Omit<Project, 'id' | 'createdAt'>): Project => {
    const projectCount = projects.length + 1;
    const id = `OB-${String(projectCount).padStart(4, '0')}`;
    const newProject: Project = {
      ...projectData,
      id,
      createdAt: new Date().toISOString().slice(0, 10)
    };
    setProjects(prev => [...prev, newProject]);
    logAudit('project', id, 'Criação Manual de Obra', `Obra criada: ${newProject.title}`);
    return newProject;
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    setStages(prev => prev.filter(s => s.projectId !== id));
    logAudit('project', id, 'Exclusão de Obra', `Obra ${id} removida.`);
  };

  const addStage = (stageData: Omit<ProjectStage, 'id'>) => {
    const id = `STG-${Date.now()}`;
    const newStage: ProjectStage = { ...stageData, id };
    setStages(prev => [...prev, newStage]);
  };

  const updateStage = (id: string, updates: Partial<ProjectStage>) => {
    setStages(prev => prev.map(s => {
      if (s.id === id) {
        const updated = { ...s, ...updates };
        // Check if finished and triggers billing
        if (updates.status === 'concluida' && updated.triggersBilling && s.status !== 'concluida') {
          addNotification({
            type: 'stage',
            title: `Marco Atingido: ${updated.name}`,
            message: `A etapa ${updated.name} da obra ${updated.projectId} foi concluída. Emitir cobrança de €${(updated.billingAmount || 0).toLocaleString('pt-PT')}.`,
            severity: 'success',
            linkTarget: 'faturas'
          });
        }
        return updated;
      }
      return s;
    }));

    // Recalculate project progress
    const stage = stages.find(s => s.id === id);
    if (stage) {
      const projStages = stages.map(s => s.id === id ? { ...s, ...updates } : s).filter(s => s.projectId === stage.projectId);
      if (projStages.length > 0) {
        const avg = Math.round(projStages.reduce((sum, st) => sum + st.progressPercent, 0) / projStages.length);
        updateProject(stage.projectId, { progressPercent: avg });
      }
    }
  };

  const archiveProject = (id: string, notes?: string) => {
    const today = new Date().toISOString().slice(0, 10);
    setProjects(prev => prev.map(p => p.id === id ? {
      ...p,
      isArchived: true,
      archivedDate: today,
      archivedNotes: notes || 'Obra finalizada com sucesso e arquivada no histórico.',
      status: 'concluida' as const,
      progressPercent: 100
    } : p));
    logAudit('project', id, 'Arquivamento de Obra', `Obra ${id} arquivada no histórico.`);
    addNotification({
      type: 'stage',
      title: 'Obra Arquivada no Histórico',
      message: `A obra ${id} foi arquivada com sucesso. Os dados permanecem disponíveis na aba de Histórico.`,
      severity: 'success',
      linkTarget: 'obras'
    });
  };

  const unarchiveProject = (id: string) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, isArchived: false } : p));
    logAudit('project', id, 'Reativação de Obra', `Obra ${id} reativada.`);
  };

  const toggleSubtask = (stageId: string, subtaskId: string) => {
    setStages(prev => prev.map(st => {
      if (st.id === stageId) {
        const updatedSubs = st.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s);
        const completedCount = updatedSubs.filter(s => s.completed).length;
        const progress = updatedSubs.length > 0 ? Math.round((completedCount / updatedSubs.length) * 100) : 0;
        return {
          ...st,
          subtasks: updatedSubs,
          progressPercent: progress,
          status: progress === 100 ? 'concluida' : progress > 0 ? 'em_execucao' : st.status
        };
      }
      return st;
    }));
  };

  const deleteStage = (stageId: string) => {
    setStages(prev => prev.filter(s => s.id !== stageId));
    logAudit('stage', stageId, 'Etapa Eliminada', `Etapa ${stageId} removida do plano.`);
  };

  const addSubtaskToStage = (stageId: string, subtaskName: string) => {
    if (!subtaskName.trim()) return;
    setStages(prev => prev.map(st => {
      if (st.id === stageId) {
        const newSubtask = {
          id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: subtaskName.trim(),
          completed: false
        };
        const updatedSubs = [...st.subtasks, newSubtask];
        const completedCount = updatedSubs.filter(s => s.completed).length;
        const progress = Math.round((completedCount / updatedSubs.length) * 100);
        return {
          ...st,
          subtasks: updatedSubs,
          progressPercent: progress
        };
      }
      return st;
    }));
  };

  const deleteSubtaskFromStage = (stageId: string, subtaskId: string) => {
    setStages(prev => prev.map(st => {
      if (st.id === stageId) {
        const updatedSubs = st.subtasks.filter(s => s.id !== subtaskId);
        const completedCount = updatedSubs.filter(s => s.completed).length;
        const progress = updatedSubs.length > 0 ? Math.round((completedCount / updatedSubs.length) * 100) : 100;
        return {
          ...st,
          subtasks: updatedSubs,
          progressPercent: progress
        };
      }
      return st;
    }));
  };

  const applyStageTemplate = (projectId: string, templateType: 'integral' | 'cozinha' | 'banheiro' | 'pintura') => {
    const proj = projects.find(p => p.id === projectId);
    const contractVal = proj ? proj.contractValue : 30000;
    const today = new Date().toISOString().slice(0, 10);

    let templateStages: Omit<ProjectStage, 'id'>[] = [];

    if (templateType === 'integral') {
      templateStages = [
        {
          projectId,
          order: 1,
          category: 'DEMOLIÇÃO & PROTEÇÃO',
          name: '1. Demolição e Limpeza do Espaço',
          description: 'Proteção de elevador e escadas comuns, desmonte de mobiliário existente e demolição de paredes.',
          priority: 'alta',
          plannedStart: today,
          plannedEnd: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          durationDays: 10,
          status: 'em_execucao',
          progressPercent: 0,
          delayDays: 0,
          isMilestone: true,
          triggersBilling: true,
          billingAmount: contractVal * 0.25,
          subtasks: [
            { id: `st-${Date.now()}-1`, name: 'Proteção de elevador, corredor e escadaria do prédio', completed: false },
            { id: `st-${Date.now()}-2`, name: 'Desmonte e remoção de sanitários e mobiliário antigo', completed: false },
            { id: `st-${Date.now()}-3`, name: 'Demolição de paredes divisórias e picagem de azulejos', completed: false },
            { id: `st-${Date.now()}-4`, name: 'Carga e transporte de entulho para vazadouro autorizado', completed: false }
          ]
        },
        {
          projectId,
          order: 2,
          category: 'INSTALAÇÕES TÉCNICAS',
          name: '2. Redes de Águas, Eletricidade e AVAC',
          description: 'Nova tubagem multicamada, nova rede de esgotos, passagem de condutores e quadro elétrico.',
          priority: 'urgente',
          plannedStart: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          plannedEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          durationDays: 19,
          status: 'nao_iniciada',
          progressPercent: 0,
          delayDays: 0,
          isMilestone: true,
          triggersBilling: true,
          billingAmount: contractVal * 0.30,
          subtasks: [
            { id: `st-${Date.now()}-5`, name: 'Nova prumada de água fria/quente e esgotos sanitários', completed: false },
            { id: `st-${Date.now()}-6`, name: 'Execução de novos circuitos elétricos e quadro geral', completed: false },
            { id: `st-${Date.now()}-7`, name: 'Pré-instalação de ar condicionado multi-split', completed: false },
            { id: `st-${Date.now()}-8`, name: 'Ensaio de estanquidade e pressão das redes hidráulicas', completed: false }
          ]
        },
        {
          projectId,
          order: 3,
          category: 'REVESTIMENTOS',
          name: '3. Chão, Azulejos e Regularização',
          description: 'Impermeabilização com tela líquida, assentamento de cerâmicos e pavimento flutuante.',
          priority: 'alta',
          plannedStart: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          plannedEnd: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          durationDays: 19,
          status: 'nao_iniciada',
          progressPercent: 0,
          delayDays: 0,
          isMilestone: true,
          triggersBilling: true,
          billingAmount: contractVal * 0.25,
          subtasks: [
            { id: `st-${Date.now()}-9`, name: 'Impermeabilização de zonas de duche com tela e fita elástica', completed: false },
            { id: `st-${Date.now()}-10`, name: 'Assentamento de cerâmicos retificados e betumação', completed: false },
            { id: `st-${Date.now()}-11`, name: 'Nivelamento de chão e instalação de soalho flutuante / parquet', completed: false }
          ]
        },
        {
          projectId,
          order: 4,
          category: 'CARPINTARIAS & PINTURA',
          name: '4. Carpintarias, Pinturas e Entrega Final',
          description: 'Montagem de portas de interior lacadas, pintura a 2 demãos e entrega de chaves.',
          priority: 'media',
          plannedStart: new Date(Date.now() + 51 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          plannedEnd: new Date(Date.now() + 65 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          durationDays: 14,
          status: 'nao_iniciada',
          progressPercent: 0,
          delayDays: 0,
          isMilestone: true,
          triggersBilling: true,
          billingAmount: contractVal * 0.20,
          subtasks: [
            { id: `st-${Date.now()}-12`, name: 'Barramento, lixagem e pintura geral de paredes e tetos', completed: false },
            { id: `st-${Date.now()}-13`, name: 'Fornecimento e montagem de portas e rodapés lacados a branco', completed: false },
            { id: `st-${Date.now()}-14`, name: 'Instalação de louças sanitárias suspensas, torneiras e focos LED', completed: false },
            { id: `st-${Date.now()}-15`, name: 'Limpeza profissional pós-obra e vistoria de entrega', completed: false }
          ]
        }
      ];
    } else if (templateType === 'cozinha') {
      templateStages = [
        {
          projectId,
          order: 1,
          category: 'DEMOLIÇÃO',
          name: '1. Desmonte da Cozinha Antiga',
          priority: 'alta',
          plannedStart: today,
          plannedEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          durationDays: 5,
          status: 'em_execucao',
          progressPercent: 0,
          delayDays: 0,
          isMilestone: true,
          triggersBilling: true,
          billingAmount: contractVal * 0.35,
          subtasks: [
            { id: `st-k-1`, name: 'Corte de água e gás com segurança', completed: false },
            { id: `st-k-2`, name: 'Desmonte de armários, bancada e lava-louça', completed: false },
            { id: `st-k-3`, name: 'Picagem de azulejos e remoção de entulho', completed: false }
          ]
        },
        {
          projectId,
          order: 2,
          category: 'INSTALAÇÕES',
          name: '2. Eletricidade Dedicada e Águas',
          priority: 'alta',
          plannedStart: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          plannedEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          durationDays: 9,
          status: 'nao_iniciada',
          progressPercent: 0,
          delayDays: 0,
          isMilestone: true,
          triggersBilling: true,
          billingAmount: contractVal * 0.35,
          subtasks: [
            { id: `st-k-4`, name: 'Circuitos 6mm² para placa de indução e fornos', completed: false },
            { id: `st-k-5`, name: 'Tubagens de água e saída de esgoto para máquina', completed: false },
            { id: `st-k-6`, name: 'Iluminação técnica LED sob armários superiores', completed: false }
          ]
        },
        {
          projectId,
          order: 3,
          category: 'MONTAGEM',
          name: '3. Montagem de Armários, Bancada e Eletrodomésticos',
          priority: 'alta',
          plannedStart: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          plannedEnd: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          durationDays: 9,
          status: 'nao_iniciada',
          progressPercent: 0,
          delayDays: 0,
          isMilestone: true,
          triggersBilling: true,
          billingAmount: contractVal * 0.30,
          subtasks: [
            { id: `st-k-7`, name: 'Montagem dos módulos inferiores e superiores', completed: false },
            { id: `st-k-8`, name: 'Instalação da bancada em Silestone / Quartzo', completed: false },
            { id: `st-k-9`, name: 'Ligação e testes de eletrodomésticos e torneira', completed: false }
          ]
        }
      ];
    } else if (templateType === 'banheiro') {
      templateStages = [
        {
          projectId,
          order: 1,
          category: 'DEMOLIÇÃO',
          name: '1. Desmonte e Remoção de Sanitários',
          priority: 'alta',
          plannedStart: today,
          plannedEnd: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          durationDays: 4,
          status: 'em_execucao',
          progressPercent: 0,
          delayDays: 0,
          isMilestone: true,
          triggersBilling: true,
          billingAmount: contractVal * 0.4,
          subtasks: [
            { id: `st-b-1`, name: 'Remoção de banheira antiga e sanitários', completed: false },
            { id: `st-b-2`, name: 'Remoção de azulejos e chão antigo', completed: false }
          ]
        },
        {
          projectId,
          order: 2,
          category: 'INSTALAÇÕES & IMPERMEABILIZAÇÃO',
          name: '2. Canalização, Base de Duche e Azulejos',
          priority: 'urgente',
          plannedStart: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          plannedEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          durationDays: 9,
          status: 'nao_iniciada',
          progressPercent: 0,
          delayDays: 0,
          isMilestone: true,
          triggersBilling: true,
          billingAmount: contractVal * 0.35,
          subtasks: [
            { id: `st-b-3`, name: 'Nova tubagem de água quente/fria e ralo sifonado', completed: false },
            { id: `st-b-4`, name: 'Aplicação de tela líquida impermeabilizante', completed: false },
            { id: `st-b-5`, name: 'Colocação de base de duche e assentamento de azulejo', completed: false }
          ]
        },
        {
          projectId,
          order: 3,
          category: 'ACABAMENTOS',
          name: '3. Louças Suspensas, Torneiras e Resguardo',
          priority: 'media',
          plannedStart: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          plannedEnd: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          durationDays: 5,
          status: 'nao_iniciada',
          progressPercent: 0,
          delayDays: 0,
          isMilestone: true,
          triggersBilling: true,
          billingAmount: contractVal * 0.25,
          subtasks: [
            { id: `st-b-6`, name: 'Montagem de sanita suspensa e móvel lavatório', completed: false },
            { id: `st-b-7`, name: 'Instalação de resguardo em vidro temperado', completed: false },
            { id: `st-b-8`, name: 'Limpeza e testes de fluxo', completed: false }
          ]
        }
      ];
    } else {
      templateStages = [
        {
          projectId,
          order: 1,
          category: 'PREPARAÇÃO',
          name: '1. Proteção de Chão e Tratamento de Fissuras',
          priority: 'media',
          plannedStart: today,
          plannedEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          durationDays: 5,
          status: 'em_execucao',
          progressPercent: 0,
          delayDays: 0,
          isMilestone: true,
          triggersBilling: true,
          billingAmount: contractVal * 0.5,
          subtasks: [
            { id: `st-p-1`, name: 'Proteção de pavimentos e rodapés com papel kraft', completed: false },
            { id: `st-p-2`, name: 'Abertura e enchimento de fendas com massa', completed: false },
            { id: `st-p-3`, name: 'Lixagem mecânica e aspiração', completed: false }
          ]
        },
        {
          projectId,
          order: 2,
          category: 'PINTURA',
          name: '2. Pintura a 2 Demãos e Acabamento',
          priority: 'media',
          plannedStart: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          plannedEnd: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          durationDays: 6,
          status: 'nao_iniciada',
          progressPercent: 0,
          delayDays: 0,
          isMilestone: true,
          triggersBilling: true,
          billingAmount: contractVal * 0.5,
          subtasks: [
            { id: `st-p-4`, name: 'Primeira demão de tinta lavável mate', completed: false },
            { id: `st-p-5`, name: 'Segunda demão uniforme', completed: false },
            { id: `st-p-6`, name: 'Retirada de fitas e limpeza de entrega', completed: false }
          ]
        }
      ];
    }

    // Replace or append stages for this project
    const created = templateStages.map((st, idx) => ({
      ...st,
      id: `STG-${projectId}-${Date.now()}-${idx}`
    }));

    setStages(prev => [...prev.filter(s => s.projectId !== projectId), ...created]);
    logAudit('project', projectId, 'Modelo de Plano Aplicado', `Modelo "${templateType}" carregado com ${created.length} etapas.`);
    addNotification({
      type: 'stage',
      title: 'Plano de Obra Gerado com Sucesso',
      message: `${created.length} etapas e respetivas subetapas foram criadas na obra ${projectId}.`,
      severity: 'success',
      linkTarget: 'plano_obra'
    });
  };

  // Fixed expenses actions
  const addFixedExpense = (expData: Omit<FixedExpense, 'id'>) => {
    const id = `FIX-${Date.now()}`;
    const newFix: FixedExpense = { ...expData, id };
    setFixedExpenses(prev => [newFix, ...prev]);
    logAudit('project', id, 'Gasto Fixo Criado', `Gasto de estrutura: ${newFix.description} (€${newFix.amount})`);
  };

  const updateFixedExpense = (id: string, updates: Partial<FixedExpense>) => {
    setFixedExpenses(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const deleteFixedExpense = (id: string) => {
    setFixedExpenses(prev => prev.filter(f => f.id !== id));
  };

  // ===================== COLABORADORES & EQUIPA =====================
  const addEmployee = (empData: Omit<Employee, 'id'>): Employee => {
    const id = `EMP-${String(employees.length + 1).padStart(3, '0')}`;
    const newEmp: Employee = {
      ...empData,
      id,
      dailyRate: Number(empData.dailyRate) || 90,
      halfDayRate: Number(empData.halfDayRate) || 50,
      hourlyRate: Number(empData.hourlyRate) || 12,
      status: empData.status || 'ativo'
    };
    setEmployees(prev => [newEmp, ...prev]);
    logAudit('shift', id, 'Criação', `Colaborador ${newEmp.name} (${newEmp.role}) adicionado`);
    return newEmp;
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    logAudit('shift', id, 'Atualização', `Colaborador ${id} atualizado`);
  };

  const deleteEmployee = (id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
    logAudit('shift', id, 'Eliminação', `Colaborador ${id} removido`);
  };

  // ===================== FERRAMENTAS & EQUIPAMENTOS =====================
  const addTool = (toolData: Omit<ToolItem, 'id'>): ToolItem => {
    const id = `tool-${Date.now()}`;
    const code = toolData.code || `FER-${String(tools.length + 1).padStart(3, '0')}`;
    const newTool: ToolItem = {
      ...toolData,
      id,
      code,
      status: toolData.status || 'disponivel',
      currentLocation: toolData.currentLocation || 'Armazém Central'
    };
    setTools(prev => [newTool, ...prev]);
    logAudit('project', id, 'Registo de Ferramenta', `Ferramenta ${newTool.name} (${code}) registada`);
    return newTool;
  };

  const updateTool = (id: string, updates: Partial<ToolItem>) => {
    setTools(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    logAudit('project', id, 'Atualização de Ferramenta', `Ferramenta ${id} atualizada`);
  };

  const deleteTool = (id: string) => {
    setTools(prev => prev.filter(t => t.id !== id));
    logAudit('project', id, 'Eliminação de Ferramenta', `Ferramenta ${id} removida`);
  };

  // ===================== STOCK DE MATERIAIS =====================
  const addMaterialStockItem = (itemData: Omit<MaterialStockItem, 'id'>): MaterialStockItem => {
    const id = `stk-${Date.now()}`;
    const code = itemData.code || `MAT-${String(materialStock.length + 1).padStart(3, '0')}`;
    const newItem: MaterialStockItem = {
      ...itemData,
      id,
      code,
      quantity: Number(itemData.quantity) || 0
    };
    setMaterialStock(prev => [newItem, ...prev]);
    return newItem;
  };

  const updateMaterialStockItem = (id: string, updates: Partial<MaterialStockItem>) => {
    setMaterialStock(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const deleteMaterialStockItem = (id: string) => {
    setMaterialStock(prev => prev.filter(m => m.id !== id));
  };

  // ===================== SHIFTS / DIÁRIAS =====================
  const addShift = (shiftData: Omit<EmployeeShift, 'id'>) => {
    const id = `SHF-${Date.now()}`;
    const newShift: EmployeeShift = { ...shiftData, id };
    setShifts(prev => [newShift, ...prev]);
    logAudit('shift', id, 'Registo de Diária', `Diária de €${newShift.totalValue} registada para o colaborador na obra ${newShift.projectId}`);
  };

  const updateShiftStatus = (shiftId: string, status: ShiftStatus, paymentInfo?: { method: string; date: string }) => {
    setShifts(prev => prev.map(s => {
      if (s.id === shiftId) {
        return {
          ...s,
          status,
          paymentDate: paymentInfo ? paymentInfo.date : s.paymentDate,
          paymentMethod: paymentInfo ? paymentInfo.method : s.paymentMethod
        };
      }
      return s;
    }));
    logAudit('shift', shiftId, 'Atualização de Diária', `Status da diária atualizado para ${status}`);
  };

  // ===================== MATERIAIS & DESPESAS =====================
  const addMaterial = (matData: Omit<MaterialPurchase, 'id'>) => {
    const id = `MAT-${Date.now()}`;
    const vatAmount = matData.vatAmount || (matData.baseAmount * (matData.vatRate / 100));
    const totalAmount = matData.totalAmount || (matData.baseAmount + vatAmount);
    const newMat: MaterialPurchase = {
      ...matData,
      id,
      vatAmount,
      totalAmount
    };
    setMaterials(prev => [newMat, ...prev]);
    logAudit('material', id, 'Compra de Material', `Compra de €${totalAmount} (${newMat.supplier}) lançada na obra ${newMat.projectId}`);
  };

  const updateMaterial = (id: string, updates: Partial<MaterialPurchase>) => {
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const addExpense = (expData: Omit<Expense, 'id'>) => {
    const id = `EXP-${Date.now()}`;
    const newExp: Expense = { ...expData, id };
    setExpenses(prev => [newExp, ...prev]);
    logAudit('project', id, 'Registo de Despesa', `Despesa de €${newExp.totalAmount} (${newExp.category}) registada.`);
  };

  const updateExpense = (id: string, updates: Partial<Expense>) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  // ===================== FATURAS & PAGAMENTOS =====================
  const createInvoice = (invData: Omit<Invoice, 'id' | 'code' | 'receivedAmount'> & { code?: string }): Invoice => {
    const nextNum = invoices.length + 1;
    const id = `FAT-${Date.now()}`;
    const code = invData.code?.trim() || `FAT-2026/${String(nextNum).padStart(3, '0')}`;
    const newInv: Invoice = {
      ...invData,
      id,
      code,
      receivedAmount: 0
    };
    setInvoices(prev => [newInv, ...prev]);

    // If external invoice has document, save to project documents automatically
    if (newInv.documentUrl && newInv.projectId) {
      addDocument({
        projectId: newInv.projectId,
        title: newInv.documentName || `Fatura Cliente ${code}`,
        type: 'fatura',
        url: newInv.documentUrl,
        fileSize: '1.2 MB',
        uploadDate: new Date().toISOString().slice(0, 10)
      });
    }

    // If installments are defined, create milestones for each installment
    if (newInv.installments && newInv.installments.length > 0) {
      const newMilestones: BillingMilestone[] = newInv.installments.map(inst => ({
        id: `MIL-${Date.now()}-${inst.number}`,
        projectId: newInv.projectId,
        clientId: newInv.clientId,
        type: 'parcela',
        description: `Parcela ${inst.number}/${newInv.installments!.length} - Fatura ${code}`,
        plannedAmount: inst.amount,
        plannedDate: inst.dueDate,
        invoiceId: id,
        invoiceIssued: true,
        invoiceNumber: code,
        issueDate: newInv.issueDate,
        isPaid: inst.isPaid,
        receivedAmount: inst.isPaid ? inst.amount : 0,
        status: inst.isPaid ? 'paga' : 'faturada'
      }));
      setMilestones(prev => [...prev, ...newMilestones]);
    }

    logAudit('invoice', id, 'Registo de Fatura', `Fatura ${code} registada para a obra ${newInv.projectId} no valor de €${newInv.totalAmount}`);
    addNotification({
      type: 'invoice',
      title: `Fatura ${code} Registada`,
      message: `Fatura no valor de €${newInv.totalAmount.toLocaleString('pt-PT')} registada com sucesso.`,
      severity: 'info',
      linkTarget: 'faturas'
    });
    return newInv;
  };

  const recordPayment = (payData: Omit<Payment, 'id'>): Payment => {
    const id = `PAY-${Date.now()}`;
    const newPayment: Payment = { ...payData, id };
    setPayments(prev => [newPayment, ...prev]);

    // Update invoice received amount & status
    setInvoices(prev => prev.map(inv => {
      if (inv.id === newPayment.invoiceId) {
        const newReceived = inv.receivedAmount + newPayment.amount;
        const newStatus = newReceived >= inv.totalAmount ? 'paga' : 'parcialmente_paga';
        return {
          ...inv,
          receivedAmount: newReceived,
          status: newStatus
        };
      }
      return inv;
    }));

    logAudit('payment', id, 'Registo de Recebimento', `Recebimento de €${newPayment.amount} registado (Fatura ${newPayment.invoiceId}).`);
    addNotification({
      type: 'payment',
      title: 'Pagamento Recebido',
      message: `Recebimento de €${newPayment.amount.toLocaleString('pt-PT')} confirmado para a obra ${newPayment.projectId}.`,
      severity: 'success',
      linkTarget: 'financeiro'
    });
    return newPayment;
  };

  // ===================== ALTERAÇÕES / EXTRAS =====================
  const addChangeOrder = (coData: Omit<ChangeOrder, 'id' | 'code'>) => {
    const count = changeOrders.length + 1;
    const id = `CHG-${Date.now()}`;
    const code = `EXT-${String(count).padStart(4, '0')}`;
    const newCO: ChangeOrder = { ...coData, id, code };
    setChangeOrders(prev => [newCO, ...prev]);
    logAudit('change_order', id, 'Novo Aditivo/Extra', `Solicitado extra: ${newCO.description} (+€${newCO.additionalAmount})`);
  };

  const approveChangeOrder = (id: string) => {
    setChangeOrders(prev => prev.map(co => {
      if (co.id === id) {
        const updated = {
          ...co,
          status: 'aprovado' as const,
          approvalDate: new Date().toISOString().slice(0, 10)
        };
        logAudit('change_order', id, 'Aprovação de Extra', `Extra ${co.code} de €${co.additionalAmount} aprovado. Contrato da obra atualizado.`);
        addNotification({
          type: 'quote',
          title: `Trabalho Extra Aprovado (${co.code})`,
          message: `Extra de €${co.additionalAmount.toLocaleString('pt-PT')} aprovado. Valor total da obra ${co.projectId} recalculado.`,
          severity: 'success',
          linkTarget: 'obras'
        });
        return updated;
      }
      return co;
    }));
  };

  const rejectChangeOrder = (id: string) => {
    setChangeOrders(prev => prev.map(co => co.id === id ? { ...co, status: 'recusado' as const } : co));
  };

  // ===================== DIÁRIOS, FOTOS & DOCS =====================
  const addDailyLog = (logData: Omit<DailyLog, 'id'>) => {
    const id = `LOG-${Date.now()}`;
    const newLog: DailyLog = { ...logData, id };
    setDailyLogs(prev => [newLog, ...prev]);
  };

  const addPhoto = (photoData: Omit<ProjectPhoto, 'id'>) => {
    const id = `PHT-${Date.now()}`;
    const newPhoto: ProjectPhoto = { ...photoData, id };
    setPhotos(prev => [newPhoto, ...prev]);
  };

  const addDocument = (docData: Omit<ProjectDocument, 'id'>) => {
    const id = `DOC-${Date.now()}`;
    const newDoc: ProjectDocument = { ...docData, id };
    setDocuments(prev => [newDoc, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // ===================== RESET & IMPORT =====================
  const resetToDefaultData = () => {
    clearAllDemoData();
  };

  const clearAllDemoData = () => {
    localStorage.clear();
    localStorage.setItem('prime_clean_mode', 'true');
    setIsCleanMode(true);
    setLeads([]);
    setClients([]);
    setProjects([]);
    setStages([]);
    setEmployees([]);
    setShifts([]);
    setMaterials([]);
    setExpenses([]);
    setFixedExpenses([]);
    setQuotes([]);
    setInvoices([]);
    setPayments([]);
    setMilestones([]);
    setChangeOrders([]);
    setDailyLogs([]);
    setPhotos([]);
    setDocuments([]);
    setNotifications([]);
    setAuditLogs([]);
    setCurrentUser(INITIAL_USERS[0]);

    // Wipe central server database
    fetch('/api/clean', { method: 'POST' }).catch(() => {});

    addNotification({
      type: 'stage',
      title: 'Sistema em Modo Limpo',
      message: 'Todos os dados de teste foram apagados. O sistema está 100% limpo e pronto para a sua operação real.',
      severity: 'info',
      linkTarget: 'dashboard'
    });
  };

  const importParsedData = (data: any) => {
    if (data.leads && Array.isArray(data.leads)) setLeads(prev => [...data.leads, ...prev]);
    if (data.projects && Array.isArray(data.projects)) setProjects(prev => [...data.projects, ...prev]);
    if (data.clients && Array.isArray(data.clients)) setClients(prev => [...data.clients, ...prev]);
    if (data.stages && Array.isArray(data.stages)) setStages(prev => [...data.stages, ...prev]);
    if (data.shifts && Array.isArray(data.shifts)) setShifts(prev => [...data.shifts, ...prev]);
    if (data.materials && Array.isArray(data.materials)) setMaterials(prev => [...data.materials, ...prev]);
    if (data.invoices && Array.isArray(data.invoices)) setInvoices(prev => [...data.invoices, ...prev]);
    
    addNotification({
      type: 'stage',
      title: 'Importação Concluída com Sucesso',
      message: 'Os dados do ficheiro Excel foram sincronizados e os relacionamentos atualizados.',
      severity: 'success',
      linkTarget: 'dashboard'
    });
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      switchRole,
      activeTab,
      setActiveTab,
      selectedProjectId,
      setSelectedProjectId,
      selectedLeadId,
      setSelectedLeadId,
      searchOpen,
      setSearchOpen,
      searchQuery,
      setSearchQuery,
      leads,
      clients,
      projects,
      stages,
      employees,
      shifts,
      tools,
      materialStock,
      materials,
      expenses,
      fixedExpenses,
      quotes,
      invoices,
      payments,
      milestones,
      changeOrders,
      dailyLogs,
      photos,
      documents,
      notifications,
      auditLogs,
      addEmployee,
      updateEmployee,
      deleteEmployee,
      addTool,
      updateTool,
      deleteTool,
      addMaterialStockItem,
      updateMaterialStockItem,
      deleteMaterialStockItem,
      addLead,
      importBatchLeads,
      deleteLead,
      updateLead,
      moveLeadStatus,
      addLeadInteraction,
      convertLeadToProjectAndClient,
      addClient,
      updateClient,
      deleteClient,
      addProject,
      updateProject,
      deleteProject,
      archiveProject,
      unarchiveProject,
      addStage,
      updateStage,
      deleteStage,
      toggleSubtask,
      addSubtaskToStage,
      deleteSubtaskFromStage,
      applyStageTemplate,
      addShift,
      updateShiftStatus,
      addMaterial,
      updateMaterial,
      addExpense,
      updateExpense,
      addFixedExpense,
      updateFixedExpense,
      deleteFixedExpense,
      createInvoice,
      recordPayment,
      addChangeOrder,
      approveChangeOrder,
      rejectChangeOrder,
      addDailyLog,
      addPhoto,
      addDocument,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      getProjectFinancialSummary,
      getEmployeeSummary,
      getExecutiveStats,
      resetToDefaultData,
      clearAllDemoData,
      isCleanMode,
      importParsedData,
      isAuthenticated,
      login,
      logout,
      systemPassword,
      updateSystemPassword,
      mobileMenuOpen,
      setMobileMenuOpen
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
