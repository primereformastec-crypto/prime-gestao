import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Search, Building2, User, Users2, FileText, 
  Briefcase, X, ArrowRight, CornerDownLeft 
} from 'lucide-react';

export const GlobalSearchModal: React.FC = () => {
  const { 
    searchOpen, setSearchOpen, searchQuery, setSearchQuery, 
    projects, leads, clients, invoices, employees, 
    setSelectedProjectId, setSelectedLeadId, setActiveTab 
  } = useApp();

  const [query, setQuery] = useState('');

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(!searchOpen);
      }
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen, setSearchOpen]);

  if (!searchOpen) return null;

  const q = query.toLowerCase().trim();

  const filteredProjects = q ? projects.filter(p => 
    p.id.toLowerCase().includes(q) || 
    p.title.toLowerCase().includes(q) || 
    p.city.toLowerCase().includes(q) ||
    p.serviceType.toLowerCase().includes(q)
  ) : projects.slice(0, 3);

  const filteredLeads = q ? leads.filter(l => 
    l.id.toLowerCase().includes(q) || 
    l.name.toLowerCase().includes(q) || 
    l.phone.includes(q) ||
    l.service.toLowerCase().includes(q)
  ) : leads.slice(0, 3);

  const filteredClients = q ? clients.filter(c => 
    c.id.toLowerCase().includes(q) || 
    c.name.toLowerCase().includes(q) || 
    c.phone.includes(q) ||
    c.email.toLowerCase().includes(q)
  ) : clients.slice(0, 3);

  const filteredInvoices = q ? invoices.filter(i => 
    i.code.toLowerCase().includes(q) || 
    i.description.toLowerCase().includes(q) ||
    i.projectId.toLowerCase().includes(q)
  ) : invoices.slice(0, 2);

  const filteredEmployees = q ? employees.filter(e => 
    e.name.toLowerCase().includes(q) || 
    e.role.toLowerCase().includes(q)
  ) : employees.slice(0, 2);

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setActiveTab('obras');
    setSearchOpen(false);
  };

  const handleSelectLead = (leadId: string) => {
    setSelectedLeadId(leadId);
    setActiveTab('crm');
    setSearchOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-20 px-4 animate-in fade-in duration-100">
      <div 
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50/50">
          <Search className="w-5 h-5 text-sky-600 shrink-0" />
          <input
            type="text"
            placeholder="Pesquisar por ID da obra (OB-...), nome de cliente, telefone, fatura..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-slate-800 placeholder-slate-400 text-sm focus:outline-hidden font-medium"
          />
          <button 
            onClick={() => setSearchOpen(false)}
            className="p-1 hover:bg-slate-200 rounded-md text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4 divide-y divide-slate-100">
          {/* Projects */}
          {filteredProjects.length > 0 && (
            <div className="pt-2 first:pt-0">
              <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-500" />
                <span>Obras / Reformas</span>
              </div>
              <div className="mt-1 space-y-1">
                {filteredProjects.map(proj => (
                  <div
                    key={proj.id}
                    onClick={() => handleSelectProject(proj.id)}
                    className="p-2.5 hover:bg-sky-50 rounded-xl cursor-pointer flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-sky-700 bg-sky-100/70 px-2 py-0.5 rounded-md">
                        {proj.id}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 group-hover:text-sky-900">{proj.title}</p>
                        <p className="text-[11px] text-slate-400">{proj.city} • {proj.serviceType}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-700">€{proj.contractValue.toLocaleString('pt-PT')}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-sky-600" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leads */}
          {filteredLeads.length > 0 && (
            <div className="pt-3">
              <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                <span>Leads Comerciais</span>
              </div>
              <div className="mt-1 space-y-1">
                {filteredLeads.map(lead => (
                  <div
                    key={lead.id}
                    onClick={() => handleSelectLead(lead.id)}
                    className="p-2.5 hover:bg-blue-50 rounded-xl cursor-pointer flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md">
                        {lead.id}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 group-hover:text-blue-900">{lead.name}</p>
                        <p className="text-[11px] text-slate-400">{lead.service} • Tel: {lead.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-500 capitalize">{lead.status.replace('_', ' ')}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Clients */}
          {filteredClients.length > 0 && (
            <div className="pt-3">
              <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-purple-500" />
                <span>Clientes Cadastrados</span>
              </div>
              <div className="mt-1 space-y-1">
                {filteredClients.map(cli => (
                  <div
                    key={cli.id}
                    onClick={() => {
                      setActiveTab('clientes');
                      setSearchOpen(false);
                    }}
                    className="p-2.5 hover:bg-purple-50 rounded-xl cursor-pointer flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-md">
                        {cli.id}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{cli.name}</p>
                        <p className="text-[11px] text-slate-400">{cli.email} • {cli.city}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-purple-600" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invoices */}
          {filteredInvoices.length > 0 && (
            <div className="pt-3">
              <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-500" />
                <span>Faturas Emitidas</span>
              </div>
              <div className="mt-1 space-y-1">
                {filteredInvoices.map(inv => (
                  <div
                    key={inv.id}
                    onClick={() => {
                      setActiveTab('faturas');
                      setSearchOpen(false);
                    }}
                    className="p-2.5 hover:bg-emerald-50 rounded-xl cursor-pointer flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                        {inv.code}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{inv.description}</p>
                        <p className="text-[11px] text-slate-400">Obra: {inv.projectId} • Venc: {inv.dueDate}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-700">€{inv.totalAmount.toLocaleString('pt-PT')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400 px-4">
          <div className="flex items-center gap-2">
            <span>Navegue com setas</span>
            <span>•</span>
            <span>Selecione com</span>
            <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">Enter</kbd>
          </div>
          <div className="flex items-center gap-1">
            <span>Fechar com</span>
            <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">ESC</kbd>
          </div>
        </div>
      </div>
    </div>
  );
};
