import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BillingMilestone, MilestoneStatus, MilestoneType } from '../../types';
import { 
  Coins, Plus, Search, Calendar, CheckCircle2, Clock, 
  AlertTriangle, ArrowRight, Building2, User, FileText,
  MessageSquare
} from 'lucide-react';

export const BillingMilestonesView: React.FC = () => {
  const { milestones, projects, clients, createInvoice, setSelectedProjectId, setActiveTab } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredMilestones = milestones.filter(m => {
    const proj = projects.find(p => p.id === m.projectId);
    const client = clients.find(c => c.id === m.clientId);
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      m.description.toLowerCase().includes(q) ||
      m.projectId.toLowerCase().includes(q) ||
      (client && client.name.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalToBill = milestones.filter(m => m.status === 'a_faturar').reduce((s, m) => s + m.plannedAmount, 0);
  const totalBilled = milestones.filter(m => m.status === 'faturada' || m.status === 'paga').reduce((s, m) => s + m.plannedAmount, 0);
  const totalPaid = milestones.filter(m => m.status === 'paga').reduce((s, m) => s + m.receivedAmount, 0);

  const handleEmitInvoiceForMilestone = (m: BillingMilestone) => {
    const proj = projects.find(p => p.id === m.projectId);
    createInvoice({
      clientId: m.clientId,
      projectId: m.projectId,
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      description: `${m.description} - Obra ${m.projectId}`,
      stageOrMilestone: m.type.toUpperCase(),
      baseAmount: m.plannedAmount / 1.23,
      vatAmount: m.plannedAmount - (m.plannedAmount / 1.23),
      totalAmount: m.plannedAmount,
      status: 'emitida',
      items: [
        {
          id: `item-${Date.now()}`,
          description: m.description,
          quantity: 1,
          unitPrice: m.plannedAmount / 1.23,
          vatRate: 23,
          total: m.plannedAmount
        }
      ]
    });
    setActiveTab('faturas');
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Cobranças & Marcos Futuros</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              Agenda Financeira
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Planeamento de faturação por parcelas percentuais ou marcos de conclusão de etapas da obra.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="prime-card p-4 border-l-4 border-l-amber-500">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Previsão a Faturar</span>
          <p className="text-2xl font-black text-amber-600 mt-1">€{totalToBill.toLocaleString('pt-PT')}</p>
          <span className="text-[10px] text-amber-700 font-semibold">Aguardam conclusão de marco</span>
        </div>

        <div className="prime-card p-4 border-l-4 border-l-sky-500">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Já Faturado em Marcos</span>
          <p className="text-2xl font-black text-sky-600 mt-1">€{totalBilled.toLocaleString('pt-PT')}</p>
          <span className="text-[10px] text-slate-400 font-medium">Faturas emitidas</span>
        </div>

        <div className="prime-card p-4 border-l-4 border-l-emerald-500">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Total Liquidado</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">€{totalPaid.toLocaleString('pt-PT')}</p>
          <span className="text-[10px] text-emerald-700 font-semibold">Recebimento confirmado</span>
        </div>
      </div>

      {/* Table of Milestones */}
      <div className="prime-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Obra / Cliente</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Descrição do Marco / Parcela</th>
                <th className="py-3 px-4">Previsão Faturação</th>
                <th className="py-3 px-4 text-right">Valor Previsto</th>
                <th className="py-3 px-4 text-center">Fatura Emitida?</th>
                <th className="py-3 px-4 text-center">Situação</th>
                <th className="py-3 px-4 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMilestones.map(m => {
                const client = clients.find(c => c.id === m.clientId);
                return (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => {
                          setSelectedProjectId(m.projectId);
                          setActiveTab('obras');
                        }}
                        className="font-mono font-bold text-sky-700 hover:underline block"
                      >
                        {m.projectId}
                      </button>
                      <span className="text-[11px] text-slate-500">{client?.name}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold uppercase text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {m.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{m.description}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{m.plannedDate}</td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900">
                      €{m.plannedAmount.toLocaleString('pt-PT')}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {m.invoiceIssued ? (
                        <span className="text-emerald-700 font-bold text-[11px]">
                          Sim ({m.invoiceNumber || 'FAT'})
                        </span>
                      ) : (
                        <span className="text-slate-400">Não</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        m.status === 'paga' ? 'bg-emerald-100 text-emerald-800' : (m.status === 'faturada' ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800')
                      }`}>
                        {m.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {m.status === 'a_faturar' && (
                          <button
                            onClick={() => handleEmitInvoiceForMilestone(m)}
                            className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-[10px] transition-colors shadow-2xs"
                          >
                            Emitir Fatura
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const phone = (client?.phone || '+351 912 345 678').replace(/\D/g, '');
                            const text = encodeURIComponent(`Olá ${client?.name || 'Cliente'}! Tudo bem? 😊\n\nA equipa da *PRIME Remodelações* informa que a etapa *${m.description}* da sua obra *${m.projectId}* foi concluída e está programada para faturação no valor de *€${m.plannedAmount.toLocaleString('pt-PT')}*.\n\nQualquer dúvida estamos à sua inteira disposição!\n*PRIME Engenharia & Obras* 🏗️`);
                            window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
                          }}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors shadow-2xs"
                          title="Notificar avanço e cobrança por WhatsApp"
                        >
                          <MessageSquare className="w-3 h-3 text-emerald-600" />
                          <span>WhatsApp</span>
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
    </div>
  );
};
