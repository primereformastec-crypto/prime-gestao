import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Lead, LeadStatus } from '../../types';
import { LeadDetailModal } from './LeadDetailModal';
import { LegacyLeadsPipeline } from './LegacyLeadsPipeline';
import { 
  Plus, Search, Phone, MapPin, Calendar, Clock, 
  Euro, User, AlertCircle, CheckCircle2, 
  Filter, Sparkles, ArrowRight, LayoutGrid, List, KanbanSquare
} from 'lucide-react';

export const CrmKanban: React.FC = () => {
  const { leads, moveLeadStatus, addLead, selectedLeadId, setSelectedLeadId } = useApp();

  const [crmSubTab, setCrmSubTab] = useState<'novos' | 'antigos'>('novos');

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterService, setFilterService] = useState('all');
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);

  // 10 colunas comerciais
  const columns: { id: LeadStatus; title: string; color: string; headerBg: string }[] = [
    { id: 'novo_lead', title: 'Novo Lead', color: 'border-sky-500', headerBg: 'bg-sky-50 text-sky-800' },
    { id: 'tentativa_contacto', title: 'Tentativa Contacto', color: 'border-amber-400', headerBg: 'bg-amber-50 text-amber-800' },
    { id: 'contactado', title: 'Contactado', color: 'border-blue-400', headerBg: 'bg-blue-50 text-blue-800' },
    { id: 'qualificado', title: 'Qualificado', color: 'border-indigo-500', headerBg: 'bg-indigo-50 text-indigo-800' },
    { id: 'visita_agendada', title: 'Visita Agendada', color: 'border-purple-500', headerBg: 'bg-purple-50 text-purple-800' },
    { id: 'visita_realizada', title: 'Visita Realizada', color: 'border-violet-500', headerBg: 'bg-violet-50 text-violet-800' },
    { id: 'orcamento_enviado', title: 'Orçamento Enviado', color: 'border-cyan-500', headerBg: 'bg-cyan-50 text-cyan-800' },
    { id: 'negociacao', title: 'Negociação', color: 'border-amber-500', headerBg: 'bg-amber-100/70 text-amber-900' },
    { id: 'vendido', title: 'Vendido', color: 'border-emerald-500', headerBg: 'bg-emerald-50 text-emerald-800' },
    { id: 'perdido', title: 'Perdido', color: 'border-rose-400', headerBg: 'bg-rose-50 text-rose-800' },
  ];

  // Filtro (Apenas novos leads da operação diária)
  const newLeads = leads.filter(l => !l.isLegacy);
  const legacyLeadsCount = leads.filter(l => l.isLegacy || l.source === 'Meta Ads').length;

  const filteredLeads = newLeads.filter(l => {
    const matchesSearch = 
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.phone.includes(searchQuery) ||
      l.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesService = filterService === 'all' || l.service === filterService;
    return matchesSearch && matchesService;
  });

  const getDaysWithoutContact = (dateStr?: string) => {
    if (!dateStr) return 2;
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const handleDragStart = (leadId: string) => {
    setDraggedLeadId(leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault();
    if (draggedLeadId) {
      moveLeadStatus(draggedLeadId, status);
      setDraggedLeadId(null);
    }
  };

  const [newLeadForm, setNewLeadForm] = useState({
    name: '',
    phone: '',
    email: '',
    city: 'Lisboa',
    service: 'Reforma integral',
    source: 'Instagram' as Lead['source'],
    salesRep: 'Breno Ramos',
    estimatedValue: 20000,
    notes: ''
  });

  const handleCreateLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadForm.name || !newLeadForm.phone) return;
    const created = addLead({
      name: newLeadForm.name,
      phone: newLeadForm.phone,
      email: newLeadForm.email || `${newLeadForm.name.toLowerCase().replace(/\s+/g, '.')}@cliente.pt`,
      city: newLeadForm.city,
      service: newLeadForm.service,
      source: newLeadForm.source,
      salesRep: newLeadForm.salesRep,
      estimatedValue: Number(newLeadForm.estimatedValue),
      status: 'novo_lead',
      dateAdded: new Date().toISOString().slice(0, 10),
      notes: newLeadForm.notes
    });
    setShowNewLeadModal(false);
    setSelectedLeadId(created.id);
  };

  if (crmSubTab === 'antigos') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs m-4 md:m-8 mb-0">
          <button
            onClick={() => setCrmSubTab('novos')}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 text-slate-600 hover:bg-slate-50 transition-all"
          >
            <Sparkles className="w-4 h-4 text-slate-400" />
            <span>Novos Leads (Operação Diária)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 font-bold">
              {newLeads.length}
            </span>
          </button>

          <button
            onClick={() => setCrmSubTab('antigos')}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 bg-blue-600 text-white shadow-xs transition-all"
          >
            <KanbanSquare className="w-4 h-4 text-blue-200" />
            <span>Leads Antigos (Meta Ads / Triagem Alexandre)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-700 text-white font-bold">
              {legacyLeadsCount}
            </span>
          </button>
        </div>

        <LegacyLeadsPipeline />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col p-4 md:p-6 overflow-hidden">
      {/* Top Switcher Tabs */}
      <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs mb-4 shrink-0">
        <button
          onClick={() => setCrmSubTab('novos')}
          className="flex-1 py-2 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 bg-sky-600 text-white shadow-xs transition-all"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Novos Leads (Operação Diária)</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-sky-700 text-white font-bold">
            {newLeads.length}
          </span>
        </button>

        <button
          onClick={() => setCrmSubTab('antigos')}
          className="flex-1 py-2 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 text-slate-600 hover:bg-slate-50 transition-all"
        >
          <KanbanSquare className="w-4 h-4 text-slate-400" />
          <span>Leads Antigos (Meta Ads / Triagem Alexandre)</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-700 font-bold">
            {legacyLeadsCount}
          </span>
        </button>
      </div>

      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4 shrink-0 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>CRM & Funil de Vendas</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
              {filteredLeads.length} oportunidades
            </span>
          </h1>

          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filtrar por nome, tel, cidade..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          {/* Alternador de Visualização */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'kanban' ? 'bg-white text-sky-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Funil Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'list' ? 'bg-white text-sky-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Tabela</span>
            </button>
          </div>

          <select
            value={filterService}
            onChange={e => setFilterService(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden text-slate-700 font-medium"
          >
            <option value="all">Todos os Serviços</option>
            <option value="Reforma integral">Reforma Integral</option>
            <option value="Banheiros">Banheiros</option>
            <option value="Cozinhas">Cozinhas</option>
            <option value="Parquet">Parquet</option>
            <option value="Ar condicionado">Ar Condicionado</option>
            <option value="Trabalhos verticais">Trabalhos Verticais</option>
          </select>

          <button
            onClick={() => setShowNewLeadModal(true)}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Lead</span>
          </button>
        </div>
      </div>

      {/* Board or Table View */}
      {viewMode === 'kanban' ? (
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-3 h-full min-w-max">
            {columns.map(col => {
              const colLeads = filteredLeads.filter(l => l.status === col.id);
              const colValue = colLeads.reduce((sum, l) => sum + (l.finalValue || l.estimatedValue || 0), 0);

              return (
                <div
                  key={col.id}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, col.id)}
                  className="w-72 bg-slate-100/70 rounded-xl flex flex-col border border-slate-200/70 overflow-hidden shrink-0"
                >
                  {/* Column Header */}
                  <div className={`p-3 border-b border-slate-200 flex items-center justify-between ${col.headerBg}`}>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">{col.title}</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white/80 shadow-2xs">
                        {colLeads.length}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold opacity-80 font-mono">
                      €{(colValue / 1000).toFixed(0)}k
                    </span>
                  </div>

                  {/* Cards Container */}
                  <div className="flex-1 p-2 space-y-2.5 overflow-y-auto">
                    {colLeads.map(lead => {
                      const daysWithoutContact = getDaysWithoutContact(lead.lastContactDate || lead.dateAdded);
                      const isUrgent = daysWithoutContact >= 2 && lead.status !== 'vendido' && lead.status !== 'perdido';

                      return (
                        <div
                          key={lead.id}
                          draggable
                          onDragStart={() => handleDragStart(lead.id)}
                          onClick={() => setSelectedLeadId(lead.id)}
                          className="prime-card p-3.5 cursor-grab active:cursor-grabbing hover:border-sky-300 hover:shadow-md transition-all group"
                        >
                          {/* Top info */}
                          <div className="flex items-start justify-between gap-1 mb-1.5">
                            <span className="font-mono text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">
                              {lead.id}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              {lead.source}
                            </span>
                          </div>

                          {/* Name & Service */}
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                            {lead.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{lead.city} • {lead.service}</span>
                          </p>

                          {/* Financial Value & Urgency */}
                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="font-black text-slate-900">
                              €{((lead.finalValue || lead.estimatedValue || 0)).toLocaleString('pt-PT')}
                            </span>

                            {isUrgent ? (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                                <Clock className="w-3 h-3" />
                                <span>{daysWithoutContact}d</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">
                                {lead.salesRep}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {colLeads.length === 0 && (
                      <div className="h-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-[11px] text-slate-400">
                        Arraste um lead para aqui
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="prime-card overflow-hidden flex-1 overflow-y-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold border-b border-slate-200 sticky top-0">
              <tr>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Contacto / Potencial Cliente</th>
                <th className="py-3 px-4">Cidade</th>
                <th className="py-3 px-4">Serviço Pretendido</th>
                <th className="py-3 px-4">Origem</th>
                <th className="py-3 px-4 text-right">Valor Estimado</th>
                <th className="py-3 px-4">Fase do Funil</th>
                <th className="py-3 px-4">Último Contacto</th>
                <th className="py-3 px-4 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.map(l => {
                const days = getDaysWithoutContact(l.lastContactDate || l.dateAdded);
                const isUrgent = days >= 2 && l.status !== 'vendido' && l.status !== 'perdido';
                const col = columns.find(c => c.id === l.status);

                return (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-700">{l.id}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{l.name}</span>
                      <span className="text-[11px] text-slate-400">{l.phone}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{l.city}</td>
                    <td className="py-3.5 px-4 text-slate-800 font-medium">{l.service}</td>
                    <td className="py-3.5 px-4 text-slate-500">{l.source}</td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900">
                      €{(l.finalValue || l.estimatedValue || 0).toLocaleString('pt-PT')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${col?.headerBg || 'bg-slate-100 text-slate-700'}`}>
                        {col?.title || l.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {isUrgent ? (
                        <span className="text-rose-600 font-bold text-[11px] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {days}d sem contacto
                        </span>
                      ) : (
                        <span className="text-slate-500">{l.lastContactDate || l.dateAdded}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setSelectedLeadId(l.id)}
                        className="px-2.5 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg font-bold text-xs"
                      >
                        Abrir Ficha
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Lead Detail Modal */}
      {selectedLeadId && (
        <LeadDetailModal
          leadId={selectedLeadId}
          onClose={() => setSelectedLeadId(null)}
        />
      )}

      {/* New Lead Modal */}
      {showNewLeadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Registar Novo Lead Comercial</h3>
              <button onClick={() => setShowNewLeadModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLeadSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome do Contacto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João Silveira"
                  value={newLeadForm.name}
                  onChange={e => setNewLeadForm({ ...newLeadForm, name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Telefone / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    placeholder="+351 912 345 678"
                    value={newLeadForm.phone}
                    onChange={e => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cidade</label>
                  <input
                    type="text"
                    value={newLeadForm.city}
                    onChange={e => setNewLeadForm({ ...newLeadForm, city: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Serviço Pretendido</label>
                  <select
                    value={newLeadForm.service}
                    onChange={e => setNewLeadForm({ ...newLeadForm, service: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="Reforma integral">Reforma Integral</option>
                    <option value="Banheiros">Banheiros</option>
                    <option value="Cozinhas">Cozinhas</option>
                    <option value="Parquet">Parquet</option>
                    <option value="Ar condicionado">Ar Condicionado</option>
                    <option value="Trabalhos verticais">Trabalhos Verticais</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Valor Estimado (€)</label>
                  <input
                    type="number"
                    value={newLeadForm.estimatedValue}
                    onChange={e => setNewLeadForm({ ...newLeadForm, estimatedValue: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Origem do Lead</label>
                  <select
                    value={newLeadForm.source}
                    onChange={e => setNewLeadForm({ ...newLeadForm, source: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="Google">Google / Site</option>
                    <option value="Indicação">Indicação / Recomendação</option>
                    <option value="Meta Ads">Meta Ads (Facebook/Instagram)</option>
                    <option value="Site">Site PRIME</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Responsável Comercial</label>
                  <input
                    type="text"
                    value={newLeadForm.salesRep}
                    onChange={e => setNewLeadForm({ ...newLeadForm, salesRep: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notas Iniciais</label>
                <textarea
                  rows={2}
                  placeholder="Detalhes sobre a conversa inicial..."
                  value={newLeadForm.notes}
                  onChange={e => setNewLeadForm({ ...newLeadForm, notes: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewLeadModal(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold"
                >
                  Criar Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
