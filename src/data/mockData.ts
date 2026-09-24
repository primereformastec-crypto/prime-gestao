import { 
  User, Lead, Client, Project, ProjectStage, Employee, 
  EmployeeShift, MaterialPurchase, Expense, Quote, Invoice, 
  Payment, BillingMilestone, ChangeOrder, DailyLog, ProjectPhoto, 
  ProjectDocument, AppNotification, AuditLog, FixedExpense,
  ToolItem, MaterialStockItem
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

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-01',
    name: 'Alexandre Carvalho',
    phone: '+34 612 345 678',
    email: 'alexandre@primereformas.es',
    role: 'Encarregado Geral / Gestor de Obra',
    dailyRate: 110,
    halfDayRate: 60,
    hourlyRate: 15,
    status: 'ativo',
    notes: 'Responsável técnico de equipa e coordenação no terreno.'
  },
  {
    id: 'emp-02',
    name: 'Manuel Silva',
    phone: '+34 623 456 789',
    role: 'Oficial Pedreiro & Alvenaria',
    dailyRate: 95,
    halfDayRate: 50,
    hourlyRate: 12,
    status: 'ativo',
    notes: 'Especialista em alvenaria, nivelamento e assentamento cerâmico.'
  },
  {
    id: 'emp-03',
    name: 'Carlos Santos',
    phone: '+34 634 567 890',
    role: 'Técnico AVAC & Eletricista',
    dailyRate: 100,
    halfDayRate: 55,
    hourlyRate: 14,
    status: 'ativo',
    notes: 'Instalação de ar-condicionado, quadros elétricos e iluminação.'
  },
  {
    id: 'emp-04',
    name: 'Tiago Pereira',
    phone: '+34 645 678 901',
    role: 'Pintor & Pladurista',
    dailyRate: 90,
    halfDayRate: 50,
    hourlyRate: 12,
    status: 'ativo',
    notes: 'Teto falso em pladur, isolamento e acabamento fino de pintura.'
  },
  {
    id: 'emp-05',
    name: 'Roberto Alves',
    phone: '+34 656 789 012',
    role: 'Canalizador & Instalações Hidráulicas',
    dailyRate: 95,
    halfDayRate: 50,
    hourlyRate: 13,
    status: 'ativo',
    notes: 'Instalação de termoacumuladores, tubagens multicamada e esgotos.'
  },
  {
    id: 'emp-06',
    name: 'João Ribeiro',
    phone: '+34 667 890 123',
    role: 'Ajudante de Obra',
    dailyRate: 70,
    halfDayRate: 40,
    hourlyRate: 9,
    status: 'ativo',
    notes: 'Apoio em demolições, transporte de materiais e limpezas.'
  }
];

export const INITIAL_TOOLS: ToolItem[] = [
  {
    id: 'tool-01',
    code: 'FER-001',
    name: 'Martelo Perfurador SDS-Plus 850W',
    brand: 'Bosch Professional',
    category: 'Elétrica',
    status: 'disponivel',
    currentLocation: 'Armazém Central',
    purchaseDate: '2026-01-15',
    purchaseValue: 249,
    notes: 'Inclui mala de transporte e jogo de brocas SDS.'
  },
  {
    id: 'tool-02',
    code: 'FER-002',
    name: 'Rebarbadora Angular 125mm',
    brand: 'Makita',
    category: 'Elétrica',
    status: 'disponivel',
    currentLocation: 'Armazém Central',
    purchaseDate: '2026-02-10',
    purchaseValue: 129,
    notes: 'Com disco de diamante para corte de cerâmica e betão.'
  },
  {
    id: 'tool-03',
    code: 'FER-003',
    name: 'Nível Laser Autonivelante 360º',
    brand: 'DeWalt',
    category: 'Medição & Laser',
    status: 'disponivel',
    currentLocation: 'Armazém Central',
    purchaseDate: '2026-01-20',
    purchaseValue: 389,
    notes: 'Laser verde 3x360º com tripé telescópico e suporte magnético.'
  },
  {
    id: 'tool-04',
    code: 'FER-004',
    name: 'Cortador Manual de Cerâmica Speed Magnet 62',
    brand: 'Rubi',
    category: 'Corte',
    status: 'disponivel',
    currentLocation: 'Armazém Central',
    purchaseDate: '2026-03-01',
    purchaseValue: 219,
    notes: 'Para peças de grés e azulejos até 62 cm.'
  },
  {
    id: 'tool-05',
    code: 'FER-005',
    name: 'Aspirador Industrial Sólidos e Líquidos NT 30/1',
    brand: 'Kärcher',
    category: 'Limpeza & Obra',
    status: 'disponivel',
    currentLocation: 'Armazém Central',
    purchaseDate: '2026-02-18',
    purchaseValue: 299,
    notes: 'Filtro HEPA para poeiras de pladur e lixagem.'
  },
  {
    id: 'tool-06',
    code: 'FER-006',
    name: 'Escada Telescópica de Alumínio 3.8m',
    brand: 'Facal',
    category: 'Andaimes & Escadas',
    status: 'disponivel',
    currentLocation: 'Armazém Central',
    purchaseDate: '2026-01-10',
    purchaseValue: 165,
    notes: 'Carga máx 150kg, pés antiderrapantes.'
  }
];

export const INITIAL_MATERIAL_STOCK: MaterialStockItem[] = [
  {
    id: 'stk-01',
    code: 'MAT-001',
    name: 'Argamassa Colante C2TE Porcelânico Cinza',
    category: 'Cimentos & Argamassas',
    quantity: 14,
    unit: 'Saco 25kg',
    location: 'Armazém Central',
    minQuantity: 5,
    unitPrice: 9.80,
    notes: 'Argamassa flexível para chão e parede.'
  },
  {
    id: 'stk-02',
    code: 'MAT-002',
    name: 'Tinta Plástica Mate Lavável Extra Branco',
    category: 'Pintura & Isolamento',
    quantity: 5,
    unit: 'Lata 15L',
    location: 'Armazém Central',
    minQuantity: 2,
    unitPrice: 54.90,
    notes: 'Excelente cobertura para acabamentos de interiores.'
  },
  {
    id: 'stk-03',
    code: 'MAT-003',
    name: 'Tubo Multicamada 16x2mm Isolado',
    category: 'Canalização',
    quantity: 60,
    unit: 'Metros',
    location: 'Armazém Central',
    minQuantity: 20,
    unitPrice: 1.45,
    notes: 'Para canalização sanitária e aquecimento.'
  },
  {
    id: 'stk-04',
    code: 'MAT-004',
    name: 'Cabo Elétrico Flexível H07V-K 2.5mm² Azul',
    category: 'Eletricidade',
    quantity: 2,
    unit: 'Rolo 100m',
    location: 'Armazém Central',
    minQuantity: 1,
    unitPrice: 32.50,
    notes: 'Para circuitos de tomadas elétricas.'
  },
  {
    id: 'stk-05',
    code: 'MAT-005',
    name: 'Placa Gesso Cartonado Standard 13mm (2.5x1.2m)',
    category: 'Gesso Cartonado / Pladur',
    quantity: 12,
    unit: 'Placa',
    location: 'Armazém Central',
    minQuantity: 5,
    unitPrice: 11.20,
    notes: 'Armazenadas na vertical no armazém.'
  }
];

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
