import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { GanttView } from '../gantt/GanttView';
import { 
  Building2, ArrowLeft, Calendar, User, MapPin, CheckCircle2, 
  Clock, DollarSign, TrendingUp, AlertTriangle, Plus, FileText, 
  Package, Receipt, ShieldCheck, Flag, CheckSquare, Sparkles, 
  Trash2, Image, UploadCloud, ChevronRight, Eye, Users2,
  HardHat, Wallet, CreditCard, Camera, Edit3, MessageCircle, Check
} from 'lucide-react';

interface Props {
  projectId: string;
  onBack: () => void;
}

export const ProjectDetail: React.FC<Props> = ({ projectId, onBack }) => {
  const { 
    projects, clients, stages, employees, shifts, materials, 
    expenses, invoices, payments, milestones, changeOrders, 
    dailyLogs, photos, documents, auditLogs, 
    getProjectFinancialSummary, updateProject, updateStage, 
    toggleSubtask, addStage, addShift, updateShiftStatus, 
    addMaterial, addExpense, createInvoice, recordPayment, 
    addChangeOrder, approveChangeOrder, rejectChangeOrder, 
    addDailyLog, addPhoto 
  } = useApp();

  const project = projects.find(p => p.id === projectId);
  const client = clients.find(c => c.id === project?.clientId);

  const [activeTab, setActiveInternalTab] = useState<
    'resumo' | 'plano' | 'cronograma' | 'equipa' | 'diarias' | 
    'materiais' | 'gastos' | 'financeiro' | 'faturas' | 'pagamentos' | 
    'alteracoes' | 'diario' | 'fotos' | 'historico'
  >('resumo');

  // Modals state
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [projectEditForm, setProjectEditForm] = useState({
    title: '',
    clientId: '',
    serviceType: '',
    city: 'Barcelona',
    address: '',
    managerId: '',
    startDate: '',
    plannedEndDate: '',
    contractValue: 0,
    status: 'em_execucao' as any,
    notes: ''
  });

  const handleOpenEditProject = () => {
    if (!project) return;
    setProjectEditForm({
      title: project.title || '',
      clientId: project.clientId || '',
      serviceType: project.serviceType || 'Reforma integral',
      city: project.city || 'Barcelona',
      address: project.address || '',
      managerId: project.managerId || 'Ricardo Silva',
      startDate: project.startDate || '',
      plannedEndDate: project.plannedEndDate || '',
      contractValue: project.contractValue || 0,
      status: project.status || 'em_execucao',
      notes: project.notes || ''
    });
    setShowEditProjectModal(true);
  };

  const handleSaveProjectEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    updateProject(project.id, {
      title: projectEditForm.title.trim(),
      clientId: projectEditForm.clientId,
      serviceType: projectEditForm.serviceType,
      city: projectEditForm.city.trim() || 'Barcelona',
      address: projectEditForm.address.trim(),
      managerId: projectEditForm.managerId,
      startDate: projectEditForm.startDate,
      plannedEndDate: projectEditForm.plannedEndDate,
      contractValue: Number(projectEditForm.contractValue) || 0,
      status: projectEditForm.status,
      notes: projectEditForm.notes.trim()
    });
    setShowEditProjectModal(false);
  };

  const [showAddShiftModal, setShowAddShiftModal] = useState(false);
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showAddChangeOrderModal, setShowAddChangeOrderModal] = useState(false);
  const [showAddDailyLogModal, setShowAddDailyLogModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const photoInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handleUploadProjectPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !project) return;

    setIsUploadingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const rawData = event.target?.result as string;
        const img = new window.Image();
        img.src = rawData;
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const maxDim = 1280;
          let width = img.width;
          let height = img.height;
          if (width > height && width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);

          let photoUrl = compressedDataUrl;
          try {
            const res = await fetch('/api/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fileName: file.name || 'foto_obra.jpg',
                fileData: compressedDataUrl
              })
            });
            const resData = await res.json();
            if (resData.url) photoUrl = resData.url;
          } catch (err) {
            console.warn('Upload server error, fallback to data-url:', err);
          }

          addPhoto({
            projectId: project.id,
            date: new Date().toISOString().slice(0, 10),
            url: photoUrl,
            caption: file.name.replace(/\.[^/.]+$/, "") || 'Fotografia da Obra',
            category: 'execucao'
          });
          setIsUploadingPhoto(false);
        };
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setIsUploadingPhoto(false);
      alert('Erro ao carregar fotografia');
    }
  };

  // Forms states
  const [shiftForm, setShiftForm] = useState<{
    employeeId: string;
    date: string;
    type: 'diaria' | 'meia_diaria' | 'horas';
    hours: number;
    rate: number;
    notes: string;
  }>({
    employeeId: employees[0]?.id || '',
    date: new Date().toISOString().slice(0, 10),
    type: 'diaria',
    hours: 8,
    rate: 90,
    notes: ''
  });

  const [materialForm, setMaterialForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    supplier: 'Leroy Merlin',
    category: 'Cimento & Argamassas',
    description: '',
    baseAmount: 100,
    vatRate: 23,
    invoiceNumber: '',
    isPaid: true
  });

  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    supplier: 'Entulhos Lisboa',
    category: 'contentores' as const,
    description: '',
    baseAmount: 150,
    vatAmount: 34.5,
    totalAmount: 184.5,
    dueDate: new Date().toISOString().slice(0, 10),
    isPaid: true
  });

  const [changeOrderForm, setChangeOrderForm] = useState({
    description: '',
    additionalAmount: 1000,
    estimatedCost: 400,
    additionalDays: 1,
    notes: ''
  });

  const [dailyLogForm, setDailyLogForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    weather: 'Sol, 22°C',
    workersPresent: ['Gustavo Lima', 'Leo Carvalho'],
    workDone: '',
    issues: '',
    materialsNeeded: ''
  });

  if (!project) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Obra não encontrada.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-sky-600 text-white rounded-lg">Voltar</button>
      </div>
    );
  }

  const summary = getProjectFinancialSummary(project.id);
  const projectStages = stages.filter(s => s.projectId === project.id).sort((a, b) => a.order - b.order);
  const projectShifts = shifts.filter(s => s.projectId === project.id);
  const projectMaterials = materials.filter(m => m.projectId === project.id);
  const projectExpenses = expenses.filter(e => e.projectId === project.id);
  const projectInvoices = invoices.filter(i => i.projectId === project.id);
  const projectPayments = payments.filter(p => p.projectId === project.id);
  const projectMilestones = milestones.filter(m => m.projectId === project.id);
  const projectChangeOrders = changeOrders.filter(co => co.projectId === project.id);
  const projectDailyLogs = dailyLogs.filter(d => d.projectId === project.id);
  const projectPhotos = photos.filter(p => p.projectId === project.id);
  const projectAudit = auditLogs.filter(a => a.entityId === project.id || projectStages.some(s => s.id === a.entityId));

  // Consolidated financial balances
  const paidLabor = projectShifts.filter(s => s.status === 'paga').reduce((acc, s) => acc + s.totalValue, 0);
  const pendingLabor = projectShifts.filter(s => s.status !== 'paga').reduce((acc, s) => acc + s.totalValue, 0);

  const paidMaterials = projectMaterials.filter(m => m.isPaid).reduce((acc, m) => acc + m.totalAmount, 0);
  const pendingMaterials = projectMaterials.filter(m => !m.isPaid).reduce((acc, m) => acc + m.totalAmount, 0);

  const paidExpenses = projectExpenses.filter(e => e.isPaid).reduce((acc, e) => acc + e.totalAmount, 0);
  const pendingExpenses = projectExpenses.filter(e => !e.isPaid).reduce((acc, e) => acc + e.totalAmount, 0);

  const totalDisbursed = paidLabor + paidMaterials + paidExpenses;
  const cashTreasuryBalance = summary.totalReceived - totalDisbursed;

  // Dedicated workers analysis for this specific project
  const projectWorkersSummary = employees.map(emp => {
    const empShifts = projectShifts.filter(s => s.employeeId === emp.id);
    if (empShifts.length === 0) return null;

    const daysCount = empShifts.filter(s => s.type === 'diaria').length + (empShifts.filter(s => s.type === 'meia_diaria').length * 0.5);
    const hoursCount = empShifts.reduce((acc, s) => acc + (s.hours || (s.type === 'diaria' ? 8 : (s.type === 'meia_diaria' ? 4 : 0))), 0);
    const totalEarned = empShifts.reduce((acc, s) => acc + s.totalValue, 0);
    const totalPaid = empShifts.filter(s => s.status === 'paga').reduce((acc, s) => acc + s.totalValue, 0);
    const pendingPayment = empShifts.filter(s => s.status !== 'paga').reduce((acc, s) => acc + s.totalValue, 0);
    const dates = empShifts.map(s => s.date).sort();
    const lastDate = dates[dates.length - 1];
    const pendingShifts = empShifts.filter(s => s.status !== 'paga');

    return {
      employee: emp,
      shiftsCount: empShifts.length,
      daysCount,
      hoursCount,
      totalEarned,
      totalPaid,
      pendingPayment,
      lastDate,
      pendingShifts
    };
  }).filter(Boolean) as {
    employee: typeof employees[0];
    shiftsCount: number;
    daysCount: number;
    hoursCount: number;
    totalEarned: number;
    totalPaid: number;
    pendingPayment: number;
    lastDate: string;
    pendingShifts: typeof projectShifts;
  }[];

  const handlePayWorkerPendingShifts = (workerShifts: typeof projectShifts) => {
    const today = new Date().toISOString().slice(0, 10);
    workerShifts.forEach(shift => {
      updateShiftStatus(shift.id, 'paga', { method: 'Transferência Bancária', date: today });
    });
  };

  // Handlers
  const handleAddShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === shiftForm.employeeId);
    const rate = shiftForm.type === 'diaria' ? (emp?.dailyRate || 90) : (shiftForm.type === 'meia_diaria' ? (emp?.halfDayRate || 50) : (emp?.hourlyRate || 12));
    const totalValue = shiftForm.type === 'horas' ? rate * shiftForm.hours : rate;

    addShift({
      projectId: project.id,
      employeeId: shiftForm.employeeId,
      date: shiftForm.date,
      type: shiftForm.type,
      hours: shiftForm.hours,
      rate,
      totalValue,
      status: 'aprovada', // Automatically approved by manager when added here
      notes: shiftForm.notes
    });
    setShowAddShiftModal(false);
  };

  const handleAddMaterialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vat = materialForm.baseAmount * (materialForm.vatRate / 100);
    addMaterial({
      projectId: project.id,
      date: materialForm.date,
      supplier: materialForm.supplier,
      category: materialForm.category,
      description: materialForm.description,
      baseAmount: Number(materialForm.baseAmount),
      vatRate: Number(materialForm.vatRate),
      vatAmount: vat,
      totalAmount: Number(materialForm.baseAmount) + vat,
      invoiceNumber: materialForm.invoiceNumber,
      isPaid: materialForm.isPaid,
      paymentMethod: 'Cartão da Empresa'
    });
    setShowAddMaterialModal(false);
  };

  const handleAddChangeOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addChangeOrder({
      projectId: project.id,
      description: changeOrderForm.description,
      additionalAmount: Number(changeOrderForm.additionalAmount),
      estimatedCost: Number(changeOrderForm.estimatedCost),
      additionalDays: Number(changeOrderForm.additionalDays),
      requestDate: new Date().toISOString().slice(0, 10),
      status: 'aguardando_aprovacao',
      notes: changeOrderForm.notes
    });
    setShowAddChangeOrderModal(false);
  };

  const handleAddDailyLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addDailyLog({
      projectId: project.id,
      date: dailyLogForm.date,
      weather: dailyLogForm.weather,
      workersPresent: dailyLogForm.workersPresent,
      workDone: dailyLogForm.workDone,
      issues: dailyLogForm.issues,
      materialsNeeded: dailyLogForm.materialsNeeded,
      author: 'Ricardo Silva'
    });
    setShowAddDailyLogModal(false);
  };

  const tabs = [
    { id: 'resumo', label: 'Visão Geral' },
    { id: 'plano', label: `Plano de Obra (${projectStages.length})` },
    { id: 'cronograma', label: 'Cronograma Gantt' },
    { id: 'diarias', label: `Diárias (€${Math.round(summary.laborCost)})` },
    { id: 'materiais', label: `Materiais (€${Math.round(summary.materialCost)})` },
    { id: 'gastos', label: `Outros Gastos (€${Math.round(summary.otherCost)})` },
    { id: 'financeiro', label: 'Cobranças & Marcos' },
    { id: 'faturas', label: `Faturas (${projectInvoices.length})` },
    { id: 'pagamentos', label: `Pagamentos (€${Math.round(summary.totalReceived)})` },
    { id: 'alteracoes', label: `Extras & Aditivos (${projectChangeOrders.length})` },
    { id: 'diario', label: `Diário da Obra (${projectDailyLogs.length})` },
    { id: 'fotos', label: `Fotos & Docs (${projectPhotos.length})` },
    { id: 'historico', label: 'Histórico' },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Back navigation & Quick status */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-sky-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Lista de Obras</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Status da Obra:</span>
          <select
            value={project.status}
            onChange={e => updateProject(project.id, { status: e.target.value as any })}
            className="text-xs font-bold px-3 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs text-slate-800"
          >
            <option value="nao_iniciada">Não Iniciada</option>
            <option value="agendada">Agendada</option>
            <option value="em_execucao">Em Execução</option>
            <option value="pausada">Pausada</option>
            <option value="concluida">Concluída</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
      </div>

      {/* CENTRAL DA OBRA: HEADER PREMIUM */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center text-white font-black text-xl shadow-md shrink-0">
              OB
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{project.title}</h1>
                <span className="font-mono text-xs font-black text-sky-700 bg-sky-100 border border-sky-200 px-2 py-0.5 rounded">
                  {project.id}
                </span>
                <button
                  onClick={handleOpenEditProject}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold flex items-center gap-1 transition-all shadow-2xs hover:scale-102 cursor-pointer ml-1"
                  title="Editar informações e planeamento da obra"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                  <span>Editar Obra</span>
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-slate-500 mt-1.5">
                <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{client?.name || 'Cliente'} ({client?.id || 'Sem código'})</span>
                  {client?.phone && client.phone.replace(/[^0-9]/g, '').length >= 6 && (
                    <a
                      href={`https://wa.me/${client.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded text-[10px] font-bold transition-all shadow-2xs ml-0.5"
                      title="Abrir WhatsApp do Cliente"
                    >
                      <MessageCircle className="w-2.5 h-2.5 text-emerald-600" />
                      <span>{client.phone}</span>
                    </a>
                  )}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {project.address} ({project.city || 'Barcelona'})
                </span>
                <span>•</span>
                <span>Gestor: <strong>{project.managerId}</strong></span>
                <span>•</span>
                <span>Prazo: {project.startDate} a {project.plannedEndDate}</span>
              </div>
            </div>
          </div>

          {/* Progress Bar & Quick Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
            <div className="w-44 text-right">
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-500">Progresso</span>
                <span className="text-sky-700">{project.progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full bg-sky-600 rounded-full transition-all duration-500"
                  style={{ width: `${project.progressPercent}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddShiftModal(true)}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
              >
                <Clock className="w-3.5 h-3.5 text-orange-400" />
                <span>+ Diária</span>
              </button>
              <button
                onClick={() => setShowAddMaterialModal(true)}
                className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
              >
                <Package className="w-3.5 h-3.5" />
                <span>+ Material</span>
              </button>
            </div>
          </div>
        </div>

        {/* 10 CARDS PRINCIPAIS: RESUMO FINANCEIRO E DE PRAZOS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Contrato Base</span>
            <span className="text-base font-bold text-slate-900 block mt-0.5">
              €{project.contractValue.toLocaleString('pt-PT')}
            </span>
            <span className="text-[10px] text-emerald-600 font-medium">
              Extras: +€{summary.extrasApproved.toLocaleString('pt-PT')}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Valor Total Obra</span>
            <span className="text-base font-extrabold text-slate-900 block mt-0.5">
              €{summary.totalContractValue.toLocaleString('pt-PT')}
            </span>
            <span className="text-[10px] text-slate-500">Base + Extras Aprovados</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Faturado</span>
            <span className="text-base font-bold text-sky-700 block mt-0.5">
              €{summary.totalBilled.toLocaleString('pt-PT')}
            </span>
            <span className="text-[10px] text-slate-500">
              {((summary.totalBilled / (summary.totalContractValue || 1)) * 100).toFixed(0)}% do contrato
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Recebido</span>
            <span className="text-base font-bold text-emerald-600 block mt-0.5">
              €{summary.totalReceived.toLocaleString('pt-PT')}
            </span>
            <span className="text-[10px] text-slate-500">
              A Receber: €{Math.round(summary.balanceReceivable).toLocaleString('pt-PT')}
            </span>
          </div>

          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xs">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Margem Realizada</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {Math.round(summary.marginPercent)}%
              </span>
            </div>
            <span className="text-base font-black text-emerald-400 block mt-0.5">
              €{Math.round(summary.marginAmount).toLocaleString('pt-PT')}
            </span>
            <span className="text-[10px] text-slate-400">
              Custo Total: €{Math.round(summary.totalCost).toLocaleString('pt-PT')}
            </span>
          </div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="bg-white rounded-xl border border-slate-200 p-1.5 shadow-2xs overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveInternalTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB CONTENT AREA */}
      <div className="space-y-6">
        {/* 1. VISÃO GERAL / RESUMO */}
        {activeTab === 'resumo' && (
          <div className="space-y-6">
            {/* QUADRO DE BALANÇO FINANCEIRO EXECUTIVO */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. ENTRADAS & CLIENTE */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Entradas & Cliente</h4>
                      <p className="text-[10px] text-slate-400">Faturação e Cobrança</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                    Contrato: €{summary.totalContractValue.toLocaleString('pt-PT')}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Faturado:</span>
                    <span className="font-bold text-slate-900">€{summary.totalBilled.toLocaleString('pt-PT')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Recebido em Conta:</span>
                    <span className="font-extrabold text-emerald-600">€{summary.totalReceived.toLocaleString('pt-PT')}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-100">
                    <span className="text-slate-600 font-medium">Pendente de Receber:</span>
                    <span className={`font-bold ${summary.balanceReceivable > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                      €{Math.round(summary.balanceReceivable).toLocaleString('pt-PT')}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="pt-1">
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>Taxa de Cobrança</span>
                    <span className="font-bold">{((summary.totalReceived / (summary.totalContractValue || 1)) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all" 
                      style={{ width: `${Math.min(100, (summary.totalReceived / (summary.totalContractValue || 1)) * 100)}%` }} 
                    />
                  </div>
                </div>
              </div>

              {/* 2. MÃO DE OBRA (EQUIPA) */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center">
                      <HardHat className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Mão de Obra</h4>
                      <p className="text-[10px] text-slate-400">{projectWorkersSummary.length} trabalhadores alocados</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                    {projectShifts.length} registos
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Custo Total Acumulado:</span>
                    <span className="font-bold text-slate-900">€{Math.round(summary.laborCost).toLocaleString('pt-PT')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Liquidado / Pago:</span>
                    <span className="font-extrabold text-emerald-600">€{Math.round(paidLabor).toLocaleString('pt-PT')}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-100">
                    <span className="text-slate-600 font-medium">Pendente a Pagar:</span>
                    <span className={`font-bold ${pendingLabor > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      €{Math.round(pendingLabor).toLocaleString('pt-PT')}
                    </span>
                  </div>
                </div>

                {/* Status alert */}
                <div className="pt-1">
                  {pendingLabor > 0 ? (
                    <div className="flex items-center gap-1.5 text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-1 rounded-md border border-amber-200/60">
                      <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>Existem diárias pendentes de liquidação</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200/60">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>Mão de obra 100% regularizada</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. MATERIAIS & COMPRAS */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Materiais & Compras</h4>
                      <p className="text-[10px] text-slate-400">{projectMaterials.length} faturas/guias</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                    Materiais
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Materiais:</span>
                    <span className="font-bold text-slate-900">€{Math.round(summary.materialCost).toLocaleString('pt-PT')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pago a Fornecedores:</span>
                    <span className="font-extrabold text-emerald-600">€{Math.round(paidMaterials).toLocaleString('pt-PT')}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-100">
                    <span className="text-slate-600 font-medium">Pendente Fornecedores:</span>
                    <span className={`font-bold ${pendingMaterials > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      €{Math.round(pendingMaterials).toLocaleString('pt-PT')}
                    </span>
                  </div>
                </div>

                {/* Other direct costs */}
                <div className="pt-1">
                  <div className="flex justify-between text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-200/60">
                    <span>Outros Gastos Diretos:</span>
                    <span className="font-bold text-slate-800">€{Math.round(summary.otherCost).toLocaleString('pt-PT')}</span>
                  </div>
                </div>
              </div>

              {/* 4. BENEFÍCIO & TESOURARIA */}
              <div className="bg-slate-900 text-white p-4 rounded-xl shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Benefício & Caixa</h4>
                      <p className="text-[10px] text-slate-400">Resultado Operacional</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {Math.round(summary.marginPercent)}% Margem
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Benefício Bruto Contratual:</span>
                    <span className="font-black text-emerald-400">€{Math.round(summary.marginAmount).toLocaleString('pt-PT')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Custos Totais da Obra:</span>
                    <span className="font-bold text-slate-200">€{Math.round(summary.totalCost).toLocaleString('pt-PT')}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-800">
                    <span className="text-slate-300 font-medium">Saldo de Caixa Real:</span>
                    <span className={`font-black ${cashTreasuryBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      €{Math.round(cashTreasuryBalance).toLocaleString('pt-PT')}
                    </span>
                  </div>
                </div>

                <div className="pt-1">
                  <div className="p-1.5 rounded bg-slate-800 text-[10px] text-slate-300 flex items-center justify-between">
                    <span>Rentabilidade:</span>
                    <span className="font-bold text-emerald-400">
                      {summary.marginPercent >= 30 ? 'Alta / Saudável' : (summary.marginPercent >= 15 ? 'Moderada' : 'Baixa')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* TABELA DEDICADA DE TRABALHADORES DA OBRA */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
                    <Users2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Equipa & Trabalhadores Alocados a Esta Obra
                    </h3>
                    <p className="text-xs text-slate-500">
                      Consolidação de operacionais que trabalharam nesta obra, diárias acumuladas, valores gerados e saldos pendentes a liquidar.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveInternalTab('diarias')}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>Ver Diárias Detalhadas</span>
                  </button>
                  <button
                    onClick={() => setShowAddShiftModal(true)}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Registar Diária</span>
                  </button>
                </div>
              </div>

              {projectWorkersSummary.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <HardHat className="w-6 h-6" />
                  </div>
                  <div className="max-w-sm mx-auto">
                    <p className="text-xs font-bold text-slate-700">Nenhum trabalhador registou diárias nesta obra ainda</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Lance as presenças da equipa para apurar os custos reais de mão de obra e deduzir na margem do projeto.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddShiftModal(true)}
                    className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Registar Primeira Diária</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200/80">
                      <tr>
                        <th className="py-3 px-4">Profissional</th>
                        <th className="py-3 px-3">Função / Cargo</th>
                        <th className="py-3 px-3 text-center">Presenças</th>
                        <th className="py-3 px-3 text-right">Taxa Base</th>
                        <th className="py-3 px-3 text-right">Total Gerado</th>
                        <th className="py-3 px-3 text-right">Pago</th>
                        <th className="py-3 px-3 text-right">Pendente a Pagar</th>
                        <th className="py-3 px-3 text-center">Último Registo</th>
                        <th className="py-3 px-4 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {projectWorkersSummary.map(item => {
                        const hasPending = item.pendingPayment > 0;

                        return (
                          <tr key={item.employee.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-xs shrink-0">
                                  {item.employee.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                                </div>
                                <div className="min-w-0">
                                  <span className="font-bold text-slate-900 block truncate">{item.employee.name}</span>
                                  <span className="text-[10px] text-slate-400 block">{item.employee.phone}</span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                {item.employee.role}
                              </span>
                            </td>

                            <td className="py-3 px-3 text-center font-medium">
                              <div className="inline-block text-center">
                                <span className="font-bold text-slate-800">{item.daysCount} dias</span>
                                <span className="block text-[10px] text-slate-400">({item.hoursCount}h • {item.shiftsCount} reg.)</span>
                              </div>
                            </td>

                            <td className="py-3 px-3 text-right text-slate-600 font-medium">
                              €{item.employee.dailyRate}/dia
                            </td>

                            <td className="py-3 px-3 text-right font-bold text-slate-900">
                              €{item.totalEarned.toLocaleString('pt-PT')}
                            </td>

                            <td className="py-3 px-3 text-right font-bold text-emerald-600">
                              €{item.totalPaid.toLocaleString('pt-PT')}
                            </td>

                            <td className="py-3 px-3 text-right">
                              {hasPending ? (
                                <span className="inline-block px-2 py-0.5 rounded font-extrabold text-[11px] bg-amber-100 text-amber-900 border border-amber-200">
                                  €{item.pendingPayment.toLocaleString('pt-PT')}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>Regularizado</span>
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-3 text-center text-slate-500 text-[11px]">
                              {item.lastDate}
                            </td>

                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {hasPending ? (
                                  <button
                                    onClick={() => handlePayWorkerPendingShifts(item.pendingShifts)}
                                    title="Liquidar todas as diárias pendentes deste profissional nesta obra"
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold transition-colors flex items-center gap-1 shadow-2xs"
                                  >
                                    <CreditCard className="w-3 h-3" />
                                    <span>Liquidar €{item.pendingPayment}</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setShiftForm(prev => ({ ...prev, employeeId: item.employee.id }));
                                      setShowAddShiftModal(true);
                                    }}
                                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition-colors"
                                  >
                                    + Nova Diária
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* SEGUNDA LINHA: ETAPAS EM ANDAMENTO & MARCOS FINANCEIROS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Etapas do Plano de Obra */}
              <div className="prime-card p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Etapas do Plano de Obra</h3>
                    <p className="text-xs text-slate-400">Progresso físico consolidado por fase</p>
                  </div>
                  <button
                    onClick={() => setActiveInternalTab('plano')}
                    className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                  >
                    <span>Ver Plano Completo</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <div className="space-y-2.5">
                  {projectStages.map(stage => (
                    <div key={stage.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold text-slate-400">#{stage.order}</span>
                          <span className="font-bold text-slate-800 truncate">{stage.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">{stage.category} • {stage.plannedStart.slice(5)} a {stage.plannedEnd.slice(5)}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        stage.status === 'concluida' ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'
                      }`}>
                        {stage.progressPercent}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Próximas Cobranças e Alertas */}
              <div className="prime-card p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Próximos Marcos Financeiros</h3>
                    <p className="text-xs text-slate-400">Previsões de faturação e liquidações contratuais</p>
                  </div>
                  <button
                    onClick={() => setActiveInternalTab('financeiro')}
                    className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                  >
                    <span>Ver Cobranças</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {projectMilestones.map(m => (
                    <div key={m.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800 block">{m.description}</span>
                        <span className="text-[10px] text-slate-400">Previsão: {m.plannedDate}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 block">€{m.plannedAmount.toLocaleString('pt-PT')}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                          m.status === 'paga' ? 'bg-emerald-100 text-emerald-700' : (m.status === 'faturada' ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-700')
                        }`}>
                          {m.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. PLANO DE OBRA (COM SUBETAPAS) */}
        {activeTab === 'plano' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Estrutura Detalhada do Plano de Obra</h3>
                <p className="text-xs text-slate-500">
                  Marque subetapas concluídas para atualizar o progresso real e acionar marcos de faturação.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {projectStages.map(stage => {
                const isDelayed = stage.delayDays > 0;
                return (
                  <div key={stage.id} className="prime-card p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-400">Etapa #{stage.order}</span>
                          <span className="font-bold text-slate-900 text-sm">{stage.name}</span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {stage.category}
                          </span>
                          {stage.isMilestone && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 flex items-center gap-1">
                              <Flag className="w-3 h-3" />
                              <span>Gera Cobrança de €{(stage.billingAmount || 0).toLocaleString('pt-PT')}</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{stage.description}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          stage.status === 'concluida' ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'
                        }`}>
                          {stage.status.replace('_', ' ').toUpperCase()} ({stage.progressPercent}%)
                        </span>
                      </div>
                    </div>

                    {/* Subtasks checklist */}
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                        Subetapas de Execução:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {stage.subtasks.map(sub => (
                          <div
                            key={sub.id}
                            onClick={() => toggleSubtask(stage.id, sub.id)}
                            className={`p-2.5 rounded-lg border text-xs flex items-center gap-2.5 cursor-pointer transition-all ${
                              sub.completed 
                                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900 font-semibold' 
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded flex items-center justify-center ${sub.completed ? 'bg-emerald-600 text-white' : 'border border-slate-300'}`}>
                              {sub.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                            </div>
                            <span className={sub.completed ? 'line-through opacity-80' : ''}>{sub.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. CRONOGRAMA GANTT */}
        {activeTab === 'cronograma' && (
          <GanttView projectId={project.id} />
        )}

        {/* 4. DIÁRIAS / MÃO DE OBRA */}
        {activeTab === 'diarias' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Diárias Registadas na Obra</h3>
                <p className="text-xs text-slate-500">
                  Total de mão de obra acumulada: <strong>€{summary.laborCost.toLocaleString('pt-PT')}</strong>. O lançamento abate na margem em tempo real.
                </p>
              </div>
              <button
                onClick={() => setShowAddShiftModal(true)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Lançar Diária</span>
              </button>
            </div>

            <div className="prime-card overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Funcionário</th>
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3 text-right">Horas</th>
                    <th className="py-2.5 px-3 text-right">Valor Diária</th>
                    <th className="py-2.5 px-3">Status Pagamento</th>
                    <th className="py-2.5 px-3">Observações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projectShifts.map(shift => {
                    const emp = employees.find(e => e.id === shift.employeeId);
                    return (
                      <tr key={shift.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono text-slate-600">{shift.date}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-800">{emp?.name || shift.employeeId}</td>
                        <td className="py-2.5 px-3 capitalize text-slate-600">{shift.type.replace('_', ' ')}</td>
                        <td className="py-2.5 px-3 text-right text-slate-700">{shift.hours}h</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">€{shift.totalValue}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            shift.status === 'paga' ? 'bg-emerald-100 text-emerald-800' : (shift.status === 'aprovada' ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800')
                          }`}>
                            {shift.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 italic">{shift.notes || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. MATERIAIS */}
        {activeTab === 'materiais' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Compras de Materiais</h3>
                <p className="text-xs text-slate-500">
                  Total faturado de materiais: <strong>€{summary.materialCost.toLocaleString('pt-PT')}</strong>.
                </p>
              </div>
              <button
                onClick={() => setShowAddMaterialModal(true)}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registar Material</span>
              </button>
            </div>

            <div className="prime-card overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Fornecedor</th>
                    <th className="py-2.5 px-3">Categoria</th>
                    <th className="py-2.5 px-3">Descrição</th>
                    <th className="py-2.5 px-3 text-right">Base</th>
                    <th className="py-2.5 px-3 text-right">IVA</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                    <th className="py-2.5 px-3 text-center">Pago?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projectMaterials.map(mat => (
                    <tr key={mat.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono text-slate-600">{mat.date}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">{mat.supplier}</td>
                      <td className="py-2.5 px-3 text-slate-600">{mat.category}</td>
                      <td className="py-2.5 px-3 text-slate-700">{mat.description}</td>
                      <td className="py-2.5 px-3 text-right">€{mat.baseAmount}</td>
                      <td className="py-2.5 px-3 text-right text-slate-500">€{mat.vatAmount.toFixed(1)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">€{mat.totalAmount.toFixed(1)}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${mat.isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {mat.isPaid ? 'SIM' : 'PENDENTE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. OUTROS GASTOS */}
        {activeTab === 'gastos' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Outros Gastos & Subempreitadas</h3>
                <p className="text-xs text-slate-500">
                  Contentores, taxas municipais, aluguer de máquinas e transportes: <strong>€{summary.otherCost.toLocaleString('pt-PT')}</strong>.
                </p>
              </div>
            </div>

            <div className="prime-card overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Fornecedor / Entidade</th>
                    <th className="py-2.5 px-3">Categoria</th>
                    <th className="py-2.5 px-3">Descrição</th>
                    <th className="py-2.5 px-3 text-right">Valor Total</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projectExpenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono text-slate-600">{exp.date}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">{exp.supplier}</td>
                      <td className="py-2.5 px-3 capitalize text-slate-600">{exp.category.replace('_', ' ')}</td>
                      <td className="py-2.5 px-3 text-slate-700">{exp.description}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">€{exp.totalAmount}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${exp.isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {exp.isPaid ? 'PAGO' : 'A PAGAR'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 7. FATURAS & PAGAMENTOS */}
        {activeTab === 'faturas' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Faturas Emitidas para esta Obra</h3>
                <p className="text-xs text-slate-500">
                  Faturado: €{summary.totalBilled.toLocaleString('pt-PT')} • Recebido: €{summary.totalReceived.toLocaleString('pt-PT')}
                </p>
              </div>
            </div>

            <div className="prime-card overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Nº Fatura</th>
                    <th className="py-2.5 px-3">Data Emissão</th>
                    <th className="py-2.5 px-3">Descrição / Parcela</th>
                    <th className="py-2.5 px-3 text-right">Valor Total</th>
                    <th className="py-2.5 px-3 text-right">Recebido</th>
                    <th className="py-2.5 px-3 text-right">Pendente</th>
                    <th className="py-2.5 px-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projectInvoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-sky-700">{inv.code}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{inv.issueDate}</td>
                      <td className="py-2.5 px-3 text-slate-800">{inv.description}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">€{inv.totalAmount.toLocaleString('pt-PT')}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-600">€{inv.receivedAmount.toLocaleString('pt-PT')}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-rose-600">€{(inv.totalAmount - inv.receivedAmount).toLocaleString('pt-PT')}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          inv.status === 'paga' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {inv.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 8. ALTERAÇÕES / EXTRAS */}
        {activeTab === 'alteracoes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Alterações & Trabalhos Extras</h3>
                <p className="text-xs text-slate-500">
                  Ao aprovar um extra, o valor total do contrato da obra é imediatamente recalculado.
                </p>
              </div>
              <button
                onClick={() => setShowAddChangeOrderModal(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Solicitar Extra</span>
              </button>
            </div>

            <div className="space-y-3">
              {projectChangeOrders.map(co => (
                <div key={co.id} className="prime-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                        {co.code}
                      </span>
                      <h4 className="font-bold text-slate-900 text-xs">{co.description}</h4>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        co.status === 'aprovado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {co.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Data pedido: {co.requestDate} {co.approvalDate ? `• Aprovado em: ${co.approvalDate}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className="text-sm font-black text-emerald-600 block">+€{co.additionalAmount.toLocaleString('pt-PT')}</span>
                      <span className="text-[10px] text-slate-400">Prazo adic: +{co.additionalDays}d</span>
                    </div>

                    {co.status === 'aguardando_aprovacao' && (
                      <button
                        onClick={() => approveChangeOrder(co.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs"
                      >
                        Aprovar Extra
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 9. DIÁRIO DA OBRA */}
        {activeTab === 'diario' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Diário Diário de Obra</h3>
                <p className="text-xs text-slate-500">Histórico dia a dia de trabalhos realizados, clima e ocorrências.</p>
              </div>
              <button
                onClick={() => setShowAddDailyLogModal(true)}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Registo Diário</span>
              </button>
            </div>

            <div className="space-y-3">
              {projectDailyLogs.map(log => (
                <div key={log.id} className="prime-card p-4 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-500 pb-2 border-b border-slate-100">
                    <span className="font-bold text-slate-900 font-mono">{log.date}</span>
                    <span>Clima: {log.weather} • Resp: {log.author}</span>
                  </div>
                  <p className="text-slate-800 font-medium"><strong>Trabalhos realizados:</strong> {log.workDone}</p>
                  {log.issues && (
                    <p className="text-rose-700 bg-rose-50 p-2 rounded-md"><strong>Ocorrências:</strong> {log.issues}</p>
                  )}
                  {log.materialsNeeded && (
                    <p className="text-amber-800 bg-amber-50 p-2 rounded-md"><strong>Materiais pedidos:</strong> {log.materialsNeeded}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 10. FOTOS & DOCUMENTOS */}
        {activeTab === 'fotos' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Galeria de Fotos da Obra</h3>
                <p className="text-xs text-slate-400">Registo visual do andamento e detalhes técnicos</p>
              </div>
              <div>
                <input
                  type="file"
                  ref={photoInputRef}
                  accept="image/*"
                  onChange={handleUploadProjectPhoto}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isUploadingPhoto}
                  onClick={() => photoInputRef.current?.click()}
                  className="prime-btn-primary flex items-center gap-1.5 text-xs py-2 px-3 shadow-xs"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{isUploadingPhoto ? 'A guardar...' : 'Adicionar Foto da Obra'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {projectPhotos.map(photo => (
                <div key={photo.id} className="prime-card overflow-hidden group">
                  <img src={photo.url} alt={photo.caption} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="p-3 text-xs">
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 block w-fit mb-1">
                      {photo.category}
                    </span>
                    <p className="font-medium text-slate-800 line-clamp-1">{photo.caption}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">{photo.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 11. HISTÓRICO / AUDITORIA */}
        {activeTab === 'historico' && (
          <div className="prime-card p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Trilha de Auditoria & Alterações da Obra</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {projectAudit.map(log => (
                <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{log.action}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                    </div>
                    <p className="text-slate-600 mt-0.5">{log.details}</p>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 shrink-0">por {log.userName}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: LANÇAR DIÁRIA */}
      {showAddShiftModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Lançar Diária na Obra {project.id}</h3>
              <button onClick={() => setShowAddShiftModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleAddShiftSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Funcionário *</label>
                <select
                  value={shiftForm.employeeId}
                  onChange={e => setShiftForm({ ...shiftForm, employeeId: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data *</label>
                  <input
                    type="date"
                    value={shiftForm.date}
                    onChange={e => setShiftForm({ ...shiftForm, date: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo de Presença</label>
                  <select
                    value={shiftForm.type}
                    onChange={e => setShiftForm({ ...shiftForm, type: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="diaria">Dia Completo</option>
                    <option value="meia_diaria">Meia Diária</option>
                    <option value="horas">Horas Avulsas</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Observações dos Trabalhos</label>
                <input
                  type="text"
                  placeholder="Ex: Assentamento de mosaicos e betume"
                  value={shiftForm.notes}
                  onChange={e => setShiftForm({ ...shiftForm, notes: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddShiftModal(false)} className="px-3.5 py-1.5 text-slate-600">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-bold">Gravar Diária</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTAR MATERIAL */}
      {showAddMaterialModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Registar Compra de Material</h3>
              <button onClick={() => setShowAddMaterialModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleAddMaterialSubmit} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fornecedor</label>
                  <input
                    type="text"
                    required
                    value={materialForm.supplier}
                    onChange={e => setMaterialForm({ ...materialForm, supplier: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Categoria</label>
                  <select
                    value={materialForm.category}
                    onChange={e => setMaterialForm({ ...materialForm, category: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="Cimento & Argamassas">Cimento & Argamassas</option>
                    <option value="Eletricidade">Eletricidade</option>
                    <option value="Canalização">Canalização</option>
                    <option value="Sanitários & Cerâmicas">Sanitários & Cerâmicas</option>
                    <option value="Tintas & Isolamentos">Tintas & Isolamentos</option>
                    <option value="Madeiras & Parquet">Madeiras & Parquet</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descrição do Material</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 10 sacos de cola branca flexível"
                  value={materialForm.description}
                  onChange={e => setMaterialForm({ ...materialForm, description: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Valor Base (€)</label>
                  <input
                    type="number"
                    required
                    value={materialForm.baseAmount}
                    onChange={e => setMaterialForm({ ...materialForm, baseAmount: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nº Fatura / Recibo</label>
                  <input
                    type="text"
                    placeholder="FT 2026/..."
                    value={materialForm.invoiceNumber}
                    onChange={e => setMaterialForm({ ...materialForm, invoiceNumber: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddMaterialModal(false)} className="px-3.5 py-1.5 text-slate-600">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 bg-sky-600 text-white rounded-lg font-bold">Lançar Material</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SOLICITAR TRABALHO EXTRA */}
      {showAddChangeOrderModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Adicionar Trabalho Extra / Alteração</h3>
              <button onClick={() => setShowAddChangeOrderModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleAddChangeOrderSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descrição do Extra *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Tomadas adicionais na cozinha e iluminação LED"
                  value={changeOrderForm.description}
                  onChange={e => setChangeOrderForm({ ...changeOrderForm, description: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Valor ao Cliente (€) *</label>
                  <input
                    type="number"
                    required
                    value={changeOrderForm.additionalAmount}
                    onChange={e => setChangeOrderForm({ ...changeOrderForm, additionalAmount: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Custo Estimado (€)</label>
                  <input
                    type="number"
                    value={changeOrderForm.estimatedCost}
                    onChange={e => setChangeOrderForm({ ...changeOrderForm, estimatedCost: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Prazo Adicional (dias)</label>
                <input
                  type="number"
                  value={changeOrderForm.additionalDays}
                  onChange={e => setChangeOrderForm({ ...changeOrderForm, additionalDays: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddChangeOrderModal(false)} className="px-3.5 py-1.5 text-slate-600">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg font-bold">Registar Aditivo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DIÁRIO DE OBRA */}
      {showAddDailyLogModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Registar Diário de Obra</h3>
              <button onClick={() => setShowAddDailyLogModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleAddDailyLogSubmit} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data</label>
                  <input
                    type="date"
                    value={dailyLogForm.date}
                    onChange={e => setDailyLogForm({ ...dailyLogForm, date: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Condições Clima</label>
                  <input
                    type="text"
                    value={dailyLogForm.weather}
                    onChange={e => setDailyLogForm({ ...dailyLogForm, weather: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Trabalhos Realizados *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Descreva o avanço executado no dia..."
                  value={dailyLogForm.workDone}
                  onChange={e => setDailyLogForm({ ...dailyLogForm, workDone: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ocorrências / Atrasos</label>
                  <input
                    type="text"
                    placeholder="Algum problema encontrado?"
                    value={dailyLogForm.issues}
                    onChange={e => setDailyLogForm({ ...dailyLogForm, issues: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Materiais Necessários</label>
                  <input
                    type="text"
                    placeholder="Itens a encomendar..."
                    value={dailyLogForm.materialsNeeded}
                    onChange={e => setDailyLogForm({ ...dailyLogForm, materialsNeeded: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddDailyLogModal(false)} className="px-3.5 py-1.5 text-slate-600">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 bg-sky-600 text-white rounded-lg font-bold">Gravar Diário</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR INFORMAÇÕES DA OBRA */}
      {showEditProjectModal && project && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  Editar Informações da Obra ({project.id})
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Atualize título, morada, datas, orçamento contratado e dados gerais da obra.
                </p>
              </div>
              <button 
                onClick={() => setShowEditProjectModal(false)} 
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProjectEdit} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Título / Nome da Obra *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Reforma Integral T3 - Carrer d'Aragó"
                  value={projectEditForm.title}
                  onChange={e => setProjectEditForm({ ...projectEditForm, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cliente Associado</label>
                  <select
                    value={projectEditForm.clientId}
                    onChange={e => setProjectEditForm({ ...projectEditForm, clientId: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo de Serviço / Obra</label>
                  <select
                    value={projectEditForm.serviceType}
                    onChange={e => setProjectEditForm({ ...projectEditForm, serviceType: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  >
                    <option value="Reforma integral">Reforma integral</option>
                    <option value="Cozinha e Sala">Cozinha e Sala</option>
                    <option value="Banheiro / Casa de Banho">Banheiro / Casa de Banho</option>
                    <option value="Instalação de Ar Condicionado">Instalação de Ar Condicionado</option>
                    <option value="Termoelétrico / Aquecimento">Termoelétrico / Aquecimento</option>
                    <option value="Pintura e Acabamentos">Pintura e Acabamentos</option>
                    <option value="Eletricidade e Canalização">Eletricidade e Canalização</option>
                    <option value="Outro Serviço">Outro Serviço</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cidade</label>
                  <input
                    type="text"
                    placeholder="Barcelona"
                    value={projectEditForm.city}
                    onChange={e => setProjectEditForm({ ...projectEditForm, city: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gestor Responsável</label>
                  <input
                    type="text"
                    value={projectEditForm.managerId}
                    onChange={e => setProjectEditForm({ ...projectEditForm, managerId: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Morada / Endereço da Obra</label>
                <input
                  type="text"
                  placeholder="Rua, número, andar, porta..."
                  value={projectEditForm.address}
                  onChange={e => setProjectEditForm({ ...projectEditForm, address: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Valor Contratado (€) *</label>
                  <input
                    type="number"
                    required
                    value={projectEditForm.contractValue || ''}
                    onChange={e => setProjectEditForm({ ...projectEditForm, contractValue: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data de Início</label>
                  <input
                    type="date"
                    value={projectEditForm.startDate}
                    onChange={e => setProjectEditForm({ ...projectEditForm, startDate: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data Prevista de Fim</label>
                  <input
                    type="date"
                    value={projectEditForm.plannedEndDate}
                    onChange={e => setProjectEditForm({ ...projectEditForm, plannedEndDate: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status da Obra</label>
                <select
                  value={projectEditForm.status}
                  onChange={e => setProjectEditForm({ ...projectEditForm, status: e.target.value as any })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                >
                  <option value="nao_iniciada">Não Iniciada</option>
                  <option value="agendada">Agendada</option>
                  <option value="em_execucao">Em Execução</option>
                  <option value="pausada">Pausada</option>
                  <option value="concluida">Concluída</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Observações e Escopo</label>
                <textarea
                  rows={2}
                  placeholder="Detalhes sobre o escopo acordado, restrições do condomínio, etc."
                  value={projectEditForm.notes}
                  onChange={e => setProjectEditForm({ ...projectEditForm, notes: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditProjectModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Alterações da Obra</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
