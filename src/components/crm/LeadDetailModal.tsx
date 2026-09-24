import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Lead, LeadStatus } from '../../types';
import { getInterestBadge, STANDARD_INTERESTS } from '../../utils/interestDetector';
import { formatCurrency, parseCurrencyInput, sanitizeCurrencyInput } from '../../utils/currency';
import { 
  X, Phone, Mail, MapPin, Calendar, Clock, DollarSign, 
  Send, User, MessageSquare, AlertCircle, CheckCircle2, 
  Briefcase, Building2, Plus, Sparkles, ArrowRight,
  Edit3, MessageCircle, Check
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

  // Valor de orçamento do lead como string para permitir digitação de 0 e decimais
  const [budgetString, setBudgetString] = useState<string>(() => {
    const val = lead?.finalValue ?? lead?.estimatedValue ?? 0;
    return String(val);
  });

  // Estado para edição rápida dos dados de contacto do Lead
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: lead?.name || '',
    phone: lead?.phone || '',
    email: lead?.email || '',
    city: lead?.city || 'Barcelona',
    address: lead?.address || '',
    salesRep: lead?.salesRep || 'Alexandre'
  });

  React.useEffect(() => {
    if (lead) {
      setContactForm({
        name: lead.name || '',
        phone: lead.phone || '',
        email: lead.email || '',
        city: lead.city || 'Barcelona',
        address: lead.address || '',
        salesRep: lead.salesRep || 'Alexandre'
      });
      const val = lead.finalValue ?? lead.estimatedValue ?? 0;
      setBudgetString(String(val));
    }
  }, [lead?.id]);

  const handleSaveContact = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!lead) return;
    updateLead(lead.id, {
      name: contactForm.name.trim() || lead.name,
      phone: contactForm.phone.trim(),
      email: contactForm.email.trim(),
      city: contactForm.city.trim() || 'Barcelona',
      address: contactForm.address.trim(),
      salesRep: contactForm.salesRep.trim()
    });
    setIsEditingContact(false);
  };

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
                <button
                  onClick={() => setIsEditingContact(!isEditingContact)}
                  className="ml-2 px-2.5 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-md text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                  title="Editar telefone, nome, morada..."
                >
                  <Edit3 className="w-3 h-3 text-amber-600" />
                  <span>{isEditingContact ? 'Fechar Edição' : 'Editar Contacto'}</span>
                </button>
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

            {/* Edit Contact Form Mode */}
            {isEditingContact && (
              <form onSubmit={handleSaveContact} className="p-4 bg-amber-50/70 rounded-xl border border-amber-300 space-y-3 text-xs mb-4 shadow-sm animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                    Editar Dados Cadastrais do Lead
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsEditingContact(false)}
                      className="px-2.5 py-1 text-slate-600 hover:bg-amber-100 rounded text-xs font-semibold cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Guardar</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-0.5">Nome do Lead *</label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="font-semibold text-slate-700">Telefone / WhatsApp *</label>
                      {contactForm.phone && contactForm.phone.replace(/[^0-9]/g, '').length >= 6 && (
                        <a
                          href={`https://wa.me/${contactForm.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-emerald-600 hover:underline flex items-center gap-0.5 font-bold"
                        >
                          <MessageCircle className="w-2.5 h-2.5" />
                          Testar
                        </a>
                      )}
                    </div>
                    <input
                      type="tel"
                      required
                      placeholder="+34 600 000 000"
                      value={contactForm.phone}
                      onChange={e => setContactForm({ ...contactForm, phone: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-0.5">Email</label>
                    <input
                      type="email"
                      placeholder="email@exemplo.com"
                      value={contactForm.email}
                      onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-0.5">Cidade</label>
                    <input
                      type="text"
                      placeholder="Barcelona"
                      value={contactForm.city}
                      onChange={e => setContactForm({ ...contactForm, city: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-0.5">Morada / Endereço</label>
                    <input
                      type="text"
                      placeholder="Rua, número..."
                      value={contactForm.address}
                      onChange={e => setContactForm({ ...contactForm, address: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-0.5">Comercial Responsável</label>
                    <input
                      type="text"
                      value={contactForm.salesRep}
                      onChange={e => setContactForm({ ...contactForm, salesRep: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </form>
            )}

            {/* Main Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 text-xs">
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-slate-400">Telefone / WhatsApp</span>
                  <button
                    onClick={() => setIsEditingContact(true)}
                    className="text-[10px] text-sky-600 hover:text-sky-800 underline font-medium cursor-pointer"
                  >
                    Alterar
                  </button>
                </div>
                <div className="flex items-center gap-2 font-medium text-slate-800 flex-wrap">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {lead.phone ? (
                    <a href={`tel:${lead.phone}`} className="hover:underline font-bold">{lead.phone}</a>
                  ) : (
                    <span className="text-slate-400 italic">Sem telefone</span>
                  )}
                  {lead.phone && lead.phone.replace(/[^0-9]/g, '').length >= 6 ? (
                    <a
                      href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded text-[10px] font-bold transition-all shadow-2xs"
                      title="Abrir WhatsApp"
                    >
                      <MessageCircle className="w-3 h-3 text-emerald-600" />
                      <span>WhatsApp</span>
                    </a>
                  ) : (
                    <button
                      onClick={() => setIsEditingContact(true)}
                      className="text-[10px] text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-1.5 py-0.2 rounded font-bold cursor-pointer"
                    >
                      + Inserir WhatsApp
                    </button>
                  )}
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Email</span>
                <div className="flex items-center gap-2 font-medium text-slate-800">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {lead.email ? (
                    <a href={`mailto:${lead.email}`} className="hover:underline truncate">{lead.email}</a>
                  ) : (
                    <span className="text-slate-400 italic">Sem email</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Localidade / Morada</span>
                <div className="flex items-center gap-2 font-medium text-slate-800">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{lead.city || 'Barcelona'} {lead.address ? `• ${lead.address}` : ''}</span>
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
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{lead.salesRep}</span>
                </div>
              </div>

              <div>
                <label className="text-slate-600 font-bold block mb-1 flex items-center justify-between">
                  <span>Valor do Orçamento (€)</span>
                  <span className="text-[10px] text-blue-600 font-normal">Editável</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-slate-500 text-sm">€</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={budgetString}
                    onChange={e => {
                      const sanitized = sanitizeCurrencyInput(e.target.value);
                      setBudgetString(sanitized);
                      const num = parseCurrencyInput(sanitized);
                      updateLead(lead.id, { estimatedValue: num, finalValue: num });
                    }}
                    placeholder="0"
                    className="w-full px-2.5 py-1 text-sm font-black text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
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

            {/* Notes / Customer Dossier */}
            <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black text-amber-900 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-amber-600" />
                  <span>Sobre o Cliente & Vida Pessoal (Dossiê Comercial)</span>
                </label>
                <span className="text-[10px] text-amber-700 font-bold bg-amber-100/90 px-2 py-0.5 rounded shadow-2xs">
                  Salva automaticamente ao digitar
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Anote aqui tudo sobre o cliente: família, preferências, horários de contacto, dúvidas, situação do imóvel e motivos da compra para retomar o contacto com facilidade.
              </p>
              <textarea
                value={lead.notes || ''}
                onChange={e => updateLead(lead.id, { notes: e.target.value })}
                rows={5}
                className="w-full text-xs p-3 rounded-xl border border-amber-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-800 bg-white font-medium"
                placeholder="Ex: Cliente tem 58 anos, mora com o marido e mãe idosa no Eixample. Reforma urgente porque a mãe não consegue entrar na banheira. Preferem ducha antiderrapante branca com barra de apoio. Melhor horário para ligar é à tarde após as 15h..."
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
