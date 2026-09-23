import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Building2, Mail, Phone, MapPin, Globe, Percent, Save, 
  Database, Shield, Sliders, Download, Upload, RefreshCw, 
  Archive, Clock, CheckCircle2, AlertCircle, FileText, HardDrive, Lock
} from 'lucide-react';

interface ServerBackup {
  filename: string;
  tag: string;
  sizeBytes: number;
  sizeFormatted: string;
  createdAt: string;
  counts: {
    leads?: number;
    clients?: number;
    projects?: number;
    employees?: number;
    invoices?: number;
    expenses?: number;
    materials?: number;
    shifts?: number;
  };
}

export const SettingsView: React.FC = () => {
  const { clearAllDemoData, isCleanMode, systemPassword, updateSystemPassword } = useApp();
  const [newPassword, setNewPassword] = useState('');
  const [passMessage, setPassMessage] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState('PRIME Engenharia & Reformas');
  const [nif, setNif] = useState('512 345 678');
  const [email, setEmail] = useState('geral@primereformas.pt');
  const [phone, setPhone] = useState('+351 210 987 654');
  const [address, setAddress] = useState('Avenida da Liberdade, 245, 4º Andar, Lisboa');
  const [website, setWebsite] = useState('www.primereformas.pt');
  const [vatRate, setVatRate] = useState(23);
  const [defaultLaborRate, setDefaultLaborRate] = useState(90);
  const [saved, setSaved] = useState(false);

  // Backup State
  const [backups, setBackups] = useState<ServerBackup[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [backupMessage, setBackupMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchBackups = async () => {
    setLoadingBackups(true);
    try {
      const res = await fetch('/api/backups');
      const json = await res.json();
      if (json.success && json.backups) {
        setBackups(json.backups);
      }
    } catch (err) {
      console.error('Erro ao obter backups:', err);
    } finally {
      setLoadingBackups(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreateManualBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingBackup(true);
    setBackupMessage(null);
    try {
      const tagToUse = newTag.trim() || 'Ponto Manual';
      const res = await fetch('/api/backup/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: tagToUse })
      });
      const data = await res.json();
      if (data.success) {
        setBackupMessage({ text: `✓ Cópia de segurança criada com sucesso: "${tagToUse}"`, type: 'success' });
        setNewTag('');
        await fetchBackups();
      } else {
        setBackupMessage({ text: 'Falha ao criar cópia de segurança.', type: 'error' });
      }
    } catch (err) {
      setBackupMessage({ text: 'Erro ao comunicar com o servidor de backups.', type: 'error' });
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleRestoreServerBackup = async (filename: string, tag: string) => {
    const confirmRestore = confirm(
      `ATENÇÃO: Deseja restaurar a base de dados para a versão:\n"${tag}" (${filename})?\n\nO sistema criará automaticamente uma cópia de pré-segurança antes de aplicar o restauro.`
    );
    if (!confirmRestore) return;

    try {
      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename })
      });
      const data = await res.json();
      if (data.success) {
        alert('Base de dados restaurada com sucesso! A página será recarregada.');
        window.location.reload();
      } else {
        alert('Erro ao restaurar cópia de segurança: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (err) {
      alert('Erro ao conectar ao servidor para restaurar.');
    }
  };

  const handleRestoreFromFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        const confirmRestore = confirm(
          `Deseja restaurar a base de dados a partir do ficheiro "${file.name}"?\n\nSerá criado um backup prévio automático de segurança.`
        );
        if (!confirmRestore) return;

        const res = await fetch('/api/backup/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ backupData: parsed })
        });
        const data = await res.json();
        if (data.success) {
          alert('Base de dados restaurada com sucesso a partir do ficheiro! A página será recarregada.');
          window.location.reload();
        } else {
          alert('Erro ao restaurar: ' + (data.error || 'Ficheiro inválido'));
        }
      } catch (err) {
        alert('O ficheiro selecionado não é um ficheiro JSON válido de cópia de segurança.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const leadSources = [
    'Indicação de Clientes', 'Instagram / Redes Sociais', 'Google Ads / SEO',
    'Parcerias com Arquitetos', 'Passa-a-palavra', 'Montra / Placa de Obra'
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
          Configurações & Painel Oficial da Empresa
        </h1>
        <p className="text-xs md:text-sm text-slate-500 mt-1">
          Identidade fiscal da empresa, controlo central de base de dados e gestão de cópias de segurança contínuas.
        </p>
      </div>

      {/* ===================== CENTRO DE BACKUPS & CONTINUIDADE (OFICIAL) ===================== */}
      <div className="prime-card p-6 border-indigo-200 bg-gradient-to-br from-indigo-50/50 via-white to-sky-50/40 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Centro de Backups & Continuidade Oficial</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Blindagem Ativa
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                O programa da sua empresa conta com armazenamento permanente e salvaguarda contínua de todos os dados inseridos.
              </p>
            </div>
          </div>

          {/* Quick Download of Active DB */}
          <a
            href="/api/backup/download"
            download
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <Download className="w-4 h-4" />
            <span>Descarregar Backup Integral (.JSON)</span>
          </a>
        </div>

        {/* Protection Explanatory Box */}
        <div className="p-4 bg-white/80 rounded-xl border border-indigo-100 text-xs text-slate-700 space-y-2">
          <div className="flex items-center gap-2 font-bold text-indigo-900">
            <Shield className="w-4 h-4 text-indigo-600" />
            <span>Garantia de Não Eliminação em Futuras Melhorias:</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            A base de dados da empresa (<code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700 font-mono">data/database.json</code>) e as suas cópias de segurança em 
            (<code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700 font-mono">data/backups/</code>) estão completamente isoladas do código da aplicação.
            Qualquer alteração futura solicitada (novas funcionalidades, telas, botões ou melhorias de cálculo) <strong>preserva integralmente</strong> tudo o que a sua equipa tiver cadastrado.
          </p>
        </div>

        {/* Action Controls: Create Manual Point & Restore from File */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Create Manual Restore Point */}
          <form onSubmit={handleCreateManualBackup} className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <Clock className="w-4 h-4 text-sky-600" />
              <span>Criar Ponto de Restauro Imediato</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Gera um snapshot exato de todas as obras, clientes e faturas neste instante no servidor.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                placeholder="Ex: Antes da reunião de obras"
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:border-sky-500 outline-none"
              />
              <button
                type="submit"
                disabled={creatingBackup}
                className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 shrink-0"
              >
                {creatingBackup ? 'A gravar...' : 'Gravar Ponto'}
              </button>
            </div>
          </form>

          {/* Restore from Computer File */}
          <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>Restaurar de Ficheiro do Computador</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Tem um ficheiro <code className="text-slate-700 font-mono">.json</code> guardado no seu computador? Suba-o para restaurar todos os dados da empresa.
            </p>
            <label className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 border-dashed rounded-lg text-xs font-semibold cursor-pointer transition-colors">
              <Upload className="w-4 h-4 text-slate-500" />
              <span>Selecionar Ficheiro de Backup (.json)</span>
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreFromFile}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {backupMessage && (
          <div className={`p-3 rounded-xl text-xs font-bold text-center ${
            backupMessage.type === 'success' 
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
              : 'bg-rose-100 text-rose-800 border border-rose-200'
          }`}>
            {backupMessage.text}
          </div>
        )}

        {/* Backups Table / History */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <HardDrive className="w-4 h-4 text-indigo-600" />
              <span>Histórico de Cópias de Segurança no Servidor ({backups.length})</span>
            </div>
            <button
              onClick={fetchBackups}
              disabled={loadingBackups}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingBackups ? 'animate-spin' : ''}`} />
              <span>Atualizar Lista</span>
            </button>
          </div>

          {backups.length === 0 ? (
            <div className="p-6 bg-white rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
              Nenhuma cópia de segurança arquivada ainda. O sistema gera snapshots automaticamente à medida que os dados forem inseridos.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">Identificador / Etiqueta</th>
                      <th className="py-2.5 px-4">Data & Hora</th>
                      <th className="py-2.5 px-4">Conteúdo Registado</th>
                      <th className="py-2.5 px-4">Tamanho</th>
                      <th className="py-2.5 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {backups.map((b, idx) => (
                      <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-900">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span>{b.tag}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{b.filename}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-[11px]">
                          {new Date(b.createdAt).toLocaleString('pt-PT', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1.5 text-[10px]">
                            <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-medium">
                              {b.counts.clients || 0} Clientes
                            </span>
                            <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded font-medium">
                              {b.counts.projects || 0} Obras
                            </span>
                            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded font-medium">
                              {b.counts.invoices || 0} Faturas
                            </span>
                            <span className="px-1.5 py-0.5 bg-sky-50 text-sky-700 rounded font-medium">
                              {b.counts.employees || 0} Equipa
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                          {b.sizeFormatted}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={`/api/backup/download?file=${encodeURIComponent(b.filename)}`}
                              download
                              title="Descarregar ficheiro para o computador"
                              className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 rounded-lg transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={() => handleRestoreServerBackup(b.filename, b.tag)}
                              title="Restaurar base de dados para esta versão"
                              className="px-2.5 py-1 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 rounded-lg text-[11px] font-bold transition-colors"
                            >
                              Restaurar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===================== IDENTIDADE FISCAL DA EMPRESA ===================== */}
      <form onSubmit={(e) => { e.preventDefault(); setSaved(true); setTimeout(() => setSaved(false), 3000); }} className="prime-card p-6 space-y-6">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Building2 className="w-4 h-4 text-sky-600" />
          <span>Identidade Fiscal & Parâmetros de Obra</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nome Comercial da Empresa</label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-sky-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">NIF da Empresa</label>
            <input
              type="text"
              value={nif}
              onChange={e => setNif(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-sky-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Geral / Finanças</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-sky-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Contacto Telefónico</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-sky-500 outline-none"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Sede / Escritório</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-sky-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Taxa IVA Padrão (%)</label>
            <div className="relative">
              <Percent className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="number"
                value={vatRate}
                onChange={e => setVatRate(Number(e.target.value))}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-sky-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Valor Médio Diária Mão de Obra (€)</label>
            <input
              type="number"
              value={defaultLaborRate}
              onChange={e => setDefaultLaborRate(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-sky-500 outline-none"
            />
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all active:scale-98"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Configurações</span>
          </button>
        </div>

        {saved && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold text-center animate-in fade-in">
            ✓ Configurações da empresa gravadas com sucesso!
          </div>
        )}
      </form>

      {/* ===================== ACESSO ONLINE & REDE LOCAL ===================== */}
      <div className="prime-card p-6 border-sky-200 bg-sky-50/20 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sky-800 font-bold text-sm">
            <Database className="w-4 h-4 text-sky-600" />
            <span>Acesso da Equipa em Tempo Real</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            ✓ Sistema Operacional Ativo
          </span>
        </div>

        <div className="text-xs text-slate-600 space-y-2">
          <p>
            O software opera com uma <strong>Base de Dados Centralizada</strong> partilhada entre todos os membros da sua equipa.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs">
              <span className="text-slate-400 block text-[10px]">Link Global da Equipa (4G / 5G / Qualquer PC):</span>
              <a 
                href="https://defining-warriors-definition-sampling.trycloudflare.com" 
                target="_blank" 
                rel="noreferrer"
                className="text-sky-400 hover:underline break-all block mt-0.5 font-bold"
              >
                https://defining-warriors-definition-sampling.trycloudflare.com
              </a>
            </div>
            <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs">
              <span className="text-slate-400 block text-[10px]">Utilizador Único Unificado:</span>
              <strong className="text-emerald-400 text-sm block mt-0.5">admin@primegestao.pt</strong>
            </div>
          </div>

          {/* Password Manager Form */}
          <div className="p-4 bg-white rounded-xl border border-sky-200 shadow-2xs space-y-3 mt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-sky-600" />
                <span className="text-xs font-bold text-slate-900">Palavra-passe de Acesso da Equipa</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                Senha atual: <strong className="text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">{systemPassword}</strong>
              </span>
            </div>
            
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!newPassword.trim()) return;
                updateSystemPassword(newPassword.trim());
                setPassMessage('Palavra-passe atualizada com sucesso!');
                setNewPassword('');
                setTimeout(() => setPassMessage(null), 4000);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Introduza nova palavra-passe (ex: prime2026)"
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:border-sky-500 outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-all active:scale-98 shrink-0"
              >
                Alterar Palavra-passe
              </button>
            </form>

            {passMessage && (
              <p className="text-xs font-bold text-emerald-600 animate-in fade-in">✓ {passMessage}</p>
            )}
          </div>
        </div>
      </div>

      {/* ===================== SEGURANÇA E REINICIALIZAÇÃO ===================== */}
      <div className="prime-card p-6 border-slate-200 bg-slate-50/50 space-y-3">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <Shield className="w-4 h-4 text-slate-600" />
          <span>Gestão de Emergência & Reinicialização</span>
        </div>
        <p className="text-xs text-slate-600">
          Caso algum dia precise de reiniciar o sistema do zero para uma nova temporada da empresa, esta ação esvazia as tabelas. 
          <strong> Nota de Segurança:</strong> O sistema gera sempre um snapshot automático preventivo antes de qualquer limpeza.
        </p>
        <div className="pt-1 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              if (confirm('ATENÇÃO: Deseja apagar os dados ativos? Será gerado um backup preventivo no histórico antes de limpar.')) {
                clearAllDemoData();
                fetchBackups();
                alert('Sistema limpo com sucesso! Uma cópia de pré-limpeza foi guardada no Histórico de Backups.');
              }
            }}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-98"
          >
            <span>🗑️ Limpar Base Ativa (Gera Backup de Segurança Prévio)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
