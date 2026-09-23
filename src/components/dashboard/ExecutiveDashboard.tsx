import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  TrendingUp, TrendingDown, DollarSign, Briefcase, Building2, 
  Users2, CheckCircle2, Clock, AlertTriangle, ArrowUpRight, 
  Calendar, Layers, Filter, ShieldCheck, Target, Percent 
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, 
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, Legend 
} from 'recharts';

export const ExecutiveDashboard: React.FC = () => {
  const { 
    leads, projects, invoices, payments, shifts, materials, 
    expenses, stages, getProjectFinancialSummary, setActiveTab, setSelectedProjectId 
  } = useApp();

  const [selectedPeriod, setSelectedPeriod] = useState<'setembro_2026' | 'agosto_2026' | 'ano_2026'>('setembro_2026');

  // Multiplier or filter simulation based on period
  const periodMultiplier = selectedPeriod === 'agosto_2026' ? 0.85 : (selectedPeriod === 'ano_2026' ? 4.2 : 1.0);

  // Core metrics calculation
  const totalLeads = Math.round(leads.length * (selectedPeriod === 'ano_2026' ? 3.5 : 1));
  const visits = Math.round(leads.filter(l => l.status === 'visita_agendada' || l.status === 'visita_realizada' || l.status === 'orcamento_enviado' || l.status === 'negociacao' || l.status === 'vendido').length * periodMultiplier);
  const quotesCount = Math.round(leads.filter(l => l.status === 'orcamento_enviado' || l.status === 'negociacao' || l.status === 'vendido').length * periodMultiplier);
  const quotesValue = 118000 * periodMultiplier;
  
  const salesCount = Math.round(leads.filter(l => l.status === 'vendido').length * (selectedPeriod === 'ano_2026' ? 4 : 1));
  const salesValue = (48000 + 22500 + 85000) * (selectedPeriod === 'ano_2026' ? 2.8 : (selectedPeriod === 'agosto_2026' ? 0.7 : 1));
  const averageTicket = salesCount > 0 ? Math.round(salesValue / salesCount) : 0;
  const conversionRate = totalLeads > 0 ? ((salesCount / totalLeads) * 100).toFixed(1) : '0';

  const billedTotal = invoices.filter(i => i.status !== 'cancelada').reduce((sum, i) => sum + i.totalAmount, 0) * periodMultiplier;
  const receivedTotal = payments.reduce((sum, p) => sum + p.amount, 0) * periodMultiplier;
  const receivableBalance = Math.max(0, billedTotal - receivedTotal);

  const laborCost = shifts.filter(s => s.status === 'aprovada' || s.status === 'paga').reduce((sum, s) => sum + s.totalValue, 0) * periodMultiplier;
  const materialCost = materials.reduce((sum, m) => sum + m.totalAmount, 0) * periodMultiplier;
  const otherCost = expenses.reduce((sum, e) => sum + e.totalAmount, 0) * periodMultiplier;
  const totalCost = laborCost + materialCost + otherCost;

  const grossMargin = billedTotal - totalCost;
  const grossMarginPercent = billedTotal > 0 ? ((grossMargin / billedTotal) * 100).toFixed(1) : '0';

  const activeProjectsCount = projects.filter(p => p.status === 'em_execucao').length;
  const completedProjectsCount = projects.filter(p => p.status === 'concluida').length;

  // Monthly trend data for charts
  const monthlyFinancialData = [
    { month: 'Mai', vendas: 52000, faturado: 38000, recebido: 35000, custos: 24000, margem: 14000 },
    { month: 'Jun', vendas: 64000, faturado: 45000, recebido: 42000, custos: 28000, margem: 17000 },
    { month: 'Jul', vendas: 48000, faturado: 51000, recebido: 48000, custos: 31000, margem: 20000 },
    { month: 'Ago', vendas: 72000, faturado: 54000, recebido: 50000, custos: 33000, margem: 21000 },
    { month: 'Set', vendas: 85000, faturado: 47400, recebido: 41400, custos: 26500, margem: 20900 },
  ];

  // Sales Funnel Data
  const funnelData = [
    { stage: '1. Novos Leads', count: totalLeads, fill: '#38bdf8' },
    { stage: '2. Qualificados', count: Math.round(totalLeads * 0.75), fill: '#0284c7' },
    { stage: '3. Visitas Feitas', count: visits, fill: '#0369a1' },
    { stage: '4. Orçamentos', count: quotesCount, fill: '#075985' },
    { stage: '5. Vendas Fechadas', count: salesCount, fill: '#10b981' },
  ];

  // Lead Source breakdown
  const sourceData = [
    { name: 'Meta Ads', value: 38, color: '#3b82f6' },
    { name: 'Google Ads', value: 27, color: '#10b981' },
    { name: 'Indicação', value: 21, color: '#8b5cf6' },
    { name: 'Instagram Orgânico', value: 9, color: '#ec4899' },
    { name: 'Site / SEO', value: 5, color: '#f59e0b' }
  ];

  // Service breakdown
  const serviceData = [
    { name: 'Reforma Integral', valor: 85000, color: '#0284c7' },
    { name: 'Cozinhas & WC', valor: 42000, color: '#0d9488' },
    { name: 'Parquet & Pisos', valor: 14000, color: '#f59e0b' },
    { name: 'Ar Condicionado', valor: 8800, color: '#8b5cf6' },
    { name: 'Pintura & Acabamentos', valor: 6500, color: '#ec4899' },
  ];

  // Project margins breakdown
  const projectsMarginData = projects.map(proj => {
    const summary = getProjectFinancialSummary(proj.id);
    return {
      name: proj.id,
      title: proj.title,
      contrato: summary.totalContractValue,
      custo: summary.totalCost,
      margem: summary.marginAmount,
      margemPercent: Math.round(summary.marginPercent)
    };
  });

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard Executivo</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">
              PRIME 360°
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Visão financeira e operacional consolidada em tempo real com integridade de dados.
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs font-medium">
          <Calendar className="w-4 h-4 text-slate-500 ml-1.5" />
          <button
            onClick={() => setSelectedPeriod('setembro_2026')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              selectedPeriod === 'setembro_2026' ? 'bg-white text-sky-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Setembro 2026
          </button>
          <button
            onClick={() => setSelectedPeriod('agosto_2026')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              selectedPeriod === 'agosto_2026' ? 'bg-white text-sky-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Agosto 2026
          </button>
          <button
            onClick={() => setSelectedPeriod('ano_2026')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              selectedPeriod === 'ano_2026' ? 'bg-white text-sky-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ano 2026 (Consolidado)
          </button>
        </div>
      </div>

      {/* 1. SEÇÃO FINANCEIRA: FATURAMENTO, RECEBIMENTO, CUSTOS & MARGEM */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <DollarSign className="w-4 h-4 text-emerald-600" />
          <span>Saúde Financeira & Rentabilidade</span>
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Faturado */}
          <div className="prime-card p-4.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Faturado</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                €
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">
              €{billedTotal.toLocaleString('pt-PT', { maximumFractionDigits: 0 })}
            </p>
            <div className="flex items-center gap-1 mt-2 text-xs text-emerald-600 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+18.4% vs mês anterior</span>
            </div>
          </div>

          {/* Recebido */}
          <div className="prime-card p-4.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Recebido em Caixa</span>
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                ✓
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">
              €{receivedTotal.toLocaleString('pt-PT', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Taxa de cobrança: {((receivedTotal / (billedTotal || 1)) * 100).toFixed(0)}%
            </p>
          </div>

          {/* A Receber */}
          <div className="prime-card p-4.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Saldo a Receber</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                ⏳
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">
              €{receivableBalance.toLocaleString('pt-PT', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-amber-600 font-medium mt-2">
              Vencimentos nos próx. 15 dias
            </p>
          </div>

          {/* Custos Totais */}
          <div className="prime-card p-4.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Custos Reais de Obra</span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                ↓
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">
              €{totalCost.toLocaleString('pt-PT', { maximumFractionDigits: 0 })}
            </p>
            <div className="mt-2 text-[11px] text-slate-500 flex justify-between">
              <span>Mão Obra: €{Math.round(laborCost)}</span>
              <span>Mat: €{Math.round(materialCost)}</span>
            </div>
          </div>

          {/* Margem Bruta Realizada */}
          <div className="prime-card p-4.5 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Margem Bruta</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {grossMarginPercent}%
              </span>
            </div>
            <p className="text-2xl font-black text-emerald-400 mt-2">
              €{grossMargin.toLocaleString('pt-PT', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Lucro líquido operacional do período
            </p>
          </div>
        </div>
      </div>

      {/* 2. SEÇÃO COMERCIAL: LEADS, FUNIL, VISITAS & TAXA DE CONVERSÃO */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <Briefcase className="w-4 h-4 text-blue-600" />
          <span>Pipeline Comercial & Fechamentos</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="prime-card p-3.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Leads Novos</span>
            <p className="text-xl font-bold text-slate-900 mt-1">{totalLeads}</p>
            <span className="text-[10px] text-sky-600 font-medium">Captação ativa</span>
          </div>

          <div className="prime-card p-3.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Visitas Feitas</span>
            <p className="text-xl font-bold text-slate-900 mt-1">{visits}</p>
            <span className="text-[10px] text-indigo-600 font-medium">Técnicas no local</span>
          </div>

          <div className="prime-card p-3.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Orçamentos</span>
            <p className="text-xl font-bold text-slate-900 mt-1">{quotesCount}</p>
            <span className="text-[10px] text-slate-500">€{Math.round(quotesValue).toLocaleString('pt-PT')}</span>
          </div>

          <div className="prime-card p-3.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Vendas Fechadas</span>
            <p className="text-xl font-bold text-emerald-600 mt-1">{salesCount}</p>
            <span className="text-[10px] text-emerald-700 font-semibold">€{Math.round(salesValue).toLocaleString('pt-PT')}</span>
          </div>

          <div className="prime-card p-3.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Ticket Médio</span>
            <p className="text-xl font-bold text-slate-900 mt-1">€{averageTicket.toLocaleString('pt-PT')}</p>
            <span className="text-[10px] text-slate-500">Por contrato</span>
          </div>

          <div className="prime-card p-3.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Taxa Conversão</span>
            <p className="text-xl font-bold text-slate-900 mt-1">{conversionRate}%</p>
            <span className="text-[10px] text-emerald-600 font-medium">Lead → Venda</span>
          </div>
        </div>
      </div>

      {/* 3. GRÁFICOS: EVOLUÇÃO MENSAL E FUNIL COMERCIAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evolução Mensal (Área) */}
        <div className="prime-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Evolução Mensal (Vendas vs Faturado vs Custos)</h3>
              <p className="text-xs text-slate-500">Histórico de desempenho e crescimento de margem</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                <span className="text-slate-600">Faturado</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-600">Margem Bruta</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span className="text-slate-600">Custos</span>
              </div>
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyFinancialData}>
                <defs>
                  <linearGradient id="colorFaturado" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorMargem" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={v => `€${v/1000}k`} />
                <Tooltip formatter={(value: any) => [`€${Number(value).toLocaleString('pt-PT')}`, '']} />
                <Area type="monotone" dataKey="faturado" stroke="#0284c7" strokeWidth={2.5} fillOpacity={1} fill="url(#colorFaturado)" name="Faturado" />
                <Area type="monotone" dataKey="margem" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorMargem)" name="Margem Bruta" />
                <Area type="monotone" dataKey="custos" stroke="#f43f5e" strokeWidth={1.5} fill="none" name="Custos Totais" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Funil Comercial */}
        <div className="prime-card p-5">
          <h3 className="text-sm font-bold text-slate-900">Funil de Vendas Comercial</h3>
          <p className="text-xs text-slate-500 mb-4">Etapas de conversão de leads até obra</p>

          <div className="space-y-3.5">
            {funnelData.map((stage, idx) => (
              <div key={stage.stage}>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">{stage.stage}</span>
                  <span className="font-bold text-slate-900">{stage.count}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${(stage.count / totalLeads) * 100}%`,
                      backgroundColor: stage.fill 
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-3 bg-emerald-50 border border-emerald-200/60 rounded-xl text-xs text-emerald-800">
            <span className="font-bold">Eficiência Comercial: </span>
            A cada 10 leads recebidos, {((salesCount / totalLeads) * 10).toFixed(1)} convertem-se em contrato assinado.
          </div>
        </div>
      </div>

      {/* 4. ANÁLISE DE ORIGEM E VENDAS POR SERVIÇO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Origem dos Leads */}
        <div className="prime-card p-5">
          <h3 className="text-sm font-bold text-slate-900">Origem dos Leads & ROI de Aquisição</h3>
          <p className="text-xs text-slate-500 mb-3">Distribuição percentual por canal de marketing</p>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="h-48 w-48 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`${value}%`, 'Participação']} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex-1 space-y-2 w-full">
              {sourceData.map(item => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-700 font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-900">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Faturamento por Tipo de Serviço */}
        <div className="prime-card p-5">
          <h3 className="text-sm font-bold text-slate-900">Vendas por Tipo de Serviço</h3>
          <p className="text-xs text-slate-500 mb-4">Volume total contratado por especialidade</p>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} tickFormatter={v => `€${v/1000}k`} />
                <YAxis dataKey="name" type="category" stroke="#475569" fontSize={11} width={110} />
                <Tooltip formatter={(v: any) => [`€${Number(v).toLocaleString('pt-PT')}`, 'Valor']} />
                <Bar dataKey="valor" fill="#0284c7" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 5. MARGEM INDIVIDUAL POR OBRA */}
      <div className="prime-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Rentabilidade & Margem Real por Obra</h3>
            <p className="text-xs text-slate-500">Comparação em tempo real: Contrato vs Custos acumulados (Mão de Obra + Materiais + Despesas)</p>
          </div>
          <button 
            onClick={() => setActiveTab('obras')}
            className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1"
          >
            <span>Ver Todas as Obras</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Código</th>
                <th className="py-2.5 px-3">Obra / Reforma</th>
                <th className="py-2.5 px-3 text-right">Contrato Total</th>
                <th className="py-2.5 px-3 text-right">Custos Atuais</th>
                <th className="py-2.5 px-3 text-right">Margem Realizada</th>
                <th className="py-2.5 px-3 text-center">Margem %</th>
                <th className="py-2.5 px-3 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projectsMarginData.map(row => (
                <tr key={row.name} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-sky-700">{row.name}</td>
                  <td className="py-3 px-3 font-semibold text-slate-800">{row.title}</td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900">€{row.contrato.toLocaleString('pt-PT')}</td>
                  <td className="py-3 px-3 text-right text-rose-600 font-medium">€{Math.round(row.custo).toLocaleString('pt-PT')}</td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-600">€{Math.round(row.margem).toLocaleString('pt-PT')}</td>
                  <td className="py-3 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      row.margemPercent >= 35 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : (row.margemPercent >= 20 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800')
                    }`}>
                      {row.margemPercent}%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => {
                        setSelectedProjectId(row.name);
                        setActiveTab('obras');
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-md transition-colors"
                    >
                      Abrir Ficha
                    </button>
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
