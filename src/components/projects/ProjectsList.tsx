import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Project, ProjectStatus } from '../../types';
import { 
  Building2, Plus, Search, Filter, Calendar, MapPin, 
  User, CheckCircle2, Clock, AlertTriangle, TrendingUp, 
  LayoutGrid, List, KanbanSquare, ArrowRight, Percent,
  Archive, RotateCcw, Award, Check
} from 'lucide-react';

export const ProjectsList: React.FC = () => {
  const { 
    projects, 
    clients, 
    getProjectFinancialSummary, 
    setSelectedProjectId, 
    addProject, 
    archiveProject, 
    unarchiveProject 
  } = useApp();

  const [mainTab, setMainTab] = useState<'active' | 'archived'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'kanban'>('cards');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [archiveModalProject, setArchiveModalProject] = useState<Project | null>(null);
  const [archiveNotes, setArchiveNotes] = useState('');

  // Separar Ativas vs Arquivadas
  const activeProjects = projects.filter(p => !p.isArchived && p.status !== 'concluida');
  const archivedProjects = projects.filter(p => p.isArchived || p.status === 'concluida');

  const currentList = mainTab === 'active' ? activeProjects : archivedProjects;

  // Filter projects
  const filteredProjects = currentList.filter(p => {
    const client = clients.find(c => c.id === p.clientId);
    const clientName = client ? client.name.toLowerCase() : '';
    const q = searchQuery.toLowerCase();

    const matchesSearch = 
      p.id.toLowerCase().includes(q) ||
      p.title.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      clientName.includes(q);

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusBadges: Record<ProjectStatus, { label: string; color: string }> = {
    nao_iniciada: { label: 'Não Iniciada', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    agendada: { label: 'Agendada', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    em_execucao: { label: 'Em Execução', color: 'bg-sky-50 text-sky-700 border-sky-200' },
    pausada: { label: 'Pausada', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    concluida: { label: 'Concluída / Arquivada', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    cancelada: { label: 'Cancelada', color: 'bg-rose-50 text-rose-700 border-rose-200' }
  };

  // Quick new project form
  const [newProjectForm, setNewProjectForm] = useState({
    clientId: clients[0]?.id || '',
    title: '',
    serviceType: 'Reforma integral',
    address: '',
    city: 'Barcelona',
    managerId: 'Ricardo Silva',
    startDate: '2026-10-01',
    plannedEndDate: '2026-11-30',
    contractValue: 35000,
    status: 'agendada' as ProjectStatus,
    notes: ''
  });

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectForm.title) return;
    const proj = addProject({
      clientId: newProjectForm.clientId,
      title: newProjectForm.title,
      serviceType: newProjectForm.serviceType,
      address: newProjectForm.address || newProjectForm.city,
      city: newProjectForm.city,
      managerId: newProjectForm.managerId,
      startDate: newProjectForm.startDate,
      plannedEndDate: newProjectForm.plannedEndDate,
      contractValue: Number(newProjectForm.contractValue),
      status: newProjectForm.status,
      progressPercent: 0,
      notes: newProjectForm.notes
    });
    setShowNewModal(false);
    setSelectedProjectId(proj.id);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Obras & Reformas</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              mainTab === 'active' ? 'bg-sky-100 text-sky-800' : 'bg-slate-200 text-slate-800'
            }`}>
              {currentList.length} {mainTab === 'active' ? 'em curso' : 'arquivadas'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestão centralizada de obras: plano técnico, cronograma, equipa, diárias, materiais e margem de rentabilidade.
          </p>

          {/* Abas: Obras Ativas vs Obras Arquivadas / Concluídas */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => setMainTab('active')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                mainTab === 'active'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Obras Ativas ({activeProjects.length})
            </button>
            <button
              onClick={() => setMainTab('archived')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                mainTab === 'archived'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              Obras Concluídas & Arquivadas ({archivedProjects.length})
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 w-full lg:w-auto justify-end">
          {/* View switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-white shadow-xs text-sky-700 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
              title="Visualização em Cartões"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white shadow-xs text-sky-700 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
              title="Visualização em Lista"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-white shadow-xs text-sky-700 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
              title="Visualização em Kanban"
            >
              <KanbanSquare className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setShowNewModal(true)}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Obra</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Pesquisar código OB, cliente, cidade..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-slate-400 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden text-slate-700 font-medium"
          >
            <option value="all">Todos os Status</option>
            <option value="em_execucao">Em Execução</option>
            <option value="agendada">Agendada</option>
            <option value="nao_iniciada">Não Iniciada</option>
            <option value="pausada">Pausada</option>
            <option value="concluida">Concluída</option>
          </select>
        </div>
      </div>

      {/* VIEW: CARDS */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(project => {
            const client = clients.find(c => c.id === project.clientId);
            const summary = getProjectFinancialSummary(project.id);
            const statusConfig = statusBadges[project.status];

            return (
              <div
                key={project.id}
                onClick={() => setSelectedProjectId(project.id)}
                className="prime-card p-5 cursor-pointer hover:border-sky-400 hover:shadow-lg transition-all group flex flex-col justify-between"
              >
                <div>
                  {/* Top bar: ID and Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-xs font-black text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-md">
                      {project.id}
                    </span>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Title & Client */}
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{client?.name || 'Cliente'}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{project.city} • {project.serviceType}</span>
                  </p>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-600">Progresso da Obra</span>
                      <span className="text-slate-900 font-bold">{project.progressPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-sky-600 rounded-full transition-all duration-300"
                        style={{ width: `${project.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Dates & Manager */}
                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">Início / Fim</span>
                      <span className="font-medium text-slate-700">
                        {project.startDate.slice(5)} → {project.plannedEndDate.slice(5)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Gestor de Obra</span>
                      <span className="font-medium text-slate-700 truncate block">
                        {project.managerId}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Financial Footer Strip */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/70 -mx-5 -mb-5 p-3 px-5 rounded-b-xl">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Valor Contrato</span>
                    <span className="font-extrabold text-xs text-slate-900">
                      €{summary.totalContractValue.toLocaleString('pt-PT')}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Margem {mainTab === 'archived' ? 'Final' : 'Realizada'}</span>
                    <div className="flex items-center gap-1 font-bold text-xs text-emerald-600">
                      <span>€{Math.round(summary.marginAmount).toLocaleString('pt-PT')}</span>
                      <span className="text-[10px] bg-emerald-100 px-1 py-0.2 rounded font-mono">
                        {Math.round(summary.marginPercent)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Bar / Arquivo */}
                {mainTab === 'archived' ? (
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Concluída {project.archivedDate ? `em ${project.archivedDate}` : ''}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        unarchiveProject(project.id);
                      }}
                      className="px-2 py-1 text-slate-600 hover:text-sky-700 hover:bg-sky-50 rounded font-medium flex items-center gap-1"
                      title="Mover de volta para obras ativas"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reativar
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-end text-xs">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setArchiveModalProject(project);
                      }}
                      className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 px-2 py-1 rounded font-medium flex items-center gap-1 transition-colors"
                      title="Arquivar obra ao concluir"
                    >
                      <Archive className="w-3 h-3" />
                      Arquivar / Concluir
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW: TABLE */}
      {viewMode === 'table' && (
        <div className="prime-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Obra / Título</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Progresso</th>
                  <th className="py-3 px-4 text-right">Contrato</th>
                  <th className="py-3 px-4 text-right">Custos</th>
                  <th className="py-3 px-4 text-right">Margem</th>
                  <th className="py-3 px-4 text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProjects.map(proj => {
                  const client = clients.find(c => c.id === proj.clientId);
                  const summary = getProjectFinancialSummary(proj.id);
                  const statusConfig = statusBadges[proj.status];

                  return (
                    <tr key={proj.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-sky-700">{proj.id}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{proj.title}</span>
                        <span className="text-[11px] text-slate-400">{proj.city} • {proj.serviceType}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">{client?.name || 'Cliente'}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        {proj.progressPercent}%
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        €{summary.totalContractValue.toLocaleString('pt-PT')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-rose-600">
                        €{Math.round(summary.totalCost).toLocaleString('pt-PT')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                        €{Math.round(summary.marginAmount).toLocaleString('pt-PT')} ({Math.round(summary.marginPercent)}%)
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setSelectedProjectId(proj.id)}
                          className="px-3 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold rounded-lg text-xs transition-colors"
                        >
                          Ver Central
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: KANBAN */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-x-auto">
          {(['agendada', 'em_execucao', 'pausada', 'concluida'] as ProjectStatus[]).map(st => {
            const stProjects = filteredProjects.filter(p => p.status === st);
            const statusConfig = statusBadges[st];

            return (
              <div key={st} className="bg-slate-100/70 p-3 rounded-xl border border-slate-200 flex flex-col">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${statusConfig.color}`}>
                    {statusConfig.label}
                  </span>
                  <span className="text-xs font-bold text-slate-500">{stProjects.length}</span>
                </div>

                <div className="space-y-2.5">
                  {stProjects.map(proj => {
                    const client = clients.find(c => c.id === proj.clientId);
                    return (
                      <div
                        key={proj.id}
                        onClick={() => setSelectedProjectId(proj.id)}
                        className="prime-card p-3 cursor-pointer hover:border-sky-300 transition-all"
                      >
                        <div className="flex justify-between items-center text-[10px] mb-1">
                          <span className="font-mono font-bold text-sky-700">{proj.id}</span>
                          <span className="text-slate-400">{proj.progressPercent}%</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{proj.title}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">{client?.name}</p>
                        <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between text-xs font-bold text-slate-800">
                          <span>€{proj.contractValue.toLocaleString('pt-PT')}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create New Project Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Criar Nova Obra / Reforma</h3>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Título da Obra / Reforma *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Reforma Integral T3 Chiado"
                  value={newProjectForm.title}
                  onChange={e => setNewProjectForm({ ...newProjectForm, title: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cliente Associado *</label>
                  <select
                    value={newProjectForm.clientId}
                    onChange={e => setNewProjectForm({ ...newProjectForm, clientId: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo de Reforma</label>
                  <select
                    value={newProjectForm.serviceType}
                    onChange={e => setNewProjectForm({ ...newProjectForm, serviceType: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="Reforma integral">Reforma Integral</option>
                    <option value="Banheiros & Cozinhas">Banheiros & Cozinhas</option>
                    <option value="Parquet">Parquet & Pavimentos</option>
                    <option value="Pintura & Acabamentos">Pintura & Acabamentos</option>
                    <option value="Comercial / Escritório">Comercial / Escritório</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Morada da Obra</label>
                  <input
                    type="text"
                    placeholder="Rua, número, andar"
                    value={newProjectForm.address}
                    onChange={e => setNewProjectForm({ ...newProjectForm, address: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cidade</label>
                  <input
                    type="text"
                    value={newProjectForm.city}
                    onChange={e => setNewProjectForm({ ...newProjectForm, city: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Valor Contrato (€)</label>
                  <input
                    type="number"
                    value={newProjectForm.contractValue}
                    onChange={e => setNewProjectForm({ ...newProjectForm, contractValue: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data Início</label>
                  <input
                    type="date"
                    value={newProjectForm.startDate}
                    onChange={e => setNewProjectForm({ ...newProjectForm, startDate: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fim Previsto</label>
                  <input
                    type="date"
                    value={newProjectForm.plannedEndDate}
                    onChange={e => setNewProjectForm({ ...newProjectForm, plannedEndDate: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold"
                >
                  Criar Obra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE ARQUIVAMENTO / CONCLUSÃO */}
      {archiveModalProject && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
                  <Archive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Concluir & Arquivar Obra</h3>
                  <p className="text-xs text-slate-300 font-mono">{archiveModalProject.id} - {archiveModalProject.title}</p>
                </div>
              </div>
              <button
                onClick={() => setArchiveModalProject(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                Ao arquivar, esta obra será marcada como <strong>Concluída</strong> e movida para o separador de <strong>Histórico</strong>. 
                Os dados financeiros ficam consolidados para relatórios executivos e histórico de margem.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Notas de Fecho / Observações Finais
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Vistoria final realizada sem reparos pendentes. Cliente deu feedback 5 estrelas. Margem dentro do previsto."
                  value={archiveNotes}
                  onChange={(e) => setArchiveNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setArchiveModalProject(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    archiveProject(archiveModalProject.id, archiveNotes);
                    setArchiveModalProject(null);
                    setArchiveNotes('');
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  Confirmar Arquivamento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
