import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Invoice, InvoiceStatus, Payment, Expense, MaterialPurchase } from '../../types';
import { 
  FileText, Plus, Search, Filter, Calendar, CheckCircle2, 
  Clock, AlertTriangle, Printer, Euro, ArrowDownRight, 
  Building2, User, X, Check, Upload, Paperclip, Eye,
  ArrowUpRight, Landmark, Layers, Download, MessageSquare,
  Send, TrendingUp, BarChart3, Sliders, ShieldAlert, Copy,
  CheckCheck, Sparkles, Coins
} from 'lucide-react';

export const InvoicesView: React.FC = () => {
  const { 
    invoices, 
    projects, 
    clients, 
    expenses, 
    materials, 
    fixedExpenses,
    milestones,
    shifts,
    createInvoice, 
    recordPayment, 
    addExpense,
    updateExpense,
    updateMaterial,
    updateFixedExpense,
    setSelectedProjectId, 
    setActiveTab 
  } = useApp();

  // Tab principal: Faturas a Clientes vs Faturas a Fornecedores vs Gastos Fixos vs Previsão de Caixa
  const [financeTab, setFinanceTab] = useState<'receber' | 'pagar' | 'fixos' | 'previsao'>('receber');

  // Subtab dentro de A Receber: Faturas Emitidas vs Parcelas da Venda a Prazo
  const [receberSubTab, setReceberSubTab] = useState<'faturas' | 'parcelas'>('faturas');

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [quickFilterReceber, setQuickFilterReceber] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');
  const [quickFilterPagar, setQuickFilterPagar] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');

  // Modais
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<Invoice | null>(null);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
  const [showAddSupplierInvoiceModal, setShowAddSupplierInvoiceModal] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<{ url: string; title: string } | null>(null);

  // WhatsApp cobrança rápida
  const [selectedInvoiceForWhatsApp, setSelectedInvoiceForWhatsApp] = useState<Invoice | null>(null);
  const [whatsAppMessageType, setWhatsAppMessageType] = useState<'emissao' | 'vencimento' | 'atraso'>('emissao');
  const [whatsAppPhone, setWhatsAppPhone] = useState('');
  const [whatsAppMessage, setWhatsAppMessage] = useState('');
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Cenário de stress de caixa (dias de atraso dos clientes simulados)
  const [delayScenarioDays, setDelayScenarioDays] = useState(0);

  const todayStr = new Date().toISOString().slice(0, 10);

  // ===================== CÁLCULOS: CONTAS A RECEBER (CLIENTES) =====================
  const totalClientBilled = invoices.filter(i => i.status !== 'cancelada').reduce((s, i) => s + i.totalAmount, 0);
  const totalClientReceived = invoices.reduce((s, i) => s + i.receivedAmount, 0);
  const totalClientPending = invoices.filter(i => i.status !== 'paga' && i.status !== 'cancelada').reduce((s, i) => s + (i.totalAmount - i.receivedAmount), 0);
  const totalClientOverdue = invoices.filter(i => i.status === 'vencida' || (i.dueDate < todayStr && i.status !== 'paga' && i.status !== 'cancelada')).reduce((s, i) => s + (i.totalAmount - i.receivedAmount), 0);
  const countPendingReceber = invoices.filter(i => i.status !== 'paga' && i.status !== 'cancelada').length;
  const countOverdueReceber = invoices.filter(i => i.status === 'vencida' || (i.dueDate < todayStr && i.status !== 'paga' && i.status !== 'cancelada')).length;

  // ===================== CÁLCULOS: CONTAS A PAGAR (FORNECEDORES & GASTOS) =====================
  // Combinar despesas e materiais
  const allPayables = [
    ...expenses.map(e => ({
      id: e.id,
      type: 'despesa' as const,
      date: e.date,
      supplier: e.supplier,
      category: e.category,
      description: e.description,
      projectId: e.projectId,
      totalAmount: e.totalAmount,
      dueDate: e.dueDate,
      isPaid: e.isPaid,
      documentUrl: e.documentUrl,
      raw: e
    })),
    ...materials.map(m => ({
      id: m.id,
      type: 'material' as const,
      date: m.date,
      supplier: m.supplier,
      category: m.category,
      description: m.description,
      projectId: m.projectId,
      totalAmount: m.totalAmount,
      dueDate: m.date, // default to date
      isPaid: m.isPaid,
      documentUrl: m.documentUrl,
      raw: m
    }))
  ];

  const totalSupplierBilled = allPayables.reduce((s, p) => s + p.totalAmount, 0);
  const totalSupplierPaid = allPayables.filter(p => p.isPaid).reduce((s, p) => s + p.totalAmount, 0);
  const totalSupplierPending = allPayables.filter(p => !p.isPaid).reduce((s, p) => s + p.totalAmount, 0);
  const totalSupplierOverdue = allPayables.filter(p => !p.isPaid && p.dueDate < todayStr).reduce((s, p) => s + p.totalAmount, 0);
  const countPendingPagar = allPayables.filter(p => !p.isPaid).length;
  const countOverduePagar = allPayables.filter(p => !p.isPaid && p.dueDate < todayStr).length;

  // Previsão Líquida de Caixa
  const netPrevision = totalClientPending - totalSupplierPending;

  // Gastos Fixos
  const monthlyFixedTotal = fixedExpenses.reduce((s, f) => {
    if (f.frequency === 'anual') return s + (f.amount / 12);
    if (f.frequency === 'trimestral') return s + (f.amount / 3);
    return s + f.amount;
  }, 0);
  const unpaidFixed = fixedExpenses.filter(f => !f.isPaid).reduce((s, f) => s + f.amount, 0);

  // ===================== FILTRAGEM: FATURAS A CLIENTES =====================
  const filteredClientInvoices = invoices.filter(inv => {
    const client = clients.find(c => c.id === inv.clientId);
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      inv.code.toLowerCase().includes(q) ||
      inv.description.toLowerCase().includes(q) ||
      inv.projectId.toLowerCase().includes(q) ||
      (client && client.name.toLowerCase().includes(q));

    let matchesQuick = true;
    if (quickFilterReceber === 'pending') {
      matchesQuick = inv.status !== 'paga' && inv.status !== 'cancelada';
    } else if (quickFilterReceber === 'paid') {
      matchesQuick = inv.status === 'paga';
    } else if (quickFilterReceber === 'overdue') {
      matchesQuick = inv.status === 'vencida' || (inv.dueDate < todayStr && inv.status !== 'paga' && inv.status !== 'cancelada');
    }

    return matchesSearch && matchesQuick;
  });

  // ===================== FILTRAGEM: FATURAS A FORNECEDORES =====================
  const filteredSupplierInvoices = allPayables.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      p.supplier.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      (p.projectId && p.projectId.toLowerCase().includes(q));

    let matchesQuick = true;
    if (quickFilterPagar === 'pending') {
      matchesQuick = !p.isPaid;
    } else if (quickFilterPagar === 'paid') {
      matchesQuick = p.isPaid;
    } else if (quickFilterPagar === 'overdue') {
      matchesQuick = !p.isPaid && p.dueDate < todayStr;
    }

    return matchesSearch && matchesQuick;
  });

  // Form states - Fatura Externa a Cliente com Anexo e Parcelas
  const [newInvoiceForm, setNewInvoiceForm] = useState({
    projectId: projects[0]?.id || '',
    clientId: clients[0]?.id || '',
    code: '',
    issueDate: todayStr,
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    description: 'Adjudicação e início de trabalhos de reforma',
    stageOrMilestone: '1ª Fase / Sinal',
    totalAmount: 4500,
    paymentType: 'unica' as 'unica' | 'parcelada',
    installmentsCount: 3,
    installments: [
      { number: 1, amount: 1500, dueDate: new Date(Date.now() + 5 * 84600000).toISOString().slice(0, 10) },
      { number: 2, amount: 1500, dueDate: new Date(Date.now() + 30 * 84600000).toISOString().slice(0, 10) },
      { number: 3, amount: 1500, dueDate: new Date(Date.now() + 60 * 84600000).toISOString().slice(0, 10) }
    ],
    documentUrl: '',
    documentName: '',
    notes: 'Pagamento de fatura acordado por transferência bancária.'
  });

  const handleClientInvoiceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setNewInvoiceForm(prev => ({
        ...prev,
        documentUrl: dataUrl,
        documentName: file.name
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleInstallmentCountChange = (count: number) => {
    const total = Number(newInvoiceForm.totalAmount) || 0;
    const basePer = Math.round((total / count) * 100) / 100;
    const insts = Array.from({ length: count }, (_, idx) => {
      const d = new Date();
      d.setDate(d.getDate() + ((idx + 1) * 30));
      return {
        number: idx + 1,
        amount: idx === count - 1 ? Math.round((total - (basePer * (count - 1))) * 100) / 100 : basePer,
        dueDate: d.toISOString().slice(0, 10)
      };
    });
    setNewInvoiceForm(prev => ({
      ...prev,
      installmentsCount: count,
      installments: insts
    }));
  };

  const handleTotalAmountChange = (newTotal: number) => {
    const count = newInvoiceForm.installmentsCount || 2;
    const basePer = Math.round((newTotal / count) * 100) / 100;
    const insts = newInvoiceForm.installments.map((inst, idx) => ({
      ...inst,
      amount: idx === count - 1 ? Math.round((newTotal - (basePer * (count - 1))) * 100) / 100 : basePer
    }));
    setNewInvoiceForm(prev => ({
      ...prev,
      totalAmount: newTotal,
      installments: insts
    }));
  };

  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    method: 'transferencia' as const,
    bank: 'Millennium BCP',
    reference: '',
    notes: 'Liquidação efetuada via transferência bancária'
  });

  const [supplierInvoiceForm, setSupplierInvoiceForm] = useState({
    projectId: projects[0]?.id || '',
    supplier: '',
    description: '',
    category: 'contentores' as any,
    baseAmount: 250,
    vatRate: 23,
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    documentUrl: '',
    documentName: ''
  });

  // ===================== WHATSAPP COBRANÇA RÁPIDA =====================
  const updateWhatsAppText = (type: 'emissao' | 'vencimento' | 'atraso', inv: Invoice, clientName: string, projTitle: string, pendingAmount: number) => {
    let msg = '';
    if (type === 'emissao') {
      msg = `Olá ${clientName}, tudo bem? 😊\n\nA equipa da *PRIME Remodelações* concluiu com sucesso mais uma etapa da sua obra (*${projTitle}*).\n\nEmitimos a fatura *${inv.code}* no valor de *€${pendingAmount.toLocaleString('pt-PT')}*, referente a ${inv.description}.\n\n💳 *Dados para Liquidação (Transferência Bancária):*\n• Banco: Millennium BCP\n• Titular: PRIME Reformas & Obras Lda\n• IBAN: *PT50 0033 0000 4523 8912 0014 5*\n• Descritivo: ${inv.code}\n\nQualquer dúvida estamos à sua total disposição!\nObrigado pela confiança,\n*PRIME Engenharia & Obras* 🏗️`;
    } else if (type === 'vencimento') {
      msg = `Olá ${clientName}, esperamos que esteja tudo bem!\n\nLembramos cordialmente que a fatura *${inv.code}* no valor de *€${pendingAmount.toLocaleString('pt-PT')}* referente à obra *${projTitle}* tem vencimento agendado para o próximo dia *${inv.dueDate}*.\n\n💳 *IBAN para Transferência:*\nPT50 0033 0000 4523 8912 0014 5 (PRIME Lda)\n\nAgradecemos a confirmação do comprovativo assim que efetuado. Muito obrigado!\n*PRIME Obras*`;
    } else {
      msg = `Olá ${clientName}, bom dia.\n\nVerificámos em sistema que a fatura *${inv.code}* no valor de *€${pendingAmount.toLocaleString('pt-PT')}* (vencida em ${inv.dueDate}) referente à obra *${projTitle}* ainda se encontra pendente de liquidação.\n\nSolicitamos a amabilidade da respetiva regularização para mantermos a calendarização das entregas e compras de materiais:\n💳 *IBAN:* PT50 0033 0000 4523 8912 0014 5\n\nCaso a transferência já tenha sido efetuada, pedimos que desconsidere este aviso. Obrigado!\n*PRIME Obras*`;
    }
    setWhatsAppMessage(msg);
  };

  const handleOpenWhatsAppModal = (inv: Invoice, type: 'emissao' | 'vencimento' | 'atraso' = 'emissao') => {
    const client = clients.find(c => c.id === inv.clientId);
    const proj = projects.find(p => p.id === inv.projectId);
    const phone = client?.phone || '+351 912 345 678';
    const pendingAmount = inv.totalAmount - inv.receivedAmount;
    
    setSelectedInvoiceForWhatsApp(inv);
    setWhatsAppMessageType(type);
    setWhatsAppPhone(phone);
    setCopiedSuccess(false);

    updateWhatsAppText(type, inv, client?.name || 'Cliente', proj?.title || 'Obra PRIME', pendingAmount);
  };

  const handleSendWhatsApp = () => {
    if (!selectedInvoiceForWhatsApp) return;
    const cleanPhone = whatsAppPhone.replace(/\D/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsAppMessage)}`;
    window.open(url, '_blank');
  };

  const handleCopyWhatsAppText = () => {
    navigator.clipboard.writeText(whatsAppMessage);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  // ===================== CÁLCULOS: PREVISÃO DE TESOURARIA 30/60/90 DIAS =====================
  const forecastWeeks = [0, 1, 2, 3, 4, 5, 6, 7].map(weekIdx => {
    const startDay = new Date();
    startDay.setDate(startDay.getDate() + (weekIdx * 7));
    const endDay = new Date();
    endDay.setDate(endDay.getDate() + ((weekIdx + 1) * 7));

    const startStr = startDay.toISOString().slice(0, 10);
    const endStr = endDay.toISOString().slice(0, 10);

    // Inflows: invoices due in this week + upcoming milestones planned in this week
    const weekInvoices = invoices.filter(inv => {
      if (inv.status === 'paga' || inv.status === 'cancelada') return false;
      const effectiveDue = new Date(new Date(inv.dueDate).getTime() + (delayScenarioDays * 24 * 60 * 60 * 1000)).toISOString().slice(0, 10);
      return effectiveDue >= startStr && effectiveDue <= endStr;
    });

    const weekMilestones = milestones.filter(m => {
      if (m.status !== 'a_faturar') return false;
      const effectiveDate = new Date(new Date(m.plannedDate).getTime() + (delayScenarioDays * 24 * 60 * 60 * 1000)).toISOString().slice(0, 10);
      return effectiveDate >= startStr && effectiveDate <= endStr;
    });

    const totalInflows = weekInvoices.reduce((s, i) => s + (i.totalAmount - i.receivedAmount), 0) +
                         weekMilestones.reduce((s, m) => s + m.plannedAmount, 0);

    // Outflows: supplier payables due in this week + weekly fixed overhead + weekly estimated team labor
    const weekPayables = allPayables.filter(p => {
      if (p.isPaid) return false;
      return p.dueDate >= startStr && p.dueDate <= endStr;
    });

    const weeklyFixed = monthlyFixedTotal / 4;
    const weeklyEstimatedLabor = 1850; // Média de diárias semanais em obras ativas

    const totalOutflows = weekPayables.reduce((s, p) => s + p.totalAmount, 0) + weeklyFixed + weeklyEstimatedLabor;
    const netWeek = totalInflows - totalOutflows;

    return {
      weekIndex: weekIdx + 1,
      startStr,
      endStr,
      totalInflows,
      totalOutflows,
      netWeek,
      weekInvoices,
      weekMilestones,
      weekPayables
    };
  });

  const next30DaysInflows = forecastWeeks.slice(0, 4).reduce((s, w) => s + w.totalInflows, 0);
  const next30DaysOutflows = forecastWeeks.slice(0, 4).reduce((s, w) => s + w.totalOutflows, 0);
  const next30DaysNet = next30DaysInflows - next30DaysOutflows;

  const next60DaysInflows = forecastWeeks.slice(0, 8).reduce((s, w) => s + w.totalInflows, 0);
  const next60DaysOutflows = forecastWeeks.slice(0, 8).reduce((s, w) => s + w.totalOutflows, 0);
  const next60DaysNet = next60DaysInflows - next60DaysOutflows;

  const next90DaysInflows = Math.round(next60DaysInflows * 1.55);
  const next90DaysOutflows = Math.round(next60DaysOutflows * 1.50);
  const next90DaysNet = next90DaysInflows - next90DaysOutflows;

  const handleEmitInvoiceForMilestone = (m: any) => {
    createInvoice({
      clientId: m.clientId,
      projectId: m.projectId,
      issueDate: todayStr,
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
    setReceberSubTab('faturas');
  };

  const handleCreateClientInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const total = Number(newInvoiceForm.totalAmount) || 0;
    if (total <= 0) {
      alert('Por favor insira um valor válido para a fatura.');
      return;
    }

    const proj = projects.find(p => p.id === newInvoiceForm.projectId);
    const base = Math.round((total / 1.23) * 100) / 100;
    const vat = Math.round((total - base) * 100) / 100;

    const formattedInstallments = newInvoiceForm.paymentType === 'parcelada' && newInvoiceForm.installments.length > 0
      ? newInvoiceForm.installments.map(inst => ({
          number: inst.number,
          amount: Number(inst.amount),
          dueDate: inst.dueDate,
          isPaid: false
        }))
      : undefined;

    const primaryDueDate = newInvoiceForm.paymentType === 'parcelada' && formattedInstallments && formattedInstallments[0]
      ? formattedInstallments[0].dueDate
      : newInvoiceForm.dueDate;

    createInvoice({
      code: newInvoiceForm.code.trim() || undefined,
      clientId: proj?.clientId || newInvoiceForm.clientId,
      projectId: newInvoiceForm.projectId,
      issueDate: newInvoiceForm.issueDate,
      dueDate: primaryDueDate,
      description: newInvoiceForm.description,
      stageOrMilestone: newInvoiceForm.stageOrMilestone,
      baseAmount: base,
      vatAmount: vat,
      totalAmount: total,
      status: 'emitida',
      documentUrl: newInvoiceForm.documentUrl || undefined,
      documentName: newInvoiceForm.documentName || undefined,
      isExternalInvoice: true,
      hasInstallments: newInvoiceForm.paymentType === 'parcelada',
      installments: formattedInstallments,
      items: [
        {
          id: `item-${Date.now()}`,
          description: newInvoiceForm.description,
          quantity: 1,
          unitPrice: base,
          vatRate: 23,
          total: total
        }
      ],
      notes: newInvoiceForm.notes
    });

    setShowNewInvoiceModal(false);
    if (newInvoiceForm.paymentType === 'parcelada') {
      setReceberSubTab('parcelas');
    }
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForPayment) return;

    recordPayment({
      invoiceId: selectedInvoiceForPayment.id,
      clientId: selectedInvoiceForPayment.clientId,
      projectId: selectedInvoiceForPayment.projectId,
      date: todayStr,
      amount: Number(paymentForm.amount),
      method: paymentForm.method,
      bank: paymentForm.bank,
      reference: paymentForm.reference,
      notes: paymentForm.notes
    });

    setSelectedInvoiceForPayment(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setSupplierInvoiceForm(prev => ({
        ...prev,
        documentUrl: dataUrl,
        documentName: file.name
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleCreateSupplierInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const vat = supplierInvoiceForm.baseAmount * (supplierInvoiceForm.vatRate / 100);
    addExpense({
      projectId: supplierInvoiceForm.projectId || undefined,
      supplier: supplierInvoiceForm.supplier,
      category: supplierInvoiceForm.category,
      description: supplierInvoiceForm.description,
      baseAmount: Number(supplierInvoiceForm.baseAmount),
      vatAmount: vat,
      totalAmount: Number(supplierInvoiceForm.baseAmount) + vat,
      date: todayStr,
      dueDate: supplierInvoiceForm.dueDate,
      isPaid: false,
      documentUrl: supplierInvoiceForm.documentUrl || undefined
    });

    setShowAddSupplierInvoiceModal(false);
    setSupplierInvoiceForm({
      projectId: projects[0]?.id || '',
      supplier: '',
      description: '',
      category: 'contentores',
      baseAmount: 250,
      vatRate: 23,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      documentUrl: '',
      documentName: ''
    });
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* PAINEL MESTRE DE BALANÇO: A RECEBER vs A PAGAR */}
      <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                Centro Financeiro & Tesouraria
              </span>
              <span className="text-xs text-slate-400">PRIME Gestão</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white mt-1">
              Controle Geral de Faturas: A Receber & A Pagar
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Diferenciação clara entre faturas emitidas para os clientes pagarem e faturas recebidas de fornecedores para a empresa liquidar.
            </p>
          </div>

          {/* Saldo Líquido Previsional */}
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 lg:text-right shrink-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Previsão Líquida de Caixa
            </span>
            <div className={`text-2xl font-black mt-0.5 ${netPrevision >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              €{Math.round(netPrevision).toLocaleString('pt-PT')}
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              (Pendente de Clientes - Pendente a Fornecedores)
            </span>
          </div>
        </div>

        {/* 2 GRANDES CARDS: RECEBER vs PAGAR */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {/* CARD 1: CONTAS A RECEBER (CLIENTES) */}
          <div 
            onClick={() => setFinanceTab('receber')}
            className={`p-5 rounded-2xl border cursor-pointer transition-all ${
              financeTab === 'receber' 
                ? 'bg-emerald-950/40 border-emerald-500 shadow-md ring-2 ring-emerald-500/20' 
                : 'bg-slate-800/40 border-slate-700/80 hover:bg-slate-800/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <ArrowDownRight className="w-4 h-4" />
                Faturas a Clientes (A Receber)
              </span>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-2xs font-bold font-mono">
                {countPendingReceber} faturas pendentes
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">
                €{totalClientPending.toLocaleString('pt-PT')}
              </span>
              <span className="text-xs text-emerald-400 font-semibold">pendente de cobrança</span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-700/60 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Total Já Recebido</span>
                <span className="font-bold text-white">€{totalClientReceived.toLocaleString('pt-PT')}</span>
              </div>
              <div className="text-right">
                <span className="text-rose-400 block text-[10px] font-bold">Em Atraso / Vencidas</span>
                <span className="font-black text-rose-400">€{totalClientOverdue.toLocaleString('pt-PT')}</span>
              </div>
            </div>
          </div>

          {/* CARD 2: CONTAS A PAGAR (FORNECEDORES & COMPRAS) */}
          <div 
            onClick={() => setFinanceTab('pagar')}
            className={`p-5 rounded-2xl border cursor-pointer transition-all ${
              financeTab === 'pagar' 
                ? 'bg-rose-950/40 border-rose-500 shadow-md ring-2 ring-rose-500/20' 
                : 'bg-slate-800/40 border-slate-700/80 hover:bg-slate-800/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4" />
                Faturas a Fornecedores (A Pagar)
              </span>
              <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded text-2xs font-bold font-mono">
                {countPendingPagar} contas a liquidar
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">
                €{totalSupplierPending.toLocaleString('pt-PT')}
              </span>
              <span className="text-xs text-rose-400 font-semibold">a sair de caixa</span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-700/60 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Já Liquidado</span>
                <span className="font-bold text-white">€{totalSupplierPaid.toLocaleString('pt-PT')}</span>
              </div>
              <div className="text-right">
                <span className="text-rose-400 block text-[10px] font-bold">Vencidas a Pagar</span>
                <span className="font-black text-rose-400">€{totalSupplierOverdue.toLocaleString('pt-PT')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* NAVEGAÇÃO DE ABAS */}
        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-800 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setFinanceTab('receber')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
              financeTab === 'receber'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>1. Faturas a Clientes (A Receber)</span>
            <span className="px-1.5 py-0.2 bg-emerald-700/60 rounded text-[10px]">{invoices.length}</span>
          </button>

          <button
            onClick={() => setFinanceTab('pagar')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
              financeTab === 'pagar'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>2. Faturas de Fornecedores (A Pagar)</span>
            <span className="px-1.5 py-0.2 bg-rose-700/60 rounded text-[10px]">{allPayables.length}</span>
          </button>

          <button
            onClick={() => setFinanceTab('fixos')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
              financeTab === 'fixos'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>3. Gastos Fixos da Empresa</span>
            <span className="px-1.5 py-0.2 bg-indigo-700/60 rounded text-[10px]">{fixedExpenses.length}</span>
          </button>

          <button
            onClick={() => setFinanceTab('previsao')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
              financeTab === 'previsao'
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>4. Previsão de Tesouraria (30/60/90 Dias)</span>
            <span className="px-1.5 py-0.2 bg-emerald-500 text-white rounded text-[10px] font-bold">Direto</span>
          </button>
        </div>
      </div>

      {/* ==================== ABA 1: FATURAS A CLIENTES (A RECEBER) ==================== */}
      {financeTab === 'receber' && (
        <div className="space-y-5">
          {/* Sub-navegação: Faturas Emitidas vs Parcelas da Venda a Prazo */}
          <div className="bg-slate-100 p-1.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 border border-slate-200">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setReceberSubTab('faturas')}
                className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  receberSubTab === 'faturas'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>1. Faturas Emitidas a Clientes ({invoices.length})</span>
              </button>

              <button
                onClick={() => setReceberSubTab('parcelas')}
                className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  receberSubTab === 'parcelas'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Coins className="w-4 h-4 text-amber-600" />
                <span>2. Parcelas das Vendas a Prazo ({milestones.length})</span>
                <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full text-[10px]">Contratos</span>
              </button>
            </div>

            <div className="text-right text-[11px] text-slate-500 pr-3 hidden sm:block">
              {receberSubTab === 'faturas' ? (
                <span>Controlo de faturas emitidas aos clientes, valores recebidos e cobranças</span>
              ) : (
                <span>Cronograma de parcelas e pagamentos a prazo acordados no fecho do contrato</span>
              )}
            </div>
          </div>

          {/* SUB-ABA 1.1: FATURAS EMITIDAS A CLIENTES */}
          {receberSubTab === 'faturas' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
                {/* Quick Status Filter Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto text-xs w-full sm:w-auto">
                  <button
                    onClick={() => setQuickFilterReceber('all')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 ${
                      quickFilterReceber === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Todas ({invoices.length})
                  </button>

                  <button
                    onClick={() => setQuickFilterReceber('pending')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                      quickFilterReceber === 'pending'
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Pendentes (€{totalClientPending.toLocaleString('pt-PT')})
                  </button>

                  <button
                    onClick={() => setQuickFilterReceber('paid')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                      quickFilterReceber === 'paid'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Liquidadas (€{totalClientReceived.toLocaleString('pt-PT')})
                  </button>

                  <button
                    onClick={() => setQuickFilterReceber('overdue')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                      quickFilterReceber === 'overdue'
                        ? 'bg-rose-600 text-white'
                        : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Em Atraso (€{totalClientOverdue.toLocaleString('pt-PT')})
                  </button>
                </div>

                <button
                  onClick={() => setShowNewInvoiceModal(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs shrink-0"
                >
                  <Upload className="w-4 h-4" />
                  <span>Subir Fatura Emitida ao Cliente</span>
                </button>
              </div>

              {/* Tabela de Faturas a Clientes */}
              <div className="prime-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Fatura</th>
                        <th className="py-3 px-4">Cliente</th>
                        <th className="py-3 px-4">Obra</th>
                        <th className="py-3 px-4">Descrição / Marco</th>
                        <th className="py-3 px-4 text-right">Valor Total</th>
                        <th className="py-3 px-4 text-right">Recebido</th>
                        <th className="py-3 px-4 text-right">Pendente</th>
                        <th className="py-3 px-4">Vencimento</th>
                        <th className="py-3 px-4 text-center">Estado</th>
                        <th className="py-3 px-4 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredClientInvoices.map(inv => {
                        const client = clients.find(c => c.id === inv.clientId);
                        const isOverdue = inv.status === 'vencida' || (inv.dueDate < todayStr && inv.status !== 'paga' && inv.status !== 'cancelada');
                        const pendingAmount = inv.totalAmount - inv.receivedAmount;

                        return (
                          <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-sky-700">
                              {inv.code}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-slate-800">
                              {client ? client.name : inv.clientId}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-slate-500">
                              {inv.projectId}
                            </td>
                            <td className="py-3.5 px-4 text-slate-700">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-medium">{inv.description}</span>
                                {inv.hasInstallments && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-sky-100 text-sky-800 font-bold">
                                    Parcelada ({inv.installments?.length || 2}x)
                                  </span>
                                )}
                              </div>
                              {inv.documentUrl && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewDocument({ url: inv.documentUrl!, title: `Fatura ${inv.code} - ${inv.description}` })}
                                  className="mt-1 inline-flex items-center gap-1 text-[10px] text-sky-700 font-bold bg-sky-50 hover:bg-sky-100 px-2 py-0.5 rounded border border-sky-200 transition-colors"
                                >
                                  <Paperclip className="w-3 h-3 text-sky-600" />
                                  <span>{inv.documentName || 'Ver Fatura Anexa'}</span>
                                </button>
                              )}
                              {inv.stageOrMilestone && (
                                <span className="block text-[10px] text-slate-400 font-mono">
                                  Ref: {inv.stageOrMilestone}
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                              €{inv.totalAmount.toLocaleString('pt-PT')}
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                              €{inv.receivedAmount.toLocaleString('pt-PT')}
                            </td>
                            <td className="py-3.5 px-4 text-right font-black">
                              <span className={pendingAmount > 0 ? (isOverdue ? 'text-rose-600' : 'text-amber-600') : 'text-slate-400'}>
                                €{pendingAmount.toLocaleString('pt-PT')}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono">
                              <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                                {inv.dueDate} {isOverdue && '⚠️'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                inv.status === 'paga' ? 'bg-emerald-100 text-emerald-800' :
                                inv.status === 'parcialmente_paga' ? 'bg-indigo-100 text-indigo-800' :
                                isOverdue ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {inv.status === 'paga' ? 'LIQUIDADA' :
                                 inv.status === 'parcialmente_paga' ? 'PARCIAL' :
                                 isOverdue ? 'VENCIDA' : 'PENDENTE'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {inv.status !== 'paga' && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setSelectedInvoiceForPayment(inv);
                                        setPaymentForm(prev => ({ ...prev, amount: pendingAmount }));
                                      }}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shadow-2xs"
                                    >
                                      Registar Recebimento
                                    </button>
                                    <button
                                      onClick={() => handleOpenWhatsAppModal(inv, isOverdue ? 'atraso' : 'emissao')}
                                      className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-2xs transition-colors"
                                      title="Enviar cobrança / lembrete via WhatsApp"
                                    >
                                      <MessageSquare className="w-3 h-3 text-emerald-600" />
                                      <span>WhatsApp</span>
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => setSelectedInvoiceForPrint(inv)}
                                  className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                                  title="Imprimir Fatura PDF"
                                >
                                  <Printer className="w-3.5 h-3.5" />
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
          )}

          {/* SUB-ABA 1.2: PARCELAS DAS VENDAS A PRAZO (CONTRATOS) */}
          {receberSubTab === 'parcelas' && (
            <div className="space-y-4">
              <div className="bg-amber-50/60 border border-amber-200/80 p-4 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
                <Coins className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm">Cronograma Contratual de Parcelas a Prazo</h4>
                  <p className="mt-0.5 text-amber-800">
                    Aqui estão todas as parcelas acordadas nas vendas das obras (Sinal 30%, Demolição, Carpintaria, Entrega).
                    Quando uma etapa é atingida, clique em <strong>"Emitir Fatura"</strong> para cobrar a respetiva parcela ao cliente.
                  </p>
                </div>
              </div>

              <div className="prime-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Obra / Contrato</th>
                        <th className="py-3 px-4">Cliente</th>
                        <th className="py-3 px-4">Parcela / Tipo</th>
                        <th className="py-3 px-4">Descrição da Parcela</th>
                        <th className="py-3 px-4">Vencimento Previsto</th>
                        <th className="py-3 px-4 text-right">Valor da Parcela</th>
                        <th className="py-3 px-4 text-center">Fatura Gerada?</th>
                        <th className="py-3 px-4 text-center">Situação</th>
                        <th className="py-3 px-4 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {milestones.map(m => {
                        const client = clients.find(c => c.id === m.clientId);
                        const proj = projects.find(p => p.id === m.projectId);
                        return (
                          <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4">
                              <span className="font-mono font-bold text-sky-700 block">{m.projectId}</span>
                              <span className="text-[11px] text-slate-400 truncate max-w-[150px] block">{proj?.title}</span>
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-slate-800">
                              {client ? client.name : m.clientId}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                                {m.type}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-medium text-slate-800">
                              {m.description}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-slate-600">
                              {m.plannedDate}
                            </td>
                            <td className="py-3.5 px-4 text-right font-black text-slate-900">
                              €{m.plannedAmount.toLocaleString('pt-PT')}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {m.invoiceIssued ? (
                                <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                  {m.invoiceNumber || 'Sim (Gerada)'}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">Não Gerada</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                m.status === 'paga' ? 'bg-emerald-100 text-emerald-800' :
                                m.status === 'faturada' ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {m.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {m.status === 'a_faturar' && (
                                  <button
                                    onClick={() => handleEmitInvoiceForMilestone(m)}
                                    className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-[10px] shadow-2xs transition-colors"
                                  >
                                    Emitir Fatura
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    const phone = (client?.phone || '+351 912 345 678').replace(/\D/g, '');
                                    const text = encodeURIComponent(`Olá ${client?.name || 'Cliente'}! Tudo bem? 😊\n\nA equipa da *PRIME Remodelações* informa que a parcela contratual *${m.description}* da obra *${m.projectId}* no valor de *€${m.plannedAmount.toLocaleString('pt-PT')}* está programada para liquidação.\n\nQualquer dúvida estamos à sua total disposição!\n*PRIME Engenharia & Obras* 🏗️`);
                                    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
                                  }}
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-2xs transition-colors"
                                  title="Notificar cliente sobre esta parcela via WhatsApp"
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
          )}
        </div>
      )}

      {/* ==================== ABA 2: FATURAS DE FORNECEDORES (A PAGAR) ==================== */}
      {financeTab === 'pagar' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            {/* Quick Status Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto text-xs w-full sm:w-auto">
              <button
                onClick={() => setQuickFilterPagar('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 ${
                  quickFilterPagar === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todas ({allPayables.length})
              </button>

              <button
                onClick={() => setQuickFilterPagar('pending')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  quickFilterPagar === 'pending'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                A Pagar / Pendentes (€{totalSupplierPending.toLocaleString('pt-PT')})
              </button>

              <button
                onClick={() => setQuickFilterPagar('paid')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  quickFilterPagar === 'paid'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Liquidadas (€{totalSupplierPaid.toLocaleString('pt-PT')})
              </button>

              <button
                onClick={() => setQuickFilterPagar('overdue')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  quickFilterPagar === 'overdue'
                    ? 'bg-red-700 text-white'
                    : 'bg-red-50 text-red-800 border border-red-200 hover:bg-red-100'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Vencidas a Pagar (€{totalSupplierOverdue.toLocaleString('pt-PT')})
              </button>
            </div>

            <button
              onClick={() => setShowAddSupplierInvoiceModal(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs shrink-0"
            >
              <Upload className="w-4 h-4" />
              <span>Subir Fatura de Fornecedor</span>
            </button>
          </div>

          {/* Tabela de Faturas de Fornecedores */}
          <div className="prime-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Fornecedor / Loja</th>
                    <th className="py-3 px-4">Obra</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Descrição do Gasto</th>
                    <th className="py-3 px-4 text-center">Comprovativo / Fatura</th>
                    <th className="py-3 px-4 text-right">Valor a Pagar</th>
                    <th className="py-3 px-4">Vencimento</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSupplierInvoices.map(p => {
                    const isOverdue = !p.isPaid && p.dueDate < todayStr;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{p.supplier}</td>
                        <td className="py-3.5 px-4 font-mono text-sky-700 font-semibold">{p.projectId || 'Geral PRIME'}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px] uppercase">
                            {p.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate">{p.description}</td>
                        <td className="py-3.5 px-4 text-center">
                          {p.documentUrl ? (
                            <button
                              onClick={() => setPreviewDocument({ url: p.documentUrl!, title: `${p.supplier} - ${p.description}` })}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-50 text-sky-700 hover:bg-sky-100 font-semibold text-[10px]"
                            >
                              <Paperclip className="w-3 h-3" />
                              <span>Ver Fatura</span>
                            </button>
                          ) : (
                            <span className="text-slate-300 text-2xs italic">Sem anexo</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-slate-900">€{p.totalAmount.toLocaleString('pt-PT')}</td>
                        <td className="py-3.5 px-4 font-mono">
                          <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                            {p.dueDate} {isOverdue && '⚠️'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            p.isPaid ? 'bg-emerald-100 text-emerald-800' :
                            isOverdue ? 'bg-red-100 text-red-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {p.isPaid ? 'LIQUIDADA' : isOverdue ? 'VENCIDA' : 'A PAGAR'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {!p.isPaid ? (
                            <button
                              onClick={() => {
                                if (p.type === 'despesa') {
                                  updateExpense(p.id, { isPaid: true, paymentDate: todayStr });
                                } else {
                                  updateMaterial(p.id, { isPaid: true, paymentDate: todayStr });
                                }
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shadow-2xs"
                            >
                              Pagar
                            </button>
                          ) : (
                            <span className="text-slate-400 text-2xs font-semibold">Pago</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ABA 3: GASTOS FIXOS DA EMPRESA ==================== */}
      {financeTab === 'fixos' && (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs text-slate-600 flex items-start gap-3">
            <Landmark className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800 block text-sm">Estrutura Fixa da Empresa (Overhead)</span>
              Custos mensais de suporte à atividade que independem de obras pontuais: armazém, seguros, contabilidade, viaturas e software.
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fixedExpenses.map(f => (
                    <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{f.description}</td>
                      <td className="py-3.5 px-4 capitalize text-slate-600">{f.category.replace('_', ' ')}</td>
                      <td className="py-3.5 px-4 text-slate-700">{f.supplier}</td>
                      <td className="py-3.5 px-4 capitalize text-slate-600">{f.frequency}</td>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ABA 4: PREVISÃO DE TESOURARIA (30/60/90 DIAS) ==================== */}
      {financeTab === 'previsao' && (
        <div className="space-y-6">
          {/* Header explicativo com simulador de stress */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">Previsão de Caixa & Tesouraria (30 / 60 / 90 Dias)</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Fluxo Projetado
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Projeção automática de entradas (faturas e marcos de clientes) versus saídas (fornecedores, ordenados estimados e despesas fixas).
              </p>
            </div>

            {/* Simulador de Cenários de Stress */}
            <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <Sliders className="w-4 h-4 text-slate-500 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-slate-700 block">Simular Atraso de Clientes:</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <button
                    onClick={() => setDelayScenarioDays(0)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                      delayScenarioDays === 0 ? 'bg-sky-600 text-white shadow-2xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Datas Normais (0d)
                  </button>
                  <button
                    onClick={() => setDelayScenarioDays(15)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                      delayScenarioDays === 15 ? 'bg-amber-600 text-white shadow-2xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    +15 Dias
                  </button>
                  <button
                    onClick={() => setDelayScenarioDays(30)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                      delayScenarioDays === 30 ? 'bg-rose-600 text-white shadow-2xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    +30 Dias (Stress)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 3 CARDS DE HORIZONTE TEMPORAL: 30, 60 e 90 DIAS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 30 DIAS */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-black uppercase text-slate-600 tracking-wider">Próximos 30 Dias (Mês 1)</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  next30DaysNet >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {next30DaysNet >= 0 ? '✓ Caixa Positivo' : '⚠️ Défice Projetado'}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 block font-medium">Saldo Líquido Previsto</span>
                <span className={`text-2xl font-black block mt-0.5 ${next30DaysNet >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  €{next30DaysNet.toLocaleString('pt-PT')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Entradas Previstas</span>
                  <span className="font-bold text-emerald-600">€{next30DaysInflows.toLocaleString('pt-PT')}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Saídas Comprometidas</span>
                  <span className="font-bold text-rose-600">€{next30DaysOutflows.toLocaleString('pt-PT')}</span>
                </div>
              </div>
            </div>

            {/* 60 DIAS */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-black uppercase text-slate-600 tracking-wider">Próximos 60 Dias (Mês 2)</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  next60DaysNet >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {next60DaysNet >= 0 ? '✓ Estável' : '⚠️ Atenção'}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 block font-medium">Saldo Líquido Acumulado</span>
                <span className={`text-2xl font-black block mt-0.5 ${next60DaysNet >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  €{next60DaysNet.toLocaleString('pt-PT')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Entradas Acumuladas</span>
                  <span className="font-bold text-emerald-600">€{next60DaysInflows.toLocaleString('pt-PT')}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Saídas Acumuladas</span>
                  <span className="font-bold text-rose-600">€{next60DaysOutflows.toLocaleString('pt-PT')}</span>
                </div>
              </div>
            </div>

            {/* 90 DIAS */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-black uppercase text-slate-300 tracking-wider">Horizonte 90 Dias (Trimestre)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Previsão Estratégica
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 block font-medium">Saldo Estimado Trimestral</span>
                <span className={`text-2xl font-black block mt-0.5 ${next90DaysNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  €{next90DaysNet.toLocaleString('pt-PT')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Entradas Estimadas</span>
                  <span className="font-bold text-emerald-400">€{next90DaysInflows.toLocaleString('pt-PT')}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Saídas Estimadas</span>
                  <span className="font-bold text-rose-400">€{next90DaysOutflows.toLocaleString('pt-PT')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* TABELA DE CRONOGRAMA SEMANAL (PRÓXIMAS 8 SEMANAS) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Linha do Tempo de Tesouraria Semana a Semana</h4>
                <p className="text-xs text-slate-500">Mapeamento granular dos pagamentos e cobranças previstas por semana.</p>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-lg border border-slate-200">
                8 Semanas Projetadas
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Semana</th>
                    <th className="py-3 px-4">Período</th>
                    <th className="py-3 px-4 text-right">Entradas Previstas (€)</th>
                    <th className="py-3 px-4 text-right">Saídas Previstas (€)</th>
                    <th className="py-3 px-4 text-right">Saldo Líquido da Semana</th>
                    <th className="py-3 px-4">Origem / Destino dos Fundos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {forecastWeeks.map((week, idx) => {
                    const isPositive = week.netWeek >= 0;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          Semana #{week.weekIndex}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          {week.startStr.slice(5)} a {week.endStr.slice(5)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-emerald-600">
                          {week.totalInflows > 0 ? `+€${week.totalInflows.toLocaleString('pt-PT')}` : '€0'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-rose-600">
                          -€{week.totalOutflows.toLocaleString('pt-PT')}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black">
                          <span className={`px-2 py-0.5 rounded text-[11px] ${
                            isPositive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {isPositive ? '+' : ''}€{week.netWeek.toLocaleString('pt-PT')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[11px] text-slate-500">
                          {week.weekInvoices.length > 0 && (
                            <span className="inline-block text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded mr-1">
                              {week.weekInvoices.length} fatura(s) a cobrar
                            </span>
                          )}
                          {week.weekMilestones.length > 0 && (
                            <span className="inline-block text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded mr-1">
                              {week.weekMilestones.length} marco(s) de obra
                            </span>
                          )}
                          <span className="inline-block text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                            {week.weekPayables.length} fornecedores + fixos + equipa
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: SUBIR FATURA EMITIDA AO CLIENTE & PROGRAMAR PARCELAS */}
      {showNewInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-400" />
                Subir Fatura Emitida ao Cliente (Anexar PDF / Foto)
              </h3>
              <button onClick={() => setShowNewInvoiceModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateClientInvoice} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              {/* UPLOAD BOX */}
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center bg-slate-50/50 hover:bg-slate-50 hover:border-emerald-400 transition-all">
                <input
                  type="file"
                  id="clientInvoiceFile"
                  accept="image/*,.pdf"
                  onChange={handleClientInvoiceFileUpload}
                  className="hidden"
                />
                <label htmlFor="clientInvoiceFile" className="cursor-pointer block">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-slate-800 text-xs block">
                    {newInvoiceForm.documentName ? `✓ ${newInvoiceForm.documentName}` : 'Clique para anexar o PDF da Fatura ou Foto'}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Formatos aceites: PDF, JPG, PNG (armazenado automaticamente nos documentos da obra)
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Obra Associada *</label>
                  <select
                    value={newInvoiceForm.projectId}
                    onChange={e => {
                      const p = projects.find(proj => proj.id === e.target.value);
                      setNewInvoiceForm({ 
                        ...newInvoiceForm, 
                        projectId: e.target.value,
                        clientId: p?.clientId || newInvoiceForm.clientId 
                      });
                    }}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.id} - {p.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cliente *</label>
                  <select
                    value={newInvoiceForm.clientId}
                    onChange={e => setNewInvoiceForm({ ...newInvoiceForm, clientId: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Número / Código da Fatura *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: FT 2026/01 ou FAT-892"
                    value={newInvoiceForm.code}
                    onChange={e => setNewInvoiceForm({ ...newInvoiceForm, code: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data de Emissão *</label>
                  <input
                    type="date"
                    required
                    value={newInvoiceForm.issueDate}
                    onChange={e => setNewInvoiceForm({ ...newInvoiceForm, issueDate: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Descrição / Referência *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Sinal 30% ou 1ª Fase Obras"
                    value={newInvoiceForm.description}
                    onChange={e => setNewInvoiceForm({ ...newInvoiceForm, description: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Valor Total da Fatura (€) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newInvoiceForm.totalAmount}
                    onChange={e => handleTotalAmountChange(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* TIPO DE PAGAMENTO: PARCELA ÚNICA OU PARCELADA */}
              <div className="pt-2 border-t border-slate-200">
                <label className="block font-bold text-slate-800 mb-2">Estrutura de Pagamento da Fatura:</label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setNewInvoiceForm(prev => ({ ...prev, paymentType: 'unica' }))}
                    className={`p-2.5 rounded-xl font-bold border transition-all text-center ${
                      newInvoiceForm.paymentType === 'unica'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    1x Parcela Única
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewInvoiceForm(prev => ({ ...prev, paymentType: 'parcelada' }));
                      handleInstallmentCountChange(newInvoiceForm.installmentsCount || 2);
                    }}
                    className={`p-2.5 rounded-xl font-bold border transition-all text-center ${
                      newInvoiceForm.paymentType === 'parcelada'
                        ? 'bg-sky-50 border-sky-500 text-sky-800 ring-2 ring-sky-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Parcelado em Prazos / Etapas
                  </button>
                </div>

                {newInvoiceForm.paymentType === 'unica' ? (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Data de Vencimento *</label>
                    <input
                      type="date"
                      required
                      value={newInvoiceForm.dueDate}
                      onChange={e => setNewInvoiceForm({ ...newInvoiceForm, dueDate: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                    />
                  </div>
                ) : (
                  <div className="bg-sky-50/50 border border-sky-200 rounded-xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sky-950 text-xs">Desdobramento em Parcelas a Receber:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 text-[11px]">Nº de parcelas:</span>
                        <select
                          value={newInvoiceForm.installmentsCount}
                          onChange={e => handleInstallmentCountChange(Number(e.target.value))}
                          className="px-2 py-1 bg-white border border-slate-300 rounded font-bold text-xs"
                        >
                          <option value={2}>2x</option>
                          <option value={3}>3x</option>
                          <option value={4}>4x</option>
                          <option value={5}>5x</option>
                          <option value={6}>6x</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {newInvoiceForm.installments.map((inst, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                          <span className="w-16 font-bold text-slate-700">Parcela {inst.number}:</span>
                          <div className="flex-1">
                            <input
                              type="number"
                              step="0.01"
                              value={inst.amount}
                              onChange={e => {
                                const val = Number(e.target.value);
                                const updated = [...newInvoiceForm.installments];
                                updated[idx].amount = val;
                                setNewInvoiceForm({ ...newInvoiceForm, installments: updated });
                              }}
                              className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded font-bold text-slate-900 text-xs"
                              placeholder="Valor (€)"
                            />
                          </div>
                          <div className="flex-1">
                            <input
                              type="date"
                              value={inst.dueDate}
                              onChange={e => {
                                const updated = [...newInvoiceForm.installments];
                                updated[idx].dueDate = e.target.value;
                                setNewInvoiceForm({ ...newInvoiceForm, installments: updated });
                              }}
                              className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded font-medium text-slate-700 text-xs"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="text-[11px] text-sky-800 flex items-center justify-between pt-1">
                      <span>Soma das parcelas: <strong>€{newInvoiceForm.installments.reduce((s, i) => s + Number(i.amount || 0), 0).toLocaleString('pt-PT')}</strong></span>
                      <span>Total Fatura: <strong>€{Number(newInvoiceForm.totalAmount).toLocaleString('pt-PT')}</strong></span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2 shrink-0">
                <button type="button" onClick={() => setShowNewInvoiceModal(false)} className="px-4 py-2 text-slate-600">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Guardar Fatura & Agendar Recebimentos</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SUBIR FATURA DE FORNECEDOR */}
      {showAddSupplierInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Upload className="w-4 h-4 text-rose-400" />
                Subir Fatura de Fornecedor (Conta a Pagar)
              </h3>
              <button onClick={() => setShowAddSupplierInvoiceModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateSupplierInvoice} className="p-6 space-y-4 text-xs">
              {/* UPLOAD BOX */}
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center bg-slate-50/50 hover:bg-slate-50 hover:border-rose-400 transition-all">
                <input
                  type="file"
                  id="supplierInvoiceFile"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="supplierInvoiceFile" className="cursor-pointer block">
                  <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-slate-800 text-xs block">
                    {supplierInvoiceForm.documentName ? `✓ ${supplierInvoiceForm.documentName}` : 'Clique para anexar Fatura PDF / Foto do Recibo'}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Formatos aceites: PDF, JPG, PNG
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fornecedor / Entidade *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Leroy Merlin, Saint-Gobain"
                    value={supplierInvoiceForm.supplier}
                    onChange={e => setSupplierInvoiceForm({ ...supplierInvoiceForm, supplier: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Obra Relacionada</label>
                  <select
                    value={supplierInvoiceForm.projectId}
                    onChange={e => setSupplierInvoiceForm({ ...supplierInvoiceForm, projectId: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  >
                    <option value="">Geral PRIME (Sem Obra Específica)</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.id} - {p.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descrição do Material / Serviço *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cimento, tijolos e perfis metálicos"
                  value={supplierInvoiceForm.description}
                  onChange={e => setSupplierInvoiceForm({ ...supplierInvoiceForm, description: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Valor a Pagar (€) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={supplierInvoiceForm.baseAmount}
                    onChange={e => setSupplierInvoiceForm({ ...supplierInvoiceForm, baseAmount: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data de Vencimento *</label>
                  <input
                    type="date"
                    required
                    value={supplierInvoiceForm.dueDate}
                    onChange={e => setSupplierInvoiceForm({ ...supplierInvoiceForm, dueDate: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddSupplierInvoiceModal(false)} className="px-4 py-2 text-slate-600">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-xs">
                  Registar Conta a Pagar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: REGISTAR RECEBIMENTO DE CLIENTE */}
      {selectedInvoiceForPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                Registar Recebimento da Fatura {selectedInvoiceForPayment.code}
              </h3>
              <button onClick={() => setSelectedInvoiceForPayment(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Valor Total da Fatura</span>
                <span className="text-lg font-black text-slate-900">€{selectedInvoiceForPayment.totalAmount.toLocaleString('pt-PT')}</span>
                <span className="text-slate-500 block text-[11px] mt-1">
                  Já recebido: €{selectedInvoiceForPayment.receivedAmount.toLocaleString('pt-PT')} | 
                  Pendente: €{(selectedInvoiceForPayment.totalAmount - selectedInvoiceForPayment.receivedAmount).toLocaleString('pt-PT')}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Valor Recebido (€) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentForm.amount}
                  onChange={e => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-emerald-700 text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Método de Pagamento</label>
                <select
                  value={paymentForm.method}
                  onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value as any })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="transferencia">Transferência Bancária</option>
                  <option value="multibanco">Referência Multibanco</option>
                  <option value="mbway">MB Way</option>
                  <option value="cheque">Cheque</option>
                  <option value="dinheiro">Numerário / Dinheiro</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Banco / Referência</label>
                <input
                  type="text"
                  placeholder="Ex: Millennium BCP / Comprovativo nº 987654"
                  value={paymentForm.reference}
                  onChange={e => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button type="button" onClick={() => setSelectedInvoiceForPayment(null)} className="px-4 py-2 text-slate-600">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs">
                  Confirmar Recebimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: VER COMPROVATIVO */}
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
                <img src={previewDocument.url} alt="Fatura Anexa" className="max-w-full rounded-lg shadow-sm max-h-[65vh] object-contain" />
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-slate-400 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-700">Fatura em formato PDF anexada</p>
                  <a
                    href={previewDocument.url}
                    download="fatura-anexa.pdf"
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

      {/* MODAL 5: IMPRESSÃO / PDF DA FATURA */}
      {selectedInvoiceForPrint && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden print:p-0 print:shadow-none animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <span className="font-bold text-sm">Fatura {selectedInvoiceForPrint.code}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimir
                </button>
                <button onClick={() => setSelectedInvoiceForPrint(null)} className="text-slate-400 hover:text-white p-1">
                  ✕
                </button>
              </div>
            </div>

            {/* Layout da Fatura Formatada */}
            <div className="p-8 space-y-6 text-xs text-slate-700 bg-white">
              <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-black">P</div>
                    <span className="font-black text-lg text-slate-900 tracking-tight">PRIME REFORMAS</span>
                  </div>
                  <p className="text-slate-500 mt-1">PRIME ENGENHARIA & REMODELAÇÕES LDA</p>
                  <p className="text-slate-500">NIF: 516 982 341 • Av. da Liberdade 120, Lisboa</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">FATURA PROFORMA</span>
                  <span className="text-xl font-mono font-black text-slate-900 block mt-0.5">{selectedInvoiceForPrint.code}</span>
                  <span className="text-slate-500 text-[11px] block mt-1">Data: {selectedInvoiceForPrint.issueDate}</span>
                  <span className="text-slate-500 text-[11px] block">Vencimento: {selectedInvoiceForPrint.dueDate}</span>
                </div>
              </div>

              {/* Cliente */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Dados do Cliente</span>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  {clients.find(c => c.id === selectedInvoiceForPrint.clientId)?.name}
                </p>
                <p className="text-slate-600 mt-0.5">
                  Morada: {clients.find(c => c.id === selectedInvoiceForPrint.clientId)?.address}, {clients.find(c => c.id === selectedInvoiceForPrint.clientId)?.city}
                </p>
                <p className="text-slate-600">
                  NIF: {clients.find(c => c.id === selectedInvoiceForPrint.clientId)?.nif || 'Consumidor Final'}
                </p>
              </div>

              {/* Itens */}
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-slate-400 uppercase text-[10px]">
                    <th className="py-2">Descrição</th>
                    <th className="py-2 text-right">Qtd</th>
                    <th className="py-2 text-right">Preço Unit.</th>
                    <th className="py-2 text-right">IVA</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedInvoiceForPrint.items?.map(it => (
                    <tr key={it.id}>
                      <td className="py-3 font-medium text-slate-800">{it.description}</td>
                      <td className="py-3 text-right text-slate-600">{it.quantity}</td>
                      <td className="py-3 text-right text-slate-600">€{it.unitPrice.toLocaleString('pt-PT')}</td>
                      <td className="py-3 text-right text-slate-600">{it.vatRate}%</td>
                      <td className="py-3 text-right font-bold text-slate-900">€{it.total.toLocaleString('pt-PT')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totais */}
              <div className="border-t border-slate-200 pt-4 flex justify-end">
                <div className="w-64 space-y-1.5 text-right">
                  <div className="flex justify-between text-slate-500">
                    <span>Base Tributável:</span>
                    <span>€{selectedInvoiceForPrint.baseAmount.toLocaleString('pt-PT')}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>IVA (23%):</span>
                    <span>€{selectedInvoiceForPrint.vatAmount.toLocaleString('pt-PT')}</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                    <span>Total a Pagar:</span>
                    <span>€{selectedInvoiceForPrint.totalAmount.toLocaleString('pt-PT')}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-emerald-600 pt-1">
                    <span>Já Liquidado:</span>
                    <span>€{selectedInvoiceForPrint.receivedAmount.toLocaleString('pt-PT')}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-amber-600">
                    <span>Saldo Pendente:</span>
                    <span>€{(selectedInvoiceForPrint.totalAmount - selectedInvoiceForPrint.receivedAmount).toLocaleString('pt-PT')}</span>
                  </div>
                </div>
              </div>

              {/* Dados Bancários */}
              <div className="p-4 bg-sky-50 rounded-xl border border-sky-100 text-[11px] text-sky-900 space-y-1">
                <p className="font-bold">Coordenadas Bancárias para Liquidação:</p>
                <p>Banco: Millennium BCP • Titular: PRIME Engenharia & Remodelações Lda</p>
                <p className="font-mono font-bold">IBAN: PT50 0033 0000 4523 8912 0014 5</p>
                <p>Por favor indique o código da fatura ({selectedInvoiceForPrint.code}) no descritivo da transferência.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL DE COBRANÇA VIA WHATSAPP ==================== */}
      {selectedInvoiceForWhatsApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 bg-emerald-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Disparador de Cobrança via WhatsApp</h3>
                  <p className="text-[11px] text-emerald-200">Envio direto de mensagem profissional pré-formatada</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedInvoiceForWhatsApp(null)} 
                className="text-emerald-200 hover:text-white p-1 rounded hover:bg-emerald-700 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Info da Fatura */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block text-sm">{selectedInvoiceForWhatsApp.code} • {selectedInvoiceForWhatsApp.description}</span>
                  <span className="text-slate-500 text-[11px]">Obra: {selectedInvoiceForWhatsApp.projectId} • Vencimento: {selectedInvoiceForWhatsApp.dueDate}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Valor a Cobrar</span>
                  <span className="font-black text-emerald-600 text-base">
                    €{(selectedInvoiceForWhatsApp.totalAmount - selectedInvoiceForWhatsApp.receivedAmount).toLocaleString('pt-PT')}
                  </span>
                </div>
              </div>

              {/* Seletor de Modelo de Mensagem */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Escolher Modelo de Notificação:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setWhatsAppMessageType('emissao');
                      const client = clients.find(c => c.id === selectedInvoiceForWhatsApp.clientId);
                      const proj = projects.find(p => p.id === selectedInvoiceForWhatsApp.projectId);
                      updateWhatsAppText('emissao', selectedInvoiceForWhatsApp, client?.name || 'Cliente', proj?.title || 'Obra PRIME', selectedInvoiceForWhatsApp.totalAmount - selectedInvoiceForWhatsApp.receivedAmount);
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      whatsAppMessageType === 'emissao'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block text-[11px]">🟢 Conclusão / Emissão</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Notificação normal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setWhatsAppMessageType('vencimento');
                      const client = clients.find(c => c.id === selectedInvoiceForWhatsApp.clientId);
                      const proj = projects.find(p => p.id === selectedInvoiceForWhatsApp.projectId);
                      updateWhatsAppText('vencimento', selectedInvoiceForWhatsApp, client?.name || 'Cliente', proj?.title || 'Obra PRIME', selectedInvoiceForWhatsApp.totalAmount - selectedInvoiceForWhatsApp.receivedAmount);
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      whatsAppMessageType === 'vencimento'
                        ? 'bg-amber-50 border-amber-500 text-amber-900 font-bold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block text-[11px]">🟡 Lembrete Vencimento</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Próximo da data</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setWhatsAppMessageType('atraso');
                      const client = clients.find(c => c.id === selectedInvoiceForWhatsApp.clientId);
                      const proj = projects.find(p => p.id === selectedInvoiceForWhatsApp.projectId);
                      updateWhatsAppText('atraso', selectedInvoiceForWhatsApp, client?.name || 'Cliente', proj?.title || 'Obra PRIME', selectedInvoiceForWhatsApp.totalAmount - selectedInvoiceForWhatsApp.receivedAmount);
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      whatsAppMessageType === 'atraso'
                        ? 'bg-rose-50 border-rose-500 text-rose-900 font-bold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block text-[11px]">🔴 Aviso de Atraso</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Cobrança firme</span>
                  </button>
                </div>
              </div>

              {/* Telemóvel */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Telemóvel do Destinatário (com indicativo):</label>
                <input
                  type="text"
                  value={whatsAppPhone}
                  onChange={e => setWhatsAppPhone(e.target.value)}
                  placeholder="+351 912 345 678"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                />
              </div>

              {/* Mensagem Formatada */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Mensagem que será enviada (editável):</label>
                  <button
                    type="button"
                    onClick={handleCopyWhatsAppText}
                    className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    {copiedSuccess ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSuccess ? 'Copiado!' : 'Copiar Texto'}</span>
                  </button>
                </div>
                <textarea
                  rows={8}
                  value={whatsAppMessage}
                  onChange={e => setWhatsAppMessage(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono leading-relaxed focus:bg-white transition-colors"
                />
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedInvoiceForWhatsApp(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition-all hover:scale-[1.02]"
                >
                  <Send className="w-4 h-4" />
                  <span>Abrir no WhatsApp Web / Telemóvel</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
