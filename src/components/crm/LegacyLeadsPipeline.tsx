import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Lead, LeadStatus, Project, ProjectStatus } from '../../types';
import { LeadDetailModal } from './LeadDetailModal';
import { MetaLeadImporter } from '../importer/MetaLeadImporter';
import { detectLeadInterest, getInterestBadge, STANDARD_INTERESTS } from '../../utils/interestDetector';
import { 
  Plus, Search, Phone, MapPin, Calendar, Clock, 
  Euro, User, AlertCircle, CheckCircle2, 
  Filter, Sparkles, ArrowRight, LayoutGrid, List,
  UploadCloud, MessageSquare, Trash2, Building2,
  Check, X, ShieldAlert, AlertTriangle, ChevronRight, ChevronLeft,
  Wrench, CheckCheck
} from 'lucide-react';

export const LegacyLeadsPipeline: React.FC = () => {
  const { 
    leads, 
    projects, 
    clients, 
    moveLeadStatus, 
    updateLead, 
    deleteLead, 
    convertLeadToProjectAndClient, 
    selectedLeadId, 
    setSelectedLeadId,
    setActiveTab,
    setSelectedProjectId
  } = useApp();

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState('all');
  const [selectedInterestFilter, setSelectedInterestFilter] = useState<string>('all');
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [showImporter, setShowImporter] = useState(false);

  // Conversion / Duplicate Prevention Modal State
  const [leadToConvert, setLeadToConvert] = useState<Lead | null>(null);
  const [matchingExistingProject, setMatchingExistingProject] = useState<Project | null>(null);
  const [convertStatus, setConvertStatus] = useState<ProjectStatus>('concluida');
  const [convertService, setConvertService] = useState('');
  const [convertContractValue, setConvertContractValue] = useState<number>(0);
  const [convertNotes, setConvertNotes] = useState('');

  // Auto-correction for leads with default 'Lisboa', fake '18000', or generic/incorrect service
  useEffect(() => {
    leads.forEach(l => {
      if (l.isLegacy || l.source === 'Meta Ads') {
        const updates: Partial<Lead> = {};
        if (l.city && (l.city.includes('Lisboa') || l.city.includes('Vale do Tejo'))) {
          updates.city = 'Barcelona';
        }
        if (l.estimatedValue === 18000) {
          updates.estimatedValue = 0;
        }

        const isGenericOrOld = !l.service || 
          l.service.includes('Remodelação') || 
          l.service.includes('Reforma Geral') || 
          l.service.toLowerCase().includes('reformulação') ||
          l.service === 'Reforma';

        if (isGenericOrOld) {
          const detected = detectLeadInterest({
            rawMetaFields: l.rawMetaFields,
            campaignName: l.campaignName,
            adName: l.adName,
            notes: l.notes,
            currentService: l.service
          });
          if (detected && detected !== l.service) {
            updates.service = detected;
          }
        }

        if (Object.keys(updates).length > 0) {
          updateLead(l.id, updates);
        }
      }
    });
  }, [leads.length]);

  // 10 commercial columns customized for historical Meta Ads triage
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

  // Only historical Meta Ads leads
  const legacyLeads = leads.filter(l => l.isLegacy || l.source === 'Meta Ads');

  // List of campaigns for filtering
  const campaigns = Array.from(new Set(legacyLeads.map(l => l.campaignName || 'Meta Ads Geral')));

  // Filtered leads
  const filteredLeads = legacyLeads.filter(l => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      l.name.toLowerCase().includes(q) ||
      l.phone.includes(q) ||
      (l.service && l.service.toLowerCase().includes(q)) ||
      (l.city && l.city.toLowerCase().includes(q)) ||
      (l.campaignName && l.campaignName.toLowerCase().includes(q)) ||
      (l.adName && l.adName.toLowerCase().includes(q)) ||
      (l.notes && l.notes.toLowerCase().includes(q)) ||
      l.id.toLowerCase().includes(q)
    );

    const matchesCampaign = selectedCampaign === 'all' || (l.campaignName || 'Meta Ads Geral') === selectedCampaign;

    let matchesInterest = true;
    if (selectedInterestFilter !== 'all') {
      const badge = getInterestBadge(l.service);
      matchesInterest = badge.category === selectedInterestFilter;
    }

    return matchesSearch && matchesCampaign && matchesInterest;
  });

  const interestCounts = {
    all: legacyLeads.length,
    ducha: legacyLeads.filter(l => getInterestBadge(l.service).category === 'ducha').length,
    termo: legacyLeads.filter(l => getInterestBadge(l.service).category === 'termo').length,
    aire: legacyLeads.filter(l => getInterestBadge(l.service).category === 'aire').length,
    bano: legacyLeads.filter(l => getInterestBadge(l.service).category === 'bano').length,
    cocina: legacyLeads.filter(l => getInterestBadge(l.service).category === 'cocina').length,
    integral: legacyLeads.filter(l => getInterestBadge(l.service).category === 'integral').length,
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
    setConvertContractValue(lead.estimatedValue || 0);
    setConvertStatus('concluida'); // Default to completed historical work as requested
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
    if (confirm(`✓ Sucesso! Obra ${project.id} (${project.status === 'concluida' ? 'Concluída/Histórico' : 'Em Execução'}) criada. Deseja abrir a página da obra agora?`)) {
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

  const uncontactedCount = legacyLeads.filter(l => l.status === 'novo_lead').length;
  const inProgressCount = legacyLeads.filter(l => l.status !== 'novo_lead' && l.status !== 'vendido' && l.status !== 'perdido').length;
  const wonCount = legacyLeads.filter(l => l.status === 'vendido').length;
  const lostCount = legacyLeads.filter(l => l.status === 'perdido').length;

  const quotedLeads = legacyLeads.filter(l => l.status === 'orcamento_enviado' || l.status === 'negociacao');
  const quotedValueTotal = quotedLeads.reduce((acc, l) => acc + (l.finalValue || l.estimatedValue || 0), 0);
  const wonValueTotal = legacyLeads.filter(l => l.status === 'vendido').reduce((acc, l) => acc + (l.finalValue || l.estimatedValue || 0), 0);
  const totalPipelineValue = legacyLeads.filter(l => l.status !== 'perdido').reduce((acc, l) => acc + (l.finalValue || l.estimatedValue || 0), 0);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1700px] mx-auto">
      {/* Top Banner / Navigation */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800">
              Histórico Meta Ads
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-amber-600" />
              <span>Barcelona & Área Metropolitana</span>
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Pipeline de Leads Antigos (Triagem Alexandre)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Triagem rápida com botões de avanço ◀ ▶ nos cards. Quem não for contactado fica na 1ª coluna para primeiro contacto.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowImporter(!showImporter)}
            className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-2xs"
          >
            <UploadCloud className="w-4 h-4 text-blue-600" />
            <span>{showImporter ? 'Fechar Importador' : 'Carregar os 11 Excels'}</span>
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

      {/* Embedded Importer View if toggled */}
      {showImporter && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <MetaLeadImporter onComplete={() => setShowImporter(false)} />
        </div>
      )}

      {/* KPI Triage Metrics with Monetary Values */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="prime-card p-3.5 border-l-4 border-l-blue-500">
          <span className="text-[11px] text-slate-500 font-semibold block">1º Contacto</span>
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
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20"
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

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {campaigns.length > 1 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 font-medium">Campanha:</span>
                <select
                  value={selectedCampaign}
                  onChange={e => setSelectedCampaign(e.target.value)}
                  className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
                >
                  <option value="all">Todas as Campanhas ({campaigns.length})</option>
                  {campaigns.map((c, i) => (
                    <option key={i} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}

            <span className="text-xs text-slate-400 font-medium">
              A mostrar <strong>{filteredLeads.length}</strong> de {legacyLeads.length} leads
            </span>
          </div>
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

      {/* Empty State when no legacy leads imported yet */}
      {legacyLeads.length === 0 && !showImporter && (
        <div className="p-12 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-center space-y-4">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
            <UploadCloud className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">Ainda não importou os 11 ficheiros do Meta Ads</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Carregue os ficheiros Excel de Barcelona para que o Alexandre possa triar os leads e a equipa realizar os contactos.
            </p>
          </div>
          <button
            onClick={() => setShowImporter(true)}
            className="prime-btn-primary px-6 py-2.5 text-xs font-bold inline-flex items-center gap-2 shadow-md"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Carregar os 11 Excels do Meta Agora</span>
          </button>
        </div>
      )}

      {/* KANBAN VIEW */}
      {viewMode === 'kanban' && legacyLeads.length > 0 && (
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
                        className="prime-card p-3.5 space-y-2.5 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group relative border-l-3 border-l-blue-500 bg-white"
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
                          className="font-bold text-slate-900 text-sm hover:text-blue-600 transition-colors cursor-pointer leading-tight"
                        >
                          {lead.name}
                        </h4>

                        {/* Phone Number - PROMINENT AT TOP */}
                        {lead.phone && lead.phone !== 'Sem Telefone' ? (
                          <div className="flex items-center justify-between bg-blue-50/70 p-2 rounded-xl border border-blue-100">
                            <div className="flex items-center gap-1.5 font-mono font-bold text-xs text-blue-950">
                              <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
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

                        {/* City & Campaign Badge */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 pt-0.5">
                          <span className="flex items-center gap-1 text-slate-600 font-medium">
                            <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                            <span>{lead.city || 'Barcelona'}</span>
                          </span>

                          {lead.campaignName && (
                            <span className="text-[10px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded truncate max-w-[130px]" title={lead.campaignName}>
                              🎯 {lead.campaignName}
                            </span>
                          )}
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
                                  className="p-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors shadow-2xs"
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
      {viewMode === 'list' && legacyLeads.length > 0 && (
        <div className="prime-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="p-3">ID / Data</th>
                  <th className="p-3">Nome</th>
                  <th className="p-3">Telemóvel (WhatsApp)</th>
                  <th className="p-3">Cidade</th>
                  <th className="p-3">Serviço / Reforma</th>
                  <th className="p-3">Campanha Meta</th>
                  <th className="p-3">Status Atual</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono text-slate-400 text-[11px]">
                      <span className="font-bold text-slate-700 block">{lead.id}</span>
                      <span>{lead.dateAdded}</span>
                    </td>
                    <td className="p-3 font-bold text-slate-900">
                      <span 
                        onClick={() => setSelectedLeadId(lead.id)}
                        className="hover:text-blue-600 cursor-pointer"
                      >
                        {lead.name}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-blue-900">
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
                      {(() => {
                        const badge = getInterestBadge(lead.service);
                        return (
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold border ${badge.bgClass} ${badge.textClass} ${badge.borderClass}`}>
                            <span>{badge.icon}</span>
                            <span>{lead.service}</span>
                          </span>
                        );
                      })()}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-semibold truncate max-w-[150px] block">
                        {lead.campaignName || 'Meta Ads'}
                      </span>
                    </td>
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
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => checkAndOpenConversionModal(lead)}
                          className="px-2 py-1 bg-emerald-600 text-white rounded text-[11px] font-bold"
                          title="Virou Obra"
                        >
                          Virou Obra
                        </button>
                        <button
                          onClick={() => deleteLead(lead.id)}
                          className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg text-xs"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Converter para Obra (Personalizável: Já Feita/Paga, Em Execução ou Agendada) */}
      {leadToConvert && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Converter Lead em Obra Oficial</h3>
                  <span className="text-[11px] text-slate-500">{leadToConvert.id} - {leadToConvert.name}</span>
                </div>
              </div>
              <button 
                onClick={() => {
                  setLeadToConvert(null);
                  setMatchingExistingProject(null);
                }} 
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Duplicate Project Alert if found! */}
              {matchingExistingProject ? (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-2 text-amber-900">
                  <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <span>Atenção: Possível Obra Já Registada!</span>
                  </div>
                  <p>
                    O sistema detetou que a sua equipa já pode ter lançado esta obra manualmente:
                  </p>
                  <div className="p-3 bg-white rounded-lg border border-amber-200 font-mono text-[11px] space-y-1">
                    <p className="font-bold text-slate-900">{matchingExistingProject.id} - {matchingExistingProject.title}</p>
                    <p className="text-slate-500">Morada: {matchingExistingProject.address} | Valor: €{matchingExistingProject.contractValue?.toLocaleString('pt-PT')}</p>
                  </div>
                  <p className="font-semibold text-xs text-amber-800 pt-1">
                    Para não duplicar obras, escolha uma das opções abaixo:
                  </p>
                </div>
              ) : null}

              {/* Form Options for Project Creation */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Estado Atual da Obra:
                  </label>
                  <select
                    value={convertStatus}
                    onChange={e => setConvertStatus(e.target.value as ProjectStatus)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900"
                  >
                    <option value="concluida">✅ Já foi Entregue e Paga (Histórico Concluído)</option>
                    <option value="em_execucao">⚡ Em Execução Atualmente (Obra Ativa)</option>
                    <option value="agendada">📅 Agendada para o Futuro</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tipo de Serviço / Título da Obra:
                  </label>
                  <input
                    type="text"
                    value={convertService}
                    onChange={e => setConvertService(e.target.value)}
                    placeholder="Ex: Instalação de Ar Condicionado, Reforma de Banheiro..."
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Valor Real do Contrato (€):
                    </label>
                    <input
                      type="number"
                      value={convertContractValue || ''}
                      onChange={e => setConvertContractValue(Number(e.target.value))}
                      placeholder="0 se não aplicável"
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Cidade / Local:
                    </label>
                    <input
                      type="text"
                      disabled
                      value={leadToConvert.city || 'Barcelona'}
                      className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Notas / Histórico Adicional:
                  </label>
                  <textarea
                    rows={2}
                    value={convertNotes}
                    onChange={e => setConvertNotes(e.target.value)}
                    placeholder="Observações do Alexandre sobre a venda ou execução..."
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-2.5">
                {matchingExistingProject && (
                  <button
                    type="button"
                    onClick={() => handleLinkToExistingProject(matchingExistingProject.id)}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Vincular à Obra Existente ({matchingExistingProject.id})</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setLeadToConvert(null);
                    setMatchingExistingProject(null);
                  }}
                  className="px-4 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleConfirmConvertNewProject}
                  className="prime-btn-primary px-5 py-2.5 font-bold flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Criar Obra Oficial ({convertStatus === 'concluida' ? 'Histórico' : 'Ativa'})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Lead Detail Modal */}
      {selectedLeadId && (
        <LeadDetailModal
          leadId={selectedLeadId}
          onClose={() => setSelectedLeadId(null)}
        />
      )}
    </div>
  );
};
