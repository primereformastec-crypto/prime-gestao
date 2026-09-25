import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Client } from '../../types';
import { 
  Users, UserCheck, Phone, Mail, MapPin, Building2, 
  FileText, Plus, Search, Euro, Calendar, ArrowRight,
  CreditCard, CheckCircle2, Clock, AlertTriangle, LayoutList, LayoutGrid,
  Edit3, Trash2, MessageCircle, ExternalLink, Check
} from 'lucide-react';

export const ClientsView: React.FC = () => {
  const { clients, projects, invoices, payments, addClient, updateClient, deleteClient, setSelectedProjectId, setActiveTab } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(clients[0] || null);
  const [viewMode, setViewMode] = useState<'sheet' | 'table'>('sheet');
  const [showAddModal, setShowAddModal] = useState(false);

  // Modal e estado para edição de cliente
  const [showEditModal, setShowEditModal] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [editClientForm, setEditClientForm] = useState({
    name: '',
    phone: '',
    email: '',
    nif: '',
    address: '',
    city: 'Barcelona',
    notes: ''
  });

  const openEditModal = (client: Client) => {
    setClientToEdit(client);
    setEditClientForm({
      name: client.name || '',
      phone: client.phone || '',
      email: client.email || '',
      nif: client.nif || '',
      address: client.address || '',
      city: client.city || 'Barcelona',
      notes: client.notes || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientToEdit) return;
    if (!editClientForm.name.trim() || !editClientForm.phone.trim()) {
      alert('Nome e Telefone/WhatsApp são campos obrigatórios.');
      return;
    }

    const updates: Partial<Client> = {
      name: editClientForm.name.trim(),
      phone: editClientForm.phone.trim(),
      email: editClientForm.email.trim(),
      nif: editClientForm.nif.trim() || undefined,
      address: editClientForm.address.trim(),
      city: editClientForm.city.trim() || 'Barcelona',
      notes: editClientForm.notes.trim()
    };

    updateClient(clientToEdit.id, updates);
    if (selectedClient?.id === clientToEdit.id) {
      setSelectedClient({ ...clientToEdit, ...updates });
    }
    setShowEditModal(false);
    setClientToEdit(null);
  };

  // Estados para modal seguro de eliminação
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [deleteAssociatedProjects, setDeleteAssociatedProjects] = useState(true);

  const openDeleteModal = (client: Client) => {
    setClientToDelete(client);
    const linked = projects.filter(p => p.clientId === client.id);
    setDeleteAssociatedProjects(linked.length > 0);
  };

  const handleCancelDelete = () => {
    setClientToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (!clientToDelete) return;

    deleteClient(clientToDelete.id, deleteAssociatedProjects);
    if (selectedClient?.id === clientToDelete.id) {
      const remaining = clients.filter(c => c.id !== clientToDelete.id);
      setSelectedClient(remaining[0] || null);
    }
    setShowEditModal(false);
    setClientToEdit(null);
    setClientToDelete(null);
  };

  // Form para novo cliente
  const [newClientForm, setNewClientForm] = useState({
    name: '',
    phone: '',
    email: '',
    nif: '',
    address: '',
    city: 'Barcelona',
    notes: ''
  });

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientForm.name.trim() || !newClientForm.phone.trim()) return;

    const created = addClient({
      name: newClientForm.name.trim(),
      phone: newClientForm.phone.trim(),
      email: newClientForm.email.trim(),
      nif: newClientForm.nif.trim() || undefined,
      address: newClientForm.address.trim(),
      city: newClientForm.city.trim() || 'Barcelona',
      notes: newClientForm.notes.trim()
    });

    setSelectedClient(created);
    setShowAddModal(false);
    setNewClientForm({
      name: '',
      phone: '',
      email: '',
      nif: '',
      address: '',
      city: 'Barcelona',
      notes: ''
    });
  };

  // Garante que o cliente selecionado reflete as atualizações mais recentes em tempo real
  const currentClient = selectedClient 
    ? (clients.find(c => c.id === selectedClient.id) || selectedClient) 
    : (clients[0] || null);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    c.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.nif && c.nif.includes(searchQuery))
  );

  const clientProjects = currentClient ? projects.filter(p => p.clientId === currentClient.id) : [];
  const clientInvoices = currentClient ? invoices.filter(i => i.clientId === currentClient.id) : [];
  const clientPayments = currentClient ? payments.filter(p => p.clientId === currentClient.id) : [];

  const totalContracted = clientProjects.reduce((s, p) => s + p.contractValue, 0);
  const totalBilled = clientInvoices.reduce((s, i) => s + i.totalAmount, 0);
  const totalPaid = clientPayments.reduce((s, p) => s + p.amount, 0);
  const totalPending = Math.max(0, totalBilled - totalPaid);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Carteira de Clientes Oficiais</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
              {clients.length} clientes ativos
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Base oficial de clientes contratados da PRIME, sem misturar com leads em negociação do CRM.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('sheet')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'sheet' ? 'bg-white shadow-xs text-sky-700 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
              title="Ficha do Cliente"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white shadow-xs text-sky-700 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
              title="Tabela Completa"
            >
              <LayoutList className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Cliente</span>
          </button>
        </div>
      </div>

      {/* VIEW: FICHA DO CLIENTE */}
      {viewMode === 'sheet' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Col: Clients Directory */}
          <div className="prime-card p-4 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Pesquisar por nome, NIF, telemóvel..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-hidden"
              />
            </div>

            <div className="divide-y divide-slate-100 max-h-[65vh] overflow-y-auto space-y-1">
              {filteredClients.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 italic">
                  Nenhum cliente encontrado.
                </div>
              ) : (
                filteredClients.map(client => {
                  const isSelected = currentClient?.id === client.id;
                  const pCount = projects.filter(p => p.clientId === client.id).length;
                  const cInvoices = invoices.filter(i => i.clientId === client.id);
                  const cPayments = payments.filter(p => p.clientId === client.id);
                  const billed = cInvoices.reduce((s, i) => s + i.totalAmount, 0);
                  const paid = cPayments.reduce((s, p) => s + p.amount, 0);
                  const pending = Math.max(0, billed - paid);

                  return (
                    <div
                      key={client.id}
                      onClick={() => setSelectedClient(client)}
                      className={`p-3 rounded-xl cursor-pointer transition-all ${
                        isSelected ? 'bg-sky-50/80 border border-sky-200 shadow-xs' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-[10px] font-bold text-sky-700 bg-sky-100/70 px-1.5 py-0.2 rounded">
                          {client.id}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500">{pCount} obra(s)</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 mt-1">{client.name}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">{client.city || 'Barcelona'} • {client.phone}</p>
                      {pending > 0 && (
                        <span className="inline-block mt-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                          €{pending.toLocaleString('pt-PT')} pendente
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Col: Client Sheet */}
          {currentClient ? (
            <div className="lg:col-span-2 space-y-6">
              {/* Client Top Card */}
              <div className="prime-card p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="text-xl font-bold text-slate-900">{currentClient.name}</h2>
                      <span className="font-mono text-xs font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded">
                        {currentClient.id}
                      </span>
                      <button
                        onClick={() => openEditModal(currentClient)}
                        className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs hover:scale-102 cursor-pointer"
                        title="Editar dados do cliente (WhatsApp, Morada, NIF...)"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                        <span>Editar Cliente</span>
                      </button>
                      <button
                        onClick={() => openDeleteModal(currentClient)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer ml-0.5"
                        title="Eliminar cliente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-3.5 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {currentClient.phone ? (
                          <a href={`tel:${currentClient.phone}`} className="hover:text-sky-600 font-bold text-slate-900">
                            {currentClient.phone}
                          </a>
                        ) : (
                          <span className="text-rose-500 font-semibold italic">Sem telefone</span>
                        )}
                        {currentClient.phone && currentClient.phone.replace(/[^0-9]/g, '').length >= 6 ? (
                          <a
                            href={`https://wa.me/${currentClient.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded text-[10px] font-bold transition-all ml-1 shadow-2xs"
                            title="Abrir WhatsApp"
                          >
                            <MessageCircle className="w-3 h-3 text-emerald-600" />
                            <span>WhatsApp</span>
                          </a>
                        ) : (
                          <button
                            onClick={() => openEditModal(currentClient)}
                            className="text-[10px] text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded font-bold ml-1 cursor-pointer"
                          >
                            + Inserir WhatsApp
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {currentClient.email ? (
                          <a href={`mailto:${currentClient.email}`} className="hover:text-sky-600 truncate font-medium">
                            {currentClient.email}
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">Sem email</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{currentClient.address ? `${currentClient.address}, ` : ''}<strong>{currentClient.city || 'Barcelona'}</strong></span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>NIF: <strong>{currentClient.nif || 'Não informado'}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-right sm:min-w-[160px]">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Obras</span>
                    <span className="text-xl font-black text-slate-900 block mt-0.5">€{totalContracted.toLocaleString('pt-PT')}</span>
                    <div className="text-xs font-semibold text-emerald-600 mt-1">
                      €{totalPaid.toLocaleString('pt-PT')} recebido
                    </div>
                    {totalPending > 0 && (
                      <div className="text-xs font-bold text-rose-600 mt-0.5">
                        €{totalPending.toLocaleString('pt-PT')} a cobrar
                      </div>
                    )}
                  </div>
                </div>

                {currentClient.notes && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                    <span className="font-bold text-slate-800">Observações: </span>
                    {currentClient.notes}
                  </div>
                )}
              </div>

              {/* Client Projects */}
              <div className="prime-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-sky-600" />
                    <span>Obras do Cliente ({clientProjects.length})</span>
                  </h3>
                </div>

                {clientProjects.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">Nenhuma obra registada para este cliente.</p>
                ) : (
                  <div className="space-y-2">
                    {clientProjects.map(proj => (
                      <div
                        key={proj.id}
                        onClick={() => {
                          setSelectedProjectId(proj.id);
                          setActiveTab('obras');
                        }}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-sky-400 hover:bg-sky-50/50 cursor-pointer transition-all flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-sky-700">{proj.id}</span>
                            <span className="text-xs font-bold text-slate-900">{proj.title}</span>
                          </div>
                          <span className="text-[11px] text-slate-500 mt-0.5 block">{proj.city} • {proj.serviceType}</span>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-black text-slate-900 block">€{proj.contractValue.toLocaleString('pt-PT')}</span>
                          <span className="text-[10px] text-sky-600 font-semibold">{proj.progressPercent}% concluído</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Client Invoices & Payments */}
              <div className="prime-card p-5 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Faturas Emitidas & Recebimentos ({clientInvoices.length})</span>
                </h3>

                {clientInvoices.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">Nenhuma fatura emitida para este cliente ainda.</p>
                ) : (
                  <div className="space-y-2">
                    {clientInvoices.map(inv => {
                      const balance = inv.totalAmount - inv.receivedAmount;
                      return (
                        <div key={inv.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-800">{inv.code}</span>
                              <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                                inv.status === 'paga' ? 'bg-emerald-100 text-emerald-800' :
                                inv.status === 'parcialmente_paga' ? 'bg-indigo-100 text-indigo-800' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {inv.status === 'paga' ? 'LIQUIDADA' : inv.status === 'parcialmente_paga' ? 'PARCIAL' : 'PENDENTE'}
                              </span>
                            </div>
                            <span className="text-slate-500 text-[11px] block mt-0.5">{inv.description} • Venc: {inv.dueDate}</span>
                          </div>

                          <div className="text-right">
                            <span className="font-black text-slate-900 block">€{inv.totalAmount.toLocaleString('pt-PT')}</span>
                            {balance > 0 && (
                              <span className="text-[10px] font-bold text-rose-600 block">Falta receber: €{balance.toLocaleString('pt-PT')}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="lg:col-span-2 prime-card p-12 text-center text-slate-400 italic">
              Nenhum cliente selecionado. Selecione um cliente da lista à esquerda ou clique em "+ Novo Cliente".
            </div>
          )}
        </div>
      ) : (
        /* VIEW: TABELA COMPLETA */
        <div className="prime-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">NIF</th>
                  <th className="py-3 px-4">Contacto</th>
                  <th className="py-3 px-4">Cidade</th>
                  <th className="py-3 px-4 text-center">Obras</th>
                  <th className="py-3 px-4 text-right">Total Contratado</th>
                  <th className="py-3 px-4 text-right">Já Pago</th>
                  <th className="py-3 px-4 text-right">Pendente</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClients.map(c => {
                  const pCount = projects.filter(p => p.clientId === c.id).length;
                  const cProjects = projects.filter(p => p.clientId === c.id);
                  const cInvoices = invoices.filter(i => i.clientId === c.id);
                  const cPayments = payments.filter(p => p.clientId === c.id);
                  const contracted = cProjects.reduce((s, p) => s + p.contractValue, 0);
                  const billed = cInvoices.reduce((s, i) => s + i.totalAmount, 0);
                  const paid = cPayments.reduce((s, p) => s + p.amount, 0);
                  const pending = Math.max(0, billed - paid);

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-sky-700">{c.id}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{c.name}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono">{c.nif || '-'}</td>
                      <td className="py-3.5 px-4">
                        <span className="block text-slate-800 font-medium">{c.phone}</span>
                        <span className="text-[10px] text-slate-400 block">{c.email}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{c.city}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-700">{pCount}</td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-900">€{contracted.toLocaleString('pt-PT')}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-600">€{paid.toLocaleString('pt-PT')}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-rose-600">
                        {pending > 0 ? `€${pending.toLocaleString('pt-PT')}` : '€0'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedClient(c);
                              setViewMode('sheet');
                            }}
                            className="px-2.5 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg font-bold text-xs cursor-pointer transition-colors"
                          >
                            Ver Ficha
                          </button>
                          <button
                            onClick={() => openEditModal(c)}
                            className="p-1 px-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                            title="Editar Cliente"
                          >
                            <Edit3 className="w-3 h-3 text-amber-600" />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => openDeleteModal(c)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar Cliente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: NOVO CLIENTE */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-400" />
                Registar Novo Cliente Oficial
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateClient} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome Completo do Cliente *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Dra. Mariana Costa"
                  value={newClientForm.name}
                  onChange={e => setNewClientForm({ ...newClientForm, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Telemóvel / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+351 912 345 678"
                    value={newClientForm.phone}
                    onChange={e => setNewClientForm({ ...newClientForm, phone: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="cliente@email.pt"
                    value={newClientForm.email}
                    onChange={e => setNewClientForm({ ...newClientForm, email: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIF (Número de Contribuinte)</label>
                  <input
                    type="text"
                    placeholder="Ex: 234567890"
                    value={newClientForm.nif}
                    onChange={e => setNewClientForm({ ...newClientForm, nif: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cidade</label>
                  <input
                    type="text"
                    value={newClientForm.city}
                    onChange={e => setNewClientForm({ ...newClientForm, city: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Morada de Residência / Faturação</label>
                <input
                  type="text"
                  placeholder="Rua, número, andar, código postal"
                  value={newClientForm.address}
                  onChange={e => setNewClientForm({ ...newClientForm, address: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notas / Observações</label>
                <textarea
                  rows={2}
                  placeholder="Preferências do cliente, restrições de horário, etc."
                  value={newClientForm.notes}
                  onChange={e => setNewClientForm({ ...newClientForm, notes: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold shadow-xs"
                >
                  Cadastrar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR DADOS DO CLIENTE */}
      {showEditModal && clientToEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  Editar Dados do Cliente
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                  {clientToEdit.name} • {clientToEdit.id}
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowEditModal(false);
                  setClientToEdit(null);
                }} 
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateClient} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome Completo do Cliente *</label>
                <input
                  type="text"
                  required
                  placeholder="Nome do cliente"
                  value={editClientForm.name}
                  onChange={e => setEditClientForm({ ...editClientForm, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">Telemóvel / WhatsApp *</label>
                    {editClientForm.phone && editClientForm.phone.replace(/[^0-9]/g, '').length >= 6 && (
                      <a
                        href={`https://wa.me/${editClientForm.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-emerald-600 hover:underline flex items-center gap-0.5 font-bold"
                      >
                        <MessageCircle className="w-2.5 h-2.5" />
                        Testar
                      </a>
                    )}
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder="+34 600 000 000"
                    value={editClientForm.phone}
                    onChange={e => setEditClientForm({ ...editClientForm, phone: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none font-medium"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Ex: +34 612 345 678</span>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="cliente@email.com"
                    value={editClientForm.email}
                    onChange={e => setEditClientForm({ ...editClientForm, email: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIF (Número Fiscal / NIE)</label>
                  <input
                    type="text"
                    placeholder="Ex: Y1234567X ou 12345678Z"
                    value={editClientForm.nif}
                    onChange={e => setEditClientForm({ ...editClientForm, nif: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cidade</label>
                  <input
                    type="text"
                    placeholder="Barcelona"
                    value={editClientForm.city}
                    onChange={e => setEditClientForm({ ...editClientForm, city: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Morada / Endereço Completo</label>
                <input
                  type="text"
                  placeholder="Rua, número, andar, porta, código postal"
                  value={editClientForm.address}
                  onChange={e => setEditClientForm({ ...editClientForm, address: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notas / Observações</label>
                <textarea
                  rows={2}
                  placeholder="Informações adicionais sobre o cliente, preferências, etc."
                  value={editClientForm.notes}
                  onChange={e => setEditClientForm({ ...editClientForm, notes: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const toDel = clientToEdit;
                    setShowEditModal(false);
                    if (toDel) openDeleteModal(toDel);
                  }}
                  className="text-xs text-slate-400 hover:text-rose-600 hover:underline flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar este cliente...</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setClientToEdit(null);
                    }}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Guardar Alterações</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ELIMINAR CLIENTE DEFINITIVAMENTE */}
      {clientToDelete && (
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
                    Eliminar Registo de Cliente
                  </h3>
                  <p className="text-[11px] text-rose-700 font-medium">
                    Confirme se deseja remover definitivamente este cliente
                  </p>
                </div>
              </div>
              <button 
                onClick={handleCancelDelete} 
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
                    Você está prestes a eliminar o registo de <strong>{clientToDelete.name}</strong> ({clientToDelete.id}).
                    Esta operação removerá o cliente da carteira e sincronizará a remoção com a nuvem permanente da PRIME.
                  </p>
                </div>
              </div>

              {/* Ficha resumida do cliente que será eliminado */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded">
                    {clientToDelete.id}
                  </span>
                  <span className="text-[11px] text-slate-500 font-semibold">
                    Criado em: {clientToDelete.createdAt || '2026-09-24'}
                  </span>
                </div>
                <h4 className="text-sm font-black text-slate-900">{clientToDelete.name}</h4>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                  <div><strong>Telefone:</strong> {clientToDelete.phone || 'Sem telefone'}</div>
                  <div><strong>NIF:</strong> {clientToDelete.nif || 'Não informado'}</div>
                  <div className="col-span-2"><strong>Morada:</strong> {clientToDelete.address || '-'}, {clientToDelete.city || 'Barcelona'}</div>
                </div>
              </div>

              {/* Obras associadas */}
              {(() => {
                const linkedObras = projects.filter(p => p.clientId === clientToDelete.id);
                return linkedObras.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>Obras vinculadas ({linkedObras.length})</span>
                    </div>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {linkedObras.map(o => (
                        <div key={o.id} className="p-2.5 bg-slate-100/90 rounded-lg flex items-center justify-between text-[11px]">
                          <div>
                            <span className="font-mono font-bold text-sky-700">{o.id}</span> - <span className="font-semibold">{o.title}</span>
                          </div>
                          <span className="font-bold text-slate-900">€{o.contractValue.toLocaleString('pt-PT')}</span>
                        </div>
                      ))}
                    </div>
                    <label className="flex items-center gap-2 pt-1 text-rose-700 font-bold cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={deleteAssociatedProjects}
                        onChange={e => setDeleteAssociatedProjects(e.target.checked)}
                        className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                      />
                      <span>Eliminar também as {linkedObras.length} obra(s) vinculada(s) a este cliente</span>
                    </label>
                  </div>
                ) : null;
              })()}

              {/* Rodapé com Botão Direto */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancelDelete}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white rounded-xl font-bold shadow-md cursor-pointer flex items-center gap-2 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Sim, Eliminar Cliente</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
