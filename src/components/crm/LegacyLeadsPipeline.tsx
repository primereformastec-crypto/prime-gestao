import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Lead, LeadStatus, Project } from '../../types';
import { LeadDetailModal } from './LeadDetailModal';
import { MetaLeadImporter } from '../importer/MetaLeadImporter';
import { 
  Plus, Search, Phone, MapPin, Calendar, Clock, 
  Euro, User, AlertCircle, CheckCircle2, 
  Filter, Sparkles, ArrowRight, LayoutGrid, List,
  UploadCloud, MessageSquare, Trash2, Building2,
  Check, X, ShieldAlert, AlertTriangle
} from 'lucide-react';

export const LegacyLeadsPipeline: React.FC = () => {
  const { 
    leads, 
    projects, 
    clients, 
    moveLeadStatus, 
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
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [showImporter, setShowImporter] = useState(false);

  // Conversion / Duplicate Prevention Modal
  const [leadToConvert, setLeadToConvert] = useState<Lead | null>(null);
  const [matchingExistingProject, setMatchingExistingProject] = useState<Project | null>(null);

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
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      l.name.toLowerCase().includes(q) ||
      l.phone.includes(q) ||
      l.city.toLowerCase().includes(q) ||
      l.id.toLowerCase().includes(q) ||
      (l.campaignName && l.campaignName.toLowerCase().includes(q));

    const matchesCampaign = selectedCampaign === 'all' || (l.campaignName || 'Meta Ads Geral') === selectedCampaign;
    return matchesSearch && matchesCampaign;
  });

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
      // Trigger conversion with duplicate check
      const lead = leads.find(l => l.id === draggedLeadId);
      if (lead) {
        checkAndOpenConversionModal(lead);
      }
    } else {
      moveLeadStatus(draggedLeadId, status);
    }
    setDraggedLeadId(null);
  };

  const checkAndOpenConversionModal = (lead: Lead) => {
    // Check if an existing project or client already matches
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
  };

  const handleConfirmConvertNewProject = () => {
    if (!leadToConvert) return;
    const { project } = convertLeadToProjectAndClient(leadToConvert.id);
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

  const uncontactedCount = legacyLeads.filter(l => l.status === 'novo_lead').length;
  const inProgressCount = legacyLeads.filter(l => l.status !== 'novo_lead' && l.status !== 'vendido' && l.status !== 'perdido').length;
  const wonCount = legacyLeads.filter(l => l.status === 'vendido').length;
  const lostCount = legacyLeads.filter(l => l.status === 'perdido').length;

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1700px] mx-auto">
      {/* Top Banner / Navigation */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800">
              Histórico Meta Ads
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Pipeline de Leads Antigos (Triagem Alexandre)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Espaço de triagem dos 11 Excels do Meta. O Alexandre move os leads para a coluna certa; quem não for contactado fica sinalizado para as meninas ligarem.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowImporter(!showImporter)}
            className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all"
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

      {/* KPI Triage Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="prime-card p-4 border-l-4 border-l-blue-500">
          <span className="text-[11px] text-slate-500 font-semibold block">Por Contactar (Meninas)</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-blue-600">{uncontactedCount}</span>
            <span className="text-[10px] text-slate-400">leads na 1ª coluna</span>
          </div>
        </div>

        <div className="prime-card p-4 border-l-4 border-l-amber-500">
          <span className="text-[11px] text-slate-500 font-semibold block">Em Negociação / Visita</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-amber-600">{inProgressCount}</span>
            <span className="text-[10px] text-slate-400">conversas ativas</span>
          </div>
        </div>

        <div className="prime-card p-4 border-l-4 border-l-emerald-500">
          <span className="text-[11px] text-slate-500 font-semibold block">Vendidos (Viraram Obra)</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-600">{wonCount}</span>
            <span className="text-[10px] text-emerald-600 font-semibold">convertidos</span>
          </div>
        </div>

        <div className="prime-card p-4 border-l-4 border-l-rose-400">
          <span className="text-[11px] text-slate-500 font-semibold block">Perdidos / Não Atende</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-rose-500">{lostCount}</span>
            <span className="text-[10px] text-slate-400">desqualificados</span>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar por nome, telemóvel, cidade..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20"
          />
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

          <span className="text-xs text-slate-400">
            A mostrar <strong>{filteredLeads.length}</strong> de {legacyLeads.length} leads antigos
          </span>
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
              Carregue os ficheiros Excel para que o Alexandre possa triar os leads e as meninas realizarem os contactos.
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
          {columns.map(col => {
            const colLeads = filteredLeads.filter(l => l.status === col.id);

            return (
              <div
                key={col.id}
                onDragOver={handleDragOver}
                onDrop={e => handleDrop(e, col.id)}
                className="w-72 shrink-0 flex flex-col bg-slate-50/80 rounded-2xl border border-slate-200/90 overflow-hidden"
              >
                {/* Column Header */}
                <div className={`p-3.5 border-b border-slate-200/80 ${col.headerBg} flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs">{col.title}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${col.badgeColor}`}>
                    {colLeads.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[750px]">
                  {colLeads.map(lead => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={() => handleDragStart(lead.id)}
                      className="prime-card p-3.5 space-y-2.5 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group relative border-l-3 border-l-blue-500"
                    >
                      {/* Top info */}
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {lead.id}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => deleteLead(lead.id)}
                            className="text-slate-300 hover:text-rose-500 p-1"
                            title="Excluir Lead"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Lead Name */}
                      <h4 
                        onClick={() => setSelectedLeadId(lead.id)}
                        className="font-bold text-slate-900 text-xs hover:text-blue-600 transition-colors cursor-pointer"
                      >
                        {lead.name}
                      </h4>

                      {/* Service & City */}
                      <div className="text-[11px] text-slate-600 space-y-1">
                        <p className="font-medium text-slate-800 line-clamp-1">
                          🛠️ {lead.service}
                        </p>
                        <p className="flex items-center gap-1 text-slate-400">
                          <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                          <span className="truncate">{lead.city}</span>
                        </p>
                      </div>

                      {/* Campaign Tag */}
                      {lead.campaignName && (
                        <span className="text-[10px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md block truncate">
                          🎯 {lead.campaignName}
                        </span>
                      )}

                      {/* Quick Contact & Action Buttons */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          {lead.phone && lead.phone !== 'Sem Telefone' && (
                            <>
                              <a
                                href={`https://wa.me/${lead.phone.replace(/[^\d]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-[10px] font-bold flex items-center gap-1"
                                title="Abrir WhatsApp"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>WhatsApp</span>
                              </a>

                              <a
                                href={`tel:${lead.phone}`}
                                className="p-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-[10px] font-bold"
                                title="Ligar"
                              >
                                <Phone className="w-3 h-3" />
                              </a>
                            </>
                          )}
                        </div>

                        {lead.status !== 'vendido' && (
                          <button
                            onClick={() => checkAndOpenConversionModal(lead)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-xs"
                            title="Converter diretamente em Obra"
                          >
                            <Building2 className="w-3 h-3" />
                            <span>Vender</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {colLeads.length === 0 && (
                    <div className="h-32 border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-[11px] text-slate-400">
                      Arraste para aqui
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
                  <th className="p-3">Telemóvel</th>
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
                    <td className="p-3 font-mono text-slate-700">{lead.phone}</td>
                    <td className="p-3 text-slate-600">{lead.city}</td>
                    <td className="p-3 text-slate-700 font-medium">{lead.service}</td>
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
                        {lead.phone && (
                          <a
                            href={`https://wa.me/${lead.phone.replace(/[^\d]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs"
                            title="WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                        )}
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

      {/* MODAL: Converter para Obra & Detetor de Duplicados */}
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
              ) : (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <p className="font-bold text-slate-800">Detalhes do Lead a Converter:</p>
                  <p className="text-slate-600">Cliente: <strong>{leadToConvert.name}</strong></p>
                  <p className="text-slate-600">Telemóvel: <strong>{leadToConvert.phone}</strong></p>
                  <p className="text-slate-600">Serviço: <strong>{leadToConvert.service}</strong> ({leadToConvert.city})</p>
                  <p className="text-slate-600">Origem: <strong>{leadToConvert.campaignName || 'Meta Ads'}</strong></p>
                </div>
              )}

              <p className="text-slate-500">
                Ao criar uma nova obra, o sistema gera automaticamente o registo de Cliente, o código da Obra (`OB-XXXX`), as etapas padrão e os marcos de faturação.
              </p>

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
                  className="prime-btn-primary px-5 py-2.5 font-bold flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Criar Nova Obra Oficial</span>
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
