import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Move, 
  SlidersHorizontal, 
  Eye, 
  Sparkles, 
  Search, 
  Check, 
  AlertTriangle,
  Upload,
  Image as ImageIcon,
  ChevronDown,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Layers
} from 'lucide-react';
import type { CustomizableCategory } from '../../types/types';
import { CustomProductPreview } from '../customizer/CustomProductPreview';
import { 
  getCustomCategoriesData, 
  getCustomOptionsMap, 
  updateCustomCategoryInfo, 
  updateCustomCategoryOptions, 
  subscribeToCustomStore 
} from '../../data/customStore';
import { isSpatialAttribute } from '../../data/customData';
import type { CategoryOptionGroup } from '../customizer/ProductCustomizerStudio';
import type { CustomizableProductCategoryInfo } from '../customizer/CustomizerCatalogGrid';

interface AdminCustomProductsManagerProps {
  isDarkMode?: boolean;
}

export const AdminCustomProductsManager: React.FC<AdminCustomProductsManagerProps> = ({
  isDarkMode = true,
}) => {
  const [, setStoreTick] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('TODAS');

  // Modal Editor state
  const [editingCategory, setEditingCategory] = useState<CustomizableCategory | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview-transforms' | 'options' | 'info'>('preview-transforms');

  // Working copy of editing category meta and option groups
  const [editingMeta, setEditingMeta] = useState<CustomizableProductCategoryInfo | null>(null);
  const [editingGroups, setEditingGroups] = useState<CategoryOptionGroup[]>([]);
  const [previewOptions, setPreviewOptions] = useState<Record<string, string>>({});
  const [previewTransforms, setPreviewTransforms] = useState({
    zoom: 100,
    posX: 0,
    posY: 0,
    rotate: 0,
  });
  const [customImageSample, setCustomImageSample] = useState<string | null>(
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop'
  );

  // Variation / Choice Specific Transform States
  const [selectedAttributeKey, setSelectedAttributeKey] = useState<string>('');
  const [selectedChoiceId, setSelectedChoiceId] = useState<string>('');
  const [transformTargetMode, setTransformTargetMode] = useState<'choice' | 'group' | 'all'>('choice');

  // Collapsible Accordion & Layer Order States
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const handleToggleGroupCollapse = (key: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCollapseAllGroups = () => {
    const next: Record<string, boolean> = {};
    editingGroups.forEach((g) => { next[g.key] = true; });
    setCollapsedGroups(next);
  };

  const handleExpandAllGroups = () => {
    setCollapsedGroups({});
  };

  const handleMoveGroupLayer = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= editingGroups.length) return;
    const copy = [...editingGroups];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);
    setEditingGroups(copy);
  };

  // Notification Banner
  const [bannerMsg, setBannerMsg] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  useEffect(() => {
    return subscribeToCustomStore(() => {
      setStoreTick((t) => t + 1);
    });
  }, []);

  const categoriesData = getCustomCategoriesData();
  const optionsMap = getCustomOptionsMap();

  // Filter list
  const filteredCategories = categoriesData.filter((cat) => {
    const matchesSearch = cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategoryFilter === 'TODAS' || cat.id === selectedCategoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleOpenEditCategory = (catId: CustomizableCategory) => {
    const meta = categoriesData.find((c) => c.id === catId);
    const groups = optionsMap[catId] || [];

    if (!meta) return;

    setEditingCategory(catId);
    setEditingMeta(JSON.parse(JSON.stringify(meta)));
    setEditingGroups(JSON.parse(JSON.stringify(groups)));

    // Set initial preview options & attribute selector
    const initialOpts: Record<string, string> = {};
    groups.forEach((g) => {
      if (g.choices && g.choices.length > 0) {
        initialOpts[g.key] = g.choices[0].name;
      }
    });
    setPreviewOptions(initialOpts);

    if (groups.length > 0) {
      // Find first spatial attribute group or default to first
      const firstSpatial = groups.find((g) => isSpatialAttribute(g.key, g.label)) || groups[0];
      setSelectedAttributeKey(firstSpatial.key);
      const firstChoice = firstSpatial.choices[0];
      setSelectedChoiceId(firstChoice?.id || '');

      const initTf = firstChoice?.transform || firstSpatial.transform || { posX: 0, posY: 0, zoom: 100, rotate: 0 };
      setPreviewTransforms(initTf);
    } else {
      setSelectedAttributeKey('');
      setSelectedChoiceId('');
      setPreviewTransforms({ zoom: 100, posX: 0, posY: 0, rotate: 0 });
    }

    setActiveTab('preview-transforms');
    setIsEditorOpen(true);
  };

  const handleSaveEditor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingMeta) return;

    if (!editingMeta.name.trim()) {
      setBannerMsg({ text: 'El nombre del producto custom es obligatorio y no puede estar vacío.', type: 'error' });
      return;
    }

    if (editingMeta.basePrice === undefined || editingMeta.basePrice < 0 || isNaN(editingMeta.basePrice)) {
      setBannerMsg({ text: 'El precio base debe ser un número válido mayor o igual a 0.', type: 'error' });
      return;
    }

    if (!editingGroups || editingGroups.length === 0) {
      setBannerMsg({ text: 'Como mínimo el producto debe poseer al menos 1 atributo configurado.', type: 'error' });
      return;
    }

    for (let i = 0; i < editingGroups.length; i++) {
      const grp = editingGroups[i];
      if (!grp.label || !grp.label.trim()) {
        setBannerMsg({ text: `El nombre del atributo #${i + 1} no puede estar vacío.`, type: 'error' });
        return;
      }
      if (!grp.choices || grp.choices.length === 0) {
        setBannerMsg({ text: `El atributo "${grp.label}" debe contener al menos 1 variación.`, type: 'error' });
        return;
      }
      for (let j = 0; j < grp.choices.length; j++) {
        const ch = grp.choices[j];
        if (!ch.name || !ch.name.trim()) {
          setBannerMsg({ text: `La variación #${j + 1} del atributo "${grp.label}" no puede tener un nombre vacío.`, type: 'error' });
          return;
        }
      }
    }

    // Save changes to unified store
    updateCustomCategoryInfo(editingCategory, editingMeta);
    updateCustomCategoryOptions(editingCategory, editingGroups);

    setIsEditorOpen(false);
    setEditingCategory(null);
    setEditingMeta(null);
    setBannerMsg({ 
      text: `¡Cambios unificados guardados para ${editingMeta.name}! Se han actualizado en la vista de cliente y tienda.`, 
      type: 'success' 
    });
    setTimeout(() => setBannerMsg(null), 4000);
  };

  // OPTION GROUPS ACTIONS
  const handleAddOptionGroup = () => {
    const newKey = `opcion_${Date.now()}`;
    const newGrp: CategoryOptionGroup = {
      key: newKey,
      label: 'NUEVO ATRIBUTO',
      choices: [
        { id: `opt-1`, name: 'VARIACIÓN STANDARD', priceDelta: 0 },
      ],
    };
    setEditingGroups([...editingGroups, newGrp]);
  };

  const handleRemoveOptionGroup = (key: string) => {
    if (editingGroups.length <= 1) {
      setBannerMsg({ 
        text: 'No se puede eliminar el último atributo. El producto custom debe tener como mínimo 1 atributo configurado.', 
        type: 'error' 
      });
      return;
    }
    setEditingGroups(editingGroups.filter((g) => g.key !== key));
  };

  const handleAddChoice = (groupKey: string) => {
    setEditingGroups(
      editingGroups.map((g) => {
        if (g.key !== groupKey) return g;
        return {
          ...g,
          choices: [
            ...g.choices,
            { id: `choice-${Date.now()}`, name: 'NUEVA VARIACIÓN', priceDelta: 0 },
          ],
        };
      })
    );
  };

  const handleRemoveChoice = (groupKey: string, choiceId: string) => {
    const targetGrp = editingGroups.find((g) => g.key === groupKey);
    if (targetGrp && targetGrp.choices.length <= 1) {
      setBannerMsg({ 
        text: `No se puede eliminar la última variación del atributo "${targetGrp.label}". Debe haber al menos 1 variación.`, 
        type: 'error' 
      });
      return;
    }

    setEditingGroups(
      editingGroups.map((g) => {
        if (g.key !== groupKey) return g;
        return {
          ...g,
          choices: g.choices.filter((c) => c.id !== choiceId),
        };
      })
    );
  };

  const containerBg = isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-gray-200 text-gray-900';
  const inputClass = `w-full rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none border transition-colors ${
    isDarkMode 
      ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-slate-500' 
      : 'bg-white border-gray-300 text-gray-900 focus:border-gray-800'
  }`;

  return (
    <div className="space-y-6 font-sans">
      
      {/* SUCCESS / ERROR NOTIFICATION BANNER */}
      {bannerMsg && (
        <div className={`p-4 rounded-xl font-bold text-xs uppercase flex items-center gap-2 border animate-in fade-in ${
          bannerMsg.type === 'error' 
            ? (isDarkMode ? 'bg-red-950/40 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-700')
            : (isDarkMode ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700')
        }`}>
          {bannerMsg.type === 'error' ? <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" /> : <Check className="w-4 h-4 shrink-0 text-emerald-500" />}
          <span>{bannerMsg.text}</span>
        </div>
      )}

      {/* HEADER & TOP CONTROLS */}
      <div className={`p-5 rounded-2xl border shadow-sm transition-colors ${containerBg}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className={`text-base font-extrabold uppercase tracking-wide flex items-center gap-2 ${
              isDarkMode ? 'text-amber-400' : 'text-gray-900'
            }`}>
              <Wrench className="w-5 h-5 text-amber-500" /> TALLER CUSTOM & PRODUCTOS PERSONALIZADOS UNIFICADOS
            </h2>
            <p className={`text-xs mt-1 font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              Todos los atributos, siluetas, colores, opciones y precios están 100% unificados. Los cambios realizados por el administrador impactan en tiempo real en la tienda del cliente.
            </p>
          </div>
        </div>

        {/* SEARCH AND FILTERS */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-slate-800">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por categoría custom o descripción..."
              className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs font-semibold focus:outline-none border ${
                isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
              }`}
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className={`w-full py-2 px-3 rounded-xl text-xs font-semibold focus:outline-none border uppercase cursor-pointer ${
                isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-gray-50 border-gray-200 text-gray-900'
              }`}
            >
              <option value="TODAS">TODAS LAS CATEGORÍAS CUSTOM ({categoriesData.length})</option>
              {categoriesData.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* CATEGORIES / CUSTOM PRODUCTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map((cat) => {
          const groups = optionsMap[cat.id] || [];
          return (
            <div
              key={cat.id}
              className={`rounded-2xl border overflow-hidden shadow-sm transition-all flex flex-col justify-between ${containerBg}`}
            >
              {/* CARD PREVIEW TOP SILHOUETTE */}
              <div className="relative h-56 bg-gradient-to-b from-yellow-50/20 via-white/5 to-pink-50/20 p-4 flex items-center justify-center border-b border-gray-200 dark:border-slate-800">
                <div className="w-full max-w-[200px] h-full flex items-center justify-center">
                  <CustomProductPreview
                    category={cat.id}
                    overrideOptionGroups={groups}
                    compact={true}
                    hideHeader={true}
                  />
                </div>

                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-amber-500 text-black shadow-xs">
                    {cat.name}
                  </span>
                </div>
              </div>

              {/* CARD DETAILS */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className={`font-bold text-sm leading-tight ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                      {cat.name}
                    </h3>
                    <span className="font-black text-emerald-500 text-sm">
                      ${cat.basePrice.toLocaleString('es-AR')} ARS
                    </span>
                  </div>
                  <p className={`text-xs mt-1.5 line-clamp-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    {cat.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-gray-200 dark:border-slate-800 space-y-1">
                  <span className={`text-[10px] uppercase font-bold block ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    Grupos de Atributos ({groups.length}):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {groups.map((g) => (
                      <span key={g.key} className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-gray-100 border-gray-300 text-gray-700'
                      }`}>
                        {g.label} ({g.choices.length})
                      </span>
                    ))}
                  </div>
                </div>

                {/* EDIT BUTTON */}
                <div className="pt-2">
                  <button
                    onClick={() => handleOpenEditCategory(cat.id)}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 cursor-pointer border shadow-xs ${
                      isDarkMode ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-100' : 'bg-gray-900 hover:bg-black border-gray-900 text-white'
                    }`}
                  >
                    <Edit className="w-3.5 h-3.5 text-amber-400" /> Acomodar Vista Previa y Modificar Atributos
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FULL UNIFIED EDITOR MODAL WITH REALTIME SILHOUETTE PREVIEW & TRANSFORMS */}
      {isEditorOpen && editingCategory && editingMeta && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50 overflow-y-auto animate-in fade-in"
          onClick={() => setIsEditorOpen(false)}
        >
          <div 
            className={`w-full max-w-6xl my-4 rounded-2xl border shadow-2xl overflow-hidden font-sans transition-colors max-h-[92vh] flex flex-col ${
              isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-gray-200 text-gray-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}
            <div className={`px-6 py-4 flex items-center justify-between border-b shrink-0 ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center gap-2.5">
                <Wrench className="w-5 h-5 text-amber-500" />
                <h2 className={`text-base font-bold uppercase tracking-wide ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                  EDITOR DE CONFIGURACIÓN Y VISTA PREVIA: {editingMeta.name}
                </h2>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isDarkMode ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-200'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TAB SELECTION */}
            <div className={`flex border-b px-6 pt-3 gap-2 shrink-0 ${
              isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-gray-200 bg-gray-50/50'
            }`}>
              <button
                type="button"
                onClick={() => setActiveTab('preview-transforms')}
                className={`px-4 py-2 text-xs font-bold uppercase border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'preview-transforms'
                    ? (isDarkMode ? 'border-amber-400 text-amber-400' : 'border-gray-900 text-gray-900')
                    : (isDarkMode ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-gray-500 hover:text-gray-800')
                }`}
              >
                <Move className="w-4 h-4" /> 1. ACOMODAR VISTA PREVIA Y TRANSFORMS EN VIVO
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('options')}
                className={`px-4 py-2 text-xs font-bold uppercase border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'options'
                    ? (isDarkMode ? 'border-amber-400 text-amber-400' : 'border-gray-900 text-gray-900')
                    : (isDarkMode ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-gray-500 hover:text-gray-800')
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" /> 2. MODIFICAR ATRIBUTOS, COLORES Y OPCIONES
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('info')}
                className={`px-4 py-2 text-xs font-bold uppercase border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'info'
                    ? (isDarkMode ? 'border-amber-400 text-amber-400' : 'border-gray-900 text-gray-900')
                    : (isDarkMode ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-gray-500 hover:text-gray-800')
                }`}
              >
                <Sparkles className="w-4 h-4" /> 3. PRECIO BASE & DESCRIPCIÓN
              </button>
            </div>

            {/* FORM / TAB BODY */}
            <form onSubmit={handleSaveEditor} className={`flex-1 ${
              activeTab === 'preview-transforms' ? 'overflow-hidden flex flex-col justify-between p-4 space-y-2 min-h-0' : 'overflow-y-auto p-6 space-y-6'
            }`}>

              {/* TAB 1: VISUAL SILHOUETTE PREVIEW & TRANSFORMS */}
              {activeTab === 'preview-transforms' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start flex-1 min-h-0">
                  
                  {/* LEFT: EXACT SAME SILHOUETTE PREVIEW COMPONENT AS CLIENT */}
                  <div className="lg:col-span-6 space-y-2 flex flex-col justify-between">
                    <div className="flex items-center justify-between shrink-0">
                      <span className={`text-xs font-extrabold uppercase tracking-wide flex items-center gap-1.5 ${
                        isDarkMode ? 'text-amber-400' : 'text-gray-800'
                      }`}>
                        <Eye className="w-4 h-4" /> SILUETA & VISTA PREVIA DEL CLIENTE
                      </span>
                      <span className="text-[10px] text-emerald-500 font-bold uppercase">Mismo renderizador SVG</span>
                    </div>

                    <div className={`p-2 rounded-2xl border flex items-center justify-center h-[330px] overflow-hidden shrink-0 ${
                      isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-gray-100 border-gray-300'
                    }`}>
                      <CustomProductPreview
                        category={editingCategory}
                        options={previewOptions}
                        overrideOptionGroups={editingGroups}
                        customImage={customImageSample}
                        imageTransforms={previewTransforms}
                        onUpdateTransforms={(newT) => setPreviewTransforms(newT)}
                        compact={true}
                        hideHeader={true}
                      />
                    </div>
                  </div>

                  {/* RIGHT: REALTIME POSITIONING & PREVIEW CONTROLS PER ATTRIBUTE AND VARIATION */}
                  <div className="lg:col-span-6 space-y-2 flex flex-col justify-between">
                    {(() => {
                      const spatialGroups = editingGroups.filter((g) => isSpatialAttribute(g.key, g.label));
                      const targetGroup = spatialGroups.find((g) => g.key === selectedAttributeKey) || spatialGroups[0];
                      const isSpatial = targetGroup ? isSpatialAttribute(targetGroup.key, targetGroup.label) : false;

                      const targetChoice = targetGroup?.choices.find((c) => c.id === selectedChoiceId) ||
                        targetGroup?.choices.find((c) => c.name.toLowerCase() === (previewOptions[targetGroup?.key || ''] || '').toLowerCase()) ||
                        targetGroup?.choices[0];

                      const currentTf = transformTargetMode === 'choice' && targetChoice
                        ? (targetChoice.transform || { posX: 0, posY: 0, zoom: 100, rotate: 0 })
                        : (targetGroup?.transform || { posX: 0, posY: 0, zoom: 100, rotate: 0 });

                      const handleUpdateTargetTransform = (updates: Partial<{ posX: number; posY: number; zoom: number; rotate: number }>) => {
                        if (!targetGroup) return;
                        const newTf = {
                          posX: currentTf.posX ?? 0,
                          posY: currentTf.posY ?? 0,
                          zoom: currentTf.zoom ?? 100,
                          rotate: currentTf.rotate ?? 0,
                          ...updates,
                        };

                        if (transformTargetMode === 'choice' && targetChoice) {
                          setEditingGroups(
                            editingGroups.map((g) => {
                              if (g.key !== targetGroup.key) return g;
                              return {
                                ...g,
                                choices: g.choices.map((c) => (c.id === targetChoice.id ? { ...c, transform: newTf } : c)),
                              };
                            })
                          );
                          setPreviewOptions((prev) => ({ ...prev, [targetGroup.key]: targetChoice.name }));
                        } else if (transformTargetMode === 'all') {
                          setEditingGroups(
                            editingGroups.map((g) => ({
                              ...g,
                              transform: newTf,
                            }))
                          );
                        } else {
                          setEditingGroups(
                            editingGroups.map((g) => {
                              if (g.key !== targetGroup.key) return g;
                              return {
                                ...g,
                                transform: newTf,
                              };
                            })
                          );
                        }
                        setPreviewTransforms(newTf);
                      };

                      const colorGroups = editingGroups.filter(
                        (g) => g.key === 'color' || g.label.toLowerCase().includes('color') || !isSpatialAttribute(g.key, g.label)
                      );

                      return (
                        <div className={`p-3 rounded-2xl border space-y-2.5 ${
                          isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-gray-50 border-gray-200'
                        }`}>
                          <h4 className="text-[11px] font-extrabold uppercase text-amber-500 border-b border-gray-200 dark:border-slate-800 pb-1 shrink-0">
                            ACOMODAR MANUALMENTE UBICACIÓN Y ESCALA POR VARIACIÓN
                          </h4>

                          {/* ATTRIBUTE SELECTOR & ACTIVE VARIATION PICKER */}
                          <div className="p-2 rounded-xl border bg-amber-500/10 border-amber-500/30 space-y-1.5 shrink-0">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-extrabold uppercase text-amber-400">
                                ATRIBUTO A ACOMODAR:
                              </label>
                              <span className="text-[9px] text-slate-400 font-mono font-semibold">
                                Clave: {targetGroup?.key || 'Ninguno'}
                              </span>
                            </div>

                            {/* ONLY SPATIAL / POSITION-MODIFIABLE ATTRIBUTES SHOWN */}
                            <select
                              value={selectedAttributeKey || targetGroup?.key || ''}
                              onChange={(e) => {
                                const key = e.target.value;
                                setSelectedAttributeKey(key);
                                const found = spatialGroups.find((g) => g.key === key);
                                if (found) {
                                  const firstChoice = found.choices[0];
                                  setSelectedChoiceId(firstChoice?.id || '');
                                  const initTf = firstChoice?.transform || found.transform || { posX: 0, posY: 0, zoom: 100, rotate: 0 };
                                  setPreviewTransforms(initTf);

                                  const currentOpt = previewOptions[key];
                                  if (!currentOpt || currentOpt.toLowerCase().includes('sin')) {
                                    const visibleChoice = found.choices.find((c) => !c.name.toLowerCase().includes('sin')) || found.choices[0];
                                    if (visibleChoice) {
                                      setPreviewOptions({ ...previewOptions, [key]: visibleChoice.name });
                                    }
                                  }
                                }
                              }}
                              className={`w-full py-1.5 px-2.5 rounded-xl text-xs font-bold uppercase border cursor-pointer ${
                                isDarkMode ? 'bg-slate-950 border-amber-500/40 text-amber-300' : 'bg-white border-amber-500 text-gray-900'
                              }`}
                            >
                              {spatialGroups.map((grp) => (
                                <option key={grp.key} value={grp.key}>
                                  {grp.label} ({grp.choices.length} variaciones)
                                </option>
                              ))}
                            </select>

                            {/* SPATIAL CONTROLS & TARGET SELECTION */}
                            {isSpatial && targetGroup && (
                              <div className="space-y-1.5 pt-0.5">
                                {/* CHOICE SELECTOR */}
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[9px] uppercase font-bold text-slate-300 shrink-0">
                                    Variación a Acomodar:
                                  </span>
                                  <select
                                    value={selectedChoiceId || targetChoice?.id || ''}
                                    onChange={(e) => {
                                      const choiceId = e.target.value;
                                      setSelectedChoiceId(choiceId);
                                      const ch = targetGroup.choices.find((c) => c.id === choiceId);
                                      if (ch) {
                                        setPreviewOptions({ ...previewOptions, [targetGroup.key]: ch.name });
                                        if (ch.transform) {
                                          setPreviewTransforms(ch.transform);
                                        } else if (targetGroup.transform) {
                                          setPreviewTransforms(targetGroup.transform);
                                        } else {
                                          setPreviewTransforms({ posX: 0, posY: 0, zoom: 100, rotate: 0 });
                                        }
                                      }
                                    }}
                                    className={`py-1 px-2 text-xs font-extrabold rounded-lg border uppercase flex-1 ${
                                      isDarkMode ? 'bg-slate-950 border-amber-500/50 text-amber-300' : 'bg-white border-amber-500 text-gray-900'
                                    }`}
                                  >
                                    {targetGroup.choices.map((c) => (
                                      <option key={c.id} value={c.id}>
                                        {c.name} {c.transform ? '*(Posición Personalizada)' : ''}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {/* TARGET SCOPE SWITCH (CHOICE VS GROUP VS ALL) */}
                                <div className="grid grid-cols-3 gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTransformTargetMode('choice');
                                      if (targetChoice) {
                                        setPreviewOptions((prev) => ({ ...prev, [targetGroup.key]: targetChoice.name }));
                                        if (targetChoice.transform) {
                                          setPreviewTransforms(targetChoice.transform);
                                        } else {
                                          setPreviewTransforms({ posX: 0, posY: 0, zoom: 100, rotate: 0 });
                                        }
                                      }
                                    }}
                                    className={`py-1 px-1 rounded-lg text-[9px] font-extrabold uppercase border transition-all text-center cursor-pointer ${
                                      transformTargetMode === 'choice'
                                        ? 'bg-amber-500 text-black border-amber-400 shadow-xs'
                                        : (isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50')
                                    }`}
                                    title={`Editando solo la variación "${targetChoice?.name}"`}
                                  >
                                    Solo Variación
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTransformTargetMode('group');
                                      if (targetGroup) {
                                        if (targetGroup.transform) {
                                          setPreviewTransforms(targetGroup.transform);
                                        } else {
                                          setPreviewTransforms({ posX: 0, posY: 0, zoom: 100, rotate: 0 });
                                        }
                                      }
                                    }}
                                    className={`py-1 px-1 rounded-lg text-[9px] font-extrabold uppercase border transition-all text-center cursor-pointer ${
                                      transformTargetMode === 'group'
                                        ? 'bg-amber-500 text-black border-amber-400 shadow-xs'
                                        : (isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50')
                                    }`}
                                    title={`Editando solo el atributo "${targetGroup.label}"`}
                                  >
                                    Solo Atributo
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTransformTargetMode('all');
                                      if (targetGroup) {
                                        if (targetGroup.transform) {
                                          setPreviewTransforms(targetGroup.transform);
                                        } else {
                                          setPreviewTransforms({ posX: 0, posY: 0, zoom: 100, rotate: 0 });
                                        }
                                      }
                                    }}
                                    className={`py-1 px-1 rounded-lg text-[9px] font-extrabold uppercase border transition-all text-center cursor-pointer ${
                                      transformTargetMode === 'all'
                                        ? 'bg-amber-500 text-black border-amber-400 shadow-xs'
                                        : (isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50')
                                    }`}
                                    title="Acomodar objeto completo (Mueve todos los atributos al mismo tiempo)"
                                  >
                                    Objeto Completo
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* SLIDERS (ONLY SHOWN IF SPATIAL) */}
                          {isSpatial && targetGroup && (
                            <div className="space-y-2">
                              {/* POS X */}
                              <div>
                                <div className="flex justify-between text-[10px] font-bold uppercase mb-0.5">
                                  <span className={isDarkMode ? 'text-slate-300' : 'text-gray-700'}>
                                    Posición X (Horizontal): {currentTf.posX ?? 0}px
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateTargetTransform({ posX: 0 })}
                                    className="text-[9px] text-amber-500 hover:underline"
                                  >
                                    Reset
                                  </button>
                                </div>
                                <input
                                  type="range"
                                  min="-150"
                                  max="150"
                                  value={currentTf.posX ?? 0}
                                  onChange={(e) => handleUpdateTargetTransform({ posX: Number(e.target.value) })}
                                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                                />
                              </div>

                              {/* POS Y */}
                              <div>
                                <div className="flex justify-between text-[10px] font-bold uppercase mb-0.5">
                                  <span className={isDarkMode ? 'text-slate-300' : 'text-gray-700'}>
                                    Posición Y (Vertical): {currentTf.posY ?? 0}px
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateTargetTransform({ posY: 0 })}
                                    className="text-[9px] text-amber-500 hover:underline"
                                  >
                                    Reset
                                  </button>
                                </div>
                                <input
                                  type="range"
                                  min="-150"
                                  max="150"
                                  value={currentTf.posY ?? 0}
                                  onChange={(e) => handleUpdateTargetTransform({ posY: Number(e.target.value) })}
                                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                                />
                              </div>

                              {/* ZOOM */}
                              <div>
                                <div className="flex justify-between text-[10px] font-bold uppercase mb-0.5">
                                  <span className={isDarkMode ? 'text-slate-300' : 'text-gray-700'}>
                                    Escala / Zoom: {currentTf.zoom ?? 100}%
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateTargetTransform({ zoom: 100 })}
                                    className="text-[9px] text-amber-500 hover:underline"
                                  >
                                    100%
                                  </button>
                                </div>
                                <input
                                  type="range"
                                  min="30"
                                  max="250"
                                  value={currentTf.zoom ?? 100}
                                  onChange={(e) => handleUpdateTargetTransform({ zoom: Number(e.target.value) })}
                                  className="w-full accent-pink-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                                />
                              </div>

                              {/* ROTATION */}
                              <div>
                                <div className="flex justify-between text-[10px] font-bold uppercase mb-0.5">
                                  <span className={isDarkMode ? 'text-slate-300' : 'text-gray-700'}>
                                    Rotación: {currentTf.rotate ?? 0}°
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateTargetTransform({ rotate: 0 })}
                                    className="text-[9px] text-amber-500 hover:underline"
                                  >
                                    0°
                                  </button>
                                </div>
                                <input
                                  type="range"
                                  min="-180"
                                  max="180"
                                  value={currentTf.rotate ?? 0}
                                  onChange={(e) => handleUpdateTargetTransform({ rotate: Number(e.target.value) })}
                                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                                />
                              </div>
                            </div>
                          )}

                          {/* COMPACT LIVE COLOR SELECTOR */}
                          {colorGroups.length > 0 && (
                            <div className="p-2 rounded-xl border bg-amber-500/10 border-amber-500/30 space-y-1.5">
                              <span className="text-[9px] font-extrabold uppercase text-amber-400 block tracking-wide">
                                COLOR / TELA DEL PRODUCTO (CAMBIO EN VIVO)
                              </span>
                              {colorGroups.map((colorGrp) => (
                                <div key={colorGrp.key} className="flex items-center justify-between gap-2 text-xs">
                                  <span className="text-slate-300 font-bold text-[10px] uppercase truncate">{colorGrp.label}:</span>
                                  <select
                                    value={previewOptions[colorGrp.key] || colorGrp.choices[0]?.name || ''}
                                    onChange={(e) => setPreviewOptions({ ...previewOptions, [colorGrp.key]: e.target.value })}
                                    className={`py-1 px-2 text-[10px] font-extrabold rounded-lg border uppercase cursor-pointer ${
                                      isDarkMode ? 'bg-slate-950 border-amber-500/40 text-amber-300' : 'bg-white border-amber-500 text-gray-900'
                                    }`}
                                  >
                                    {colorGrp.choices.map((c) => (
                                      <option key={c.id} value={c.name}>
                                        {c.name} {c.priceDelta ? `(+${c.priceDelta})` : ''}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* SAMPLE CUSTOM IMAGE URL (ONLY FOR CUSTOM IMAGE UPLOAD CATEGORIES LIKE REMERAS, PINES, STICKERS, POSTERS) */}
                          {['PINES', 'STICKERS', 'REMERAS', 'POSTERS', 'PINTURAS'].includes(editingCategory) && (
                            <div>
                              <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">
                                Cargar Imagen de Muestra para Probar Estampa
                              </label>
                              <input
                                type="url"
                                value={customImageSample || ''}
                                onChange={(e) => setCustomImageSample(e.target.value || null)}
                                placeholder="https://images.unsplash.com/..."
                                className={inputClass}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* TAB 2: OPTIONS, SWATCHES & PRICE DELTAS EDITOR */}
              {activeTab === 'options' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className={`text-sm font-bold uppercase ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                        GRUPOS DE ATRIBUTOS Y OPCIONES MODIFICABLES
                      </h3>
                      <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                        Organiza opciones, recargos de precio ($) y jerarquía de capas SVG. Haz clic en un atributo para colapsarlo.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={handleExpandAllGroups}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold uppercase border transition-colors cursor-pointer ${
                          isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        Expandir Todo
                      </button>
                      <button
                        type="button"
                        onClick={handleCollapseAllGroups}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold uppercase border transition-colors cursor-pointer ${
                          isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        Colapsar Todo
                      </button>
                      <button
                        type="button"
                        onClick={handleAddOptionGroup}
                        className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Plus className="w-4 h-4" /> AGREGAR GRUPO DE OPCIONES
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {editingGroups.map((grp, grpIdx) => {
                      const isCollapsed = !!collapsedGroups[grp.key];

                      return (
                        <div
                          key={grp.key}
                          className={`p-4 rounded-2xl border transition-all ${
                            isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          {/* GROUP HEADER & ACCORDION BAR */}
                          <div className="flex items-center justify-between gap-3 pb-2 border-b border-gray-200 dark:border-slate-800">
                            <div className="flex items-center gap-2 flex-1">
                              <button
                                type="button"
                                onClick={() => handleToggleGroupCollapse(grp.key)}
                                className="p-1 text-amber-500 hover:bg-amber-500/10 rounded transition-colors cursor-pointer"
                                title={isCollapsed ? 'Expandir grupo' : 'Colapsar grupo'}
                              >
                                {isCollapsed ? <ChevronRight className="w-4 h-4 stroke-[3]" /> : <ChevronDown className="w-4 h-4 stroke-[3]" />}
                              </button>

                              <input
                                type="text"
                                value={grp.label}
                                onChange={(e) => {
                                  const newLabel = e.target.value;
                                  setEditingGroups(
                                    editingGroups.map((g) => (g.key === grp.key ? { ...g, label: newLabel } : g))
                                  );
                                }}
                                placeholder="Nombre visible (Ej: Tipo de Cadena / Color de Prenda)"
                                className={`font-black text-xs uppercase max-w-xs ${inputClass}`}
                              />

                              <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                                Clave: {grp.key}
                              </span>

                              <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                                {grp.choices.length} variaciones
                              </span>

                              {/* LAYER ORDER BADGE & REORDER BUTTONS (ONLY FOR SPATIAL SVG ATTRIBUTES) */}
                              {isSpatialAttribute(grp.key, grp.label) && (
                                <div className="flex items-center gap-1 ml-auto shrink-0 bg-slate-950/60 px-2 py-1 rounded-lg border border-slate-800">
                                  <span className="text-[9px] font-mono text-slate-400 flex items-center gap-1">
                                    <Layers className="w-3 h-3 text-purple-400" /> Capa {grpIdx + 1}
                                  </span>
                                  <button
                                    type="button"
                                    disabled={grpIdx === 0}
                                    onClick={() => handleMoveGroupLayer(grpIdx, 'up')}
                                    className="p-0.5 text-slate-400 hover:text-amber-400 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                                    title="Subir orden de capa (Mover hacia atrás en SVG)"
                                  >
                                    <ArrowUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={grpIdx === editingGroups.length - 1}
                                    onClick={() => handleMoveGroupLayer(grpIdx, 'down')}
                                    className="p-0.5 text-slate-400 hover:text-amber-400 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                                    title="Bajar orden de capa (Mover al frente en SVG)"
                                  >
                                    <ArrowDown className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleAddChoice(grp.key)}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" /> Agregar Variación
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveOptionGroup(grp.key)}
                                className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg"
                                title="Eliminar grupo"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* COLLAPSED SUMMARY */}
                          {isCollapsed && (
                            <div
                              onClick={() => handleToggleGroupCollapse(grp.key)}
                              className="pt-2 text-[10px] text-slate-400 cursor-pointer hover:text-slate-200 transition-colors flex items-center justify-between"
                            >
                              <span className="truncate max-w-xl font-medium">
                                Variaciones ({grp.choices.length}): {grp.choices.map((c) => c.name).join(', ')}
                              </span>
                              <span className="text-[9px] text-amber-500 font-bold uppercase shrink-0">Haz clic para desplegar y editar</span>
                            </div>
                          )}

                          {/* EXPANDED CHOICES LIST */}
                          {!isCollapsed && (
                            <div className="space-y-3 pt-2">
                            {grp.choices.map((choice) => (
                              <div 
                                key={choice.id} 
                                className={`p-3 rounded-xl border space-y-3 transition-colors ${
                                  isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-gray-200'
                                }`}
                              >
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                                  {/* VARIATION NAME */}
                                  <div className="sm:col-span-3">
                                    <label className="text-[9px] font-extrabold uppercase text-slate-400 block mb-0.5">Variación *</label>
                                    <input
                                      type="text"
                                      value={choice.name}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setEditingGroups(
                                          editingGroups.map((g) => {
                                            if (g.key !== grp.key) return g;
                                            return {
                                              ...g,
                                              choices: g.choices.map((c) => (c.id === choice.id ? { ...c, name: val } : c)),
                                            };
                                          })
                                        );
                                      }}
                                      placeholder="Ej: Orejas Conejo"
                                      className={inputClass}
                                    />
                                  </div>

                                  {/* PRICE RECARGO */}
                                  <div className="sm:col-span-2">
                                    <label className="text-[9px] font-extrabold uppercase text-slate-400 block mb-0.5">Recargo ($ ARS)</label>
                                    <input
                                      type="number"
                                      value={choice.priceDelta || ''}
                                      onChange={(e) => {
                                        const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                        setEditingGroups(
                                          editingGroups.map((g) => {
                                            if (g.key !== grp.key) return g;
                                            return {
                                              ...g,
                                              choices: g.choices.map((c) => (c.id === choice.id ? { ...c, priceDelta: val } : c)),
                                            };
                                          })
                                        );
                                      }}
                                      placeholder="0"
                                      className={inputClass}
                                    />
                                  </div>

                                  {/* COLOR SWATCH */}
                                  <div className="sm:col-span-2">
                                    <label className="text-[9px] font-extrabold uppercase text-slate-400 block mb-0.5">Color / Swatch</label>
                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="color"
                                        value={choice.colorSwatch || '#18181B'}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setEditingGroups(
                                            editingGroups.map((g) => {
                                              if (g.key !== grp.key) return g;
                                              return {
                                                ...g,
                                                choices: g.choices.map((c) => (c.id === choice.id ? { ...c, colorSwatch: val } : c)),
                                              };
                                            })
                                          );
                                        }}
                                        className="w-7 h-7 p-0 bg-transparent cursor-pointer rounded shrink-0 border border-slate-700 shadow-sm"
                                        title="Seleccionar color"
                                      />
                                      <input
                                        type="text"
                                        value={choice.colorSwatch || '#18181B'}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setEditingGroups(
                                            editingGroups.map((g) => {
                                              if (g.key !== grp.key) return g;
                                              return {
                                                ...g,
                                                choices: g.choices.map((c) => (c.id === choice.id ? { ...c, colorSwatch: val } : c)),
                                              };
                                            })
                                          );
                                        }}
                                        placeholder="#18181B"
                                        className={`w-20 text-[10px] font-mono uppercase ${inputClass}`}
                                      />
                                    </div>
                                  </div>

                                  {/* VARIATION IMAGE / PLANTILLA */}
                                  <div className="sm:col-span-4">
                                    <label className="text-[9px] font-extrabold uppercase text-slate-400 mb-0.5 flex items-center gap-1">
                                      <ImageIcon className="w-3 h-3 text-amber-500" /> Plantilla / Imagen de Variación
                                    </label>
                                    {choice.imageUrl ? (
                                      <div className="flex items-center gap-1.5">
                                        <img 
                                          src={choice.imageUrl} 
                                          alt={choice.name} 
                                          className="w-7 h-7 object-contain bg-white border border-gray-300 rounded shrink-0" 
                                        />
                                        <input
                                          type="text"
                                          value={choice.imageUrl}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            setEditingGroups(
                                              editingGroups.map((g) => {
                                                if (g.key !== grp.key) return g;
                                                return {
                                                  ...g,
                                                  choices: g.choices.map((c) => (c.id === choice.id ? { ...c, imageUrl: val } : c)),
                                                };
                                              })
                                            );
                                          }}
                                          placeholder="URL de imagen..."
                                          className={`flex-1 text-[11px] ${inputClass}`}
                                        />
                                        <label className="p-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded cursor-pointer shrink-0 transition-colors" title="Subir nueva imagen desde equipo">
                                          <Upload className="w-3.5 h-3.5" />
                                          <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file) {
                                                const reader = new FileReader();
                                                reader.onload = (event) => {
                                                  const res = event.target?.result as string;
                                                  if (res) {
                                                    setEditingGroups(
                                                      editingGroups.map((g) => {
                                                        if (g.key !== grp.key) return g;
                                                        return {
                                                          ...g,
                                                          choices: g.choices.map((c) => (c.id === choice.id ? { ...c, imageUrl: res } : c)),
                                                        };
                                                      })
                                                    );
                                                  }
                                                };
                                                reader.readAsDataURL(file);
                                              }
                                            }}
                                          />
                                        </label>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingGroups(
                                              editingGroups.map((g) => {
                                                if (g.key !== grp.key) return g;
                                                return {
                                                  ...g,
                                                  choices: g.choices.map((c) => (c.id === choice.id ? { ...c, imageUrl: undefined } : c)),
                                                };
                                              })
                                            );
                                          }}
                                          className="p-1.5 text-red-400 hover:bg-red-500/10 rounded shrink-0 transition-colors"
                                          title="Quitar imagen"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <label className="px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold uppercase border border-dashed border-amber-500/50 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 flex items-center gap-1.5 transition-colors cursor-pointer">
                                          <Upload className="w-3.5 h-3.5 text-amber-400" /> + Subir Imagen / Plantilla
                                          <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file) {
                                                const reader = new FileReader();
                                                reader.onload = (event) => {
                                                  const res = event.target?.result as string;
                                                  if (res) {
                                                    setEditingGroups(
                                                      editingGroups.map((g) => {
                                                        if (g.key !== grp.key) return g;
                                                        return {
                                                          ...g,
                                                          choices: g.choices.map((c) => (c.id === choice.id ? { ...c, imageUrl: res } : c)),
                                                        };
                                                      })
                                                    );
                                                  }
                                                };
                                                reader.readAsDataURL(file);
                                              }
                                            }}
                                          />
                                        </label>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingGroups(
                                              editingGroups.map((g) => {
                                                if (g.key !== grp.key) return g;
                                                return {
                                                  ...g,
                                                  choices: g.choices.map((c) => (c.id === choice.id ? { ...c, imageUrl: 'https://' } : c)),
                                                };
                                              })
                                            );
                                          }}
                                          className="text-[9px] font-bold text-slate-400 hover:text-slate-200 underline uppercase cursor-pointer"
                                        >
                                          Ingresar URL
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  {/* DELETE BUTTON */}
                                  <div className="sm:col-span-1 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveChoice(grp.key, choice.id)}
                                      className="p-2 text-red-400 hover:bg-red-500/10 rounded cursor-pointer transition-colors"
                                      title="Eliminar variación"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: BASE PRICE & DESCRIPTION */}
              {activeTab === 'info' && (
                <div className="space-y-4 max-w-2xl">
                  <div>
                    <label className="text-xs font-bold uppercase block mb-1">Nombre del Producto Custom *</label>
                    <input
                      type="text"
                      value={editingMeta.name}
                      onChange={(e) => setEditingMeta({ ...editingMeta, name: e.target.value })}
                      placeholder="Ej: COLLARES PERSONALIZADOS"
                      className={inputClass}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase block mb-1">Precio Base ($ ARS) *</label>
                      <input
                        type="number"
                        value={editingMeta.basePrice}
                        onChange={(e) => setEditingMeta({ ...editingMeta, basePrice: parseFloat(e.target.value) || 0 })}
                        placeholder="4200"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase block mb-1">Categoría Asociada</label>
                      <input
                        type="text"
                        disabled
                        value={editingMeta.id}
                        className={`${inputClass} opacity-60 uppercase`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase block mb-1">Descripción para Clientes</label>
                    <textarea
                      rows={3}
                      value={editingMeta.description}
                      onChange={(e) => setEditingMeta({ ...editingMeta, description: e.target.value })}
                      placeholder="Descripción detallada de la personalización..."
                      className={`${inputClass} resize-none`}
                    />
                  </div>
                </div>
              )}

              {/* FOOTER ACTIONS */}
              <div className={`px-6 py-4 flex items-center justify-end gap-3 border-t -mx-6 -mb-6 mt-6 shrink-0 ${
                isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-gray-200 bg-gray-50/50'
              }`}>
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                    isDarkMode 
                      ? 'border-slate-800 text-slate-300 hover:bg-slate-900' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-100 bg-white'
                  }`}
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-lg text-xs font-bold text-white transition-colors cursor-pointer flex items-center gap-2 ${
                    isDarkMode ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-gray-900 hover:bg-gray-800'
                  }`}
                >
                  <Save className="w-4 h-4" /> GUARDAR Y UNIFICAR CON CLIENTE
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
