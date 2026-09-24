import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Employee } from '../../types';
import { formatCurrency, parseCurrencyInput, sanitizeCurrencyInput } from '../../utils/currency';
import { 
  Users2, UserPlus, Phone, Mail, Hammer, Clock, 
  CheckCircle2, AlertTriangle, Search, Filter, Plus, 
  Trash2, Edit3, MessageCircle, Building2, Euro, 
  X, Check, Briefcase, Calendar, ChevronRight
} from 'lucide-react';

const STANDARD_ROLES = [
  'Encarregado Geral / Gestor de Obra',
  'Oficial Pedreiro & Alvenaria',
  'Técnico AVAC & Eletricista',
  'Pintor & Pladurista',
  'Canalizador & Instalações Hidráulicas',
  'Carpinteiro & Marcenaria',
  'Impermeabilizador / Telhados',
  'Ajudante de Obra',
  'Outra Especialidade'
];

export const TeamView: React.FC = () => {
  const { 
    employees, shifts, projects, addEmployee, updateEmployee, 
    deleteEmployee, addShift, getEmployeeSummary, setSelectedProjectId, setActiveTab 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativo' | 'inativo'>('todos');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Modal para criar novo colaborador
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmployeeForm, setNewEmployeeForm] = useState({
    name: '',
    role: STANDARD_ROLES[1],
    phone: '',
    email: '',
    dailyRate: '95',
    halfDayRate: '50',
    hourlyRate: '12',
    status: 'ativo' as 'ativo' | 'inativo',
    notes: ''
  });

  // Modal para editar colaborador
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editEmployeeForm, setEditEmployeeForm] = useState({
    name: '',
    role: '',
    phone: '',
    email: '',
    dailyRate: '95',
    halfDayRate: '50',
    hourlyRate: '12',
    status: 'ativo' as 'ativo' | 'inativo',
    notes: ''
  });

  // Modal para lançamento rápido de diária a partir do colaborador
  const [quickShiftEmployee, setQuickShiftEmployee] = useState<Employee | null>(null);
  const [quickShiftForm, setQuickShiftForm] = useState({
    projectId: projects[0]?.id || '',
    date: new Date().toISOString().slice(0, 10),
    type: 'diaria' as 'diaria' | 'meia_diaria' | 'horas',
    hours: 8,
    notes: ''
  });

  // Filtragem dos funcionários
  const filteredEmployees = employees.filter(emp => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      !q || 
      emp.name.toLowerCase().includes(q) || 
      emp.role.toLowerCase().includes(q) || 
      emp.phone.includes(q) || 
      emp.id.toLowerCase().includes(q);

    const matchesRole = roleFilter === 'todos' || emp.role === roleFilter;
    const matchesStatus = statusFilter === 'todos' || emp.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Métricas agregadas da equipa
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.status === 'ativo').length;
  const totalShiftsCount = shifts.length;
  const totalPendingPayout = employees.reduce((acc, emp) => {
    const sum = getEmployeeSummary(emp.id);
    return acc + (sum.totalPending || 0);
  }, 0);

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployeeForm.name.trim()) {
      alert('O nome do colaborador é obrigatório.');
      return;
    }

    addEmployee({
      name: newEmployeeForm.name.trim(),
      role: newEmployeeForm.role.trim() || 'Oficial de Obra',
      phone: newEmployeeForm.phone.trim() || '+34 600 000 000',
      email: newEmployeeForm.email.trim(),
      dailyRate: parseCurrencyInput(newEmployeeForm.dailyRate) || 90,
      halfDayRate: parseCurrencyInput(newEmployeeForm.halfDayRate) || 50,
      hourlyRate: parseCurrencyInput(newEmployeeForm.hourlyRate) || 12,
      status: newEmployeeForm.status,
      notes: newEmployeeForm.notes.trim()
    });

    setShowAddModal(false);
    setNewEmployeeForm({
      name: '',
      role: STANDARD_ROLES[1],
      phone: '',
      email: '',
      dailyRate: '95',
      halfDayRate: '50',
      hourlyRate: '12',
      status: 'ativo',
      notes: ''
    });
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setEditEmployeeForm({
      name: emp.name,
      role: emp.role,
      phone: emp.phone || '',
      email: emp.email || '',
      dailyRate: String(emp.dailyRate ?? 90),
      halfDayRate: String(emp.halfDayRate ?? 50),
      hourlyRate: String(emp.hourlyRate ?? 12),
      status: emp.status || 'ativo',
      notes: emp.notes || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;
    if (!editEmployeeForm.name.trim()) {
      alert('O nome do colaborador é obrigatório.');
      return;
    }

    updateEmployee(editingEmployee.id, {
      name: editEmployeeForm.name.trim(),
      role: editEmployeeForm.role.trim(),
      phone: editEmployeeForm.phone.trim(),
      email: editEmployeeForm.email.trim(),
      dailyRate: parseCurrencyInput(editEmployeeForm.dailyRate) || 90,
      halfDayRate: parseCurrencyInput(editEmployeeForm.halfDayRate) || 50,
      hourlyRate: parseCurrencyInput(editEmployeeForm.hourlyRate) || 12,
      status: editEmployeeForm.status,
      notes: editEmployeeForm.notes.trim()
    });

    setShowEditModal(false);
    setEditingEmployee(null);
  };

  const handleDeleteEmployee = (emp: Employee) => {
    if (window.confirm(`Tem a certeza que deseja eliminar "${emp.name}" (${emp.id}) da lista de funcionários?`)) {
      deleteEmployee(emp.id);
    }
  };

  const handleQuickShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickShiftEmployee) return;
    if (!quickShiftForm.projectId) {
      alert('Selecione uma obra.');
      return;
    }

    const rate = quickShiftForm.type === 'diaria' 
      ? quickShiftEmployee.dailyRate 
      : quickShiftForm.type === 'meia_diaria' 
        ? quickShiftEmployee.halfDayRate 
        : quickShiftEmployee.hourlyRate;

    const totalValue = quickShiftForm.type === 'horas' 
      ? rate * quickShiftForm.hours 
      : rate;

    addShift({
      projectId: quickShiftForm.projectId,
      employeeId: quickShiftEmployee.id,
      date: quickShiftForm.date,
      type: quickShiftForm.type,
      hours: quickShiftForm.hours,
      rate,
      totalValue,
      status: 'aprovada',
      notes: quickShiftForm.notes
    });

    alert(`✓ Diária de ${formatCurrency(totalValue)} lançada com sucesso para ${quickShiftEmployee.name} na obra ${quickShiftForm.projectId}!`);
    setQuickShiftEmployee(null);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-sky-700 font-bold uppercase tracking-wider mb-1">
            <Users2 className="w-4 h-4 text-sky-600" />
            <span>Gestão & Obras • Mão de Obra</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Equipa & Funcionários</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Listagem de colaboradores, especialidades técnicas, valores de diária e histórico de obras.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('diarias')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
          >
            <Clock className="w-4 h-4 text-slate-500" />
            <span>Ver Todas as Diárias</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="prime-button px-4 py-2 text-xs flex items-center gap-2 shadow-md shadow-sky-500/20"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Novo Funcionário</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="prime-card p-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Equipa</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-900">{totalEmployees}</span>
            <span className="text-xs font-semibold text-sky-600">{activeEmployees} ativos</span>
          </div>
        </div>

        <div className="prime-card p-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Diárias Lançadas</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-900">{totalShiftsCount}</span>
            <span className="text-xs font-semibold text-emerald-600">Registos</span>
          </div>
        </div>

        <div className="prime-card p-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Média Diária Base</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-900">
              {employees.length > 0 
                ? formatCurrency(Math.round(employees.reduce((acc, e) => acc + (e.dailyRate || 0), 0) / employees.length), false)
                : '€0'}
            </span>
            <span className="text-[10px] text-slate-400">/dia</span>
          </div>
        </div>

        <div className="prime-card p-4 border-amber-200 bg-amber-50/40">
          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">Pendente a Pagar</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-amber-700">{formatCurrency(totalPendingPayout)}</span>
            <span className="text-xs font-bold text-amber-600">A liquidar</span>
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="prime-card p-3 md:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar por nome, especialidade, telefone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-sky-500"
          >
            <option value="todos">Todas as Funções</option>
            {STANDARD_ROLES.map((r, i) => (
              <option key={i} value={r}>{r}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-sky-500"
          >
            <option value="todos">Todos os Estados</option>
            <option value="ativo">Apenas Ativos</option>
            <option value="inativo">Inativos</option>
          </select>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                viewMode === 'cards' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Tabela
            </button>
          </div>
        </div>
      </div>

      {/* Exibição: Cards */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map(emp => {
            const sum = getEmployeeSummary(emp.id);
            const cleanPhone = emp.phone ? emp.phone.replace(/[^0-9]/g, '') : '';

            return (
              <div 
                key={emp.id} 
                className="prime-card p-4 hover:border-sky-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                        {emp.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900 line-clamp-1">{emp.name}</h3>
                        <p className="text-[11px] font-semibold text-sky-700 line-clamp-1">{emp.role}</p>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      emp.status === 'ativo' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {emp.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  {/* Contactos rápidos */}
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{emp.phone || 'Sem telefone'}</span>
                      </div>
                      {cleanPhone && (
                        <a
                          href={`https://wa.me/${cleanPhone}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>

                    {emp.email && (
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span className="truncate">{emp.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Tabela de Tarifas */}
                  <div className="mt-3 p-2.5 bg-slate-50/80 rounded-xl grid grid-cols-3 gap-1.5 text-center text-xs border border-slate-100">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block uppercase">Diária</span>
                      <span className="font-extrabold text-slate-900">{formatCurrency(emp.dailyRate)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block uppercase">Meia</span>
                      <span className="font-bold text-slate-700">{formatCurrency(emp.halfDayRate)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block uppercase">Hora</span>
                      <span className="font-bold text-slate-700">{formatCurrency(emp.hourlyRate)}</span>
                    </div>
                  </div>

                  {/* Histórico Financeiro */}
                  <div className="mt-3 pt-2 border-t border-slate-100 space-y-1 text-xs">
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>Obras atendidas:</span>
                      <span className="font-bold text-slate-800 font-mono">
                        {sum.projectsWorked.length > 0 ? sum.projectsWorked.join(', ') : 'Nenhuma'}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>Dias / Horas trabalhadas:</span>
                      <span className="font-bold text-slate-800">{sum.daysWorked} dias ({sum.hoursWorked}h)</span>
                    </div>
                    <div className="flex justify-between text-slate-700 font-semibold text-xs pt-1">
                      <span>Total Ganho:</span>
                      <span>{formatCurrency(sum.totalEarned)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600 font-semibold text-xs">
                      <span>Total Já Liquidado:</span>
                      <span>{formatCurrency(sum.totalPaid)}</span>
                    </div>
                    <div className="flex justify-between items-center bg-amber-50 p-1.5 rounded-lg text-amber-800 font-bold text-xs mt-1">
                      <span>Saldo a Pagar:</span>
                      <span className="font-extrabold text-amber-700">{formatCurrency(sum.totalPending)}</span>
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(emp)}
                      className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                      title="Editar Colaborador"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteEmployee(emp)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Eliminar Colaborador"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setQuickShiftEmployee(emp);
                      setQuickShiftForm({
                        projectId: projects[0]?.id || '',
                        date: new Date().toISOString().slice(0, 10),
                        type: 'diaria',
                        hours: 8,
                        notes: ''
                      });
                    }}
                    className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Lançar Diária</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Exibição: Tabela */
        <div className="prime-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Colaborador</th>
                  <th className="py-3 px-4">Função</th>
                  <th className="py-3 px-4">Contacto</th>
                  <th className="py-3 px-4 text-center">Tarifa Diária</th>
                  <th className="py-3 px-4 text-center">Dias Trab.</th>
                  <th className="py-3 px-4 text-right">Total Ganho</th>
                  <th className="py-3 px-4 text-right">Saldo a Pagar</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map(emp => {
                  const sum = getEmployeeSummary(emp.id);

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{emp.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{emp.id}</span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">{emp.role}</td>
                      <td className="py-3 px-4 text-slate-600 font-mono">{emp.phone}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900">{formatCurrency(emp.dailyRate)}</td>
                      <td className="py-3 px-4 text-center font-medium text-slate-700">{sum.daysWorked}d</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">{formatCurrency(sum.totalEarned)}</td>
                      <td className="py-3 px-4 text-right font-extrabold text-amber-700">{formatCurrency(sum.totalPending)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          emp.status === 'ativo' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setQuickShiftEmployee(emp);
                              setQuickShiftForm({
                                projectId: projects[0]?.id || '',
                                date: new Date().toISOString().slice(0, 10),
                                type: 'diaria',
                                hours: 8,
                                notes: ''
                              });
                            }}
                            className="px-2.5 py-1 bg-sky-50 text-sky-700 font-bold rounded-md hover:bg-sky-100 text-[11px]"
                          >
                            + Diária
                          </button>
                          <button
                            onClick={() => openEditModal(emp)}
                            className="p-1 text-slate-400 hover:text-sky-600"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(emp)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: NOVO COLABORADOR */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-sky-600" />
                <h3 className="font-bold text-slate-900 text-sm">Adicionar Novo Colaborador à Equipa</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateEmployee} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Manuel Antunes Silva"
                  value={newEmployeeForm.name}
                  onChange={e => setNewEmployeeForm({ ...newEmployeeForm, name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Função / Especialidade *</label>
                  <select
                    value={newEmployeeForm.role}
                    onChange={e => setNewEmployeeForm({ ...newEmployeeForm, role: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
                  >
                    {STANDARD_ROLES.map((r, i) => (
                      <option key={i} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="+34 600 000 000"
                    value={newEmployeeForm.phone}
                    onChange={e => setNewEmployeeForm({ ...newEmployeeForm, phone: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email (Opcional)</label>
                <input
                  type="email"
                  placeholder="colaborador@primereformas.es"
                  value={newEmployeeForm.email}
                  onChange={e => setNewEmployeeForm({ ...newEmployeeForm, email: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              {/* Tarifas */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">Diária (€) *</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={newEmployeeForm.dailyRate}
                    onChange={e => setNewEmployeeForm({ ...newEmployeeForm, dailyRate: sanitizeCurrencyInput(e.target.value) })}
                    className="w-full p-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-900"
                    placeholder="90"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">Meia Diária (€)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={newEmployeeForm.halfDayRate}
                    onChange={e => setNewEmployeeForm({ ...newEmployeeForm, halfDayRate: sanitizeCurrencyInput(e.target.value) })}
                    className="w-full p-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-900"
                    placeholder="50"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">Hora (€)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={newEmployeeForm.hourlyRate}
                    onChange={e => setNewEmployeeForm({ ...newEmployeeForm, hourlyRate: sanitizeCurrencyInput(e.target.value) })}
                    className="w-full p-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-900"
                    placeholder="12"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notas / Observações</label>
                <textarea
                  rows={2}
                  placeholder="Experiência em alvenaria, ferramentas próprias, disponibilidade..."
                  value={newEmployeeForm.notes}
                  onChange={e => setNewEmployeeForm({ ...newEmployeeForm, notes: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Salvar Colaborador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR COLABORADOR */}
      {showEditModal && editingEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-sky-600" />
                <h3 className="font-bold text-slate-900 text-sm">Editar Ficha de {editingEmployee.name}</h3>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleUpdateEmployee} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={editEmployeeForm.name}
                  onChange={e => setEditEmployeeForm({ ...editEmployeeForm, name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Função / Especialidade *</label>
                  <input
                    type="text"
                    required
                    value={editEmployeeForm.role}
                    onChange={e => setEditEmployeeForm({ ...editEmployeeForm, role: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={editEmployeeForm.phone}
                    onChange={e => setEditEmployeeForm({ ...editEmployeeForm, phone: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editEmployeeForm.email}
                    onChange={e => setEditEmployeeForm({ ...editEmployeeForm, email: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estado</label>
                  <select
                    value={editEmployeeForm.status}
                    onChange={e => setEditEmployeeForm({ ...editEmployeeForm, status: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
              </div>

              {/* Tarifas */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">Diária (€) *</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={editEmployeeForm.dailyRate}
                    onChange={e => setEditEmployeeForm({ ...editEmployeeForm, dailyRate: sanitizeCurrencyInput(e.target.value) })}
                    className="w-full p-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">Meia Diária (€)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={editEmployeeForm.halfDayRate}
                    onChange={e => setEditEmployeeForm({ ...editEmployeeForm, halfDayRate: sanitizeCurrencyInput(e.target.value) })}
                    className="w-full p-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">Hora (€)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={editEmployeeForm.hourlyRate}
                    onChange={e => setEditEmployeeForm({ ...editEmployeeForm, hourlyRate: sanitizeCurrencyInput(e.target.value) })}
                    className="w-full p-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notas / Observações</label>
                <textarea
                  rows={2}
                  value={editEmployeeForm.notes}
                  onChange={e => setEditEmployeeForm({ ...editEmployeeForm, notes: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-slate-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Atualizar Dados
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LANÇAR DIÁRIA RÁPIDA */}
      {quickShiftEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Lançar Diária: {quickShiftEmployee.name}</h3>
                <span className="text-[11px] text-sky-700 font-medium">{quickShiftEmployee.role} • {formatCurrency(quickShiftEmployee.dailyRate)}/dia</span>
              </div>
              <button onClick={() => setQuickShiftEmployee(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleQuickShiftSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Obra de Destino *</label>
                <select
                  value={quickShiftForm.projectId}
                  onChange={e => setQuickShiftForm({ ...quickShiftForm, projectId: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900"
                  required
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.id} - {p.title} ({p.city})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data *</label>
                  <input
                    type="date"
                    required
                    value={quickShiftForm.date}
                    onChange={e => setQuickShiftForm({ ...quickShiftForm, date: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo de Presença</label>
                  <select
                    value={quickShiftForm.type}
                    onChange={e => setQuickShiftForm({ ...quickShiftForm, type: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                  >
                    <option value="diaria">Dia Completo ({formatCurrency(quickShiftEmployee.dailyRate)})</option>
                    <option value="meia_diaria">Meia Diária ({formatCurrency(quickShiftEmployee.halfDayRate)})</option>
                    <option value="horas">Horas Avulsas ({formatCurrency(quickShiftEmployee.hourlyRate)}/h)</option>
                  </select>
                </div>
              </div>

              {quickShiftForm.type === 'horas' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Número de Horas</label>
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={quickShiftForm.hours}
                    onChange={e => setQuickShiftForm({ ...quickShiftForm, hours: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Observações do Serviço Realizado</label>
                <input
                  type="text"
                  placeholder="Ex: Assentamento de azulejos na casa de banho"
                  value={quickShiftForm.notes}
                  onChange={e => setQuickShiftForm({ ...quickShiftForm, notes: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setQuickShiftEmployee(null)}
                  className="px-3.5 py-1.5 text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-bold"
                >
                  Confirmar e Gravar Diária
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
