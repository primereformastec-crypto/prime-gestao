import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ToolItem, ToolStatus } from '../../types';
import { formatCurrency, parseCurrencyInput, sanitizeCurrencyInput } from '../../utils/currency';
import { 
  Wrench, Hammer, Plus, Search, Filter, Trash2, 
  Edit3, CheckCircle2, AlertTriangle, ArrowRightLeft, 
  Building2, User, Calendar, Euro, PackageCheck, AlertCircle, X
} from 'lucide-react';

const STANDARD_CATEGORIES = [
  'Elétrica',
  'Medição & Laser',
  'Corte',
  'Andaimes & Escadas',
  'Manuais',
  'Limpeza & Obra',
  'Pintura & Aplicação',
  'Outro Equipamento'
];

export const ToolsView: React.FC = () => {
  const { tools, projects, employees, addTool, updateTool, deleteTool } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState<'todos' | ToolStatus>('todos');
  const [locationFilter, setLocationFilter] = useState('todas');

  // Modal: Nova Ferramenta
  const [showAddModal, setShowAddModal] = useState(false);
  const [newToolForm, setNewToolForm] = useState({
    code: '',
    name: '',
    brand: '',
    category: STANDARD_CATEGORIES[0],
    status: 'disponivel' as ToolStatus,
    currentLocation: 'Armazém Central',
    assignedToEmployeeId: '',
    purchaseDate: new Date().toISOString().slice(0, 10),
    purchaseValue: '',
    notes: ''
  });

  // Modal: Editar Ferramenta
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTool, setEditingTool] = useState<ToolItem | null>(null);
  const [editToolForm, setEditToolForm] = useState({
    code: '',
    name: '',
    brand: '',
    category: '',
    status: 'disponivel' as ToolStatus,
    currentLocation: 'Armazém Central',
    assignedToEmployeeId: '',
    purchaseDate: '',
    purchaseValue: '',
    notes: ''
  });

  // Modal: Transferência Rápida de Obra / Localização
  const [transferringTool, setTransferringTool] = useState<ToolItem | null>(null);
  const [newLocationTarget, setNewLocationTarget] = useState('Armazém Central');
  const [newEmployeeTarget, setNewEmployeeTarget] = useState('');

  // Filtragem
  const filteredTools = tools.filter(tool => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      !q || 
      tool.name.toLowerCase().includes(q) || 
      tool.code.toLowerCase().includes(q) || 
      (tool.brand && tool.brand.toLowerCase().includes(q)) ||
      tool.currentLocation.toLowerCase().includes(q);

    const matchesCategory = categoryFilter === 'todos' || tool.category === categoryFilter;
    const matchesStatus = statusFilter === 'todos' || tool.status === statusFilter;
    const matchesLocation = locationFilter === 'todas' || tool.currentLocation === locationFilter;

    return matchesSearch && matchesCategory && matchesStatus && matchesLocation;
  });

  // Métricas
  const totalCount = tools.length;
  const inUseCount = tools.filter(t => t.status === 'em_uso').length;
  const availableCount = tools.filter(t => t.status === 'disponivel').length;
  const maintenanceCount = tools.filter(t => t.status === 'em_manutencao' || t.status === 'danificada').length;
  const totalValue = tools.reduce((acc, t) => acc + (t.purchaseValue || 0), 0);

  const handleCreateTool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newToolForm.name.trim()) {
      alert('O nome da ferramenta é obrigatório.');
      return;
    }

    addTool({
      code: newToolForm.code.trim(),
      name: newToolForm.name.trim(),
      brand: newToolForm.brand.trim() || undefined,
      category: newToolForm.category,
      status: newToolForm.status,
      currentLocation: newToolForm.currentLocation,
      assignedToEmployeeId: newToolForm.assignedToEmployeeId || undefined,
      purchaseDate: newToolForm.purchaseDate,
      purchaseValue: parseCurrencyInput(newToolForm.purchaseValue),
      notes: newToolForm.notes.trim()
    });

    setShowAddModal(false);
    setNewToolForm({
      code: '',
      name: '',
      brand: '',
      category: STANDARD_CATEGORIES[0],
      status: 'disponivel',
      currentLocation: 'Armazém Central',
      assignedToEmployeeId: '',
      purchaseDate: new Date().toISOString().slice(0, 10),
      purchaseValue: '',
      notes: ''
    });
  };

  const openEditModal = (tool: ToolItem) => {
    setEditingTool(tool);
    setEditToolForm({
      code: tool.code,
      name: tool.name,
      brand: tool.brand || '',
      category: tool.category,
      status: tool.status,
      currentLocation: tool.currentLocation,
      assignedToEmployeeId: tool.assignedToEmployeeId || '',
      purchaseDate: tool.purchaseDate || '',
      purchaseValue: String(tool.purchaseValue || ''),
      notes: tool.notes || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateTool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTool) return;

    updateTool(editingTool.id, {
      code: editToolForm.code.trim() || editingTool.code,
      name: editToolForm.name.trim(),
      brand: editToolForm.brand.trim() || undefined,
      category: editToolForm.category,
      status: editToolForm.status,
      currentLocation: editToolForm.currentLocation,
      assignedToEmployeeId: editToolForm.assignedToEmployeeId || undefined,
      purchaseDate: editToolForm.purchaseDate,
      purchaseValue: parseCurrencyInput(editToolForm.purchaseValue),
      notes: editToolForm.notes.trim()
    });

    setShowEditModal(false);
    setEditingTool(null);
  };

  const handleDeleteTool = (tool: ToolItem) => {
    if (window.confirm(`Tem a certeza que deseja eliminar "${tool.name}" (${tool.code}) do inventário?`)) {
      deleteTool(tool.id);
    }
  };

  const handleConfirmTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferringTool) return;

    const newStatus: ToolStatus = newLocationTarget === 'Armazém Central' ? 'disponivel' : 'em_uso';

    updateTool(transferringTool.id, {
      currentLocation: newLocationTarget,
      assignedToEmployeeId: newEmployeeTarget || undefined,
      status: newStatus
    });

    alert(`✓ Ferramenta ${transferringTool.code} alocada com sucesso para: ${newLocationTarget}`);
    setTransferringTool(null);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-sky-700 font-bold uppercase tracking-wider mb-1">
            <Wrench className="w-4 h-4 text-sky-600" />
            <span>Gestão & Obras • Património da Empresa</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Inventário de Ferramentas & Máquinas</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Controlo de ferramentas elétricas, lasers, manuais e máquinas alocadas a obras ou em armazém.
          </p>
        </div>

        <button
          onClick={() => {
            const nextNum = tools.length + 1;
            setNewToolForm(prev => ({ ...prev, code: `FER-${String(nextNum).padStart(3, '0')}` }));
            setShowAddModal(true);
          }}
          className="prime-button px-4 py-2 text-xs flex items-center gap-2 shadow-md shadow-sky-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>+ Registar Ferramenta</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="prime-card p-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Ferramentas</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-900">{totalCount}</span>
            <span className="text-xs font-semibold text-sky-600">No inventário</span>
          </div>
        </div>

        <div className="prime-card p-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Disponíveis em Armazém</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-emerald-600">{availableCount}</span>
            <span className="text-xs font-semibold text-slate-400">Prontas p/ obra</span>
          </div>
        </div>

        <div className="prime-card p-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Em Uso nas Obras</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-blue-600">{inUseCount}</span>
            <span className="text-xs font-semibold text-slate-400">Alocadas</span>
          </div>
        </div>

        <div className="prime-card p-4 border-amber-200 bg-amber-50/30">
          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">Em Manutenção / Danificadas</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-amber-700">{maintenanceCount}</span>
            <span className="text-xs font-semibold text-amber-600">Requer atenção</span>
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="prime-card p-3 md:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar ferramenta, marca, código FER, obra ou armazém..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-sky-500"
          >
            <option value="todos">Todas as Categorias</option>
            {STANDARD_CATEGORIES.map((c, i) => (
              <option key={i} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-sky-500"
          >
            <option value="todos">Todos os Estados</option>
            <option value="disponivel">Disponível</option>
            <option value="em_uso">Em Uso (Na Obra)</option>
            <option value="em_manutencao">Em Manutenção</option>
            <option value="danificada">Danificada</option>
          </select>

          <select
            value={locationFilter}
            onChange={e => setLocationFilter(e.target.value)}
            className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-sky-500"
          >
            <option value="todas">Todas as Localizações</option>
            <option value="Armazém Central">Armazém Central</option>
            {projects.map(p => (
              <option key={p.id} value={`${p.id} - ${p.title}`}>{p.id} - {p.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid de Ferramentas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTools.map(tool => {
          const assignedEmp = employees.find(e => e.id === tool.assignedToEmployeeId);

          const statusStyles = {
            disponivel: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            em_uso: 'bg-blue-50 text-blue-700 border-blue-200',
            em_manutencao: 'bg-amber-50 text-amber-700 border-amber-200',
            danificada: 'bg-rose-50 text-rose-700 border-rose-200'
          };

          const statusLabels = {
            disponivel: 'Disponível',
            em_uso: 'Em Obra',
            em_manutencao: 'Em Manutenção',
            danificada: 'Danificada'
          };

          return (
            <div 
              key={tool.id} 
              className="prime-card p-4 hover:border-sky-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                      <Wrench className="w-4 h-4 text-sky-600" />
                    </div>
                    <div>
                      <span className="font-mono text-[10px] font-black text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded">
                        {tool.code}
                      </span>
                      <h3 className="text-xs font-extrabold text-slate-900 mt-0.5 line-clamp-1">{tool.name}</h3>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusStyles[tool.status]}`}>
                    {statusLabels[tool.status]}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-[11px] text-slate-400">Marca / Fabricante:</span>
                    <span className="font-bold text-slate-800">{tool.brand || 'Não indicada'}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-[11px] text-slate-400">Categoria:</span>
                    <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      {tool.category}
                    </span>
                  </div>

                  {/* Localização Atual */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 mt-2 space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate font-bold text-slate-800">
                        {tool.currentLocation}
                      </span>
                    </div>

                    {assignedEmp && (
                      <div className="flex items-center gap-1.5 text-[11px] text-sky-700 font-semibold pt-1 border-t border-slate-200/60">
                        <User className="w-3 h-3 text-sky-600 shrink-0" />
                        <span>Com: {assignedEmp.name}</span>
                      </div>
                    )}
                  </div>

                  {tool.notes && (
                    <p className="text-[11px] text-slate-500 italic mt-2 line-clamp-2">
                      "{tool.notes}"
                    </p>
                  )}
                </div>
              </div>

              {/* Ações */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(tool)}
                    className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                    title="Editar Ferramenta"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteTool(tool)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Eliminar Ferramenta"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => {
                    setTransferringTool(tool);
                    setNewLocationTarget(tool.currentLocation);
                    setNewEmployeeTarget(tool.assignedToEmployeeId || '');
                  }}
                  className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Mover / Alocar</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: REGISTAR FERRAMENTA */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-sky-600" />
                <h3 className="font-bold text-slate-900 text-sm">Registar Ferramenta no Inventário</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateTool} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Código *</label>
                  <input
                    type="text"
                    required
                    value={newToolForm.code}
                    onChange={e => setNewToolForm({ ...newToolForm, code: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Nome da Ferramenta / Máquina *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Martelo Perfurador SDS-Plus"
                    value={newToolForm.name}
                    onChange={e => setNewToolForm({ ...newToolForm, name: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Marca / Modelo</label>
                  <input
                    type="text"
                    placeholder="Ex: Bosch Professional, Makita, DeWalt"
                    value={newToolForm.brand}
                    onChange={e => setNewToolForm({ ...newToolForm, brand: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Categoria *</label>
                  <select
                    value={newToolForm.category}
                    onChange={e => setNewToolForm({ ...newToolForm, category: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    {STANDARD_CATEGORIES.map((c, i) => (
                      <option key={i} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Localização Inicial *</label>
                  <select
                    value={newToolForm.currentLocation}
                    onChange={e => setNewToolForm({ ...newToolForm, currentLocation: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  >
                    <option value="Armazém Central">Armazém Central</option>
                    {projects.map(p => (
                      <option key={p.id} value={`${p.id} - ${p.title}`}>{p.id} - {p.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Colaborador com a Ferramenta</label>
                  <select
                    value={newToolForm.assignedToEmployeeId}
                    onChange={e => setNewToolForm({ ...newToolForm, assignedToEmployeeId: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="">Nenhum (Livre no armazém)</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estado</label>
                  <select
                    value={newToolForm.status}
                    onChange={e => setNewToolForm({ ...newToolForm, status: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  >
                    <option value="disponivel">Disponível</option>
                    <option value="em_uso">Em Uso (Na Obra)</option>
                    <option value="em_manutencao">Em Manutenção</option>
                    <option value="danificada">Danificada</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Valor de Aquisição (€)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Ex: 249"
                    value={newToolForm.purchaseValue}
                    onChange={e => setNewToolForm({ ...newToolForm, purchaseValue: sanitizeCurrencyInput(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notas / Observações</label>
                <textarea
                  rows={2}
                  placeholder="Número de série, acessórios incluídos, data de revisão..."
                  value={newToolForm.notes}
                  onChange={e => setNewToolForm({ ...newToolForm, notes: e.target.value })}
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
                  Guardar no Inventário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MOVER / ALOCAR FERRAMENTA */}
      {transferringTool && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Alocar / Mover Ferramenta</h3>
                <span className="text-[11px] text-sky-700 font-bold">{transferringTool.code} - {transferringTool.name}</span>
              </div>
              <button onClick={() => setTransferringTool(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleConfirmTransfer} className="p-5 space-y-3.5 text-xs">
              <div className="p-3 bg-sky-50 rounded-xl border border-sky-100 text-sky-900">
                <span className="text-[11px] text-sky-600 font-bold block uppercase">Localização Atual:</span>
                <span className="font-bold text-sm">{transferringTool.currentLocation}</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nova Localização de Destino *</label>
                <select
                  value={newLocationTarget}
                  onChange={e => setNewLocationTarget(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  required
                >
                  <option value="Armazém Central">Armazém Central (Devolver ao armazém)</option>
                  {projects.map(p => (
                    <option key={p.id} value={`${p.id} - ${p.title}`}>{p.id} - {p.title} ({p.city})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Colaborador Responsável na Obra</label>
                <select
                  value={newEmployeeTarget}
                  onChange={e => setNewEmployeeTarget(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="">Sem responsável específico (Geral da obra)</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTransferringTool(null)}
                  className="px-3.5 py-1.5 text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-sky-600 text-white rounded-lg font-bold"
                >
                  Confirmar Transferência
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR FERRAMENTA */}
      {showEditModal && editingTool && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-sky-600" />
                <h3 className="font-bold text-slate-900 text-sm">Editar Ferramenta {editingTool.code}</h3>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleUpdateTool} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Código *</label>
                  <input
                    type="text"
                    required
                    value={editToolForm.code}
                    onChange={e => setEditToolForm({ ...editToolForm, code: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Nome da Ferramenta *</label>
                  <input
                    type="text"
                    required
                    value={editToolForm.name}
                    onChange={e => setEditToolForm({ ...editToolForm, name: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Marca / Modelo</label>
                  <input
                    type="text"
                    value={editToolForm.brand}
                    onChange={e => setEditToolForm({ ...editToolForm, brand: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Categoria *</label>
                  <select
                    value={editToolForm.category}
                    onChange={e => setEditToolForm({ ...editToolForm, category: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    {STANDARD_CATEGORIES.map((c, i) => (
                      <option key={i} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estado</label>
                  <select
                    value={editToolForm.status}
                    onChange={e => setEditToolForm({ ...editToolForm, status: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  >
                    <option value="disponivel">Disponível</option>
                    <option value="em_uso">Em Uso (Na Obra)</option>
                    <option value="em_manutencao">Em Manutenção</option>
                    <option value="danificada">Danificada</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Localização Atual</label>
                  <input
                    type="text"
                    value={editToolForm.currentLocation}
                    onChange={e => setEditToolForm({ ...editToolForm, currentLocation: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notas / Observações</label>
                <textarea
                  rows={2}
                  value={editToolForm.notes}
                  onChange={e => setEditToolForm({ ...editToolForm, notes: e.target.value })}
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
    </div>
  );
};
