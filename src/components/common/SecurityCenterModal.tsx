import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ShieldCheck, Database, HardDrive, Download, RefreshCw, 
  Lock, CheckCircle2, AlertTriangle, ArrowRight, X, Clock,
  FileText, Users, Building2, Briefcase
} from 'lucide-react';

interface SecurityCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityCenterModal: React.FC<SecurityCenterModalProps> = ({ isOpen, onClose }) => {
  const { 
    leads, clients, projects, invoices, expenses, 
    employees, tools, setActiveTab 
  } = useApp();

  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  // Função para descarregar o backup completo em 1 clique para o computador/celular do usuário
  const handleDownloadFullBackup = () => {
    setDownloading(true);
    setDownloadSuccess(false);

    try {
      // 1. Obtém o estado mais recente
      fetch('/api/state')
        .then(res => res.json())
        .then(remoteData => {
          const payload = remoteData?.isInitialized ? remoteData : {
            leads, clients, projects, invoices, expenses, employees, tools,
            exportedAt: new Date().toISOString()
          };

          const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
          const downloadAnchor = document.createElement('a');
          const now = new Date();
          const pad = (n: number) => String(n).padStart(2, '0');
          const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}h${pad(now.getMinutes())}`;
          
          downloadAnchor.setAttribute('href', dataStr);
          downloadAnchor.setAttribute('download', `PRIME_GESTAO_BACKUP_COMPLETO_${dateStr}.json`);
          document.body.appendChild(downloadAnchor);
          downloadAnchor.click();
          downloadAnchor.remove();

          setDownloading(false);
          setDownloadSuccess(true);
          setTimeout(() => setDownloadSuccess(false), 6000);
        })
        .catch(() => {
          // Fallback usando estado da memória local
          const localPayload = {
            leads, clients, projects, invoices, expenses, employees, tools,
            exportedAt: new Date().toISOString(),
            source: 'PRIME Gestão Local Memory'
          };
          const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(localPayload, null, 2));
          const downloadAnchor = document.createElement('a');
          downloadAnchor.setAttribute('href', dataStr);
          downloadAnchor.setAttribute('download', `PRIME_GESTAO_BACKUP_COMPLETO_${Date.now()}.json`);
          document.body.appendChild(downloadAnchor);
          downloadAnchor.click();
          downloadAnchor.remove();

          setDownloading(false);
          setDownloadSuccess(true);
          setTimeout(() => setDownloadSuccess(false), 6000);
        });
    } catch (err) {
      setDownloading(false);
      alert('Erro ao gerar cópia de segurança.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header com Escudo */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <ShieldCheck className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight">Central de Segurança & Continuidade PRIME</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  100% Protegido
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Arquitetura de tolerância a falhas, backups automáticos e retenção histórica na nuvem.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
          
          {/* Status em tempo real */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Leads Registados</span>
              <span className="text-lg font-black text-slate-900 block mt-0.5">{leads.length}</span>
              <span className="text-[9px] text-emerald-600 font-bold">✓ Preservados</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Clientes Oficiais</span>
              <span className="text-lg font-black text-slate-900 block mt-0.5">{clients.length}</span>
              <span className="text-[9px] text-emerald-600 font-bold">✓ Carteira Ativa</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Obras em Sistema</span>
              <span className="text-lg font-black text-slate-900 block mt-0.5">{projects.length}</span>
              <span className="text-[9px] text-emerald-600 font-bold">✓ Gestão 360°</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Faturas & Caixa</span>
              <span className="text-lg font-black text-slate-900 block mt-0.5">{invoices.length}</span>
              <span className="text-[9px] text-emerald-600 font-bold">✓ Histórico Ativo</span>
            </div>
          </div>

          {/* Destaque para Download Manual em 1 Clique */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 border border-sky-200 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-bold text-sm text-sky-950 flex items-center gap-2">
                  <Download className="w-4 h-4 text-sky-600" />
                  <span>Descarregar Cópia de Segurança Completa (.JSON)</span>
                </h4>
                <p className="text-xs text-sky-800 mt-1 leading-relaxed">
                  Baixe agora mesmo um ficheiro completo com 100% dos dados da sua empresa (obras, clientes, faturas, leads e equipa) diretamente para o seu computador ou telemóvel. Você fica no controlo total.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleDownloadFullBackup}
                disabled={downloading}
                className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all hover:scale-102 cursor-pointer text-xs"
              >
                {downloading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>A gerar cópia completa...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Descarregar Backup Completo Agora</span>
                  </>
                )}
              </button>

              {downloadSuccess && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-3 py-1.5 rounded-lg border border-emerald-300 flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Ficheiro de cópia de segurança descarregado com sucesso!</span>
                </span>
              )}
            </div>
          </div>

          {/* As 5 Camadas de Blindagem de Dados */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>As 5 Camadas de Blindagem de Dados Ativas no Sistema:</span>
            </h4>

            <div className="space-y-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                <Database className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block font-bold">1. Nuvem Supabase Clusterizada (PostgreSQL Corporativo)</strong>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Os dados não ficam dependentes de um único computador ou do servidor Render. Ficam gravados num cluster de base de dados independente com alta disponibilidade e replicação.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                <Clock className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block font-bold">2. Snapshots Contínuos na Nuvem (Máquina do Tempo)</strong>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    A cada 10 minutos e a cada alteração crítica, o sistema tira uma fotografia completa do banco e guarda no histórico de versões do Supabase. Se alguém errar, podemos voltar no tempo.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block font-bold">3. Eliminação Segura com Confirmação Dupla Obrigatória</strong>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Nenhum colaborador ou gestor consegue apagar um cliente ou obra com um clique acidental. É obrigatório passar por 2 etapas e digitar explicitamente a palavra "ELIMINAR".
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                <RefreshCw className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block font-bold">4. Fusão Cumulativa Anti-Sobrescrita (Zero Perda Multi-Aparelho)</strong>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Se alguém abrir o sistema no telemóvel sem dados ou se a internet cair, o servidor NUNCA substitui dados por vazio. Ele apenas une as alterações sem apagar o que já existe.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                <HardDrive className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block font-bold">5. Backups em Ficheiro Local no Servidor e Restauro em 1 Clique</strong>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    O servidor mantém uma pasta com ficheiros JSON de reserva e permite restaurar qualquer ponto nas Configurações da aplicação.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Acesso rápido às configurações avançadas */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onClose();
                setActiveTab('configuracoes');
              }}
              className="text-xs font-bold text-sky-700 hover:text-sky-800 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Ver Histórico de Backups e Pontos de Restauro nas Configurações</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer transition-colors"
            >
              Fechar Painel
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
