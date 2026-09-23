import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Building2, CheckCircle2, Clock, Calendar, Image, 
  FileText, CreditCard, Sparkles, Check, X, Shield 
} from 'lucide-react';

export const ClientPortalView: React.FC = () => {
  const { 
    currentUser, projects, stages, invoices, payments, 
    changeOrders, photos, approveChangeOrder 
  } = useApp();

  // Matched project for current client (e.g. Dr. Miguel Oliveira -> OB-0001)
  const clientProject = projects.find(p => p.clientId === (currentUser.clientId || 'CLI-0001')) || projects[0];

  const projectStages = stages.filter(s => s.projectId === clientProject?.id);
  const projectInvoices = invoices.filter(i => i.projectId === clientProject?.id);
  const projectPayments = payments.filter(p => p.projectId === clientProject?.id);
  const projectPhotos = photos.filter(p => p.projectId === clientProject?.id);
  const projectChanges = changeOrders.filter(co => co.projectId === clientProject?.id);

  const totalContract = clientProject ? clientProject.contractValue : 0;
  const totalPaid = projectPayments.reduce((s, p) => s + p.amount, 0);
  const totalBilled = projectInvoices.reduce((s, i) => s + i.totalAmount, 0);

  if (!clientProject) {
    return (
      <div className="p-8 text-center text-slate-500">
        Nenhuma obra associada ao seu perfil.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Portal Exclusivo do Cliente
          </span>
          <h1 className="text-2xl font-black tracking-tight mt-2">
            Olá, {currentUser.name}
          </h1>
          <p className="text-xs text-purple-200 mt-1">
            Acompanhe o andamento da sua obra em tempo real com transparência total.
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs text-purple-300 block">Obra Contratada</span>
          <span className="font-mono text-base font-bold text-white bg-purple-800/60 px-3 py-1 rounded-lg border border-purple-700 block mt-1">
            {clientProject.id}
          </span>
        </div>
      </div>

      {/* Progress & Timeline Overview */}
      <div className="prime-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{clientProject.title}</h2>
            <p className="text-xs text-slate-500">{clientProject.address}</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-slate-400 uppercase">Previsão de Conclusão</span>
            <span className="text-sm font-bold text-slate-800 block">{clientProject.plannedEndDate}</span>
          </div>
        </div>

        {/* Big Progress Bar */}
        <div>
          <div className="flex justify-between text-xs font-bold mb-1.5">
            <span className="text-slate-600">Progresso Geral dos Trabalhos</span>
            <span className="text-purple-700 text-sm">{clientProject.progressPercent}% Concluído</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full transition-all duration-700"
              style={{ width: `${clientProject.progressPercent}%` }}
            />
          </div>
        </div>

        {/* Stages Milestones */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3">
          {projectStages.map(stg => (
            <div key={stg.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 truncate">{stg.name}</span>
                {stg.status === 'concluida' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                )}
              </div>
              <p className="text-[11px] text-slate-400">{stg.plannedStart.slice(5)} a {stg.plannedEnd.slice(5)}</p>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                stg.status === 'concluida' ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'
              }`}>
                {stg.status.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Alterações / Extras que aguardam aprovação do cliente */}
      {projectChanges.some(co => co.status === 'aguardando_aprovacao') && (
        <div className="p-5 bg-purple-50 border border-purple-200 rounded-2xl space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-slate-900 text-sm">Alterações / Extras Solicitados</h3>
          </div>
          <p className="text-xs text-purple-900">
            A equipa técnica enviou propostas de ajustes para a sua aprovação:
          </p>

          <div className="space-y-2">
            {projectChanges.filter(co => co.status === 'aguardando_aprovacao').map(co => (
              <div key={co.id} className="p-3.5 bg-white rounded-xl border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">{co.description}</span>
                  <span className="text-[11px] text-slate-500">Prazo adicional: +{co.additionalDays} dia(s)</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-black text-sm text-purple-900">
                    +€{co.additionalAmount.toLocaleString('pt-PT')}
                  </span>
                  <button
                    onClick={() => approveChangeOrder(co.id)}
                    className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-xs flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Aprovar Alteração</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Photos Gallery */}
      <div className="prime-card p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Image className="w-4 h-4 text-purple-600" />
          <span>Galeria Fotográfica da Evolução da Obra</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {projectPhotos.map(photo => (
            <div key={photo.id} className="rounded-xl overflow-hidden border border-slate-200 group">
              <img src={photo.url} alt={photo.caption} className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="p-2 text-[11px] bg-white">
                <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 block w-fit mb-0.5">
                  {photo.category}
                </span>
                <p className="font-medium text-slate-800 truncate">{photo.caption}</p>
                <span className="text-[10px] text-slate-400">{photo.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Financial: Invoices & Receipts for Client */}
      <div className="prime-card p-5 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>Faturas & Pagamentos</span>
          </h3>
          <div className="text-xs text-slate-500 font-medium">
            Total Pago: <strong className="text-emerald-700">€{totalPaid.toLocaleString('pt-PT')}</strong> de €{totalContract.toLocaleString('pt-PT')}
          </div>
        </div>

        <div className="space-y-2">
          {projectInvoices.map(inv => (
            <div key={inv.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="font-mono font-bold text-slate-900">{inv.code}</span>
                <p className="text-[11px] text-slate-500">{inv.description}</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-900 block">€{inv.totalAmount.toLocaleString('pt-PT')}</span>
                <span className={`text-[10px] font-bold uppercase ${
                  inv.status === 'paga' ? 'text-emerald-600' : 'text-amber-600'
                }`}>
                  {inv.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
