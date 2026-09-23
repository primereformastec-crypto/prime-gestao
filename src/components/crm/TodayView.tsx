import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Lead } from '../../types';
import { LeadDetailModal } from './LeadDetailModal';
import { 
  CheckCircle2, Clock, AlertTriangle, Calendar, Phone, 
  MapPin, DollarSign, MessageSquare, ChevronRight, User, 
  Sparkles, Check, AlertCircle 
} from 'lucide-react';

export const TodayView: React.FC = () => {
  const { leads, setSelectedLeadId, selectedLeadId, currentUser } = useApp();

  const todayStr = '2026-09-22'; // Current simulation date

  // Filter tasks
  // 1. Unattended new leads (< 24h)
  const unattendedLeads = leads.filter(l => l.status === 'novo_lead' || l.status === 'tentativa_contacto');

  // 2. Follow-ups of today
  const todayFollowUps = leads.filter(l => l.nextFollowUpDate === todayStr && l.status !== 'vendido' && l.status !== 'perdido');

  // 3. Overdue follow-ups
  const overdueFollowUps = leads.filter(l => l.nextFollowUpDate && l.nextFollowUpDate < todayStr && l.status !== 'vendido' && l.status !== 'perdido');

  // 4. Visits today
  const visitsToday = leads.filter(l => l.visitDate && l.visitDate.startsWith(todayStr));

  // 5. Quotes pending answer (> 3 days)
  const pendingQuotes = leads.filter(l => l.status === 'orcamento_enviado');

  // 6. Active negotiations
  const activeNegotiations = leads.filter(l => l.status === 'negociacao');

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white p-6 rounded-2xl shadow-lg border border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
              Rotina Diária Comercial
            </span>
            <span className="text-xs text-slate-400">Terça-feira, 22 de Setembro de 2026</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">O que precisa ser feito hoje?</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Regra PRIME: Nenhum lead ativo pode ficar sem próximo contacto agendado. Mantenha o pipeline quente para garantir conversões.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Ações Prioritárias</span>
            <span className="text-2xl font-black text-amber-400">
              {unattendedLeads.length + todayFollowUps.length + overdueFollowUps.length}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="prime-card p-3.5 border-l-4 border-l-rose-500">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Atrasados</span>
          <p className="text-xl font-bold text-rose-600 mt-1">{overdueFollowUps.length}</p>
          <span className="text-[10px] text-rose-600 font-semibold">Ação imediata</span>
        </div>

        <div className="prime-card p-3.5 border-l-4 border-l-amber-500">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Follow-ups Hoje</span>
          <p className="text-xl font-bold text-amber-600 mt-1">{todayFollowUps.length}</p>
          <span className="text-[10px] text-amber-700 font-medium">Agendados para hoje</span>
        </div>

        <div className="prime-card p-3.5 border-l-4 border-l-sky-500">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Novos Leads</span>
          <p className="text-xl font-bold text-sky-600 mt-1">{unattendedLeads.length}</p>
          <span className="text-[10px] text-sky-600 font-medium">&lt; 24h sem contacto</span>
        </div>

        <div className="prime-card p-3.5 border-l-4 border-l-purple-500">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Visitas Técnicas</span>
          <p className="text-xl font-bold text-purple-600 mt-1">{visitsToday.length}</p>
          <span className="text-[10px] text-purple-600 font-medium">No local</span>
        </div>

        <div className="prime-card p-3.5 border-l-4 border-l-cyan-500">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Orçamentos</span>
          <p className="text-xl font-bold text-cyan-600 mt-1">{pendingQuotes.length}</p>
          <span className="text-[10px] text-cyan-700 font-medium">Aguardam resposta</span>
        </div>

        <div className="prime-card p-3.5 border-l-4 border-l-emerald-500">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Negociações</span>
          <p className="text-xl font-bold text-emerald-600 mt-1">{activeNegotiations.length}</p>
          <span className="text-[10px] text-emerald-700 font-medium">Quentes para fecho</span>
        </div>
      </div>

      {/* Grid of Action Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. ATENÇÃO MÁXIMA: FOLLOW-UPS ATRASADOS */}
        <div className="prime-card p-5 border-rose-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
              <h3 className="text-sm font-bold text-slate-900">Follow-ups Atrasados (Vermelho)</h3>
            </div>
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              {overdueFollowUps.length} pendências
            </span>
          </div>

          {overdueFollowUps.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">
              Nenhum follow-up atrasado! Todos os contactos estão em dia.
            </div>
          ) : (
            <div className="space-y-2.5">
              {overdueFollowUps.map(lead => (
                <div
                  key={lead.id}
                  onClick={() => setSelectedLeadId(lead.id)}
                  className="p-3 bg-rose-50/50 hover:bg-rose-50 rounded-xl border border-rose-100 flex items-center justify-between cursor-pointer group transition-all"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded">
                        {lead.id}
                      </span>
                      <span className="text-xs font-bold text-slate-900 group-hover:text-rose-700">{lead.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{lead.service} • {lead.phone}</p>
                    <p className="text-[10px] text-rose-700 font-semibold mt-1">
                      Data prevista: {lead.nextFollowUpDate} ({lead.nextAction || 'Contactar cliente'})
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. HOJE: FOLLOW-UPS PROGRAMADOS */}
        <div className="prime-card p-5 border-amber-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <h3 className="text-sm font-bold text-slate-900">Follow-ups Agendados para Hoje (Amarelo)</h3>
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              {todayFollowUps.length} hoje
            </span>
          </div>

          {todayFollowUps.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">
              Nenhum follow-up específico marcado para hoje.
            </div>
          ) : (
            <div className="space-y-2.5">
              {todayFollowUps.map(lead => (
                <div
                  key={lead.id}
                  onClick={() => setSelectedLeadId(lead.id)}
                  className="p-3 bg-amber-50/40 hover:bg-amber-50 rounded-xl border border-amber-100 flex items-center justify-between cursor-pointer group transition-all"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                        {lead.id}
                      </span>
                      <span className="text-xs font-bold text-slate-900 group-hover:text-amber-800">{lead.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{lead.service} • Tel: {lead.phone}</p>
                    <p className="text-[10px] text-amber-800 font-semibold mt-1">
                      Ação: {lead.nextAction || 'Fazer chamada de acompanhamento'}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. NOVOS LEADS NÃO ATENDIDOS */}
        <div className="prime-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-sky-500" />
              <h3 className="text-sm font-bold text-slate-900">Novos Leads Recebidos (&lt; 24h)</h3>
            </div>
            <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
              {unattendedLeads.length} novos
            </span>
          </div>

          <div className="space-y-2.5">
            {unattendedLeads.map(lead => (
              <div
                key={lead.id}
                onClick={() => setSelectedLeadId(lead.id)}
                className="p-3 bg-slate-50/70 hover:bg-sky-50/70 rounded-xl border border-slate-200/80 flex items-center justify-between cursor-pointer group transition-all"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-sky-700 bg-sky-100 px-1.5 py-0.2 rounded">
                      {lead.id}
                    </span>
                    <span className="text-xs font-bold text-slate-900 group-hover:text-sky-700">{lead.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-semibold">
                      {lead.source}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{lead.city} • {lead.service}</p>
                </div>
                <button className="px-2.5 py-1 text-[11px] font-bold bg-sky-600 text-white rounded-md hover:bg-sky-700 shrink-0">
                  Contactar
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 4. NEGOCIAÇÕES EM FECHO & ORÇAMENTOS */}
        <div className="prime-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <h3 className="text-sm font-bold text-slate-900">Negociações Abertas & Propostas</h3>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Fechamento Iminente
            </span>
          </div>

          <div className="space-y-2.5">
            {[...activeNegotiations, ...pendingQuotes].map(lead => (
              <div
                key={lead.id}
                onClick={() => setSelectedLeadId(lead.id)}
                className="p-3 bg-emerald-50/30 hover:bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between cursor-pointer group transition-all"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                      {lead.id}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{lead.name}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{lead.service} • Resp: {lead.salesRep}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-emerald-600 block">
                    €{(lead.finalValue || lead.estimatedValue).toLocaleString('pt-PT')}
                  </span>
                  <span className="text-[10px] text-slate-400 capitalize">{lead.status.replace('_', ' ')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedLeadId && (
        <LeadDetailModal
          leadId={selectedLeadId}
          onClose={() => setSelectedLeadId(null)}
        />
      )}
    </div>
  );
};
