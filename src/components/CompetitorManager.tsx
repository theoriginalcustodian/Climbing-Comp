import React, { useState } from 'react';
import { UserPlus, Plus, Search, Trash2, Edit2, FileText, FileSpreadsheet, Check, X, Shield, Award, Users, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Competitor } from '../types';

interface CompetitorManagerProps {
  competitors: Competitor[];
  setCompetitors: React.Dispatch<React.SetStateAction<Competitor[]>>;
  onImportFormsClick: () => void;
}

export const CompetitorManager: React.FC<CompetitorManagerProps> = ({
  competitors,
  setCompetitors,
  onImportFormsClick,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCompetitorId, setEditingCompetitorId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formDorsal, setFormDorsal] = useState('');
  const [formCategory, setFormCategory] = useState('Senior Masculino');
  const [formCustomCategory, setFormCustomCategory] = useState('');
  const [formClub, setFormClub] = useState('');
  const [formStatus, setFormStatus] = useState<Competitor['status']>('registered');
  const [formStartOrder, setFormStartOrder] = useState<number>(competitors.length + 1);

  const categories = [
    'Senior Femenino',
    'Senior Masculino',
    'Juvenil A',
    'Juvenil B',
    'Promocional',
    'Master',
    'Otro (Personalizada)',
  ];

  const resetForm = () => {
    setFormName('');
    const maxDorsalNum = competitors.reduce((max, c) => {
      const num = parseInt(c.dorsal.replace('#', ''), 10);
      return !isNaN(num) && num > max ? num : max;
    }, 0);
    setFormDorsal(String(maxDorsalNum + 1).padStart(2, '0'));
    setFormCategory('Senior Masculino');
    setFormCustomCategory('');
    setFormClub('');
    setFormStatus('registered');
    setFormStartOrder(competitors.length + 1);
    setEditingCompetitorId(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (c: Competitor) => {
    setEditingCompetitorId(c.id);
    setFormName(c.name);
    setFormDorsal(c.dorsal);
    if (categories.includes(c.category)) {
      setFormCategory(c.category);
      setFormCustomCategory('');
    } else {
      setFormCategory('Otro (Personalizada)');
      setFormCustomCategory(c.category);
    }
    setFormClub(c.club || '');
    setFormStatus(c.status);
    setFormStartOrder(c.startOrder || competitors.length + 1);
    setIsAddModalOpen(true);
  };

  const handleSaveCompetitor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formDorsal.trim()) return;

    const finalCategory =
      formCategory === 'Otro (Personalizada)' ? formCustomCategory.trim() || 'General' : formCategory;

    const cleanDorsal = formDorsal.trim().replace(/^#/, '');

    if (editingCompetitorId) {
      setCompetitors((prev) =>
        prev.map((c) =>
          c.id === editingCompetitorId
            ? {
                ...c,
                name: formName.trim(),
                dorsal: cleanDorsal,
                category: finalCategory,
                club: formClub.trim() || 'Independiente',
                status: formStatus,
                startOrder: Number(formStartOrder),
              }
            : c
        )
      );
    } else {
      const newCompetitor: Competitor = {
        id: `comp_${Date.now()}`,
        name: formName.trim(),
        dorsal: cleanDorsal,
        category: finalCategory,
        club: formClub.trim() || 'Independiente',
        status: formStatus,
        startOrder: Number(formStartOrder) || competitors.length + 1,
      };
      setCompetitors((prev) => [...prev, newCompetitor]);
    }

    setIsAddModalOpen(false);
    resetForm();
  };

  const handleDeleteCompetitor = (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro de eliminar al competidor "${name}"?`)) {
      setCompetitors((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const handleExportCompetitorsExcel = () => {
    if (competitors.length === 0) {
      alert('No hay competidores registrados para exportar.');
      return;
    }
    const data = competitors.map((c) => ({
      'Nombre Completo': c.name,
      'Dorsal': c.dorsal,
      'Categoria': c.category,
      'Club': c.club || 'Independiente',
      'Orden de Salida': c.startOrder || 1,
      'Estado': c.status === 'registered' ? 'Registrado' : c.status === 'climbing' ? 'Escalando' : 'Finalizado',
      'Observaciones': ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet['!cols'] = [
      { wch: 25 },
      { wch: 10 },
      { wch: 22 },
      { wch: 20 },
      { wch: 16 },
      { wch: 15 },
      { wch: 20 }
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Competidores');
    XLSX.writeFile(workbook, 'lista_competidores_pachamama.xlsx');
  };

  // Categories list for filtering
  const uniqueCategories = Array.from(new Set(competitors.map((c) => c.category)));

  // Filtered competitors
  const filteredCompetitors = competitors.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.dorsal.includes(searchTerm) ||
      (c.club && c.club.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header & Main Controls */}
      <div className="pachamama-card rounded-3xl p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-[#2d303a]">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-[#38BDF8]" /> Registro y Lista de Competidores
            </h2>
            <p className="text-xs text-zinc-400 mt-1 font-mono">
              Total de Atletas Registrados: <strong className="text-white">{competitors.length}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button
              onClick={handleOpenAddModal}
              className="pachamama-btn-green font-black px-4 py-2.5 rounded-xl text-xs uppercase flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(34,197,94,0.3)]"
            >
              <UserPlus className="w-4 h-4" /> ➕ Agregar Competidor Manual
            </button>

            <button
              onClick={onImportFormsClick}
              className="pachamama-btn-blue font-black px-4 py-2.5 rounded-xl text-xs uppercase flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(56,189,248,0.25)]"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" /> Importar Excel / Google Sheet
            </button>

            <button
              onClick={handleExportCompetitorsExcel}
              className="pachamama-btn-dark font-black px-4 py-2.5 rounded-xl text-xs uppercase flex items-center gap-2 cursor-pointer border border-white/10 hover:border-emerald-500/50 text-emerald-400"
            >
              <Download className="w-4 h-4 text-emerald-400" /> Exportar Lista (.xlsx)
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Buscar competidor por nombre, dorsal (#) o club..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pachamama-inset pl-10 pr-4 py-2.5 rounded-xl text-white font-medium text-xs w-full outline-none border border-white/10 focus:border-[#38BDF8]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-zinc-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="w-full sm:w-auto shrink-0">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pachamama-inset px-4 py-2.5 rounded-xl text-white font-bold text-xs w-full outline-none border border-white/10 focus:border-[#38BDF8] bg-[#121319]"
            >
              <option value="all">Todas las Categorías ({competitors.length})</option>
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat} ({competitors.filter((c) => c.category === cat).length})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Competitors List Grid */}
      {filteredCompetitors.length === 0 ? (
        <div className="pachamama-card rounded-3xl p-12 text-center text-zinc-400 space-y-3 border border-white/5">
          <Users className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No se encontraron competidores</h3>
          <p className="text-xs max-w-md mx-auto">
            {searchTerm || categoryFilter !== 'all'
              ? 'Prueba cambiando los filtros de búsqueda.'
              : 'Agrega tu primer atleta manualmente haciendo clic en "+ Agregar Competidor Manual".'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompetitors.map((c) => (
            <div
              key={c.id}
              className="pachamama-card-hover bg-[#1f2027] p-5 rounded-2xl border border-[#303342] flex items-center justify-between gap-4 group relative"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="bg-gradient-to-br from-[#E2A838] to-[#ca8a04] text-black font-black text-xl px-3.5 py-2 rounded-xl shadow-md shrink-0">
                  #{c.dorsal}
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-white text-base truncate">{c.name}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/30">
                      {c.category}
                    </span>
                    <span className="text-[11px] text-zinc-400 truncate">
                      🏛️ {c.club || 'Independiente'}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono mt-1">
                    Orden de salida: #{c.startOrder || '-'}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition shrink-0">
                <button
                  onClick={() => handleOpenEditModal(c)}
                  className="p-2 rounded-lg bg-black/40 hover:bg-[#38BDF8]/20 text-zinc-300 hover:text-[#38BDF8] border border-white/5 transition cursor-pointer"
                  title="Editar Competidor"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteCompetitor(c.id, c.name)}
                  className="p-2 rounded-lg bg-black/40 hover:bg-red-500/20 text-zinc-300 hover:text-red-400 border border-white/5 transition cursor-pointer"
                  title="Eliminar Competidor"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL FORM: AGREGAR / EDITAR COMPETIDOR MANUALMENTE */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-[#181920] border-2 border-[#22C55E]/40 rounded-3xl p-6 md:p-8 max-w-lg w-full text-white shadow-[0_0_50px_rgba(34,197,94,0.25)] my-auto max-h-[92vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#22C55E]/20 border border-[#22C55E]/40 rounded-2xl text-[#22C55E]">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase text-white">
                    {editingCompetitorId ? '✏️ Editar Competidor' : '➕ Nuevo Competidor Manual'}
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono">
                    Ingresa los datos para registrar un atleta en la competencia
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="pachamama-btn-dark px-3 py-1.5 rounded-xl text-xs font-black uppercase cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveCompetitor} className="space-y-4 overflow-y-auto pr-1 flex-1">
              {/* Nombre Completo */}
              <div>
                <label className="text-xs font-black uppercase text-zinc-300 block mb-1">
                  Nombre Completo del Competidor *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Sofía Benítez"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="pachamama-inset p-3 rounded-xl text-white font-bold w-full outline-none border border-white/10 focus:border-[#22C55E]"
                />
              </div>

              {/* Dorsal y Orden de Salida */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black uppercase text-zinc-300 block mb-1">
                    Dorsal / Bib *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 05"
                    value={formDorsal}
                    onChange={(e) => setFormDorsal(e.target.value)}
                    className="pachamama-inset p-3 rounded-xl text-white font-black text-base w-full outline-none border border-white/10 focus:border-[#22C55E]"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-zinc-300 block mb-1">
                    Orden de Salida
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formStartOrder}
                    onChange={(e) => setFormStartOrder(Number(e.target.value))}
                    className="pachamama-inset p-3 rounded-xl text-white font-bold w-full outline-none border border-white/10 focus:border-[#22C55E]"
                  />
                </div>
              </div>

              {/* Categoría */}
              <div>
                <label className="text-xs font-black uppercase text-zinc-300 block mb-1">
                  Categoría
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="pachamama-inset p-3 rounded-xl text-white font-bold w-full outline-none border border-white/10 focus:border-[#22C55E] bg-[#121319]"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                {formCategory === 'Otro (Personalizada)' && (
                  <input
                    type="text"
                    placeholder="Escribe la categoría personalizada..."
                    value={formCustomCategory}
                    onChange={(e) => setFormCustomCategory(e.target.value)}
                    className="pachamama-inset p-3 rounded-xl text-white font-bold w-full outline-none border border-white/10 focus:border-[#22C55E] mt-2"
                  />
                )}
              </div>

              {/* Club / Muro / Gimnasio */}
              <div>
                <label className="text-xs font-black uppercase text-zinc-300 block mb-1">
                  Club / Muro / Gimnasio
                </label>
                <input
                  type="text"
                  placeholder="Ej: Muro Pachamama, Vertical Limit, etc."
                  value={formClub}
                  onChange={(e) => setFormClub(e.target.value)}
                  className="pachamama-inset p-3 rounded-xl text-white font-bold w-full outline-none border border-white/10 focus:border-[#22C55E]"
                />
              </div>

              {/* Estado */}
              <div>
                <label className="text-xs font-black uppercase text-zinc-300 block mb-1">
                  Estado
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as Competitor['status'])}
                  className="pachamama-inset p-3 rounded-xl text-white font-bold w-full outline-none border border-white/10 focus:border-[#22C55E] bg-[#121319]"
                >
                  <option value="registered">Registrado</option>
                  <option value="waiting">En Espera / Pre-Aislamiento</option>
                  <option value="climbing">Escalando</option>
                  <option value="completed">Finalizado</option>
                </select>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="pachamama-btn-dark px-5 py-2.5 rounded-xl font-bold text-xs uppercase cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="pachamama-btn-green font-black px-6 py-2.5 rounded-xl uppercase text-xs cursor-pointer flex items-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                >
                  <Check className="w-4 h-4" /> Guardar Competidor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
