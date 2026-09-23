import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Building2, AlertTriangle, 
  ChevronLeft, ChevronRight, Plus, User, Trash2, X 
} from 'lucide-react';

interface Allocation {
  id: string;
  day: string;
  projectId: string;
  activity: string;
  workerIds: string[];
}

export const WeeklyPlanning: React.FC = () => {
  const { projects, employees, setSelectedProjectId, setActiveTab } = useApp();

  const [currentWeek] = useState('Semana Atual');

  const weekDays = [
    { id: 'seg', label: 'Segunda-feira' },
    { id: 'ter', label: 'Terça-feira' },
    { id: 'qua', label: 'Quarta-feira' },
    { id: 'qui', label: 'Quinta-feira' },
    { id: 'sex', label: 'Sexta-feira' },
    { id: 'sab', label: 'Sábado' },
  ];

  // Persisted allocations in localStorage
  const [allocations, setAllocations] = useState<Allocation[]>(() => {
    try {
      const saved = localStorage.getItem('prime_weekly_allocations');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveAllocations = (newAllocs: Allocation[]) => {
    setAllocations(newAllocs);
    try {
      localStorage.setItem('prime_weekly_allocations', JSON.stringify(newAllocs));
    } catch (e) {
      console.warn('Erro ao salvar alocações:', e);
    }
  };

  // Only consider allocations that belong to projects that ACTUALLY exist in database
  const activeAllocations = allocations.filter(a => projects.some(p => p.id === a.projectId));

  // Modal State for adding allocation
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDayForAdd, setSelectedDayForAdd] = useState('seg');
  const [formProjectId, setFormProjectId] = useState(projects[0]?.id || '');
  const [formActivity, setFormActivity] = useState('');
  const [formWorkerIds, setFormWorkerIds] = useState<string[]>([]);

  // Conflict detector: check if an employee is assigned to more than 1 project on the same day
  const getConflictsForDay = (dayId: string) => {
    const dayAllocations = activeAllocations.filter(a => a.day === dayId);
    const workerCount: Record<string, string[]> = {};

    dayAllocations.forEach(alloc => {
      alloc.workerIds.forEach(wId => {
        if (!workerCount[wId]) workerCount[wId] = [];
        workerCount[wId].push(alloc.projectId);
      });
    });

    const conflicts: { workerId: string; projects: string[] }[] = [];
    Object.keys(workerCount).forEach(wId => {
      if (workerCount[wId].length > 1) {
        conflicts.push({ workerId: wId, projects: workerCount[wId] });
      }
    });

    return conflicts;
  };

  // Get all conflicts across the week for top banner
  const allConflicts = weekDays.flatMap(day => {
    const cList = getConflictsForDay(day.id);
    return cList.map(c => ({
      dayLabel: day.label,
      workerId: c.workerId,
      workerName: employees.find(e => e.id === c.workerId)?.name || c.workerId,
      projects: c.projects
    }));
  });

  const handleOpenAddModal = (dayId: string) => {
    if (projects.length === 0) {
      alert('Ainda não existem obras registadas. Crie primeiro uma obra no menu "Obras & Central" para poder escalá-la aqui no planeamento.');
      return;
    }
    setSelectedDayForAdd(dayId);
    setFormProjectId(projects[0]?.id || '');
    setFormActivity('');
    setFormWorkerIds(employees.length > 0 ? [employees[0].id] : []);
    setShowAddModal(true);
  };

  const handleCreateAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProjectId || !formActivity.trim()) {
      alert('Selecione uma obra e preencha a atividade.');
      return;
    }

    const newAlloc: Allocation = {
      id: `ALC-${Date.now()}`,
      day: selectedDayForAdd,
      projectId: formProjectId,
      activity: formActivity.trim(),
      workerIds: formWorkerIds
    };

    saveAllocations([...allocations, newAlloc]);
    setShowAddModal(false);
  };

  const handleDeleteAllocation = (id: string) => {
    saveAllocations(allocations.filter(a => a.id !== id));
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Planeamento Semanal de Equipa</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
              Operacional
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Alocação diária de equipas por obra, atividades programadas e prevenção de conflitos de escala.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
          <button className="p-1 hover:bg-white rounded-lg"><ChevronLeft className="w-4 h-4" /></button>
          <span className="px-2">{currentWeek}</span>
          <button className="p-1 hover:bg-white rounded-lg"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Conflict Warning Banner if any real conflict exists */}
      {allConflicts.length > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-xs text-rose-800 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-sm block">Atenção: Conflito de Escala Detetado!</span>
            {allConflicts.map((c, idx) => (
              <p key={idx}>
                Na <strong>{c.dayLabel}</strong>, o colaborador <strong>{c.workerName}</strong> está alocado simultaneamente nas obras <strong>{c.projects.join(' e ')}</strong>.
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Week Matrix Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {weekDays.map(day => {
          const dayAllocations = activeAllocations.filter(a => a.day === day.id);
          const conflicts = getConflictsForDay(day.id);

          return (
            <div
              key={day.id}
              className="prime-card p-4.5 flex flex-col justify-between"
            >
              <div>
                {/* Day Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <span className="font-bold text-sm text-slate-900">{day.label}</span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {dayAllocations.length} {dayAllocations.length === 1 ? 'obra' : 'obras'}
                  </span>
                </div>

                {/* Day Conflict alert badge */}
                {conflicts.length > 0 && (
                  <div className="mb-3 p-2 bg-rose-100/70 border border-rose-200 text-rose-800 rounded-lg text-[11px] font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>Conflito: {employees.find(e => e.id === conflicts[0].workerId)?.name || conflicts[0].workerId}</span>
                  </div>
                )}

                {/* Allocations list */}
                <div className="space-y-3">
                  {dayAllocations.map(alloc => {
                    const proj = projects.find(p => p.id === alloc.projectId);
                    return (
                      <div
                        key={alloc.id}
                        className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs text-xs space-y-2 group relative"
                      >
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => {
                              setSelectedProjectId(alloc.projectId);
                              setActiveTab('obras');
                            }}
                            className="font-mono font-bold text-sky-700 hover:underline flex items-center gap-1"
                          >
                            <Building2 className="w-3.5 h-3.5" />
                            <span>{alloc.projectId}</span>
                          </button>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 truncate max-w-[100px]">{proj?.title}</span>
                            <button
                              onClick={() => handleDeleteAllocation(alloc.id)}
                              className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                              title="Remover alocação"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <p className="font-medium text-slate-800">
                          {alloc.activity}
                        </p>

                        {/* Workers */}
                        {alloc.workerIds.length > 0 && (
                          <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                            {alloc.workerIds.map(wId => {
                              const emp = employees.find(e => e.id === wId);
                              const hasConflict = conflicts.some(c => c.workerId === wId);
                              return (
                                <span
                                  key={wId}
                                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium flex items-center gap-1 ${
                                    hasConflict 
                                      ? 'bg-rose-100 text-rose-800 font-bold border border-rose-300 animate-pulse' 
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  <User className="w-3 h-3 text-slate-400" />
                                  <span>{emp?.name.split(' ')[0] || wId}</span>
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {dayAllocations.length === 0 && (
                    <div className="p-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                      Sem obras escaladas
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-400">
                <span>{dayAllocations.length} ativas</span>
                <button
                  onClick={() => handleOpenAddModal(day.id)}
                  className="text-sky-600 font-semibold hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Adicionar Alocação */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                Escalar Obra ({weekDays.find(d => d.id === selectedDayForAdd)?.label})
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAllocation} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Obra a Escalar *</label>
                <select
                  value={formProjectId}
                  onChange={e => setFormProjectId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.id} - {p.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Atividade Programada *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Assentamento cerâmico, montagem de tetos..."
                  value={formActivity}
                  onChange={e => setFormActivity(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Funcionários Alocados</label>
                <div className="max-h-36 overflow-y-auto space-y-1.5 border border-slate-200 rounded-lg p-2.5 bg-slate-50">
                  {employees.map(emp => {
                    const checked = formWorkerIds.includes(emp.id);
                    return (
                      <label key={emp.id} className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            if (checked) {
                              setFormWorkerIds(formWorkerIds.filter(id => id !== emp.id));
                            } else {
                              setFormWorkerIds([...formWorkerIds, emp.id]);
                            }
                          }}
                          className="rounded text-sky-600"
                        />
                        <span>{emp.name} ({emp.role})</span>
                      </label>
                    );
                  })}
                  {employees.length === 0 && (
                    <span className="text-slate-400 italic">Nenhum colaborador registado na equipa.</span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="prime-btn-primary px-4 py-2 text-xs"
                >
                  Guardar Alocação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
