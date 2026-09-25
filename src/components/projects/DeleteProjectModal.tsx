import React, { useState } from 'react';
import { Project, Client } from '../../types';
import { AlertTriangle, Trash2, ShieldAlert, ArrowLeft } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface DeleteProjectModalProps {
  project: Project | null;
  client?: Client;
  onClose: () => void;
  onConfirmDelete: (projectId: string) => void;
}

export const DeleteProjectModal: React.FC<DeleteProjectModalProps> = ({
  project,
  client,
  onClose,
  onConfirmDelete
}) => {
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  if (!project) return null;

  const handleCancel = () => {
    setDeleteStep(1);
    setDeleteConfirmText('');
    onClose();
  };

  const handleExecuteDelete = () => {
    if (deleteConfirmText.trim().toUpperCase() !== 'ELIMINAR') return;
    onConfirmDelete(project.id);
    handleCancel();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-rose-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 border-b border-rose-100 bg-rose-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 border border-rose-200">
              <Trash2 className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-rose-950 flex items-center gap-2">
                Eliminar Registo de Obra
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-200/80 text-rose-800">
                  Etapa {deleteStep} de 2
                </span>
              </h3>
              <p className="text-[11px] text-rose-700 font-medium">
                {deleteStep === 1 ? 'Revisão dos dados da obra e impacto' : 'Confirmação obrigatória de segurança'}
              </p>
            </div>
          </div>
          <button 
            onClick={handleCancel} 
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-white/80 transition-colors"
          >
            ✕
          </button>
        </div>

        {deleteStep === 1 ? (
          /* ETAPA 1: REVISÃO E AVISO */
          <div className="p-6 space-y-4 text-xs">
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Atenção: Você solicitou a eliminação da obra abaixo.</p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Esta ação removerá a obra e as suas etapas associadas do painel e sincronizará a exclusão com a base de dados central da PRIME.
                </p>
              </div>
            </div>

            {/* Ficha da Obra */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded">
                  {project.id}
                </span>
                <span className="text-[11px] text-slate-500 font-semibold">
                  Status: {project.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <h4 className="text-sm font-black text-slate-900">{project.title}</h4>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-2 border-t border-slate-200/60">
                <div><strong>Cliente:</strong> {client?.name || 'Cliente Vinculado'}</div>
                <div><strong>Valor Contrato:</strong> {formatCurrency(project.contractValue || 0)}</div>
                <div><strong>Localização:</strong> {project.city || 'Barcelona'}</div>
                <div><strong>Gestor:</strong> {project.managerId || 'Alexandre Carvalho'}</div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-semibold rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => setDeleteStep(2)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span>Avançar para Confirmação</span>
                <span>→</span>
              </button>
            </div>
          </div>
        ) : (
          /* ETAPA 2: CONFIRMAÇÃO COM PALAVRA-CHAVE */
          <div className="p-6 space-y-4 text-xs">
            <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 text-rose-950 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Confirmação de Segurança Nível 2</p>
                <p className="text-[11px] text-rose-800 leading-relaxed">
                  Você está prestes a eliminar definitivamente a obra <strong>{project.title}</strong> ({project.id}).
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-slate-700 font-bold">
                Para confirmar a exclusão desta obra, digite a palavra <span className="font-mono text-rose-600 bg-rose-50 px-1 py-0.5 rounded border border-rose-200">ELIMINAR</span> abaixo:
              </label>
              <input
                type="text"
                autoFocus
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder="Digite ELIMINAR para confirmar"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-center tracking-wider text-rose-600 font-bold focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteStep(1)}
                className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 font-semibold rounded-xl transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar</span>
              </button>
              <button
                type="button"
                disabled={deleteConfirmText.trim().toUpperCase() !== 'ELIMINAR'}
                onClick={handleExecuteDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirmar Exclusão da Obra</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
