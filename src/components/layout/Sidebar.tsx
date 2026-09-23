import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, KanbanSquare, CheckSquare, Users2, Building2, 
  ListTree, Calendar, Clock, Package, Receipt, FileText, 
  Coins, UserCheck, BarChart3, Settings, ShieldCheck, 
  Sparkles, Smartphone, Eye, UploadCloud, ChevronDown, ChevronRight,
  Briefcase, Wrench, Wallet, PieChart, LogOut, X, History
} from 'lucide-react';

interface NavSection {
  id: string;
  title: string;
  icon: React.ElementType;
  items: {
    id: string;
    label: string;
    icon: React.ElementType;
    badge?: number;
    badgeColor?: string;
    roles: string[];
  }[];
}

export const Sidebar: React.FC = () => {
  const { 
    activeTab, setActiveTab, currentUser, leads, projects, 
    invoices, shifts, logout, mobileMenuOpen, setMobileMenuOpen 
  } = useApp();

  // Badges calculations
  const newLeadsCount = leads.filter(l => !l.isLegacy && l.status === 'novo_lead').length;
  const legacyLeadsCount = leads.filter(l => l.isLegacy && l.status === 'novo_lead').length;
  const activeProjectsCount = projects.filter(p => p.status === 'em_execucao').length;
  const pendingInvoicesCount = invoices.filter(i => i.status === 'emitida' || i.status === 'pendente' || i.status === 'parcialmente_paga').length;
  const pendingShiftsCount = shifts.filter(s => s.status === 'pendente').length;

  // Departmental Categorization with Collapsible Accordion
  const navSections: NavSection[] = [
    {
      id: 'comercial',
      title: 'Comercial & Vendas',
      icon: Briefcase,
      items: [
        { id: 'dashboard', label: 'Dashboard Geral', icon: LayoutDashboard, roles: ['admin', 'financeiro'] },
        { id: 'hoje', label: 'Hoje (Follow-up)', icon: CheckSquare, badge: newLeadsCount > 0 ? newLeadsCount : undefined, badgeColor: 'bg-amber-500', roles: ['admin', 'comercial'] },
        { id: 'crm', label: 'CRM (Novos Leads)', icon: KanbanSquare, badge: newLeadsCount > 0 ? newLeadsCount : undefined, badgeColor: 'bg-sky-500', roles: ['admin', 'comercial'] },
        { id: 'leads_antigos', label: 'Leads Antigos (Meta)', icon: History, badge: legacyLeadsCount > 0 ? legacyLeadsCount : undefined, badgeColor: 'bg-blue-600', roles: ['admin', 'comercial'] },
        { id: 'clientes', label: 'Clientes (Carteira)', icon: UserCheck, roles: ['admin', 'comercial', 'financeiro'] },
      ]
    },
    {
      id: 'gestao',
      title: 'Gestão & Obras',
      icon: Wrench,
      items: [
        { id: 'obras', label: 'Obras & Central', icon: Building2, badge: activeProjectsCount, badgeColor: 'bg-sky-500', roles: ['admin', 'gestor', 'financeiro'] },
        { id: 'plano_obra', label: 'Plano de Obra', icon: ListTree, roles: ['admin', 'gestor'] },
        { id: 'gantt', label: 'Cronograma Gantt', icon: Calendar, roles: ['admin', 'gestor'] },
        { id: 'planeamento', label: 'Planeamento Semanal', icon: Calendar, roles: ['admin', 'gestor'] },
        { id: 'diarias', label: 'Diárias & Equipa', icon: Clock, badge: pendingShiftsCount > 0 ? pendingShiftsCount : undefined, badgeColor: 'bg-orange-500', roles: ['admin', 'gestor', 'financeiro'] },
      ]
    },
    {
      id: 'financas',
      title: 'Finanças & Caixa',
      icon: Wallet,
      items: [
        { id: 'faturas', label: 'Faturas & Cobranças', icon: FileText, badge: pendingInvoicesCount > 0 ? pendingInvoicesCount : undefined, badgeColor: 'bg-emerald-500', roles: ['admin', 'financeiro'] },
        { id: 'materiais', label: 'Materiais & Compras', icon: Package, roles: ['admin', 'gestor', 'financeiro'] },
        { id: 'gastos', label: 'Despesas & Fornecedores', icon: Receipt, roles: ['admin', 'financeiro'] },
        { id: 'cobrancas', label: 'Marcos de Pagamento', icon: Coins, roles: ['admin', 'financeiro'] },
      ]
    },
    {
      id: 'informes',
      title: 'Informes & Reporting',
      icon: PieChart,
      items: [
        { id: 'relatorios', label: 'Relatórios & Margem', icon: BarChart3, roles: ['admin', 'financeiro'] },
        { id: 'importar', label: 'Importador Excel / CSV', icon: UploadCloud, roles: ['admin', 'gestor', 'financeiro'] },
        { id: 'configuracoes', label: 'Configurações', icon: Settings, roles: ['admin'] },
      ]
    }
  ];

  // Specific role items
  const workerNavItems = [
    { id: 'meu_dia', label: 'O Meu Dia (Obra)', icon: Smartphone },
    { id: 'diarias', label: 'Minhas Diárias', icon: Clock },
  ];

  const clientNavItems = [
    { id: 'portal', label: 'Minha Obra & Fotos', icon: Eye },
    { id: 'faturas', label: 'Faturas & Pagamentos', icon: FileText },
  ];

  // Accordion state: by default, all open
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    comercial: true,
    gestao: true,
    financas: true,
    informes: true,
  });

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const handleItemClick = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  const renderNavContent = () => (
    <>
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80 bg-slate-950/40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-sky-500/20 tracking-wider">
            P
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-white text-base tracking-tight">PRIME</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-sky-500/20 text-sky-400 rounded-md border border-sky-500/30">
                GESTAO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Obras & Reformas</p>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden transition-colors"
          title="Fechar Menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {currentUser.role === 'funcionario' ? (
          <div className="space-y-1">
            <div className="px-3 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Área do Operacional
            </div>
            {workerNavItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                    isActive ? 'bg-sky-600 text-white shadow-xs font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-sky-400" />
                    <span className="truncate">{item.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : currentUser.role === 'cliente' ? (
          <div className="space-y-1">
            <div className="px-3 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Portal do Cliente
            </div>
            {clientNavItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                    isActive ? 'bg-sky-600 text-white shadow-xs font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-sky-400" />
                    <span className="truncate">{item.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          navSections.map(section => {
            const visibleItems = section.items.filter(item => item.roles.includes(currentUser.role));
            if (visibleItems.length === 0) return null;

            const isOpen = openSections[section.id] ?? true;
            const SectionIcon = section.icon;
            const sectionTotalBadges = visibleItems.reduce((acc, it) => acc + (it.badge || 0), 0);

            return (
              <div key={section.id} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors uppercase tracking-wider group"
                >
                  <div className="flex items-center gap-2">
                    <SectionIcon className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400 transition-colors" />
                    <span>{section.title}</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    {!isOpen && sectionTotalBadges > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-500/90 text-white">
                        {sectionTotalBadges}
                      </span>
                    )}
                    {isOpen ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-transform" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-transform" />
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="space-y-0.5 pl-1.5 border-l border-slate-800/80 ml-2">
                    {visibleItems.map(item => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleItemClick(item.id)}
                          className={`w-full flex items-center justify-between px-2.5 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                            isActive
                              ? 'bg-sky-600 text-white shadow-xs font-semibold'
                              : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon className={`w-4 h-4 shrink-0 transition-transform ${
                              isActive ? 'text-white' : 'text-slate-400 group-hover:text-sky-400'
                            }`} />
                            <span className="truncate">{item.label}</span>
                          </div>

                          {item.badge !== undefined && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-2xs ${
                              item.badgeColor || (isActive ? 'bg-sky-700' : 'bg-slate-700')
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </nav>

      {/* Footer info & Logout */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 space-y-2 shrink-0">
        <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-800/40 border border-slate-800">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-200 truncate">PRIME Cloud Sync</p>
              <p className="text-[9px] text-slate-400">Ligação Segura Ativa</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Terminar Sessão Corporativa"
            className="p-1.5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-md transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex md:w-64 bg-slate-900 text-slate-300 flex-col shrink-0 border-r border-slate-800 select-none z-20 h-screen">
        {renderNavContent()}
      </aside>

      {/* Mobile Off-canvas Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Sidebar */}
          <aside className="relative z-10 w-72 max-w-[85vw] bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800 shadow-2xl animate-in slide-in-from-left duration-200">
            {renderNavContent()}
          </aside>
        </div>
      )}
    </>
  );
};
