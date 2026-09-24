import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MaterialStockItem } from '../../types';
import { formatCurrency, parseCurrencyInput, sanitizeCurrencyInput } from '../../utils/currency';
import { 
  Package, Plus, Search, Filter, Trash2, Edit3, 
  AlertTriangle, CheckCircle2, Building2, Euro, 
  Archive, ArrowDown, ArrowUp, X
} from 'lucide-react';

const STANDARD_CATEGORIES = [
  'Cimentos & Argamassas',
  'Pintura & Isolamento',
  'Canalização & Hidráulica',
  'Eletricidade & Cablagens',
  'Gesso Cartonado / Pladur',
  'Cerâmica & Revestimentos',
  'Impermeabilização & Telhados',
  'Ferragens & Fixações',
  'Outro Material'
];

const STANDARD_UNITS = [
  'Saco 25kg',
  'Lata 15L',
  'Metros',
  'm²',
  'Placa',
  'Unidades',
  'Caixa',
  'Rolo',
  'kg'
];

export const MaterialStockView: React.FC = () => {
  const { materialStock, addMaterialStockItem, updateMaterialStockItem, deleteMaterialStockItem } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todos');

  // Modal: Novo Item de Stock
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemForm, setNewItemForm] = useState({
    code: '',
    name: '',
    category: STANDARD_CATEGORIES[0],
    quantity: '10',
    unit: STANDARD_UNITS[0],
    location: 'Armazém Central',
    minQuantity: '3',
    unitPrice: '',
    notes: ''
  });

  // Modal: Editar Item de Stock
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MaterialStockItem | null>(null);
  const [editItemForm, setEditItemForm] = useState({
    code: '',
    name: '',
    category: '',
    quantity: '0',
    unit: '',
    location: '',
    minQuantity: '0',
    unitPrice: '',
    notes: ''
  });

  // Filtragem
  const filteredStock = materialStock.filter(item => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      !q || 
      item.name.toLowerCase().includes(q) || 
      item.code.toLowerCase().includes(q) || 
      item.location.toLowerCase().includes(q);

    const matchesCategory = categoryFilter === 'todos' || item.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Métricas
  const totalItems = materialStock.length;
  const lowStockCount = materialStock.filter(m => m.minQuantity && m.quantity <= m.minQuantity).length;
  const totalStockValue = materialStock.reduce((acc, m) => acc + (m.quantity * (m.unitPrice || 0)), 0);

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemForm.name.trim()) {
      alert('O nome do material é obrigatório.');
      return;
    }

    addMaterialStockItem({
      code: newItemForm.code.trim(),
      name: newItemForm.name.trim(),
      category: newItemForm.category,
      quantity: Number(newItemForm.quantity) || 0,
      unit: newItemForm.unit,
      location: newItemForm.location.trim() || 'Armazém Central',
      minQuantity: Number(newItemForm.minQuantity) || 0,
      unitPrice: parseCurrencyInput(newItemForm.unitPrice),
      notes: newItemForm.notes.trim()
    });

    setShowAddModal(false);
    setNewItemForm({
      code: '',
      name: '',
      category: STANDARD_CATEGORIES[0],
      quantity: '10',
      unit: STANDARD_UNITS[0],
      location: 'Armazém Central',
      minQuantity: '3',
      unitPrice: '',
      notes: ''
    });
  };

  const openEditModal = (item: MaterialStockItem) => {
    setEditingItem(item);
    setEditItemForm({
      code: item.code,
      name: item.name,
      category: item.category,
      quantity: String(item.quantity),
      unit: item.unit,
      location: item.location,
      minQuantity: String(item.minQuantity || 0),
      unitPrice: String(item.unitPrice || ''),
      notes: item.notes || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    updateMaterialStockItem(editingItem.id, {
      code: editItemForm.code.trim() || editingItem.code,
      name: editItemForm.name.trim(),
      category: editItemForm.category,
      quantity: Number(editItemForm.quantity) || 0,
      unit: editItemForm.unit,
      location: editItemForm.location.trim(),
      minQuantity: Number(editItemForm.minQuantity) || 0,
      unitPrice: parseCurrencyInput(editItemForm.unitPrice),
      notes: editItemForm.notes.trim()
    });

    setShowEditModal(false);
    setEditingItem(null);
  };

  const handleDeleteItem = (item: MaterialStockItem) => {
    if (window.confirm(`Tem a certeza que deseja eliminar "${item.name}" (${item.code}) do stock?`)) {
      deleteMaterialStockItem(item.id);
    }
  };

  const handleAdjustQuantity = (item: MaterialStockItem, delta: number) => {
    const newQty = Math.max(0, item.quantity + delta);
    updateMaterialStockItem(item.id, { quantity: newQty });
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-sky-700 font-bold uppercase tracking-wider mb-1">
            <Package className="w-4 h-4 text-sky-600" />
            <span>Gestão & Obras • Materiais de Armazém</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Materiais & Stock em Armazém</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Catálogo e inventário de sobras de obra, materiais básicos em armazém e controlo de quantidades.
          </p>
        </div>

        <button
          onClick={() => {
            const nextNum = materialStock.length + 1;
            setNewItemForm(prev => ({ ...prev, code: `MAT-${String(nextNum).padStart(3, '0')}` }));
            setShowAddModal(true);
          }}
          className="prime-button px-4 py-2 text-xs flex items-center gap-2 shadow-md shadow-sky-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>+ Adicionar Material</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="prime-card p-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total de Materiais</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-900">{totalItems}</span>
            <span className="text-xs font-semibold text-sky-600">Itens registados</span>
          </div>
        </div>

        <div className="prime-card p-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Categorias</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-900">
              {new Set(materialStock.map(m => m.category)).size}
            </span>
            <span className="text-xs font-semibold text-slate-400">Em armazém</span>
          </div>
        </div>

        <div className="prime-card p-4 border-amber-200 bg-amber-50/30">
          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">Stock Reduzido</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-amber-700">{lowStockCount}</span>
            <span className="text-xs font-semibold text-amber-600">Abaixo do mínimo</span>
          </div>
        </div>

        <div className="prime-card p-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Valor Estimado</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-emerald-600">{formatCurrency(totalStockValue)}</span>
            <span className="text-xs font-semibold text-slate-400">Património</span>
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="prime-card p-3 md:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar material por nome, código MAT ou localização..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-sky-500"
        >
          <option value="todos">Todas as Categorias</option>
          {STANDARD_CATEGORIES.map((c, i) => (
            <option key={i} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Tabela de Stock */}
      <div className="prime-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Código / Material</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Localização</th>
                <th className="py-3 px-4 text-center">Quantidade</th>
                <th className="py-3 px-4 text-right">Preço Unit.</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
                <th className="py-3 px-4 text-center">Ações Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStock.map(item => {
                const isLow = item.minQuantity && item.quantity <= item.minQuantity;
                const subtotal = item.quantity * (item.unitPrice || 0);

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{item.name}</span>
                      <span className="text-[10px] text-sky-700 font-mono font-bold bg-sky-50 px-1 py-0.2 rounded">
                        {item.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{item.location}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleAdjustQuantity(item, -1)}
                          className="w-5 h-5 rounded bg-slate-200 hover:bg-slate-300 flex items-center justify-center font-bold text-slate-700"
                          title="Diminuir 1"
                        >
                          -
                        </button>
                        <span className={`font-black text-xs ${isLow ? 'text-rose-600 font-bold' : 'text-slate-900'}`}>
                          {item.quantity} {item.unit}
                        </span>
                        <button
                          onClick={() => handleAdjustQuantity(item, 1)}
                          className="w-5 h-5 rounded bg-slate-200 hover:bg-slate-300 flex items-center justify-center font-bold text-slate-700"
                          title="Aumentar 1"
                        >
                          +
                        </button>
                      </div>
                      {isLow && (
                        <span className="block text-[9px] text-rose-500 font-semibold mt-0.5">
                          ⚠️ Abaixo do mín ({item.minQuantity})
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                      {item.unitPrice ? formatCurrency(item.unitPrice) : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900">
                      {subtotal > 0 ? formatCurrency(subtotal) : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1 text-slate-400 hover:text-sky-600"
                          title="Editar"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                          title="Eliminar"
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

      {/* MODAL: NOVO MATERIAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-sky-600" />
                <h3 className="font-bold text-slate-900 text-sm">Adicionar Material ao Stock</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateItem} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Código *</label>
                  <input
                    type="text"
                    required
                    value={newItemForm.code}
                    onChange={e => setNewItemForm({ ...newItemForm, code: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Nome do Material *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Argamassa Colante Porcelânico C2TE"
                    value={newItemForm.name}
                    onChange={e => setNewItemForm({ ...newItemForm, name: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Categoria *</label>
                  <select
                    value={newItemForm.category}
                    onChange={e => setNewItemForm({ ...newItemForm, category: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    {STANDARD_CATEGORIES.map((c, i) => (
                      <option key={i} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unidade de Medida</label>
                  <select
                    value={newItemForm.unit}
                    onChange={e => setNewItemForm({ ...newItemForm, unit: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    {STANDARD_UNITS.map((u, i) => (
                      <option key={i} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quantidade *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={newItemForm.quantity}
                    onChange={e => setNewItemForm({ ...newItemForm, quantity: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Qtd. Mínima</label>
                  <input
                    type="number"
                    min={0}
                    value={newItemForm.minQuantity}
                    onChange={e => setNewItemForm({ ...newItemForm, minQuantity: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Preço Unit. (€)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="9,80"
                    value={newItemForm.unitPrice}
                    onChange={e => setNewItemForm({ ...newItemForm, unitPrice: sanitizeCurrencyInput(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Localização no Armazém / Obra</label>
                <input
                  type="text"
                  placeholder="Ex: Armazém Central - Prateleira A2 ou Sobra da Obra Sant Cugat"
                  value={newItemForm.location}
                  onChange={e => setNewItemForm({ ...newItemForm, location: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notas / Observações</label>
                <textarea
                  rows={2}
                  placeholder="Instruções de armazenamento, lote, validade..."
                  value={newItemForm.notes}
                  onChange={e => setNewItemForm({ ...newItemForm, notes: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Guardar Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR MATERIAL */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-sky-600" />
                <h3 className="font-bold text-slate-900 text-sm">Editar Material {editingItem.code}</h3>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleUpdateItem} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Código *</label>
                  <input
                    type="text"
                    required
                    value={editItemForm.code}
                    onChange={e => setEditItemForm({ ...editItemForm, code: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Nome do Material *</label>
                  <input
                    type="text"
                    required
                    value={editItemForm.name}
                    onChange={e => setEditItemForm({ ...editItemForm, name: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Categoria *</label>
                  <select
                    value={editItemForm.category}
                    onChange={e => setEditItemForm({ ...editItemForm, category: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    {STANDARD_CATEGORIES.map((c, i) => (
                      <option key={i} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unidade</label>
                  <input
                    type="text"
                    value={editItemForm.unit}
                    onChange={e => setEditItemForm({ ...editItemForm, unit: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quantidade *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editItemForm.quantity}
                    onChange={e => setEditItemForm({ ...editItemForm, quantity: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Qtd. Mínima</label>
                  <input
                    type="number"
                    min={0}
                    value={editItemForm.minQuantity}
                    onChange={e => setEditItemForm({ ...editItemForm, minQuantity: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Preço Unit. (€)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={editItemForm.unitPrice}
                    onChange={e => setEditItemForm({ ...editItemForm, unitPrice: sanitizeCurrencyInput(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Localização</label>
                <input
                  type="text"
                  value={editItemForm.location}
                  onChange={e => setEditItemForm({ ...editItemForm, location: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notas / Observações</label>
                <textarea
                  rows={2}
                  value={editItemForm.notes}
                  onChange={e => setEditItemForm({ ...editItemForm, notes: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-slate-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Atualizar Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
