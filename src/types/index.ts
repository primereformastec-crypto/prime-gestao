export type UserRole = 
  | 'admin' 
  | 'comercial' 
  | 'financeiro' 
  | 'gestor' 
  | 'funcionario' 
  | 'cliente';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  employeeId?: string; // For funcionario
  clientId?: string;   // For cliente
}

// ===================== CRM / LEADS =====================
export type LeadStatus = 
  | 'novo_lead' 
  | 'tentativa_contacto' 
  | 'contactado' 
  | 'qualificado' 
  | 'visita_agendada' 
  | 'visita_realizada' 
  | 'orcamento_enviado' 
  | 'negociacao' 
  | 'vendido' 
  | 'perdido';

export interface LeadInteraction {
  id: string;
  date: string;
  type: 'chamada' | 'whatsapp' | 'email' | 'visita' | 'orcamento' | 'nota' | 'status_change';
  description: string;
  author: string;
}

export interface Lead {
  id: string; // LEAD-0001
  name: string;
  phone: string;
  email: string;
  city: string;
  address?: string;
  source: 'Meta Ads' | 'Google' | 'Indicação' | 'Instagram' | 'Site' | 'Outro';
  service: string; // e.g. 'Banheiros', 'Cozinhas', 'Reforma Integral', 'Pintura', 'Parquet'
  salesRep: string; // Comercial responsável
  dateAdded: string;
  lastContactDate?: string;
  nextFollowUpDate?: string;
  nextAction?: string;
  visitDate?: string;
  quoteSentDate?: string;
  estimatedValue: number;
  finalValue?: number;
  status: LeadStatus;
  lostReason?: string;
  notes?: string;
  timeline: LeadInteraction[];
  clientId?: string;
  projectId?: string;
  isLegacy?: boolean; // True for historical Meta Ads leads
  campaignName?: string;
  adName?: string;
  rawMetaFields?: Record<string, any>;
}

// ===================== CLIENTES =====================
export interface Client {
  id: string; // CLI-0001
  name: string;
  phone: string;
  email: string;
  nif?: string;
  address: string;
  city: string;
  postalCode?: string;
  notes?: string;
  createdAt: string;
  totalSpent?: number;
}

// ===================== OBRAS =====================
export type ProjectStatus = 
  | 'nao_iniciada' 
  | 'agendada' 
  | 'em_execucao' 
  | 'pausada' 
  | 'concluida' 
  | 'cancelada';

export interface Project {
  id: string; // OB-0001
  clientId: string;
  title: string;
  serviceType: string;
  address: string;
  city: string;
  managerId: string; // Gestor responsável
  startDate: string;
  plannedEndDate: string;
  actualEndDate?: string;
  contractValue: number; // Base contract
  status: ProjectStatus;
  progressPercent: number;
  notes?: string;
  createdAt: string;
  isArchived?: boolean;
  archivedDate?: string;
  archivedNotes?: string;
}

// ===================== GASTOS FIXOS DA EMPRESA =====================
export type FixedExpenseCategory = 
  | 'renda_armazem' 
  | 'contabilidade' 
  | 'seguros' 
  | 'viaturas_combustivel' 
  | 'software_telecom' 
  | 'eletricidade_agua' 
  | 'outros';

export interface FixedExpense {
  id: string;
  category: FixedExpenseCategory;
  description: string;
  amount: number;
  vatAmount?: number;
  frequency: 'mensal' | 'anual' | 'trimestral';
  dueDate: string; // e.g. "Dia 05 de cada mês" or specific date
  supplier: string;
  isPaid: boolean;
  notes?: string;
}

// ===================== PLANO DE OBRA / CRONOGRAMA =====================
export type StageStatus = 
  | 'nao_iniciada' 
  | 'em_execucao' 
  | 'concluida' 
  | 'pausada' 
  | 'atrasada' 
  | 'cancelada';

export interface Subtask {
  id: string;
  name: string;
  completed: boolean;
}

export interface ProjectStage {
  id: string;
  projectId: string;
  order: number;
  category: string; // Demolição, Instalações, Revestimentos, Carpintaria, etc.
  name: string;
  description?: string;
  managerId?: string;
  assignedTeam?: string[]; // Employee IDs
  priority: 'baixa' | 'media' | 'alta' | 'urgente';
  plannedStart: string;
  plannedEnd: string;
  durationDays: number;
  actualStart?: string;
  actualEnd?: string;
  status: StageStatus;
  progressPercent: number;
  dependencyStageId?: string;
  delayDays: number;
  isMilestone: boolean;
  triggersBilling: boolean;
  billingAmount?: number;
  notes?: string;
  subtasks: Subtask[];
}

