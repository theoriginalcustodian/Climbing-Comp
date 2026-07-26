import React, { useState, useRef } from 'react';
import { Plus, Edit2, Trash2, Search, Target, Shield, Layers, UserCheck, Check, AlertCircle, Copy, Download, Upload, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Problem } from '../types';

interface ProblemManagerProps {
  problems: Problem[];
  setProblems: React.Dispatch<React.SetStateAction<Problem[]>>;
}

export const ProblemManager: React.FC<ProblemManagerProps> = ({ problems, setProblems }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColorFilter, setSelectedColorFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProblemId, setEditingProblemId] = useState<string | null>(null);

  // Form State
  const [formNumber, setFormNumber] = useState<number>(problems.length + 1);
  const [formName, setFormName] = useState('');
  const [formGrade, setFormGrade] = useState('V4');
  const [formHoldColor, setFormHoldColor] = useState('Amarillo');
  const [formHasZone, setFormHasZone] = useState(true);
  const [formSector, setFormSector] = useState('Muro Central');
  const [formSetter, setFormSetter] = useState('');
  const [formPoints, setFormPoints] = useState<number>(1000);
  const [formDescription, setFormDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Número': 1,
        'Nombre Bloque': 'Bloque #1 — Sloper Central',
        'Grado': 'V4',
        'Color Presas': 'Amarillo',
        'Sector': 'Muro Central',
        'Armador': 'Mateo S.',
        'Presa Zona': 'Sí',
        'Puntos': 1000,
        'Observaciones': 'Inicio sentado'
      },
      {
        'Número': 2,
        'Nombre Bloque': 'Bloque #2 — Cueva Extraplomo',
        'Grado': 'V6',
        'Color Presas': 'Azul',
        'Sector': 'Cueva Extraplomo',
        'Armador': 'Pachamama Crew',
        'Presa Zona': 'Sí',
        'Puntos': 1000,
        'Observaciones': 'Dinámico'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    worksheet['!cols'] = [
      { wch: 10 },
      { wch: 30 },
      { wch: 10 },
      { wch: 15 },
      { wch: 20 },
      { wch: 20 },
      { wch: 12 },
      { wch: 10 },
      { wch: 20 }
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bloques');
    XLSX.writeFile(workbook, 'plantilla_bloques_pachamama.xlsx');
  };

  const handleExportProblems = () => {
    if (problems.length === 0) {
      alert('No hay bloques registrados para exportar.');
      return;
    }
    const data = problems.map((p) => ({
      'Número': p.number,
      'Nombre Bloque': p.name,
      'Grado': p.grade || '',
      'Color Presas': p.holdColor,
      'Sector': p.sector || 'General',
      'Armador': p.setter || '',
      'Presa Zona': p.hasZone ? 'Sí' : 'No',
      'Puntos': p.points || 1000,
      'Observaciones': p.description || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet['!cols'] = [
      { wch: 10 },
      { wch: 30 },
      { wch: 10 },
      { wch: 15 },
      { wch: 20 },
      { wch: 20 },
      { wch: 12 },
      { wch: 10 },
      { wch: 20 }
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bloques');
    XLSX.writeFile(workbook, 'lista_bloques_pachamama.xlsx');
  };

  const handleImportProblemsFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

        const importedProblems: Problem[] = [];
        rawJson.forEach((row, idx) => {
          let numVal = idx + 1;
          let nameVal = '';
          let gradeVal = 'V4';
          let colorVal = 'Amarillo';
          let sectorVal = 'Muro Central';
          let setterVal = '';
          let hasZoneVal = true;
          let pointsVal = 1000;
          let descVal = '';

          Object.entries(row).forEach(([k, v]) => {
            const keyLower = k.trim().toLowerCase();
            const valStr = String(v || '').trim();

            if (keyLower.includes('número') || keyLower.includes('numero') || keyLower === '#' || keyLower.includes('num')) {
              const parsed = parseInt(valStr, 10);
              if (!isNaN(parsed)) numVal = parsed;
            } else if (keyLower.includes('nombre') || keyLower.includes('bloque') || keyLower.includes('boulder')) {
              nameVal = valStr;
            } else if (keyLower.includes('grado') || keyLower.includes('dificultad')) {
              gradeVal = valStr;
            } else if (keyLower.includes('color') || keyLower.includes('presa') || keyLower.includes('toma')) {
              colorVal = valStr || 'Amarillo';
            } else if (keyLower.includes('sector') || keyLower.includes('muro') || keyLower.includes('pared')) {
              sectorVal = valStr || 'Muro Central';
            } else if (keyLower.includes('armador') || keyLower.includes('setter')) {
              setterVal = valStr;
            } else if (keyLower.includes('zona')) {
              hasZoneVal = valStr.toLowerCase() !== 'no' && valStr.toLowerCase() !== 'false';
            } else if (keyLower.includes('punto')) {
              const parsedP = parseInt(valStr, 10);
              if (!isNaN(parsedP)) pointsVal = parsedP;
            } else if (keyLower.includes('obs') || keyLower.includes('nota') || keyLower.includes('desc')) {
              descVal = valStr;
            }
          });

          if (!nameVal) nameVal = `Bloque #${numVal}`;

          importedProblems.push({
            id: `imp_p_${Date.now()}_${idx}`,
            number: numVal,
            name: nameVal,
            grade: gradeVal,
            holdColor: colorVal,
            hasZone: hasZoneVal,
            sector: sectorVal,
            setter: setterVal,
            points: pointsVal,
            description: descVal
          });
        });

        if (importedProblems.length > 0) {
          setProblems((prev) => [...prev, ...importedProblems].sort((a, b) => a.number - b.number));
          alert(`¡Se importaron con éxito ${importedProblems.length} bloques desde "${file.name}"!`);
        } else {
          alert('No se encontraron bloques en el archivo.');
        }
      } catch (err) {
        console.error(err);
        alert('Error al leer el archivo de bloques. Asegúrate de que sea una hoja de cálculo válida.');
      }
    };
    reader.readAsBinaryString(file);
    if (e.target) e.target.value = '';
  };

  const holdColors = [
    { name: 'Amarillo', bg: 'bg-yellow-400', text: 'text-yellow-950', border: 'border-yellow-400' },
    { name: 'Azul', bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-400' },
    { name: 'Rojo', bg: 'bg-red-500', text: 'text-white', border: 'border-red-400' },
    { name: 'Verde', bg: 'bg-emerald-500', text: 'text-white', border: 'border-emerald-400' },
    { name: 'Negro', bg: 'bg-zinc-900', text: 'text-white', border: 'border-zinc-700' },
    { name: 'Morado', bg: 'bg-purple-600', text: 'text-white', border: 'border-purple-400' },
    { name: 'Blanco', bg: 'bg-zinc-100', text: 'text-zinc-900', border: 'border-zinc-300' },
    { name: 'Naranja', bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-400' },
    { name: 'Rosado', bg: 'bg-pink-500', text: 'text-white', border: 'border-pink-400' },
  ];

  const commonSectors = [
    'Muro Central',
    'Cueva Extraplomo',
    'Placa Técnica',
    'Slab / Equilibrio',
    'Muro Competición',
    'Muro Izquierdo',
    'Muro Derecha',
  ];

  const resetForm = () => {
    const nextNumber = problems.length > 0 ? Math.max(...problems.map((p) => p.number)) + 1 : 1;
    setFormNumber(nextNumber);
    setFormName(`Bloque #${nextNumber}`);
    setFormGrade('V4');
    setFormHoldColor('Amarillo');
    setFormHasZone(true);
    setFormSector('Muro Central');
    setFormSetter('');
    setFormPoints(1000);
    setFormDescription('');
    setEditingProblemId(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (problem: Problem) => {
    setEditingProblemId(problem.id);
    setFormNumber(problem.number);
    setFormName(problem.name);
    setFormGrade(problem.grade || 'V4');
    setFormHoldColor(problem.holdColor);
    setFormHasZone(problem.hasZone);
    setFormSector(problem.sector || 'Muro Central');
    setFormSetter(problem.setter || '');
    setFormPoints(problem.points || 1000);
    setFormDescription(problem.description || '');
    setIsModalOpen(true);
  };

  const handleSaveProblem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingProblemId) {
      setProblems((prev) =>
        prev.map((p) =>
          p.id === editingProblemId
            ? {
                ...p,
                number: Number(formNumber),
                name: formName.trim(),
                grade: formGrade.trim(),
                holdColor: formHoldColor,
                hasZone: formHasZone,
                sector: formSector.trim(),
                setter: formSetter.trim(),
                points: Number(formPoints),
                description: formDescription.trim(),
              }
            : p
        )
      );
    } else {
      const newProblem: Problem = {
        id: `p_${Date.now()}`,
        number: Number(formNumber),
        name: formName.trim(),
        grade: formGrade.trim(),
        holdColor: formHoldColor,
        hasZone: formHasZone,
        sector: formSector.trim(),
        setter: formSetter.trim(),
        points: Number(formPoints),
        description: formDescription.trim(),
      };
      setProblems((prev) => [...prev, newProblem].sort((a, b) => a.number - b.number));
    }

    setIsModalOpen(false);
    resetForm();
  };

  const handleDeleteProblem = (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro de eliminar el bloque "${name}"?`)) {
      setProblems((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleDuplicateProblem = (problem: Problem) => {
    const nextNum = Math.max(...problems.map((p) => p.number), 0) + 1;
    const duplicated: Problem = {
      ...problem,
      id: `p_${Date.now()}`,
      number: nextNum,
      name: `${problem.name} (Copia)`,
    };
    setProblems((prev) => [...prev, duplicated]);
  };

  // Filtered problems list
  const filteredProblems = problems.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.grade && p.grade.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.sector && p.sector.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.setter && p.setter.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesColor = selectedColorFilter === 'all' || p.holdColor === selectedColorFilter;
    return matchesSearch && matchesColor;
  });

  const uniqueColors = Array.from(new Set(problems.map((p) => p.holdColor)));

  return (
    <div className="space-y-6">
      {/* Header & Overview Card */}
      <div className="pachamama-card rounded-3xl p-6 bg-[#181920] border border-[#38BDF8]/30">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-[#2d303a]">
          <div>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <Target className="w-6 h-6 text-[#38BDF8]" /> Gestión de Bloques / Boulders de la Competición
            </h3>
            <p className="text-xs text-zinc-400 mt-1 font-mono">
              Registra todos los bloques, sus sectores, presas, grados y armadores para asignar a los competidores.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportProblemsFile}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />

            <button
              onClick={handleOpenAddModal}
              className="pachamama-btn-green font-black px-4 py-2.5 rounded-xl text-xs uppercase flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(34,197,94,0.3)] shrink-0"
            >
              <Plus className="w-4 h-4" /> Registrar Bloque
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="pachamama-btn-blue font-black px-3.5 py-2.5 rounded-xl text-xs uppercase flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Importar desde Excel"
            >
              <Upload className="w-4 h-4" /> Importar (.xlsx)
            </button>

            <button
              onClick={handleExportProblems}
              className="pachamama-btn-dark font-black px-3.5 py-2.5 rounded-xl text-xs uppercase flex items-center gap-1.5 cursor-pointer shrink-0 border border-white/10 hover:border-emerald-500/50 text-emerald-400"
              title="Exportar a Excel"
            >
              <Download className="w-4 h-4" /> Exportar (.xlsx)
            </button>

            <button
              onClick={handleDownloadTemplate}
              className="pachamama-btn-dark font-black px-3 py-2.5 rounded-xl text-xs uppercase flex items-center gap-1 cursor-pointer shrink-0 text-zinc-400 hover:text-white"
              title="Descargar Plantilla de Bloques Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#FACC15]" /> Plantilla
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar bloque por nombre, grado, sector o armador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pachamama-inset pl-10 pr-4 py-2 rounded-xl text-white font-medium text-xs w-full outline-none border border-white/10 focus:border-[#38BDF8]"
            />
          </div>

          <select
            value={selectedColorFilter}
            onChange={(e) => setSelectedColorFilter(e.target.value)}
            className="pachamama-inset px-3 py-2 rounded-xl text-white font-bold text-xs outline-none border border-white/10 bg-[#121319] w-full sm:w-auto"
          >
            <option value="all">Todos los Colores ({problems.length})</option>
            {uniqueColors.map((color) => (
              <option key={color} value={color}>
                Presas {color}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Registered Problems */}
      {filteredProblems.length === 0 ? (
        <div className="pachamama-card rounded-3xl p-10 text-center text-zinc-400 space-y-3 border border-white/5">
          <Target className="w-10 h-10 text-zinc-600 mx-auto" />
          <h4 className="text-base font-bold text-white">No hay bloques registrados</h4>
          <p className="text-xs max-w-sm mx-auto">
            Haz clic en "Registrar Nuevo Bloque" para agregar los bloques de tu campeonato.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProblems.map((p) => {
            const colorObj = holdColors.find((c) => c.name === p.holdColor);
            return (
              <div
                key={p.id}
                className="pachamama-card-hover bg-[#1a1b23] p-5 rounded-2xl border border-[#2d303a] flex flex-col justify-between gap-4 group relative"
              >
                <div>
                  {/* Top Bar: Number & Color Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/40 font-black text-sm px-3 py-1 rounded-xl">
                        Bloque #{p.number}
                      </span>
                      {p.grade && (
                        <span className="bg-black/50 text-zinc-300 font-extrabold text-xs px-2.5 py-1 rounded-lg border border-white/10">
                          {p.grade}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase flex items-center gap-1.5 border ${
                          colorObj ? `${colorObj.bg} ${colorObj.text} ${colorObj.border}` : 'bg-zinc-700 text-white'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-current opacity-80" />
                        {p.holdColor}
                      </span>
                    </div>
                  </div>

                  {/* Title & Details */}
                  <h4 className="font-extrabold text-white text-base mb-2 group-hover:text-[#38BDF8] transition">
                    {p.name}
                  </h4>

                  <div className="space-y-1.5 text-xs text-zinc-400">
                    <div className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-zinc-500" />
                      <span>
                        Sector: <strong className="text-zinc-200">{p.sector || 'General'}</strong>
                      </span>
                    </div>

                    {p.setter && (
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-3.5 h-3.5 text-zinc-500" />
                        <span>
                          Armador: <strong className="text-zinc-200">{p.setter}</strong>
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-white/5 font-mono">
                      <span className={p.hasZone ? 'text-[#38BDF8]' : 'text-zinc-500'}>
                        {p.hasZone ? '🎯 Tiene Presa de Zona' : '❌ Sin Zona'}
                      </span>
                      {p.points ? <span className="text-[#FACC15] font-bold">{p.points} Pts</span> : null}
                    </div>

                    {p.description && (
                      <p className="text-[11px] text-zinc-400 italic pt-1 line-clamp-2">
                        "{p.description}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/5">
                  <button
                    onClick={() => handleDuplicateProblem(p)}
                    className="p-1.5 rounded-lg bg-black/40 hover:bg-white/10 text-zinc-400 hover:text-white transition cursor-pointer text-xs flex items-center gap-1"
                    title="Duplicar Bloque"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(p)}
                    className="p-1.5 rounded-lg bg-black/40 hover:bg-[#38BDF8]/20 text-zinc-400 hover:text-[#38BDF8] transition cursor-pointer text-xs flex items-center gap-1"
                    title="Editar Bloque"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Editar
                  </button>
                  <button
                    onClick={() => handleDeleteProblem(p.id, p.name)}
                    className="p-1.5 rounded-lg bg-black/40 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition cursor-pointer text-xs flex items-center gap-1"
                    title="Eliminar Bloque"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: REGISTRAR / EDITAR BLOQUE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-[#181920] border-2 border-[#38BDF8]/40 rounded-3xl p-6 md:p-8 max-w-lg w-full text-white shadow-[0_0_50px_rgba(56,189,248,0.25)] my-auto max-h-[92vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#38BDF8]/20 border border-[#38BDF8]/40 rounded-2xl text-[#38BDF8]">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase text-white">
                    {editingProblemId ? '✏️ Editar Bloque' : '➕ Registrar Nuevo Bloque'}
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono">
                    Especifica la información técnica del bloque de escalada
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="pachamama-btn-dark px-3 py-1.5 rounded-xl text-xs font-black uppercase cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveProblem} className="space-y-4 overflow-y-auto pr-1 flex-1 scrollbar-thin">
              
              {/* Número y Nombre */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-black uppercase text-zinc-300 block mb-1">
                    Número (#) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formNumber}
                    onChange={(e) => setFormNumber(Number(e.target.value))}
                    className="pachamama-inset p-3 rounded-xl text-white font-black text-base w-full outline-none border border-white/10 focus:border-[#38BDF8]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-black uppercase text-zinc-300 block mb-1">
                    Nombre del Bloque *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Bloque #1 — Sloper Central"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="pachamama-inset p-3 rounded-xl text-white font-bold text-sm w-full outline-none border border-white/10 focus:border-[#38BDF8]"
                  />
                </div>
              </div>

              {/* Grado / Dificultad & Color de Presas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black uppercase text-zinc-300 block mb-1">
                    Grado / Dificultad
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: V4, 6C+, Avanzado"
                    value={formGrade}
                    onChange={(e) => setFormGrade(e.target.value)}
                    className="pachamama-inset p-3 rounded-xl text-white font-bold text-sm w-full outline-none border border-white/10 focus:border-[#38BDF8]"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-zinc-300 block mb-1">
                    Color de Tomas / Presas
                  </label>
                  <select
                    value={formHoldColor}
                    onChange={(e) => setFormHoldColor(e.target.value)}
                    className="pachamama-inset p-3 rounded-xl text-white font-bold text-sm w-full outline-none border border-white/10 focus:border-[#38BDF8] bg-[#121319]"
                  >
                    {holdColors.map((c) => (
                      <option key={c.name} value={c.name}>
                        Tomas {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sector / Pared & Armador */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black uppercase text-zinc-300 block mb-1">
                    Sector / Muro
                  </label>
                  <input
                    type="text"
                    list="sectors-list"
                    placeholder="Ej: Muro Central"
                    value={formSector}
                    onChange={(e) => setFormSector(e.target.value)}
                    className="pachamama-inset p-3 rounded-xl text-white font-bold text-sm w-full outline-none border border-white/10 focus:border-[#38BDF8]"
                  />
                  <datalist id="sectors-list">
                    {commonSectors.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-zinc-300 block mb-1">
                    Armador / Route Setter
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Mateo S. & Pachamama Crew"
                    value={formSetter}
                    onChange={(e) => setFormSetter(e.target.value)}
                    className="pachamama-inset p-3 rounded-xl text-white font-bold text-sm w-full outline-none border border-white/10 focus:border-[#38BDF8]"
                  />
                </div>
              </div>

              {/* Presa de Zona Checkbox & Puntos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center pt-1">
                <label className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-white/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formHasZone}
                    onChange={(e) => setFormHasZone(e.target.checked)}
                    className="w-4 h-4 accent-[#38BDF8] rounded cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-xs text-white block">¿Incluye Presa de Zona?</span>
                    <span className="text-[10px] text-zinc-400">Otorga puntuación intermedia de zona</span>
                  </div>
                </label>

                <div>
                  <label className="text-xs font-black uppercase text-zinc-300 block mb-1">
                    Puntos Base (Modo Puntos)
                  </label>
                  <input
                    type="number"
                    value={formPoints}
                    onChange={(e) => setFormPoints(Number(e.target.value))}
                    className="pachamama-inset p-3 rounded-xl text-white font-bold text-sm w-full outline-none border border-white/10 focus:border-[#38BDF8]"
                  />
                </div>
              </div>

              {/* Descripción / Notas Técnicas */}
              <div>
                <label className="text-xs font-black uppercase text-zinc-300 block mb-1">
                  Notas / Descripción Técnica (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles de presas, tipo de inicio (sit start, dinámico), observaciones para jueces..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="pachamama-inset p-3 rounded-xl text-white font-medium text-xs w-full outline-none border border-white/10 focus:border-[#38BDF8] resize-none"
                />
              </div>

              {/* Footer Buttons */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="pachamama-btn-dark px-5 py-2.5 rounded-xl font-bold text-xs uppercase cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="pachamama-btn-green font-black px-6 py-2.5 rounded-xl uppercase text-xs cursor-pointer flex items-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                >
                  <Check className="w-4 h-4" /> Guardar Bloque
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};
