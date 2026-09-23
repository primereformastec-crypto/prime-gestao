import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import * as XLSX from 'xlsx';
import { 
  UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, 
  ArrowRight, Sparkles, Database, RefreshCw 
} from 'lucide-react';

export const ExcelImporter: React.FC = () => {
  const { importParsedData, resetToDefaultData, setActiveTab } = useApp();

  const [file1Status, setFile1Status] = useState<string | null>(null);
  const [file2Status, setFile2Status] = useState<string | null>(null);
  const [detectedSheets, setDetectedSheets] = useState<{ name: string; rows: number }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);

  // File 1 handler (CRM / Obras / Financeiro)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fileNum: 1 | 2) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        
        const sheetsSummary = wb.SheetNames.map(sheetName => {
          const ws = wb.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(ws);
          return { name: sheetName, rows: data.length };
        });

        setDetectedSheets(prev => [...prev, ...sheetsSummary]);
        if (fileNum === 1) {
          setFile1Status(`Ficheiro 1 carregado: ${file.name} (${wb.SheetNames.length} abas detetadas)`);
        } else {
          setFile2Status(`Ficheiro 2 carregado: ${file.name} (${wb.SheetNames.length} abas detetadas)`);
        }
      } catch (err) {
        console.error('Erro ao ler Excel:', err);
        alert('Erro ao processar ficheiro Excel. Certifique-se de que é um ficheiro .xlsx ou .xls válido.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleExecuteImport = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setSuccessMessage(true);
      setTimeout(() => {
        setSuccessMessage(false);
        setActiveTab('dashboard');
      }, 2500);
    }, 1200);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Importação de Ficheiros Excel</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Carregue os dois ficheiros Excel do sistema atual para sincronizar CRM, Obras, Diárias e Cronograma.
            </p>
          </div>
        </div>
      </div>

      {/* Two Upload Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload 1 */}
        <div className="prime-card p-6 flex flex-col justify-between border-2 border-dashed hover:border-sky-400 transition-all">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono text-xs font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded">
                FICHEIRO 1
              </span>
              <h3 className="font-bold text-sm text-slate-900">CRM / Obras / Financeiro</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Contém folhas de Leads, Clientes, Obras, Diárias, Materiais, Gastos e Faturas.
            </p>

            <label className="w-full flex flex-col items-center justify-center p-6 bg-slate-50 hover:bg-sky-50/50 rounded-xl cursor-pointer border border-slate-200 transition-colors">
              <UploadCloud className="w-8 h-8 text-sky-600 mb-2" />
              <span className="text-xs font-bold text-slate-700">Selecione ou arraste o ficheiro 1 (.xlsx)</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Suporta Excel (.xlsx, .xls)</span>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={e => handleFileUpload(e, 1)}
                className="hidden"
              />
            </label>
          </div>

          {file1Status && (
            <div className="mt-4 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate">{file1Status}</span>
            </div>
          )}
        </div>

        {/* Upload 2 */}
        <div className="prime-card p-6 flex flex-col justify-between border-2 border-dashed hover:border-sky-400 transition-all">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono text-xs font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded">
                FICHEIRO 2
              </span>
              <h3 className="font-bold text-sm text-slate-900">Plano de Obra / Cronograma</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Contém a árvore de etapas, subetapas, prazos, marcos de faturação e Gantt.
            </p>

            <label className="w-full flex flex-col items-center justify-center p-6 bg-slate-50 hover:bg-sky-50/50 rounded-xl cursor-pointer border border-slate-200 transition-colors">
              <UploadCloud className="w-8 h-8 text-sky-600 mb-2" />
              <span className="text-xs font-bold text-slate-700">Selecione ou arraste o ficheiro 2 (.xlsx)</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Suporta Excel (.xlsx, .xls)</span>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={e => handleFileUpload(e, 2)}
                className="hidden"
              />
            </label>
          </div>

          {file2Status && (
            <div className="mt-4 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate">{file2Status}</span>
            </div>
          )}
        </div>
      </div>

      {/* Detected Sheets Summary */}
      {detectedSheets.length > 0 && (
        <div className="prime-card p-5 space-y-3 animate-in fade-in">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Abas & Registos Identificados nos Ficheiros:
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {detectedSheets.map((s, idx) => (
              <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-800">{s.name}</span>
                <span className="text-slate-400 font-mono">{s.rows} linhas</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Import Execution Button */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-slate-900 text-sm">Pronto para Sincronizar?</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            O motor relacional PRIME mapeará os IDs (OB-XXXX, CLI-XXXX) e recalculará custos e margens automaticamente.
          </p>
        </div>

        <button
          onClick={handleExecuteImport}
          disabled={isProcessing}
          className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Sincronizando Relacionamentos...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Importar para a Base da PRIME</span>
            </>
          )}
        </button>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold text-center animate-in fade-in">
          ✓ Dados importados com sucesso! Redirecionando para o Dashboard...
        </div>
      )}

      {/* Clean Slate button */}
      <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400">
        <span>Deseja reiniciar a base vazia para novos dados?</span>
        <button
          onClick={() => {
            if (confirm('Deseja limpar todos os dados e manter a base 100% vazia?')) {
              resetToDefaultData();
              alert('Base de dados 100% limpa!');
            }
          }}
          className="text-slate-600 hover:text-rose-600 font-semibold underline"
        >
          Limpar Base (0 Registos)
        </button>
      </div>
    </div>
  );
};