// ===================== FUNCIONÁRIOS & DIÁRIAS =====================
export interface Employee {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: string; // Encarregado, Pedreiro, Eletricista, Pintor, Ajudante, etc.
  dailyRate: number; // Valor diária
  halfDayRate: number; // Meia diária
  hourlyRate: number; // Valor hora
  status: 'ativo' | 'inativo';
  avatar?: string;
  notes?: string;
}

export type ShiftType = 'diaria' | 'meia_diaria' | 'horas';
export type ShiftStatus = 'pendente' | 'aprovada' | 'paga';

export interface EmployeeShift {
  id: string;
  date: string;
  projectId: string;
  employeeId: string;
  type: ShiftType;
  hours: number;
  rate: number;
  totalValue: number;
  status: ShiftStatus;
  paymentDate?: string;
  paymentMethod?: string;
  notes?: string;
  photoUrl?: string;
  clockIn?: string;
  clockOut?: string;
}

// ===================== FERRAMENTAS & EQUIPAMENTOS =====================
export type ToolStatus = 'disponivel' | 'em_uso' | 'em_manutencao' | 'danificada';

export interface ToolItem {
  id: string;
  code: string; // Ex: FER-001
  name: string; // Ex: Martelo Perfurador SDS-Plus
  brand?: string; // Ex: Bosch Professional, Makita, DeWalt
  category: string; // Elétrica, Manual, Corte, Medição & Nível Laser, Pintura, Andaimes & Escadas, etc.
  status: ToolStatus;
  currentLocation: string; // Ex: "Armazém Central" ou ID/Nome da Obra
  assignedToEmployeeId?: string; // Colaborador responsável
  purchaseDate?: string;
  purchaseValue?: number;
  notes?: string;
}

// ===================== MATERIAIS & STOCK =====================
export interface MaterialPurchase {
  id: string;
  date: string;
  projectId: string;
  supplier: string;
  category: string; // Cimento/Argamassa, Cerâmicas, Tintas, Eletricidade, Canalização, Madeira, etc.
  description: string;
  baseAmount: number;
  vatRate: number; // e.g. 23%
  vatAmount: number;
  totalAmount: number;
  invoiceNumber?: string;
  isPaid: boolean;
  paymentDate?: string;
  paymentMethod?: string;
  documentUrl?: string;
  notes?: string;
}

export interface MaterialStockItem {
  id: string;
  code: string; // Ex: MAT-001
  name: string; // Ex: Argamassa Colante C2TE
  category: string; // Cimentos & Argamassas, Pladur & Perfis, Canalização, Pintura, Eletricidade, Cerâmica, etc.
  quantity: number;
  unit: string; // Saco, m², m, Lata, Un, Caixa, kg
  location: string; // Armazém Central, Sobra da Obra, etc.
  minQuantity?: number;
  unitPrice?: number;
  notes?: string;
}

// ===================== OUTROS GASTOS / DESPESAS =====================
export type ExpenseCategory = 
  | 'transporte' 
  | 'subempreiteiro' 
  | 'aluguer_maquinas' 
  | 'contentores' 
  | 'taxas' 
  | 'estacionamento' 
  | 'outros';

export interface Expense {
  id: string;
  date: string;
  projectId?: string; // Optional if general overhead, but usually project
  supplier: string;
  description: string;
  category: ExpenseCategory;
  baseAmount: number;
  vatAmount: number;
  totalAmount: number;
  dueDate: string;
  isPaid: boolean;
  paymentDate?: string;
  paymentMethod?: string;
  documentUrl?: string;
  notes?: string;
}

// ===================== ORÇAMENTOS =====================
export type QuoteStatus = 'rascunho' | 'enviado' | 'visualizado' | 'aceite' | 'recusado';

export interface QuoteItem {
  id: string;
  category: string;
  description: string;
  quantity: number;
  unit: string; // m2, un, ml, vg, etc.
  unitPrice: number;
  vatRate: number;
  total: number;
}

export interface Quote {
  id: string;
  code: string; // ORC-0001
  leadId?: string;
  clientId: string;
  projectId?: string;
  date: string;
  validUntil: string;
  status: QuoteStatus;
  items: QuoteItem[];
  subtotal: number;
  vatRate: number;
  vatTotal: number;
  discount: number;
  total: number;
  notes?: string;
}

// ===================== COBRANÇAS / MARCOS =====================
export type MilestoneType = 'sinal' | 'parcela' | 'partida' | 'etapa' | 'final' | 'extra';
export type MilestoneStatus = 'a_faturar' | 'faturada' | 'paga' | 'atrasada';

