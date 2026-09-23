import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  BarChart3, TrendingUp, DollarSign, Building2, Users2, 
  Calendar, ArrowUpRight, CheckCircle2, AlertTriangle, Download 
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  Tooltip, CartesianGrid, Legend, LineChart, Line 
} from 'recharts';

export const ReportsView: React.FC = () => {
  const { projects, shifts, employees, materials, expenses, invoices, payments, getProjectFinancialSummary, setSelectedProjectId, setActiveTab } = useApp();

  const [selectedMonth, setSelectedMonth] = useState('2026-09');
  const [reportFilter, setReportFilter] = useState<'all' | 'active' | 'archived'>('all');

  // Per-project financial analysis
  const projectReports = projects.map(proj => {
    const summary = getProjectFinancialSummary(proj.id);
    const varianceEur = summary.totalContractValue - summary.totalCost;
    return {
      id: proj.id,
      title: proj.title,
      contrato: summary.totalContractValue,
      faturado: summary.totalBilled,
      recebido: summary.totalReceived,
      aReceber: summary.balanceReceivable,
      custoMaoDeObra: summary.laborCost,
      custoMateriais: summary.materialCost,
      outrosCustos: summary.otherCost,
      custoTotal: summary.totalCost,
      margemEur: summary.marginAmount,
      margemPct: Math.round(summary.marginPercent),
      status: proj.status,
      isArchived: !!proj.isArchived || proj.status === 'concluida'
    };
  });

  const filteredProjectReports = projectReports.filter(p => {
    if (reportFilter === 'active') return !p.isArchived;
    if (reportFilter === 'archived') return p.isArchived;
    return true;
  });

  // Totais consolidados
  const totalPortfolioContract = filteredProjectReports.reduce((s, p) => s + p.contrato, 0);
  const totalPortfolioBilled = filteredProjectReports.reduce((s, p) => s + p.faturado, 0);
  const totalPortfolioReceived = filteredProjectReports.reduce((s, p) => s + p.recebido, 0);
  const totalLaborCost = filteredProjectReports.reduce((s, p) => s + p.custoMaoDeObra, 0);
  const totalMaterialCost = filteredProjectReports.reduce((s, p) => s + p.custoMateriais, 0);
  const totalOtherCost = filteredProjectReports.reduce((s, p) => s + p.outrosCustos, 0);
  const totalPortfolioCost = filteredProjectReports.reduce((s, p) => s + p.custoTotal, 0);
  const totalPortfolioMarginEur = filteredProjectReports.reduce((s, p) => s + p.margemEur, 0);
  const avgPortfolioMarginPct = totalPortfolioContract > 0 
    ? Math.round((totalPortfolioMarginEur / totalPortfolioContract) * 100)
    : 0;

  // Monthly revenue & cashflow trend (Faturado - Mão de Obra - Materiais = Lucro Real)
  const monthlyData = [
    { mes: 'Mai 2026', faturado: 38000, recebido: 35000, maoObra: 11000, materiais: 13000, lucro: 14000 },
    { mes: 'Jun 2026', faturado: 45000, recebido: 42000, maoObra: 13000, materiais: 15000, lucro: 17000 },
    { mes: 'Jul 2026', faturado: 51000, recebido: 48000, maoObra: 14500, materiais: 16500, lucro: 20000 },
    { mes: 'Ago 2026', faturado: 54000, recebido: 50000, maoObra: 15000, materiais: 18000, lucro: 21000 },
    { mes: 'Set 2026', faturado: 47400, recebido: 41400, maoObra: 12500, materiais: 14000, lucro: 20900 },
  ];

  // Employee payroll audit (se foi pago ou não)
  const employeeReport = employees.map(emp => {
    const empShifts = shifts.filter(s => s.employeeId === emp.id);
    const totalDue = empShifts.reduce((s, x) => s + x.totalValue, 0);
    const totalPaid = empShifts.filter(s => s.status === 'paga').reduce((s, x) => s + x.totalValue, 0);
    const totalPending = totalDue - totalPaid;
    const daysCount = empShifts.length;

    return {
      id: emp.id,
      name: emp.name,
      role: emp.role,
      daysCount,
      totalDue,
      totalPaid,
      totalPending,
      isFullyPaid: totalPending === 0
    };
  });

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Relatórios & Margem por Obra</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
              Auditoria Financeira
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Análise detalhada de faturamento mês a mês, margem realizada de cada obra, custos de mão de obra e compras de materiais.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
        >
          <Download className="w-4 h-4" />
          <span>Exportar Relatório</span>
        </button>
      </div>

      {/* 4 CARDS KPI: FATURAMENTO, MÃO DE OBRA, MATERIAIS E LUCRO REAL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="prime-card p-4 border-l-4 border-l-sky-500">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Faturado Total</span>
          <p className="text-2xl font-black text-sky-600 mt-1">€{totalPortfolioBilled.toLocaleString('pt-PT')}</p>
          <span className="text-[10px] text-slate-400 font-medium">Contratado: €{totalPortfolioContract.toLocaleString('pt-PT')}</span>
        </div>

        <div className="prime-card p-4 border-l-4 border-l-orange-500">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Mão de Obra Total</span>
          <p className="text-2xl font-black text-orange-600 mt-1">€{totalLaborCost.toLocaleString('pt-PT')}</p>
          <span className="text-[10px] text-orange-700 font-medium">Diárias e equipas de execução</span>
        </div>

        <div className="prime-card p-4 border-l-4 border-l-indigo-500">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Gasto em Materiais</span>
          <p className="text-2xl font-black text-indigo-600 mt-1">€{totalMaterialCost.toLocaleString('pt-PT')}</p>
          <span className="text-[10px] text-indigo-700 font-semibold">Compras a fornecedores de obra</span>
        </div>

        <div className="prime-card p-4 border-l-4 border-l-emerald-500">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Lucro Real / Margem</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">€{Math.round(totalPortfolioMarginEur).toLocaleString('pt-PT')}</p>
          <span className="text-[10px] text-emerald-700 font-bold">Margem média: {avgPortfolioMarginPct}%</span>
        </div>
      </div>

      {/* 1. GRÁFICO DE FATURAMENTO MENSAL E CUSTOS */}
      <div className="prime-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Evolução de Faturamento & Custos por Mês</h2>
            <p className="text-xs text-slate-500">Faturamento bruto vs Mão de Obra vs Materiais vs Lucro Real</p>
          </div>
          <div className="flex items-center gap-3 text-xs flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-sky-600" />
              <span className="text-slate-600 font-medium">Faturado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-orange-500" />
              <span className="text-slate-600 font-medium">Mão de Obra</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-indigo-500" />
              <span className="text-slate-600 font-bold">Materiais</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-emerald-600" />
              <span className="text-slate-600 font-medium">Lucro Real</span>
            </div>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={v => `€${v/1000}k`} />
              <Tooltip formatter={(val: any) => [`€${Number(val).toLocaleString('pt-PT')}`, '']} />
              <Bar dataKey="faturado" fill="#0284c7" radius={[4, 4, 0, 0]} name="Faturado" />
              <Bar dataKey="maoObra" fill="#f97316" radius={[4, 4, 0, 0]} name="Mão de Obra" />
              <Bar dataKey="materiais" fill="#6366f1" radius={[4, 4, 0, 0]} name="Materiais & Compras" />
              <Bar dataKey="lucro" fill="#10b981" radius={[4, 4, 0, 0]} name="Lucro Real" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. TABELA COMPLETA DE RESULTADO POR OBRA */}
      <div className="prime-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Relatório Geral Consolidado de Todas as Obras</h2>
            <p className="text-xs text-slate-500">
              Comparação direta entre valor contratado, faturamento, custos de execução (mão de obra e materiais) e margem real gerada.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setReportFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                reportFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todas ({projectReports.length})
            </button>
            <button
              onClick={() => setReportFilter('active')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                reportFilter === 'active'
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Ativas ({projectReports.filter(p => !p.isArchived).length})
            </button>
            <button
              onClick={() => setReportFilter('archived')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                reportFilter === 'archived'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Concluídas / Arquivadas ({projectReports.filter(p => p.isArchived).length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Obra</th>
                <th className="py-3 px-3">Título / Serviço</th>
                <th className="py-3 px-3">Situação</th>
                <th className="py-3 px-3 text-right">Contrato</th>
                <th className="py-3 px-3 text-right">Faturado</th>
                <th className="py-3 px-3 text-right">Recebido</th>
                <th className="py-3 px-3 text-right">Mão de Obra</th>
                <th className="py-3 px-3 text-right">Materiais</th>
                <th className="py-3 px-3 text-right">Custo Total</th>
                <th className="py-3 px-3 text-right">Margem (€)</th>
                <th className="py-3 px-3 text-center">Margem (%)</th>
                <th className="py-3 px-3 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProjectReports.map(row => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-3 font-mono font-bold text-sky-700">{row.id}</td>
                  <td className="py-3.5 px-3 font-semibold text-slate-800">{row.title}</td>
                  <td className="py-3.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      row.isArchived 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                        : 'bg-sky-100 text-sky-800 border border-sky-200'
                    }`}>
                      {row.isArchived ? 'Concluída / Histórico' : 'Em Execução'}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right font-black text-slate-900">€{row.contrato.toLocaleString('pt-PT')}</td>
                  <td className="py-3.5 px-3 text-right font-bold text-sky-700">€{row.faturado.toLocaleString('pt-PT')}</td>
                  <td className="py-3.5 px-3 text-right font-bold text-emerald-600">€{row.recebido.toLocaleString('pt-PT')}</td>
                  <td className="py-3.5 px-3 text-right text-orange-600 font-medium">€{row.custoMaoDeObra.toLocaleString('pt-PT')}</td>
                  <td className="py-3.5 px-3 text-right text-indigo-600 font-medium">€{row.custoMateriais.toLocaleString('pt-PT')}</td>
                  <td className="py-3.5 px-3 text-right font-bold text-rose-600">€{row.custoTotal.toLocaleString('pt-PT')}</td>
                  <td className="py-3.5 px-3 text-right font-black text-emerald-600">€{Math.round(row.margemEur).toLocaleString('pt-PT')}</td>
                  <td className="py-3.5 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      row.margemPct >= 35 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {row.margemPct}%
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <button
                      onClick={() => {
                        setSelectedProjectId(row.id);
                        setActiveTab('obras');
                      }}
                      className="px-2 py-1 text-[11px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-md"
                    >
                      Ver Ficha
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            {/* LINHA DE TOTAIS CONSOLIDADOS */}
            <tfoot className="bg-slate-100/90 font-bold border-t-2 border-slate-300 text-slate-900">
              <tr>
                <td colSpan={3} className="py-3.5 px-3 uppercase text-[11px] tracking-wider text-slate-700">
                  Total Consolidado ({filteredProjectReports.length} obras)
                </td>
                <td className="py-3.5 px-3 text-right font-black text-slate-900">
                  €{totalPortfolioContract.toLocaleString('pt-PT')}
                </td>
                <td className="py-3.5 px-3 text-right text-sky-800">
                  €{totalPortfolioBilled.toLocaleString('pt-PT')}
                </td>
                <td className="py-3.5 px-3 text-right text-emerald-700">
                  €{totalPortfolioReceived.toLocaleString('pt-PT')}
                </td>
                <td colSpan={2} className="py-3.5 px-3 text-right text-slate-500 text-[11px]">
                  Custos Totais:
                </td>
                <td className="py-3.5 px-3 text-right text-rose-700 font-black">
                  €{totalPortfolioCost.toLocaleString('pt-PT')}
                </td>
                <td className="py-3.5 px-3 text-right text-emerald-700 font-black">
                  €{Math.round(totalPortfolioMarginEur).toLocaleString('pt-PT')}
                </td>
                <td className="py-3.5 px-3 text-center">
                  <span className="px-2 py-1 rounded-md bg-emerald-200 text-emerald-900 font-black text-xs">
                    {avgPortfolioMarginPct}%
                  </span>
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 3. RELATÓRIO DE FUNCIONÁRIOS (SE FOI PAGO OU NÃO) */}
      <div className="prime-card p-6 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Controle de Pagamentos por Funcionário (Folha de Diárias)</h2>
          <p className="text-xs text-slate-500">
            Acompanhe exatamente o que cada profissional produziu, quanto já recebeu e o saldo em atraso ou pendente.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Funcionário</th>
                <th className="py-3 px-4">Função</th>
                <th className="py-3 px-4 text-center">Dias Registados</th>
                <th className="py-3 px-4 text-right">Total Devido</th>
                <th className="py-3 px-4 text-right">Valor Já Pago</th>
                <th className="py-3 px-4 text-right">Saldo Pendente</th>
                <th className="py-3 px-4 text-center">Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employeeReport.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{emp.name}</td>
                  <td className="py-3.5 px-4 text-slate-600">{emp.role}</td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-700">{emp.daysCount}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900">€{emp.totalDue.toLocaleString('pt-PT')}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-600">€{emp.totalPaid.toLocaleString('pt-PT')}</td>
                  <td className="py-3.5 px-4 text-right font-black text-rose-600">€{emp.totalPending.toLocaleString('pt-PT')}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      emp.isFullyPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {emp.isFullyPaid ? '100% LIQUIDADO' : 'PENDENTE DE PAGAMENTO'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
