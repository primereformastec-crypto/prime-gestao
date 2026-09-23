import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import * as XLSX from 'xlsx';
import { 
  UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, 
  Trash2, Filter, Sparkles, Users, ArrowRight, Check, X 
} from 'lucide-react';
import { Lead } from '../../types';

interface ParsedMetaLead {
  name: string;
  phone: string;
  email: string;
  city: string;
  address?: string;
  source: 'Meta Ads';
  service: string;
  salesRep: string;
  estimatedValue: number;
  status: 'novo_lead';
  dateAdded: string;
  notes: string;
  isLegacy: true;
  campaignName: string;
  adName?: string;
  rawMetaFields: Record<string, any>;
  fileName: string;
  isDuplicate: boolean;
}

export const MetaLeadImporter: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const { leads, importBatchLeads, setActiveTab } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [filesLoaded, setFilesLoaded] = useState<{ name: string; size: string; rowCount: number }[]>([]);
  const [parsedLeads, setParsedLeads] = useState<ParsedMetaLead[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [selectedCampaignFilter, setSelectedCampaignFilter] = useState('all');
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);

  // Normalize phone helper for Spain (+34) and international
  const cleanPhone = (raw: any): string => {
    if (!raw) return '';
    let str = String(raw).replace(/[^\d+]/g, '');
    if (str.startsWith('00')) str = '+' + str.substring(2);
    // If 9 digits (standard Spanish 6xx, 7xx, 8xx, 9xx), add +34
    if (str.length === 9) {
      str = '+34 ' + str;
    } else if (str.startsWith('34') && str.length === 11) {
      str = '+34 ' + str.substring(2);
    }
    return str;
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsParsing(true);
    setImportSuccessCount(null);

    const newFilesLoaded: { name: string; size: string; rowCount: number }[] = [];
    const allParsed: ParsedMetaLead[] = [];
    const seenPhonesAndEmails = new Set<string>();

    // Index existing phones and emails in database
    leads.forEach(l => {
      if (l.phone) seenPhonesAndEmails.add(cleanPhone(l.phone));
      if (l.email) seenPhonesAndEmails.add(l.email.toLowerCase().trim());
    });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: 'array' });
        
        let fileRowsCount = 0;

        wb.SheetNames.forEach(sheetName => {
          const ws = wb.Sheets[sheetName];
          const rawJson: any[] = XLSX.utils.sheet_to_json(ws);
          fileRowsCount += rawJson.length;

          rawJson.forEach(row => {
            // Find key by looking for substring matches in keys
            const keys = Object.keys(row);
            const findVal = (keywords: string[]) => {
              const matchedKey = keys.find(k => {
                const lower = k.toLowerCase().replace(/[\s_-]/g, '');
                return keywords.some(kw => lower.includes(kw));
              });
              return matchedKey ? row[matchedKey] : undefined;
            };

            // 1. Name
            let name = findVal(['fullname', 'nomecompleto', 'nome', 'firstlast']) || '';
            if (!name) {
              const fName = findVal(['firstname', 'primeironome']) || '';
              const lName = findVal(['lastname', 'sobrenome', 'ultimo']) || '';
              name = `${fName} ${lName}`.trim();
            }
            if (!name) name = 'Lead Meta Sem Nome';

            // 2. Phone
            const rawPhone = findVal(['phonenumber', 'telefone', 'telemovel', 'celular', 'phone', 'whatsapp']);
            const phone = cleanPhone(rawPhone);

            // 3. Email
            let email = (findVal(['email', 'correio', 'e-mail']) || '').toString().toLowerCase().trim();
            if (!email && name) {
              email = `${name.toLowerCase().replace(/[^\w]/g, '')}@meta.lead`;
            }

            // 4. Date
            const rawDate = findVal(['createdtime', 'data', 'date', 'createdat', 'datacriacao']);
            let dateAdded = new Date().toISOString().slice(0, 10);
            if (rawDate) {
              try {
                const parsedD = new Date(rawDate);
                if (!isNaN(parsedD.getTime())) {
                  dateAdded = parsedD.toISOString().slice(0, 10);
                }
              } catch {}
            }

            // 5. Campaign & Ad
            const campaignName = (findVal(['campaignname', 'campanha', 'campaign']) || file.name.replace(/\.[^/.]+$/, "")).toString();
            const adName = (findVal(['adname', 'anuncio', 'ad']) || '').toString();

            // 6. City / Address (Default Barcelona, Spain)
            const city = (findVal(['city', 'cidade', 'ciudad', 'localidad', 'municipio', 'poblacion', 'provincia', 'concelho']) || 'Barcelona').toString();
            const address = (findVal(['street', 'rua', 'morada', 'address', 'direccion', 'endereco']) || '').toString();

            // 7. Service / Question
            const serviceQuestion = findVal(['reforma', 'servico', 'servicio', 'obra', 'tipo', 'project', 'interess', 'ar_condicionado', 'aire']) || 'Reforma Geral / Remodelação';

            // 8. Estimated Budget (Only set if explicitly answered in form, otherwise 0)
            const rawBudget = findVal(['presupuesto', 'orcamento', 'budget', 'valor', 'cuanto', 'faixa', 'inversion']);
            let estimatedValue = 0;
            if (rawBudget) {
              const num = parseFloat(String(rawBudget).replace(/[^\d.]/g, ''));
              if (!isNaN(num) && num > 0) estimatedValue = num;
            }

            // Duplicate detection
            const phoneKey = cleanPhone(phone);
            const emailKey = email.toLowerCase().trim();
            let isDuplicate = false;

            if (phoneKey && seenPhonesAndEmails.has(phoneKey)) {
              isDuplicate = true;
            } else if (emailKey && seenPhonesAndEmails.has(emailKey) && !emailKey.endsWith('@meta.lead')) {
              isDuplicate = true;
            }

            if (phoneKey) seenPhonesAndEmails.add(phoneKey);
            if (emailKey && !emailKey.endsWith('@meta.lead')) seenPhonesAndEmails.add(emailKey);

            allParsed.push({
              name: String(name).trim(),
              phone: phone || 'Sem Telefone',
              email,
              city: String(city).trim(),
              address: address ? String(address).trim() : undefined,
              source: 'Meta Ads',
              service: String(serviceQuestion).trim(),
              salesRep: 'Alexandre (Comercial)',
              estimatedValue,
              status: 'novo_lead',
              dateAdded,
              notes: `Campanha Meta: ${campaignName}${adName ? ` | Anúncio: ${adName}` : ''}`,
              isLegacy: true,
              campaignName,
              adName: adName || undefined,
              rawMetaFields: row,
              fileName: file.name,
              isDuplicate
            });
          });
        });

        const sizeKb = (file.size / 1024).toFixed(1) + ' KB';
        newFilesLoaded.push({ name: file.name, size: sizeKb, rowCount: fileRowsCount });
      } catch (err) {
        console.error('Erro ao ler arquivo Meta:', file.name, err);
      }
    }

    setFilesLoaded(newFilesLoaded);
    setParsedLeads(allParsed);
    setIsParsing(false);
  };

  const handleConfirmImport = () => {
    const leadsToImport = parsedLeads.filter(l => !skipDuplicates || !l.isDuplicate);
    if (leadsToImport.length === 0) {
      alert('Nenhum lead elegível para importação.');
      return;
    }

    const payload = leadsToImport.map(p => ({
      name: p.name,
      phone: p.phone,
      email: p.email,
      city: p.city,
      address: p.address,
      source: p.source,
      service: p.service,
      salesRep: p.salesRep,
      estimatedValue: p.estimatedValue,
      status: p.status,
      dateAdded: p.dateAdded,
      notes: p.notes,
      isLegacy: true,
      campaignName: p.campaignName,
      adName: p.adName,
      rawMetaFields: p.rawMetaFields
    }));

    const count = importBatchLeads(payload);
    setImportSuccessCount(count);

    setTimeout(() => {
      if (onComplete) {
        onComplete();
      } else {
        setActiveTab('leads_antigos');
      }
    }, 2000);
  };

  const totalDuplicates = parsedLeads.filter(l => l.isDuplicate).length;
  const totalUnique = parsedLeads.length - totalDuplicates;
  const campaignsList = Array.from(new Set(parsedLeads.map(l => l.campaignName)));

  const displayLeads = parsedLeads.filter(l => {
    if (selectedCampaignFilter !== 'all' && l.campaignName !== selectedCampaignFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-sm border border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500 text-white">
                Meta Ads Importer
              </span>
              <span className="text-xs text-slate-300 font-mono">11 Ficheiros em Lote</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight">
              Importador de Leads Históricos do Meta Ads
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl">
              Arraste ou selecione os seus 11 ficheiros Excel do Facebook/Instagram. O sistema mapeia os contactos automaticamente, deteta duplicados e organiza tudo na coluna de primeiro contacto do Alexandre.
            </p>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Selecionar Ficheiros Excel ({filesLoaded.length > 0 ? `${filesLoaded.length} Carregados` : '11 Ficheiros'})</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept=".xlsx, .xls, .csv"
            onChange={handleFilesSelected}
            className="hidden"
          />
        </div>
      </div>

      {/* Upload Zone / Drop area */}
      {filesLoaded.length === 0 && (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="p-12 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl bg-white hover:bg-blue-50/30 flex flex-col items-center justify-center cursor-pointer transition-all space-y-3 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Clique aqui ou arraste os seus 11 ficheiros Excel (.xlsx ou .csv)</h3>
            <p className="text-xs text-slate-500 mt-1">
              Pode selecionar todos os 11 ficheiros de uma vez só!
            </p>
          </div>
          <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[11px] font-semibold">
            Meta Ads (Facebook & Instagram Lead Forms)
          </span>
        </div>
      )}

      {/* Parsing progress */}
      {isParsing && (
        <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-700">A processar ficheiros e a mapear colunas do Meta Ads...</p>
        </div>
      )}

      {/* Success Banner */}
      {importSuccessCount !== null && (
        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
          <div>
            <h4 className="font-bold text-sm">Importação Concluída com Sucesso!</h4>
            <p className="text-xs mt-0.5">
              {importSuccessCount} leads foram adicionados ao <strong>Pipeline de Leads Antigos</strong> na coluna "Primeiro Contacto". A redirecionar...
            </p>
          </div>
        </div>
      )}

      {/* Results & Batch Summary */}
      {filesLoaded.length > 0 && !isParsing && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="prime-card p-4">
              <span className="text-[11px] text-slate-500 font-semibold block">Ficheiros Lidos</span>
              <span className="text-xl font-black text-slate-900 mt-1 block">{filesLoaded.length} / 11</span>
              <span className="text-[10px] text-slate-400">Excels processados</span>
            </div>

            <div className="prime-card p-4">
              <span className="text-[11px] text-slate-500 font-semibold block">Total de Leads</span>
              <span className="text-xl font-black text-blue-600 mt-1 block">{parsedLeads.length}</span>
              <span className="text-[10px] text-slate-400">Registos encontrados</span>
            </div>

            <div className="prime-card p-4">
              <span className="text-[11px] text-slate-500 font-semibold block">Leads Únicos</span>
              <span className="text-xl font-black text-emerald-600 mt-1 block">{totalUnique}</span>
              <span className="text-[10px] text-emerald-700 font-medium">Novos contactos</span>
            </div>

            <div className="prime-card p-4">
              <span className="text-[11px] text-slate-500 font-semibold block">Duplicados Detetados</span>
              <span className="text-xl font-black text-amber-600 mt-1 block">{totalDuplicates}</span>
              <span className="text-[10px] text-slate-400">Já registados na base</span>
            </div>
          </div>

          {/* Action & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={skipDuplicates}
                  onChange={e => setSkipDuplicates(e.target.checked)}
                  className="rounded text-blue-600 w-4 h-4"
                />
                <span>Ignorar contactos duplicados (Recomendado)</span>
              </label>

              {campaignsList.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Filtrar Campanha:</span>
                  <select
                    value={selectedCampaignFilter}
                    onChange={e => setSelectedCampaignFilter(e.target.value)}
                    className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="all">Todas as Campanhas ({campaignsList.length})</option>
                    {campaignsList.map((c, i) => (
                      <option key={i} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => {
                  setFilesLoaded([]);
                  setParsedLeads([]);
                }}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold"
              >
                Limpar
              </button>

              <button
                onClick={handleConfirmImport}
                className="prime-btn-primary px-5 py-2.5 text-xs flex items-center gap-2 shadow-md w-full md:w-auto justify-center"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>
                  Confirmar e Importar {skipDuplicates ? totalUnique : parsedLeads.length} Leads para o Pipeline
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Leads Preview Table */}
          <div className="prime-card overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-xs">
                Pré-visualização dos Leads Mapeados ({displayLeads.length})
              </h3>
              <span className="text-[11px] text-slate-500">
                Todos entrarão na coluna "Primeiro Contacto" para triagem do Alexandre
              </span>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] sticky top-0">
                  <tr>
                    <th className="p-3">Data</th>
                    <th className="p-3">Nome do Lead</th>
                    <th className="p-3">Telefone</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Cidade / Local</th>
                    <th className="p-3">Campanha</th>
                    <th className="p-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayLeads.slice(0, 50).map((lead, idx) => (
                    <tr key={idx} className={lead.isDuplicate ? 'bg-amber-50/40 text-slate-500' : 'hover:bg-slate-50'}>
                      <td className="p-3 font-mono text-[11px] text-slate-500">{lead.dateAdded}</td>
                      <td className="p-3 font-bold text-slate-900">{lead.name}</td>
                      <td className="p-3 font-mono font-medium text-slate-700">{lead.phone}</td>
                      <td className="p-3 text-slate-600 truncate max-w-[160px]">{lead.email}</td>
                      <td className="p-3 text-slate-600">{lead.city}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-medium text-[10px] truncate max-w-[140px] block">
                          {lead.campaignName}
                        </span>
                      </td>
                      <td className="p-3">
                        {lead.isDuplicate ? (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px]">
                            Duplicado
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                            Novo
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {displayLeads.length > 50 && (
                <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 border-t border-slate-100">
                  A mostrar 50 de {displayLeads.length} leads. Todos serão importados ao confirmar.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
