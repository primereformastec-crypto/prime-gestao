import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Lead, LeadStatus } from '../../types';
import { getInterestBadge, STANDARD_INTERESTS } from '../../utils/interestDetector';
import { 
  X, Phone, Mail, MapPin, Calendar, Clock, DollarSign, 
  Send, User, MessageSquare, AlertCircle, CheckCircle2, 
  Briefcase, Building2, Plus, Sparkles, ArrowRight 
} from 'lucide-react';

interface Props {
  leadId: string;
  onClose: () => void;
}

export const LeadDetailModal: React.FC<Props> = ({ leadId, onClose }) => {
  const { 
    leads, updateLead, moveLeadStatus, addLeadInteraction, 
    convertLeadToProjectAndClient, setSelectedProjectId, setActiveTab 
  } = useApp();

  const lead = leads.find(l => l.id === leadId);

  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<'nota' | 'chamada' | 'whatsapp' | 'visita' | 'orcamento'>('whatsapp');
  const [isConverting, setIsConverting] = useState(false);

  if (!lead) return null;

  const handleAddInteraction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    addLeadInteraction(lead.id, noteType, newNote.trim());
    setNewNote('');
  };

  const handleConvert = () => {
    setIsConverting(true);
    try {
      const { project } = convertLeadToProjectAndClient(lead.id);
      setIsConverting(false);
      onClose();
      setSelectedProjectId(project.id);
      setActiveTab('obras');
    } catch (err) {
      setIsConverting(false);
      console.error(err);
    }
  };

  const statuses: { id: LeadStatus; label: string }[] = [
    { id: 'novo_lead', label: 'Novo Lead' },
    { id: 'tentativa_contacto', label: 'Tentativa Contacto' },
    { id: 'contactado', label: 'Contactado' },
    { id: 'qualificado', label: 'Qualificado' },
    { id: 'visita_agendada', label: 'Visita Agendada' },
    { id: 'visita_realizada', label: 'Visita Realizada' },
    { id: 'orcamento_enviado', label: 'Orçamento Enviado' },
    { id: 'negociacao', label: 'Negociação' },
    { id: 'vendido', label: 'Vendido' },
    { id: 'perdido', label: 'Perdido' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold px-2.5 py-1 bg-sky-100 text-sky-800 rounded-md border border-sky-200">
              {lead.id}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{lead.name}</h2>
                {(() => {
                  const badge = getInterestBadge(lead.service);
                  return (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-black border ${badge.bgClass} ${badge.textClass} ${badge.borderClass}`}>
                      <span>{badge.icon}</span>
                      <span>{lead.service}</span>
                    </span>
                  );
                })()}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                <span>📍 {lead.city || 'Barcelona'}</span>
                <span>•</span>
                <span className="font-medium text-slate-400">Tema:</span>
                <select
                  value={lead.service || ''}
                  onChange={e => updateLead(lead.id, { service: e.target.value })}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-2 py-0.5 rounded border border-slate-200 cursor-pointer"
                  title="Alterar interesse"
                >
                  <option value="" disabled>Alterar tema...</option>
                  {STANDARD_INTERESTS.map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {lead.status === 'vendido' && lead.projectId ? (
              <button
                onClick={() => {
                  onClose();
                  setSelectedProjectId(lead.projectId!);
                  setActiveTab('obras');
                }}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
              >
                <Building2 className="w-4 h-4" />
                <span>Ver Obra ({lead.projectId})</span>
              </button>
            ) : (
              <button
                onClick={handleConvert}
                disabled={isConverting}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md active:scale-98"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>CRIAR CLIENTE & OBRA</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Col 1 & 2: Lead Information & Pipeline stage selector */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status bar */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Fase do Pipeline Comercial
              </label>
              <div className="flex flex-wrap gap-1.5">
                {statuses.map(s => {
                  const isCurrent = lead.status === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => moveLeadStatus(lead.id, s.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isCurrent 
                          ? (s.id === 'vendido' 
                              ? 'bg-emerald-600 text-white font-bold shadow-xs' 
                              : (s.id === 'perdido' ? 'bg-rose-600 text-white font-bold' : 'bg-sky-600 text-white font-bold shadow-xs'))
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Telefone / WhatsApp</span>
                <div className="flex items-center gap-2 font-medium text-slate-800">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <a href={`tel:${lead.phone}`} className="hover:underline">{lead.phone}</a>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Email</span>
                <div className="flex items-center gap-2 font-medium text-slate-800">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <a href={`mailto:${lead.email}`} className="hover:underline truncate">{lead.email}</a>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Localidade / Morada</span>
                <div className="flex items-center gap-2 font-medium text-slate-800">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{lead.city} {lead.address ? `• ${lead.address}` : ''}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Origem do Lead</span>
                <span className="inline-block font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[11px]">
                  {lead.source}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Comercial Responsável</span>
                <div className="flex items-center gap-2 font-medium text-slate-800">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{lead.salesRep}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Valor Estimado / Fechado</span>
                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>€{(lead.finalValue || lead.estimatedValue).toLocaleString('pt-PT')}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Data de Entrada</span>
                <span className="text-slate-700 font-medium">{lead.dateAdded}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Próximo Follow-up</span>
                <span className={`font-semibold ${lead.nextFollowUpDate && lead.nextFollowUpDate <= '2026-09-22' ? 'text-rose-600' : 'text-amber-600'}`}>
                  {lead.nextFollowUpDate || 'Sem agendamento'}
                </span>
              </div>
            </div>

            {/* Notes / Briefing */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Observações e Especificações da Reforma
              </label>
              <textarea
                value={lead.notes || ''}
                onChange={e => updateLead(lead.id, { notes: e.target.value })}
                rows={3}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500 text-slate-700 bg-white"
                placeholder="Detalhes solicitados pelo cliente..."
              />
            </div>

            {/* Add interaction form */}
            <form onSubmit={handleAddInteraction} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-800 block mb-2">Registar Nova Interação</span>
              
              <div className="flex gap-2 mb-2">
                {[
                  { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
                  { id: 'chamada', label: 'Chamada', icon: Phone },
                  { id: 'visita', label: 'Visita Técnica', icon: Calendar },
                  { id: 'orcamento', label: 'Envio Orçamento', icon: DollarSign },
                  { id: 'nota', label: 'Nota Interna', icon: Send },
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setNoteType(item.id as any)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition-all ${
                      noteType === item.id ? 'bg-sky-600 text-white font-bold' : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    <item.icon className="w-3 h-3" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: Liguei e cliente confirmou visita para quinta-feira às 15h..."
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 bg-white rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shrink-0"
                >
                  Registar
                </button>
              </div>
            </form>
          </div>

          {/* Col 3: Interaction Timeline */}
          <div className="border-l border-slate-200 pl-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-sky-600" />
              <span>Timeline de Atividades</span>
            </h3>

            <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-2">
              {lead.timeline.map((item, idx) => (
                <div key={item.id || idx} className="relative pl-5 before:absolute before:left-1.5 before:top-2 before:bottom-0 before:w-0.5 before:bg-slate-200 last:before:hidden">
                  <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-sky-500 ring-4 ring-white" />
                  <div className="text-[11px]">
                    <span className="font-semibold text-slate-500">{item.date}</span>
                    <p className="text-xs text-slate-800 font-medium mt-0.5">{item.description}</p>
                    <span className="text-[10px] text-slate-400">por {item.author}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
