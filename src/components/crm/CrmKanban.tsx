import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Lead, LeadStatus, Project, ProjectStatus } from '../../types';
import { LeadDetailModal } from './LeadDetailModal';
import { LegacyLeadsPipeline } from './LegacyLeadsPipeline';
import { detectLeadInterest, getInterestBadge, STANDARD_INTERESTS } from '../../utils/interestDetector';
import { 
  Plus, Search, Phone, MapPin, Calendar, Clock, 
  Euro, User, AlertCircle, CheckCircle2, AlertTriangle,
  Filter, Sparkles, ArrowRight, LayoutGrid, List, KanbanSquare,
  MessageSquare, Trash2, Building2, ChevronRight, ChevronLeft, CheckCheck, X
} from 'lucide-react';

export const CrmKanban: React.FC = () => {
  const { 
    leads, 
    projects,
    clients,
    moveLeadStatus, 
    addLead, 
    updateLead, 
    deleteLead, 
    convertLeadToProjectAndClient, 
    selectedLeadId, 
    setSelectedLeadId,
    setActiveTab,
    setSelectedProjectId
  } = useApp();

  const [crmSubTab, setCrmSubTab] = useState<'novos' | 'antigos'>('novos');

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInterestFilter, setSelectedInterestFilter] = useState<string>('all');
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);

  // Conversion Modal State
  const [leadToConvert, setLeadToConvert] = useState<Lead | null>(null);
  const [matchingExistingProject, setMatchingExistingProject] = useState<Project | null>(null);
  const [convertStatus, setConvertStatus] = useState<ProjectStatus>('em_execucao');
  const [convertService, setConvertService] = useState('');
  const [convertContractValue, setConvertContractValue] = useState<number>(0);
  const [convertNotes, setConvertNotes] = useState('');

  // 10 colunas comerciais
  const columns: { id: LeadStatus; title: string; color: string; headerBg: string; badgeColor: string }[] = [
    { id: 'novo_lead', title: '1º Contacto (Por Falar)', color: 'border-blue-500', headerBg: 'bg-blue-50 text-blue-900', badgeColor: 'bg-blue-600 text-white' },
    { id: 'tentativa_contacto', title: 'Tentativa Contacto', color: 'border-amber-400', headerBg: 'bg-amber-50 text-amber-800', badgeColor: 'bg-amber-500 text-white' },
    { id: 'contactado', title: 'Em Conversa', color: 'border-sky-400', headerBg: 'bg-sky-50 text-sky-800', badgeColor: 'bg-sky-500 text-white' },
    { id: 'qualificado', title: 'Qualificado', color: 'border-indigo-500', headerBg: 'bg-indigo-50 text-indigo-800', badgeColor: 'bg-indigo-600 text-white' },
    { id: 'visita_agendada', title: 'Visita Agendada', color: 'border-purple-500', headerBg: 'bg-purple-50 text-purple-800', badgeColor: 'bg-purple-600 text-white' },
    { id: 'visita_realizada', title: 'Visita Realizada', color: 'border-violet-500', headerBg: 'bg-violet-50 text-violet-800', badgeColor: 'bg-violet-600 text-white' },
    { id: 'orcamento_enviado', title: 'Orçamento Enviado', color: 'border-cyan-500', headerBg: 'bg-cyan-50 text-cyan-800', badgeColor: 'bg-cyan-600 text-white' },
    { id: 'negociacao', title: 'Negociação', color: 'border-amber-500', headerBg: 'bg-amber-100/70 text-amber-900', badgeColor: 'bg-amber-600 text-white' },
    { id: 'vendido', title: 'Vendido (Gera Obra)', color: 'border-emerald-500', headerBg: 'bg-emerald-50 text-emerald-800', badgeColor: 'bg-emerald-600 text-white' },
    { id: 'perdido', title: 'Perdido / Não Atende', color: 'border-rose-400', headerBg: 'bg-rose-50 text-rose-800', badgeColor: 'bg-rose-600 text-white' },
  ];

  // Filtro (Apenas novos leads da operação diária)
  const newLeads = leads.filter(l => !l.isLegacy);
  const legacyLeadsCount = leads.filter(l => l.isLegacy || l.source === 'Meta Ads').length;

  const filteredLeads = newLeads.filter(l => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      l.name.toLowerCase().includes(q) ||
      l.phone.includes(q) ||
      (l.service && l.service.toLowerCase().includes(q)) ||
      (l.city && l.city.toLowerCase().includes(q)) ||
      (l.notes && l.notes.toLowerCase().includes(q)) ||
      l.id.toLowerCase().includes(q)
    );

    let matchesInterest = true;
    if (selectedInterestFilter !== 'all') {
      const badge = getInterestBadge(l.service);
      matchesInterest = badge.category === selectedInterestFilter;
    }

    return matchesSearch && matchesInterest;
  });

  // KPI Metrics with Monetary Totals
  const uncontactedCount = newLeads.filter(l => l.status === 'novo_lead').length;
  const inProgressCount = newLeads.filter(l => l.status !== 'novo_lead' && l.status !== 'vendido' && l.status !== 'perdido').length;
  const wonCount = newLeads.filter(l => l.status === 'vendido').length;
  const lostCount = newLeads.filter(l => l.status === 'perdido').length;

  const quotedLeads = newLeads.filter(l => l.status === 'orcamento_enviado' || l.status === 'negociacao');
  const quotedValueTotal = quotedLeads.reduce((acc, l) => acc + (l.finalValue || l.estimatedValue || 0), 0);
  const wonValueTotal = newLeads.filter(l => l.status === 'vendido').reduce((acc, l) => acc + (l.finalValue || l.estimatedValue || 0), 0);

  const interestCounts = {
    all: newLeads.length,
    ducha: newLeads.filter(l => getInterestBadge(l.service).category === 'ducha').length,
    termo: newLeads.filter(l => getInterestBadge(l.service).category === 'termo').length,
    aire: newLeads.filter(l => getInterestBadge(l.service).category === 'aire').length,
    bano: newLeads.filter(l => getInterestBadge(l.service).category === 'bano').length,
    cocina: newLeads.filter(l => getInterestBadge(l.service).category === 'cocina').length,
    integral: newLeads.filter(l => getInterestBadge(l.service).category === 'integral').length,
  };

  const handleDragStart = (leadId: string) => {
    setDraggedLeadId(leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault();
    if (!draggedLeadId) return;

    if (status === 'vendido') {
      const lead = leads.find(l => l.id === draggedLeadId);
      if (lead) {
        checkAndOpenConversionModal(lead);
      }
    } else {
      moveLeadStatus(draggedLeadId, status);
    }
    setDraggedLeadId(null);
  };

  // Step advancement helper (Click instead of drag)
  const handleMoveStep = (lead: Lead, direction: 'prev' | 'next') => {
    const colIndex = columns.findIndex(c => c.id === lead.status);
    if (direction === 'prev' && colIndex > 0) {
      moveLeadStatus(lead.id, columns[colIndex - 1].id);
    } else if (direction === 'next' && colIndex < columns.length - 1) {
      const nextCol = columns[colIndex + 1];
      if (nextCol.id === 'vendido') {
        checkAndOpenConversionModal(lead);
      } else {
        moveLeadStatus(lead.id, nextCol.id);
      }
    }
  };

  const checkAndOpenConversionModal = (lead: Lead) => {
    const cleanP = lead.phone.replace(/[^\d]/g, '');
    const matchedClient = clients.find(c => {
      const cPhone = c.phone.replace(/[^\d]/g, '');
      return (cleanP && cPhone && (cleanP.includes(cPhone) || cPhone.includes(cleanP))) ||
        (lead.email && c.email && lead.email.toLowerCase() === c.email.toLowerCase()) ||
        lead.name.toLowerCase() === c.name.toLowerCase();
    });

    let matchedProj: Project | null = null;
    if (matchedClient) {
      matchedProj = projects.find(p => p.clientId === matchedClient.id) || null;
    } else {
      matchedProj = projects.find(p => 
        p.title.toLowerCase().includes(lead.name.toLowerCase()) ||
        (lead.address && p.address.toLowerCase().includes(lead.address.toLowerCase()))
      ) || null;
    }

    setLeadToConvert(lead);
    setMatchingExistingProject(matchedProj);
    setConvertService(lead.service || 'Reforma Geral');
    setConvertContractValue(lead.finalValue || lead.estimatedValue || 0);
    setConvertStatus('em_execucao');
    setConvertNotes(lead.notes || '');
  };

  const handleConfirmConvertNewProject = () => {
    if (!leadToConvert) return;
    const { project } = convertLeadToProjectAndClient(leadToConvert.id, {
      status: convertStatus,
      serviceType: convertService.trim() || leadToConvert.service,
      contractValue: Number(convertContractValue) || 0,
      notes: convertNotes
    });
    setLeadToConvert(null);
    setMatchingExistingProject(null);
    if (confirm(`✓ Sucesso! Obra ${project.id} criada. Deseja abrir a página da obra agora?`)) {
      setSelectedProjectId(project.id);
      setActiveTab('obras');
    }
  };

  const handleLinkToExistingProject = (projId: string) => {
    if (!leadToConvert) return;
    moveLeadStatus(leadToConvert.id, 'vendido');
    setLeadToConvert(null);
    setMatchingExistingProject(null);
    alert(`✓ Lead ${leadToConvert.id} marcado como Vendido e associado ao histórico da obra existente ${projId}!`);
  };

  // Form for New Lead
  const [newLeadForm, setNewLeadForm] = useState({
    name: '',
    phone: '',
    email: '',
    city: 'Barcelona',
    service: '🚿 Plato de Ducha',
    source: 'Instagram' as Lead['source'],
    salesRep: 'Alexandre (Comercial)',
    estimatedValue: 0,
    notes: ''
  });

  const handleCreateLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadForm.name || !newLeadForm.phone) return;
    const created = addLead({
      name: newLeadForm.name,
      phone: newLeadForm.phone,
      email: newLeadForm.email || `${newLeadForm.name.toLowerCase().replace(/\s+/g, '.')}@cliente.es`,
      city: newLeadForm.city || 'Barcelona',
      service: newLeadForm.service,
      source: newLeadForm.source,
      salesRep: newLeadForm.salesRep,
      estimatedValue: Number(newLeadForm.estimatedValue) || 0,
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
    <div className="p-4 md:p-8 space-y-6 max-w-[1700px] mx-auto">
      {/* Top Switcher Tabs */}
      <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs">
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

      {/* Top Banner & Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-100 text-sky-800">
              Operação Comercial Ativa
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-amber-600" />
              <span>Barcelona & Área Metropolitana</span>
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            CRM & Funil de Vendas (Novos Leads)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestão ativa de contactos diários, orçamentos na mesa e conversão direta em obra.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowNewLeadModal(true)}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Registar Novo Lead</span>
          </button>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'kanban' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Quadro Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'list' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Lista / Tabela</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Triage Metrics with Monetary Values */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="prime-card p-3.5 border-l-4 border-l-blue-500">
          <span className="text-[11px] text-slate-500 font-semibold block">1º Contacto (Meninas)</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-blue-600">{uncontactedCount}</span>
            <span className="text-[10px] text-slate-400">por falar</span>
          </div>
        </div>

        <div className="prime-card p-3.5 border-l-4 border-l-sky-500">
          <span className="text-[11px] text-slate-500 font-semibold block">Em Conversa Ativa</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-sky-600">{inProgressCount}</span>
            <span className="text-[10px] text-slate-400">em negociação</span>
          </div>
        </div>

        <div className="prime-card p-3.5 border-l-4 border-l-amber-500 bg-amber-50/20">
          <span className="text-[11px] text-amber-900 font-bold block flex items-center gap-1">
            <span>💰 Dinheiro na Mesa</span>
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-black text-amber-700">€ {quotedValueTotal.toLocaleString('pt-PT')}</span>
          </div>
          <span className="text-[10px] text-amber-800 font-medium block mt-0.5">
            {quotedLeads.length} orçamentos ativos
          </span>
        </div>

        <div className="prime-card p-3.5 border-l-4 border-l-emerald-500 bg-emerald-50/20">
          <span className="text-[11px] text-emerald-900 font-bold block flex items-center gap-1">
            <span>🏆 Total Vendido</span>
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-black text-emerald-600">€ {wonValueTotal.toLocaleString('pt-PT')}</span>
          </div>
          <span className="text-[10px] text-emerald-700 font-medium block mt-0.5">
            {wonCount} obras fechadas
          </span>
        </div>

        <div className="prime-card p-3.5 border-l-4 border-l-rose-400">
          <span className="text-[11px] text-slate-500 font-semibold block">Perdidos / Não Atende</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-rose-500">{lostCount}</span>
            <span className="text-[10px] text-slate-400">desqualificados</span>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar contacto, telefone ou interesse (ex: ducha, termo, ar)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                title="Limpar pesquisa"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <span className="text-xs text-slate-400 font-medium">
            A mostrar <strong>{filteredLeads.length}</strong> de {newLeads.length} novos leads
          </span>
        </div>

        {/* Quick Filter Buttons by Interest Theme */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3 text-slate-400" />
            Filtrar Tema:
          </span>

          <button
            onClick={() => setSelectedInterestFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedInterestFilter === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>Todos</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedInterestFilter === 'all' ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-600'}`}>
              {interestCounts.all}
            </span>
          </button>

          <button
            onClick={() => setSelectedInterestFilter(selectedInterestFilter === 'ducha' ? 'all' : 'ducha')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedInterestFilter === 'ducha'
                ? 'bg-cyan-600 text-white shadow-2xs'
                : 'bg-cyan-50 text-cyan-800 border border-cyan-200 hover:bg-cyan-100'
            }`}
          >
            <span>🚿 Platos de Ducha</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedInterestFilter === 'ducha' ? 'bg-cyan-700 text-white' : 'bg-cyan-100 text-cyan-800'}`}>
              {interestCounts.ducha}
            </span>
          </button>

          <button
            onClick={() => setSelectedInterestFilter(selectedInterestFilter === 'termo' ? 'all' : 'termo')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedInterestFilter === 'termo'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <span>⚡ Termoeléctricos</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedInterestFilter === 'termo' ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-900'}`}>
              {interestCounts.termo}
            </span>
          </button>

          <button
            onClick={() => setSelectedInterestFilter(selectedInterestFilter === 'aire' ? 'all' : 'aire')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedInterestFilter === 'aire'
                ? 'bg-sky-600 text-white shadow-2xs'
                : 'bg-sky-50 text-sky-900 border border-sky-200 hover:bg-sky-100'
            }`}
          >
            <span>❄️ Ar Condicionado</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedInterestFilter === 'aire' ? 'bg-sky-700 text-white' : 'bg-sky-100 text-sky-900'}`}>
              {interestCounts.aire}
            </span>
          </button>

          <button
            onClick={() => setSelectedInterestFilter(selectedInterestFilter === 'bano' ? 'all' : 'bano')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedInterestFilter === 'bano'
                ? 'bg-violet-600 text-white shadow-2xs'
                : 'bg-violet-50 text-violet-900 border border-violet-200 hover:bg-violet-100'
            }`}
          >
            <span>🛁 Banheiro</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedInterestFilter === 'bano' ? 'bg-violet-700 text-white' : 'bg-violet-100 text-violet-900'}`}>
              {interestCounts.bano}
            </span>
          </button>

          <button
            onClick={() => setSelectedInterestFilter(selectedInterestFilter === 'cocina' ? 'all' : 'cocina')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedInterestFilter === 'cocina'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <span>🍳 Cozinha</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedInterestFilter === 'cocina' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-900'}`}>
              {interestCounts.cocina}
            </span>
          </button>

          <button
            onClick={() => setSelectedInterestFilter(selectedInterestFilter === 'integral' ? 'all' : 'integral')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedInterestFilter === 'integral'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-indigo-50 text-indigo-900 border border-indigo-200 hover:bg-indigo-100'
            }`}
          >
            <span>🏠 Reformas</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedInterestFilter === 'integral' ? 'bg-indigo-700 text-white' : 'bg-indigo-100 text-indigo-900'}`}>
              {interestCounts.integral}
            </span>
          </button>
        </div>
      </div>

      {/* KANBAN VIEW */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-6 select-none min-h-[650px]">
          {columns.map((col, colIdx) => {
            const colLeads = filteredLeads.filter(l => l.status === col.id);
            const colTotalValue = colLeads.reduce((acc, l) => acc + (l.finalValue || l.estimatedValue || 0), 0);

            return (
              <div
                key={col.id}
                onDragOver={handleDragOver}
                onDrop={e => handleDrop(e, col.id)}
                className="w-80 shrink-0 flex flex-col bg-slate-50/80 rounded-2xl border border-slate-200/90 overflow-hidden"
              >
                {/* Column Header */}
                <div className={`p-3.5 border-b border-slate-200/80 ${col.headerBg} flex items-center justify-between`}>
                  <div className="flex flex-col">
                    <span className="font-bold text-xs">{col.title}</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[10px] font-mono font-bold ${colTotalValue > 0 ? 'text-emerald-700 bg-emerald-100/90 px-1.5 py-0.2 rounded shadow-2xs' : 'text-slate-400'}`}>
                        € {colTotalValue.toLocaleString('pt-PT')}
                      </span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${col.badgeColor}`}>
                    {colLeads.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[750px]">
                  {colLeads.map(lead => {
                    const hasPrev = colIdx > 0;
                    const hasNext = colIdx < columns.length - 1;

                    return (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={() => handleDragStart(lead.id)}
                        className="prime-card p-3.5 space-y-2.5 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group relative border-l-3 border-l-sky-500 bg-white"
                      >
                        {/* Top ID, Date & Delete button */}
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              {lead.id}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {lead.dateAdded}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => deleteLead(lead.id)}
                              className="text-slate-300 hover:text-rose-500 p-0.5"
                              title="Excluir Lead"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* TIPO DE INTERESSE (BADGE PROEMINENTE COM ÍCONE E COR) */}
                        {(() => {
                          const badge = getInterestBadge(lead.service);
                          return (
                            <div className="flex items-center justify-between gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black border shadow-2xs ${badge.bgClass} ${badge.textClass} ${badge.borderClass}`}>
                                <span className="text-sm">{badge.icon}</span>
                                <span className="truncate max-w-[150px]">{badge.label}</span>
                              </span>

                              <select
                                value={lead.service || ''}
                                onChange={e => updateLead(lead.id, { service: e.target.value })}
                                className="text-[10px] font-medium text-slate-400 bg-transparent hover:bg-slate-200 p-0.5 rounded border border-transparent hover:border-slate-300 cursor-pointer"
                                title="Trocar interesse deste lead"
                              >
                                <option value="" disabled>Trocar tema...</option>
                                {STANDARD_INTERESTS.map((opt, i) => (
                                  <option key={i} value={opt}>{opt}</option>
                                ))}
                              </select>
                            </div>
                          );
                        })()}

                        {/* Lead Name */}
                        <h4 
                          onClick={() => setSelectedLeadId(lead.id)}
                          className="font-bold text-slate-900 text-sm hover:text-sky-600 transition-colors cursor-pointer leading-tight"
                        >
                          {lead.name}
                        </h4>

                        {/* Phone Number - PROMINENT AT TOP */}
                        {lead.phone && lead.phone !== 'Sem Telefone' ? (
                          <div className="flex items-center justify-between bg-sky-50/70 p-2 rounded-xl border border-sky-100">
                            <div className="flex items-center gap-1.5 font-mono font-bold text-xs text-sky-950">
                              <Phone className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                              <span>{lead.phone}</span>
                            </div>

                            <a
                              href={`https://wa.me/${lead.phone.replace(/[^\d]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                              title="WhatsApp Imediato"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Sem contacto telefónico</span>
                        )}

                        {/* VALOR DO ORÇAMENTO / ESTIMADO (EDITÁVEL DIRETO NO CARD) */}
                        <div className="flex items-center justify-between bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200/80 text-xs">
                          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                            <Euro className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Orçamento:</span>
                          </span>

                          <div className="flex items-center gap-1 font-bold">
                            <span className="text-xs text-slate-400">€</span>
                            <input
                              type="number"
                              placeholder="0 (A orçar)"
                              value={(lead.finalValue || lead.estimatedValue) || ''}
                              onChange={e => {
                                const num = parseFloat(e.target.value) || 0;
                                updateLead(lead.id, { estimatedValue: num, finalValue: num });
                              }}
                              className="w-24 px-2 py-0.5 text-xs font-black text-right text-emerald-950 bg-white rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                              title="Digite o valor deste orçamento"
                            />
                          </div>
                        </div>

                        {/* DOSSIÊ & OBSERVAÇÕES DO CLIENTE (HISTÓRICO DA LIGAÇÃO) */}
                        {lead.notes ? (
                          <div 
                            onClick={() => setSelectedLeadId(lead.id)}
                            className="p-2 bg-amber-50/70 hover:bg-amber-100/70 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 cursor-pointer transition-colors space-y-0.5"
                            title="Clique para ver ou adicionar notas completas deste cliente"
                          >
                            <div className="flex items-center justify-between text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                              <span className="flex items-center gap-1">
                                <MessageSquare className="w-3 h-3 text-amber-600" />
                                <span>Notas / Dossiê:</span>
                              </span>
                              <span className="text-[9px] text-amber-600 font-semibold hover:underline">Ver tudo ↗</span>
                            </div>
                            <p className="line-clamp-2 italic font-medium text-slate-800">{lead.notes}</p>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedLeadId(lead.id)}
                            className="w-full py-1.5 text-[10px] font-bold text-slate-400 hover:text-amber-800 hover:bg-amber-50/60 rounded-lg border border-dashed border-slate-200 flex items-center justify-center gap-1 transition-colors"
                            title="Clique para adicionar notas sobre o cliente e ligação"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Anotar sobre o cliente / ligação</span>
                          </button>
                        )}

                        {/* City & Source Badge */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 pt-0.5">
                          <span className="flex items-center gap-1 text-slate-600 font-medium">
                            <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                            <span>{lead.city || 'Barcelona'}</span>
                          </span>

                          <span className="text-[10px] font-medium text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded truncate max-w-[130px]">
                            {lead.source}
                          </span>
                        </div>

                        {/* 1-CLICK STEP ADVANCEMENT BUTTONS (◀ VOLTAR | AVANÇAR ▶) */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs gap-1.5">
                          {hasPrev ? (
                            <button
                              type="button"
                              onClick={() => handleMoveStep(lead, 'prev')}
                              className="p-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                              title={`Mover para: ${columns[colIdx - 1]?.title}`}
                            >
                              <ChevronLeft className="w-3 h-3" />
                              <span>Voltar</span>
                            </button>
                          ) : <div />}

                          {lead.status !== 'vendido' ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => checkAndOpenConversionModal(lead)}
                                className="px-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-xs"
                                title="Converter em Obra Oficial"
                              >
                                <Building2 className="w-3 h-3" />
                                <span>Virou Obra</span>
                              </button>

                              {hasNext && (
                                <button
                                  type="button"
                                  onClick={() => handleMoveStep(lead, 'next')}
                                  className="p-1.5 px-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors shadow-2xs"
                                  title={`Avançar para: ${columns[colIdx + 1]?.title}`}
                                >
                                  <span>Avançar</span>
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md flex items-center gap-1">
                              <CheckCheck className="w-3 h-3" />
                              <span>Vendido</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {colLeads.length === 0 && (
                    <div className="h-28 border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-[11px] text-slate-400">
                      Sem leads nesta etapa
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TABLE / LIST VIEW */}
      {viewMode === 'list' && (
        <div className="prime-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="p-3">ID / Data</th>
                  <th className="p-3">Nome</th>
                  <th className="p-3">Telemóvel (WhatsApp)</th>
                  <th className="p-3">Cidade</th>
                  <th className="p-3">Tema / Interesse</th>
                  <th className="p-3">Origem</th>
                  <th className="p-3">Status Atual</th>
                  <th className="p-3 text-right">Valor Orçado</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map(lead => {
                  const badge = getInterestBadge(lead.service);
                  return (
                    <tr key={lead.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-slate-400 text-[11px]">
                        <span className="font-bold text-slate-700 block">{lead.id}</span>
                        <span>{lead.dateAdded}</span>
                      </td>
                      <td className="p-3 font-bold text-slate-900">
                        <span 
                          onClick={() => setSelectedLeadId(lead.id)}
                          className="hover:text-sky-600 cursor-pointer"
                        >
                          {lead.name}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-sky-900">
                        <div className="flex items-center gap-2">
                          <span>{lead.phone}</span>
                          {lead.phone && (
                            <a
                              href={`https://wa.me/${lead.phone.replace(/[^\d]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded"
                              title="WhatsApp"
                            >
                              <MessageSquare className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-slate-600">{lead.city || 'Barcelona'}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold border ${badge.bgClass} ${badge.textClass} ${badge.borderClass}`}>
                          <span>{badge.icon}</span>
                          <span>{lead.service}</span>
                        </span>
                      </td>
                      <td className="p-3 text-slate-500">{lead.source}</td>
                      <td className="p-3">
                        <select
                          value={lead.status}
                          onChange={e => {
                            const newSt = e.target.value as LeadStatus;
                            if (newSt === 'vendido') {
                              checkAndOpenConversionModal(lead);
                            } else {
                              moveLeadStatus(lead.id, newSt);
                            }
                          }}
                          className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                        >
                          {columns.map(c => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3 text-right font-black text-slate-900 font-mono">
                        €{(lead.finalValue || lead.estimatedValue || 0).toLocaleString('pt-PT')}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedLeadId(lead.id)}
                          className="px-2.5 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg font-bold text-xs"
                        >
                          Ver Ficha
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
                  placeholder="Ex: Carlos Santana"
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
                    placeholder="+34 612 345 678"
                    value={newLeadForm.phone}
                    onChange={e => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cidade / Região</label>
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
                  <label className="block font-semibold text-slate-700 mb-1">Interesse / Tema</label>
                  <select
                    value={newLeadForm.service}
                    onChange={e => setNewLeadForm({ ...newLeadForm, service: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  >
                    {STANDARD_INTERESTS.map((opt, i) => (
                      <option key={i} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Valor do Orçamento (€)</label>
                  <input
                    type="number"
                    placeholder="0 (A orçar)"
                    value={newLeadForm.estimatedValue || ''}
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
                    <option value="Meta Ads">Meta Ads (Facebook/Instagram)</option>
                    <option value="Google">Google / Site</option>
                    <option value="Indicação">Indicação / Recomendação</option>
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
                <label className="block font-semibold text-slate-700 mb-1">Notas / Dossiê Inicial</label>
                <textarea
                  rows={3}
                  placeholder="Detalhes sobre a conversa inicial, família, necessidades..."
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

      {/* CONVERSION TO PROJECT MODAL */}
      {leadToConvert && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in duration-200">
            <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-200" />
                <h3 className="font-bold text-sm tracking-wide">
                  Vitória Comercial! Converter Lead em Obra Oficial
                </h3>
              </div>
              <button 
                onClick={() => {
                  setLeadToConvert(null);
                  setMatchingExistingProject(null);
                }} 
                className="text-emerald-100 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800 text-sm">{leadToConvert.name}</span>
                  <span className="font-mono text-[11px] text-slate-500">{leadToConvert.phone}</span>
                </div>
                <div className="text-slate-600 flex items-center gap-2">
                  <span>📍 {leadToConvert.city || 'Barcelona'}</span>
                  <span>•</span>
                  <span>🛠️ {leadToConvert.service}</span>
                </div>
              </div>

              {matchingExistingProject && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-amber-900">
                  <div className="flex items-center gap-2 font-bold text-xs text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Possível Obra ou Cliente Já Existente Encontrado!</span>
                  </div>
                  <p className="text-[11px]">
                    Encontrámos a obra <strong>{matchingExistingProject.id} ({matchingExistingProject.title})</strong>. Pode associar este lead a ela sem duplicar registos.
                  </p>
                  <button
                    onClick={() => handleLinkToExistingProject(matchingExistingProject.id)}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs"
                  >
                    Associar à Obra Existente ({matchingExistingProject.id})
                  </button>
                </div>
              )}

              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-slate-800 text-xs">Configuração da Nova Obra:</h4>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status da Obra:</label>
                  <select
                    value={convertStatus}
                    onChange={e => setConvertStatus(e.target.value as ProjectStatus)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs"
                  >
                    <option value="em_execucao">⚡ Em Execução Atualmente (Obra Ativa)</option>
                    <option value="concluida">✅ Já foi Entregue e Paga (Histórico Concluído)</option>
                    <option value="agendada">📅 Agendada para Iniciar em Breve</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Título do Serviço / Obra:</label>
                    <input
                      type="text"
                      value={convertService}
                      onChange={e => setConvertService(e.target.value)}
                      placeholder="Ex: Instalação de Ducha / AC"
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Valor Real Fechado (€):</label>
                    <input
                      type="number"
                      value={convertContractValue}
                      onChange={e => setConvertContractValue(Number(e.target.value))}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-black text-emerald-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Notas e Observações da Obra:</label>
                  <textarea
                    rows={2}
                    value={convertNotes}
                    onChange={e => setConvertNotes(e.target.value)}
                    placeholder="Detalhes ou condições combinadas com o cliente..."
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLeadToConvert(null);
                    setMatchingExistingProject(null);
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmConvertNewProject}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Confirmar e Criar Obra Oficial</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
