import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  SlidersHorizontal, 
  Grid, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Camera, 
  Upload, 
  Check
} from 'lucide-react';
import type { Product, ProductVariationGroup, ProductVariationOption, CategoryItem } from '../../types/types';
import { ValidationModal } from '../ui/ValidationModal';
import { 
  getDefaultVariationsForCategory, 
  getOptionLabel, 
  getOptionPriceDelta, 
  getCombinationKey, 
  getAllCombinations, 
  calculateTotalProductStock,
  formatKeyToCleanLabel
} from '../../types/types';

interface ProductVariationsMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProduct: Product) => void;
  product: Product | null;
  categories?: CategoryItem[];
  isDarkMode?: boolean;
}

export const ProductVariationsMatrixModal: React.FC<ProductVariationsMatrixModalProps> = ({
  isOpen,
  onClose,
  onSave,
  product,
  categories,
  isDarkMode = false,
}) => {
  const [subTab, setSubTab] = useState<'groups' | 'matrix'>('groups');
  const [variations, setVariations] = useState<ProductVariationGroup[]>([]);
  const [variantStocks, setVariantStocks] = useState<Record<string, number>>({});
  const [variantImages, setVariantImages] = useState<Record<string, string>>({});
  const [activePickingComboKey, setActivePickingComboKey] = useState<string | null>(null);
  const [customVariantUrl, setCustomVariantUrl] = useState<string>('');
  const [bulkStockVal, setBulkStockVal] = useState<number | ''>('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newOptInputs, setNewOptInputs] = useState<Record<number, { label: string; delta: number | '' }>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      const initialVars = (product.variations !== undefined)
        ? JSON.parse(JSON.stringify(product.variations))
        : (product.isUnique ? [] : getDefaultVariationsForCategory(product.category, categories));

      // Sanitize: options should never retain individual stock, only label and priceDelta
      const sanitizedVars: ProductVariationGroup[] = initialVars.map((g: ProductVariationGroup) => ({
        name: g.name,
        options: g.options.map((opt: string | ProductVariationOption) => {
          if (typeof opt === 'string') return opt;
          const { label, priceDelta } = opt;
          return priceDelta !== undefined && priceDelta > 0 ? { label, priceDelta } : label;
        }),
      }));

      setVariations(sanitizedVars);
      setVariantStocks(product.variantStocks ? { ...product.variantStocks } : {});
      setVariantImages(product.variantImages ? { ...product.variantImages } : {});
      setActivePickingComboKey(null);
      setCustomVariantUrl('');
      setSubTab('groups');
      setErrorMessage(null);
    }
  }, [product, isOpen, categories]);

  if (!isOpen || !product || product.isUnique) return null;

  const handleResetToCategoryDefaults = () => {
    const defs = getDefaultVariationsForCategory(product.category, categories);
    const cleanDefs = defs.map((g) => ({
      name: g.name,
      options: g.options.map((opt) => getOptionLabel(opt)),
    }));
    setVariations(cleanDefs);
    setVariantStocks({});
  };

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    const nameUpper = newGroupName.trim().toUpperCase();
    if (variations.some((v) => v.name.toUpperCase() === nameUpper)) {
      setErrorMessage(`El grupo "${nameUpper}" ya existe.`);
      return;
    }
    setVariations((prev) => [...prev, { name: nameUpper, options: ['Opción 1'] }]);
    setNewGroupName('');
    setErrorMessage(null);
  };

  const handleRemoveGroup = (idx: number) => {
    setVariations((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddOptionToGroup = (groupIdx: number) => {
    const input = newOptInputs[groupIdx];
    if (!input || !input.label.trim()) return;
    const labelClean = input.label.trim();

    setVariations((prev) => {
      const copy = [...prev];
      const targetGroup = { ...copy[groupIdx] };
      const currentOpts = [...targetGroup.options];

      const exists = currentOpts.some((opt) => getOptionLabel(opt).toUpperCase() === labelClean.toUpperCase());
      if (exists) {
        setErrorMessage(`La opción "${labelClean}" ya existe en este grupo.`);
        return prev;
      }

      if (input.delta !== '' && Number(input.delta) > 0) {
        currentOpts.push({
          label: labelClean,
          priceDelta: Number(input.delta),
        });
      } else {
        currentOpts.push(labelClean);
      }

      targetGroup.options = currentOpts;
      copy[groupIdx] = targetGroup;
      return copy;
    });

    setNewOptInputs((prev) => ({
      ...prev,
      [groupIdx]: { label: '', delta: '' },
    }));
    setErrorMessage(null);
  };

  const handleRemoveOptionFromGroup = (groupIdx: number, optIdx: number) => {
    setVariations((prev) => {
      const copy = [...prev];
      const targetGroup = { ...copy[groupIdx] };
      targetGroup.options = targetGroup.options.filter((_, i) => i !== optIdx);
      copy[groupIdx] = targetGroup;
      return copy;
    });
  };

  const handleGenerateMatrix = () => {
    const tempProd: Product = {
      ...product,
      variations,
    };
    const allCombos = getAllCombinations(tempProd);
    const newMatrix: Record<string, number> = {};
    const defaultVal = Number(product.stock) || 10;
    allCombos.forEach((combo) => {
      const key = getCombinationKey(combo);
      newMatrix[key] = variantStocks[key] !== undefined ? variantStocks[key] : defaultVal;
    });
    setVariantStocks(newMatrix);
    setSubTab('matrix');
  };

  const handleApplyBulkStock = () => {
    if (bulkStockVal === '') return;
    const targetVal = Number(bulkStockVal) < 0 ? 0 : Number(bulkStockVal);
    const updated: Record<string, number> = {};
    Object.keys(variantStocks).forEach((k) => {
      updated[k] = targetVal;
    });
    setVariantStocks(updated);
  };

  const handleUpdateCombinationStock = (key: string, newStk: number) => {
    setVariantStocks((prev) => ({
      ...prev,
      [key]: Math.max(0, newStk),
    }));
  };

  const handleRemoveCombinationKey = (key: string) => {
    setVariantStocks((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
    setVariantImages((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const handleAssignImageToVariant = (comboKey: string, imgUrl: string) => {
    setVariantImages((prev) => ({
      ...prev,
      [comboKey]: imgUrl,
    }));
    setActivePickingComboKey(null);
    setCustomVariantUrl('');
  };

  const handleRemoveVariantImage = (comboKey: string) => {
    setVariantImages((prev) => {
      const copy = { ...prev };
      delete copy[comboKey];
      return copy;
    });
    setActivePickingComboKey(null);
    setCustomVariantUrl('');
  };

  const handleVariantFileUpload = (e: React.ChangeEvent<HTMLInputElement>, comboKey: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleAssignImageToVariant(comboKey, reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveMatrix = () => {
    if (!product) return;
    const sanitizedVariations: ProductVariationGroup[] = variations.map((g) => ({
      name: g.name,
      options: g.options.map((opt) => {
        if (typeof opt === 'string') return opt;
        const { label, priceDelta } = opt;
        return priceDelta !== undefined && priceDelta > 0 ? { label, priceDelta } : label;
      }),
    }));

    const tempProd: Product = {
      ...product,
      variations: sanitizedVariations,
      variantStocks,
    };
    const allCombos = getAllCombinations(tempProd);
    const finalVariantStocks: Record<string, number> = {};
    const defaultVal = Number(product.stock) || 10;
    allCombos.forEach((combo) => {
      const key = getCombinationKey(combo);
      finalVariantStocks[key] = variantStocks[key] !== undefined ? variantStocks[key] : defaultVal;
    });

    const prodWithFinalMatrix: Product = {
      ...tempProd,
      variantStocks: finalVariantStocks,
    };
    const calculatedTotalStock = calculateTotalProductStock(prodWithFinalMatrix);
    onSave({
      ...prodWithFinalMatrix,
      variantImages: Object.keys(variantImages).length > 0 ? variantImages : undefined,
      hasVariations: sanitizedVariations.length > 0,
      stock: calculatedTotalStock,
    });
    onClose();
  };

  const combinationsList = getAllCombinations({ ...product, variations });

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in font-sans ${
        isDarkMode ? 'bg-black/80' : 'bg-black/60 backdrop-blur-xs'
      }`}
      onClick={onClose}
    >
      <div
        className={`max-w-4xl w-full mx-auto rounded-2xl border shadow-2xl overflow-hidden font-sans transition-colors flex flex-col max-h-[90vh] my-auto ${
          isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-gray-200 text-gray-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP EDITOR NAVIGATION HEADER */}
        <div className={`px-6 py-4 flex items-center justify-between border-b shrink-0 ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${
              isDarkMode ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-white text-gray-900 border-gray-200 shadow-2xs'
            }`}>
              <SlidersHorizontal className="w-5 h-5 text-gray-700 dark:text-slate-300" />
            </div>
            <div>
              <h2 className={`text-base font-bold uppercase tracking-wide ${
                isDarkMode ? 'text-slate-100' : 'text-gray-900'
              }`}>
                Configurar Variaciones y Matriz de Stock
              </h2>
              <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                Producto: {product.name} ({product.category}) • Buttoncat Studio Admin
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDarkMode ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-200'
            }`}
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SUB-TABS NAVIGATION BAR */}
        <div className={`flex border-b px-6 pt-2.5 items-center justify-between gap-2 shrink-0 ${
          isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-gray-200 bg-gray-50/50'
        }`}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSubTab('groups')}
              className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                subTab === 'groups'
                  ? (isDarkMode ? 'border-slate-100 text-slate-100' : 'border-gray-900 text-gray-900')
                  : (isDarkMode ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-gray-500 hover:text-gray-900')
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" /> 1. Grupos y Opciones ({variations.length})
            </button>
            <button
              type="button"
              onClick={handleGenerateMatrix}
              className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                subTab === 'matrix'
                  ? (isDarkMode ? 'border-slate-100 text-slate-100' : 'border-gray-900 text-gray-900')
                  : (isDarkMode ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-gray-500 hover:text-gray-900')
              }`}
            >
              <Grid className="w-3.5 h-3.5" /> 2. Matriz de Stock ({combinationsList.length})
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetToCategoryDefaults}
            className={`mb-2 px-3 py-1.5 rounded-lg border text-[11px] font-semibold uppercase flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              isDarkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800 bg-slate-900' : 'border-gray-300 text-gray-700 hover:bg-gray-100 bg-white'
            }`}
            title="Restablecer a las variaciones recomendadas por categoría"
          >
            <RefreshCw className="w-3 h-3" /> Predeterminados de {product.category}
          </button>
        </div>

        {/* BODY CONTENT */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 font-sans">
          {/* SUB-TAB 1: GRUPOS Y OPCIONES */}
          {subTab === 'groups' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* CREAR NUEVO GRUPO */}
              <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-stretch sm:items-center gap-2 ${
                isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-gray-50 border-gray-200'
              }`}>
                <input
                  id="matrix-new-group-name"
                  name="newGroupName"
                  aria-label="Nuevo grupo de atributos"
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Nuevo grupo de atributos (ej: COLOR, TALLE, LARGO)..."
                  className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-bold uppercase border focus:outline-none ${
                    isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-gray-300 text-gray-900 shadow-2xs'
                  }`}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddGroup())}
                />
                <button
                  type="button"
                  onClick={handleAddGroup}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
                    isDarkMode ? 'bg-purple-600 hover:bg-purple-500' : 'bg-gray-900 hover:bg-black'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 stroke-3" /> AGREGAR GRUPO
                </button>
              </div>

              {/* LISTA DE GRUPOS */}
              {variations.length === 0 ? (
                <div className={`p-8 text-center border border-dashed rounded-xl ${
                  isDarkMode ? 'border-slate-800 text-slate-500' : 'border-gray-300 text-gray-500'
                }`}>
                  <p className="text-xs font-bold uppercase">No hay grupos de variaciones definidos.</p>
                  <p className="text-[11px] font-medium mt-1">Agrega un grupo arriba o usa el botón de predeterminados.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {variations.map((group, groupIdx) => {
                    const optInput = newOptInputs[groupIdx] || { label: '', delta: '' };

                    return (
                      <div
                        key={groupIdx}
                        className={`p-4 rounded-xl border space-y-3 shadow-2xs ${
                          isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-gray-200'
                        }`}
                      >
                        {/* GROUP HEADER */}
                        <div className="flex items-center justify-between border-b pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded bg-brand-purple text-white font-mono font-black text-[11px] flex items-center justify-center">
                              {groupIdx + 1}
                            </span>
                            <span className={`font-black text-xs uppercase tracking-wide ${
                              isDarkMode ? 'text-slate-100' : 'text-gray-900'
                            }`}>
                              {group.name}
                            </span>
                            <span className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                              ({group.options.length} opciones)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveGroup(groupIdx)}
                            className="text-red-500 hover:text-red-700 text-xs font-bold uppercase flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> ELIMINAR GRUPO
                          </button>
                        </div>

                        {/* EXISTING OPTIONS BADGES */}
                        <div className="flex flex-wrap gap-2">
                          {group.options.map((opt, optIdx) => {
                            const lbl = getOptionLabel(opt);
                            const delta = getOptionPriceDelta(opt);

                            return (
                              <div
                                key={optIdx}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-2 ${
                                  isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-gray-50 border-gray-300 text-gray-800'
                                }`}
                              >
                                <span>{lbl}</span>
                                {delta > 0 && (
                                  <span className="text-pink-600 dark:text-pink-400 font-mono text-[10px]">(+${delta})</span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveOptionFromGroup(groupIdx, optIdx)}
                                  className="text-gray-400 hover:text-red-500 transition-colors ml-1 cursor-pointer"
                                  title="Eliminar opción"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        {/* INPUT FOR NEW OPTION IN THIS GROUP */}
                        <div className={`p-2.5 rounded-lg border grid grid-cols-1 sm:grid-cols-12 gap-2 items-center ${
                          isDarkMode ? 'bg-slate-950/60 border-slate-800/80' : 'bg-gray-50/80 border-gray-200'
                        }`}>
                          <input
                            id={`matrix-opt-label-${groupIdx}`}
                            name={`optLabel_${groupIdx}`}
                            aria-label={`Nombre de opción para el grupo ${group.name}`}
                            type="text"
                            placeholder="Nombre opción (ej: XL, Plata 925)..."
                            value={optInput.label}
                            onChange={(e) =>
                              setNewOptInputs((prev) => ({
                                ...prev,
                                [groupIdx]: { ...optInput, label: e.target.value },
                              }))
                            }
                            className={`sm:col-span-7 rounded px-2.5 py-1 text-xs font-bold border focus:outline-none ${
                              isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-gray-300 text-gray-900'
                            }`}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddOptionToGroup(groupIdx))}
                          />
                          <input
                            id={`matrix-opt-delta-${groupIdx}`}
                            name={`optDelta_${groupIdx}`}
                            aria-label={`Precio Delta opcional para el grupo ${group.name}`}
                            type="number"
                            placeholder="+ Precio Delta ($ opcional)"
                            value={optInput.delta}
                            onChange={(e) =>
                              setNewOptInputs((prev) => ({
                                ...prev,
                                [groupIdx]: { ...optInput, delta: e.target.value === '' ? '' : Number(e.target.value) },
                              }))
                            }
                            className={`sm:col-span-3 rounded px-2 py-1 text-xs font-semibold border focus:outline-none ${
                              isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => handleAddOptionToGroup(groupIdx)}
                            className={`sm:col-span-2 py-1 rounded text-xs font-black uppercase text-white transition-all flex items-center justify-center gap-1 cursor-pointer ${
                              isDarkMode ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-gray-900 hover:bg-black'
                            }`}
                          >
                            <Plus className="w-3.5 h-3.5" /> OPCIÓN
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleGenerateMatrix}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    isDarkMode ? 'bg-slate-100 text-slate-900 hover:bg-white' : 'bg-gray-900 text-white hover:bg-black'
                  }`}
                >
                  Continuar a Matriz de Stock <Grid className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* SUB-TAB 2: MATRIZ DE STOCK POR COMBINACIÓN */}
          {subTab === 'matrix' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* BULK STOCK SETTER */}
              <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 ${
                isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold uppercase ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    Stock masivo para todas las combinaciones:
                  </span>
                  <input
                    id="matrix-bulk-stock"
                    name="bulkStockVal"
                    aria-label="Stock masivo para todas las combinaciones"
                    type="number"
                    value={bulkStockVal}
                    onChange={(e) => setBulkStockVal(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Ej: 15"
                    className={`w-24 rounded px-2.5 py-1 text-xs font-bold border focus:outline-none ${
                      isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleApplyBulkStock}
                    className={`px-3 py-1 rounded text-xs font-black uppercase text-white transition-all cursor-pointer ${
                      isDarkMode ? 'bg-purple-600 hover:bg-purple-500' : 'bg-gray-900 hover:bg-black'
                    }`}
                  >
                    APLICAR A TODAS
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateMatrix}
                  className={`text-[10px] font-black uppercase px-2.5 py-1 rounded border transition-colors cursor-pointer flex items-center gap-1 ${
                    isDarkMode ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-gray-300 text-gray-700 hover:bg-white'
                  }`}
                >
                  <RefreshCw className="w-3 h-3" /> Regenerar Matriz
                </button>
              </div>

              {/* COMBINATIONS TABLE / GRID (ESTILO TIENDANUBE CON FOTO POR VARIANTE) */}
              {combinationsList.length === 0 ? (
                <div className={`p-8 text-center border border-dashed rounded-xl ${
                  isDarkMode ? 'border-slate-800 text-slate-500' : 'border-gray-300 text-gray-500'
                }`}>
                  <p className="text-xs font-bold uppercase">No hay combinaciones generadas.</p>
                  <p className="text-[11px] font-medium mt-1">Primero define grupos y opciones en el paso 1.</p>
                </div>
              ) : (
                <div className={`border rounded-xl overflow-hidden shadow-2xs ${
                  isDarkMode ? 'border-slate-800 bg-slate-950' : 'border-gray-200 bg-white'
                }`}>
                  <div className="max-h-80 overflow-y-auto">
                    <table className="w-full text-left text-xs font-medium border-collapse">
                      <thead className={`uppercase text-[10px] font-black sticky top-0 border-b ${
                        isDarkMode ? 'bg-slate-900 text-slate-400 border-slate-800' : 'bg-gray-100 text-gray-700 border-gray-200'
                      }`}>
                        <tr>
                          <th className="p-3">Variante</th>
                          <th className="p-3 text-center w-36">Stock</th>
                          <th className="p-3 text-right w-20">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800/80' : 'divide-gray-200'}`}>
                        {combinationsList.map((combo) => {
                          const key = getCombinationKey(combo);
                          const cleanLabel = formatKeyToCleanLabel(key);
                          const currentStk = variantStocks[key] !== undefined ? variantStocks[key] : (Number(product.stock) || 10);
                          const isOut = currentStk === 0;
                          const hasPhoto = Boolean(variantImages[key]);

                          return (
                            <tr key={key} className={`transition-colors ${isDarkMode ? 'hover:bg-slate-900/40' : 'hover:bg-blue-50/30'}`}>
                              {/* VARIANTE (FOTO DASHED + NOMBRE ESTILO TIENDANUBE) */}
                              <td className="p-3">
                                <div className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() => setActivePickingComboKey(key)}
                                    className={`w-12 h-12 rounded-xl border-2 border-dashed flex items-center justify-center transition-all cursor-pointer overflow-hidden shrink-0 group relative ${
                                      hasPhoto
                                        ? 'border-blue-500 bg-white shadow-2xs'
                                        : isDarkMode
                                          ? 'border-blue-400/60 bg-blue-950/20 hover:bg-blue-950/40 text-blue-400'
                                          : 'border-blue-400 bg-blue-50/70 hover:bg-blue-100 text-blue-600'
                                    }`}
                                    title={hasPhoto ? 'Cambiar foto de la variante' : 'Asociar foto a esta variante (Estilo Tiendanube)'}
                                  >
                                    {hasPhoto ? (
                                      <>
                                        <img
                                          src={variantImages[key]}
                                          alt={cleanLabel}
                                          className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                          <Camera className="w-4 h-4 text-white" />
                                        </div>
                                      </>
                                    ) : (
                                      <Camera className="w-5 h-5 stroke-[1.8]" />
                                    )}
                                  </button>

                                  <div>
                                    <span className={`text-xs sm:text-sm font-bold block ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                                      {cleanLabel}
                                    </span>
                                    <span className={`text-[10px] font-mono block ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                      {key}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* STOCK */}
                              <td className="p-3 text-center">
                                <div className="inline-flex items-center justify-center gap-2">
                                  <input
                                    id={`matrix-combo-stock-${key}`}
                                    name={`comboStock_${key}`}
                                    aria-label={`Stock para combinación ${key}`}
                                    type="number"
                                    min="0"
                                    value={currentStk}
                                    onChange={(e) => handleUpdateCombinationStock(key, Number(e.target.value))}
                                    className={`w-20 rounded-lg px-2.5 py-1.5 text-xs font-bold text-center border focus:outline-none transition-colors ${
                                      isOut
                                        ? (isDarkMode ? 'bg-red-950/60 border-red-800 text-red-300' : 'bg-red-50 border-red-300 text-red-700')
                                        : (isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-gray-300 text-gray-900')
                                    }`}
                                  />
                                  <span className={`text-[10px] font-bold ${isOut ? 'text-red-500' : 'text-gray-400'}`}>
                                    {isOut ? 'AGOTADO' : 'un.'}
                                  </span>
                                </div>
                              </td>

                              {/* ACCIONES */}
                              <td className="p-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCombinationKey(key)}
                                  className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                                  title="Quitar esta combinación específica"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div
          className={`px-6 py-4 flex items-center justify-between border-t shrink-0 ${
            isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-gray-200 bg-gray-50/50'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              isDarkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800 bg-slate-900' : 'border-gray-300 text-gray-700 hover:bg-gray-100 bg-white'
            }`}
          >
            Cancelar
          </button>

          <div className="flex items-center gap-3">
            {subTab === 'groups' && (
              <button
                type="button"
                onClick={handleGenerateMatrix}
                className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  isDarkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800 bg-slate-900' : 'border-gray-300 text-gray-700 hover:bg-gray-100 bg-white'
                }`}
              >
                Continuar a Matriz <Grid className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={handleSaveMatrix}
              className={`px-5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
                isDarkMode ? 'bg-slate-100 text-slate-900 hover:bg-white' : 'bg-gray-900 text-white hover:bg-black'
              }`}
            >
              <Save className="w-4 h-4" /> Guardar Variaciones y Matriz
            </button>
          </div>
        </div>
      </div>

      {/* MODAL PARA ASOCIAR FOTO A VARIANTE (ESTILO TIENDANUBE) */}
      {activePickingComboKey && (
        <div
          className={`fixed inset-0 z-60 flex items-center justify-center p-3 animate-in fade-in ${
            isDarkMode ? 'bg-black/80' : 'bg-black/60 backdrop-blur-xs'
          }`}
          onClick={() => setActivePickingComboKey(null)}
        >
          <div
            className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-4 ${
              isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-gray-200 text-gray-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between border-b pb-3 ${
              isDarkMode ? 'border-slate-800' : 'border-gray-200'
            }`}>
              <div>
                <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 tracking-wider block">
                  Asociar Foto a Variante
                </span>
                <h3 className={`text-sm font-bold uppercase ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                  {formatKeyToCleanLabel(activePickingComboKey)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActivePickingComboKey(null)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isDarkMode ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* FOTO ACTUAL SI ESTÁ ASOCIADA */}
            {variantImages[activePickingComboKey] && (
              <div className="flex items-center gap-3 p-3 bg-blue-50/80 border-2 border-blue-400 rounded-xl">
                <img
                  src={variantImages[activePickingComboKey]}
                  alt="Foto actual"
                  className="w-14 h-14 object-cover rounded-lg border-2 border-black"
                />
                <div className="flex-1">
                  <span className="text-xs font-bold text-blue-950 block">Foto asociada a esta variante</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveVariantImage(activePickingComboKey)}
                    className="text-[11px] font-black uppercase text-red-600 hover:underline cursor-pointer mt-1 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Desvincular imagen
                  </button>
                </div>
              </div>
            )}

            {/* OPCIÓN 1: SUBIR ARCHIVO */}
            <div className="space-y-2">
              <span className="text-xs font-black uppercase text-black block">
                1. SUBIR ARCHIVO DESDE TU EQUIPO
              </span>
              <input
                type="file"
                id="variantImageFileInput"
                name="variantImageFileInput"
                aria-label="Subir foto para esta variante"
                accept="image/*"
                onChange={(e) => handleVariantFileUpload(e, activePickingComboKey)}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => document.getElementById('variantImageFileInput')?.click()}
                className="w-full py-2.5 px-4 bg-brand-yellow hover:bg-yellow-300 text-black border-2 border-black font-black text-xs uppercase shadow-brutal-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4 stroke-[2.5]" /> SUBIR FOTO PARA ESTA VARIANTE
              </button>
            </div>

            {/* OPCIÓN 2: SELECCIONAR DE LA GALERÍA DEL PRODUCTO */}
            {(() => {
              const productGallery = product.images && product.images.length > 0 
                ? product.images 
                : (product.image ? [product.image] : []);
              if (productGallery.length === 0) return null;
              return (
                <div className="space-y-2 pt-2 border-t-2 border-black">
                  <span className="text-xs font-black uppercase text-black block">
                    2. O ELEGIR DE LA GALERÍA DEL PRODUCTO ({productGallery.length})
                  </span>
                  <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1">
                    {productGallery.map((imgUrl, i) => {
                      const isChosen = variantImages[activePickingComboKey] === imgUrl;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleAssignImageToVariant(activePickingComboKey, imgUrl)}
                          className={`relative aspect-square rounded-lg border-2 overflow-hidden transition-all cursor-pointer group ${
                            isChosen ? 'border-brand-purple ring-3 ring-brand-purple scale-95' : 'border-black hover:opacity-80'
                          }`}
                        >
                          <img src={imgUrl} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                          {isChosen && (
                            <div className="absolute inset-0 bg-brand-purple/50 flex items-center justify-center">
                              <Check className="w-5 h-5 text-white stroke-3" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* OPCIÓN 3: PEGAR URL */}
            <div className="space-y-2 pt-2 border-t-2 border-black">
              <span className="text-xs font-black uppercase text-black block">
                3. O PEGAR URL DE IMAGEN
              </span>
              <div className="flex gap-2">
                <input
                  id="matrix-custom-variant-url"
                  name="customVariantUrl"
                  aria-label="Pegar URL de imagen para la variante"
                  type="url"
                  value={customVariantUrl}
                  onChange={(e) => setCustomVariantUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 border-2 border-black p-2 text-xs font-bold text-black focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customVariantUrl.trim()) {
                      handleAssignImageToVariant(activePickingComboKey, customVariantUrl.trim());
                    }
                  }}
                  className="px-3 py-2 bg-black text-white hover:bg-brand-pink font-black text-xs uppercase border-2 border-black cursor-pointer"
                >
                  VINCULAR
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActivePickingComboKey(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-black border border-black font-black text-xs uppercase cursor-pointer"
              >
                CERRAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VALIDATION NOTICE MODAL */}
      <ValidationModal
        isOpen={!!errorMessage}
        title="AVISO DE VARIACIÓN"
        message={errorMessage || ''}
        onClose={() => setErrorMessage(null)}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};
