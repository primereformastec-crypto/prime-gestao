import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Employee, EmployeeShift, ShiftStatus } from '../../types';
import { 
  Users2, Clock, DollarSign, CheckCircle2, AlertTriangle, 
  Plus, Search, Filter, Phone, Building2, Check, ArrowDownRight 
} from 'lucide-react';

export const EmployeesView: React.FC = () => {
  const { 
    employees, shifts, projects, clients, addShift, 
    updateShiftStatus, getEmployeeSummary, setSelectedProjectId, setActiveTab 
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'diarias' | 'funcionarios'>('diarias');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShiftForPayment, setSelectedShiftForPayment] = useState<EmployeeShift | null>(null);
  const [showAddShiftModal, setShowAddShiftModal] = useState(false);

  // Filtered shifts
  const filteredShifts = shifts.filter(s => {
    const emp = employees.find(e => e.id === s.employeeId);
    const empName = emp ? emp.name.toLowerCase() : '';
    const q = searchQuery.toLowerCase();
    return s.projectId.toLowerCase().includes(q) || empName.includes(q) || s.date.includes(q);
  });

  // New shift form state
  const [shiftForm, setShiftForm] = useState<{
    projectId: string;
    employeeId: string;
    date: string;
    type: 'diaria' | 'meia_diaria' | 'horas';
    hours: number;
    rate: number;
    notes: string;
  }>({
    projectId: projects[0]?.id || '',
    employeeId: employees[0]?.id || '',
    date: new Date().toISOString().slice(0, 10),
    type: 'diaria',
    hours: 8,
    rate: 90,
    notes: ''
  });

  const handleCreateShift = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === shiftForm.employeeId);
    const rate = shiftForm.type === 'diaria' ? (emp?.dailyRate || 90) : (shiftForm.type === 'meia_diaria' ? (emp?.halfDayRate || 50) : (emp?.hourlyRate || 12));
    const totalValue = shiftForm.type === 'horas' ? rate * shiftForm.hours : rate;

    addShift({
      projectId: shiftForm.projectId,
      employeeId: shiftForm.employeeId,
      date: shiftForm.date,
      type: shiftForm.type,
      hours: shiftForm.hours,
      rate,
      totalValue,
      status: 'pendente',
      notes: shiftForm.notes
    });

    setShowAddShiftModal(false);
  };

  const handleConfirmShiftPayment = (shiftId: string) => {
    updateShiftStatus(shiftId, 'paga', {
      method: 'Transferência Bancária',
      date: new Date().toISOString().slice(0, 10)
    });
    setSelectedShiftForPayment(null);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Funcionários & Diárias</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800">
              Mão de Obra
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Controle de presenças, cálculo de custos por obra e acompanhamento de pagamentos pendentes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setActiveSubTab('diarias')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${activeSubTab === 'diarias' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600'}`}
            >
              Base de Diárias ({shifts.length})
            </button>
            <button
              onClick={() => setActiveSubTab('funcionarios')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${activeSubTab === 'funcionarios' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600'}`}
            >
              Fichas de Colaboradores ({employees.length})
            </button>
          </div>

          <button
            onClick={() => setShowAddShiftModal(true)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Lançar Diária</span>
          </button>
        </div>
      </div>

      {/* SUBTAB 1: BASE DE DIÁRIAS */}
      {activeSubTab === 'diarias' && (
        <div className="space-y-4">
          {/* Quick Filter */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <div className="relative w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
              <input
                type="text"
                placeholder="Filtrar por obra, colaborador ou data..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
              />
            </div>
            <span className="text-slate-400 font-medium">
              Total Mão de Obra Lançada: <strong>€{shifts.reduce((s, x) => s + x.totalValue, 0).toLocaleString('pt-PT')}</strong>
            </span>
          </div>

          <div className="prime-card overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Obra</th>
                  <th className="py-3 px-4">Colaborador</th>
                  <th className="py-3 px-4">Presença</th>
                  <th className="py-3 px-4 text-right">Horas</th>
                  <th className="py-3 px-4 text-right">Valor</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Observações</th>
                  <th className="py-3 px-4 text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredShifts.map(shift => {
                  const emp = employees.find(e => e.id === shift.employeeId);
                  const proj = projects.find(p => p.id === shift.projectId);

                  return (
                    <tr key={shift.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-600">{shift.date}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => {
                            setSelectedProjectId(shift.projectId);
                            setActiveTab('obras');
                          }}
                          className="font-mono font-bold text-sky-700 hover:underline flex items-center gap-1"
                        >
                          <Building2 className="w-3.5 h-3.5" />
                          <span>{shift.projectId}</span>
                        </button>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{emp?.name || shift.employeeId}</td>
                      <td className="py-3 px-4 capitalize text-slate-600">{shift.type.replace('_', ' ')}</td>
                      <td className="py-3 px-4 text-right text-slate-700">{shift.hours}h</td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">€{shift.totalValue}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          shift.status === 'paga' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : (shift.status === 'aprovada' ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800')
                        }`}>
                          {shift.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate">{shift.notes || '—'}</td>
                      <td className="py-3 px-4 text-center">
                        {shift.status === 'pendente' && (
                          <button
                            onClick={() => updateShiftStatus(shift.id, 'aprovada')}
                            className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold rounded-md text-[10px]"
                          >
                            Aprovar
                          </button>
                        )}
                        {shift.status === 'aprovada' && (
                          <button
                            onClick={() => handleConfirmShiftPayment(shift.id)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-md text-[10px]"
                          >
                            Pagar
                          </button>
                        )}
                        {shift.status === 'paga' && (
                          <span className="text-slate-400 text-[11px]">✓ Pago</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: FICHAS DE COLABORADORES COM SALDOS */}
      {activeSubTab === 'funcionarios' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map(emp => {
            const sum = getEmployeeSummary(emp.id);

            return (
              <div key={emp.id} className="prime-card p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{emp.name}</h3>
                    <p className="text-xs text-slate-500 font-medium">{emp.role}</p>
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      <span>{emp.phone}</span>
                    </p>
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    {emp.id}
                  </span>
                </div>

                {/* Rates strip */}
                <div className="p-3 bg-slate-50 rounded-xl grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Diária</span>
                    <span className="font-bold text-slate-800">€{emp.dailyRate}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Meia</span>
                    <span className="font-bold text-slate-800">€{emp.halfDayRate}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Hora</span>
                    <span className="font-bold text-slate-800">€{emp.hourlyRate}</span>
                  </div>
                </div>

                {/* Worked summary */}
                <div className="space-y-2 text-xs pt-2 border-t border-slate-100">
                  <div className="flex justify-between text-slate-600">
                    <span>Dias Trabalhados:</span>
                    <span className="font-bold text-slate-900">{sum.daysWorked} dias ({sum.hoursWorked}h)</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Obras Atendidas:</span>
                    <span className="font-mono font-bold text-sky-700">{sum.projectsWorked.join(', ') || 'Nenhuma'}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Total Gerado:</span>
                    <span className="font-bold text-slate-900">€{sum.totalEarned.toLocaleString('pt-PT')}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Valor Já Pago:</span>
                    <span>€{sum.totalPaid.toLocaleString('pt-PT')}</span>
                  </div>
                  <div className="flex justify-between text-amber-700 font-bold bg-amber-50 p-2 rounded-lg">
                    <span>Saldo Pendente a Pagar:</span>
                    <span>€{sum.totalPending.toLocaleString('pt-PT')}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: LANÇAR DIÁRIA */}
      {showAddShiftModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Lançar Nova Diária</h3>
              <button onClick={() => setShowAddShiftModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleCreateShift} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Obra *</label>
                <select
                  value={shiftForm.projectId}
                  onChange={e => setShiftForm({ ...shiftForm, projectId: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.id} - {p.title}</option>
                  ))}
                </select>
              </div>

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
                  <label className="block font-semibold text-slate-700 mb-1">Data</label>
                  <input
                    type="date"
                    value={shiftForm.date}
                    onChange={e => setShiftForm({ ...shiftForm, date: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo Presença</label>
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
                <label className="block font-semibold text-slate-700 mb-1">Observações de Campo</label>
                <input
                  type="text"
                  placeholder="Ex: Trabalho de reboco e regularização"
                  value={shiftForm.notes}
                  onChange={e => setShiftForm({ ...shiftForm, notes: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddShiftModal(false)} className="px-3.5 py-1.5 text-slate-600">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-bold">Lançar Diária</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
