import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Calendar, CheckSquare, Plus, Trash2, Sparkles, CheckCircle2, 
  Clock, AlertTriangle, ChevronDown, ChevronRight, Layers, 
  Euro, ArrowRight, Building2, User, RefreshCw, FileText
} from 'lucide-react';
import { ProjectStage, StageStatus, Subtask } from '../../types';

export const PlanoObraView: React.FC = () => {
  const { 
    projects, 
    clients,
    stages, 
    selectedProjectId, 
    setSelectedProjectId, 
    addStage, 
    updateStage, 
    deleteStage, 
    toggleSubtask, 
    addSubtaskToStage, 
    deleteSubtaskFromStage, 
    applyStageTemplate 
  } = useApp();

  const activeProjects = projects.filter(p => !p.isArchived);
  const currentProjectId = selectedProjectId || activeProjects[0]?.id || '';
  const currentProject = projects.find(p => p.id === currentProjectId);
  const currentClient = clients.find(c => c.id === currentProject?.clientId);

  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showNewStageModal, setShowNewStageModal] = useState(false);
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({});
  const [newSubtaskInputs, setNewSubtaskInputs] = useState<Record<string, string>>({});

  // Form para nova etapa
  const [stageForm, setStageForm] = useState({
    name: '',
    category: 'Acabamentos',
    plannedStart: new Date().toISOString().split('T')[0],
    plannedEnd: new Date(Date.now() + 14 * 84600000).toISOString().split('T')[0],
    billingAmount: 0,
    initialSubtasks: ''
  });

  const projectStages = stages
    .filter(s => s.projectId === currentProjectId)
    .sort((a, b) => a.order - b.order);

  // Toggle stage expansion
  const toggleExpand = (id: string) => {
    setExpandedStages(prev => ({ ...prev, [id]: prev[id] === undefined ? false : !prev[id] }));
  };

  const isStageExpanded = (id: string) => {
    return expandedStages[id] !== false; // Default expanded
  };

  // Subtask rápida
  const handleAddSubtask = (stageId: string) => {
    const text = newSubtaskInputs[stageId]?.trim();
    if (!text) return;
    addSubtaskToStage(stageId, text);
    setNewSubtaskInputs(prev => ({ ...prev, [stageId]: '' }));
  };

  // Criar nova etapa
  const handleCreateStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stageForm.name.trim() || !currentProjectId) return;

    const subtasksList: Subtask[] = stageForm.initialSubtasks
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)
      .map((subName, idx) => ({
        id: `sub_${Date.now()}_${idx}`,
        name: subName,
        completed: false
      }));

    const start = new Date(stageForm.plannedStart);
    const end = new Date(stageForm.plannedEnd);
    const durationDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

    addStage({
      projectId: currentProjectId,
      name: stageForm.name.trim(),
      category: stageForm.category,
      order: projectStages.length + 1,
      priority: 'media',
      plannedStart: stageForm.plannedStart,
      plannedEnd: stageForm.plannedEnd,
      durationDays,
      status: 'nao_iniciada',
      progressPercent: 0,
      delayDays: 0,
      isMilestone: (Number(stageForm.billingAmount) || 0) > 0,
      triggersBilling: (Number(stageForm.billingAmount) || 0) > 0,
      billingAmount: Number(stageForm.billingAmount) || undefined,
      subtasks: subtasksList
    });

    setStageForm({
      name: '',
      category: 'Acabamentos',
      plannedStart: new Date().toISOString().split('T')[0],
      plannedEnd: new Date(Date.now() + 14 * 84600000).toISOString().split('T')[0],
      billingAmount: 0,
      initialSubtasks: ''
    });
    setShowNewStageModal(false);
  };

  // Aplicar modelo
  const handleApplyTemplate = (type: 'integral' | 'cozinha' | 'banheiro' | 'pintura') => {
    if (!currentProjectId) return;
    applyStageTemplate(currentProjectId, type);
    setShowTemplateModal(false);
  };

  // Cálculos globais
  const totalSubtasks = projectStages.reduce((acc, s) => acc + (s.subtasks?.length || 0), 0);
  const completedSubtasks = projectStages.reduce((acc, s) => acc + (s.subtasks?.filter(st => st.completed).length || 0), 0);
  const overallProgress = projectStages.length > 0 
    ? Math.round(projectStages.reduce((acc, s) => acc + s.progressPercent, 0) / projectStages.length)
    : 0;

  const totalMilestoneValue = projectStages.reduce((acc, s) => acc + (s.billingAmount || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8">
      {/* CABEÇALHO & SELEÇÃO DE OBRA */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-sm">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">Plano de Obra & Cronograma Técnico</h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                  Planeamento
                </span>
              </div>
              <p className="text-sm text-slate-500">
                Defina as etapas, sub-tarefas e marcos de faturação da reforma. Tudo conectado com o Gantt e Financeiro.
              </p>
            </div>
          </div>

          {/* Selector de Obra */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">Obra Ativa</span>
              <span className="text-xs text-slate-700 font-bold">{currentProject?.id || 'Nenhuma selecionada'}</span>
            </div>
            <select
              value={currentProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
            >
              {activeProjects.map(proj => {
                const client = clients.find(c => c.id === proj.clientId);
                return (
                  <option key={proj.id} value={proj.id}>
                    {proj.id} - {proj.title} ({client?.name || 'Cliente'})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Resumo da Obra Selecionada */}
        {currentProject && (
          <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="text-xs text-slate-500 block">Progresso Global</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-bold text-slate-900">{overallProgress}%</span>
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-sky-600 rounded-full transition-all"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="text-xs text-slate-500 block">Etapas & Subtarefas</span>
              <span className="text-lg font-bold text-slate-900 mt-1 block">
                {projectStages.length} <span className="text-xs font-normal text-slate-500">etapas</span> ({completedSubtasks}/{totalSubtasks} <span className="text-xs font-normal text-slate-500">feitas</span>)
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="text-xs text-slate-500 block">Marcos Associados</span>
              <span className="text-lg font-bold text-emerald-700 mt-1 block">
                € {totalMilestoneValue.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="text-xs text-slate-500 block">Prazo Contratual</span>
              <span className="text-xs font-semibold text-slate-800 mt-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {currentProject.startDate} → {currentProject.plannedEndDate}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* BARRA DE AÇÕES RÁPIDAS (LANÇAMENTO FACILITADO) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 p-4 rounded-xl text-white shadow-sm">
        <div>
          <h3 className="font-semibold text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Como deseja estruturar o plano desta obra?
          </h3>
          <p className="text-xs text-sky-200 mt-0.5">
            Pode carregar um modelo de reforma completo em 1 clique ou criar etapas personalizadas fase a fase.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowTemplateModal(true)}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-sm flex items-center gap-2 transition-all shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            Carregar Modelo Padrão
          </button>

          <button
            onClick={() => setShowNewStageModal(true)}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg text-sm flex items-center gap-2 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nova Etapa Manual
          </button>
        </div>
      </div>

      {/* LISTA DE ETAPAS DO PLANO */}
      {projectStages.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Layers className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Esta obra ainda não tem um Plano de Obra</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-6">
            O Plano de Obra orienta as equipas no terreno, define os marcos de cobrança financeira e gera o cronograma Gantt automático.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setShowTemplateModal(true)}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg text-sm flex items-center gap-2 shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              Carregar Modelo Padrão (Recomendado)
            </button>
            <button
              onClick={() => setShowNewStageModal(true)}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg text-sm"
            >
              Criar Etapa Manualmente
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {projectStages.map((stage, index) => {
            const isExpanded = isStageExpanded(stage.id);
            const subtasks = stage.subtasks || [];
            const completedCount = subtasks.filter(st => st.completed).length;

            return (
              <div 
                key={stage.id} 
                className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden transition-all hover:border-slate-300"
              >
                {/* CABEÇALHO DA ETAPA */}
                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleExpand(stage.id)}
                      className="text-slate-400 hover:text-slate-700 p-1"
                    >
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>

                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-900 text-base">{stage.name}</h4>
                        <span className="px-2 py-0.5 rounded text-2xs font-semibold uppercase tracking-wider bg-slate-100 text-slate-700">
                          {stage.category}
                        </span>

                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          stage.status === 'concluida' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          stage.status === 'em_execucao' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                          stage.status === 'atrasada' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          'bg-slate-50 text-slate-600 border border-slate-200'
                        }`}>
                          {stage.status === 'concluida' ? 'Concluída' :
                           stage.status === 'em_execucao' ? 'Em Execução' :
                           stage.status === 'atrasada' ? 'Atrasada' : 'Não Iniciada'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs mt-2 flex-wrap bg-slate-50 p-2 rounded-lg border border-slate-200/80">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-sky-600" />
                            Início:
                          </span>
                          <input
                            type="date"
                            value={stage.plannedStart}
                            onChange={(e) => {
                              const newStart = e.target.value;
                              const end = new Date(stage.plannedEnd);
                              const start = new Date(newStart);
                              const durationDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
                              updateStage(stage.id, { plannedStart: newStart, durationDays });
                            }}
                            className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-800 shadow-2xs hover:border-sky-400 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                            title="Editar data de início desta etapa"
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-slate-600">Fim:</span>
                          <input
                            type="date"
                            value={stage.plannedEnd}
                            onChange={(e) => {
                              const newEnd = e.target.value;
                              const start = new Date(stage.plannedStart);
                              const end = new Date(newEnd);
                              const durationDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
                              updateStage(stage.id, { plannedEnd: newEnd, durationDays });
                            }}
                            className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-800 shadow-2xs hover:border-sky-400 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                            title="Editar data de conclusão desta etapa"
                          />
                        </div>

                        <span className="text-[11px] font-medium text-slate-500 font-mono">
                          ({stage.durationDays} dias)
                        </span>

                        <div className="flex items-center gap-1.5 ml-auto">
                          <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                            <Euro className="w-3.5 h-3.5 text-emerald-600" />
                            Marco (€):
                          </span>
                          <input
                            type="number"
                            step="50"
                            placeholder="0"
                            value={stage.billingAmount || ''}
                            onChange={(e) => {
                              const val = e.target.value ? Number(e.target.value) : undefined;
                              updateStage(stage.id, { 
                                billingAmount: val,
                                isMilestone: !!val && val > 0,
                                triggersBilling: !!val && val > 0
                              });
                            }}
                            className="w-24 px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-emerald-700 text-right shadow-2xs hover:border-emerald-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                            title="Editar valor de marco financeiro para faturar ao concluir esta etapa"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progresso & Ações */}
                  <div className="flex items-center gap-4 pl-9 md:pl-0">
                    <div className="w-32">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500 font-medium">Progresso</span>
                        <span className="font-bold text-slate-800">{stage.progressPercent}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${
                            stage.progressPercent === 100 ? 'bg-emerald-500' : 'bg-sky-600'
                          }`}
                          style={{ width: `${stage.progressPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={stage.status}
                        onChange={(e) => updateStage(stage.id, { 
                          status: e.target.value as StageStatus,
                          progressPercent: e.target.value === 'concluida' ? 100 : stage.progressPercent
                        })}
                        className="px-2 py-1 text-xs font-medium rounded border border-slate-200 bg-slate-50 text-slate-700"
                      >
                        <option value="nao_iniciada">Não Iniciada</option>
                        <option value="em_execucao">Em Execução</option>
                        <option value="concluida">Concluída</option>
                        <option value="pausada">Pausada</option>
                        <option value="atrasada">Atrasada</option>
                      </select>

                      <button
                        onClick={() => {
                          if (confirm(`Tem a certeza que deseja excluir a etapa "${stage.name}" e todas as suas tarefas?`)) {
                            deleteStage(stage.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                        title="Excluir etapa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* CORPO EXPANSÍVEL: CHECKLIST DE SUBTAREFAS */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-4 pl-12 space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                      <span>Lista de Atividades / Subetapas ({completedCount}/{subtasks.length})</span>
                      <span className="font-normal text-slate-400">Marque para atualizar o progresso automaticamente</span>
                    </div>

                    {/* Subtarefas */}
                    <div className="space-y-1.5">
                      {subtasks.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">Nenhuma subetapa adicionada a esta fase.</p>
                      ) : (
                        subtasks.map((st) => (
                          <div 
                            key={st.id} 
                            className="flex items-center justify-between group p-2 rounded-lg bg-white border border-slate-200/80 hover:border-slate-300 shadow-2xs"
                          >
                            <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                              <input
                                type="checkbox"
                                checked={st.completed}
                                onChange={() => toggleSubtask(stage.id, st.id)}
                                className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                              />
                              <span className={`text-sm ${
                                st.completed ? 'line-through text-slate-400' : 'text-slate-800 font-medium'
                              }`}>
                                {st.name}
                              </span>
                            </label>

                            <button
                              onClick={() => deleteSubtaskFromStage(stage.id, st.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-rose-600 rounded transition-opacity"
                              title="Remover atividade"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Adicionar subtarefa rápida */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="+ Adicionar subetapa rápida (ex: Passagem de tubagem nos tetos)..."
                        value={newSubtaskInputs[stage.id] || ''}
                        onChange={(e) => setNewSubtaskInputs(prev => ({ ...prev, [stage.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask(stage.id)}
                        className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                      <button
                        onClick={() => handleAddSubtask(stage.id)}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-md transition-colors"
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: CARREGAR MODELOS PADRÃO */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 bg-slate-900 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Modelos Pré-Configurados de Reforma</h3>
                    <p className="text-xs text-slate-300">
                      Gere instantaneamente o plano de obra completo com todas as fases e subetapas da construção civil portuguesa.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div 
                onClick={() => handleApplyTemplate('integral')}
                className="p-4 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50/50 cursor-pointer transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 group-hover:text-sky-700 flex items-center gap-2">
                      🏛️ Remodelação Integral Completa (T2 / T3)
                      <span className="text-2xs bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-semibold">10 Fases</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Demolições, Alvenarias, Eletricidade & ITED, Canalização, Pladur, Impermeabilização, Cerâmicos, Pintura e Carpintarias.
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-sky-600 transition-colors" />
                </div>
              </div>

              <div 
                onClick={() => handleApplyTemplate('cozinha')}
                className="p-4 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 cursor-pointer transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 group-hover:text-amber-700 flex items-center gap-2">
                      🍳 Remodelação de Cozinha
                      <span className="text-2xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold">6 Fases</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Desmonte móveis velhos, redes águas/gás/eletricidade, revestimento cerâmico, montagem móveis & pedra, eletrodomésticos.
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-amber-600 transition-colors" />
                </div>
              </div>

              <div 
                onClick={() => handleApplyTemplate('banheiro')}
                className="p-4 rounded-xl border border-slate-200 hover:border-cyan-500 hover:bg-cyan-50/50 cursor-pointer transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 group-hover:text-cyan-700 flex items-center gap-2">
                      🚿 Remodelação de Casa de Banho (WC)
                      <span className="text-2xs bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full font-semibold">6 Fases</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Demolição, novas tubagens água/esgotos, impermeabilização técnica com tela/argamassa, azulejo, louças & torneiras.
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-cyan-600 transition-colors" />
                </div>
              </div>

              <div 
                onClick={() => handleApplyTemplate('pintura')}
                className="p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 cursor-pointer transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 group-hover:text-emerald-700 flex items-center gap-2">
                      🎨 Pintura Geral & Revestimentos
                      <span className="text-2xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">4 Fases</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Proteção de áreas, lixamento e betumação de fissuras, primário de fixação, 2 a 3 demãos de tinta lavável e vernizes.
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: NOVA ETAPA MANUAL */}
      {showNewStageModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Plus className="w-5 h-5 text-sky-400" />
                Nova Etapa de Obra
              </h3>
              <button
                onClick={() => setShowNewStageModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStage} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nome da Etapa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Instalação Elétrica & Iluminação LED"
                  value={stageForm.name}
                  onChange={(e) => setStageForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Categoria
                  </label>
                  <select
                    value={stageForm.category}
                    onChange={(e) => setStageForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="Demolição">Demolição</option>
                    <option value="Alvenaria">Alvenaria</option>
                    <option value="Instalações">Instalações (Água/Luz/Gás)</option>
                    <option value="Gesso Cartonado">Gesso Cartonado / Pladur</option>
                    <option value="Revestimentos">Revestimentos</option>
                    <option value="Carpintaria">Carpintaria</option>
                    <option value="Pintura">Pintura</option>
                    <option value="Acabamentos">Acabamentos / Limpeza</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Marco de Faturação (€)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={stageForm.billingAmount || ''}
                    onChange={(e) => setStageForm(prev => ({ ...prev, billingAmount: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Data Início
                  </label>
                  <input
                    type="date"
                    required
                    value={stageForm.plannedStart}
                    onChange={(e) => setStageForm(prev => ({ ...prev, plannedStart: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Data Conclusão
                  </label>
                  <input
                    type="date"
                    required
                    value={stageForm.plannedEnd}
                    onChange={(e) => setStageForm(prev => ({ ...prev, plannedEnd: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Subtarefas Iniciais (uma por linha)
                </label>
                <textarea
                  rows={3}
                  placeholder={`Exemplo:\nPassagem de cabos de rede ITED\nMontagem do quadro elétrico\nInstalação de focos embutidos`}
                  value={stageForm.initialSubtasks}
                  onChange={(e) => setStageForm(prev => ({ ...prev, initialSubtasks: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewStageModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-sm shadow-sm"
                >
                  Criar Etapa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
