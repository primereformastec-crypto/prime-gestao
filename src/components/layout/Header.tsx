import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { SecurityCenterModal } from '../common/SecurityCenterModal';
import { 
  Search, Bell, Plus, Shield, Briefcase, DollarSign, 
  HardHat, User as UserIcon, CheckCircle2, AlertTriangle, 
  Clock, X, Check, FileText, Hammer, Package, LogOut, Menu,
  ShieldCheck
} from 'lucide-react';

export const Header: React.FC = () => {
  const { 
    currentUser, switchRole, notifications, markNotificationAsRead, 
    markAllNotificationsAsRead, setSearchOpen, setActiveTab, setSelectedProjectId,
    logout, setMobileMenuOpen
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [showSecurityCenter, setShowSecurityCenter] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const roleLabels: Record<UserRole, { label: string; icon: any; color: string }> = {
    admin: { label: 'Administrador / Direção', icon: Shield, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    comercial: { label: 'Comercial', icon: Briefcase, color: 'bg-blue-50 text-blue-700 border-blue-200' },
    financeiro: { label: 'Financeiro', icon: DollarSign, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    gestor: { label: 'Gestor de Obra', icon: HardHat, color: 'bg-amber-50 text-amber-700 border-amber-200' },
    funcionario: { label: 'Funcionário (Meu Dia)', icon: Hammer, color: 'bg-orange-50 text-orange-700 border-orange-200' },
    cliente: { label: 'Portal do Cliente', icon: UserIcon, color: 'bg-purple-50 text-purple-700 border-purple-200' }
  };

  const CurrentRoleIcon = roleLabels[currentUser.role]?.icon || Shield;

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-3 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Mobile Hamburger & Logo / Search trigger */}
      <div className="flex items-center gap-2 md:gap-3 flex-1 max-w-md">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 -ml-1 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl md:hidden transition-colors"
          title="Abrir Menu de Navegação"
        >
          <Menu className="w-5 h-5 text-slate-700" />
        </button>

        <div className="flex items-center gap-1.5 md:hidden mr-1">
          <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center font-black text-xs">
            P
          </div>
        </div>

        <button
          onClick={() => setSearchOpen(true)}
          className="w-full flex items-center justify-between px-3 py-1.5 md:py-2 bg-slate-100/80 hover:bg-slate-100 text-slate-500 rounded-lg text-xs md:text-sm border border-slate-200/60 transition-all group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
            <span className="text-slate-500 font-normal truncate">Pesquisar...</span>
          </div>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded shadow-2xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Security Shield & Backup Button */}
        <button
          onClick={() => setShowSecurityCenter(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-all shadow-2xs hover:scale-102 cursor-pointer"
          title="Central de Segurança & Cópias de Segurança (Backups)"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="hidden sm:inline">Proteção Ativa</span>
        </button>

        {/* Quick Action Button */}
        <div className="relative">
          <button
            onClick={() => setShowQuickCreate(!showQuickCreate)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium transition-all shadow-xs active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">Criar Novo</span>
          </button>

          {showQuickCreate && (
            <div 
              className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-sm animate-in fade-in zoom-in-95 duration-100"
              onClick={() => setShowQuickCreate(false)}
            >
              <button
                onClick={() => setActiveTab('crm')}
                className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 text-slate-700"
              >
                <Briefcase className="w-4 h-4 text-blue-500" />
                <span>Novo Lead Comercial</span>
              </button>
              <button
                onClick={() => setActiveTab('obras')}
                className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 text-slate-700"
              >
                <HardHat className="w-4 h-4 text-amber-500" />
                <span>Nova Obra / Reforma</span>
              </button>
              <button
                onClick={() => setActiveTab('diarias')}
                className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 text-slate-700"
              >
                <Clock className="w-4 h-4 text-orange-500" />
                <span>Lançar Diária de Equipa</span>
              </button>
              <button
                onClick={() => setActiveTab('materiais')}
                className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 text-slate-700"
              >
                <Package className="w-4 h-4 text-indigo-500" />
                <span>Registar Compra Material</span>
              </button>
              <button
                onClick={() => setActiveTab('faturas')}
                className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 text-slate-700"
              >
                <FileText className="w-4 h-4 text-emerald-500" />
                <span>Emitir Fatura / Cobrança</span>
              </button>
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Alertas & Notificações"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
              <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-slate-700" />
                  <span className="font-semibold text-slate-900 text-sm">Alertas & Notificações</span>
                  {unreadCount > 0 && (
                    <span className="bg-sky-100 text-sky-700 text-xs px-2 py-0.5 rounded-full font-medium">
                      {unreadCount} novas
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="text-xs text-sky-600 hover:text-sky-700 font-medium"
                  >
                    Marcar todas lidas
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-sm">
                    Nenhuma notificação no momento.
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        markNotificationAsRead(notif.id);
                        if (notif.linkTarget) setActiveTab(notif.linkTarget);
                        setShowNotifications(false);
                      }}
                      className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex gap-3 ${
                        !notif.read ? 'bg-sky-50/40' : ''
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {notif.severity === 'danger' && <AlertTriangle className="w-4 h-4 text-rose-500" />}
                        {notif.severity === 'warning' && <Clock className="w-4 h-4 text-amber-500" />}
                        {notif.severity === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                        {notif.severity === 'info' && <Bell className="w-4 h-4 text-sky-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-semibold text-slate-900 truncate">{notif.title}</p>
                          <span className="text-[10px] text-slate-400 shrink-0">{notif.date.slice(5)}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{notif.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile / Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              roleLabels[currentUser.role]?.color || 'bg-slate-100 text-slate-800'
            }`}
          >
            <CurrentRoleIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-semibold">{currentUser.name}</span>
            <span className="text-[10px] opacity-75 uppercase font-mono tracking-wider">({currentUser.role})</span>
          </button>

          {showRoleMenu && (
            <div 
              className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50"
              onClick={() => setShowRoleMenu(false)}
            >
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="text-xs font-bold text-slate-900">Alternar Perfil (Simulação RBAC)</p>
                <p className="text-[11px] text-slate-500">Veja o sistema sob a visão de cada função da empresa:</p>
              </div>

              {(Object.keys(roleLabels) as UserRole[]).map(role => {
                const ItemIcon = roleLabels[role].icon;
                const isCurrent = currentUser.role === role;
                return (
                  <button
                    key={role}
                    onClick={() => switchRole(role)}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs transition-colors ${
                      isCurrent ? 'bg-sky-50 text-sky-800 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <ItemIcon className={`w-4 h-4 ${isCurrent ? 'text-sky-600' : 'text-slate-400'}`} />
                      <span>{roleLabels[role].label}</span>
                    </div>
                    {isCurrent && <Check className="w-3.5 h-3.5 text-sky-600" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          title="Terminar Sessão Corporativa (Bloquear)"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200/80 hover:border-rose-200 hover:bg-rose-50 text-slate-500 hover:text-rose-600 text-xs font-semibold transition-all active:scale-98"
        >
          <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-500" />
          <span className="hidden md:inline">Sair</span>
        </button>
      </div>

      {/* Modal Central de Segurança e Backups */}
      <SecurityCenterModal 
        isOpen={showSecurityCenter} 
        onClose={() => setShowSecurityCenter(false)} 
      />
    </header>
  );
};