export interface BillingMilestone {
  id: string;
  projectId: string;
  clientId: string;
  type: MilestoneType;
  description: string;
  stageId?: string;
  plannedAmount: number;
  plannedDate: string;
  invoiceId?: string;
  invoiceIssued: boolean;
  invoiceNumber?: string;
  issueDate?: string;
  isPaid: boolean;
  paymentDate?: string;
  receivedAmount: number;
  status: MilestoneStatus;
}

// ===================== FATURAS =====================
export type InvoiceStatus = 
  | 'rascunho' 
  | 'emitida' 
  | 'enviada' 
  | 'pendente' 
  | 'parcialmente_paga' 
  | 'paga' 
  | 'vencida' 
  | 'cancelada';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  total: number;
}

export interface InvoiceInstallment {
  number: number;
  amount: number;
  dueDate: string;
  isPaid: boolean;
  paymentDate?: string;
  notes?: string;
}

export interface Invoice {
  id: string;
  code: string; // FAT-0001 ou código externo
  clientId: string;
  projectId: string;
  issueDate: string;
  dueDate: string;
  description: string;
  stageOrMilestone?: string;
  items: InvoiceItem[];
  baseAmount: number;
  vatAmount: number;
  totalAmount: number;
  receivedAmount: number;
  status: InvoiceStatus;
  paymentMethod?: string;
  notes?: string;
  documentUrl?: string; // Anexo da fatura externa (PDF/Foto)
  documentName?: string;
  isExternalInvoice?: boolean;
  hasInstallments?: boolean;
  installments?: InvoiceInstallment[];
}

// ===================== PAGAMENTOS RECEBIDOS =====================
export interface Payment {
  id: string;
  invoiceId: string;
  clientId: string;
  projectId: string;
  date: string;
  amount: number;
  method: 'transferencia' | 'cartao' | 'dinheiro' | 'bizum' | 'outro';
  bank?: string;
  reference?: string;
  notes?: string;
  receiptUrl?: string;
}

// ===================== ALTERAÇÕES / EXTRAS =====================
export type ChangeOrderStatus = 
  | 'aguardando_aprovacao' 
  | 'aprovado' 
  | 'recusado' 
  | 'executado' 
  | 'faturado';

export interface ChangeOrder {
  id: string;
  code: string; // EXT-0001
  projectId: string;
  description: string;
  additionalAmount: number;
  estimatedCost: number;
  additionalDays: number;
  requestDate: string;
  approvalDate?: string;
  status: ChangeOrderStatus;
  photoUrl?: string;
  notes?: string;
}

// ===================== DIÁRIO DE OBRA =====================
export interface DailyLog {
  id: string;
  projectId: string;
  date: string;
  weather?: string;
  workersPresent: string[]; // employee names
  workDone: string;
  issues?: string;
  materialsNeeded?: string;
  decisions?: string;
  photos?: string[];
  author: string;
}

// ===================== FOTOS & DOCUMENTOS =====================
export type PhotoCategory = 'antes' | 'execucao' | 'problema' | 'conclusao' | 'entrega';

export interface ProjectPhoto {
  id: string;
  projectId: string;
  date: string;
  stageId?: string;
  employeeName?: string;
  url: string;
  caption: string;
  category: PhotoCategory;
}

export interface ProjectDocument {
  id: string;
  projectId: string;
  title: string;
  type: 'contrato' | 'orcamento' | 'fatura' | 'planta' | 'licenca' | 'recibo' | 'outro';
  url: string;
  uploadDate: string;
  fileSize: string;
}

// ===================== ALERTAS / NOTIFICAÇÕES =====================
export interface AppNotification {
  id: string;
  type: 'lead' | 'followup' | 'visit' | 'quote' | 'stage' | 'invoice' | 'payment' | 'margin' | 'shift';
  title: string;
  message: string;
  date: string;
  read: boolean;
  severity: 'info' | 'warning' | 'danger' | 'success';
  linkTarget?: string; // route
}

// ===================== AUDITORIA =====================
export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  entityType: 'lead' | 'project' | 'stage' | 'shift' | 'material' | 'invoice' | 'payment' | 'change_order' | 'client';
  entityId: string;
  action: string;
  details: string;
}

// ===================== CALCULATED PROJECT STATS =====================
export interface ProjectFinancialSummary {
  contractValue: number;
  extrasApproved: number;
  totalContractValue: number;
  totalBilled: number;
  totalReceived: number;
  balanceReceivable: number;
  laborCost: number;
  materialCost: number;
  otherCost: number;
  totalCost: number;
  marginAmount: number;
  marginPercent: number;
  estimatedCost: number;
  costVariance: number;
  plannedDays: number;
  elapsedDays: number;
  delayedDays: number;
  nextBillingMilestone?: BillingMilestone;
}
