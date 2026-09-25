import React from 'react';
import { Project, Client } from '../../types';
import { AlertTriangle, Trash2 } from 'lucide-react';
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
  if (!project) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-rose-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Modal Header */}
        <div className="p-5 border-b border-rose-100 bg-rose-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 border border-rose-200">
              <Trash2 className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-rose-950">
                Eliminar Registo de Obra
              </h3>
              <p className="text-[11px] text-rose-700 font-medium">
                Confirme se deseja remover definitivamente esta obra
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-white/80 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Atenção: Ação Definitiva</p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Você está prestes a eliminar a obra <strong>{project.title}</strong> ({project.id}).
                Esta ação removerá a obra e as suas etapas técnicas do sistema e sincronizará com a nuvem permanente da PRIME.
              </p>
            </div>
          </div>

          {/* Ficha da Obra */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded">
                {project.id}
              </span>
              <span className="text-[11px] text-slate-500 font-semibold uppercase">
                Status: {project.status.replace('_', ' ')}
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

          {/* Botões de Confirmação Direta */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onConfirmDelete(project.id)}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Sim, Eliminar Obra</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
