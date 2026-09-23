import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ProjectStage, StageStatus } from '../../types';
import { 
  Calendar, ChevronLeft, ChevronRight, AlertTriangle, 
  Flag, CheckCircle2, Clock, ZoomIn, ZoomOut, Filter, 
  ArrowRight, ShieldAlert, Layers 
} from 'lucide-react';

interface Props {
  projectId?: string; // If passed, filters to this project; otherwise allows selector
}

export const GanttView: React.FC<Props> = ({ projectId }) => {
  const { stages, projects, updateStage, setSelectedProjectId, setActiveTab } = useApp();

  const [selectedProj, setSelectedProj] = useState<string>(projectId || projects[0]?.id || 'OB-0001');
  const [timeScale, setTimeScale] = useState<'dia' | 'semana' | 'mes'>('semana');

  const activeProject = projects.find(p => p.id === (projectId || selectedProj));
  const projectStages = stages.filter(s => s.projectId === (projectId || selectedProj)).sort((a, b) => a.order - b.order);

  // Timeline reference: August 15, 2026 to November 15, 2026 (~90 days)
  const baseDate = new Date('2026-08-15');
  const totalDays = 90;
  const daysArray = Array.from({ length: totalDays }, (_, i) => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + i);
    return d;
  });

  const getDayOffset = (dateStr: string) => {
    const d = new Date(dateStr);
    const diff = Math.floor((d.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, Math.min(totalDays, diff));
  };

  const todayStr = '2026-09-22';
  const todayOffset = getDayOffset(todayStr);

  const statusColors: Record<StageStatus, string> = {
    nao_iniciada: 'bg-slate-300 text-slate-700',
    em_execucao: 'bg-sky-500 text-white',
    concluida: 'bg-emerald-500 text-white',
    pausada: 'bg-amber-400 text-slate-900',
    atrasada: 'bg-rose-500 text-white animate-pulse',
    cancelada: 'bg-slate-400 text-slate-800'
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto h-[calc(100vh-5rem)] flex flex-col">
      {/* Top Header & Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Cronograma Gantt Profissional</span>
              {activeProject && (
                <span className="font-mono text-xs font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded">
                  {activeProject.id}
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500">
              {activeProject?.title} • Fim Previsto: {activeProject?.plannedEndDate}
            </p>
          </div>
        </div>

        {/* Project Selector & Scale Switcher */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {!projectId && (
            <select
              value={selectedProj}
              onChange={e => setSelectedProj(e.target.value)}
              className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-hidden"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.id} - {p.title}</option>
              ))}
            </select>
          )}

          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setTimeScale('dia')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${timeScale === 'dia' ? 'bg-white shadow-2xs text-sky-700 font-bold' : 'text-slate-600'}`}
            >
              Dia
            </button>
            <button
              onClick={() => setTimeScale('semana')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${timeScale === 'semana' ? 'bg-white shadow-2xs text-sky-700 font-bold' : 'text-slate-600'}`}
            >
              Semana
            </button>
            <button
              onClick={() => setTimeScale('mes')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${timeScale === 'mes' ? 'bg-white shadow-2xs text-sky-700 font-bold' : 'text-slate-600'}`}
            >
              Mês
            </button>
          </div>
        </div>
      </div>

      {/* Gantt Matrix Container */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-xs">
        {/* Timeline Table with Left Column (Task info) and Right Column (Gantt bars) */}
        <div className="flex-1 overflow-x-auto flex divide-x divide-slate-200">
          {/* LEFT SIDE: Task List */}
          <div className="w-80 sm:w-96 shrink-0 flex flex-col bg-slate-50/50">
            {/* Header */}
            <div className="h-12 border-b border-slate-200 px-4 flex items-center justify-between text-xs font-bold text-slate-500 uppercase bg-slate-100/70">
              <span>Etapa / Atividade</span>
              <div className="flex items-center gap-4 text-[11px]">
                <span>Resp</span>
                <span>%</span>
              </div>
            </div>

            {/* Stages Rows */}
            <div className="divide-y divide-slate-100 flex-1 overflow-y-auto">
              {projectStages.map(stage => {
                const isDelayed = stage.delayDays > 0 || stage.status === 'atrasada';
                return (
                  <div key={stage.id} className="h-14 px-3.5 flex items-center justify-between hover:bg-slate-100/60 transition-colors">
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] font-bold text-slate-400">#{stage.order}</span>
                        {stage.isMilestone && (
                          <span title="Marco Financeiro">
                            <Flag className="w-3 h-3 text-amber-500 shrink-0" />
                          </span>
                        )}
                        <span className={`text-xs font-bold truncate ${isDelayed ? 'text-rose-600' : 'text-slate-800'}`}>
                          {stage.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                        <span className="font-medium text-slate-500">{stage.category}</span>
                        <span>•</span>
                        <span>{stage.plannedStart.slice(5)} a {stage.plannedEnd.slice(5)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-xs">
                      <span className="text-[11px] text-slate-600 font-medium truncate max-w-[70px]">
                        {stage.managerId?.split(' ')[0] || 'Equipa'}
                      </span>
                      <span className={`font-mono font-bold text-[11px] px-1.5 py-0.2 rounded ${
                        stage.progressPercent === 100 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : (stage.progressPercent > 0 ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-600')
                      }`}>
                        {stage.progressPercent}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT SIDE: Gantt Calendar Bars */}
          <div className="flex-1 overflow-x-auto overflow-y-auto relative flex flex-col min-w-[700px]">
            {/* Calendar Header with Weeks & Days */}
            <div className="h-12 border-b border-slate-200 bg-slate-100/70 flex sticky top-0 z-10 shrink-0">
              {daysArray.map((day, idx) => {
                const dayStr = day.toISOString().slice(0, 10);
                const isToday = dayStr === todayStr;
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                const showLabel = timeScale === 'dia' || (timeScale === 'semana' && idx % 7 === 0) || (timeScale === 'mes' && day.getDate() === 1);

                return (
                  <div
                    key={idx}
                    style={{ width: `${100 / (timeScale === 'mes' ? 30 : (timeScale === 'semana' ? 60 : 90))}%` }}
                    className={`shrink-0 border-r border-slate-200/60 flex flex-col items-center justify-center text-[10px] ${
                      isToday ? 'bg-sky-100/60 font-bold text-sky-800' : (isWeekend ? 'bg-slate-200/40 text-slate-400' : 'text-slate-600')
                    }`}
                  >
                    {showLabel && (
                      <>
                        <span className="font-semibold text-[9px] uppercase">{day.toLocaleDateString('pt-PT', { month: 'short' })}</span>
                        <span className="font-bold">{day.getDate()}</span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bars Canvas */}
            <div className="divide-y divide-slate-100 relative flex-1">
              {/* Vertical TODAY line */}
              <div
                className="absolute top-0 bottom-0 z-10 w-0.5 bg-rose-500 shadow-sm pointer-events-none"
                style={{ left: `${(todayOffset / totalDays) * 100}%` }}
              >
                <span className="absolute -top-1 -left-5 bg-rose-500 text-white text-[9px] font-bold px-1 rounded shadow-xs">
                  Hoje
                </span>
              </div>

              {projectStages.map(stage => {
                const startOffset = getDayOffset(stage.plannedStart);
                const endOffset = getDayOffset(stage.plannedEnd);
                const duration = Math.max(1, endOffset - startOffset);
                const isDelayed = stage.delayDays > 0 || stage.status === 'atrasada';

                const leftPercent = (startOffset / totalDays) * 100;
                const widthPercent = (duration / totalDays) * 100;

                return (
                  <div key={stage.id} className="h-14 relative flex items-center hover:bg-slate-50/50">
                    {/* Gantt Bar */}
                    <div
                      style={{
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                      }}
                      className={`absolute h-7 rounded-lg shadow-xs flex items-center px-2 text-xs font-semibold overflow-hidden transition-all group cursor-pointer ${
                        isDelayed 
                          ? 'bg-rose-500 text-white ring-2 ring-rose-300' 
                          : (stage.status === 'concluida' 
                              ? 'bg-emerald-600 text-white' 
                              : (stage.status === 'em_execucao' ? 'bg-sky-600 text-white' : 'bg-slate-300 text-slate-800'))
                      }`}
                      title={`${stage.name}: ${stage.plannedStart} a ${stage.plannedEnd} (${stage.progressPercent}%)`}
                    >
                      {/* Inner Progress overlay */}
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-black/15 pointer-events-none"
                        style={{ width: `${stage.progressPercent}%` }}
                      />

                      <div className="relative z-10 flex items-center justify-between w-full min-w-0">
                        <span className="truncate text-[11px] font-bold mr-1">{stage.name}</span>
                        <span className="text-[10px] opacity-90 shrink-0">{stage.progressPercent}%</span>
                      </div>
                    </div>

                    {/* Milestone indicator */}
                    {stage.isMilestone && (
                      <div
                        style={{ left: `${leftPercent + widthPercent}%` }}
                        className="absolute -ml-2 w-4 h-4 rounded-full bg-amber-400 border-2 border-white shadow-xs z-10 flex items-center justify-center text-[8px] font-black text-amber-950"
                        title={`Marco: ${stage.billingAmount ? `€${stage.billingAmount.toLocaleString('pt-PT')}` : ''}`}
                      >
                        M
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Gantt Legend Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 px-5 shrink-0 gap-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-emerald-600" />
              <span>Concluída (100%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-sky-600" />
              <span>Em Execução</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-rose-500" />
              <span className="text-rose-700 font-semibold">Etapa Atrasada</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-amber-400 border border-amber-600" />
              <span>Marco Faturação</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Linha vermelha indica o dia de hoje ({todayStr})</span>
          </div>
        </div>
      </div>
    </div>
  );
};
