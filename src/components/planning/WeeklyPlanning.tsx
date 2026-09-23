import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Calendar, Users2, Building2, AlertTriangle, CheckCircle2, 
  ChevronLeft, ChevronRight, Plus, User, Clock, MapPin 
} from 'lucide-react';

export const WeeklyPlanning: React.FC = () => {
  const { projects, employees, stages, shifts, setSelectedProjectId, setActiveTab } = useApp();

  const [currentWeek, setCurrentWeek] = useState('Semana 39 (21/09 a 26/09/2026)');

  const weekDays = [
    { id: 'seg', label: 'Segunda-feira', date: '21/09' },
    { id: 'ter', label: 'Terça-feira', date: '22/09' },
    { id: 'qua', label: 'Quarta-feira', date: '23/09' },
    { id: 'qui', label: 'Quinta-feira', date: '24/09' },
    { id: 'sex', label: 'Sexta-feira', date: '25/09' },
    { id: 'sab', label: 'Sábado', date: '26/09' },
  ];

  // Schedule allocation mapping for demonstration
  // Format: [dayId]: Array of { projectId, activity, workerIds }
  const [allocations, setAllocations] = useState([
    {
      day: 'seg',
      projectId: 'OB-0001',
      activity: 'Assentamento cerâmico no WC suite',
      workerIds: ['EMP-01', 'EMP-02']
    },
    {
      day: 'seg',
      projectId: 'OB-0002',
      activity: 'Instalação elétrica da bancada da cozinha',
      workerIds: ['EMP-03']
    },
    {
      day: 'ter',
      projectId: 'OB-0001',
      activity: 'Piso flutuante corredor e sala',
      workerIds: ['EMP-01', 'EMP-02']
    },
    {
      day: 'ter',
      projectId: 'OB-0002',
      activity: 'Ligação de quadro e ensaio de circuitos',
      workerIds: ['EMP-03', 'EMP-01'] // Simulated deliberate conflict: EMP-01 in two projects!
    },
    {
      day: 'qua',
      projectId: 'OB-0001',
      activity: 'Betumação e colocação de rodapés',
      workerIds: ['EMP-01', 'EMP-04']
    },
    {
      day: 'qui',
      projectId: 'OB-0002',
      activity: 'Montagem de móveis de cozinha',
      workerIds: ['EMP-05', 'EMP-02']
    },
    {
      day: 'sex',
      projectId: 'OB-0001',
      activity: 'Primeira demão de pintura nos tetos',
      workerIds: ['EMP-04', 'EMP-01']
    }
  ]);

  // Conflict detector: check if an employee is assigned to more than 1 project on the same day
  const getConflictsForDay = (dayId: string) => {
    const dayAllocations = allocations.filter(a => a.day === dayId);
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

      {/* Conflict Warning Banner if any */}
      {weekDays.some(d => getConflictsForDay(d.id).length > 0) && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-xs text-rose-800 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-sm block">Atenção: Conflito de Escala Detetado!</span>
            <p className="mt-0.5">
              Na Terça-feira (22/09), o colaborador <strong>Gustavo Lima (EMP-01)</strong> está alocado simultaneamente na <strong>OB-0001</strong> e <strong>OB-0002</strong>. Realoque o profissional para garantir a execução.
            </p>
          </div>
        </div>
      )}

      {/* Week Matrix Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {weekDays.map(day => {
          const dayAllocations = allocations.filter(a => a.day === day.id);
          const conflicts = getConflictsForDay(day.id);
          const isToday = day.date === '22/09';

          return (
            <div
              key={day.id}
              className={`prime-card p-4.5 flex flex-col justify-between ${
                isToday ? 'ring-2 ring-sky-500 bg-sky-50/20' : ''
              }`}
            >
              <div>
                {/* Day Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{day.label}</span>
                    <span className="text-xs text-slate-400 font-mono">({day.date})</span>
                  </div>
                  {isToday && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-600 text-white">
                      Hoje
                    </span>
                  )}
                </div>

                {/* Day Conflict alert badge */}
                {conflicts.length > 0 && (
                  <div className="mb-3 p-2 bg-rose-100/70 border border-rose-200 text-rose-800 rounded-lg text-[11px] font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>Conflito: {employees.find(e => e.id === conflicts[0].workerId)?.name}</span>
                  </div>
                )}

                {/* Allocations list */}
                <div className="space-y-3">
                  {dayAllocations.map((alloc, idx) => {
                    const proj = projects.find(p => p.id === alloc.projectId);
                    return (
                      <div
                        key={idx}
                        className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs text-xs space-y-2"
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
                          <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{proj?.title}</span>
                        </div>

                        <p className="font-medium text-slate-800">
                          {alloc.activity}
                        </p>

                        {/* Workers */}
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
                <span>{dayAllocations.length} obras ativas</span>
                <span className="text-sky-600 font-semibold cursor-pointer hover:underline">+ Adicionar</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
