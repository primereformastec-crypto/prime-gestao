import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { ExecutiveDashboard } from './components/dashboard/ExecutiveDashboard';
import { CrmKanban } from './components/crm/CrmKanban';
import { LegacyLeadsPipeline } from './components/crm/LegacyLeadsPipeline';
import { TodayView } from './components/crm/TodayView';
import { ClientsView } from './components/crm/ClientsView';
import { ProjectsList } from './components/projects/ProjectsList';
import { ProjectDetail } from './components/projects/ProjectDetail';
import { PlanoObraView } from './components/projects/PlanoObraView';
import { GanttView } from './components/gantt/GanttView';
import { WeeklyPlanning } from './components/planning/WeeklyPlanning';
import { EmployeesView } from './components/employees/EmployeesView';
import { TeamView } from './components/employees/TeamView';
import { ToolsView } from './components/inventory/ToolsView';
import { MaterialStockView } from './components/inventory/MaterialStockView';
import { InvoicesView } from './components/finance/InvoicesView';
import { BillingMilestonesView } from './components/finance/BillingMilestonesView';
import { PayablesView } from './components/finance/PayablesView';
import { ReportsView } from './components/reports/ReportsView';
import { ExcelImporter } from './components/importer/ExcelImporter';
import { SettingsView } from './components/settings/SettingsView';
import { WorkerDayView } from './components/mobile/WorkerDayView';
import { ClientPortalView } from './components/client_portal/ClientPortalView';
import { LoginView } from './components/auth/LoginView';
import { LayoutDashboard, Building2, FileText, Clock, Menu } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { 
    activeTab, setActiveTab, selectedProjectId, setSelectedProjectId, 
    currentUser, isAuthenticated, setMobileMenuOpen 
  } = useApp();

  if (!isAuthenticated) {
    return <LoginView />;
  }

  // Route renderer
  const renderContent = () => {
    // If worker role
    if (currentUser.role === 'funcionario') {
      if (activeTab === 'diarias') return <EmployeesView />;
      return <WorkerDayView />;
    }

    // If client role
    if (currentUser.role === 'cliente') {
      if (activeTab === 'faturas') return <InvoicesView />;
      return <ClientPortalView />;
    }

    // If viewing a specific project detail
    if (selectedProjectId && activeTab === 'obras') {
      return (
        <ProjectDetail
          projectId={selectedProjectId}
          onBack={() => setSelectedProjectId(null)}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <ExecutiveDashboard />;
      case 'hoje':
        return <TodayView />;
      case 'crm':
      case 'leads':
        return <CrmKanban />;
      case 'leads_antigos':
      case 'meta_leads':
        return <LegacyLeadsPipeline />;
      case 'clientes':
        return <ClientsView />;
      case 'obras':
        return <ProjectsList />;
      case 'plano_obra':
        return <PlanoObraView />;
      case 'gantt':
        return <GanttView />;
      case 'planeamento':
        return <WeeklyPlanning />;
      case 'equipa':
      case 'funcionarios':
        return <TeamView />;
      case 'diarias':
        return <EmployeesView />;
      case 'ferramentas':
        return <ToolsView />;
      case 'stock_materiais':
        return <MaterialStockView />;
      case 'materiais':
      case 'gastos':
        return <PayablesView />;
      case 'faturas':
        return <InvoicesView />;
      case 'cobrancas':
        return <BillingMilestonesView />;
      case 'relatorios':
        return <ReportsView />;
      case 'importar':
        return <ExcelImporter />;
      case 'configuracoes':
        return <SettingsView />;
      default:
        return <ExecutiveDashboard />;
    }
  };

  const mobileNavItems = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { id: 'obras', label: 'Obras', icon: Building2 },
    { id: 'faturas', label: 'Faturas', icon: FileText },
    { id: 'diarias', label: 'Diárias', icon: Clock },
  ];

  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden font-sans select-none">
      {/* Sidebar navigation (Desktop static / Mobile drawer) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto pb-20 md:pb-6">
          {renderContent()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (iOS / Android Native Style) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200/90 z-30 flex items-center justify-around px-2 shadow-lg">
        {mobileNavItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setSelectedProjectId(null);
              }}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
                isActive ? 'text-sky-600 font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : ''}`} />
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </button>
          );
        })}

        {/* Mais / Menu drawer button */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center flex-1 h-full py-1 text-slate-400 hover:text-slate-600 transition-all"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 tracking-tight">Menu</span>
        </button>
      </nav>

      {/* Global Cmd+K Search Modal */}
      <GlobalSearchModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
