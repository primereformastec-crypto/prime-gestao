import { 
  User, Lead, Client, Project, ProjectStage, Employee, 
  EmployeeShift, MaterialPurchase, Expense, Quote, Invoice, 
  Payment, BillingMilestone, ChangeOrder, DailyLog, ProjectPhoto, 
  ProjectDocument, AppNotification, AuditLog, FixedExpense 
} from '../types';

export const INITIAL_USERS: User[] = [
  { 
    id: 'usr-1', 
    name: 'PRIME Gestão', 
    email: 'admin@primegestao.pt', 
    role: 'admin', 
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80' 
  }
];

export const INITIAL_EMPLOYEES: Employee[] = [];
export const INITIAL_CLIENTS: Client[] = [];
export const INITIAL_PROJECTS: Project[] = [];
export const INITIAL_STAGES: ProjectStage[] = [];
export const INITIAL_SHIFTS: EmployeeShift[] = [];
export const INITIAL_MATERIALS: MaterialPurchase[] = [];
export const INITIAL_EXPENSES: Expense[] = [];
export const INITIAL_FIXED_EXPENSES: FixedExpense[] = [];
export const INITIAL_QUOTES: Quote[] = [];
export const INITIAL_INVOICES: Invoice[] = [];
export const INITIAL_PAYMENTS: Payment[] = [];
export const INITIAL_MILESTONES: BillingMilestone[] = [];
export const INITIAL_CHANGE_ORDERS: ChangeOrder[] = [];
export const INITIAL_DAILY_LOGS: DailyLog[] = [];
export const INITIAL_PHOTOS: ProjectPhoto[] = [];
export const INITIAL_DOCUMENTS: ProjectDocument[] = [];
export const INITIAL_LEADS: Lead[] = [];
export const INITIAL_NOTIFICATIONS: AppNotification[] = [];
export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
