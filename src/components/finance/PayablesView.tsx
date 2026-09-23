import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Expense, ExpenseCategory, FixedExpense, FixedExpenseCategory } from '../../types';
import { 
  Receipt, Plus, Search, Filter, Calendar, Euro, 
  CheckCircle2, Clock, AlertTriangle, Building2, User,
  Briefcase, Landmark, Truck, ShieldCheck, Check, Trash2,
  Upload, FileText, Eye, Paperclip, X
} from 'lucide-react';

export const PayablesView: React.FC = () => {
  const { 
    expenses, 
    fixedExpenses, 
    materials, 
    shifts, 
    projects, 
    addExpense, 
    updateExpense, 
    addFixedExpense, 
    updateFixedExpense, 
    deleteFixedExpense 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'obras' | 'fixos'>('obras');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showAddFixedModal, setShowAddFixedModal] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<{ url: string; title: string } | null>(null);

  // Financial summary - Custos de Obra
  const unpaidExpenses = expenses.filter(e => !e.isPaid).reduce((s, e) => s + e.totalAmount, 0);
  const paidExpenses = expenses.filter(e => e.isPaid).reduce((s, e) => s + e.totalAmount, 0);
  const unpaidMaterials = materials.filter(m => !m.isPaid).reduce((s, m) => s + m.totalAmount, 0);
  const unpaidShifts = shifts.filter(s => s.status !== 'paga').reduce((s, sft) => s + sft.totalValue, 0);
  const totalObraPayable = unpaidExpenses + unpaidMaterials + unpaidShifts;

  // Financial summary - Gastos Fixos
  const monthlyFixedTotal = fixedExpenses.reduce((s, f) => {
    if (f.frequency === 'anual') return s + (f.amount / 12);
    if (f.frequency === 'trimestral') return s + (f.amount / 3);
    return s + f.amount;
  }, 0);
  const unpaidFixed = fixedExpenses.filter(f => !f.isPaid).reduce((s, f) => s + f.amount, 0);
  const paidFixed = fixedExpenses.filter(f => f.isPaid).reduce((s, f) => s + f.amount, 0);

  // Filtered expenses (Obras)
  const filteredExpenses = expenses.filter(exp => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      exp.supplier.toLowerCase().includes(q) ||
      exp.description.toLowerCase().includes(q) ||
      (exp.projectId && exp.projectId.toLowerCase().includes(q));

    const matchesCat = activeCategory === 'all' || exp.category === activeCategory;
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'paid' ? exp.isPaid : !exp.isPaid);
    return matchesSearch && matchesCat && matchesStatus;
  });

  // Filtered fixed expenses
  const filteredFixedExpenses = fixedExpenses.filter(f => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = f.description.toLowerCase().includes(q) || 
                          f.supplier.toLowerCase().includes(q) || 
                          f.category.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'paid' ? f.isPaid : !f.isPaid);
    return matchesSearch && matchesStatus;
  });

  // Form state - Despesa de Obra (com upload de fatura)
  const [expenseForm, setExpenseForm] = useState({
    projectId: projects[0]?.id || '',
    supplier: '',
    category: 'contentores' as ExpenseCategory,
    description: '',
    baseAmount: 250,
    vatRate: 23,
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    isPaid: false,
    documentUrl: '',
    documentName: ''
  });

  // Form state - Gasto Fixo da Empresa
  const [fixedForm, setFixedForm] = useState({
    description: '',
    category: 'renda_armazem' as FixedExpenseCategory,
    amount: 650,
    dueDate: 'Dia 05 de cada mês',
    frequency: 'mensal' as FixedExpense['frequency'],
    supplier: '',
    notes: ''
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setExpenseForm(prev => ({
        ...prev,
        documentUrl: dataUrl,
        documentName: file.name
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const vat = expenseForm.baseAmount * (expenseForm.vatRate / 100);
    addExpense({
      projectId: expenseForm.projectId,
      supplier: expenseForm.supplier,
      category: expenseForm.category,
      description: expenseForm.description,
      baseAmount: Number(expenseForm.baseAmount),
      vatAmount: vat,
      totalAmount: Number(expenseForm.baseAmount) + vat,
      date: new Date().toISOString().slice(0, 10),
      dueDate: expenseForm.dueDate,
      isPaid: expenseForm.isPaid,
      documentUrl: expenseForm.documentUrl || undefined
    });

    setExpenseForm({
      projectId: projects[0]?.id || '',
      supplier: '',
      category: 'contentores',
      description: '',
      baseAmount: 250,
      vatRate: 23,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      isPaid: false,
      documentUrl: '',
      documentName: ''
    });

    setShowAddExpenseModal(false);
  };

  const handleCreateFixed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fixedForm.description || !fixedForm.amount) return;

    addFixedExpense({
      description: fixedForm.description,
      category: fixedForm.category,
      amount: Number(fixedForm.amount),
      dueDate: fixedForm.dueDate,
      frequency: fixedForm.frequency,
      supplier: fixedForm.supplier,
      isPaid: false,
      notes: fixedForm.notes
    });

    setFixedForm({
      description: '',
      category: 'renda_armazem',
      amount: 650,
      dueDate: 'Dia 05 de cada mês',
      frequency: 'mensal',
      supplier: '',
      notes: ''
    });
    setShowAddFixedModal(false);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Gastos, Compras & Contas a Pagar</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
              Saídas Financeiras
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Suba faturas de fornecedores, controle custos diretos de obras com comprovativos anexados e gastos fixos da empresa.
          </p>

          {/* TAB SELECTOR: OBRAS VS FIXOS DA EMPRESA */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => setActiveTab('obras')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'obras'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Custos Diretos de Obras & Faturas Fornecedores
            </button>

            <button
              onClick={() => setActiveTab('fixos')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'fixos'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              Gastos Fixos da Empresa ({fixedExpenses.length})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {activeTab === 'obras' ? (
            <button
              onClick={() => setShowAddExpenseModal(true)}
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs shrink-0"
            >
              <Upload className="w-4 h-4" />
              <span>Subir Fatura / Gasto</span>
            </button>
          ) : (
            <button
              onClick={() => setShowAddFixedModal(true)}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Gasto Fixo</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI CARDS */}
      {activeTab === 'obras' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="prime-card p-4 border-l-4 border-l-rose-500">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total a Pagar (Obras)</span>
            <p className="text-2xl font-black text-rose-600 mt-1">€{totalObraPayable.toLocaleString('pt-PT')}</p>
            <span className="text-[10px] text-slate-400 font-medium">Fornecedores + Mão de obra</span>
          </div>

          <div className="prime-card p-4 border-l-4 border-l-amber-500">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Diárias da Equipa Pendentes</span>
            <p className="text-2xl font-black text-amber-600 mt-1">€{unpaidShifts.toLocaleString('pt-PT')}</p>
            <span className="text-[10px] text-amber-700 font-medium">Trabalhadores a liquidar</span>
          </div>

          <div className="prime-card p-4 border-l-4 border-l-indigo-500">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Materiais a Pagar</span>
            <p className="text-2xl font-black text-indigo-600 mt-1">€{unpaidMaterials.toLocaleString('pt-PT')}</p>
            <span className="text-[10px] text-indigo-700 font-medium">Faturas de fornecedores</span>
          </div>

          <div className="prime-card p-4 border-l-4 border-l-emerald-500">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Outras Despesas de Obra</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">€{unpaidExpenses.toLocaleString('pt-PT')}</p>
            <span className="text-[10px] text-emerald-700 font-semibold">Contentores, Maquinaria, etc.</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="prime-card p-4 border-l-4 border-l-slate-800">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Custo Fixo Mensal Estimado</span>
            <p className="text-2xl font-black text-slate-900 mt-1">€{Math.round(monthlyFixedTotal).toLocaleString('pt-PT')}</p>
            <span className="text-[10px] text-slate-400 font-medium">Burn rate mensal de estrutura da PRIME</span>
          </div>

          <div className="prime-card p-4 border-l-4 border-l-rose-500">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Gastos Fixos a Pagar Este Mês</span>
            <p className="text-2xl font-black text-rose-600 mt-1">€{unpaidFixed.toLocaleString('pt-PT')}</p>
            <span className="text-[10px] text-rose-700 font-medium">Aguardando liquidação bancária</span>
          </div>

          <div className="prime-card p-4 border-l-4 border-l-emerald-500">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Gastos Fixos Já Pagos Este Mês</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              €{(monthlyFixedTotal - unpaidFixed).toLocaleString('pt-PT')}
            </p>
            <span className="text-[10px] text-emerald-700 font-semibold">Liquidados no mês corrente</span>
          </div>
        </div>
      )}

      {/* VIEW 1: CUSTOS DE OBRAS */}
      {activeTab === 'obras' && (
        <div className="space-y-4">
          {/* Barra de Filtros de Status (Pendente / Pago) & Pesquisa */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 ${
                  statusFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todas ({expenses.length})
              </button>

              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  statusFilter === 'pending'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                🔴 Pendentes a Pagar (€{unpaidExpenses.toLocaleString('pt-PT')})
              </button>

              <button
                onClick={() => setStatusFilter('paid')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  statusFilter === 'paid'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                🟢 Faturas Já Pagas (€{paidExpenses.toLocaleString('pt-PT')})
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Pesquisar fornecedor, obra..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-medium"
              />
            </div>
          </div>

          <div className="prime-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4">Fornecedor / Entidade</th>
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4">Obra</th>
                    <th className="py-3 px-4">Descrição</th>
                    <th className="py-3 px-4 text-center">Fatura / Anexo</th>
                    <th className="py-3 px-4 text-right">Valor Total</th>
                    <th className="py-3 px-4">Vencimento</th>
                    <th className="py-3 px-4 text-center">Situação</th>
                    <th className="py-3 px-4 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExpenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-600">{exp.date}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{exp.supplier}</td>
                      <td className="py-3.5 px-4 capitalize text-slate-600">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                          {exp.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-sky-700">
                        {exp.projectId || 'Geral'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate">{exp.description}</td>
                      <td className="py-3.5 px-4 text-center">
                        {exp.documentUrl ? (
                          <button
                            onClick={() => setPreviewDocument({ url: exp.documentUrl!, title: `${exp.supplier} - ${exp.description}` })}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-50 text-sky-700 hover:bg-sky-100 font-semibold text-[10px] transition-colors"
                          >
                            <Paperclip className="w-3 h-3" />
                            <span>Ver Recibo</span>
                          </button>
                        ) : (
                          <span className="text-slate-300 text-2xs italic">Sem anexo</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-900">€{exp.totalAmount.toLocaleString('pt-PT')}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">{exp.dueDate}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          exp.isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {exp.isPaid ? 'LIQUIDADO' : 'A PAGAR'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {!exp.isPaid ? (
                          <button
                            onClick={() => updateExpense(exp.id, { isPaid: true, paymentDate: new Date().toISOString().slice(0, 10) })}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold"
                          >
                            Pagar
                          </button>
                        ) : (
                          <span className="text-slate-400 text-2xs">Pago</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: GASTOS FIXOS DA EMPRESA */}
      {activeTab === 'fixos' && (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs text-slate-600 flex items-start gap-3">
            <Landmark className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800 block text-sm">O que são os Gastos Fixos da Empresa?</span>
              São os custos recorrentes de estrutura e operação da PRIME que não pertencem a uma única obra: 
              <strong> Renda do Armazém, Seguros dos Trabalhadores, Seguro de Responsabilidade Civil, Contabilidade, Gasóleo & Portagens das Carrinhas, Software & Licenças</strong>. 
              Controlar estes valores garante o conhecimento exato do ponto de equilíbrio (Break-even).
            </div>
          </div>

          {/* Filtros de Status (Pendente / Pago) para Gastos Fixos */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 ${
                  statusFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos ({fixedExpenses.length})
              </button>

              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  statusFilter === 'pending'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                🔴 Pendentes Mês (€{unpaidFixed.toLocaleString('pt-PT')})
              </button>

              <button
                onClick={() => setStatusFilter('paid')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  statusFilter === 'paid'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                🟢 Pagos Mês (€{paidFixed.toLocaleString('pt-PT')})
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Pesquisar gasto fixo..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-medium"
              />
            </div>
          </div>

          <div className="prime-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Despesa Fixa</th>
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4">Fornecedor / Entidade</th>
                    <th className="py-3 px-4">Periodicidade</th>
                    <th className="py-3 px-4 text-center">Vencimento</th>
                    <th className="py-3 px-4 text-right">Valor</th>
                    <th className="py-3 px-4 text-center">Estado Mês Atual</th>
                    <th className="py-3 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFixedExpenses.map(f => (
                    <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {f.description}
                        {f.notes && <span className="text-[10px] text-slate-400 block font-normal">{f.notes}</span>}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px] capitalize">
                          {f.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">{f.supplier}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-600 capitalize">{f.frequency}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-700">{f.dueDate}</td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-900">€{f.amount.toLocaleString('pt-PT')}</td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => updateFixedExpense(f.id, { isPaid: !f.isPaid })}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                            f.isPaid 
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                          }`}
                        >
                          {f.isPaid ? '✓ PAGO ESTE MÊS' : 'PENDENTE'}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => {
                            if (confirm(`Remover despesa fixa "${f.description}"?`)) {
                              deleteFixedExpense(f.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: SUBIR FATURA / DESPESA DE OBRA */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Upload className="w-4 h-4 text-sky-400" />
                Subir Fatura / Lançar Despesa
              </h3>
              <button onClick={() => setShowAddExpenseModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-6 space-y-4 text-xs">
              {/* ÁREA DE UPLOAD DE COMPROVATIVO */}
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center bg-slate-50/50 hover:bg-slate-50 hover:border-sky-400 transition-all">
                <input
                  type="file"
                  id="expenseFile"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="expenseFile" className="cursor-pointer block">
                  <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-slate-800 text-xs block">
                    {expenseForm.documentName ? `✓ ${expenseForm.documentName}` : 'Clique para selecionar a Fatura / Recibo'}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Suporta imagens de recibos (JPG, PNG) ou Faturas em PDF
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fornecedor / Entidade *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Leroy Merlin, Saint-Gobain, Hilti"
                    value={expenseForm.supplier}
                    onChange={e => setExpenseForm({ ...expenseForm, supplier: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Categoria de Custo</label>
                  <select
                    value={expenseForm.category}
                    onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="contentores">Contentores / Entulhos</option>
                    <option value="subempreiteiro">Subempreiteiro</option>
                    <option value="aluguer_maquinas">Aluguer de Andaimes / Máquinas</option>
                    <option value="transporte">Transporte / Frete</option>
                    <option value="taxas">Taxas Municipais</option>
                    <option value="outros">Outros Custos de Obra</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Obra Relacionada</label>
                <select
                  value={expenseForm.projectId}
                  onChange={e => setExpenseForm({ ...expenseForm, projectId: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none font-medium"
                >
                  <option value="">Geral da Empresa (Sem Obra Específica)</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.id} - {p.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descrição do Item / Fatura</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Recolha de entulho 5m3 ou Compra de perfis de pladur"
                  value={expenseForm.description}
                  onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Valor Base (€) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={expenseForm.baseAmount}
                    onChange={e => setExpenseForm({ ...expenseForm, baseAmount: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data Vencimento</label>
                  <input
                    type="date"
                    value={expenseForm.dueDate}
                    onChange={e => setExpenseForm({ ...expenseForm, dueDate: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddExpenseModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold shadow-xs">
                  Salvar Fatura / Despesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: GASTO FIXO DA EMPRESA */}
      {showAddFixedModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Landmark className="w-4 h-4 text-amber-400" />
                Novo Gasto Fixo da Empresa
              </h3>
              <button onClick={() => setShowAddFixedModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreateFixed} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descrição da Despesa Fixa *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Renda Armazém Alverca"
                  value={fixedForm.description}
                  onChange={e => setFixedForm({ ...fixedForm, description: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Categoria</label>
                  <select
                    value={fixedForm.category}
                    onChange={e => setFixedForm({ ...fixedForm, category: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="renda_armazem">Renda / Armazém</option>
                    <option value="seguros">Seguros</option>
                    <option value="contabilidade">Contabilidade</option>
                    <option value="viaturas_combustivel">Veículos & Combustível</option>
                    <option value="software_telecom">Software & Licenças</option>
                    <option value="eletricidade_agua">Eletricidade & Água</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Periodicidade</label>
                  <select
                    value={fixedForm.frequency}
                    onChange={e => setFixedForm({ ...fixedForm, frequency: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="mensal">Mensal</option>
                    <option value="trimestral">Trimestral</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Valor (€) *</label>
                  <input
                    type="number"
                    required
                    value={fixedForm.amount}
                    onChange={e => setFixedForm({ ...fixedForm, amount: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vencimento (ex: Dia 05)</label>
                  <input
                    type="text"
                    placeholder="Dia 05 de cada mês"
                    value={fixedForm.dueDate}
                    onChange={e => setFixedForm({ ...fixedForm, dueDate: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Entidade / Fornecedor</label>
                <input
                  type="text"
                  placeholder="Ex: EDP Comercial / Fidelidade Seguros"
                  value={fixedForm.supplier}
                  onChange={e => setFixedForm({ ...fixedForm, supplier: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddFixedModal(false)} className="px-3.5 py-1.5 text-slate-600">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold">Salvar Gasto Fixo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE PRÉ-VISUALIZAÇÃO DE COMPROVATIVO */}
      {previewDocument && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-400" />
                {previewDocument.title}
              </span>
              <button onClick={() => setPreviewDocument(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex items-center justify-center bg-slate-100 max-h-[75vh] overflow-auto">
              {previewDocument.url.startsWith('data:image') || previewDocument.url.includes('images.unsplash') ? (
                <img src={previewDocument.url} alt="Comprovativo" className="max-w-full rounded-lg shadow-sm max-h-[65vh] object-contain" />
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-slate-400 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-700">Fatura em formato PDF anexada</p>
                  <a
                    href={previewDocument.url}
                    download="comprovativo-fatura.pdf"
                    className="inline-block mt-3 px-4 py-2 bg-sky-600 text-white rounded-lg text-xs font-bold shadow-xs hover:bg-sky-700"
                  >
                    Descarregar Fatura PDF
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
