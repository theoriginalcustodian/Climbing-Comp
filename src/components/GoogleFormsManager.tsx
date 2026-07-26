import React, { useState, useEffect } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Upload,
  Download,
  Plus,
  RefreshCw,
  ExternalLink,
  Users,
  CheckCircle,
  AlertCircle,
  LogOut,
  Trash2,
  Copy,
  Check,
  Globe,
  List,
  Table,
  HelpCircle,
  FileUp,
  ClipboardList,
  ArrowRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken
} from '../lib/googleAuth';
import {
  listUserForms,
  getFormDetails,
  createClimbingRegistrationForm,
  getFormSubmissions,
  deleteFormFile,
  GoogleFormItem,
  GoogleFormDetails,
  GoogleFormSubmission
} from '../lib/googleForms';
import { Competitor } from '../types';
import { User } from 'firebase/auth';

interface GoogleFormsManagerProps {
  onImportCompetitors: (newCompetitors: Competitor[]) => void;
  existingCompetitorsCount: number;
}

export const GoogleFormsManager: React.FC<GoogleFormsManagerProps> = ({
  onImportCompetitors,
  existingCompetitorsCount
}) => {
  // Main import mode selector
  const [activeImportTab, setActiveImportTab] = useState<'excel' | 'paste' | 'template' | 'google_forms'>('excel');

  // Excel / CSV File Parsing State
  const [parsedCompetitors, setParsedCompetitors] = useState<Competitor[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  // Raw Paste State
  const [pastedText, setPastedText] = useState('');

  // Google Forms Auth state
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Forms state
  const [formsList, setFormsList] = useState<GoogleFormItem[]>([]);
  const [isLoadingForms, setIsLoadingForms] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [selectedFormDetails, setSelectedFormDetails] = useState<GoogleFormDetails | null>(null);
  const [submissions, setSubmissions] = useState<GoogleFormSubmission[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);

  // Form creation state
  const [newFormTitle, setNewFormTitle] = useState('Inscripción Pachamama Escalada');
  const [newFormDesc, setNewFormDesc] = useState('Inscríbete para participar en el campeonato de escalada Pachamama.');
  const [isCreatingForm, setIsCreatingForm] = useState(false);

  // UI feedback
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initialize auth state listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        setIsAuthLoading(false);
        if (token) fetchForms(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setIsAuthLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch list of user's Google Forms
  const fetchForms = async (token?: string) => {
    const activeToken = token || accessToken;
    if (!activeToken) return;

    setIsLoadingForms(true);
    try {
      const items = await listUserForms(activeToken);
      setFormsList(items);
      if (items.length > 0 && !selectedFormId) {
        handleSelectForm(items[0].id, activeToken);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoadingForms(false);
    }
  };

  // Download official Excel template (.xlsx)
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Nombre Completo': 'Sofía Benítez',
        'Dorsal': '1',
        'Categoria': 'Senior Femenino',
        'Club': 'Pachamama',
        'Orden de Salida': 1,
        'Observaciones': 'A rellenar'
      },
      {
        'Nombre Completo': 'Mateo Rossi',
        'Dorsal': '2',
        'Categoria': 'Senior Masculino',
        'Club': 'Vertical Limit',
        'Orden de Salida': 2,
        'Observaciones': ''
      },
      {
        'Nombre Completo': 'Camila Torres',
        'Dorsal': '3',
        'Categoria': 'Juvenil A',
        'Club': 'Boulder Club Norte',
        'Orden de Salida': 3,
        'Observaciones': ''
      },
      {
        'Nombre Completo': 'Lucas Fernández',
        'Dorsal': '4',
        'Categoria': 'Senior Masculino',
        'Club': 'Independiente',
        'Orden de Salida': 4,
        'Observaciones': ''
      },
      {
        'Nombre Completo': 'Valentina Gómez',
        'Dorsal': '5',
        'Categoria': 'Senior Femenino',
        'Club': 'Klimbing',
        'Orden de Salida': 5,
        'Observaciones': ''
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    worksheet['!cols'] = [
      { wch: 25 }, // Nombre Completo
      { wch: 10 }, // Dorsal
      { wch: 22 }, // Categoria
      { wch: 20 }, // Club
      { wch: 18 }, // Orden de Salida
      { wch: 20 }  // Observaciones
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inscripciones');
    XLSX.writeFile(workbook, 'plantilla_inscripciones_pachamama.xlsx');

    setStatusMessage({
      type: 'success',
      text: '¡Plantilla oficial de Excel (.xlsx) generada por columnas descargada con éxito!'
    });
  };

  // Helper function to map raw row objects into Competitor structure
  const mapRowToCompetitor = (row: Record<string, any>, idx: number, baseIndex: number): Competitor | null => {
    let nameVal = '';
    let dorsalVal = '';
    let categoryVal = 'Senior Masculino';
    let clubVal = 'Independiente';
    let orderVal = baseIndex + idx + 1;

    Object.entries(row).forEach(([key, value]) => {
      const k = key.trim().toLowerCase();
      const valStr = String(value || '').trim();

      if (k.includes('nombre') || k.includes('competidor') || k.includes('atleta') || k.includes('escalador') || k === 'name') {
        nameVal = valStr;
      } else if (k.includes('dorsal') || k.includes('bib') || k === '#' || k.includes('numero') || k.includes('número')) {
        dorsalVal = valStr.replace(/^#/, '');
      } else if (k.includes('cat') || k.includes('categoría') || k.includes('categoria')) {
        categoryVal = valStr || 'Senior Masculino';
      } else if (k.includes('club') || k.includes('equipo') || k.includes('gimnasio') || k.includes('muro')) {
        clubVal = valStr || 'Independiente';
      } else if (k.includes('orden') || k.includes('salida') || k.includes('order')) {
        const parsedNum = parseInt(valStr, 10);
        if (!isNaN(parsedNum)) orderVal = parsedNum;
      }
    });

    // Fallback: if no column matched "nombre", check the first non-empty value
    if (!nameVal) {
      const vals = Object.values(row).map(v => String(v || '').trim()).filter(Boolean);
      if (vals.length > 0) nameVal = vals[0];
    }

    if (!nameVal) return null;

    const startDorsal = existingCompetitorsCount + 101;
    const finalDorsal = dorsalVal ? dorsalVal : String(startDorsal + idx);

    return {
      id: `imp-${Date.now()}-${idx}`,
      dorsal: finalDorsal,
      name: nameVal,
      category: categoryVal || 'Senior Masculino',
      club: clubVal || 'Independiente',
      status: 'registered',
      startOrder: orderVal,
    };
  };

  // Handle Excel (.xlsx, .xls, .csv) file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsParsing(true);
    setStatusMessage(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

        const mapped: Competitor[] = [];
        rawJson.forEach((row, idx) => {
          const comp = mapRowToCompetitor(row, idx, existingCompetitorsCount);
          if (comp) mapped.push(comp);
        });

        if (mapped.length > 0) {
          setParsedCompetitors(mapped);
          setStatusMessage({
            type: 'success',
            text: `¡Se leyeron correctamente ${mapped.length} competidores desde "${file.name}"! Revisa la previsualización y haz clic en importar.`
          });
        } else {
          setParsedCompetitors([]);
          setStatusMessage({
            type: 'error',
            text: 'No se encontraron datos válidos en el archivo. Asegúrate de incluir la columna "Nombre".'
          });
        }
      } catch (err: any) {
        console.error(err);
        setStatusMessage({
          type: 'error',
          text: 'Error al procesar el archivo Excel/CSV. Verifica que no esté dañado.'
        });
      } finally {
        setIsParsing(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  // Parse Copy-Pasted Text from Google Sheet or Excel
  const handleParsePastedText = () => {
    if (!pastedText.trim()) return;

    const lines = pastedText.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) return;

    // Detect separator (\t for Excel/Sheets copy, or comma/semicolon)
    const firstLine = lines[0];
    let sep = '\t';
    if (!firstLine.includes('\t')) {
      if (firstLine.includes(',')) sep = ',';
      else if (firstLine.includes(';')) sep = ';';
    }

    // Check if first line is header
    const headers = firstLine.split(sep).map(h => h.trim().toLowerCase());
    const hasHeader = headers.some(h =>
      h.includes('nombre') || h.includes('competidor') || h.includes('dorsal') || h.includes('categoría') || h.includes('club')
    );

    const dataLines = hasHeader ? lines.slice(1) : lines;
    const mapped: Competitor[] = [];

    dataLines.forEach((line, idx) => {
      const parts = line.split(sep).map(p => p.trim());
      if (parts.length === 0 || !parts[0]) return;

      let nameVal = '';
      let dorsalVal = '';
      let categoryVal = 'Senior Masculino';
      let clubVal = 'Independiente';

      if (hasHeader) {
        headers.forEach((h, hIdx) => {
          const val = parts[hIdx] || '';
          if (h.includes('nombre') || h.includes('competidor') || h.includes('atleta')) nameVal = val;
          else if (h.includes('dorsal') || h.includes('bib') || h === '#') dorsalVal = val;
          else if (h.includes('cat')) categoryVal = val || 'Senior Masculino';
          else if (h.includes('club') || h.includes('muro')) clubVal = val || 'Independiente';
        });
      } else {
        // Position-based mapping
        nameVal = parts[0] || '';
        dorsalVal = parts[1] || '';
        categoryVal = parts[2] || 'Senior Masculino';
        clubVal = parts[3] || 'Independiente';
      }

      if (nameVal) {
        const startDorsal = existingCompetitorsCount + 101;
        mapped.push({
          id: `paste-${Date.now()}-${idx}`,
          dorsal: dorsalVal ? dorsalVal.replace(/^#/, '') : String(startDorsal + idx),
          name: nameVal,
          category: categoryVal || 'Senior Masculino',
          club: clubVal || 'Independiente',
          status: 'registered',
          startOrder: existingCompetitorsCount + idx + 1,
        });
      }
    });

    if (mapped.length > 0) {
      setParsedCompetitors(mapped);
      setStatusMessage({
        type: 'success',
        text: `¡Se leyeron ${mapped.length} competidores desde los datos pegados!`
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: 'No se pudieron reconocer competidores en el texto pegado.'
      });
    }
  };

  // Confirm Import parsed competitors to main state
  const handleConfirmImport = () => {
    if (parsedCompetitors.length === 0) return;

    onImportCompetitors(parsedCompetitors);
    setStatusMessage({
      type: 'success',
      text: `🎉 ¡Éxito! Se importaron ${parsedCompetitors.length} competidores a la lista principal de Pachamama.`
    });
    setParsedCompetitors([]);
    setFileName(null);
    setPastedText('');
  };

  // Handle Sign In with Google
  const handleSignIn = async () => {
    setIsSigningIn(true);
    setStatusMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        setStatusMessage({ type: 'success', text: `Conectado a Google como ${result.user.email}` });
        fetchForms(result.accessToken);
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'No se pudo conectar a Google: ' + (err.message || '') });
    } finally {
      setIsSigningIn(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    setFormsList([]);
    setSelectedFormId(null);
    setSelectedFormDetails(null);
    setSubmissions([]);
    setStatusMessage({ type: 'info', text: 'Sesión de Google cerrada.' });
  };

  // Select a form and load details & submissions
  const handleSelectForm = async (formId: string, token?: string) => {
    const activeToken = token || accessToken;
    if (!activeToken) return;

    setSelectedFormId(formId);
    setIsLoadingSubmissions(true);

    try {
      const details = await getFormDetails(activeToken, formId);
      setSelectedFormDetails(details);

      const subData = await getFormSubmissions(activeToken, formId);
      setSubmissions(subData.submissions);
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err.message || 'Error al obtener respuestas del formulario' });
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  // Create new climbing registration form
  const handleCreateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    setIsCreatingForm(true);

    try {
      const created = await createClimbingRegistrationForm(accessToken, newFormTitle, newFormDesc);
      setStatusMessage({
        type: 'success',
        text: `¡Formulario "${created.info.title}" creado en tu Google Drive!`
      });
      await fetchForms(accessToken);
      setSelectedFormId(created.formId);
      setSelectedFormDetails(created);
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err.message || 'Error al crear formulario' });
    } finally {
      setIsCreatingForm(false);
    }
  };

  // Delete form
  const handleDeleteFormConfirmed = async () => {
    if (!deleteConfirmId || !accessToken) return;

    setIsDeleting(true);
    try {
      await deleteFormFile(accessToken, deleteConfirmId);
      setStatusMessage({ type: 'success', text: 'Formulario eliminado de tu Google Drive.' });
      if (selectedFormId === deleteConfirmId) {
        setSelectedFormId(null);
        setSelectedFormDetails(null);
        setSubmissions([]);
      }
      setDeleteConfirmId(null);
      fetchForms(accessToken);
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err.message || 'Error al eliminar formulario' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Import submissions as competitors
  const handleImportSubmissionsToCompetitors = () => {
    if (submissions.length === 0) return;

    let startDorsal = existingCompetitorsCount + 101;
    const newCompetitors: Competitor[] = [];

    submissions.forEach((sub, idx) => {
      let nameVal = '';
      let categoryVal = 'Senior Masculino';
      let clubVal = 'Independiente';
      let dorsalVal = '';

      Object.entries(sub.answers).forEach(([questionTitle, val]) => {
        const titleLower = questionTitle.toLowerCase();
        const strVal = String(val || '');
        if (titleLower.includes('nombre') || titleLower.includes('competidor') || titleLower.includes('escalador')) {
          nameVal = strVal;
        } else if (titleLower.includes('categoría') || titleLower.includes('categoria')) {
          categoryVal = strVal || 'Senior Masculino';
        } else if (titleLower.includes('club') || titleLower.includes('equipo')) {
          clubVal = strVal || 'Independiente';
        } else if (titleLower.includes('dorsal') || titleLower.includes('número')) {
          dorsalVal = strVal;
        }
      });

      if (!nameVal && Object.values(sub.answers).length > 0) {
        nameVal = String(Object.values(sub.answers)[0] || '');
      }

      if (nameVal.trim()) {
        const finalDorsal = dorsalVal.trim() ? dorsalVal.trim() : (startDorsal + idx).toString();
        newCompetitors.push({
          id: `gf-${sub.responseId}-${idx}`,
          dorsal: finalDorsal,
          name: nameVal.trim(),
          category: categoryVal || 'Senior Masculino',
          club: clubVal || 'Independiente',
          status: 'registered',
          startOrder: existingCompetitorsCount + idx + 1,
        });
      }
    });

    if (newCompetitors.length > 0) {
      onImportCompetitors(newCompetitors);
      setStatusMessage({
        type: 'success',
        text: `¡Se importaron ${newCompetitors.length} competidores desde Google Forms!`
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6">

      {/* HEADER BANNER */}
      <div className="pachamama-card rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-white/15 bg-gradient-to-r from-[#12141c] via-[#181a24] to-[#12141c]">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-[#22C55E]/20 border border-[#22C55E]/40 text-[#22C55E]">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider">
                Importador de Inscripciones (Excel & Google Sheets)
              </h2>
              <span className="bg-[#22C55E]/20 text-[#22C55E] text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-[#22C55E]/40">
                XLSX / CSV / Google API
              </span>
            </div>
            <p className="text-zinc-400 text-xs md:text-sm mt-1">
              Carga tus listas de competidores desde un archivo Excel, copia y pega celdas desde Google Sheets o sincroniza directamente con tu Google Form.
            </p>
          </div>
        </div>

        {/* QUICK ACTION: DOWNLOAD TEMPLATE */}
        <button
          onClick={handleDownloadTemplate}
          className="pachamama-btn-green font-black px-5 py-3 rounded-2xl text-xs uppercase flex items-center justify-center gap-2.5 cursor-pointer shadow-[0_0_20px_rgba(34,197,94,0.3)] shrink-0"
        >
          <Download className="w-4 h-4" /> Descargar Plantilla Excel (.xlsx)
        </button>
      </div>

      {/* FEEDBACK BANNER */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 backdrop-blur-md ${
            statusMessage.type === 'success'
              ? 'bg-[#1E9E54]/20 border-[#1E9E54]/50 text-[#38C172]'
              : statusMessage.type === 'error'
              ? 'bg-[#E06A6A]/20 border-[#E06A6A]/50 text-[#F08282]'
              : 'bg-[#1E88E5]/20 border-[#1E88E5]/50 text-[#42A5F5]'
          }`}
        >
          <div className="flex items-center gap-3 text-sm font-semibold">
            {statusMessage.type === 'error' ? (
              <AlertCircle className="w-5 h-5 shrink-0" />
            ) : (
              <CheckCircle className="w-5 h-5 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs opacity-70 hover:opacity-100 font-bold uppercase cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* IMPORT NAVIGATION TABS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => setActiveImportTab('excel')}
          className={`p-4 rounded-2xl border font-black text-xs flex items-center justify-center gap-2.5 transition cursor-pointer ${
            activeImportTab === 'excel'
              ? 'bg-[#22C55E]/20 border-[#22C55E] text-white shadow-[0_0_20px_rgba(34,197,94,0.3)] ring-1 ring-[#22C55E]'
              : 'bg-[#15161d] border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
          }`}
        >
          <FileUp className="w-5 h-5 text-[#22C55E]" />
          <span>1. Subir Excel (.xlsx / .csv)</span>
        </button>

        <button
          onClick={() => setActiveImportTab('paste')}
          className={`p-4 rounded-2xl border font-black text-xs flex items-center justify-center gap-2.5 transition cursor-pointer ${
            activeImportTab === 'paste'
              ? 'bg-[#38BDF8]/20 border-[#38BDF8] text-white shadow-[0_0_20px_rgba(56,189,248,0.3)] ring-1 ring-[#38BDF8]'
              : 'bg-[#15161d] border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
          }`}
        >
          <ClipboardList className="w-5 h-5 text-[#38BDF8]" />
          <span>2. Pegar Datos de Sheet</span>
        </button>

        <button
          onClick={() => setActiveImportTab('template')}
          className={`p-4 rounded-2xl border font-black text-xs flex items-center justify-center gap-2.5 transition cursor-pointer ${
            activeImportTab === 'template'
              ? 'bg-[#FACC15]/20 border-[#FACC15] text-white shadow-[0_0_20px_rgba(250,204,21,0.3)] ring-1 ring-[#FACC15]'
              : 'bg-[#15161d] border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
          }`}
        >
          <Table className="w-5 h-5 text-[#FACC15]" />
          <span>3. Formato & Plantilla</span>
        </button>

        <button
          onClick={() => setActiveImportTab('google_forms')}
          className={`p-4 rounded-2xl border font-black text-xs flex items-center justify-center gap-2.5 transition cursor-pointer ${
            activeImportTab === 'google_forms'
              ? 'bg-[#EC4899]/20 border-[#EC4899] text-white shadow-[0_0_20px_rgba(236,72,153,0.3)] ring-1 ring-[#EC4899]'
              : 'bg-[#15161d] border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
          }`}
        >
          <Globe className="w-5 h-5 text-[#EC4899]" />
          <span>4. Sincronizar Google Form</span>
        </button>
      </div>

      {/* MODE 1: UPLOAD EXCEL FILE (.xlsx, .xls, .csv) */}
      {activeImportTab === 'excel' && (
        <div className="pachamama-card rounded-3xl p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                <FileUp className="w-5 h-5 text-[#22C55E]" /> Cargar Archivo Excel o CSV
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Selecciona cualquier archivo de hoja de cálculo generado por Excel o exportado de Google Sheets.
              </p>
            </div>

            <button
              onClick={handleDownloadTemplate}
              className="text-xs font-bold text-[#22C55E] hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> ¿Necesitas la plantilla? Descárgala aquí
            </button>
          </div>

          {/* DROPZONE INPUT */}
          <div className="relative border-2 border-dashed border-white/20 hover:border-[#22C55E] bg-black/40 rounded-3xl p-8 md:p-12 text-center transition flex flex-col items-center justify-center gap-4 group">
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="w-16 h-16 rounded-3xl bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] flex items-center justify-center group-hover:scale-110 transition">
              <Upload className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-base font-black text-white">
                {fileName ? `Archivo Seleccionado: ${fileName}` : 'Haz clic o arrastra aquí tu archivo Excel / CSV'}
              </h4>
              <p className="text-xs text-zinc-400 font-mono mt-1">
                Formatos soportados: .xlsx, .xls, .csv (Soporta encabezados: Nombre, Dorsal, Categoría, Club)
              </p>
            </div>
          </div>

          {/* PREVIEW TABLE OF PARSED COMPETITORS */}
          {parsedCompetitors.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-white uppercase flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#22C55E]" /> Vista Previa de Competidores ({parsedCompetitors.length})
                </h4>
                <button
                  onClick={handleConfirmImport}
                  className="pachamama-btn-green font-black px-6 py-2.5 rounded-xl text-xs uppercase flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                >
                  <Check className="w-4 h-4" /> Confirmar e Importar ({parsedCompetitors.length})
                </button>
              </div>

              <div className="pachamama-inset rounded-2xl overflow-hidden border border-white/10 max-h-80 overflow-y-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-black/50 text-zinc-400 uppercase text-[10px] border-b border-white/10">
                    <tr>
                      <th className="p-3"># Dorsal</th>
                      <th className="p-3">Nombre del Competidor</th>
                      <th className="p-3">Categoría</th>
                      <th className="p-3">Club / Gimnasio</th>
                      <th className="p-3">Orden Salida</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-zinc-200">
                    {parsedCompetitors.map((c, idx) => (
                      <tr key={idx} className="hover:bg-white/5">
                        <td className="p-3 font-bold text-[#FACC15]">#{c.dorsal}</td>
                        <td className="p-3 font-bold text-white">{c.name}</td>
                        <td className="p-3 text-[#38BDF8]">{c.category}</td>
                        <td className="p-3 text-zinc-400">{c.club}</td>
                        <td className="p-3 text-zinc-400">#{c.startOrder}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE 2: COPY & PASTE FROM GOOGLE SHEETS */}
      {activeImportTab === 'paste' && (
        <div className="pachamama-card rounded-3xl p-6 md:p-8 space-y-6">
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-[#38BDF8]" /> Pegar Datos Copiados desde Google Sheets o Excel
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Selecciona las celdas en tu Google Sheet, cópialas (Ctrl+C / Cmd+C) y pégalas directamente en el cuadro de abajo.
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-zinc-300 block">
              Pegar Filas de la Hoja de Cálculo
            </label>
            <textarea
              rows={6}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Ejemplo:&#10;Nombre Completo&#t;Dorsal&#t;Categoría&#t;Club&#10;Sofía Benítez&#t;01&#t;Senior Femenino&#t;Pachamama&#10;Mateo Rossi&#t;02&#t;Senior Masculino&#t;Vertical Limit"
              className="w-full bg-black/60 border border-white/15 rounded-2xl p-4 text-xs font-mono text-white focus:outline-none focus:border-[#38BDF8] resize-none"
            />
            <button
              onClick={handleParsePastedText}
              disabled={!pastedText.trim()}
              className="pachamama-btn-blue font-black px-5 py-2.5 rounded-xl text-xs uppercase flex items-center gap-2 cursor-pointer disabled:opacity-40"
            >
              <ArrowRight className="w-4 h-4" /> Procesar y Analizar Celdas
            </button>
          </div>

          {/* PREVIEW TABLE OF PARSED COMPETITORS */}
          {parsedCompetitors.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-white uppercase flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#38BDF8]" /> Vista Previa de Competidores ({parsedCompetitors.length})
                </h4>
                <button
                  onClick={handleConfirmImport}
                  className="pachamama-btn-green font-black px-6 py-2.5 rounded-xl text-xs uppercase flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                >
                  <Check className="w-4 h-4" /> Confirmar e Importar ({parsedCompetitors.length})
                </button>
              </div>

              <div className="pachamama-inset rounded-2xl overflow-hidden border border-white/10 max-h-80 overflow-y-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-black/50 text-zinc-400 uppercase text-[10px] border-b border-white/10">
                    <tr>
                      <th className="p-3"># Dorsal</th>
                      <th className="p-3">Nombre del Competidor</th>
                      <th className="p-3">Categoría</th>
                      <th className="p-3">Club / Gimnasio</th>
                      <th className="p-3">Orden Salida</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-zinc-200">
                    {parsedCompetitors.map((c, idx) => (
                      <tr key={idx} className="hover:bg-white/5">
                        <td className="p-3 font-bold text-[#FACC15]">#{c.dorsal}</td>
                        <td className="p-3 font-bold text-white">{c.name}</td>
                        <td className="p-3 text-[#38BDF8]">{c.category}</td>
                        <td className="p-3 text-zinc-400">{c.club}</td>
                        <td className="p-3 text-zinc-400">#{c.startOrder}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE 3: TEMPLATE SPECIFICATION & FORMAT GUIDE */}
      {activeImportTab === 'template' && (
        <div className="pachamama-card rounded-3xl p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Table className="w-5 h-5 text-[#FACC15]" /> Estructura Oficial de la Plantilla Excel / Sheet
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Asegúrate de que tu hoja de cálculo contenga los siguientes nombres de columnas en la primera fila:
              </p>
            </div>

            <button
              onClick={handleDownloadTemplate}
              className="pachamama-btn-green font-black px-5 py-2.5 rounded-xl text-xs uppercase flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(34,197,94,0.3)]"
            >
              <Download className="w-4 h-4" /> Descargar Modelo Excel (.xlsx)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-black/40 rounded-2xl border border-white/10 space-y-2">
              <span className="text-xs font-black text-[#22C55E] uppercase block">
                1. Nombre Completo (Obligatorio)
              </span>
              <p className="text-xs text-zinc-300">
                Encabezados permitidos: <code className="text-[#FACC15]">Nombre</code>, <code className="text-[#FACC15]">Nombre Completo</code>, <code className="text-[#FACC15]">Competidor</code>, <code className="text-[#FACC15]">Escalador</code>
              </p>
            </div>

            <div className="p-4 bg-black/40 rounded-2xl border border-white/10 space-y-2">
              <span className="text-xs font-black text-[#38BDF8] uppercase block">
                2. Dorsal / Bib (Opcional)
              </span>
              <p className="text-xs text-zinc-300">
                Encabezados permitidos: <code className="text-[#FACC15]">Dorsal</code>, <code className="text-[#FACC15]">Bib</code>, <code className="text-[#FACC15]">#</code>, <code className="text-[#FACC15]">Número</code>. (Si se omite, se asigna automáticamente).
              </p>
            </div>

            <div className="p-4 bg-black/40 rounded-2xl border border-white/10 space-y-2">
              <span className="text-xs font-black text-[#EC4899] uppercase block">
                3. Categoría (Opcional)
              </span>
              <p className="text-xs text-zinc-300">
                Encabezados permitidos: <code className="text-[#FACC15]">Categoría</code>, <code className="text-[#FACC15]">Cat</code>. Ej: Senior Femenino, Senior Masculino, Juvenil A.
              </p>
            </div>

            <div className="p-4 bg-black/40 rounded-2xl border border-white/10 space-y-2">
              <span className="text-xs font-black text-[#FACC15] uppercase block">
                4. Club / Muro / Gimnasio (Opcional)
              </span>
              <p className="text-xs text-zinc-300">
                Encabezados permitidos: <code className="text-[#FACC15]">Club</code>, <code className="text-[#FACC15]">Muro</code>, <code className="text-[#FACC15]">Equipo</code>. Ej: Pachamama Team, Vertical Limit.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODE 4: GOOGLE FORMS API SYNCHRONIZATION */}
      {activeImportTab === 'google_forms' && (
        <div className="space-y-6">
          {/* AUTH STATUS CARD */}
          <div className="pachamama-card rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-[#EC4899]/20 border border-[#EC4899]/40 text-[#EC4899]">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wider">
                  Sincronización Directa con Google Forms
                </h3>
                <p className="text-xs text-zinc-400">
                  Crea y sincroniza inscripciones automáticamente conectando tu cuenta de Google Drive.
                </p>
              </div>
            </div>

            <div>
              {isAuthLoading ? (
                <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Verificando Google...
                </div>
              ) : user && accessToken ? (
                <div className="flex items-center gap-3 bg-black/40 p-2 pl-4 rounded-2xl border border-white/10">
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-bold text-white">{user.displayName || user.email}</span>
                    <span className="text-[10px] text-[#38C172] font-bold">Conectado a Google</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-white/10"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleSignIn}
                  disabled={isSigningIn}
                  className="bg-white hover:bg-zinc-100 text-zinc-900 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <Globe className="w-4 h-4 text-[#4285F4]" />
                  <span>{isSigningIn ? 'Conectando...' : 'Iniciar Sesión con Google'}</span>
                </button>
              )}
            </div>
          </div>

          {user && accessToken && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* CREATE & LIST FORMS */}
              <div className="lg:col-span-1 space-y-6">
                <div className="pachamama-card rounded-3xl p-6">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-[#E2A838]" /> Crear Nuevo Formulario
                  </h3>
                  <form onSubmit={handleCreateForm} className="space-y-3">
                    <input
                      type="text"
                      value={newFormTitle}
                      onChange={(e) => setNewFormTitle(e.target.value)}
                      required
                      className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-[#E2A838]"
                      placeholder="Título del formulario"
                    />
                    <textarea
                      value={newFormDesc}
                      onChange={(e) => setNewFormDesc(e.target.value)}
                      rows={2}
                      className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-[#E2A838] resize-none"
                      placeholder="Descripción"
                    />
                    <button
                      type="submit"
                      disabled={isCreatingForm}
                      className="w-full pachamama-btn-ochre font-black py-2 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isCreatingForm ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      <span>Crear en Google Drive</span>
                    </button>
                  </form>
                </div>

                <div className="pachamama-card rounded-3xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <List className="w-4 h-4 text-[#38BDF8]" /> Mis Formularios ({formsList.length})
                    </h3>
                    <button onClick={() => fetchForms()} className="p-1 rounded bg-white/5 hover:bg-white/10 text-zinc-300">
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingForms ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {formsList.map((f) => (
                      <div
                        key={f.id}
                        onClick={() => handleSelectForm(f.id)}
                        className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                          selectedFormId === f.id
                            ? 'bg-[#1E88E5]/20 border-[#1E88E5]/60 text-white'
                            : 'bg-black/30 border-white/10 text-zinc-300 hover:bg-white/5'
                        }`}
                      >
                        <span className="text-xs font-bold truncate">{f.name}</span>
                        <div className="flex items-center gap-1">
                          {f.webViewLink && (
                            <a href={f.webViewLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-1 text-zinc-400 hover:text-white">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RESPONSES PANEL */}
              <div className="lg:col-span-2">
                {selectedFormDetails ? (
                  <div className="pachamama-card rounded-3xl p-6 space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b border-white/10">
                      <div>
                        <h3 className="text-lg font-black text-white uppercase">{selectedFormDetails.info.title}</h3>
                        <p className="text-xs text-zinc-400">Respuestas registradas: {submissions.length}</p>
                      </div>
                      <button
                        onClick={handleImportSubmissionsToCompetitors}
                        disabled={submissions.length === 0}
                        className="pachamama-btn-green font-black px-4 py-2 rounded-xl text-xs flex items-center gap-2 cursor-pointer disabled:opacity-40"
                      >
                        <Download className="w-4 h-4" /> Importar Competidores
                      </button>
                    </div>

                    <div className="pachamama-inset rounded-2xl overflow-hidden border border-white/10 max-h-80 overflow-y-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-black/40 text-zinc-400 uppercase text-[10px]">
                          <tr>
                            <th className="p-3">#</th>
                            <th className="p-3">Respuestas</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-zinc-200">
                          {submissions.map((sub, idx) => (
                            <tr key={sub.responseId}>
                              <td className="p-3 font-bold text-[#FACC15]">{idx + 1}</td>
                              <td className="p-3">
                                <div className="flex flex-wrap gap-2">
                                  {Object.entries(sub.answers).map(([q, a]) => (
                                    <span key={q} className="bg-white/5 px-2 py-0.5 rounded border border-white/10">
                                      <strong className="text-zinc-400">{q}:</strong> {a}
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="pachamama-card rounded-3xl p-12 text-center text-zinc-400 text-xs">
                    Selecciona un formulario para ver y sincronizar inscripciones.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="pachamama-card max-w-md w-full rounded-3xl p-6 border border-red-500/30 flex flex-col gap-4">
            <h3 className="text-lg font-black text-white uppercase">Confirmar eliminación</h3>
            <p className="text-xs text-zinc-300">¿Estás seguro de eliminar este formulario?</p>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 rounded-xl bg-white/10 text-xs font-bold">Cancelar</button>
              <button onClick={handleDeleteFormConfirmed} className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-black">Eliminar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
